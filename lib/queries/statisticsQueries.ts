import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { statisticsKeys } from './statisticsKeys';

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

// User Insights Query Function
export const fetchUserInsights = async (
  accountId: string,
  dateRange: number
): Promise<InsightsData[]> => {
  const since = Math.floor(Date.now() / 1000) - (dateRange * 24 * 60 * 60);
  const until = Math.floor(Date.now() / 1000);

  const allInsights: InsightsData[] = [];

  try {
    // Time Series 메트릭 (views)
    const timeSeriesResponse = await fetch(
      `/api/insights?type=user&user_id=${accountId}&metric=views&since=${since}&until=${until}`
    );
    if (timeSeriesResponse.ok) {
      const data = await timeSeriesResponse.json();
      allInsights.push(...(data.data || []));
    }

    // Total Value 메트릭 (likes, replies, reposts, quotes)
    const totalValueResponse = await fetch(
      `/api/insights?type=user&user_id=${accountId}&metric=likes,replies,reposts,quotes&since=${since}&until=${until}`
    );
    if (totalValueResponse.ok) {
      const data = await totalValueResponse.json();
      allInsights.push(...(data.data || []));
    }

    // 독립 메트릭 (followers_count)
    const followersResponse = await fetch(
      `/api/insights?type=user&user_id=${accountId}&metric=followers_count`
    );
    if (followersResponse.ok) {
      const data = await followersResponse.json();
      allInsights.push(...(data.data || []));
    }

    return allInsights;
  } catch (error) {
    console.error('Error fetching user insights:', error);
    return [];
  }
};

// Previous Period Insights Query Function (과거 동일 기간 데이터)
export const fetchPreviousPeriodInsights = async (
  accountId: string,
  dateRange: number
): Promise<InsightsData[]> => {
  // 과거 기간: 현재 기간 이전의 동일한 길이 기간
  const previousSince = Math.floor(Date.now() / 1000) - (dateRange * 2 * 24 * 60 * 60);
  const previousUntil = Math.floor(Date.now() / 1000) - (dateRange * 24 * 60 * 60);

  // 2024년 4월 13일 이전 데이터는 없으므로 체크
  const minTimestamp = 1712991600; // 2024년 4월 13일
  if (previousSince < minTimestamp) {
    return []; // 과거 데이터가 지원 범위를 벗어남
  }

  const allInsights: InsightsData[] = [];

  try {
    // Total Value 메트릭만 가져오기 (views는 time series이므로 과거 비교 불가)
    const totalValueResponse = await fetch(
      `/api/insights?type=user&user_id=${accountId}&metric=likes,replies,reposts,quotes&since=${previousSince}&until=${previousUntil}`
    );
    if (totalValueResponse.ok) {
      const data = await totalValueResponse.json();
      allInsights.push(...(data.data || []));
    }

    return allInsights;
  } catch (error) {
    console.error('Error fetching previous period insights:', error);
    return [];
  }
};

// 변화율 계산 함수들
export const calculateChanges = (
  currentInsights: InsightsData[],
  previousInsights: InsightsData[]
) => {
  const changes: Record<string, { change: string; changeType: 'positive' | 'negative' | 'neutral' }> = {};

  const getCurrentValue = (metricName: string): number => {
    const insight = currentInsights.find(item => item.name === metricName);
    if (!insight) return 0;

    if (insight.total_value) {
      return insight.total_value.value;
    }

    if (insight.values && insight.values.length > 0) {
      return insight.values.reduce((sum, item) => sum + item.value, 0);
    }

    return 0;
  };

  const getPreviousValue = (metricName: string): number => {
    const insight = previousInsights.find(item => item.name === metricName);
    if (!insight) return 0;

    if (insight.total_value) {
      return insight.total_value.value;
    }

    if (insight.values && insight.values.length > 0) {
      return insight.values.reduce((sum, item) => sum + item.value, 0);
    }

    return 0;
  };

  // Views 변화율 (Time Series 데이터의 첫날 vs 마지막날)
  const viewsInsight = currentInsights.find(item => item.name === 'views');
  if (viewsInsight?.values && viewsInsight.values.length > 1) {
    const firstValue = viewsInsight.values[0]?.value || 0;
    const lastValue = viewsInsight.values[viewsInsight.values.length - 1]?.value || 0;

    if (firstValue > 0) {
      const changePercent = ((lastValue - firstValue) / firstValue) * 100;
      changes.views = {
        change: changePercent >= 0 ? `+${changePercent.toFixed(1)}%` : `${changePercent.toFixed(1)}%`,
        changeType: changePercent >= 0 ? 'positive' : 'negative'
      };
    } else {
      changes.views = { change: 'No data', changeType: 'neutral' };
    }
  } else {
    changes.views = { change: 'No data', changeType: 'neutral' };
  }

  // Total Value 메트릭들 변화율 (현재 vs 과거 기간)
  const totalValueMetrics = ['likes', 'replies', 'reposts', 'quotes'];

  totalValueMetrics.forEach(metric => {
    const currentValue = getCurrentValue(metric);
    const previousValue = getPreviousValue(metric);

    if (previousValue > 0) {
      const changePercent = ((currentValue - previousValue) / previousValue) * 100;
      changes[metric] = {
        change: changePercent >= 0 ? `+${changePercent.toFixed(1)}%` : `${changePercent.toFixed(1)}%`,
        changeType: changePercent >= 0 ? 'positive' : 'negative'
      };
    } else {
      changes[metric] = { change: 'No data', changeType: 'neutral' };
    }
  });

  return changes;
};

