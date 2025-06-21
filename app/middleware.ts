// app/middleware.ts

import { NextRequest, NextResponse } from 'next/server';

// 적용할 경로 패턴 (필요에 따라 조정 가능)
export const config = {
  matcher: [
    // 대시보드 관련 경로들
    '/(dashboard)/:path*',
    '/comments/:path*',
    '/contents-cooker/:path*',
    '/mentions/:path*',
    '/schedule/:path*',
    '/settings/:path*',
    '/statistics/:path*',
    // 기타 보호된 경로들
    '/dashboard/:path*',
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // OAuth 관련 경로는 제외 (무한 리다이렉트 방지)
  if (pathname.startsWith('/api/threads/oauth') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/signin')) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get('next-auth.session-token')?.value || req.cookies.get('__Secure-next-auth.session-token')?.value;

  if (accessToken) {
    try {
      // refresh API를 동기적으로 호출하여 응답 확인
      const refreshResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/threads/oauth/refresh`, {
        method: 'GET',
        headers: {
          Cookie: req.headers.get('cookie') || '',
        },
      });

      if (refreshResponse.status === 401) {
        const responseData = await refreshResponse.json();

        // 토큰 만료 감지 시 Threads OAuth로 리다이렉트
        if (responseData.error === 'TOKEN_EXPIRED' && responseData.reauth_required) {
          console.log('Token expired detected in middleware, redirecting to OAuth');
          const oauthUrl = new URL('/api/threads/oauth', req.url);
          return NextResponse.redirect(oauthUrl);
        }
      }

      // 기타 에러는 로그만 남기고 계속 진행
      if (!refreshResponse.ok) {
        console.error('Refresh API failed in middleware:', refreshResponse.status);
      }

    } catch (err) {
      console.error('Failed to refresh Threads token in middleware', err);
      // 네트워크 에러 등의 경우 정상 진행
    }
  }

  // 정상적인 경우 또는 토큰이 없는 경우 계속 진행
  return NextResponse.next();
}