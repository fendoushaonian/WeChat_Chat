import Icon from './Icon'
import type { CopyItem } from '../types'
import { useStore } from '../store'
import { AUTO_SCENE_KEY } from '../constants'

interface Props {
  item: CopyItem
  index?: number
  showDelete?: boolean
}

export default function ResultCard({ item, index, showDelete }: Props) {
  const setToast = useStore((s) => s.setToast)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const removeHistory = useStore((s) => s.removeHistory)
  const history = useStore((s) => s.history)

  const isInHistory = history.some((h) => h.id === item.id)
  const current = history.find((h) => h.id === item.id) || item

  const handleCopy = async () => {
    await window.api.clipboard.write(item.text)
    setToast('已复制到剪贴板')
  }

  const handleFav = () => {
    if (!isInHistory) {
      setToast('仅历史记录中的条目可收藏')
      return
    }
    toggleFavorite(item.id)
    setToast(current.favorite ? '已取消收藏' : '已加入收藏')
  }

  const handleDelete = () => {
    removeHistory(item.id)
    setToast('已删除')
  }

  const charLen = Array.from(item.text).length
  // 上限 150, 下限 60 (低于下限或超过上限都标红)
  const overLimit = charLen > 150
  const underLimit = charLen < 60
  const outOfRange = overLimit || underLimit

  return (
    <div className="m3-result-card group">
      <div className="flex items-start gap-3">
        {typeof index === 'number' && (
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-label-md font-semibold text-on-primary-container">
            {index + 1}
          </div>
        )}
        <p className="flex-1 whitespace-pre-wrap text-body-lg leading-relaxed text-on-surface">
          {item.text}
        </p>
      </div>

      {/* 合规提示 (仅在有违规时显示) */}
      {(item.violations?.length || item.truncated) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-error-90/60 px-3 py-1.5 text-label-sm text-error-40">
          <Icon name="alert" size={14} weight={2} />
          {item.truncated && <span>已自动截断至 60 字</span>}
          {item.violations?.length ? (
            <span>
              检测到违规词：
              <b>{item.violations.join('、')}</b>
              ，请手动替换
            </span>
          ) : null}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-outline-variant/50 pt-3">
        <div className="flex flex-wrap items-center gap-1 text-label-sm text-on-surface-variant">
          <span
            className={`rounded-md px-2 py-0.5 tabular-nums ${
              outOfRange ? 'bg-error-90 text-error-40' : 'bg-surface-container-high/60'
            }`}
            title={
              overLimit
                ? '超过 150 字上限'
                : underLimit
                  ? '低于 60 字下限'
                  : '字数（60~150 字范围内）'
            }
          >
            {charLen} 字
          </span>
          <span className="rounded-md bg-surface-container-high/60 px-2 py-0.5">
            {item.params.scene === AUTO_SCENE_KEY ? '智能推荐' : item.params.scene}
          </span>
          <span className="rounded-md bg-surface-container-high/60 px-2 py-0.5">
            {item.params.style}
          </span>
          {item.params.mood && (
            <span className="rounded-md bg-surface-container-high/60 px-2 py-0.5">
              {item.params.mood}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleFav}
            className={`m3-icon-btn ${
              current.favorite ? '!text-yellow-600' : ''
            }`}
            title={current.favorite ? '取消收藏' : '收藏'}
            aria-label={current.favorite ? '取消收藏' : '收藏'}
          >
            <Icon
              name={current.favorite ? 'star-filled' : 'star'}
              size={18}
              weight={1.8}
            />
          </button>
          <button
            onClick={handleCopy}
            className="m3-icon-btn"
            title="复制到剪贴板"
            aria-label="复制"
          >
            <Icon name="copy" size={18} weight={1.8} />
          </button>
          {showDelete && (
            <button
              onClick={handleDelete}
              className="m3-icon-btn hover:!text-error-40"
              title="删除"
              aria-label="删除"
            >
              <Icon name="trash" size={18} weight={1.8} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
