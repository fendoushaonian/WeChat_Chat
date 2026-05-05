// 商品 CRUD 路由
// 隔离规则:
//   admin token  -> 看 owner_agent_id IS NULL 的商品 (品牌方私有库)
//   agent token  -> 看 owner_agent_id = self 的商品 (代理私有库)
// 都需要 token, 都能 CRUD 自己的; 无法跨越界看到/修改对方的
const express = require('express')
const crypto = require('crypto')
const { pool } = require('../db')
const { requireAgentOrAdmin } = require('../auth')

const router = express.Router()

/**
 * 数据库行 -> 客户端 Product 对象
 */
function rowToProduct(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline || undefined,
    sellingPoints: parseJsonArray(row.selling_points),
    description: row.description || undefined,
    scenes: parseJsonArray(row.scenes),
    extraRules: row.extra_rules || undefined,
    coverUrl: row.cover_url || undefined,
    priceText: row.price_text || undefined,
    builtIn: !!row.built_in,
    ownerAgentId: row.owner_agent_id == null ? null : Number(row.owner_agent_id),
    active: row.active === undefined ? true : !!row.active,
    sortOrder: row.sort_order || 0,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  }
}

/**
 * 根据 token 角色推导 owner 过滤条件
 * 返回 { whereSql, args, ownerForInsert }
 */
function ownerScope(req) {
  if (req.agent) {
    return {
      whereSql: 'owner_agent_id = ?',
      args: [req.agent.sub],
      ownerForInsert: req.agent.sub,
    }
  }
  // admin: 只看自己的(owner_agent_id 为 NULL)
  return {
    whereSql: 'owner_agent_id IS NULL',
    args: [],
    ownerForInsert: null,
  }
}

function parseJsonArray(v) {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') {
    try {
      const x = JSON.parse(v)
      return Array.isArray(x) ? x : []
    } catch {
      return []
    }
  }
  return []
}

/**
 * 校验并清洗输入的 product 字段
 */
function sanitize(input, { partial = false } = {}) {
  const out = {}
  if (!partial || input.name !== undefined) {
    if (typeof input.name !== 'string' || !input.name.trim()) {
      throw new Error('商品名称不能为空')
    }
    out.name = input.name.trim().slice(0, 255)
  }
  if (!partial || input.sellingPoints !== undefined) {
    const sp = Array.isArray(input.sellingPoints)
      ? input.sellingPoints
          .map((s) => String(s).trim())
          .filter(Boolean)
          .slice(0, 20)
      : []
    out.sellingPoints = sp
  }
  if (input.tagline !== undefined) {
    out.tagline = String(input.tagline || '').trim().slice(0, 500) || null
  }
  if (input.description !== undefined) {
    out.description = String(input.description || '').trim().slice(0, 5000) || null
  }
  if (input.scenes !== undefined) {
    out.scenes = Array.isArray(input.scenes)
      ? input.scenes.map((s) => String(s).trim()).filter(Boolean).slice(0, 30)
      : []
  }
  if (input.extraRules !== undefined) {
    out.extraRules = String(input.extraRules || '').trim().slice(0, 2000) || null
  }
  if (input.coverUrl !== undefined) {
    out.coverUrl = String(input.coverUrl || '').trim().slice(0, 2000) || null
  }
  if (input.priceText !== undefined) {
    out.priceText = String(input.priceText || '').trim().slice(0, 100) || null
  }
  if (input.builtIn !== undefined) {
    out.builtIn = input.builtIn ? 1 : 0
  }
  if (input.sortOrder !== undefined) {
    out.sortOrder = Number.isFinite(+input.sortOrder) ? +input.sortOrder : 0
  }
  if (input.active !== undefined) {
    out.active = input.active ? 1 : 0
  }
  return out
}

/**
 * GET /api/products  -> [Product]
 * admin token: 看 owner_agent_id IS NULL 的(品牌方私有库)
 * agent token: 看 owner_agent_id = self 的(代理私有库)
 * ?all=1: 包含 active=0 的商品(用于商品管理页, 否则只返回启用的)
 */
