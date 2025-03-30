import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ThreadsSearchResponse {
  data: Array<{
    id: string;
    text: string;
    media_type: string;
    permalink: string;
    timestamp: string;
    username: string;
    has_replies: boolean;
    is_quote_post: boolean;
    is_reply: boolean;
  }>;
}

export async function POST(req: Request) {
  try {
    const { keyword } = await req.json();

    if (!keyword) {
      return NextResponse.json(
        { error: "검색어를 입력해주세요." },
        { status: 400 }
      );
    }

    const accessToken = process.env.THREADS_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Threads API 액세스 토큰이 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // Graph API를 통한 키워드 검색
    const searchUrl = new URL('https://graph.threads.net/v1.0/keyword_search');
    searchUrl.searchParams.append('q', keyword);
    searchUrl.searchParams.append('search_type', 'TOP');
    searchUrl.searchParams.append('fields', 'id,text,media_type,permalink,timestamp,username,has_replies,is_quote_post,is_reply');
    searchUrl.searchParams.append('access_token', accessToken);

    const response = await fetch(searchUrl.toString());
    if (!response.ok) {
      throw new Error(`검색 API 오류: ${response.statusText}`);
    }

    const searchResults = (await response.json()) as ThreadsSearchResponse;
    
    // 상위 10개 게시물 추출 및 데이터 가공
    const topPosts = searchResults.data.slice(0, 10).map(post => ({
      source: 'threads',
      external_id: post.id,
      content: post.text || '',
      metadata: {
        username: post.username,
        media_type: post.media_type,
        created_at: post.timestamp,
        permalink: post.permalink,
        has_replies: post.has_replies,
        is_quote_post: post.is_quote_post,
        is_reply: post.is_reply
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Supabase에 데이터 저장
    await supabase
      .from('external_data')
      .upsert(topPosts, {
        onConflict: 'external_id',
        ignoreDuplicates: false
      });

    return NextResponse.json({
      success: true,
      message: "검색 결과가 성공적으로 저장되었습니다.",
      count: topPosts.length,
      results: topPosts
    });

  } catch (error) {
    console.error("검색 중 오류:", error);
    return NextResponse.json(
      { error: "검색 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 