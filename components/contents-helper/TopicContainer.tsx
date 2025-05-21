'use client';

import { WandSparkles } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TopicContainerProps {
    onSubmit?: (topic: string) => void;
}

export function TopicContainer({ onSubmit }: TopicContainerProps) {
    const [topic, setTopic] = useState('');

    const handleSubmit = () => {
        if (topic.trim() && onSubmit) {
            onSubmit(topic);
        }
    };

    return (
        <div className="h-[88px] rounded-lg p-4 flex items-center justify-between bg-white">
            <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Write Headline"
                className="bg-transparent text-2xl font-semibold placeholder-[#9A9A9A] flex-1 outline-none overflow-hidden text-ellipsis"
            />
            <button
                onClick={handleSubmit}
                disabled={!topic.trim()}
                className={cn(
                    "flex items-center gap-2 px-12 py-4 rounded-lg",
                    topic.trim() ? "bg-[#454545]" : "bg-[#9A9A9A]"
                )}
            >
                <WandSparkles className="w-6 h-6 text-white" />
                <span className="text-white">Get Details</span>
            </button>
        </div>
    );
} 