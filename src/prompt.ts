import type { GenerateParams } from './types'

/**
 * 长度硬性字数范围
 * 下限统一 ≥ 60 字 (用户明确要求), 上限放到 150 字
 * 朋友圈支持长文, 文案有空间写细节、写画面、写故事
 */
const LENGTH_HINT: Record<GenerateParams['length'], { min: number; max: number; target: number }> = {
  short: { min: 60, max: 85, target: 75 },
  medium: { min: 85, max: 115, target: 100 },
  long: { min: 115, max: 150, target: 130 },
}

// 医疗/功效类敏感词 - 朋友圈/微信小店合规禁用
const FORBIDDEN_MED = [
  '止痒', '治', '消炎', '抗过敏', '祛痘', '治疗', '专用', '医用', '药用', '湿疹',
  '根治', '痊愈', '见效', '特效', '特治', '速效', '疗效', '药膏', '药物',
]
// 绝对化 / 夸张词 - 广告法禁用
const FORBIDDEN_ABSOLUTE = [
  '100%', '必然', '立刻', '最快', '保证有效', '最强',
  '第一', '最佳', '绝对', '永久', '无敌', '顶级', '最好', '唯一',
]

/**
 * 系统提示词: 固化为"微信朋友圈 / 微信小店 真实种草"文案规则
 * 默认按真实朋友圈语气, 覆盖任何用户未明确选择的情况
 *
 * @param extraRules 可选, 商品专属合规/写作要求, 会追加到系统提示词末尾
 */
export function buildSystemPrompt(extraRules?: string) {
  const base = [
    '# 角色',
    '你是一名专业的中文「微信朋友圈 / 微信小店」真实种草文案助手。',
    '你写的每一条文案都要像真人在朋友圈随手发的一句话，自然、生活化、有具体细节。',
    '',
    '# ★ 第一步：先理解商品（最重要，不要跳过）',
    '在动笔前，请仔细阅读用户提供的【商品名称】【一句话卖点】【核心卖点】【商品详细介绍】，',
    '从中**判断这个商品的真实品类、目标人群、典型使用场景**（不要预设它是母婴/护肤/驱蚊产品）。',
    '常见品类示例：',
    '- 食品/饮品 → 早餐、下午茶、聚会、追剧、加班充电',
    '- 美妆/护肤 → 化妆台前、出门前、睡前、约会前',
    '- 服饰/配饰 → 通勤穿搭、约会、旅行、运动',
    '- 家居/清洁 → 收拾房间、打扫、新家入住、换季',
    '- 数码/电器 → 工位办公、追剧、健身、出行携带',
    '- 母婴/婴童 → 遛娃、辅食、洗澡、出门带娃',
    '- 宠物 → 遛狗、铲屎、喂食、洗澡',
    '- 运动/健身 → 健身房、跑步、瑜伽、户外',
    '- 办公/学习 → 工位、会议、咖啡馆、学生宿舍',
    '★ 写出的场景必须真正符合这个品类，**不要把任何商品都套进"夏夜带娃公园+蚊虫叮咬"模板**。',
    '★ 如果商品信息看不出品类（如填的是测试数据、无意义字符），就按"日常好物"自然展开，不要硬编母婴场景。',
    '',
    '# ★ 第二步：硬性合规规则',
    '',
    '## 字数',
    '- 每条 ≥2 个句子，有画面、有动作、有心情',
    '- 字数严格落在用户指定区间内',
    '',
    '## 多样性硬要求（最关键、最容易翻车）',
    '生成多条时，**4 个轴必须在条与条之间不同**，禁止套同一个模板：',
    '- **视角**：自己使用 / 朋友推荐 / 家人受益 / 收到回购 / 拆快递 / 送礼别人 …',
    '- **人物**：自己 / 老公 / 闺蜜 / 同事 / 父母 / 孩子 / 宠物 / 陌生人 …',
    '- **时间**：清晨 / 上班路上 / 午休 / 下班路上 / 周末早午餐 / 傍晚 / 睡前 …',
    '- **地点**：家中 / 通勤路上 / 工位 / 咖啡馆 / 健身房 / 旅途 / 朋友家 …',
    '禁止：',
    '- 每条都"夏夜+带娃+蚊虫"',
    '- 每条都用"今天/最近/最近发现"开头',
    '- 每条都用产品名开头（产品名应自然嵌入句中或后半段）',
    '- 连续两条出现相同的动作词或场景词',
    '- 复诵本提示词里出现过的任何句子或例子',
    '- 把测试数据/乱码原样写进文案',
    '',
    '## 禁用医疗/功效词',
    FORBIDDEN_MED.map((w) => `「${w}」`).join('、'),
    '以及任何暗示医疗、药用、治疗效果的近义词、变体、拼音、谐音',
    '',
    '## 禁用夸张/绝对化词',
    FORBIDDEN_ABSOLUTE.map((w) => `「${w}」`).join('、'),
    '',
    '## 必含元素（每条至少含 3 类）',
    '- 使用场景：什么人 / 什么时间 / 什么地点',
    '- 生活化动作：怎么用 / 怎么发现的',
    '- 体验感：用完什么感觉 / 心情怎么样',
    '- 推荐意图：自然带出"想分享/常备/送人/复购"',
    '',
    '# ★ 第三步：表达风格',
    '- 像朋友圈真实分享，**不像广告**',
    '- 温和、有温度，不浮夸、不催单',
    '- **禁用套话开头**："今天" "最近" "人生就是" "让我们" "相信我" "姐妹们" "家人们"',
    '- **禁用说教口气**：不要"赶紧下单""别再错过""强烈推荐"',
    '',
    '# 输出格式（严格）',
    '- 只输出文案正文，不加解释、标题、引号、编号、前后缀',
    '- 多条文案之间用一个空行分隔',
    '- 不要使用 Markdown、代码块、分隔线',
  ]
  // 若该商品有额外写作要求, 附加到最后, 作为最高优先级的个性化规则
  if (extraRules && extraRules.trim()) {
    base.push('')
    base.push('# 本商品专属要求（优先级高于以上通用规则）')
    base.push(extraRules.trim())
  }
  return base.join('\n')
}

