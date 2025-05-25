'use client';

import { CookingPot, LoaderCircle } from 'lucide-react';
import { ProfileDescriptionDropdown } from '@/components/contents-helper/ProfileDescriptionDropdown';
import { HeadlineInputWithTags } from '@/components/contents-helper/HeadlineInputWithTags';
import { SaltAIGeneratorButton } from '@/components/contents-helper/SaltAIGeneratorButton';
import useSocialAccountStore from '@/stores/useSocialAccountStore';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TopicFinderPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);

    const { accounts, selectedAccountId, currentUsername } = useSocialAccountStore()
    const [selectedSocialAccount, setSelectedSocialAccount] = useState('')
    const [accountInfo, setAccountInfo] = useState('')
    const [accountTags, setAccountTags] = useState<string[]>([])
    const [topicResults, setTopicResults] = useState<{ topic: string, detail?: string, loading?: boolean, dialogOpen?: boolean }[]>([])
    const [dialogOpen, setDialogOpen] = useState(false);

    // zustand의 selectedAccountId와 로컬 상태 동기화
    useEffect(() => {
        if (selectedAccountId) {
            setSelectedSocialAccount(selectedAccountId)
        }
    }, [selectedAccountId])

    // 계정 정보 로드
    useEffect(() => {
        if (!selectedSocialAccount) return

        const fetchAccountDetails = async () => {
            setIsLoading(true)
            try {
                const supabase = createClient()

                // social_accounts 테이블에서 계정 정보 로드
                const { data: accountData, error: accountError } = await supabase
                    .from('social_accounts')
                    .select('account_type, account_info, account_tags')
                    .eq('id', selectedSocialAccount)
                    .single()

                if (!accountError && accountData) {
                    setAccountInfo(accountData.account_info || '')
                    setAccountTags(accountData.account_tags || [])
                } else {
                    setAccountInfo('')
                    setAccountTags([])
                }
            } catch (error) {
                console.error('계정 정보 로드 오류:', error)
                toast.error('계정 정보를 불러오는 중 오류가 발생했습니다.')
            } finally {
                setIsLoading(false)
            }
        }

        fetchAccountDetails()
    }, [selectedSocialAccount])

    // 토픽 생성 함수
    const generateTopics = async () => {
        if (!accountInfo) {
            toast.error('No account info.');
            return;
        }
        setIsGeneratingTopics(true);
        setIsLoading(true);
        try {
            const res = await fetch('/api/generate-topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountInfo })
            });
            if (!res.ok) throw new Error('API error');
            const data = await res.json();
            const newTopics = Array.isArray(data) ? data : data.topics;

            if (!Array.isArray(newTopics)) {
                toast.error('Invalid topic result format');
                return;
            }

            // 데이터 구조 단순화
            setTopicResults(prev => {
                // newTopics가 이미 문자열 배열인 경우와 객체 배열인 경우를 모두 처리
                const updatedTopics = [
                    ...prev,
                    ...newTopics.map(topic => ({
                        topic: typeof topic === 'string' ? topic : topic.topic || '',
                        detail: undefined,
                        loading: false,
                        dialogOpen: false
                    }))
                ];
                console.log('Updated topics:', updatedTopics);
                return updatedTopics;
            });
        } catch (e) {
            console.error('Topic generation error:', e);
            toast.error('Failed to generate topics');
        } finally {
            setIsGeneratingTopics(false);
            setIsLoading(false);
        }
    };

    // 토픽 변경 핸들러 단순화
    const handleTopicChange = (idx: number, newVal: string) => {
        console.log('Updating topic at index', idx, 'with value:', newVal);
        setTopicResults(prev => {
            const updated = prev.map((t, i) =>
                i === idx ? { ...t, topic: newVal } : t
            );
            console.log('Updated topics:', updated);
            return updated;
        });
    };

    // 다이얼로그 오픈 핸들러
    const handleOpenDialog = (idx: number, open: boolean) => {
        setTopicResults(prev => prev.map((t, i) => i === idx ? { ...t, dialogOpen: open } : { ...t, dialogOpen: false }));
    };

    // 디테일 생성 핸들러
    const handleGenerateDetail = async (idx: number) => {
        setTopicResults(prev => prev.map((t, i) => i === idx ? { ...t, loading: true } : t));
        try {
            const res = await fetch('/api/generate-detail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountInfo, topic: topicResults[idx].topic })
            });
            if (!res.ok) throw new Error('API error');
            const data = await res.json();
            setTopicResults(prev => prev.map((t, i) => i === idx ? { ...t, detail: data.detail, loading: false, dialogOpen: false } : t));
        } catch (e) {
            toast.error('Failed to generate detail');
            setTopicResults(prev => prev.map((t, i) => i === idx ? { ...t, loading: false, dialogOpen: false } : t));
        }
    };

    // 토픽 결과 변경 추적
    useEffect(() => {
        console.log('Current topicResults:', topicResults);
    }, [topicResults]);

    return (
        <div className="container mx-auto py-6 h-screen">
            <div className="flex flex-col items-center justify-center h-full">
                <div className="w-full mx-auto pb-48 p-10 flex flex-col items-center overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {/* 중앙 정렬 인사말 */}
                    <div className="flex flex-row items-center gap-4 mb-8">
                        <Image src="/saltAIIcon.svg" alt="Salt AI Icon" width={48} height={48} />
                        <h2 className="text-2xl font-semibold text-left">Hi {currentUsername || 'User'},<br />What would you like to write about?</h2>
                    </div>
                    {/* Profile Description Dropdown */}
                    {selectedAccountId && (
                        <div className="w-full max-w-xl">
                            <ProfileDescriptionDropdown accountId={selectedAccountId} initialDescription={accountInfo || ''} />
                        </div>
                    )}
                    {/* Headline 입력 및 태그 */}
                    <div className="w-full max-w-3xl">
                        <HeadlineInputWithTags tags={accountTags || []} />
                    </div>

                    {/* Topics Section */}
                    <div className="w-full max-w-3xl mt-8 flex-1">
                        <div className="space-y-4">
                            {/* 토픽 결과 */}
                            {topicResults.length > 0 && (
                                <div className="flex flex-col gap-4 mb-6">
                                    {topicResults.map((t, i) => (
                                        <div key={i} className="relative">
                                            <HeadlineInputWithTags
                                                tags={[]}
                                                value={t.topic || ''}
                                                onChange={v => handleTopicChange(i, v)}
                                                hideTags
                                                inline
                                                ellipsis
                                                onCreateDetails={() => handleOpenDialog(i, true)}
                                            />
                                            <AlertDialog open={!!t.dialogOpen} onOpenChange={open => handleOpenDialog(i, open)}>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Generate post with Salt AI?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Do you want to generate a post for this topic?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleGenerateDetail(i)}
                                                        >
                                                            Generate
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                            {/* 생성 중이면 로딩 */}
                                            {t.loading && (
                                                <div className="flex flex-col items-center justify-center py-6">
                                                    <LoaderCircle className="animate-spin w-8 h-8 text-[#B0B0B0] mb-2" />
                                                    <span className="text-[#B0B0B0] text-base font-medium mt-2">Generating post...</span>
                                                </div>
                                            )}
                                            {/* 생성 결과 */}
                                            {t.detail && !t.loading && (
                                                <div className="mt-4 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl p-4 flex flex-col gap-2">
                                                    <textarea
                                                        className="w-full bg-transparent border-none resize-none text-base text-gray-900 focus:outline-none min-h-[120px]"
                                                        value={t.detail}
                                                        onChange={e => setTopicResults(prev => prev.map((tt, idx) => idx === i ? { ...tt, detail: e.target.value } : tt))}
                                                    />
                                                    <div className="flex justify-end">
                                                        <Button variant="outline" className="px-4 py-1 text-base font-semibold">+ Add</Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isGeneratingTopics && (
                                        <div className="flex flex-col items-center justify-center py-8">
                                            <LoaderCircle className="animate-spin w-8 h-8 text-[#B0B0B0] mb-2" />
                                            <span className="text-[#B0B0B0] text-base font-medium mt-2">Generating topics...</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* 토픽이 없고 생성 중일 때만 중앙에 로딩 표시 */}
                            {topicResults.length === 0 && isGeneratingTopics && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <LoaderCircle className="animate-spin w-10 h-10 text-[#B0B0B0] mb-2" />
                                    <span className="text-[#B0B0B0] text-base font-medium mt-2">Generating topics...</span>
                                </div>
                            )}
                            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <div>
                                        <SaltAIGeneratorButton onClick={() => setDialogOpen(true)} />
                                    </div>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Generate topics with Salt AI?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Do you want to generate 10 more topics using Salt AI?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={async () => {
                                                setDialogOpen(false);
                                                await generateTopics();
                                            }}
                                        >
                                            Generate
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 