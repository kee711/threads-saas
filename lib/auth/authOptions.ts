import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google' // 예시: 너가 쓰는 provider로 바꿔!

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // 필요한 provider 추가
  ],
  session: {
    strategy: 'jwt', // 보통 JWT 세션
  },
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub  // JWT 토큰에서 user id 가져와 세션에 추가
      return session
    },
  },
}