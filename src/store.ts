import { create } from 'zustand'
import type { CopyItem, GenerateParams, Product, Settings, TabKey } from './types'
import { ADMIN_PASSWORD, DEFAULT_PARAMS, DEFAULT_PRODUCTS, DEFAULT_SETTINGS, SCENES, STYLES } from './constants'
import {
  activate,
  fetchCloudProducts,
  createCloudProduct,
  updateCloudProduct,
  deleteCloudProduct,
  NeedActivationError,
} from './cloudApi'

interface AppState {
  tab: TabKey
  params: GenerateParams
  settings: Settings
  history: CopyItem[]
  results: CopyItem[]
  loading: boolean
  error: string
  toast: string
  hydrated: boolean

  // 商品库 + 当前选中的商品
  products: Product[]
  selectedProductId: string | null
  // 管理员模式 (内存态, 不持久化, 重启后需重新解锁)
  isAdmin: boolean

  // 云端同步状态
  syncStatus: 'idle' | 'syncing' | 'ok' | 'error'
  syncError: string
  lastSyncAt: number

  // 代理激活
  agentToken: string
  agentLabel: string
  // 是否需要激活 (true = 显示激活弹窗)
  needActivation: boolean

  setTab: (t: TabKey) => void
  setParams: (p: Partial<GenerateParams>) => void
  setSettings: (s: Partial<Settings>) => void
  setResults: (r: CopyItem[]) => void
  setLoading: (v: boolean) => void
  setError: (v: string) => void
  setToast: (v: string) => void
  addHistory: (items: CopyItem[]) => void
  clearHistory: () => void
  toggleFavorite: (id: string) => void
  removeHistory: (id: string) => void

  // 商品 CRUD (全部走云端 API, 失败抛错让 UI 显示)
  selectProduct: (id: string | null) => void
  addProduct: (p: Omit<Product, 'id' | 'builtIn'>) => Promise<void>
  updateProduct: (id: string, p: Partial<Omit<Product, 'id'>>) => Promise<void>
  removeProduct: (id: string) => Promise<void>
  // 管理员
  unlockAdmin: (password: string) => boolean
  lockAdmin: () => void

  // 云端同步
  syncProducts: () => Promise<void>

  // 代理激活
  activateAgent: (code: string) => Promise<void>
  setNeedActivation: (v: boolean) => void
  clearAgentToken: () => void

  hydrate: () => Promise<void>
  persist: () => Promise<void>
}

const STORE_KEYS = {
  settings: 'settings',
  params: 'params',
  history: 'history',
  products: 'products',
  selectedProductId: 'selectedProductId',
  agentToken: 'agentToken',
  agentLabel: 'agentLabel',
}

async function loadKey<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await window.api.store.get(key)
    return (v as T) ?? fallback
  } catch {
    return fallback
  }
}

