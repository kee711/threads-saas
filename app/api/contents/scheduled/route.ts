import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('my_contents')
      .select('*')
      .or('publish_status.eq.scheduled,publish_status.eq.posted')
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error fetching contents:', error);  // 이건 콘솔에 찍힘
      return NextResponse.json({ error }, { status: 500 }); // 이건 브라우저 응답으로 보여짐
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/contents/scheduled:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}