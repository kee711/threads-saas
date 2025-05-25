'use client'

import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import useSocialAccountStore from '@/stores/useSocialAccountStore'
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
import { OnboardingModal } from '@/components/OnboardingModal'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [language, setLanguage] = useState('ko')
  const [currentPlan, setCurrentPlan] = useState('free')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [deleteError, setDeleteError] = useState('')

  // 유저 프로필 상태 (user_profiles 테이블)
  const [userProfile, setUserProfile] = useState<{
    id?: string;
    name?: string;
    email?: string;
    user_id?: string;
  } | null>(null)

  // 소셜 계정 관련 상태 (social_accounts 테이블)
  const { accounts, selectedAccountId } = useSocialAccountStore()
  const [selectedSocialAccount, setSelectedSocialAccount] = useState('')
  const [accountInfo, setAccountInfo] = useState('')
  const [accountType, setAccountType] = useState<string>('')
  const [accountTags, setAccountTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 테스트 온보딩 관련 상태
  const [showTestOnboarding, setShowTestOnboarding] = useState(false)
  const [testAccountId, setTestAccountId] = useState<string | null>(null)
  const [testAccounts, setTestAccounts] = useState<Array<{ id: string, username: string }>>([])
  const [loadingTestAccounts, setLoadingTestAccounts] = useState(false)

  // 사용자 프로필 정보 로드
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return

    const fetchUserProfile = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (error) {
          console.error('사용자 프로필 로드 오류:', error)
          return
        }

        setUserProfile(data)
      } catch (error) {
        console.error('사용자 프로필 로드 중 오류 발생:', error)
      }
    }

    fetchUserProfile()
  }, [session?.user?.id, status])

  // 계정 정보 로드
  useEffect(() => {
    if (!selectedSocialAccount) return

    const fetchAccountDetails = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()

        // social_accounts 테이블에서 계정 정보 로드
        const { data: accountData, error: accountError } = await supabase
          .from('social_accounts')
          .select('account_type, account_info, account_tags')
          .eq('id', selectedSocialAccount)
          .single()

        if (!accountError && accountData) {
          setAccountType(accountData.account_type || '')
          setAccountInfo(accountData.account_info || '')
          setAccountTags(accountData.account_tags || [])
        } else {
          setAccountType('')
          setAccountInfo('')
          setAccountTags([])
        }
      } catch (error) {
        console.error('계정 정보 로드 오류:', error)
        toast.error('계정 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccountDetails()
  }, [selectedSocialAccount])

  // 테스트 계정 목록 로드
  useEffect(() => {
    if (status !== 'authenticated' || !userProfile?.user_id) return

    const loadTestAccounts = async () => {
      setLoadingTestAccounts(true)
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('social_accounts')
          .select('id, username, social_id')
          .eq('owner', userProfile.user_id)
          .eq('platform', 'test-thread')

        if (data) {
          setTestAccounts(data.map(acc => ({
            id: acc.id,
            username: acc.username || acc.social_id
          })))
        }
      } catch (error) {
        console.error('테스트 계정 로딩 오류:', error)
      } finally {
        setLoadingTestAccounts(false)
      }
    }

    loadTestAccounts()
  }, [userProfile?.user_id, status])

  // 계정 정보 저장
  const saveAccountInfo = async () => {
    if (!selectedSocialAccount) {
      toast.error('선택된 계정이 없습니다.')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()

      // social_accounts 테이블에 직접 업데이트
      const { error: updateError } = await supabase
        .from('social_accounts')
        .update({
          account_type: accountType || null,
          account_info: accountInfo || null,
          account_tags: accountTags.length > 0 ? accountTags : null
        })
        .eq('id', selectedSocialAccount)

      if (updateError) throw updateError

      toast.success('계정 정보가 업데이트되었습니다.')
    } catch (error) {
      console.error('계정 정보 저장 오류:', error)
      toast.error('계정 정보 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 태그 추가/삭제 핸들러
  const addTag = () => {
    if (newTag && !accountTags.includes(newTag)) {
      setAccountTags([...accountTags, newTag])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setAccountTags(accountTags.filter(tag => tag !== tagToRemove))
  }

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' })
  }

  const handleDeleteAccount = async () => {
    try {
      if (!userProfile?.email) {
        setDeleteError('사용자 정보를 찾을 수 없습니다.')
        return
      }

      if (confirmEmail !== userProfile.email) {
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

  // 온보딩 테스트 핸들러
  const handleTestOnboarding = async () => {
    if (status !== 'authenticated') {
      toast.error('로그인 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    if (!userProfile?.user_id) {
      toast.error('사용자 정보를 찾을 수 없습니다')
      console.log('사용자 프로필:', userProfile)
      return
    }

    try {
      setIsLoading(true)
      const supabase = createClient()

      // 가상의 테스트 계정 생성
      const testUsername = `test-${Math.floor(Math.random() * 10000)}`
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7일 후

      const { data: newAccount, error } = await supabase
        .from('social_accounts')
        .insert({
          owner: userProfile.user_id,
          platform: 'test-thread',
          social_id: testUsername,
          username: testUsername,
          is_active: true,
          onboarding_completed: false,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          access_token: 'test_access_token',
          refresh_token: 'test_refresh_token',
          expires_at: expiresAt.toISOString(),
          threads_profile_picture_url: 'https://via.placeholder.com/150',
          account_type: null,
          account_info: null,
          account_tags: null
        })
        .select('id')
        .single()

      if (error) {
        throw error
      }

      if (newAccount?.id) {
        setTestAccountId(newAccount.id)
        setShowTestOnboarding(true)

        // 테스트 계정 목록 갱신
        const { data } = await supabase
          .from('social_accounts')
          .select('id, username, social_id')
          .eq('owner', userProfile.user_id)
          .eq('platform', 'test-thread')

        if (data) {
          setTestAccounts(data.map(acc => ({
            id: acc.id,
            username: acc.username || acc.social_id
          })))
        }
      }
    } catch (error) {
      console.error('테스트 온보딩 준비 오류:', error)
      toast.error('테스트 온보딩 준비 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // 테스트 온보딩 모달 닫기 핸들러
  const handleCloseTestOnboarding = () => {
    setShowTestOnboarding(false)
    setTestAccountId(null)
  }

  // 테스트 계정 삭제 핸들러
  const handleDeleteTestAccount = async (accountId: string) => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('id', accountId)

      if (error) throw error

      setTestAccounts(testAccounts.filter(acc => acc.id !== accountId))
      toast.success('테스트 계정이 삭제되었습니다')
    } catch (error) {
      console.error('테스트 계정 삭제 오류:', error)
      toast.error('테스트 계정 삭제 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      {/* 상단에 세션 로딩 상태 처리 */}
      {status === 'loading' && (
        <div className="text-center py-4 mb-4 bg-muted rounded">
          세션 정보를 불러오는 중입니다...
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8">설정</h1>

      <div className="grid gap-6">
        {/* 계정 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>계정</CardTitle>
            <CardDescription>계정 관련 설정을 관리합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 소셜 계정 관련 설정 */}
            <div className="space-y-6 mb-6">
              <div>
                <Label htmlFor="socialAccount" className="mb-2 block">소셜 계정</Label>
                <Select
                  value={selectedSocialAccount}
                  onValueChange={setSelectedSocialAccount}
                  disabled={isLoading || accounts.length === 0}
                >
                  <SelectTrigger id="socialAccount">
                    <SelectValue placeholder="계정을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.username || account.social_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSocialAccount && (
                <div className="space-y-4 border rounded-lg p-4">
                  <div>
                    <Label htmlFor="accountType" className="mb-2 block">계정 유형</Label>
                    <Select
                      value={accountType}
                      onValueChange={setAccountType}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="accountType">
                        <SelectValue placeholder="계정 유형 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="biz">비즈니스 마케팅 채널</SelectItem>
                        <SelectItem value="expert">전문가</SelectItem>
                        <SelectItem value="casual">일반</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="accountInfo" className="mb-2 block">계정 정보</Label>
                    <Textarea
                      id="accountInfo"
                      value={accountInfo}
                      onChange={(e) => setAccountInfo(e.target.value)}
                      placeholder="계정에 대한 설명을 입력하세요"
                      className="min-h-[100px]"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">태그</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {accountTags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1">
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1"
                            disabled={isLoading}
                          >
                            <X size={14} />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="새 태그 추가"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter' && !isLoading) {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        disabled={isLoading}
                      />
                      <Button
                        variant="outline"
                        onClick={addTag}
                        disabled={isLoading}
                      >
                        추가
                      </Button>
                    </div>
                  </div>

                  <Button onClick={saveAccountInfo} disabled={isLoading}>
                    {isLoading ? '저장 중...' : '저장'}
                  </Button>
                </div>
              )}
            </div>

            {/* 온보딩 테스트 섹션 */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-2">온보딩 테스트</h3>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={handleTestOnboarding}
                  disabled={isLoading || status === 'loading'}
                >
                  {status === 'loading' ? '로딩 중...' : '가상 계정 생성 및 온보딩 테스트'}
                </Button>

                {testAccounts.length > 0 && (
                  <div className="border rounded-md p-4 mt-4">
                    <h4 className="font-medium mb-2">테스트 계정 목록</h4>
                    <div className="space-y-2">
                      {testAccounts.map(account => (
                        <div key={account.id} className="flex justify-between items-center">
                          <span>{account.username}</span>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTestAccount(account.id)}
                            disabled={isLoading}
                          >
                            삭제
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleSignOut}
            >
              로그아웃
            </Button>

            {/* 온보딩 테스트 모달 */}
            {showTestOnboarding && testAccountId && (
              <OnboardingModal
                open={showTestOnboarding}
                onClose={handleCloseTestOnboarding}
                socialAccountId={testAccountId}
              />
            )}
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
                    <span className="font-medium">{userProfile?.email}</span>
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