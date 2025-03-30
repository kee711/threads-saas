import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';
import { Sparkles } from "lucide-react";
import { useState } from "react";

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
        'transparent',
        'buttonGroup',
        'shining',
        'toggle',
      ],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof Button>;

// Toggle Button Example with State
const ToggleButtonExample = () => {
  const [isActive, setIsActive] = useState(false);

  return (
    <Button
      variant="toggle"
      data-state={isActive ? "on" : "off"}
      onClick={() => setIsActive(!isActive)}
      className="flex items-center gap-2"
    >
      <Sparkles className="h-4 w-4" />
      <span>Toggle Me</span>
    </Button>
  );
};

// 기본 버튼
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
  },
};

// 크기 변형
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">🔍</Button>
    </div>
  ),
};

// 모든 Variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="transparent">Transparent</Button>
      <Button variant="shining">Shining</Button>
    </div>
  ),
};

// 비활성화 상태
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

// 아이콘과 함께 사용
export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>
        <span className="mr-2">🚀</span>
        With Icon
      </Button>
      <Button variant="outline">
        Settings
        <span className="ml-2">⚙️</span>
      </Button>
    </div>
  ),
};

// 로딩 상태
export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button disabled>
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Processing
      </Button>
      <Button variant="outline" disabled>
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Uploading
      </Button>
    </div>
  ),
};

// 다크 모드
export const DarkMode: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 bg-slate-950 p-4">
      <Button>Light Button in Dark</Button>
      <Button variant="outline">Outline in Dark</Button>
      <Button variant="ghost">Ghost in Dark</Button>
    </div>
  ),
};

export const Toggle: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button
          variant="toggle"
          data-state="off"
        >
          Default State
        </Button>
        <Button
          variant="toggle"
          data-state="on"
        >
          Active State
        </Button>
      </div>
      <div className="flex gap-4">
        <ToggleButtonExample />
      </div>
    </div>
  ),
};

export const ToggleWithIcon: Story = {
  render: () => {
    const [isActive, setIsActive] = useState(false);

    return (
      <Button
        variant="toggle"
        data-state={isActive ? "on" : "off"}
        onClick={() => setIsActive(!isActive)}
        className="flex items-center gap-2 rounded-full"
      >
        <Sparkles className="h-4 w-4" />
        <span>AI Assistant</span>
      </Button>
    );
  },
}; 