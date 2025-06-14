'use client';

import { useEffect, useState } from 'react';
import { PlusCircle, User2, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/select';
import useSocialAccountStore from '@/stores/useSocialAccountStore';
import { createClient } from '@/lib/supabase/client';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { OnboardingModal } from './OnboardingModal';

interface SocialAccountSelectorProps {
  className?: string;
}

export function SocialAccountSelector({ className }: SocialAccountSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [newAccountId, setNewAccountId] = useState<string | null>(null);
  const { data: session } = useSession();
  const {
    accounts,
    selectedAccountId,
    currentSocialId,
    currentUsername,
    setAccounts,
    setSelectedAccount,
    setCurrentAccountInfo,
    setAccountDetails
  } = useSocialAccountStore();

  // 소셜 계정 목록 가져오기 및 마지막 선택 계정 정보 불러오기
  const fetchSocialAccounts = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const supabase = createClient();
      console.log("소셜 계정 목록 조회 시작");

      // 소셜 계정 목록 가져오기
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('owner', session.user.id)
        .eq('platform', 'threads')
        .eq('is_active', true);

      if (error) throw error;

      console.log("조회된 소셜 계정 목록:", data);

      if (data && data.length > 0) {
        // user_profiles에서 마지막 선택된 계정 정보 가져오기
        const { data: userData, error: userError } = await supabase
          .from('user_profiles')
          .select('selected_social_account')
          .eq('user_id', session.user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error('사용자 프로필 조회 오류:', userError);
        }

        console.log("마지막 선택된 소셜 계정:", userData?.selected_social_account);

        // 계정 목록 저장
        setAccounts(data);

        // 마지막 선택된 계정이 있으면 선택
        if (userData?.selected_social_account) {
          const accountToSelect = data.find(acc => acc.social_id === userData.selected_social_account);
          if (accountToSelect) {
            console.log("마지막 선택된 계정으로 설정:", accountToSelect);
            setSelectedAccount(accountToSelect.id);
            setCurrentAccountInfo(
              accountToSelect.social_id,
              accountToSelect.username || accountToSelect.social_id
            );
          } else {
            console.log("마지막 선택된 계정을 찾을 수 없음, 첫 번째 계정으로 선택");
          }
        } else {
          console.log("마지막 선택된 계정 정보 없음, 첫 번째 계정으로 선택");
        }
      } else {
        console.log("등록된 소셜 계정 없음");
      }
    } catch (error) {
      console.error('소셜 계정 목록 조회 오류:', error);
      toast.error('소셜 계정 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 소셜 계정 추가 (Threads 인증 페이지로 리다이렉트)
  const addSocialAccount = () => {
    console.log("소셜 계정 추가 시작");
    window.location.href = '/api/threads/oauth';
  };

  // URL 파라미터 체크하여 계정 추가 완료 시 온보딩 모달 표시
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const accountAdded = urlParams.get('account_added');
    const accountId = urlParams.get('account_id');

    if (accountAdded === 'true' && accountId) {
      // URL 파라미터 제거 (히스토리 상태 변경)
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      setNewAccountId(accountId);
      setShowOnboarding(true);

      // 새 계정이 선택되도록 설정
      if (accounts.length > 0) {
        const newAccount = accounts.find(acc => acc.id === accountId);
        if (newAccount) {
          setSelectedAccount(newAccount.id);
          setCurrentAccountInfo(
            newAccount.social_id,
            newAccount.username || newAccount.social_id
          );
        }
      }
    }
  }, [accounts]);

  // 컴포넌트 마운트시 데이터 가져오기
  useEffect(() => {
    console.log("SocialAccountSelector 마운트, 세션:", session?.user?.id);
    fetchSocialAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // 현재 선택된 계정 정보 로그
  useEffect(() => {
    console.log("전역 상태 정보:", {
      selectedAccountId,
      currentSocialId,
      currentUsername,
      accountsCount: accounts.length
    });
  }, [selectedAccountId, currentSocialId, currentUsername, accounts]);

  // 계정 선택 시 user_profiles 테이블의 selected_social_account에 저장
  const handleAccountSelect = async (accountId: string) => {
    if (!session?.user?.id) return;

    console.log("계정 선택 변경:", accountId);

    // 계정 추가 버튼을 위한 특수 ID 처리
    if (accountId === 'add-account') {
      addSocialAccount();
      return;
    }

    // 선택된 계정의 정보 가져오기
    const selectedAccount = accounts.find(acc => acc.id === accountId);
    if (!selectedAccount) {
      console.error("선택된 계정을 찾을 수 없음:", accountId);
      return;
    }

    console.log("선택된 계정 정보:", selectedAccount);

    // Zustand 스토어 업데이트
    setSelectedAccount(accountId);
    setCurrentAccountInfo(
      selectedAccount.social_id,
      selectedAccount.username || selectedAccount.social_id
    );
    // account_info, account_tags도 가져와서 저장
    try {
      const supabase = createClient();
      const { data: details, error: detailsError } = await supabase
        .from('social_accounts')
        .select('account_info, account_tags')
        .eq('id', accountId)
        .single();
      if (!detailsError && details) {
        setAccountDetails(details.account_info || '', details.account_tags || []);
      } else {
        setAccountDetails('', []);
      }
    } catch (err) {
      setAccountDetails('', []);
    }

    // DB의 user_profiles 테이블에도 선택된 계정 ID 저장
    try {
      const supabase = createClient();

      // selected_social_account 필드 업데이트
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ selected_social_account: selectedAccount.social_id })
        .eq('user_id', session.user.id);

      if (updateError) {
        console.error('소셜 계정 선택 저장 오류:', updateError);
        toast.error('계정 선택 정보 저장에 실패했습니다.');
      } else {
        console.log("계정 선택 정보 저장 성공:", selectedAccount.social_id);
      }
    } catch (error) {
      console.error('소셜 계정 선택 처리 오류:', error);
      toast.error('계정 선택 처리 중 오류가 발생했습니다.');
    }
  };

  // 온보딩 모달 닫기 핸들러
  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    setNewAccountId(null);
    // 계정 목록 새로고침
    fetchSocialAccounts();
  };

  // 현재 선택된 계정 정보 가져오기
  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  return (
    <div className="p-0">
      <Select
        value={selectedAccountId || undefined}
        onValueChange={handleAccountSelect}
        disabled={isLoading}
      >
        <SelectTrigger className="mt-2 p-4 flex justify-between items-center w-full bg-gray-200 dark:bg-gray-900 border-0 rounded-lg">
          <div className="flex items-center gap-2">
            {selectedAccount?.threads_profile_picture_url && (
              <img
                src={selectedAccount.threads_profile_picture_url}
                alt={selectedAccount.username || selectedAccount.social_id}
                className="w-6 h-6 rounded-full"
              />
            )}
            <div className="font-medium text-base">
              {selectedAccount
                ? (selectedAccount.username || selectedAccount.social_id)
                : '계정 선택'}
            </div>
          </div>
        </SelectTrigger>
        <SelectContent>
          {/* 계정 추가 버튼을 드롭다운 상단에 배치 */}
          <div
            className="flex items-center gap-2 px-2 py-2 mb-1 cursor-pointer hover:bg-accent rounded-sm"
            onClick={addSocialAccount}
          >
            <PlusCircle className="h-4 w-4" />
            <span className="font-medium">계정 추가</span>
          </div>

          {/* 구분선 추가 */}
          <SelectSeparator />

          {/* 계정 목록 */}
          <SelectGroup>
            <SelectLabel>계정 목록</SelectLabel>
            {accounts.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                등록된 계정이 없습니다
              </div>
            ) : (
              accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.username || account.social_id}
                </SelectItem>
              ))
            )}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* 온보딩 모달 */}
      {showOnboarding && newAccountId && (
        <OnboardingModal
          open={showOnboarding}
          onClose={handleCloseOnboarding}
          socialAccountId={newAccountId}
        />
      )}
    </div>
  );
} 