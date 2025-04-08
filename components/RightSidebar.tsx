'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/PostCard';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import useSelectedPostsStore from '@/stores/useSelectedPostsStore';
import { Sparkles } from 'lucide-react';
import { createContent } from '@/app/actions/content';
import { toast } from 'sonner';
import { composeWithAI } from '@/app/actions/openai';
import { schedulePost, publishPost } from '@/app/actions/schedule';
import useScheduleStore from '@/stores/useScheduleStore';

interface RightSidebarProps {
  className?: string;
}

export function RightSidebar({ className }: RightSidebarProps) {
  const [showAiInput, setShowAiInput] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const { selectedPosts, removePost, updatePostType, addPost } = useSelectedPostsStore();
  const scheduleTimes = useScheduleStore(state => state.scheduleTimes);

  // selectedPosts가 2개가 되었을 때 첫 번째 포스트의 type을 'format', 두 번째 포스트의 type을 'content'로 설정
  useEffect(() => {
    if (selectedPosts.length === 2) {
      // 첫 번째 포스트에 type이 없으면 'format'으로 설정
      if (!selectedPosts[0].type) {
        updatePostType(selectedPosts[0].id, 'format');
      }
      // 두 번째 포스트에 type이 없으면 'content'로 설정
      if (!selectedPosts[1].type) {
        updatePostType(selectedPosts[1].id, 'content');
      }
      // 두 포스트의 type이 같으면, 나중에 추가된 포스트를 다른 type으로 설정
      else if (selectedPosts[0].type === selectedPosts[1].type) {
        const newType = selectedPosts[0].type === 'format' ? 'content' : 'format';
        updatePostType(selectedPosts[1].id, newType);
      }
    }
  }, [selectedPosts, updatePostType]);

  const canComposeWithAI = selectedPosts.length === 2 &&
    selectedPosts.every(post => post.type) &&
    selectedPosts.some(post => post.type === 'format') &&
    selectedPosts.some(post => post.type === 'content');

  const handleComposeWithAI = async () => {
    if (!canComposeWithAI) return;

    const formatPost = selectedPosts.find(post => post.type === 'format');
    const contentPost = selectedPosts.find(post => post.type === 'content');

    if (!formatPost || !contentPost) return;

    try {
      setIsComposing(true);
      const { content, error } = await composeWithAI(formatPost, contentPost);

      if (error) throw new Error(error);

      // 선택된 포스트 초기화
      selectedPosts.forEach(post => removePost(post.id));

      // 생성된 콘텐츠를 writing PostCard에 저장, useEffect 통해 localStorage에 저장
      setWritingContent(content);
      setHasUnsavedContent(true);

      toast.success('AI가 새로운 글을 생성했습니다.');
    } catch (error) {
      console.error('Error composing content:', error);
      toast.error(error instanceof Error ? error.message : 'AI 글 생성에 실패했습니다.');
    } finally {
      setIsComposing(false);
    }
  };

  const [writingContent, setWritingContent] = useState("");
  const [hasUnsavedContent, setHasUnsavedContent] = useState(false);

  // localStorage에서 임시 저장된 내용 불러오기
  useEffect(() => {
    const savedContent = localStorage.getItem('draftContent');
    console.log('localStorage에서 불러온 내용:', savedContent);
    console.log('현재 selectedPosts:', selectedPosts);
    if (savedContent && selectedPosts.length === 0) {
      console.log('writingContent 설정:', savedContent);
      setHasUnsavedContent(true);
      setWritingContent(savedContent);
    }
  }, [selectedPosts]);

  // selectedPosts가 변경될 때마다 writingContent 업데이트
  useEffect(() => {
    console.log('selectedPosts 변경됨:', selectedPosts);
    console.log('현재 writingContent:', writingContent);
    console.log('현재 hasUnsavedContent:', hasUnsavedContent);

    // selectedPosts가 1개일 때만 writingContent를 업데이트
    if (selectedPosts.length === 1) {
      setWritingContent(selectedPosts[0].content);
      setHasUnsavedContent(false);
      localStorage.removeItem('draftContent');
    }
    // selectedPosts가 0개이고 hasUnsavedContent가 false일 때만 초기화
    // 단, 페이지 로드 직후가 아닐 때만 (localStorage에서 불러온 직후가 아닐 때만)
    else if (selectedPosts.length === 0 && !hasUnsavedContent && writingContent === "") {
      setWritingContent("");
      localStorage.removeItem('draftContent');
    }
  }, [selectedPosts, hasUnsavedContent, writingContent]);

  // writingContent가 변경될 때마다 hasUnsavedContent 업데이트와 localStorage 저장
  useEffect(() => {
    console.log('writingContent 변경됨:', writingContent);
    console.log('selectedPosts.length:', selectedPosts.length);
    if (writingContent && selectedPosts.length === 0) {
      console.log('localStorage에 저장:', writingContent);
      setHasUnsavedContent(true);
      localStorage.setItem('draftContent', writingContent);
    } else if (!writingContent) {
      console.log('localStorage 삭제');
      localStorage.removeItem('draftContent');
    }
  }, [writingContent, selectedPosts.length, hasUnsavedContent]);

  // 다른 포스트가 추가될 때 작성 중인 글도 함께 추가
  useEffect(() => {
    if (hasUnsavedContent && selectedPosts.length === 1 && !selectedPosts.some(post => post.content === writingContent)) {
      const tempId = `temp-${Date.now()}`;
      addPost({
        id: tempId,
        content: writingContent,
        username: "Username",
        timestamp: new Date().toISOString(),
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        repostCount: 0,
        shareCount: 0,
        avatar: "/avatars/01.png"
      });
      setHasUnsavedContent(false);
      localStorage.removeItem('draftContent');
    }
  }, [selectedPosts, hasUnsavedContent, writingContent, addPost]);

  // writingContent가 비어있을 때 해당 post를 제거
  useEffect(() => {
    if (selectedPosts.length === 1 && writingContent === "") {
      removePost(selectedPosts[0].id);
      setHasUnsavedContent(false);
      localStorage.removeItem('draftContent');
    }
  }, [writingContent, selectedPosts, removePost]);

  const handleSaveToDraft = async () => {
    try {
      const { error } = await createContent({
        content: writingContent,
        publish_status: 'draft'
      });

      if (error) throw error;

      // DB 저장 성공 시 localStorage 초기화
      localStorage.removeItem('draftContent');
      setHasUnsavedContent(false);
      toast.success('임시저장 되었습니다.');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('임시저장에 실패했습니다.');
    }
  };

  // Post 예약발행
  const handleSchedule = async () => {
    try {
      const { error } = await schedulePost(writingContent, scheduleTimes);

      if (error) throw error;

      // 예약 성공 시 초기화
      setWritingContent("");
      setHasUnsavedContent(false);
      localStorage.removeItem('draftContent');
      toast.success('예약이 완료되었습니다.');
    } catch (error) {
      console.error('Error scheduling post:', error);
      toast.error('예약에 실패했습니다.');
    }
  };

  // Post 즉시 발행
  const handlePublish = async () => {
    try {
      const { error } = await publishPost(writingContent);

      if (error) throw error;

      // 발행 성공 시 초기화
      setWritingContent("");
      setHasUnsavedContent(false);
      localStorage.removeItem('draftContent');
      toast.success('발행이 완료되었습니다.');
    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error('발행에 실패했습니다.');
    }
  };

  return (
    <div className={cn("flex h-screen w-[390px] flex-col border-l bg-background", className)}>
      <div className="flex-1 overflow-auto p-4">

        <h1 className="text-2xl font-semibold">Create New</h1>

        {/* Selected Posts Section */}
        <div className="space-y-4 mb-4">
          {selectedPosts.length > 0 && (
            <h2 className="text-sm font-medium text-muted-foreground">
              Selected Posts ({selectedPosts.length}/2)
            </h2>
          )}

          {/* Empty PostCard when no posts are selected */}
          {selectedPosts.length === 0 ? (
            <PostCard
              variant="writing"
              avatar="/avatars/01.png"
              username="Username"
              content={writingContent}
              onAiClick={() => setShowAiInput(!showAiInput)}
              onContentChange={setWritingContent}
            />
          ) : (
            /* Selected Posts */
            selectedPosts.map((post, index) => (
              <PostCard
                key={post.id}
                variant={selectedPosts.length >= 2 ? "compact" : "writing"}
                avatar={post.avatar}
                username={post.username}
                content={selectedPosts.length >= 2 ? post.content : writingContent}
                timestamp={post.timestamp}
                viewCount={post.viewCount}
                likeCount={post.likeCount}
                commentCount={post.commentCount}
                repostCount={post.repostCount}
                shareCount={post.shareCount}
                topComment={post.topComment}
                url={post.url}
                onSelect={(type) => updatePostType(post.id, type)}
                onMinus={() => removePost(post.id)}
                onAiClick={() => setShowAiInput(!showAiInput)}
                order={index}
                onContentChange={selectedPosts.length >= 2 ? undefined : setWritingContent}
              />
            ))
          )}
        </div>


        {/* AI Input Dropdown */}
        {showAiInput && (
          <div className="space-y-2 rounded-lg border bg-background p-4 shadow-sm">
            <Input
              placeholder="Input Prompt"
              className="w-full"
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
              <Button variant="ghost" size="sm" className="flex-1">
                Improve Post
              </Button>
              <Button variant="ghost" size="sm" className="flex-1">
                Improve Post
              </Button>
            </div>
          </div>
        )}
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
            <Button
              variant="default"
              size="xl"
              className="flex-1 bg-black text-white hover:bg-black/90"
              onClick={handleSchedule}
              disabled={!writingContent}
            >
              Add to Schedule
            </Button>
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
        <div className='p-4 space-y-2'>
          <Button
            variant="default"
            size="xl"
            onClick={handleComposeWithAI}
            disabled={!canComposeWithAI || isComposing}
            className="flex w-full items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>{isComposing ? '생성 중...' : 'Compose with AI'}</span>
          </Button>
        </div>
      )}
    </div>
  );
} 