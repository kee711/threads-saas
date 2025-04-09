'use server';

import { createClient } from '@/lib/supabase/client';

interface PostComment {
    media_type: string,
    text: string;
    reply_to_id: string;
  }

const token = process.env.THREADS_ACCESS_TOKEN

// 사용자 포스트 ID 불러오기
export async function getRootPostId(id : string) { // 사용자 id
    console.log('Creating Supabase client...');
    const supabase = createClient();
  
    try {
      console.log('Fetching my posts...');
      const { data, error } = await supabase
        .from('my_contents')
        .select('*')
        .eq('user_id', id);
  
      if (error) {
        console.error('내 게시물 조회 실패:', error);
        throw new Error(`내 게시물 조회 중 오류 발생: ${error.message}`);
      }
  
      return data || [];
    } catch (error) {
      console.error('Unexpected error:', error);
      throw error;
    }
  }

// 댓글 불러오기
export async function getComment(id : string, userId: string) { // root post id & user id
  console.log('Creating Supabase client...');
  const supabase = createClient();

  try {
    console.log('Fetching comments...');
    const { data, error } = await supabase
      .from('comment')
      .select('*')
      .eq('root_post', id)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) {
      console.error('댓글 조회 실패:', error);
      throw new Error(`댓글 조회 중 오류 발생: ${error.message}`);
    }

    const filtered_data = (data ?? []).filter((c) => c.user_id !== userId);
    return filtered_data || [];
  } catch (error) {
    console.error('Unexpected error:', error);
    throw error;
  }
}


// 댓글 작성하기
export async function postComment({ media_type, text, reply_to_id } : PostComment): Promise<string> {
  try {
    const res = await fetch('api/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        media_type, 
        text, 
        reply_to_id, 
        token ,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || '댓글 게시 중 오류가 발생했습니다.');
    }

    const result = await res.json();
    return result.result || '게시 완료';
  } catch (error) {
    console.error('댓글 게시 실패:', error);
    throw new Error('댓글 게시 중 오류가 발생했습니다.');
  }
}

// 답글 단 경우, is_replied = true로 업데이트 및 replies에 사용자 답글 추가
export async function markCommentAsReplied(commentId: string, reply: PostComment) {
    const supabase = createClient();

    // 기존 댓글 불러오기
    const { data: existing, error: fetchError } = await supabase
        .from("comment")
        .select("replies")
        .eq("id", commentId)
        .single();

    if (fetchError) {
        console.error('기존 댓글 불러오기 실패:', fetchError);
        throw new Error('댓글 데이터를 가져오는 중 오류가 발생했습니다.');
    }

    const updatedReplies = [...(existing?.replies || []), reply];

    // is_replied 및 replies 업데이트
    const { error: updateError } = await supabase
        .from("comment")
        .update({
            is_replied: true,
            replies: updatedReplies,
        })
        .eq("id", commentId);

    if (updateError) {
        console.error('답글 저장 실패:', updateError);
        throw new Error('답글을 저장하는 중 오류가 발생했습니다.');
    }
}