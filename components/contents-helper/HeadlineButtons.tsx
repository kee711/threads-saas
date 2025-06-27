import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '../ui/button';
import { Dices, Sparkles, Trash } from 'lucide-react';
import { useState } from 'react';
import { on } from 'node:events';
import { hash } from 'node:crypto';
import { X } from 'lucide-react';

interface HeadlineButtonsProps {
  tags: string[];
  onCreateDetails: () => void;
  onGenerateTopics: () => void;
  onClickTag: (v: string) => void;
  IsIdeasLoading?: boolean;
  IsCreateDetailsLoading?: boolean;
  hasHeadline?: boolean;
  hasTopics?: boolean;
  onTopicDelete?: () => void;
}

export function HeadlineButtons({ tags, onCreateDetails, onGenerateTopics, onClickTag, IsIdeasLoading, IsCreateDetailsLoading, hasHeadline, hasTopics, onTopicDelete }: HeadlineButtonsProps) {
  return (
    <div className="w-full max-w-3xl flex justify-between items-center mt-3 flex-wrap">
      <div className="flex items-center gap-1.5 flex-wrap">
        {tags.map((tag, idx) => (
          <span
            key={tag}
            className="bg-[#F2F2F2] text-gray-500 rounded-full px-3 py-2 text-sm font-semibold cursor-pointer flex items-center gap-1"
            onClick={() => onClickTag(tag)}
          >
            {tag}
          </span>
        ))}
        <div className="flex-1" />
      </div>
      <div className="flex gap-2">
        {hasTopics && (
          <Button
            onClick={onTopicDelete}
            className='rounded-full'
          >
            <Trash className="w-4 h-4" />
          </Button>
        )}
        <Button
          onClick={onGenerateTopics}
          disabled={IsIdeasLoading}
          className={`
            bg-black rounded-full py-2 px-3 flex justify-center gap-1.5 cursor-pointer relative overflow-hidden
            ${IsIdeasLoading ? 'animate-pulse' : ''}
          `}
        >
          <Dices className="w-4 h-4 text-white" />
          <span className="font-semibold text-sm text-white">
            Ideas
          </span>
        </Button>
        <Button
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded-full text-white font-semibold text-sm relative overflow-hidden
            ${IsCreateDetailsLoading ? 'animate-pulse' : ''} ${!hasHeadline ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}
          `}
          onClick={onCreateDetails}
          disabled={!hasHeadline || IsCreateDetailsLoading}
        >
          <Sparkles className="w-4 h-4" />
          Create details
        </Button>
      </div>
    </div>
  );
}