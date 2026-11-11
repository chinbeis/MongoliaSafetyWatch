import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import { t } from "@/lib/translations";

export const metadata: Metadata = pageMetadata(t.communityMap, "Иргэдийн үлдээсэн ойролцоо бүсийн аноним тэмдэглэгээ. Нэр, хаяг, яг байршил хадгалахгүй; 30 хоногийн дараа автоматаар алга болно.");

export default function CommunityMapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
