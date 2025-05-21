'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export type ContentSource = 'my' | 'external'
export type ContentCategory = 'all' | 'viral' | 'news' | 'drafts'
export type PublishStatus = 'draft' | 'scheduled' | 'published' | 'failed'

export type Content = {
  id?: string
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
}

export async function createContent(content: Content) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('my_contents')
      .insert([{
        content: content.content,
        publish_status: content.publish_status
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
  source?: ContentSource
  category?: ContentCategory
}) {
  try {
    const supabase = await createClient()
    const { source = 'my', category = 'all' } = params || {}

    // my_contents 테이블에서 조회
    if (source === 'my') {
      const query = supabase.from('my_contents').select('*').in('publish_status', ['scheduled', 'posted'])

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return { data, error: null }
    }

    // external_contents 테이블에서 조회
    else {
      const query = supabase.from('external_contents').select('*')

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return { data, error: null }
    }
  } catch (error) {
    console.error('Error fetching contents:', error)
    return { data: null, error }
  }
}

// getMyContents() -> my_contents 테이블에서 published_state에 따라 가져오기. if draft : select() published_state=draft, if schedule : select() published_state=scheduled, posted
// getExternalContents() -> external_contents 테이블에서 category에 따라 가져오기

export async function updateContent(id: string, content: Partial<Content>) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('my_contents')
      .update(content)
      .eq('id', id)
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

export async function deleteContent(id: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('my_contents')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/contents')
    return { error: null }
  } catch (error) {
    console.error('Error deleting content:', error)
    return { error }
  }
} 