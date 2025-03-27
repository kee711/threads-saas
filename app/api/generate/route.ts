import { NextResponse } from "next/server";
import OpenAI from 'openai';

// 환경 변수에서 API 키 가져오기
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { topic, reference } = await req.json();

    if (!topic) {
      return NextResponse.json(
        { error: "주제를 입력해주세요." },
        { status: 400 }
      );
    }

    const prompt = `
스레드에 게시할 짧은 콘텐츠를 10개 생성해주세요. 각 콘텐츠는 300자 이내로 작성하고, 콘텐츠 사이에는 "---"로 구분해주세요.

주제: ${topic}
${reference ? `참고 자료: ${reference}` : ''}

각 콘텐츠는 다음과 같은 특징을 가져야 합니다:
1. 스레드에 적합한 짧고 간결한 포맷
2. 주제와 관련된 실용적 정보나 통찰
3. 독자의 관심을 끌 수 있는 흥미로운 내용
4. 소셜 미디어에서 공유하기 좋은 명확한 메시지
5. 가능하면 독자의 참여를 유도하는 질문이나 액션 포인트 포함

10개의 콘텐츠를 생성해 주세요. 각 콘텐츠 사이에는 "---"로 구분하세요.
`;

    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '당신은 소셜 미디어 전문가이며, 짧고 임팩트 있는 콘텐츠를 생성하는 데 전문가입니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const response = chatCompletion.choices[0].message.content || '';
    const contents = response.split('---').map(content => content.trim()).filter(content => content);

    return NextResponse.json({ contents });
  } catch (error) {
    console.error("콘텐츠 생성 중 오류:", error);
    return NextResponse.json(
      { error: "콘텐츠 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 