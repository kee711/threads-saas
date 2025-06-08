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
async function getSelectedAccountId(userId: string) {
  const supabase = await createClient();

  // social-account-store 이름으로 저장된 상태 조회
  const { data: storeData } = await supabase
    .from("user_profiles")
    .select("settings")
    .eq("id", userId)
    .single();

  // settings 필드에서 selectedAccountId 추출
  const selectedAccountId = storeData?.settings?.selectedAccountId || null;

  return selectedAccountId;
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
    const selectedAccountId = await getSelectedAccountId(session.user.id);

    // 소셜 계정 정보 조회
    let socialId = null;
    if (selectedAccountId) {
      const { data: account } = await supabase
        .from("social_accounts")
        .select("social_id")
        .eq("id", selectedAccountId)
        .single();

      if (account) {
        socialId = account.social_id;
      }
    }

    // 선택된 계정이 없으면 사용자의 첫 번째 소셜 계정 사용
    if (!socialId) {
      const { data: accounts } = await supabase
        .from("social_accounts")
        .select("social_id")
        .eq("owner", session.user.id)
        .eq("platform", "threads")
        .eq("is_active", true)
        .limit(1);

      if (accounts && accounts.length > 0) {
        socialId = accounts[0].social_id;
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
          social_id: socialId,
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
    console.error("Error scheduling post:", error);
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

interface PublishPostParams {
  content: string;
  mediaType: "TEXT" | "IMAGE" | "VIDEO" | "CAROUSEL";
  media_urls?: string[];
}

// 이미지 및 캐러셀 처리를 위한 함수
async function createThreadsContainer(
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

export async function publishPost(params: PublishPostParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      throw new Error("로그인이 필요합니다.");
    }

    const supabase = await createClient();

    // 전역 상태에서 선택된 계정 ID 가져오기
    const selectedAccountId = await getSelectedAccountId(session.user.id);

    // 소셜 계정 정보 조회
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
      throw new Error(
        "Threads 계정이 연동되어 있지 않거나, 토큰 정보가 없습니다."
      );
    }

    const accessToken = account.access_token;
    const threadsUserId = account.social_id;

    console.log("[Threads Account user_id] : ", threadsUserId);

    // Threads 미디어 컨테이너 생성
    const containerResult = await createThreadsContainer(
      threadsUserId,
      accessToken,
      params
    );

    if (!containerResult.success || !containerResult.creationId) {
      throw new Error(containerResult.error || "미디어 컨테이너 생성 실패");
    }

    const creationId = containerResult.creationId;

    // Publish
    try {
      const publishUrl =
        `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish` +
        `?creation_id=${creationId}&access_token=${accessToken}`;
      const publishRes = await fetch(publishUrl, { method: "POST" });
      const publishData = await publishRes.json();

      console.log(`✅ 게시 시도 [${publishData}]`);

      if (publishRes.ok) {
        // DB에 새로운 row Create
        const { error: insertError } = await supabase
          .from("my_contents")
          .insert([
            {
              content: params.content,
              creation_id: creationId,
              publish_status: "posted",
              user_id: session.user.id,
              social_id: threadsUserId,
              media_id: publishData.id,
              media_type: params.mediaType,
              media_urls: params.media_urls || [],
              scheduled_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            },
          ]);
        if (insertError) {
          throw insertError;
        }
        console.log(`✅ 게시 성공 [${creationId}]`);
      } else {
        // publish 요청 실패하면 failed 상태로 변경 (요청에 따라 creation_id 저장하지 않음)
        const { error: insertError } = await supabase
          .from("my_contents")
          .insert([
            {
              content: params.content,
              publish_status: "failed",
              user_id: session.user.id,
              social_id: threadsUserId,
              media_id: publishData.id,
              media_type: params.mediaType,
              media_urls: params.media_urls || [],
              scheduled_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            },
          ]);
        if (insertError) {
          throw insertError;
        }
        console.log(`❌ 게시 실패 [${creationId}]`, publishData);
      }
    } catch (err) {
      console.error("Error during publish request:", err);
    }

    revalidatePath("/");
    return { error: null };
  } catch (error) {
    console.error("Error publishing post:", error);
    return { error };
  }
}

// Draft로 저장하는 helper 함수
async function saveToDraft(params: PublishPostParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      throw new Error("로그인이 필요합니다.");
    }

    const supabase = await createClient();

    // 전역 상태에서 선택된 계정 ID 가져오기
    const selectedAccountId = await getSelectedAccountId(session.user.id);

    // 소셜 계정 정보 조회
    let socialId = null;
    if (selectedAccountId) {
      const { data: account } = await supabase
        .from("social_accounts")
        .select("social_id")
        .eq("id", selectedAccountId)
        .single();

      if (account) {
        socialId = account.social_id;
      }
    }

    // 선택된 계정이 없으면 사용자의 첫 번째 소셜 계정 사용
    if (!socialId) {
      const { data: accounts } = await supabase
        .from("social_accounts")
        .select("social_id")
        .eq("owner", session.user.id)
        .eq("platform", "threads")
        .eq("is_active", true)
        .limit(1);

      if (accounts && accounts.length > 0) {
        socialId = accounts[0].social_id;
      }
    }

    // 3번 시도 후 실패한 포스트를 draft로 저장
    const { data, error } = await supabase
      .from("my_contents")
      .insert([
        {
          content: params.content,
          publish_status: "draft", // 🔄 3번 시도 후 실패 시 draft로 저장
          user_id: session.user.id,
          social_id: socialId,
          media_type: params.mediaType,
          media_urls: params.media_urls || [],
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    console.log("✅ 3번 시도 후 실패하여 draft로 저장됨:", data.id);
    revalidatePath("/");
    return { data, error: null };
  } catch (error) {
    console.error("Error saving to draft:", error);
    return { data: null, error };
  }
}

// 3번 재시도 후 실패 시 draft로 저장하는 발행 함수
export async function publishPostWithRetry(params: PublishPostParams) {
  const maxRetries = 3;
  let attempt = 0;

  console.log("🚀 발행 시작 - 최대 3번 재시도");

  while (attempt < maxRetries) {
    attempt++;
    console.log(`📤 발행 시도 ${attempt}/${maxRetries}`);

    try {
      const result = await publishPost(params);

      if (!result.error) {
        console.log("✅ 발행 성공!");
        return { success: true, error: null, attempt };
      }

      console.log(`❌ 발행 시도 ${attempt} 실패:`, result.error);

      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < maxRetries) {
        const delay = attempt * 2000; // 2초, 4초, 6초 점진적 지연
        console.log(`⏳ ${delay / 1000}초 대기 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

    } catch (error) {
      console.log(`❌ 발행 시도 ${attempt} 에러:`, error);

      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < maxRetries) {
        const delay = attempt * 2000;
        console.log(`⏳ ${delay / 1000}초 대기 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // 3번 모두 실패 시 draft로 저장
  console.log("❌ 3번 시도 모두 실패 - draft로 저장");
  const draftResult = await saveToDraft(params);
  toast.error("발행에 실패하여 saved에 저장했어요");

  return {
    success: false,
    error: "3번 시도 후 실패하여 draft로 저장됨",
    attempt: maxRetries,
    draftSaved: !draftResult.error
  };
}