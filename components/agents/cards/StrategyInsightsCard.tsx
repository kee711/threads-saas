"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Strategy } from "../types";
import { Lightbulb, Target, TrendingUp, Users } from "lucide-react";

interface StrategyInsightsCardProps {
  strategy?: Strategy;
  isLoading?: boolean;
  onApplyStrategy?: (strategy: Strategy) => void;
}

export function StrategyInsightsCard({
  strategy,
  isLoading = false,
  onApplyStrategy
}: StrategyInsightsCardProps) {
  if (isLoading) {
    return (
      <Card variant="gradient" className="mb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-sm">전략 분석 중...</span>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
          </div>
        </div>
      </Card>
    );
  }

  if (!strategy) {
    return (
      <Card variant="gradient" className="mb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-sm text-gray-500">전략 인사이트</span>
          </div>
          <p className="text-sm text-gray-500">
            콘텐츠를 입력하면 AI가 최적의 전략을 제안합니다.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="gradient" className="mb-4">
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-sm">전략 인사이트</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            신뢰도 {Math.round(strategy.confidence_score * 100)}%
          </Badge>
        </div>

        {/* 제목과 설명 */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">{strategy.title}</h4>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {strategy.description}
          </p>
        </div>

        {/* 신뢰도 프로그레스 바 */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">전략 신뢰도</span>
            <span className="text-xs font-medium">
              {Math.round(strategy.confidence_score * 100)}%
            </span>
          </div>
          <Progress
            value={strategy.confidence_score * 100}
          />
        </div>

        {/* 핵심 정보 */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Target className="w-3 h-3 text-blue-500" />
            <span className="text-gray-600 dark:text-gray-300">
              {strategy.target_audience}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-green-500" />
            <span className="text-gray-600 dark:text-gray-300">
              {strategy.content_pillars.length}개 콘텐츠 축
            </span>
          </div>
        </div>

        {/* 추천 액션 */}
        {strategy.recommended_actions.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              추천 액션
            </span>
            <div className="space-y-1">
              {strategy.recommended_actions.slice(0, 2).map((action, index) => (
                <div key={index} className="flex items-start gap-2">
                  <TrendingUp className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        {onApplyStrategy && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => onApplyStrategy(strategy)}
          >
            전략 적용하기
          </Button>
        )}
      </div>
    </Card>
  );
} 