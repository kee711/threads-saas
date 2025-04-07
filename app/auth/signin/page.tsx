'use client'

import { Button } from '@/components/ui/button'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">로그인</h1>
          <p className="text-sm text-muted-foreground">
            계정으로 로그인하여 시작하세요
          </p>
        </div>
        <div className="space-y-4">
          <Button
            className="w-full"
            variant="outline"
            onClick={() => signIn('google', { callbackUrl })}
          >
            <GoogleIcon className="mr-2 h-4 w-4" />
            Google로 로그인
          </Button>
          <Button
            className="w-full"
            onClick={() => signIn('threads', { callbackUrl })}
          >
            <ThreadsIcon className="mr-2 h-4 w-4" />
            Threads로 로그인
          </Button>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="google"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 488 512"
      {...props}
    >
      <path
        fill="currentColor"
        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
      />
    </svg>
  )
}

function ThreadsIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291 1.789-.103 3.521.324 5.147 1.265.036-.88.043-1.76.015-2.641-.156.003-.315.003-2.29 0-4.416-.887-5.756-2.398l1.403-1.476c.98 1.1 2.596 1.754 4.353 1.754.194 0 .387-.006.578-.018 1.67-.11 2.974-.699 3.93-1.778a6.068 6.068 0 0 0 1.384-2.524l2.044.547c-.376 1.206-.99 2.263-1.825 3.153-1.072 1.142-2.398 1.91-3.947 2.28.05 1.169.037 2.337-.04 3.505 3.849 1.627 5.157 4.907 4.24 7.82-.572 1.814-1.867 3.291-3.855 4.398-1.857 1.03-3.982 1.55-6.31 1.55zm-2.118-11.41c-.731.063-1.29.279-1.673.645-.34.327-.512.77-.485 1.248.04.732.406 1.205.912 1.514.539.349 1.24.5 1.955.457.524-.028 1.386-.147 1.969-.906.47-.613.794-1.493.964-2.62-1.307-.603-2.544-.405-3.642-.338z"
      />
    </svg>
  )
} 