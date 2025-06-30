'use client';

import { useState, useEffect } from 'react';
import { BadgeInfo, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

interface ProfileDescriptionDropdownProps {
    accountId: string;
    initialDescription: string;
}

export function ProfileDescriptionDropdown({ accountId, initialDescription }: ProfileDescriptionDropdownProps) {
    const [open, setOpen] = useState(false);
    const [desc, setDesc] = useState(initialDescription);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setDesc(initialDescription);
    }, [initialDescription]);

    const handleSave = async () => {
        setSaving(true);
        const supabase = createClient();
        const { error } = await supabase
            .from('social_accounts')
            .update({ account_info: desc })
            .eq('id', accountId);
        setSaving(false);
        setEditing(false);
    };

    return (
        <div className="w-full rounded-t-2xl bg-[#F8F8F8] border-b border-[#E5E5E5] px-6 pt-4 pb-2 relative transition-all duration-300">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen(v => !v)}>
                <span className="font-semibold text-gray-500 text-lg">Profile description</span>
                {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
            <div
                className={`
                    transition-all duration-300 ease-in-out overflow-hidden
                    ${open ? 'max-h-[300px] opacity-100 mt-2' : 'max-h-0 opacity-0'}
                `}
            >
                <textarea
                    className="w-full bg-transparent border-none text-sm text-gray-800 focus:outline-none resize-none min-h-[60px] max-h-[120px]"
                    value={desc}
                    onChange={e => { setDesc(e.target.value); setEditing(true); handleSave(); }}
                    rows={1}
                />
                <div className="flex justify-start mt-1 items-center">
                    <div className="rounded-full py-1 text-sm text-gray-400">
                        <BadgeInfo className="inline-block mr-1 w-4 h-4" />
                        Automatically updated as you cook contents
                    </div>
                </div>
            </div>
        </div>
    );
}