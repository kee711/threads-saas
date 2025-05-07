'use client';

import { useEffect, useState } from 'react';
import { PlusCircle, User2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import useSocialAccountStore from '@/stores/useSocialAccountStore';
import { createClient } from '@/lib/supabase/client';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface SocialAccountSelectorProps {
  className?: string;
}

export function SocialAccountSelector({ className }: SocialAccountSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const { accounts, selectedAccountId, setAccounts, setSelectedAccount } = useSocialAccountStore();

  // 소셜 계정 목록 가져오기
  const fetchSocialAccounts = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('owner', session.user.id)
        .eq('platform', 'threads')
        .eq('is_active', true);

      if (error) throw error;

      if (data && data.length > 0) {
        setAccounts(data);
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
    window.location.href = '/api/threads/oauth';
  };

  // 컴포넌트 마운트시 데이터 가져오기
  useEffect(() => {
    fetchSocialAccounts();
  }, [session?.user?.id]);

  // 계정 선택 시 user_profiles 테이블의 settings에 저장
  const handleAccountSelect = async (accountId: string) => {
    if (!session?.user?.id) return;

    setSelectedAccount(accountId); // Zustand 스토어 업데이트

    // DB의 user_profiles 테이블에도 선택된 계정 ID 저장
    try {
      const supabase = createClient();

      // 현재 settings 데이터 가져오기
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('settings')
        .eq('id', session.user.id)
        .single();

      // 기존 settings 유지하면서 selectedAccountId만 업데이트
      const updatedSettings = {
        ...(userData?.settings || {}),
        selectedAccountId: accountId
      };

      // settings 필드 업데이트
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ settings: updatedSettings })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('소셜 계정 선택 저장 오류:', updateError);
      }
    } catch (error) {
      console.error('소셜 계정 선택 처리 오류:', error);
    }
  };

  // 계정 목록이 없을 경우 빈 상태 표시
  if (accounts.length === 0) {
    return (
      <div className={`flex items-center justify-between p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <User2 className="h-5 w-5" />
          <span>소셜 계정 없음</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={addSocialAccount}
          disabled={isLoading}
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          계정 추가
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <User2 className="h-5 w-5" />
        <span>소셜 계정:</span>

        <Select
          value={selectedAccountId || undefined}
          onValueChange={handleAccountSelect}
          disabled={isLoading}
        >
          <SelectTrigger className="min-w-[120px]">
            <SelectValue placeholder="계정 선택" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.social_id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={addSocialAccount}
        disabled={isLoading}
      >
        <PlusCircle className="h-4 w-4 mr-1" />
        계정 추가
      </Button>
    </div>
  );
} 