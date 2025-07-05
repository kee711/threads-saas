"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/PostCard";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import useSelectedPostsStore from "@/stores/useSelectedPostsStore";
import { Sparkles, TextSearch, Radio, PencilLine, ImageIcon, Video, ChevronRight, PanelRightClose, PanelLeftClose, ChevronDown, ChevronUp, X } from "lucide-react";
import { createContent } from "@/app/actions/content";
import { toast } from "sonner";
import { composeWithAI } from "@/app/actions/openai";
import { schedulePost } from "@/app/actions/schedule";
import { postThreadChain, scheduleThreadChain, ThreadContent } from "@/app/actions/threadChain";
import { ChangePublishTimeDialog } from "./schedule/ChangePublishTimeDialog";
import useSocialAccountStore from "@/stores/useSocialAccountStore";
import NextImage from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';

interface RightSidebarProps {
  className?: string;
}

export function RightSidebar({ className }: RightSidebarProps) {
  const [showAiInput, setShowAiInput] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mobileViewportHeight, setMobileViewportHeight] = useState<number>(0);
  const { selectedPosts, removePost, updatePostType, addPost } =
    useSelectedPostsStore();
  const { currentSocialId, getSelectedAccount } = useSocialAccountStore();
  const { isRightSidebarOpen, openRightSidebar, closeRightSidebar, isMobile } = useMobileSidebar();
  const pathname = usePathname();

  // Text content
  const [writingContent, setWritingContent] = useState("");
  const [hasUnsavedContent, setHasUnsavedContent] = useState(false);
  // Schedule data
  const [publishTimes, setPublishTimes] = useState<string[]>([]);
  const [reservedTimes, setReservedTimes] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState<string | null>(null);
  const [onPublishTimeChange, setOnPublishTimeChange] = useState(false);

  // 이미지 관련 상태
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [selectedMediaType, setSelectedMediaType] = useState<
    "TEXT" | "IMAGE" | "VIDEO" | "CAROUSEL"
  >("TEXT");

  // Thread chain 상태
  const [threadChain, setThreadChain] = useState<ThreadContent[]>([
    { content: '', media_urls: [], media_type: 'TEXT' }
  ]);
  const [isThreadChainMode, setIsThreadChainMode] = useState(false);

  // 모바일에서는 isRightSidebarOpen 상태 사용, 데스크톱에서는 기존 isCollapsed 사용
  const isVisible = isMobile ? isRightSidebarOpen : !isCollapsed;
  const toggleSidebar = isMobile ?
    (isRightSidebarOpen ? closeRightSidebar : openRightSidebar) :
    () => setIsCollapsed(prev => !prev);

  // selectedPosts가 추가될때만 사이드바 펼치기
  useEffect(() => {
    if (isMobile) {
      if (selectedPosts.length > 0 && !isRightSidebarOpen) {
        toggleSidebar();
      }
    } else if (selectedPosts.length > 0 && isCollapsed) {
      toggleSidebar();
    }
  }, [selectedPosts.length]);

  // 모바일에서 오버레이 클릭 시 사이드바 닫기
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && isMobile) {
      toggleSidebar();
    }
  };

  // localStorage에서 임시 저장된 내용 불러오기
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedContent = localStorage.getItem("draftContent");
      console.log("localStorage에서 불러온 내용:", savedContent);
      console.log("현재 selectedPosts:", selectedPosts);
      if (savedContent && selectedPosts.length === 0) {
        console.log("writingContent 설정:", savedContent);
        setHasUnsavedContent(true);
        setWritingContent(savedContent);
      }
    } catch (error) {
      console.warn('localStorage access failed:', error);
    }
  }, []);

  // selectedPosts가 변경될 때마다 writingContent 업데이트
  useEffect(() => {
    console.log("selectedPosts 변경됨:", selectedPosts);
    console.log("현재 writingContent:", writingContent);
    console.log("현재 hasUnsavedContent:", hasUnsavedContent);

    // selectedPosts가 1개일 때만 writingContent를 업데이트
    if (selectedPosts.length === 1) {
      setWritingContent(selectedPosts[0].content);
      setHasUnsavedContent(false);
      localStorage.removeItem("draftContent");
    }
    // selectedPosts가 0개이고 hasUnsavedContent가 false일 때만 초기화
    // 단, 페이지 로드 직후가 아닐 때만 (localStorage에서 불러온 직후가 아닐 때만)
    else if (
      selectedPosts.length === 0 &&
      !hasUnsavedContent &&
      writingContent === ""
    ) {
      setWritingContent("");
      localStorage.removeItem("draftContent");
    }
  }, [selectedPosts]);

  // writingContent가 변경될 때마다 hasUnsavedContent 업데이트와 localStorage 저장
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log("writingContent 변경됨:", writingContent);
    console.log("selectedPosts.length:", selectedPosts.length);
    if (writingContent && selectedPosts.length === 0) {
      console.log("localStorage에 저장:", writingContent);
      try {
        setHasUnsavedContent(true);
        localStorage.setItem("draftContent", writingContent);
      } catch (error) {
        console.warn('localStorage save failed:', error);
      }
    } else if (!writingContent) {
      console.log("localStorage 삭제");
      try {
        localStorage.removeItem("draftContent");
        setHasUnsavedContent(false);
      } catch (error) {
        console.warn('localStorage remove failed:', error);
      }
    }
  }, [writingContent, selectedPosts.length]);

  // 다른 포스트가 추가될 때 작성 중인 글도 함께 추가
  useEffect(() => {
    if (
      hasUnsavedContent &&
      selectedPosts.length === 1 &&
      !selectedPosts.some((post) => post.content === writingContent)
    ) {
      const tempId = `temp-${Date.now()}`;
      addPost({
        id: tempId,
        content: writingContent,
      });
      setHasUnsavedContent(false);
      localStorage.removeItem("draftContent");
    }
  }, [selectedPosts.length, hasUnsavedContent]);

  // writingContent가 비어있을 때 해당 post를 제거
  useEffect(() => {
    if (selectedPosts.length === 1 && writingContent === "") {
      removePost(selectedPosts[0].id);
      setHasUnsavedContent(false);
      localStorage.removeItem("draftContent");
    }
  }, [writingContent]);

  // 컴포넌트 mount 될 때만 자동으로 처음 한번 실행
  useEffect(() => {
    fetchPublishTimes();
    fetchScheduledTimes();
    setOnPublishTimeChange(false);
  }, []);

  // publishTimes와 reservedTimes가 모두 있을 때 예약 가능한 시간 찾기
  useEffect(() => {
    // publishTimes와 reservedTimes가 null 또는 undefined일 수 있으므로 확인
    if (publishTimes?.length > 0 && reservedTimes) {
      const nextAvailableTime = findAvailablePublishTime(
        publishTimes,
        reservedTimes
      );
      console.log("nextAvailableTime:", nextAvailableTime);
      setScheduleTime(nextAvailableTime);
    } else {
      setScheduleTime(null); // 데이터가 없으면 null로 설정
    }
  }, [publishTimes, reservedTimes]);

  // 이미지가 추가되거나 제거될 때 미디어 타입 업데이트
  useEffect(() => {
    if (selectedMedia.length > 0) {
      if (selectedMedia.length > 1) {
        setSelectedMediaType("CAROUSEL");
      } else {
        setSelectedMediaType("IMAGE");
      }
    } else {
      setSelectedMediaType("TEXT");
    }
  }, [selectedMedia]);

  // activePostId 업데이트 useEffect
  useEffect(() => {
    if (selectedPosts.length > 0) {
      // 새로운 포스트가 추가되면 마지막 포스트를 active로 설정
      setActivePostId(selectedPosts[selectedPosts.length - 1].id);
    } else {
      setActivePostId(null);
    }
  }, [selectedPosts.length]);

  // 포스트 클릭 핸들러
  const handlePostClick = (postId: string) => {
    setActivePostId(postId);
  };

  // activePostId가 변경될 때 writingContent 업데이트
  useEffect(() => {
    if (activePostId) {
      const activePost = selectedPosts.find(post => post.id === activePostId);
      if (activePost) {
        setWritingContent(activePost.content);
      }
    }
  }, [activePostId, selectedPosts]);


  // writingContent가 변경될 때 active 포스트 업데이트
  useEffect(() => {
    if (activePostId && writingContent) {
      const updatedPosts = selectedPosts.map(post =>
        post.id === activePostId ? { ...post, content: writingContent } : post
      );
      // TODO: 포스트 업데이트 로직 구현
    }
  }, [writingContent, activePostId]);

  // 모바일에서 실제 viewport 높이 계산
  useEffect(() => {
    if (!isMobile) return;

    const updateViewportHeight = () => {
      // Visual Viewport API 사용 (지원되는 경우)
      if (window.visualViewport) {
        setMobileViewportHeight(window.visualViewport.height);
      } else {
        // fallback: window.innerHeight 사용
        setMobileViewportHeight(window.innerHeight);
      }
    };

    // 초기 설정
    updateViewportHeight();

    // viewport 변화 감지
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    } else {
      window.addEventListener('resize', updateViewportHeight);
      window.addEventListener('orientationchange', updateViewportHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      } else {
        window.removeEventListener('resize', updateViewportHeight);
        window.removeEventListener('orientationchange', updateViewportHeight);
      }
    };
  }, [isMobile]);

  // 이미지 변경 핸들러
  const handleMediaChange = (media: string[]) => {
    console.log("미디어 변경됨:", media);
    setSelectedMedia(media);

    // 미디어 타입 자동 감지
    if (media.length === 0) {
      setSelectedMediaType("TEXT");
    } else if (media.length === 1) {
      // 단일 파일의 경우 확장자로 타입 판단
      const imageUrl = media[0];
      const extension = imageUrl.split('.').pop()?.toLowerCase();

      if (extension && ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension)) {
        setSelectedMediaType("VIDEO");
      } else {
        setSelectedMediaType("IMAGE");
      }
    } else {
      // 복수 파일의 경우 캐러셀로 처리
      setSelectedMediaType("CAROUSEL");
    }
  };

  function findAvailablePublishTime(
    publishTimes: string[],
    reservedTimes: string[]
  ): string | null {
    const now = new Date();
    const reservedSet = new Set(reservedTimes || []);
    console.log("reservedSet:", reservedSet);
    console.log("publishTimes:", publishTimes);

    // 현재 시간 이후의 가장 가까운 예약 가능 시간 찾기
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      // 최대 30일 후까지 검색
      // 각 publishTime에 대해 오늘+dayOffset 날짜에 해당하는 시간 생성
      const datesToCheck = publishTimes
        .map((time) => {
          // HH:MM 형식인지 확인
          if (time.includes("T")) {
            console.log("publishTime에 날짜 정보가 포함되어 있습니다:", time);
            return null; // 잘못된 형식은 건너뜀
          }

          // 시간 문자열 분석 (시간은 DB에 UTC로 저장되어 있음)
          if (!time || typeof time !== 'string') {
            console.error("Invalid time format:", time);
            return null;
          }

          const timeParts = time.split(":");
          if (timeParts.length !== 2) {
            console.error("Invalid time format:", time);
            return null;
          }

          const [utcHours, utcMinutes] = timeParts.map(Number);

          // 현재 날짜 + dayOffset에 해당하는 날짜 생성
          const date = new Date();
          date.setDate(date.getDate() + dayOffset);

          // UTC 시간 설정 (DB에 저장된 시간은 UTC)
          date.setUTCHours(utcHours, utcMinutes, 0, 0);

          return date;
        })
        .filter((date) => date !== null && date > now) // 현재 시간 이후만 필터링
        .sort((a, b) => a!.getTime() - b!.getTime()); // 시간순 정렬

      console.log("availableDates:", datesToCheck);
      const reservedTimestamps = new Set(
        reservedTimes.map((time) => new Date(time).getTime())
      );

      // 각 날짜에 대해 이미 예약된 시간인지 확인
      for (const date of datesToCheck) {
        if (!date) continue;

        const timestamp = date.getTime();
        if (!reservedTimestamps.has(timestamp)) {
          console.log(
            "사용 가능한 시간 찾음:",
            date.toISOString(),
            "로컬 시간:",
            date.toLocaleString()
          );
          return date.toISOString();
        }
      }
    }

    return null; // 가능한 시간 없음
  }

  // canComposeWithAI 로직 수정 (type 제거)
  const canComposeWithAI = selectedPosts.length >= 2;

  const handleComposeWithAI = async () => {
    if (!canComposeWithAI) return;

    try {
      setIsComposing(true);
      const { content, error } = await composeWithAI(selectedPosts[0], selectedPosts[1]);

      if (error) throw new Error(error);

      // 선택된 포스트 초기화
      selectedPosts.forEach((post) => removePost(post.id));

      // 생성된 콘텐츠를 writing PostCard에 저장
      setWritingContent(content);
      setHasUnsavedContent(true);

      toast.success("AI가 새로운 글을 생성했습니다.");
    } catch (error) {
      console.error("Error composing content:", error);
      toast.error(
        error instanceof Error ? error.message : "AI 글 생성에 실패했습니다."
      );
    } finally {
      setIsComposing(false);
    }
  };

  // Scheule
  // user_profiles 테이블에서 publish_times를 배열로 가져와 publishTimes에 저장
  // 사용자가 설정한 선호 예약시간 가져오기
  const fetchPublishTimes = async () => {
    const response = await fetch("/api/user/get-publish-times");
    const data = await response.json();
    console.log("publishTimes 함수 내 실행:", data);
    if (data === null) {
      setPublishTimes([]);
    } else {
      setPublishTimes(data);
    }
  };

  // publish_status가 scheduled인 포스트들의 시간을 전부 배열로 가져와 reservedTimes에 저장
  // 현재 예약되어있는 시간들 가져오기
  const fetchScheduledTimes = async () => {
    const response = await fetch("/api/contents/scheduled");
    const data = await response.json();
    console.log("fetchScheduledTimes 함수 내 실행:", data);
    if (data === null) {
      setReservedTimes([]);
    } else {
      const reservedTimes = data.map(
        (item: { scheduled_at: string }) => item.scheduled_at
      );
      setReservedTimes(reservedTimes);
    }
  };

  // Save Draft
  const handleSaveToDraft = async () => {
    try {
      const { error } = await createContent({
        content: writingContent,
        publish_status: "draft",
      });

      if (error) throw error;

      // DB 저장 성공 시 localStorage 초기화
      localStorage.removeItem("draftContent");
      setHasUnsavedContent(false);
      toast.success("임시저장 되었습니다.");
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("임시저장에 실패했습니다.");
    }
  };

  // Thread chain functions
  const addNewThread = () => {
    setThreadChain(prev => [...prev, { content: '', media_urls: [], media_type: 'TEXT' }]);
    setIsThreadChainMode(true);
  };

  const removeThread = (index: number) => {
    if (threadChain.length <= 1) return;
    
    setThreadChain(prev => prev.filter((_, i) => i !== index));
    
    // If we remove all threads except one, exit thread chain mode
    if (threadChain.length <= 2) {
      setIsThreadChainMode(false);
    }
  };

  const updateThreadContent = (index: number, content: string) => {
    setThreadChain(prev => prev.map((thread, i) => 
      i === index ? { ...thread, content } : thread
    ));
  };

  const updateThreadMedia = (index: number, media_urls: string[]) => {
    setThreadChain(prev => prev.map((thread, i) => 
      i === index ? { 
        ...thread, 
        media_urls,
        media_type: media_urls.length > 1 ? 'CAROUSEL' : media_urls.length === 1 ? 'IMAGE' : 'TEXT'
      } : thread
    ));
  };

  // Check if social account is connected
  const checkSocialAccountConnection = () => {
    const selectedAccount = getSelectedAccount();
    if (!selectedAccount || !currentSocialId) {
      toast.error("계정 추가가 필요해요", {
        description: "먼저 Threads 계정을 연결해주세요.",
        action: {
          label: "계정 연결",
          onClick: () => window.location.href = "/api/threads/oauth"
        }
      });
      return false;
    }
    return true;
  };

  // Post 예약발행
  const handleSchedule = async () => {
    // Check social account connection
    if (!checkSocialAccountConnection()) return;

    try {
      if (isThreadChainMode && threadChain.length > 1) {
        // Handle thread chain scheduling
        const validThreads = threadChain.filter(thread => thread.content.trim() !== '');
        if (validThreads.length === 0 || !scheduleTime) return;

        toast.success("Your thread chain is scheduled");
        
        const result = await scheduleThreadChain(validThreads, scheduleTime);
        
        if (!result.success) throw new Error(result.error);

        // Reset thread chain state
        setThreadChain([{ content: '', media_urls: [], media_type: 'TEXT' }]);
        setIsThreadChainMode(false);
      } else {
        // Handle single post scheduling
        if (!writingContent || !scheduleTime) return;

        toast.success("Your post is scheduled");
        
        const result = await schedulePost(
          writingContent,
          scheduleTime,
          selectedMediaType,
          selectedMedia
        );

        if (result?.error) throw result.error;

        // Reset single post state
        setWritingContent("");
        setSelectedMedia([]);
      }

      setHasUnsavedContent(false);
      localStorage.removeItem("draftContent");
      fetchScheduledTimes(); // 예약되어있는 시간 갱신
    } catch (error) {
      console.error("Error scheduling:", error);
      toast.error("Schedule failed");
    }
  };

  // Post 즉시 발행
  const handlePublish = async () => {
    // Check social account connection
    if (!checkSocialAccountConnection()) return;

    try {
      if (isThreadChainMode && threadChain.length > 1) {
        // Handle thread chain publishing
        const validThreads = threadChain.filter(thread => thread.content.trim() !== '');
        if (validThreads.length === 0) return;

        toast.success("Your thread chain is being published");

        // Save thread chain state before clearing
        const threadsToPublish = [...validThreads];

        // Reset UI immediately
        setThreadChain([{ content: '', media_urls: [], media_type: 'TEXT' }]);
        setIsThreadChainMode(false);
        setHasUnsavedContent(false);
        localStorage.removeItem("draftContent");

        // Publish thread chain
        const result = await postThreadChain(threadsToPublish);

        if (!result.success) {
          console.error("❌ Thread chain publish error:", result.error);
        } else {
          console.log("✅ Thread chain published:", result.threadIds);
        }
      } else {
        // Handle single post publishing
        if (!writingContent) return;

        toast.success("Your post is published");

        // Save single post state before clearing
        const contentToPublish = writingContent;
        const mediaToPublish = [...selectedMedia];
        const mediaTypeToPublish = selectedMediaType;

        // Reset UI immediately
        setWritingContent("");
        setSelectedMedia([]);
        setHasUnsavedContent(false);
        localStorage.removeItem("draftContent");

        // Publish single post (using schedulePost with current time)
        const currentTime = new Date().toISOString();
        const result = await schedulePost(
          contentToPublish,
          currentTime,
          mediaTypeToPublish === "CAROUSEL" ? "IMAGE" : mediaTypeToPublish,
          mediaToPublish
        );

        if (result.error) {
          console.error("❌ Single post publish error:", result.error);
        } else {
          console.log("✅ Single post published:", result.data);
        }
      }

    } catch (error) {
      console.error("❌ handlePublish error:", error);
    }
  };

  return (
    <>
      {/* 데스크톱 RightSidebar */}
      <div className={cn(
        "bg-muted h-[calc(100vh-48px)] mt-6 rounded-l-xl transition-all duration-300 ease-in-out overflow-hidden hidden md:block",
        !isCollapsed ? "w-[380px]" : "w-[50px]",
        className
      )}>
        {isCollapsed ? (
          /* Collapsed state - show only toggle button */
          <div className="flex flex-col h-full p-2 cursor-pointer" onClick={() => setIsCollapsed(false)}>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
            >
              <PanelLeftClose className="h-6 w-6 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <RightSidebarContent
            selectedPosts={selectedPosts}
            writingContent={writingContent}
            setWritingContent={setWritingContent}
            showAiInput={showAiInput}
            setShowAiInput={setShowAiInput}
            activePostId={activePostId}
            selectedMedia={selectedMedia}
            handleMediaChange={handleMediaChange}
            handlePostClick={handlePostClick}
            removePost={removePost}
            pathname={pathname}
            scheduleTime={scheduleTime}
            handleSaveToDraft={handleSaveToDraft}
            handleSchedule={handleSchedule}
            handlePublish={handlePublish}
            handleComposeWithAI={handleComposeWithAI}
            canComposeWithAI={canComposeWithAI}
            isComposing={isComposing}
            fetchPublishTimes={fetchPublishTimes}
            toggleSidebar={() => setIsCollapsed(true)}
            isMobile={false}
            getSelectedAccount={getSelectedAccount}
            mobileViewportHeight={mobileViewportHeight}
            // Thread chain props
            threadChain={threadChain}
            isThreadChainMode={isThreadChainMode}
            addNewThread={addNewThread}
            removeThread={removeThread}
            updateThreadContent={updateThreadContent}
            updateThreadMedia={updateThreadMedia}
          />
        )}
      </div>

      {/* 모바일 바텀시트 */}
      {isMobile && (
        <>
          {/* 오버레이 */}
          {isRightSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={handleOverlayClick}
            />
          )}

          {/* 바텀시트 */}
          <div
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 transform bg-background transition-transform duration-300 ease-in-out md:hidden",
              "rounded-t-xl border-t shadow-lg",
              isRightSidebarOpen ? "translate-y-0" : "translate-y-full"
            )}
            style={{
              maxHeight: mobileViewportHeight > 0
                ? `${Math.min(mobileViewportHeight * 0.85, mobileViewportHeight - 60)}px`
                : '85dvh'
            }}
          >
            <RightSidebarContent
              selectedPosts={selectedPosts}
              writingContent={writingContent}
              setWritingContent={setWritingContent}
              showAiInput={showAiInput}
              setShowAiInput={setShowAiInput}
              activePostId={activePostId}
              selectedMedia={selectedMedia}
              handleMediaChange={handleMediaChange}
              handlePostClick={handlePostClick}
              removePost={removePost}
              pathname={pathname}
              scheduleTime={scheduleTime}
              handleSaveToDraft={handleSaveToDraft}
              handleSchedule={handleSchedule}
              handlePublish={handlePublish}
              handleComposeWithAI={handleComposeWithAI}
              canComposeWithAI={canComposeWithAI}
              isComposing={isComposing}
              fetchPublishTimes={fetchPublishTimes}
              toggleSidebar={closeRightSidebar}
              isMobile={true}
              getSelectedAccount={getSelectedAccount}
              mobileViewportHeight={mobileViewportHeight}
              // Thread chain props
              threadChain={threadChain}
              isThreadChainMode={isThreadChainMode}
              addNewThread={addNewThread}
              removeThread={removeThread}
              updateThreadContent={updateThreadContent}
              updateThreadMedia={updateThreadMedia}
            />
          </div>

          {/* 모바일 토글 버튼 (우측 하단) */}
          {!isRightSidebarOpen && (
            <Button
              variant="default"
              size="icon"
              onClick={openRightSidebar}
              className="fixed bottom-4 right-4 z-30 h-14 w-14 rounded-full shadow-lg"
            >
              <NextImage
                src="/avatars/01.png"
                alt="Profile"
                width={40}
                height={40}
                className="rounded-full"
              />
            </Button>
          )}
        </>
      )}
    </>
  );
}

