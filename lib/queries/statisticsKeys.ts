export const statisticsKeys = {
  all: ['statistics'] as const,
  insights: () => [...statisticsKeys.all, 'insights'] as const,
  userInsights: (accountId: string, dateRange: number) =>
    [...statisticsKeys.insights(), 'user', accountId, dateRange] as const,
  topPosts: (accountId: string) =>
    [...statisticsKeys.insights(), 'topPosts', accountId] as const,
} as const; 