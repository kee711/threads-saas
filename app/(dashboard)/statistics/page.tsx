"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/PostCard";
import useSocialAccountStore from "@/stores/useSocialAccountStore";
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
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

// 타입 정의
interface InsightsData {
    name: string;
    period: string;
    values?: Array<{ value: number; end_time?: string }>;
    total_value?: { value: number };
    title: string;
    description: string;
    id: string;
}

interface MetricOption {
    id: string;
    label: string;
    icon: React.ReactNode;
}

// Threads Post 타입 (API에서 가져온 데이터)
interface ThreadsPost {
    id: string;
    media_product_type: string;
    media_type: string;
    media_url?: string;
    permalink: string;
    owner?: {
        id: string;
    };
    username: string;
    text: string;
    timestamp: string;
    shortcode: string;
    thumbnail_url?: string;
    children?: string[];
    is_quote_post: boolean;
    quoted_post?: string;
    reposted_post?: string;
    alt_text?: string;
    link_attachment_url?: string;
    gif_url?: string;
}

// Insights와 결합된 포스트 타입
interface PostWithInsights extends ThreadsPost {
    viewCount: number;
    likeCount: number;
    commentCount: number; // replies
    repostCount: number;
    shareCount: number;
    engagementRate: number;
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

// 환경변수로 Mock 데이터 사용 여부 결정
// NEXT_PUBLIC_USE_MOCK_DATA=true면 Mock 데이터 사용, false면 실제 API 데이터 사용
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// 더미 데이터 (실제 API 연동 시 교체)
const mockChartData = [
    { name: '월', views: 4000, engagement: 2400, likes: 1200, replies: 450 },
    { name: '화', views: 3000, engagement: 1398, likes: 1100, replies: 380 },
    { name: '수', views: 2000, engagement: 9800, likes: 1500, replies: 520 },
    { name: '목', views: 2780, engagement: 3908, likes: 1300, replies: 410 },
    { name: '금', views: 1890, engagement: 4800, likes: 900, replies: 340 },
    { name: '토', views: 2390, engagement: 3800, likes: 1100, replies: 390 },
    { name: '일', views: 3490, engagement: 4300, likes: 1400, replies: 480 },
];

const mockPieData = [
    { name: 'Likes', value: 45, color: '#ef4444' },
    { name: 'Replies', value: 25, color: '#3b82f6' },
    { name: 'Reposts', value: 20, color: '#10b981' },
    { name: 'Shares', value: 10, color: '#f59e0b' },
];

const mockTopPosts: TopPost[] = [
    {
        id: '1',
        content: 'Amazing sunset today! 🌅 Nature never fails to inspire me. What\'s your favorite time of day?',
        username: 'nature_lover',
        avatar: '/avatars/01.png',
        viewCount: 15420,
        likeCount: 892,
        commentCount: 156,
        repostCount: 89,
        shareCount: 45,
        engagementRate: 7.8,
    },
    {
        id: '2',
        content: 'Just finished reading an incredible book about AI and creativity. Highly recommend "The Creative Code" 📚',
        username: 'tech_reader',
        avatar: '/avatars/02.png',
        viewCount: 8730,
        likeCount: 445,
        commentCount: 78,
        repostCount: 34,
        shareCount: 23,
        engagementRate: 6.7,
    },
    {
        id: '3',
        content: 'Coffee shop coding session ☕ Sometimes the best ideas come from the most unexpected places.',
        username: 'code_wanderer',
        avatar: '/avatars/03.png',
        viewCount: 5680,
        likeCount: 298,
        commentCount: 45,
        repostCount: 19,
        shareCount: 12,
        engagementRate: 6.5,
    },
];

const metricOptions: MetricOption[] = [
    { id: 'views', label: 'Views', icon: <Eye className="w-4 h-4" /> },
    { id: 'engagement', label: 'Engagement', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'likes', label: 'Likes', icon: <Heart className="w-4 h-4" /> },
    { id: 'replies', label: 'Replies', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'reposts', label: 'Reposts', icon: <Repeat className="w-4 h-4" /> },
];

const dateRanges: DateRange[] = [
    { label: '7 days', days: 7 },
    { label: '30 days', days: 30 },
    { label: '90 days', days: 90 },
];

export default function StatisticsPage() {
    const { data: session } = useSession();
    const { selectedAccountId, getSelectedAccount } = useSocialAccountStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userInsights, setUserInsights] = useState<InsightsData[]>([]);
    const [selectedMetric, setSelectedMetric] = useState('views');
    const [selectedTopPostMetric, setSelectedTopPostMetric] = useState('views');
    const [selectedDateRange, setSelectedDateRange] = useState(30);

