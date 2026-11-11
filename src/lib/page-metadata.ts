import type { Metadata } from "next";
import { t } from "@/lib/translations";

/**
 * Per-page metadata. Next merges metadata shallowly, so a page that sets
 * `openGraph` replaces the root's object entirely — this keeps site name,
 * locale and the shared image on every page while giving each its own title.
 */
export function pageMetadata(title: string, description: string, extra: Metadata = {}): Metadata {
  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: "mn_MN",
      siteName: t.title,
      title: `${title} · ${t.title}`,
      description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: t.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${t.title}`,
      description,
      images: ["/opengraph-image"],
    },
    ...extra,
  };
}
