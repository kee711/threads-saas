'use client';

import { useEffect, useState } from 'react';
import { PostCard } from '@/components/PostCard';
import { ContentCategory, ContentItem, ContentListProps } from './types';
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
        // 카테고리에 따라 데이터 조회
        const params: { source: ContentSource; category: ContentCategory } = {
          source: category === 'external' ? 'external' : 'my',
          category
        };

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
    <div className="pt-6">
      {/* 컨텐츠 목록 */}
      {isExpanded && (
        <div className="columns-1 md:columns-2 gap-6 space-y-6">
          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : contents.length > 0 ? (
            contents.map((content) => (
              <div key={content.id} className="break-inside-avoid mb-6">
                <PostCard
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
              </div>
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