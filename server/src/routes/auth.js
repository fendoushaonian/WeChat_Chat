// 管理员登录路由
const express = require('express')
const bcrypt = require('bcryptjs')
const { pool } = require('../db')
const { sign, requireAdmin } = require('../auth')

const router = express.Router()

/**
 * POST /api/auth/login
 * body: { username, password }
 * resp: { token, username }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {}
    if (!username || !password) {
      return res.status(400).json({ error: '账号和密码必填' })
    }
    const [rows] = await pool.query(
      'SELECT id, username, password_hash FROM admin_users WHERE username = ? LIMIT 1',
      [String(username).trim()]
    )
    if (rows.length === 0) {
      return res.status(401).json({ error: '账号或密码错误' })
    }
    const ok = await bcrypt.compare(String(password), rows[0].password_hash)
    if (!ok) {
      return res.status(401).json({ error: '账号或密码错误' })
    }
    await pool
      .query('UPDATE admin_users SET last_login_at = NOW() WHERE id = ?', [rows[0].id])
      .catch(() => {})
    const token = sign({ sub: rows[0].id, username: rows[0].username, role: 'admin' })
    res.json({ token, username: rows[0].username })
  } catch (e) {
    console.error('[auth/login]', e)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * POST /api/auth/change-password
 * 需要登录, 修改自己的密码
 */
router.post('/change-password', requireAdmin, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {}
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '原密码和新密码必填' })
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: '新密码至少 6 位' })
    }
    const [rows] = await pool.query(
      'SELECT id, password_hash FROM admin_users WHERE id = ? LIMIT 1',
      [req.admin.sub]
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: '账号不存在' })
    }
    const ok = await bcrypt.compare(String(oldPassword), rows[0].password_hash)
    if (!ok) return res.status(401).json({ error: '原密码错误' })
    const hash = await bcrypt.hash(String(newPassword), 10)
    await pool.query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [
      hash,
      rows[0].id,
    ])
    res.json({ ok: true })
  } catch (e) {
    console.error('[auth/change-password]', e)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * GET /api/auth/me
 * 验证 token 是否有效
 */
router.get('/me', requireAdmin, (req, res) => {
  res.json({ username: req.admin.username, role: req.admin.role })
})

module.exports = router
