import { NextRequest, NextResponse } from "next/server";
import { ThreadsService } from "@/lib/services/threads";
import { crawlFromPermalink } from "./crawler";

export async function GET(req: NextRequest) {
  try {
    const service = new ThreadsService();
    const keyword = req.nextUrl.searchParams.get("keyword") || "hi";

    const threads = await service.getTrendingThreads(keyword);

    const enrichedThreads = await Promise.all(
      threads.map(async (thread) => {
        const metrics = await crawlFromPermalink(thread.permalink);
        return {
          ...thread,
          ...metrics,
        };
      })
    );

    return NextResponse.json(enrichedThreads);
  } catch (error) {
    console.error("[Trending API Error]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
