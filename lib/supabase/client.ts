import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const createClient = () =>
  createSupabaseClient(supabaseUrl, supabaseAnonKey); 