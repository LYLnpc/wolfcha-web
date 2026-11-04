/**
 * 前端 API 配置管理
 * 使用 localStorage 存储，支持用户自定义 API 设置
 */

// API 服务商预设
export interface ApiProvider {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  applyUrl: string;
  /** 自动获取模型列表用的 /models 接口（留空则由 baseUrl 推导） */
  modelsUrl?: string;
}

// 预设模型列表（占位；点击「自动获取」可拉取服务商真实模型列表）
export const MODEL_PRESETS = [
  'deepseek-chat',
  'deepseek-reasoner',
  'gpt-4o',
  'gpt-4o-mini',
  'Qwen/Qwen2.5-7B-Instruct',
  'moonshot-v1-8k',
] as const;

export const API_PROVIDERS: ApiProvider[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek 官方',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    applyUrl: 'https://platform.deepseek.com/',
    modelsUrl: 'https://api.deepseek.com/v1/models',
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1/chat/completions',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    applyUrl: 'https://cloud.siliconflow.cn/',
    modelsUrl: 'https://api.siliconflow.cn/v1/models',
  },
  {
    id: 'openai',
    name: 'OpenAI 官方',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
    applyUrl: 'https://platform.openai.com/api-keys',
    modelsUrl: 'https://api.openai.com/v1/models',
  },
  {
    id: 'moonshot',
    name: '月之暗面 (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'moonshot-v1-8k',
    applyUrl: 'https://platform.moonshot.cn/',
    modelsUrl: 'https://api.moonshot.cn/v1/models',
  },
  {
    id: 'dashscope',
    name: '阿里云百炼 (通义千问)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    defaultModel: 'qwen-plus',
    applyUrl: 'https://bailian.console.aliyun.com/',
    modelsUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/models',
  },
  {
    id: 'ollama',
    name: '本地 Ollama',
    baseUrl: 'http://localhost:11434/v1/chat/completions',
    defaultModel: 'qwen2.5:7b',
    applyUrl: 'https://ollama.com/download',
    modelsUrl: 'http://localhost:11434/v1/models',
  },
  {
    id: 'custom',
    name: '自定义 (任意 OpenAI 兼容接口)',
    baseUrl: '',
    defaultModel: '',
    applyUrl: '',
    modelsUrl: '',
  },
];

export interface ApiConfig {
  // LLM 配置
  llmProvider: string;
  llmBaseUrl: string;
  llmApiKey: string;
  llmModel: string;

  // TTS 配置 (MiniMax)
  ttsEnabled: boolean;
  ttsApiKey: string;
  ttsGroupId: string;
}

const STORAGE_KEY = 'wolfcha_api_config';

const DEFAULT_CONFIG: ApiConfig = {
  llmProvider: 'deepseek',
  llmBaseUrl: 'https://api.deepseek.com/v1/chat/completions',
  llmApiKey: '',
  llmModel: 'deepseek-chat',

  ttsEnabled: false,
  ttsApiKey: '',
  ttsGroupId: '',
};

export function getApiConfig(): ApiConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load API config from localStorage:', e);
  }

  return DEFAULT_CONFIG;
}

export function saveApiConfig(config: Partial<ApiConfig>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = getApiConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save API config to localStorage:', e);
  }
}

export function clearApiConfig(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear API config from localStorage:', e);
  }
}

export function isApiConfigured(): boolean {
  const config = getApiConfig();
  return Boolean(config.llmApiKey && config.llmBaseUrl);
}

// ============ 模型自动获取 ============

/**
 * 由 chat/completions 地址推导出 /models 地址。
 * 例：https://api.deepseek.com/v1/chat/completions -> https://api.deepseek.com/v1/models
 */
export function deriveModelsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (/\/models$/.test(trimmed)) return trimmed;
  if (/\/chat\/completions$/.test(trimmed)) {
    return trimmed.replace(/\/chat\/completions$/, '/models');
  }
  if (/\/completions$/.test(trimmed)) {
    return trimmed.replace(/\/completions$/, '/models');
  }
  return `${trimmed}/models`;
}

/**
 * 取当前配置下应请求的 /models 地址：
 * 自定义服务商按 baseUrl 推导，预设服务商优先用其声明的 modelsUrl。
 */
export function resolveModelsUrl(providerId: string, baseUrl: string): string {
  const provider = API_PROVIDERS.find((p) => p.id === providerId);
  if (provider && provider.id !== 'custom' && provider.modelsUrl) {
    return provider.modelsUrl;
  }
  return deriveModelsUrl(baseUrl);
}

export interface FetchModelsResult {
  models: string[];
  url: string;
}

function extractModelIds(json: unknown): string[] {
  const ids: string[] = [];

  const push = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) ids.push(value.trim());
  };

  const walk = (node: unknown, depth: number) => {
    if (depth > 3 || node == null) return;

    if (Array.isArray(node)) {
      for (const item of node) {
        if (typeof item === 'string') {
          push(item);
        } else if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>;
          push(rec.id ?? rec.name ?? rec.model);
        }
      }
      return;
    }

    if (typeof node === 'object') {
      const rec = node as Record<string, unknown>;
      for (const key of ['data', 'models', 'result', 'list', 'items']) {
        if (key in rec) walk(rec[key], depth + 1);
      }
    }
  };

  walk(json, 0);
  return Array.from(new Set(ids)).sort((a, b) => a.localeCompare(b));
}

/**
 * 自动从 OpenAI 兼容的 /models 接口拉取可用模型 ID 列表。
 */
export async function fetchAvailableModels(
  providerId: string,
  baseUrl: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<FetchModelsResult> {
  const url = resolveModelsUrl(providerId, baseUrl);
  if (!url) {
    throw new Error('请先填写 API 地址');
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  let response: Response;
  try {
    response = await fetch(url, { method: 'GET', headers, signal });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new Error(`请求失败（网络或跨域限制）：${url}`);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `获取失败 (HTTP ${response.status})${detail ? `：${detail.slice(0, 160)}` : ''}`
    );
  }

  const json: unknown = await response.json().catch(() => null);
  const models = extractModelIds(json);
  if (!models.length) {
    throw new Error('接口未返回模型列表，请手动填写模型名称');
  }

  return { models, url };
}
