import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Cache Components is off on purpose: nearly every page is per-contractor
  // and dynamic, so the classic request-time rendering model is simpler.
  experimental: {
    // A worker save can carry a photo (resized on the phone, ~200 KB, up to
    // 3 MB unresized) plus a skill video (up to 25 MB; iPhones record large).
    serverActions: { bodySizeLimit: "30mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
