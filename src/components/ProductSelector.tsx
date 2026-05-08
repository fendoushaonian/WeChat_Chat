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
  const isAdmin = useStore((s) => s.isAdmin)

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-5 py-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant">
          <Icon name="info" size={22} weight={1.8} />
        </div>
        <div className="text-title-md text-on-surface">还没有商品</div>
        <div className="mt-1 text-body-sm text-on-surface-variant">
          {isAdmin ? '去「商品管理」添加你的第一个商品' : '暂无可用商品，请联系管理员添加'}
        </div>
        {isAdmin && (
          <button
            className="m3-btn-tonal mt-4"
            onClick={() => setTab('products')}
          >
            <Icon name="plus" size={14} weight={2} />
            去添加商品
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      {(syncStatus === 'syncing' || syncStatus === 'error' || isAdmin) && (
        <div className="mb-3 flex h-5 items-center justify-between gap-2">
          {(syncStatus === 'syncing' || syncStatus === 'error') ? (
            <SyncStatusBadge
              status={syncStatus}
              error={syncError}
              lastSyncAt={lastSyncAt}
              onRefresh={() => syncProducts()}
            />
          ) : <span />}
          {isAdmin && (
            <button
              className="m3-btn-text !h-7 !px-2 !text-[12px]"
              onClick={() => setTab('products')}
              title="管理我的商品库"
            >
              <Icon name="settings" size={13} weight={2} />
              <span>管理商品</span>
            </button>
          )}
        </div>
      )}
      <div className="grid max-w-[930px] grid-cols-1 gap-4 sm:grid-cols-2">
        {products.map((p, idx) => {
          const isLastOdd = products.length % 2 === 1 && idx === products.length - 1
          return (
            <div key={p.id} className={isLastOdd ? 'sm:col-span-2' : ''}>
              <ProductCard
                product={p}
                active={p.id === selectedId}
                featured={isLastOdd}
                onClick={() => selectProduct(p.id)}
              />
            </div>
          )
        })}
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
  featured,
  onClick,
}: {
  product: Product
  active: boolean
  featured?: boolean
  onClick: () => void
}) {
  const initial = Array.from(product.name).slice(0, 2).join('')
  const hue = hashHue(product.id)
  const galleryImages = product.images || []

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col overflow-hidden bg-white text-left transition-all duration-200 ${featured ? 'rounded-[24px]' : 'rounded-[18px]'} ${
        active
          ? 'ring-1 ring-[#bda7ef] shadow-[0_16px_38px_-28px_rgba(124,58,237,0.65)]'
          : 'ring-1 ring-[#eee8f4] shadow-[0_10px_28px_-24px_rgba(44,31,84,0.5)] hover:ring-[#d7c9f5] hover:shadow-[0_18px_40px_-30px_rgba(44,31,84,0.7)]'
      }`}
    >
      {/* 封面区 */}
      <div
        className="relative w-full shrink-0 overflow-hidden"
        style={{
          aspectRatio: featured ? '4.2/1' : '2.55/1',
          backgroundImage: `linear-gradient(135deg, hsl(${hue}, 75%, 88%) 0%, hsl(${(hue + 40) % 360}, 70%, 78%) 100%)`,
        }}
      >
        {product.coverUrl ? (
          <img
            src={product.coverUrl}
            alt={product.name}
            className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span
              className="text-display-md font-display font-semibold"
              style={{ color: `hsl(${hue}, 60%, 32%)` }}
            >
              {initial}
            </span>
          </div>
        )}

        {/* 底部渐变: 商品名 + 价格 */}
        <div className={`${featured ? 'px-5 pb-4 pt-16' : 'px-4 pb-2.5 pt-10'} absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent`}>
          <div className={`truncate font-semibold leading-tight text-white drop-shadow-md ${featured ? 'text-[17px]' : 'text-[15px]'}`}>
            {product.name}
          </div>
          {product.priceText && (
            <div className={`${featured ? 'text-[14px]' : 'text-[13px]'} mt-0.5 font-medium text-white/90 drop-shadow-sm`}>
              {product.priceText}
            </div>
          )}
        </div>

        {/* 悬停遮罩: tagline + 卖点 (毛玻璃渐变) */}
        <div className={`${featured ? 'px-5 pb-4 pt-5' : 'px-4 pb-3 pt-4'} absolute inset-0 flex flex-col opacity-0 transition-all duration-250 group-hover:opacity-100`}
          style={{ background: 'linear-gradient(165deg, rgba(15,15,20,0.92) 0%, rgba(28,28,35,0.88) 100%)' }}
        >
          <div className={`truncate font-bold leading-tight text-white/95 ${featured ? 'text-[16px]' : 'text-[14px]'}`}>
            {product.name}
          </div>
          {product.tagline && (
            <div className="mt-1.5 text-[12px] leading-relaxed text-white/65">
              {product.tagline}
            </div>
          )}
          {product.sellingPoints?.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1.5">
              {product.sellingPoints.slice(0, 3).map((sp, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[11px] font-medium leading-none text-white/90"
                  style={{ background: 'rgba(255,255,255,0.12)' }}
                >
                  <span className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: 'rgba(255,255,255,0.5)' }} />
                  {sp}
                </span>
              ))}
            </div>
          )}
          {product.priceText && (
            <div className={`${featured ? 'mt-3' : 'mt-2'} text-[15px] font-bold tracking-wide text-white/95`}>
              {product.priceText}
            </div>
          )}
        </div>

        {/* 右上角选择圆圈 */}
        <div className={`absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-150 ${
          active
            ? 'bg-[#7c3aed] text-white shadow-md'
            : 'border border-white/75 bg-black/28 text-white backdrop-blur-sm group-hover:bg-black/42'
        }`}>
          <Icon name={active ? 'check' : 'plus'} size={active ? 15 : 16} weight={active ? 2.8 : 2.2} />
        </div>
      </div>

      {/* 展示图横排 */}
      {galleryImages.length > 0 && (
        <div className={`${featured ? 'grid grid-cols-3 gap-2 p-2' : 'grid grid-cols-3 gap-2 p-2'}`}>
          {galleryImages.slice(0, 3).map((url: string, i: number) => (
            <div
              key={i}
              className={`${featured ? 'rounded-2xl' : 'rounded-xl'} overflow-hidden bg-[#f7f3fb] ring-1 ring-black/5`}
              style={{ aspectRatio: featured ? '1/1' : '1.12/1' }}
            >
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          ))}
        </div>
      )}
    </button>
  )
}

// 根据字符串生成 0~359 的稳定色相值
function hashHue(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff
  return h % 360
}
