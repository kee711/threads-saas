"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { getComment } from "@/lib/services/comment"
// import { postComment } from "@/lib/services/comment"
// import { getPostById } from "@/lib/services/comment"
// import { Content } from "@/lib/types";

interface Comment {
    id: string;
    text: string;
    username: string;
    timestamp: string;
    originalContent?: string; // types에서 Content 확인되면 수정
    replies: PostComment[];
    is_replied: boolean;
}

interface PostComment {
    media_type: string,
    text: string;
    reply_to_id: string;
  }

export function CommentList() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [replyText, setReplyText] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [hiddenComments, setHiddenComments] = useState<string[]>([]);
    const [showReplies, setShowReplies] = useState(false);

    // useEffect(() => {
    //     async function fetchContents() {
    //       setIsLoading(true);
    //       setError(null);
    //       try {
    //         console.log('Fetching comments');
    //         const data = await getComment();
    //         console.log('Fetched data:', data);
    //         setComments(data);
    //         //setHiddenComments 분리해서 해야 함
    //       } catch (error) {
    //         console.error('Error fetching comments:', error);
    //         setError(error instanceof Error ? error.message : '데이터를 가져오는 중 오류가 발생했습니다.');
    //       } finally {
    //         setIsLoading(false);
    //       }
    //     }
    // })

    useEffect(() => { // originalContent 불러오는 함수 추가
        const data: Comment[] = [
            {
                id: "1",
                text: "이것은 1번째 댓글입니다.",
                username: "User1",
                timestamp: new Date().toISOString(),
                replies: [],
                is_replied: false,
            },
            {
                id: "2",
                text: "이것은 2번째 댓글입니다.",
                username: "User2",
                timestamp: new Date().toISOString(),
                replies: [],
                is_replied: false,
            },
            {
                id: "3",
                text: "이것은 3번째 댓글입니다.",
                username: "User3",
                timestamp: new Date().toISOString(),
                replies: [],
                is_replied: false,
            },
            {
                id: "4",
                text: "이것은 4번째 댓글입니다.",
                username: "User4",
                timestamp: new Date().toISOString(),
                replies: [],
                is_replied: false,
            },
            {
                id: "5",
                text: "이것은 5번째 댓글입니다.",
                username: "User5",
                timestamp: new Date().toISOString(),
                replies: [],
                is_replied: false,
            },
            {
                id: "6",
                text: "이것은 6번째 댓글입니다.",
                username: "User6",
                timestamp: new Date().toISOString(),
                replies: [],
                is_replied: false,
            },
            {
                id: "7",
                text: "이것은 7번째 댓글입니다.",
                username: "User7",
                timestamp: new Date().toISOString(),
                replies: [],
                is_replied: false,
            },
            {
                id: "8",
                text: "이것은 8번째 댓글입니다.",
                username: "User8",
                timestamp: new Date().toISOString(),
                replies: [],
                is_replied: false,
            },
        ];
        setComments(data);
    }, []);

    const handleReply = (id: string) => {
        if (!replyText.trim()) return;

        const newReply: PostComment = {
            media_type: "TEXT",
            text: "이것은 답글입니다.",
            reply_to_id: id,
        };

        setComments(prevComments => prevComments.map(comment =>
            comment.id === id ? { ...comment, replies: [...comment.replies, newReply] } : comment
        ));

        setReplyText("");
        setReplyingTo(null);
        setHiddenComments(prev => [...prev, id]);
        // is_replied 추가 필요
        // postComment(newReply);
    };

    return (
        <div className="w-full mx-auto space-y-4">
            {comments.map(comment => (
                <div key={comment.id} className="flex space-x-4">
       {!hiddenComments.includes(comment.id) && (
            <div className="flex space-x-4 w-full">
            <Card className="flex-1">
            <div className="flex items-start space-x-4 rounded-lg p-4">
                <div className="flex-1">
                    <p className="text-sm font-medium">{comment.originalContent}</p>
                </div>
            </div>
           </Card>
            <Card className="flex-1">
                <CardContent>
                    <div className="flex items-start space-x-4 rounded-lg pt-4 pb-4">
                        {/* <div className="h-10 w-10 rounded-full bg-muted" /> */}
                        <div className="flex-1">
                            <div className="mb-1 flex items-center justify-between">
                                <span className="font-medium">{comment.username}</span>
                                <span className="text-xs text-muted-foreground">{new Date(comment.timestamp).toLocaleString()}</span>
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
                            <div className="flex justify-center mt-2">
                                <Button onClick={() => handleReply(comment.id)}>답글 달기</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center mt-2">
                            <Button onClick={() => setReplyingTo(comment.id)}>답글 달기</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
            </div>
        )
    }
            </div >
        ))
}
{
    hiddenComments.length > 0 && (
        <div className="mt-4">
            <Button className="w-full" variant="outline" onClick={() => setShowReplies(prev => !prev)}>
                {showReplies ? "답장한 댓글 접기" : "답장한 댓글 보기"}
            </Button>
            {showReplies && (
                <div className="mt-2 space-y-2">
                    {comments.filter(comment => hiddenComments.includes(comment.id)).map(hiddenComment => (
                        <div key={hiddenComment.id} className="flex space-x-4 w-full">
                        <Card className="flex-1">
                        <div className="flex items-start space-x-4 rounded-lg p-4">
                            <div className="flex-1">
                                <p className="text-sm font-medium">{hiddenComment.originalContent}</p>
                            </div>
                        </div>
                       </Card>
                        <Card className="flex-1">
                            <CardContent>
                                <div className="flex items-start space-x-4 rounded-lg p-4">
                                    <div className="h-10 w-10 rounded-full bg-muted" />
                                    <div className="flex-1">
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="font-medium">{hiddenComment.username}</span>
                                            <span className="text-xs text-muted-foreground">{new Date(hiddenComment.timestamp).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm">{hiddenComment.text}</p>
                                    </div>
                                </div>
                                {replyingTo === hiddenComment.id ? (
                                    <div className="w-full mt-2">
                                        <Input
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="답글을 입력하세요..."
                                        />
                                        <div className="flex justify-center mt-2">
                                            <Button onClick={() => handleReply(hiddenComment.id)}>답글 달기</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-center mt-2">
                                        <Button onClick={() => setReplyingTo(hiddenComment.id)}>답글 달기</Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
    </div>
);
};