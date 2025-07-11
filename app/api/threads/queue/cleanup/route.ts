import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * 큐 정리를 위한 Vercel Cron Job 엔드포인트
 * 매일 실행되어 완료된 큐 아이템들을 정리합니다.
 */
export async function GET() {
  try {
    console.log('🧹 Starting queue cleanup...');
    
    const supabase = await createClient();
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24시간 전

    // 완료된 큐 아이템 삭제
    const { error: deleteError, count } = await supabase
      .from('thread_queue')
      .delete()
      .eq('status', 'completed')
      .lt('processed_at', cutoffTime.toISOString());

    if (deleteError) {
      console.error('Queue cleanup error:', deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    console.log(`🧹 Cleaned up ${count} completed queue items`);
    
    return NextResponse.json({
      success: true,
      message: `Queue cleanup completed. Removed ${count} items.`,
      removed: count
    });
  } catch (error) {
    console.error('Queue cleanup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}