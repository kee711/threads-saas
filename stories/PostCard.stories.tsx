import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PostCard } from '@/components/PostCard';

const meta = {
  title: 'Components/PostCard',
  component: PostCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'writing', 'compact'],
    },
    onAiClick: { action: 'AI clicked' },
    onAdd: { action: 'Add clicked' },
  },
} satisfies Meta<typeof PostCard>;

export default meta;
type Story = StoryObj<typeof PostCard>;

export const Default: Story = {
  args: {
    variant: 'default',
    avatar: 'https://github.com/shadcn.png',
    username: 'johndoe',
    content: '🚀 SaaS 만든다며, 결과는 이것뿐 해결했어요 👇\n1. Stripe 써보려다가 막혔어요\n• 한국은 아직 Stripe 지원 안 되더라고요\n• 외국 계좌나 법인 필요해서 복잡했어요',
    timestamp: '2시간 전',
    viewCount: 1200,
    likeCount: 450,
    commentCount: 32,
    repostCount: 12,
    shareCount: 8,
  },
};

export const Compact: Story = {
  args: {
    variant: 'compact',
    avatar: 'https://github.com/shadcn.png',
    username: 'janesmith',
    content: '해외 타겟 SaaS, 디지털 제품 판매할 때 정말 좋은 솔루션이라고 느꼈어요',
    timestamp: '1시간 전',
    viewCount: 800,
    likeCount: 250,
    commentCount: 15,
    repostCount: 5,
    shareCount: 3,
  },
};

export const Writing: Story = {
  args: {
    variant: 'writing',
    avatar: 'https://github.com/shadcn.png',
    username: 'writer',
    content: '새로운 글을 작성 중입니다...',
  },
};

export const WithTopComment: Story = {
  args: {
    ...Default.args,
    topComment: '정말 좋은 인사이트네요! 저도 비슷한 경험이 있어요.',
  },
};

export const HighEngagement: Story = {
  args: {
    ...Default.args,
    viewCount: 15000,
    likeCount: 8000,
    commentCount: 1200,
    repostCount: 500,
    shareCount: 300,
  },
}; 