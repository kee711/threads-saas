import { StateGraph } from '@langchain/langgraph';
import { StrategyAgent } from '../strategies/StrategyAgent';
import { MemoryManager } from '../memory/MemoryManager';
import { 
  UserProfile, 
  ContentRequest, 
  ContentResponse, 
  AgentChainResult,
  AgentType 
} from '../types';

interface AgentState {
  userProfile: UserProfile;
  contentRequest: ContentRequest;
  strategyResult?: any;
  creatorResult?: any;
  qaResult?: any;
  performanceResult?: any;
  finalResult?: ContentResponse;
  errors: string[];
  chainSteps: Array<{
    agent: AgentType;
    input: any;
    output: any;
    processing_time: number;
  }>;
}

export class AgentOrchestrator {
  private strategyAgent: StrategyAgent;
  private memoryManager: MemoryManager;
  private workflow: StateGraph<AgentState>;

  constructor() {
    this.strategyAgent = new StrategyAgent();
    this.memoryManager = new MemoryManager();
    this.workflow = this.buildWorkflow();
  }

  private buildWorkflow(): StateGraph<AgentState> {
    // Create the workflow graph
    const workflow = new StateGraph<AgentState>({
      channels: {
        userProfile: null,
        contentRequest: null,
        strategyResult: null,
        creatorResult: null,
        qaResult: null,
        performanceResult: null,
        finalResult: null,
        errors: [],
        chainSteps: [],
      }
    });

    // Define workflow nodes
    workflow.addNode('strategy', this.strategyStep.bind(this));
    workflow.addNode('creator', this.creatorStep.bind(this));
    workflow.addNode('qa', this.qaStep.bind(this));
    workflow.addNode('performance', this.performanceStep.bind(this));
    workflow.addNode('finalize', this.finalizeStep.bind(this));

    // Define workflow edges
    workflow.addEdge('strategy', 'creator');
    workflow.addEdge('creator', 'qa');
    workflow.addEdge('qa', 'performance');
    workflow.addEdge('performance', 'finalize');

    // Set entry point
    workflow.setEntryPoint('strategy');
    workflow.setFinishPoint('finalize');

    return workflow;
  }

  async processContentRequest(
    userProfile: UserProfile,
    contentRequest: ContentRequest
  ): Promise<AgentChainResult> {
    const startTime = Date.now();
    
    try {
      const initialState: AgentState = {
        userProfile,
        contentRequest,
        errors: [],
        chainSteps: [],
      };

      // Compile and run the workflow
      const app = this.workflow.compile();
      const result = await app.invoke(initialState);

      // Store the interaction
      await this.memoryManager.process({
        action: 'store_interaction',
        data: {
          userId: userProfile.id,
          agentType: 'orchestrator',
          interactionType: 'content_generation',
          input: contentRequest,
          output: result.finalResult,
          metadata: {
            processing_time: Date.now() - startTime,
            chain_steps: result.chainSteps,
          },
        },
      });

      return {
        success: result.errors.length === 0,
        result: result.finalResult,
        error: result.errors.length > 0 ? result.errors.join('; ') : undefined,
        chain_steps: result.chainSteps,
      };

    } catch (error) {
      console.error('Agent orchestration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        chain_steps: [],
      };
    }
  }

  private async strategyStep(state: AgentState): Promise<Partial<AgentState>> {
    const startTime = Date.now();
    
    try {
      const result = await this.strategyAgent.process({
        userProfile: state.userProfile,
        contentRequest: state.contentRequest,
      });

      const processingTime = Date.now() - startTime;
      
      return {
        strategyResult: result,
        chainSteps: [
          ...state.chainSteps,
          {
            agent: 'strategy',
            input: { userProfile: state.userProfile, contentRequest: state.contentRequest },
            output: result,
            processing_time: processingTime,
          },
        ],
      };
    } catch (error) {
      return {
        errors: [...state.errors, `Strategy Agent Error: ${error}`],
      };
    }
  }

