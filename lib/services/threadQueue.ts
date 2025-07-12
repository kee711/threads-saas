/**
 * Thread Chain 처리를 위한 큐 시스템
 * Vercel 1분 timeout 제한을 회피하기 위한 비동기 처리
 */

import { createClient } from '@/lib/supabase/server';
import { getCurrentUTCISO } from '@/lib/utils/time';

export interface QueuedThread {
  id: string;
  parentMediaId: string;
  threadSequence: number;
  content: string;
  mediaUrls: string[];
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  socialId: string;
  accessToken: string;
  userId: string;
  replyToId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export class ThreadQueue {
  private static instance: ThreadQueue;
  private processing = false;
  private queue: QueuedThread[] = [];
  private readonly MAX_CONCURRENT = 3; // 최대 동시 처리 개수

  static getInstance(): ThreadQueue {
    if (!ThreadQueue.instance) {
      ThreadQueue.instance = new ThreadQueue();
    }
    return ThreadQueue.instance;
  }

  /**
   * 스레드 체인을 큐에 추가
   */
  async enqueueThreadChain(
    parentMediaId: string,
    threads: Array<{
      content: string;
      mediaUrls: string[];
      mediaType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL';
    }>,
    socialId: string,
    accessToken: string,
    userId: string,
    firstThreadId?: string
  ): Promise<void> {
    console.log(`📥 [threadQueue.ts:enqueueThreadChain:44] Starting thread chain enqueue`);
    console.log(`📥 [threadQueue.ts:enqueueThreadChain:45] Input params:`, {
      parentMediaId,
      threadsCount: threads.length,
      socialId,
      userId,
      firstThreadId,
      hasAccessToken: !!accessToken
    });

    const supabase = await createClient();
    const currentTime = getCurrentUTCISO();
    console.log(`📥 [threadQueue.ts:enqueueThreadChain:56] Supabase client created, currentTime: ${currentTime}`);

    console.log(`🔄 [QUEUE] Enqueueing thread chain [${parentMediaId}] with ${threads.length} items`);

    // 큐 아이템들을 생성
    console.log(`📥 [threadQueue.ts:enqueueThreadChain:61] Building queue items`);
    const queueItems: QueuedThread[] = threads.map((thread, index) => {
      const item = {
        id: `${parentMediaId}_${index}`,
        parentMediaId,
        threadSequence: index,
        content: thread.content,
        mediaUrls: thread.mediaUrls || [],
        mediaType: thread.mediaType || 'TEXT',
        socialId,
        accessToken,
        userId,
        replyToId: index === 0 ? undefined : (firstThreadId || parentMediaId),
        status: index === 0 ? 'completed' : 'pending', // 첫 번째는 이미 완료됨
        createdAt: currentTime,
        retryCount: 0,
        maxRetries: 3
      };
      console.log(`📥 [threadQueue.ts:enqueueThreadChain:77] Queue item ${index}:`, {
        id: item.id,
        sequence: item.threadSequence,
        status: item.status,
        mediaType: item.mediaType,
        mediaUrlsCount: item.mediaUrls.length,
        contentLength: item.content.length
      });
      return item;
    });

    // 데이터베이스에 큐 저장
    console.log(`📥 [threadQueue.ts:enqueueThreadChain:88] Inserting ${queueItems.length} items to database`);
    const { error } = await supabase
      .from('thread_queue')
      .insert(queueItems.map(item => ({
        queue_id: item.id,
        parent_media_id: item.parentMediaId,
        thread_sequence: item.threadSequence,
        content: item.content,
        media_urls: item.mediaUrls,
        media_type: item.mediaType,
        social_id: item.socialId,
        access_token: item.accessToken,
        user_id: item.userId,
        reply_to_id: item.replyToId,
        status: item.status,
        created_at: item.createdAt,
        retry_count: item.retryCount,
        max_retries: item.maxRetries
      })));

    if (error) {
      console.error(`❌ [threadQueue.ts:enqueueThreadChain:108] Database insert failed:`, error);
      console.error('❌ [QUEUE] Failed to enqueue thread chain:', error);
      throw new Error('Failed to enqueue thread chain');
    }

    console.log(`✅ [threadQueue.ts:enqueueThreadChain:113] Database insert successful`);
    console.log(`✅ [QUEUE] Successfully enqueued ${threads.length} items for chain [${parentMediaId}]`);

    // 첫 번째 스레드가 완료되었으므로 큐 처리 시작
    if (firstThreadId) {
      console.log(`📥 [threadQueue.ts:enqueueThreadChain:118] First thread completed, starting queue processing`);
      this.processQueue();
    } else {
      console.log(`📥 [threadQueue.ts:enqueueThreadChain:121] No firstThreadId provided, queue processing not started`);
    }
  }

  /**
   * 큐 처리 시작
   */
  async processQueue(): Promise<void> {
    console.log(`🚀 [threadQueue.ts:processQueue:144] Starting processQueue function`);
    if (this.processing) {
      console.log(`⏳ [threadQueue.ts:processQueue:146] Already processing queue, skipping...`);
      return;
    }

    this.processing = true;
    console.log(`🚀 [threadQueue.ts:processQueue:151] Queue processing state set to true`);

    try {
      console.log(`📥 [threadQueue.ts:processQueue:154] Creating Supabase client`);
      const supabase = await createClient();

      // 대기 중인 항목들을 가져옴
      console.log(`📥 [threadQueue.ts:processQueue:157] Querying pending items from thread_queue`);
      const { data: pendingItems, error } = await supabase
        .from('thread_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(this.MAX_CONCURRENT);

      if (error) {
        console.error(`❌ [threadQueue.ts:processQueue:165] Failed to fetch pending queue items:`, error);
        return;
      }

      console.log(`📥 [threadQueue.ts:processQueue:169] Database query result:`, { 
        foundItems: !!pendingItems, 
        itemCount: pendingItems?.length || 0,
        maxConcurrent: this.MAX_CONCURRENT
      });

      if (!pendingItems || pendingItems.length === 0) {
        console.log(`✅ [threadQueue.ts:processQueue:176] No pending items found`);
        return;
      }

      console.log(`📋 [threadQueue.ts:processQueue:180] Found ${pendingItems.length} pending items to process`);

      // 순차 처리로 변경 (API 제한 방지)
      console.log(`🔄 [threadQueue.ts:processQueue:182] Starting sequential processing of items`);
      const results = [];
      for (const item of pendingItems) {
        const itemIndex = pendingItems.indexOf(item);
        console.log(`🔄 [threadQueue.ts:processQueue:186] Processing item ${itemIndex + 1}/${pendingItems.length}: ${item.queue_id}`);
        try {
          await this.processQueueItem(item);
          results.push({ status: 'fulfilled' });
          console.log(`✅ [threadQueue.ts:processQueue:190] Item ${itemIndex + 1} processed successfully`);
        } catch (error) {
          console.error(`❌ [threadQueue.ts:processQueue:192] Item ${itemIndex + 1} processing failed:`, error);
          results.push({ status: 'rejected', error });
        }

        // 아이템 간 간격 (API 제한 방지)
        if (itemIndex < pendingItems.length - 1) {
          console.log(`⏳ [threadQueue.ts:processQueue:197] Waiting 2 seconds before next item (${itemIndex + 1}/${pendingItems.length})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;

      console.log(`📊 [threadQueue.ts:processQueue:204] Sequential processing completed:`, {
        successCount,
        failureCount,
        totalProcessed: results.length,
        successRate: `${((successCount / results.length) * 100).toFixed(1)}%`
      });

      // 더 처리할 항목이 있는지 확인
      console.log(`🔍 [threadQueue.ts:processQueue:212] Checking for remaining pending items`);
      const { data: remainingItems } = await supabase
        .from('thread_queue')
        .select('queue_id')
        .eq('status', 'pending')
        .limit(1);

      console.log(`🔍 [threadQueue.ts:processQueue:218] Remaining items check result:`, {
        hasRemainingItems: !!remainingItems && remainingItems.length > 0,
        remainingCount: remainingItems?.length || 0
      });

      if (remainingItems && remainingItems.length > 0) {
        console.log(`🔄 [threadQueue.ts:processQueue:224] More items found, scheduling next batch in 2 seconds...`);
        setTimeout(() => this.processQueue(), 2000);
      } else {
        console.log(`✅ [threadQueue.ts:processQueue:227] All items processed successfully`);
      }
    } finally {
      console.log(`🏁 [threadQueue.ts:processQueue:230] Setting processing state to false`);
      this.processing = false;
    }
  }

  /**
   * 개별 큐 항목 처리
   */
  private async processQueueItem(item: any): Promise<void> {
    console.log(`🔄 [threadQueue.ts:processQueueItem:219] Starting processQueueItem for item: ${item.queue_id}`);
    console.log(`🔄 [threadQueue.ts:processQueueItem:220] Creating Supabase client`);
    const supabase = await createClient();
    
    console.log(`🔄 [threadQueue.ts:processQueueItem:223] Converting database item to QueuedThread object`);
    const queueItem: QueuedThread = {
      id: item.queue_id,
      parentMediaId: item.parent_media_id,
      threadSequence: item.thread_sequence,
      content: item.content,
      mediaUrls: item.media_urls || [],
      mediaType: item.media_type,
      socialId: item.social_id,
      accessToken: item.access_token,
      userId: item.user_id,
      replyToId: item.reply_to_id,
      status: item.status,
      createdAt: item.created_at,
      retryCount: item.retry_count,
      maxRetries: item.max_retries
    };

    console.log(`🔄 [threadQueue.ts:processQueueItem:238] Processing item details:`, {
      id: queueItem.id,
      sequence: queueItem.threadSequence,
      mediaType: queueItem.mediaType,
      mediaUrlsCount: queueItem.mediaUrls.length,
      contentLength: queueItem.content.length,
      hasReplyToId: !!queueItem.replyToId,
      retryCount: queueItem.retryCount,
      maxRetries: queueItem.maxRetries
    });

    try {
      // 상태를 processing으로 변경
      console.log(`📝 [threadQueue.ts:processQueueItem:250] Updating item status to 'processing'`);
      await supabase
        .from('thread_queue')
        .update({ status: 'processing' })
        .eq('queue_id', queueItem.id);
      console.log(`📝 [threadQueue.ts:processQueueItem:255] Status update completed`);

      // 스레드 게시 처리
      console.log(`🚀 [threadQueue.ts:processQueueItem:258] Starting thread posting`);
      const result = await this.postThread(queueItem);
      console.log(`🚀 [threadQueue.ts:processQueueItem:260] Thread posting result:`, { 
        success: result.success, 
        hasThreadId: !!result.threadId, 
        hasError: !!result.error 
      });

      if (result.success) {
        console.log(`✅ [threadQueue.ts:processQueueItem:266] Item processed successfully:`, {
          itemId: queueItem.id,
          threadId: result.threadId,
          sequence: queueItem.threadSequence
        });

        // 성공 시 상태 업데이트
        console.log(`📝 [threadQueue.ts:processQueueItem:273] Updating queue item status to 'completed'`);
        await supabase
          .from('thread_queue')
          .update({
            status: 'completed',
            processed_at: getCurrentUTCISO()
          })
          .eq('queue_id', queueItem.id);
        console.log(`📝 [threadQueue.ts:processQueueItem:281] Queue status update completed`);

        // my_contents 테이블 업데이트
        console.log(`📝 [threadQueue.ts:processQueueItem:284] Updating my_contents table`);
        await supabase
          .from('my_contents')
          .update({
            publish_status: 'posted',
            media_id: result.threadId
          })
          .eq('parent_media_id', queueItem.parentMediaId)
          .eq('thread_sequence', queueItem.threadSequence);
        console.log(`📝 [threadQueue.ts:processQueueItem:293] my_contents update completed`);

      } else {
        console.error(`❌ [threadQueue.ts:processQueueItem:296] Item processing failed:`, {
          itemId: queueItem.id,
          error: result.error,
          sequence: queueItem.threadSequence
        });
        // 실패 시 재시도 로직
        console.log(`🔄 [threadQueue.ts:processQueueItem:302] Calling handleFailure for retry logic`);
        await this.handleFailure(queueItem, result.error || 'Unknown error');
      }
    } catch (error) {
      console.error(`❌ [threadQueue.ts:processQueueItem:306] Exception during item processing:`, {
        itemId: queueItem.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        sequence: queueItem.threadSequence
      });
      console.log(`🔄 [threadQueue.ts:processQueueItem:313] Calling handleFailure for exception`);
      await this.handleFailure(queueItem, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * 스레드 게시 처리
   */
  private async postThread(queueItem: QueuedThread): Promise<{ success: boolean; threadId?: string; error?: string }> {
    console.log(`🚀 [threadQueue.ts:postThread:286] Starting postThread function`);
    console.log(`🚀 [threadQueue.ts:postThread:287] Thread details:`, {
      itemId: queueItem.id,
      hasReplyToId: !!queueItem.replyToId,
      mediaType: queueItem.mediaType,
      mediaUrlsCount: queueItem.mediaUrls.length,
      contentLength: queueItem.content.length
    });
    
    try {
      const { accessToken, socialId, content, mediaUrls, mediaType, replyToId } = queueItem;

      if (replyToId) {
        // 댓글 게시
        console.log(`💬 [threadQueue.ts:postThread:299] Posting as reply to: ${replyToId}`);
        const result = await this.postReply(content, replyToId, mediaUrls, mediaType, accessToken, socialId);
        console.log(`💬 [threadQueue.ts:postThread:301] Reply posting result:`, { success: result.success, hasError: !!result.error });
        return result;
      } else {
        // 일반 포스트 게시
        console.log(`📝 [threadQueue.ts:postThread:305] Posting as regular thread`);
        const result = await this.postRegularThread(content, mediaUrls, mediaType, accessToken, socialId);
        console.log(`📝 [threadQueue.ts:postThread:307] Regular thread posting result:`, { success: result.success, hasError: !!result.error });
        return result;
      }
    } catch (error) {
      console.error(`❌ [threadQueue.ts:postThread:311] Exception in postThread:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        itemId: queueItem.id
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 일반 스레드 게시
   */
  private async postRegularThread(
    content: string,
    mediaUrls: string[],
    mediaType: string,
    accessToken: string,
    socialId: string
  ): Promise<{ success: boolean; threadId?: string; error?: string }> {
    console.log(`📝 [threadQueue.ts:postRegularThread:310] Starting regular thread posting`);
    console.log(`📝 [threadQueue.ts:postRegularThread:311] Thread parameters:`, {
      contentLength: content.length,
      mediaUrlsCount: mediaUrls.length,
      mediaType,
      socialId,
      hasAccessToken: !!accessToken
    });
    
    try {
      // Import the optimized function from schedule.ts
      console.log(`📦 [threadQueue.ts:postRegularThread:320] Importing createThreadsContainer from schedule.ts`);
      const { createThreadsContainer } = await import('../../app/actions/schedule');

      console.log(`📦 [threadQueue.ts:postRegularThread:323] Preparing container parameters`);
      const containerParams = {
        content,
        mediaType: mediaType as any,
        media_urls: mediaUrls
      };

      console.log(`🏗️ [threadQueue.ts:postRegularThread:330] Creating threads container`);
      const containerResult = await createThreadsContainer(socialId, accessToken, containerParams);
      console.log(`🏗️ [threadQueue.ts:postRegularThread:332] Container creation result:`, {
        success: containerResult.success,
        hasCreationId: !!containerResult.creationId,
        hasError: !!containerResult.error
      });
      
      if (!containerResult.success) {
        console.error(`❌ [threadQueue.ts:postRegularThread:339] Container creation failed:`, containerResult.error);
        return { success: false, error: containerResult.error || 'Unknown error' };
      }

      console.log(`🚀 [threadQueue.ts:postRegularThread:343] Preparing publish request`);
      const publishUrl = `https://graph.threads.net/v1.0/${socialId}/threads_publish`;
      const publishParams = new URLSearchParams({
        creation_id: containerResult.creationId,
        access_token: accessToken,
      });

      console.log(`🚀 [threadQueue.ts:postRegularThread:350] Publish URL prepared:`, {
        url: publishUrl,
        creationId: containerResult.creationId,
        hasAccessToken: !!accessToken
      });

      // Reduced retry attempts for queue processing
      const maxAttempts = 3;
      console.log(`🔄 [threadQueue.ts:postRegularThread:357] Starting publish attempts (max: ${maxAttempts})`);
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        console.log(`🔄 [threadQueue.ts:postRegularThread:360] Publish attempt ${attempt + 1}/${maxAttempts}`);
        const startTime = Date.now();
        
        const publishResponse = await fetch(publishUrl, {
          method: "POST",
          body: publishParams
        });
        
        const responseTime = Date.now() - startTime;
        console.log(`🔄 [threadQueue.ts:postRegularThread:369] Attempt ${attempt + 1} response:`, {
          status: publishResponse.status,
          statusText: publishResponse.statusText,
          responseTime: `${responseTime}ms`,
          attempt: attempt + 1,
          maxAttempts
        });

        if (publishResponse.ok) {
          const publishData = await publishResponse.json();
          console.log(`✅ [threadQueue.ts:postRegularThread:378] Publish successful:`, {
            threadId: publishData.id,
            attempt: attempt + 1,
            responseTime: `${responseTime}ms`,
            fullResponse: publishData
          });
          return { success: true, threadId: publishData.id };
        } else {
          const errorText = await publishResponse.text();
          console.error(`❌ [threadQueue.ts:postRegularThread:387] Publish attempt ${attempt + 1} failed:`, {
            status: publishResponse.status,
            statusText: publishResponse.statusText,
            errorBody: errorText,
            responseTime: `${responseTime}ms`,
            attempt: attempt + 1,
            maxAttempts
          });
        }

        // Wait 5 seconds between attempts
        if (attempt < maxAttempts - 1) {
          console.log(`⏳ [threadQueue.ts:postRegularThread:398] Waiting 5 seconds before retry ${attempt + 2}...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      console.error(`❌ [threadQueue.ts:postRegularThread:403] All publish attempts failed after ${maxAttempts} tries`);
      return { success: false, error: 'Failed to publish after retries' };
    } catch (error) {
      console.error(`❌ [threadQueue.ts:postRegularThread:406] Exception in postRegularThread:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        contentLength: content.length,
        mediaType,
        socialId
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 댓글 게시
   */
  private async postReply(
    content: string,
    replyToId: string,
    mediaUrls: string[],
    mediaType: string,
    accessToken: string,
    socialId: string
  ): Promise<{ success: boolean; threadId?: string; error?: string }> {
    try {
      // For text-only replies, use simple postComment
      if (!mediaUrls || mediaUrls.length === 0 || mediaType === 'TEXT') {
        const { postComment } = await import('../../app/actions/comment');
        const result = await postComment({
          media_type: 'TEXT_POST',
          text: content,
          reply_to_id: replyToId
        });
        return { success: true, threadId: result.id };
      }

      // For media replies, create container first
      const baseUrl = `https://graph.threads.net/v1.0/${socialId}/threads`;
      let mediaContainerId: string;

      // Handle different media types
      if (mediaType === "IMAGE" && mediaUrls.length === 1) {
        const urlParams = new URLSearchParams({
          media_type: "IMAGE",
          image_url: mediaUrls[0],
          text: content,
          reply_to_id: replyToId,
          access_token: accessToken
        });

        const response = await fetch(`${baseUrl}?${urlParams.toString()}`, { method: "POST" });

        if (!response.ok) {
          const errorText = await response.text();
          return { success: false, error: `Failed to create image container: ${errorText}` };
        }

        const data = await response.json();
        mediaContainerId = data.id;
      } else if (mediaType === "VIDEO" && mediaUrls.length === 1) {
        const urlParams = new URLSearchParams({
          media_type: "VIDEO",
          video_url: mediaUrls[0],
          text: content,
          reply_to_id: replyToId,
          access_token: accessToken
        });

        const response = await fetch(`${baseUrl}?${urlParams.toString()}`, { method: "POST" });

        if (!response.ok) {
          const errorText = await response.text();
          return { success: false, error: `Failed to create video container: ${errorText}` };
        }

        const data = await response.json();
        mediaContainerId = data.id;
      } else if ((mediaType === "IMAGE" || mediaType === "CAROUSEL") && mediaUrls.length > 1) {
        // Handle carousel replies with retry logic
        console.log(`🎠 [QUEUE-CAROUSEL] Starting carousel reply creation with ${mediaUrls.length} items`);
        console.log(`🎠 [QUEUE-CAROUSEL] Media URLs:`, mediaUrls);
        console.log(`🎠 [QUEUE-CAROUSEL] Reply to ID: ${replyToId}`);
        console.log(`🎠 [QUEUE-CAROUSEL] Social ID: ${socialId}`);

        const itemContainers = [];

        for (let itemIndex = 0; itemIndex < mediaUrls.length; itemIndex++) {
          const imageUrl = mediaUrls[itemIndex];
          console.log(`🎠 [QUEUE-CAROUSEL] Processing item ${itemIndex + 1}/${mediaUrls.length}: ${imageUrl}`);

          const urlParams = new URLSearchParams({
            media_type: "IMAGE",
            image_url: imageUrl,
            is_carousel_item: "true",
            access_token: accessToken
          });

          let attempts = 0;
          const maxAttempts = 3;
          let success = false;

          while (attempts < maxAttempts && !success) {
            console.log(`🎠 [QUEUE-CAROUSEL] Item ${itemIndex + 1} attempt ${attempts + 1}/${maxAttempts}`);

            try {
              const startTime = Date.now();
              const response = await fetch(`${baseUrl}?${urlParams.toString()}`, { method: "POST" });
              const responseTime = Date.now() - startTime;

              console.log(`🎠 [QUEUE-CAROUSEL] Item ${itemIndex + 1} attempt ${attempts + 1} response:`, {
                status: response.status,
                statusText: response.statusText,
                responseTime: `${responseTime}ms`,
                headers: Object.fromEntries(response.headers.entries()),
                url: response.url.replace(accessToken, '[REDACTED]')
              });

              if (response.ok) {
                const data = await response.json();
                console.log(`✅ [QUEUE-CAROUSEL] Item ${itemIndex + 1} created successfully:`, {
                  containerId: data.id,
                  imageUrl,
                  attempt: attempts + 1,
                  responseTime: `${responseTime}ms`,
                  fullResponse: data
                });
                itemContainers.push(data.id);
                success = true;
              } else {
                const errorText = await response.text();
                console.error(`❌ [QUEUE-CAROUSEL] Item ${itemIndex + 1} attempt ${attempts + 1} failed:`, {
                  imageUrl,
                  status: response.status,
                  statusText: response.statusText,
                  errorBody: errorText,
                  responseHeaders: Object.fromEntries(response.headers.entries()),
                  requestParams: {
                    media_type: "IMAGE",
                    image_url: imageUrl,
                    is_carousel_item: "true",
                    access_token: '[REDACTED]'
                  },
                  responseTime: `${responseTime}ms`,
                  attempt: attempts + 1,
                  maxAttempts
                });

                // 이미지 URL 검증 (첫 번째 실패 시에만)
                if (attempts === 0) {
                  try {
                    console.log(`🔍 [QUEUE-CAROUSEL] Validating image URL: ${imageUrl}`);
                    const imageCheckResponse = await fetch(imageUrl, { method: 'HEAD' });
                    console.log(`🔍 [QUEUE-CAROUSEL] Image URL validation result:`, {
                      imageUrl,
                      status: imageCheckResponse.status,
                      headers: Object.fromEntries(imageCheckResponse.headers.entries()),
                      contentType: imageCheckResponse.headers.get('content-type'),
                      contentLength: imageCheckResponse.headers.get('content-length'),
                      isAccessible: imageCheckResponse.ok
                    });
                  } catch (imageError) {
                    console.error(`🔍 [QUEUE-CAROUSEL] Image URL validation failed:`, {
                      imageUrl,
                      error: imageError instanceof Error ? imageError.message : 'Unknown error'
                    });
                  }
                }

                if (attempts === maxAttempts - 1) {
                  return { success: false, error: `Failed to create carousel item ${itemIndex + 1}/${mediaUrls.length} after ${maxAttempts} attempts (${response.status}): ${errorText}` };
                }
              }
            } catch (error) {
              console.error(`❌ [QUEUE-CAROUSEL] Item ${itemIndex + 1} attempt ${attempts + 1} exception:`, {
                imageUrl,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                attempt: attempts + 1,
                maxAttempts
              });
              if (attempts === maxAttempts - 1) {
                return { success: false, error: `Failed to create carousel item ${itemIndex + 1}/${mediaUrls.length}: ${error instanceof Error ? error.message : 'Unknown error'}` };
              }
            }

            attempts++;
            if (!success && attempts < maxAttempts) {
              const waitTime = 1000 * Math.pow(2, attempts);
              console.log(`⏳ [QUEUE-CAROUSEL] Item ${itemIndex + 1} waiting ${waitTime}ms before retry ${attempts + 1}...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }

          // 아이템 간 딜레이 (마지막 아이템 제외)
          if (itemIndex < mediaUrls.length - 1) {
            console.log(`⏳ [QUEUE-CAROUSEL] Waiting 1 second before next item...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        console.log(`🎠 [QUEUE-CAROUSEL] All ${mediaUrls.length} items created. Container IDs:`, itemContainers);

        // Create carousel container
        console.log(`🎠 [QUEUE-CAROUSEL] Creating final carousel container...`);
        const urlParams = new URLSearchParams({
          media_type: "CAROUSEL",
          text: content,
          children: itemContainers.join(","),
          reply_to_id: replyToId,
          access_token: accessToken
        });

        console.log(`🎠 [QUEUE-CAROUSEL] Final container request:`, {
          url: `${baseUrl}?${urlParams.toString()}`.replace(accessToken, '[REDACTED]'),
          params: {
            media_type: "CAROUSEL",
            text: content,
            children: itemContainers.join(","),
            reply_to_id: replyToId,
            access_token: '[REDACTED]'
          },
          childrenCount: itemContainers.length,
          childrenIds: itemContainers
        });

        const startTime = Date.now();
        const response = await fetch(`${baseUrl}?${urlParams.toString()}`, { method: "POST" });
        const responseTime = Date.now() - startTime;

        console.log(`🎠 [QUEUE-CAROUSEL] Final container API Response:`, {
          status: response.status,
          statusText: response.statusText,
          responseTime: `${responseTime}ms`,
          headers: Object.fromEntries(response.headers.entries()),
          url: response.url.replace(accessToken, '[REDACTED]')
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [QUEUE-CAROUSEL] Final container creation failed:`, {
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText,
            responseHeaders: Object.fromEntries(response.headers.entries()),
            requestParams: {
              media_type: "CAROUSEL",
              text: content,
              children: itemContainers.join(","),
              reply_to_id: replyToId,
              access_token: '[REDACTED]'
            },
            responseTime: `${responseTime}ms`,
            childrenIds: itemContainers,
            childrenCount: itemContainers.length
          });
          return { success: false, error: `Failed to create carousel container (${response.status}): ${errorText}` };
        }

        const data = await response.json();
        console.log(`✅ [QUEUE-CAROUSEL] Final container created successfully:`, {
          containerId: data.id,
          responseTime: `${responseTime}ms`,
          fullResponse: data
        });

        mediaContainerId = data.id;
      } else {
        return { success: false, error: 'Unsupported media type for replies' };
      }

      // Publish the reply
      const publishUrl = `https://graph.threads.net/v1.0/${socialId}/threads_publish`;
      const publishParams = new URLSearchParams({
        creation_id: mediaContainerId,
        access_token: accessToken,
      });

      const maxAttempts = 3;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const publishResponse = await fetch(publishUrl, {
          method: "POST",
          body: publishParams
        });

        if (publishResponse.ok) {
          const publishData = await publishResponse.json();
          return { success: true, threadId: publishData.id };
        } else {
          const errorText = await publishResponse.text();
          console.error(`Reply publish attempt ${attempt + 1} failed:`, errorText);
        }

        // Wait 5 seconds between attempts
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      return { success: false, error: 'Failed to publish reply after retries' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 실패 처리
   */
  private async handleFailure(queueItem: QueuedThread, error: string): Promise<void> {
    console.log(`🔄 [threadQueue.ts:handleFailure:666] Starting failure handling`);
    console.log(`🔄 [threadQueue.ts:handleFailure:667] Creating Supabase client`);
    const supabase = await createClient();
    const newRetryCount = queueItem.retryCount + 1;

    console.log(`🔄 [threadQueue.ts:handleFailure:671] Failure details:`, {
      itemId: queueItem.id,
      currentRetryCount: queueItem.retryCount,
      newRetryCount,
      maxRetries: queueItem.maxRetries,
      error,
      canRetry: newRetryCount <= queueItem.maxRetries
    });

    if (newRetryCount <= queueItem.maxRetries) {
      console.log(`🔄 [threadQueue.ts:handleFailure:681] Retry possible - Setting up retry for item [${queueItem.id}]`);
      console.log(`🔄 [threadQueue.ts:handleFailure:682] Retry attempt ${newRetryCount}/${queueItem.maxRetries}`);

      // 재시도 가능
      console.log(`📝 [threadQueue.ts:handleFailure:685] Updating queue item for retry`);
      await supabase
        .from('thread_queue')
        .update({
          status: 'pending',
          retry_count: newRetryCount,
          error: error
        })
        .eq('queue_id', queueItem.id);
      console.log(`📝 [threadQueue.ts:handleFailure:693] Retry setup completed`);
    } else {
      console.error(`❌ [threadQueue.ts:handleFailure:695] Max retries exceeded - Marking item [${queueItem.id}] as permanently failed`);
      console.error(`❌ [threadQueue.ts:handleFailure:696] Failed after ${queueItem.maxRetries} attempts: ${error}`);

      // 최대 재시도 횟수 초과
      console.log(`📝 [threadQueue.ts:handleFailure:699] Updating queue item status to 'failed'`);
      await supabase
        .from('thread_queue')
        .update({
          status: 'failed',
          error: error,
          processed_at: getCurrentUTCISO()
        })
        .eq('queue_id', queueItem.id);
      console.log(`📝 [threadQueue.ts:handleFailure:708] Queue item marked as failed`);

      // my_contents 테이블도 failed 상태로 업데이트
      console.log(`📝 [threadQueue.ts:handleFailure:711] Updating my_contents table to 'failed' status`);
      await supabase
        .from('my_contents')
        .update({
          publish_status: 'failed'
        })
        .eq('parent_media_id', queueItem.parentMediaId)
        .eq('thread_sequence', queueItem.threadSequence);
      console.log(`📝 [threadQueue.ts:handleFailure:719] my_contents table updated`);
    }
    console.log(`🏁 [threadQueue.ts:handleFailure:721] Failure handling completed`);
  }

  /**
   * 큐 정리 (완료된 항목 삭제)
   */
  async cleanupQueue(): Promise<void> {
    console.log(`🧹 [threadQueue.ts:cleanupQueue:709] Starting queue cleanup`);
    console.log(`🧹 [threadQueue.ts:cleanupQueue:710] Creating Supabase client`);
    const supabase = await createClient();
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24시간 전

    console.log(`🧹 [threadQueue.ts:cleanupQueue:714] Cleanup parameters:`, {
      cutoffTime: cutoffTime.toISOString(),
      currentTime: new Date().toISOString(),
      hoursAgo: 24
    });

    console.log(`🧹 [threadQueue.ts:cleanupQueue:720] Executing cleanup query`);
    const { data, error } = await supabase
      .from('thread_queue')
      .delete()
      .eq('status', 'completed')
      .lt('processed_at', cutoffTime.toISOString());

    if (error) {
      console.error(`❌ [threadQueue.ts:cleanupQueue:727] Cleanup failed:`, {
        error,
        cutoffTime: cutoffTime.toISOString()
      });
    } else {
      console.log(`✅ [threadQueue.ts:cleanupQueue:732] Cleanup completed successfully:`, {
        cutoffTime: cutoffTime.toISOString()
      });
    }
  }

  /**
   * 큐 상태 조회
   */
  async getQueueStatus(): Promise<{ pending: number; processing: number; completed: number; failed: number }> {
    console.log(`📊 [threadQueue.ts:getQueueStatus:731] Starting queue status retrieval`);
    console.log(`📊 [threadQueue.ts:getQueueStatus:732] Creating Supabase client`);
    const supabase = await createClient();

    console.log(`📊 [threadQueue.ts:getQueueStatus:735] Querying queue statistics`);
    const { data: stats, error } = await supabase
      .from('thread_queue')
      .select('status')
      .in('status', ['pending', 'processing', 'completed', 'failed']);

    if (error) {
      console.error(`❌ [threadQueue.ts:getQueueStatus:742] Failed to get queue status:`, error);
      return { pending: 0, processing: 0, completed: 0, failed: 0 };
    }

    console.log(`📊 [threadQueue.ts:getQueueStatus:746] Processing statistics data:`, {
      totalItems: stats?.length || 0,
      hasData: !!stats
    });

    const result = { pending: 0, processing: 0, completed: 0, failed: 0 };
    stats.forEach(item => {
      result[item.status as keyof typeof result]++;
    });

    console.log(`📊 [threadQueue.ts:getQueueStatus:755] Queue status summary:`, {
      pending: result.pending,
      processing: result.processing,
      completed: result.completed,
      failed: result.failed,
      total: result.pending + result.processing + result.completed + result.failed
    });

    return result;
  }
}