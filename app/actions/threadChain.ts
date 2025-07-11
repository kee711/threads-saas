'use server';

import { createClient } from '@/lib/supabase/server';
import { authOptions } from "@/lib/auth/authOptions";
import { getServerSession } from "next-auth/next";
import { postComment } from './comment';
import { createThreadsContainer, PublishPostParams } from './schedule';
import { getCurrentUTCISO } from '@/lib/utils/time';
import { decryptToken } from '@/lib/utils/crypto';

export interface ThreadContent {
  content: string;
  media_urls?: string[];
  media_type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL';
}

interface ThreadChainResult {
  success: boolean;
  parentThreadId?: string;
  threadIds?: string[];
  error?: string;
}

export interface AuthOptions {
  accessToken?: string;
  selectedSocialId?: string;
}

// Get Threads access token - supports both session-based and provided tokens
async function getThreadsAccessToken(options?: AuthOptions) {
  // If tokens are provided (from cron job), use them directly
  if (options?.accessToken && options?.selectedSocialId) {
    return {
      accessToken: options.accessToken,
      selectedSocialId: options.selectedSocialId
    };
  }

  // Fall back to session-based authentication (for user actions)
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    throw new Error("로그인이 필요합니다.");
  }
  const userId = session.user.id;
  const supabase = await createClient();

  // user_profiles에서 선택된 소셜 계정 id 가져오기
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('selected_social_id')
    .eq('user_id', userId)
    .single();

  const selectedSocialId = profile?.selected_social_id;
  if (!selectedSocialId) {
    throw new Error('선택된 소셜 계정이 없습니다.');
  }

  // social_accounts에서 access_token 가져오기
  const { data: account } = await supabase
    .from('social_accounts')
    .select('access_token')
    .eq('social_id', selectedSocialId)
    .eq('platform', 'threads')
    .eq('is_active', true)
    .single();

  const encryptedToken = account?.access_token;
  if (!encryptedToken) {
    throw new Error('Threads access token이 없습니다.');
  }

  // 토큰 복호화
  const accessToken = decryptToken(encryptedToken);
  return { accessToken, selectedSocialId };
}

