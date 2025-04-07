'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { ContentCategory, ContentItem, ContentListProps } from './types';
import { Button } from '@/components/ui/button';
import useSelectedPostsStore from '@/stores/useSelectedPostsStore';
import { getContents, ContentSource } from '@/app/actions/content';
import { toast } from 'sonner';

export function ContentList({ category, title }: ContentListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const addPost = useSelectedPostsStore(state => state.addPost);
  const selectedPosts = useSelectedPostsStore(state => state.selectedPosts);

  useEffect(() => {
    async function fetchContents() {
      setIsLoading(true);
      try {
        // 카테고리에 따라 source와 파라미터 설정
        let source: ContentSource = 'my';
        let params: Parameters<typeof getContents>[0] = { source };

        switch (category) {
          case 'viral':
          case 'news':
            source = 'external';
            params = { source, category };
            break;
          case 'drafts':
            params = { source: 'my', status: 'draft' };
            break;
        }

        const { data, error } = await getContents(params);
        if (error) throw error;

        setContents(data || []);
      } catch (error) {
        console.error('Error fetching contents:', error);
        toast.error('컨텐츠를 불러오는데 실패했습니다.');
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
                onAdd={() => addPost({
                  id: content.id,
                  content: content.content,
                  username: "minsung.dev",
                  timestamp: content.created_at,
                  viewCount: content.view_count,
                  likeCount: content.like_count,
                  commentCount: content.comment_count,
                  repostCount: content.repost_count,
                  shareCount: content.share_count,
                  topComment: content.top_comment,
                  url: content.url
                })}
                isSelected={selectedPosts.some(post => post.id === content.id)}
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