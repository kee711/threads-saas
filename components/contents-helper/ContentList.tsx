'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { ContentCategory, ContentItem, ContentListProps } from './types';
import { Button } from '@/components/ui/button';
import { getContentsByCategory } from '@/lib/services/content';

export function ContentList({ category, title }: ContentListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContents() {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Fetching contents for category:', category);
        const data = await getContentsByCategory(category);
        console.log('Fetched data:', data);
        setContents(data);
      } catch (error) {
        console.error('Error fetching contents:', error);
        setError(error instanceof Error ? error.message : '데이터를 가져오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchContents();
  }, [category]);

  // 컨텐츠 목록 토글
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleExpand}
            className="h-8 w-8"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 컨텐츠 목록 */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2">
          {isLoading ? (
            <div className="text-center text-muted-foreground">데이터를 불러오는 중...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : contents.length > 0 ? (
            contents.map((content) => (
              <PostCard
                key={content.id}
                variant="default"
                username="minsung.dev"
                content={content.content}
                timestamp={formatDate(content.created_at)}
                viewCount={content.view_count}
                likeCount={content.like_count}
                commentCount={content.comment_count}
                repostCount={content.repost_count}
                shareCount={content.share_count}
                topComment={content.top_comment}
                url={content.url}
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground">
              {category}에 대한 컨텐츠를 찾을 수 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
} 