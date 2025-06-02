import { create } from 'zustand'

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

interface PostWithInsights extends ThreadsPost {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  shareCount: number;
  engagementRate: number;
}

interface CachedStatisticsData {
  accountId: string;
  dateRange: number;
  userInsights: InsightsData[];
  topPosts: PostWithInsights[];
  lastUpdated: number;
}

interface StatisticsStore {
  // 상태
  cache: Map<string, CachedStatisticsData>;
  loading: boolean;
  refreshing: boolean;

  // 캐시 관리
  getCachedData: (accountId: string, dateRange: number) => CachedStatisticsData | null;
  setCachedData: (accountId: string, dateRange: number, userInsights: InsightsData[], topPosts: PostWithInsights[]) => void;
  isCacheValid: (accountId: string, dateRange: number, maxAgeMinutes?: number) => boolean;
  clearCache: () => void;

  // 상태 관리
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;

  // API 호출 함수들
  fetchUserInsights: (accountId: string, metrics: string[], dateRange: number) => Promise<InsightsData[]>;
  fetchTopPosts: (accountId: string) => Promise<PostWithInsights[]>;
  loadData: (accountId: string, dateRange: number, forceRefresh?: boolean) => Promise<{ userInsights: InsightsData[], topPosts: PostWithInsights[] }>;
}

const CACHE_DURATION_MINUTES = 5;

const getCacheKey = (accountId: string, dateRange: number): string => {
  return `${accountId}_${dateRange}`;
};

