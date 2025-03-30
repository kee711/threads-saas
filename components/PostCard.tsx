'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ImagePlus, Vote, Sparkles, ChartNoAxesCombined, Plus } from 'lucide-react';
import { useState } from 'react';

interface PostCardProps {
  variant?: "default" | "writing" | "compact";
  avatar?: string;
  username: string;
  content: string;
  timestamp?: string;
  onAiClick?: () => void;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  repostCount?: number;
  shareCount?: number;
  topComment?: string;
  url?: string;
  onAdd?: () => void;
}

// 점수 계산 함수
const calculateScore = (
  viewCount = 0,
  likeCount = 0,
  commentCount = 0,
  shareCount = 0,
  repostCount = 0
) => {
  // 각 지표의 가중치 설정
  const total =
    (viewCount * 0.3) +
    (likeCount * 0.3) +
    (commentCount * 0.2) +
    ((shareCount + repostCount) * 0.2);

  // 점수 범위에 따른 등급 부여
  if (total >= 10000) return { grade: 'Best' };
  if (total >= 5000) return { grade: 'Good' };
  if (total >= 1000) return { grade: 'So-so' };
  return { grade: 'Bad' };
};

export function PostCard({
  variant = "default",
  avatar,
  username,
  content,
  timestamp,
  onAiClick,
  viewCount,
  likeCount,
  commentCount,
  repostCount,
  shareCount,
  topComment,
  url,
  onAdd,
}: PostCardProps) {
  const [isAiActive, setIsAiActive] = useState(false);

  const handleAiClick = () => {
    if (onAiClick) {
      setIsAiActive(!isAiActive);
      onAiClick();
    }
  };

  const isCompact = variant === "compact";
  const isWriting = variant === "writing";
  const score = calculateScore(viewCount, likeCount, commentCount, shareCount, repostCount);

  return (
    <div className={`space-y-4 border-y w-full bg-card ${isCompact ? 'p-3' : 'p-4'}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className={`flex-shrink-0 ${isCompact ? 'h-8 w-8' : 'h-10 w-10'}`}>
          <AvatarImage src={avatar} alt={username} />
          <AvatarFallback>{username[0]}</AvatarFallback>
        </Avatar>

        <div className='flex-col flex-1'>
          {/* Username, Content and Timestamp */}
          <div className="flex-1 space-y-1 pb-10">
            <div className="flex items-center gap-2">
              <span className="font-medium">{username}</span>
              {timestamp && (
                <span className="text-sm text-muted-foreground">{timestamp}</span>
              )}
            </div>
            <div className={`whitespace-pre-wrap ${isCompact ? 'text-xs' : 'text-sm'}`}>
              {content}
            </div>
          </div>

          {/* Action Buttons */}
          {!isCompact && !isWriting && (
            <div className='flex justify-between'>
              <div className='flex text-sm gap-2'>
                <ChartNoAxesCombined className='h-4 w-4' />
                {score.grade}
              </div>
              <Button
                variant="outline"
                size="default"
                className='gap-1 px-4'
                onClick={onAdd}
              >
                <Plus className='h-4 w-4' />
                <span>Add</span>
              </Button>
            </div>
          )}
        </div>
      </div>


      {isCompact && (
        <div className='flex justify-end space-x-2'>
          as


        </div>
      )

      }


      {isWriting && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <Vote className="h-4 w-4" />
          </Button>
          <Button
            variant="toggle"
            size="sm"
            data-state={isAiActive ? "on" : "off"}
            className="flex items-center gap-2 rounded-full px-4"
            onClick={handleAiClick}
          >
            <Sparkles className="h-4 w-4" />
            <span>AI</span>
          </Button>
        </div>
      )}



    </div>
  );
} 