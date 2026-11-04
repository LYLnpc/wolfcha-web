import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 部署前缀（GitHub Pages 子路径部署时形如 /wolfcha-web）。
 * 构建时由 next.config.ts 注入 NEXT_PUBLIC_BASE_PATH，本地/Vercel 为空字符串。
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * 把 public/ 下的绝对路径补上部署前缀。
 *   publicPath("/logo.png") => "/wolfcha-web/logo.png"（子路径部署时）
 * 已经是外部链接或已带前缀的路径会原样返回。
 */
export function publicPath(p: string): string {
  if (!p) return p;
  if (/^(https?:)?\/\//.test(p) || p.startsWith("data:") || p.startsWith("blob:")) return p;
  if (!p.startsWith("/")) return p;
  if (!BASE_PATH) return p;
  if (p === BASE_PATH || p.startsWith(`${BASE_PATH}/`)) return p;
  return `${BASE_PATH}${p}`;
}

export function generateUUID(): string {
  const cryptoObj = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
