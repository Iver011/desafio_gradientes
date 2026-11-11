import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/desafio_gradientes",
  assetPrefix: "/desafio_gradientes/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;