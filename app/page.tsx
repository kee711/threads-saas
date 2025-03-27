"use client";

import { useState } from "react";
import { ContentForm } from "@/components/content-generator/ContentForm";
import { ContentList } from "@/components/content-generator/ContentList";
import { Content, ThreadsUser } from "@/lib/types";
import { generateContents } from "@/lib/services/openai";
import { initializeThreadsClient } from "@/lib/services/threads";
import { calculatePublishTime, formatDate, scheduleContent } from "@/lib/services/scheduler";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LoaderIcon } from "lucide-react";

export default function Home() {
  const [contents, setContents] = useState<Content[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [threadsUser, setThreadsUser] = useState<ThreadsUser>({
    username: "",
    password: "",
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // 인증 처리 함수
  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!threadsUser.username || !threadsUser.password) {
      alert("사용자명과 비밀번호를 입력해주세요.");
      return;
    }
    
    setIsAuthenticating(true);
    
    try {
      await initializeThreadsClient(threadsUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("인증 실패:", error);
      alert("인증에 실패했습니다. 사용자명과 비밀번호를 확인해주세요.");
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  // 콘텐츠 생성 함수
  const handleGenerateContents = async (topic: string, reference: string) => {
    setIsGenerating(true);
    
    try {
      const generatedContents = await generateContents({ topic, reference });
      
      const newContents: Content[] = generatedContents.map((content, index) => ({
        id: Date.now() + index,
        content,
        isConfirmed: false,
        isScheduled: false,
        createdAt: new Date(),
      }));
      
      setContents(newContents);
    } catch (error) {
      console.error("콘텐츠 생성 실패:", error);
      alert("콘텐츠 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  // 콘텐츠 수정 함수
  const handleEditContent = (id: number, updatedContent: string) => {
    setContents(
      contents.map((content) =>
        content.id === id
          ? { ...content, content: updatedContent }
          : content
      )
    );
  };
  
  // 콘텐츠 확정 함수
  const handleConfirmContent = (id: number) => {
    setContents(
      contents.map((content) =>
        content.id === id
          ? { ...content, isConfirmed: true }
          : content
      )
    );
  };
  
  // 콘텐츠 발행 함수
  const handlePublishContents = async () => {
    if (!isAuthenticated) {
      alert("먼저 스레드 계정에 로그인해야 합니다.");
      return;
    }
    
    const confirmedContents = contents.filter((content) => content.isConfirmed);
    
    if (confirmedContents.length === 0) {
      alert("발행할 콘텐츠가 없습니다. 먼저 콘텐츠를 확정해주세요.");
      return;
    }
    
    setIsPublishing(true);
    
    try {
      // 확정된 컨텐츠에 대해 발행 시간 계산 및 설정
      const scheduledContents = confirmedContents.map((content, index) => {
        const publishDate = calculatePublishTime(index);
        return {
          ...content,
          isScheduled: true,
          publishDate: formatDate(publishDate),
          createdAt: publishDate
        };
      });
      
      // 상태 업데이트
      setContents(
        contents.map((content) => {
          const scheduledContent = scheduledContents.find((sc) => sc.id === content.id);
          return scheduledContent || content;
        })
      );
      
      // 콘텐츠 발행 스케줄링
      scheduledContents.forEach((content) => {
        scheduleContent(content);
      });
      
      alert("선택한 콘텐츠가 예약되었습니다. 지정된 시간에 자동으로 발행됩니다.");
    } catch (error) {
      console.error("콘텐츠 발행 실패:", error);
      alert("콘텐츠 발행 중 오류가 발생했습니다.");
    } finally {
      setIsPublishing(false);
    }
  };
  
  // 확정된 콘텐츠가 있는지 확인
  const hasConfirmedContents = contents.some((content) => content.isConfirmed);
  
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-8">AI 스레드 콘텐츠 생성기</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            {!isAuthenticated ? (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>로그인</CardTitle>
                  <CardDescription>
                    스레드 계정으로 로그인하여 콘텐츠를 발행하세요.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleAuthenticate}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">사용자명</Label>
                      <Input
                        id="username"
                        placeholder="your_username"
                        value={threadsUser.username}
                        onChange={(e) =>
                          setThreadsUser({ ...threadsUser, username: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">비밀번호</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="비밀번호"
                        value={threadsUser.password}
                        onChange={(e) =>
                          setThreadsUser({ ...threadsUser, password: e.target.value })
                        }
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isAuthenticating}>
                      {isAuthenticating ? (
                        <>
                          <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                          로그인 중...
                        </>
                      ) : (
                        "로그인"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            ) : (
              <Card className="mb-6 border-green-500">
                <CardHeader>
                  <CardTitle>로그인됨</CardTitle>
                  <CardDescription>
                    {threadsUser.username}으로 로그인되었습니다.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAuthenticated(false)}
                  >
                    로그아웃
                  </Button>
                </CardFooter>
              </Card>
            )}
            
            <ContentForm
              onSubmit={handleGenerateContents}
              isGenerating={isGenerating}
            />
          </div>
          
          <div className="md:col-span-2">
            <ContentList
              contents={contents}
              onEdit={handleEditContent}
              onConfirm={handleConfirmContent}
              onPublish={handlePublishContents}
              isPublishing={isPublishing}
              hasConfirmedContents={hasConfirmedContents}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