const useStatisticsStore = create<StatisticsStore>()((set, get) => ({
  // 초기 상태
  cache: new Map(),
  loading: false,
  refreshing: false,

  // 캐시 관리 함수들
  getCachedData: (accountId: string, dateRange: number) => {
    const key = getCacheKey(accountId, dateRange);
    return get().cache.get(key) || null;
  },

  setCachedData: (accountId: string, dateRange: number, userInsights: InsightsData[], topPosts: PostWithInsights[]) => {
    const key = getCacheKey(accountId, dateRange);
    const data: CachedStatisticsData = {
      accountId,
      dateRange,
      userInsights,
      topPosts,
      lastUpdated: Date.now()
    };

    const newCache = new Map(get().cache);
    newCache.set(key, data);

    // 캐시 크기 제한 (최대 20개)
    if (newCache.size > 20) {
      const oldestKey = Array.from(newCache.keys())[0];
      newCache.delete(oldestKey);
    }

    set({ cache: newCache });
  },

  isCacheValid: (accountId: string, dateRange: number, maxAgeMinutes = CACHE_DURATION_MINUTES) => {
    const cachedData = get().getCachedData(accountId, dateRange);
    if (!cachedData) return false;

    const now = Date.now();
    const age = now - cachedData.lastUpdated;
    const maxAge = maxAgeMinutes * 60 * 1000;

    return age < maxAge;
  },

  clearCache: () => {
    set({ cache: new Map() });
  },

  // 상태 관리
  setLoading: (loading: boolean) => set({ loading }),
  setRefreshing: (refreshing: boolean) => set({ refreshing }),

  // API 호출 함수들
  fetchUserInsights: async (accountId: string, metrics: string[], dateRange: number) => {
    try {
      const since = Math.floor(Date.now() / 1000) - (dateRange * 24 * 60 * 60);
      const until = Math.floor(Date.now() / 1000);

      const allInsights: InsightsData[] = [];

      // Time Series 메트릭 (views)
      const timeSeriesMetrics = metrics.filter(m => m === 'views');
      if (timeSeriesMetrics.length > 0) {
        console.log(`Fetching Time Series metrics: ${timeSeriesMetrics.join(', ')}`);
        const timeSeriesResponse = await fetch(
          `/api/insights?type=user&user_id=${accountId}&metric=${timeSeriesMetrics.join(',')}&since=${since}&until=${until}`
        );
        if (timeSeriesResponse.ok) {
          const timeSeriesData = await timeSeriesResponse.json();
          allInsights.push(...(timeSeriesData.data || []));
        }
      }

      // Total Value 메트릭
      const totalValueMetrics = metrics.filter(m => ['likes', 'replies', 'reposts', 'quotes'].includes(m));
      if (totalValueMetrics.length > 0) {
        console.log(`Fetching Total Value metrics: ${totalValueMetrics.join(', ')}`);
        const totalValueResponse = await fetch(
          `/api/insights?type=user&user_id=${accountId}&metric=${totalValueMetrics.join(',')}&since=${since}&until=${until}`
        );
        if (totalValueResponse.ok) {
          const totalValueData = await totalValueResponse.json();
          allInsights.push(...(totalValueData.data || []));
        }
      }

      // 독립 메트릭 (followers_count)
      const independentMetrics = metrics.filter(m => m === 'followers_count');
      if (independentMetrics.length > 0) {
        console.log(`Fetching Independent metrics: ${independentMetrics.join(', ')}`);
        const independentResponse = await fetch(
          `/api/insights?type=user&user_id=${accountId}&metric=${independentMetrics.join(',')}`
        );
        if (independentResponse.ok) {
          const independentData = await independentResponse.json();
          allInsights.push(...(independentData.data || []));
        }
      }

      return allInsights;
    } catch (error) {
      console.error('Error fetching insights:', error);
      return [];
    }
  },

  fetchTopPosts: async (accountId: string) => {
    try {
      // 사용자 포스트 가져오기
      const postsResponse = await fetch(`/api/user-posts?user_id=${accountId}&limit=20`);
      if (!postsResponse.ok) return [];

      const postsData = await postsResponse.json();
      const posts: ThreadsPost[] = postsData.data || [];

      if (posts.length === 0) return [];

      // 각 포스트의 insights 가져오기
      const postsWithInsights: PostWithInsights[] = [];

      for (const post of posts) {
        try {
          const insightsResponse = await fetch(
            `/api/insights?type=media&media_id=${post.id}&owner_user_id=${accountId}&metric=views,likes,replies,reposts,shares`
          );

          if (!insightsResponse.ok) continue;

          const insightsData = await insightsResponse.json();
          const insights = insightsData.data || [];

          const getMetricValue = (metricName: string): number => {
            const metric = insights.find((item: any) => item.name === metricName);
            return metric?.total_value?.value || 0;
          };

          const viewCount = getMetricValue('views');
          const likeCount = getMetricValue('likes');
          const replyCount = getMetricValue('replies');
          const repostCount = getMetricValue('reposts');
          const shareCount = getMetricValue('shares');

          const totalEngagement = likeCount + replyCount + repostCount + shareCount;
          const engagementRate = viewCount > 0 ? (totalEngagement / viewCount) * 100 : 0;

          postsWithInsights.push({
            ...post,
            viewCount,
            likeCount,
            commentCount: replyCount,
            repostCount,
            shareCount,
            engagementRate: Math.round(engagementRate * 100) / 100,
          });
        } catch (error) {
          console.error(`Error fetching insights for post ${post.id}:`, error);
        }
      }

      return postsWithInsights;
    } catch (error) {
      console.error('Error fetching top posts:', error);
      return [];
    }
  },

  loadData: async (accountId: string, dateRange: number, forceRefresh = false) => {
    const store = get();

    // 강제 새로고침이 아니고 유효한 캐시가 있으면 캐시 반환
    if (!forceRefresh && store.isCacheValid(accountId, dateRange)) {
      const cachedData = store.getCachedData(accountId, dateRange);
      if (cachedData) {
        console.log('캐시에서 데이터 반환:', cachedData);
        return {
          userInsights: cachedData.userInsights,
          topPosts: cachedData.topPosts
        };
      }
    }

    try {
      // 새로운 데이터 가져오기
      const [userInsights, topPosts] = await Promise.all([
        store.fetchUserInsights(accountId, ['views', 'likes', 'replies', 'reposts', 'quotes', 'followers_count'], dateRange),
        store.fetchTopPosts(accountId)
      ]);

      // 캐시에 저장
      store.setCachedData(accountId, dateRange, userInsights, topPosts);

      return { userInsights, topPosts };
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }
}));

export default useStatisticsStore; 