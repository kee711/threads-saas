import { NextRequest, NextResponse } from "next/server";
import { handleOptions, corsResponse } from '@/lib/utils/cors';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { createClient } from "@/lib/supabase/server";

/**
 * My Contents Sync API
 * 
 * 이 API는 사용자의 실제 Threads 게시물을 my_contents 테이블에 동기화합니다.
 * 
 * API 사용 예시:
 * POST /api/my-contents/sync
 * 
 * 참고: Threads API 문서
 * https://developers.facebook.com/docs/threads/retrieve-and-discover-posts/retrieve-posts
 * 
 * 주의사항:
 * - 현재 로그인한 사용자의 selected_social_account를 사용
 * - 기존 게시물은 업데이트하고 새 게시물은 추가
 * - publish_status는 'posted'로 설정 (실제 게시된 게시물이므로)
 */

// TypeScript 타입 정의 (Threads API 응답)
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

// 현재 사용자의 선택된 Threads 계정 액세스 토큰 조회
async function getThreadsAccessToken(userId: string): Promise<{ accessToken: string, socialId: string } | null> {
  const supabase = await createClient();

  // user_profiles에서 선택된 소셜 계정 ID 가져오기
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('selected_social_account')
    .eq('user_id', userId)
    .single();

  const selectedAccountId = profile?.selected_social_account;
  if (!selectedAccountId) {
    console.error('선택된 소셜 계정이 없습니다.');
    return null;
  }

  // social_accounts에서 access_token 가져오기
  const { data: account, error } = await supabase
    .from('social_accounts')
    .select('access_token, social_id')
    .eq('social_id', selectedAccountId)
    .eq('platform', 'threads')
    .eq('is_active', true)
    .single();

  if (error || !account?.access_token) {
    console.error('Threads access token 조회 실패:', error);
    return null;
  }

  return {
    accessToken: account.access_token,
    socialId: account.social_id
  };
}

// 사용자의 모든 Threads 포스트 조회
async function getUserThreadsPosts(
  socialId: string,
  accessToken: string,
  limit: number
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
  params.append('limit', Math.min(limit, 100).toString()); // 최대 100개로 제한

  const url = `https://graph.threads.net/v1.0/${socialId}/threads?${params.toString()}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return data as ThreadsApiError;
    }

    return data as ThreadsPostsResponse;
  } catch (error) {
    console.error('Threads API 호출 오류:', error);
    throw new Error('Failed to fetch user posts from Threads API');
  }
}

// my_contents 테이블에 게시물 동기화
async function syncPostsToMyContents(
  userId: string,
  socialId: string,
  threadsPosts: ThreadsPost[]
) {
  const supabase = await createClient();
  let synchronized = 0;
  const syncedPosts = [];

  for (const post of threadsPosts) {
    try {
      // 기존 게시물 확인 (media_id로 검색)
      const { data: existingPost } = await supabase
        .from('my_contents')
        .select('*')
        .eq('media_id', post.id)
        .eq('user_id', userId)
        .single();

      const postData = {
        user_id: userId,
        social_id: socialId,
        content: post.text || '',
        media_type: post.media_type === 'TEXT_POST' ? 'TEXT' : post.media_type === 'CAROUSEL_ALBUM' ? 'CAROUSEL' : post.media_type,
        media_urls: post.children ? post.children : (post.media_url ? [post.media_url] : []),
        media_id: post.id, // Threads media ID 저장
        publish_status: 'posted', // 실제 게시된 게시물이므로
        created_at: post.timestamp,
        category: null // 기본값
      };

      if (existingPost) {
        // 기존 게시물 업데이트
        const { data: updated, error } = await supabase
          .from('my_contents')
          .update(postData)
          .eq('my_contents_id', existingPost.my_contents_id)
          .select()
          .single();

        // if (!error && updated) {
        //   syncedPosts.push(updated);
        //   synchronized++;
        // }
      } else {
        // 새 게시물 추가 (my_contents_id는 UUID 자동 생성)
        console.log("postData", postData);
        const { data: inserted, error } = await supabase
          .from('my_contents')
          .insert(postData)
          .select()
          .single();

        if (error) {
          console.error("insert erro r", error);
        }

        if (!error && inserted) {
          syncedPosts.push(inserted);
          synchronized++;
        }
      }
    } catch (error) {
      console.error(`게시물 동기화 오류 (${post.id}):`, error);
      // 개별 게시물 오류는 무시하고 계속 진행
    }
  }

  return {
    synchronized,
    posts: syncedPosts
  };
}

export async function OPTIONS(request: NextRequest) {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return corsResponse(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 요청 본문에서 옵션 파라미터 추출
    let body: { limit?: number; forceRefresh?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      // JSON 파싱 실패 시 기본값 사용
      body = {};
    }
    const { limit, forceRefresh = false } = body;

    // limit 파라미터 검증
    if (typeof limit !== 'number' || limit < 1 || limit > 100) {
      return corsResponse(
        {
          error: 'Invalid limit parameter',
          message: 'limit must be a number between 1 and 100'
        },
        { status: 400 }
      );
    }

    // Threads 액세스 토큰 및 소셜 ID 조회
    const authData = await getThreadsAccessToken(session.user.id);
    if (!authData) {
      return corsResponse(
        {
          error: 'Threads account not connected',
          message: 'Please connect your Threads account first'
        },
        { status: 400 }
      );
    }

    console.log(`🔄 Threads 게시물 동기화 시작 (사용자: ${session.user.id}, 계정: ${authData.socialId})`);

    // Threads API에서 사용자 게시물 조회
    const threadsResult = await getUserThreadsPosts(
      authData.socialId,
      authData.accessToken,
      limit
    );

    console.log("threadsResult", threadsResult);

    if ('error' in threadsResult) {
      console.error('Threads API 오류:', threadsResult.error);
      return corsResponse(threadsResult, { status: 400 });
    }

    const threadsPosts = threadsResult.data || [];
    console.log(`📥 Threads에서 ${threadsPosts.length}개 게시물 조회됨`);

    if (threadsPosts.length === 0) {
      return corsResponse({
        success: true,
        message: 'No posts found to sync',
        synchronized: 0,
        total_fetched: 0
      });
    }

    // my_contents 테이블에 동기화
    const syncResult = await syncPostsToMyContents(
      session.user.id,
      authData.socialId,
      threadsPosts
    );

    console.log(`✅ my_contents 테이블에 ${syncResult.synchronized}개 게시물 동기화 완료`);

    return corsResponse({
      success: true,
      message: 'Posts synchronized successfully',
      synchronized: syncResult.synchronized,
      total_fetched: threadsPosts.length,
      social_account: authData.socialId,
      posts: syncResult.posts?.map(post => ({
        my_contents_id: post.my_contents_id,
        content: post.content,
        media_type: post.media_type,
        created_at: post.created_at,
        permalink: post.permalink
      }))
    });

  } catch (error) {
    console.error('my-contents/sync API 오류:', error);
    return corsResponse(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 