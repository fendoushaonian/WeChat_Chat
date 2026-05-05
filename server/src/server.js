// Express 主入口
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const authRoutes = require('./routes/auth')
const productRoutes = require('./routes/products')
const uploadRoutes = require('./routes/upload')
const activateRoutes = require('./routes/activate')
const agentCodesRoutes = require('./routes/agentCodes')
const { UPLOAD_DIR } = require('./routes/upload')

const app = express()
const PORT = Number(process.env.PORT || 8787)

// 信任反向代理 (Nginx 前置时获取真实 IP)
app.set('trust proxy', 1)

app.use(
  cors({
    origin: process.env.CORS_ORIGIN === '*' ? true : (process.env.CORS_ORIGIN || true),
    credentials: false,
  })
)
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// 简单访问日志
app.use((req, _res, next) => {
  if (!req.path.startsWith('/uploads/')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  }
  next()
})

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() })
})

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/activate', activateRoutes)
app.use('/api/products', productRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/agent-codes', agentCodesRoutes)

// 静态文件: 上传的图片
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', fallthrough: false }))

// 静态文件: 管理员后台 (单页 HTML)
const ADMIN_DIR = path.join(__dirname, '..', 'public', 'admin')
if (fs.existsSync(ADMIN_DIR)) {
  app.use('/admin', express.static(ADMIN_DIR))
  // 根路径重定向到 /admin
  app.get('/', (_req, res) => res.redirect('/admin'))
}

// 404 兜底
app.use((req, res) => {
  res.status(404).json({ error: 'not found', path: req.path })
})

// 错误兜底
app.use((err, _req, res, _next) => {
  console.error('[error]', err)
  res.status(500).json({ error: err.message || '服务器错误' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`)
  console.log(` 朋友圈文案助手 · 商品库后端`)
  console.log(`  监听:        http://0.0.0.0:${PORT}`)
  console.log(`  健康检查:    GET  /api/health`)
  console.log(`  公开商品:    GET  /api/products`)
  console.log(`  管理后台:    GET  /admin`)
  console.log(`========================================`)
})
