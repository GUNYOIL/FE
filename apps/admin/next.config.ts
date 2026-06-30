import type { NextConfig } from "next";
import { loadRootEnv } from "@gunyoil/shared/env";

loadRootEnv();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@gunyoil/shared"],
};

export default nextConfig;