    // 클라이언트사이드에서만 계정 상태를 확인하기 위한 state
    const [isClient, setIsClient] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [topPosts, setTopPosts] = useState<PostWithInsights[]>([]);

    // API 호출 함수를 useCallback으로 메모이제이션
    const fetchUserInsights = useCallback(async (metrics: string[]) => {
        try {
            // 선택된 계정이 없으면 에러
            if (!selectedAccount) {
                throw new Error('No account selected');
            }

            const since = Math.floor(Date.now() / 1000) - (selectedDateRange * 24 * 60 * 60);
            const until = Math.floor(Date.now() / 1000);

            // 선택된 계정의 social_id를 user_id로 사용
            const userId = selectedAccount.social_id;

            // Time Series 메트릭과 Total Value 메트릭을 분리해서 호출
            const allInsights: InsightsData[] = [];

            // 1. Time Series 메트릭 (views) - since/until 사용
            const timeSeriesMetrics = metrics.filter(m => m === 'views');
            if (timeSeriesMetrics.length > 0) {
                console.log(`Fetching Time Series metrics: ${timeSeriesMetrics.join(', ')}`);
                const timeSeriesResponse = await fetch(
                    `/api/insights?type=user&user_id=${userId}&metric=${timeSeriesMetrics.join(',')}&since=${since}&until=${until}`
                );
                if (timeSeriesResponse.ok) {
                    const timeSeriesData = await timeSeriesResponse.json();
                    console.log('Time Series data:', timeSeriesData);
                    allInsights.push(...(timeSeriesData.data || []));
                } else {
                    console.error('Time Series API error:', await timeSeriesResponse.text());
                }
            }

            // 2. Total Value 메트릭 (likes, replies, reposts, quotes) - since/until 사용
            const totalValueMetrics = metrics.filter(m => ['likes', 'replies', 'reposts', 'quotes'].includes(m));
            if (totalValueMetrics.length > 0) {
                console.log(`Fetching Total Value metrics: ${totalValueMetrics.join(', ')}`);
                const totalValueResponse = await fetch(
                    `/api/insights?type=user&user_id=${userId}&metric=${totalValueMetrics.join(',')}&since=${since}&until=${until}`
                );
                if (totalValueResponse.ok) {
                    const totalValueData = await totalValueResponse.json();
                    console.log('Total Value data:', totalValueData);
                    allInsights.push(...(totalValueData.data || []));
                } else {
                    console.error('Total Value API error:', await totalValueResponse.text());
                }
            }

            // 3. 독립 메트릭 (followers_count) - since/until 사용하지 않음
            const independentMetrics = metrics.filter(m => m === 'followers_count');
            if (independentMetrics.length > 0) {
                console.log(`Fetching Independent metrics: ${independentMetrics.join(', ')}`);
                const independentResponse = await fetch(
                    `/api/insights?type=user&user_id=${userId}&metric=${independentMetrics.join(',')}`
                );
                if (independentResponse.ok) {
                    const independentData = await independentResponse.json();
                    console.log('Independent data:', independentData);
                    allInsights.push(...(independentData.data || []));
                } else {
                    console.error('Independent API error:', await independentResponse.text());
                }
            }

            console.log('All insights combined:', allInsights);
            return allInsights;
        } catch (error) {
            console.error('Error fetching insights:', error);
            return [];
        }
    }, [selectedAccount, selectedDateRange]);

