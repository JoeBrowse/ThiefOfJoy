import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is off: every page here is personal, session-based data.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
