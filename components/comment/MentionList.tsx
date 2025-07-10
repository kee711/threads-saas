"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ContentItem } from "../contents-helper/types";
import {
    getAllMentionsWithRootPosts,
    postComment,
    markMentionAsReplied,
} from "@/app/actions/comment";
import { fetchAndSaveMentions } from "@/app/actions/fetchComment";
import { Sparkles, ArrowUp, BadgeCheck, Loader } from "lucide-react";
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useSocialAccountStore from "@/stores/useSocialAccountStore";
import Link from "next/link";

interface Comment {
    id: string;
    text: string;
    username: string;
    timestamp: string;
    replies: PostComment[];
    is_replied: boolean;
    root_post: string;
    root_post_content?: ContentItem;
}

interface PostComment {
    media_type: string;
    text: string;
    reply_to_id: string;
}

export function MentionList() {
    const { currentSocialId, currentUsername } = useSocialAccountStore();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    const textareaRefs = useRef<Record<string, HTMLTextAreaElement>>({});

    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery<{
        mentions: Comment[];
        hiddenMentions: string[];
    }>({
        queryKey: ['mentions', currentSocialId],
        queryFn: async () => {
            await fetchAndSaveMentions();
            const result = await getAllMentionsWithRootPosts();
            return result;
        },
        staleTime: 1000 * 60 * 5,
    });

    const mentions = data?.mentions ?? [];
    const hiddenMentions = data?.hiddenMentions ?? [];

    const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
    const [aiGenerating, setAiGenerating] = useState<Record<string, boolean>>({});
    const [sending, setSending] = useState<Record<string, boolean>>({});

    // Filter mentions that haven't been replied to
    const visibleMentions = mentions.filter((mention) => !hiddenMentions.includes(mention.id));
    const remainingMentions = visibleMentions.length;


    // Auto resize textarea
    const autoResize = useCallback((textarea: HTMLTextAreaElement) => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }, []);

    // Handle textarea change with auto resize
    const handleTextareaChange = (mentionId: string, value: string) => {
        setReplyTexts(prev => ({ ...prev, [mentionId]: value }));
        const textarea = textareaRefs.current[mentionId];
        if (textarea) {
            autoResize(textarea);
        }
    };




    // Reply mutation (기존 로직 유지)
    const replyMutation = useMutation({
        mutationFn: async ({ mentionId, reply }: { mentionId: string, reply: PostComment }) => {
            await postComment(reply);
            await markMentionAsReplied(mentionId, reply);
            return { mentionId, reply };
        },
        onMutate: async ({ mentionId, reply }) => {
            await queryClient.cancelQueries({ queryKey: ['mentions', currentSocialId] });
            const previousData = queryClient.getQueryData(['mentions', currentSocialId]);

            queryClient.setQueryData(['mentions', currentSocialId], (old: {
                mentions: Comment[];
                hiddenMentions: string[];
            }) => ({
                ...old,
                mentions: old.mentions.map((mention: Comment) =>
                    mention.id === mentionId
                        ? {
                            ...mention,
                            replies: [...(mention.replies || []), reply],
                            is_replied: true
                        }
                        : mention
                ),
                hiddenMentions: [...old.hiddenMentions, mentionId]
            }));

            return { previousData };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(['mentions', currentSocialId], context?.previousData);
            toast.error("답글 전송에 실패했습니다.");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mentions', currentSocialId] });
            toast.success("답글이 성공적으로 전송되었습니다!");
        }
    });

    // Handle AI reply generation
    const generateAIReply = async (mentionText: string, mentionId: string) => {
        console.log('Starting AI reply generation for mention:', mentionId);
        setAiGenerating(prev => ({ ...prev, [mentionId]: true }));

        try {
            const mention = visibleMentions.find(m => m.id === mentionId);
            const postContent = mention?.root_post_content?.content || '';

            console.log('Request data:', { commentText: mentionText, postContent });

            const response = await fetch('/api/generate-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commentText: mentionText,
                    postContent: postContent
                })
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API error response:', errorData);
                throw new Error(errorData.error || 'AI generation failed');
            }

            const { reply } = await response.json();
            console.log('Generated reply:', reply);

            setReplyTexts(prev => ({ ...prev, [mentionId]: reply }));

            // Auto resize after setting AI generated text
            setTimeout(() => {
                const textarea = textareaRefs.current[mentionId];
                if (textarea) {
                    autoResize(textarea);
                }
            }, 1);

            toast.success("AI 답글이 생성되었습니다!");
        } catch (error) {
            console.error('AI generation error:', error);
            toast.error("AI 답글 생성에 실패했습니다.");
        } finally {
            setAiGenerating(prev => ({ ...prev, [mentionId]: false }));
        }
    };

    // Write all replies
    const writeAllReplies = async () => {
        const unrepliedMentions = visibleMentions.filter(m => !m.is_replied);

        console.log('Total visible mentions:', visibleMentions.length);
        console.log('Unreplied mentions:', unrepliedMentions.length);

        if (unrepliedMentions.length === 0) {
            toast.info("All mentions have been replied to.");
            return;
        }

        toast.info("Drafting replies to all mentions...");

        for (const mention of unrepliedMentions) {
            await generateAIReply(mention.text, mention.id);
        }

        toast.success("Completed drafting!");
    };

    // Handle sending reply
    const sendReply = async (mentionId: string) => {
        const replyText = replyTexts[mentionId]?.trim();
        if (!replyText) return;

        setSending(prev => ({ ...prev, [mentionId]: true }));

        try {
            const newReply: PostComment = {
                media_type: "TEXT_POST",
                text: replyText,
                reply_to_id: mentionId,
            };

            await replyMutation.mutateAsync({ mentionId, reply: newReply });
            // Don't clear the reply text - it will be hidden by conditional rendering
        } catch (error) {
            // Error handled by mutation
        } finally {
            setSending(prev => ({ ...prev, [mentionId]: false }));
        }
    };


    if (isLoading) {
        return (
            <div className="h-full w-full overflow-hidden flex flex-col p-6">
                <h1 className="text-3xl font-bold text-zinc-700 mb-6">Mentions</h1>
                <div className="flex-1 flex flex-col gap-3 items-center justify-center bg-muted rounded-[20px]">
                    <Loader className="w-10 h-10 text-muted-foreground/30 animate-spin" />
                    <div className="text-muted-foreground">Getting mentions...</div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="h-full w-full overflow-hidden flex flex-col p-6">
                <h1 className="text-3xl font-bold text-zinc-700 mb-6">Mentions</h1>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-red-500">
                        {error instanceof Error ? error.message : "데이터를 가져오는 중 오류가 발생했습니다."}
                    </div>
                </div>
            </div>
        );
    }

    if (!isLoading && mentions.length === 0) {
        return (
            <div className="h-full w-full overflow-hidden p-6 flex flex-col">
                <h1 className="text-3xl font-bold text-zinc-700 mb-6">Mentions</h1>
                <div className="flex items-center justify-center flex-1">
                    <div className="bg-muted rounded-[20px] w-full h-full flex items-center justify-center">
                        <div className="flex flex-col items-center justify-center gap-6">
                            <div className="rounded-full flex items-center justify-center">
                                <BadgeCheck className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                            <div className="flex flex-col items-center gap-3 w-full">
                                <h2 className="text-zinc-700 text-xl font-semibold text-center">
                                    No mentions to reply
                                </h2>
                                <p className="text-zinc-500 text-sm font-normal text-center">
                                    Post new threads to get mentions
                                </p>
                            </div>
                            <Link
                                href="/contents/topic-finder"
                                className="bg-zinc-100 border border-muted-foreground/10 rounded-lg px-3 py-2 flex items-center justify-center gap-2.5 cursor-pointer hover:bg-zinc-200 transition-colors"
                            >
                                <span className="text-black text-sm font-medium">
                                    Get Ideas
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isLoading && visibleMentions.length === 0) {
        return (
            <div className="h-full w-full overflow-hidden p-6 flex flex-col">
                <h1 className="text-3xl font-bold text-zinc-700 mb-6">Mentions</h1>
                <div className="flex items-center justify-center flex-1">
                    <div className="bg-muted rounded-[20px] w-full h-full flex items-center justify-center">
                        <div className="flex flex-col items-center justify-center gap-6">
                            <div className="rounded-full flex items-center justify-center">
                                <BadgeCheck className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                            <div className="flex flex-col items-center gap-3 w-full">
                                <h2 className="text-zinc-700 text-xl font-semibold text-center">
                                    No mentions to reply
                                </h2>
                                <p className="text-zinc-500 text-sm font-normal text-center">
                                    All mentions have been replied to
                                </p>
                            </div>
                            <Link
                                href="/contents/topic-finder"
                                className="bg-zinc-100 border border-muted-foreground/10 rounded-lg px-3 py-2 flex items-center justify-center gap-2.5 cursor-pointer hover:bg-zinc-200 transition-colors"
                            >
                                <span className="text-black text-sm font-medium">
                                    Get Ideas
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-hidden flex flex-col p-6">
            <h1 className="text-3xl font-bold text-zinc-700 mb-6">Mentions</h1>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-gray-50 rounded-[32px] p-6 overflow-hidden">
                <div className="mb-6 flex justify-between items-center">
                    <p className="text-gray-500 text-base">
                        {remainingMentions} remaining mentions to reply
                    </p>
                    <Button
                        onClick={writeAllReplies}
                        variant="ghost"
                        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="text-base font-medium">Draft all replies</span>
                    </Button>
                </div>

                {/* 2-Column Grid Layout */}
                <div
                    className="columns-2 gap-6 flex-1 overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] scroll-pb-96 min-h-0"
                    ref={scrollContainerRef}
                >
                    {visibleMentions.map((mention, index) => (
                        <div
                            key={mention.id}
                            data-mention-index={index}
                            className="bg-white rounded-[20px] p-5 flex flex-col h-fit mb-6 break-inside-avoid"
                        >
                            {/* Original Post */}
                            {mention.root_post_content && (
                                <div className="mb-4 pb-4 border-b border-gray-200">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="mb-2">
                                                <h3 className="font-semibold text-black text-[17px]">
                                                    {currentUsername || 'You'}
                                                </h3>
                                            </div>
                                            <p className="text-black text-[17px] leading-relaxed line-clamp-3">
                                                {mention.root_post_content.content}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {new Date(mention.root_post_content.created_at || '').toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Mention */}
                            <div className="flex gap-3">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-black text-[17px]">
                                            {mention.username}
                                        </h4>
                                        <p className="text-sm text-gray-400">
                                            {new Date(mention.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <p className="text-black text-base leading-relaxed mb-5">
                                        {mention.text}
                                    </p>

                                    {/* Reply Input */}
                                    <div className="flex items-start gap-2 mt-auto">
                                        <div className="flex-1 relative">
                                            <Textarea
                                                ref={(el) => {
                                                    if (el) textareaRefs.current[mention.id] = el;
                                                }}
                                                rows={1}
                                                value={replyTexts[mention.id] || ''}
                                                onChange={(e) => handleTextareaChange(mention.id, e.target.value)}
                                                placeholder="Reply to Mention..."
                                                className={`
                                                    bg-gray-100 border-gray-200 rounded-2xl text-sm placeholder:text-gray-400 resize-none py-2 px-4
                                                    [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] focus:outline-none focus:focus-visible:ring-0
                                                    min-h-[34px]
                                                `}
                                            />
                                        </div>

                                        <Button
                                            onClick={() => generateAIReply(mention.text, mention.id)}
                                            disabled={aiGenerating[mention.id]}
                                            className={`bg-black hover:bg-gray-800 text-white rounded-full h-[34px] px-2.5 flex items-center gap-1 flex-shrink-0 ${aiGenerating[mention.id] ? 'animate-pulse' : ''}`}
                                        >
                                            <Sparkles className="w-4 h-4" />
                                        </Button>

                                        <Button
                                            onClick={() => sendReply(mention.id)}
                                            disabled={!replyTexts[mention.id]?.trim() || sending[mention.id]}
                                            className={`bg-black hover:bg-gray-800 text-white rounded-full w-[34px] h-[34px] p-0 flex items-center justify-center flex-shrink-0 ${sending[mention.id] ? 'animate-pulse' : ''}`}
                                        >
                                            {sending[mention.id] ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <ArrowUp className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}