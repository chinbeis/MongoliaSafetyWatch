import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { t } from "@/lib/translations";

export const alt = `${t.title} — нэгтгэсэн, нэр хаяггүй аюулгүй байдлын мэдээлэл`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Static: rendered once at build time.
export const dynamic = "force-static";

export default async function OpenGraphImage() {
  // Satori needs a TTF that actually contains Mongolian Cyrillic (ө ү Ө Ү).
  const font = await readFile(path.join(process.cwd(), "src/assets/fonts/Inter-ExtraBold-subset.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #070b12 0%, #0c1a24 60%, #0f2a2a 100%)",
          color: "#f1f5f9",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              background: "#14b8a6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#020617" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            </svg>
          </div>
          <div style={{ fontSize: 34, color: "#5eead4" }}>{t.officialData}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, lineHeight: 1.05 }}>{t.title}</div>
          <div style={{ fontSize: 34, color: "#94a3b8", lineHeight: 1.3, maxWidth: 980 }}>
            Гэмт хэргийн нэгтгэсэн статистик, газрын зураг, урьдчилан сэргийлэх зөвлөмж
          </div>
        </div>

        <div style={{ display: "flex", gap: 40, fontSize: 28, color: "#cbd5e1" }}>
          <span>{t.sourceShort}</span>
          <span style={{ color: "#5eead4" }}>Хувь хүний мэдээлэл нийтлэхгүй</span>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Inter", data: font, weight: 800, style: "normal" }] }
  );
}
