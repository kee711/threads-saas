"use client";

import { useState, useEffect, startTransition } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/PostCard";
import useSocialAccountStore from "@/stores/useSocialAccountStore";
import {
    useStatisticsWithChanges,
    useTopPosts,
    useRefreshStatistics,
    fetchUserInsights,
    fetchTopPosts
} from "@/lib/queries/statisticsQueries";
import { statisticsKeys } from "@/lib/queries/statisticsKeys";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Area,
    AreaChart
} from "recharts";
import {
    TrendingUp,
    Users,
    Heart,
    MessageCircle,
    Repeat,
    Eye,
    Share,
    Calendar,
    Download,
    RefreshCw,
    Loader2,
    Quote
} from "lucide-react";
import { cn } from "@/lib/utils";


// 타입 정의는 store에서 import
interface MetricOption {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface TopPost {
    id: string;
    content: string;
    username: string;
    avatar: string;
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
    repostCount?: number;
    shareCount?: number;
    engagementRate?: number;
}

interface DateRange {
    label: string;
    days: number;
}

const dateRanges: DateRange[] = [
    { label: '7 days', days: 7 },
    { label: '30 days', days: 30 },
    { label: '90 days', days: 90 },
];

export default function StatisticsPage() {
    const { data: session } = useSession();
    const { currentSocialId, getSelectedAccount } = useSocialAccountStore();
    const queryClient = useQueryClient();

    // 로컬 상태
    const [selectedMetric, setSelectedMetric] = useState('views');
    const [selectedTopPostMetric, setSelectedTopPostMetric] = useState('views');
    const [selectedDateRange, setSelectedDateRange] = useState(7);
    const [isClient, setIsClient] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);

    // React Query hooks
    const {
        currentInsights: userInsights = [],
        changes,
        isLoading: isLoadingInsights,
        refetch: refetchInsights
    } = useStatisticsWithChanges(
        selectedAccount?.social_id || '',
        selectedDateRange
    );

    const {
        data: topPosts = [],
        isLoading: isLoadingPosts,
        isFetching: isFetchingPosts
    } = useTopPosts(selectedAccount?.social_id || '');

    const refreshMutation = useRefreshStatistics();

    // 캐시에서 데이터가 있는지 확인
    const isFromCache = queryClient.getQueryData(
        statisticsKeys.userInsights(selectedAccount?.social_id || '', selectedDateRange)
    ) !== undefined;

    // 클라이언트 마운트 후 계정 정보 설정
    useEffect(() => {
        setIsClient(true);
        setSelectedAccount(getSelectedAccount());
    }, [currentSocialId, getSelectedAccount]);

    // 30일, 90일 데이터 prefetching
    useEffect(() => {
        if (selectedAccount?.social_id && isClient) {
            startTransition(() => {
                const accountId = selectedAccount.social_id;

                // 현재 선택되지 않은 날짜 범위들을 prefetch
                const dateRangesToPrefetch = [7, 30, 90].filter(range => range !== selectedDateRange);

                dateRangesToPrefetch.forEach(dateRange => {
                    queryClient.prefetchQuery({
                        queryKey: statisticsKeys.userInsights(accountId, dateRange),
                        queryFn: () => fetchUserInsights(accountId, dateRange),
                        staleTime: 5 * 60 * 1000,
                    });
                });

                // TopPosts도 prefetch (이미 로드되지 않은 경우)
                queryClient.prefetchQuery({
                    queryKey: statisticsKeys.topPosts(accountId),
                    queryFn: () => fetchTopPosts(accountId),
                    staleTime: 10 * 60 * 1000,
                });
            });
        }
    }, [selectedAccount?.social_id, isClient, selectedDateRange, queryClient]);

