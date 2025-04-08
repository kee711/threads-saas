import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers/oauth'

interface ThreadsProfile {
  id: string
  user_id: string
  username: string
  name: string
  email: string
  image: string
}

export default function ThreadsProvider(
  config: Partial<OAuthUserConfig<ThreadsProfile>>
): OAuthConfig<ThreadsProfile> {
  return {
    id: 'threads',
    name: 'Threads',
    type: 'oauth',
    authorization: {
      url: 'https://threads.net/oauth/authorize',
      params: {
        scope: 'threads_read threads_write',
        response_type: 'code',
      },
    },
    token: {
      url: 'https://graph.threads.net/oauth/access_token',
    },
    userinfo: {
      url: 'https://graph.threads.net/me',
      async request({ tokens }) {
        if (!tokens.access_token) throw new Error('No access token')
        const response = await fetch('https://graph.threads.net/me', {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        })
        const profile = await response.json()
        return profile
      },
    },
    profile(profile: ThreadsProfile) {
      return {
        id: profile.id,
        user_id: profile.user_id,
        name: profile.name || 'Anonymous User',
        email: profile.email || `${profile.user_id}@threads.local`,
        image: profile.image || '',
        username: profile.username,
      }
    },
    ...config,
  }
} 