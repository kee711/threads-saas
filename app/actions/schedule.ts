'use server'

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ScheduledPost = {
  id?: string
  content: string
  scheduled_at: string
  publish_status: 'scheduled' | 'posted' | 'draft' | 'ready_to_publish'
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
        // image, video 추가 필요
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

    // 1. 전역 상태에서 선택된 소셜 계정 ID 가져오기
    const { data: selectedAccountStore } = await supabase
      .from("client_store")
      .select("data")
      .eq("name", "social-account-store")
      .single();

    console.log("[선택된 소셜 계정 스토어]:", selectedAccountStore);

    // 선택된 계정 ID
    let selectedAccountId = null;
    if (selectedAccountStore?.data?.state?.selectedAccountId) {
      selectedAccountId = selectedAccountStore.data.state.selectedAccountId;
    }

    // 2. Threads access_token & social_id 조회
    const accountQuery = supabase
      .from("social_accounts")
      .select("id, access_token, social_id")
      .eq("platform", "threads");

    // 선택된 계정이 있으면 해당 계정 사용, 없으면 사용자의 첫 번째 소셜 계정 사용
    if (selectedAccountId) {
      accountQuery.eq("id", selectedAccountId);
    } else {
      accountQuery.eq("owner", session.user.id);
    }

    const { data: account, error: accountError } = await accountQuery.single();

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

    // Publish
    try {
      const publishUrl =
        `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish` +
        `?creation_id=${creationId}&access_token=${accessToken}`;
      const publishRes = await fetch(publishUrl, { method: 'POST' });
      const publishData = await publishRes.json();

      console.log(`✅ 게시 시도 [${publishData}]`);

      if (publishRes.ok) {
        // DB에 새로운 row Create
        const { error: insertError } = await supabase
          .from('my_contents')
          .insert([{
            content,
            creation_id: creationId,
            publish_status: 'posted',
            user_id: session.user.id,
            social_id: threadsUserId,
            media_id: publishData.id,
            scheduled_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          }]);
        if (insertError) {
          throw insertError;
        }
        console.log(`✅ 게시 성공 [${creationId}]`);
      } else {
        // publish 요청 실패하면 ready to publish 상태로 DB 저장
        const { error: insertError } = await supabase
          .from('my_contents')
          .insert([{
            content,
            creation_id: creationId,
            publish_status: 'ready_to_publish',
            user_id: session.user.id,
            social_id: threadsUserId,
            media_id: publishData.id,
            scheduled_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          }]);
        if (insertError) {
          throw insertError;
        }
        console.log(`❌ 게시 실패 [${creationId}]`, publishData);
      }
    } catch (err) {
      console.error('Error during publish request:', err);
    }

    await revalidatePath('/schedule');

  } catch (error) {
    console.error('Error scheduling Threads publish:', error);
    return { data: null, error };
  }
}