// Create a regular Threads post using schedule.ts container logic
async function createThreadsPost(content: string, mediaUrls?: string[], mediaType?: string, options?: AuthOptions) {
  const { accessToken, selectedSocialId } = await getThreadsAccessToken(options);

  try {
    // Use createThreadsContainer from schedule.ts for consistent media handling
    const containerParams: PublishPostParams = {
      content,
      mediaType: (mediaType as any) || 'TEXT',
      media_urls: mediaUrls || []
    };

    const containerResult = await createThreadsContainer(selectedSocialId, accessToken, containerParams);

    if (!containerResult.success) {
      throw new Error(containerResult.error || 'Failed to create thread container');
    }

    const mediaContainerId = containerResult.creationId;
    console.log(`Created media container: ${mediaContainerId}`);

    // Publish the post
    const publishUrl = `https://graph.threads.net/v1.0/${selectedSocialId}/threads_publish`;
    const publishParams = new URLSearchParams({
      creation_id: mediaContainerId,
      access_token: accessToken,
    });

    // Wait and retry publishing
    const maxAttempts = 10;
    let attempt = 0;

    while (attempt < maxAttempts) {
      console.log(`Attempt ${attempt + 1}: Publishing thread...`);
      try {
        const publishResponse = await fetch(publishUrl, {
          method: "POST",
          body: publishParams
        });

        if (publishResponse.ok) {
          const publishData = await publishResponse.json();
          console.log('Thread published successfully!');
          return {
            success: true,
            threadId: publishData.id,
            mediaContainerId
          };
        }
      } catch (error) {
        console.error('Error during publish attempt:', error);
      }

      await new Promise((resolve) => setTimeout(resolve, 15000)); // 15초 대기
      attempt++;
    }

    throw new Error('Failed to publish thread after multiple attempts.');
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
}

// Optimized version with reduced timeouts
async function createThreadsPostOptimized(content: string, mediaUrls?: string[], mediaType?: string, options?: AuthOptions) {
  const { accessToken, selectedSocialId } = await getThreadsAccessToken(options);

  try {
    const containerParams: PublishPostParams = {
      content,
      mediaType: (mediaType as any) || 'TEXT',
      media_urls: mediaUrls || []
    };

    const containerResult = await createThreadsContainer(selectedSocialId, accessToken, containerParams);

    if (!containerResult.success) {
      throw new Error(containerResult.error || 'Failed to create thread container');
    }

    const mediaContainerId = containerResult.creationId;
    console.log(`Created media container: ${mediaContainerId}`);

    const publishUrl = `https://graph.threads.net/v1.0/${selectedSocialId}/threads_publish`;
    const publishParams = new URLSearchParams({
      creation_id: mediaContainerId,
      access_token: accessToken,
    });

    // Reduced attempts and wait time for optimization
    const maxAttempts = 5;
    let attempt = 0;

    while (attempt < maxAttempts) {
      console.log(`Attempt ${attempt + 1}: Publishing thread...`);
      try {
        const publishResponse = await fetch(publishUrl, {
          method: "POST",
          body: publishParams
        });

        if (publishResponse.ok) {
          const publishData = await publishResponse.json();
          console.log('Thread published successfully!');
          return {
            success: true,
            threadId: publishData.id,
            mediaContainerId
          };
        } else {
          // 실패한 응답의 내용을 확인
          const errorData = await publishResponse.json();
          console.error(`Error during publish attempt ${attempt + 1}:`, {
            status: publishResponse.status,
            statusText: publishResponse.statusText,
            error: errorData
          });
        }
      } catch (error) {
        console.error(`Error during publish attempt ${attempt + 1}:`, error);
      }

      // Reduced wait time: 5 seconds for text, 10 seconds for media
      const hasMedia = mediaUrls && mediaUrls.length > 0;
      const waitTime = hasMedia ? 10000 : 5000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      attempt++;
    }

    throw new Error('Failed to publish thread after multiple attempts.');
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
}

// Create a reply comment with media support using schedule.ts container logic
async function createThreadsReply(content: string, replyToId: string, mediaUrls?: string[], mediaType?: string, options?: AuthOptions) {
  const { accessToken, selectedSocialId } = await getThreadsAccessToken(options);

  try {
    // If no media, use the existing postComment function
    if (!mediaUrls || mediaUrls.length === 0 || mediaType === 'TEXT') {
      return await postComment({
        media_type: 'TEXT_POST',
        text: content,
        reply_to_id: replyToId
      });
    }

    // For media replies, use createThreadsContainer with reply_to_id
    const baseUrl = `https://graph.threads.net/v1.0/${selectedSocialId}/threads`;
    let mediaContainerId;

    // Handle different media types
    if (mediaType === "IMAGE" && mediaUrls.length === 1) {
      const urlParams = new URLSearchParams();
      urlParams.append("media_type", "IMAGE");
      urlParams.append("image_url", mediaUrls[0]);
      urlParams.append("text", content);
      urlParams.append("reply_to_id", replyToId);
      urlParams.append("access_token", accessToken);

      const containerUrl = `${baseUrl}?${urlParams.toString()}`;
      const response = await fetch(containerUrl, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`댓글 이미지 컨테이너 생성 실패: ${JSON.stringify(data)}`);
      }
      mediaContainerId = data.id;
    }
    else if (mediaType === "VIDEO" && mediaUrls.length === 1) {
      const urlParams = new URLSearchParams();
      urlParams.append("media_type", "VIDEO");
      urlParams.append("video_url", mediaUrls[0]);
      urlParams.append("text", content);
      urlParams.append("reply_to_id", replyToId);
      urlParams.append("access_token", accessToken);

      const containerUrl = `${baseUrl}?${urlParams.toString()}`;
      const response = await fetch(containerUrl, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`댓글 비디오 컨테이너 생성 실패: ${JSON.stringify(data)}`);
      }
      mediaContainerId = data.id;
    }
    else if ((mediaType === "IMAGE" || mediaType === "CAROUSEL") && mediaUrls.length > 1) {
      // Create carousel reply
      const itemContainers = [];

      for (const imageUrl of mediaUrls) {
        const urlParams = new URLSearchParams();
        urlParams.append("media_type", "IMAGE");
        urlParams.append("image_url", imageUrl);
        urlParams.append("is_carousel_item", "true");
        urlParams.append("access_token", accessToken);

        const containerUrl = `${baseUrl}?${urlParams.toString()}`;
        const response = await fetch(containerUrl, { method: "POST" });

        if (!response.ok) {
          throw new Error(`댓글 캐러셀 아이템 생성 실패: ${await response.text()}`);
        }

        const data = await response.json();
        itemContainers.push(data.id);
      }

      // Create carousel container with reply_to_id
      const urlParams = new URLSearchParams();
      urlParams.append("media_type", "CAROUSEL");
      urlParams.append("text", content);
      urlParams.append("children", itemContainers.join(","));
      urlParams.append("reply_to_id", replyToId);
      urlParams.append("access_token", accessToken);

      const containerUrl = `${baseUrl}?${urlParams.toString()}`;
      const response = await fetch(containerUrl, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`댓글 캐러셀 컨테이너 생성 실패: ${JSON.stringify(data)}`);
      }
      mediaContainerId = data.id;
    } else {
      throw new Error("지원하지 않는 댓글 미디어 타입입니다.");
    }

    console.log(`Created reply media container: ${mediaContainerId}`);

    // Publish the reply
    const publishUrl = `https://graph.threads.net/v1.0/${selectedSocialId}/threads_publish`;
    const publishParams = new URLSearchParams({
      creation_id: mediaContainerId,
      access_token: accessToken,
    });

    // Wait and retry publishing
    const maxAttempts = 10;
    let attempt = 0;

    while (attempt < maxAttempts) {
      console.log(`Attempt ${attempt + 1}: Publishing reply...`);
      try {
        const publishResponse = await fetch(publishUrl, {
          method: "POST",
          body: publishParams
        });

        if (publishResponse.ok) {
          const publishData = await publishResponse.json();
          console.log('Reply published successfully!');
          return { id: publishData.id };
        }
      } catch (error) {
        console.error('Error during reply publish attempt:', error);
      }

      await new Promise((resolve) => setTimeout(resolve, 15000)); // 15초 대기
      attempt++;
    }

    throw new Error('Failed to publish reply after multiple attempts.');
  } catch (error) {
    console.error('Error creating reply:', error);
    throw error;
  }
}

