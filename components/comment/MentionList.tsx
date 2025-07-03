"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ContentItem } from "../contents-helper/types";
import {
    getAllMentionsWithRootPosts,
    postComment,
    markMentionAsReplied,
} from "@/app/actions/comment";
import { fetchAndSaveMentions } from "@/app/actions/fetchComment";
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['mentions'],
        queryFn: async () => {
            await fetchAndSaveMentions();
            const result = await getAllMentionsWithRootPosts();
            return result;
        },
        staleTime: 1000 * 60 * 5,
    });

    const mentions = data?.mentions ?? [];
    const hiddenMentions = data?.hiddenMentions ?? [];

    const [replyText, setReplyText] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [showReplies, setShowReplies] = useState(false);

    const queryClient = useQueryClient();

    const replyMutation = useMutation({
        mutationFn: async ({ mentionId, reply }: { mentionId: string, reply: PostComment }) => {
            console.log('🔄 백그라운드 API 호출 시작:', { mentionId, reply });

            try {
                // 백그라운드에서 실제 API 호출
                console.log('📤 Threads API 답글 전송 중...');
                const result = await postComment(reply);
                console.log('✅ Threads API 답글 전송 성공:', result);

                console.log('💾 DB 업데이트 중...');
                await markMentionAsReplied(mentionId, reply);
                console.log('✅ DB 업데이트 성공');

                return { mentionId, reply, result };
            } catch (error) {
                console.error('❌ 백그라운드 API 호출 실패:', error);
                throw error;
            }
        },
        onMutate: async ({ mentionId, reply }) => {
            // 🎯 Optimistic Update - 즉시 UI 반영
            console.log('⚡ Optimistic Update 시작');

            await queryClient.cancelQueries({ queryKey: ['mentions'] });
            const previousData = queryClient.getQueryData(['mentions']);

            queryClient.setQueryData(['mentions'], (old: {
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
                // 🎯 답장한 멘션을 hiddenMentions에 즉시 추가
                hiddenMentions: [...old.hiddenMentions, mentionId]
            }));

            console.log('✨ UI 즉시 업데이트 완료');
            return { previousData };
        },
        onError: (err: any, variables, context) => {
            console.error('🚨 백그라운드 API 실패 - 롤백:', err);

            // 🔄 완전한 롤백
            queryClient.setQueryData(['mentions'], context?.previousData);

            // 입력 상태도 복원
            setReplyingTo(variables.mentionId);
            setReplyText(variables.reply.text);

            const errorMessage = err?.message || "알 수 없는 오류가 발생했습니다.";
            toast.error(`답글 전송 실패: ${errorMessage}`);
        },
        onSuccess: (data, variables) => {
            console.log('🎉 백그라운드 API 성공');
            // 최종 서버 데이터로 동기화 (선택사항)
            queryClient.invalidateQueries({ queryKey: ['mentions'] });
            toast.success("답글이 성공적으로 전송되었습니다!");
        }
    });

    const handleReply = (id: string) => {
        if (!replyText.trim()) return;

        const newReply: PostComment = {
            media_type: "TEXT_POST",
            text: replyText,
            reply_to_id: id,
        };

        // 🎯 즉시 UI 상태 변경 (Optimistic)
        setReplyText("");
        setReplyingTo(null);

        // 백그라운드에서 실제 API 호출
        replyMutation.mutate({ mentionId: id, reply: newReply });

        console.log('⚡ 즉시 답글 처리 완료 (UI만)');
    };

    // 현재 보여줄 멘션들 (답장하지 않은 것들)
    const visibleMentions = mentions.filter((mention) => !hiddenMentions.includes(mention.id));

    // 답장한 멘션들
    const repliedMentions = mentions.filter((mention) => hiddenMentions.includes(mention.id));

    if (isLoading) {
        return <div className="flex justify-center w-full text-muted-foreground">getting mentions...</div>
    }
    if (error) {
        return <div className="flex justify-center w-full text-red-500">{error instanceof Error ? error.message : "데이터를 가져오는 중 오류가 발생했습니다."}</div>
    }
    if (!isLoading && mentions.length === 0) {
        return <div className="flex justify-center w-full text-muted-foreground">멘션이 없습니다.</div>
    }

    return (
        <div>
            <div className="w-full mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 🎯 답장하지 않은 멘션들만 표시 */}
                {visibleMentions.map((mention) => {
                    const post = mention.root_post_content;
                    return (
                        <Card className="flex flex-col min-h-[150px]" key={mention.id}>
                            <div className="flex flex-col flex-1">
                                {/* 게시글 */}
                                {post && (
                                    <div>
                                        <p className="text-sm whitespace-pre-line">{post?.content}</p>
                                        <p className="text-xs text-muted-foreground pt-2">
                                            {post?.created_at && new Date(post.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                )}

                                {/* 댓글 */}
                                <div className="mt-auto">
                                    {post && (<div className="pt-4"></div>)}
                                    {post && (<div className="border-t pt-2"></div>)}
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium">{mention.username}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(mention.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm mb-6">{mention.text}</p>

                                        {/* 답글 달기 */}
                                        {replyingTo === mention.id ? (
                                            <div className="mt-2">
                                                <Input
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    placeholder="답글을 입력하세요..."
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            if (replyText.trim()) {
                                                                handleReply(mention.id);
                                                            }
                                                        }
                                                    }}
                                                />
                                                <div className="flex justify-center gap-2 mt-4">
                                                    <Button
                                                        onClick={() => {
                                                            if (replyText.trim()) {
                                                                handleReply(mention.id);
                                                            } else {
                                                                setReplyingTo(null);
                                                            }
                                                        }}
                                                        size="sm"
                                                    >
                                                        {/* 🎯 로딩 상태 제거 - 즉시 처리 */}
                                                        답글 달기
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setReplyingTo(null);
                                                            setReplyText("");
                                                        }}
                                                        size="sm"
                                                    >
                                                        취소
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-center mt-2">
                                                <Button
                                                    onClick={() => setReplyingTo(mention.id)}
                                                    size="sm"
                                                >
                                                    답글 달기
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* 🎯 답장한 멘션 보기 - 즉시 업데이트됨 */}
            {repliedMentions.length > 0 && (
                <>
                    <div className="w-full mt-4 max-w-7xl mx-auto space-y-6">
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => setShowReplies((prev) => !prev)}
                        >
                            {showReplies ? "답장한 멘션 접기" : `답장한 멘션 보기 (${repliedMentions.length})`}
                        </Button>
                        {showReplies && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {repliedMentions.map((mention) => {
                                    const post = mention.root_post_content;
                                    return (
                                        <Card key={mention.id}>
                                            <CardContent className="p-4 space-y-4">
                                                {/* 게시글 */}
                                                {post && (
                                                    <div>
                                                        <p className="text-sm whitespace-pre-line">{post?.content}</p>
                                                        <p className="text-xs text-muted-foreground pt-2">
                                                            {post?.created_at && new Date(post.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* 멘션 + 답글 */}
                                                <div className="space-y-2">
                                                    {post && (<div className="border-t pt-2"></div>)}
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium">{mention.username}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(mention.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{mention.text}</p>

                                                    {/* 🎯 답글 즉시 표시 */}
                                                    {mention.replies && mention.replies.length > 0 && (
                                                        <div className="mt-3 p-3 bg-muted rounded-lg">
                                                            <p className="text-xs text-muted-foreground mb-1">내 답글:</p>
                                                            {mention.replies.map((reply: PostComment, idx: number) => (
                                                                <p key={idx} className="text-sm">
                                                                    {reply.text}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}