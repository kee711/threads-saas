'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
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
    const [saved, setSaved] = useState(false);

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
        setSaved(!error);
        setEditing(false);
    };

    return (
        <div className="w-full rounded-t-xl bg-[#F8F8F8] border-b border-[#E5E5E5] px-6 pt-4 pb-2 relative">
            <div className="flex items-center justify-between cursor-pointer transition-all duration-300" onClick={() => setOpen(v => !v)}>
                <span className="font-semibold text-gray-600 text-lg">Profile description</span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ease-in-out ${
                    open ? 'rotate-180' : 'rotate-0'
                }`} />
            </div>
            <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    open ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="mt-2">
                    <textarea
                        className="w-full bg-transparent border-none resize-none text-sm text-gray-800 focus:outline-none"
                        rows={3}
                        value={desc}
                        onChange={e => { setDesc(e.target.value); setEditing(true); setSaved(false); }}
                    />
                    <div className="flex justify-end mt-1">
                        <Button
                            size="sm"
                            disabled={!editing || saving}
                            onClick={handleSave}
                            className="px-3 py-1 text-sm"
                        >
                            {saved ? 'Saved' : 'Save'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
} 