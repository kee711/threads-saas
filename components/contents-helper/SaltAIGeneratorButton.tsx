'use client';

import { Sparkles } from 'lucide-react';

interface SaltAIGeneratorButtonProps {
    onClick?: () => void;
}

export function SaltAIGeneratorButton({ onClick }: SaltAIGeneratorButtonProps) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-center gap-2 cursor-pointer group select-none bg-transparent border-none p-0 m-0"
            style={{ minHeight: 'unset' }}
        >
            <div className="flex-1 h-[2px] bg-[#B0B0B0]" />
            <span className="flex items-center gap-2 px-4 text-[#9A9A9A] font-semibold text-xl min-w-fit">
                <Sparkles className="w-6 h-6 text-[#9A9A9A]" />
                Generate 10 more topics
            </span>
            <div className="flex-1 h-[2px] bg-[#B0B0B0]" />
        </button>
    );
} 