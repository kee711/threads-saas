"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PerformancePrediction } from "../types";
import { BarChart3, Clock, Heart, MessageCircle, Share, TrendingUp } from "lucide-react";

interface PerformancePredictionCardProps {
  prediction?: PerformancePrediction;
  isLoading?: boolean;
}

export function PerformancePredictionCard({
  prediction,
  isLoading = false
}: PerformancePredictionCardProps) {
  if (isLoading) {
    return (
      <Card variant="dots" className="mb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-sm">성능 예측 중...</span>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
        </div>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card variant="dots" className="mb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-sm text-gray-500">성능 예측</span>
          </div>
          <p className="text-sm text-gray-500">
            콘텐츠를 작성하면 예상 성과를 분석해드립니다.
          </p>
        </div>
      </Card>
    );
  }

  const getEngagementColor = (rate: number) => {
    if (rate >= 0.8) return "text-green-500";
    if (rate >= 0.6) return "text-yellow-500";
    return "text-red-500";
  };

  const getEngagementLabel = (rate: number) => {
    if (rate >= 0.8) return "높음";
    if (rate >= 0.6) return "보통";
    return "낮음";
  };

  return (
    <Card variant="dots" className="mb-4">
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-sm">성능 예측</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            신뢰도 {Math.round(prediction.confidence * 100)}%
          </Badge>
        </div>

        {/* 전체 참여율 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">예상 참여율</span>
            <span className={`text-sm font-semibold ${getEngagementColor(prediction.engagement_rate)}`}>
              {getEngagementLabel(prediction.engagement_rate)}
            </span>
          </div>
          <Progress value={prediction.engagement_rate * 100} />
          <span className="text-xs text-gray-500">
            {(prediction.engagement_rate * 100).toFixed(1)}% 예상
          </span>
        </div>

        {/* 세부 메트릭 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center space-y-1">
            <Heart className="w-4 h-4 text-red-500 mx-auto" />
            <div className="text-xs text-gray-500">좋아요</div>
            <div className="text-sm font-semibold">{prediction.predicted_likes}</div>
          </div>
          <div className="text-center space-y-1">
            <MessageCircle className="w-4 h-4 text-blue-500 mx-auto" />
            <div className="text-xs text-gray-500">댓글</div>
            <div className="text-sm font-semibold">{prediction.predicted_comments}</div>
          </div>
          <div className="text-center space-y-1">
            <Share className="w-4 h-4 text-green-500 mx-auto" />
            <div className="text-xs text-gray-500">공유</div>
            <div className="text-sm font-semibold">{prediction.predicted_shares}</div>
          </div>
        </div>

        {/* 최적 타이밍 */}
        {prediction.optimal_timing && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <Clock className="w-4 h-4 text-blue-500" />
            <div className="space-y-0">
              <div className="text-xs font-medium">최적 게시 시간</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                {prediction.optimal_timing}
              </div>
            </div>
          </div>
        )}

        {/* 개선 제안 */}
        {prediction.improvement_suggestions.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              개선 제안
            </span>
            <div className="space-y-1">
              {prediction.improvement_suggestions.slice(0, 2).map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2">
                  <TrendingUp className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {suggestion}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
} 