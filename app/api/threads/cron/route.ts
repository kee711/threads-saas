import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publishPost } from '@/app/actions/schedule';

// 배포 시 Vercel의 Cron Job 등에서 매 분 호출하도록 설정
export async function POST() {
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
    .select('id, content, social_account_id')
    .eq('publish_status', 'scheduled')
    .lte('scheduled_at', nowISO);

  if (scheduleError) {
    console.error('Error fetching scheduled posts:', scheduleError);
  } else if (scheduled) {
    for (const post of scheduled) {
      try {
        // 해당 소셜 계정 정보로 게시
        // social_account_id가 있으면 해당 계정으로 게시, 없으면 사용자의 기본 계정 사용
        const { data: socialAccount } = post.social_account_id
          ? await supabase
            .from('social_accounts')
            .select('*')
            .eq('id', post.social_account_id)
            .single()
          : { data: null };

        // TEXT-only 예약 게시
        if (socialAccount) {
          // 특정 소셜 계정에 게시
          const publishUrl =
            `https://graph.threads.net/v1.0/${socialAccount.social_id}/threads` +
            `?media_type=TEXT&text=${encodeURIComponent(post.content)}&access_token=${socialAccount.access_token}`;

          const containerRes = await fetch(publishUrl, { method: 'POST' });
          const containerData = await containerRes.json();

          if (containerRes.ok && containerData?.id) {
            // 컨테이너 생성 성공 후 게시
            const publishUrl =
              `https://graph.threads.net/v1.0/${socialAccount.social_id}/threads_publish` +
              `?creation_id=${containerData.id}&access_token=${socialAccount.access_token}`;

            await fetch(publishUrl, { method: 'POST' });
          }
        } else {
          // 기본 계정에 게시
          await publishPost({ content: post.content, mediaType: 'TEXT' });
        }

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

  return NextResponse.json({ success: true });
}