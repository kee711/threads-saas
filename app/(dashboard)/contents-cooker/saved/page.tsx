'use client'

import { useState, useEffect, useTransition } from "react";
import { ContentList } from "@/components/contents-helper/ContentList";
import { OembedList } from "@/components/contents-cooker/OembedList";
import { saveOembedContentFromUrl } from '@/app/actions/oembed';
import useSocialAccountStore from '@/stores/useSocialAccountStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

export default function SavedPage() {
    const [activeTab, setActiveTab] = useState<"saved" | "draft">("saved");
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();
    const [url, setUrl] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const { currentSocialId } = useSocialAccountStore();

    function isValidThreadsUrl(url: string): boolean {
        const regex = /^https:\/\/www\.threads\.com\/@[\w.-]+\/post\/[\w-]+$/;
        return regex.test(url);
    }

    const handleAddUrl = () => {
        if (!isValidThreadsUrl(url)) {
            setError("유효한 Threads URL을 입력해주세요.(예: https://www.threads.com/@username/post/shortcode)");
            return;
        }

        if (!currentSocialId) {
            setError("소셜 계정을 선택해주세요");
            return;
        }
        
        setError(""); // 이전 에러 지우기
        startTransition(async () => {
            try {
                await saveOembedContentFromUrl(url, currentSocialId);
                setUrl("");
                setRefreshKey(prev => prev + 1); // 리렌더링 유도
                toast.success("성공적으로 저장되었습니다.");
            } catch (err) {
                console.error(err);
                toast.error("저장 중 오류가 발생했습니다.");
            }
        });
    };

    return (
        <div className="h-full w-full overflow-hidden flex flex-col p-6">
            <h1 className="text-3xl font-bold text-zinc-700 mb-6">Saved</h1>

            <div className="flex space-x-2 mb-6">
                <Button
                    variant={activeTab === "saved" ? "default" : "outline"}
                    onClick={() => setActiveTab("saved")}
                >
                    Saved
                </Button>
                <Button
                    variant={activeTab === "draft" ? "default" : "outline"}
                    onClick={() => setActiveTab("draft")}
                >
                    Draft
                </Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-gray-50 rounded-[32px] p-6 overflow-hidden">
                {activeTab === "saved" ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex flex-col gap-4 mb-6 bg-white p-4 rounded-[20px]">
                            <div className="flex gap-2 items-center">
                                <div className="text-lg font-bold">Add by URL</div>
                                <p className="text-sm text-muted-foreground">
                                    Add threads content by url.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    id="url"
                                    placeholder="https://threads.net/..."
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                                <Button onClick={handleAddUrl} disabled={isPending}>
                                    {isPending ? "Saving..." : "Add by URL"}
                                </Button>
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <OembedList key={refreshKey} />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden">
                        <ContentList category="saved" title="Saved" />
                    </div>
                )}
            </div>
        </div>
    );
} 