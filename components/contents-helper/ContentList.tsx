'use client';

import { useEffect, useState } from 'react';
import { PostCard } from '@/components/PostCard';
import { ThreadChain } from '@/components/ThreadChain';
import { ContentCategory, ContentItem, ContentListProps } from './types';
import { ThreadContent } from '@/app/actions/threadChain';
import useThreadChainStore from '@/stores/useThreadChainStore';
import { getContents } from '@/app/actions/content';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import useSocialAccountStore from '@/stores/useSocialAccountStore';

export function ContentList({ category, title }: ContentListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addContentAsThread, threadChain } = useThreadChainStore();
  const [addedContentMap, setAddedContentMap] = useState<Map<string, string>>(new Map());
  const { currentSocialId } = useSocialAccountStore();

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
        const params: { category: ContentCategory, currentSocialId: string } = {
          category,
          currentSocialId: currentSocialId
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
  }, [category, status, currentSocialId]); // status를 의존성에 추가

  // 컨텐츠 목록 토글
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // 콘텐츠를 단일 포스트와 스레드 체인으로 그룹화
  const groupContents = (contents: ContentItem[]) => {
    const singlePosts: ContentItem[] = [];
    const threadChains: { [key: string]: ContentItem[] } = {};

    contents.forEach(content => {
      if (content.is_thread_chain && content.parent_media_id) {
        if (!threadChains[content.parent_media_id]) {
          threadChains[content.parent_media_id] = [];
        }
        threadChains[content.parent_media_id].push(content);
      } else {
        singlePosts.push(content);
      }
    });

    // 스레드 체인 정렬 (thread_sequence 기준)
    Object.keys(threadChains).forEach(parentId => {
      threadChains[parentId].sort((a, b) => (a.thread_sequence || 0) - (b.thread_sequence || 0));
    });

    return { singlePosts, threadChains };
  };

  // ContentItem을 ThreadContent로 변환
  const convertToThreadContent = (content: ContentItem): ThreadContent => ({
    content: content.content,
    media_urls: [], // TODO: media_urls 필드가 있다면 추가
    media_type: 'TEXT' // TODO: media_type 필드가 있다면 추가
  });

  // Check if content is actually added to thread chain
  const isContentAddedToThreadChain = (contentId: string, contentText: string): boolean => {
    // Check if this content was previously added
    if (!addedContentMap.has(contentId)) {
      return false;
    }
    
    // Check if the content still exists in threadChain
    const contentExists = threadChain.some(thread => 
      thread.content.trim() === contentText.trim()
    );
    
    // If content doesn't exist in threadChain anymore, remove it from our tracking map
    if (!contentExists) {
      setAddedContentMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(contentId);
        return newMap;
      });
      return false;
    }
    
    return true;
  };

  // Clean up tracking map when threadChain changes
  useEffect(() => {
    // Remove content IDs from tracking map if their content no longer exists in threadChain
    setAddedContentMap(prev => {
      const newMap = new Map();
      prev.forEach((contentText, contentId) => {
        const stillExists = threadChain.some(thread => 
          thread.content.trim() === contentText.trim()
        );
        if (stillExists) {
          newMap.set(contentId, contentText);
        }
      });
      return newMap;
    });
  }, [threadChain]);

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

  const { singlePosts, threadChains } = groupContents(contents);

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
            <>
              {/* 단일 포스트 렌더링 */}
              {singlePosts.map((content) => (
                <div key={content.my_contents_id} className="break-inside-avoid mb-6">
                  <PostCard
                    variant="default"
                    username={session?.user?.name || "user"}
                    content={content.content}
                    url={content.url}
                    onAdd={() => {
                      addContentAsThread(content.content);
                      // Map content ID to its content text for tracking
                      setAddedContentMap(prev => new Map([...prev, [content.my_contents_id, content.content]]));
                      toast.success('Content added to thread chain');
                    }}
                    isSelected={isContentAddedToThreadChain(content.my_contents_id, content.content)}
                  />
                </div>
              ))}
              
              {/* 스레드 체인 렌더링 */}
              {Object.entries(threadChains).map(([parentId, chainContents]) => (
                <div key={parentId} className="break-inside-avoid mb-6">
                  <ThreadChain
                    threads={chainContents.map(convertToThreadContent)}
                    variant="default"
                    username={session?.user?.name || "user"}
                    className="border rounded-lg p-4"
                  />
                </div>
              ))}
            </>
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