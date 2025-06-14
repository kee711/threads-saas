'use client'

import { CommentList } from "@/components/comment/CommentList";
import { RightSidebar } from '@/components/RightSidebar';

export default function CommentsPage() {
  return (
    <div className="flex h-screen">
      <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <div className="container mx-auto">
          <div className="space-y-4">
            <div className="p-4 md:p-6 w-full">
              <h1 className="text-3xl font-bold mb-6">Comments</h1>
              <div className="space-y-4">
                <CommentList />
              </div>
            </div>
          </div>
        </div>
      </main>
      <RightSidebar />
    </div>
  );
}