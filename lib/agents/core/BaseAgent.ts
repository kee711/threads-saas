import { BaseAgent as IBaseAgent, AgentType, AgentMemory } from '../types';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

export abstract class BaseAgent implements IBaseAgent {
  public name: string;
  public type: AgentType;
  public description: string;
  protected llm: ChatOpenAI;
  protected outputParser: StringOutputParser;

  constructor(name: string, type: AgentType, description: string) {
    this.name = name;
    this.type = type;
    this.description = description;
    
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.7,
      openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    });

    this.outputParser = new StringOutputParser();
  }

  abstract process(input: any, context?: any): Promise<any>;

  async learn(feedback: any): Promise<void> {
    // Base learning implementation - to be extended by specific agents
    console.log(`${this.name} learning from feedback:`, feedback);
  }

  protected async executePrompt(
    template: string,
    variables: Record<string, any>
  ): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(this.llm).pipe(this.outputParser);
    
    return await chain.invoke(variables);
  }

  protected logInteraction(input: any, output: any, processingTime: number): void {
    console.log(`[${this.name}] Processed in ${processingTime}ms`, {
      input: typeof input === 'string' ? input.substring(0, 100) : input,
      output: typeof output === 'string' ? output.substring(0, 100) : output,
    });
  }

  async saveMemory(userId: string, memoryType: string, data: Record<string, any>): Promise<void> {
    // This will be implemented with Supabase integration
    console.log(`Saving memory for ${userId}:`, { memoryType, data });
  }

  async getMemory(userId: string, memoryType?: string): Promise<AgentMemory[]> {
    // This will be implemented with Supabase integration
    console.log(`Getting memory for ${userId}, type: ${memoryType}`);
    return [];
  }
}