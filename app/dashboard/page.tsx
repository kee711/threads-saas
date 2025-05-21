"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { fetchThreadsInsights, DashboardData, MetricData, PostData } from "@/app/api/insights/route";

function GrowthDonut({
    currentValue,
    previousValue,
    size = 120,
    strokeWidth = 10,
}: {
    currentValue: number;
    previousValue: number;
    size?: number;
    strokeWidth?: number;
}) {
    const growthPercent = previousValue !== 0
        ? ((currentValue - previousValue) / previousValue) * 100
        : currentValue > 0 ? 100 : 0;

    const normalizedValue = Math.min(Math.max(growthPercent, -100), 100);
    const displayValue = Math.abs(normalizedValue);
    const isNegative = normalizedValue < 0;

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (displayValue / 100) * circumference;

    const getColorForGrowth = (percentage: number): string => {
        if (percentage >= 20) return "#4F46E5";
        if (percentage >= 5) return "#FBBF24";
        if (percentage >= 0) return "#84CC16";
        return "#EF4444";
    };

    const chartColor = getColorForGrowth(normalizedValue);

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#2c2c3b"
                strokeWidth={strokeWidth}
                fill="none"
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={chartColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(${isNegative ? 180 : 0} ${size / 2} ${size / 2})`}
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
            <text
                x={size / 2}
                y={size / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="16"
                fill="#FFFFFF"
            >
                {`${isNegative ? '-' : ''}${displayValue.toFixed(1)}%`}
            </text>
        </svg>
    );
}

function GrowthSummary({ metrics }: {
    metrics: {
        impressions: { current: number; previous: number };
        reach: { current: number; previous: number };
        profileViews: { current: number; previous: number };
        followers: { current: number; previous: number };
    };
}) {
    return (
        <Card className="bg-[#1c1c28] border border-[#2c2c3b] shadow-sm mt-6">
            <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-white">Growth Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(metrics).map(([metric, values]) => {
                        const growth = values.previous !== 0
                            ? ((values.current - values.previous) / values.previous) * 100
                            : values.current > 0 ? 100 : 0;
                        const isPositive = growth >= 0;

                        return (
                            <div key={metric} className="flex flex-col items-center p-3 rounded-lg bg-[#2c2c3b]">
                                <span className="text-sm text-[#a0a0b0] capitalize">{metric.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="text-lg font-semibold text-white">
                                    {values.current.toLocaleString()}
                                </span>
                                <span className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                    {isPositive ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

export default function ThreadsDashboard() {
    const [selectedChart, setSelectedChart] = useState("Impressions");
    const [apiData, setApiData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [range, setRange] = useState<"24h" | "7d" | "30d">("7d");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // In a real app, you would get these from your auth system
    const [accessToken] = useState<string>("your_access_token_here");
    const [userId] = useState<string>("your_user_id_here");

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchThreadsInsights(accessToken, range, userId);
                setApiData(data);
            } catch (err) {
                console.error("Error fetching Threads data:", err);
                setError("Failed to load data. Showing sample data instead.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [range, accessToken, userId]);

    const data = apiData;

    const chartData = {
        "Impressions": { data: data?.impressions || [], key: "value", label: "Impressions" },
        "Reach": { data: data?.reach || [], key: "value", label: "Reach" },
        "Profile Views": { data: data?.profileViews || [], key: "value", label: "Profile Views" },
        "Followers": { data: data?.followers || [], key: "value", label: "Followers" },
    };

    const getPreviousValue = (data: MetricData[], currentValue: number) => {
        if (!data || data.length < 2) return currentValue;
        return data[data.length - 2]?.value || currentValue;
    };

    const growthMetrics = {
        impressions: {
            current: data?.impressions.slice(-1)[0]?.value || 0,
            previous: getPreviousValue(data?.impressions || [], data?.impressions.slice(-1)[0]?.value || 0)
        },
        reach: {
            current: data?.reach.slice(-1)[0]?.value || 0,
            previous: getPreviousValue(data?.reach || [], data?.reach.slice(-1)[0]?.value || 0)
        },
        profileViews: {
            current: data?.profileViews.slice(-1)[0]?.value || 0,
            previous: getPreviousValue(data?.profileViews || [], data?.profileViews.slice(-1)[0]?.value || 0)
        },
        followers: {
            current: data?.followers.slice(-1)[0]?.value || 0,
            previous: getPreviousValue(data?.followers || [], data?.followers.slice(-1)[0]?.value || 0)
        }
    };

    const handleRefresh = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchThreadsInsights(accessToken, range, userId);
            setApiData(data);
        } catch (err) {
            console.error("Error refreshing data:", err);
            setError("Failed to refresh data");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !apiData) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white bg-[#0d0d12]">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-[200px] bg-[#2c2c3b]" />
                    <Skeleton className="h-4 w-[300px] bg-[#2c2c3b]" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d0d12] text-white px-4 py-6 sm:px-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Threads Profile Insights</h1>
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="bg-[#1c1c28] border-[#2c2c3b] text-white hover:bg-[#2c2c3b]"
                    >
                        {isLoading ? "Refreshing..." : "Refresh Data"}
                    </Button>
                    <Avatar>
                        <AvatarImage src="/avatars/01.png" alt="Profile" />
                        <AvatarFallback>TH</AvatarFallback>
                    </Avatar>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-300">
                    {error} {data?.isMock && "(Using sample data)"}
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <Tabs value={range} onValueChange={(value) => setRange(value as any)} className="mb-6 flex-grow">
                    <TabsList className="bg-[#1c1c28] border border-[#2c2c3b] flex justify-around py-2 px-4 rounded-lg">
                        <TabsTrigger value="24h" className="text-white py-2 px-4 rounded-md">24 Hours</TabsTrigger>
                        <TabsTrigger value="7d" className="text-white py-2 px-4 rounded-md">7 Days</TabsTrigger>
                        <TabsTrigger value="30d" className="text-white py-2 px-4 rounded-md">30 Days</TabsTrigger>
                        <DatePicker date={selectedDate} setDate={setSelectedDate} />
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Object.entries(chartData).map(([label, chart], i) => (
                    <Card
                        key={i}
                        className={`bg-[#1c1c28] border border-[#2c2c3b] shadow-sm cursor-pointer ${selectedChart === label ? "ring-2 ring-indigo-500" : ""}`}
                        onClick={() => setSelectedChart(label)}
                    >
                        <CardContent className="p-4">
                            <p className="text-sm text-white">{label}</p>
                            <h2 className="text-xl font-semibold text-white">
                                {chart.data?.slice(-1)[0]?.value.toLocaleString() || "-"}
                            </h2>
                            <p className="text-sm text-[#a0a0b0]">Latest</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="bg-[#1c1c28] border border-[#2c2c3b] shadow-sm xl:col-span-2">
                    <CardContent className="p-6 h-[300px]">
                        <h3 className="font-semibold mb-4 text-white">{chartData[selectedChart].label}</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData[selectedChart].data}>
                                <XAxis dataKey="label" stroke="#aaa" />
                                <YAxis stroke="#aaa" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#2c2c3b",
                                        border: "none",
                                        borderRadius: "0.5rem",
                                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey={chartData[selectedChart].key}
                                    stroke="#6366F1"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-[#1c1c28] border border-[#2c2c3b] shadow-sm">
                    <CardContent className="flex flex-col justify-center items-center p-6 h-[300px]">
                        <h3 className="text-md font-semibold mb-2 text-white">Engagement Rate</h3>
                        <div className="text-4xl font-bold text-white my-4">
                            {data?.engagement || 0}%
                        </div>
                        <p className="text-sm text-[#a0a0b0]">
                            {(data?.engagement || 0) > 5 ? "Strong" : "Needs improvement"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <GrowthSummary metrics={growthMetrics} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card className="bg-[#1c1c28] border border-[#2c2c3b] shadow-sm">
                    <CardContent className="p-6 h-[250px]">
                        <h3 className="font-semibold mb-4 text-white">Profile Views</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.profileViews || []}>
                                <XAxis dataKey="label" stroke="#aaa" />
                                <YAxis stroke="#aaa" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#2c2c3b",
                                        border: "none",
                                        borderRadius: "0.5rem"
                                    }}
                                />
                                <Bar dataKey="value">
                                    {(data?.profileViews || []).map((_, index) => (
                                        <Cell
                                            key={index}
                                            fill={index % 2 === 0 ? "#5B8DEF" : "#00D1B2"}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-[#1c1c28] border border-[#2c2c3b] shadow-sm">
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-4 text-white">Top Posts</h3>
                        <div className="grid grid-cols-4 text-xs text-[#aaa] font-medium mb-2">
                            <span className="text-white">Post</span>
                            <span className="text-white">Impressions</span>
                            <span className="text-white">Reach</span>
                            <span className="text-white">Engagement</span>
                        </div>
                        <div className="space-y-2">
                            {(data?.topPosts || []).map((post, i) => (
                                <div key={post.id || i} className="grid grid-cols-4 items-center text-sm text-white">
                                    <span className="truncate">{post.title}</span>
                                    <span>{post.impressions}</span>
                                    <span>{post.reach}</span>
                                    <div>
                                        <Progress value={post.engagementRate * 10} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}