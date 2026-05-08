import Icon from './Icon'
import { useStore } from '../store'
import ResultCard from './ResultCard'

export default function Favorites() {
  const history = useStore((s) => s.history)
  const favorites = history.filter((h) => h.favorite)

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="shrink-0 px-4 pt-6 pb-4 md:px-8 md:pt-8">
        <div className="mx-auto max-w-[760px] flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container">
            <Icon name="star-filled" size={22} />
          </div>
          <div>
            <h1 className="text-headline-sm font-display font-medium text-on-surface">
              我的收藏
            </h1>
            <div className="text-label-md text-on-surface-variant">
              共 {favorites.length} 条 · 从历史记录中收藏的文案会出现在这里
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 md:px-8">
        <div className="mx-auto max-w-[760px]">
          {favorites.length === 0 ? (
            <div className="rounded-3xl bg-surface-container-low px-6 py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant">
                <Icon name="star" size={28} weight={1.6} />
              </div>
              <div className="text-title-lg font-display text-on-surface">
                还没有收藏
              </div>
              <div className="mt-1.5 text-body-md text-on-surface-variant">
                在历史记录里点击文案的「星标」按钮即可收藏
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map((item) => (
                <ResultCard key={item.id} item={item} showDelete />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
