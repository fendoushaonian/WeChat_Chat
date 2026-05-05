import { useEffect } from 'react'
import { useStore } from './store'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import Generator from './components/Generator'
import History from './components/History'
import Favorites from './components/Favorites'
import ProductManager from './components/ProductManager'
import Toast from './components/Toast'
import ActivateDialog from './components/ActivateDialog'

export default function App() {
  const tab = useStore((s) => s.tab)
  const hydrated = useStore((s) => s.hydrated)
  const hydrate = useStore((s) => s.hydrate)

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
    <div className="flex h-screen flex-col overflow-hidden">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-hidden">
          {tab === 'generator' && <Generator />}
          {tab === 'history' && <History />}
          {tab === 'favorites' && <Favorites />}
          {tab === 'products' && <ProductManager />}
        </main>
      </div>
      <Toast />
      {/* 全屏激活弹窗 - 没 token 时强制显示, 不允许关闭 */}
      <ActivateDialog />
    </div>
  )
}
