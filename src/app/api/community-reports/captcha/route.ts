import { NextResponse } from "next/server";
import { createCaptchaChallenge } from "@/lib/community-captcha";

export async function GET() {
  return NextResponse.json(createCaptchaChallenge(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
