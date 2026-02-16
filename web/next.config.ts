import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isProd ? "/onchain-growth-audit" : "",
  assetPrefix: isProd ? "/onchain-growth-audit/" : "",
  trailingSlash: true,
};

export default nextConfig;
