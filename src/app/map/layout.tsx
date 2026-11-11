import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import { t } from "@/lib/translations";

export const metadata: Metadata = pageMetadata(t.map, "Аймаг, нийслэлийн бүртгэгдсэн гэмт хэргийг хүн амд ногдуулан харьцуулсан газрын зураг. Үндэсний статистикийн хорооны албан ёсны, нэгтгэсэн өгөгдөл.");

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
