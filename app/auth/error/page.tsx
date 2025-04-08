'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'AccessDenied':
        return '인증이 거부되었습니다. 다시 시도해주세요.'
      case 'Verification':
        return '인증 링크가 만료되었거나 이미 사용되었습니다.'
      case 'Configuration':
        return '서버 설정에 문제가 있습니다. 관리자에게 문의해주세요.'
      case 'OAuthSignin':
        return '로그인 시도 중 문제가 발생했습니다. 다시 시도해주세요.'
      case 'OAuthCallback':
        return '인증 제공자로부터 응답을 받는 중 문제가 발생했습니다.'
      case 'OAuthCreateAccount':
        return '계정 생성 중 문제가 발생했습니다. 다시 시도해주세요.'
      case 'EmailCreateAccount':
        return '이메일 계정 생성 중 문제가 발생했습니다.'
      case 'Callback':
        return '인증 처리 중 문제가 발생했습니다.'
      case 'OAuthAccountNotLinked':
        return '이미 다른 인증 방식으로 가입된 이메일입니다.'
      case 'EmailSignin':
        return '이메일 로그인 중 문제가 발생했습니다.'
      case 'CredentialsSignin':
        return '로그인 정보가 올바르지 않습니다.'
      case 'SessionRequired':
        return '이 페이지에 접근하려면 로그인이 필요합니다.'
      default:
        return '알 수 없는 오류가 발생했습니다.'
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-destructive">로그인 오류</h1>
          <p className="text-sm text-muted-foreground">
            {error ? getErrorMessage(error) : '인증 중 문제가 발생했습니다.'}
          </p>
        </div>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/signin">
              로그인 페이지로 돌아가기
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 