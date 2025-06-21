"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, PanelRightClose, MessageSquare, Settings } from "lucide-react";
import { StrategyInsightsCard } from "./cards/StrategyInsightsCard";
import { PerformancePredictionCard } from "./cards/PerformancePredictionCard";
import { LearningStatusCard } from "./cards/LearningStatusCard";
import { AgentSelector } from "./AgentSelector";
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import { usePathname } from 'next/navigation';
import { Strategy, PerformancePrediction, LearningStatus } from './types';

interface AgentPartnerSidebarProps {
  className?: string;
  contentText?: string;
  onConversationStart?: () => void;
}

export function AgentPartnerSidebar({
  className,
  contentText,
  onConversationStart
}: AgentPartnerSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [prediction, setPrediction] = useState<PerformancePrediction | null>(null);
  const [learningStatus, setLearningStatus] = useState<LearningStatus | null>(null);

  const { isRightSidebarOpen, openRightSidebar, closeRightSidebar, isMobile } = useMobileSidebar();
  const pathname = usePathname();

  // 모바일에서는 isRightSidebarOpen 상태 사용, 데스크톱에서는 기존 isCollapsed 사용
  const isVisible = isMobile ? isRightSidebarOpen : !isCollapsed;
  const toggleSidebar = isMobile ?
    (isRightSidebarOpen ? closeRightSidebar : openRightSidebar) :
    () => setIsCollapsed(prev => !prev);

  // 콘텐츠가 변경될 때 AI 분석 수행
  useEffect(() => {
    if (contentText && contentText.length > 10) {
      analyzeContent(contentText);
    } else {
      // 콘텐츠가 없으면 상태 초기화
      setStrategy(null);
      setPrediction(null);
    }
  }, [contentText]);

  // 컴포넌트 마운트 시 학습 상태 불러오기
  useEffect(() => {
    loadLearningStatus();
  }, []);

  const analyzeContent = async (content: string) => {
    setIsLoading(true);
    try {
      // 실제로는 API 호출로 대체
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 목업 데이터
      setStrategy({
        id: '1',
        title: '참여 유도형 전략',
        description: '사용자 참여를 극대화하는 콘텐츠 전략을 제안합니다.',
        confidence_score: 0.85,
        reasoning: [
          '질문 형태의 콘텐츠로 댓글 유도',
          '트렌딩 해시태그 활용',
          '개인적 경험 공유로 공감대 형성'
        ],
        recommended_actions: [
          '마지막에 질문 추가하기',
          '#오늘의질문 해시태그 추가',
          '개인적 경험 한 줄 추가'
        ],
        target_audience: '20-30대 직장인',
        content_pillars: ['일상', '관계', '성장']
      });

      setPrediction({
        engagement_rate: 0.72,
        predicted_likes: 145,
        predicted_comments: 23,
        predicted_shares: 8,
        confidence: 0.78,
        optimal_timing: '오후 7-9시',
        improvement_suggestions: [
          '더 구체적인 예시 추가',
          '호출어(call-to-action) 강화'
        ]
      });

    } catch (error) {
      console.error('Content analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLearningStatus = async () => {
    try {
      // 목업 데이터
      setLearningStatus({
        totalInteractions: 127,
        learningScore: 68,
        improvementAreas: ['이미지 선택', '해시태그 최적화'],
        strengths: ['톤 매칭', '콘텐츠 구조화'],
        recentLearnings: ['사용자가 질문 형태 콘텐츠를 선호함'],
        nextMilestone: '톤 매칭 정확도 90% 달성'
      });
    } catch (error) {
      console.error('Failed to load learning status:', error);
    }
  };

  const handleStrategyApply = (strategy: Strategy) => {
    // 전략 적용 로직
    console.log('Applying strategy:', strategy);
  };

  // 모바일에서 오버레이 클릭 시 사이드바 닫기
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && isMobile) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* 모바일 오버레이 */}
      {isMobile && isVisible && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={handleOverlayClick}
        />
      )}

      {/* 사이드바 토글 버튼 */}
      {!isVisible && (
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSidebar}
          className="fixed right-4 top-20 z-30 md:hidden"
        >
          <Sparkles className="w-4 h-4" />
        </Button>
      )}

      {/* 사이드바 */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full bg-background border-l transition-transform duration-300 z-50",
          "w-80 md:w-96",
          isVisible ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="font-semibold">AI 파트너</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
              >
                <PanelRightClose className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* AI 에이전트 선택 */}
            <div>
              <h3 className="text-sm font-medium mb-2">AI 에이전트</h3>
              <AgentSelector />
            </div>

            {/* 대화 시작 버튼 */}
            <Button
              className="w-full"
              variant="outline"
              onClick={onConversationStart}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              AI와 대화하기
            </Button>

            {/* 전략 인사이트 */}
            <StrategyInsightsCard
              strategy={strategy || undefined}
              isLoading={isLoading}
              onApplyStrategy={handleStrategyApply}
            />

            {/* 성능 예측 */}
            <PerformancePredictionCard
              prediction={prediction || undefined}
              isLoading={isLoading}
            />

            {/* 학습 상태 */}
            <LearningStatusCard
              learningStatus={learningStatus || undefined}
              isLoading={false}
            />

            {/* 빠른 액션 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">빠른 액션</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  톤 분석
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  해시태그 제안
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  이미지 추천
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  최적 시간
                </Button>
              </div>
            </div>

            {/* 오늘의 인사이트 */}
            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
              <h4 className="text-sm font-medium mb-2">💡 오늘의 인사이트</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                질문 형태의 콘텐츠가 평소보다 30% 높은 참여율을 보이고 있어요!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 