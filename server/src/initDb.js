// 数据库初始化脚本
// 用法: node src/initDb.js
// 作用:
//   1) 执行 migrations/*.sql 建表
//   2) 创建默认管理员账号(若 admin_users 表为空)
//   3) 插入内置示例商品(若 products 表为空)

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const { pool } = require('./db')

// 这些错误码代表"对象已存在", 重复执行 migration 时忽略
const IDEMPOTENT_ERRORS = new Set([
  'ER_DUP_FIELDNAME',     // 列已存在 (ALTER TABLE ADD COLUMN)
  'ER_DUP_KEYNAME',        // 索引已存在 (ADD INDEX)
  'ER_TABLE_EXISTS_ERROR', // 表已存在 (CREATE TABLE 不带 IF NOT EXISTS 时)
  'ER_DUP_ENTRY',          // 主键冲突 (再次插入种子数据时)
])

async function runMigrations() {
  const dir = path.join(__dirname, '..', 'migrations')
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf-8')
    const statements = sql
      .split(/;\s*$/m)
      .map((s) => s.trim())
      .filter(Boolean)
    console.log(`[init] 执行 ${f} (${statements.length} 条语句)`)
    for (const stmt of statements) {
      try {
        await pool.query(stmt)
      } catch (e) {
        if (IDEMPOTENT_ERRORS.has(e.code)) {
          console.log(`  ↳ 跳过 (${e.code}): 已存在`)
          continue
        }
        throw e
      }
    }
  }
}

async function seedAdmin() {
  const [rows] = await pool.query('SELECT COUNT(*) AS c FROM admin_users')
  if (rows[0].c > 0) {
    console.log('[init] admin_users 已有数据, 跳过种子账号')
    return
  }
  const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin'
  const password = process.env.DEFAULT_ADMIN_PASSWORD
  if (!password) {
    throw new Error('DEFAULT_ADMIN_PASSWORD 未设置, 无法创建初始管理员')
  }
  const hash = await bcrypt.hash(password, 10)
  await pool.query(
    'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
    [username, hash]
  )
  console.log(`[init] 已创建管理员: ${username}`)
}

async function seedProducts() {
  const [rows] = await pool.query('SELECT COUNT(*) AS c FROM products')
  if (rows[0].c > 0) {
    console.log('[init] products 已有数据, 跳过种子商品')
    return
  }
  const sample = {
    id: 'builtin-shancha-hufu',
    name: '山茶菁华婴童呵护膏',
    tagline: '天然山茶油提取，宝宝夏日外出常备',
    selling_points: [
      '天然山茶油萃取，温和不刺激',
      '蚊虫叮咬后舒缓，不黏腻',
      '全家可用，婴童孕妇友好',
      '便携小巧，随身携带',
    ],
    description:
      '山茶菁华婴童呵护膏（Camellia Fruit Elite Baby Repair Cream）是一款以天然山茶油为核心成分的婴童日常护肤膏。' +
      '净含量 15g，小巧便携，可随身携带。适合 0~6 岁宝宝日常使用，也可全家共用。' +
      '设计初衷：夏天户外活动多、蚊虫叮咬频繁，家长希望有一支既温和又便携、能随手一涂的呵护膏。' +
      '品牌主张"山茶果·温柔守护"，强调天然、自然、家常的陪伴感。',
    scenes: ['夏夜户外', '公园遛娃', '露营野餐', '婴童护理'],
    extra_rules:
      '文案以妈妈/家长的真实生活感出发，不说"治疗""止痒"等医疗词。' +
      '可以提"天然山茶油""温和""小巧便携""全家可用""15g 净含量"等事实。',
    price_text: '¥89',
    built_in: 1,
    active: 1,
    sort_order: 0,
  }
  await pool.query(
    `INSERT INTO products
     (id, name, tagline, selling_points, description, scenes, extra_rules,
      price_text, built_in, active, sort_order)
     VALUES (?, ?, ?, CAST(? AS JSON), ?, CAST(? AS JSON), ?, ?, ?, ?, ?)`,
    [
      sample.id,
      sample.name,
      sample.tagline,
      JSON.stringify(sample.selling_points),
      sample.description,
      JSON.stringify(sample.scenes),
      sample.extra_rules,
      sample.price_text,
      sample.built_in,
      sample.active,
      sample.sort_order,
    ]
  )
  console.log('[init] 已插入示例商品: 山茶菁华婴童呵护膏')
}

async function main() {
  try {
    await runMigrations()
    await seedAdmin()
    await seedProducts()
    console.log('[init] 完成')
  } catch (e) {
    console.error('[init] 失败:', e.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

main()
