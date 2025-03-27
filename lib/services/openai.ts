interface GenerateContentsParams {
  topic: string;
  reference?: string;
}

export async function generateContents({ topic, reference }: GenerateContentsParams): Promise<string[]> {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, reference }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '콘텐츠 생성 중 오류가 발생했습니다.');
    }

    const data = await response.json();
    return data.contents;
  } catch (error) {
    console.error('콘텐츠 생성 중 오류:', error);
    throw new Error('콘텐츠 생성 중 오류가 발생했습니다.');
  }
} 