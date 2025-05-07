import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 소셜 계정 정보 타입 정의
interface SocialAccount {
  id: string
  social_id: string
  platform: string
  access_token: string
  owner: string
  is_active: boolean
}

// 스토어 타입 정의
interface SocialAccountStore {
  accounts: SocialAccount[]
  selectedAccountId: string | null
  setAccounts: (accounts: SocialAccount[]) => void
  setSelectedAccount: (accountId: string) => void
  getSelectedAccount: () => SocialAccount | undefined
}

// 소셜 계정 전환을 위한 zustand 스토어 생성
const useSocialAccountStore = create<SocialAccountStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      selectedAccountId: null,

      setAccounts: (accounts) => set({
        accounts,
        // 계정 목록이 업데이트되면 첫 번째 계정을 선택
        selectedAccountId: accounts.length > 0 ? accounts[0].id : null
      }),

      setSelectedAccount: (accountId) => set({
        selectedAccountId: accountId
      }),

      getSelectedAccount: () => {
        const { accounts, selectedAccountId } = get();
        return accounts.find(account => account.id === selectedAccountId);
      }
    }),
    {
      name: 'social-account-store',
    }
  )
)

export default useSocialAccountStore 