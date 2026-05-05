// 通用 AI Provider 调用层 - 支持多个国内 AI 平台
// 所有平台均使用 OpenAI 兼容的 /chat/completions 协议
//
// 支持的 provider:
//   - zhipu       智谱 GLM-4-Flash  (完全免费, 默认推荐)
//   - baidu       百度千帆 ERNIE
//   - deepseek    DeepSeek (深度求索)
//   - kimi        Kimi / Moonshot
//   - siliconflow 硅基流动 SiliconFlow
//   - custom      自定义 OpenAI 兼容端点

const https = require('https')

const PROVIDERS = {
  zhipu: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    headerAuth: (key) => `Bearer ${key}`,
  },
  baidu: {
    baseUrl: 'https://qianfan.baidubce.com/v2/chat/completions',
    headerAuth: (key) => `Bearer ${key}`,
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/chat/completions',
    headerAuth: (key) => `Bearer ${key}`,
  },
  kimi: {
    baseUrl: 'https://api.moonshot.cn/v1/chat/completions',
    headerAuth: (key) => `Bearer ${key}`,
  },
  siliconflow: {
    baseUrl: 'https://api.siliconflow.cn/v1/chat/completions',
    headerAuth: (key) => `Bearer ${key}`,
  },
}

function httpsPostJson(url, headers, body) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url)
      const payload = Buffer.from(JSON.stringify(body), 'utf-8')
      const req = https.request(
        {
          method: 'POST',
          hostname: u.hostname,
          port: u.port || 443,
          path: u.pathname + u.search,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length,
            ...headers,
          },
          timeout: 180000,
        },
        (res) => {
          const chunks = []
          res.on('data', (c) => chunks.push(c))
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf-8')
            let data
            try {
              data = JSON.parse(text)
            } catch {
              data = { raw: text }
            }
            resolve({ status: res.statusCode || 0, data })
          })
        }
      )
      req.on('timeout', () => {
        req.destroy(new Error('请求超时'))
      })
      req.on('error', reject)
      req.write(payload)
      req.end()
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * 智谱视觉模型 (GLM-4.5V / 4.6V) 调用规范:
 *   1. messages.content 必须是数组 [{type:"text", text:"..."}]
 *   2. 官方示例只使用 user 角色, 兼容性最佳
 * 这里把所有 system 消息合并进第一个 user 消息, 并把 content 转成数组格式
 */
function normalizeMessagesForVision(messages) {
  /** @type {string[]} */
  const systemTexts = []
  /** @type {any[]} */
  const others = []
  for (const m of messages) {
    if (!m) continue
    const text = typeof m.content === 'string'
      ? m.content
      : Array.isArray(m.content)
        ? m.content.map((p) => (typeof p === 'string' ? p : p?.text || '')).join('\n')
        : ''
    if (m.role === 'system') {
      if (text) systemTexts.push(text)
    } else {
      others.push({ ...m, _text: text })
    }
  }
  const sysJoined = systemTexts.join('\n\n')
  const result = others.map((m, idx) => {
    let text = m._text
    if (idx === 0 && sysJoined) {
      text = `${sysJoined}\n\n---\n\n${text}`
    }
    return { role: m.role, content: [{ type: 'text', text }] }
  })
  // 极端兜底: 如果没有任何非 system 消息, 把 system 当 user 发
  if (result.length === 0 && sysJoined) {
    return [{ role: 'user', content: [{ type: 'text', text: sysJoined }] }]
  }
  return result
}

/**
 * 统一 chat completion 调用
 * @param {object} cfg  { provider, apiKey, baseUrl, model, temperature }
 * @param {Array<{role:string, content:any}>} messages
 * @returns {Promise<string>}
 */
