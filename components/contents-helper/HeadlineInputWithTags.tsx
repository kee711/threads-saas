'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeadlineInputWithTagsProps {
    tags: string[];
    value?: string;
    readOnly?: boolean;
    onChange?: (v: string) => void;
    hideTags?: boolean;
    inline?: boolean;
    ellipsis?: boolean;
    onCreateDetails?: () => void;
}

export function HeadlineInputWithTags({ tags, value, readOnly, onChange, hideTags, inline, ellipsis, onCreateDetails }: HeadlineInputWithTagsProps) {
    const [headline, setHeadline] = useState<string>(typeof value === 'string' ? value : '');
    const [placeholder, setPlaceholder] = useState('Write headline...');

    useEffect(() => {
        if (value !== undefined) setHeadline(value);
    }, [value]);

    useEffect(() => {
        console.log('HeadlineInputWithTags tags:', tags);
    }, [tags]);

    const handleChange = (v: string) => {
        setHeadline(v);
        onChange?.(v);
    };

    if (inline) {
        return (
            <div className="w-full bg-white rounded-xl border border-[#E5E5E5] px-6 py-3 flex flex-row items-center gap-3 shadow-sm">
                <input
                    type="text"
                    value={headline}
                    onChange={e => handleChange(e.target.value)}
                    placeholder={placeholder}
                    className={
                        `flex-1 bg-transparent text-lg font-medium placeholder-[#B0B0B0] outline-none px-2 py-1 ` +
                        (ellipsis ? 'overflow-hidden whitespace-nowrap text-ellipsis' : '')
                    }
                    readOnly={readOnly}
                />
                <Button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold text-base"
                    style={{ background: headline ? '#111' : '#B0B0B0' }}
                    disabled={!headline}
                    onClick={onCreateDetails}
                >
                    <Sparkles className="w-5 h-5" />
                    Create details
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-xl border border-[#E5E5E5] px-6 py-5 flex flex-col gap-3 shadow-sm">
            <input
                type="text"
                value={headline}
                onChange={e => handleChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent text-lg font-medium placeholder-[#B0B0B0] outline-none px-2 py-1"
                readOnly={readOnly}
            />
            <div className="flex items-center gap-2 flex-wrap">
                {!hideTags && tags.map(tag => (
                    <span
                        key={tag}
                        className="bg-[#F2F2F2] text-gray-700 rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2 cursor-pointer"
                        onClick={() => handleChange(tag)}
                    >
                        {tag}
                    </span>
                ))}
                <div className="flex-1" />
                <Button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold text-base"
                    style={{ background: headline.trim() ? '#111' : '#B0B0B0' }}
                    disabled={!headline.trim()}
                    onClick={onCreateDetails}
                >
                    <Sparkles className="w-5 h-5" />
                    Create details
                </Button>
            </div>
        </div>
    );
} 