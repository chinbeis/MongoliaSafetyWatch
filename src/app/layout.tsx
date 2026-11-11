import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Navbar, Footer } from "@/components/layout/navigation";
import { publicEnv } from "@/lib/public-env";
import { t } from "@/lib/translations";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  // Plus Jakarta Sans has no Cyrillic glyphs (its "cyrillic-ext" slice only
  // contains ₴), so Mongolian text falls through to Inter — which is why Inter
  // must load both "cyrillic" and "cyrillic-ext" (ө ү Ө Ү live in the latter).
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: `${t.title} – Монгол Улс`,
    template: `%s · ${t.title}`,
  },
  description: t.siteDescription,
  applicationName: t.title,
  openGraph: {
    type: "website",
    locale: "mn_MN",
    siteName: t.title,
    title: `${t.title} – Монгол Улс`,
    description: t.siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${t.title} – Монгол Улс`,
    description: t.siteDescription,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#070b12",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body
        className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col bg-[#070b12] text-slate-100 font-sans`}
      >
        <Navbar />
        <main id="main" className="flex-grow min-h-0">
          {children}
        </main>
        <Footer />
        {/* Cookieless, no PII. Only on Vercel, where /_vercel/insights exists. */}
        {process.env.VERCEL === "1" ? <Analytics /> : null}
      </body>
    </html>
  );
}
