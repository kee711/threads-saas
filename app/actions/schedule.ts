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

    // First, get the record to check if it's part of a thread chain
    const { data: record } = await supabase
      .from("my_contents")
      .select("is_thread_chain, parent_media_id")
      .eq("my_contents_id", id)
      .single();

    if (record?.is_thread_chain && record?.parent_media_id) {
      // If it's a thread chain, update all threads in the chain
      const { error } = await supabase
        .from("my_contents")
        .update({
          publish_status: "draft",
          scheduled_at: null,
        })
        .eq("parent_media_id", record.parent_media_id);

      if (error) throw error;
    } else {
      // If it's a single post, update only this record
      const { error } = await supabase
        .from("my_contents")
        .update({
          publish_status: "draft",
          scheduled_at: null,
        })
        .eq("my_contents_id", id);

      if (error) throw error;
    }

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
    console.log(`🎠 [SCHEDULE-CAROUSEL] Starting carousel creation with ${media_urls.length} items`);
    console.log(`🎠 [SCHEDULE-CAROUSEL] Media URLs:`, media_urls);
    console.log(`🎠 [SCHEDULE-CAROUSEL] Threads User ID: ${threadsUserId}`);

    // 3-1. 각 이미지마다 아이템 컨테이너 생성
    const itemContainers = [];

    for (let i = 0; i < media_urls.length; i++) {
      const imageUrl = media_urls[i];
      console.log(`🎠 [SCHEDULE-CAROUSEL] Creating item ${i + 1}/${media_urls.length} for URL: ${imageUrl}`);

      const baseUrl = `https://graph.threads.net/v1.0/${threadsUserId}/threads`;
      const urlParams = new URLSearchParams();
      urlParams.append("media_type", "IMAGE");
      urlParams.append("image_url", imageUrl);
      urlParams.append("is_carousel_item", "true");
      urlParams.append("access_token", accessToken);

      const containerUrl = `${baseUrl}?${urlParams.toString()}`;

      console.log(`🎠 [SCHEDULE-CAROUSEL] API Request for item ${i + 1}:`, {
        url: containerUrl.replace(accessToken, '[REDACTED]'),
        params: {
          media_type: "IMAGE",
          image_url: imageUrl,
          is_carousel_item: "true",
          access_token: '[REDACTED]'
        }
      });

      const startTime = Date.now();
      const response = await fetch(containerUrl, { method: "POST" });
      const responseTime = Date.now() - startTime;

      console.log(`🎠 [SCHEDULE-CAROUSEL] Item ${i + 1} API Response:`, {
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url.replace(accessToken, '[REDACTED]')
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [SCHEDULE-CAROUSEL] Item ${i + 1} creation failed:`, {
          imageUrl,
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          requestParams: {
            media_type: "IMAGE",
            image_url: imageUrl,
            is_carousel_item: "true",
            access_token: '[REDACTED]'
          },
          responseTime: `${responseTime}ms`,
          threadsUserId
        });

        // 이미지 URL 유효성 검사
        try {
          console.log(`🔍 [SCHEDULE-CAROUSEL] Validating image URL: ${imageUrl}`);
          const imageCheckResponse = await fetch(imageUrl, { method: 'HEAD' });
          console.log(`🔍 [SCHEDULE-CAROUSEL] Image URL validation result:`, {
            imageUrl,
            status: imageCheckResponse.status,
            headers: Object.fromEntries(imageCheckResponse.headers.entries()),
            contentType: imageCheckResponse.headers.get('content-type'),
            contentLength: imageCheckResponse.headers.get('content-length'),
            isAccessible: imageCheckResponse.ok
          });
        } catch (imageError) {
          console.error(`🔍 [SCHEDULE-CAROUSEL] Image URL validation failed:`, {
            imageUrl,
            error: imageError instanceof Error ? imageError.message : 'Unknown error'
          });
        }

        return {
          success: false,
          creationId: null,
          error: `캐러셀 아이템 생성 실패 (아이템 ${i + 1}/${media_urls.length}, 상태: ${response.status}): ${errorText}`,
        };
      }

      const data = await response.json();
      console.log(`✅ [SCHEDULE-CAROUSEL] Item ${i + 1} created successfully:`, {
        containerId: data.id,
        imageUrl,
        responseTime: `${responseTime}ms`,
        fullResponse: data
      });

      itemContainers.push(data.id);

      // 다음 아이템 생성 전 딜레이 (마지막 아이템 제외)
      if (i < media_urls.length - 1) {
        console.log(`⏳ [SCHEDULE-CAROUSEL] Waiting 1 second before creating next item...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`🎠 [SCHEDULE-CAROUSEL] All ${media_urls.length} items created. Container IDs:`, itemContainers);

    // 3-2. 캐러셀 컨테이너 생성
    console.log(`🎠 [SCHEDULE-CAROUSEL] Creating final carousel container...`);
    const baseUrl = `https://graph.threads.net/v1.0/${threadsUserId}/threads`;
    const urlParams = new URLSearchParams();
    urlParams.append("media_type", "CAROUSEL");
    urlParams.append("text", content);
    urlParams.append("children", itemContainers.join(","));
    urlParams.append("access_token", accessToken);

    const containerUrl = `${baseUrl}?${urlParams.toString()}`;

    console.log(`🎠 [SCHEDULE-CAROUSEL] Final container request:`, {
      url: containerUrl.replace(accessToken, '[REDACTED]'),
      params: {
        media_type: "CAROUSEL",
        text: content,
        children: itemContainers.join(","),
        access_token: '[REDACTED]'
      },
      childrenCount: itemContainers.length,
      childrenIds: itemContainers
    });

    const startTime = Date.now();
    const response = await fetch(containerUrl, { method: "POST" });
    const responseTime = Date.now() - startTime;

    console.log(`🎠 [SCHEDULE-CAROUSEL] Final container API Response:`, {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url.replace(accessToken, '[REDACTED]')
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ [SCHEDULE-CAROUSEL] Final container creation failed:`, {
        status: response.status,
        statusText: response.statusText,
        errorBody: data,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        requestParams: {
          media_type: "CAROUSEL",
          text: content,
          children: itemContainers.join(","),
          access_token: '[REDACTED]'
        },
        responseTime: `${responseTime}ms`,
        childrenIds: itemContainers,
        childrenCount: itemContainers.length
      });
    } else {
      console.log(`✅ [SCHEDULE-CAROUSEL] Final container created successfully:`, {
        containerId: data.id,
        responseTime: `${responseTime}ms`,
        fullResponse: data
      });
    }

    return {
      success: response.ok,
      creationId: data.id,
      error: response.ok
        ? null
        : `캐러셀 컨테이너 생성 실패 (상태: ${response.status}): ${JSON.stringify(data)}`,
    };
  }

  return {
    success: false,
    creationId: null,
    error: "지원하지 않는 미디어 타입입니다.",
  };
}