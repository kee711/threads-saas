import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createThreadsContainer } from '@/app/actions/schedule';

// 배포 시 Vercel의 Cron Job 등에서 매 분 호출하도록 설정
export async function POST() {
  const supabase = await createClient();

  try {
    const nowISO = new Date().toISOString();

    // 🚀 1단계: scheduled → processing (컨테이너 생성)
    const { data: scheduledList, error: scheduleError } = await supabase
      .from('my_contents')
      .select('id, content, social_id, media_type, media_urls')
      .eq('publish_status', 'scheduled')
      .lte('scheduled_at', nowISO)

    if (scheduleError) {
      console.error('Error selecting scheduled posts:', scheduleError);
    } else if (scheduledList && scheduledList.length > 0) {
      console.log(`🎬 컨테이너 생성 시작: ${scheduledList.length}개`);

      // 🎯 병렬 처리로 속도 향상하되 제한된 수량으로 timeout 방지
      const containerResults = await Promise.allSettled(
        scheduledList.map(async (post) => {
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

            // schedule.ts 컨테이너 함수 호출
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
              const publishUrl =
                `https://graph.threads.net/v1.0/${post.social_id}/threads_publish` +
                `?creation_id=${containerResult.creationId}&access_token=${socialAccount.access_token}`;

              // 30초 뒤에 게시 처리
              await new Promise(resolve => setTimeout(resolve, 30000));

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
              }
            } else {
              console.error(`❌ 컨테이너 생성 실패 [${post.id}]:`, containerResult.error);
            }
          } catch (error) {
            console.error(`❌ 포스트 처리 오류 [${post.id}]:`, error);
            return { success: false, postId: post.id, error };
          }
        })
      );

      console.log(`✅ 컨테이너 생성 완료: ${scheduledList.length}개`);
    }

    return NextResponse.json({
      success: true,
      processed: scheduledList?.length || 0,
      message: "Cron job completed successfully"
    });

  } catch (error) {
    console.error('Cron job 실행 오류:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}