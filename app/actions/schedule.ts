"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers'
import { toast } from "sonner";

export type ScheduledPost = {
  id?: string;
  content: string;
  scheduled_at: string;
  category?: string;
  publish_status:
  | "scheduled"
  | "posted"
  | "draft"
  | "ready_to_publish"
  | "failed";
  created_at?: string;
  social_id?: string;
  user_id?: string;
  creation_id?: string;
  media_id?: string;
  media_type?: "TEXT" | "IMAGE" | "VIDEO" | "CAROUSEL";
  media_urls?: string[];
};

// 전역 상태에서 선택된 계정 ID 가져오기
async function getSelectedSocialId(userId: string) {
  const supabase = await createClient();

  // user_profiles 테이블에서 selected_social_id 직접 조회
  const { data: profileData } = await supabase
    .from("user_profiles")
    .select("selected_social_id")
    .eq("user_id", userId)
    .single();

  return profileData?.selected_social_id || null;
}

export async function schedulePost(
  content: string,
  scheduledAt: string,
  mediaType?: "TEXT" | "IMAGE" | "VIDEO" | "CAROUSEL",
  media_urls?: string[]
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      throw new Error("로그인이 필요합니다.");
    }

    const supabase = await createClient();

    // 전역 상태에서 선택된 계정 ID 가져오기
    let currentSocialId = await getSelectedSocialId(session.user.id);

    // 선택된 계정이 없으면 사용자의 첫 번째 소셜 계정 사용
    if (!currentSocialId) {
      const { data: accounts } = await supabase
        .from("social_accounts")
        .select("social_id")
        .eq("owner", session.user.id)
        .eq("platform", "threads")
        .eq("is_active", true)
        .limit(1);

      if (accounts && accounts.length > 0) {
        currentSocialId = accounts[0].social_id;
      }
    }

    const { data, error } = await supabase
      .from("my_contents")
      .insert([
        {
          content,
          scheduled_at: scheduledAt,
          publish_status: "scheduled",
          user_id: session.user.id,
          social_id: currentSocialId,
          media_type: mediaType || "TEXT",
          media_urls: media_urls || [],
        },
      ])
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/schedule");
    return { data, error: null };
  } catch (error) {
    console.error("Error in schedulePost:", error);
    return { data: null, error };
  }
}

export async function deleteSchedule(id: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("my_contents")
      .update({
        publish_status: "draft",
        scheduled_at: null,
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/schedule");
    return { error: null };
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return { error };
  }
}

export interface PublishPostParams {
  content: string;
  mediaType: "TEXT" | "IMAGE" | "VIDEO" | "CAROUSEL";
  media_urls?: string[];
}

// 컨테이너 생성
export async function createThreadsContainer(
  threadsUserId: string,
  accessToken: string,
  params: PublishPostParams
) {
  const { content, mediaType, media_urls } = params;

  // 케이스별 처리
  // 1. 텍스트만 있는 경우
  if (mediaType === "TEXT" || !media_urls || media_urls.length === 0) {
    const baseUrl = `https://graph.threads.net/v1.0/${threadsUserId}/threads`;
    const urlParams = new URLSearchParams();
    urlParams.append("media_type", "TEXT");
    urlParams.append("text", content);
    urlParams.append("access_token", accessToken);

    const containerUrl = `${baseUrl}?${urlParams.toString()}`;
    const response = await fetch(containerUrl, { method: "POST" });
    const data = await response.json();

    return {
      success: response.ok,
      creationId: data.id,
      error: response.ok ? null : `컨테이너 생성 실패: ${JSON.stringify(data)}`,
    };
  }

  // 2. 이미지가 하나인 경우
  else if (mediaType === "IMAGE" && media_urls.length === 1) {
    const baseUrl = `https://graph.threads.net/v1.0/${threadsUserId}/threads`;
    const urlParams = new URLSearchParams();
    urlParams.append("media_type", "IMAGE");
    urlParams.append("image_url", media_urls[0]);
    urlParams.append("text", content);
    urlParams.append("access_token", accessToken);

    const containerUrl = `${baseUrl}?${urlParams.toString()}`;
    const response = await fetch(containerUrl, { method: "POST" });
    const data = await response.json();

    return {
      success: response.ok,
      creationId: data.id,
      error: response.ok
        ? null
        : `이미지 컨테이너 생성 실패: ${JSON.stringify(data)}`,
    };
  }

  // 2-1. 비디오가 하나인 경우
  else if (mediaType === "VIDEO" && media_urls.length === 1) {
    const baseUrl = `https://graph.threads.net/v1.0/${threadsUserId}/threads`;
    const urlParams = new URLSearchParams();
    urlParams.append("media_type", "VIDEO");
    urlParams.append("video_url", media_urls[0]);
    urlParams.append("text", content);
    urlParams.append("access_token", accessToken);

    const containerUrl = `${baseUrl}?${urlParams.toString()}`;
    const response = await fetch(containerUrl, { method: "POST" });
    const data = await response.json();

    return {
      success: response.ok,
      creationId: data.id,
      error: response.ok
        ? null
        : `비디오 컨테이너 생성 실패: ${JSON.stringify(data)}`,
    };
  }

  // 3. 이미지가 여러 개인 경우 (캐러셀)
  else if (
    (mediaType === "IMAGE" || mediaType === "CAROUSEL") &&
    media_urls.length > 1
  ) {
    // 3-1. 각 이미지마다 아이템 컨테이너 생성
    const itemContainers = [];

    for (const imageUrl of media_urls) {
      const baseUrl = `https://graph.threads.net/v1.0/${threadsUserId}/threads`;
      const urlParams = new URLSearchParams();
      urlParams.append("media_type", "IMAGE");
      urlParams.append("image_url", imageUrl);
      urlParams.append("is_carousel_item", "true");
      urlParams.append("access_token", accessToken);

      const containerUrl = `${baseUrl}?${urlParams.toString()}`;
      const response = await fetch(containerUrl, { method: "POST" });

      if (!response.ok) {
        return {
          success: false,
          creationId: null,
          error: `캐러셀 아이템 생성 실패: ${await response.text()}`,
        };
      }

      const data = await response.json();
      itemContainers.push(data.id);
    }

    // 3-2. 캐러셀 컨테이너 생성
    const baseUrl = `https://graph.threads.net/v1.0/${threadsUserId}/threads`;
    const urlParams = new URLSearchParams();
    urlParams.append("media_type", "CAROUSEL");
    urlParams.append("text", content);
    urlParams.append("children", itemContainers.join(","));
    urlParams.append("access_token", accessToken);

    const containerUrl = `${baseUrl}?${urlParams.toString()}`;
    const response = await fetch(containerUrl, { method: "POST" });
    const data = await response.json();

    return {
      success: response.ok,
      creationId: data.id,
      error: response.ok
        ? null
        : `캐러셀 컨테이너 생성 실패: ${JSON.stringify(data)}`,
    };
  }

  return {
    success: false,
    creationId: null,
    error: "지원하지 않는 미디어 타입입니다.",
  };
}