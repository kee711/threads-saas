'use client';

import { useEffect, useState } from 'react';
import { PostCard } from '@/components/PostCard';
import { ContentCategory, ContentItem, ContentListProps } from './types';
import useSelectedPostsStore from '@/stores/useSelectedPostsStore';
import { getContents, ContentSource } from '@/app/actions/content';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export function ContentList({ category, title }: ContentListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const addPost = useSelectedPostsStore(state => state.addPost);
  const selectedPosts = useSelectedPostsStore(state => state.selectedPosts);

  // 🔐 사용자 세션 확인
  const { data: session, status } = useSession();

  useEffect(() => {
    // 로그인 상태 확인
    if (status === 'loading') return; // 로딩 중에는 실행하지 않음
    if (status === 'unauthenticated') {
      setContents([]);
      return;
    }

    async function fetchContents() {
      setIsLoading(true);
      try {
        // 카테고리에 따라 데이터 조회 (서버에서 RLS 적용됨)
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
  }, [category, status]); // status를 의존성에 추가

  // 컨텐츠 목록 토글
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // 로그인하지 않은 경우 메시지 표시
  if (status === 'unauthenticated') {
    return (
      <div className="pt-6">
        <div className="text-center text-muted-foreground">
          🔒 컨텐츠를 보려면 로그인이 필요합니다.
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6">
      {/* 컨텐츠 목록 */}
      {isExpanded && (
        <div className="columns-1 md:columns-2 gap-6 space-y-6">
          {isLoading ? (
            <div key={category} className="text-center text-muted-foreground">
              Loading...
            </div>
          ) : contents.length > 0 ? (
            contents.map((content) => (
              <div key={content.my_contents_id} className="break-inside-avoid mb-6">
                <PostCard
                  variant="default"
                  username={session?.user?.name || "user"}
                  content={content.content}
                  url={content.url}
                  onAdd={() => addPost({
                    id: content.my_contents_id,
                    content: content.content,
                  })}
                  isSelected={selectedPosts.some(post => post.id === content.my_contents_id)}
                />
              </div>
            ))
          ) : (
            <div key={category} className="text-center text-muted-foreground">
              {category}에 대한 컨텐츠를 찾을 수 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
} 