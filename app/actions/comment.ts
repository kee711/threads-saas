'use server';

import { createClient } from '@/lib/supabase/server';
import { authOptions } from "@/lib/auth/authOptions";
import { getServerSession } from "next-auth/next";
import { decryptToken } from '@/lib/utils/crypto';
import { ContentItem } from "@/components/contents-helper/types";
import axios from 'axios';

interface Comment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  replies: PostComment[];
  is_replied: boolean;
  root_post: string;
  root_post_content?: ContentItem;
}

interface PostComment {
  media_type: string,
  text: string;
  reply_to_id: string;
}

// Threads access_token 가져오기
export async function getThreadsAccessToken() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    throw new Error("로그인이 필요합니다.");
  }
  const userId = session.user.id;
  const supabase = await createClient();

  // user_profiles에서 선택된 소셜 계정 id 가져오기
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('selected_social_id')
    .eq('user_id', userId)
    .single();

  const selectedSocialId = profile?.selected_social_id;
  if (!selectedSocialId) {
    throw new Error('선택된 소셜 계정이 없습니다.');
  }

  // social_accounts에서 access_token 가져오기
  const { data: account } = await supabase
    .from('social_accounts')
    .select('access_token')
    .eq('social_id', selectedSocialId)
    .eq('platform', 'threads')
    .eq('is_active', true)
    .single();

  const encryptedToken = account?.access_token;
  if (!encryptedToken) {
    throw new Error('Threads access token이 없습니다.');
  }

  // 토큰 복호화
  const accessToken = decryptToken(encryptedToken);
  return accessToken;
}

