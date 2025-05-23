"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ImagePlus,
  Vote,
  Sparkles,
  ChartNoAxesCombined,
  Plus,
  ChevronDown,
  Minus,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ReusableDropdown } from "@/components/ui/dropdown";
import Image from "next/image";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { improvePost } from "@/app/actions/openai";

interface PostCardProps {
  variant?: "default" | "writing" | "compact";
  avatar?: string;
  username: string;
  content: string;
  timestamp?: string;
  onAiClick?: () => void;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  repostCount?: number;
  shareCount?: number;
  topComment?: string;
  url?: string;
  onAdd?: () => void;
  onMinus?: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
  order?: number;
  onContentChange?: (content: string) => void;
  images?: string[];
  onImagesChange?: (images: string[]) => void;
}

// 점수 계산 함수
const calculateScore = (
  viewCount = 0,
  likeCount = 0,
  commentCount = 0,
  shareCount = 0,
  repostCount = 0
) => {
  // 각 지표의 가중치 설정
  const total =
    viewCount * 0.3 +
    likeCount * 0.3 +
    commentCount * 0.2 +
    (shareCount + repostCount) * 0.2;

  // 점수 범위에 따른 등급 부여
  if (total >= 10000) return { grade: "Best" };
  if (total >= 5000) return { grade: "Good" };
  if (total >= 1000) return { grade: "So-so" };
  return { grade: "Bad" };
};

export function PostCard({
  variant = "default",
  avatar,
  username,
  content,
  timestamp,
  onAiClick,
  viewCount,
  likeCount,
  commentCount,
  repostCount,
  shareCount,
  topComment,
  url,
  onAdd,
  onMinus,
  onSelect,
  isSelected,
  order,
  onContentChange,
  images = [],
  onImagesChange,
}: PostCardProps) {
  const [isAiActive, setIsAiActive] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>(images);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAiClick = () => {
    if (onAiClick) {
      setIsAiActive(!isAiActive);
      onAiClick();
    }
  };

  const isCompact = variant === "compact";
  const isWriting = variant === "writing";
  const score = calculateScore(
    viewCount,
    likeCount,
    commentCount,
    shareCount,
    repostCount
  );

  // textarea 높이 자동 조절
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  };

  // 컨텐츠가 변경될 때마다 높이 조절
  useEffect(() => {
    textareaRef.current?.focus();
    if (isWriting) {
      adjustTextareaHeight();
    }
  }, [content, isWriting]);

  // 이미지 추가 기능
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // 이미지 추가 기능
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );
    const updatedImages = [...selectedImages, ...newImages];
    setSelectedImages(updatedImages);

    if (onImagesChange) {
      onImagesChange(updatedImages);
    }

    // 파일 입력 초기화 (동일한 파일을 다시 선택할 수 있도록)
    e.target.value = "";
  };

  // 이미지 삭제 기능
  const handleRemoveImage = (index: number) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);

    if (onImagesChange) {
      onImagesChange(updatedImages);
    }
  };

  // Improve Post 기능
  const [isImproving, setIsImproving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiInput, setShowAiInput] = useState(false);
  const [writingContent, setWritingContent] = useState(content);

  // Improve Post 기능
  const handleImprovePost = async () => {
    if (!writingContent) {
      toast.error("개선할 콘텐츠가 없습니다.");
      return;
    }

    try {
      setIsImproving(true);
      const { content, error } = await improvePost(writingContent);

      if (error) throw new Error(error);

      // 개선된 콘텐츠로 업데이트
      setWritingContent(content);
      toast.success("콘텐츠가 성공적으로 개선되었습니다.");
    } catch (error) {
      console.error("Error improving content:", error);
      toast.error(
        error instanceof Error ? error.message : "콘텐츠 개선에 실패했습니다."
      );
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div
      className={`space-y-4 w-full h-auto border p-3 rounded-xl ${isCompact ? "" : "p-3 mb-4"
        } ${isSelected ? "bg-accent rounded-xl border-none" : "bg-card"}`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="flex-shrink-0 h-10 w-10">
          <AvatarImage src={avatar} alt={username} />
          <AvatarFallback>{username[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-col flex-1">
          {/* Username, Content and Timestamp */}
          <div className="flex-1 space-y-1 pb-10">
            <div className="flex justify-between pr-1">
              <span className="font-medium">{username}</span>
              <div>
                {!isCompact && !isWriting && timestamp && (
                  <span className="text-sm text-muted-foreground">
                    {timestamp}
                  </span>
                )}
                {isCompact && <Minus onClick={onMinus} />}
              </div>
            </div>
            {isWriting ? (
              <textarea
                ref={textareaRef}
                className="w-full resize-none bg-transparent border-none focus:outline-none focus:ring-0 p-0 overflow-hidden placeholder:text-muted-foreground"
                value={content}
                onChange={(e) => {
                  onContentChange?.(e.target.value);
                  adjustTextareaHeight();
                }}
                placeholder={content.length === 0 ? "내용을 작성하세요..." : ""}
                rows={1}
              />
            ) : (
              <div
                className={`whitespace-pre-wrap overflow-hidden text-ellipsis ${isCompact ? "line-clamp-3" : ""
                  }`}
              >
                {content}
              </div>
            )}

            {/* 이미지 미리보기 영역 */}
            {selectedImages.length > 0 && (
              <div
                className={`grid gap-2 mt-2 ${selectedImages.length === 1
                  ? "grid-cols-1"
                  : selectedImages.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-3"
                  }`}
              >
                {selectedImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative rounded-md overflow-hidden aspect-square"
                  >
                    <Image
                      src={image}
                      alt={`첨부 이미지 ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {isWriting && (
                      <button
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 숨겨진 파일 입력 */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />

          {/* Buttons variation by variants */}

          {/* Default variant Buttons */}
          {!isCompact && !isWriting && (
            <div className="flex justify-between">
              <div className="flex text-sm gap-2">
                <ChartNoAxesCombined className="h-4 w-4" />
                {score.grade}
              </div>
              <Button
                variant="outline"
                size="default"
                className="gap-1 px-4"
                onClick={onAdd}
                disabled={isSelected}
              >
                <Plus className="h-4 w-4" />
                <span>{isSelected ? "Added" : "Add"}</span>
              </Button>
            </div>
          )}
          {/* Compact variant Buttons */}
          {isCompact && (
            <div className="flex items-center justify-end space-x-2">
              <span className="text-muted-foreground">use as</span>
              <ReusableDropdown
                items={[
                  { label: "format", onClick: () => onSelect?.("format") },
                  { label: "content", onClick: () => onSelect?.("content") },
                ]}
                initialLabel={order === 0 ? "format" : "content"}
              />
            </div>
          )}
          {/* Writing variant Buttons */}
          {isWriting && (
            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleImageClick}
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Vote className="h-4 w-4" />
              </Button>
              <Button
                variant="toggle"
                size="sm"
                data-state={isAiActive ? "on" : "off"}
                className="flex items-center gap-2 rounded-full px-4"
                onClick={handleAiClick}
              >
                <Sparkles className="h-4 w-4" />
                <span>AI</span>
              </Button>
            </div>

          )}

          {/* AI Input Dropdown */}
          {showAiInput && (
            <div className="space-y-2 rounded-lg border bg-background p-4 shadow-sm">
              <Input
                placeholder="Input Prompt"
                className="w-full"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1">
                  Add Hook
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  Add Hook
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1">
                  Expand Post
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  Expand Post
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={handleImprovePost}
                  disabled={isImproving || !writingContent}
                >
                  {isImproving ? "개선 중..." : "Improve Post"}
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  Improve Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
