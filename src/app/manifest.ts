import type { MetadataRoute } from "next";
import { t } from "@/lib/translations";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: t.title,
    short_name: "Аюулгүй байдал",
    description: t.siteDescription,
    lang: "mn",
    start_url: "/",
    display: "standalone",
    background_color: "#070b12",
    theme_color: "#070b12",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
