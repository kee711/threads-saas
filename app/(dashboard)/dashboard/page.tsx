"use client"

import React, { useEffect, useState } from "react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts"
import { DonutChart } from "@/components/ui/donut-chart"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useSession } from 'next-auth/react'
import useSocialAccountStore from '@/stores/useSocialAccountStore'

const followersData = [
  { month: "Jan", followers: 50000 },
  { month: "Feb", followers: 80000 },
  { month: "Mar", followers: 100000 },
  { month: "Apr", followers: 160000 },
  { month: "May", followers: 230000 },
  { month: "Jun", followers: 210000 },
  { month: "Jul", followers: 250000 },
]

const postsData = [
  { month: "Jan", posts: 120 },
  { month: "Feb", posts: 98 },
  { month: "Mar", posts: 110 },
  { month: "Apr", posts: 130 },
  { month: "May", posts: 95 },
  { month: "Jun", posts: 105 },
  { month: "Jul", posts: 120 },
]

const likesData = [
  { month: "Jan", likes: 5000 },
  { month: "Feb", likes: 10000 },
  { month: "Mar", likes: 7500 },
  { month: "Apr", likes: 9200 },
  { month: "May", likes: 8700 },
  { month: "Jun", likes: 9400 },
  { month: "Jul", likes: 11000 },
]

const commentsData = [
  { month: "Jan", comments: 800 },
  { month: "Feb", comments: 750 },
  { month: "Mar", comments: 900 },
  { month: "Apr", comments: 1100 },
  { month: "May", comments: 1050 },
  { month: "Jun", comments: 970 },
  { month: "Jul", comments: 1200 },
]

const sharesData = [
  { month: "Jan", shares: 400 },
  { month: "Feb", shares: 500 },
  { month: "Mar", shares: 450 },
  { month: "Apr", shares: 600 },
  { month: "May", shares: 580 },
  { month: "Jun", shares: 630 },
  { month: "Jul", shares: 700 },
]

const chartOptions = {
  "Total Followers": { data: followersData, key: "followers", label: "Followers" },
  "Total Posts": { data: postsData, key: "posts", label: "Posts" },
  "Total Likes": { data: likesData, key: "likes", label: "Likes" },
  "Total Comments": { data: commentsData, key: "comments", label: "Comments" },
  "Total Shares": { data: sharesData, key: "shares", label: "Shares" },
}

const visitsData = [
  { day: "Mon", visits: 446 },
  { day: "Tue", visits: 285 },
  { day: "Wed", visits: 382 },
  { day: "Thu", visits: 368 },
  { day: "Fri", visits: 413 },
  { day: "Sat", visits: 307 },
  { day: "Sun", visits: 432 },
]

const trendingPosts = [
  { account: "markzberg", followers: 9876362, likes: 791203, engagement: 60 },
  { account: "anastasis", followers: 1452596, likes: 542981, engagement: 10 },
  { account: "google", followers: 3284341, likes: 539411, engagement: 100 },
  { account: "spotify", followers: 5762981, likes: 339391, engagement: 100 },
  { account: "roblox", followers: 8345291, likes: 193491, engagement: 25 },
  { account: "ricardodavinci", followers: 893659, likes: 93440, engagement: 40 },
]


