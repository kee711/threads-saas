import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET 요청 처리 (상태 확인, 연결 URL 생성)
export async function GET(request: NextRequest) {
  console.log("[API] 소셜 상태 확인 요청 시작");

  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    console.error("[API] 인증되지 않은 요청 - 세션 정보 없음");
    return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  // URL에서 action 파라미터 추출
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  console.log(`[API] 요청 액션: ${action}`);

  // 소셜 연동 상태 확인
  if (action === "status") {
    try {
      console.log(`[API] 사용자 ID로 소셜 계정 조회: ${session.user.id}`);
      const { data, error } = await supabase
        .from('social_accounts')
        .select('owner')
        .eq('owner', session.user.id)
        .single();

      if (error) {
        // 쿼리 결과가 없는 경우 (PGRST116 에러)는 연결되지 않은 상태로 처리
        if (error.code === 'PGRST116') {
          console.log("[API] 소셜 계정이 연결되지 않은 상태");
          return NextResponse.json({ isConnected: false });
        }
        // 그 외의 에러는 실제 에러로 처리
        console.error("[API] Supabase 조회 오류:", error);
        throw error;
      }

      console.log(`[API] 소셜 계정 상태: ${!!data?.owner}`);
      return NextResponse.json({ isConnected: !!data?.owner });
    } catch (error) {
      console.error("[API] 소셜 연동 상태 확인 중 오류 발생:", error);
      return NextResponse.json({
        error: "상태 확인 실패",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
        isConnected: false
      }, { status: 500 });
    }
  }

  // 소셜 로그인 URL 생성
  if (action === "connect") {
    try {
      console.log("[API] 소셜 로그인 URL 생성 시작");
      const socialAuthUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback?state=${Date.now()}`;
      console.log(`[API] 생성된 소셜 로그인 URL: ${socialAuthUrl}`);
      return NextResponse.json({ authUrl: socialAuthUrl });
    } catch (error) {
      console.error("[API] 소셜 연동 URL 생성 중 오류:", error);
      return NextResponse.json({
        error: "소셜 연동 URL을 생성할 수 없습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      }, { status: 500 });
    }
  }

  console.error(`[API] 유효하지 않은 액션: ${action}`);
  return NextResponse.json({ error: "유효하지 않은 요청" }, { status: 400 });
}

// POST 요청 처리 (수동 로그인 및 계정 연동)
export async function POST(request: NextRequest) {
  console.log("[API] 소셜 계정 연동 요청 시작");

  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    console.error("[API] 인증되지 않은 요청 - 세션 정보 없음");
    return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, social_id, password } = body;
    console.log(`[API] 수동 로그인 시도 - 사용자: ${social_id}`);

    if (action !== "login" || !social_id || !password) {
      console.error("[API] 잘못된 요청 형식:", { action, social_id: social_id ? "제공됨" : "없음" });
      return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
    }

    // 소셜 계정 검증 (실제 구현에서는 소셜 미디어 API 사용)
    const verification = {
      success: true,
      socialId: social_id, // 실사용이라면 Threads user_id
      platform: "threads",
      accessToken: `manual_access_token_${Date.now()}`,
      refreshToken: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1시간짜리 mock 토큰
    };

    if (!verification.success) {
      console.error("[API] 소셜 계정 검증 실패");
      return NextResponse.json({ error: "잘못된 사용자 이름 또는 비밀번호입니다." }, { status: 401 });
    }

    // 소셜 계정 연동
    console.log(`[API] 소셜 계정 연동 시작 - 사용자: ${session.user.email}`);
    const { error } = await supabase
      .from('social_accounts')
      .upsert({
        social_id: verification.socialId,
        platform: verification.platform,
        access_token: verification.accessToken,
        refresh_token: verification.refreshToken,
        expires_at: verification.expiresAt,
        updated_at: new Date().toISOString(),
        owner: session.user.id, // or session.user.email if that’s your lookup field
        is_active: true
      }, { onConflict: 'social_id' });

    if (error) {
      console.error("[API] Supabase 업데이트 오류:", error);
      throw error;
    }

    console.log("[API] 소셜 계정 연동 성공");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] 소셜 계정 연동 중 오류 발생:", error);
    return NextResponse.json({
      error: "소셜 계정 연동 중 오류가 발생했습니다.",
      details: error instanceof Error ? error.message : "알 수 없는 오류"
    }, { status: 500 });
  }
} 