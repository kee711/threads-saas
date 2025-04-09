'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export type ScheduledPost = {
  id?: string
  content: string
  scheduled_at: string
  publish_status: 'scheduled' | 'published' | 'draft'
  created_at?: string
}

export async function schedulePost(content: string, scheduledAt: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('my_contents')
      .insert([{
        content,
        scheduled_at: scheduledAt,
        publish_status: 'scheduled'
      }])
      .select()
      .single()

    if (error) throw error

    revalidatePath('/schedule')
    return { data, error: null }
  } catch (error) {
    console.error('Error scheduling post:', error)
    return { data: null, error }
  }
}

export async function publishPost(content: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('my_contents')
      .insert([{
        content,
        scheduled_at: new Date().toISOString(),
        publish_status: 'published'
      }])
      .select()
      .single()

    if (error) throw error

    revalidatePath('/schedule')
    return { data, error: null }
  } catch (error) {
    console.error('Error publishing post:', error)
    return { data: null, error }
  }
}

export async function deleteSchedule(id: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('my_contents')
      .update({
        publish_status: 'draft',
        scheduled_at: null
      })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/schedule')
    return { error: null }
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return { error }
  }
}