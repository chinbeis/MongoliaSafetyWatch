"use client";

import { useEffect } from "react";

// Replaces the root layout when it fails, so it cannot rely on globals.css,
// fonts, or the navbar. Inline styles only; strings are inlined for the same
// reason (keep this file dependency-free).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="mn">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070b12",
          color: "#e6edf6",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "1rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>Алдаа гарлаа</h1>
          <p style={{ color: "#9aa7bd", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Хуудсыг ачаалах үед алдаа гарлаа. Дахин оролдоно уу. Яаралтай тусламж хэрэгтэй бол 102 руу
            залгана уу.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: 44,
              padding: "0.75rem 1.5rem",
              borderRadius: 12,
              border: "none",
              background: "#14b8a6",
              color: "#020617",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Дахин оролдох
          </button>
        </div>
      </body>
    </html>
  );
}
