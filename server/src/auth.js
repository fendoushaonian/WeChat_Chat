// 认证: JWT 签发 + 中间件
const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET || ''
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

if (!SECRET) {
  console.warn('[auth] 警告: JWT_SECRET 未设置, 服务器不应在生产环境运行')
}

function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN })
}

function verify(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

/**
 * 从请求头解析 token (Authorization: Bearer xxx)
 */
function extractToken(req) {
  const auth = req.headers.authorization || ''
  const m = auth.match(/^Bearer\s+(.+)$/i)
  return m ? m[1] : null
}

/**
 * 中间件: 仅允许带有效 admin token 的请求通过
 */
function requireAdmin(req, res, next) {
  const token = extractToken(req)
  if (!token) return res.status(401).json({ error: '未登录' })
  const decoded = verify(token)
  if (!decoded || decoded.role !== 'admin') {
    return res.status(401).json({ error: '登录已失效, 请重新登录' })
  }
  req.admin = decoded
  next()
}

/**
 * 中间件: 允许 admin 或 agent token 通过
 * 用于商品列表等"代理需要 + 管理员也需要"的接口
 */
function requireAgentOrAdmin(req, res, next) {
  const token = extractToken(req)
  if (!token) return res.status(401).json({ error: '需要激活码或管理员登录' })
  const decoded = verify(token)
  if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'agent')) {
    return res.status(401).json({ error: '凭据已失效, 请重新激活' })
  }
  if (decoded.role === 'admin') req.admin = decoded
  else req.agent = decoded
  next()
}

module.exports = { sign, verify, requireAdmin, requireAgentOrAdmin, extractToken }
