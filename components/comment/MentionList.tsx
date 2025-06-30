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
    const [isLoading, setIsLoading] = useState(true);
    const [mentions, setMentions] = useState<Comment[]>([]);
    const [hiddenMentions, setHiddenMentions] = useState<string[]>([]);
    const [replyText, setReplyText] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [showReplies, setShowReplies] = useState(false);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMentions() {
            setIsLoading(true);
            setError(null);
            try {
                await fetchAndSaveMentions();
                const result = await getAllMentionsWithRootPosts();
                setMentions(result.mentions);
                setHiddenMentions(result.hiddenMentions);
            } catch (err) {
                setError(err instanceof Error ? err.message : "데이터를 가져오는 중 오류가 발생했습니다.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchMentions();
    }, []);

    const handleReply = (id: string) => {
        try {
            if (!replyText.trim()) return;

            const newReply: PostComment = {
                media_type: "TEXT_POST",
                text: replyText,
                reply_to_id: id,
            };

            setMentions((prevMentions) =>
                prevMentions.map((mention) =>
                    mention.id === id
                        ? { ...mention, replies: [...mention.replies, newReply] }
                        : mention
                )
            );

            setReplyText("");
            setReplyingTo(null);
            postComment(newReply);

            const repliedMention = mentions.find((mention) => mention.id === id);
            if (repliedMention) {
                setHiddenMentions((prev) => [...prev, repliedMention.id]);
            }

            markMentionAsReplied(id, newReply);
            toast.success("답글이 성공적으로 전송되었습니다!");
        } catch (error) {
            console.error("Error replying to mention:", error);
            toast.error("답글 전송에 실패했습니다.");
        }
    };

    const repliedMentions = mentions.filter((c) => hiddenMentions.includes(c.id));

    if (isLoading) {
        return <div className="flex justify-center w-full text-muted-foreground">getting mentions...</div>
    }
    if (error) {
        return <div className="flex justify-center w-full text-red-500">{error}</div>
    }
    if (!isLoading && mentions.length === 0) {
        return <div className="flex justify-center w-full text-muted-foreground">멘션이 없습니다.</div>
    }

    return (
        <div>
            <div className="w-full mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 일반 카드들 */}
                {mentions
                    .filter((mention) => !hiddenMentions.includes(mention.id))
                    .map((mention) => {
                        const post = mention.root_post_content
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

                                    {/* 댓글 - 아래로 밀기 */}
                                    {mention && (
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
                                                        />
                                                        <div className="flex justify-center mt-4">
                                                            <Button
                                                                onClick={() => {
                                                                    if (replyText.trim() !== "") {
                                                                        handleReply(mention.id);
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
                                                    <div className="flex justify-center mt-2">
                                                        <Button onClick={() => setReplyingTo(mention.id)}>답글 달기</Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    }
                    )
                }
            </div>

            {/* 답장한 멘션 보기 */}
            {
                repliedMentions.length > 0 && (
                    <>
                        <div className="w-full mt-4 max-w-7xl mx-auto space-y-6">
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => setShowReplies((prev) => !prev)}
                            >
                                {showReplies ? "답장한 멘션 접기" : "답장한 멘션 보기"}
                            </Button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {showReplies && repliedMentions.map((mention) => {
                                    const post = mention.root_post_content
                                    return (
                                        <Card key={mention?.id}>
                                            <CardContent className="p-2 space-y-4">
                                                {/* 게시글 */}
                                                {post && (
                                                    <div>
                                                        {/* <h3 className="font-semibold">TODO: 게시물 작성자 username 받아오기</h3> */}
                                                        <p className="text-sm whitespace-pre-line">{post?.content}</p>
                                                    </div>
                                                )}
                                                {/* 댓글 + 답글 */}
                                                {mention && (
                                                    <div className="space-y-2">
                                                        {post && (<div className="border-t pt-2"></div>)}
                                                        <p className="text-sm">{mention.text}</p>
                                                        {(mention.replies ?? []).map((reply, idx) => (
                                                            <p key={idx} className="text-sm text-muted-foreground">me: {reply.text}</p>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )
            }

        </div >
    );
}