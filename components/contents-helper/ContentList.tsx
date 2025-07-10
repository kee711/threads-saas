'use client';

import { useEffect, useState } from 'react';
import { PostCard } from '@/components/PostCard';
import { ContentCategory, ContentItem, ContentListProps } from './types';
import useThreadChainStore from '@/stores/useThreadChainStore';
import { getContents } from '@/app/actions/content';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import useSocialAccountStore from '@/stores/useSocialAccountStore';
import { Button } from '../ui/button';
import Link from 'next/link';

export function ContentList({ category, title }: ContentListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addContentAsThread, removeContentFromThread, threadChain } = useThreadChainStore();
  const [addedContentMap, setAddedContentMap] = useState<Map<string, string>>(new Map());
  const { currentSocialId } = useSocialAccountStore();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

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

  // Clean up tracking map when threadChain changes and sync with selectedItems
  useEffect(() => {
    // Remove content IDs from tracking map if their content no longer exists in threadChain
    setAddedContentMap(prev => {
      const newMap = new Map();
      const removedContentIds = new Set<string>();

      prev.forEach((contentText, contentId) => {
        const stillExists = threadChain.some(thread =>
          thread.content.trim() === contentText.trim()
        );
        if (stillExists) {
          newMap.set(contentId, contentText);
        } else {
          removedContentIds.add(contentId);
        }
      });

      // Update selectedItems to remove items that are no longer in threadChain
      if (removedContentIds.size > 0) {
        setSelectedItems(prevSelected => {
          const newSelected = new Set(prevSelected);
          removedContentIds.forEach(id => {
            newSelected.delete(id);
            // Also check for thread chain parent IDs
            const threadChainEntry = Object.entries(groupContents(contents).threadChains)
              .find(([, chainContents]) =>
                chainContents.some(c => c.my_contents_id === id)
              );
            if (threadChainEntry) {
              newSelected.delete(threadChainEntry[0]);
            }
          });
          return newSelected;
        });
      }

      return newMap;
    });
  }, [threadChain, contents]);

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


  if (isLoading) {
    return (
      <div className="h-full w-full flex-1 flex flex-col gap-3 items-center justify-center rounded-[20px] min-h-0">
        <div className="w-10 h-10 text-muted-foreground/30 animate-spin">
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-muted-foreground">Loading contents...</div>
      </div>
    );
  }
  if (!isLoading && contents.length === 0) {
    return (
      <div className="h-full w-full flex-1 flex flex-col gap-3 items-center justify-center rounded-[20px] min-h-0">
        <div className="text-muted-foreground">No contents found for {category}.</div>
        <Link href="/contents/topic-finder" className="flex justify-center">
          <Button variant="outline" className="w-full bg-accent rounded-xl">
            Add content
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="h-full w-full overflow-hidden flex flex-col">
      {/* 컨텐츠 목록 */}
      {isExpanded && (
        <div className="columns-2 gap-6 flex-1 overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] scroll-pb-96 min-h-0">
          {contents.length > 0 && (
            <>
              {/* 단일 포스트 렌더링 */}
              {singlePosts.map((content) => (
                <div
                  key={content.my_contents_id}
                  className={`rounded-[20px] p-5 flex flex-col h-fit mb-6 break-inside-avoid cursor-pointer transition-colors ${selectedItems.has(content.my_contents_id) ? "bg-accent border-muted-foreground" : "bg-white"}`}
                  onClick={() => {
                    const isCurrentlySelected = selectedItems.has(content.my_contents_id);
                    const isAlreadyAdded = isContentAddedToThreadChain(content.my_contents_id, content.content);

                    if (isCurrentlySelected) {
                      // 선택 해제 및 thread chain에서 제거
                      setSelectedItems(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(content.my_contents_id);
                        return newSet;
                      });

                      if (isAlreadyAdded) {
                        // thread chain에서 해당 콘텐츠 제거
                        removeContentFromThread(content.content);
                        setAddedContentMap(prev => {
                          const newMap = new Map(prev);
                          newMap.delete(content.my_contents_id);
                          return newMap;
                        });
                        toast.success('Content removed from thread chain');
                      }
                    } else {
                      // 선택 및 thread chain에 추가
                      setSelectedItems(prev => new Set([...prev, content.my_contents_id]));

                      if (!isAlreadyAdded) {
                        addContentAsThread(content.content);
                        setAddedContentMap(prev => new Map([...prev, [content.my_contents_id, content.content]]));
                        toast.success('Content added to thread chain');
                      }
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
                <div key={parentId} className={`rounded-[20px] p-5 flex flex-col h-fit mb-6 break-inside-avoid cursor-pointer ${selectedItems.has(parentId) ? "bg-accent border-muted-foreground" : "bg-white"}`}>
                  <div>
                    {/* Individual Thread Posts */}
                    {chainContents.map((content, index) => (
                      <div key={`${parentId}-${index}`} className="relative">
                        <div
                          className={`transition-colors`}
                          onClick={() => {
                            const isCurrentlySelected = selectedItems.has(parentId);
                            const isAnyThreadAdded = chainContents.some(c =>
                              isContentAddedToThreadChain(c.my_contents_id, c.content)
                            );

                            if (isCurrentlySelected) {
                              // 선택 해제 및 thread chain에서 제거
                              setSelectedItems(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(parentId);
                                return newSet;
                              });

                              if (isAnyThreadAdded) {
                                // Remove all threads from thread chain
                                chainContents.forEach(c => {
                                  removeContentFromThread(c.content);
                                  setAddedContentMap(prev => {
                                    const newMap = new Map(prev);
                                    newMap.delete(c.my_contents_id);
                                    return newMap;
                                  });
                                });
                                toast.success('Thread chain removed from thread chain');
                              }
                            } else {
                              // 선택 및 thread chain에 추가
                              setSelectedItems(prev => new Set([...prev, parentId]));

                              if (!isAnyThreadAdded) {
                                chainContents.forEach(c => {
                                  addContentAsThread(c.content);
                                  setAddedContentMap(prev => new Map([...prev, [c.my_contents_id, c.content]]));
                                });
                                toast.success('Thread chain added to thread chain');
                              }
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
                            isLastInChain={index === chainContents.length - 1}
                            isSelected={chainContents.some(c => isContentAddedToThreadChain(c.my_contents_id, c.content))}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )
      }
    </div >
  );
} 