// Optimized version of createThreadsReply with reduced timeouts
async function createThreadsReplyOptimized(content: string, replyToId: string, mediaUrls?: string[], mediaType?: string, options?: AuthOptions) {
  const { accessToken, selectedSocialId } = await getThreadsAccessToken(options);

  try {
    // If no media, use the existing postComment function
    if (!mediaUrls || mediaUrls.length === 0 || mediaType === 'TEXT') {
      return await postComment({
        media_type: 'TEXT_POST',
        text: content,
        reply_to_id: replyToId
      });
    }

    // For media replies, use createThreadsContainer with reply_to_id
    const baseUrl = `https://graph.threads.net/v1.0/${selectedSocialId}/threads`;
    let mediaContainerId;

    // Handle different media types (same logic as original)
    if (mediaType === "IMAGE" && mediaUrls.length === 1) {
      const urlParams = new URLSearchParams();
      urlParams.append("media_type", "IMAGE");
      urlParams.append("image_url", mediaUrls[0]);
      urlParams.append("text", content);
      urlParams.append("reply_to_id", replyToId);
      urlParams.append("access_token", accessToken);

      const containerUrl = `${baseUrl}?${urlParams.toString()}`;
      const response = await fetch(containerUrl, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`댓글 이미지 컨테이너 생성 실패: ${JSON.stringify(data)}`);
      }
      mediaContainerId = data.id;
    }
    else if (mediaType === "VIDEO" && mediaUrls.length === 1) {
      const urlParams = new URLSearchParams();
      urlParams.append("media_type", "VIDEO");
      urlParams.append("video_url", mediaUrls[0]);
      urlParams.append("text", content);
      urlParams.append("reply_to_id", replyToId);
      urlParams.append("access_token", accessToken);

      const containerUrl = `${baseUrl}?${urlParams.toString()}`;
      const response = await fetch(containerUrl, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`댓글 비디오 컨테이너 생성 실패: ${JSON.stringify(data)}`);
      }
      mediaContainerId = data.id;
    }
    else if ((mediaType === "IMAGE" || mediaType === "CAROUSEL") && mediaUrls.length > 1) {
      // Create carousel reply
      const itemContainers = [];

      for (const imageUrl of mediaUrls) {
        const urlParams = new URLSearchParams();
        urlParams.append("media_type", "IMAGE");
        urlParams.append("image_url", imageUrl);
        urlParams.append("is_carousel_item", "true");
        urlParams.append("access_token", accessToken);

        const containerUrl = `${baseUrl}?${urlParams.toString()}`;
        const response = await fetch(containerUrl, { method: "POST" });

        if (!response.ok) {
          throw new Error(`댓글 캐러셀 아이템 생성 실패: ${await response.text()}`);
        }

        const data = await response.json();
        itemContainers.push(data.id);
      }

      // Create carousel container with reply_to_id
      const urlParams = new URLSearchParams();
      urlParams.append("media_type", "CAROUSEL");
      urlParams.append("text", content);
      urlParams.append("children", itemContainers.join(","));
      urlParams.append("reply_to_id", replyToId);
      urlParams.append("access_token", accessToken);

      const containerUrl = `${baseUrl}?${urlParams.toString()}`;
      const response = await fetch(containerUrl, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`댓글 캐러셀 컨테이너 생성 실패: ${JSON.stringify(data)}`);
      }
      mediaContainerId = data.id;
    } else {
      throw new Error("지원하지 않는 댓글 미디어 타입입니다.");
    }

    console.log(`Created reply media container: ${mediaContainerId}`);

    // Publish the reply with reduced timeout
    const publishUrl = `https://graph.threads.net/v1.0/${selectedSocialId}/threads_publish`;
    const publishParams = new URLSearchParams({
      creation_id: mediaContainerId,
      access_token: accessToken,
    });

    // Reduced attempts and wait time for optimization
    const maxAttempts = 5;
    let attempt = 0;

    while (attempt < maxAttempts) {
      console.log(`Attempt ${attempt + 1}: Publishing reply...`);
      try {
        const publishResponse = await fetch(publishUrl, {
          method: "POST",
          body: publishParams
        });

        if (publishResponse.ok) {
          const publishData = await publishResponse.json();
          console.log('Reply published successfully!');
          return { id: publishData.id };
        } else {
          // 실패한 응답의 내용을 확인
          const errorData = await publishResponse.json();
          console.error(`Error during reply publish attempt ${attempt + 1}:`, {
            status: publishResponse.status,
            statusText: publishResponse.statusText,
            error: errorData
          });
        }
      } catch (error) {
        console.error(`Error during reply publish attempt ${attempt + 1}:`, error);
      }

      // Reduced wait time: 5 seconds for text, 10 seconds for media
      const hasMedia = mediaUrls && mediaUrls.length > 0;
      const waitTime = hasMedia ? 10000 : 5000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      attempt++;
    }

    throw new Error('Failed to publish reply after multiple attempts.');
  } catch (error) {
    console.error('Error creating reply:', error);
    throw error;
  }
}

