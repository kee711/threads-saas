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
        .eq('platform', 'threads');

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
          onValueChange={setSelectedAccount}
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