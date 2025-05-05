export const runtime = 'nodejs'; // Edge Runtime 문제 방지
import { createClient } from '@/lib/supabase/server';
import { publishPost } from '@/app/actions/schedule';

// 배포 시 Vercel의 Cron Job 등에서 매 분 호출하도록 설정
export async function POST() {
  const supabase = await createClient();

  // 모든 social_id → access_token 매핑 가져오기
  const { data: accounts, error: accountError } = await supabase
    .from('social_accounts')
    .select('social_id, access_token');

  if (accountError) {
    console.error('Error fetching access tokens:', accountError);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }

  // access_token 매핑용 Map 만들기
  const tokenMap = new Map(accounts.map(acc => [acc.social_id, acc.access_token]));

  // ready_to_publish 상태의 미디어 컨테이너 게시
  const { data: pendings, error: pendingError } = await supabase
    .from('my_contents')
    .select('id, creation_id, social_id')
    .eq('publish_status', 'ready_to_publish')
    .lte('created_at', new Date(Date.now() - 60_000).toISOString());

  // 실제로 DB에서 가져왔는지 확인
  console.error('[가져온 ready_to_publish 상태인 게시물 목록]:', pendings);

  if (pendingError) {
    console.error('Error fetching ready_to_publish rows:', pendingError);
  } else if (pendings) {
    for (const row of pendings) {
      const accessToken = tokenMap.get(row.social_id);
      if (!accessToken) {
        console.error(`No access token found for social_id ${row.social_id}`);
        continue;
      }

      console.error('[Access Token on cron job] :', accessToken);

      // 미디어 컨테이너 상태 확인
      const statusUrl = `https://graph.threads.net/v1.0/${row.creation_id}?fields=status&access_token=${accessToken}`;
      const statusRes = await fetch(statusUrl);
      let statusData;
      try {
        statusData = await statusRes.json();
      } catch (e) {
        const raw = await statusRes.text();
        console.error(`Status JSON 파싱 실패 [${row.creation_id}]:`, raw);
        continue;
      }

      if (statusData.status !== 'FINISHED') {
        console.log(`컨테이너 아직 준비 안됨 [${row.creation_id}]:`, statusData.status);
        continue;
      }

      console.error(`[Status JSON 파싱 성공]:`, statusData);

      // Publish
      try {
        const publishUrl =
          `https://graph.threads.net/v1.0/${row.social_id}/threads_publish` +
          `?creation_id=${row.creation_id}&access_token=${accessToken}`;
        const publishRes = await fetch(publishUrl, { method: 'POST' });

        let publishData;
        try {
          publishData = await publishRes.json();
        } catch (e) {
          const raw = await publishRes.text();
          console.error(`Publish 응답 파싱 실패 [${row.creation_id}]:`, raw);
          continue;
        }

        if (publishRes.ok) {
          await supabase
            .from('my_contents')
            .update({ publish_status: 'posted' })
            .eq('id', row.id);
          console.log(`✅ 게시 성공 [${row.creation_id}]`);
        } else {
          console.error(`❌ 게시 실패 [${row.creation_id}]`, publishData);
          if (!publishData.error_user_msg?.includes('not ready')) {
            await supabase
              .from('my_contents')
              .update({ publish_status: 'failed' })
              .eq('id', row.id);
          }
        }
      } catch (err) {
        console.error('Error during publish request:', err);
      }
    }
  }

  // 2. scheduled 상태의 예약 게시
  const nowISO = new Date().toISOString();
  const { data: scheduled, error: scheduleError } = await supabase
    .from('my_contents')
    .select('id, content')
    .eq('publish_status', 'scheduled')
    .lte('scheduled_at', nowISO);

  if (scheduleError) {
    console.error('Error fetching scheduled posts:', scheduleError);
  } else if (scheduled) {
    for (const post of scheduled) {
      try {

        // image나 video url 존재하면 mediaType 자동으로 바꿔주는 로직 추가 필요

        await publishPost({ content: post.content, mediaType: 'TEXT' });
        await supabase
          .from('my_contents')
          .update({ publish_status: 'posted' })
          .eq('id', post.id);
      } catch (err) {
        console.error('Error publishing scheduled post:', err);
      }
    }
  }

  // ✅ 루프 모두 완료된 뒤에 응답 반환
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}