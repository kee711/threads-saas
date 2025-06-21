import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Strategy, PerformancePrediction, LearningStatus, ConversationMessage, AgentPreferences } from '@/components/agents/types';

interface AgentState {
  // Current state
  currentStrategy: Strategy | null;
  currentPrediction: PerformancePrediction | null;
  learningStatus: LearningStatus | null;
  conversationHistory: ConversationMessage[];
  preferences: AgentPreferences;

  // UI state
  isAgentSidebarOpen: boolean;
  isConversationModalOpen: boolean;
  selectedAgentId: string;

  // Actions
  setStrategy: (strategy: Strategy | null) => void;
  setPrediction: (prediction: PerformancePrediction | null) => void;
  setLearningStatus: (status: LearningStatus) => void;
  addConversationMessage: (message: ConversationMessage) => void;
  clearConversation: () => void;
  updatePreferences: (preferences: Partial<AgentPreferences>) => void;

  // UI actions
  toggleAgentSidebar: () => void;
  openAgentSidebar: () => void;
  closeAgentSidebar: () => void;
  toggleConversationModal: () => void;
  openConversationModal: () => void;
  closeConversationModal: () => void;
  setSelectedAgent: (agentId: string) => void;
}

const defaultPreferences: AgentPreferences = {
  learning_enabled: true,
  strategy_level: 'intermediate',
  feedback_frequency: 'always',
  preferred_agent_tone: 'professional',
  auto_suggestions: true,
  performance_tracking: true,
};

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStrategy: null,
      currentPrediction: null,
      learningStatus: null,
      conversationHistory: [],
      preferences: defaultPreferences,

      // UI state
      isAgentSidebarOpen: false,
      isConversationModalOpen: false,
      selectedAgentId: 'strategy-agent',

      // Actions
      setStrategy: (strategy) => set({ currentStrategy: strategy }),

      setPrediction: (prediction) => set({ currentPrediction: prediction }),

      setLearningStatus: (status) => set({ learningStatus: status }),

      addConversationMessage: (message) =>
        set((state) => ({
          conversationHistory: [...state.conversationHistory, message]
        })),

      clearConversation: () => set({ conversationHistory: [] }),

      updatePreferences: (newPreferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences }
        })),

      // UI actions
      toggleAgentSidebar: () =>
        set((state) => ({ isAgentSidebarOpen: !state.isAgentSidebarOpen })),

      openAgentSidebar: () => set({ isAgentSidebarOpen: true }),

      closeAgentSidebar: () => set({ isAgentSidebarOpen: false }),

      toggleConversationModal: () =>
        set((state) => ({ isConversationModalOpen: !state.isConversationModalOpen })),

      openConversationModal: () => set({ isConversationModalOpen: true }),

      closeConversationModal: () => set({ isConversationModalOpen: false }),

      setSelectedAgent: (agentId) => set({ selectedAgentId: agentId }),
    }),
    {
      name: 'agent-store',
      // Only persist preferences and selectedAgentId
      partialize: (state) => ({
        preferences: state.preferences,
        selectedAgentId: state.selectedAgentId,
      }),
    }
  )
);

// Selector hooks for better performance
export const useAgentStrategy = () => useAgentStore((state) => state.currentStrategy);
export const useAgentPrediction = () => useAgentStore((state) => state.currentPrediction);
export const useAgentLearningStatus = () => useAgentStore((state) => state.learningStatus);
export const useAgentConversation = () => useAgentStore((state) => state.conversationHistory);
export const useAgentPreferences = () => useAgentStore((state) => state.preferences);
export const useAgentUI = () => useAgentStore((state) => ({
  isAgentSidebarOpen: state.isAgentSidebarOpen,
  isConversationModalOpen: state.isConversationModalOpen,
  selectedAgentId: state.selectedAgentId,
  toggleAgentSidebar: state.toggleAgentSidebar,
  openAgentSidebar: state.openAgentSidebar,
  closeAgentSidebar: state.closeAgentSidebar,
  toggleConversationModal: state.toggleConversationModal,
  openConversationModal: state.openConversationModal,
  closeConversationModal: state.closeConversationModal,
  setSelectedAgent: state.setSelectedAgent,
})); 