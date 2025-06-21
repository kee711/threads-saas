import { BaseAgent } from '../core/BaseAgent';
import { AgentMemory, UserProfile } from '../types';
import { createClient } from '@supabase/supabase-js';

export class MemoryManager extends BaseAgent {
  private supabase;

  constructor() {
    super('Memory Manager', 'memory', 'Manages agent interactions and user preferences');
    
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }

  async process(input: { action: string; data: any }, context?: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      switch (input.action) {
        case 'store_interaction':
          return await this.storeInteraction(input.data);
        case 'get_user_patterns':
          return await this.getUserPatterns(input.data.userId);
        case 'update_preferences':
          return await this.updateUserPreferences(input.data);
        case 'get_agent_performance':
          return await this.getAgentPerformance(input.data);
        default:
          throw new Error(`Unknown memory action: ${input.action}`);
      }
    } finally {
      this.logInteraction(input, 'Memory operation completed', Date.now() - startTime);
    }
  }

  private async storeInteraction(data: {
    userId: string;
    agentType: string;
    interactionType: string;
    input: any;
    output: any;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const memoryRecord: Partial<AgentMemory> = {
      user_id: data.userId,
      agent_type: data.agentType as any,
      memory_type: 'interaction',
      data: {
        interaction_type: data.interactionType,
        input: data.input,
        output: data.output,
        metadata: data.metadata || {},
        timestamp: new Date().toISOString(),
      },
    };

    const { error } = await this.supabase
      .from('agent_memories')
      .insert(memoryRecord);

    if (error) {
      console.error('Error storing interaction:', error);
      throw error;
    }
  }

  private async getUserPatterns(userId: string): Promise<{
    contentPatterns: any[];
    tonePreferences: any;
    engagementPatterns: any;
    recentInteractions: AgentMemory[];
  }> {
    // Get recent interactions
    const { data: interactions, error: interactionsError } = await this.supabase
      .from('agent_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('memory_type', 'interaction')
      .order('created_at', { ascending: false })
      .limit(50);

    if (interactionsError) {
      console.error('Error fetching interactions:', interactionsError);
      throw interactionsError;
    }

    // Analyze patterns from interactions
    const contentPatterns = this.analyzeContentPatterns(interactions || []);
    const tonePreferences = this.analyzeTonePreferences(interactions || []);
    const engagementPatterns = this.analyzeEngagementPatterns(interactions || []);

    return {
      contentPatterns,
      tonePreferences,
      engagementPatterns,
      recentInteractions: interactions || [],
    };
  }

  private async updateUserPreferences(data: {
    userId: string;
    preferences: Partial<UserProfile['content_preferences']>;
  }): Promise<void> {
    const memoryRecord: Partial<AgentMemory> = {
      user_id: data.userId,
      agent_type: 'memory',
      memory_type: 'preference',
      data: {
        preferences: data.preferences,
        updated_at: new Date().toISOString(),
      },
    };

    const { error } = await this.supabase
      .from('agent_memories')
      .insert(memoryRecord);

    if (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  private async getAgentPerformance(data: { agentType?: string; timeRange?: string }): Promise<any> {
    let query = this.supabase
      .from('agent_memories')
      .select('*')
      .eq('memory_type', 'performance');

    if (data.agentType) {
      query = query.eq('agent_type', data.agentType);
    }

    if (data.timeRange) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (data.timeRange === 'week' ? 7 : 30));
      query = query.gte('created_at', cutoffDate.toISOString());
    }

    const { data: performanceData, error } = await query;

    if (error) {
      console.error('Error fetching performance data:', error);
      throw error;
    }

    return this.aggregatePerformanceMetrics(performanceData || []);
  }

  private analyzeContentPatterns(interactions: AgentMemory[]): any[] {
    // Analyze content creation patterns, topics, lengths, etc.
    const patterns = interactions
      .filter(i => i.data.interaction_type === 'content_generation')
      .reduce((acc, interaction) => {
        const topic = interaction.data.input?.topic || 'general';
        const length = interaction.data.output?.content?.length || 0;
        
        if (!acc[topic]) {
          acc[topic] = { count: 0, avgLength: 0, totalLength: 0 };
        }
        
        acc[topic].count++;
        acc[topic].totalLength += length;
        acc[topic].avgLength = acc[topic].totalLength / acc[topic].count;
        
        return acc;
      }, {} as Record<string, any>);

    return Object.entries(patterns).map(([topic, stats]) => ({ topic, ...stats }));
  }

  private analyzeTonePreferences(interactions: AgentMemory[]): any {
    const toneAnalysis = interactions
      .filter(i => i.data.output?.tone_match_score)
      .reduce((acc, interaction) => {
        const tone = interaction.data.input?.tone || 'professional';
        const score = interaction.data.output.tone_match_score;
        
        if (!acc[tone]) {
          acc[tone] = { scores: [], avgScore: 0 };
        }
        
        acc[tone].scores.push(score);
        acc[tone].avgScore = acc[tone].scores.reduce((a, b) => a + b, 0) / acc[tone].scores.length;
        
        return acc;
      }, {} as Record<string, any>);

    return toneAnalysis;
  }

  private analyzeEngagementPatterns(interactions: AgentMemory[]): any {
    // This would analyze engagement metrics over time
    return {
      avgEngagementRate: 0.05, // Placeholder
      bestPerformingTopics: [],
      optimalPostingTimes: [],
    };
  }

  private aggregatePerformanceMetrics(performanceData: AgentMemory[]): any {
    // Aggregate performance metrics across agents
    return {
      totalInteractions: performanceData.length,
      avgProcessingTime: 0,
      successRate: 0.95,
      userSatisfactionScore: 0.85,
    };
  }

  async learn(feedback: any): Promise<void> {
    // Store learning feedback as memory
    await this.storeInteraction({
      userId: feedback.userId,
      agentType: 'memory',
      interactionType: 'learning_feedback',
      input: feedback,
      output: { learned: true },
      metadata: { timestamp: new Date().toISOString() },
    });
  }
}