export const useStore = create<AppState>((set, get) => ({
  tab: 'generator',
  params: DEFAULT_PARAMS,
  settings: DEFAULT_SETTINGS,
  history: [],
  results: [],
  loading: false,
  error: '',
  toast: '',
  hydrated: false,
  products: DEFAULT_PRODUCTS,
  selectedProductId: DEFAULT_PRODUCTS[0]?.id ?? null,
  isAdmin: false,
  syncStatus: 'idle',
  syncError: '',
  lastSyncAt: 0,
  agentToken: '',
  agentLabel: '',
  needActivation: false,

  setTab: (t) => set({ tab: t }),
  setParams: (p) => {
    const next = { ...get().params, ...p }
    set({ params: next })
    window.api.store.set(STORE_KEYS.params, next).catch(() => {})
  },
  setSettings: (s) => {
    const next = { ...get().settings, ...s }
    set({ settings: next })
    window.api.store.set(STORE_KEYS.settings, next).catch(() => {})
  },
  setResults: (r) => set({ results: r }),
  setLoading: (v) => set({ loading: v }),
  setError: (v) => set({ error: v }),
  setToast: (v) => {
    set({ toast: v })
    if (v) {
      setTimeout(() => {
        if (get().toast === v) set({ toast: '' })
      }, 1800)
    }
  },

  addHistory: (items) => {
    const merged = [...items, ...get().history].slice(0, 500)
    set({ history: merged })
    window.api.store.set(STORE_KEYS.history, merged).catch(() => {})
  },
  clearHistory: () => {
    set({ history: [] })
    window.api.store.set(STORE_KEYS.history, []).catch(() => {})
  },
  toggleFavorite: (id) => {
    const next = get().history.map((i) =>
      i.id === id ? { ...i, favorite: !i.favorite } : i
    )
    set({ history: next })
    window.api.store.set(STORE_KEYS.history, next).catch(() => {})
  },
  removeHistory: (id) => {
    const next = get().history.filter((i) => i.id !== id)
    set({ history: next })
    window.api.store.set(STORE_KEYS.history, next).catch(() => {})
  },

  // ==================== 商品管理 ====================
  selectProduct: (id) => {
    set({ selectedProductId: id })
    window.api.store.set(STORE_KEYS.selectedProductId, id).catch(() => {})
  },
  addProduct: async (p) => {
    const token = get().agentToken
    if (!token) throw new Error('未激活, 无法新增商品')
    const created = await createCloudProduct(token, p as Partial<Product>)
    // 加进本地列表 + 持久化
    const next = [...get().products, created]
    set({ products: next })
    window.api.store.set(STORE_KEYS.products, next).catch(() => {})
  },
  updateProduct: async (id, patch) => {
    const token = get().agentToken
    if (!token) throw new Error('未激活, 无法修改商品')
    // builtIn 不允许由客户端覆盖
    const { builtIn: _omit, ...cleanPatch } = patch as any
    const updated = await updateCloudProduct(token, id, cleanPatch)
    const next = get().products.map((p) => (p.id === id ? { ...p, ...updated } : p))
    set({ products: next })
    window.api.store.set(STORE_KEYS.products, next).catch(() => {})
  },
  removeProduct: async (id) => {
    const token = get().agentToken
    if (!token) throw new Error('未激活, 无法删除商品')
    await deleteCloudProduct(token, id)
    const next = get().products.filter((p) => p.id !== id)
    const patch: Partial<AppState> = { products: next }
    if (get().selectedProductId === id) {
      patch.selectedProductId = next[0]?.id ?? null
      window.api.store.set(STORE_KEYS.selectedProductId, patch.selectedProductId).catch(() => {})
    }
    set(patch as any)
    window.api.store.set(STORE_KEYS.products, next).catch(() => {})
  },

  // ==================== 管理员 ====================
  unlockAdmin: (password) => {
    if (password === ADMIN_PASSWORD) {
      set({ isAdmin: true })
      return true
    }
    return false
  },
  lockAdmin: () => {
    set({ isAdmin: false })
    // 退出管理员时若当前在商品管理页, 自动跳回生成页
    if (get().tab === 'products') set({ tab: 'generator' })
  },

  // ==================== 云端同步 ====================
  // 拉云端商品 -> 替换本地内置商品 (云端就是单一数据源)
  // 用户自己加的商品 (builtIn=false) 保留, 不被云端覆盖
  syncProducts: async () => {
    if (get().syncStatus === 'syncing') return
    const token = get().agentToken
    if (!token) {
      // 没 token 就不能拉, 直接进入待激活状态
      set({ needActivation: true, syncStatus: 'idle' })
      return
    }
    set({ syncStatus: 'syncing', syncError: '' })
    try {
      const cloud = await fetchCloudProducts({ token, timeoutMs: 8000 })
      // 管理员: 合并云端 + 本地自建商品; 代理: 只用云端商品
      const userCreated = get().isAdmin ? get().products.filter((p) => !p.builtIn) : []
      const merged: Product[] = [...cloud, ...userCreated]
      // 当前选中的商品如果在新列表里依然存在则保留, 否则切到第一个
      let selectedId = get().selectedProductId
      if (!merged.some((p) => p.id === selectedId)) {
        selectedId = merged[0]?.id ?? null
      }
      set({
        products: merged,
        selectedProductId: selectedId,
        syncStatus: 'ok',
        lastSyncAt: Date.now(),
        needActivation: false,
      })
      // 持久化, 下次启动可立即用缓存渲染
      window.api.store.set(STORE_KEYS.products, merged).catch(() => {})
      window.api.store.set(STORE_KEYS.selectedProductId, selectedId).catch(() => {})
    } catch (e: any) {
      // 401/403: 激活码失效 -> 清掉 token 跳激活页
      if (e instanceof NeedActivationError) {
        console.warn('[sync] 凭据失效, 跳激活:', e.message)
        set({
          agentToken: '',
          agentLabel: '',
          needActivation: true,
          syncStatus: 'error',
          syncError: e.message,
          lastSyncAt: Date.now(),
        })
        window.api.store.set(STORE_KEYS.agentToken, '').catch(() => {})
        window.api.store.set(STORE_KEYS.agentLabel, '').catch(() => {})
        return
      }
      console.warn('[sync] 拉取云端商品失败:', e?.message)
      set({
        syncStatus: 'error',
        syncError: e?.message || '同步失败',
        lastSyncAt: Date.now(),
      })
    }
  },

  // ==================== 代理激活 ====================
  activateAgent: async (code: string) => {
    const deviceInfo = `${navigator.userAgent} | ${navigator.language || ''}`.slice(0, 500)
    const r = await activate(code, deviceInfo)
    set({
      agentToken: r.token,
      agentLabel: r.label || '',
      needActivation: false,
    })
    window.api.store.set(STORE_KEYS.agentToken, r.token).catch(() => {})
    window.api.store.set(STORE_KEYS.agentLabel, r.label || '').catch(() => {})
    // 激活成功后立即同步一次
    setTimeout(() => get().syncProducts().catch(() => {}), 100)
  },
  setNeedActivation: (v: boolean) => set({ needActivation: v }),
  clearAgentToken: () => {
    set({ agentToken: '', agentLabel: '', needActivation: true })
    window.api.store.set(STORE_KEYS.agentToken, '').catch(() => {})
    window.api.store.set(STORE_KEYS.agentLabel, '').catch(() => {})
  },

  hydrate: async () => {
    const [settings, params, history, storedProducts, storedSelected, storedToken, storedLabel] = await Promise.all([
      loadKey<Settings>(STORE_KEYS.settings, DEFAULT_SETTINGS),
      loadKey<GenerateParams>(STORE_KEYS.params, DEFAULT_PARAMS),
      loadKey<CopyItem[]>(STORE_KEYS.history, []),
      loadKey<Product[] | null>(STORE_KEYS.products, null),
      loadKey<string | null>(STORE_KEYS.selectedProductId, null),
      loadKey<string>(STORE_KEYS.agentToken, ''),
      loadKey<string>(STORE_KEYS.agentLabel, ''),
    ])
    // 关键: 空字符串不应覆盖默认值 (避免旧版本空 apiKey 覆盖预置 Key)
    const cleanedSettings: Partial<Settings> = {}
    if (settings && typeof settings === 'object') {
      for (const [k, v] of Object.entries(settings)) {
        if (v !== '' && v !== null && v !== undefined) {
          ;(cleanedSettings as any)[k] = v
        }
      }
    }

    let merged: Settings = { ...DEFAULT_SETTINGS, ...cleanedSettings }

    // 迁移旧数据: 若存储的 apiKey 是旧版百度欠费预置 Key (bce-v3/ 开头),
    // 或 provider 不在当前支持列表中, 则重置为默认智谱设置
    const looksLikeLegacyBaidu = /^bce-v3\//.test(merged.apiKey)
    const validProviders = ['zhipu', 'baidu', 'deepseek', 'kimi', 'siliconflow', 'custom']
    if (looksLikeLegacyBaidu || !validProviders.includes(merged.provider)) {
      merged = { ...DEFAULT_SETTINGS }
    }
    // 智谱用户购买的是 GLM-4.6V 资源包, 老 model 全部迁移到 4.6v
    if (
      merged.provider === 'zhipu' &&
      (/^glm-4-flash/.test(merged.model) || merged.model === 'glm-4.6')
    ) {
      merged.model = 'glm-4.6v'
    }

    // 迁移 params: 如果旧场景/风格已不在新列表里, 重置为默认
    const mergedParams: GenerateParams = { ...DEFAULT_PARAMS, ...params }
    const validScenes = SCENES.map((s) => s.key)
    const validStyles = STYLES.map((s) => s.key)
    if (!validScenes.includes(mergedParams.scene)) mergedParams.scene = DEFAULT_PARAMS.scene
    if (!validStyles.includes(mergedParams.style)) mergedParams.style = DEFAULT_PARAMS.style

    // 商品列表:
    // - 用本地缓存即时渲染 (上次同步的快照, 含每个代理的私有商品)
    // - 缓存为空就空 (新激活的代理首次打开, 应该看到空状态而非内置示例)
    // - hydrate 完成后异步去云端拉最新
    const storedArr = Array.isArray(storedProducts) ? storedProducts : []
    const products: Product[] = storedArr

    // 选中 id: 优先用存储的; 若存储的已不存在就选第一个
    let selectedProductId: string | null = storedSelected || null
    if (!products.some((p) => p.id === selectedProductId)) {
      selectedProductId = products[0]?.id ?? null
    }

    set({
      settings: merged,
      params: mergedParams,
      history: Array.isArray(history) ? history : [],
      products,
      selectedProductId,
      hydrated: true,
      agentToken: storedToken || '',
      agentLabel: storedLabel || '',
      // 没 token 直接进入待激活状态
      needActivation: !storedToken,
    })
    // 写回, 保持存储和默认一致
    window.api.store.set(STORE_KEYS.settings, merged).catch(() => {})
    window.api.store.set(STORE_KEYS.params, mergedParams).catch(() => {})
    window.api.store.set(STORE_KEYS.products, products).catch(() => {})
    window.api.store.set(STORE_KEYS.selectedProductId, selectedProductId).catch(() => {})

    // hydrate 完成后, 异步去云端拉最新商品(不阻塞 UI)
    setTimeout(() => {
      get().syncProducts().catch(() => {})
    }, 100)

    // 定时自动同步 (每 30 秒), 后台改商品客户端实时更新
    setInterval(() => {
      if (!get().needActivation && get().agentToken) {
        get().syncProducts().catch(() => {})
      }
    }, 30_000)
  },
  persist: async () => {
    const s = get()
    await Promise.all([
      window.api.store.set(STORE_KEYS.settings, s.settings),
      window.api.store.set(STORE_KEYS.params, s.params),
      window.api.store.set(STORE_KEYS.history, s.history),
      window.api.store.set(STORE_KEYS.products, s.products),
      window.api.store.set(STORE_KEYS.selectedProductId, s.selectedProductId),
    ])
  },
}))
