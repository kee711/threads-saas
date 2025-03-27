import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";

interface ContentItemProps {
  id: number;
  content: string;
  onEdit: (id: number, updatedContent: string) => void;
  onConfirm: (id: number) => void;
  isConfirmed: boolean;
  isScheduled: boolean;
  publishDate?: string;
}

export const ContentItem: React.FC<ContentItemProps> = ({
  id,
  content,
  onEdit,
  onConfirm,
  isConfirmed,
  isScheduled,
  publishDate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleSave = () => {
    onEdit(id, editedContent);
    setIsEditing(false);
  };

  return (
    <Card className={`w-full ${isConfirmed ? "border-green-500" : ""}`}>
      <CardHeader>
        <CardTitle className="text-lg flex justify-between items-center">
          <div>콘텐츠 #{id}</div>
          {isScheduled && (
            <div className="text-sm text-gray-500">예약됨: {publishDate}</div>
          )}
        </CardTitle>
        {isConfirmed && (
          <div className="text-green-500 text-sm font-medium">확정됨</div>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="pt-4">
        {isEditing ? (
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-h-[150px]"
          />
        ) : (
          <div className="whitespace-pre-line">{content}</div>
        )}
      </CardContent>
      <CardFooter className="justify-between">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              취소
            </Button>
            <Button onClick={handleSave}>저장</Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setEditedContent(content);
                setIsEditing(true);
              }}
              disabled={isConfirmed}
            >
              수정
            </Button>
            <Button
              onClick={() => onConfirm(id)}
              disabled={isConfirmed}
              variant={isConfirmed ? "outline" : "default"}
            >
              {isConfirmed ? "확정됨" : "확정"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}; 