export default function DashboardPage() {
  const [selectedChart, setSelectedChart] = useState("Total Followers")
  const currentChart = chartOptions[selectedChart as keyof typeof chartOptions]
  const [hasSocialAccount, setHasSocialAccount] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()
  const { accounts, setAccounts } = useSocialAccountStore()

  const handleSocialLogin = () => {
    window.location.href = "/api/threads/oauth";
  }

  // 소셜 계정 정보 가져오기
  useEffect(() => {
    const fetchSocialAccounts = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);

        // 1. Zustand 스토어 확인
        if (accounts.length > 0) {
          setHasSocialAccount(true);
          setIsLoading(false);
          return;
        }

        // 2. Supabase에서 소셜 계정 확인
        const supabase = createClient();
        const { data: socialAccounts, error } = await supabase
          .from('social_accounts')
          .select('*')
          .eq('owner', session.user.id)
          .eq('is_active', true);

        if (error) {
          console.error('소셜 계정 조회 오류:', error);
          return;
        }

        // 소셜 계정이 있으면 상태 업데이트
        if (socialAccounts && socialAccounts.length > 0) {
          setHasSocialAccount(true);
          setAccounts(socialAccounts);
        } else {
          setHasSocialAccount(false);
        }
      } catch (error) {
        console.error('소셜 계정 조회 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSocialAccounts();
  }, [session, accounts, setAccounts]);

  // Refresh Access Token
  useEffect(() => {
    const callRefreshTokenAPI = async () => {
      try {
        const res = await fetch('/api/threads/oauth/refresh', {
          method: 'GET', // 혹은 GET 등 백엔드 설정에 맞게
          headers: {
            'Content-Type': 'application/json',
          },
          // body: JSON.stringify({ yourData: 'value' }), // 필요시 body 추가
        });

        const result = await res.json();
        console.log('Refresh 결과:', result);
      } catch (error) {
        console.error('Refresh API 호출 실패:', error);
      }
    }
    console.log("Refresh Token")
    callRefreshTokenAPI();

  }, [])


  // UI

  return (
    <div className="px-6 py-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Profile Overview</h1>
        <div className="flex gap-4 items-center">
          <input
            type="search"
            placeholder="Search anything..."
            className="px-4 py-2 rounded-md bg-white border shadow-sm text-sm w-64"
          />
          <Avatar>
            <AvatarImage src="/avatars/01.png" alt="Harry Kee" />
            <AvatarFallback>HK</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* 👉 Social Login Section - 계정이 없을 때만 표시 */}
      {!isLoading && !hasSocialAccount && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">소셜 계정 연결</h2>
          <button
            onClick={handleSocialLogin}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm shadow"
          >
            Threads 계정 연결하기
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {Object.keys(chartOptions).map((label, i) => {
          const isSelected = selectedChart === label
          const chartData = {
            "Total Followers": { value: "13,675", change: "+2.51%", color: "text-green-500" },
            "Total Posts": { value: "1,986", change: "-1.43%", color: "text-red-500" },
            "Total Likes": { value: "890,543", change: "-3.56%", color: "text-red-500" },
            "Total Comments": { value: "1,234,780", change: "+0.94%", color: "text-green-500" },
            "Total Shares": { value: "432,097", change: "-0.20%", color: "text-red-500" },
          }[label as keyof typeof chartOptions];

          return (
            <Card
              key={i}
              variant="default"
              className={`shadow-sm cursor-pointer ${isSelected ? "ring-2 ring-indigo-500" : ""}`}
              onClick={() => setSelectedChart(label)}
            >
              <CardContent>
                <p className="text-sm text-muted-foreground">{label}</p>
                <h2 className="text-xl font-semibold">{chartData.value}</h2>
                <p className={`${chartData.color} text-sm`}>{chartData.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 shadow-sm">
          <CardContent className="p-6 h-[300px]">
            <h3 className="font-semibold mb-4">{currentChart.label}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentChart.data}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey={currentChart.key}
                  stroke="#6366F1"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex-1 shadow-sm">
            <CardContent className="flex flex-col justify-center items-center p-6 h-full">
              <h3 className="text-md font-semibold mb-2">Growth</h3>
              <DonutChart value={9.3} />
              <p className="text-sm text-muted-foreground mt-2">Total Score</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-6 text-center">
              <p>New Followers: <strong>145 people</strong></p>
              <p>Bonus: <strong>1,465</strong></p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card className="shadow-sm">
          <CardContent className="p-6 h-[250px]">
            <h3 className="font-semibold mb-4">Profile Visits</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitsData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="visits">
                  {visitsData.map((entry, index) => (
                    <Cell key={index} fill={index === 1 ? "#00D1B2" : "#5B8DEF"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Trending Posts</h3>
            <div className="grid grid-cols-5 text-xs text-muted-foreground font-medium mb-2">
              <span>Account</span>
              <span>Followers</span>
              <span>Likes</span>
              <span className="col-span-2">Engagement</span>
            </div>
            <div className="space-y-2">
              {trendingPosts.map((post, i) => (
                <div key={i} className="grid grid-cols-5 items-center text-sm">
                  <span>{post.account}</span>
                  <span>{post.followers.toLocaleString()}</span>
                  <span>{post.likes.toLocaleString()}</span>
                  <div className="col-span-2">
                    <Progress value={post.engagement} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}