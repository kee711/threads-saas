import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 배포 시 Vercel의 Cron Job 등에서 매 분 호출하도록 설정
export async function POST() {
  const supabase = await createClient();

  try {
    const nowISO = new Date().toISOString();

    // 🚀 1단계: scheduled → draft (컨테이너 생성 예약)
    const { data: toCreateContainer, error: scheduleError } = await supabase
      .from('my_contents')
      .update({ publish_status: 'processing' })
      .eq('publish_status', 'scheduled')
      .lte('scheduled_at', nowISO)
      .is('creation_id', null)
      .select('id, content, social_id, media_type, media_urls');

    if (scheduleError) {
      console.error('Error selecting scheduled posts:', scheduleError);
    } else if (toCreateContainer && toCreateContainer.length > 0) {
      console.log(`🎬 컨테이너 생성 예약: ${toCreateContainer.length}개`);

      // 🎯 Fire-and-Forget: 컨테이너 생성 API 호출 (응답 대기 안함!)
      for (const post of toCreateContainer) {
        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`;

        // ⚡ 핵심: await 없음! (Fire-and-Forget)
        fetch(`${baseUrl}/api/threads/create-container`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId: post.id,
            socialId: post.social_id,
            content: post.content,
            mediaType: post.media_type,
            mediaUrls: post.media_urls || []
          })
        }).catch(error => {
          console.error(`백그라운드 컨테이너 생성 요청 실패 [${post.id}]:`, error);
        });

        console.log(`🔄 백그라운드 컨테이너 생성 요청 [${post.id}]`);
      }
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

      for (const post of readyToPush) {
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
      }
    }

    // 🧹 3단계: 5분 이상 draft 상태로 머물러 있는 stale 게시물 정리
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
        containerRequested: toCreateContainer?.length || 0,
        published: readyToPush?.length || 0,
        cleaned: staleData?.length || 0
      },
      note: "Fire-and-Forget 방식으로 timeout 해결"
    });

  } catch (error) {
    console.error('Cron job 실행 오류:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}