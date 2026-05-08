import Icon, { type IconName } from './Icon'
import AppLogo from './AppLogo'
import { useStore } from '../store'
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
  const agentLabel = useStore((s) => s.agentLabel)
  const clearAgentToken = useStore((s) => s.clearAgentToken)
  const setToast = useStore((s) => s.setToast)
  const isAdmin = useStore((s) => s.isAdmin)

  const favCount = history.filter((h) => h.favorite).length

  return (
    <aside className="hidden w-[256px] shrink-0 flex-col overflow-hidden rounded-[24px] border border-white/80 bg-white/60 shadow-[0_18px_55px_-38px_rgba(44,31,84,0.58)] backdrop-blur-2xl md:flex">
      {/* Navigation Drawer header */}
      <div className="px-6 pt-8 pb-5">
        <div className="flex items-center gap-3">
          <AppLogo size={34} />
          <div className="flex flex-col leading-tight">
            <span className="whitespace-nowrap text-[14px] font-bold tracking-tight text-[#1f1635]">
              朋友圈文案助手
            </span>
            <span className="mt-1 text-[11px] text-[#8c8498]">
              让分享更动人
            </span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="space-y-1.5 px-3 pt-1">
        {NAV.filter((item) => item.key !== 'products' || isAdmin).map((item) => {
          const active = tab === item.key
          const iconName = active && item.activeIcon ? item.activeIcon : item.icon
          const badge =
            item.key === 'history'
              ? history.length
              : item.key === 'favorites'
              ? favCount
              : 0
          return (
            <button
              type="button"
              key={item.key}
              className={`relative flex h-[50px] w-full items-center gap-3 rounded-[18px] px-3 text-left text-[14px] transition-all duration-200 ${
                active
                  ? 'bg-white font-bold text-[#1f1929] shadow-[0_8px_24px_-16px_rgba(44,31,84,0.55)] ring-1 ring-black/[0.04]'
                  : 'font-semibold text-[#6a6373] hover:bg-white/55 hover:text-[#4b4652]'
              }`}
              onClick={() => setTab(item.key)}
            >
              {/* 选中态左侧紫色指示条 */}
              {active && (
                <span className="absolute left-0 top-[12px] bottom-[12px] w-[3px] rounded-r-full bg-gradient-to-b from-[#8b5cf6] to-[#6d42dc]" />
              )}
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] transition-all ${
                  active
                    ? 'bg-gradient-to-br from-[#8b5cf6] to-[#6d42dc] text-white shadow-[0_8px_16px_-10px_rgba(109,66,220,0.85)]'
                    : 'text-[#8b8495]'
                }`}
              >
                <Icon
                  name={iconName}
                  size={18}
                  weight={active ? 2.2 : 1.8}
                />
              </span>
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span
                  className={`min-w-[20px] h-[20px] rounded-[10px] px-1.5 inline-flex items-center justify-center text-[11px] font-bold tabular-nums ${
                    active
                      ? 'bg-[#f1edff] text-[#7c3aed]'
                      : 'bg-[#f1edff] text-[#7c3aed]/70'
                  }`}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* 品牌氛围卡片 */}
      <div className="flex-1 flex flex-col px-0 py-1">
        <button
          className="group relative w-full flex-1 overflow-hidden rounded-[16px] transition-all duration-200 hover:shadow-md focus:outline-none"
          onClick={() => setTab('generator')}
        >
          <img
            src={new URL('../assets/brand-card.png', import.meta.url).href}
            alt="让分享更有影响力"
            className="absolute inset-0 h-full w-full object-fill"
            draggable={false}
          />
        </button>
      </div>

      {/* Footer - 账户信息卡片 */}
      <div className="mt-auto px-3 pb-3 pt-3">
        <div
          className="group cursor-pointer rounded-[16px] border border-[#ede9fe]/60 bg-white/80 px-3.5 py-2.5 transition-all duration-200 hover:bg-[#f5f0ff] hover:shadow-[0_4px_16px_-8px_rgba(124,58,237,0.2)]"
          onClick={() => {
            if (confirm('确定解绑当前激活码？\n\n解绑后需要重新输入激活码才能使用。')) {
              clearAgentToken()
              setToast('已解绑, 请重新激活')
            }
          }}
          title="点击解绑账户"
        >
          <div className="flex items-center gap-2.5">
            {/* 头像 */}
            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#c4b5fd] to-[#8b5cf6] text-[14px] font-bold text-white shadow-[0_4px_10px_-4px_rgba(139,92,246,0.6)]">
              {(agentLabel || '').charAt(0) || '?'}
            </div>
            {/* 文字 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[13px] font-bold text-[#1f1929]">
                  {agentLabel || '未激活'}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1">
                <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-[#10b981]" />
                <span className="text-[10.5px] text-[#6a6373]">已激活</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
