'use client';

import { useEffect, useState, useRef } from 'react';
import { getOembedContents, changeOembedContentToPost } from "@/app/actions/oembed";
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import useSelectedPostsStore from '@/stores/useSelectedPostsStore';

interface OembedContent {
  id: string;
  url: string;
  created_at: string;
  user_id: string;
  html: string;
}

export function OembedList() {
  const [contents, setContents] = useState<OembedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const { data: session, status } = useSession();
  const iframeRefs = useRef<{ [id: string]: HTMLIFrameElement | null }>({});
  const [iframeHeights, setIframeHeights] = useState<{ [id: string]: number }>({});
  const addPost = useSelectedPostsStore(state => state.addPost);
  const selectedPosts = useSelectedPostsStore(state => state.selectedPosts);
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
        const result = await getOembedContents();
        setContents(result);
      } catch (err) {
        console.error(err);
        setFetchError("불러오기 실패");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status]);

  const handleAddPost = async (content: OembedContent) => {
    try {
      setConvertingPosts(prev => ({ ...prev, [content.id]: true }));
      const postData = await changeOembedContentToPost(content.url);
      if (postData) {
        addPost({
          id: content.id,
          content: postData.content,
          url: content.url
        });
      }
    } catch (error) {
      console.error('Error converting oembed to post:', error);
    } finally {
      setConvertingPosts(prev => ({ ...prev, [content.id]: false }));
    }
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

  if (loading) return <div className="text-muted-foreground">Loading...</div>;
  if (fetchError) return <p className="text-red-500">{fetchError}</p>;
  if (contents.length === 0) return <p>저장된 콘텐츠가 없습니다.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
      {contents.map((content) => (
        <div key={content.id} className={`${selectedPosts.some(post => post.id === content.id) ? "bg-accent rounded-xl border-none" : "bg-card"}`}>
          <iframe
            key={content.id}
            ref={el => { iframeRefs.current[content.id] = el; }}
            className="max-w-full"
            srcDoc={getSrcDocWithAutoResize(content.html, content.id)}
            style={{
              width: "100%",
              border: "none",
              height: iframeHeights[content.id] ? `${iframeHeights[content.id] + 40}px` : "300px", // 기본값 300px
              transition: "height 0.2s",
            }}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
          />
          <div className="flex justify-end items-end mb-4">
            <Button
              variant="outline"
              size="default"
              className="gap-1 px-4"
              onClick={() => handleAddPost(content)}
              disabled={selectedPosts.some(post => post.id === content.id) || convertingPosts[content.id]}
            >
              {convertingPosts[content.id] ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>
                {convertingPosts[content.id]
                  ? "Loading..."
                  : selectedPosts.some(post => post.id === content.id)
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
