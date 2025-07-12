import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { postThreadChain, ThreadContent } from '@/app/actions/threadChain';
import { getCurrentUTCISO } from '@/lib/utils/time';

// Helper function to fetch access tokens by social_id
async function getAccessTokenBySocialId(socialId: string): Promise<string | null> {
  console.log(`🔐 [route.ts:getAccessTokenBySocialId:7] Starting access token retrieval for socialId: ${socialId}`);
  console.log(`🔐 [route.ts:getAccessTokenBySocialId:8] Creating Supabase client`);
  const supabase = await createClient();

  console.log(`🔐 [route.ts:getAccessTokenBySocialId:11] Querying social_accounts table`);
  const { data: account, error } = await supabase
    .from('social_accounts')
    .select('access_token')
    .eq('social_id', socialId)
    .eq('platform', 'threads')
    .eq('is_active', true)
    .single();

  if (error) {
    console.error(`❌ [route.ts:getAccessTokenBySocialId:20] Error fetching access token:`, {
      socialId,
      error,
      errorCode: error.code,
      errorMessage: error.message
    });
    return null;
  }

  console.log(`🔐 [route.ts:getAccessTokenBySocialId:28] Access token query result:`, {
    socialId,
    hasAccount: !!account,
    hasToken: !!account?.access_token
  });

  return account?.access_token || null;
}

// Helper function to rebuild thread chains from database records
function rebuildThreadChains(records: any[]): Record<string, ThreadContent[]> {
  console.log(`🔗 [route.ts:rebuildThreadChains:27] Starting thread chain rebuild`);
  console.log(`🔗 [route.ts:rebuildThreadChains:28] Input records count: ${records.length}`);

  const threadChains: Record<string, ThreadContent[]> = {};

  console.log(`🔗 [route.ts:rebuildThreadChains:32] Processing records to group by parent_media_id`);
  records.forEach((record, index) => {
    const parentId = record.parent_media_id;
    console.log(`🔗 [route.ts:rebuildThreadChains:35] Processing record ${index + 1}/${records.length}:`, {
      parentId,
      contentLength: record.content?.length || 0,
      mediaType: record.media_type,
      threadSequence: record.thread_sequence,
      mediaUrlsCount: record.media_urls?.length || 0
    });

    if (!threadChains[parentId]) {
      threadChains[parentId] = [];
      console.log(`🔗 [route.ts:rebuildThreadChains:44] Created new thread chain for parentId: ${parentId}`);
    }

    threadChains[parentId].push({
      content: record.content,
      media_urls: record.media_urls || [],
      media_type: record.media_type || 'TEXT'
    });
  });

  console.log(`🔗 [route.ts:rebuildThreadChains:53] Grouping completed. Found ${Object.keys(threadChains).length} thread chains`);

  // Sort each thread chain by thread_sequence
  console.log(`🔗 [route.ts:rebuildThreadChains:56] Sorting thread chains by sequence`);
  Object.keys(threadChains).forEach(parentId => {
    const chainLength = threadChains[parentId].length;
    console.log(`🔗 [route.ts:rebuildThreadChains:59] Sorting chain ${parentId} with ${chainLength} threads`);

    threadChains[parentId].sort((a, b) => {
      const aRecord = records.find(r => r.parent_media_id === parentId && r.content === a.content);
      const bRecord = records.find(r => r.parent_media_id === parentId && r.content === b.content);
      const aSequence = aRecord?.thread_sequence || 0;
      const bSequence = bRecord?.thread_sequence || 0;

      console.log(`🔗 [route.ts:rebuildThreadChains:66] Sorting threads:`, {
        parentId,
        aSequence,
        bSequence,
        comparison: aSequence - bSequence
      });

      return aSequence - bSequence;
    });

    console.log(`🔗 [route.ts:rebuildThreadChains:76] Chain ${parentId} sorted with sequences:`,
      threadChains[parentId].map((_, i) => {
        const record = records.find(r => r.parent_media_id === parentId && r.content === threadChains[parentId][i].content);
        return record?.thread_sequence || 0;
      })
    );
  });

  console.log(`✅ [route.ts:rebuildThreadChains:84] Thread chain rebuild completed:`, {
    totalChains: Object.keys(threadChains).length,
    chainSummary: Object.keys(threadChains).map(parentId => ({
      parentId,
      threadCount: threadChains[parentId].length
    }))
  });

  return threadChains;
}

