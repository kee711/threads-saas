// app/middleware.ts

import { NextRequest, NextResponse } from 'next/server';

// 적용할 경로 패턴 (필요에 따라 조정 가능)
export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get('next-auth.session-token')?.value || req.cookies.get('__Secure-next-auth.session-token')?.value;

  // 세션 토큰이 없으면 아무것도 안함
  if (!accessToken) {
    return NextResponse.next();
  }

  // Threads token refresh API 호출
  try {
    await fetch(`${process.env.NEXTAUTH_URL}/api/threads/oauth/refresh`, {
      method: 'GET',
      headers: {
        Cookie: req.headers.get('cookie') || '', // 현재 요청의 쿠키를 그대로 전달 (인증 유지)
      },
    });
  } catch (err) {
    console.error('Failed to refresh Threads token in middleware', err);
    // 실패해도 그냥 진행 (사용자 경험 방해하지 않기 위해)
  }

  return NextResponse.next();
}