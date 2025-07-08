'use client'

import { CommentList } from "@/components/comment/CommentList";

export default function CommentsPage() {
  return (
    <div className="h-full w-full bg-white rounded-[20px]">
      <CommentList />
    </div>
  );
}