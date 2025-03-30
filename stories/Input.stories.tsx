import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: () => (
    <div className="w-[350px]">
      <Input type="text" placeholder="Enter text..." />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-[350px] grid gap-2">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Enter your email" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[350px]">
      <Input disabled type="text" placeholder="Disabled input" />
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="w-[350px] relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
      <Input type="search" className="pl-10" placeholder="Search..." />
    </div>
  ),
};

export const File: Story = {
  render: () => (
    <div className="w-[350px] grid gap-2">
      <Label htmlFor="file">Upload file</Label>
      <Input id="file" type="file" />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="w-[350px] grid gap-4">
      <Input type="text" placeholder="Default input" />
      <Input type="text" placeholder="With focus ring" className="focus:ring-2 focus:ring-blue-500" />
      <Input type="text" placeholder="With border" className="border-2 border-gray-300" />
      <Input type="text" placeholder="Rounded full" className="rounded-full" />
    </div>
  ),
}; 