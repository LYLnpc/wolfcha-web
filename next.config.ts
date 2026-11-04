import path from "path";
import { readFileSync } from "fs";
import type { NextConfig } from "next";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8")
) as { version?: string };

/**
 * BASH_PREFIX 用于 GitHub Pages 这类子路径部署：
 *   BASH_PREFIX=/wolfcha-web/ pnpm build
 * 留空则部署在根路径（Vercel / 本地）。
 */
const rawBasePath = (process.env.BASH_PREFIX ?? process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim();
const basePath = rawBasePath && rawBasePath !== "/"
  ? `/${rawBasePath.replace(/^\/+|\/+$/g, "")}`
  : "";

const nextConfig: NextConfig = {
  // 纯静态导出：产物在 out/，可直接扔到 GitHub Pages / 任意静态托管
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: {
    // 静态导出不支持 Next 图片优化服务
    unoptimized: true,
  },
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version ?? "0.0.0",
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  webpack(config) {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      jotai: path.resolve(__dirname, "node_modules/jotai"),
      "jotai/vanilla": path.resolve(__dirname, "node_modules/jotai/vanilla"),
    };
    config.module.rules.push({
      test: /\.mp3$/,
      type: "asset/resource",
      generator: {
        filename: "static/media/[name].[hash][ext]",
      },
    });
    return config;
  },
};

export default nextConfig;
