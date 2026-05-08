import type { GenerateParams, Product, ProviderId, Settings } from './types'
import type { IconName } from './components/Icon'


/**
 * AI 平台定义
 */
export interface ProviderDef {
  id: ProviderId
  name: string
  badge?: string // "免费" / "付费" 等标签
  highlight?: boolean // 主推高亮
  applyUrl: string
  applyTip: string
  keyPlaceholder: string
  keyFormat?: string // 正则提示
  defaultModel: string
  models: { key: string; label: string; note: string; free?: boolean }[]
  description: string
}

export const PROVIDERS: ProviderDef[] = [
  {
    id: 'zhipu',
    name: '智谱 GLM',
    badge: '旗舰可用',
    highlight: true,
    applyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    applyTip: '用手机号注册登录 bigmodel.cn → 个人中心 → API Keys → 创建新 Key',
    keyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxx',
    defaultModel: 'glm-4.6v',
    description: 'GLM-4.6V 旗舰多模态，资源包对应模型',
    models: [
      { key: 'glm-4.6v', label: 'GLM-4.6V', note: '旗舰多模态 · 资源包对应（默认）' },
      { key: 'glm-4.6', label: 'GLM-4.6', note: '旗舰对话（独立资源包）' },
      { key: 'glm-4.5', label: 'GLM-4.5', note: '上一代旗舰对话' },
      { key: 'glm-4.5v', label: 'GLM-4.5V', note: '上一代旗舰多模态' },
      { key: 'glm-4-plus', label: 'GLM-4-Plus', note: '经典付费旗舰' },
      { key: 'glm-4-air', label: 'GLM-4-Air', note: '付费 · 性价比' },
      { key: 'glm-4-flashx', label: 'GLM-4-FlashX', note: '完全免费 · 速度快', free: true },
      { key: 'glm-4-flash', label: 'GLM-4-Flash', note: '完全免费 · 基础版', free: true },
      { key: 'glm-z1-flash', label: 'GLM-Z1-Flash', note: '免费 · 推理模型', free: true },
    ],
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    badge: '送 14 元',
    applyUrl: 'https://cloud.siliconflow.cn/account/ak',
    applyTip: '手机号注册送 14 元永久额度，包含 Qwen/DeepSeek/GLM 等开源模型',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
    description: '聚合平台 · 多种开源模型 · 性价比高',
    models: [
      {
        key: 'Qwen/Qwen2.5-7B-Instruct',
        label: 'Qwen2.5 7B',
        note: '完全免费 · 阿里通义千问',
        free: true,
      },
      {
        key: 'THUDM/GLM-Z1-9B-0414',
        label: 'GLM-Z1 9B',
        note: '完全免费 · 推理模型',
        free: true,
      },
      {
        key: 'Qwen/Qwen3-8B',
        label: 'Qwen3 8B',
        note: '完全免费 · 新一代通义',
        free: true,
      },
      {
        key: 'deepseek-ai/DeepSeek-V3.1',
        label: 'DeepSeek V3.1',
        note: '付费 · 性价比高',
      },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    badge: '低价',
    applyUrl: 'https://platform.deepseek.com/api_keys',
    applyTip: '注册后前往 platform.deepseek.com 创建 API Key，按量付费，5元起充',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    defaultModel: 'deepseek-chat',
    description: 'DeepSeek V3 · 国产开源之光 · 价格低廉',
    models: [
      { key: 'deepseek-chat', label: 'DeepSeek V3', note: '¥0.5/M tokens 输入' },
      { key: 'deepseek-reasoner', label: 'DeepSeek R1', note: '推理增强版' },
    ],
  },
  {
    id: 'kimi',
    name: 'Kimi 月之暗面',
    badge: '有免费额度',
    applyUrl: 'https://platform.moonshot.cn/console/api-keys',
    applyTip: '登录 platform.moonshot.cn 创建 API Key，新用户赠送 15 元体验额度',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    defaultModel: 'moonshot-v1-8k',
    description: 'Moonshot Kimi · 长上下文见长',
    models: [
      { key: 'moonshot-v1-8k', label: 'Moonshot v1 8K', note: '基础版' },
      { key: 'moonshot-v1-32k', label: 'Moonshot v1 32K', note: '中等上下文' },
      { key: 'moonshot-v1-128k', label: 'Moonshot v1 128K', note: '长上下文' },
    ],
  },
  {
    id: 'baidu',
    name: '百度千帆 ERNIE',
    badge: '可能欠费',
    applyUrl: 'https://console.bce.baidu.com/iam/#/iam/apikey/list',
    applyTip: '登录百度智能云控制台创建 API Key，注意：账号需无欠费',
    keyPlaceholder: 'bce-v3/ALTAK-xxxxxxxx/xxxxxxxxxxxxxxxxxx',
    defaultModel: 'ernie-speed-pro-128k',
    description: '百度文心大模型 · 需自行确保账号状态正常',
    models: [
      { key: 'ernie-speed-pro-128k', label: 'ERNIE Speed Pro 128K', note: '免费 · 速度快', free: true },
      { key: 'ernie-lite-pro-128k', label: 'ERNIE Lite Pro 128K', note: '免费 · 轻量', free: true },
      { key: 'ernie-3.5-8k', label: 'ERNIE 3.5', note: '经典付费' },
      { key: 'ernie-4.5-turbo-128k', label: 'ERNIE 4.5 Turbo', note: '最新旗舰付费' },
    ],
  },
  {
    id: 'custom',
    name: '自定义 (OpenAI 兼容)',
    applyUrl: '',
    applyTip: '填写任意 OpenAI 兼容端点 (例如 OpenAI / Azure / 本地 LM Studio / Ollama)',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    defaultModel: 'gpt-4o-mini',
    description: '手动填写 Base URL 和 Key',
    models: [],
  },
]

export function getProvider(id: ProviderId): ProviderDef {
  return PROVIDERS.find((p) => p.id === id) || PROVIDERS[0]
}

export interface SceneDef {
  key: string
  label?: string // 显示名(缺省用 key)
  icon: IconName
  hint: string
}

/** 智能推荐场景的特殊标识 */
export const AUTO_SCENE_KEY = 'auto'

/**
 * 场景列表: 针对"蚊虫叮咬护肤膏 / 婴童呵护膏"等产品的真实使用情境
 * 第一项是"智能推荐" —— 会根据选中商品的 scenes / description 自动匹配
 */
export const SCENES: SceneDef[] = [
  { key: AUTO_SCENE_KEY, label: '智能推荐', icon: 'sparkles', hint: '根据商品自动匹配最合适的场景(推荐)' },
  { key: '夏夜户外', icon: 'scene-moon', hint: '乘凉 / 傍晚散步 / 夜市' },
  { key: '公园遛娃', icon: 'scene-baby', hint: '带宝宝出门 / 推车' },
  { key: '露营野餐', icon: 'scene-flame', hint: '帐篷 / 烧烤 / 篝火' },
  { key: '旅行出差', icon: 'scene-airplane', hint: '酒店 / 民宿 / 异地' },
  { key: '洗澡睡前', icon: 'scene-home', hint: '临睡前 / 浴后 / 哄睡' },
  { key: '草地野餐', icon: 'scene-food', hint: '公园野餐垫 / 草坪' },
  { key: '钓鱼徒步', icon: 'scene-dumbbell', hint: '户外运动 / 爬山' },
  { key: '阳台花园', icon: 'scene-coffee', hint: '阳台 / 小院 / 浇花' },
  { key: '遛狗散步', icon: 'scene-paw', hint: '遛宠物 / 小区散步' },
  { key: '全家出游', icon: 'scene-heart', hint: '一家人出门 / 亲子' },
  { key: '日常通勤', icon: 'scene-briefcase', hint: '上下班 / 地铁 / 公交' },
  { key: '婴童护理', icon: 'scene-gift', hint: '宝宝专用 / 日常护理' },
]

/**
 * 风格列表: 全部围绕"微信朋友圈 / 微信小店真实种草"展开
 * 第一项是默认风格 —— 最自然、最生活化的朋友圈真实分享
 */
export const STYLES = [
  { key: '朋友圈真实分享', desc: '像朋友随口说一句，最自然（默认）' },
  { key: '妈妈口吻', desc: '有温度的育儿日常分享' },
  { key: '温柔治愈', desc: '温暖、柔软、治愈人心' },
  { key: '文艺清新', desc: '含蓄、有画面感、不夸张' },
  { key: '幽默搞笑', desc: '自嘲、轻松、有小梗' },
  { key: '小红书风', desc: '卡点关键词、节奏感' },
  { key: '高级简约', desc: '极简、留白、不多话' },
  { key: '走心感慨', desc: '情绪真挚、真情流露' },
]

export const MOODS = [
  '开心', '幸福', '感动', '兴奋', '满足', '治愈',
  '感慨', '思念', '失落', '疲惫', '无语', '平静',
  '愤怒', '紧张', '期待', '骄傲',
]

/**
 * 预置的智谱 GLM API Key - 开箱即用, 用户无需任何配置
 * 模型 glm-4-flash 完全免费且不限调用次数
 * ⚠️ 打包分发后其他用户可通过反编译提取此 Key, 但免费模型不会产生费用
 */
export const PRESET_API_KEY =
  '8226d66f8bfa40d09687f2804dfb6eb5.lJ7uGt944Et4g67A'

export const DEFAULT_SETTINGS: Settings = {
  provider: 'zhipu',
  apiKey: PRESET_API_KEY,
  baseUrl: '',
  // 用户购买了 1000 万 GLM-4.6V 资源包, 使用对应的旗舰多模态
  model: 'glm-4.6v',
  temperature: 0.9,
}

export const DEFAULT_PARAMS: GenerateParams = {
  scene: AUTO_SCENE_KEY,
  style: '朋友圈真实分享',
  keywords: '',
  mood: '',
  length: 'medium',
  count: 3,
  withEmoji: true,
  withHashtags: false,
  extra: '',
}

// 字数下限抬到 60 字 (用户要求 > 60 字), 上限放宽到 150 字
// 朋友圈支持长文, 文案有空间写细节、写故事、写画面
export const LENGTH_LABEL: Record<GenerateParams['length'], string> = {
  short: '短 (60~85字)',
  medium: '中 (85~115字)',
  long: '长 (115~150字)',
}

/**
 * 管理员密码: 进入"商品管理"页面时需要输入
 * 代理商/分销商拿到 exe 后只能选商品, 不能改商品
 * 上架新商品需要管理员(品牌方/老板)用此密码解锁
 *
 * TODO: 后续建议改为启动时从环境变量读取, 避免硬编码到前端代码
 */
export const ADMIN_PASSWORD = 'admin2025'

/**
 * 内置默认商品列表 (代码打包时固化)
 * 代理安装软件后, 即使不做任何配置, 也能看到这些商品
 * 管理员登录后可以在"商品管理"页面新增/编辑/删除自定义商品
 */
export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'builtin-shancha-hufu',
    name: '山茶菁华婴童呵护膏',
    tagline: '天然山茶油提取，宝宝夏日外出常备',
    sellingPoints: [
      '天然山茶油萃取，温和不刺激',
      '蚊虫叮咬后舒缓，不黏腻',
      '全家可用，婴童孕妇友好',
      '便携小巧，随身携带',
    ],
    description:
      '山茶菁华婴童呵护膏（Camellia Fruit Elite Baby Repair Cream）是一款以天然山茶油为核心成分的婴童日常护肤膏。' +
      '净含量 15g，小巧便携，可随身携带。适合 0~6 岁宝宝日常使用，也可全家共用。' +
      '设计初衷：夏天户外活动多、蚊虫叮咬频繁，家长希望有一支既温和又便携、能随手一涂的呵护膏。' +
      '品牌主张"山茶果·温柔守护"，强调天然、自然、家常的陪伴感。',
    scenes: ['夏夜户外', '公园遛娃', '露营野餐', '婴童护理'],
    extraRules:
      '文案以妈妈/家长的真实生活感出发，不说"治疗""止痒"等医疗词。' +
      '可以提"天然山茶油""温和""小巧便携""全家可用""15g 净含量"等事实。',
    priceText: '¥89',
    builtIn: true,
  },
]
