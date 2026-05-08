export type ProviderId =
  | 'zhipu'
  | 'baidu'
  | 'deepseek'
  | 'kimi'
  | 'siliconflow'
  | 'custom'

export interface Settings {
  provider: ProviderId
  apiKey: string
  baseUrl: string // 仅 custom 模式使用
  model: string
  temperature: number
}

export interface GenerateParams {
  scene: string
  style: string
  keywords: string
  mood: string
  length: 'short' | 'medium' | 'long'
  count: number
  withEmoji: boolean
  withHashtags: boolean
  extra: string
}

export interface CopyItem {
  id: string
  text: string
  createdAt: number
  params: GenerateParams
  favorite?: boolean
  /** 命中的禁用词列表 (AI 违规时前端兜底标记) */
  violations?: string[]
  /** 是否因超字数被截断 */
  truncated?: boolean
}

export interface Product {
  /** 唯一 id, uuid 或 p001/p002 均可 */
  id: string
  /** 商品名 (必填, 朋友圈文案里会出现) */
  name: string
  /** 一句话卖点 (可选, 辅助 AI 理解产品定位) */
  tagline?: string
  /** 核心卖点列表 (至少写 2~3 个, AI 会从中挑选融入文案) */
  sellingPoints: string[]
  /**
   * 商品详细介绍 (可选, 长文本)
   * 可以写产品背景、成分、适用人群、使用方法、品牌故事等
   * 这段会原文注入 user prompt, 作为 AI 创作的素材
   */
  description?: string
  /** 推荐使用场景 (可选, 代理选完商品后自动匹配) */
  scenes?: string[]
  /**
   * AI 写作提示词 / 本商品专属规则 (可选)
   * 会作为最高优先级规则追加到 system prompt 末尾
   * 例如: "必须提到'双十一限时'"、"禁止出现价格相关内容"、"用妈妈的口吻"
   */
  extraRules?: string
  /** 商品封面图 URL (http/https/data URL, 可选) */
  coverUrl?: string
  /** 商品展示图 URL 数组 (最多9张, 可选) */
  images?: string[]
  /** 价格文本 (展示用, 如"¥89"、"限时 ¥69") */
  priceText?: string
  /** 是否为内置商品 (true 则不允许删除) */
  builtIn?: boolean
  /** 是否启用 (false 时代理客户端不会拉到此商品) */
  active?: boolean
}

export type TabKey = 'generator' | 'history' | 'favorites' | 'products'

declare global {
  interface Window {
    api: {
      store: {
        get: (key?: string) => Promise<any>
        set: (key: string | Record<string, any>, value?: any) => Promise<boolean>
        delete: (key: string) => Promise<boolean>
      }
      clipboard: {
        write: (text: string) => Promise<boolean>
      }
      shell: {
        openExternal: (url: string) => Promise<boolean>
      }
      save: {
        imageText: (payload: {
          text: string
          imageUrls: string[]
          productName: string
        }) => Promise<{ ok: true; dir: string; savedCount: number } | { ok: false; error: string }>
      }
      ai: {
        generate: (payload: {
          settings: Settings
          messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
        }) => Promise<{ ok: true; text: string } | { ok: false; error: string }>
      }
      platform: 'win32' | 'darwin' | 'linux' | string
    }
  }
}
