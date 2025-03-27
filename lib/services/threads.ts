// 클라이언트에서 사용하는 인터페이스 정의
export interface ThreadsCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
}

// 서버에서 API로 요청하도록 수정
export async function initializeThreadsClient(credentials: ThreadsCredentials): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/threads/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '스레드 계정 인증에 실패했습니다.');
    }

    return await response.json();
  } catch (error) {
    console.error('스레드 클라이언트 초기화 실패:', error);
    throw new Error('스레드 계정 인증에 실패했습니다.');
  }
}

export async function publishThread(content: string): Promise<string> {
  try {
    const response = await fetch('/api/threads/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '스레드 게시 중 오류가 발생했습니다.');
    }

    const result = await response.json();
    return result.result || '게시 완료';
  } catch (error) {
    console.error('스레드 게시 실패:', error);
    throw new Error('스레드 게시 중 오류가 발생했습니다.');
  }
} 