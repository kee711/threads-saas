import { ThreadsAPI } from "threads-api";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "사용자명과 비밀번호가 필요합니다." },
        { status: 400 }
      );
    }

    // Threads API 클라이언트 초기화
    const threadsClient = new ThreadsAPI({
      username,
      password,
    });

    // 로그인 테스트
    await threadsClient.login();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Threads 인증 오류:", error);
    return NextResponse.json(
      { error: "스레드 계정 인증에 실패했습니다." },
      { status: 401 }
    );
  }
} 