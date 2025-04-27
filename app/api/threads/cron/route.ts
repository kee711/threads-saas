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
