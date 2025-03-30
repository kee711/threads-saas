import { Content } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentItem } from "./ContentItem";
import { LoaderIcon, SendIcon } from "lucide-react";

interface ContentListProps {
  contents: Content[];
  onEdit: (id: number, updatedContent: string) => void;
  onConfirm: (id: number) => void;
  onPublish: () => Promise<void>;
  isPublishing: boolean;
  hasConfirmedContents: boolean;
}

export function ContentList({
  contents,
  onEdit,
  onConfirm,
  onPublish,
  isPublishing,
  hasConfirmedContents,
}: ContentListProps) {
  if (contents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>생성된 콘텐츠</CardTitle>
          <CardDescription>
            왼쪽에서 주제를 입력하고 콘텐츠를 생성해보세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            아직 생성된 콘텐츠가 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>생성된 콘텐츠</CardTitle>
          <CardDescription>
            마음에 드는 콘텐츠를 확정하고 발행하세요.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            onClick={onPublish}
            disabled={isPublishing || !hasConfirmedContents}
            className="ml-auto"
          >
            {isPublishing ? (
              <>
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                발행 중...
              </>
            ) : (
              <>
                <SendIcon className="mr-2 h-4 w-4" />
                확정된 콘텐츠 발행
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="grid gap-4">
        {contents.map((content) => (
          <ContentItem
            key={content.id}
            content={content}
            onEdit={onEdit}
            onConfirm={onConfirm}
          />
        ))}
      </div>
    </div>
  );
} 