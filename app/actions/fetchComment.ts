'use server';

import { createClient } from '@/lib/supabase/server'
import { getThreadsAccessToken } from '@/app/actions/comment';
import { getRootPostId } from '@/app/actions/comment';
import axios from 'axios';
import { authOptions } from "@/lib/auth/authOptions";
import { getServerSession } from "next-auth/next";

interface PostComment {
  media_type: string;
  text: string;
  reply_to_id: string;
}

interface Comment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  replies?: PostComment[];
  is_replied: boolean;
  root_post: {};
}

export async function getCommentData(mediaId: string) {

  const token = await getThreadsAccessToken();

  // 먼저 replies endpoint를 시도
  const url = `https://graph.threads.net/${mediaId}/replies`;
  const params = {
    fields: [
      'id',
      'text',
      'username',
      'timestamp',
      'shortcode',
      'replied_to',
      'is_reply',
      'root_post'
    ].join(','),
    reverse: true,
    access_token: token,
  };

  try {
    const response = await axios.get(url, { params });
    console.log('Comments fetched successfully');

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:');
      console.error('Status:', error.response?.status);
      console.error('Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Headers:', error.response?.headers);
      console.error('Request URL:', url);
      console.error('Request params:', JSON.stringify(params, null, 2));
      throw new Error(`Failed to fetch comments: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
    } else {
      console.error('Unexpected error:', error);
      throw error;
    }
  }
}

// 멘션 fetching
export async function getMentionData(userId: string) {

  const token = await getThreadsAccessToken();

  const url = `https://graph.threads.net/${userId}/mentions`; // limit 설정
  const params = {
    fields: [
      'id',
      'text',
      'username',
      'timestamp',
      'shortcode',
      'replied_to',
      'is_reply',
      'root_post'
    ].join(','),
    access_token: token,
  };

  try {
    const response = await axios.get(url, { params });
    console.log('Mentions fetched successfully');

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error details (mentions):');
      console.error('Status:', error.response?.status);
      console.error('Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Headers:', error.response?.headers);
      console.error('Request URL:', url);
      console.error('Request params:', JSON.stringify(params, null, 2));
      throw new Error(`Failed to fetch mentions: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
    } else {
      console.error('Unexpected error:', error);
      throw error;
    }
  }
}

export async function postCommentData(data: Comment[]) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('comment')
    .upsert(data, { onConflict: 'id', ignoreDuplicates: true, });

  if (error) {
    console.error('댓글 저장 실패:', error);
    throw new Error('댓글을 저장하는 중 오류가 발생했습니다.');
  }
}

export async function postMentionData(data: Comment[]) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('mention')
    .upsert(data, { onConflict: 'id', ignoreDuplicates: true, });

  if (error) {
    console.error('멘션 저장 실패:', error);
    throw new Error('멘션을 저장하는 중 오류가 발생했습니다.');
  }
}

export async function fetchAndSaveComments() {
  // 소셜 계정 id 가져오기
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    throw new Error("로그인이 필요합니다.");
  }
  const userId = session.user.id;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('selected_social_account')
    .eq('user_id', userId)
    .single();

  const selectedAccountId = profile?.selected_social_account;
  if (!selectedAccountId) {
    throw new Error('선택된 소셜 계정이 없습니다.');
  }


  // 댓글 데이터 fetch
  const mediaIds = await getRootPostId(selectedAccountId);
  console.log('Retrieved media IDs:', JSON.stringify(mediaIds, null, 2));

  // media_id 필드 확인 및 변경
  const commentPromises = mediaIds.map((mediaId) => {
    console.log('Processing media ID:', mediaId);
    // my_contents 테이블의 실제 필드명 확인 (id 또는 media_id)
    const actualMediaId = mediaId.id || mediaId.media_id;
    console.log('Using actual media ID:', actualMediaId);
    return getCommentData(actualMediaId);
  });
  const commentResponses = await Promise.all(commentPromises);

  const allComments = commentResponses.flatMap((commentData) => {
    if (!commentData?.data) return [];
    return commentData.data.map((comment: any) => ({
      id: comment.id,
      text: comment.text,
      username: comment.username,
      timestamp: comment.timestamp,
      is_replied: false,
      shortcode: comment.shortcode,
      replied_to: comment.replied_to?.id ?? null,
      root_post: comment.root_post.id,
    }));
  });

  // 댓글 데이터 저장
  if (allComments.length > 0) {
    await postCommentData(allComments);
  }
  return { saved: true, count: allComments.length };
}

export async function fetchAndSaveMentions() {
  // 소셜 계정 id 가져오기
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    throw new Error("로그인이 필요합니다.");
  }
  const userId = session.user.id;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('selected_social_account')
    .eq('user_id', userId)
    .single();

  const selectedAccountId = profile?.selected_social_account;
  if (!selectedAccountId) {
    throw new Error('선택된 소셜 계정이 없습니다.');
  }

  // 멘션 데이터 fetch
  const mentionData = await getMentionData(selectedAccountId);
  const mentions = mentionData?.data
    ? mentionData.data.map((mention: any) => ({
      id: mention.id,
      text: mention.text,
      username: mention.username,
      timestamp: mention.timestamp,
      shortcode: mention.shortcode,
      is_replied: false,
      root_post: mention.root_post?.id || '',
      mentioned_user_id: selectedAccountId,
    }))
    : [];

  console.log(mentions);

  // 멘션 데이터 저장
  if (mentions.length > 0) {
    await postMentionData(mentions);
  }
  return { saved: true, count: mentions.length };
}