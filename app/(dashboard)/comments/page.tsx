import { CommentList } from "@/components/comment/CommentList";
import { RightSidebar } from '@/components/RightSidebar'

export default function CommentsPage() {
  return (
    <div className="flex h-screen">
      <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] p-4 md:p-6">
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
      </main>
      <RightSidebar />
    </div>
  );
}