import { NextResponse } from "next/server";
import { ThreadsAPI } from 'threads-api';

// 글로벌 스코프에 클라이언트 저장
declare global {
  // eslint-disable-next-line no-var
  var threadsClient: ThreadsAPI | null;
}

if (!global.threadsClient) {
  global.threadsClient = null;
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "사용자명과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    try {
      global.threadsClient = new ThreadsAPI({
        username,
        password,
      });
      
      // 로그인 시도
      await global.threadsClient.login();
      console.log('스레드 클라이언트 초기화 완료');
    } catch (loginError) {
      global.threadsClient = null;
      throw loginError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("스레드 인증 중 오류:", error);
    return NextResponse.json(
      { error: "스레드 계정 인증에 실패했습니다." },
      { status: 500 }
    );
  }
} 