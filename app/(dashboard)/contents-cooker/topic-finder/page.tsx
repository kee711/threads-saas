'use client';

import { CookingPot, LoaderCircle, Sparkles } from 'lucide-react';
import { ProfileDescriptionDropdown } from '@/components/contents-helper/ProfileDescriptionDropdown';
import { HeadlineInput } from '@/components/contents-helper/HeadlineInput';
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
import useSelectedPostsStore from '@/stores/useSelectedPostsStore';
import { HeadlineButtons } from '@/components/contents-helper/HeadlineButtons';
import { useTopicResultsStore } from '@/stores/useTopicResultsStore';

export default function TopicFinderPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
    const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
    const addPost = useSelectedPostsStore(state => state.addPost);

    const { accounts, selectedAccountId, currentUsername } = useSocialAccountStore()
    const [selectedSocialAccount, setSelectedSocialAccount] = useState('')
    const [accountInfo, setAccountInfo] = useState('')
    const [accountTags, setAccountTags] = useState<string[]>([])
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedHeadline, setSelectedHeadline] = useState<string>('');

    // topicResults zustand store
    const {
      topicResults,
      setTopicResults,
      addTopicResults,
      updateTopicResult,
      setTopicLoading,
      setTopicDetail,
      setDialogOpen: setDialogOpenStore,
      removeTopicResult,
      clearTopicResults
    } = useTopicResultsStore();

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
            addTopicResults(
                newTopics.map((topic: any) => ({
                    topic: typeof topic === 'string' ? topic : topic.topic || '',
                    detail: undefined,
                    loading: false,
                    dialogOpen: false
                }))
            );
        } catch (e) {
            console.error('Topic generation error:', e);
            toast.error('Failed to generate topics');
        } finally {
            setIsGeneratingTopics(false);
            setIsLoading(false);
        }
    };

    // 토픽 변경 핸들러
    const handleTopicChange = (idx: number, newVal: string) => {
        updateTopicResult(idx, newVal);
    };

    // 다이얼로그 오픈 핸들러
    const handleOpenDialog = (idx: number, open: boolean) => {
        setDialogOpenStore(idx, open);
    };

    // 디테일 생성 핸들러
    const handleGenerateDetail = async () => {
        if (!selectedHeadline) {
            toast.error('Please write or add a topic');
            return;
        }
        if (useSelectedPostsStore.getState().selectedPosts.length >= 3) {
            toast.error('You can only add up to 3 posts.');
            return;
        }
        setTopicLoading(selectedHeadline, true);
        setIsGeneratingDetails(true);
        try {
            const res = await fetch('/api/generate-detail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountInfo, topic: selectedHeadline })
            });
            if (!res.ok) throw new Error('API error');
            const data = await res.json();
            setTopicDetail(selectedHeadline, data.detail || '');
            handleAddPost(selectedHeadline, data.detail || '');
        } catch (e) {
            toast.error('Failed to generate detail');
            setTopicLoading(selectedHeadline, false);
        } finally {
            setIsGeneratingDetails(false);
        }
    };

    // 토픽을 선택된 포스트에 추가
    const handleAddPost = (topic: string, detail: string) => {
        const post = {
            id: `${Date.now()}`,
            content: detail,
            url: topic
        };
        addPost(post);
        toast.success('포스트가 추가되었습니다.');
    };

    useEffect(() => {
        // 필요시 topicResults 변경 추적
        // console.log('Current topicResults:', topicResults);
    }, [topicResults]);

    return (
        <div className="p-4 md:p-6 h-screen">
            <div className="flex flex-col items-center justify-center h-full">
                <div className="w-full mx-auto pb-48 flex flex-col items-center overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {/* 중앙 정렬 인사말 */}
                    <div className="flex flex-row items-center gap-4 mb-8">
                        <Image src="/saltAIIcon.svg" alt="Salt AI Icon" width={48} height={48} />
                        <h2 className="text-2xl font-semibold text-left">Hi {currentUsername || 'User'},<br />What would you like to write about?</h2>
                    </div>
                    {/* Profile Description Dropdown */}
                    {selectedAccountId && (
                        <div className="w-full mt-3 flex justify-between max-w-80 transition-all duration-300 xs:max-w-xs sm:max-w-xl">
                            <ProfileDescriptionDropdown accountId={selectedAccountId} initialDescription={accountInfo || ''} />
                        </div>
                    )}
                    {/* Headline 입력 및 태그 */}
                    <div className="w-full max-w-3xl">
                        <HeadlineInput value={selectedHeadline} onChange={setSelectedHeadline} />
                    </div>

                    {/* Headline Buttons */}
                    <div className="w-full max-w-3xl flex-1">
                        <HeadlineButtons
                            tags={accountTags}
                            onClickTag={v => setSelectedHeadline(v)}
                            onCreateDetails={handleGenerateDetail}
                            onGenerateTopics={generateTopics}
                            IsIdeasLoading={isGeneratingTopics}
                            IsCreateDetailsLoading={isGeneratingDetails}
                            hasHeadline={!!selectedHeadline}
                            hasTopics={topicResults.length > 0}
                            onTopicDelete={removeTopicResult} // Clear all topics
                        />
                    </div>

                    {/* Topics Section */}
                    <div className="w-full max-w-3xl mt-6 flex-1">
                        <div className="space-y-4">
                            {/* 토픽 결과 */}
                            <div className="flex flex-col gap-4 mb-6">
                                {topicResults.length > 0 && topicResults.map((t, i) => (
                                    <div key={i} className="relative">
                                        <HeadlineInput
                                            value={t.topic || ''}
                                            onChange={v => handleTopicChange(i, v)}
                                            inline
                                            ellipsis
                                            isSelected={selectedHeadline === t.topic}
                                            onClick={() => setSelectedHeadline(t.topic)}
                                        />
                                    </div>
                                ))}
                                {isGeneratingTopics && (
                                    <div className="flex flex-col gap-4 max-w-3xl">
                                        <div className="w-3/4 h-[48px] rounded-[20px] bg-gray-300 animate-pulse" />
                                        <div className="w-1/2 h-[48px] rounded-[20px] bg-gray-300 animate-pulse" />
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}