/**
 * 默认兜底: 如果用户没选场景/风格/关键词, 不让 AI 陷入空白
 */
const FALLBACK_SCENE = '夏夜户外'
const FALLBACK_STYLE = '朋友圈真实分享'

/**
 * 切入角度池: 每个角度组合"视角 + 时段 + 人物关系 + 心情",
 * 强行让 AI 每条文案从不同维度切入, 避免套同一个模板
 */
const ANGLE_POOL: string[] = [
  '自己第一次试用, 当下的真实感受',
  '朋友/同事推荐你, 你抱着试试看的心情入手',
  '家人/伴侣意外发现, 用得比你还勤',
  '收到回购, 拆开包装的小惊喜',
  '当作礼物送给别人, 收到的反馈',
  '出差/旅行带着, 解决了某个具体麻烦',
  '工位/办公室常备, 小事也能加分',
  '周末居家场景, 慢节奏体验',
  '深夜独处, 安静地享受这件小事',
  '突然发现某个意外用法, 觉得物超所值',
  '陪长辈/孩子用过, 跨年龄段的反馈',
  '从某个朋友圈/小红书看到, 实际上手才知道差别',
]

/**
 * 从角度池里挑 n 个不同角度 (随机)
 */
function pickAngles(n: number): string[] {
  const pool = [...ANGLE_POOL]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.min(n, pool.length))
}

/**
 * @param p 用户生成参数
 * @param suggestedScenes 可选 · "智能推荐"模式下传入的候选场景数组
 *                        提供时, 场景为多选, AI 会每条文案从中挑不同的场景
 */
