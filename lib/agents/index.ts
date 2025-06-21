// Core exports
export { BaseAgent } from './core/BaseAgent';
export { AgentOrchestrator } from './core/AgentOrchestrator';

// Agent exports
export { StrategyAgent } from './strategies/StrategyAgent';
export { MemoryManager } from './memory/MemoryManager';

// Type exports
export type {
  UserProfile,
  AgentMemory,
  ContentRequest,
  ContentResponse,
  AgentType,
  BaseAgent as IBaseAgent,
  AgentChainResult,
  PerformanceMetrics,
} from './types';

// Utility function to create a new agent orchestrator
export function createAgentOrchestrator(): AgentOrchestrator {
  return new AgentOrchestrator();
}

// Utility function to validate user profile
export function validateUserProfile(profile: any): profile is UserProfile {
  return (
    profile &&
    typeof profile.id === 'string' &&
    typeof profile.name === 'string' &&
    typeof profile.email === 'string' &&
    profile.content_preferences &&
    typeof profile.content_preferences.tone === 'string' &&
    Array.isArray(profile.content_preferences.topics) &&
    typeof profile.content_preferences.posting_frequency === 'string' &&
    typeof profile.content_preferences.target_audience === 'string'
  );
}

// Utility function to validate content request
export function validateContentRequest(request: any): request is ContentRequest {
  return (
    request &&
    typeof request.user_id === 'string' &&
    typeof request.content_type === 'string' &&
    typeof request.urgency === 'string' &&
    ['post', 'thread', 'comment_reply'].includes(request.content_type) &&
    ['low', 'medium', 'high'].includes(request.urgency)
  );
}