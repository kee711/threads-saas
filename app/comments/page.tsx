import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommentList } from "@/components/comment/CommentList";
import { ContentList } from '@/components/contents-helper/ContentList';

export default function CommentsPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Comments</h2>
          </div>
        </div>
        <div className="space-y-4">
          <CommentList />
        </div>
      </div>
    </div>
  );
} 