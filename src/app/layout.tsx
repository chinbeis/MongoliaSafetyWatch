import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar, Footer } from "@/components/layout/navigation";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata = {
  title: "Олон Нийтийн Аюулгүй Байдал – Монгол Улс",
  description: "Нэгтгэсэн, нэр хаяггүй олон нийтийн аюулгүй байдлын өгөгдөл ба мэдээллийн платформ.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn">
      <body
        className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col bg-[#070b12] text-slate-100 font-sans`}
      >
        <Navbar />
        <main className="flex-grow min-h-0">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
