import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { postThreadChain, ThreadContent } from '@/app/actions/threadChain';
import { getCurrentUTCISO } from '@/lib/utils/time';

// Helper function to fetch access tokens by social_id
async function getAccessTokenBySocialId(socialId: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data: account, error } = await supabase
    .from('social_accounts')
    .select('access_token')
    .eq('social_id', socialId)
    .eq('platform', 'threads')
    .eq('is_active', true)
    .single();

  if (error) {
    console.error(`Error fetching access token for social_id ${socialId}:`, error);
    return null;
  }

  return account?.access_token || null;
}

// Helper function to rebuild thread chains from database records
function rebuildThreadChains(records: any[]): Record<string, ThreadContent[]> {
  const threadChains: Record<string, ThreadContent[]> = {};
  
  records.forEach(record => {
    const parentId = record.parent_media_id;
    if (!threadChains[parentId]) {
      threadChains[parentId] = [];
    }
    
    threadChains[parentId].push({
      content: record.content,
      media_urls: record.media_urls || [],
      media_type: record.media_type || 'TEXT'
    });
  });
  
  // Sort each thread chain by thread_sequence
  Object.keys(threadChains).forEach(parentId => {
    threadChains[parentId].sort((a, b) => {
      const aRecord = records.find(r => r.parent_media_id === parentId && r.content === a.content);
      const bRecord = records.find(r => r.parent_media_id === parentId && r.content === b.content);
      return (aRecord?.thread_sequence || 0) - (bRecord?.thread_sequence || 0);
    });
  });
  
  return threadChains;
}

