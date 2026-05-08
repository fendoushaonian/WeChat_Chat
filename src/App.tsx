import { useEffect } from 'react'
import { useStore } from './store'
import Sidebar from './components/Sidebar'
import Generator from './components/Generator'
import History from './components/History'
import Favorites from './components/Favorites'
import ProductManager from './components/ProductManager'
import Toast from './components/Toast'
import ActivateDialog from './components/ActivateDialog'
import MobileBottomNav from './components/MobileBottomNav'

export default function App() {
  const tab = useStore((s) => s.tab)
  const hydrated = useStore((s) => s.hydrated)
  const hydrate = useStore((s) => s.hydrate)
  const isAdmin = useStore((s) => s.isAdmin)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-body-md text-on-surface-variant">加载中…</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#fbf9ff] p-3">
      <div className="flex min-h-0 flex-1 gap-3">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-hidden rounded-[24px] border border-white/80 bg-white/90 shadow-[0_20px_60px_-35px_rgba(44,31,84,0.45),0_1px_2px_rgba(30,20,60,0.06)] backdrop-blur-xl">
          {tab === 'generator' && <Generator />}
          {tab === 'history' && <History />}
          {tab === 'favorites' && <Favorites />}
          {tab === 'products' && isAdmin && <ProductManager />}
          {tab === 'products' && !isAdmin && <Generator />}
        </main>
      </div>
      <MobileBottomNav />
      <Toast />
      {/* 全屏激活弹窗 - 没 token 时强制显示, 不允许关闭 */}
      <ActivateDialog />
    </div>
  )
}
