"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiConfig, saveApiConfig, API_PROVIDERS, MODEL_PRESETS, type ApiConfig } from "@/lib/api-config";
import { fetchAvailableModels, getCachedModels, type ModelSource } from "@/lib/models";
import { ExternalLink, Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ApiConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CUSTOM_VALUE = "__custom__";

const SOURCE_LABEL: Record<ModelSource, string> = {
  live: "直连获取",
  proxy: "代理获取",
  cache: "本地缓存",
  preset: "内置预设",
};

export function ApiConfigModal({ open, onOpenChange }: ApiConfigModalProps) {
  const [config, setConfig] = useState<ApiConfig>(() => getApiConfig());
  const [showLlmKey, setShowLlmKey] = useState(false);
  const [showTtsKey, setShowTtsKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const [models, setModels] = useState<string[]>([...MODEL_PRESETS]);
  const [modelSource, setModelSource] = useState<ModelSource>("preset");
  const [modelStatus, setModelStatus] = useState("");
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelQuery, setModelQuery] = useState("");

  useEffect(() => {
    if (open) {
      setConfig(getApiConfig());
      setSaved(false);
      setModelQuery("");
    }
  }, [open]);

  const runFetch = useCallback(
    async (force: boolean) => {
      if (!config.llmBaseUrl.trim() || !config.llmApiKey.trim()) {
        setModels([...MODEL_PRESETS]);
        setModelSource("preset");
        setModelStatus("填写 Base URL 与 API Key 后自动获取可用模型");
        return;
      }

      setLoadingModels(true);
      setModelStatus("正在获取模型列表…");
      try {
        const result = await fetchAvailableModels({
          baseUrl: config.llmBaseUrl,
          apiKey: config.llmApiKey,
          force,
        });
        setModels(result.models);
        setModelSource(result.source);
        setModelStatus(result.message ?? "");
      } catch {
        setModels([...MODEL_PRESETS]);
        setModelSource("preset");
        setModelStatus("获取失败，已回退内置模型，可手动输入");
      } finally {
        setLoadingModels(false);
      }
    },
    [config.llmBaseUrl, config.llmApiKey],
  );

  // 打开弹窗、切换服务商、修改 Base URL / Key 后（防抖）自动拉取
  useEffect(() => {
    if (!open) return;
    const cached = getCachedModels(config.llmBaseUrl);
    if (cached) {
      setModels(cached);
      setModelSource("cache");
    }
    const timer = window.setTimeout(() => {
      void runFetch(false);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [open, runFetch]);

  const handleSave = () => {
    saveApiConfig(config);
    setSaved(true);
    toast.success("配置已保存", { description: "刷新页面后生效" });
    setTimeout(() => {
      setSaved(false);
      onOpenChange(false);
    }, 1000);
  };

  const handleChange = (field: keyof ApiConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleProviderChange = (providerId: string) => {
    const provider = API_PROVIDERS.find(p => p.id === providerId);
    if (provider) {
      setConfig(prev => ({
        ...prev,
        llmProvider: providerId,
        llmBaseUrl: provider.baseUrl || prev.llmBaseUrl,
        llmModel: provider.defaultModel || prev.llmModel,
      }));
    }
  };

  const currentProvider = API_PROVIDERS.find(p => p.id === config.llmProvider) || API_PROVIDERS[0];

  const knownModels = useMemo(
    () => (models.length ? models : [...MODEL_PRESETS]),
    [models],
  );
  const isCustomModel = !config.llmModel || !knownModels.includes(config.llmModel);
  const filteredModels = useMemo(() => {
    const query = modelQuery.trim().toLowerCase();
    const list = query
      ? knownModels.filter(model => model.toLowerCase().includes(query))
      : knownModels;
    if (!isCustomModel && !list.includes(config.llmModel)) {
      return [config.llmModel, ...list];
    }
    return list;
  }, [knownModels, modelQuery, isCustomModel, config.llmModel]);

  const inputClass = "w-full px-3 py-2 text-sm bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-[var(--text-primary)]">
            API 配置
          </DialogTitle>
          <DialogDescription className="text-[var(--text-muted)]">
            配置 AI 模型和语音合成
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* API Key 提示 */}
          <div className="rounded-lg p-3 bg-amber-500/10 border-2 border-amber-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-amber-600">
                  {!config.llmApiKey ? '⚠️ 请先配置 API Key' : '🎁 没有 API Key?'}
                </div>
                <div className="text-xs mt-0.5 text-amber-600/80">
                  点击一键申请，复制 Key 填入下方即可
                </div>
              </div>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => window.open(currentProvider.applyUrl || 'https://www.v1api.cc/', '_blank')}
                className="shrink-0 bg-amber-500 hover:bg-amber-600"
              >
                一键申请
              </Button>
            </div>
          </div>

          {/* LLM API */}
          <div className="rounded-lg border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 space-y-3">
            <div className="text-sm font-medium text-[var(--text-primary)]">接口配置</div>

            <div className="space-y-2">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">API 服务商</label>
                <select
                  value={config.llmProvider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className={inputClass}
                >
                  {API_PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {config.llmProvider === 'custom' && (
                <input
                  type="url"
                  value={config.llmBaseUrl}
                  onChange={(e) => handleChange('llmBaseUrl', e.target.value)}
                  placeholder="API Base URL"
                  className={inputClass}
                />
              )}

              <div className="relative">
                <input
                  type={showLlmKey ? 'text' : 'password'}
                  value={config.llmApiKey}
                  onChange={(e) => handleChange('llmApiKey', e.target.value)}
                  placeholder="API Key"
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowLlmKey(!showLlmKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showLlmKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* 模型：自动从 /v1/models 拉取 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-[var(--text-muted)]">模型（自动获取）</label>
                  <button
                    type="button"
                    onClick={() => void runFetch(true)}
                    disabled={loadingModels}
                    className="flex items-center gap-1 text-xs text-[var(--accent-primary)] disabled:opacity-50"
                  >
                    {loadingModels
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <RefreshCw className="w-3 h-3" />}
                    刷新
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-2 min-h-[18px]">
                  <span className="shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] border border-[var(--border-color)] text-[var(--text-muted)]">
                    {SOURCE_LABEL[modelSource]}
                  </span>
                  {modelStatus && (
                    <span className="text-[10px] text-[var(--text-muted)] truncate" title={modelStatus}>
                      {modelStatus}
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  value={modelQuery}
                  onChange={(e) => setModelQuery(e.target.value)}
                  placeholder="搜索模型…"
                  className={`${inputClass} mb-2`}
                />

                <select
                  value={isCustomModel ? CUSTOM_VALUE : config.llmModel}
                  onChange={(e) => handleChange('llmModel', e.target.value === CUSTOM_VALUE ? '' : e.target.value)}
                  className={inputClass}
                >
                  {filteredModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                  <option value={CUSTOM_VALUE}>自定义…</option>
                </select>

                {isCustomModel && (
                  <input
                    type="text"
                    value={config.llmModel}
                    onChange={(e) => handleChange('llmModel', e.target.value)}
                    placeholder="输入自定义模型名称"
                    className={`${inputClass} mt-2`}
                  />
                )}

                {modelSource === 'proxy' && (
                  <p className="text-[10px] text-amber-600 mt-2 leading-relaxed">
                    浏览器直连被拦截，已通过本站服务端代理获取。此请求中 API Key 会经过部署服务器；介意的话可改用允许跨域的服务商，或直接手动输入模型名。
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* TTS API (MiniMax) */}
          <div className="rounded-lg border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">语音合成 (TTS)</div>
                <div className="text-xs text-[var(--text-muted)]">MiniMax 语音，让角色"说话"</div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.ttsEnabled}
                  onCheckedChange={(v) => handleChange('ttsEnabled', v)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://platform.minimaxi.com/docs/guides/quickstart-preparation', '_blank')}
                  className="gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  申请
                </Button>
              </div>
            </div>

            {config.ttsEnabled && (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showTtsKey ? 'text' : 'password'}
                    value={config.ttsApiKey}
                    onChange={(e) => handleChange('ttsApiKey', e.target.value)}
                    placeholder="MiniMax API Key"
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowTtsKey(!showTtsKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    {showTtsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type="text"
                  value={config.ttsGroupId}
                  onChange={(e) => handleChange('ttsGroupId', e.target.value)}
                  placeholder="MiniMax Group ID"
                  className={inputClass}
                />
              </div>
            )}
          </div>

          <Button type="button" variant="default" onClick={handleSave} className="w-full">
            {saved ? "✓ 已保存" : "保存 API 配置"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
