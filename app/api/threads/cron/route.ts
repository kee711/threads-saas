// pages/api/threads/publish-pending.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase/server';
import { publishPost } from '@/app/actions/schedule'; // 경로를 실제 publishPost가 정의된 파일로 수정하세요

// 배포 시 Vercel의 Cron Job 등에서 매 분 호출하도록 설정
export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = await createClient();

  // 1. ready_to_publish 상태의 미디어 컨테이너 게시
  const { data: pendings, error: pendingError } = await supabase
    .from('my_contents')
    .select('id, creation_id, access_token, social_id')
    .eq('publish_status', 'ready_to_publish')
    .lte('created_at', new Date(Date.now() - 30_000).toISOString());

  if (pendingError) {
    console.error('Error fetching ready_to_publish rows:', pendingError);
  } else if (pendings) {
    for (const row of pendings) {
      try {
        const publishUrl =
          `https://graph.threads.net/v1.0/${row.social_id}/threads_publish` +
          `?creation_id=${row.creation_id}&access_token=${row.access_token}`;
        const publishRes = await fetch(publishUrl, { method: 'POST' });
        const publishData = await publishRes.json();

        if (publishRes.ok) {
          await supabase
            .from('my_contents')
            .update({ publish_status: 'posted' })
            .eq('id', row.id);
        } else {
          console.error('Failed to publish container:', publishData);
          await supabase
            .from('my_contents')
            .update({ publish_status: 'failed' })
            .eq('id', row.id);
        }
      } catch (err) {
        console.error('Error in publishing container:', err);
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
        await supabase
          .from('my_contents')
          .update({ publish_status: 'failed' })
          .eq('id', post.id);
      }
    }
  }

  res.status(200).json({ success: true });
}
