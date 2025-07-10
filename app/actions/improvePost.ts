"use server";

import OpenAI from "openai";
import { IMPROVE_POST_SYSTEM_PROMPT, IMPROVE_POST_USER_PROMPT } from "@/lib/prompts";

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
          content: IMPROVE_POST_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: IMPROVE_POST_USER_PROMPT(content, prompt),
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
