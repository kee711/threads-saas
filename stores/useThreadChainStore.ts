import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ThreadContent {
  content: string
  media_urls?: string[]
  media_type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL'
}

interface ThreadChainState {
  // Main thread chain
  threadChain: ThreadContent[]
  
  // Core actions
  setThreadChain: (threads: ThreadContent[]) => void
  updateThreadContent: (index: number, content: string) => void
  updateThreadMedia: (index: number, media_urls: string[]) => void
  addThread: () => void
  removeThread: (index: number) => void
  clearThreadChain: () => void
  
  // Add content from external sources
  addContentAsThread: (content: string) => void
  removeContentFromThread: (content: string) => void
  
  // Pending thread chain (from topic finder)
  pendingThreadChain: ThreadContent[] | null
  setPendingThreadChain: (threads: ThreadContent[] | null) => void
  applyPendingThreadChain: () => void
  clearPendingThreadChain: () => void
}

const useThreadChainStore = create<ThreadChainState>()(
  persist(
    (set, get) => ({
      // Initial state
      threadChain: [{ content: '', media_urls: [], media_type: 'TEXT' }],
      pendingThreadChain: null,

      // Core actions
      setThreadChain: (threads) => set({ threadChain: threads }),

      updateThreadContent: (index, content) => set((state) => ({
        threadChain: state.threadChain.map((thread, i) =>
          i === index ? { ...thread, content } : thread
        )
      })),

      updateThreadMedia: (index, media_urls) => set((state) => ({
        threadChain: state.threadChain.map((thread, i) =>
          i === index ? {
            ...thread,
            media_urls,
            media_type: media_urls.length > 1 ? 'CAROUSEL' : media_urls.length === 1 ? 'IMAGE' : 'TEXT'
          } : thread
        )
      })),

      addThread: () => set((state) => ({
        threadChain: [...state.threadChain, { content: '', media_urls: [], media_type: 'TEXT' }]
      })),

      removeThread: (index) => set((state) => {
        // Don't allow removing the last thread
        if (state.threadChain.length <= 1) return state;
        
        return {
          threadChain: state.threadChain.filter((_, i) => i !== index)
        };
      }),

      clearThreadChain: () => set({
        threadChain: [{ content: '', media_urls: [], media_type: 'TEXT' }]
      }),

      // Add content from external sources (like ContentList)
      addContentAsThread: (content) => set((state) => {
        // If first thread is empty, replace it
        if (state.threadChain.length === 1 && state.threadChain[0].content === '') {
          return {
            threadChain: [{ content, media_urls: [], media_type: 'TEXT' }]
          };
        }
        
        // Otherwise add as new thread
        return {
          threadChain: [...state.threadChain, { content, media_urls: [], media_type: 'TEXT' }]
        };
      }),

      // Remove specific content from thread chain
      removeContentFromThread: (content) => set((state) => {
        const updatedThreadChain = state.threadChain.filter(thread =>
          thread.content.trim() !== content.trim()
        );
        
        // If we removed all content, ensure at least one empty thread remains
        if (updatedThreadChain.length === 0) {
          return {
            threadChain: [{ content: '', media_urls: [], media_type: 'TEXT' }]
          };
        }
        
        return { threadChain: updatedThreadChain };
      }),

      // Pending thread chain functionality
      setPendingThreadChain: (threads) => set({ pendingThreadChain: threads }),

      applyPendingThreadChain: () => set((state) => {
        if (state.pendingThreadChain) {
          return {
            threadChain: state.pendingThreadChain,
            pendingThreadChain: null
          };
        }
        return state;
      }),

      clearPendingThreadChain: () => set({ pendingThreadChain: null })
    }),
    {
      name: 'thread-chain-storage',
      // Only persist the main threadChain, not pendingThreadChain
      partialize: (state) => ({ threadChain: state.threadChain })
    }
  )
)

export default useThreadChainStore