// Save thread chain to database
async function saveThreadChainToDatabase(
  threads: ThreadContent[],
  threadIds: string[],
  parentThreadId: string,
  scheduledAt?: string
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createClient();
  const userId = session.user.id;

  // Get selected social account
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('selected_social_id')
    .eq('user_id', userId)
    .single();

  const selectedSocialId = profile?.selected_social_id;
  if (!selectedSocialId) {
    throw new Error('선택된 소셜 계정이 없습니다.');
  }

  // Save each thread in the chain
  const threadRecords = threads.map((thread, index) => ({
    content: thread.content,
    media_urls: thread.media_urls || [],
    media_type: thread.media_type || 'TEXT',
    user_id: userId,
    social_id: selectedSocialId,
    media_id: threadIds[index],
    publish_status: scheduledAt ? 'scheduled' : 'posted',
    scheduled_at: scheduledAt,
    parent_media_id: parentThreadId,
    thread_sequence: index,
    is_thread_chain: true,
    created_at: getCurrentUTCISO(),
  }));

  const { data, error } = await supabase
    .from('my_contents')
    .insert(threadRecords)
    .select();

  if (error) {
    console.error('Database save error:', error);
    throw new Error('Failed to save thread chain to database');
  }

  return data;
}

// Function overloads for postThreadChain
export async function postThreadChain(threads: ThreadContent[]): Promise<ThreadChainResult>;
export async function postThreadChain(threads: ThreadContent[], options: AuthOptions): Promise<ThreadChainResult>;

