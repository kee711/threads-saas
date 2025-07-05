'use server';

import { createClient } from '@/lib/supabase/server';
import { authOptions } from "@/lib/auth/authOptions";
import { getServerSession } from "next-auth/next";
import axios from 'axios';
import { postComment } from './comment';

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

// Get Threads access token (copied from comment.ts)
async function getThreadsAccessToken() {
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

  const accessToken = account?.access_token;
  if (!accessToken) {
    throw new Error('Threads access token이 없습니다.');
  }
  return { accessToken, selectedSocialId };
}

// Create a regular Threads post
async function createThreadsPost(content: string, mediaUrls?: string[], mediaType?: string) {
  const { accessToken, selectedSocialId } = await getThreadsAccessToken();
  
  const apiUrl = 'https://graph.threads.net/v1.0/me/threads';
  
  try {
    // Create media container
    const payload = new URLSearchParams({
      media_type: mediaType || 'TEXT',
      text: content,
      access_token: accessToken,
    });

    // Add media URLs if provided
    if (mediaUrls && mediaUrls.length > 0) {
      // For now, handle single image - extend later for carousel
      if (mediaUrls.length === 1) {
        payload.append('image_url', mediaUrls[0]);
      }
    }

    const createResponse = await axios.post(apiUrl, payload);

    if (createResponse.status === 200) {
      const mediaContainerId = createResponse.data.id;
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
          const publishResponse = await axios.post(publishUrl, publishParams);

          if (publishResponse.status === 200) {
            console.log('Thread published successfully!');
            return {
              success: true,
              threadId: publishResponse.data.id,
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
    } else {
      throw new Error('Failed to create thread container.');
    }
  } catch (error) {
    console.error('Error creating thread:', error);
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
    parent_thread_id: parentThreadId,
    thread_sequence: index,
    is_thread_chain: true,
    created_at: new Date().toISOString(),
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

// Main function to post thread chain immediately
export async function postThreadChain(threads: ThreadContent[]): Promise<ThreadChainResult> {
  try {
    if (!threads || threads.length === 0) {
      throw new Error('Thread chain cannot be empty');
    }

    const threadIds: string[] = [];
    let parentThreadId = '';

    // Post first thread as regular post
    const firstThread = threads[0];
    const firstResult = await createThreadsPost(
      firstThread.content,
      firstThread.media_urls,
      firstThread.media_type
    );

    if (!firstResult.success) {
      throw new Error('Failed to create first thread');
    }

    threadIds.push(firstResult.threadId);
    parentThreadId = firstResult.threadId;

    // Post subsequent threads as replies
    for (let i = 1; i < threads.length; i++) {
      const thread = threads[i];
      
      // Add delay between posts to avoid rate limiting
      if (i > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }

      try {
        const replyResult = await postComment({
          media_type: thread.media_type || 'TEXT_POST',
          text: thread.content,
          reply_to_id: parentThreadId
        });

        // Extract thread ID from reply result if available
        threadIds.push(replyResult?.id || `reply_${i}`);
      } catch (error) {
        console.error(`Failed to post thread ${i + 1}:`, error);
        // Continue with next thread even if one fails
        threadIds.push(`failed_${i}`);
      }
    }

    // Save to database
    await saveThreadChainToDatabase(threads, threadIds, parentThreadId);

    return {
      success: true,
      parentThreadId,
      threadIds
    };

  } catch (error) {
    console.error('Thread chain posting error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
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

    // For scheduling, we save to database with scheduled status
    // The actual posting will be handled by a background job
    const tempThreadIds = threads.map((_, index) => `scheduled_${index}_${Date.now()}`);
    const tempParentId = `scheduled_parent_${Date.now()}`;

    await saveThreadChainToDatabase(threads, tempThreadIds, tempParentId, scheduledAt);

    return {
      success: true,
      parentThreadId: tempParentId,
      threadIds: tempThreadIds
    };

  } catch (error) {
    console.error('Thread chain scheduling error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
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
    const { data, error } = await supabase
      .from('my_contents')
      .select('*')
      .eq('user_id', userId)
      .eq('social_id', selectedSocialId)
      .eq('is_thread_chain', true)
      .order('parent_thread_id', { ascending: true })
      .order('thread_sequence', { ascending: true });

    if (error) {
      throw error;
    }

    // Group by parent_thread_id
    const threadChains = data.reduce((acc, thread) => {
      const parentId = thread.parent_thread_id;
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