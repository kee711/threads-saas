'use client'

import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { signIn, useSession } from 'next-auth/react'
import { checkOnboardingStatus } from '@/lib/utils/onboarding'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/contents-cooker/topic-finder'
  const { data: session, status } = useSession()

  // 세션이 있으면 온보딩 상태 확인 후 리다이렉트
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const handleRedirect = async () => {
        try {
          const onboardingStatus = await checkOnboardingStatus(session.user.id)
          
          if (onboardingStatus.needsUserOnboarding) {
            router.push('/onboarding?type=user')
          } else if (onboardingStatus.needsSocialOnboarding && onboardingStatus.socialAccountId) {
            router.push(`/onboarding?type=social&account_id=${onboardingStatus.socialAccountId}`)
          } else {
            router.push(callbackUrl)
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error)
          // Fallback to default redirect
          router.push(callbackUrl)
        }
      }

      handleRedirect()
    }
  }, [session, status, router, callbackUrl])

  // 로딩 상태 표시를 위한 상태
  const [isLoading, setIsLoading] = useState(true)

  // 페이지 로딩 후 로딩 상태 해제
  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status])

  // 폼 제출 핸들러
  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  // 로딩 중이면 로딩 UI 표시
  if (isLoading) {
    return (
      <div className="fixed inset-0 w-full h-full backdrop-blur-sm bg-black/40 flex items-center justify-center">
        <div className="text-white">
          <svg className="animate-spin h-8 w-8 mr-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    )
  }

  // 이미 인증되었으면 렌더링 안함 (리다이렉션 처리 중)
  if (status === 'authenticated') {
    return null
  }

  return (
    <div className="relative h-screen w-full">
      {/* 배경 대시보드 */}
      <div className="fixed inset-0 w-full h-full bg-dashboard-preview bg-cover bg-center opacity-75 dark:opacity-50"></div>

      {/* 블러 처리 오버레이 */}
      <div className="fixed inset-0 w-full h-full backdrop-blur-sm bg-black/30 flex items-center justify-center">
        {/* 로그인 모달 */}
        <div className="w-full max-w-md space-y-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-background/95 shadow-2xl p-8">
          <button
            onClick={handleGoBack}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            aria-label="닫기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>

          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">계정 생성</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
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
              Google로 계속하기
            </Button>

            <Button
              className="w-full"
              variant="outline"
              onClick={() => signIn('email', { callbackUrl })}
            >
              <EmailIcon className="mr-2 h-4 w-4" />
              이메일로 계속하기
            </Button>

            <hr className="border-gray-700/50" />

            <div className="text-center text-xs text-gray-500">
              이미 계정이 있으신가요? <a href="#" className="text-primary hover:underline" onClick={(e) => {
                e.preventDefault();
                // 로그인 모드로 전환하는 로직
              }}>로그인</a>
            </div>

            <div className="text-center text-xs text-gray-500">
              계속 진행하면 서비스 <a href="/terms" className="text-primary hover:underline">이용약관</a>과 <a href="/privacy" className="text-primary hover:underline">개인정보처리방침</a>에 동의하게 됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 아이콘 컴포넌트들
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

function EmailIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      {...props}
    >
      <path
        fill="currentColor"
        d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z"
      />
    </svg>
  )
} 