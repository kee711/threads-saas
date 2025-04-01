import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

const BASE_URL = "https://graph.threads.net/v1.0";
const ACCESS_TOKEN = process.env.THREADS_ACCESS_TOKEN;

export async function GET(req: NextRequest) {
  const keyword = "hi"; // 기본 키워드 설정

  try {
    const posts = await searchByKeyword(keyword);
    const enrichedPosts = await Promise.all(
      posts.map(async (post: any) => {
        const { id, media_type, username, timestamp, permalink, text } = post;

        const { likes, shares } = await crawlFromPermalink(permalink);
        //const { likes, shares } = { likes: 0, shares: 0 };

        const replies = await getFilteredReplies(id, username, timestamp);

        let mediaUrls: string[] = [];
        if (media_type !== "TEXT") {
          const detail = await getMediaDetail(id);
          mediaUrls = detail.children?.data?.map(
            (child: any) => child.media_url
          ) || [detail.media_url];
        }

        return {
          id,
          text,
          media_type,
          username,
          timestamp,
          permalink,
          likes,
          shares,
          replies,
          mediaUrls,
        };
      })
    );

    return NextResponse.json(enrichedPosts);
  } catch (error) {
    console.error("[Crawl API Error]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function searchByKeyword(keyword: string) {
  const res = await fetch(
    `${BASE_URL}/keyword_search?q=${encodeURIComponent(
      keyword
    )}&search_type=TOP&fields=id,text,media_type,permalink,timestamp,username,is_reply`,
    { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
  );
  const data = await res.json();
  const filteredData = (data.data ?? []).filter((post: any) => !post.is_reply);

  return filteredData;
}

async function getMediaDetail(mediaId: string) {
  const res = await fetch(
    `${BASE_URL}/${mediaId}?fields=id,media_url,media_type,children`,
    { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
  );
  return res.json();
}

async function getFilteredReplies(
  mediaId: string,
  username: string,
  originalTimestamp: string
) {
  const res = await fetch(
    `${BASE_URL}/${mediaId}/replies?fields=id,text,timestamp,username,root_post,is_reply`,
    { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
  );
  const result = await res.json();
  const originalTime = new Date(originalTimestamp).getTime();

  return result.data ?? [];
  //   return (result.data ?? []).filter(
  //     (reply: any) =>
  //       reply.username === username &&
  //       String(reply.root_post.id) === String(mediaId) &&
  //       Math.abs(new Date(reply.timestamp).getTime() - originalTime) <=
  //         //5 * 60 * 1000
  //         5 * 60 * 100000
  //   );
}

async function crawlFromPermalink(permalink: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(permalink, { waitUntil: "networkidle2" });

    // 좋아요 아이콘(title 텍스트가 '좋아요' 또는 '좋아요 취소')을 기준으로 span 추적
    const likeCount = await page.evaluate(() => {
      const svgWithTitle = Array.from(document.querySelectorAll("svg")).find(
        (svg) => {
          const titleText = svg.querySelector("title")?.textContent || "";
          return (
            titleText.includes("좋아요") || titleText.includes("좋아요 취소")
          );
        }
      );

      if (!svgWithTitle) return 0;

      // svg의 부모 엘리먼트에서 다음 sibling span 찾기
      const span =
        svgWithTitle.parentElement?.querySelector("span > div > span");
      const raw = span?.textContent?.replace(/,/g, "") || "0";

      return parseInt(raw, 10);
    });

    return { likes: likeCount, shares: 0 }; // 공유 수도 필요하면 추가!
  } catch (e) {
    console.error("Permalink 크롤링 실패:", e);
    return { likes: 0, shares: 0 };
  } finally {
    await browser.close();
  }
}
