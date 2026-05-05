import type { Product } from './types'
import { SCENES, AUTO_SCENE_KEY } from './constants'

/**
 * 根据商品内容推理出合适的候选场景列表
 * 优先级:
 *   1. 商品的 recommendedScenes (管理员已明确配置的场景)
 *   2. 从 商品详细介绍/卖点/一句话定位 里做关键词匹配
 *   3. 用默认 fallback 场景
 *
 * @param product 选中商品 (null 表示没选)
 * @param requestedCount 本次要生成的文案条数 (决定返回多少个候选)
 * @returns 候选场景 key 列表 (都是 SCENES 里的有效 key, 不含 'auto')
 */
export function inferScenesForProduct(
  product: Product | null,
  requestedCount: number = 3
): string[] {
  const allSceneKeys = SCENES
    .map((s) => s.key)
    .filter((k) => k !== AUTO_SCENE_KEY)

  if (!product) {
    // 没选商品 (理论上不应该发生), 默认前 N 个场景
    return allSceneKeys.slice(0, Math.max(1, requestedCount))
  }

  // Step 1: 用商品已配置的 scenes
  const fromProduct = (product.scenes || []).filter((s) => allSceneKeys.includes(s))

  // Step 2: 从商品文本内容推理场景
  const fromText = inferByKeywords(product)

  // 合并并去重, 保持优先级顺序
  const merged: string[] = []
  const seen = new Set<string>()
  for (const k of [...fromProduct, ...fromText]) {
    if (!seen.has(k)) {
      merged.push(k)
      seen.add(k)
    }
  }

  // Step 3: 如果还是不够, 用"多样化"的 fallback 补齐
  // 关键: fallback 不再固定母婴场景, 而是覆盖不同时段/不同活动, 让 AI 自由发挥
  // 真实命中关键词的场景排前面; 没命中时这些通用场景会让 AI 跳出"夏夜带娃"模板
  const diverseFallback = [
    '日常通勤',
    '阳台花园',
    '全家出游',
    '旅行出差',
    '洗澡睡前',
    '夏夜户外',
    '公园遛娃',
    '遛狗散步',
  ]
  for (const k of diverseFallback) {
    if (merged.length >= Math.max(requestedCount, 4)) break
    if (!seen.has(k) && allSceneKeys.includes(k)) {
      merged.push(k)
      seen.add(k)
    }
  }

  // 至少返回 1 个
  if (merged.length === 0) {
    merged.push(allSceneKeys[0])
  }

  return merged
}

/**
 * 根据商品文本内容做关键词匹配, 推荐场景
 * 使用每个 SCENES 项的 key + hint 作为匹配依据
 */
function inferByKeywords(product: Product): string[] {
  const text = [
    product.name,
    product.tagline,
    product.description,
    ...(product.sellingPoints || []),
    product.extraRules,
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase()

  if (!text) return []

  // 关键词 → 场景 key 映射 (覆盖多品类: 食品/护肤/家居/数码/服饰/母婴/宠物/运动/办公)
  const KEYWORD_MAP: Record<string, string[]> = {
    // ==== 户外/夜间 ====
    夏夜户外: ['夏', '夜', '户外', '晚风', '夜市', '傍晚', '纳凉', '蚊'],
    露营野餐: ['露营', '帐篷', '篝火', '烧烤', '营地'],
    草地野餐: ['野餐', '草地', '草坪', '野餐垫'],
    钓鱼徒步: ['钓鱼', '徒步', '爬山', '登山', '户外运动', '远足', '健身', '运动', '锻炼', '跑步', '瑜伽'],

    // ==== 居家/休闲 ====
    阳台花园: ['阳台', '花园', '浇花', '小院', '院子', '绿植', '盆栽'],
    洗澡睡前: ['睡前', '洗澡', '浴', '哄睡', '睡觉', '入睡', '晚安', '泡澡', '泡脚', '助眠', '夜里'],

    // ==== 出行 ====
    旅行出差: ['旅行', '出差', '民宿', '酒店', '异地', '出行', '差旅', '机场', '高铁', '行李', '旅游'],
    日常通勤: [
      '通勤', '上班', '地铁', '公交', '办公室', '职场', '办公', '电脑',
      '打工', '咖啡', '工位', '会议', '加班', '学习', '宿舍', '学生', '考试', '复习',
    ],

    // ==== 家庭/亲友 ====
    全家出游: ['全家', '亲子', '家人', '一家人', '家庭', '父母', '爸妈', '送礼', '礼物'],
    公园遛娃: ['公园', '遛娃', '宝宝', '小孩', '孩子', '带娃', '推车', '婴', '幼', '儿童'],
    婴童护理: ['婴', '童', '宝宝', '幼儿', '新生', '护理', '呵护', '幼童', '儿童', '尿布', '辅食', '奶粉'],
    遛狗散步: ['遛狗', '宠物', '散步', '小区', '猫', '狗', '萌宠', '毛孩子'],
  }

  const hits: Array<{ key: string; score: number }> = []
  for (const [sceneKey, keywords] of Object.entries(KEYWORD_MAP)) {
    let score = 0
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) score += 1
    }
    if (score > 0) hits.push({ key: sceneKey, score })
  }

  // 按 score 降序
  hits.sort((a, b) => b.score - a.score)
  return hits.map((h) => h.key)
}