// 배포 시 Vercel의 Cron Job 등에서 매 분 호출하도록 설정
export async function POST() {
  const supabase = await createClient();

  try {
    const nowISO = getCurrentUTCISO();

    // 🚀 1단계: Get scheduled thread chains and single posts
    const { data: scheduledList, error: scheduleError } = await supabase
      .from('my_contents')
      .select('my_contents_id, content, social_id, media_type, media_urls, is_thread_chain, parent_media_id, thread_sequence')
      .eq('publish_status', 'scheduled')
      .lte('scheduled_at', nowISO)
      .order('parent_media_id', { ascending: true })
      .order('thread_sequence', { ascending: true });

    if (scheduleError) {
      console.error('Error selecting scheduled posts:', scheduleError);
      return NextResponse.json({ error: 'Failed to fetch scheduled posts' }, { status: 500 });
    }

    if (!scheduledList || scheduledList.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No scheduled posts to process"
      });
    }

    console.log(`🎬 [CRON] Processing ${scheduledList.length} scheduled items at ${nowISO}`);

    // Separate thread chains from single posts
    const threadChainRecords = scheduledList.filter(post => post.is_thread_chain);
    const singlePosts = scheduledList.filter(post => !post.is_thread_chain);

    let processedCount = 0;
    const results = [];

    // Process thread chains
    if (threadChainRecords.length > 0) {
      const threadChains = rebuildThreadChains(threadChainRecords);
      console.log(`🔗 [CRON] Found ${Object.keys(threadChains).length} thread chains to process`);
      
      for (const [parentId, threadChain] of Object.entries(threadChains)) {
        try {
          console.log(`🔄 [CRON] Processing thread chain [${parentId}] with ${threadChain.length} threads`);

          // Get social_id from the first record of this chain
          const chainRecord = threadChainRecords.find(r => r.parent_media_id === parentId);
          const socialId = chainRecord?.social_id;
          
          if (!socialId) {
            throw new Error(`No social_id found for thread chain ${parentId}`);
          }

          // Fetch access token for this social account
          const accessToken = await getAccessTokenBySocialId(socialId);
          if (!accessToken) {
            throw new Error(`No access token found for social_id ${socialId}`);
          }

          // Use existing postThreadChain function with auth options
          const threadChainResult = await (postThreadChain as any)(
            threadChain, 
            { accessToken, selectedSocialId: socialId }
          );

          if (threadChainResult.success) {
            console.log(`✅ [CRON] Thread chain posted successfully: ${threadChainResult.parentThreadId}`);
            
            // Update all threads in this chain to 'posted' status
            const chainRecords = threadChainRecords.filter(r => r.parent_media_id === parentId);
            await Promise.all(
              chainRecords.map(async (record, index) => {
                await supabase
                  .from('my_contents')
                  .update({
                    publish_status: 'posted',
                    media_id: threadChainResult.threadIds?.[index] || threadChainResult.parentThreadId
                  })
                  .eq('my_contents_id', record.my_contents_id);
              })
            );
            
            processedCount += chainRecords.length;
            results.push({ type: 'thread_chain', parentId, success: true });
          } else {
            console.error(`❌ [CRON] Thread chain posting failed [${parentId}]:`, threadChainResult.error);
            
            // Update all threads in this chain to 'failed' status
            const chainRecords = threadChainRecords.filter(r => r.parent_media_id === parentId);
            await Promise.all(
              chainRecords.map(async (record) => {
                await supabase
                  .from('my_contents')
                  .update({
                    publish_status: 'failed'
                  })
                  .eq('my_contents_id', record.my_contents_id);
              })
            );
            
            results.push({ type: 'thread_chain', parentId, success: false, error: threadChainResult.error });
          }
        } catch (error) {
          console.error(`❌ [CRON] Thread chain processing error [${parentId}]:`, error);
          
          // Update all threads in this chain to 'failed' status on exception
          const chainRecords = threadChainRecords.filter(r => r.parent_media_id === parentId);
          await Promise.all(
            chainRecords.map(async (record) => {
              await supabase
                .from('my_contents')
                .update({
                  publish_status: 'failed'
                })
                .eq('my_contents_id', record.my_contents_id);
            })
          );
          
          results.push({ type: 'thread_chain', parentId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
    }

    // Process single posts
    if (singlePosts.length > 0) {
      console.log(`📄 [CRON] Found ${singlePosts.length} single posts to process`);
    }
    
    for (const post of singlePosts) {
      try {
        console.log(`🔄 [CRON] Processing single post [${post.my_contents_id}]: ${post.media_type}`);

        // Fetch access token for this social account
        const accessToken = await getAccessTokenBySocialId(post.social_id);
        if (!accessToken) {
          throw new Error(`No access token found for social_id ${post.social_id}`);
        }

        // Use existing postThreadChain function with single thread and auth options
        const threadChainResult = await (postThreadChain as any)(
          [
            {
              content: post.content,
              media_urls: post.media_urls || [],
              media_type: post.media_type || 'TEXT'
            }
          ], 
          { accessToken, selectedSocialId: post.social_id }
        );

        if (threadChainResult.success) {
          console.log(`✅ [CRON] Single post published successfully: ${threadChainResult.parentThreadId}`);
          
          await supabase
            .from('my_contents')
            .update({
              publish_status: 'posted',
              media_id: threadChainResult.parentThreadId || null
            })
            .eq('my_contents_id', post.my_contents_id);
          
          processedCount++;
          results.push({ type: 'single_post', postId: post.my_contents_id, success: true });
        } else {
          console.error(`❌ [CRON] Single post publishing failed [${post.my_contents_id}]:`, threadChainResult.error);
          
          // Update single post to 'failed' status
          await supabase
            .from('my_contents')
            .update({
              publish_status: 'failed'
            })
            .eq('my_contents_id', post.my_contents_id);
          
          results.push({ type: 'single_post', postId: post.my_contents_id, success: false, error: threadChainResult.error });
        }
      } catch (error) {
        console.error(`❌ [CRON] Single post processing error [${post.my_contents_id}]:`, error);
        
        // Update single post to 'failed' status on exception
        await supabase
          .from('my_contents')
          .update({
            publish_status: 'failed'
          })
          .eq('my_contents_id', post.my_contents_id);
        
        results.push({ type: 'single_post', postId: post.my_contents_id, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`🎯 [CRON] Job completed - Success: ${successCount}, Failed: ${failureCount}, Total processed: ${processedCount}`);
    
    return NextResponse.json({
      success: true,
      processed: processedCount,
      results,
      stats: {
        success: successCount,
        failed: failureCount,
        total: results.length
      },
      message: `Cron job completed successfully. Processed ${processedCount} items.`
    });

  } catch (error) {
    console.error('❌ [CRON] Job execution error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}