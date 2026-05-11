import { NextResponse } from "next/server";
import { getGoogleReviews } from "@/lib/google-places";

export const runtime = "nodejs";

export async function GET() {
  const reviews = await getGoogleReviews();
  return NextResponse.json(reviews);
}
