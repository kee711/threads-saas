"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ContentItem, Comment, PostComment } from "../contents-helper/types";
import {
    getAllCommentsWithRootPosts,
    postComment,
    markCommentAsReplied,
    hideComment,
} from "@/app/actions/comment";
import { fetchAndSaveComments } from "@/app/actions/fetchComment";
import { EyeOff } from "lucide-react";
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function CommentList() {
    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery<{
        comments: Comment[];
        postsWithComments: ContentItem[];
        hiddenComments: string[];
    }>({
        queryKey: ['comments'],
        queryFn: async () => {
            await fetchAndSaveComments();
            const result = await getAllCommentsWithRootPosts();
            return result;
        },
        staleTime: 1000 * 60 * 5,
    });

    const comments = data?.comments ?? [];
    const postsWithComments = data?.postsWithComments ?? [];
    const hiddenComments = data?.hiddenComments ?? [];

    const [replyText, setReplyText] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [showReplies, setShowReplies] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hiddenByUser, setHiddenByUser] = useState<string[]>([]);

    const queryClient = useQueryClient();

    const replyMutation = useMutation({
        mutationFn: async ({ commentId, reply }: { commentId: string, reply: PostComment }) => {
            await postComment(reply);
            await markCommentAsReplied(commentId, reply);
            return { commentId, reply };
        },
        onMutate: async ({ commentId, reply }) => {
            await queryClient.cancelQueries({ queryKey: ['comments'] });
            const previousComments = queryClient.getQueryData(['comments']);

            queryClient.setQueryData(['comments'], (old: { comments: Comment[]; }) => ({
                ...old,
                comments: old.comments.map((comment: Comment) =>
                    comment.id === commentId
                        ? { ...comment, replies: [...comment.replies, reply], is_replied: true }
                        : comment
                )
            }));

            return { previousComments };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['comments'], context?.previousComments);
            toast.error("답글 전송에 실패했습니다.");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments'] });
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

        replyMutation.mutate({ commentId: id, reply: newReply });
        setReplyText("");
        setReplyingTo(null);
    };

    const currentPost = postsWithComments[currentIndex];
    const hiddenCommentsForCurrentPost = comments.filter(
        (c) =>
            c.root_post_content?.id === currentPost?.id &&
            hiddenComments.includes(c.id)
    );

    if (isLoading) {
        return <div className="flex justify-center w-full text-muted-foreground">getting comments...</div>
    }
    if (error) {
        return <div className="flex justify-center w-full text-red-500">{error instanceof Error ? error.message : "데이터를 가져오는 중 오류가 발생했습니다."}</div>
    }
    if (!isLoading && comments.length === 0) {
        return <div className="flex justify-center w-full text-muted-foreground">댓글이 없습니다.</div>
    }

    return (
        <div className="w-full mx-auto max-w-5xl flex space-x-6 mt-5">
            <div className="w-1/2 flex flex-col relative">
                <div className="h-[80vh] flex flex-col relative">
                    <Card className="flex-1 p-4 overflow-y-auto scrollbar">
                        <p className="text-sm whitespace-pre-line">
                            {currentPost?.content}
                        </p>
                        <p className="text-xs text-muted-foreground pt-4">
                            {new Date(currentPost?.created_at ?? "").toLocaleString()}
                        </p>
                    </Card>
                </div>
                <div className="flex items-center justify-between mb-2 pt-2">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                        disabled={currentIndex === 0}
                    >
                        ←
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {currentIndex + 1} / {postsWithComments.length}
                    </span>
                    <Button
                        variant="ghost"
                        onClick={() =>
                            setCurrentIndex((prev) =>
                                Math.min(prev + 1, postsWithComments.length - 1)
                            )
                        }
                        disabled={currentIndex === postsWithComments.length - 1}
                    >
                        →
                    </Button>
                </div>
            </div>

            <div className="w-1/2 h-[80vh] overflow-y-auto space-y-4 pr-2 scrollbar">
                {comments
                    .filter(
                        (c) =>
                            c.root_post_content?.id === currentPost?.id &&
                            !hiddenComments.includes(c.id) &&
                            !hiddenByUser.includes(c.id)
                    )
                    .map((comment) => (
                        <Card
                            key={comment.id}
                            className="flex-1 max-h-[300px] overflow-y-auto px-4 py-2 relative"
                        >
                            <CardContent className="p-0">
                                <div className="flex items-start space-x-4 pt-2 pb-2">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium">{comment.username}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(comment.timestamp).toLocaleString()}
                                                <button
                                                    className="pl-1 text-muted-foreground hover:text-red-500"
                                                    onClick={async () => {
                                                        if (window.confirm("댓글을 숨기시겠습니까?")) {
                                                            try {
                                                                await hideComment(comment.id);
                                                                toast.success("댓글이 숨김 처리되었습니다!")
                                                            } catch (e) {
                                                                toast.error("댓글 숨김에 실패했습니다.");
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <EyeOff size={16} />
                                                </button>
                                            </span>
                                        </div>
                                        <p className="text-sm">{comment.text}</p>
                                    </div>
                                </div>

                                {replyingTo === comment.id ? (
                                    <div className="w-full mt-2">
                                        <Input
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="답글을 입력하세요..."
                                        />
                                        <div className="flex justify-center mt-2 pb-2">
                                            <Button
                                                onClick={() => handleReply(comment.id)}
                                                disabled={replyMutation.isPending}
                                            >
                                                {replyMutation.isPending ? "전송 중..." : "답글 달기"}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-center mt-2 pb-2">
                                        <Button onClick={() => setReplyingTo(comment.id)}>
                                            답글 달기
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                {hiddenCommentsForCurrentPost.length > 0 && (
                    <>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => setShowReplies((prev) => !prev)}
                        >
                            {showReplies ? "답장한 댓글 접기" : "답장한 댓글 보기"}
                        </Button>
                        {showReplies &&
                            comments
                                .filter(
                                    (c) =>
                                        c.root_post_content?.id === currentPost?.id &&
                                        hiddenComments.includes(c.id)
                                )
                                .map((comment) => (
                                    <Card key={comment.id} className="px-4 py-2">
                                        <CardContent className="p-0">
                                            <div className="flex items-start space-x-4 pt-2 pb-2">
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-medium">
                                                            {comment.username}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(comment.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{comment.text}</p>
                                                </div>
                                            </div>
                                            {comment.replies.length > 0 && (
                                                <div className="mt-2 border-t pt-2">
                                                    <div className="pb-1">
                                                        <p className="text-xs text-muted-foreground">
                                                            me
                                                        </p>
                                                    </div>
                                                    {comment.replies.map((reply, idx) => (
                                                        <p key={idx} className="text-sm">
                                                            {reply.text}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                    </>
                )}
            </div>
        </div>
    );
}