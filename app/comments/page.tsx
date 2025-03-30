'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CommentsPage() {
  return (
    <div className="container py-6">
      <h1 className="mb-6 text-3xl font-bold">댓글</h1>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>최근 댓글</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-4 rounded-lg border p-4">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium">사용자1</span>
                    <span className="text-xs text-muted-foreground">1시간 전</span>
                  </div>
                  <p className="text-sm">댓글 내용이 여기에 표시됩니다.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 rounded-lg border p-4">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium">사용자2</span>
                    <span className="text-xs text-muted-foreground">2시간 전</span>
                  </div>
                  <p className="text-sm">다른 댓글 내용이 여기에 표시됩니다.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 