async function chatCompletion(cfg, messages) {
  const providerId = (cfg.provider || 'zhipu').toLowerCase()
  const providerCfg = PROVIDERS[providerId]
  const apiKey = (cfg.apiKey || '').trim()
  const model = (cfg.model || '').trim()
  // 智谱文档: temperature 范围 0~1, 限两位小数; 夹住并保留两位小数避免参数错误
  let temperature = typeof cfg.temperature === 'number' ? cfg.temperature : 0.9
  temperature = Math.max(0, Math.min(1, temperature))
  temperature = Math.round(temperature * 100) / 100

  if (!apiKey) throw new Error('请先在设置中填写 API Key')
  if (!model) throw new Error('请先在设置中选择模型')

  // URL 选择: custom 模式使用用户提供的 baseUrl, 否则使用 provider 预设
  let url
  let authHeader
  if (providerId === 'custom') {
    url = (cfg.baseUrl || '').trim()
    if (!url) throw new Error('自定义模式下必须填写 Base URL')
    if (!/^https?:\/\//i.test(url)) throw new Error('Base URL 必须以 http(s):// 开头')
    authHeader = `Bearer ${apiKey}`
  } else if (providerCfg) {
    url = providerCfg.baseUrl
    authHeader = providerCfg.headerAuth(apiKey)
  } else {
    throw new Error(`未知的 provider: ${providerId}`)
  }

  // 模型类型识别
  const isZhipu = providerId === 'zhipu'
  // 视觉模型: glm-4.5v / glm-4.6v / glm-5v-turbo / glm-4.1v-thinking 等以 v 结尾或包含 -v-
  const isVisionModel = /^glm-(4\.\d+v|5v|4\.1v|4v)/i.test(model)
  // 支持 thinking 参数的模型 (GLM-4.5 及以上)
  const isThinkingCapable =
    /^glm-(4\.[567]v?|5(\.\d+)?(-turbo)?|4\.1v|z\d?-)/i.test(model)

  // 视觉模型必须把 content 从字符串转成数组格式 [{type:"text", text:"..."}]
  // 同时把 system 消息合并进 user (官方示例只使用 user 角色)
  const finalMessages = isVisionModel ? normalizeMessagesForVision(messages) : messages

  /** @type {Record<string, any>} */
  const body = {
    model,
    messages: finalMessages,
  }
  // 视觉模型遵循官方示例的最小化参数集合 (只传必需参数, 避免参数兼容性问题)
  // 文本模型按文档传完整采样参数
  if (!isVisionModel) {
    body.temperature = temperature
    body.top_p = 0.95
    body.max_tokens = 131072
  }
  // 智谱 GLM-4.5+ 模型支持 thinking 参数: { type: 'enabled' | 'disabled' }
  // 朋友圈短文案场景不需要长链路推理, 显式关闭 thinking 让响应更快
  if (isZhipu && isThinkingCapable) {
    body.thinking = { type: 'disabled' }
  }

  // 调试日志: 帮助诊断参数问题 (生产环境可移除)
  console.log('[AI] →', providerId, model, 'isVision=', isVisionModel, 'msgCount=', finalMessages.length)

  const { status, data } = await httpsPostJson(url, { Authorization: authHeader }, body)

  if (status !== 200) {
    const msg =
      data?.error?.message ||
      data?.error_msg ||
      data?.message ||
      data?.raw ||
      JSON.stringify(data).slice(0, 500)
    console.error('[AI] ← HTTP', status, JSON.stringify(data).slice(0, 800))
    throw new Error(`HTTP ${status}: ${msg}`)
  }
  if (data.error) {
    const em = typeof data.error === 'string' ? data.error : data.error.message
    throw new Error(em || JSON.stringify(data.error))
  }
  // 优先取 content; 视觉模型可能返回数组形式 [{type:"text", text:"..."}]
  const msg = data?.choices?.[0]?.message || {}
  /** @param {any} c */
  function extractText(c) {
    if (!c) return ''
    if (typeof c === 'string') return c
    if (Array.isArray(c)) {
      return c
        .map((part) => (typeof part === 'string' ? part : part?.text || ''))
        .filter(Boolean)
        .join('\n')
    }
    if (typeof c === 'object' && typeof c.text === 'string') return c.text
    return ''
  }
  let content = extractText(msg.content)
  if (!content.trim()) content = extractText(msg.reasoning_content)
  // 清理 GLM-4.5V/4.6V 可能包含的特殊标签
  content = content
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<\|begin_of_box\|>|<\|end_of_box\|>/g, '')
    .trim()

  if (!content) {
    const finishReason = data?.choices?.[0]?.finish_reason
    if (finishReason === 'length') {
      throw new Error(
        '模型输出超过 max_tokens 被截断（finish_reason=length）。请到设置里调低生成条数或更换模型。'
      )
    }
    throw new Error('接口返回为空: ' + JSON.stringify(data).slice(0, 300))
  }
  console.log('[AI] ← OK', content.slice(0, 60).replace(/\s+/g, ' '))
  return content
}

module.exports = { chatCompletion }
