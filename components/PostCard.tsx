'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ImagePlus, Vote, Sparkles, ChartNoAxesCombined, Plus, ChevronDown, Minus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ReusableDropdown } from '@/components/ui/dropdown';

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
  onMinus?: () => void;
  onSelect?: (type: 'format' | 'content') => void;
  isSelected?: boolean;
  order?: number;
  onContentChange?: (content: string) => void;
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
  onMinus,
  onSelect,
  isSelected,
  order,
  onContentChange,
}: PostCardProps) {
  const [isAiActive, setIsAiActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAiClick = () => {
    if (onAiClick) {
      setIsAiActive(!isAiActive);
      onAiClick();
    }
  };

  const isCompact = variant === "compact";
  const isWriting = variant === "writing";
  const score = calculateScore(viewCount, likeCount, commentCount, shareCount, repostCount);

  // textarea 높이 자동 조절
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  // 컨텐츠가 변경될 때마다 높이 조절
  useEffect(() => {
    textareaRef.current?.focus()
    if (isWriting) {
      adjustTextareaHeight();
    }
  }, [content, isWriting]);


  return (
    <div className={`space-y-4 w-full bg-card ${isCompact ? 'p-3 border rounded-xl' : 'p-4 border-y'} ${isSelected ? 'border-primary' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="flex-shrink-0 h-10 w-10">
          <AvatarImage src={avatar} alt={username} />
          <AvatarFallback>{username[0]}</AvatarFallback>
        </Avatar>

        <div className='flex-col flex-1'>
          {/* Username, Content and Timestamp */}
          <div className="flex-1 space-y-1 pb-10">
            <div className="flex justify-between pr-1">
              <span className="font-medium">{username}</span>
              <div>
                {!isCompact && !isWriting && timestamp && (
                  <span className="text-sm text-muted-foreground">{timestamp}</span>
                )}
                {isCompact && (
                  <Minus onClick={onMinus} />
                )}
              </div>
            </div>
            {isWriting ? (
              <textarea
                ref={textareaRef}
                className="w-full resize-none bg-transparent border-none focus:outline-none focus:ring-0 p-0 overflow-hidden placeholder:text-muted-foreground"
                value={content}
                onChange={(e) => {
                  onContentChange?.(e.target.value);
                  adjustTextareaHeight();
                }}
                placeholder={content.length === 0 ? "내용을 작성하세요..." : ""}
                rows={1}
              />
            ) : (
              <div className={`whitespace-pre-wrap overflow-hidden text-ellipsis ${isCompact ? 'line-clamp-3' : ''}`}>
                {content}
              </div>
            )}
          </div>

          {/* Buttons variation by variants */}

          {/* Default variant Buttons */}
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
                disabled={isSelected}
              >
                <Plus className='h-4 w-4' />
                <span>{isSelected ? 'Added' : 'Add'}</span>
              </Button>
            </div>
          )}
          {/* Compact variant Buttons */}
          {isCompact && (
            <div className='flex items-center justify-end space-x-2'>
              <span className='text-muted-foreground'>use as</span>
              <ReusableDropdown
                items={[
                  { label: "format", onClick: () => onSelect?.('format') },
                  { label: "content", onClick: () => onSelect?.('content') }
                ]}
                initialLabel={order === 0 ? 'format' : 'content'}
              />
            </div>
          )}
          {/* Writing variant Buttons */}
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
      </div>
    </div>
  );
}