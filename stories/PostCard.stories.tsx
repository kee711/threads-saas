import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PostCard } from '@/components/ui/post-card';

const meta = {
  title: 'UI/PostCard',
  component: PostCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact'],
    },
  },
} satisfies Meta<typeof PostCard>;

export default meta;
type Story = StoryObj<typeof PostCard>;

export const Default: Story = {
  args: {
    variant: 'default',
    post: {
      id: '1',
      content: 'This is a sample post content.',
      createdAt: new Date().toISOString(),
      author: {
        id: '1',
        name: 'John Doe',
        username: 'johndoe',
        image: 'https://github.com/shadcn.png',
      },
    },
  },
};

export const Compact: Story = {
  args: {
    variant: 'compact',
    post: {
      id: '2',
      content: 'This is a compact post.',
      createdAt: new Date().toISOString(),
      author: {
        id: '2',
        name: 'Jane Smith',
        username: 'janesmith',
        image: 'https://github.com/shadcn.png',
      },
    },
  },
};

export const LongContent: Story = {
  args: {
    variant: 'default',
    post: {
      id: '3',
      content: 'This is a very long post content that should wrap to multiple lines. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      createdAt: new Date().toISOString(),
      author: {
        id: '3',
        name: 'Long Writer',
        username: 'longwriter',
        image: 'https://github.com/shadcn.png',
      },
    },
  },
}; 