    // 사용자 포스트 가져오기
    const fetchUserPosts = useCallback(async (limit = 20): Promise<ThreadsPost[]> => {
        try {
            if (!selectedAccount) {
                throw new Error('No account selected');
            }

            const userId = selectedAccount.social_id;
            const response = await fetch(
                `/api/user-posts?user_id=${userId}&limit=${limit}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch user posts');
            }

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching user posts:', error);
            return [];
        }
    }, [selectedAccount]);

    // 개별 포스트의 insights 가져오기
    const fetchPostInsights = useCallback(async (postId: string): Promise<any> => {
        try {
            if (!selectedAccount) {
                throw new Error('No account selected');
            }

            const userId = selectedAccount.social_id;
            const response = await fetch(
                `/api/insights?type=media&media_id=${postId}&owner_user_id=${userId}&metric=views,likes,replies,reposts,shares`
            );

            if (!response.ok) {
                console.error(`Failed to fetch insights for post ${postId}`);
                return null;
            }

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error(`Error fetching insights for post ${postId}:`, error);
            return null;
        }
    }, [selectedAccount]);

    // 포스트와 insights를 결합하여 Top Posts 생성
    const fetchTopPostsWithInsights = useCallback(async (): Promise<PostWithInsights[]> => {
        try {
            // 1. 사용자 포스트 가져오기 (최근 20개)
            const posts = await fetchUserPosts(20);
            if (posts.length === 0) {
                return [];
            }

            // 2. 각 포스트의 insights 병렬로 가져오기
            const postsWithInsights: PostWithInsights[] = [];

            // Promise.all로 병렬 처리하되, 실패한 것들은 제외
            const insightsPromises = posts.map(async (post) => {
                const insights = await fetchPostInsights(post.id);
                if (!insights) return null;

                // insights 데이터에서 메트릭 추출
                const getMetricValue = (metricName: string): number => {
                    const metric = insights.find((item: any) => item.name === metricName);
                    return metric?.total_value?.value || 0;
                };

                const viewCount = getMetricValue('views');
                const likeCount = getMetricValue('likes');
                const replyCount = getMetricValue('replies');
                const repostCount = getMetricValue('reposts');
                const shareCount = getMetricValue('shares');

                // engagement rate 계산: (likes + replies + reposts + shares) / views * 100
                const totalEngagement = likeCount + replyCount + repostCount + shareCount;
                const engagementRate = viewCount > 0 ? (totalEngagement / viewCount) * 100 : 0;

                return {
                    ...post,
                    viewCount,
                    likeCount,
                    commentCount: replyCount,
                    repostCount,
                    shareCount,
                    engagementRate: Math.round(engagementRate * 100) / 100, // 소수점 2자리
                } as PostWithInsights;
            });

            const results = await Promise.all(insightsPromises);

            // null이 아닌 결과들만 필터링
            results.forEach(result => {
                if (result) postsWithInsights.push(result);
            });

            return postsWithInsights;
        } catch (error) {
            console.error('Error fetching top posts with insights:', error);
            return [];
        }
    }, [fetchUserPosts, fetchPostInsights]);

    // 데이터 로딩 함수를 useCallback으로 메모이제이션
    const loadData = useCallback(async (showRefresh = false) => {
        if (showRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        // 시뮬레이션된 로딩 지연 (실제로는 API 호출)
        await new Promise(resolve => setTimeout(resolve, showRefresh ? 500 : 1000));

        try {
            // User insights 조회 (더 많은 메트릭 포함)
            const insights = await fetchUserInsights(['views', 'likes', 'replies', 'reposts', 'quotes', 'followers_count']);
            setUserInsights(insights);

            // Top Posts 가져오기
            const topPosts = await fetchTopPostsWithInsights();
            setTopPosts(topPosts);
        } catch (error) {
            console.error('Error loading insights:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [fetchUserInsights, fetchTopPostsWithInsights]);

    // 클라이언트 마운트 후 계정 정보 설정
    useEffect(() => {
        setIsClient(true);
        setSelectedAccount(getSelectedAccount());
    }, [selectedAccountId, getSelectedAccount]);

    // 데이터 로딩
    useEffect(() => {
        if (session && selectedAccount && isClient) {
            loadData();
        }
    }, [session, selectedAccount, isClient, loadData]);

    // 새로고침 핸들러
    const handleRefresh = () => {
        if (selectedAccount) {
            loadData(true);
        }
    };

    // 인사이트 데이터에서 값 추출
    const getInsightValue = (insights: InsightsData[], metricName: string): number => {
        const insight = insights.find(item => item.name === metricName);
        if (!insight) return 0;

        if (insight.total_value) {
            return insight.total_value.value;
        }

        if (insight.values && insight.values.length > 0) {
            return insight.values.reduce((sum, item) => sum + item.value, 0);
        }

        return 0;
    };

    // 실제 API 데이터에서 차트 데이터 생성
    const generateChartData = useCallback(() => {
        // 환경변수로 Mock 데이터 강제 사용
        if (USE_MOCK_DATA || !userInsights || userInsights.length === 0) {
            return mockChartData;
        }

        // views는 Time Series 메트릭이므로 일별 데이터가 있음
        const viewsInsight = userInsights.find(item => item.name === 'views');

        if (!viewsInsight || !viewsInsight.values || viewsInsight.values.length === 0) {
            return mockChartData;
        }

        // likes, replies, reposts, quotes는 Total Value 메트릭이므로 총합만 있음
        const totalLikes = getInsightValue(userInsights, 'likes');
        const totalReplies = getInsightValue(userInsights, 'replies');
        const totalReposts = getInsightValue(userInsights, 'reposts');
        const totalQuotes = getInsightValue(userInsights, 'quotes');
        const totalEngagement = totalLikes + totalReplies + totalReposts + totalQuotes;

        // Time Series 데이터에서 차트 데이터 생성
        const chartData = viewsInsight.values.map((viewData, index) => {
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
            return chartData.filter((_, index) => index % 5 === 0 || index === chartData.length - 1);
        } else if (selectedDateRange === 90) {
            // 90일: 주간 단위로 표시 (7일 간격)
            return chartData.filter((_, index) => index % 7 === 0 || index === chartData.length - 1);
        }

        return chartData;
    }, [userInsights, selectedDateRange]);

    // 실제 API 데이터에서 파이 차트 데이터 생성
    const generatePieData = useCallback(() => {
        // 환경변수로 Mock 데이터 강제 사용
        if (USE_MOCK_DATA || !userInsights || userInsights.length === 0) {
            return mockPieData;
        }

        const likes = getInsightValue(userInsights, 'likes');
        const replies = getInsightValue(userInsights, 'replies');
        const reposts = getInsightValue(userInsights, 'reposts');
        const quotes = getInsightValue(userInsights, 'quotes');

        const total = likes + replies + reposts + quotes;

        if (total === 0) {
            return mockPieData; // 모든 값이 0이면 Mock 데이터 사용
        }

        return [
            { name: 'Likes', value: Math.round((likes / total) * 100), color: '#ef4444' },
            { name: 'Replies', value: Math.round((replies / total) * 100), color: '#3b82f6' },
            { name: 'Reposts', value: Math.round((reposts / total) * 100), color: '#10b981' },
            { name: 'Quotes', value: Math.round((quotes / total) * 100), color: '#f59e0b' },
        ];
    }, [userInsights]);

    // 차트와 파이 데이터 생성
    const chartData = generateChartData();
    const pieData = generatePieData();

    // 메트릭 카드 데이터
    const metricCards = [
        {
            title: "Total Followers",
            value: getInsightValue(userInsights, 'followers_count') || 'No data',
            change: "+12.5%",
            changeType: "positive" as const,
            icon: <Users className="w-5 h-5" />,
            description: "followers"
        },
        {
            title: "Total Likes",
            value: getInsightValue(userInsights, 'likes') || 'No data',
            change: "+8.2%",
            changeType: "positive" as const,
            icon: <Heart className="w-5 h-5" />,
            description: `in last ${selectedDateRange} days`
        },
        {
            title: "Total Replies",
            value: getInsightValue(userInsights, 'replies') || 'No data',
            change: "+3.1%",
            changeType: "positive" as const,
            icon: <MessageCircle className="w-5 h-5" />,
            description: `in last ${selectedDateRange} days`
        },
    ];

    // 탑 포스트 정렬
    const getDisplayTopPosts = (): TopPost[] => {
        // 환경변수나 실제 데이터 유무에 따라 Mock 또는 실제 데이터 사용
        if (USE_MOCK_DATA || topPosts.length === 0) {
            return mockTopPosts;
        }

        // 실제 API 데이터를 TopPost 형태로 변환
        return topPosts.map(post => ({
            id: post.id,
            content: post.text || 'No content available',
            username: post.username,
            avatar: '/avatars/01.png', // 기본 아바타 (실제로는 프로필 이미지 API 필요)
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
    if (!isClient || !selectedAccount) {
        return (
            <div className="space-y-6 p-6">
                {/* Loading State */}
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
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Statistics</h1>
                    <p className="text-muted-foreground mt-1">
                        {selectedAccount.account_name}의 성과 분석
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
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
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="w-full sm:w-auto"
                    >
                        {refreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        새로고침
                    </Button>
                </div>
            </div>

            {loading ? (
                /* Loading State */
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-gray-200 rounded-lg h-24 animate-pulse" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gray-200 rounded-lg h-80 animate-pulse" />
                        <div className="bg-gray-200 rounded-lg h-80 animate-pulse" />
                    </div>
                </div>
            ) : (
                <>
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {metricCards.map((card, index) => (
                            <Card key={index}>
                                <CardContent className="p-4 md:p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                {card.title}
                                            </p>
                                            {loading ? (
                                                <div className="space-y-1">
                                                    <div className="h-8 bg-gray-200 rounded animate-pulse w-20" />
                                                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <div className="text-xl md:text-2xl font-bold">
                                                        {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                                                    </div>
                                                    <div className="flex items-center text-sm">
                                                        <span className={`font-medium ${card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {card.change}
                                                        </span>
                                                        <span className="text-muted-foreground ml-1">
                                                            {card.description}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="h-6 w-6 text-muted-foreground">
                                            {card.icon}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Line Chart */}
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <CardTitle className="text-lg">Performance Over Time</CardTitle>
                                    <div className="flex flex-wrap gap-2">
                                        {metricOptions.map((option) => (
                                            <Button
                                                key={option.id}
                                                variant={selectedMetric === option.id ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setSelectedMetric(option.id)}
                                                className="text-xs h-8"
                                            >
                                                {option.icon}
                                                <span className="ml-1">{option.label}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
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
                                <p className="text-sm text-muted-foreground">
                                    지난 {selectedDateRange}일 동안의 인게이지먼트 분포
                                </p>
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
                                                {pieData.map((entry, index) => (
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
                            {loading ? (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="bg-gray-200 rounded-lg h-24 animate-pulse" />
                                    ))}
                                </div>
                            ) : topPosts.length > 0 ? (
                                <div className="space-y-4">
                                    {topPosts.map((post, index) => (
                                        <div key={index} className="w-full">
                                            <PostCard
                                                variant="compact"
                                                avatar={'/avatars/01.png'}
                                                username={post.username || selectedAccount.account_name}
                                                content={post.text || ''}
                                                likeCount={post.likeCount}
                                                commentCount={post.commentCount}
                                                repostCount={post.repostCount}
                                                viewCount={post.viewCount}
                                                timestamp={post.timestamp}
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