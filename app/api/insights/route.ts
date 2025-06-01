import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { createClient } from "@/lib/supabase/server";

/**
 * Threads Insights API
 * 
 * 이 API는 Threads의 Insights 데이터를 조회합니다.
 * 두 가지 타입의 인사이트를 지원합니다:
 * 
 * 1. Media Insights - 특정 포스트/미디어의 인사이트
 * 2. User Insights - 사용자 계정 전체의 인사이트
 * 
 * API 사용 예시:
 * 
 * Media Insights:
 * GET /api/insights?type=media&media_id=123456&owner_user_id=user123&metric=likes,views,replies
 * 
 * User Insights:
 * GET /api/insights?type=user&user_id=user123&metric=views,followers_count&since=1712991600&until=1713078000
 * 
 * User Insights (follower_demographics):
 * GET /api/insights?type=user&user_id=user123&metric=follower_demographics&breakdown=country
 * 
 * 주의사항:
 * - user_id는 선택된 Threads 계정의 social_id를 사용
 * - 해당 계정이 현재 로그인한 사용자의 계정인지 서버에서 확인
 * - since/until 파라미터는 2024년 4월 13일 (Unix timestamp: 1712991600) 이후 날짜만 지원
 * - followers_count와 follower_demographics는 since/until 파라미터를 지원하지 않음
 * - follower_demographics 메트릭은 breakdown 파라미터가 필수 (country, city, age, gender 중 하나)
 * - 최소 100명의 팔로워가 있어야 follower_demographics 사용 가능
 */

// TypeScript 타입 정의
interface ThreadsInsightValue {
    value: number;
    end_time?: string;
}

interface ThreadsInsightData {
    name: string;
    period: string;
    values?: ThreadsInsightValue[];
    total_value?: {
        value: number;
    };
    title: string;
    description: string;
    id: string;
}

interface ThreadsInsightsResponse {
    data: ThreadsInsightData[];
}

interface ThreadsApiError {
    error: {
        message: string;
        type: string;
        code: number;
    };
}

// 유효한 Media insights 메트릭
const VALID_MEDIA_METRICS = ['views', 'likes', 'replies', 'reposts', 'quotes', 'shares'] as const;
type MediaMetric = typeof VALID_MEDIA_METRICS[number];

// 유효한 User insights 메트릭
const VALID_USER_METRICS = ['views', 'likes', 'replies', 'reposts', 'quotes', 'followers_count', 'follower_demographics'] as const;
type UserMetric = typeof VALID_USER_METRICS[number];

// 향후 구현 예정 메트릭 (현재 Threads API에서 지원하지 않음):
// - posts: 사용자가 작성한 총 포스트 수
// - streak: 연속 포스팅 일수

// 현재 사용자의 특정 Threads 계정 액세스 토큰 조회
async function getThreadsAccessToken(userId: string, threadsUserId: string): Promise<string | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('social_accounts')
        .select('access_token')
        .eq('owner', userId)  // 현재 로그인한 사용자의 계정인지 확인
        .eq('social_id', threadsUserId)  // 요청된 Threads 사용자 ID
        .eq('platform', 'threads')
        .eq('is_active', true)  // 활성 계정만
        .single();

    if (error || !data) {
        console.error('Error fetching Threads access token:', error);
        return null;
    }

    return data.access_token;
}

// 날짜 유효성 검사 (2024년 4월 13일 이후만 허용)
function validateDateParams(since?: string, until?: string): { isValid: boolean; error?: string } {
    const minTimestamp = 1712991600; // 2024년 4월 13일 Unix timestamp

    if (since) {
        const sinceTimestamp = parseInt(since);
        if (isNaN(sinceTimestamp) || sinceTimestamp < minTimestamp) {
            return {
                isValid: false,
                error: 'since parameter must be a Unix timestamp after April 13, 2024'
            };
        }
    }

    if (until) {
        const untilTimestamp = parseInt(until);
        if (isNaN(untilTimestamp) || untilTimestamp < minTimestamp) {
            return {
                isValid: false,
                error: 'until parameter must be a Unix timestamp after April 13, 2024'
            };
        }
    }

    return { isValid: true };
}

// Media Insights 조회
async function getMediaInsights(
    mediaId: string,
    metrics: MediaMetric[],
    accessToken: string
): Promise<ThreadsInsightsResponse | ThreadsApiError> {
    const metricParam = metrics.join(',');
    const url = `https://graph.threads.net/v1.0/${mediaId}/insights?metric=${metricParam}&access_token=${accessToken}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            return data as ThreadsApiError;
        }

        return data as ThreadsInsightsResponse;
    } catch (error) {
        console.error('Error fetching media insights:', error);
        throw new Error('Failed to fetch media insights');
    }
}

// User Insights 조회
async function getUserInsights(
    userId: string,
    metrics: UserMetric[],
    accessToken: string,
    since?: string,
    until?: string,
    breakdown?: string
): Promise<ThreadsInsightsResponse | ThreadsApiError> {
    const params = new URLSearchParams();
    params.append('metric', metrics.join(','));
    params.append('access_token', accessToken);

    // followers_count와 follower_demographics는 since/until 파라미터를 지원하지 않음
    const timeIndependentMetrics = ['followers_count', 'follower_demographics'];
    const hasTimeIndependentMetrics = metrics.some(metric => timeIndependentMetrics.includes(metric));

    if (since && !hasTimeIndependentMetrics) {
        params.append('since', since);
    }

    if (until && !hasTimeIndependentMetrics) {
        params.append('until', until);
    }

    // follower_demographics의 경우 breakdown 파라미터 필요
    if (metrics.includes('follower_demographics') && breakdown) {
        const validBreakdowns = ['country', 'city', 'age', 'gender'];
        if (validBreakdowns.includes(breakdown)) {
            params.append('breakdown', breakdown);
        }
    }

    const url = `https://graph.threads.net/v1.0/${userId}/threads_insights?${params.toString()}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            return data as ThreadsApiError;
        }

        return data as ThreadsInsightsResponse;
    } catch (error) {
        console.error('Error fetching user insights:', error);
        throw new Error('Failed to fetch user insights');
    }
}

