import { useStore } from '../store'
import Icon from './Icon'
import type { Product } from '../types'

/**
 * 商品卡片选择器
 * 代理模式下: 代理只能在此组件中点选一个商品, 生成时自动填充 prompt
 * 管理员模式下: 右上角有"管理商品"按钮, 点击进入 ProductManager
 */
export default function ProductSelector() {
  const products = useStore((s) => s.products)
  const selectedId = useStore((s) => s.selectedProductId)
  const selectProduct = useStore((s) => s.selectProduct)
  const setTab = useStore((s) => s.setTab)
  const syncStatus = useStore((s) => s.syncStatus)
  const syncError = useStore((s) => s.syncError)
  const lastSyncAt = useStore((s) => s.lastSyncAt)
  const syncProducts = useStore((s) => s.syncProducts)

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-5 py-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant">
          <Icon name="info" size={22} weight={1.8} />
        </div>
        <div className="text-title-md text-on-surface">还没有商品</div>
        <div className="mt-1 text-body-sm text-on-surface-variant">
          去「商品管理」添加你的第一个商品
        </div>
        <button
          className="m3-btn-tonal mt-4"
          onClick={() => setTab('products')}
        >
          <Icon name="plus" size={14} weight={2} />
          去添加商品
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <SyncStatusBadge
          status={syncStatus}
          error={syncError}
          lastSyncAt={lastSyncAt}
          onRefresh={() => syncProducts()}
        />
        <button
          className="m3-btn-text !text-label-md"
          onClick={() => setTab('products')}
          title="管理我的商品库"
        >
          <Icon name="settings" size={14} weight={2} />
          <span>管理商品</span>
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            active={p.id === selectedId}
            onClick={() => selectProduct(p.id)}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * 云端同步状态徽章
 * 同步中 -> 灰色旋转
 * 成功   -> 绿色勾, 显示几秒前同步
 * 失败   -> 红色, 显示"使用本地缓存", 点击重试
 * idle   -> 不显示
 */
function SyncStatusBadge({
  status,
  error,
  lastSyncAt,
  onRefresh,
}: {
  status: 'idle' | 'syncing' | 'ok' | 'error'
  error: string
  lastSyncAt: number
  onRefresh: () => void
}) {
  const ago = lastSyncAt ? formatAgo(Date.now() - lastSyncAt) : ''
  if (status === 'syncing') {
    return (
      <div className="flex items-center gap-1.5 text-label-md text-on-surface-variant">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-on-surface-variant/30 border-t-primary" />
        <span>正在同步云端商品库…</span>
      </div>
    )
  }
  if (status === 'ok') {
    return (
      <button
        type="button"
        onClick={onRefresh}
        className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-label-md text-on-surface-variant hover:bg-surface-container-high/60"
        title={`点击重新同步 (上次 ${ago})`}
      >
        <Icon name="check" size={12} weight={2.5} className="text-emerald-600" />
        <span>已同步 · {ago}</span>
      </button>
    )
  }
  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={onRefresh}
        className="flex items-center gap-1.5 rounded-full bg-error-90 px-2 py-0.5 text-label-md text-error-40 hover:bg-error-90/70"
        title={error || '同步失败'}
      >
        <Icon name="alert" size={12} weight={2} />
        <span>云端同步失败 · 用本地缓存（点击重试）</span>
      </button>
    )
  }
  // idle
  return (
    <button
      type="button"
      onClick={onRefresh}
      className="flex items-center gap-1.5 text-label-md text-on-surface-variant hover:text-on-surface"
      title="刷新云端商品库"
    >
      <Icon name="refresh" size={12} weight={2} />
      <span>刷新商品库</span>
    </button>
  )
}

function formatAgo(ms: number): string {
  if (ms < 5000) return '刚刚'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s} 秒前`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} 分钟前`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} 小时前`
  return `${Math.round(h / 24)} 天前`
}

function ProductCard({
  product,
  active,
  onClick,
}: {
  product: Product
  active: boolean
  onClick: () => void
}) {
  // 根据商品名首字取两个字符作为"图标"占位 (无图时)
  const initial = Array.from(product.name).slice(0, 2).join('')
  // 为每个商品生成稳定的渐变色 (基于 id 哈希)
  const hue = hashHue(product.id)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-surface-container-lowest text-left transition-all duration-200 ${
        active
          ? 'border-primary ring-2 ring-primary/30 shadow-md -translate-y-0.5'
          : 'border-outline-variant hover:border-primary/50 hover:shadow-sm'
      }`}
    >
      {/* 封面区: <img> 直接占位不做绝对定位 (绕过 button 子元素的某些渲染怪问题) */}
      <div
        className="relative h-24 w-full shrink-0 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, hsl(${hue}, 75%, 88%) 0%, hsl(${(hue + 40) % 360}, 70%, 78%) 100%)`,
        }}
      >
        {product.coverUrl ? (
          <img
            src={product.coverUrl}
            alt={product.name}
            className="block h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span
              className="text-display-sm font-display font-semibold"
              style={{ color: `hsl(${hue}, 60%, 32%)` }}
            >
              {initial}
            </span>
          </div>
        )}
        {active && (
          <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
            <Icon name="check" size={14} weight={2.8} />
          </div>
        )}
        {product.priceText && (
          <div className="absolute bottom-2 left-2 rounded-full bg-white/80 px-2 py-0.5 text-label-sm font-semibold text-on-surface backdrop-blur">
            {product.priceText}
          </div>
        )}
      </div>

      {/* 信息区 */}
      <div className="flex flex-1 flex-col px-3 py-2.5">
        <div className="truncate text-title-sm text-on-surface" title={product.name}>
          {product.name}
        </div>
        {product.tagline && (
          <div
            className="mt-0.5 line-clamp-2 text-body-sm text-on-surface-variant"
            title={product.tagline}
          >
            {product.tagline}
          </div>
        )}
        {product.sellingPoints?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.sellingPoints.slice(0, 2).map((sp, i) => (
              <span
                key={i}
                className="truncate rounded-md bg-surface-container-high/60 px-1.5 py-0.5 text-label-sm text-on-surface-variant"
                style={{ maxWidth: '100%' }}
                title={sp}
              >
                {sp.length > 12 ? sp.slice(0, 12) + '…' : sp}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

// 根据字符串生成 0~359 的稳定色相值
function hashHue(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff
  return h % 360
}
