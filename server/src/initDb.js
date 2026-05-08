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

function xmlEscape(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  }[ch]))
}

function svgDataUri(label, accent, bg, idx) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420">` +
    `<rect width="640" height="420" rx="36" fill="${bg}"/>` +
    `<circle cx="${470 - idx * 34}" cy="${118 + idx * 18}" r="130" fill="${accent}" opacity=".18"/>` +
    `<circle cx="${142 + idx * 20}" cy="${330 - idx * 22}" r="92" fill="#fff" opacity=".72"/>` +
    `<rect x="218" y="82" width="204" height="256" rx="36" fill="#fff" opacity=".92"/>` +
    `<rect x="248" y="120" width="144" height="128" rx="28" fill="${accent}" opacity=".18"/>` +
    `<circle cx="320" cy="184" r="46" fill="${accent}" opacity=".32"/>` +
    `<text x="320" y="294" text-anchor="middle" font-family="Arial,'Microsoft YaHei',sans-serif" font-size="26" font-weight="700" fill="#21182f">${xmlEscape(label)}</text>` +
    `<text x="320" y="326" text-anchor="middle" font-family="Arial,'Microsoft YaHei',sans-serif" font-size="15" fill="#776b88">Premium Daily Care</text>` +
    `</svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function productImages(label, accent, bg) {
  return [
    svgDataUri(label, accent, bg, 0),
    svgDataUri(label, accent, bg, 1),
    svgDataUri(label, accent, bg, 2),
  ]
}

async function seedProducts() {
  const products = [
    {
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
      cover_url: svgDataUri('山茶呵护膏', '#5fb8a5', '#f5fbf9', 0),
      images: productImages('山茶呵护膏', '#5fb8a5', '#f5fbf9'),
      built_in: 1,
      active: 1,
      sort_order: 0,
    },
    {
      id: 'builtin-xueyan-mianmo',
      name: '雪颜植萃修护面膜',
      tagline: '熬夜后急救补水，妆前敷一片更服帖',
      selling_points: [
        '植萃精华膜布，清爽不黏',
        '补水保湿，熬夜后也有好气色',
        '妆前护理，底妆更服帖',
        '独立包装，通勤旅行都方便',
      ],
      description:
        '雪颜植萃修护面膜主打日常补水与妆前急救，适合熬夜、换季、空调房后肌肤干燥时使用。' +
        '文案可以围绕"临出门前敷一片""晚上洗完澡放松一下""第二天上妆更服帖"等真实场景展开。',
      scenes: ['熬夜急救', '妆前护理', '换季补水', '闺蜜分享'],
      extra_rules:
        '避免承诺医学功效，不使用"美白祛斑""修复屏障"等强功效词。强调补水、服帖、清爽和生活感。',
      price_text: '¥69',
      cover_url: svgDataUri('植萃面膜', '#b8a4ff', '#fbf8ff', 0),
      images: productImages('植萃面膜', '#b8a4ff', '#fbf8ff'),
      built_in: 1,
      active: 1,
      sort_order: 10,
    },
    {
      id: 'builtin-shuiguang-jinghua',
      name: '小分子水光保湿精华',
      tagline: '轻薄好吸收，干皮油皮都能用的日常精华',
      selling_points: [
        '小分子水润质地，吸收快',
        '清爽不搓泥，早晚都能用',
        '改善干燥紧绷，上脸有水润感',
        '搭配面霜使用，保湿感更持久',
      ],
      description:
        '小分子水光保湿精华定位为日常基础保湿精华，主打轻薄、好吸收、不厚重。' +
        '适合办公室空调房、换季干燥、妆前打底等场景，表达应自然真实，像朋友之间的使用分享。',
      scenes: ['日常护肤', '空调房补水', '妆前打底', '换季护理'],
      extra_rules:
        '不要写成夸张功效型广告，重点表达"轻薄""不黏""吸收快""日常保湿"。',
      price_text: '¥128',
      cover_url: svgDataUri('水光精华', '#72a7ff', '#f5f9ff', 0),
      images: productImages('水光精华', '#72a7ff', '#f5f9ff'),
      built_in: 1,
      active: 1,
      sort_order: 20,
    },
    {
      id: 'builtin-yunrou-hushoushuang',
      name: '云柔香氛护手霜',
      tagline: '不油腻的高级淡香，包里常备一支',
      selling_points: [
        '乳霜质地，推开很快吸收',
        '淡淡香氛，不冲不腻',
        '缓解手部干燥，摸起来更柔软',
        '小巧便携，通勤包里刚刚好',
      ],
      description:
        '云柔香氛护手霜适合秋冬、空调房、频繁洗手后使用。' +
        '文案可强调"手边常备""涂完马上打字也不黏""淡香很有氛围感"等细节。',
      scenes: ['通勤办公', '秋冬护理', '礼物分享', '睡前仪式感'],
      extra_rules:
        '保持轻松真实的分享口吻，避免把香味描述得过于夸张。',
      price_text: '¥39',
      cover_url: svgDataUri('香氛护手霜', '#f0a7c2', '#fff7fb', 0),
      images: productImages('香氛护手霜', '#f0a7c2', '#fff7fb'),
      built_in: 1,
      active: 1,
      sort_order: 30,
    },
    {
      id: 'builtin-mitao-runchun',
      name: '清润蜜桃润唇膏',
      tagline: '淡淡蜜桃香，嘴唇干的时候随手涂',
      selling_points: [
        '滋润不厚重，日常涂很舒服',
        '淡淡蜜桃香，甜而不腻',
        '口袋小支装，出门携带方便',
        '素颜或口红前打底都适合',
      ],
      description:
        '清润蜜桃润唇膏主打日常滋润和便携补涂，适合换季、空调房、户外出门等场景。' +
        '朋友圈文案可写得更生活化，比如"包里翻出来救急""涂口红前先打个底"。',
      scenes: ['换季干燥', '通勤随身', '约会出门', '口红打底'],
      extra_rules:
        '突出滋润、便携、蜜桃香和日常使用感，不要写医疗修复功效。',
      price_text: '¥29',
      cover_url: svgDataUri('蜜桃润唇膏', '#ff9f8a', '#fff7f3', 0),
      images: productImages('蜜桃润唇膏', '#ff9f8a', '#fff7f3'),
      built_in: 1,
      active: 1,
      sort_order: 40,
    },
  ]
  let inserted = 0
  for (const product of products) {
    const [result] = await pool.query(
      `INSERT IGNORE INTO products
       (id, name, tagline, selling_points, description, scenes, extra_rules,
        cover_url, images, price_text, built_in, active, sort_order)
       VALUES (?, ?, ?, CAST(? AS JSON), ?, CAST(? AS JSON), ?, ?, CAST(? AS JSON), ?, ?, ?, ?)`,
      [
        product.id,
        product.name,
        product.tagline,
        JSON.stringify(product.selling_points),
        product.description,
        JSON.stringify(product.scenes),
        product.extra_rules,
        product.cover_url,
        JSON.stringify(product.images),
        product.price_text,
        product.built_in,
        product.active,
        product.sort_order,
      ]
    )
    inserted += result.affectedRows || 0
  }
  console.log(`[init] 内置商品已补齐: ${products.length} 个, 新增 ${inserted} 个`)
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
