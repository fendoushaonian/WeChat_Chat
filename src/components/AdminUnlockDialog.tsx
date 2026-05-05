import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { useStore } from '../store'

/**
 * 管理员解锁弹窗
 * - 代理输入错误密码: 友好报错, 不暴露正确密码
 * - 输入正确后: isAdmin = true, 弹窗关闭
 * - ESC 可关闭
 */
export default function AdminUnlockDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const unlockAdmin = useStore((s) => s.unlockAdmin)
  const setToast = useStore((s) => s.setToast)
  const setTab = useStore((s) => s.setTab)

  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) {
      setPwd('')
      setErr('')
      setShake(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // ESC 关闭
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  if (!open) return null

  const handleConfirm = () => {
    const ok = unlockAdmin(pwd)
    if (ok) {
      setToast('已进入管理员模式')
      setTab('products')
      onClose()
    } else {
      setErr('密码错误，请重新输入')
      setShake(true)
      setTimeout(() => setShake(false), 400)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-scale-in"
      onClick={onClose}
    >
      <div
        className={`m3-dialog w-[420px] max-w-[92vw] ${shake ? 'animate-shake' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-6 pb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container">
            <Icon name="key" size={22} weight={1.8} />
          </div>
          <div className="flex-1 pt-1">
            <div className="text-title-lg text-on-surface">进入管理员模式</div>
            <div className="mt-1 text-body-sm text-on-surface-variant">
              请输入管理员密码，解锁"商品管理"等高级功能
            </div>
          </div>
          <button
            className="m3-icon-btn !h-8 !w-8 -mr-1 -mt-1"
            onClick={onClose}
            aria-label="关闭"
            title="关闭"
          >
            <Icon name="close" size={16} weight={2} />
          </button>
        </div>

        <div className="px-6 pb-2">
          <input
            ref={inputRef}
            type="password"
            className="m3-field-input w-full"
            placeholder="管理员密码"
            value={pwd}
            onChange={(e) => {
              setPwd(e.target.value)
              if (err) setErr('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleConfirm()
              }
            }}
          />
          {err && (
            <div className="mt-2 flex items-center gap-1 text-label-md text-error-40">
              <Icon name="alert" size={13} weight={2} />
              {err}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4">
          <button className="m3-btn-text" onClick={onClose}>
            取消
          </button>
          <button
            className="m3-btn-filled"
            disabled={!pwd.trim()}
            onClick={handleConfirm}
          >
            <Icon name="check" size={14} weight={2.5} />
            解锁
          </button>
        </div>
      </div>
    </div>
  )
}
