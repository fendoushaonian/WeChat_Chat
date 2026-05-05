// 云端商品库 API 客户端
// 服务器: 154.219.116.29:8787 (后期可在 .env 里覆盖)

import type { Product } from './types'

/**
 * API 基地址 (优先级):
 *   1. import.meta.env.VITE_API_BASE  (build 时通过环境变量注入)
 *   2. 默认生产服务器
 */
export const CLOUD_API_BASE: string =
  (import.meta as any).env?.VITE_API_BASE ||
  'http://154.219.116.29:8787'

export interface CloudProductsResponse {
  products: Product[]
  serverTime: string
}

export interface ActivateResponse {
  token: string
  label: string
  agentId: number
}

/**
 * 自定义错误类: 标记需要重新激活的场景 (HTTP 401/403)
 */
export class NeedActivationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NeedActivationError'
  }
}

/**
 * 用激活码换 agent token
 */
export async function activate(code: string, deviceInfo?: string): Promise<ActivateResponse> {
  const res = await fetch(`${CLOUD_API_BASE}/api/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: String(code || '').trim().toUpperCase(),
      deviceInfo: deviceInfo || '',
    }),
  })
  let data: any = null
  try { data = await res.json() } catch {}
  if (!res.ok) {
    throw new Error((data && data.error) || `HTTP ${res.status}`)
  }
  if (!data || !data.token) {
    throw new Error('服务器返回数据异常')
  }
  return data as ActivateResponse
}

/**
 * 拉取云端商品列表
 * 需要 agent token; 401/403 时抛 NeedActivationError, 调用方应跳转激活页
 */
export async function fetchCloudProducts(opts: {
  token: string
  timeoutMs?: number
}): Promise<Product[]> {
  const timeout = opts.timeoutMs ?? 8000
  const ctrl = new AbortController()
  const tid = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(`${CLOUD_API_BASE}/api/products`, {
      signal: ctrl.signal,
      cache: 'no-store',
      headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : {},
    })
    if (res.status === 401 || res.status === 403) {
      let msg = '凭据已失效, 请重新激活'
      try {
        const d = await res.json()
        if (d?.error) msg = d.error
      } catch {}
      throw new NeedActivationError(msg)
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    const data: CloudProductsResponse = await res.json()
    if (!data || !Array.isArray(data.products)) {
      throw new Error('返回数据格式异常')
    }
    return data.products.map((p) => ({
      ...p,
      builtIn: true, // 云端下发的商品视为"内置/官方", 代理不可删
    }))
  } finally {
    clearTimeout(tid)
  }
}

/**
 * 健康检查 (调试用)
 */
export async function pingCloud(): Promise<boolean> {
  try {
    const res = await fetch(`${CLOUD_API_BASE}/api/health`, { cache: 'no-store' })
    return res.ok
  } catch {
    return false
  }
}

// ============= 商品 CRUD (代理客户端用 agent token 调) =============

/**
 * 通用 fetch + 401/403 → NeedActivationError
 */
async function authFetch(token: string, path: string, init: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  // FormData 时 fetch 会自动设置 Content-Type, 不要手动覆盖
  if (init.body && !(init.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${CLOUD_API_BASE}${path}`, { ...init, headers })
  if (res.status === 401 || res.status === 403) {
    let msg = '凭据已失效, 请重新激活'
    try {
      const d = await res.json()
      if (d?.error) msg = d.error
    } catch {}
    throw new NeedActivationError(msg)
  }
  let data: any = null
  try { data = await res.json() } catch {}
  if (!res.ok) {
    throw new Error((data && data.error) || `HTTP ${res.status}`)
  }
  return data
}

export async function createCloudProduct(token: string, payload: Partial<Product>): Promise<Product> {
  const data = await authFetch(token, '/api/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data
}

export async function updateCloudProduct(
  token: string,
  id: string,
  patch: Partial<Product>
): Promise<Product> {
  const data = await authFetch(token, `/api/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
  return data
}

export async function deleteCloudProduct(token: string, id: string): Promise<void> {
  await authFetch(token, `/api/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

/**
 * 上传图片(File 对象), 返回云端绝对 URL
 */
export async function uploadCloudImage(token: string, file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const data = await authFetch(token, '/api/upload', {
    method: 'POST',
    body: fd,
  })
  // 服务端返回 absoluteUrl 或相对 url, 取其一拼绝对地址
  if (data?.absoluteUrl) return data.absoluteUrl
  if (data?.url) return CLOUD_API_BASE.replace(/\/$/, '') + data.url
  throw new Error('上传响应缺少 url')
}
