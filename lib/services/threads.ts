import { ThreadsCredentials } from "@/components/threads/types";

interface AuthResponse {
  success: boolean;
}

interface Thread {
  id: string;
  text: string;
  media_type: string;
  username: string;
  timestamp: string;
  permalink: string;
  likes?: number;
  shares?: number;
  mediaUrls?: string[];
  replies?: any[];
}

export class ThreadsService {
  private baseUrl = "https://graph.threads.net/v1.0";
  private accessToken = process.env.THREADS_ACCESS_TOKEN;

  async getTrendingThreads(keyword: string): Promise<Thread[]> {
    const posts = await this.searchByKeyword(keyword);
    return this.enrichPosts(posts);
  }

  private async searchByKeyword(keyword: string) {
    const res = await fetch(
      `${this.baseUrl}/keyword_search?q=${encodeURIComponent(
        keyword
      )}&search_type=TOP&fields=id,text,media_type,permalink,timestamp,username,is_reply`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    const data = await res.json();
    return (data.data ?? []).filter((post: any) => !post.is_reply);
  }

  private async enrichPosts(posts: any[]) {
    return Promise.all(
      posts.map(async (post) => {
        const { id, media_type, username, timestamp, permalink, text } = post;

        const [replies, mediaUrls] = await Promise.all([
          this.getReplies(id),
          media_type !== "TEXT" ? this.getMediaUrls(id) : [],
        ]);

        return {
          id,
          text,
          media_type,
          username,
          timestamp,
          permalink,
          replies,
          mediaUrls,
        };
      })
    );
  }

  private async getMediaUrls(mediaId: string): Promise<string[]> {
    const res = await fetch(
      `${this.baseUrl}/${mediaId}?fields=id,media_url,media_type,children`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    const detail = await res.json();
    return (
      detail.children?.data?.map((child: any) => child.media_url) || [
        detail.media_url,
      ]
    );
  }

  private async getReplies(mediaId: string): Promise<any[]> {
    const res = await fetch(
      `${this.baseUrl}/${mediaId}/replies?fields=id,text,timestamp,username,root_post,is_reply`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    const result = await res.json();
    return result.data ?? [];
  }
}

// 서버에서 API로 요청하도록 수정
export async function initializeThreadsClient(
  credentials: ThreadsCredentials
): Promise<AuthResponse> {
  try {
    const response = await fetch("/api/threads/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "스레드 계정 인증에 실패했습니다.");
    }

    return await response.json();
  } catch (error) {
    console.error("스레드 클라이언트 초기화 실패:", error);
    throw new Error("스레드 계정 인증에 실패했습니다.");
  }
}

export async function publishThread(content: string): Promise<string> {
  try {
    const response = await fetch("/api/threads/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "스레드 게시 중 오류가 발생했습니다.");
    }

    const result = await response.json();
    return result.result || "게시 완료";
  } catch (error) {
    console.error("스레드 게시 실패:", error);
    throw new Error("스레드 게시 중 오류가 발생했습니다.");
  }
}
