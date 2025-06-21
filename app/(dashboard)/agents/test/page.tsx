'use client';

import { useState } from 'react';
import {
  StrategyInsightsCard,
  PerformancePredictionCard,
  LearningStatusCard,
  AgentSelector,
  AgentPartnerSidebar
} from '@/components/agents';
import { useAgentStore } from '@/stores/useAgentStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, Brain, MessageSquare } from 'lucide-react';

export default function AgentTestPage() {
  const [currentContent, setCurrentContent] = useState('');
  const {
    selectedAgentId,
    openConversationModal,
    isConversationModalOpen,
    currentStrategy,
    currentPrediction,
    learningStatus,
    conversationHistory
  } = useAgentStore();

  // 테스트용 더미 데이터 (올바른 타입에 맞춤)
  const dummyStrategy = {
    id: '1',
    title: '인게이지먼트 극대화 전략',
    description: '현재 트렌드에 맞춘 콘텐츠 최적화 방안',
    confidence_score: 92,
    reasoning: [
      '최근 트렌드 분석 결과 질문형 콘텐츠 효과 증가',
      '저녁 시간대 활성 사용자 40% 증가 확인',
      '해시태그 3-5개 사용 시 도달률 25% 향상'
    ],
    recommended_actions: [
      '해시태그 #ThreadsTips #ContentStrategy 추가',
      '게시 시간을 저녁 7-9시로 조정',
      '질문형 콘텐츠로 상호작용 유도'
    ],
    target_audience: '25-35세 마케팅 관심 직장인',
    content_pillars: ['트렌드', '최적화', '인게이지먼트', 'ROI']
  };

  const dummyPrediction = {
    engagement_rate: 8.5,
    predicted_likes: 450,
    predicted_comments: 32,
    predicted_shares: 18,
    confidence: 88,
    optimal_timing: '저녁 7:30-8:30',
    improvement_suggestions: [
      '저녁 시간대 게시로 35% 더 높은 참여율 예상',
      '해시태그 추가로 도달률 25% 향상 가능',
      '질문 형태로 콘텐츠 수정 시 댓글 50% 증가 예상'
    ]
  };

  const dummyLearning = {
    totalInteractions: 1247,
    learningScore: 78,
    improvementAreas: ['감정 분석', '시각적 요소 최적화'],
    strengths: ['콘텐츠 품질 분석', '트렌드 예측'],
    recentLearnings: [
      '사용자가 질문형 콘텐츠에 높은 반응',
      '저녁 시간대 게시가 효과적',
      '해시태그 3-5개가 최적'
    ],
    nextMilestone: '고급 감정 분석 모델 업데이트'
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 페이지 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🤖 AI Agent 컴포넌트 테스트
            </h1>
            <p className="text-gray-600">
              현재 구현된 모든 Agent 컴포넌트들을 테스트해보세요.
            </p>
          </div>

          {/* Agent 선택기 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Agent 선택기
            </h2>
            <AgentSelector />
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>선택된 Agent:</strong> {selectedAgentId || '없음'}
              </p>
            </div>
          </Card>

          {/* 카드 컴포넌트들 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 전략 인사이트 카드 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                전략 인사이트 카드
              </h3>
              <StrategyInsightsCard strategy={currentStrategy || dummyStrategy} />
              <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                <strong>Variant:</strong> gradient
              </div>
            </div>

            {/* 성능 예측 카드 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                성능 예측 카드
              </h3>
              <PerformancePredictionCard prediction={currentPrediction || dummyPrediction} />
              <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                <strong>Variant:</strong> dots
              </div>
            </div>

            {/* 학습 상태 카드 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                학습 상태 카드
              </h3>
              <LearningStatusCard learningStatus={learningStatus || dummyLearning} />
              <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                <strong>Variant:</strong> neubrutalism
              </div>
            </div>
          </div>

          {/* 테스트 제어 패널 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              테스트 제어 패널
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="content" className="block text-sm font-medium mb-2">
                  테스트 콘텐츠 입력:
                </label>
                <textarea
                  id="content"
                  value={currentContent}
                  onChange={(e) => setCurrentContent(e.target.value)}
                  placeholder="여기에 콘텐츠를 입력하면 사이드바에 전달됩니다..."
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={4}
                />
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => openConversationModal()}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  대화 모달 열기
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentContent('샘플 콘텐츠: 오늘의 마케팅 트렌드에 대해 알아보세요!')}
                >
                  샘플 텍스트 로드
                </Button>
              </div>
            </div>
          </Card>

          {/* 상태 정보 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Agent Store 상태</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">선택된 Agent</div>
                <div className="font-semibold">{selectedAgentId || '없음'}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">대화 모달 상태</div>
                <Badge variant={isConversationModalOpen ? 'default' : 'secondary'}>
                  {isConversationModalOpen ? '열림' : '닫힘'}
                </Badge>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">총 상호작용</div>
                <div className="font-semibold">{learningStatus?.totalInteractions || dummyLearning.totalInteractions}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">학습 점수</div>
                <div className="font-semibold">{learningStatus?.learningScore || dummyLearning.learningScore}%</div>
              </div>
            </div>

            {/* 대화 기록 */}
            {conversationHistory.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">최근 대화 기록</h3>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {conversationHistory.slice(-3).map((message) => (
                    <div key={message.id} className="p-2 bg-white rounded border text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {message.type === 'user' ? '사용자' : 'AI Agent'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-1">{message.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Agent Partner Sidebar */}
      <AgentPartnerSidebar
        contentText={currentContent}
        onConversationStart={() => openConversationModal()}
      />
    </div>
  );
} 