// 사용자 포스트 ID 불러오기
export async function getRootPostId(id: string) { // 사용자 id
  console.log('Creating Supabase client...');
  const supabase = await createClient();

  try {
    console.log('Fetching my posts...');
    const { data, error } = await supabase
      .from('my_contents')
      .select('*')
      .eq('social_id', id)
      .eq('publish_status', 'posted');

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
export async function getComment(id: string, userId: string) { // root post id & user id
  console.log('Creating Supabase client...');
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('selected_social_id')
    .eq('user_id', userId)
    .single();

  const selectedSocialId = profile?.selected_social_id;
  if (!selectedSocialId) {
    throw new Error('선택된 소셜 계정이 없습니다.');
  }
  // social_accounts에서 username 가져오기
  const { data: account } = await supabase
    .from('social_accounts')
    .select('username')
    .eq('social_id', selectedSocialId)
    .eq('platform', 'threads')
    .eq('is_active', true)
    .single();

  const username = account?.username;
  if (!username) {
    throw new Error('Threads username이 없습니다.');
  }

  try {
    console.log('Fetching comments...');
    const { data, error } = await supabase
      .from('comment')
      .select('*')
      .eq('root_post', id)
      .not('hide_status', 'is', true)
      .order('timestamp', { ascending: false })
    //.limit(10);

    if (error) {
      console.error('댓글 조회 실패:', error);
      throw new Error(`댓글 조회 중 오류 발생: ${error.message}`);
    }

    const filtered_data = (data ?? []).filter((c) => c.username !== username);
    // 자신의 댓글은 제외하고 가져오기

    return filtered_data || [];
  } catch (error) {
    console.error('Unexpected error:', error);
    throw error;
  }
}

// 답글 단 경우, is_replied = true로 업데이트 및 replies에 사용자 답글 추가
export async function markCommentAsReplied(commentId: string, reply: PostComment) {
  const supabase = await createClient()

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

// 댓글 작성하기
export async function postComment({ media_type, text, reply_to_id }: PostComment) {
  const apiUrl = 'https://graph.threads.net/v1.0/me/threads';

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      throw new Error("로그인이 필요합니다.");
    }
    const userId = session.user.id;
    const supabase = await createClient();

    // user_profiles에서 선택된 소셜 계정 id 가져오기
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('selected_social_id')
      .eq('user_id', userId)
      .single();

    const selectedSocialId = profile?.selected_social_id;
    if (!selectedSocialId) {
      throw new Error('선택된 소셜 계정이 없습니다.');
    }

    // social_accounts에서 access_token 가져오기
    const { data: account } = await supabase
      .from('social_accounts')
      .select('access_token')
      .eq('social_id', selectedSocialId)
      .eq('platform', 'threads')
      .eq('is_active', true)
      .single();

    const encryptedToken = account?.access_token;
    if (!encryptedToken) {
      throw new Error('Threads access token이 없습니다.');
    }

    // 토큰 복호화
    const token = decryptToken(encryptedToken);

    // 댓글 media container 생성
    const payload = new URLSearchParams({
      media_type: media_type,
      text: text,
      reply_to_id: reply_to_id,
      access_token: token,
    });

    const createResponse = await axios.post(apiUrl, payload);

    if (createResponse.status === 200) {
      const mediaContainerId = createResponse.data.id;
      console.log(`Created media container: ${mediaContainerId}`);

      const publishUrl = `https://graph.threads.net/v1.0/${selectedSocialId}/threads_publish`;
      const params = new URLSearchParams({
        creation_id: mediaContainerId,
        access_token: token,
      });

      // 업로드 준비될 때까지 반복
      const maxAttempts = 10;
      let attempt = 0;

      while (attempt < maxAttempts) {
        console.log(`Attempt ${attempt + 1}: Checking if ready to publish...`);
        try {
          const publishResponse = await axios.post(publishUrl, params);

          if (publishResponse.status === 200) {
            console.log('Post published successfully!');
            return publishResponse.data; // 성공 결과 반환
          } else {
            console.log(`Still processing... (Status: ${publishResponse.status})`);
            console.log(publishResponse.data);
          }
        } catch (error) {
          console.error('Error during publish attempt:', error);
        }

        await new Promise((resolve) => setTimeout(resolve, 15000)); // 15초 대기
        attempt++;
      }

      throw new Error('Failed to publish post after multiple attempts.');
    } else {
      console.error('Create Error:', createResponse.status, createResponse.data);
      throw new Error('Failed to create thread.');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    throw error; // 호출한 쪽에서 핸들링
  }
}

// 댓글 숨김 (threads_manage_replies 권한용)
export async function hideComment(commentId: string) {
  const token = await getThreadsAccessToken();

  if (!token) {
    throw new Error('Access token is missing.');
  }

  const apiUrl = `https://graph.threads.net/v1.0/${commentId}/manage_reply`;

  const payload = new URLSearchParams({
    hide: 'true',
    access_token: token,
  });

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    console.log('Comment hid successfully');

    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from('comment')
      .update({ hide_status: true })
      .eq('id', commentId);
    if (updateError) {
      console.error('댓글 hide_status 업데이트 실패:', updateError);
      throw new Error('댓글 hide_status 업데이트 중 오류가 발생했습니다.');
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Axios error: ${error.response?.status} - ${error.response?.data}`);
      throw new Error(`Failed to hide reply: ${error.response?.status}`);
    } else {
      console.error('Unexpected error:', error);
      throw error;
    }
  }
}

// 멘션 불러오기
export async function getMention(userId: string) { // root post id & user id
  console.log('Creating Supabase client...');
  const supabase = await createClient()

  try {
    console.log('Fetching comments...');
    const { data, error } = await supabase
      .from('mention')
      .select('*')
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

// 멘션 달린 포스트 불러오기
export async function getMentionRootPost(Id: string) { // root post id & user id
  console.log('Creating Supabase client...');
  const supabase = await createClient();

  try {
    console.log('Fetching Root Post...');
    const { data, error } = await supabase
      .from('my_contents')
      .select('*')
      .eq('media_id', Id);

    if (error) {
      console.error('포스트 조회 실패:', error);
      throw new Error(`포스트 조회 중 오류 발생: ${error.message}`);
    }
    return data || [];
  } catch (error) {
    console.error('Unexpected error:', error);
    throw error;
  }
}

// 멘션에 답글 단 경우, is_replied = true로 업데이트 및 replies에 사용자 답글 추가
export async function markMentionAsReplied(commentId: string, reply: PostComment) {
  console.log('Creating Supabase client...');
  const supabase = await createClient();

  // 기존 댓글 불러오기
  const { data: existing, error: fetchError } = await supabase
    .from("mention")
    .select("replies")
    .eq("id", commentId)
    .single();

  if (fetchError) {
    console.error('기존 멘션 불러오기 실패:', fetchError);
    throw new Error('멘션 데이터를 가져오는 중 오류가 발생했습니다.');
  }

  const updatedReplies = [...(existing?.replies || []), reply];

  // is_replied 및 replies 업데이트
  const { error: updateError } = await supabase
    .from("mention")
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

// 댓글 반환 전체 로직
export async function getAllCommentsWithRootPosts() {
  console.log('Creating Supabase client...');
  const supabase = await createClient();

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    throw new Error("로그인이 필요합니다.");
  }
  const userId = session.user.id;

  // user_profiles에서 선택된 소셜 계정 id 가져오기
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('selected_social_id')
    .eq('user_id', userId)
    .single();

  const selectedSocialId = profile?.selected_social_id;
  if (!selectedSocialId) {
    throw new Error('선택된 소셜 계정이 없습니다.');
  }

  const rootPosts: ContentItem[] = await getRootPostId(selectedSocialId);
  const allData = await Promise.all(
    rootPosts.map((post) => getComment(post.media_id ?? '', userId))
  );
  const flatData: Comment[] = allData.flat();

  const commentsWithRootPost = flatData.map((comment) => {
    const rootPost = rootPosts.find(
      (post) => post.media_id === comment.root_post
    );
    return {
      ...comment,
      replies: comment.replies || [],
      root_post_content: rootPost,
    };
  });

  const uniqueComments = Array.from(
    new Map(commentsWithRootPost.map((item) => [item.id, item])).values()
  );

  const totalHiddenIds = uniqueComments
    .filter((item) => item.is_replied)
    .map((item) => item.id);

  // 댓글이 달린 게시물만 필터링
  const commentedPostIds = new Set(
    uniqueComments.map((c) => c.root_post_content?.media_id)
  );
  const filteredRootPosts = rootPosts.filter((post) =>
    commentedPostIds.has(post.media_id)
  );

  return {
    comments: uniqueComments,
    postsWithComments: filteredRootPosts,
    hiddenComments: totalHiddenIds,
  };
}

// 멘션 반환 전체 로직
export async function getAllMentionsWithRootPosts() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    throw new Error("로그인이 필요합니다.");
  }
  const userId = session.user.id;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('selected_social_id')
    .eq('user_id', userId)
    .single();

  const selectedSocialId = profile?.selected_social_id;
  if (!selectedSocialId) {
    throw new Error('선택된 소셜 계정이 없습니다.');
  }

  const { data: mentions, error: mentionError } = await supabase
    .from('mention')
    .select('*')
    .eq('mentioned_user_id', selectedSocialId)
    .order('timestamp', { ascending: false });

  if (mentionError) {
    throw new Error(mentionError.message);
  }

  const rootPostIds = Array.from(new Set((mentions ?? []).map(m => m.root_post)));

  const { data: rootPosts, error: rootError } = await supabase
    .from('my_contents')
    .select('*')
    .in('media_id', rootPostIds);

  if (rootError) {
    throw new Error(rootError.message);
  }

  const mentionsWithRoot = (mentions ?? []).map(m => ({
    ...m,
    root_post_content: (rootPosts ?? []).find(rp => rp.media_id === m.root_post)
  }));

  const hiddenMentions = mentionsWithRoot.filter(m => m.is_replied).map(m => m.id);

  //const mentionedPostIds = new Set(mentionsWithRoot.map(m => m.root_post_content?.id));
  //const filteredRootPosts = (rootPosts ?? []).filter(post => mentionedPostIds.has(post.id));

  return {
    mentions: mentionsWithRoot,
    //postsWithMentions: filteredRootPosts,
    hiddenMentions,
  };
}