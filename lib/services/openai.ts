import { GenerateContentParams } from "../types";

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