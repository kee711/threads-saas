'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const router = useRouter()
  const [language, setLanguage] = useState('ko')
  const [currentPlan, setCurrentPlan] = useState('free')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  const handleDeleteAccount = async () => {
    try {
      if (!session?.user?.email) {
        setDeleteError('세션 정보를 찾을 수 없습니다.')
        return
      }

      if (confirmEmail !== session.user.email) {
        setDeleteError('이메일 주소가 일치하지 않습니다.')
        return
      }

      // 소프트 삭제 API 호출
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('계정 삭제 중 오류가 발생했습니다.')
      }

      await signOut({ redirect: false })
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      setDeleteError(error instanceof Error ? error.message : '계정 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">설정</h1>

      <div className="grid gap-6">
        {/* 계정 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>계정</CardTitle>
            <CardDescription>계정 관련 설정을 관리합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              onClick={handleSignOut}
            >
              로그아웃
            </Button>
          </CardContent>
        </Card>

        {/* 플랜 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>플랜</CardTitle>
            <CardDescription>현재 구독 중인 플랜을 확인하고 관리합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">현재 플랜: {currentPlan === 'free' ? '무료' : '프리미엄'}</p>
              </div>
              {currentPlan === 'free' && (
                <Button>프리미엄으로 업그레이드</Button>
              )}
              {currentPlan === 'premium' && (
                <Button variant="outline">플랜 관리</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 외관 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>외관</CardTitle>
            <CardDescription>테마와 언어를 설정합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className='flex gap-4 items-center'>
              <Label htmlFor="dark-mode">다크 모드</Label>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={(checked: boolean) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>

            <div className="flex gap-4 items-center">
              <Label>언어</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ko">한국어</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className='justify-end'>
          <div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">계정 삭제</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>정말 계정을 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    이 작업은 되돌릴 수 없습니다. 모든 데이터가 영구적으로 삭제됩니다.<br />
                    계속하려면 아래에 이메일 주소를 입력해주세요:<br />
                    <span className="font-medium">{session?.user?.email}</span>
                    <Input
                      type="email"
                      placeholder="이메일 주소 입력"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      className="mt-2"
                    />
                    {deleteError && (
                      <div className="text-destructive text-sm mt-2">{deleteError}</div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => {
                    setConfirmEmail('')
                    setDeleteError('')
                  }}>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground"
                  >
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

      </div>
    </div>
  )
} 