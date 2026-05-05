// 客户端激活: POST /api/activate
// 用激活码换 agent token, token 后续用于拉商品等接口
const express = require('express')
const { pool } = require('../db')
const { sign } = require('../auth')

const router = express.Router()

/**
 * POST /api/activate
 * body: { code, deviceInfo? }
 * resp: { token, label, agentId }
 *
 * 状态机:
 *   未激活(0)  -> 输入正确激活码 -> 激活(1)
 *   已激活(1) -> 同一码再次激活 -> 直接发新 token (允许同码多次启动)
 *   停用(2)   -> 拒绝, 返回 403
 */
router.post('/', async (req, res) => {
  try {
    const code = String(req.body?.code || '').trim().toUpperCase()
    const deviceInfo = String(req.body?.deviceInfo || '').slice(0, 500)
    const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim()

    if (!code) {
      return res.status(400).json({ error: '请输入激活码' })
    }

    const [rows] = await pool.query(
      'SELECT * FROM agent_codes WHERE code = ? LIMIT 1',
      [code]
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: '激活码无效' })
    }
    const row = rows[0]

    if (row.status === 2) {
      return res.status(403).json({ error: '该激活码已被停用, 请联系管理员' })
    }

    // 首次激活 or 后续启动, 都更新激活信息
    if (row.status === 0) {
      await pool.query(
        `UPDATE agent_codes
         SET status = 1, device_info = ?, activated_ip = ?, activated_at = NOW(),
             last_active_at = NOW(), last_active_ip = ?, use_count = use_count + 1
         WHERE id = ?`,
        [deviceInfo || null, ip || null, ip || null, row.id]
      )
    } else {
      await pool.query(
        `UPDATE agent_codes
         SET last_active_at = NOW(), last_active_ip = ?, use_count = use_count + 1
         WHERE id = ?`,
        [ip || null, row.id]
      )
    }

    const token = sign({
      sub: row.id,
      code: row.code,
      role: 'agent',
    })

    res.json({
      token,
      label: row.label || '',
      agentId: row.id,
    })
  } catch (e) {
    console.error('[activate]', e)
    res.status(500).json({ error: '服务器错误' })
  }
})

module.exports = router
