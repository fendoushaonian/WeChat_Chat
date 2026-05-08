import { useState } from 'react'
import Icon from './Icon'
import type { CopyItem, Product } from '../types'
import { useStore } from '../store'
import { AUTO_SCENE_KEY } from '../constants'

interface Props {
  results: CopyItem[]
  product: Product | null
  loading: boolean
  onClose: () => void
}

/** 根据图片数量返回网格布局 class */
function getImageGridClass(count: number): string {
  if (count === 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-2'
  if (count <= 4) return 'grid-cols-2'
  return 'grid-cols-3'
}

export default function ResultPanel({ results, product, loading, onClose }: Props) {
  const setToast = useStore((s) => s.setToast)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const history = useStore((s) => s.history)
  const [selectedIdx, setSelectedIdx] = useState<number>(0)
  const [saving, setSaving] = useState(false)

  // 所有图片：封面 + 展示图
  const allImages: string[] = []
  if (product?.coverUrl) allImages.push(product.coverUrl)
  if (product?.images?.length) allImages.push(...product.images)

  const selectedItem = results[selectedIdx] || results[0]

  const handleCopyText = async () => {
    if (!selectedItem) return
    await window.api.clipboard.write(selectedItem.text)
    setToast('文案已复制到剪贴板')
  }

  const handleCopyAll = async () => {
    const allText = results.map((r, i) => `${i + 1}. ${r.text}`).join('\n\n')
    await window.api.clipboard.write(allText)
    setToast('全部文案已复制')
  }

  const handleSaveText = async () => {
    if (!selectedItem) return
    await window.api.clipboard.write(selectedItem.text)
    setToast('文案已复制，可粘贴到任意位置')
  }

  const handleSaveWithImages = async () => {
    if (!selectedItem || saving) return
    setSaving(true)
    try {
      const res = await window.api.save.imageText({
        text: selectedItem.text,
        imageUrls: allImages,
        productName: product?.name || '图文',
      })
      if (res.ok) {
        setToast(`已保存（${res.savedCount} 张图片 + 文案）`)
        const isInHistory = history.some((h) => h.id === selectedItem.id)
        if (isInHistory && !history.find((h) => h.id === selectedItem.id)?.favorite) {
          toggleFavorite(selectedItem.id)
        }
      } else if (res.error !== 'cancelled') {
        setToast('保存失败：' + res.error)
      }
    } catch (err: any) {
      setToast('保存失败：' + (err?.message || '未知错误'))
    } finally {
      setSaving(false)
    }
  }

  const handleFav = (item: CopyItem) => {
    const isInHistory = history.some((h) => h.id === item.id)
    if (!isInHistory) return
    toggleFavorite(item.id)
    const current = history.find((h) => h.id === item.id)
    setToast(current?.favorite ? '已取消收藏' : '已加入收藏')
  }

  if (!loading && results.length === 0) return null

  return (
    <div className="absolute inset-0 z-30 flex flex-col overflow-hidden bg-white">
      {/* ===== 顶部标题栏 ===== */}
      <div className="relative flex shrink-0 items-center justify-center border-b border-[#f0ebf8] px-6 py-3.5">
        <button
          onClick={onClose}
          className="absolute left-5 flex items-center gap-1.5 text-[13px] font-medium text-[#7c3aed] transition hover:text-[#5b21b6]"
        >
          <Icon name="chevron-down" size={14} weight={2.5} className="rotate-90" />
          <span>返回选品</span>
        </button>
        <div className="text-center">
          <h1 className="text-[17px] font-bold text-[#1a1025]">文案生成结果</h1>
          {!loading && product && (
            <p className="mt-0.5 text-[11.5px] text-[#9a91a8]">
              已生成 {results.length} 条文案，{allImages.length} 张配图
            </p>
          )}
        </div>
        {!loading && (
          <button
            onClick={onClose}
            className="absolute right-5 inline-flex items-center gap-1.5 rounded-lg border border-[#eee8f4] px-3 py-1.5 text-[12px] font-medium text-[#5f5869] transition hover:border-[#d7c9f5] hover:text-[#7c3aed]"
          >
            <Icon name="wand" size={13} weight={2} />
            继续生成
          </button>
        )}
      </div>

      {/* ===== 主体：左右分栏 ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* 加载状态 */}
        {loading && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-5 h-14 w-14 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] p-3 shadow-[0_8px_24px_-8px_rgba(124,58,237,0.5)]">
              <Icon name="wand" size={32} weight={1.6} className="animate-pulse text-white" />
            </div>
            <div className="text-[15px] font-medium text-[#3d3153]">AI 正在为你创作文案…</div>
            <div className="mt-1 text-[13px] text-[#9a91a8]">通常需要 5~15 秒</div>
            <div className="mt-8 w-full max-w-[420px] space-y-3 px-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-[#f0ebf8] bg-[#fbf9ff] p-4">
                  <div className="space-y-2">
                    <div className="m3-skeleton h-3.5 w-full rounded" />
                    <div className="m3-skeleton h-3.5 w-[75%] rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 左栏：配图 */}
        {!loading && results.length > 0 && (
          <>
            <div className="flex w-[38%] shrink-0 flex-col border-r border-[#f0ebf8] bg-[#fbf9ff]">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-[#1a1025]">配图</span>
                  <span className="text-[12px] text-[#9a91a8]">({allImages.length}/9)</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-5">
                {allImages.length > 0 ? (
                  <div className={`grid ${getImageGridClass(allImages.length)} gap-2`}>
                    {allImages.map((url, i) => (
                      <div
                        key={i}
                        className={`relative overflow-hidden rounded-xl border border-[#eee8f4] bg-white ${
                          i === 0 && allImages.length >= 3 ? 'col-span-2 row-span-2' : ''
                        }`}
                      >
                        <img
                          src={url}
                          alt={`图${i + 1}`}
                          className="h-full w-full object-cover"
                          style={{ aspectRatio: '1' }}
                          loading="lazy"
                        />
                        {i === 0 && (
                          <span className="absolute top-2 left-2 rounded-md bg-[#7c3aed] px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
                            封面图
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-[#e8e0f4] text-[13px] text-[#9a91a8]">
                    暂无配图
                  </div>
                )}

                <p className="mt-3 text-center text-[11px] text-[#b8b0c4]">
                  最多支持 9 张图片，保存图文时将一并下载
                </p>
              </div>
            </div>

            {/* 右栏：文案结果 */}
            <div className="flex flex-1 flex-col overflow-hidden bg-white">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-[#1a1025]">文案结果</span>
                  <span className="text-[12px] text-[#9a91a8]">({results.length} 条)</span>
                </div>
                <span className="text-[11px] text-[#b8b0c4]">点击卡片可选中，已选中将用于保存</span>
              </div>

              <div className="flex-1 space-y-2.5 overflow-y-auto px-5 pb-5">
                {results.map((item, i) => {
                  const isSelected = i === selectedIdx
                  const current = history.find((h) => h.id === item.id) || item
                  const charLen = Array.from(item.text).length

                  return (
                    <div
                      key={item.id}
                      className={`group cursor-pointer rounded-xl border p-4 transition-all duration-150 ${
                        isSelected
                          ? 'border-[#7c3aed]/40 bg-[#fdfbff] shadow-[0_4px_20px_-8px_rgba(124,58,237,0.15)]'
                          : 'border-[#f0ebf8] bg-white hover:border-[#e0d6f0] hover:shadow-sm'
                      }`}
                      onClick={() => setSelectedIdx(i)}
                    >
                      {/* 顶部：序号 + 文案 + 标签 */}
                      <div className="flex gap-3">
                        <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          isSelected
                            ? 'bg-[#7c3aed] text-white'
                            : 'bg-[#f3edff] text-[#7c3aed]'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="flex-1 whitespace-pre-wrap text-[13.5px] leading-[1.9] text-[#2a2238]">
                              {item.text}
                            </p>
                            <div className="mt-0.5 flex shrink-0 flex-wrap justify-end gap-1">
                              <span className="rounded bg-[#fef3f2] px-1.5 py-0.5 text-[10px] font-medium text-[#dc6b52]">
                                {item.params.style}
                              </span>
                              <span className="rounded bg-[#f0f4ff] px-1.5 py-0.5 text-[10px] font-medium text-[#5b7fcf]">
                                {item.params.scene === AUTO_SCENE_KEY ? '智能推荐' : item.params.scene}
                              </span>
                            </div>
                          </div>

                          {/* 底部：字数 + 操作 */}
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${isSelected ? 'bg-[#7c3aed]' : 'bg-[#e0d6f0]'}`} />
                              <span className="text-[11.5px] text-[#9a91a8]">{charLen} 字</span>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                              style={isSelected ? { opacity: 1 } : undefined}
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); handleFav(item) }}
                                className={`flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-[#f8f5ff] ${
                                  current.favorite ? 'text-amber-500' : 'text-[#c4bbd4]'
                                }`}
                                title={current.favorite ? '取消收藏' : '收藏'}
                              >
                                <Icon name={current.favorite ? 'star-filled' : 'star'} size={15} weight={1.8} />
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  await window.api.clipboard.write(item.text)
                                  setToast('已复制')
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-[#c4bbd4] transition hover:bg-[#f8f5ff] hover:text-[#7c3aed]"
                                title="复制文案"
                              >
                                <Icon name="copy" size={15} weight={1.8} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ===== 底部操作栏 ===== */}
      {!loading && results.length > 0 && (
        <div className="shrink-0 border-t border-[#f0ebf8] bg-[#fbf9ff] px-5 py-3">
          <div className="flex items-center justify-center gap-3">
            {/* 复制选中文案 */}
            <button
              onClick={handleCopyText}
              className="inline-flex h-11 flex-col items-center justify-center rounded-xl border border-[#eee8f4] bg-white px-5 transition hover:border-[#d7c9f5] hover:shadow-sm"
            >
              <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#3d3153]">
                <Icon name="copy" size={13} weight={2} />
                复制选中文案
              </span>
              <span className="text-[10px] text-[#b8b0c4]">复制当前已选 1 条文案</span>
            </button>

            {/* 复制全部文案 */}
            <button
              onClick={handleCopyAll}
              className="inline-flex h-11 flex-col items-center justify-center rounded-xl border border-[#eee8f4] bg-white px-5 transition hover:border-[#d7c9f5] hover:shadow-sm"
            >
              <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#3d3153]">
                <Icon name="copy" size={13} weight={2} />
                复制全部文案
              </span>
              <span className="text-[10px] text-[#b8b0c4]">复制全部 {results.length} 条文案</span>
            </button>

            {/* 保存文案（仅文字） */}
            <button
              onClick={handleSaveText}
              className="inline-flex h-11 flex-col items-center justify-center rounded-xl border border-[#eee8f4] bg-white px-5 transition hover:border-[#d7c9f5] hover:shadow-sm"
            >
              <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#3d3153]">
                <Icon name="copy" size={13} weight={2} />
                保存文案（仅文字）
              </span>
              <span className="text-[10px] text-[#b8b0c4]">TXT 文件下载</span>
            </button>

            {/* 保存图文 */}
            <button
              onClick={handleSaveWithImages}
              disabled={saving}
              className="inline-flex h-11 flex-col items-center justify-center rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#9b6dff] px-6 shadow-[0_4px_12px_-4px_rgba(124,58,237,0.5)] transition hover:shadow-[0_8px_20px_-6px_rgba(124,58,237,0.6)] disabled:opacity-60"
            >
              <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white">
                {saving ? (
                  <Icon name="loader" size={13} weight={2} className="animate-spin" />
                ) : (
                  <Icon name="scene-heart" size={13} weight={2} />
                )}
                {saving ? '保存中…' : '保存图文（文字+图片）'}
              </span>
              <span className="text-[10px] text-white/70">下载到本地文件夹</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
