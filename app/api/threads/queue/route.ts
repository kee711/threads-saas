import { NextRequest, NextResponse } from 'next/server';
import { ThreadQueue } from '@/lib/services/threadQueue';

/**
 * 큐 처리를 위한 별도 엔드포인트
 * 이 엔드포인트는 별도의 요청으로 호출되어 큐를 처리합니다.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📝 [API] Queue processing request received');
    
    const queue = ThreadQueue.getInstance();
    await queue.processQueue();
    
    return NextResponse.json({
      success: true,
      message: 'Queue processing completed'
    });
  } catch (error) {
    console.error('❌ [API] Queue processing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * 큐 정리를 위한 엔드포인트
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('📝 [API] Queue cleanup request received');
    
    const queue = ThreadQueue.getInstance();
    await queue.cleanupQueue();
    
    return NextResponse.json({
      success: true,
      message: 'Queue cleanup completed'
    });
  } catch (error) {
    console.error('❌ [API] Queue cleanup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * 큐 상태 조회를 위한 엔드포인트
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📝 [API] Queue status request received');
    
    const queue = ThreadQueue.getInstance();
    const status = await queue.getQueueStatus();
    
    return NextResponse.json({
      success: true,
      status,
      message: 'Queue status retrieved successfully'
    });
  } catch (error) {
    console.error('❌ [API] Queue status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}