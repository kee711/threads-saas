import { NextRequest, NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/lib/agents/core/AgentOrchestrator';
import { UserProfile, ContentRequest } from '@/lib/agents/types';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userProfile, contentRequest } = body;

    // Validate required fields
    if (!userProfile || !contentRequest) {
      return NextResponse.json(
        { error: 'Missing required fields: userProfile and contentRequest' },
        { status: 400 }
      );
    }

    // Create orchestrator and process request
    const orchestrator = new AgentOrchestrator();
    const result = await orchestrator.processContentRequest(userProfile, contentRequest);

    return NextResponse.json({
      success: result.success,
      result: result.result,
      error: result.error,
      metadata: {
        chain_steps: result.chain_steps,
        processing_time: result.chain_steps.reduce((total, step) => total + step.processing_time, 0),
      },
    });

  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Example usage endpoint for testing
export async function GET() {
  const exampleUserProfile: UserProfile = {
    id: 'test-user-1',
    name: 'Test User',
    email: 'test@example.com',
    content_preferences: {
      tone: 'professional',
      topics: ['technology', 'productivity', 'business'],
      posting_frequency: 'daily',
      target_audience: 'professionals and entrepreneurs',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const exampleContentRequest: ContentRequest = {
    user_id: 'test-user-1',
    content_type: 'post',
    topic: 'AI and productivity',
    context: 'Share insights about how AI is changing the workplace',
    target_length: 280,
    urgency: 'medium',
    brand_guidelines: ['Keep it professional', 'Include actionable insights'],
  };

  return NextResponse.json({
    message: 'Agent system ready',
    example_usage: {
      endpoint: '/api/agents/generate',
      method: 'POST',
      body: {
        userProfile: exampleUserProfile,
        contentRequest: exampleContentRequest,
      },
    },
  });
}