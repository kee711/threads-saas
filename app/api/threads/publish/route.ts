import { NextResponse } from "next/server";
import { threadsManager } from "../auth/route";

// app/api/threads/auth/route.ts에서 초기화한 클라이언트를 사용하기 위한 참조
// 실제로는 상태 관리나 DB를 사용하는 것이 좋습니다
declare global {
  // eslint-disable-next-line no-var
  var threadsClient: ThreadsAPI | null;
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "발행할 콘텐츠를 입력해주세요." },
        { status: 400 }
      );
    }

    const client = threadsManager.getClient();
    if (!client) {
      return NextResponse.json(
        { error: "스레드 클라이언트가 초기화되지 않았습니다. 먼저 로그인하세요." },
        { status: 401 }
      );
    }

    // 스레드 게시
    await client.publish({
      text: content,
    });

    return NextResponse.json({ success: true, result: "게시 완료" });
  } catch (error) {
    console.error("스레드 발행 중 오류:", error);
    return NextResponse.json(
      { error: "스레드 발행에 실패했습니다." },
      { status: 500 }
    );
  }
} 