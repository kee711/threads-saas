import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createThreadsContainer } from '@/app/actions/schedule';

export async function POST(request: NextRequest) {
  try {
    const { postId, socialId, content, mediaType, mediaUrls } = await request.json();

    const supabase = await createClient();

    console.log(`🔄 백그라운드 컨테이너 생성 시작 [${postId}]: ${mediaType}`);

    // 소셜 계정 정보 조회
    const { data: socialAccount } = await supabase
      .from('social_accounts')
      .select('access_token, social_id')
      .eq('social_id', socialId)
      .single();

    if (!socialAccount?.access_token) {
      throw new Error(`소셜 계정 정보 없음: ${socialId}`);
    }

    // 🎯 핵심: 컨테이너 생성
    const containerResult = await createThreadsContainer(
      socialAccount.social_id,
      socialAccount.access_token,
      {
        content,
        mediaType,
        media_urls: mediaUrls || []
      }
    );

    if (containerResult.success && containerResult.creationId) {
      // 성공: creation_id 저장하고 ready_to_publish 상태로 변경
      await supabase
        .from('my_contents')
        .update({
          creation_id: containerResult.creationId,
          publish_status: 'ready_to_publish'  // 🚀 게시 준비 완료 상태
        })
        .eq('id', postId);

      console.log(`✅ 백그라운드 컨테이너 생성 완료 [${postId}]: ${containerResult.creationId}`);
      return NextResponse.json({
        success: true,
        postId,
        creationId: containerResult.creationId
      });
    } else {
      throw new Error(`컨테이너 생성 실패: ${containerResult.error}`);
    }

  } catch (error) {
    console.error('백그라운드 컨테이너 생성 오류:', error);

    // 실패시 scheduled로 되돌리기
    try {
      const { postId } = await request.json();
      const supabase = await createClient();
      await supabase
        .from('my_contents')
        .update({ publish_status: 'scheduled' })
        .eq('id', postId);
    } catch (e) {
      console.error('Failed to revert post status:', e);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 