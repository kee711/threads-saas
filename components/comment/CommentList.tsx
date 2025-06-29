"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ContentItem } from "../contents-helper/types";
import {
    getAllCommentsWithRootPosts,
    postComment,
    markCommentAsReplied,
    hideComment,
} from "@/app/actions/comment";
import { fetchAndSaveComments } from "@/app/actions/fetchComment";
import { EyeOff } from "lucide-react";
import { toast } from 'sonner';

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

export function CommentList() {
    const [isLoading, setIsLoading] = useState(true);
    const [comments, setComments] = useState<Comment[]>([]);
    const [hiddenComments, setHiddenComments] = useState<string[]>([]);
    const [replyText, setReplyText] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [showReplies, setShowReplies] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [postsWithComments, setPostsWithComments] = useState<ContentItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hiddenByUser, setHiddenByUser] = useState<string[]>([]);

    useEffect(() => {
        async function fetchContents() {
            setComments([]);
            setHiddenComments([]);
            setIsLoading(true);
            setError(null);

            try {
                await fetchAndSaveComments();
                const result = await getAllCommentsWithRootPosts();
                setComments(result.comments);
                setPostsWithComments(result.postsWithComments);
                setHiddenComments(result.hiddenComments);
            } catch (error) {
                console.error("Error fetching comments:", error);
                setError(
                    error instanceof Error
                        ? error.message
                        : "데이터를 가져오는 중 오류가 발생했습니다."
                );
            } finally {
                setIsLoading(false);
            }
        }

        fetchContents();
    }, []);

    const handleReply = (id: string) => {
        if (!replyText.trim()) return;

        try {
            const newReply: PostComment = {
                media_type: "TEXT_POST",
                text: replyText,
                reply_to_id: id,
            };

            setComments((prevComments) =>
                prevComments.map((comment) =>
                    comment.id === id
                        ? { ...comment, replies: [...comment.replies, newReply] }
                        : comment
                )
            );

            setReplyText("");
            setReplyingTo(null);
            postComment(newReply);

            const repliedComment = comments.find((comment) => comment.id === id);
            if (repliedComment) {
                setHiddenComments((prev) => [...prev, repliedComment.id]);
            }

            markCommentAsReplied(id, newReply);
            toast.success("답글이 성공적으로 전송되었습니다!");
        } catch (error) {
            console.error("Error replying to comment:", error);
            toast.error("답글 전송에 실패했습니다.");
        }
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
        return <div className="flex justify-center w-full text-red-500">{error}</div>
    }
    if (!isLoading && comments.length === 0) {
        return <div className="flex justify-center w-full text-muted-foreground">댓글이 없습니다.</div>
    }

    return (

        <div className="w-full mx-auto max-w-5xl flex space-x-6 mt-5">
            {/* 왼쪽: 게시글 슬라이더 */}
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


            {/* 오른쪽: 댓글 리스트 */}
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
                                                {/* 숨기기 아이콘 (오른쪽 상단) */}
                                                <button
                                                    className="pl-1 text-muted-foreground hover:text-red-500"
                                                    onClick={async () => {
                                                        if (window.confirm("댓글을 숨기시겠습니까?")) {
                                                            try {
                                                                await hideComment(comment.id);
                                                                toast.success("댓글이 숨김 처리되었습니다!")
                                                                setHiddenByUser((prev) => [...prev, comment.id]);
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

                                {/* 답글 입력 및 버튼 */}
                                {replyingTo === comment.id ? (
                                    <div className="w-full mt-2">
                                        <Input
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="답글을 입력하세요..."
                                        />
                                        <div className="flex justify-center mt-2 pb-2">
                                            <Button
                                                onClick={() => {
                                                    if (replyText.trim() !== "") {
                                                        handleReply(comment.id);
                                                    } else {
                                                        setReplyingTo(null);
                                                    }
                                                }}
                                            >
                                                답글 달기
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

                {/* 답글 포함된 댓글 표시 */}
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