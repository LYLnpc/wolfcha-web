import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 8000;
const MAX_ENDPOINTS = 4;

/**
 * 服务端代理只允许访问公网 https 的 /models 端点。
 * 浏览器直连被 CORS 拦截时才走这里，避免本接口被当成任意 URL 的 SSRF 跳板。
 */
function isAllowedEndpoint(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    if (!/\/models\/?$/.test(url.pathname)) return false;

    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (
      host === "localhost" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^(fc|fd)[0-9a-f]{2}:/i.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function extractIds(payload: unknown): string[] {
  const list: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown } | null)?.data)
      ? (payload as { data: unknown[] }).data
      : [];

  return Array.from(
    new Set(
      list
        .map((item) =>
          typeof item === "string"
            ? item
            : typeof (item as { id?: unknown } | null)?.id === "string"
              ? (item as { id: string }).id
              : "",
        )
        .filter((id) => id.trim().length > 0),
    ),
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const body = (payload ?? {}) as { endpoints?: unknown; apiKey?: unknown };
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  const endpoints = Array.isArray(body.endpoints)
    ? body.endpoints
        .filter((item): item is string => typeof item === "string")
        .slice(0, MAX_ENDPOINTS)
    : [];

  if (!apiKey || endpoints.length === 0) {
    return NextResponse.json({ error: "missing_parameters" }, { status: 400 });
  }

  for (const endpoint of endpoints) {
    if (!isAllowedEndpoint(endpoint)) continue;
    try {
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const models = extractIds(await res.json());
      if (models.length) {
        return NextResponse.json({ models, endpoint });
      }
    } catch {
      // 尝试下一个候选端点
    }
  }

  return NextResponse.json({ error: "no_models_endpoint_available" }, { status: 502 });
}
