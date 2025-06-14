import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

const ToastDemo = () => {
  const { toast } = useToast();

  return (
    <div className="space-y-2">
      <Button
        onClick={() =>
          toast({
            title: 'Default Toast',
            description: 'This is a default toast message',
          })
        }
      >
        Show Toast
      </Button>
      <Toaster />
    </div>
  );
};

const meta = {
  title: 'UI/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  render: () => <ToastDemo />,
};

export const Success: Story = {
  render: () => {
    const { toast } = useToast();
    return (
      <div className="space-y-2">
        <Button
          onClick={() =>
            toast({
              title: 'Success!',
              description: 'Your changes have been saved.',
              variant: 'default',
            })
          }
        >
          Show Success Toast
        </Button>
        <Toaster />
      </div>
    );
  },
};

export const Destructive: Story = {
  render: () => {
    const { toast } = useToast();
    return (
      <div className="space-y-2">
        <Button
          variant="destructive"
          onClick={() =>
            toast({
              title: 'Error!',
              description: 'Something went wrong.',
              variant: 'destructive',
            })
          }
        >
          Show Error Toast
        </Button>
        <Toaster />
      </div>
    );
  },
};

export const WithAction: Story = {
  render: () => {
    const { toast } = useToast();
    return (
      <div className="space-y-2">
        <Button
          onClick={() =>
            toast({
              title: 'Undo Changes',
              description: 'Your changes have been saved.',
              action: {
                label: 'Undo',
                onClick: () => console.log('Undo'),
              },
            })
          }
        >
          Show Toast with Action
        </Button>
        <Toaster />
      </div>
    );
  },
}; 