'use client';

import { useEffect, useState, useRef } from 'react';
import { getOembedContents, changeOembedContentToPost } from "@/app/actions/oembed";
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import useThreadChainStore from '@/stores/useThreadChainStore';
import useSocialAccountStore from '@/stores/useSocialAccountStore';
import { toast } from 'sonner';

interface OembedContent {
  id: string;
  url: string;
  created_at: string;
  user_id: string;
  social_id: string;
  html: string;
}

export function OembedList() {
  const [contents, setContents] = useState<OembedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const { status } = useSession();
  const iframeRefs = useRef<{ [id: string]: HTMLIFrameElement | null }>({});
  const [iframeHeights, setIframeHeights] = useState<{ [id: string]: number }>({});
  const { addContentAsThread, threadChain } = useThreadChainStore();
  const { currentSocialId } = useSocialAccountStore();
  const [addedContentMap, setAddedContentMap] = useState<Map<string, string>>(new Map());
  const [convertingPosts, setConvertingPosts] = useState<{ [key: string]: boolean }>({});

  function getSrcDocWithAutoResize(html: string, id: string) {
    // id로 구분(여러 개 있을 때)
    return `
      ${html}
      <script>
        function sendHeight() {
          const height = document.body.scrollHeight;
          window.parent.postMessage(
            { type: 'THREADS_IFRAME_HEIGHT', id: '${id}', height },
            '*'
          );
        }
        window.addEventListener('load', sendHeight);
        setTimeout(sendHeight, 1000); // embed.js가 비동기로 렌더링할 수 있으니 1초 뒤에도 한 번 더
        // MutationObserver로 embed 렌더 후에도 감지
        new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true });
      </script>
    `;
  }

  useEffect(() => {
    // 로그인 상태 확인
    if (status === 'loading') return; // 로딩 중에는 실행하지 않음
    if (status === 'unauthenticated') {
      setContents([]);
      return;
    }

    async function fetchData() {
      try {
        if (!currentSocialId) {
          setFetchError("소셜 계정을 선택해주세요");
          return;
        }
        const result = await getOembedContents(currentSocialId);
        setContents(result);
      } catch (err) {
        console.error(err);
        setFetchError("불러오기 실패");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, currentSocialId]);

  const handleAddPost = async (content: OembedContent) => {
    try {
      setConvertingPosts(prev => ({ ...prev, [content.id]: true }));
      const postData = await changeOembedContentToPost(content.url);
      if (postData) {
        addContentAsThread(postData.content);
        // Map content ID to its converted content text for tracking
        setAddedContentMap(prev => new Map([...prev, [content.id, postData.content]]));
        toast.success('Content added to thread chain');
      }
    } catch (error) {
      console.error('Error converting oembed to post:', error);
      toast.error('Failed to add content');
    } finally {
      setConvertingPosts(prev => ({ ...prev, [content.id]: false }));
    }
  };

  // Check if content is actually added to thread chain
  const isContentAddedToThreadChain = (contentId: string): boolean => {
    // Check if this content was previously added
    if (!addedContentMap.has(contentId)) {
      return false;
    }
    
    const contentText = addedContentMap.get(contentId)!;
    
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

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (
        event.data &&
        event.data.type === "THREADS_IFRAME_HEIGHT" &&
        event.data.id &&
        typeof event.data.height === "number"
      ) {
        setIframeHeights((prev) => ({
          ...prev,
          [event.data.id]: event.data.height,
        }));
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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

  if (loading) return <div className="text-muted-foreground">Loading...</div>;
  if (fetchError) return <p className="text-red-500">{fetchError}</p>;
  if (contents.length === 0) return <p>저장된 콘텐츠가 없습니다.</p>;

  return (
    <div className="columns-2 gap-6 flex-1 overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] scroll-pb-96 min-h-0">
      {contents.map((content) => (
        <div 
          key={content.id} 
          className={`break-inside-avoid mb-6 ${
            isContentAddedToThreadChain(content.id) 
              ? "bg-white rounded-[20px] p-5 border-2 border-green-200" 
              : "bg-white rounded-[20px] p-5"
          }`}
        >
          <iframe
            key={content.id}
            ref={el => { iframeRefs.current[content.id] = el; }}
            className="max-w-full rounded-[12px] overflow-hidden"
            srcDoc={getSrcDocWithAutoResize(content.html, content.id)}
            style={{
              width: "100%",
              border: "none",
              height: iframeHeights[content.id] ? `${iframeHeights[content.id] + 40}px` : "300px",
              transition: "height 0.2s",
            }}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
          />
          <div className="flex justify-end items-end mt-4">
            <Button
              variant="outline"
              size="default"
              className="gap-1 px-4"
              onClick={() => handleAddPost(content)}
              disabled={isContentAddedToThreadChain(content.id) || convertingPosts[content.id]}
            >
              {convertingPosts[content.id] ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>
                {convertingPosts[content.id]
                  ? "Loading..."
                  : isContentAddedToThreadChain(content.id)
                    ? "Added"
                    : "Add"}
              </span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
