'use server'

import { createClient } from '@/lib/supabase/server'
import axios from 'axios';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth/authOptions';
import puppeteer from "puppeteer";
import { ContentItem } from '@/components/contents-helper/types';

interface OembedContent {
  id: string;
  url: string;
  created_at: string;
  user_id: string;
  html: string;
}

export async function fetchOembedContents(content_url: string) {
  // user token 가져오기
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    throw new Error('로그인이 필요합니다.');
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

  const { data: account } = await supabase
    .from('social_accounts')
    .select('access_token')
    .eq('social_id', selectedSocialId)
    .eq('platform', 'threads')
    .eq('is_active', true)
    .single();

  const accessToken = account?.access_token;
  if (!accessToken) {
    throw new Error('Threads access token이 없습니다.');
  }

  // oembed API 요청
  const url = `https://graph.threads.net/oembed?url=${content_url}&access_token=${accessToken}`;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Axios error: ${error.response?.status} - ${error.response?.data}`);
      throw new Error(`Failed to fetch url content: ${error.response?.status}`);
    } else {
      console.error('Unexpected error:', error);
      throw error;
    }
  }
}

export async function getOembedContents() {
  console.log('Creating Supabase client...');

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createClient()
  const userId = session.user.id;

  try {
    console.log('Fetching oembed contents...');
    const { data, error } = await supabase
      .from('oembed_contents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('oembed 포스트 조회 실패:', error);
      throw new Error(`oembed 포스트 조회 중 오류 발생: ${error.message}`);
    }

    return data ?? [];
  } catch (error) {
    console.error('Unexpected error:', error);
    throw error;
  }
}

export async function postOembedContents(data: OembedContent[]) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('oembed_contents')
    .upsert(data, { onConflict: 'id', ignoreDuplicates: true, });

  if (error) {
    console.error('oembed 포스트 저장 실패:', error);
    throw new Error('oembed 포스트를 저장하는 중 오류가 발생했습니다.');
  }
}

export async function saveOembedContentFromUrl(contentUrl: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    throw new Error("로그인이 필요합니다.");
  }
  const userId = session.user.id;

  if (!contentUrl || !userId) {
    throw new Error('Missing url or user ID');
  }

  const fetched = await fetchOembedContents(contentUrl);
  const match = contentUrl.match(/\/post\/([a-zA-Z0-9_-]+)$/);
  const shortcode = match ? match[1] : null;

  const postData = [{
    id: userId + shortcode,
    url: contentUrl,
    created_at: new Date().toISOString(),
    user_id: userId,
    html: fetched?.html,
  }];

  await postOembedContents(postData);
  return { success: true };
}

export async function changeOembedContentToPost(contentUrl: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  try {
    console.log('Navigating to URL:', contentUrl);
    await page.goto(contentUrl, { waitUntil: 'networkidle2' });
    await new Promise((res) => setTimeout(res, 2000));

    // 페이지 내용 디버깅
    const pageContent = await page.content();
    console.log('Page loaded. Content length:', pageContent.length);
    console.log('Looking for content container...');

    const postData = await page.evaluate((link) => {
      //const user_id = link.match(/\/@([^\/]+)/)?.[1] || '';
      const shortcode = link.match(/\/post\/([a-zA-Z0-9_-]+)$/)?.[1] || '';
      const container = document.querySelector('div.x1a6qonq');
      const outerSpans = Array.from(container?.querySelectorAll('span') || []);
      const text = outerSpans
        .map(span => {
          const innerSpan = span.querySelector('span');
          return innerSpan?.textContent?.trim();
        })
        .filter(Boolean)
        .join('\n');

      return {
        shortcode,
        text
      };
    }, contentUrl);


    const content: ContentItem = {
      id: postData.shortcode,
      content: postData.text,
    };

    return content;
  } catch (postErr) {
    console.error(`게시물 크롤링 실패: ${contentUrl}`, postErr);
    return null;
  } finally {
    await browser.close();
  }
}