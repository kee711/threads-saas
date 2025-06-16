// app/api/threads/oauth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const clientId = process.env.THREADS_CLIENT_ID!;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/threads/oauth/callback`;
  const authUrl = new URL("https://threads.net/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "threads_basic,threads_content_publish,threads_manage_insights,threads_manage_mentions,threads_manage_replies,threads_read_replies,threads_oembed");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", session.user.id); // CSRF: tie to user

  console.log("client_id : ", clientId)
  console.log("redirectUri : ", redirectUri)
  console.log("authUrl : ", authUrl)

  return NextResponse.redirect(authUrl);
}