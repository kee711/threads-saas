// app/api/threads/oauth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error("인증되지 않은 사용자");
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=unauthenticated`);
  }

  console.log("Threads OAuth 콜백 시작:", session.user.id);

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || state !== session.user.id) {
    console.error("유효하지 않은 코드 또는 상태:", { code: !!code, stateMatch: state === session.user.id });
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=invalid_code`);
  }

  try {
    // 2-A) short-lived exchange
    const formData = new FormData();
    formData.append("client_id", process.env.THREADS_CLIENT_ID!);
    formData.append("client_secret", process.env.THREADS_CLIENT_SECRET!);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", `${process.env.NEXTAUTH_URL}/api/threads/oauth/callback`);
    formData.append("code", code);

    console.log("토큰 교환 요청 전송");
    const shortRes = await fetch("https://graph.threads.net/oauth/access_token", {
      method: "POST",
      body: formData,
    });

    const shortData = await shortRes.json();

    if (!shortRes.ok || !shortData.access_token) {
      console.error("short-token 교환 실패:", shortData);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=token_exchange`);
    }

    console.log("단기 토큰 획득 성공");

    // 2-B) long-lived exchange (60 days)
    const longRes = await fetch(
      `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${process.env.THREADS_CLIENT_SECRET}&access_token=${shortData.access_token}`
    );
    const longData = await longRes.json();
    const accessToken = (longRes.ok && longData.access_token)
      ? longData.access_token
      : shortData.access_token;
    const expiresIn = (longRes.ok && longData.expires_in)
      ? Number(longData.expires_in)
      : Number(shortData.expires_in);
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    console.log("장기 토큰 획득 성공");

    // 사용자 정보(ID, 유저네임, 프로필 사진 등) 가져오기
    console.log("사용자 프로필 정보 요청");
    const meRes = await fetch(
      'https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url,threads_biography',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!meRes.ok) {
      console.error("사용자 정보 요청 실패:", await meRes.text());
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=user_info_fetch`);
    }

    const userData = await meRes.json();
    const threadsUserId = userData.id;
    const username = userData.username || threadsUserId;
    const profilePictureUrl = userData.threads_profile_picture_url || null;

    console.log("사용자 정보 획득 성공:", {
      id: threadsUserId,
      username,
      hasProfilePicture: !!profilePictureUrl
    });

    // 소셜 계정 정보를 Supabase에 저장
    console.log("DB에 소셜 계정 정보 저장 시작");
    const supabase = await createClient();

    // 기존 계정 확인
    const { data: existingAccount, error: checkError } = await supabase
      .from("social_accounts")
      .select("id")
      .eq("owner", session.user.id)
      .eq("social_id", threadsUserId)
      .maybeSingle();

    if (checkError) {
      console.error("기존 계정 확인 오류:", checkError);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=db_error`);
    }

    let accountId;
    let isNewAccount = false;

    // social_accounts 테이블에 계정 정보 저장
    if (existingAccount) {
      // 기존 계정 업데이트
      accountId = existingAccount.id;
      const { error: dbError } = await supabase
        .from("social_accounts")
        .update({
          access_token: accessToken,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
          is_active: true,
          threads_profile_picture_url: profilePictureUrl,
          username: username
        })
        .eq("id", accountId);

      if (dbError) {
        console.error("소셜 계정 정보 업데이트 실패:", dbError);
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=db_error`);
      }
    } else {
      // 새 계정 생성
      isNewAccount = true;
      const { data: newAccount, error: dbError } = await supabase
        .from("social_accounts")
        .insert({
          owner: session.user.id,
          platform: "threads",
          access_token: accessToken,
          social_id: threadsUserId,
          username: username,
          threads_profile_picture_url: profilePictureUrl,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
          is_active: true,
          onboarding_completed: false // 온보딩 미완료 상태로 설정
        })
        .select("id")
        .single();

      if (dbError || !newAccount) {
        console.error("소셜 계정 정보 저장 실패:", dbError);
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=db_error`);
      }

      accountId = newAccount.id;
    }

    // user_profiles 테이블의 selected_social_account 필드 업데이트
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ selected_social_account: threadsUserId })
      .eq("user_id", session.user.id);

    if (updateError) {
      console.error("사용자 프로필 업데이트 실패:", updateError);
      // 중요한 오류가 아니므로 리다이렉트는 하지 않고 로그만 남김
    } else {
      console.log("사용자 프로필 selected_social_account 업데이트 완료");
    }

    console.log("Threads 계정 연동 완료");

    // 새 계정이면 온보딩 모달을 표시하기 위해 파라미터 추가
    if (isNewAccount) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?account_added=true&account_id=${accountId}`);
    } else {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/contents-cooker/topic-finder`);
    }
  } catch (error) {
    console.error("Threads OAuth 콜백 처리 중 오류:", error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=unknown`);
  }
}