import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/lib/env";

const CAPTCHA_TTL_MS = 1000 * 60 * 10;

interface CaptchaPayload {
  left: number;
  right: number;
  issuedAt: number;
}

export function createCaptchaChallenge() {
  const payload: CaptchaPayload = {
    left: randomInt(2, 10),
    right: randomInt(1, 9),
    issuedAt: Date.now(),
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload);

  return {
    token: `${encodedPayload}.${signature}`,
    prompt: `${payload.left} + ${payload.right} = ?`,
  };
}

export function verifyCaptchaToken(token: string, answer: number) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = sign(encodedPayload);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return false;
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as CaptchaPayload;
  if (Date.now() - payload.issuedAt > CAPTCHA_TTL_MS) {
    return false;
  }

  return payload.left + payload.right === answer;
}

function sign(value: string) {
  return createHmac("sha256", getServerEnv().communityCaptchaSecret).update(value).digest("base64url");
}