    const handleRefresh = async () => {
        if (!selectedAccount?.social_id) return;

        try {
            await refreshMutation.mutateAsync({
                accountId: selectedAccount.social_id,
                dateRange: selectedDateRange
            });
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    };

    // 로딩 상태 계산
    const isLoading = isLoadingInsights || isLoadingPosts;
    const isRefreshing = refreshMutation.isPending || isFetchingPosts;

    // 인사이트 데이터에서 값 추출
    const getInsightValue = (metricName: string): number => {
        const insight = userInsights.find((item: any) => item.name === metricName);
        if (!insight) return 0;

        if (insight.total_value) {
            return insight.total_value.value;
        }

        if (insight.values && insight.values.length > 0) {
            return insight.values.reduce((sum: number, item: any) => sum + item.value, 0);
        }

        return 0;
    };

    // 실제 API 데이터에서 차트 데이터 생성
    const generateChartData = () => {
        // views는 Time Series 메트릭이므로 일별 데이터가 있음
        const viewsInsight = userInsights.find((item: any) => item.name === 'views');

        // likes, replies, reposts, quotes는 Total Value 메트릭이므로 총합만 있음
        const totalLikes = getInsightValue('likes');
        const totalReplies = getInsightValue('replies');
        const totalReposts = getInsightValue('reposts');
        const totalQuotes = getInsightValue('quotes');
        const totalEngagement = totalLikes + totalReplies + totalReposts + totalQuotes;

        // Time Series 데이터에서 차트 데이터 생성
        const chartData = viewsInsight?.values?.map((viewData: any, index: number) => {
            // API에서 받은 end_time을 파싱
            const date = viewData.end_time ? new Date(viewData.end_time) : new Date(Date.now() - (viewsInsight.values!.length - 1 - index) * 24 * 60 * 60 * 1000);

            // MM/DD 형식으로 날짜 표시
            const formattedDate = `${(date.getMonth() + 1)}/${date.getDate()}`;

            // Total Value 메트릭은 일별로 분산해서 표시 (근사값)
            const dailyLikes = Math.round(totalLikes / viewsInsight.values!.length);
            const dailyReplies = Math.round(totalReplies / viewsInsight.values!.length);
            const dailyReposts = Math.round(totalReposts / viewsInsight.values!.length);
            const dailyQuotes = Math.round(totalQuotes / viewsInsight.values!.length);
            const dailyEngagement = dailyLikes + dailyReplies + dailyReposts + dailyQuotes;

            return {
                name: formattedDate,
                views: viewData.value,
                likes: dailyLikes,
                replies: dailyReplies,
                reposts: dailyReposts,
                quotes: dailyQuotes,
                engagement: dailyEngagement,
            };
        });

        // Time Range에 따른 데이터 포인트 조정
        if (selectedDateRange === 7) {
            // 7일: 모든 날짜 표시
            return chartData;
        } else if (selectedDateRange === 30) {
            // 30일: 5일 간격으로 표시
            return chartData?.filter((_: any, index: number) => index % 5 === 0 || index === chartData.length - 1);
        } else if (selectedDateRange === 90) {
            // 90일: 주간 단위로 표시 (7일 간격)
            return chartData?.filter((_: any, index: number) => index % 7 === 0 || index === chartData.length - 1);
        }

        return chartData;
    };

    // 실제 API 데이터에서 파이 차트 데이터 생성
    const generatePieData = () => {
        const likes = getInsightValue('likes');
        const replies = getInsightValue('replies');
        const reposts = getInsightValue('reposts');
        const quotes = getInsightValue('quotes');

        const total = likes + replies + reposts + quotes;

        if (total === 0) {
            return []; // 모든 값이 0이면 Mock 데이터 사용
        }

        const pieData = [
            { name: 'Likes', value: Math.round((likes / total) * 100), color: '#ef4444' },
            { name: 'Replies', value: Math.round((replies / total) * 100), color: '#3b82f6' },
            { name: 'Reposts', value: Math.round((reposts / total) * 100), color: '#10b981' },
            { name: 'Quotes', value: Math.round((quotes / total) * 100), color: '#f59e0b' },
        ];

        return pieData.filter((item: any) => item.value > 0);
    };

    // 차트와 파이 데이터 생성
    const chartData = generateChartData();
    const pieData = generatePieData();

    // 메트릭 카드 데이터
    const metricCards = [
        {
            title: "Total Views",
            value: getInsightValue('views') || 'No data',
            change: changes?.views?.change || 'N/A',
            changeType: changes?.views?.changeType || 'neutral' as const,
            icon: <Eye className="w-5 h-5" />,
            description: "trend in period"
        },
        {
            title: "Total Followers",
            value: getInsightValue('followers_count') || 'No data',
            icon: <Users className="w-5 h-5" />,
            description: "Current count"
        },
        {
            title: "Total Likes",
            value: getInsightValue('likes') || 'No data',
            change: changes?.likes?.change || '',
            changeType: changes?.likes?.changeType || 'neutral' as const,
            icon: <Heart className="w-5 h-5" />,
            description: "from previous period"
        },
        {
            title: "Total Replies",
            value: getInsightValue('replies') || 'No data',
            change: changes?.replies?.change || 'N/A',
            changeType: changes?.replies?.changeType || 'neutral' as const,
            icon: <MessageCircle className="w-5 h-5" />,
            description: "from previous period"
        },
        {
            title: "Total Reposts",
            value: getInsightValue('reposts') || 'No data',
            change: changes?.reposts?.change || 'N/A',
            changeType: changes?.reposts?.changeType || 'neutral' as const,
            icon: <Repeat className="w-5 h-5" />,
            description: "from previous period"
        },
        {
            title: "Total Quotes",
            value: getInsightValue('quotes') || 'No data',
            change: changes?.quotes?.change || 'N/A',
            changeType: changes?.quotes?.changeType || 'neutral' as const,
            icon: <Quote className="w-5 h-5" />,
            description: "from previous period"
        },
    ];

    // 탑 포스트 정렬
    const getDisplayTopPosts = (): TopPost[] => {
        // 실제 API 데이터를 TopPost 형태로 변환
        return topPosts.map(post => ({
            id: post.id,
            content: post.text || 'No content available',
            username: post.username,
            avatar: '/avatars/01.png', // 기본 아바타
            viewCount: post.viewCount,
            likeCount: post.likeCount,
            commentCount: post.commentCount,
            repostCount: post.repostCount,
            shareCount: post.shareCount,
            engagementRate: post.engagementRate,
        }));
    };

    const sortedTopPosts = getDisplayTopPosts().sort((a, b) => {
        if (selectedTopPostMetric === 'views') {
            return (b.viewCount || 0) - (a.viewCount || 0);
        } else {
            return (b.engagementRate || 0) - (a.engagementRate || 0);
        }
    }).slice(0, 3); // Top 3만 선택

    // 초기 로딩 중이거나 클라이언트가 아직 마운트되지 않은 경우
    if (!isClient) {
        return (
            <div className="space-y-6 p-4 md:p-6">
                <div className="space-y-4">
                    <div className="h-8 bg-gray-200 rounded animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-gray-200 rounded-lg h-24 animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 소셜 계정이 연결되지 않은 경우
    if (!selectedAccount) {
        return (
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">계정 연결이 필요해요</h2>
                    <p className="text-muted-foreground mb-4">
                        통계를 확인하려면 먼저 Threads 계정을 연결해주세요.
                    </p>
                    <Button onClick={() => window.location.href = "/api/threads/oauth"}>
                        Threads 계정 연결하기
                    </Button>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="container mx-auto py-6 space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
                    <p className="text-muted-foreground">Please sign in to view your statistics.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto space-y-4 pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white p-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold">Statistics</h1>
                        <div className="text-muted-foreground text-sm font-semibold rounded-full bg-muted px-2 py-1 w-fit">
                            @{selectedAccount.username}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-3">
                    {/* Date Range Selector */}
                    <div className="flex border rounded-lg bg-muted p-1 w-full sm:w-auto">
                        {dateRanges.map((range) => (
                            <button
                                key={range.days}
                                onClick={() => setSelectedDateRange(range.days)}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex-1 sm:flex-none",
                                    selectedDateRange === range.days
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>

                    {/* Refresh Button */}
                    <div className="flex border rounded-lg bg-muted p-1 w-fit sm:w-auto">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex-1 sm:flex-none text-muted-foreground hover:text-foreground disabled:opacity-50 flex items-center gap-2"
                        >
                            {isRefreshing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {isLoading && !isFromCache ? (
                /* Loading State */
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-gray-200 rounded-lg h-24 animate-pulse" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-gray-200 rounded-lg h-80 animate-pulse" />
                        <div className="bg-gray-200 rounded-lg h-80 animate-pulse" />
                    </div>
                </div>
            ) : (
                <>
                    {/* Metrics Cards */}
                    <div className="space-y-4">
                        {/* First row: 2 cards on lg+ screens */}
                        <div className="grid grid-cols-2 gap-4">
                            {metricCards.slice(0, 2).map((card, index) => (
                                <Card key={index} className="bg-muted">
                                    <CardContent>
                                        <div className="flex flex-col space-y-1 items-center">
                                            <div className="flex items-center justify-between w-full">
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    {card.title}
                                                </p>
                                                <div className="h-6 w-6 text-muted-foreground">
                                                    {card.icon}
                                                </div>
                                            </div>
                                            <div className="space-y-1 flex flex-col md:flex-row items-start md:justify-between md:items-end text-right w-full">
                                                <div className="text-xl md:text-2xl font-bold">
                                                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                                                </div>
                                                <div className="flex items-center text-sm">
                                                    <span className={`font-medium ${card.changeType === 'positive' ? 'text-green-600' :
                                                        card.changeType === 'negative' ? 'text-red-600' :
                                                            'text-muted-foreground'
                                                        }`}>
                                                        {card.change}
                                                    </span>
                                                    <span className="text-muted-foreground ml-1">
                                                        {card.description}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Second row: 4 columns on lg+ screens */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {metricCards.slice(2).map((card, index) => (
                                <Card key={index + 2}>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1 w-full">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-muted-foreground">
                                                        {card.title}
                                                    </p>
                                                    <div className="h-6 w-6 text-muted-foreground flex items-center">
                                                        {card.icon}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-xl md:text-2xl font-bold">
                                                        {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                                                    </div>
                                                    <div className="flex items-center text-sm">
                                                        <span className={`font-medium ${card.changeType === 'positive' ? 'text-green-600' :
                                                            card.changeType === 'negative' ? 'text-red-600' :
                                                                'text-muted-foreground'
                                                            }`}>
                                                            {card.change}
                                                        </span>
                                                        <span className="text-muted-foreground ml-1">
                                                            {card.description}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {/* Line Chart */}
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg">Views Performance</CardTitle>
                                <CardDescription className="text-sm text-muted-foreground">
                                    For the last {selectedDateRange} days
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 md:h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
                                            <XAxis
                                                dataKey="name"
                                                stroke="#6b7280"
                                                fontSize={12}
                                            />
                                            <YAxis
                                                stroke="#6b7280"
                                                fontSize={12}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #e0e4e7',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey={selectedMetric}
                                                stroke="#3b82f6"
                                                strokeWidth={3}
                                                fill="url(#colorGradient)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pie Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Engagement Breakdown</CardTitle>
                                <CardDescription className="text-sm text-muted-foreground">
                                    For the last {selectedDateRange} days
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 md:h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}%`}
                                            >
                                                {pieData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: any) => [`${value}%`, 'Percentage']}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Posts Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Top Posts</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                지난 {selectedDateRange}일 동안 가장 높은 성과를 기록한 포스트
                            </p>
                        </CardHeader>
                        <CardContent>
                            {topPosts.length > 0 ? (
                                <div className="space-y-4">
                                    {sortedTopPosts.map((post, index) => (
                                        <div key={index} className="w-full">
                                            <PostCard
                                                variant="compact"
                                                avatar={'/avatars/01.png'}
                                                username={post.username || selectedAccount.username}
                                                content={post.content || ''}
                                                likeCount={post.likeCount}
                                                commentCount={post.commentCount}
                                                repostCount={post.repostCount}
                                                viewCount={post.viewCount}
                                                timestamp={new Date().toISOString()}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">
                                        선택된 기간에 포스트 데이터가 없습니다.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
} 