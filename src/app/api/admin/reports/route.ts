import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin-auth";
import { adminStatusSchema, listAdminReports } from "@/lib/admin-reports";

export async function GET(request: Request) {
  try {
    const denied = await requireAdmin(request);
    if (denied) {
      return denied;
    }

    const status = adminStatusSchema.safeParse(new URL(request.url).searchParams.get("status") ?? "pending_review");
    if (!status.success) {
      return apiError("invalid_body", 400);
    }

    const data = await listAdminReports(status.data);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  } catch (error) {
    console.error("Admin list failed:", error);
    return apiError("server_error", 500);
  }
}
