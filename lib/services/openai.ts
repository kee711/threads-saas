interface GenerateContentParams {
  [key: string]: any;
}

export async function generateContents(params: GenerateContentParams): Promise<string[]> {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('콘텐츠 생성 중 오류가 발생했습니다.');
    }

    const data = await response.json();
    return data.contents;
  } catch (error) {
    console.error("콘텐츠 생성 중 오류:", error);
    throw new Error("콘텐츠 생성 중 오류가 발생했습니다.");
  }
}

export async function generateCommentReply(commentText: string, postContent: string): Promise<string> {
  try {
    const prompt = `
Given the following post content and a comment on that post, generate a thoughtful and engaging reply.

Post Content: ${postContent}

Comment: ${commentText}

Generate a reply that:
1. Is relevant to both the original post and the comment
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
      throw new Error('Failed to generate reply from OpenAI');
    }

    const data = await openaiRes.json();
    return data.choices?.[0]?.message?.content?.trim() || "Thank you for your comment! I appreciate your thoughts.";
  } catch (error) {
    console.error("댓글 답글 생성 중 오류:", error);
    throw new Error("댓글 답글 생성 중 오류가 발생했습니다.");
  }
} 