export async function GET(request: NextRequest) {
    try {
        // 세션 확인
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // URL 파라미터 추출
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'media' 또는 'user'
        const metric = searchParams.get('metric');
        const since = searchParams.get('since');
        const until = searchParams.get('until');
        const breakdown = searchParams.get('breakdown');

        // 필수 파라미터 확인
        if (!type || !metric) {
            return NextResponse.json(
                {
                    error: 'Missing required parameters',
                    message: 'type and metric parameters are required'
                },
                { status: 400 }
            );
        }

        if (!['media', 'user'].includes(type)) {
            return NextResponse.json(
                {
                    error: 'Invalid type parameter',
                    message: 'type must be either "media" or "user"'
                },
                { status: 400 }
            );
        }

        // 메트릭 파라미터 파싱 및 유효성 검사
        const metrics = metric.split(',').map(m => m.trim());

        if (type === 'media') {
            const mediaId = searchParams.get('media_id');
            const mediaOwnerUserId = searchParams.get('owner_user_id'); // 미디어 소유자의 user_id 추가

            if (!mediaId) {
                return NextResponse.json(
                    {
                        error: 'Missing media_id parameter',
                        message: 'media_id is required for media insights'
                    },
                    { status: 400 }
                );
            }

            if (!mediaOwnerUserId) {
                return NextResponse.json(
                    {
                        error: 'Missing owner_user_id parameter',
                        message: 'owner_user_id is required for media insights to verify ownership'
                    },
                    { status: 400 }
                );
            }

            const invalidMetrics = metrics.filter(m => !VALID_MEDIA_METRICS.includes(m as MediaMetric));
            if (invalidMetrics.length > 0) {
                return NextResponse.json(
                    {
                        error: 'Invalid metrics for media insights',
                        message: `Invalid metrics: ${invalidMetrics.join(', ')}. Valid metrics: ${VALID_MEDIA_METRICS.join(', ')}`
                    },
                    { status: 400 }
                );
            }

            // Threads 액세스 토큰 조회 (미디어 소유자의 토큰)
            const accessToken = await getThreadsAccessToken(session.user.id, mediaOwnerUserId);
            if (!accessToken) {
                return NextResponse.json(
                    { error: 'Threads account not connected or access denied' },
                    { status: 400 }
                );
            }

            // Media insights 조회
            const result = await getMediaInsights(mediaId, metrics as MediaMetric[], accessToken);

            if ('error' in result) {
                return NextResponse.json(result, { status: 400 });
            }

            return NextResponse.json(result);

        } else if (type === 'user') {
            const userId = searchParams.get('user_id');
            if (!userId) {
                return NextResponse.json(
                    {
                        error: 'Missing user_id parameter',
                        message: 'user_id is required for user insights'
                    },
                    { status: 400 }
                );
            }

            const invalidMetrics = metrics.filter(m => !VALID_USER_METRICS.includes(m as UserMetric));
            if (invalidMetrics.length > 0) {
                return NextResponse.json(
                    {
                        error: 'Invalid metrics for user insights',
                        message: `Invalid metrics: ${invalidMetrics.join(', ')}. Valid metrics: ${VALID_USER_METRICS.join(', ')}`
                    },
                    { status: 400 }
                );
            }

            // 날짜 파라미터 유효성 검사
            const dateValidation = validateDateParams(since || undefined, until || undefined);
            if (!dateValidation.isValid) {
                return NextResponse.json(
                    {
                        error: 'Invalid date parameter',
                        message: dateValidation.error
                    },
                    { status: 400 }
                );
            }

            // follower_demographics 메트릭의 경우 breakdown 파라미터 확인
            if (metrics.includes('follower_demographics') && !breakdown) {
                return NextResponse.json(
                    {
                        error: 'Missing breakdown parameter',
                        message: 'breakdown parameter is required for follower_demographics metric. Valid values: country, city, age, gender'
                    },
                    { status: 400 }
                );
            }

            // Threads 액세스 토큰 조회
            const accessToken = await getThreadsAccessToken(session.user.id, userId);
            if (!accessToken) {
                return NextResponse.json(
                    { error: 'Threads account not connected or access denied' },
                    { status: 400 }
                );
            }

            // User insights 조회
            const result = await getUserInsights(
                userId,
                metrics as UserMetric[],
                accessToken,
                since || undefined,
                until || undefined,
                breakdown || undefined
            );

            if ('error' in result) {
                return NextResponse.json(result, { status: 400 });
            }

            return NextResponse.json(result);
        }

    } catch (error) {
        console.error('Error in insights API:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            { status: 500 }
        );
    }
}
