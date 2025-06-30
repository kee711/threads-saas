'use client';

import { useState, useEffect } from 'react';

interface HeadlineInputProps {
    value?: string;
    readOnly?: boolean;
    onChange?: (v: string) => void;
    inline?: boolean;
    ellipsis?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
    onInstructionChange?: (v: string) => void;
}

export function HeadlineInput({ value, readOnly, onChange, inline, ellipsis, isSelected, onClick, onInstructionChange }: HeadlineInputProps) {
    const [headline, setHeadline] = useState<string>(typeof value === 'string' ? value : '');
    const [instruction, setInstruction] = useState<string>('');
    const [placeholder, setPlaceholder] = useState('Write headline...');

    useEffect(() => {
        if (value !== undefined) setHeadline(value);
    }, [value]);

    const handleChange = (v: string) => {
        setHeadline(v);
        onChange?.(v);
    };

    if (inline) {
        return (
            <div onClick={onClick} className={`w-full rounded-[20px] px-6 py-3 flex flex-row items-start gap-3 shadow-sm cursor-pointer transition-all duration-300 ${isSelected ? 'border border-gray-200 bg-gray-200 flex-wrap' : 'border-none bg-gray-50'}`}>
                <div
                    className={
                        `text-lg font-medium placeholder-[#B0B0B0] outline-none px-2 py-1 cursor-pointer transition-all duration-300 ` +
                        (isSelected ? 'text-gray-700 whitespace-normal' : 'text-gray-500 overflow-hidden whitespace-nowrap text-ellipsis')
                    }
                >
                    {headline}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl">
            <div className={`w-full bg-white rounded-[20px] border border-[#E5E5E5] px-4 py-3 flex flex-col gap-1 shadow-sm`}>
                <input
                    type="text"
                    value={headline}
                    onChange={e => handleChange(e.target.value)}
                    placeholder={placeholder}
                    // 텍스트 줄바꿈 처리, 높이 자동으로 늘어나게 처리
                    className="w-full h-fit bg-transparent text-lg font-medium placeholder-[#B0B0B0] outline-none px-2 py-1 whitespace-pre-wrap"
                    readOnly={readOnly}
                    onClick={onClick}
                />
                <input
                    type="text"
                    value={instruction}
                    onChange={e => setInstruction(e.target.value)}
                    placeholder="Write instruction..."
                    className="w-full bg-transparent text-sm font-medium text-gray-500 placeholder-[#B0B0B0] outline-none px-2 py-1"
                    readOnly={readOnly}
                />

            </div>

        </div>
    );
} 