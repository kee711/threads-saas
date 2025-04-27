// app/api/threads/oauth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: acct, error } = await supabase
    .from("social_accounts")
    .select("access_token, expires_at, updated_at")
    .eq("owner", session.user.id)
    .eq("platform", "threads")
    .single();
  if (error || !acct?.access_token) {
    return NextResponse.json({ error: "Not connected" }, { status: 400 });
  }

  const now = Date.now();
  const updatedAt = new Date(acct.updated_at).getTime();
  // only refresh once per 24h
  if (now - updatedAt < 24 * 3600 * 1000) {
    return NextResponse.json({ access_token: acct.access_token });
  }

  // call the refresh endpoint
  const refreshRes = await fetch(
    `https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${acct.access_token}`
  );
  const refreshData = await refreshRes.json();
  if (!refreshRes.ok || !refreshData.access_token) {
    console.error("Threads refresh failed:", refreshData);
    return NextResponse.json({ access_token: acct.access_token });
  }

  const newExpiresAt = new Date(Date.now() + Number(refreshData.expires_in) * 1000).toISOString();
  await supabase
    .from("social_accounts")
    .update({
      access_token: refreshData.access_token,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("owner", session.user.id)
    .eq("platform", "threads");

  return NextResponse.json({ access_token: refreshData.access_token });
}