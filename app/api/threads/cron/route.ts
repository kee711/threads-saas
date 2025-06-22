import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createThreadsContainer, type PublishPostParams } from '@/app/actions/schedule';

// 배포 시 Vercel의 Cron Job 등에서 매 분 호출하도록 설정
export async function POST() {
  const supabase = await createClient();

  // // 1. ready_to_publish 상태의 미디어 컨테이너 게시 시도
  // const { data: pendings, error: pendingError } = await supabase
  //   .from('my_contents')
  //   .select('id, creation_id, social_id')
  //   .eq('publish_status', 'ready_to_publish')
  //   .lte('created_at', new Date(Date.now() - 30_000).toISOString());

  // if (pendingError) {
  //   console.error('Error fetching ready_to_publish rows:', pendingError);
  // } else if (pendings) {
  //   for (const row of pendings) {
  //     try {
  //       // 소셜 계정 정보 조회
  //       const { data: socialAccount } = await supabase
  //         .from('social_accounts')
  //         .select('access_token')
  //         .eq('social_id', row.social_id)
  //         .single();

  //       if (!socialAccount || !socialAccount.access_token) {
  //         console.error(`소셜 계정 access_token 정보 없음 [${row.id}]`);
  //         await supabase
  //           .from('my_contents')
  //           .update({ publish_status: 'failed' })
  //           .eq('id', row.id);
  //         continue;
  //       }

  //       const publishUrl =
  //         `https://graph.threads.net/v1.0/${row.social_id}/threads_publish` +
  //         `?creation_id=${row.creation_id}&access_token=${socialAccount.access_token}`;
  //       const publishRes = await fetch(publishUrl, { method: 'POST' });
  //       const publishData = await publishRes.json();

  //       if (publishRes.ok) {
  //         await supabase
  //           .from('my_contents')
  //           .update({ publish_status: 'posted' })
  //           .eq('id', row.id);
  //         console.log(`✅ 게시 성공 [${row.id}]`);
  //       } else {
  //         console.error('Failed to publish container:', publishData);
  //         await supabase
  //           .from('my_contents')
  //           .update({ publish_status: 'failed' })
  //           .eq('id', row.id);
  //       }
  //     } catch (err) {
  //       console.error('Error in publishing container:', err);
  //       await supabase
  //         .from('my_contents')
  //         .update({ publish_status: 'failed' })
  //         .eq('id', row.id);
  //     }
  //   }
  // }

  // 2. scheduled 상태의 예약 게시물 처리
  const nowISO = new Date().toISOString();
  const { data: scheduled, error: scheduleError } = await supabase
    .from('my_contents')
    .select('id, content, social_id, user_id, media_type, media_urls')
    .eq('publish_status', 'scheduled')
    .lte('scheduled_at', nowISO);

  if (scheduleError) {
    console.error('Error fetching scheduled posts:', scheduleError);
  } else if (scheduled && scheduled.length > 0) {
    console.log(`🕒 처리할 예약 게시물: ${scheduled.length}개`);

    for (const post of scheduled) {
      try {
        // 해당 소셜 계정 정보로 게시물 처리
        if (post.social_id) {
          // 소셜 계정 정보 조회
          const { data: socialAccount } = await supabase
            .from('social_accounts')
            .select('access_token, social_id')
            .eq('social_id', post.social_id)
            .single();

          if (!socialAccount || !socialAccount.access_token) {
            throw new Error(`소셜 계정 정보를 찾을 수 없음: ${post.social_id}`);
          }

          console.log(`🔄 컨테이너 생성 [${post.id}]: 타입=${post.media_type}, URLs=${post.media_urls?.length || 0}개`);

          const containerResult = await createThreadsContainer(
            socialAccount.social_id,
            socialAccount.access_token,
            {
              content: post.content,
              mediaType: post.media_type,
              media_urls: post.media_urls || []
            }
          );

          console.log(`🔄 컨테이너 생성 [${post.id}]: 타입=${post.media_type}, URLs=${post.media_urls?.length || 0}개`);

          if (!containerResult.success || !containerResult.creationId) {
            throw new Error(containerResult.error || '미디어 컨테이너 생성 실패');
          }

          // 2. 게시 시도
          const publishUrl =
            `https://graph.threads.net/v1.0/${socialAccount.social_id}/threads_publish` +
            `?creation_id=${containerResult.creationId}&access_token=${socialAccount.access_token}`;

          const publishRes = await fetch(publishUrl, { method: 'POST' });
          const publishData = await publishRes.json();

          if (publishRes.ok) {
            // 게시 성공
            await supabase
              .from('my_contents')
              .update({
                publish_status: 'posted',
                media_id: publishData.id || null
              })
              .eq('id', post.id);
            console.log(`✅ 예약 게시 성공 [${post.id}]`);
          } else {
            // 게시 실패 - failed 상태로 변경 (creation_id는 저장하지 않음)
            console.error(`❌ 게시 실패 [${post.id}]:`, publishData.error);
            await supabase
              .from('my_contents')
              .update({
                publish_status: 'failed'
              })
              .eq('id', post.id);
          }
        }
      } catch (err) {
        console.error(`❌ 예약 게시 처리 오류 [${post.id}]:`, err);
        await supabase
          .from('my_contents')
          .update({ publish_status: 'failed' })
          .eq('id', post.id);
      }
    }
  } else {
    console.log('🔍 처리할 예약 게시물이 없습니다.');
  }

  return NextResponse.json({
    success: true,
    processed: {
      // ready_to_publish: pendings?.length || 0,
      scheduled: scheduled?.length || 0
    }
  });
}