'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'

export type ContentCategory = 'external' | 'saved'
export type PublishStatus = 'draft' | 'scheduled' | 'posted'

export type Content = {
  my_contents_id?: string
  social_id?: string
  content: string
  publish_status?: PublishStatus
  created_at?: string
  updated_at?: string
  view_count?: number
  like_count?: number
  comment_count?: number
  repost_count?: number
  share_count?: number
  top_comment?: string
  url?: string
  category?: string
  scheduled_at?: string
  // Thread chain properties
  is_thread_chain?: boolean
  parent_media_id?: string
  thread_sequence?: number
}

export async function createContent(content: Content) {
  try {
    // 🔐 사용자 세션 확인 (RLS 역할)
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new Error('Unauthorized: User not authenticated')
    }

    const supabase = await createClient()
    const userId = session.user.id

    const { data, error } = await supabase
      .from('my_contents')
      .insert([{
        content: content.content,
        publish_status: content.publish_status,
        social_id: content.social_id,
        user_id: userId // 🔒 RLS: 사용자 ID 추가
      }])
      .select()
      .single()

    if (error) throw error

    revalidatePath('/contents')
    return { data, error: null }
  } catch (error) {
    console.error('Error creating content:', error)
    return { data: null, error }
  }
}

export async function getContents(params?: {
  category?: ContentCategory
  currentSocialId: string
}) {
  try {
    // 🔐 사용자 세션 확인 (RLS 역할)
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new Error('Unauthorized: User not authenticated')
    }

    const supabase = await createClient()
    const { category, currentSocialId } = params || {}
    const userId = session.user.id

    console.log("currentSocialId", currentSocialId)

    let query;

    // my_contents 테이블에서 조회 (사용자 ID로 필터링)
    query = supabase
      .from('my_contents')
      .select('*, thread_sequence, is_thread_chain, parent_media_id')
      .eq('social_id', currentSocialId)
      .eq('user_id', userId) // 🔒 RLS: 자신의 데이터만 조회

    // saved 카테고리 처리
    if (category === 'saved') {
      query = query.eq('publish_status', 'draft')
      console.log("query data : \n\n\n\n\n", query)
    } else {
      // saved가 아닌 경우에만 scheduled, posted로 필터링
      query = query.in('publish_status', ['scheduled', 'posted'])
    }

    const { data, error } = await query

    console.log("data", data)

    if (error) throw error

    return { data, error: null }

  } catch (error) {
    console.error('Error fetching contents:', error)
    return { data: null, error }
  }
}

// getMyContents() -> my_contents 테이블에서 published_state에 따라 가져오기. if draft : select() published_state=draft, if schedule : select() published_state=scheduled, posted
// getExternalContents() -> external_contents 테이블에서 category에 따라 가져오기

export async function updateContent(id: string, content: Partial<Content>) {
  try {
    // 🔐 사용자 세션 확인 (RLS 역할)
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new Error('Unauthorized: User not authenticated')
    }

    const supabase = await createClient()
    const userId = session.user.id

    const { data, error } = await supabase
      .from('my_contents')
      .update(content)
      .eq('my_contents_id', id)
      .eq('user_id', userId) // 🔒 RLS: 자신의 데이터만 수정 가능
      .select()
      .single()

    if (error) throw error

    revalidatePath('/contents')
    return { data, error: null }
  } catch (error) {
    console.error('Error updating content:', error)
    return { data: null, error }
  }
}

export async function deleteContent(id: string, socialId: string) {
  try {
    // 🔐 사용자 세션 확인 (RLS 역할)
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new Error('Unauthorized: User not authenticated')
    }

    const supabase = await createClient()
    const userId = session.user.id

    const { error } = await supabase
      .from('my_contents')
      .delete()
      .eq('my_contents_id', id)
      .eq('social_id', socialId)
      .eq('user_id', userId) // 🔒 RLS: 자신의 데이터만 삭제 가능

    if (error) throw error

    revalidatePath('/contents')
    return { error: null }
  } catch (error) {
    console.error('Error deleting content:', error)
    return { error }
  }
} 