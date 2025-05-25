export interface MetricData {
    label: string;
    value: number;
}

export interface PostData {
    id: string;
    title: string;
    impressions: string;
    reach: string;
    engagementRate: number;
}

export interface DashboardData {
    impressions: MetricData[];
    reach: MetricData[];
    profileViews: MetricData[];
    followers: MetricData[];
    engagement: number;
    topPosts: PostData[];
    isMock?: boolean;
}

// Default data structure
const defaultData: Record<string, DashboardData> = {
    "24h": {
        impressions: Array(24).fill(0).map((_, i) => ({ label: `${i}H`, value: 1000 + i * 200 })),
        reach: Array(24).fill(0).map((_, i) => ({ label: `${i}H`, value: 500 + i * 100 })),
        profileViews: Array(24).fill(0).map((_, i) => ({ label: `${i}H`, value: 50 + i * 10 })),
        followers: Array(24).fill(0).map((_, i) => ({ label: `${i}H`, value: 10000 + i * 50 })),
        engagement: 7.2,
        topPosts: Array(5).fill(0).map((_, i) => ({
            id: `post-${i}`,
            title: `Top Post ${i + 1}`,
            impressions: (10000 * (i + 1)).toLocaleString(),
            reach: (5000 * (i + 1)).toLocaleString(),
            engagementRate: 5 + i * 2,
        })),
    },
    "7d": {
        impressions: Array(7).fill(0).map((_, i) => ({ label: `Day ${i + 1}`, value: 5000 + i * 1000 })),
        reach: Array(7).fill(0).map((_, i) => ({ label: `Day ${i + 1}`, value: 2500 + i * 500 })),
        profileViews: Array(7).fill(0).map((_, i) => ({ label: `Day ${i + 1}`, value: 300 + i * 50 })),
        followers: Array(7).fill(0).map((_, i) => ({ label: `Day ${i + 1}`, value: 10000 + i * 200 })),
        engagement: 6.8,
        topPosts: Array(5).fill(0).map((_, i) => ({
            id: `post-${i}`,
            title: `Top Post ${i + 1}`,
            impressions: (15000 * (i + 1)).toLocaleString(),
            reach: (8000 * (i + 1)).toLocaleString(),
            engagementRate: 6 + i * 2,
        })),
    },
    "30d": {
        impressions: Array(4).fill(0).map((_, i) => ({ label: `Week ${i + 1}`, value: 30000 + i * 5000 })),
        reach: Array(4).fill(0).map((_, i) => ({ label: `Week ${i + 1}`, value: 15000 + i * 2500 })),
        profileViews: Array(4).fill(0).map((_, i) => ({ label: `Week ${i + 1}`, value: 1500 + i * 300 })),
        followers: Array(4).fill(0).map((_, i) => ({ label: `Week ${i + 1}`, value: 10000 + i * 1000 })),
        engagement: 7.5,
        topPosts: Array(5).fill(0).map((_, i) => ({
            id: `post-${i}`,
            title: `Top Post ${i + 1}`,
            impressions: (20000 * (i + 1)).toLocaleString(),
            reach: (10000 * (i + 1)).toLocaleString(),
            engagementRate: 7 + i * 2,
        })),
    },
};

function calculateEngagement(data: any): number {
    if (!data.data) return defaultData["7d"].engagement;

    const impressions = data.data.find((d: any) => d.name === "impressions")?.values[0]?.value || 0;
    const reach = data.data.find((d: any) => d.name === "reach")?.values[0]?.value || 0;

    return reach > 0 ? Math.round((impressions / reach) * 100) / 10 : 0;
}

async function fetchTopPosts(accessToken: string, userId: string): Promise<PostData[]> {
    try {
        const response = await fetch(
            `https://graph.threads.net/${userId}/media?access_token=${accessToken}&fields=like_count,comments_count,thumbnail_url,caption`
        );
        const data = await response.json();
        return data.data?.slice(0, 5).map((post: any, i: number) => ({
            id: post.id,
            title: post.caption?.split('\n')[0] || `Post ${i + 1}`,
            impressions: (post.like_count + post.comments_count * 5).toLocaleString(),
            reach: (post.like_count + post.comments_count * 2).toLocaleString(),
            engagementRate: Math.min(10, Math.round((post.comments_count / (post.like_count || 1)) * 100) / 10),
        })) || defaultData["7d"].topPosts;
    } catch (error) {
        console.error("Error fetching top posts:", error);
        return defaultData["7d"].topPosts;
    }
}

export function transformThreadsData(apiData: any, range: string): DashboardData {
    if (!apiData?.data) return { ...defaultData[range], isMock: true };

    const metrics = apiData.data.reduce((acc: any, item: any) => {
        acc[item.name] = item.values.map((val: any, i: number) => ({
            value: val.value,
            label: range === '24h' ? `${i}H` :
                range === '7d' ? `Day ${i + 1}` :
                    `Week ${i + 1}`
        }));
        return acc;
    }, {});

    return {
        impressions: metrics.impressions || defaultData[range].impressions,
        reach: metrics.reach || defaultData[range].reach,
        profileViews: metrics.profile_views || defaultData[range].profileViews,
        followers: metrics.follower_count || defaultData[range].followers,
        engagement: apiData.engagement || defaultData[range].engagement,
        topPosts: apiData.top_posts || defaultData[range].topPosts,
        isMock: false
    };
}

export async function fetchThreadsInsights(accessToken: string, range: string, userId: string): Promise<DashboardData> {
    const endpoint = `https://graph.threads.net/${userId}/insights`;

    const period = range === '24h' ? 'day' : range === '7d' ? 'week' : 'days_28';
    const metrics = ['impressions', 'reach', 'profile_views', 'follower_count'];

    try {
        const response = await fetch(
            `${endpoint}?metric=${metrics.join(',')}&period=${period}&access_token=${accessToken}`
        );

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const transformed = transformThreadsData({
            ...data,
            engagement: calculateEngagement(data),
            top_posts: await fetchTopPosts(accessToken, userId)
        }, range);

        return transformed;
    } catch (error) {
        console.error("Threads API Error:", error);
        return { ...defaultData[range], isMock: true };
    }
}

