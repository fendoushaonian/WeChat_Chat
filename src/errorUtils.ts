/**
 * 把原始错误消息翻译成对用户更友好的结构化提示
 * 适配多个 AI Provider (智谱/百度/DeepSeek/Kimi/SiliconFlow/自定义)
 */
export interface FriendlyError {
  kind: 'overdue' | 'auth' | 'quota' | 'network' | 'model' | 'generic'
  title: string
  desc: string
  actions?: { label: string; href?: string; action?: 'switch-key' }[]
  raw: string
}

export function classifyError(raw: string): FriendlyError {
  const msg = (raw || '').toLowerCase()

  // 账号欠费 (主要针对百度智能云)
  if (/overdue|欠费|账户余额|account.*(due|balance)|insufficient.*balance/i.test(raw)) {
    return {
      kind: 'overdue',
      title: '账号欠费，API 被禁用',
      desc: '此 API Key 绑定的账号处于欠费状态，平台已禁用所有调用（包括免费模型）。建议切换到「智谱 GLM-4-Flash」（完全免费、不需要充值）。',
      actions: [
        { label: '去切换到免费模型', action: 'switch-key' },
        {
          label: '申请智谱免费 Key',
          href: 'https://open.bigmodel.cn/usercenter/apikeys',
        },
      ],
      raw,
    }
  }

  // 鉴权失败
  if (/401|403|unauthorized|invalid.*(token|api.*key|signature)|iam.*denied|forbidden/i.test(raw)) {
    return {
      kind: 'auth',
      title: 'API Key 无效或已过期',
      desc: '鉴权失败。可能原因：Key 输入有误、已被删除、和当前选择的平台不匹配，或权限不足。',
      actions: [
        { label: '检查/更换 API Key', action: 'switch-key' },
      ],
      raw,
    }
  }

  // 额度耗尽 / QPS 超限
  if (/quota|rate.*limit|429|qps|too.*many|exceed/i.test(raw)) {
    return {
      kind: 'quota',
      title: '调用频率或额度超限',
      desc: '请求过于频繁，或当月免费额度已耗尽。稍等几秒重试；若是付费模型可换为免费模型（推荐 GLM-4-Flash）。',
      actions: [
        { label: '换用免费模型', action: 'switch-key' },
      ],
      raw,
    }
  }

  // 模型不存在
  if (/invalid_model|model.*(not exist|not found|no access|unavailable)/i.test(raw)) {
    return {
      kind: 'model',
      title: '模型不可用',
      desc: '当前选择的模型不存在、当前账号未开通、或不属于所选平台。请到「偏好设置」选择其他模型（推荐 GLM-4-Flash 免费版）。',
      actions: [
        { label: '修改模型选择', action: 'switch-key' },
      ],
      raw,
    }
  }

  // 网络
  if (/timeout|timed.*out|network|econnreset|socket|enotfound|getaddrinfo|connect.*refused/i.test(msg)) {
    return {
      kind: 'network',
      title: '网络连接失败',
      desc: '无法连接到 AI 服务。请检查网络、防火墙或代理设置后重试。如使用海外平台请确保网络可达。',
      raw,
    }
  }

  return {
    kind: 'generic',
    title: '生成失败',
    desc: raw || '请稍后重试',
    raw,
  }
}
