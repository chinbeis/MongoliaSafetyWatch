import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { communityReports } from "@/db/schema";
import { verifyCaptchaToken } from "@/lib/community-captcha";

const CATEGORY_LABELS: Record<string, string> = {
  suspicious_activity: "Сэжигтэй хөдөлгөөн",
  theft: "Хулгай",
  violence: "Хүчирхийлэл",
  harassment: "Дарамт / дарамталсан",
  child_safety: "Хүүхдийн аюулгүй байдал",
  other: "Бусад",
};

export async function GET() {
  try {
    const reports = await db
      .select()
      .from(communityReports)
      .orderBy(desc(communityReports.createdAt))
      .limit(200);

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Failed to fetch community reports:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const category = String(body.category ?? "").trim();
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const radiusMeters = Number(body.radiusMeters);
    const captchaToken = String(body.captchaToken ?? "");
    const captchaAnswer = Number(body.captchaAnswer);

    if (
      !category ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(radiusMeters)
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const categoryLabel = CATEGORY_LABELS[category];
    if (!categoryLabel) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    if (latitude < 41 || latitude > 53 || longitude < 87 || longitude > 120) {
      return NextResponse.json({ error: "Coordinates out of bounds" }, { status: 400 });
    }

    if (radiusMeters < 50 || radiusMeters > 5000) {
      return NextResponse.json({ error: "Radius out of bounds" }, { status: 400 });
    }

    if (!verifyCaptchaToken(captchaToken, captchaAnswer)) {
      return NextResponse.json({ error: "Captcha verification failed" }, { status: 400 });
    }

    const [report] = await db
      .insert(communityReports)
      .values({
        category: category as typeof communityReports.$inferInsert.category,
        title: categoryLabel,
        details: null,
        areaLabel: null,
        latitude,
        longitude,
        radiusMeters,
      })
      .returning();

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Failed to create community report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
