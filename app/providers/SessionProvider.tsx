'use client'

// Next.js 13 이상에서는 Server Component에서 SessionProvider를 직접 사용할 수 없기에 root layout에 바로 추가하지 않고 별도로 관리
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export function SessionProvider({
  children,
  session
}: {
  children: React.ReactNode
  session: any
}) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  )
} 