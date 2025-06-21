"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AgentPartnerSidebar } from "@/components/agents/AgentPartnerSidebar";
import { StrategyInsightsCard } from "@/components/agents/cards/StrategyInsightsCard";
import { PerformancePredictionCard } from "@/components/agents/cards/PerformancePredictionCard";
import { LearningStatusCard } from "@/components/agents/cards/LearningStatusCard";
import { AgentSelector } from "@/components/agents/AgentSelector";
import { useAgentStore } from "@/stores/useAgentStore";
import { useAgentOrchestrator } from "@/hooks/useAgentOrchestrator";
import {
  Brain,
  BarChart3,
  MessageSquare,
  TrendingUp,
  Target,
  Zap,
  Settings,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

export default function AgentDashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const {
    currentStrategy,
    currentPrediction,
    learningStatus,
    conversationHistory,
    openConversationModal,
    openAgentSidebar
  } = useAgentStore();

  const { analyzeStrategy, predictPerformance } = useAgentOrchestrator();

  // 대시보드 데이터 로딩
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // 실제로는 API에서 데이터를 가져옴
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleStartConversation = () => {
    openConversationModal();
  };

  const mockAnalytics = {
    totalInteractions: 247,
    improvementRate: 23,
    successfulSuggestions: 186,
    learningProgress: 68,
    weeklyGrowth: 12
  };

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">AI 파트너 대시보드</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                AI 에이전트의 학습 현황과 성과를 확인하세요
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
              <Button onClick={handleStartConversation}>
                <MessageSquare className="w-4 h-4 mr-2" />
                AI와 대화하기
              </Button>
            </div>
          </div>

          {/* 헤더 액션 버튼들 */}
          <div className="flex gap-3">
            <Link href="/agents/test">
              <Button variant="outline" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                컴포넌트 테스트
              </Button>
            </Link>
            <Button className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              새 대화 시작
            </Button>
          </div>

          {/* 핵심 지표 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    총 상호작용
                  </p>
                  <p className="text-2xl font-bold">{mockAnalytics.totalInteractions}</p>
                  <p className="text-xs text-green-600 mt-1">
                    +{mockAnalytics.weeklyGrowth}% 이번 주
                  </p>
                </div>
                <Brain className="w-8 h-8 text-purple-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    학습 진도
                  </p>
                  <p className="text-2xl font-bold">{mockAnalytics.learningProgress}%</p>
                  <Progress value={mockAnalytics.learningProgress} />
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    성공한 제안
                  </p>
                  <p className="text-2xl font-bold">{mockAnalytics.successfulSuggestions}</p>
                  <p className="text-xs text-green-600 mt-1">
                    +{mockAnalytics.improvementRate}% 개선
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    대화 세션
                  </p>
                  <p className="text-2xl font-bold">{conversationHistory.length}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    최근 24시간
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-orange-500" />
              </div>
            </Card>
          </div>

          {/* AI 에이전트 선택 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">AI 에이전트 관리</h2>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                설정
              </Button>
            </div>
            <AgentSelector className="max-w-md" />
          </Card>

          {/* 인사이트 및 분석 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">최근 전략 인사이트</h2>
                <StrategyInsightsCard
                  strategy={currentStrategy || undefined}
                  isLoading={false}
                />
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">성능 예측</h2>
                <PerformancePredictionCard
                  prediction={currentPrediction || undefined}
                  isLoading={false}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">학습 현황</h2>
                <LearningStatusCard
                  learningStatus={learningStatus || undefined}
                  isLoading={false}
                />
              </div>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">주간 활동 요약</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">전략 제안</span>
                    <Badge variant="secondary">42회</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">성능 예측</span>
                    <Badge variant="secondary">38회</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">학습 개선</span>
                    <Badge variant="secondary">15회</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">사용자 피드백</span>
                    <Badge variant="secondary">23회</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* 최근 대화 기록 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">최근 대화</h2>
              <Button variant="outline" size="sm" onClick={handleStartConversation}>
                <MessageSquare className="w-4 h-4 mr-2" />
                새 대화 시작
              </Button>
            </div>

            {conversationHistory.length > 0 ? (
              <div className="space-y-3">
                {conversationHistory.slice(-3).map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${message.type === 'user'
                      ? 'bg-blue-50 dark:bg-blue-900/20 ml-8'
                      : 'bg-gray-50 dark:bg-gray-800 mr-8'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {message.type === 'user' ? '사용자' : 'AI 파트너'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">아직 대화 기록이 없습니다</p>
                <p className="text-sm text-gray-400 mt-1">
                  AI 파트너와 대화를 시작해보세요
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Agent Partner Sidebar */}
      <AgentPartnerSidebar
        onConversationStart={handleStartConversation}
      />
    </div>
  );
} 