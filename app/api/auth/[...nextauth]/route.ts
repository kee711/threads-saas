import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import ThreadsProvider from '@/lib/auth/threads-provider'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      }
    }),
    ThreadsProvider({
      clientId: process.env.THREADS_CLIENT_ID ?? '',
      clientSecret: process.env.THREADS_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      console.log('JWT Callback - Token:', token)
      console.log('JWT Callback - Account:', account)
      console.log('JWT Callback - Profile:', profile)

      if (account && profile) {
        token.accessToken = account.access_token ?? ''
        token.userId = (profile.sub || profile.user_id) ?? ''
        token.provider = account.provider ?? ''
      }
      return token
    },
    async session({ session, token }) {
      console.log('Session Callback - Session:', session)
      console.log('Session Callback - Token:', token)

      if (session.user) {
        session.user.id = token.userId as string
        session.user.accessToken = token.accessToken as string
        session.user.provider = token.provider as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      console.log('SignIn Callback - User:', user)
      console.log('SignIn Callback - Account:', account)
      console.log('SignIn Callback - Profile:', profile)

      try {
        // 사용자가 존재하는지 확인하고 deleted_at 필드 체크
        const { data: existingUser, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', user.email)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching user:', fetchError)
          return false
        }

        // 삭제된 계정인 경우 계정 복구
        if (existingUser?.deleted_at) {
          console.log('Restoring deleted account:', user.email)
          const { error: restoreError } = await supabase
            .from('user_profiles')
            .update({
              deleted_at: null,
              name: user.name,
              provider: account?.provider,
              image: user.image,
              user_id: user.id,
            })
            .eq('email', user.email)

          if (restoreError) {
            console.error('Error restoring user:', restoreError)
            return false
          }

          return true
        }

        if (!existingUser) {
          // 새 사용자 생성
          const { error: createError } = await supabase
            .from('user_profiles')
            .insert([
              {
                email: user.email,
                name: user.name,
                provider: account?.provider,
                image: user.image,
                user_id: user.id,
              },
            ])

          if (createError) {
            console.error('Error creating user:', createError)
            return false
          }
        } else {
          // 기존 사용자 정보 업데이트
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              name: user.name,
              provider: account?.provider,
              image: user.image,
              user_id: user.id,
            })
            .eq('email', user.email)

          if (updateError) {
            console.error('Error updating user:', updateError)
            return false
          }
        }

        return true
      } catch (error) {
        console.error('Error in signIn callback:', error)
        return false
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: true,
})

export { handler as GET, handler as POST } 