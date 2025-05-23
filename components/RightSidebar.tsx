"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/PostCard";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import useSelectedPostsStore from "@/stores/useSelectedPostsStore";
import { Sparkles, TextSearch, Radio, PencilLine, ImageIcon, Video } from "lucide-react";
import { createContent } from "@/app/actions/content";
import { toast } from "sonner";
import { composeWithAI, improvePost } from "@/app/actions/openai";
import { schedulePost, publishPost } from "@/app/actions/schedule";
import { ChangePublishTimeDialog } from "./schedule/ChangePublishTimeDialog";
import useSocialAccountStore from "@/stores/useSocialAccountStore";
import NextImage from 'next/image';
import Link from 'next/link'

interface RightSidebarProps {
  className?: string;
}

export function RightSidebar({ className }: RightSidebarProps) {
  const [showAiInput, setShowAiInput] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const { selectedPosts, removePost, updatePostType, addPost } =
    useSelectedPostsStore();
  const { selectedAccountId, getSelectedAccount } = useSocialAccountStore();
  // Text content
  const [writingContent, setWritingContent] = useState("");
  const [hasUnsavedContent, setHasUnsavedContent] = useState(false);
  // Schedule data
  const [publishTimes, setPublishTimes] = useState<string[]>([]);
  const [reservedTimes, setReservedTimes] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState<string | null>(null);
  const [onPublishTimeChange, setOnPublishTimeChange] = useState(false);

  // 이미지 관련 상태
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedMediaType, setSelectedMediaType] = useState<
    "TEXT" | "IMAGE" | "VIDEO" | "CAROUSEL"
  >("TEXT");
  const { currentSocialId, currentUsername } = useSocialAccountStore();

  // // selectedPosts가 2개가 되었을 때 첫 번째 포스트의 type을 'format', 두 번째 포스트의 type을 'content'로 설정
  // useEffect(() => {
  //   if (selectedPosts.length === 2) {
  //     // 첫 번째 포스트에 type이 없으면 'format'으로 설정
  //     if (!selectedPosts[0].type) {
  //       updatePostType(selectedPosts[0].id, "topic");
  //     }
  //     // 두 번째 포스트에 type이 없으면 'content'로 설정
  //     if (!selectedPosts[1].type) {
  //       updatePostType(selectedPosts[1].id, "ingredient");
  //     }
  //     // 두 포스트의 type이 같으면, 나중에 추가된 포스트를 다른 type으로 설정
  //     else if (selectedPosts[0].type === selectedPosts[1].type) {
  //       const newType =
  //         selectedPosts[0].type === "topic" ? "ingredient" : "topic";
  //       updatePostType(selectedPosts[1].id, newType);
  //     }
  //   }
  // }, [selectedPosts.length, selectedPosts]);

  // localStorage에서 임시 저장된 내용 불러오기
  useEffect(() => {
    const savedContent = localStorage.getItem("draftContent");
    console.log("localStorage에서 불러온 내용:", savedContent);
    console.log("현재 selectedPosts:", selectedPosts);
    if (savedContent && selectedPosts.length === 0) {
      console.log("writingContent 설정:", savedContent);
      setHasUnsavedContent(true);
      setWritingContent(savedContent);
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
    console.log("writingContent 변경됨:", writingContent);
    console.log("selectedPosts.length:", selectedPosts.length);
    if (writingContent && selectedPosts.length === 0) {
      console.log("localStorage에 저장:", writingContent);
      setHasUnsavedContent(true);
      localStorage.setItem("draftContent", writingContent);
    } else if (!writingContent) {
      console.log("localStorage 삭제");
      localStorage.removeItem("draftContent");
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
    if (selectedImages.length > 0) {
      if (selectedImages.length > 1) {
        setSelectedMediaType("CAROUSEL");
      } else {
        setSelectedMediaType("IMAGE");
      }
    } else {
      setSelectedMediaType("TEXT");
    }
  }, [selectedImages]);

  // 이미지 변경 핸들러
  const handleImagesChange = (images: string[]) => {
    console.log("이미지 변경됨:", images);
    setSelectedImages(images);
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
          const [utcHours, utcMinutes] = time.split(":").map(Number);

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

  // canComposeWithAI 로직 수정 (type 제거)
  const canComposeWithAI = selectedPosts.length === 2;

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

  // Post 예약발행
  const handleSchedule = async () => {
    if (!writingContent || !scheduleTime) return;

    try {
      // 전역 상태의 소셜 계정으로 예약 발행 (schedulePost 내부에서 처리됨)
      const result = await schedulePost(
        writingContent,
        scheduleTime,
        selectedMediaType,
        selectedImages
      );

      if (result?.error) throw result.error;

      // 스케줄 성공 시 초기화
      setWritingContent("");
      setSelectedImages([]);
      setHasUnsavedContent(false);
      localStorage.removeItem("draftContent");
      toast.success("예약이 완료되었습니다.");
      fetchScheduledTimes(); // 예약되어있는 시간 갱신
    } catch (error) {
      console.error("Error scheduling post:", error);
      toast.error("예약에 실패했습니다.");
    }
  };

  // Post 즉시 발행
  const handlePublish = async () => {
    try {
      // 전역 상태의 소셜 계정으로 발행 (publishPost 내부에서 처리됨)
      const result = await publishPost({
        content: writingContent,
        mediaType:
          selectedMediaType === "CAROUSEL" ? "IMAGE" : selectedMediaType,
        images: selectedImages,
      });

      if (result && "error" in result && result.error) throw result.error;

      // 발행 성공 시 초기화
      setWritingContent("");
      setSelectedImages([]);
      setHasUnsavedContent(false);
      localStorage.removeItem("draftContent");
      toast.success("발행이 완료되었습니다.");
    } catch (error) {
      console.error("Error publishing post:", error);
      toast.error("발행에 실패했습니다.");
    }
  };

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

  // UI

  return (
    <div
      className={cn(
        "flex h-[calc(100vh-48px)] mt-6 mr-6 w-[390px] flex-col rounded-xl border bg-background",
        className
      )}
    >
      <div className="flex-1 overflow-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-1">
            <NextImage src="/Salt-AI.svg" alt="Salt AI" width={48} height={48} />
            <h1 className="text-2xl font-semibold">Salt AI</h1>
          </div>
          {selectedPosts.length > 0 && (
            <h2 className="text-sm font-medium text-muted-foreground">
              Selected Posts ({selectedPosts.length}/3)
            </h2>
          )}
        </div>

        {/* Selected Posts Section */}
        <div className="space-y-4">
          {/* Empty PostCard when no posts are selected */}
          {selectedPosts.length === 0 ? (
            <PostCard
              variant="writing"
              avatar="/avatars/01.png"
              username="Username"
              content={writingContent}
              onAiClick={() => setShowAiInput(!showAiInput)}
              onContentChange={setWritingContent}
              images={selectedImages}
              onImagesChange={handleImagesChange}
            />
          ) : (
            /* Selected Posts */
            selectedPosts.map((post, index) => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="cursor-pointer"
              >
                <PostCard
                  variant={post.id === activePostId ? "writing" : "compact"}
                  avatar='' // 현재 사용자 계정 프로필 이미지
                  username="Example" // 현재 사용자 계정 이름
                  content={post.id === activePostId ? writingContent : post.content}
                  url={post.url}
                  onMinus={() => removePost(post.id)}
                  onAiClick={() => setShowAiInput(!showAiInput)}
                  order={index}
                  onContentChange={post.id === activePostId ? setWritingContent : undefined}
                  images={post.id === activePostId ? selectedImages : []}
                  onImagesChange={post.id === activePostId ? handleImagesChange : undefined}
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
              <span className="bg-white px-4 text-sm text-gray-400">Or get from</span>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Link href="/contents-cooker/topic-finder" className="flex flex-col items-center p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
              <TextSearch className="w-6 h-6 mb-2 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Topic Finder</span>
            </Link>
            <Link href="/contents-cooker/post-radar" className="flex flex-col items-center p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
              <Radio className="w-6 h-6 mb-2 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Post Radar</span>
            </Link>
            <Link href="/contents-cooker/saved" className="flex flex-col items-center p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
              <PencilLine className="w-6 h-6 mb-2 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Saved</span>
            </Link>
          </div>
        </div>


      </div>

      {/* Bottom Buttons - Default */}
      {selectedPosts.length < 2 && (
        <div className="p-4 space-y-2">
          <Button
            variant="outline"
            size="xl"
            className="w-full"
            onClick={handleSaveToDraft}
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
        <div className="p-4 space-y-2">
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
