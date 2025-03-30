import { Content } from "../types";
import { publishThread } from "./threads";

// 콘텐츠별 예약 작업을 추적하는 맵
const scheduledJobs = new Map<number, NodeJS.Timeout>();

// 콘텐츠 발행 시간 계산 함수
export function calculatePublishTime(index: number): Date {
  const now = new Date();
  const baseTime = new Date(now.getTime());
  
  // 첫 번째 콘텐츠는 30분 후, 그 이후는 3시간 간격으로 게시
  const minutes = index === 0 ? 30 : 30 + (index * 180);
  
  baseTime.setMinutes(baseTime.getMinutes() + minutes);
  return baseTime;
}

// 날짜 포맷팅 함수
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

// 콘텐츠 발행 스케줄링 함수
export function scheduleContent(content: Content): void {
  if (!content.isConfirmed || !content.publishDate) {
    console.error("확정되지 않았거나 발행 일정이 없는 콘텐츠입니다.");
    return;
  }
  
  const publishDate = content.createdAt;
  const now = new Date();
  const timeUntilPublish = publishDate.getTime() - now.getTime();
  
  if (timeUntilPublish <= 0) {
    // 이미 발행 시간이 지났다면 바로 발행
    publishContent(content);
    return;
  }
  
  // 예약 발행
  console.log(`콘텐츠 ID ${content.id}가 ${formatDate(publishDate)}에 발행될 예정입니다.`);
  
  // 발행 시간에 맞춰 publishContent 함수 실행
  setTimeout(() => {
    publishContent(content);
  }, timeUntilPublish);
}

// 콘텐츠 발행 함수
async function publishContent(content: Content): Promise<void> {
  try {
    console.log(`콘텐츠 ID ${content.id} 발행 시작...`);
    await publishThread(content.content);
    console.log(`콘텐츠 ID ${content.id} 발행 완료!`);
  } catch (error) {
    console.error(`콘텐츠 ID ${content.id} 발행 실패:`, error);
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