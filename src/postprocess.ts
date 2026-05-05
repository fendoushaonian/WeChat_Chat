/**
 * 文案后处理: 对 AI 返回做合规兜底
 * - 字数超过 60 字 → 截断
 * - 检测到禁用词 → 标记警告
 */

export const FORBIDDEN_WORDS = [
  // 医疗/功效类
  '止痒', '消炎', '抗过敏', '祛痘', '治疗', '医用', '药用', '湿疹',
  '根治', '痊愈', '见效', '特效', '速效', '疗效', '药膏',
  // 绝对化/夸张
  '100%', '必然', '立刻', '最快', '保证有效', '最强',
  '第一', '最佳', '绝对', '永久', '无敌', '顶级', '最好', '唯一',
]

// 上限放到 150 字 (用户要求 > 60 字, 朋友圈支持长文)
export const MAX_LEN = 150

export interface PostProcessResult {
  text: string
  truncated: boolean
  violations: string[] // 命中的禁用词
}

/**
 * 粗略统计"显示长度": 中文 1 字, 英文/数字 1 字, emoji 1 字
 * 与朋友圈显示口径基本一致
 */
function displayLength(s: string): number {
  // 使用 Intl.Segmenter 或 Array.from 统计码点(能正确处理 emoji 代理对)
  return Array.from(s).length
}

function truncateTo(s: string, max: number): string {
  const arr = Array.from(s)
  if (arr.length <= max) return s
  // 倾向于在标点处截断, 避免截到一半
  const sliced = arr.slice(0, max).join('')
  // 往前找最后一个自然断句点
  const lastPunc = Math.max(
    sliced.lastIndexOf('。'),
    sliced.lastIndexOf('.'),
    sliced.lastIndexOf('，'),
    sliced.lastIndexOf(','),
    sliced.lastIndexOf('!'),
    sliced.lastIndexOf('！'),
    sliced.lastIndexOf('~'),
    sliced.lastIndexOf('～'),
    sliced.lastIndexOf(' ')
  )
  if (lastPunc > max * 0.6) {
    return sliced.slice(0, lastPunc + 1)
  }
  return sliced + '…'
}

export function postProcess(raw: string): PostProcessResult {
  const trimmed = (raw || '').trim()
  const violations = FORBIDDEN_WORDS.filter((w) =>
    trimmed.includes(w)
  )
  const needTruncate = displayLength(trimmed) > MAX_LEN
  return {
    text: needTruncate ? truncateTo(trimmed, MAX_LEN) : trimmed,
    truncated: needTruncate,
    violations,
  }
}