router.get('/', requireAgentOrAdmin, async (req, res) => {
  try {
    const scope = ownerScope(req)
    const includeInactive = req.query.all === '1'
    const where = includeInactive
      ? scope.whereSql
      : `${scope.whereSql} AND active = 1`
    const [rows] = await pool.query(
      `SELECT * FROM products WHERE ${where} ORDER BY sort_order ASC, created_at ASC`,
      scope.args
    )
    res.json({
      products: rows.map(rowToProduct),
      serverTime: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[products GET]', e)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * GET /api/products/:id
 * 仅能读到自己的(按 owner 隔离)
 */
router.get('/:id', requireAgentOrAdmin, async (req, res) => {
  try {
    const scope = ownerScope(req)
    const [rows] = await pool.query(
      `SELECT * FROM products WHERE id = ? AND ${scope.whereSql} LIMIT 1`,
      [req.params.id, ...scope.args]
    )
    if (rows.length === 0) return res.status(404).json({ error: '商品不存在' })
    res.json(rowToProduct(rows[0]))
  } catch (e) {
    console.error('[products GET/:id]', e)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * POST /api/products  (agent or admin)
 * 自动绑定 owner_agent_id: agent token -> 自己, admin token -> NULL
 */
router.post('/', requireAgentOrAdmin, async (req, res) => {
  try {
    const data = sanitize(req.body || {})
    const scope = ownerScope(req)
    const id =
      (typeof req.body?.id === 'string' && req.body.id.trim()) ||
      'p_' + crypto.randomBytes(6).toString('hex')
    // 代理创建的商品强制 builtIn=0(避免代理自封"内置"); admin 创建的也默认 0
    const builtIn = req.admin ? (data.builtIn ?? 0) : 0
    await pool.query(
      `INSERT INTO products
       (id, name, tagline, selling_points, description, scenes, extra_rules,
        cover_url, price_text, built_in, owner_agent_id, active, sort_order)
       VALUES (?, ?, ?, CAST(? AS JSON), ?, CAST(? AS JSON), ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.tagline ?? null,
        JSON.stringify(data.sellingPoints || []),
        data.description ?? null,
        JSON.stringify(data.scenes || []),
        data.extraRules ?? null,
        data.coverUrl ?? null,
        data.priceText ?? null,
        builtIn,
        scope.ownerForInsert,
        data.active ?? 1,
        data.sortOrder ?? 0,
      ]
    )
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id])
    res.status(201).json(rowToProduct(rows[0]))
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: '该商品 ID 已存在' })
    }
    console.error('[products POST]', e)
    res.status(400).json({ error: e.message || '创建失败' })
  }
})

/**
 * PUT /api/products/:id  (agent or admin)
 * 仅能改自己的(按 owner 隔离); 部分更新
 */
router.put('/:id', requireAgentOrAdmin, async (req, res) => {
  try {
    const data = sanitize(req.body || {}, { partial: true })
    const scope = ownerScope(req)
    const sets = []
    const args = []
    const map = {
      name: 'name',
      tagline: 'tagline',
      description: 'description',
      extraRules: 'extra_rules',
      coverUrl: 'cover_url',
      priceText: 'price_text',
      active: 'active',
      sortOrder: 'sort_order',
    }
    // builtIn 字段仅 admin 可修改
    if (req.admin && data.builtIn !== undefined) {
      sets.push('built_in = ?')
      args.push(data.builtIn)
    }
    for (const [k, col] of Object.entries(map)) {
      if (data[k] !== undefined) {
        sets.push(`${col} = ?`)
        args.push(data[k])
      }
    }
    if (data.sellingPoints !== undefined) {
      sets.push('selling_points = CAST(? AS JSON)')
      args.push(JSON.stringify(data.sellingPoints))
    }
    if (data.scenes !== undefined) {
      sets.push('scenes = CAST(? AS JSON)')
      args.push(JSON.stringify(data.scenes))
    }
    if (sets.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' })
    }
    const finalArgs = [...args, req.params.id, ...scope.args]
    const [r] = await pool.query(
      `UPDATE products SET ${sets.join(', ')} WHERE id = ? AND ${scope.whereSql}`,
      finalArgs
    )
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: '商品不存在或不属于你' })
    }
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [
      req.params.id,
    ])
    res.json(rowToProduct(rows[0]))
  } catch (e) {
    console.error('[products PUT]', e)
    res.status(400).json({ error: e.message || '更新失败' })
  }
})

/**
 * DELETE /api/products/:id  (agent or admin)
 * 仅能删自己的
 */
router.delete('/:id', requireAgentOrAdmin, async (req, res) => {
  try {
    const scope = ownerScope(req)
    const [r] = await pool.query(
      `DELETE FROM products WHERE id = ? AND ${scope.whereSql}`,
      [req.params.id, ...scope.args]
    )
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: '商品不存在或不属于你' })
    }
    res.json({ ok: true })
  } catch (e) {
    console.error('[products DELETE]', e)
    res.status(500).json({ error: '服务器错误' })
  }
})

module.exports = router
