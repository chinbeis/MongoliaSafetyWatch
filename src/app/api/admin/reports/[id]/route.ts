import { NextResponse } from "next/server";
import { apiError, isUuid, readJson } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin-auth";
import { adminActionSchema, moderateReport } from "@/lib/admin-reports";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const denied = await requireAdmin(request);
    if (denied) {
      return denied;
    }

    const { id } = await params;
    if (!isUuid(id)) {
      return apiError("invalid_id", 400);
    }

    const parsed = adminActionSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError("invalid_body", 400);
    }

    const updated = await moderateReport(id.toLowerCase(), parsed.data.action);
    if (!updated) {
      return apiError("not_found", 404);
    }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin moderation failed:", error);
    return apiError("server_error", 500);
  }
}
