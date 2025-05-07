import { createClient as createClientOriginal } from '@supabase/supabase-js';

// 클라이언트 측에서 사용할 Supabase 클라이언트 생성
export function createClient() {
  if (typeof window === 'undefined') {
    throw new Error('createClient 함수는 클라이언트 측에서만 사용할 수 있습니다.');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL 또는 Anon Key가 설정되지 않았습니다.');
  }

  return createClientOriginal(supabaseUrl, supabaseAnonKey);
} 