import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";

interface ContentFormProps {
  onSubmit: (topic: string, reference: string) => Promise<void>;
  isGenerating: boolean;
}

export const ContentForm: React.FC<ContentFormProps> = ({ onSubmit, isGenerating }) => {
  const [topic, setTopic] = useState("");
  const [reference, setReference] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;
    await onSubmit(topic, reference);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI 콘텐츠 생성</CardTitle>
        <CardDescription>
          주제와 참고 자료를 입력하시면 AI가 스레드를 위한 컨텐츠 10개를 생성합니다.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">주제</Label>
            <Input
              id="topic"
              placeholder="AI 수익화 방법론"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">참고 자료 (선택사항)</Label>
            <Textarea
              id="reference"
              placeholder="참고할 내용이나 자료를 붙여넣으세요."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isGenerating}>
            {isGenerating ? "생성 중..." : "콘텐츠 생성하기"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}; 