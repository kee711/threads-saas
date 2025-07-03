import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentId = params.id

    if (!contentId) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 현재 컨텐츠가 유저의 것인지 확인
    const { data: contentData, error: contentError } = await supabase
      .from('my_contents')
      .select('*')
      .eq('my_contents_id', contentId)
      .eq('user_id', session.user.id)
      .single()

    if (contentError || !contentData) {
      return NextResponse.json({ error: 'Content not found or not owned by user' }, { status: 404 })
    }

    // 컨텐츠 상태가 scheduled인지 확인
    if (contentData.publish_status !== 'scheduled') {
      return NextResponse.json({ error: 'Only scheduled content can be canceled' }, { status: 400 })
    }

    // 컨텐츠 상태를 draft로 변경하고 예약 시간 제거
    const { data, error } = await supabase
      .from('my_contents')
      .update({
        publish_status: 'draft',
        publish_at: null
      })
      .eq('my_contents_id', contentId)
      .eq('user_id', session.user.id)
      .select()

    if (error) {
      console.error('Error canceling schedule:', error)
      return NextResponse.json({ error: 'Failed to cancel schedule' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('Error handling request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 