'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostCard } from "@/components/PostCard";

export default function ListViewPage() {
  return (
    <div className="container py-6">
      <h1 className="mb-6 text-3xl font-bold">리스트 뷰</h1>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>예약된 포스트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <PostCard
                avatar="/avatars/01.png"
                username="Username"
                content="예약된 포스트 내용입니다."
                onAiClick={() => { }}
              />
              <PostCard
                avatar="/avatars/01.png"
                username="Username"
                content="다른 예약된 포스트 내용입니다."
                onAiClick={() => { }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 