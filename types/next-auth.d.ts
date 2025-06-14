import NextAuth, { DefaultSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      accessToken: string
      provider: string
    } & DefaultSession['user']
  }

  interface Profile {
    sub?: string
    user_id?: string
    [key: string]: any
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    accessToken: string
    provider: string
  }
} 