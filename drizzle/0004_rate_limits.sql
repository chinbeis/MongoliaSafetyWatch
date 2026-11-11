-- Fixed-window rate-limit counters shared by every serverless instance.
-- Keys are "<scope>:<HMAC(client ip, daily salt)>" — no raw IP is stored, and
-- keys cannot be linked across days. Also stores single-use captcha nonces
-- ("captcha:<nonce>"). Rows older than 2 days are deleted opportunistically.
CREATE TABLE IF NOT EXISTS "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"window_start" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limits_window_start_idx" ON "rate_limits" ("window_start");
