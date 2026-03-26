import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const username = String(body?.username ?? "").trim().toLowerCase();

  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  }

  if (!data?.email) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ email: data.email });
}
