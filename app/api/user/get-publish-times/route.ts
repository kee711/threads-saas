import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ publishTimes: [] }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('publish_times')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching publish_times:', error)
    return NextResponse.json({ publishTimes: [] }, { status: 500 })
  }

  return NextResponse.json({ publishTimes: data?.publish_times || [] })
}