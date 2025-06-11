import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '../utils/supabase/client';

// 소셜 계정 정보 타입 정의
interface SocialAccount {
  id: string
  social_id: string
  platform: string
  access_token: string
  owner: string
  is_active: boolean
  username?: string
  threads_profile_picture_url?: string
}

// 스토어 타입 정의
interface SocialAccountStore {
  accounts: SocialAccount[]
  selectedAccountId: string | null
  currentSocialId: string | null // 현재 선택된 계정의 social_id
  currentUsername: string | null // 현재 선택된 계정의 username
  accountInfo: string | null
  accountTags: string[]
  accountType?: string | null // 추가: 계정 유형

  setAccounts: (accounts: SocialAccount[]) => void
  setSelectedAccount: (accountId: string) => void
  setCurrentAccountInfo: (socialId: string, username: string | null) => void
  getSelectedAccount: () => SocialAccount | undefined
  setAccountDetails: (info: string | null, tags: string[], type?: string | null) => void

  // 추가: supabase에서 직접 fetch하는 메서드
  fetchSocialAccounts: (userId: string) => Promise<void>
  fetchAccountDetails: (accountId: string) => Promise<void>
}

// 소셜 계정 전환을 위한 zustand 스토어 생성
const useSocialAccountStore = create<SocialAccountStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      selectedAccountId: null,
      currentSocialId: null,
      currentUsername: null,
      accountInfo: null,
      accountTags: [],
      accountType: null,

      setAccounts: (accounts) => {
        console.log("소셜 계정 목록 업데이트:", accounts);
        const existingSelectedId = get().selectedAccountId;
        const newSelectedId = existingSelectedId || (accounts.length > 0 ? accounts[0].id : null);

        // 새롭게 선택된 계정의 정보도 업데이트
        if (newSelectedId) {
          const selectedAccount = accounts.find(acc => acc.id === newSelectedId);
          if (selectedAccount) {
            console.log("선택된 계정 정보:", {
              id: selectedAccount.id,
              social_id: selectedAccount.social_id,
              username: selectedAccount.username
            });

            set({
              accounts,
              selectedAccountId: newSelectedId,
              currentSocialId: selectedAccount.social_id,
              currentUsername: selectedAccount.username || selectedAccount.social_id
            });
            return;
          }
        }

        set({
          accounts,
          selectedAccountId: newSelectedId
        });
      },

      setSelectedAccount: (accountId) => {
        console.log("계정 선택 변경:", accountId);
        const account = get().accounts.find(acc => acc.id === accountId);

        if (account) {
          console.log("선택된 계정 정보:", {
            id: account.id,
            social_id: account.social_id,
            username: account.username
          });

          set({
            selectedAccountId: accountId,
            currentSocialId: account.social_id,
            currentUsername: account.username || account.social_id
          });
        } else {
          console.warn("선택된 계정을 찾을 수 없음:", accountId);
          set({ selectedAccountId: accountId });
        }
      },

      setCurrentAccountInfo: (socialId, username) => {
        console.log("현재 계정 정보 업데이트:", { socialId, username });
        set({
          currentSocialId: socialId,
          currentUsername: username || socialId
        });
      },

      getSelectedAccount: () => {
        const { accounts, selectedAccountId } = get();
        const account = accounts.find(account => account.id === selectedAccountId);
        console.log("현재 선택된 계정:", account);
        return account;
      },

      setAccountDetails: (info, tags, type) => {
        set({
          accountInfo: info,
          accountTags: tags || [],
          accountType: type || null
        });
      },

      // supabase에서 계정 목록 fetch
      fetchSocialAccounts: async (userId) => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('social_accounts')
          .select('*')
          .eq('owner', userId);
        if (!error && data) {
          get().setAccounts(data);
        } else {
          set({ accounts: [] });
        }
      },

      // supabase에서 계정 상세 fetch
      fetchAccountDetails: async (accountId) => {
        const supabase = createClient();
        const { data: accountData, error: accountError } = await supabase
          .from('social_accounts')
          .select('account_type, account_info, account_tags')
          .eq('id', accountId)
          .single();
        if (!accountError && accountData) {
          set({
            accountType: accountData.account_type || '',
            accountInfo: accountData.account_info || '',
            accountTags: accountData.account_tags || []
          });
        } else {
          set({ accountType: '', accountInfo: '', accountTags: [] });
        }
      }
    }),
    {
      name: 'social-account-store',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to rehydrate social account store:', error);
          // Clear corrupted data
          localStorage.removeItem('social-account-store');
        }
      },
    }
  )
)

export default useSocialAccountStore 