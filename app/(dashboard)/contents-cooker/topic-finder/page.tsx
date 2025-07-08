'use client';

import { CookingPot, LoaderCircle, Sparkles } from 'lucide-react';
import { ProfileDescriptionDropdown } from '@/components/contents-helper/ProfileDescriptionDropdown';
import { HeadlineInput } from '@/components/contents-helper/HeadlineInput';
import useSocialAccountStore from '@/stores/useSocialAccountStore';
import { startTransition, useEffect, useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { PricingModal } from '@/components/modals/PricingModal';
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
import useThreadChainStore from '@/stores/useThreadChainStore';
import { ThreadContent } from '@/components/contents-helper/types';
import { HeadlineButtons } from '@/components/contents-helper/HeadlineButtons';
import { useTopicResultsStore } from '@/stores/useTopicResultsStore';
import { fetchAndSaveComments, fetchAndSaveMentions } from '@/app/actions/fetchComment';
import { getAllCommentsWithRootPosts, getAllMentionsWithRootPosts } from '@/app/actions/comment';
import { statisticsKeys } from '@/lib/queries/statisticsKeys';
import { fetchUserInsights, fetchTopPosts } from '@/lib/queries/statisticsQueries';

export default function TopicFinderPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
    const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
    const { setPendingThreadChain } = useThreadChainStore();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    const { accounts, currentSocialId, currentUsername, getSelectedAccount } = useSocialAccountStore()
    const [accountInfo, setAccountInfo] = useState('')
    const [accountTags, setAccountTags] = useState<string[]>([])
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedHeadline, setSelectedHeadline] = useState<string>('');
    const [givenInstruction, setGivenInstruction] = useState<string>('');

    // Memoize Supabase client to prevent creating new instances
    const supabase = useMemo(() => createClient(), []);

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


    // 백그라운드 my_contents 동기화 (페이지 로드 시 한 번만 실행)
    useEffect(() => {
        const syncMyContents = async () => {
            try {
                console.log('🔄 백그라운드에서 my_contents 동기화 시작...');
                const response = await fetch('/api/my-contents/sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ limit: 30 }),
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ my_contents 동기화 완료:', data);
                    // 선택적으로 성공 메시지 표시 (사용자에게 방해가 되지 않도록 주석 처리)
                    // toast.success(`${data.synchronized}개 게시물이 동기화되었습니다.`);
                } else {
                    console.warn('⚠️ my_contents 동기화 실패:', response.status);
                }
            } catch (error) {
                // 백그라운드 작업이므로 에러가 발생해도 사용자 경험에 영향을 주지 않음
                console.error('❌ my_contents 백그라운드 동기화 오류:', error);
            }
        };

        // 페이지 로드 시 한 번만 실행
        syncMyContents();
    }, []); // 빈 의존성 배열로 마운트 시에만 실행

    // 계정 정보 로드
    useEffect(() => {
        if (!currentSocialId) return

        const fetchAccountDetails = async () => {
            setIsLoading(true)
            try {
                const { data: accountData, error: accountError } = await supabase
                    .from('social_accounts')
                    .select('account_type, account_info, account_tags')
                    .eq('social_id', currentSocialId)
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
    }, [currentSocialId, supabase])

    // Combined prefetch for comments, mentions, and statistics
    useEffect(() => {
        if (currentSocialId) {
            const accountId = currentSocialId;
            const dateRange = 7; // topic-finder에서는 7일 데이터만 prefetch

            startTransition(() => {
                // Prefetch comments and mentions
                queryClient.prefetchQuery({
                    queryKey: ['comments'],
                    queryFn: async () => {
                        await fetchAndSaveComments();
                        return getAllCommentsWithRootPosts();
                    },
                    staleTime: 1000 * 60 * 5,
                });

                queryClient.prefetchQuery({
                    queryKey: ['mentions'],
                    queryFn: async () => {
                        await fetchAndSaveMentions();
                        return getAllMentionsWithRootPosts();
                    },
                    staleTime: 1000 * 60 * 5,
                });

                // Prefetch statistics data
                queryClient.prefetchQuery({
                    queryKey: statisticsKeys.userInsights(accountId, dateRange),
                    queryFn: () => fetchUserInsights(accountId, dateRange),
                    staleTime: 5 * 60 * 1000,
                });

                queryClient.prefetchQuery({
                    queryKey: statisticsKeys.topPosts(accountId),
                    queryFn: () => fetchTopPosts(accountId),
                    staleTime: 10 * 60 * 1000,
                });

                console.log('✅ Comments 데이터 prefetch 완료');
                console.log('✅ Mentions 데이터 prefetch 완료');
                console.log('✅ Statistics 데이터 prefetch 완료 (7일)');
            });
        }
    }, [currentSocialId, queryClient]);

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
    // instruction 변경 핸들러
    const handleInstructionChange = (v: string) => {
        setGivenInstruction(v);
    };

    // 다이얼로그 오픈 핸들러
    const handleOpenDialog = (idx: number, open: boolean) => {
        setDialogOpenStore(idx, open);
    };

    // 디테일 생성 핸들러 - Generate thread chain instead of single post
    const handleGenerateDetail = async () => {
        if (!selectedHeadline) {
            toast.error('Please write or add a topic');
            return;
        }
        setTopicLoading(selectedHeadline, true);
        setIsGeneratingDetails(true);
        try {
            const res = await fetch('/api/generate-detail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountInfo, topic: selectedHeadline, instruction: givenInstruction })
            });
            if (!res.ok) throw new Error('API error');
            const data = await res.json();

            // Convert generated threads to ThreadContent format
            const threadChain: ThreadContent[] = data.threads.map((content: string) => ({
                content,
                media_urls: [],
                media_type: 'TEXT' as const
            }));

            // Set pending thread chain in store
            setPendingThreadChain(threadChain);

            // Store detail for UI feedback
            setTopicDetail(selectedHeadline, data.threads.join('\n\n'));

            toast.success(`Generated ${threadChain.length} threads! Check the writing sidebar to publish.`);
        } catch (e) {
            toast.error('Failed to generate thread chain');
            setTopicLoading(selectedHeadline, false);
        } finally {
            setIsGeneratingDetails(false);
        }
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
                    <div className="flex flex-row items-center gap-4 mb-6 mt-16">
                        <Image src="/saltAIIcon.svg" alt="Salt AI Icon" width={48} height={48} />
                        <h2 className="text-2xl font-semibold text-left">Hi {currentUsername || 'User'},<br />What would you like to write about?</h2>
                    </div>
                    {/* Profile Description Dropdown */}
                    {currentSocialId && (
                        <div className="w-full mt-3 flex justify-between max-w-80 transition-all duration-300 xs:max-w-xs sm:max-w-xl">
                            <ProfileDescriptionDropdown accountId={currentSocialId} initialDescription={accountInfo || ''} />
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
                                            onInstructionChange={handleInstructionChange}
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