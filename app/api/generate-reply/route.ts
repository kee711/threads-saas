import { NextRequest, NextResponse } from 'next/server';
import { COMMENT_REPLY_SYSTEM_PROMPT, COMMENT_REPLY_USER_PROMPT, COMMENT_REPLY_FALLBACK } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const { commentText, postContent } = await request.json();

    if (!commentText) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    const prompt = COMMENT_REPLY_USER_PROMPT(commentText, postContent);

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-1106-preview',
        messages: [
          { role: 'system', content: COMMENT_REPLY_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7,
      })
    });

    if (!openaiRes.ok) {
      const errorData = await openaiRes.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate reply from OpenAI' },
        { status: 500 }
      );
    }

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || COMMENT_REPLY_FALLBACK;

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Error generating reply:', error);
    return NextResponse.json(
      { error: 'Failed to generate reply' },
      { status: 500 }
    );
  }
} 