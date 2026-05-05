/**
 * 从 build/icon.svg 生成多尺寸 PNG + Windows ICO
 * 用法: node scripts/gen-icons.js
 *
 * 输出:
 *   build/icon.png          - 1024x1024 主图 (electron-builder 源图 / Mac 可用)
 *   build/icon-256.png      - 256 版 (Windows 窗口图标)
 *   build/icon-64.png       - 64 版 (favicon)
 *   build/icon.ico          - Windows 多尺寸 ICO (16/32/48/64/128/256)
 *   build/icons/*.png       - 多尺寸 PNG 供 electron-builder 参考
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const pngToIcoMod = require('png-to-ico')
// png-to-ico 在当前版本是 ESM 封装, 需要拿 .default
const pngToIco = pngToIcoMod.default || pngToIcoMod

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'build', 'icon.svg')
const OUT_DIR = path.join(ROOT, 'build')
const MULTI_DIR = path.join(ROOT, 'build', 'icons')

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error('❌ 源文件缺失:', SRC)
    process.exit(1)
  }
  if (!fs.existsSync(MULTI_DIR)) fs.mkdirSync(MULTI_DIR, { recursive: true })

  const svgBuffer = fs.readFileSync(SRC)

  // 生成主图 1024 (electron-builder 可由此自动生成 mac 图标)
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, 'icon.png'))
  console.log('✅ build/icon.png (1024×1024)')

  // 生成常用尺寸
  const sizes = [16, 32, 48, 64, 128, 256, 512]
  const icoSources = []
  for (const s of sizes) {
    const p = path.join(MULTI_DIR, `${s}x${s}.png`)
    await sharp(svgBuffer)
      .resize(s, s)
      .png({ compressionLevel: 9 })
      .toFile(p)
    if (s <= 256) icoSources.push(p)
    console.log(`   build/icons/${s}x${s}.png`)
  }

  // 额外给主进程/HTML 用
  await sharp(svgBuffer)
    .resize(256, 256)
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, 'icon-256.png'))
  await sharp(svgBuffer)
    .resize(64, 64)
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, 'icon-64.png'))
  console.log('✅ build/icon-256.png / build/icon-64.png')

  // 生成 Windows ICO (多尺寸)
  const icoBuffer = await pngToIco(icoSources)
  fs.writeFileSync(path.join(OUT_DIR, 'icon.ico'), icoBuffer)
  console.log(`✅ build/icon.ico (containing ${icoSources.length} sizes)`)

  console.log('\n🎉 所有图标已生成')
}

main().catch((err) => {
  console.error('生成失败:', err)
  process.exit(1)
})
