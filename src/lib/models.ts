/**
 * 自动获取 OpenAI 兼容接口的可用模型列表。
 *
 * 策略（按优先级）：
 *  1. 浏览器直连 GET /models —— API Key 只发给服务商，不经过本站服务器；
 *  2. 直连失败（多为 CORS / 网络策略）时回退到本站 /api/models 服务端代理；
 *  3. 仍失败则回退内置预设 MODEL_PRESETS，并保留手动输入。
 *
 * 成功结果写入 localStorage，24 小时内可直接复用。
 */

import { MODEL_PRESETS } from "./api-config";

const CACHE_KEY = "wolfcha_models_cache_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

type CacheMap = Record<string, { models: string[]; fetchedAt: number }>;

export type ModelSource = "live" | "proxy" | "cache" | "preset";

export interface FetchModelsResult {
  models: string[];
  source: ModelSource;
  endpoint?: string;
  message?: string;
}

function presetResult(message: string): FetchModelsResult {
  return { models: [...MODEL_PRESETS], source: "preset", message };
}

/** 从 chat/completions Base URL 推导 /models 候选端点（兼容 /v1 与非 /v1 两种风格） */
export function deriveModelEndpoints(baseUrl: string): string[] {
  let root = (baseUrl || "").trim().replace(/\/+$/, "");
  if (!root) return [];
  root = root.replace(/\/chat\/completions$/i, "");

  const candidates: string[] = [];
  const add = (url: string) => {
    if (url && !candidates.includes(url)) candidates.push(url);
  };

  add(/\/models$/i.test(root) ? root : `${root}/models`);

  const withoutVersion = root.replace(/\/v\d+(?:\.\d+)?$/i, "");
  add(withoutVersion !== root ? `${withoutVersion}/models` : `${root}/v1/models`);

  return candidates;
}

function normalizeModels(payload: unknown): string[] {
  const list: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown } | null)?.data)
      ? (payload as { data: unknown[] }).data
      : [];

  const ids = list
    .map((item) =>
      typeof item === "string"
        ? item
        : typeof (item as { id?: unknown } | null)?.id === "string"
          ? (item as { id: string }).id
          : null,
    )
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    .map((id) => id.trim());

  return Array.from(new Set(ids)).sort((a, b) => a.localeCompare(b));
}

function readCache(): CacheMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as CacheMap) : {};
  } catch {
    return {};
  }
}

export function getCachedModels(baseUrl: string): string[] | null {
  const entry = readCache()[(baseUrl || "").trim()];
  if (!entry || Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
  return Array.isArray(entry.models) && entry.models.length ? entry.models : null;
}

function writeCache(baseUrl: string, models: string[]): void {
  if (typeof window === "undefined" || !models.length) return;
  try {
    const cache = readCache();
    cache[(baseUrl || "").trim()] = { models, fetchedAt: Date.now() };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage 不可用或超配额时静默降级
  }
}

export interface FetchModelsOptions {
  baseUrl: string;
  apiKey: string;
  /** 跳过缓存，强制重新拉取 */
  force?: boolean;
}

export async function fetchAvailableModels(options: FetchModelsOptions): Promise<FetchModelsResult> {
  const { baseUrl, apiKey, force = false } = options;
  const endpoints = deriveModelEndpoints(baseUrl);

  if (!endpoints.length) return presetResult("请先填写 API Base URL");
  if (!apiKey.trim()) return presetResult("填写 API Key 后自动获取可用模型");

  if (!force) {
    const cached = getCachedModels(baseUrl);
    if (cached) {
      return { models: cached, source: "cache", message: `已加载缓存的 ${cached.length} 个模型` };
    }
  }

  // 1) 浏览器直连（Key 不经本站服务器）
  let lastError = "未知错误";
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: "no-store",
      });
      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        continue;
      }
      const models = normalizeModels(await res.json());
      if (models.length) {
        writeCache(baseUrl, models);
        return {
          models,
          source: "live",
          endpoint,
          message: `自动获取到 ${models.length} 个模型`,
        };
      }
      lastError = "接口返回空列表";
    } catch (error) {
      lastError = error instanceof Error ? error.message : "网络错误";
    }
  }

  // 2) 服务端代理兜底（解决浏览器 CORS 限制）
  try {
    const res = await fetch("/api/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoints, apiKey }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS * 2),
    });
    if (res.ok) {
      const data: unknown = await res.json();
      const obj = (data ?? {}) as { models?: unknown; endpoint?: unknown };
      const models = normalizeModels(obj.models);
      if (models.length) {
        writeCache(baseUrl, models);
        return {
          models,
          source: "proxy",
          endpoint: typeof obj.endpoint === "string" ? obj.endpoint : undefined,
          message: `经本站代理获取到 ${models.length} 个模型`,
        };
      }
    }
  } catch {
    // 继续回退到内置预设
  }

  return presetResult(`自动获取失败（${lastError}），已回退内置模型，可手动输入`);
}
