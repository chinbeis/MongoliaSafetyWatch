import { Inter, Plus_Jakarta_Sans } from "next/font/google";
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
        className={`${inter.variable} ${plusJakarta.variable} antialiased min-h-screen flex flex-col bg-slate-50/30 text-slate-900 font-sans`}
      >
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
