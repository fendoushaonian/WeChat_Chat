import Icon, { type IconName } from './Icon'
import { useStore } from '../store'
import type { TabKey } from '../types'

const NAV: { key: TabKey; label: string; icon: IconName; activeIcon?: IconName }[] = [
  { key: 'generator', label: '文案', icon: 'wand' },
  { key: 'history', label: '历史', icon: 'clock' },
  { key: 'favorites', label: '收藏', icon: 'star', activeIcon: 'star-filled' },
  { key: 'products', label: '商品管理', icon: 'settings' },
]

export default function MobileBottomNav() {
  const tab = useStore((s) => s.tab)
  const setTab = useStore((s) => s.setTab)
  const isAdmin = useStore((s) => s.isAdmin)

  const items = NAV.filter((item) => item.key !== 'products' || isAdmin)

  return (
    <nav className="flex md:hidden shrink-0 border-t border-outline-variant bg-surface-container-low/80 backdrop-blur-xl safe-area-bottom">
      {items.map((item) => {
        const active = tab === item.key
        const iconName = active && item.activeIcon ? item.activeIcon : item.icon
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 transition-colors ${
              active
                ? 'text-primary'
                : 'text-on-surface-variant'
            }`}
          >
            <div
              className={`flex h-8 w-16 items-center justify-center rounded-full transition-colors ${
                active ? 'bg-primary-container' : ''
              }`}
            >
              <Icon name={iconName} size={20} weight={active ? 2.2 : 1.6} />
            </div>
            <span className="text-[11px] font-medium leading-tight">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
