import { createHmac, timingSafeEqual } from "node:crypto";

const CAPTCHA_SECRET = process.env.COMMUNITY_CAPTCHA_SECRET ?? "dev-community-captcha-secret";
const CAPTCHA_TTL_MS = 1000 * 60 * 10;

interface CaptchaPayload {
  left: number;
  right: number;
  issuedAt: number;
}

export function createCaptchaChallenge() {
  const payload: CaptchaPayload = {
    left: randomInt(2, 9),
    right: randomInt(1, 8),
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
  return createHmac("sha256", CAPTCHA_SECRET).update(value).digest("base64url");
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
