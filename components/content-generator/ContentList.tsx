import React from "react";
import { ContentItem } from "./ContentItem";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";

interface Content {
  id: number;
  content: string;
  isConfirmed: boolean;
  isScheduled: boolean;
  publishDate?: string;
}

interface ContentListProps {
  contents: Content[];
  onEdit: (id: number, updatedContent: string) => void;
  onConfirm: (id: number) => void;
  onPublish: () => void;
  isPublishing: boolean;
  hasConfirmedContents: boolean;
}

export const ContentList: React.FC<ContentListProps> = ({
  contents,
  onEdit,
  onConfirm,
  onPublish,
  isPublishing,
  hasConfirmedContents,
}) => {
  if (contents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        아직 생성된 콘텐츠가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">생성된 콘텐츠 ({contents.length})</h2>
        <Button 
          onClick={onPublish} 
          disabled={!hasConfirmedContents || isPublishing}
        >
          {isPublishing ? "발행 중..." : "확정된 콘텐츠 발행하기"}
        </Button>
      </div>
      <Separator />
      <div className="grid gap-6 pt-4">
        {contents.map((content) => (
          <ContentItem
            key={content.id}
            id={content.id}
            content={content.content}
            onEdit={onEdit}
            onConfirm={onConfirm}
            isConfirmed={content.isConfirmed}
            isScheduled={content.isScheduled}
            publishDate={content.publishDate}
          />
        ))}
      </div>
    </div>
  );
}; 