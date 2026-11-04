"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { fetchAvailableModels, resolveModelsUrl } from "@/lib/api-config";

const CACHE_PREFIX = "wolfcha_models_cache:";

interface CacheEntry {
  models: string[];
  fetchedAt: number;
}

function readCache(providerId: string): CacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${providerId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!Array.isArray(parsed.models) || !parsed.models.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(providerId: string, models: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${providerId}`,
      JSON.stringify({ models, fetchedAt: Date.now() } satisfies CacheEntry)
    );
  } catch {
    // ignore quota errors
  }
}

interface ModelSelectorProps {
  providerId: string;
  baseUrl: string;
  apiKey: string;
  value: string;
  onChange: (model: string) => void;
  /** 输入框样式（复用调用方的外观） */
  inputClassName?: string;
}

/**
 * 模型选择器：支持从服务商 /models 接口自动获取模型列表，
 * 也允许手动输入任意模型名。
 */
export function ModelSelector({
  providerId,
  baseUrl,
  apiKey,
  value,
  onChange,
  inputClassName,
}: ModelSelectorProps) {
  const [models, setModels] = useState<string[]>(() => readCache(providerId)?.models ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoTriedRef = useRef<string>("");

  const modelsUrl = resolveModelsUrl(providerId, baseUrl);

  const loadModels = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!modelsUrl) {
        if (!options?.silent) setError("请先填写 API 地址");
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      try {
        const result = await fetchAvailableModels(
          providerId,
          baseUrl,
          apiKey,
          controller.signal
        );
        setModels(result.models);
        writeCache(providerId, result.models);
        setOpen(true);

        // 当前模型不在列表中时，自动选中第一个，避免用户拿到无效模型名
        if (!value || !result.models.includes(value)) {
          onChange(value && result.models.includes(value) ? value : result.models[0]);
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setError((err as Error)?.message ?? "获取模型失败");
        setOpen(false);
      } finally {
        setLoading(false);
      }
    },
    [apiKey, baseUrl, modelsUrl, onChange, providerId, value]
  );

  // 切换服务商时切换到对应缓存
  useEffect(() => {
    setModels(readCache(providerId)?.models ?? []);
    setError(null);
    setOpen(false);
  }, [providerId]);

  // 填好 Key 后自动尝试拉取一次（同一 provider + key 只尝试一次）
  useEffect(() => {
    if (!apiKey || apiKey.length < 8) return;
    if (!modelsUrl) return;
    const signature = `${providerId}|${modelsUrl}|${apiKey.slice(0, 6)}|${apiKey.length}`;
    if (autoTriedRef.current === signature) return;
    autoTriedRef.current = signature;
    void loadModels({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, modelsUrl, providerId]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return models;
    return models.filter((m) => m.toLowerCase().includes(q));
  }, [models, query]);

  const defaultClass =
    "w-full px-3 py-2 text-sm bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-[var(--text-muted)]">模型</label>
        <button
          type="button"
          onClick={() => void loadModels()}
          disabled={loading || !modelsUrl}
          title={modelsUrl ? `GET ${modelsUrl}` : "请先填写 API 地址"}
          className="inline-flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          {loading ? "获取中…" : models.length ? "刷新模型" : "自动获取"}
        </button>
      </div>

      <div className="relative" ref={containerRef}>
        <div className="flex items-stretch gap-1.5">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => models.length && setOpen(true)}
            placeholder="模型名称，可手动填写"
            className={inputClassName ?? defaultClass}
          />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            disabled={!models.length}
            aria-label="展开模型列表"
            className="shrink-0 px-2 rounded-lg border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {open && models.length > 0 && (
          <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-lg">
            <div className="sticky top-0 p-1.5 bg-[var(--bg-card)] border-b border-[var(--border-color)]">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`搜索 ${models.length} 个模型…`}
                className="w-full px-2 py-1 text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:outline-none"
              />
            </div>
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-[var(--text-muted)]">无匹配模型</div>
            )}
            {filtered.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onChange(m);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/10"
              >
                <span className="truncate">{m}</span>
                {m === value && <Check className="w-3.5 h-3.5 shrink-0 text-[var(--accent-primary)]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <p className="flex items-start gap-1 text-xs text-red-500">
          <TriangleAlert className="w-3 h-3 mt-0.5 shrink-0" />
          <span>
            {error}
            <span className="block text-[var(--text-muted)]">可直接手动填写模型名称继续使用。</span>
          </span>
        </p>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">
          {models.length
            ? `已获取 ${models.length} 个可用模型`
            : "填写 API Key 后会自动获取可用模型，也可手动填写。"}
        </p>
      )}
    </div>
  );
}
