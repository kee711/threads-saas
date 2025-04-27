// app/api/threads/oauth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=unauthenticated`);
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || state !== session.user.id) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=invalid_code`);
  }

  // 2-A) short-lived exchange
  const shortRes = await fetch("https://graph.threads.net/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.THREADS_CLIENT_ID!,
      client_secret: process.env.THREADS_CLIENT_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/threads/oauth/callback`,
      code,
    }),
  });
  const shortData = await shortRes.json();
  if (!shortRes.ok || !shortData.access_token) {
    console.error("Short-token exchange failed:", shortData);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=token_exchange`);
  }

  // 2-B) long-lived exchange (60 days)
  const longRes = await fetch(
    `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${process.env.THREADS_CLIENT_SECRET}&access_token=${shortData.access_token}`
  );
  const longData = await longRes.json();
  const accessToken = (longRes.ok && longData.access_token)
    ? longData.access_token
    : shortData.access_token;
  const expiresIn = (longRes.ok && longData.expires_in)
    ? Number(longData.expires_in)
    : Number(shortData.expires_in);
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  // 2-C) persist into Supabase
  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from("social_accounts")
    .upsert(
      {
        owner: session.user.id,
        platform: "threads",
        access_token: accessToken,
        social_id: shortData.user_id,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'social_id, owner' }
    );
  if (dbError) {
    console.error("Supabase upsert failed:", dbError);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/social-connect?error=db_error`);
  }
  console.log("supabase upsert succeeded : ", session.user.id, shortData.user_id)
  // Go back to main if succeeded
  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}`);
}