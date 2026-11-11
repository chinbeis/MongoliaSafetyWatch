import { describe, expect, it } from "vitest";
import { CAPTCHA_TTL_MS, createCaptchaChallenge, verifyCaptchaToken } from "./community-captcha";

function answerFor(prompt: string) {
  const [left, right] = prompt.match(/\d+/g)!.map(Number);
  return left + right;
}

describe("community captcha", () => {
  it("accepts the correct answer and returns a nonce", () => {
    const challenge = createCaptchaChallenge();
    const result = verifyCaptchaToken(challenge.token, answerFor(challenge.prompt));
    expect(result.ok).toBe(true);
    expect(result.ok && result.nonce.length).toBeGreaterThanOrEqual(16);
  });

  it("issues a different nonce for every challenge", () => {
    const a = createCaptchaChallenge();
    const b = createCaptchaChallenge();
    const ra = verifyCaptchaToken(a.token, answerFor(a.prompt));
    const rb = verifyCaptchaToken(b.token, answerFor(b.prompt));
    expect(ra.ok && rb.ok && ra.nonce !== rb.nonce).toBe(true);
  });

  it("rejects a wrong answer", () => {
    const challenge = createCaptchaChallenge();
    expect(verifyCaptchaToken(challenge.token, answerFor(challenge.prompt) + 1).ok).toBe(false);
  });

  it("rejects non-numeric answers without throwing", () => {
    const challenge = createCaptchaChallenge();
    expect(verifyCaptchaToken(challenge.token, Number.NaN).ok).toBe(false);
    expect(verifyCaptchaToken(challenge.token, "7").ok).toBe(false);
    expect(verifyCaptchaToken(challenge.token, 3.5).ok).toBe(false);
  });

  it("rejects a tampered payload", () => {
    const challenge = createCaptchaChallenge();
    const [, signature] = challenge.token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ left: 1, right: 1, issuedAt: Date.now(), nonce: "x".repeat(20) })
    ).toString("base64url");
    expect(verifyCaptchaToken(`${forged}.${signature}`, 2).ok).toBe(false);
  });

  it("rejects malformed tokens", () => {
    for (const token of ["", "abc", "a.b.c", ".", null, 42, "x".repeat(5000)]) {
      expect(verifyCaptchaToken(token, 3).ok).toBe(false);
    }
  });

  it("rejects expired tokens", () => {
    const issuedAt = Date.now();
    const challenge = createCaptchaChallenge(issuedAt);
    expect(verifyCaptchaToken(challenge.token, answerFor(challenge.prompt), issuedAt + CAPTCHA_TTL_MS + 1).ok).toBe(
      false
    );
  });
});
