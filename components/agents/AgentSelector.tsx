'use client';

import { useEffect, useState } from 'react';
import { Bot, ChevronDown, Settings, Zap } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AgentType } from '@/lib/agents/types';

interface Agent {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  status: 'active' | 'learning' | 'idle';
  capabilities: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface AgentSelectorProps {
  className?: string;
  onAgentChange?: (agent: Agent) => void;
}

export function AgentSelector({ className, onAgentChange }: AgentSelectorProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('strategy-agent');
  const [agents] = useState<Agent[]>([
    {
      id: 'strategy-agent',
      type: 'strategy',
      name: '전략 AI',
      description: '콘텐츠 전략과 방향성을 제안합니다',
      status: 'active',
      capabilities: ['전략 수립', '트렌드 분석', '타겟 분석'],
      level: 'advanced'
    },
    {
      id: 'creator-agent',
      type: 'creator',
      name: '크리에이터 AI',
      description: '매력적인 콘텐츠를 직접 생성합니다',
      status: 'active',
      capabilities: ['콘텐츠 생성', '톤 매칭', '창의적 아이디어'],
      level: 'intermediate'
    },
    {
      id: 'qa-agent',
      type: 'qa',
      name: '품질 관리 AI',
      description: '콘텐츠의 품질과 정확성을 검토합니다',
      status: 'learning',
      capabilities: ['맞춤법 검사', '사실 확인', '브랜드 일관성'],
      level: 'intermediate'
    },
    {
      id: 'performance-agent',
      type: 'performance',
      name: '성과 분석 AI',
      description: '콘텐츠 성과를 예측하고 분석합니다',
      status: 'active',
      capabilities: ['성과 예측', '최적화 제안', '데이터 분석'],
      level: 'advanced'
    }
  ]);

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'learning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'idle':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return '활성';
      case 'learning':
        return '학습중';
      case 'idle':
        return '대기';
      default:
        return '대기';
    }
  };

  const getLevelColor = (level: Agent['level']) => {
    switch (level) {
      case 'advanced':
        return 'text-purple-600';
      case 'intermediate':
        return 'text-blue-600';
      case 'beginner':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getLevelLabel = (level: Agent['level']) => {
    switch (level) {
      case 'advanced':
        return '전문가';
      case 'intermediate':
        return '숙련자';
      case 'beginner':
        return '초보자';
      default:
        return '초보자';
    }
  };

  const selectedAgent = agents.find(agent => agent.id === selectedAgentId);

  const handleAgentSelect = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setSelectedAgentId(agentId);
      onAgentChange?.(agent);
    }
  };

  // 초기 선택된 에이전트 알림
  useEffect(() => {
    if (selectedAgent && onAgentChange) {
      onAgentChange(selectedAgent);
    }
  }, []);

  return (
    <div className={className}>
      <Select value={selectedAgentId} onValueChange={handleAgentSelect}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2 flex-1">
            <Bot className="w-4 h-4 text-purple-500" />
            <div className="flex flex-col items-start">
              <SelectValue>
                {selectedAgent ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedAgent.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(selectedAgent.status)}`}
                    >
                      {getStatusLabel(selectedAgent.status)}
                    </Badge>
                  </div>
                ) : (
                  "AI 에이전트 선택"
                )}
              </SelectValue>
              {selectedAgent && (
                <span className="text-xs text-gray-500">
                  {selectedAgent.description}
                </span>
              )}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              사용 가능한 AI 에이전트
            </SelectLabel>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{agent.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(agent.status)}`}
                      >
                        {getStatusLabel(agent.status)}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {agent.description}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-xs font-medium ${getLevelColor(agent.level)}`}>
                        {getLevelLabel(agent.level)}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {agent.capabilities.slice(0, 2).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectItem value="settings">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>에이전트 설정</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* 선택된 에이전트의 세부 정보 */}
      {selectedAgent && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">주요 능력</span>
              <span className={`text-xs font-medium ${getLevelColor(selectedAgent.level)}`}>
                {getLevelLabel(selectedAgent.level)} 레벨
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedAgent.capabilities.map((capability, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {capability}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 