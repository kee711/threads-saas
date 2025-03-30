'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/PostCard';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface RightSidebarProps {
  className?: string;
}

export function RightSidebar({ className }: RightSidebarProps) {
  const [showAiInput, setShowAiInput] = useState(false);

  return (
    <div className={cn("flex h-screen w-[390px] flex-col border-l bg-background", className)}>
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] p-4">
        <h1 className="mb-4 text-2xl font-semibold">Create New</h1>

        {/* Post Card Section */}
        <div className="space-y-4">
          <PostCard
            variant='writing'
            avatar="/avatars/01.png"
            username="Username"
            content="🚀 SaaS 만든다며, 결과는 이것뿐 해결했어요 👇
1. Stripe 써보려다가 막혔어요
• 한국은 아직 Stripe 지원 안 되더라고요
• 외국 계좌나 법인 필요해서 복잡했어요

2. 그래서 LemonSqueezy로 바꿨어요 🍋
• Stripe가 안돼서 찾다가 신기한 솔루션고
• 한국 계좌로 송금도 가능해요
• 구독 결제도 쉽게 만들 수 있어요

3. 이번에 Cursor로 만든 웹앱에 LemonSqueezy 연동해봤는데 진짜 프로젝트 맛좀을 봤나봐요

4. 해외 타겟 SaaS, 디지털 제품 판매할 때 정말 좋은 솔션이라고 느꼈어요

5. Stripe 대안 찾고 있다면 LemonSqueezy 꼭 써보세요. 진심 추천해요"
            onAiClick={() => setShowAiInput(!showAiInput)}
          />

          {/* AI Input Dropdown */}
          {showAiInput && (
            <div className="space-y-2 rounded-lg border bg-background p-4 shadow-sm">
              <Input
                placeholder="Input Prompt"
                className="w-full"
              />
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1">
                  Add Hook
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  Add Hook
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1">
                  Expand Post
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  Expand Post
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1">
                  Improve Post
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  Improve Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="border-t p-4 space-y-2">
        <Button variant="outline" className="w-full">
          Save to Draft
        </Button>
        <div className="flex gap-2">
          <Button variant="default" className="flex-1 bg-black text-white hover:bg-black/90">
            Add to Schedule
          </Button>
          <Button variant="default" className="bg-black text-white hover:bg-black/90">
            Post Now
          </Button>
        </div>
      </div>
    </div>
  );
} 