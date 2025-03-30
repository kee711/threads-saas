import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Content } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckIcon, EditIcon, XIcon } from "lucide-react";

interface ContentItemProps {
  content: Content;
  onEdit: (id: number, updatedContent: string) => void;
  onConfirm: (id: number) => void;
}

export function ContentItem({ content, onEdit, onConfirm }: ContentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content.content);

  const handleEditToggle = () => {
    if (isEditing) {
      // 편집 완료
      onEdit(content.id, editedContent);
    }
    setIsEditing(!isEditing);
  };

  const handleCancel = () => {
    setEditedContent(content.content);
    setIsEditing(false);
  };

  const handleConfirm = () => {
    onConfirm(content.id);
  };

  return (
    <Card className={cn("transition-all", {
      "border-green-500 bg-green-50": content.isConfirmed,
      "border-blue-500 bg-blue-50": content.isScheduled,
    })}>
      <CardContent className="pt-6">
        {isEditing ? (
          <textarea
            className="w-full min-h-[150px] p-3 border rounded-md"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
        ) : (
          <div className="whitespace-pre-wrap">{content.content}</div>
        )}
        
        {content.isScheduled && content.publishDate && (
          <div className="mt-4 text-sm text-blue-600">
            예약 발행: {content.publishDate}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div>
          {isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="mr-2"
            >
              <XIcon className="h-4 w-4 mr-1" />
              취소
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditToggle}
              disabled={content.isConfirmed || content.isScheduled}
            >
              <EditIcon className="h-4 w-4 mr-1" />
              수정
            </Button>
          )}
        </div>
        
        <div>
          {isEditing ? (
            <Button size="sm" onClick={handleEditToggle}>
              <CheckIcon className="h-4 w-4 mr-1" />
              저장
            </Button>
          ) : (
            !content.isConfirmed && (
              <Button size="sm" onClick={handleConfirm}>
                <CheckIcon className="h-4 w-4 mr-1" />
                확정
              </Button>
            )
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 