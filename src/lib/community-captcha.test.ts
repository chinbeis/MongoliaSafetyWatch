import { afterEach, describe, expect, it, vi } from "vitest";
import { createCaptchaChallenge, verifyCaptchaToken } from "./community-captcha";

function answerFor(prompt: string) {
  const [left, right] = prompt.match(/\d+/g)!.map(Number);
  return left + right;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("community captcha", () => {
  it("accepts the correct answer", () => {
    const challenge = createCaptchaChallenge();
    expect(verifyCaptchaToken(challenge.token, answerFor(challenge.prompt))).toBe(true);
  });

  it("rejects a wrong answer", () => {
    const challenge = createCaptchaChallenge();
    expect(verifyCaptchaToken(challenge.token, answerFor(challenge.prompt) + 1)).toBe(false);
  });

  it("rejects a tampered payload", () => {
    const challenge = createCaptchaChallenge();
    const [, signature] = challenge.token.split(".");
    const forged = Buffer.from(JSON.stringify({ left: 1, right: 1, issuedAt: Date.now() })).toString("base64url");
    expect(verifyCaptchaToken(`${forged}.${signature}`, 2)).toBe(false);
  });

  it("rejects malformed tokens", () => {
    expect(verifyCaptchaToken("", 3)).toBe(false);
    expect(verifyCaptchaToken("abc", 3)).toBe(false);
    expect(verifyCaptchaToken("a.b.c", 3)).toBe(false);
  });

  it("rejects expired tokens", () => {
    vi.useFakeTimers();
    const challenge = createCaptchaChallenge();
    vi.advanceTimersByTime(11 * 60 * 1000);
    expect(verifyCaptchaToken(challenge.token, answerFor(challenge.prompt))).toBe(false);
  });
});
