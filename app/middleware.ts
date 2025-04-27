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

  if (accessToken) {
    fetch(`${process.env.NEXTAUTH_URL}/api/threads/oauth/refresh`, {
      method: 'GET',
      headers: {
        Cookie: req.headers.get('cookie') || '',
      },
    }).catch((err) => {
      console.error('Failed to refresh Threads token in middleware', err);
    });
  }

  // ✅ refresh 요청은 따로 보내고, 기다리지 않고 바로 페이지 이동
  return NextResponse.next();
}