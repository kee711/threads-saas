import { create } from 'zustand'

interface SelectedPost {
  id: string
  content: string
  url?: string
}

interface SelectedPostsState {
  selectedPosts: SelectedPost[]
  addPost: (post: SelectedPost) => void
  removePost: (postId: string) => void
  updatePostType: (postId: string) => void
  clearPosts: () => void
}

const useSelectedPostsStore = create<SelectedPostsState>((set) => ({
  selectedPosts: [],

  // 포스트 추가
  addPost: (post) => set((state) => {
    // 이미 2개가 선택되어 있으면 추가하지 않음
    if (state.selectedPosts.length >= 3) {
      return { selectedPosts: state.selectedPosts }
    }

    // 이미 선택된 포스트면 추가하지 않음
    if (state.selectedPosts.some(p => p.id === post.id)) {
      return { selectedPosts: state.selectedPosts }
    }

    // 조건을 모두 통과한 경우에만 새 포스트 추가
    return { selectedPosts: [...state.selectedPosts, post] }
  }),

  removePost: (postId) => set((state) => ({
    selectedPosts: state.selectedPosts.filter(post => post.id !== postId)
  })),

  updatePostType: (postId) => set((state) => ({
    selectedPosts: state.selectedPosts.map(post =>
      post.id === postId ? { ...post, } : post
    )
  })),

  clearPosts: () => set({ selectedPosts: [] })
}))

export default useSelectedPostsStore 