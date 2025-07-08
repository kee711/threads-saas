import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { commentText, postContent } = await request.json();

    if (!commentText) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    const prompt = `
Generate a thoughtful and engaging reply to the following comment${postContent ? ' on a post' : ''}.

${postContent ? `Post Content: ${postContent}\n` : ''}Comment: ${commentText}

Generate a reply that:
1. Is relevant to the comment${postContent ? ' and original post' : ''}
2. Adds value to the conversation
3. Is friendly and professional in tone
4. Is concise (1-2 sentences)
5. Encourages further engagement

Reply:`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-1106-preview',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates thoughtful replies to comments.' },
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
    const reply = data.choices?.[0]?.message?.content?.trim() || "Thank you for your comment! I appreciate your thoughts.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Error generating reply:', error);
    return NextResponse.json(
      { error: 'Failed to generate reply' },
      { status: 500 }
    );
  }
} 