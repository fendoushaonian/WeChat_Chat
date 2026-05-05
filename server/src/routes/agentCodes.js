// 代理激活码管理 (admin only)
const express = require('express')
const crypto = require('crypto')
const { pool } = require('../db')
const { requireAdmin } = require('../auth')

const router = express.Router()

/**
 * 生成易读的激活码: MW-XXXX-XXXX-XXXX
 * 4 字符段, 排除歧义字符 (0/O, 1/I/L)
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
function genCode() {
  const seg = () =>
    Array.from({ length: 4 })
      .map(() => ALPHABET[crypto.randomInt(0, ALPHABET.length)])
      .join('')
  return `MW-${seg()}-${seg()}-${seg()}`
}

function rowToAgent(row) {
  return {
    id: row.id,
    code: row.code,
    label: row.label || '',
    status: row.status, // 0/1/2
    statusText: row.status === 0 ? '未激活' : row.status === 1 ? '已激活' : '已停用',
    deviceInfo: row.device_info || '',
    activatedIp: row.activated_ip || '',
    activatedAt: row.activated_at ? new Date(row.activated_at).toISOString() : null,
    lastActiveAt: row.last_active_at ? new Date(row.last_active_at).toISOString() : null,
    lastActiveIp: row.last_active_ip || '',
    useCount: row.use_count || 0,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  }
}

/**
 * GET /api/agent-codes  (admin)
 * 列出所有激活码
 */
router.get('/', requireAdmin, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM agent_codes ORDER BY created_at DESC'
    )
    res.json({ agents: rows.map(rowToAgent) })
  } catch (e) {
    console.error('[agent-codes GET]', e)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * POST /api/agent-codes  (admin)
 * 批量生成激活码
 * body: { count?: number = 1, label?: string }
 * resp: { agents: [...] }
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const count = Math.max(1, Math.min(50, Number(req.body?.count || 1)))
    const label = String(req.body?.label || '').trim().slice(0, 255) || null
    const created = []
    for (let i = 0; i < count; i++) {
      // 防重复 (极小概率)
      let code = genCode()
      for (let retry = 0; retry < 5; retry++) {
        const [exists] = await pool.query(
          'SELECT id FROM agent_codes WHERE code = ? LIMIT 1',
          [code]
        )
        if (exists.length === 0) break
        code = genCode()
      }
      const [r] = await pool.query(
        'INSERT INTO agent_codes (code, label) VALUES (?, ?)',
        [code, label]
      )
      const [rows] = await pool.query('SELECT * FROM agent_codes WHERE id = ?', [
        r.insertId,
      ])
      created.push(rowToAgent(rows[0]))
    }
    res.status(201).json({ agents: created })
  } catch (e) {
    console.error('[agent-codes POST]', e)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * PUT /api/agent-codes/:id  (admin)
 * 修改备注 / 状态
 * body: { label?, status? }  (status: 1=启用, 2=停用)
 */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const sets = []
    const args = []
    if (req.body?.label !== undefined) {
      sets.push('label = ?')
      args.push(String(req.body.label).slice(0, 255) || null)
    }
    if (req.body?.status !== undefined) {
      const s = Number(req.body.status)
      if (![0, 1, 2].includes(s)) {
        return res.status(400).json({ error: 'status 只能是 0/1/2' })
      }
      sets.push('status = ?')
      args.push(s)
    }
    if (sets.length === 0) {
      return res.status(400).json({ error: '没有可更新字段' })
    }
    args.push(req.params.id)
    const [r] = await pool.query(
      `UPDATE agent_codes SET ${sets.join(', ')} WHERE id = ?`,
      args
    )
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: '激活码不存在' })
    }
    const [rows] = await pool.query('SELECT * FROM agent_codes WHERE id = ?', [
      req.params.id,
    ])
    res.json(rowToAgent(rows[0]))
  } catch (e) {
    console.error('[agent-codes PUT]', e)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * DELETE /api/agent-codes/:id  (admin)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM agent_codes WHERE id = ?', [
      req.params.id,
    ])
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: '激活码不存在' })
    }
    res.json({ ok: true })
  } catch (e) {
    console.error('[agent-codes DELETE]', e)
    res.status(500).json({ error: '服务器错误' })
  }
})

module.exports = router