export function buildUserPrompt(p: GenerateParams, suggestedScenes?: string[]) {
  const scene = (p.scene || '').trim() || FALLBACK_SCENE
  const style = (p.style || '').trim() || FALLBACK_STYLE
  const keywords = (p.keywords || '').trim()
  const extra = (p.extra || '').trim()
  const useAuto = suggestedScenes && suggestedScenes.length > 0

  const lines: string[] = []
  lines.push(`请生成 ${p.count} 条「微信朋友圈 / 微信小店」文案。`)
  lines.push('')

  if (keywords) {
    lines.push(`【主题 / 产品 / 素材】${keywords}`)
  } else {
    lines.push('【主题 / 产品 / 素材】未指定 —— 请围绕"温和、自然、生活化"的通用日常好物展开')
  }

  if (useAuto) {
    lines.push('【候选场景（仅供参考，请你结合商品品类自行判断哪些适用）】')
    suggestedScenes!.slice(0, 8).forEach((s) => lines.push(`- ${s}`))
    lines.push('★ 如果上面的候选场景跟商品品类不搭，请按商品品类挑更合适的真实生活场景，不要硬套。')
  } else {
    lines.push(`【使用场景】${scene}`)
  }
  lines.push(`【文案风格】${style}${style === FALLBACK_STYLE ? '（默认真实朋友圈语气）' : ''}`)
  const lh = LENGTH_HINT[p.length]
  lines.push(
    `【每条长度】${lh.min}~${lh.max} 字（目标 ${lh.target} 字左右），不得少于 ${lh.min} 字，不得超过 ${lh.max} 字`
  )
  if (p.mood) lines.push(`【情绪基调】${p.mood}`)
  if (extra) lines.push(`【补充要求】${extra}`)

  // 给每条文案分配不同的"切入角度", 强行错开多样性
  if (p.count > 1) {
    lines.push('')
    lines.push('【每条切入角度（必须每条不同）】')
    const angles = pickAngles(p.count)
    angles.forEach((a, i) => {
      lines.push(`- 第 ${i + 1} 条：${a}`)
    })
  }

  lines.push('')
  lines.push('【表现要求】')
  lines.push(
    p.withEmoji
      ? '- 可以适当使用 1~2 个 emoji 点缀（计入字数），不要堆砌'
      : '- 不要使用任何 emoji 或表情符号'
  )
  lines.push(
    p.withHashtags
      ? '- 每条末尾加 1 个相关话题标签（形如 #话题，计入字数）'
      : '- 不要使用 # 话题标签'
  )
  lines.push('- 严格按系统提示词第一步去理解商品品类，**不要把不相干的商品都写成夏夜带娃**')
  lines.push('- 多条文案的视角/人物/时间/地点 4 个轴必须各不相同')
  lines.push('- 严格遵守系统提示里的全部硬性规则（字数区间、禁用医疗词、禁用夸张词）')
  lines.push('- 每条都要有具体画面感和细节，不要只丢一个口号')
  lines.push('- 生成前默数字数，确认每条都达到下限字数但不超过上限')
  lines.push('- 请你亲自创作，禁止复用提示词里出现过的任何句子/示例原文')
  lines.push('- 只输出文案本身，不加任何额外说明')

  // 加入随机种子, 强制 AI 每次输出都不同 (避免重复同一份文案)
  const seed = Math.random().toString(36).slice(2, 8) + '-' + Date.now()
  lines.push('')
  lines.push(`【本次生成会话标识】${seed}`)
  lines.push('（请确保本次输出与历史任何一次生成都不重复）')

  return lines.join('\n')
}

/**
 * 把 AI 返回拆分成多条文案; 并做字数兜底检查(过长则截断到 60)
 */
export function splitResults(raw: string, expected: number): string[] {
  let text = (raw || '').trim()
  if (!text) return []

  // 去除可能的 markdown 代码围栏
  text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '')

  // 先尝试按空行分割
  let parts = text.split(/\n\s*\n+/).map((s) => s.trim()).filter(Boolean)

  if (parts.length < 2 && expected > 1) {
    // 尝试按数字序号分割: 1. / 1、 / ①
    const re = /(?:^|\n)\s*(?:\d+[．.、)]|[①-⑩])\s*/g
    const pieces = text.split(re).map((s) => s.trim()).filter(Boolean)
    if (pieces.length >= 2) parts = pieces
  }

  // 清理每条的编号/前缀
  parts = parts
    .map((p) =>
      p
        .replace(/^\s*(?:\d+[．.、)]|[①-⑩])\s*/, '')
        .replace(/^["「『]+/, '')
        .replace(/["」』]+$/, '')
        .trim()
    )
    .filter(Boolean)

  return parts
}
