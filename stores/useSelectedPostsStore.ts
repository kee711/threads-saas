import { create } from 'zustand'

interface SelectedPost {
  id: string
  content: string
  username: string
  avatar?: string
  type?: 'format' | 'content'
  timestamp?: string
  viewCount?: number
  likeCount?: number
  commentCount?: number
  repostCount?: number
  shareCount?: number
  topComment?: string
  url?: string
}

interface SelectedPostsState {
  selectedPosts: SelectedPost[]
  addPost: (post: SelectedPost) => void
  removePost: (postId: string) => void
  updatePostType: (postId: string, type: 'format' | 'content') => void
  clearPosts: () => void
}

const useSelectedPostsStore = create<SelectedPostsState>((set) => ({
  selectedPosts: [],

  addPost: (post) => set((state) => {
    // 이미 2개가 선택되어 있으면 추가하지 않음
    if (state.selectedPosts.length >= 2) return state

    // 이미 선택된 포스트면 추가하지 않음
    if (state.selectedPosts.some(p => p.id === post.id)) return state

    return { selectedPosts: [...state.selectedPosts, post] }
  }),

  removePost: (postId) => set((state) => ({
    selectedPosts: state.selectedPosts.filter(post => post.id !== postId)
  })),

  updatePostType: (postId, type) => set((state) => ({
    selectedPosts: state.selectedPosts.map(post =>
      post.id === postId ? { ...post, type } : post
    )
  })),

  clearPosts: () => set({ selectedPosts: [] })
}))

export default useSelectedPostsStore 