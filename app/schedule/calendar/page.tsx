'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalendarViewPage() {
  return (
    <div className="container py-6">
      <h1 className="mb-6 text-3xl font-bold">캘린더 뷰</h1>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>예약된 포스트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] rounded-lg border bg-muted/20">
              {/* 캘린더 컴포넌트가 들어갈 자리 */}
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  캘린더 뷰는 추후 구현될 예정입니다
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 