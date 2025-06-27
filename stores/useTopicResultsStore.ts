import { create } from 'zustand';

export interface TopicResult {
  topic: string;
  detail?: string;
  loading?: boolean;
  dialogOpen?: boolean;
}

interface TopicResultsState {
  topicResults: TopicResult[];
  setTopicResults: (results: TopicResult[]) => void;
  addTopicResults: (results: TopicResult[]) => void;
  updateTopicResult: (idx: number, newVal: string) => void;
  setTopicLoading: (topic: string, loading: boolean) => void;
  setTopicDetail: (topic: string, detail: string) => void;
  setDialogOpen: (idx: number, open: boolean) => void;
  removeTopicResult: () => void;
  clearTopicResults: () => void;
}

export const useTopicResultsStore = create<TopicResultsState>((set) => ({
  topicResults: [],
  setTopicResults: (results) => set({ topicResults: results }),
  addTopicResults: (results) => set((state) => ({ topicResults: [...state.topicResults, ...results] })),
  updateTopicResult: (idx, newVal) => set((state) => ({
    topicResults: state.topicResults.map((t, i) => i === idx ? { ...t, topic: newVal } : t)
  })),
  setTopicLoading: (topic, loading) => set((state) => ({
    topicResults: state.topicResults.map((t) => t.topic === topic ? { ...t, loading } : t)
  })),
  setTopicDetail: (topic, detail) => set((state) => ({
    topicResults: state.topicResults.map((t) => t.topic === topic ? { ...t, detail, loading: false, dialogOpen: false } : t)
  })),
  setDialogOpen: (idx, open) => set((state) => ({
    topicResults: state.topicResults.map((t, i) => i === idx ? { ...t, dialogOpen: open } : { ...t, dialogOpen: false })
  })),
  removeTopicResult: () => set((state) => ({
    // remove all topic results
    topicResults: []
  })),
  clearTopicResults: () => set({ topicResults: [] }),
}));