  private async creatorStep(state: AgentState): Promise<Partial<AgentState>> {
    const startTime = Date.now();
    
    try {
      // Placeholder for Creator Agent - to be implemented
      const result = await this.mockCreatorAgent({
        strategy: state.strategyResult,
        contentRequest: state.contentRequest,
        userProfile: state.userProfile,
      });

      const processingTime = Date.now() - startTime;
      
      return {
        creatorResult: result,
        chainSteps: [
          ...state.chainSteps,
          {
            agent: 'creator',
            input: { strategy: state.strategyResult },
            output: result,
            processing_time: processingTime,
          },
        ],
      };
    } catch (error) {
      return {
        errors: [...state.errors, `Creator Agent Error: ${error}`],
      };
    }
  }

  private async qaStep(state: AgentState): Promise<Partial<AgentState>> {
    const startTime = Date.now();
    
    try {
      // Placeholder for QA Agent - to be implemented
      const result = await this.mockQAAgent({
        content: state.creatorResult,
        strategy: state.strategyResult,
        userProfile: state.userProfile,
      });

      const processingTime = Date.now() - startTime;
      
      return {
        qaResult: result,
        chainSteps: [
          ...state.chainSteps,
          {
            agent: 'qa',
            input: { content: state.creatorResult },
            output: result,
            processing_time: processingTime,
          },
        ],
      };
    } catch (error) {
      return {
        errors: [...state.errors, `QA Agent Error: ${error}`],
      };
    }
  }

  private async performanceStep(state: AgentState): Promise<Partial<AgentState>> {
    const startTime = Date.now();
    
    try {
      // Placeholder for Performance Agent - to be implemented
      const result = await this.mockPerformanceAgent({
        finalContent: state.qaResult,
        strategy: state.strategyResult,
        userProfile: state.userProfile,
      });

      const processingTime = Date.now() - startTime;
      
      return {
        performanceResult: result,
        chainSteps: [
          ...state.chainSteps,
          {
            agent: 'performance',
            input: { finalContent: state.qaResult },
            output: result,
            processing_time: processingTime,
          },
        ],
      };
    } catch (error) {
      return {
        errors: [...state.errors, `Performance Agent Error: ${error}`],
      };
    }
  }

  private async finalizeStep(state: AgentState): Promise<Partial<AgentState>> {
    const finalResult: ContentResponse = {
      content: state.qaResult?.content || state.creatorResult?.content || '',
      confidence_score: state.qaResult?.confidence_score || 0.5,
      tone_match_score: state.qaResult?.tone_match_score || 0.5,
      brand_consistency_score: state.qaResult?.brand_consistency_score || 0.5,
      engagement_prediction: state.performanceResult?.engagement_prediction || 0.5,
      suggestions: [
        ...(state.strategyResult?.strategy?.engagement_tactics || []),
        ...(state.qaResult?.suggestions || []),
      ],
      metadata: {
        agent_chain: ['strategy', 'creator', 'qa', 'performance'],
        processing_time: state.chainSteps.reduce((total, step) => total + step.processing_time, 0),
        tokens_used: 0, // Will be calculated properly once all agents are implemented
      },
    };

    return {
      finalResult,
    };
  }

  // Temporary mock methods - to be replaced with actual agent implementations
  private async mockCreatorAgent(input: any): Promise<any> {
    // This will be replaced with actual CreatorAgent
    return {
      content: `Generated content based on ${input.strategy?.strategy?.content_approach || 'strategy'}`,
      tone_match_score: 0.8,
      confidence_score: 0.7,
    };
  }

  private async mockQAAgent(input: any): Promise<any> {
    // This will be replaced with actual QAAgent
    return {
      content: input.content?.content || 'QA approved content',
      confidence_score: 0.85,
      tone_match_score: 0.9,
      brand_consistency_score: 0.88,
      suggestions: ['Consider adding more engagement hooks', 'Check hashtag relevance'],
    };
  }

  private async mockPerformanceAgent(input: any): Promise<any> {
    // This will be replaced with actual PerformanceAgent
    return {
      engagement_prediction: 0.75,
      optimal_posting_time: new Date().toISOString(),
      predicted_reach: 1000,
    };
  }
}