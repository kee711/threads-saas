'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StatisticsPage() {
  return (
    <div className="container py-6">
      <h1 className="mb-6 text-3xl font-bold">통계</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>총 조회수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">전주 대비 +12%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>총 좋아요</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">567</div>
            <p className="text-xs text-muted-foreground">전주 대비 +8%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>총 댓글</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">전주 대비 +15%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 