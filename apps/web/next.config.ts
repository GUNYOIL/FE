import type { NextConfig } from "next";
import { loadRootEnv } from "@gunyoil/shared/env";

loadRootEnv();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@gunyoil/shared"],
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/firebase-messaging-sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
