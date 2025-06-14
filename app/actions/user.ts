'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'

export async function updatePublishTimes(publishTimes: string[]) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      throw new Error('No authenticated user')
    }

    const userId = session.user.id // ✅ NextAuth 세션에서 user id 가져옴
    const supabase = await createClient()

    const { error } = await supabase
      .from('user_profiles')
      .update({ publish_times: publishTimes })
      .eq('user_id', userId)

    if (error) throw error

    revalidatePath('/schedule') // 필요하면 캐시 무효화
    return { success: true }
  } catch (error) {
    console.error('Error updating publish times:', error)
    return { success: false }
  }
}