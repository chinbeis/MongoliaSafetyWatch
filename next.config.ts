import type { NextConfig } from "next";
import { DEFAULT_MAP_STYLE_URL } from "./src/lib/public-env";
import { securityHeaders } from "./src/lib/security-headers";

const development = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({
          mapStyleUrl: process.env.NEXT_PUBLIC_MAP_STYLE_URL || DEFAULT_MAP_STYLE_URL,
          development,
          // Set CSP_REPORT_ONLY=1 on a preview deployment to observe the
          // policy before enforcing it.
          cspReportOnly: process.env.CSP_REPORT_ONLY === "1",
        }),
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