// 배포 시 Vercel의 Cron Job 등에서 매 분 호출하도록 설정
export async function POST() {
  console.log(`🚀 [route.ts:POST:95] Starting CRON job execution`);
  console.log(`🚀 [route.ts:POST:96] Creating Supabase client`);
  const supabase = await createClient();

  try {
    console.log(`🕐 [route.ts:POST:100] Getting current UTC time`);
    const nowISO = getCurrentUTCISO();
    console.log(`🕐 [route.ts:POST:102] Current time: ${nowISO}`);

    // 🚀 1단계: Get scheduled thread chains and single posts
    console.log(`📋 [route.ts:POST:105] Querying scheduled posts from my_contents table`);
    const { data: scheduledList, error: scheduleError } = await supabase
      .from('my_contents')
      .select('my_contents_id, content, social_id, media_type, media_urls, is_thread_chain, parent_media_id, thread_sequence')
      .eq('publish_status', 'scheduled')
      .lte('scheduled_at', nowISO)
      .order('parent_media_id', { ascending: true })
      .order('thread_sequence', { ascending: true });

    console.log(`📋 [route.ts:POST:114] Database query completed:`, {
      hasError: !!scheduleError,
      hasData: !!scheduledList,
      itemCount: scheduledList?.length || 0,
      queryTime: nowISO
    });

    if (scheduleError) {
      console.error(`❌ [route.ts:POST:121] Error selecting scheduled posts:`, scheduleError);
      return NextResponse.json({ error: 'Failed to fetch scheduled posts' }, { status: 500 });
    }

    if (!scheduledList || scheduledList.length === 0) {
      console.log(`✅ [route.ts:POST:126] No scheduled posts to process at ${nowISO}`);
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No scheduled posts to process"
      });
    }

    console.log(`🎬 [route.ts:POST:134] Processing ${scheduledList.length} scheduled items at ${nowISO}`);
    console.log(`🎬 [route.ts:POST:135] Scheduled items details:`, scheduledList.map(item => ({
      id: item.my_contents_id,
      isThreadChain: item.is_thread_chain,
      parentMediaId: item.parent_media_id,
      threadSequence: item.thread_sequence,
      mediaType: item.media_type,
      socialId: item.social_id,
      contentLength: item.content?.length || 0
    })));

    // Separate thread chains from single posts
    console.log(`🔄 [route.ts:POST:146] Separating thread chains from single posts`);
    const threadChainRecords = scheduledList.filter(post => post.is_thread_chain);
    const singlePosts = scheduledList.filter(post => !post.is_thread_chain);

    console.log(`🔄 [route.ts:POST:150] Separation completed:`, {
      threadChainRecords: threadChainRecords.length,
      singlePosts: singlePosts.length,
      total: scheduledList.length
    });

    let processedCount = 0;
    const results = [];

    // Process thread chains
    if (threadChainRecords.length > 0) {
      console.log(`🔗 [route.ts:POST:160] Found ${threadChainRecords.length} thread chain records to process`);
      console.log(`🔗 [route.ts:POST:161] Rebuilding thread chains from records`);
      const threadChains = rebuildThreadChains(threadChainRecords);
      console.log(`🔗 [route.ts:POST:163] Found ${Object.keys(threadChains).length} thread chains to process`);

      for (const [parentId, threadChain] of Object.entries(threadChains)) {
        const chainIndex = Object.keys(threadChains).indexOf(parentId) + 1;
        const totalChains = Object.keys(threadChains).length;

        console.log(`🔄 [route.ts:POST:169] Processing thread chain ${chainIndex}/${totalChains} [${parentId}]`);
        console.log(`🔄 [route.ts:POST:170] Chain details:`, {
          parentId,
          threadCount: threadChain.length,
          threads: threadChain.map((thread, i) => ({
            sequence: i,
            contentLength: thread.content.length,
            mediaType: thread.media_type,
            mediaUrlsCount: thread.media_urls?.length || 0
          }))
        });

        try {
          // Get social_id from the first record of this chain
          console.log(`🔍 [route.ts:POST:182] Finding social_id for thread chain ${parentId}`);
          const chainRecord = threadChainRecords.find(r => r.parent_media_id === parentId);
          const socialId = chainRecord?.social_id;

          console.log(`🔍 [route.ts:POST:186] Chain record lookup result:`, {
            parentId,
            hasChainRecord: !!chainRecord,
            socialId,
            recordId: chainRecord?.my_contents_id
          });

          if (!socialId) {
            throw new Error(`No social_id found for thread chain ${parentId}`);
          }

          // Fetch access token for this social account
          console.log(`🔐 [route.ts:POST:197] Fetching access token for socialId: ${socialId}`);
          const accessToken = await getAccessTokenBySocialId(socialId);
          console.log(`🔐 [route.ts:POST:199] Access token fetch result:`, {
            socialId,
            hasToken: !!accessToken,
            tokenLength: accessToken?.length || 0
          });

          if (!accessToken) {
            throw new Error(`No access token found for social_id ${socialId}`);
          }

          // Use existing postThreadChain function with auth options
          console.log(`🚀 [route.ts:POST:209] Calling postThreadChain function`);
          console.log(`🚀 [route.ts:POST:210] PostThreadChain parameters:`, {
            threadChainLength: threadChain.length,
            socialId,
            hasAccessToken: !!accessToken
          });

          const threadChainResult = await (postThreadChain as any)(
            threadChain,
            { accessToken, selectedSocialId: socialId }
          );

          console.log(`🚀 [route.ts:POST:220] PostThreadChain result:`, {
            parentId,
            success: threadChainResult.success,
            hasParentThreadId: !!threadChainResult.parentThreadId,
            threadIdsCount: threadChainResult.threadIds?.length || 0,
            hasError: !!threadChainResult.error
          });

          if (threadChainResult.success) {
            console.log(`✅ [route.ts:POST:230] Thread chain posted successfully:`, {
              parentId,
              parentThreadId: threadChainResult.parentThreadId,
              threadIds: threadChainResult.threadIds
            });

            // Update all threads in this chain to 'posted' status
            console.log(`📝 [route.ts:POST:237] Updating chain records to 'posted' status`);
            const chainRecords = threadChainRecords.filter(r => r.parent_media_id === parentId);
            console.log(`📝 [route.ts:POST:239] Found ${chainRecords.length} records to update for chain ${parentId}`);

            await Promise.all(
              chainRecords.map(async (record, index) => {
                const mediaId = threadChainResult.threadIds?.[index] || threadChainResult.parentThreadId;
                console.log(`📝 [route.ts:POST:244] Updating record ${index + 1}/${chainRecords.length}:`, {
                  recordId: record.my_contents_id,
                  mediaId,
                  threadSequence: record.thread_sequence
                });

                await supabase
                  .from('my_contents')
                  .update({
                    publish_status: 'posted',
                    media_id: mediaId
                  })
                  .eq('my_contents_id', record.my_contents_id);
              })
            );

            console.log(`📝 [route.ts:POST:259] All ${chainRecords.length} records updated successfully`);
            processedCount += chainRecords.length;
            results.push({ type: 'thread_chain', parentId, success: true });
          } else {
            console.error(`❌ [route.ts:POST:264] Thread chain posting failed:`, {
              parentId,
              error: threadChainResult.error,
              threadChainLength: threadChain.length
            });

            // Update all threads in this chain to 'failed' status
            console.log(`📝 [route.ts:POST:271] Updating chain records to 'failed' status`);
            const chainRecords = threadChainRecords.filter(r => r.parent_media_id === parentId);
            console.log(`📝 [route.ts:POST:273] Found ${chainRecords.length} records to mark as failed`);

            await Promise.all(
              chainRecords.map(async (record, index) => {
                console.log(`📝 [route.ts:POST:277] Marking record ${index + 1}/${chainRecords.length} as failed:`, {
                  recordId: record.my_contents_id,
                  threadSequence: record.thread_sequence
                });

                await supabase
                  .from('my_contents')
                  .update({
                    publish_status: 'failed'
                  })
                  .eq('my_contents_id', record.my_contents_id);
              })
            );

            console.log(`📝 [route.ts:POST:291] All ${chainRecords.length} records marked as failed`);
            results.push({ type: 'thread_chain', parentId, success: false, error: threadChainResult.error });
          }
        } catch (error) {
          console.error(`❌ [route.ts:POST:295] Thread chain processing exception:`, {
            parentId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            chainIndex,
            totalChains
          });

          // Update all threads in this chain to 'failed' status on exception
          console.log(`📝 [route.ts:POST:304] Handling exception - updating records to 'failed'`);
          const chainRecords = threadChainRecords.filter(r => r.parent_media_id === parentId);
          console.log(`📝 [route.ts:POST:306] Found ${chainRecords.length} records to mark as failed due to exception`);

          await Promise.all(
            chainRecords.map(async (record, index) => {
              console.log(`📝 [route.ts:POST:310] Exception handling - marking record ${index + 1}/${chainRecords.length} as failed:`, {
                recordId: record.my_contents_id,
                threadSequence: record.thread_sequence
              });

              await supabase
                .from('my_contents')
                .update({
                  publish_status: 'failed'
                })
                .eq('my_contents_id', record.my_contents_id);
            })
          );

          console.log(`📝 [route.ts:POST:324] Exception handling completed for chain ${parentId}`);
          results.push({ type: 'thread_chain', parentId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      console.log(`🏁 [route.ts:POST:328] Thread chain processing completed`);
    }

    // Process single posts
    if (singlePosts.length > 0) {
      console.log(`📄 [route.ts:POST:331] Found ${singlePosts.length} single posts to process`);
      console.log(`📄 [route.ts:POST:332] Single posts details:`, singlePosts.map((post, i) => ({
        index: i + 1,
        postId: post.my_contents_id,
        mediaType: post.media_type,
        socialId: post.social_id,
        contentLength: post.content?.length || 0,
        mediaUrlsCount: post.media_urls?.length || 0
      })));
    } else {
      console.log(`📄 [route.ts:POST:341] No single posts to process`);
    }

    for (const post of singlePosts) {
      const postIndex = singlePosts.indexOf(post) + 1;
      const totalPosts = singlePosts.length;

      console.log(`🔄 [route.ts:POST:347] Processing single post ${postIndex}/${totalPosts}`);
      console.log(`🔄 [route.ts:POST:348] Post details:`, {
        postId: post.my_contents_id,
        mediaType: post.media_type,
        socialId: post.social_id,
        contentLength: post.content?.length || 0,
        mediaUrlsCount: post.media_urls?.length || 0
      });

      try {
        // Fetch access token for this social account
        console.log(`🔐 [route.ts:POST:358] Fetching access token for single post`);
        const accessToken = await getAccessTokenBySocialId(post.social_id);
        console.log(`🔐 [route.ts:POST:360] Access token fetch result:`, {
          postId: post.my_contents_id,
          socialId: post.social_id,
          hasToken: !!accessToken,
          tokenLength: accessToken?.length || 0
        });

        if (!accessToken) {
          throw new Error(`No access token found for social_id ${post.social_id}`);
        }

        // Use existing postThreadChain function with single thread and auth options
        console.log(`🚀 [route.ts:POST:371] Calling postThreadChain for single post`);
        const singleThreadContent = {
          content: post.content,
          media_urls: post.media_urls || [],
          media_type: post.media_type || 'TEXT'
        };

        console.log(`🚀 [route.ts:POST:378] Single thread content:`, {
          contentLength: singleThreadContent.content.length,
          mediaUrlsCount: singleThreadContent.media_urls.length,
          mediaType: singleThreadContent.media_type
        });

        const threadChainResult = await (postThreadChain as any)(
          [singleThreadContent],
          { accessToken, selectedSocialId: post.social_id }
        );

        console.log(`🚀 [route.ts:POST:388] PostThreadChain result for single post:`, {
          postId: post.my_contents_id,
          success: threadChainResult.success,
          hasParentThreadId: !!threadChainResult.parentThreadId,
          hasError: !!threadChainResult.error
        });

        if (threadChainResult.success) {
          console.log(`✅ [route.ts:POST:397] Single post published successfully:`, {
            postId: post.my_contents_id,
            parentThreadId: threadChainResult.parentThreadId,
            postIndex,
            totalPosts
          });

          console.log(`📝 [route.ts:POST:404] Updating single post to 'posted' status`);
          await supabase
            .from('my_contents')
            .update({
              publish_status: 'posted',
              media_id: threadChainResult.parentThreadId || null
            })
            .eq('my_contents_id', post.my_contents_id);

          console.log(`📝 [route.ts:POST:413] Single post update completed successfully`);
          processedCount++;
          results.push({ type: 'single_post', postId: post.my_contents_id, success: true });
        } else {
          console.error(`❌ [route.ts:POST:417] Single post publishing failed:`, {
            postId: post.my_contents_id,
            error: threadChainResult.error,
            postIndex,
            totalPosts
          });

          // Update single post to 'failed' status
          console.log(`📝 [route.ts:POST:425] Updating single post to 'failed' status`);
          await supabase
            .from('my_contents')
            .update({
              publish_status: 'failed'
            })
            .eq('my_contents_id', post.my_contents_id);

          console.log(`📝 [route.ts:POST:433] Single post failure update completed`);
          results.push({ type: 'single_post', postId: post.my_contents_id, success: false, error: threadChainResult.error });
        }
      } catch (error) {
        console.error(`❌ [route.ts:POST:437] Single post processing exception:`, {
          postId: post.my_contents_id,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          postIndex,
          totalPosts
        });

        // Update single post to 'failed' status on exception
        console.log(`📝 [route.ts:POST:446] Exception handling - updating single post to 'failed'`);
        await supabase
          .from('my_contents')
          .update({
            publish_status: 'failed'
          })
          .eq('my_contents_id', post.my_contents_id);

        console.log(`📝 [route.ts:POST:454] Exception handling completed for single post`);
        results.push({ type: 'single_post', postId: post.my_contents_id, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    console.log(`🏁 [route.ts:POST:458] Single post processing completed`);

    console.log(`📊 [route.ts:POST:489] Calculating final statistics`);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`🎯 [route.ts:POST:493] CRON job completed successfully:`, {
      successCount,
      failureCount,
      totalProcessed: processedCount,
      totalResults: results.length,
      successRate: results.length > 0 ? `${((successCount / results.length) * 100).toFixed(1)}%` : '0%',
      completionTime: getCurrentUTCISO()
    });

    console.log(`📤 [route.ts:POST:502] Preparing successful response`);
    const response = {
      success: true,
      processed: processedCount,
      results,
      stats: {
        success: successCount,
        failed: failureCount,
        total: results.length
      },
      message: `Cron job completed successfully. Processed ${processedCount} items.`
    };

    console.log(`📤 [route.ts:POST:514] Returning successful response:`, {
      processed: response.processed,
      statsTotal: response.stats.total,
      success: response.success
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error(`❌ [route.ts:POST:495] CRON job execution error:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: typeof error,
      timestamp: getCurrentUTCISO()
    });

    console.log(`❌ [route.ts:POST:503] Returning error response`);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
  console.log(`🏁 [route.ts:POST:509] CRON job function completed`);
}