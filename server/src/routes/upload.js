// 图片上传
const express = require('express')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const multer = require('multer')
const { requireAgentOrAdmin } = require('../auth')

const router = express.Router()

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './data/uploads')
const MAX_MB = Number(process.env.MAX_UPLOAD_MB || 5)

// 确保目录存在
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR)
  },
  filename(_req, file, cb) {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase()
    const safe = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg'
    cb(null, Date.now() + '_' + crypto.randomBytes(4).toString('hex') + safe)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!/^image\//.test(file.mimetype)) {
      return cb(new Error('只能上传图片'))
    }
    cb(null, true)
  },
})

/**
 * POST /api/upload
 * multipart form, 字段名 file
 * resp: { url } - 相对路径如 /uploads/xxx.jpg
 *               - 客户端拼接 PUBLIC_BASE_URL 得到绝对地址
 */
router.post('/', requireAgentOrAdmin, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const code = err.message?.includes('File too large') ? 413 : 400
      return res.status(code).json({ error: err.message || '上传失败' })
    }
    if (!req.file) return res.status(400).json({ error: '未收到文件' })
    const url = '/uploads/' + req.file.filename
    const base = process.env.PUBLIC_BASE_URL || ''
    res.json({
      url, // 相对路径
      absoluteUrl: base ? base.replace(/\/$/, '') + url : url,
      size: req.file.size,
      filename: req.file.filename,
    })
  })
})

module.exports = router
module.exports.UPLOAD_DIR = UPLOAD_DIR
