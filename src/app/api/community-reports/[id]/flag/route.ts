import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { communityReports } from "@/db/schema";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const FLAG_THRESHOLD = 3;
const FLAG_LIMIT = 20;
const FLAG_WINDOW_MS = 1000 * 60 * 10;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limit = rateLimit(`community-flag:${getClientIp(request)}`, FLAG_LIMIT, FLAG_WINDOW_MS);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Хэт олон хүсэлт. Дараа дахин оролдоно уу." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const [updated] = await db
      .update(communityReports)
      .set({ flagCount: sql`${communityReports.flagCount} + 1` })
      .where(eq(communityReports.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const shouldHide = updated.flagCount >= FLAG_THRESHOLD;
    if (shouldHide && !updated.hidden) {
      await db
        .update(communityReports)
        .set({ hidden: true })
        .where(eq(communityReports.id, id));
    }

    return NextResponse.json({ ok: true, hidden: shouldHide });
  } catch (error) {
    console.error("Failed to flag community report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
