'use client';

import { useEffect, useState } from 'react';
import { PostCard } from '@/components/PostCard';
import { ContentCategory, ContentItem, ContentListProps } from './types';
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
          🔒 You need to login to view contents.
        </div>
      </div>
    );
  }

  const { singlePosts, threadChains } = groupContents(contents);

  return (
    <div className="h-full w-full overflow-hidden flex flex-col">
      {/* 컨텐츠 목록 */}
      {isExpanded && (
        <div className="columns-2 gap-6 flex-1 overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] scroll-pb-96 min-h-0">
          {isLoading ? (
            <div key={category} className="text-center text-muted-foreground">
              Loading...
            </div>
          ) : contents.length > 0 ? (
            <>
              {/* 단일 포스트 렌더링 */}
              {singlePosts.map((content) => (
                <div
                  key={content.my_contents_id}
                  className="bg-white rounded-[20px] p-5 flex flex-col h-fit mb-6 break-inside-avoid cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    if (!isContentAddedToThreadChain(content.my_contents_id, content.content)) {
                      addContentAsThread(content.content);
                      // Map content ID to its content text for tracking
                      setAddedContentMap(prev => new Map([...prev, [content.my_contents_id, content.content]]));
                      toast.success('Content added to thread chain');
                    }
                  }}
                >
                  <PostCard
                    variant="default"
                    username={session?.user?.name || "user"}
                    content={content.content}
                    url={content.url}
                    hideAddButton={true}
                    showGrade={false}
                    isSelected={isContentAddedToThreadChain(content.my_contents_id, content.content)}
                  />
                </div>
              ))}

              {/* 스레드 체인 렌더링 */}
              {Object.entries(threadChains).map(([parentId, chainContents]) => (
                <div key={parentId} className="bg-white rounded-[20px] p-5 flex flex-col h-fit mb-6 break-inside-avoid">
                  <div className="space-y-4">
                    {/* Individual Thread Posts */}
                    {chainContents.map((content, index) => (
                      <div key={`${parentId}-${index}`} className="relative">
                        <div
                          className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                          onClick={() => {
                            // Add entire thread chain if not already added
                            const isAnyThreadAdded = chainContents.some(c =>
                              isContentAddedToThreadChain(c.my_contents_id, c.content)
                            );

                            if (!isAnyThreadAdded) {
                              chainContents.forEach(c => {
                                addContentAsThread(c.content);
                                setAddedContentMap(prev => new Map([...prev, [c.my_contents_id, c.content]]));
                              });
                              toast.success('Thread chain added to thread chain');
                            }
                          }}
                        >
                          <PostCard
                            variant="default"
                            username={session?.user?.name || "user"}
                            content={content.content}
                            url={content.url}
                            isPartOfChain={true}
                            threadIndex={index}
                            hideAddButton={true}
                            showGrade={false}
                            isSelected={chainContents.some(c => isContentAddedToThreadChain(c.my_contents_id, c.content))}
                          />
                        </div>
                        {/* Connecting line for threads */}
                        {index < chainContents.length - 1 && (
                          <div className="absolute left-1 top-8 w-0.5 h-6 bg-gray-300"></div>
                        )}
                      </div>
                    ))}
                  </div>
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