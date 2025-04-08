'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function composeWithAI(formatPost: { content: string }, contentPost: { content: string }) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "당신은 주어진 포맷과 내용을 바탕으로 매번 조회수를 폭발시키는 스레드(Threads) 콘텐츠를 작성하는 전문가입니다. 포맷의 구조를 유지하면서 내용을 자연스럽게 녹여내야 합니다."
        },
        {
          role: "user",
          content: `다음 포맷과 내용을 바탕으로 새로운 글을 작성해주세요:

포맷:
${formatPost.content}

내용:
${contentPost.content}

위 포맷의 구조(문장구조, 형식, 기승전결, 논리구조)를 유지하면서, 내용에 해당하는 콘텐츠의 핵심 맥락(주제, 정보, 핵심)을 자연스럽게 녹여서 새로운 글을 작성해주세요.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    return {
      content: response.choices[0].message.content || '',
      error: null
    }
  } catch (error) {
    console.error('Error composing with AI:', error)
    return {
      content: '',
      error: error instanceof Error ? error.message : 'AI가 잠시 오류를 겪고 있습니다'
    }
  }
} 