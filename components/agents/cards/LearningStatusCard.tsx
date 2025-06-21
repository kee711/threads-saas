"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LearningStatus } from "../types";
import { Brain, CheckCircle, TrendingUp, Target, Zap } from "lucide-react";

interface LearningStatusCardProps {
  learningStatus?: LearningStatus;
  isLoading?: boolean;
}

export function LearningStatusCard({
  learningStatus,
  isLoading = false
}: LearningStatusCardProps) {
  if (isLoading) {
    return (
      <Card variant="neubrutalism" className="mb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-green-500" />
            <span className="font-medium text-sm">학습 상태 확인 중...</span>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5" />
          </div>
        </div>
      </Card>
    );
  }

  if (!learningStatus) {
    return (
      <Card variant="neubrutalism" className="mb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-sm text-gray-500">학습 상태</span>
          </div>
          <p className="text-sm text-gray-500">
            AI가 사용자의 선호도를 학습하고 있습니다.
          </p>
        </div>
      </Card>
    );
  }

  const getLearningLevel = (score: number) => {
    if (score >= 80) return { label: "전문가", color: "text-purple-600", bgColor: "bg-purple-100" };
    if (score >= 60) return { label: "숙련자", color: "text-blue-600", bgColor: "bg-blue-100" };
    if (score >= 40) return { label: "학습자", color: "text-green-600", bgColor: "bg-green-100" };
    return { label: "초보자", color: "text-gray-600", bgColor: "bg-gray-100" };
  };

  const level = getLearningLevel(learningStatus.learningScore);

  return (
    <Card variant="neubrutalism" className="mb-4">
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-green-500" />
            <span className="font-medium text-sm">AI 학습 상태</span>
          </div>
          <Badge className={`text-xs ${level.color} ${level.bgColor} border-none`}>
            {level.label}
          </Badge>
        </div>

        {/* 학습 점수 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">학습 진도</span>
            <span className="text-sm font-semibold text-green-600">
              {learningStatus.learningScore}/100
            </span>
          </div>
          <Progress value={learningStatus.learningScore} />
        </div>

        {/* 상호작용 횟수 */}
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm">총 상호작용</span>
          </div>
          <span className="text-sm font-semibold">
            {learningStatus.totalInteractions}회
          </span>
        </div>

        {/* 강점 */}
        {learningStatus.strengths.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              AI가 잘하는 영역
            </span>
            <div className="space-y-1">
              {learningStatus.strengths.slice(0, 2).map((strength, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span className="text-xs text-green-700 dark:text-green-300">
                    {strength}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 개선 영역 */}
        {learningStatus.improvementAreas.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              개선 중인 영역
            </span>
            <div className="space-y-1">
              {learningStatus.improvementAreas.slice(0, 2).map((area, index) => (
                <div key={index} className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-orange-500 flex-shrink-0" />
                  <span className="text-xs text-orange-700 dark:text-orange-300">
                    {area}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 다음 마일스톤 */}
        {learningStatus.nextMilestone && (
          <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
            <Target className="w-4 h-4 text-purple-500" />
            <div className="space-y-0">
              <div className="text-xs font-medium">다음 목표</div>
              <div className="text-xs text-purple-600 dark:text-purple-400">
                {learningStatus.nextMilestone}
              </div>
            </div>
          </div>
        )}

        {/* 최근 학습 내용 */}
        {learningStatus.recentLearnings.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              최근 학습한 내용
            </span>
            <div className="space-y-1">
              {learningStatus.recentLearnings.slice(0, 1).map((learning, index) => (
                <div key={index} className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {learning}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
} 