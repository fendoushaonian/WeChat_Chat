import Icon, { type IconName } from './Icon'
import AppLogo from './AppLogo'
import { useStore } from '../store'
import { getProvider } from '../constants'
import type { TabKey } from '../types'

// 激活后即可看到所有 tab; 商品管理是每个用户自己的私有商品库
const NAV: { key: TabKey; label: string; icon: IconName; activeIcon?: IconName }[] = [
  { key: 'generator', label: '文案生成', icon: 'wand' },
  { key: 'history', label: '历史记录', icon: 'clock' },
  { key: 'favorites', label: '我的收藏', icon: 'star', activeIcon: 'star-filled' },
  { key: 'products', label: '商品管理', icon: 'settings' },
]

export default function Sidebar() {
  const tab = useStore((s) => s.tab)
  const setTab = useStore((s) => s.setTab)
  const history = useStore((s) => s.history)
  const settings = useStore((s) => s.settings)
  const agentLabel = useStore((s) => s.agentLabel)
  const clearAgentToken = useStore((s) => s.clearAgentToken)
  const setToast = useStore((s) => s.setToast)

  const favCount = history.filter((h) => h.favorite).length
  const provider = getProvider(settings.provider)

  return (
    <aside className="flex w-[232px] shrink-0 flex-col bg-surface-container-low/60 backdrop-blur-xl">
      {/* Navigation Drawer header */}
      <div className="px-5 pt-6 pb-3">
        <div className="flex items-center gap-2.5">
          <AppLogo size={32} />
          <div className="flex flex-col leading-tight">
            <span className="bg-gradient-to-br from-[#E2558D] to-[#7B2FCB] bg-clip-text text-title-sm font-display font-semibold tracking-tight text-transparent">
              朋友圈文案
            </span>
            <span className="text-label-sm text-on-surface-variant/60 tracking-wider">
              MOMENTS WRITER
            </span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 pt-2">
        {NAV.map((item) => {
          const active = tab === item.key
          const iconName = active && item.activeIcon ? item.activeIcon : item.icon
          const badge =
            item.key === 'history'
              ? history.length
              : item.key === 'favorites'
              ? favCount
              : 0
          return (
            <div
              key={item.key}
              className={`m3-nav-item ${active ? 'is-active' : ''}`}
              onClick={() => setTab(item.key)}
            >
              <Icon
                name={iconName}
                size={20}
                weight={active ? 2 : 1.8}
              />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span
                  className={`min-w-[22px] h-[22px] rounded-full px-1.5 inline-flex items-center justify-center text-label-sm tabular-nums ${
                    active
                      ? 'bg-primary text-on-primary'
                      : 'bg-primary-container text-on-primary-container'
                  }`}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer - 当前账号 + provider */}
      <div className="space-y-1.5 p-3">
        {/* 当前激活的代理身份, 点击解绑 */}
        <div
          className="group flex items-center gap-2 rounded-full px-4 py-2 text-label-md text-on-surface-variant/80 hover:bg-black/5 hover:text-on-surface cursor-pointer transition-colors"
          onClick={() => {
            if (confirm('确定解绑当前激活码？\n\n解绑后需要重新输入激活码才能使用。')) {
              clearAgentToken()
              setToast('已解绑, 请重新激活')
            }
          }}
          title="点击解绑当前激活码"
        >
          <Icon name="key" size={12} weight={2} />
          <span className="flex-1 truncate">{agentLabel || '已激活'}</span>
        </div>
        {/* provider */}
        <div
          className="group flex items-center gap-2 rounded-full px-4 py-2 text-label-md text-on-surface-variant hover:bg-black/5 cursor-pointer transition-colors"
          onClick={() => {
            if (provider.applyUrl) {
              window.api?.shell?.openExternal(provider.applyUrl)
            }
          }}
          title={`当前 AI 服务: ${provider.name}`}
        >
          <Icon name="bot" size={12} weight={2} />
          <span className="flex-1 truncate">当前: {provider.name}</span>
          <Icon name="external" size={11} />
        </div>
      </div>
    </aside>
  )
}
