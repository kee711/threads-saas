'use server'

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ScheduledPost = {
  id?: string
  content: string
  scheduled_at: string
  publish_status: 'scheduled' | 'posted' | 'draft'
  created_at?: string
}

export async function schedulePost(content: string, scheduledAt: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('my_contents')
      .insert([{
        content,
        scheduled_at: scheduledAt,
        publish_status: 'scheduled'
      }])
      .select()
      .single()

    if (error) throw error

    revalidatePath('/schedule')
    return { data, error: null }
  } catch (error) {
    console.error('Error scheduling post:', error)
    return { data: null, error }
  }
}


export async function deleteSchedule(id: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('my_contents')
      .update({
        publish_status: 'draft',
        scheduled_at: null
      })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/schedule')
    return { error: null }
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return { error }
  }
}


interface PublishPostParams {
  content: string;
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO';
  mediaUrl?: string; // image_url 또는 video_url
}

export async function publishPost({ content, mediaType, mediaUrl }: PublishPostParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      throw new Error("로그인이 필요합니다.");
    }

    const supabase = await createClient();

    // 1. Threads access_token & social_id 조회
    const { data: account, error: accountError } = await supabase
      .from("social_accounts")
      .select("access_token, social_id")
      .eq("owner", session.user.id)
      .eq("platform", "threads")
      .single();

    console.log("[Threads 계정] : ", account);

    if (accountError || !account?.access_token || !account?.social_id) {
      throw new Error("Threads 계정이 연동되어 있지 않거나, 토큰 정보가 없습니다.");
    }

    const accessToken = account.access_token;
    const threadsUserId = account.social_id;

    console.log("[Threads Account Access token] : ", accessToken);
    console.log("[Threads Account user_id] : ", threadsUserId);

    // 2. Threads 미디어 컨테이너 생성 요청
    const baseUrl = `https://graph.threads.net/v1.0/${threadsUserId}/threads`;
    const params = new URLSearchParams();
    params.append("media_type", mediaType);
    params.append("text", content);

    if (mediaType === "IMAGE" && mediaUrl) {
      params.append("image_url", mediaUrl);
    } else if (mediaType === "VIDEO" && mediaUrl) {
      params.append("video_url", mediaUrl);
    }
    // URL 맨 뒤에 access_token 추가
    params.append("access_token", accessToken);

    const containerUrl = `${baseUrl}?${params.toString()}`;

    const containerRes = await fetch(containerUrl, {
      method: "POST",
      // Authorization 헤더 필요 없음
    });

    console.log("[Threads] 컨테이너 응답 상태:", containerRes.status);
    const responseBody = await containerRes.text();
    console.log("[Threads] 컨테이너 응답 본문:", responseBody);

    if (!containerRes.ok) {
      throw new Error(`컨테이너 생성 실패: ${containerRes.status} ${responseBody}`);
    }

    const containerData = JSON.parse(responseBody);
    if (!containerData?.id) {
      throw new Error("Threads 미디어 컨테이너 생성 실패: " + JSON.stringify(containerData));
    }

    const creationId = containerData.id;

    // 3. 컨테이너 게시 요청 (권장: 3초 대기)
    await new Promise((r) => setTimeout(r, 3000));
    const publishUrl = `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish?creation_id=${creationId}&access_token=${accessToken}`;
    const publishRes = await fetch(publishUrl, {
      method: "POST",
    });
    const publishData = await publishRes.json();

    if (!publishRes.ok) {
      throw new Error("Threads 게시 실패: " + JSON.stringify(publishData));
    }

    // 4. DB에 게시 기록 저장
    const { data, error } = await supabase
      .from("my_contents")
      .insert([
        {
          content,
          scheduled_at: new Date().toISOString(),
          publish_status: "posted",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/schedule");
    return { data, error: null };
  } catch (error) {
    console.error("Error publishing to Threads:", error);
    return { data: null, error };
  }
}