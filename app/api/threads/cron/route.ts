// app/api/threads/cron/route.ts
import type { NextApiRequest, NextApiResponse } from 'next';
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
      // 게시물별로 social_id와 일치하는 access_token 가져와서 업로드
      const accessToken = tokenMap.get(row.social_id);
      if (!accessToken) {
        console.error(`No access token found for social_id ${row.social_id}`);
        continue;
      }

      // Cron 돌아가는 시점에서의 Access Token 확인
      console.error('[Access Token on cron job] :', accessToken);

      try {

        const publishUrl =
          `https://graph.threads.net/v1.0/${row.social_id}/threads_publish` +
          `?creation_id=${row.creation_id}&access_token=${accessToken}`;
        // Post
        const publishRes = await fetch(publishUrl, { method: 'POST' });
        const publishData = await publishRes.json();
        console.error('[POST 요청 보낸 직후]:', publishData);

        if (publishRes.ok) {
          await supabase
            .from('my_contents')
            .update({ publish_status: 'posted' })
            .eq('id', row.id);
        } else {
          console.error('[Failed to publish container] :', publishData);
          await supabase
            .from('my_contents')
            .update({ publish_status: 'failed' })
            .eq('id', row.id);
        }
      } catch (err) {
        console.error('[Error in publishing container] :', err);
        await supabase
          .from('my_contents')
          .update({ publish_status: 'failed' })
          .eq('id', row.id);
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
        // TEXT-only 예약 게시
        await publishPost({ content: post.content, mediaType: 'TEXT' });
        await supabase
          .from('my_contents')
          .update({ publish_status: 'posted' })
          .eq('id', post.id);
      } catch (err) {
        console.error('Error publishing scheduled post:', err);
        // await supabase
        //   .from('my_contents')
        //   .update({ publish_status: 'failed' })
        //   .eq('id', post.id);
      }
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