// RightSidebar 콘텐츠 분리 컴포넌트
function RightSidebarContent({
  selectedPosts,
  writingContent,
  setWritingContent,
  showAiInput,
  setShowAiInput,
  activePostId,
  selectedMedia,
  handleMediaChange,
  handlePostClick,
  removePost,
  pathname,
  scheduleTime,
  handleSaveToDraft,
  handleSchedule,
  handlePublish,
  handleComposeWithAI,
  canComposeWithAI,
  isComposing,
  fetchPublishTimes,
  toggleSidebar,
  isMobile,
  getSelectedAccount,
  mobileViewportHeight,
  // Thread chain props
  threadChain,
  isThreadChainMode,
  addNewThread,
  removeThread,
  updateThreadContent,
  updateThreadMedia,
}: {
  selectedPosts: any[];
  writingContent: string;
  setWritingContent: (content: string) => void;
  showAiInput: boolean;
  setShowAiInput: (show: boolean) => void;
  activePostId: string | null;
  selectedMedia: string[];
  handleMediaChange: (media: string[]) => void;
  handlePostClick: (postId: string) => void;
  removePost: (postId: string) => void;
  pathname: string;
  scheduleTime: string | null;
  handleSaveToDraft: () => void;
  handleSchedule: () => void;
  handlePublish: () => void;
  handleComposeWithAI: () => void;
  canComposeWithAI: boolean;
  isComposing: boolean;
  fetchPublishTimes: () => void;
  toggleSidebar: () => void;
  isMobile: boolean;
  getSelectedAccount: () => any;
  mobileViewportHeight: number;
  // Thread chain props
  threadChain: ThreadContent[];
  isThreadChainMode: boolean;
  addNewThread: () => void;
  removeThread: (index: number) => void;
  updateThreadContent: (index: number, content: string) => void;
  updateThreadMedia: (index: number, media_urls: string[]) => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 키보드가 나타났을 때 텍스트 영역을 적절한 위치로 스크롤
  const handleTextareaFocus = useCallback(() => {
    if (!isMobile || !scrollContainerRef.current) return;

    setTimeout(() => {
      if (!scrollContainerRef.current) return;

      // Visual Viewport API를 사용하여 실제 키보드 높이 감지
      let keyboardHeight = 320; // 기본값
      if (window.visualViewport) {
        keyboardHeight = window.innerHeight - window.visualViewport.height;
      }

      const containerHeight = scrollContainerRef.current.clientHeight;
      const textarea = scrollContainerRef.current.querySelector('textarea');

      if (textarea) {
        const textareaRect = textarea.getBoundingClientRect();
        const containerRect = scrollContainerRef.current.getBoundingClientRect();

        // 텍스트 영역의 상대적 위치 계산
        const relativeTop = textareaRect.top - containerRect.top;
        const textareaHeight = textareaRect.height;

        // 키보드 위쪽에 텍스트 영역이 보이도록 스크롤 위치 계산
        const visibleHeight = containerHeight - Math.max(keyboardHeight - 100, 0); // 바텀시트 하단 여백 고려
        const targetScrollTop = relativeTop - (visibleHeight - textareaHeight - 50);

        if (targetScrollTop > 0) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollTop + targetScrollTop,
            behavior: 'smooth'
          });
        }
      }
    }, 300); // 키보드 애니메이션 완료 대기
  }, [isMobile]);

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-l-xl border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-background">
        {selectedPosts.length === 0 && (
          <h2 className="text-sm font-medium text-muted-foreground">
            Write or Add contents
          </h2>
        )}
        {selectedPosts.length > 0 && (
          <h2 className="text-sm font-medium text-muted-foreground">
            Selected Posts ({selectedPosts.length}/3)
          </h2>
        )}

        {/* 모바일에서는 아래로 내리기 버튼, 데스크톱에서는 닫기 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 shrink-0 ml-auto"
        >
          {isMobile ? (
            <ChevronDown className="h-6 w-6 text-muted-foreground" />
          ) : (
            <PanelRightClose className="h-6 w-6 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Scrollable Content */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex-1 overflow-y-auto p-4 bg-background"
        )}
        style={{
          maxHeight: isMobile && mobileViewportHeight > 0
            ? `${mobileViewportHeight * 0.65}px`
            : isMobile
              ? '65dvh'
              : undefined
        }}
      >
        {/* Selected Posts Section */}
        <div className="space-y-4">
          {/* Thread Chain or Single Post */}
          {selectedPosts.length === 0 ? (
            <>
              {/* Render thread chain if in thread chain mode */}
              {isThreadChainMode ? (
                <div className="space-y-3">
                  {threadChain.map((thread, index) => (
                    <PostCard
                      key={`thread-${index}`}
                      variant="writing"
                      avatar={getSelectedAccount()?.threads_profile_picture_url}
                      username={getSelectedAccount()?.username}
                      content={thread.content}
                      onContentChange={(content) => updateThreadContent(index, content)}
                      media={thread.media_urls || []}
                      onMediaChange={(media) => updateThreadMedia(index, media)}
                      onTextareaFocus={handleTextareaFocus}
                      // Thread chain specific props
                      isPartOfChain={true}
                      threadIndex={index}
                      showAddThread={index === threadChain.length - 1}
                      onAddThread={addNewThread}
                      onRemoveThread={index > 0 ? () => removeThread(index) : undefined}
                      isLastInChain={index === threadChain.length - 1}
                    />
                  ))}
                </div>
              ) : (
                /* Single writing PostCard */
                <PostCard
                  variant="writing"
                  avatar={getSelectedAccount()?.threads_profile_picture_url}
                  username={getSelectedAccount()?.username}
                  content={writingContent}
                  onAiClick={() => setShowAiInput(!showAiInput)}
                  onContentChange={setWritingContent}
                  media={selectedMedia}
                  onMediaChange={handleMediaChange}
                  onTextareaFocus={handleTextareaFocus}
                  // Thread chain props for initial post
                  showAddThread={true}
                  onAddThread={addNewThread}
                  isLastInChain={true}
                />
              )}
            </>
          ) : (
            /* Selected Posts from external content */
            selectedPosts.map((post, index) => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="cursor-pointer"
              >
                <PostCard
                  variant={post.id === activePostId ? "writing" : "compact"}
                  avatar={getSelectedAccount()?.threads_profile_picture_url}
                  username={getSelectedAccount()?.username}
                  content={post.id === activePostId ? writingContent : post.content}
                  url={post.url}
                  onMinus={() => removePost(post.id)}
                  onAiClick={() => setShowAiInput(!showAiInput)}
                  order={index}
                  onContentChange={post.id === activePostId ? setWritingContent : undefined}
                  media={post.id === activePostId ? selectedMedia : []}
                  onMediaChange={post.id === activePostId ? handleMediaChange : undefined}
                  onTextareaFocus={post.id === activePostId ? handleTextareaFocus : undefined}
                />
              </div>
            ))
          )}
          {/* Divider with Text */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-gray-400">Add contents from</span>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className={cn(
            "grid gap-2 grid-cols-2"
          )}>
            <Link
              href="/contents-cooker/topic-finder"
              onClick={() => toggleSidebar()}
              className={cn(
                "flex flex-col items-center p-4 rounded-xl transition-colors",
                pathname === "/contents-cooker/topic-finder"
                  ? "bg-gray-300 text-gray-900"
                  : "bg-gray-100 hover:bg-gray-200 text-muted-foreground"
              )}
            >
              <TextSearch className={cn(
                "w-6 h-6 mb-2",
                pathname === "/contents-cooker/topic-finder"
                  ? "text-gray-900"
                  : "text-muted-foreground"
              )} />
              <span className="text-xs">Topic Finder</span>
            </Link>
            <Link
              href="/contents-cooker/saved"
              onClick={() => toggleSidebar()}
              className={cn(
                "flex flex-col items-center p-4 rounded-xl transition-colors",
                pathname === "/contents-cooker/saved"
                  ? "bg-gray-300 text-gray-900"
                  : "bg-gray-100 hover:bg-gray-200 text-muted-foreground"
              )}
            >
              <PencilLine className={cn(
                "w-6 h-6 mb-2",
                pathname === "/contents-cooker/saved"
                  ? "text-gray-900"
                  : "text-muted-foreground"
              )} />
              <span className="text-xs">Saved</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Buttons - Default */}
      {selectedPosts.length < 2 && (
        <div className="p-4 space-y-2 border-t bg-background">
          <Button
            variant="outline"
            size="xl"
            className="w-full"
            onClick={() => {
              handleSaveToDraft();
              toggleSidebar();
            }}
            disabled={!writingContent}
          >
            Save to Draft
          </Button>

          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 relative">
              <Button
                variant="default"
                size="xl"
                className="w-full rounded-r-sm mr-8 border-r border-dotted border-r-white bg-black text-white hover:bg-black/90"
                onClick={handleSchedule}
                disabled={!writingContent}
              >
                <div className="flex-col">
                  <div>Schedule Post</div>
                  {scheduleTime && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(scheduleTime).toLocaleString(undefined, {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true, // 오전/오후 표시
                      })}
                    </div>
                  )}
                </div>
              </Button>
              <div className="absolute right-0 h-full">
                <ChangePublishTimeDialog
                  variant="icon"
                  onPublishTimeChange={() => fetchPublishTimes()}
                  ondisabled={!writingContent}
                />
              </div>
            </div>
            <Button
              variant="default"
              size="xl"
              className="bg-black text-white hover:bg-black/90"
              onClick={handlePublish}
              disabled={!writingContent}
            >
              Post Now
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Buttons - Compose */}
      {selectedPosts.length > 1 && (
        <div className="p-4 space-y-2 border-t bg-background">
          <Button
            variant="default"
            size="xl"
            onClick={handleComposeWithAI}
            disabled={!canComposeWithAI || isComposing}
            className="flex w-full items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>{isComposing ? "생성 중..." : "Compose with AI"}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