// Main function to post thread chain immediately
export async function postThreadChain(threads: ThreadContent[], options?: AuthOptions): Promise<ThreadChainResult> {
  try {
    if (!threads || threads.length === 0) {
      throw new Error('Thread chain cannot be empty');
    }

    // Single thread case - process immediately
    if (threads.length === 1) {
      return await postSingleThread(threads[0], options);
    }

    // Multi-thread case - use optimized approach
    return await postThreadChainOptimized(threads, options);

  } catch (error) {
    console.error('Thread chain posting error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Optimized thread chain posting with reduced timeouts
async function postThreadChainOptimized(threads: ThreadContent[], options?: AuthOptions): Promise<ThreadChainResult> {
  const threadIds: string[] = [];
  let parentThreadId = '';

  // Post first thread as regular post with reduced timeout
  const firstThread = threads[0];
  const firstResult = await createThreadsPostOptimized(
    firstThread.content,
    firstThread.media_urls,
    firstThread.media_type,
    options
  );

  if (!firstResult.success) {
    throw new Error('Failed to create first thread');
  }

  threadIds.push(firstResult.threadId);
  parentThreadId = firstResult.threadId;

  // For cron jobs, use queue system for remaining threads
  if (options?.accessToken && options?.selectedSocialId) {
    // This is a cron job - use queue system
    const { ThreadQueue } = await import('@/lib/services/threadQueue');
    const queue = ThreadQueue.getInstance();

    // Get user ID from social account
    const supabase = await createClient();
    const { data: account } = await supabase
      .from('social_accounts')
      .select('user_id')
      .eq('social_id', options.selectedSocialId)
      .single();

    if (account?.user_id && threads.length > 1) {
      await queue.enqueueThreadChain(
        parentThreadId,
        threads.slice(1).map(thread => ({
          content: thread.content,
          mediaUrls: thread.media_urls || [],
          mediaType: thread.media_type || 'TEXT'
        })),
        options.selectedSocialId,
        options.accessToken,
        account.user_id,
        parentThreadId
      );

      // Trigger queue processing in background
      fetch('/api/threads/queue', { method: 'POST' }).catch(console.error);
    }
  } else {
    // Regular user request - process with reduced wait times
    const hasMedia = firstThread.media_urls && firstThread.media_urls.length > 0;
    const waitTime = hasMedia ? 10000 : 2000; // Reduced wait times

    console.log(`Waiting ${waitTime}ms for parent post to be processed...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));

    // Post subsequent threads with reduced delays
    for (let i = 1; i < threads.length; i++) {
      const thread = threads[i];

      if (i > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced delay
      }

      try {
        const replyResult = await createThreadsReplyOptimized(
          thread.content,
          parentThreadId,
          thread.media_urls,
          thread.media_type,
          options
        );

        threadIds.push(replyResult?.id || `reply_${i}`);
      } catch (error) {
        console.error(`Failed to post thread ${i + 1}:`, error);
        threadIds.push(`failed_${i}`);
      }
    }
  }

  // Save to database
  await saveThreadChainToDatabase(threads, threadIds, parentThreadId);

  return {
    success: true,
    parentThreadId,
    threadIds
  };
}

// Single thread posting
async function postSingleThread(thread: ThreadContent, options?: AuthOptions): Promise<ThreadChainResult> {
  const result = await createThreadsPostOptimized(
    thread.content,
    thread.media_urls,
    thread.media_type,
    options
  );

  if (!result.success) {
    throw new Error('Failed to create thread');
  }

  await saveThreadChainToDatabase([thread], [result.threadId], result.threadId);

  return {
    success: true,
    parentThreadId: result.threadId,
    threadIds: [result.threadId]
  };
}

// Schedule thread chain for later posting
export async function scheduleThreadChain(
  threads: ThreadContent[],
  scheduledAt: string
): Promise<ThreadChainResult> {
  try {
    if (!threads || threads.length === 0) {
      throw new Error('Thread chain cannot be empty');
    }

    // Generate a random parent_media_id for scheduling (not posting yet)
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000);
    const parentThreadId = `scheduled_${timestamp}_${randomSuffix}`;

    // Generate placeholder IDs for all threads
    const threadIds = threads.map((_, index) => `${parentThreadId}_thread_${index}`);

    // Save to database with scheduled status (no actual posting)
    await saveThreadChainToDatabase(threads, threadIds, parentThreadId, scheduledAt);

    return {
      success: true,
      parentThreadId,
      threadIds
    };

  } catch (error) {
    console.error('Thread chain scheduling error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Get a specific thread chain by parent_media_id
export async function getThreadChainByParentId(parentMediaId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      throw new Error("로그인이 필요합니다.");
    }

    const supabase = await createClient();
    const userId = session.user.id;

    // Get selected social account
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('selected_social_id')
      .eq('user_id', userId)
      .single();

    const selectedSocialId = profile?.selected_social_id;
    if (!selectedSocialId) {
      throw new Error('선택된 소셜 계정이 없습니다.');
    }

    // Get specific thread chain
    const { data, error } = await supabase
      .from('my_contents')
      .select('*')
      .eq('user_id', userId)
      .eq('social_id', selectedSocialId)
      .eq('is_thread_chain', true)
      .eq('parent_media_id', parentMediaId)
      .order('thread_sequence', { ascending: true });

    if (error) {
      throw error;
    }

    return { data, error: null };

  } catch (error) {
    console.error('Error fetching thread chain:', error);
    return { data: null, error };
  }
}

// Get thread chains for a user
export async function getThreadChains() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      throw new Error("로그인이 필요합니다.");
    }

    const supabase = await createClient();
    const userId = session.user.id;

    // Get selected social account
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('selected_social_id')
      .eq('user_id', userId)
      .single();

    const selectedSocialId = profile?.selected_social_id;
    if (!selectedSocialId) {
      throw new Error('선택된 소셜 계정이 없습니다.');
    }

    // Get all thread chains
    const { data, error: queryError } = await supabase
      .from('my_contents')
      .select('*')
      .eq('user_id', userId)
      .eq('social_id', selectedSocialId)
      .eq('is_thread_chain', true)
      .order('parent_media_id', { ascending: true })
      .order('thread_sequence', { ascending: true });

    if (queryError) {
      throw queryError;
    }

    // Group by parent_media_id
    const threadChains = data.reduce((acc, thread) => {
      const parentId = thread.parent_media_id;
      if (!acc[parentId]) {
        acc[parentId] = [];
      }
      acc[parentId].push(thread);
      return acc;
    }, {} as Record<string, any[]>);

    return { data: threadChains, error: null };

  } catch (error) {
    console.error('Error fetching thread chains:', error);
    return { data: null, error };
  }
}

// Delete a thread chain by parent_media_id
export async function deleteThreadChain(parentMediaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      throw new Error("로그인이 필요합니다.");
    }

    const supabase = await createClient();
    const userId = session.user.id;

    // Get selected social account
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('selected_social_id')
      .eq('user_id', userId)
      .single();

    const selectedSocialId = profile?.selected_social_id;
    if (!selectedSocialId) {
      throw new Error('선택된 소셜 계정이 없습니다.');
    }

    // Delete all threads in the chain
    const { error } = await supabase
      .from('my_contents')
      .delete()
      .eq('user_id', userId)
      .eq('social_id', selectedSocialId)
      .eq('is_thread_chain', true)
      .eq('parent_media_id', parentMediaId);

    if (error) {
      throw error;
    }

    return { success: true };

  } catch (error) {
    console.error('Error deleting thread chain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Update a thread chain
export async function updateThreadChain(
  parentMediaId: string,
  threads: ThreadContent[],
  scheduledAt?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      throw new Error("로그인이 필요합니다.");
    }

    const supabase = await createClient();
    const userId = session.user.id;

    // Get selected social account
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('selected_social_id')
      .eq('user_id', userId)
      .single();

    const selectedSocialId = profile?.selected_social_id;
    if (!selectedSocialId) {
      throw new Error('선택된 소셜 계정이 없습니다.');
    }

    // Get existing thread chain to preserve media_ids
    const { data: existingThreads } = await supabase
      .from('my_contents')
      .select('my_contents_id, media_id, thread_sequence')
      .eq('user_id', userId)
      .eq('social_id', selectedSocialId)
      .eq('is_thread_chain', true)
      .eq('parent_media_id', parentMediaId)
      .order('thread_sequence', { ascending: true });

    // Update existing threads with new content
    const updatePromises = threads.map(async (thread, index) => {
      const existingThread = existingThreads?.[index];

      if (existingThread) {
        // Update existing thread
        return supabase
          .from('my_contents')
          .update({
            content: thread.content,
            media_urls: thread.media_urls || [],
            media_type: thread.media_type || 'TEXT',
            publish_status: scheduledAt ? 'scheduled' : 'draft',
            scheduled_at: scheduledAt,
          })
          .eq('my_contents_id', existingThread.my_contents_id);
      } else {
        // Insert new thread if more threads than before
        return supabase
          .from('my_contents')
          .insert({
            content: thread.content,
            media_urls: thread.media_urls || [],
            media_type: thread.media_type || 'TEXT',
            user_id: userId,
            social_id: selectedSocialId,
            media_id: `${parentMediaId}_thread_${index}`,
            publish_status: scheduledAt ? 'scheduled' : 'draft',
            scheduled_at: scheduledAt,
            parent_media_id: parentMediaId,
            thread_sequence: index,
            is_thread_chain: true,
            created_at: getCurrentUTCISO(),
          });
      }
    });

    // Delete excess threads if new chain is shorter
    if (existingThreads && existingThreads.length > threads.length) {
      const excessThreadIds = existingThreads
        .slice(threads.length)
        .map(t => t.my_contents_id);

      await supabase
        .from('my_contents')
        .delete()
        .in('my_contents_id', excessThreadIds);
    }

    const results = await Promise.all(updatePromises);
    const errors = results.filter(result => result.error);

    if (errors.length > 0) {
      throw new Error(`Failed to update some threads: ${errors.map(e => e.error?.message).join(', ')}`);
    }


    return { success: true };

  } catch (error) {
    console.error('Error updating thread chain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}