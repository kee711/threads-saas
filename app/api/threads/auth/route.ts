import { NextResponse } from "next/server";
import { ThreadsAPI } from 'threads-api';

// 싱글톤으로 ThreadsAPI 인스턴스 관리
class ThreadsClientManager {
  private static instance: ThreadsClientManager;
  private client: ThreadsAPI | null = null;

  private constructor() {}

  public static getInstance(): ThreadsClientManager {
    if (!ThreadsClientManager.instance) {
      ThreadsClientManager.instance = new ThreadsClientManager();
    }
    return ThreadsClientManager.instance;
  }

  public getClient(): ThreadsAPI | null {
    return this.client;
  }

  public async initializeClient(username: string, password: string): Promise<void> {
    try {
      this.client = new ThreadsAPI({
        username,
        password,
      });
      
      // 로그인 시도
      await this.client.login();
      console.log('스레드 클라이언트 초기화 완료');
    } catch (error) {
      this.client = null;
      throw error;
    }
  }

  public resetClient(): void {
    this.client = null;
  }
}

// 전역에서 접근 가능하도록 내보내기
export const threadsManager = ThreadsClientManager.getInstance();

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
      await threadsManager.initializeClient(username, password);
    } catch (loginError) {
      console.error("로그인 오류:", loginError);
      return NextResponse.json(
        { error: "스레드 계정 인증에 실패했습니다." },
        { status: 401 }
      );
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