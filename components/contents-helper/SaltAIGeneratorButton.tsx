'use client';

import { WandSparkles } from 'lucide-react';

interface SaltAIGeneratorButtonProps {
    onClick?: () => void;
}

export function SaltAIGeneratorButton({ onClick }: SaltAIGeneratorButtonProps) {
    return (
        <button
            onClick={onClick}
            className="w-full h-[92px] rounded-lg border-[#777777] border-dashed border-[12px] flex items-center justify-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
        >
            <WandSparkles className="w-8 h-8 text-[#9A9A9A]" />
            <span className="text-[#9A9A9A]">Get 10 more from Salt AI</span>
        </button>
    );
} 