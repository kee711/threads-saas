import { AgentType, ContentResponse, AgentMemory } from '@/lib/agents/types';

export interface Strategy {
  id: string;
  title: string;
  description: string;
  confidence_score: number;
  reasoning: string[];
  recommended_actions: string[];
  target_audience: string;
  content_pillars: string[];
}

export interface PerformancePrediction {
  engagement_rate: number;
  predicted_likes: number;
  predicted_comments: number;
  predicted_shares: number;
  confidence: number;
  optimal_timing: string;
  improvement_suggestions: string[];
}

export interface LearningStatus {
  totalInteractions: number;
  learningScore: number;
  improvementAreas: string[];
  strengths: string[];
  recentLearnings: string[];
  nextMilestone: string;
}

export interface ConversationMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  agentType?: AgentType;
  metadata?: {
    confidence?: number;
    strategy?: Strategy;
    reasoning?: string[];
  };
}

export interface AgentPreferences {
  learning_enabled: boolean;
  strategy_level: 'beginner' | 'intermediate' | 'advanced';
  feedback_frequency: 'always' | 'sometimes' | 'rarely';
  preferred_agent_tone: 'professional' | 'casual' | 'friendly' | 'direct';
  auto_suggestions: boolean;
  performance_tracking: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  description: string;
}

export interface AgentInsight {
  id: string;
  type: 'strategy' | 'performance' | 'learning' | 'improvement';
  title: string;
  content: string;
  confidence: number;
  actionable: boolean;
  created_at: Date;
} 