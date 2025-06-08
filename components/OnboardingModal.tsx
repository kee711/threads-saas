'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from 'next-auth/react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

// 온보딩 단계 타입
type OnboardingStep = 'account_type' | 'account_info' | 'welcome';

// 계정 유형 타입
type AccountType = 'biz' | 'expert' | 'casual';

// 온보딩 모달 Props
interface OnboardingModalProps {
    open: boolean;
    onClose: () => void;
    socialAccountId: string;
}

export function OnboardingModal({ open, onClose, socialAccountId }: OnboardingModalProps) {
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('account_type');
    const [accountType, setAccountType] = useState<AccountType | null>(null);
    const [accountInfo, setAccountInfo] = useState('');
    const [tags, setTags] = useState<string[]>(['AI', 'Design', 'Tech', 'Mobile', 'App']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data: session } = useSession();
    const router = useRouter();

    // 계정 유형 선택 핸들러
    const handleAccountTypeSelect = (type: AccountType) => {
        setAccountType(type);
        if (type === 'casual') {
            // 캐주얼 타입은 info 입력 단계를 건너뛰고 환영 단계로
            setCurrentStep('welcome');
        } else {
            setCurrentStep('account_info');
        }
    };

    // 이전 단계로 이동 핸들러
    const handlePrevious = () => {
        if (currentStep === 'account_info') {
            setCurrentStep('account_type');
        } else if (currentStep === 'welcome') {
            // accountType이 'casual'인 경우 직접 account_type으로, 아닌 경우 account_info로
            setCurrentStep(accountType === 'casual' ? 'account_type' : 'account_info');
        }
    };

    // 온보딩 스킵 핸들러
    const handleSkip = async () => {
        if (currentStep === 'welcome') {
            await completeOnboarding();
        } else {
            // 스킵 시 확인 모달 표시가 필요하다면 여기에 구현
            const confirmSkip = window.confirm('나중에 설정 페이지에서 이 정보를 입력할 수 있습니다. 건너뛰시겠습니까?');
            if (confirmSkip) {
                if (currentStep === 'account_type') {
                    // 계정 유형 스킵, welcome 단계로 이동
                    setCurrentStep('welcome');
                } else if (currentStep === 'account_info') {
                    // 계정 정보 스킵, welcome 단계로 이동
                    setCurrentStep('welcome');
                }
            }
        }
    };

    // 온보딩 완료 핸들러
    const completeOnboarding = async () => {
        if (!session?.user?.id || !socialAccountId) {
            toast.error('사용자 정보를 찾을 수 없습니다.');
            return;
        }

        setIsSubmitting(true);

        try {
            const supabase = createClient();

            // 온보딩 상태 및 계정 정보를 social_accounts 테이블에 직접 업데이트
            const { error: updateError } = await supabase
                .from('social_accounts')
                .update({
                    onboarding_completed: true,
                    account_type: accountType || null,
                    account_info: accountInfo.trim() || null,
                    account_tags: tags.length > 0 ? tags : null
                })
                .eq('id', socialAccountId);

            if (updateError) throw updateError;

            toast.success('온보딩이 완료되었습니다.');
            onClose();

            // '/contents-cooker/topic-finder'로 리다이렉트
            router.push('/contents-cooker/topic-finder');
        } catch (error) {
            console.error('온보딩 저장 오류:', error);
            toast.error('온보딩 정보 저장 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 태그 추가 핸들러
    const addTag = (tag: string) => {
        if (!tags.includes(tag) && tag.trim() !== '') {
            setTags([...tags, tag]);
        }
    };

    // 태그 삭제 핸들러
    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    // AI 태그 생성 - 실제로는 OpenAI API 연동 필요
    const generateTags = async () => {
        // 실제 구현에서는 OpenAI 호출하여 태그 생성
        // 지금은 임시로 기본 태그 설정
        setTags(['AI', 'Design', 'Tech', 'Mobile', 'App']);
        toast.success('키워드가 생성되었습니다.');
    };

    // 다음 버튼 핸들러
    const handleNext = () => {
        if (currentStep === 'account_info') {
            setCurrentStep('welcome');
        } else if (currentStep === 'welcome') {
            completeOnboarding();
        }
    };

    // 계정 타입에 따른 타이틀과 힌트
    const getInfoTitleAndHint = () => {
        if (accountType === 'biz') {
            return {
                title: '어떤 분야의 계정인가요?',
                hint: 'ViralChef is the master chef of promotion on social media. We blend the ingredients people love to craft strategies that highlight your brand, build close-knit communities, and drive growth—smart, swift, and always friendly.'
            };
        } else {
            return {
                title: '어떤 분야의 전문가인가요?',
                hint: 'I\'m a marketer with 7 years of experience. I\'ve partnered with global companies and repeatedly led localization strategies that helped U.S. brands expand into the Asia-Pacific region. My expertise lies in crafting digital experiences that transcend borders and languages.'
            };
        }
    };

    // 현재 단계에 따른 컨텐츠 렌더링
    const renderStepContent = () => {
        switch (currentStep) {
            case 'account_type':
                return (
                    <>
                        <DialogHeader className="text-center">
                            <DialogTitle className="text-2xl font-bold">이 Threads 계정을 어떻게 활용하실 건가요?</DialogTitle>
                            <DialogDescription className="pt-2">
                                Threads 계정을 성장시키는데 도움이 되는 몇 가지 질문을 드리겠습니다.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4 px-8">
                            {/* 비즈니스 마케팅 옵션 */}
                            <Button
                                variant={accountType === 'biz' ? 'default' : 'outline'}
                                className="justify-start p-4 h-auto"
                                onClick={() => handleAccountTypeSelect('biz')}
                            >
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-bold text-lg">비즈니스 마케팅 채널</span>
                                    <span className="text-sm text-muted-foreground">잠재 고객 참여 및 매출 증대</span>
                                </div>
                            </Button>

                            {/* 전문가 옵션 */}
                            <Button
                                variant={accountType === 'expert' ? 'default' : 'outline'}
                                className="justify-start p-4 h-auto"
                                onClick={() => handleAccountTypeSelect('expert')}
                            >
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-bold text-lg">전문가</span>
                                    <span className="text-sm text-muted-foreground">전문 지식 공유</span>
                                </div>
                            </Button>

                            {/* 일반 사용자 옵션 */}
                            <Button
                                variant={accountType === 'casual' ? 'default' : 'outline'}
                                className="justify-start p-4 h-auto"
                                onClick={() => handleAccountTypeSelect('casual')}
                            >
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-bold text-lg">일반</span>
                                    <span className="text-sm text-muted-foreground">대화 및 소통</span>
                                </div>
                            </Button>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleSkip}>
                                나중에 하기
                            </Button>
                        </DialogFooter>
                    </>
                );

            case 'account_info':
                const { title, hint } = getInfoTitleAndHint();
                return (
                    <>
                        <DialogHeader className="text-center">
                            <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
                            <DialogDescription className="pt-2">
                                직접 작성해주시면 SaltAI가 완벽한 키워드를 생성해드립니다.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4 px-8">
                            <div>
                                <Textarea
                                    placeholder={hint}
                                    value={accountInfo}
                                    onChange={(e) => setAccountInfo(e.target.value)}
                                    className="min-h-[150px]"
                                />
                            </div>

                            <div className="mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-semibold">키워드</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={generateTags}
                                    >
                                        SaltAI 생성
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-2">
                                    {tags.map((tag, index) => (
                                        <Badge key={index} variant="secondary" className="px-3 py-1">
                                            {tag}
                                            <button
                                                onClick={() => removeTag(tag)}
                                                className="ml-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        placeholder="새 태그 추가"
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                            if (e.key === 'Enter') {
                                                addTag((e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                            const input = e.currentTarget.previousSibling as HTMLInputElement;
                                            addTag(input.value);
                                            input.value = '';
                                        }}
                                    >
                                        추가
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={handlePrevious}>
                                이전
                            </Button>
                            <Button variant="outline" onClick={handleSkip}>
                                나중에 하기
                            </Button>
                            <Button onClick={handleNext} disabled={isSubmitting}>
                                다음
                            </Button>
                        </DialogFooter>
                    </>
                );

            case 'welcome':
                return (
                    <>
                        <DialogHeader className="text-center">
                            <DialogTitle className="text-2xl font-bold">ViralChef의 주방에 오신 것을 환영합니다!</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center py-8 px-8">
                            <Image
                                src="/welcome-chef.png"
                                alt="Welcome"
                                width={200}
                                height={200}
                                className="mb-4"
                            />
                            <p className="text-center text-muted-foreground">
                                이제 스레드 계정을 효과적으로 관리하고 성장시키는 데 필요한 모든 도구를 사용할 수 있습니다.
                            </p>
                        </div>
                        <DialogFooter className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={handlePrevious}>
                                이전
                            </Button>
                            <Button onClick={completeOnboarding} disabled={isSubmitting}>
                                시작하기
                            </Button>
                        </DialogFooter>
                    </>
                );
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            // 닫기 버튼 클릭 시 onClose 콜백 호출
            if (!isOpen) {
                // 여기서는 자동으로 닫히지 않도록 함
                const confirmClose = window.confirm('온보딩을 건너뛰시겠습니까? 설정 페이지에서 나중에 완료할 수 있습니다.');
                if (confirmClose) {
                    onClose();
                }
            }
        }}>
            <DialogContent className="sm:max-w-[750px]">
                <div className="flex-col">
                    <div className="mb-4 flex items-center justify-center">
                        <div className={`flex items-center justify-center w-8 h-8 ${currentStep === 'account_type' || currentStep === 'account_info' || currentStep === 'welcome' ? 'bg-primary text-primary-foreground' : 'bg-gray-200'} rounded-full text-sm font-medium`}>
                            1
                        </div>
                        <div className="mx-2 h-1 w-16 bg-gray-200">
                            <div
                                className="h-1 bg-primary"
                                style={{ width: currentStep === 'account_type' ? '0%' : currentStep === 'account_info' || currentStep === 'welcome' ? '100%' : '0%' }}
                            ></div>
                        </div>
                        <div className={`flex items-center justify-center w-8 h-8 ${currentStep === 'account_info' || currentStep === 'welcome' ? 'bg-primary text-primary-foreground' : 'bg-gray-200'} rounded-full text-sm font-medium`}>
                            2
                        </div>
                        <div className="mx-2 h-1 w-16 bg-gray-200">
                            <div
                                className="h-1 bg-primary"
                                style={{ width: currentStep === 'welcome' ? '100%' : '0%' }}
                            ></div>
                        </div>
                        <div className={`flex items-center justify-center w-8 h-8 ${currentStep === 'welcome' ? 'bg-primary text-primary-foreground' : 'bg-gray-200'} rounded-full text-sm font-medium`}>
                            3
                        </div>
                    </div>

                    {/* 모달 내용 */}
                    <div className="min-h-[400px] flex flex-col">
                        {renderStepContent()}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 