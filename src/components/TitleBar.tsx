import { useStore } from '../store'
import { getProvider } from '../constants'
import AppLogo from './AppLogo'

export default function TitleBar() {
  const isMac = window.api?.platform === 'darwin'
  const provider = useStore((s) => s.settings.provider)
  const providerName = getProvider(provider).name
  return (
    <div
      className={`drag-region flex h-12 shrink-0 items-center justify-between border-b border-outline-variant bg-surface/80 backdrop-blur-xl ${
        isMac ? 'mac-titlebar-pad' : 'pl-3'
      } pr-4`}
    >
      <div className="flex items-center gap-2.5">
        <AppLogo size={26} />
        <div className="flex items-baseline gap-1.5">
          <span className="bg-gradient-to-br from-[#E2558D] to-[#8A3FBE] bg-clip-text text-title-md font-display font-semibold text-transparent">
            朋友圈文案助手
          </span>
          <span className="text-label-sm text-on-surface-variant/55">·</span>
          <span className="text-label-sm text-on-surface-variant/75">
            {providerName}
          </span>
        </div>
      </div>
      <div className="no-drag text-label-sm text-on-surface-variant/55">v1.0</div>
    </div>
  )
}
