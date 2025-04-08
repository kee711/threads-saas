import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('my_contents')
      .select('*')
      .or('publish_status.eq.scheduled,publish_status.eq.posted')
      .order('scheduled_at', { ascending: true })

    if (error) {
      console.error('Error fetching contents:', error)
      return new NextResponse('Internal Server Error', { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/contents/scheduled:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 