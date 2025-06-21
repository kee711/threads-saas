import { BaseAgent } from '../core/BaseAgent';
import { UserProfile, ContentRequest } from '../types';
import { MemoryManager } from '../memory/MemoryManager';

export class StrategyAgent extends BaseAgent {
  private memoryManager: MemoryManager;

  constructor() {
    super('Strategy Agent', 'strategy', 'Analyzes user profile and develops content strategy');
    this.memoryManager = new MemoryManager();
  }

  async process(input: {
    userProfile: UserProfile;
    contentRequest: ContentRequest;
    context?: any;
  }): Promise<{
    strategy: {
      content_approach: string;
      tone_recommendation: string;
      topic_focus: string[];
      engagement_tactics: string[];
      timing_suggestion: string;
      hashtag_recommendations: string[];
    };
    confidence_score: number;
    reasoning: string;
  }> {
    const startTime = Date.now();

    try {
      // Get user patterns from memory
      const userPatterns = await this.memoryManager.process({
        action: 'get_user_patterns',
        data: { userId: input.userProfile.id }
      });

      // Analyze current request context
      const contextAnalysis = await this.analyzeContext(input.contentRequest, input.userProfile);

      // Generate strategic recommendations
      const strategy = await this.generateStrategy(
        input.userProfile,
        input.contentRequest,
        userPatterns,
        contextAnalysis
      );

      const result = {
        strategy,
        confidence_score: this.calculateConfidenceScore(userPatterns, contextAnalysis),
        reasoning: await this.generateReasoning(strategy, userPatterns),
      };

      // Store interaction for learning
      await this.memoryManager.process({
        action: 'store_interaction',
        data: {
          userId: input.userProfile.id,
          agentType: 'strategy',
          interactionType: 'strategy_generation',
          input: {
            content_type: input.contentRequest.content_type,
            topic: input.contentRequest.topic,
            urgency: input.contentRequest.urgency,
          },
          output: result,
          metadata: {
            processing_time: Date.now() - startTime,
            user_preferences: input.userProfile.content_preferences,
          },
        },
      });

      this.logInteraction(input, result, Date.now() - startTime);
      return result;

    } catch (error) {
      console.error('Strategy Agent error:', error);
      throw error;
    }
  }

  private async analyzeContext(request: ContentRequest, profile: UserProfile): Promise<{
    trending_topics: string[];
    audience_activity_level: 'low' | 'medium' | 'high';
    competitive_landscape: string;
    optimal_timing: string;
  }> {
    const prompt = `
    Analyze the content context for a ${request.content_type} request:
    
    User Profile:
    - Target Audience: ${profile.content_preferences.target_audience}
    - Preferred Topics: ${profile.content_preferences.topics.join(', ')}
    - Current Tone: ${profile.content_preferences.tone}
    
    Content Request:
    - Topic: ${request.topic || 'General'}
    - Urgency: ${request.urgency}
    - Context: ${request.context || 'None provided'}
    
    Provide analysis in JSON format with:
    - trending_topics: array of relevant trending topics
    - audience_activity_level: low/medium/high
    - competitive_landscape: brief analysis
    - optimal_timing: recommended posting time
    `;

    const response = await this.executePrompt(prompt, {});
    
    try {
      return JSON.parse(response);
    } catch {
      // Fallback if JSON parsing fails
      return {
        trending_topics: [request.topic || 'general'],
        audience_activity_level: 'medium' as const,
        competitive_landscape: 'Standard competitive environment',
        optimal_timing: 'Peak hours recommended',
      };
    }
  }

  private async generateStrategy(
    profile: UserProfile,
    request: ContentRequest,
    userPatterns: any,
    contextAnalysis: any
  ): Promise<{
    content_approach: string;
    tone_recommendation: string;
    topic_focus: string[];
    engagement_tactics: string[];
    timing_suggestion: string;
    hashtag_recommendations: string[];
  }> {
    const prompt = `
    Generate a content strategy based on:
    
    User Profile:
    - Preferred Tone: ${profile.content_preferences.tone}
    - Topics: ${profile.content_preferences.topics.join(', ')}
    - Target Audience: ${profile.content_preferences.target_audience}
    - Posting Frequency: ${profile.content_preferences.posting_frequency}
    
    Content Request:
    - Type: ${request.content_type}
    - Topic: ${request.topic || 'General'}
    - Urgency: ${request.urgency}
    
    User Patterns (if available):
    - Best performing topics: ${userPatterns.contentPatterns?.map((p: any) => p.topic).join(', ') || 'None yet'}
    - Tone preferences: ${JSON.stringify(userPatterns.tonePreferences) || 'None yet'}
    
    Context Analysis:
    - Trending Topics: ${contextAnalysis.trending_topics.join(', ')}
    - Audience Activity: ${contextAnalysis.audience_activity_level}
    - Optimal Timing: ${contextAnalysis.optimal_timing}
    
    Provide strategy in JSON format with:
    - content_approach: strategic approach description
    - tone_recommendation: recommended tone with reasoning
    - topic_focus: array of 3-5 focused topics
    - engagement_tactics: array of specific engagement strategies
    - timing_suggestion: specific timing recommendation
    - hashtag_recommendations: array of 5-8 relevant hashtags
    `;

    const response = await this.executePrompt(prompt, {});
    
    try {
      return JSON.parse(response);
    } catch {
      // Fallback strategy
      return {
        content_approach: `Create ${request.content_type} content with ${profile.content_preferences.tone} tone`,
        tone_recommendation: profile.content_preferences.tone,
        topic_focus: [request.topic || 'general', ...profile.content_preferences.topics.slice(0, 2)],
        engagement_tactics: ['Ask questions', 'Share insights', 'Use storytelling'],
        timing_suggestion: contextAnalysis.optimal_timing,
        hashtag_recommendations: ['#threads', '#content', '#engagement'],
      };
    }
  }

  private calculateConfidenceScore(userPatterns: any, contextAnalysis: any): number {
    let score = 0.5; // Base score

    // Increase confidence based on available user patterns
    if (userPatterns.recentInteractions.length > 10) score += 0.2;
    if (userPatterns.contentPatterns.length > 0) score += 0.15;
    if (userPatterns.tonePreferences && Object.keys(userPatterns.tonePreferences).length > 0) score += 0.15;

    // Context analysis quality
    if (contextAnalysis.trending_topics.length > 0) score += 0.1;

    return Math.min(score, 1.0);
  }

  private async generateReasoning(strategy: any, userPatterns: any): Promise<string> {
    const prompt = `
    Explain the reasoning behind this content strategy:
    
    Strategy: ${JSON.stringify(strategy)}
    
    User Historical Data: ${userPatterns.recentInteractions.length} interactions analyzed
    
    Provide a clear, concise explanation of why this strategy was chosen.
    `;

    return await this.executePrompt(prompt, {});
  }

  async learn(feedback: {
    userId: string;
    strategyId: string;
    actualPerformance: any;
    userFeedback?: string;
  }): Promise<void> {
    // Store learning feedback
    await this.memoryManager.process({
      action: 'store_interaction',
      data: {
        userId: feedback.userId,
        agentType: 'strategy',
        interactionType: 'strategy_feedback',
        input: { strategyId: feedback.strategyId },
        output: feedback.actualPerformance,
        metadata: {
          user_feedback: feedback.userFeedback,
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log(`Strategy Agent learned from feedback for strategy ${feedback.strategyId}`);
  }
}