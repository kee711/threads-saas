import { Content } from "../types";
import { publishThread } from "./threads";

// 콘텐츠별 예약 작업을 추적하는 맵
const scheduledJobs = new Map<number, NodeJS.Timeout>();

// 다음 게시물이 발행될 시간을 계산 (1시간 간격)
export function calculatePublishTime(index: number): Date {
  const now = new Date();
  // 첫 번째 게시물은 5분 후, 그 이후는 1시간 간격으로 예약
  const publishTime = new Date(now.getTime() + (index === 0 ? 5 * 60 * 1000 : (index * 60 * 60 * 1000)));
  return publishTime;
}

// 시간을 포맷팅하는 함수
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// 콘텐츠를 예약하는 함수
export function scheduleContent(content: Content): void {
  const delayMs = content.createdAt.getTime() - new Date().getTime();
  
  if (delayMs <= 0) {
    // 이미 예약 시간이 지났다면 바로 발행
    publishContentImmediately(content);
    return;
  }

  const timeoutId = setTimeout(() => {
    publishContentImmediately(content);
    // 작업 완료 후 맵에서 삭제
    scheduledJobs.delete(content.id);
  }, delayMs);

  // 작업을 맵에 저장
  scheduledJobs.set(content.id, timeoutId);
}

// 콘텐츠를 즉시 발행하는 함수
async function publishContentImmediately(content: Content): Promise<void> {
  try {
    await publishThread(content.content);
    console.log(`콘텐츠 #${content.id} 발행 완료`);
  } catch (error) {
    console.error(`콘텐츠 #${content.id} 발행 실패:`, error);
  }
}

// 모든 예약 작업을 취소하는 함수
export function cancelAllScheduledJobs(): void {
  for (const [id, timeoutId] of scheduledJobs.entries()) {
    clearTimeout(timeoutId);
    console.log(`콘텐츠 #${id}의 예약 발행이 취소되었습니다.`);
  }
  scheduledJobs.clear();
}

// 특정 콘텐츠의 예약 작업을 취소하는 함수
export function cancelScheduledJob(contentId: number): boolean {
  const timeoutId = scheduledJobs.get(contentId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    scheduledJobs.delete(contentId);
    console.log(`콘텐츠 #${contentId}의 예약 발행이 취소되었습니다.`);
    return true;
  }
  return false;
} 