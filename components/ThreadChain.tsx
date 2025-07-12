"use client";

import { PostCard } from "@/components/PostCard";
import { ThreadContent } from "@/app/actions/threadChain";

interface ThreadChainProps {
  threads: ThreadContent[];
  variant?: 'default' | 'writing';
  avatar?: string;
  username?: string;
  // Writing variant props
  onThreadContentChange?: (index: number, content: string) => void;
  onThreadMediaChange?: (index: number, media_urls: string[]) => void;
  onAddThread?: () => void;
  onRemoveThread?: (index: number) => void;
  onAiClick?: () => void;
  // Default variant props
  className?: string;
}

export function ThreadChain({
  threads,
  variant = 'default',
  avatar,
  username,
  onThreadContentChange,
  onThreadMediaChange,
  onAddThread,
  onRemoveThread,
  onAiClick,
  className = ''
}: ThreadChainProps) {
  const isWriting = variant === 'writing';

  return (
    <div className={`thread-chain ${className}`}>
      {threads.map((thread, index) => (
        <PostCard
          key={`thread-${index}`}
          variant={isWriting ? "writing" : "default"}
          avatar={avatar}
          username={username || ''}
          content={thread.content}
          onContentChange={isWriting ? (content) => onThreadContentChange?.(index, content) : undefined}
          media={thread.media_urls || []}
          onMediaChange={isWriting ? (media) => onThreadMediaChange?.(index, media) : undefined}
          onAiClick={isWriting ? onAiClick : undefined}
          // Thread chain specific props
          isPartOfChain={true}
          threadIndex={index}
          showAddThread={isWriting && index === threads.length - 1}
          onAddThread={isWriting ? onAddThread : undefined}
          onRemoveThread={isWriting && index > 0 ? () => onRemoveThread?.(index) : undefined}
          isLastInChain={index === threads.length - 1}
        />
      ))}
    </div>
  );
}