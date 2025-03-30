import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LoaderIcon } from "lucide-react";

interface ContentFormProps {
  onSubmit: (topic: string, reference: string) => Promise<void>;
  isGenerating: boolean;
}

export function ContentForm({ onSubmit, isGenerating }: ContentFormProps) {
  const [topic, setTopic] = useState("");
  const [reference, setReference] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic) {
      alert("주제를 입력해주세요.");
      return;
    }
    
    await onSubmit(topic, reference);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>콘텐츠 생성</CardTitle>
        <CardDescription>
          AI로 스레드 콘텐츠를 생성하세요.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">주제</Label>
            <Input
              id="topic"
              placeholder="콘텐츠 주제를 입력하세요"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">참고자료 (선택사항)</Label>
            <Input
              id="reference"
              placeholder="참고자료 또는 키워드를 입력하세요"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isGenerating || !topic}>
            {isGenerating ? (
              <>
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : (
              "콘텐츠 생성"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 