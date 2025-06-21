export interface UserProfile {
  id: string;
  name: string;
  email: string;
  threads_account_id?: string;
  content_preferences: {
    tone: 'professional' | 'casual' | 'humorous' | 'inspirational';
    topics: string[];
    posting_frequency: 'daily' | 'weekly' | 'custom';
    target_audience: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AgentMemory {
  id: string;
  user_id: string;
  agent_type: AgentType;
  memory_type: 'interaction' | 'preference' | 'performance' | 'content_pattern';
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ContentRequest {
  user_id: string;
  content_type: 'post' | 'thread' | 'comment_reply';
  topic?: string;
  context?: string;
  target_length?: number;
  urgency: 'low' | 'medium' | 'high';
  brand_guidelines?: string[];
}

export interface ContentResponse {
  content: string;
  confidence_score: number;
  tone_match_score: number;
  brand_consistency_score: number;
  engagement_prediction: number;
  suggestions: string[];
  metadata: {
    agent_chain: AgentType[];
    processing_time: number;
    tokens_used: number;
  };
}

export type AgentType = 'strategy' | 'creator' | 'qa' | 'performance' | 'memory';

export interface BaseAgent {
  name: string;
  type: AgentType;
  description: string;
  process(input: any, context?: any): Promise<any>;
  learn(feedback: any): Promise<void>;
}

export interface AgentChainResult {
  success: boolean;
  result?: ContentResponse;
  error?: string;
  chain_steps: {
    agent: AgentType;
    input: any;
    output: any;
    processing_time: number;
  }[];
}

export interface PerformanceMetrics {
  content_id: string;
  user_id: string;
  agent_version: string;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    engagement_rate: number;
    reach: number;
  };
  created_at: string;
}