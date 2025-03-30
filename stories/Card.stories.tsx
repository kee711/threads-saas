import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Enter your information below to create your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              placeholder="Enter your name"
              className="rounded-md border px-3 py-2"
            />
          </div>
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              placeholder="Enter your email"
              className="rounded-md border px-3 py-2"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Create</Button>
      </CardFooter>
    </Card>
  ),
};

export const Pricing: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Pro Plan</CardTitle>
        <CardDescription>$19.99/month</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          <li>✓ Unlimited posts</li>
          <li>✓ Advanced analytics</li>
          <li>✓ Priority support</li>
          <li>✓ Custom branding</li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Subscribe</Button>
      </CardFooter>
    </Card>
  ),
}; 