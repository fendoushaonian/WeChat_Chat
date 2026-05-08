import { useMemo, useState } from 'react'
import Icon from './Icon'
import { useStore } from '../store'
import ResultCard from './ResultCard'

export default function History() {
  const history = useStore((s) => s.history)
  const clearHistory = useStore((s) => s.clearHistory)
  const setToast = useStore((s) => s.setToast)
  const [keyword, setKeyword] = useState('')

  const filtered = useMemo(() => {
    const k = keyword.trim()
    if (!k) return history
    return history.filter(
      (h) =>
        h.text.includes(k) ||
        h.params.scene.includes(k) ||
        h.params.style.includes(k)
    )
  }, [history, keyword])

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* 顶部 Search Bar */}
      <div className="shrink-0 px-4 pt-6 pb-4 md:px-8">
        <div className="mx-auto flex max-w-[760px] items-center gap-3">
          <div className="relative flex-1">
            <Icon
              name="search"
              size={20}
              weight={1.8}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              className="m3-field-input !pl-12 !h-12 !rounded-full bg-surface-container-high !border-transparent focus:bg-surface-container-lowest"
              placeholder="搜索历史文案…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            {keyword && (
              <button
                className="m3-icon-btn absolute right-1 top-1/2 -translate-y-1/2 !w-9 !h-9"
                onClick={() => setKeyword('')}
                aria-label="清空搜索"
              >
                <Icon name="close" size={16} weight={2} />
              </button>
            )}
          </div>
          <button
            className="m3-btn-outlined !text-error-40 !border-error-90 hover:!border-error-40"
            onClick={() => {
              if (history.length === 0) return
              if (
                confirm(
                  `确定要清空 ${history.length} 条历史记录吗？（已收藏的也会一起删除）`
                )
              ) {
                clearHistory()
                setToast('已清空')
              }
            }}
            disabled={history.length === 0}
          >
            <Icon name="trash" size={16} weight={2} />
            <span>清空</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 md:px-8">
        <div className="mx-auto max-w-[760px]">
          {history.length > 0 && (
            <div className="mb-3 flex items-center justify-between">
              <div className="text-label-md text-on-surface-variant">
                共 {history.length} 条
                {keyword && filtered.length !== history.length && (
                  <span> · 匹配 {filtered.length} 条</span>
                )}
              </div>
            </div>
          )}
          {filtered.length === 0 ? (
            <EmptyState
              icon="clock"
              title={keyword ? '没有匹配的文案' : '还没有历史记录'}
              desc={keyword ? '换个关键词试试' : '去生成一条，开启你的文案库'}
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <ResultCard key={item.id} item={item} showDelete />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: 'clock' | 'star' | 'bookmark'
  title: string
  desc: string
}) {
  return (
    <div className="rounded-3xl bg-surface-container-low px-6 py-20 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant">
        <Icon name={icon} size={28} weight={1.6} />
      </div>
      <div className="text-title-lg font-display text-on-surface">{title}</div>
      <div className="mt-1.5 text-body-md text-on-surface-variant">{desc}</div>
    </div>
  )
}
