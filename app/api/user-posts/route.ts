import { NextRequest, NextResponse } from "next/server";
import { handleOptions, corsResponse } from '@/lib/utils/cors';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from '@/lib/utils/crypto';

/**
 * Threads User Posts API
 * 
 * 이 API는 사용자의 모든 Threads 포스트를 조회합니다.
 * 
 * API 사용 예시:
 * GET /api/user-posts?user_id=123456&limit=10&since=2024-01-01&until=2024-01-31
 * 
 * 참고: Threads API 문서
 * https://developers.facebook.com/docs/threads/retrieve-and-discover-posts/retrieve-posts
 * 
 * 주의사항:
 * - user_id는 선택된 Threads 계정의 social_id를 사용
 * - 해당 계정이 현재 로그인한 사용자의 계정인지 서버에서 확인
 * - limit 파라미터로 반환할 포스트 수 제한 가능 (기본값: 25, 최대: 100)
 * - since/until 파라미터로 날짜 범위 지정 가능 (ISO 8601 format)
 */

// TypeScript 타입 정의
interface ThreadsPost {
  id: string;
  media_product_type: string;
  media_type: string;
  media_url?: string;
  permalink: string;
  owner?: {
    id: string;
  };
  username: string;
  text: string;
  timestamp: string;
  shortcode: string;
  thumbnail_url?: string;
  children?: string[];
  is_quote_post: boolean;
  quoted_post?: string;
  reposted_post?: string;
  alt_text?: string;
  link_attachment_url?: string;
  gif_url?: string;
}

interface ThreadsPostsResponse {
  data: ThreadsPost[];
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
  };
}

interface ThreadsApiError {
  error: {
    message: string;
    type: string;
    code: number;
  };
}

// 현재 사용자의 특정 Threads 계정 액세스 토큰 조회
async function getThreadsAccessToken(userId: string, threadsUserId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('social_accounts')
    .select('access_token')
    .eq('owner', userId)  // 현재 로그인한 사용자의 계정인지 확인
    .eq('social_id', threadsUserId)  // 요청된 Threads 사용자 ID
    .eq('platform', 'threads')
    .eq('is_active', true)  // 활성 계정만
    .single();

  if (error || !data) {
    console.error('Error fetching Threads access token:', error);
    return null;
  }

  // 토큰 복호화
  return decryptToken(data.access_token);
}

// 사용자의 모든 Threads 포스트 조회
async function getUserPosts(
  userId: string,
  accessToken: string,
  limit?: number,
  since?: string,
  until?: string
): Promise<ThreadsPostsResponse | ThreadsApiError> {
  const params = new URLSearchParams();

  // 필요한 필드들 지정
  const fields = [
    'id',
    'media_product_type',
    'media_type',
    'media_url',
    'permalink',
    'owner',
    'username',
    'text',
    'timestamp',
    'shortcode',
    'thumbnail_url',
    'children',
    'is_quote_post',
    'quoted_post',
    'reposted_post',
    'alt_text',
    'link_attachment_url',
    'gif_url'
  ].join(',');

  params.append('fields', fields);
  params.append('access_token', accessToken);

  // 옵션 파라미터들
  if (limit) {
    params.append('limit', Math.min(limit, 100).toString()); // 최대 100개로 제한
  }

  if (since) {
    params.append('since', since);
  }

  if (until) {
    params.append('until', until);
  }

  const url = `https://graph.threads.net/v1.0/${userId}/threads?${params.toString()}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return data as ThreadsApiError;
    }

    return data as ThreadsPostsResponse;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw new Error('Failed to fetch user posts');
  }
}

export async function GET(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return corsResponse(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // URL 파라미터 추출
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limitParam = searchParams.get('limit');
    const since = searchParams.get('since');
    const until = searchParams.get('until');

    // 필수 파라미터 확인
    if (!userId) {
      return corsResponse(
        {
          error: 'Missing user_id parameter',
          message: 'user_id is required to fetch user posts'
        },
        { status: 400 }
      );
    }

    // limit 파라미터 검증
    let limit: number | undefined;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return corsResponse(
          {
            error: 'Invalid limit parameter',
            message: 'limit must be a positive integer'
          },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    // Threads 액세스 토큰 조회
    const accessToken = await getThreadsAccessToken(session.user.id, userId);
    if (!accessToken) {
      return corsResponse(
        { error: 'Threads account not connected or access denied' },
        { status: 400 }
      );
    }

    // 사용자 포스트 조회
    const result = await getUserPosts(userId, accessToken, limit, since || undefined, until || undefined);

    if ('error' in result) {
      return corsResponse(result, { status: 400 });
    }

    return corsResponse(result);

  } catch (error) {
    console.error('Error in user-posts API:', error);
    return corsResponse(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
    return handleOptions();
} 