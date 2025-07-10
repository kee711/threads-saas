import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // 로그인하지 않은 사용자가 보호된 경로에 접근하면 로그인 페이지로 리다이렉트
    if (!req.nextauth.token) {
      return NextResponse.redirect(new URL('/signin', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

// 보호할 경로 설정
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/schedule/:path*',
    '/contents/:path*',
    '/statistics/:path*',
    '/comments/:path*',
    // 로그인이 필요한 다른 경로들 추가
  ],
} 