// Top Posts Query Function
export const fetchTopPosts = async (accountId: string): Promise<PostWithInsights[]> => {
  try {
    // 사용자 포스트 가져오기
    const postsResponse = await fetch(`/api/user-posts?user_id=${accountId}&limit=20`);
    if (!postsResponse.ok) return [];

    const postsData = await postsResponse.json();
    const posts: ThreadsPost[] = postsData.data || [];

    if (posts.length === 0) return [];

    // 각 포스트의 insights 병렬로 가져오기
    const insightsPromises = posts.map(async (post) => {
      try {
        const response = await fetch(
          `/api/insights?type=media&media_id=${post.id}&owner_user_id=${accountId}&metric=views,likes,replies,reposts,shares`
        );

        if (!response.ok) return null;

        const data = await response.json();
        const insights = data.data || [];

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

        return {
          ...post,
          viewCount,
          likeCount,
          commentCount: replyCount,
          repostCount,
          shareCount,
          engagementRate: Math.round(engagementRate * 100) / 100,
        };
      } catch (error) {
        console.error(`Error fetching insights for post ${post.id}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(insightsPromises);

    // 성공한 결과만 필터링
    return results
      .filter((result): result is PromiseFulfilledResult<PostWithInsights> =>
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  } catch (error) {
    console.error('Error fetching top posts:', error);
    return [];
  }
};

// Custom Hooks
export const useUserInsights = (accountId: string, dateRange: number) => {
  return useQuery({
    queryKey: statisticsKeys.userInsights(accountId, dateRange),
    queryFn: () => fetchUserInsights(accountId, dateRange),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 30 * 60 * 1000, // 30분 (cacheTime은 deprecated되어 gcTime 사용)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useTopPosts = (accountId: string) => {
  return useQuery({
    queryKey: statisticsKeys.topPosts(accountId),
    queryFn: () => fetchTopPosts(accountId),
    enabled: !!accountId,
    staleTime: 10 * 60 * 1000, // 10분 (더 긴 캐시 시간)
    gcTime: 60 * 60 * 1000, // 1시간
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// 변화율 계산이 포함된 통합 hook
export const useStatisticsWithChanges = (accountId: string, dateRange: number) => {
  // 현재 기간 데이터
  const currentInsightsQuery = useQuery({
    queryKey: statisticsKeys.userInsights(accountId, dateRange),
    queryFn: () => fetchUserInsights(accountId, dateRange),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!accountId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // 과거 기간 데이터
  const previousInsightsQuery = useQuery({
    queryKey: [...statisticsKeys.userInsights(accountId, dateRange), 'previous'],
    queryFn: () => fetchPreviousPeriodInsights(accountId, dateRange),
    staleTime: 10 * 60 * 1000, // 10분 (과거 데이터는 더 오래 캐시)
    gcTime: 60 * 60 * 1000, // 1시간
    enabled: !!accountId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // 변화율 계산
  const changes = useMemo(() => {
    if (!currentInsightsQuery.data || !previousInsightsQuery.data) {
      // 기본값 반환
      return {
        views: { change: 'No data', changeType: 'neutral' as const },
        likes: { change: 'No data', changeType: 'neutral' as const },
        replies: { change: 'No data', changeType: 'neutral' as const },
        reposts: { change: 'No data', changeType: 'neutral' as const },
        quotes: { change: 'No data', changeType: 'neutral' as const },
        followers_count: { change: 'N/A', changeType: 'neutral' as const },
      };
    }

    return calculateChanges(currentInsightsQuery.data, previousInsightsQuery.data);
  }, [currentInsightsQuery.data, previousInsightsQuery.data]);

  return {
    currentInsights: currentInsightsQuery.data || [],
    previousInsights: previousInsightsQuery.data || [],
    changes,
    isLoading: currentInsightsQuery.isLoading,
    isError: currentInsightsQuery.isError || previousInsightsQuery.isError,
    error: currentInsightsQuery.error || previousInsightsQuery.error,
    refetch: () => {
      currentInsightsQuery.refetch();
      previousInsightsQuery.refetch();
    }
  };
};

// Refresh Mutation
export const useRefreshStatistics = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, dateRange }: { accountId: string; dateRange: number }) => {
      // 기존 캐시 무효화
      await queryClient.invalidateQueries({
        queryKey: statisticsKeys.userInsights(accountId, dateRange)
      });
      await queryClient.invalidateQueries({
        queryKey: statisticsKeys.topPosts(accountId)
      });

      // 새로운 데이터 fetch
      return Promise.all([
        queryClient.fetchQuery({
          queryKey: statisticsKeys.userInsights(accountId, dateRange),
          queryFn: () => fetchUserInsights(accountId, dateRange),
        }),
        queryClient.fetchQuery({
          queryKey: statisticsKeys.topPosts(accountId),
          queryFn: () => fetchTopPosts(accountId),
        }),
      ]);
    },
  });
}; 