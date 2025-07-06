"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function improvePost(content: string, prompt: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an expert content creator specialized in optimizing content for the Threads platform. You create engaging, participation-driving, and shareable content that captures attention.",
        },
        {
          role: "user",
          content: `Please improve the following Threads post based on the specific instruction:

Original content:
${content}

Improvement instruction:
${prompt}

Please enhance the content to be more engaging, increase participation, and have viral potential. Add appropriate hashtags, improve sentence structure, and make it clearer and more concise. Maintain the core message and intent of the original while transforming it into a format optimized for the Threads platform.`,
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
