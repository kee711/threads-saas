'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export type ScheduledPost = {
  id?: string
  content: string
  scheduled_at: string
  publish_status: 'scheduled' | 'published' | 'failed'
  created_at?: string
}

// 다음 예약 시간 계산
function getNextScheduleTime(scheduleTimes: { hour: number; minute: number }[]): Date {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // 오늘과 내일의 모든 예약 시간을 생성
  const allTimes = [
    ...scheduleTimes.map(time => {
      const date = new Date(today)
      date.setHours(time.hour, time.minute, 0, 0)
      return date
    }),
    ...scheduleTimes.map(time => {
      const date = new Date(tomorrow)
      date.setHours(time.hour, time.minute, 0, 0)
      return date
    })
  ]

  // 현재 시간 이후의 가장 가까운 시간 찾기
  return allTimes.find(time => time > now) || allTimes[0]
}

export async function schedulePost(content: string, scheduleTimes: { hour: number; minute: number }[]) {
  try {
    const supabase = await createClient()
    const scheduledAt = getNextScheduleTime(scheduleTimes)

    const { data, error } = await supabase
      .from('my_contents')
      .insert([{
        content,
        scheduled_at: scheduledAt.toISOString(),
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