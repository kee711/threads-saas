"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function composeWithAI(
  formatPost: { content: string },
  contentPost: { content: string }
) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "당신은 주어진 포맷과 내용을 바탕으로 매번 조회수를 폭발시키는 스레드(Threads) 콘텐츠를 작성하는 전문가입니다. 포맷의 구조를 유지하면서 내용을 자연스럽게 녹여내야 합니다.",
        },
        {
          role: "user",
          content: `다음 포맷과 내용을 바탕으로 새로운 글을 작성해주세요:

포맷:
${formatPost.content}

내용:
${contentPost.content}

위 포맷의 구조(문장구조, 형식, 기승전결, 논리구조)를 유지하면서, 내용에 해당하는 콘텐츠의 핵심 맥락(주제, 정보, 핵심)을 자연스럽게 녹여서 새로운 글을 작성해주세요.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      content: response.choices?.[0]?.message?.content || "",
      error: null,
    };
  } catch (error) {
    console.error("Error composing with AI:", error);
    return {
      content: "",
      error:
        error instanceof Error
          ? error.message
          : "AI가 잠시 오류를 겪고 있습니다",
    };
  }
}

export async function improvePost(content: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "당신은 Threads 플랫폼에 최적화된 콘텐츠를 만드는 전문가입니다. 이목을 끌고, 참여를 유도하며, 공유하고 싶은 매력적인 콘텐츠를 작성합니다.",
        },
        {
          role: "user",
          content: `다음 Threads 게시물을 개선해주세요:

${content}

더 매력적이고, 참여도를 높이며, 바이럴 가능성이 있는 버전으로 개선해주세요. 해시태그를 적절히 추가하고, 문장 구조를 개선하며, 더 명확하고 간결하게 만들어주세요. 원본 메시지의 핵심 내용과 의도는 유지하면서 Threads 플랫폼에 최적화된 형태로 변환해주세요.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      content: response.choices?.[0]?.message?.content || "",
      error: null,
    };
  } catch (error) {
    console.error("Error improving post with AI:", error);
    return {
      content: "",
      error:
        error instanceof Error
          ? error.message
          : "AI가 콘텐츠 개선에 실패했습니다",
    };
  }
}
