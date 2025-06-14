import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No authenticated user' }, { status: 401 })
    }

    const userId = session.user.id
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_profiles')
      .select('publish_times')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching publish_times:', error)
      return NextResponse.json({ error: 'Failed to fetch publish_times' }, { status: 500 })
    }

    return NextResponse.json(data?.publish_times || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}