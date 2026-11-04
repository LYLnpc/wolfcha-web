"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { getApiConfig, saveApiConfig, API_PROVIDERS, type ApiConfig } from "@/lib/api-config";
import { ModelSelector } from "@/components/game/ModelSelector";
import { ExternalLink, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface ApiConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiConfigModal({ open, onOpenChange }: ApiConfigModalProps) {
  const [config, setConfig] = useState<ApiConfig>(() => getApiConfig());
  const [showLlmKey, setShowLlmKey] = useState(false);
  const [showTtsKey, setShowTtsKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setConfig(getApiConfig());
      setSaved(false);
    }
  }, [open]);

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
          {/* API Key 提示 - 未配置时显示警告样式 */}
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
              {currentProvider.applyUrl && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => window.open(currentProvider.applyUrl, '_blank')}
                  className="shrink-0 bg-amber-500 hover:bg-amber-600"
                >
                  一键申请
                </Button>
              )}
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
                  className="w-full px-3 py-2 text-sm bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                  {API_PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {config.llmProvider === 'custom' && (
                <>
                  <input
                    type="url"
                    value={config.llmBaseUrl}
                    onChange={(e) => handleChange('llmBaseUrl', e.target.value)}
                    placeholder="API Base URL，如 https://api.example.com/v1/chat/completions"
                    className="w-full px-3 py-2 text-sm bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                  <p className="text-xs text-[var(--text-muted)]">
                    填 /chat/completions 地址即可，会自动推导 /models 用于获取模型。
                  </p>
                </>
              )}

              <div className="relative">
                <input
                  type={showLlmKey ? 'text' : 'password'}
                  value={config.llmApiKey}
                  onChange={(e) => handleChange('llmApiKey', e.target.value)}
                  placeholder="API Key"
                  className="w-full px-3 py-2 pr-10 text-sm bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowLlmKey(!showLlmKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showLlmKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">模型</label>
                <ModelSelector
                  providerId={config.llmProvider}
                  baseUrl={config.llmBaseUrl}
                  apiKey={config.llmApiKey}
                  value={config.llmModel}
                  onChange={(model) => handleChange('llmModel', model)}
                />
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
                    className="w-full px-3 py-2 pr-10 text-sm bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
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
                  className="w-full px-3 py-2 text-sm bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
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
