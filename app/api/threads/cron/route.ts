import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createThreadsContainer } from '@/app/actions/schedule';

// 배포 시 Vercel의 Cron Job 등에서 매 분 호출하도록 설정
export async function POST() {
  const supabase = await createClient();

  try {
    const nowISO = new Date().toISOString();

    // 🚀 1단계: scheduled → processing (컨테이너 생성)
    const { data: toCreateContainer, error: scheduleError } = await supabase
      .from('my_contents')
      .update({ publish_status: 'processing' })
      .eq('publish_status', 'scheduled')
      .lte('scheduled_at', nowISO)
      .is('creation_id', null)
      .limit(3) // 🎯 한 번에 최대 3개만 처리하여 timeout 방지
      .select('id, content, social_id, media_type, media_urls');

    if (scheduleError) {
      console.error('Error selecting scheduled posts:', scheduleError);
    } else if (toCreateContainer && toCreateContainer.length > 0) {
      console.log(`🎬 컨테이너 생성 시작: ${toCreateContainer.length}개`);

      // 🎯 병렬 처리로 속도 향상하되 제한된 수량으로 timeout 방지
      const containerResults = await Promise.allSettled(
        toCreateContainer.map(async (post) => {
          try {
            console.log(`🔄 컨테이너 생성 시작 [${post.id}]: ${post.media_type}`);

            // 소셜 계정 정보 조회
            const { data: socialAccount } = await supabase
              .from('social_accounts')
              .select('access_token, social_id')
              .eq('social_id', post.social_id)
              .single();

            if (!socialAccount?.access_token) {
              throw new Error(`소셜 계정 정보 없음: ${post.social_id}`);
            }

            // 🎯 직접 함수 호출 (HTTP 요청 대신)
            const containerResult = await createThreadsContainer(
              socialAccount.social_id,
              socialAccount.access_token,
              {
                content: post.content,
                mediaType: post.media_type,
                media_urls: post.media_urls || []
              }
            );

            if (containerResult.success && containerResult.creationId) {
              // 성공: creation_id 저장하고 ready_to_publish 상태로 변경
              await supabase
                .from('my_contents')
                .update({
                  creation_id: containerResult.creationId,
                  publish_status: 'ready_to_publish'
                })
                .eq('id', post.id);

              console.log(`✅ 컨테이너 생성 완료 [${post.id}]: ${containerResult.creationId}`);
              return { success: true, postId: post.id };
            } else {
              throw new Error(`컨테이너 생성 실패: ${containerResult.error}`);
            }
          } catch (error) {
            console.error(`❌ 컨테이너 생성 오류 [${post.id}]:`, error);
            // 실패시 scheduled로 되돌리기
            await supabase
              .from('my_contents')
              .update({ publish_status: 'scheduled' })
              .eq('id', post.id);
            return { success: false, postId: post.id, error };
          }
        })
      );

      const successful = containerResults.filter(result =>
        result.status === 'fulfilled' && result.value.success
      ).length;

      console.log(`✅ 컨테이너 생성 완료: ${successful}/${toCreateContainer.length}개`);
    }

    // 🚀 2단계: ready_to_publish → posted (30초 경과 후 게시)
    const { data: readyToPush, error: readyError } = await supabase
      .from('my_contents')
      .select('id, creation_id, social_id, created_at')
      .eq('publish_status', 'ready_to_publish')
      .lt('created_at', new Date(Date.now() - 30000).toISOString()); // 30초 경과

    if (readyError) {
      console.error('Error fetching ready posts:', readyError);
    } else if (readyToPush && readyToPush.length > 0) {
      console.log(`📤 게시 처리: ${readyToPush.length}개`);

      // 게시는 빠르므로 병렬 처리
      await Promise.allSettled(readyToPush.map(async (post) => {
        try {
          // 소셜 계정 정보 조회
          const { data: socialAccount } = await supabase
            .from('social_accounts')
            .select('access_token')
            .eq('social_id', post.social_id)
            .single();

          if (!socialAccount?.access_token) {
            throw new Error(`소셜 계정 정보 없음: ${post.social_id}`);
          }

          // 게시 요청
          const publishUrl =
            `https://graph.threads.net/v1.0/${post.social_id}/threads_publish` +
            `?creation_id=${post.creation_id}&access_token=${socialAccount.access_token}`;

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
            console.log(`✅ 게시 성공 [${post.id}]`);
          } else {
            // 게시 실패 - scheduled로 되돌려서 재시도
            console.error(`❌ 게시 실패 [${post.id}]:`, publishData);
            await supabase
              .from('my_contents')
              .update({
                publish_status: 'scheduled',
                creation_id: null  // 컨테이너도 다시 생성하게 함
              })
              .eq('id', post.id);
          }
        } catch (err) {
          console.error(`❌ 게시 처리 오류 [${post.id}]:`, err);
          // 오류 발생시 scheduled로 되돌리기
          await supabase
            .from('my_contents')
            .update({
              publish_status: 'scheduled',
              creation_id: null
            })
            .eq('id', post.id);
        }
      }));
    }

    // 🧹 3단계: 5분 이상 processing 상태로 머물러 있는 stale 게시물 정리
    const staleTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: staleData } = await supabase
      .from('my_contents')
      .update({
        publish_status: 'scheduled',
        creation_id: null
      })
      .eq('publish_status', 'processing')
      .lt('created_at', staleTime)
      .select('id');

    if (staleData && staleData.length > 0) {
      console.log(`🧹 Stale 게시물 정리: ${staleData.length}개`);
    }

    return NextResponse.json({
      success: true,
      processed: {
        containerCreated: toCreateContainer?.length || 0,
        published: readyToPush?.length || 0,
        cleaned: staleData?.length || 0
      },
      note: "직접 함수 호출 + 병렬 처리로 최적화"
    });

  } catch (error) {
    console.error('Cron job 실행 오류:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}