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
      console.error('Failed to enqueue thread chain:', error);
      throw new Error('Failed to enqueue thread chain');
    }

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
      return;
    }

    this.processing = true;

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
        console.error('Failed to fetch pending queue items:', error);
        return;
      }

      if (!pendingItems || pendingItems.length === 0) {
        return;
      }

      // 병렬 처리
      const processPromises = pendingItems.map(item => this.processQueueItem(item));
      await Promise.allSettled(processPromises);

      // 더 처리할 항목이 있는지 확인
      const { data: remainingItems } = await supabase
        .from('thread_queue')
        .select('queue_id')
        .eq('status', 'pending')
        .limit(1);

      if (remainingItems && remainingItems.length > 0) {
        // 잠시 대기 후 다시 처리
        setTimeout(() => this.processQueue(), 2000);
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

    try {
      // 상태를 processing으로 변경
      await supabase
        .from('thread_queue')
        .update({ status: 'processing' })
        .eq('queue_id', queueItem.id);

      // 스레드 게시 처리
      const result = await this.postThread(queueItem);

      if (result.success) {
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
        // 실패 시 재시도 로직
        await this.handleFailure(queueItem, result.error);
      }
    } catch (error) {
      console.error(`Error processing queue item ${queueItem.id}:`, error);
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
        return { success: false, error: containerResult.error };
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
        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: `Failed to create image container: ${JSON.stringify(data)}` };
        }
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
        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: `Failed to create video container: ${JSON.stringify(data)}` };
        }
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
      // 최대 재시도 횟수 초과
      await supabase
        .from('thread_queue')
        .update({
          status: 'failed',
          error: error,
          processed_at: getCurrentUTCISO()
        })
        .eq('queue_id', queueItem.id);
    }
  }

  /**
   * 큐 정리 (완료된 항목 삭제)
   */
  async cleanupQueue(): Promise<void> {
    const supabase = await createClient();
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24시간 전

    await supabase
      .from('thread_queue')
      .delete()
      .eq('status', 'completed')
      .lt('processed_at', cutoffTime.toISOString());
  }
}