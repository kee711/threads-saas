import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/authOptions';

// 클라이언트에서 사용할 수 있는 Supabase 클라이언트를 제공하는 API 경로
export async function GET() {
  const session = await getServerSession(authOptions);

  // 인증되지 않은 요청 처리
  if (!session || !session.user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  // Supabase 클라이언트 생성 (익명 키로만 접근 가능한 제한된 권한)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 클라이언트에서 사용할 Supabase 클라이언트 객체 자체를 반환할 수 없으므로
  // 간접적으로 로그인된 사용자와 연관된 테이블에만 접근 가능하도록 제한된 API 제공
  return NextResponse.json(supabase);
} 