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
    const supabase = await createClient();
    const currentTime = getCurrentUTCISO();

    console.log(`🔄 [QUEUE] Enqueueing thread chain [${parentMediaId}] with ${threads.length} items`);

    // 큐 아이템들을 생성
    const queueItems: QueuedThread[] = threads.map((thread, index) => ({
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
    }));

    // 데이터베이스에 큐 저장
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
      console.error('❌ [QUEUE] Failed to enqueue thread chain:', error);
      throw new Error('Failed to enqueue thread chain');
    }

    console.log(`✅ [QUEUE] Successfully enqueued ${threads.length} items for chain [${parentMediaId}]`);

    // 첫 번째 스레드가 완료되었으므로 큐 처리 시작
    if (firstThreadId) {
      this.processQueue();
    }
  }

  /**
   * 큐 처리 시작
   */
  async processQueue(): Promise<void> {
    if (this.processing) {
      console.log(`⏳ [QUEUE] Already processing queue, skipping...`);
      return;
    }

    this.processing = true;
    console.log(`🚀 [QUEUE] Starting queue processing...`);

    try {
      const supabase = await createClient();

      // 대기 중인 항목들을 가져옴
      const { data: pendingItems, error } = await supabase
        .from('thread_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(this.MAX_CONCURRENT);

      if (error) {
        console.error('❌ [QUEUE] Failed to fetch pending queue items:', error);
        return;
      }

      if (!pendingItems || pendingItems.length === 0) {
        console.log(`✅ [QUEUE] No pending items found`);
        return;
      }

      console.log(`📋 [QUEUE] Found ${pendingItems.length} pending items to process`);

      // 순차 처리로 변경 (API 제한 방지)
      const results = [];
      for (const item of pendingItems) {
        try {
          await this.processQueueItem(item);
          results.push({ status: 'fulfilled' });
        } catch (error) {
          console.error(`[QUEUE] Item processing failed:`, error);
          results.push({ status: 'rejected', error });
        }

        // 아이템 간 간격 (API 제한 방지)
        if (pendingItems.indexOf(item) < pendingItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;

      console.log(`📊 [QUEUE] Sequential processing completed - Success: ${successCount}, Failed: ${failureCount}`);

      // 더 처리할 항목이 있는지 확인
      const { data: remainingItems } = await supabase
        .from('thread_queue')
        .select('queue_id')
        .eq('status', 'pending')
        .limit(1);

      if (remainingItems && remainingItems.length > 0) {
        console.log(`🔄 [QUEUE] More items found, scheduling next batch in 2 seconds...`);
        setTimeout(() => this.processQueue(), 2000);
      } else {
        console.log(`✅ [QUEUE] All items processed successfully`);
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * 개별 큐 항목 처리
   */
  private async processQueueItem(item: any): Promise<void> {
    const supabase = await createClient();
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

    console.log(`🔄 [QUEUE] Processing item [${queueItem.id}] - Sequence: ${queueItem.threadSequence}`);

    try {
      // 상태를 processing으로 변경
      await supabase
        .from('thread_queue')
        .update({ status: 'processing' })
        .eq('queue_id', queueItem.id);

      // 스레드 게시 처리
      const result = await this.postThread(queueItem);

      if (result.success) {
        console.log(`✅ [QUEUE] Item [${queueItem.id}] processed successfully - Thread ID: ${result.threadId}`);

        // 성공 시 상태 업데이트
        await supabase
          .from('thread_queue')
          .update({
            status: 'completed',
            processed_at: getCurrentUTCISO()
          })
          .eq('queue_id', queueItem.id);

        // my_contents 테이블 업데이트
        await supabase
          .from('my_contents')
          .update({
            publish_status: 'posted',
            media_id: result.threadId
          })
          .eq('parent_media_id', queueItem.parentMediaId)
          .eq('thread_sequence', queueItem.threadSequence);

      } else {
        console.error(`❌ [QUEUE] Item [${queueItem.id}] failed: ${result.error}`);
        // 실패 시 재시도 로직
        await this.handleFailure(queueItem, result.error || 'Unknown error');
      }
    } catch (error) {
      console.error(`❌ [QUEUE] Error processing item [${queueItem.id}]:`, error);
      await this.handleFailure(queueItem, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * 스레드 게시 처리
   */
  private async postThread(queueItem: QueuedThread): Promise<{ success: boolean; threadId?: string; error?: string }> {
    try {
      const { accessToken, socialId, content, mediaUrls, mediaType, replyToId } = queueItem;

      if (replyToId) {
        // 댓글 게시
        const result = await this.postReply(content, replyToId, mediaUrls, mediaType, accessToken, socialId);
        return result;
      } else {
        // 일반 포스트 게시
        const result = await this.postRegularThread(content, mediaUrls, mediaType, accessToken, socialId);
        return result;
      }
    } catch (error) {
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
    try {
      // Import the optimized function from schedule.ts
      const { createThreadsContainer } = await import('../../app/actions/schedule');

      const containerParams = {
        content,
        mediaType: mediaType as any,
        media_urls: mediaUrls
      };

      const containerResult = await createThreadsContainer(socialId, accessToken, containerParams);
      if (!containerResult.success) {
        return { success: false, error: containerResult.error || 'Unknown error' };
      }

      const publishUrl = `https://graph.threads.net/v1.0/${socialId}/threads_publish`;
      const publishParams = new URLSearchParams({
        creation_id: containerResult.creationId,
        access_token: accessToken,
      });

      // Reduced retry attempts for queue processing
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
          console.error(`Publish attempt ${attempt + 1} failed:`, errorText);
        }

        // Wait 5 seconds between attempts
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      return { success: false, error: 'Failed to publish after retries' };
    } catch (error) {
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
    const supabase = await createClient();
    const newRetryCount = queueItem.retryCount + 1;

    if (newRetryCount <= queueItem.maxRetries) {
      console.log(`🔄 [QUEUE] Retrying item [${queueItem.id}] - Attempt ${newRetryCount}/${queueItem.maxRetries}`);

      // 재시도 가능
      await supabase
        .from('thread_queue')
        .update({
          status: 'pending',
          retry_count: newRetryCount,
          error: error
        })
        .eq('queue_id', queueItem.id);
    } else {
      console.error(`❌ [QUEUE] Item [${queueItem.id}] failed permanently after ${queueItem.maxRetries} attempts: ${error}`);

      // 최대 재시도 횟수 초과
      await supabase
        .from('thread_queue')
        .update({
          status: 'failed',
          error: error,
          processed_at: getCurrentUTCISO()
        })
        .eq('queue_id', queueItem.id);

      // my_contents 테이블도 failed 상태로 업데이트
      await supabase
        .from('my_contents')
        .update({
          publish_status: 'failed'
        })
        .eq('parent_media_id', queueItem.parentMediaId)
        .eq('thread_sequence', queueItem.threadSequence);
    }
  }

  /**
   * 큐 정리 (완료된 항목 삭제)
   */
  async cleanupQueue(): Promise<void> {
    const supabase = await createClient();
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24시간 전

    console.log(`🧹 [QUEUE] Starting cleanup for items older than ${cutoffTime.toISOString()}`);

    const { data, error } = await supabase
      .from('thread_queue')
      .delete()
      .eq('status', 'completed')
      .lt('processed_at', cutoffTime.toISOString());

    if (error) {
      console.error('❌ [QUEUE] Cleanup failed:', error);
    } else {
      console.log(`✅ [QUEUE] Cleanup completed successfully`);
    }
  }

  /**
   * 큐 상태 조회
   */
  async getQueueStatus(): Promise<{ pending: number; processing: number; completed: number; failed: number }> {
    const supabase = await createClient();

    const { data: stats, error } = await supabase
      .from('thread_queue')
      .select('status')
      .in('status', ['pending', 'processing', 'completed', 'failed']);

    if (error) {
      console.error('❌ [QUEUE] Failed to get queue status:', error);
      return { pending: 0, processing: 0, completed: 0, failed: 0 };
    }

    const result = { pending: 0, processing: 0, completed: 0, failed: 0 };
    stats.forEach(item => {
      result[item.status as keyof typeof result]++;
    });

    console.log(`📊 [QUEUE] Current status - Pending: ${result.pending}, Processing: ${result.processing}, Completed: ${result.completed}, Failed: ${result.failed}`);

    return result;
  }
}