import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { useStore } from '../store'

/**
 * 代理激活弹窗 (全屏遮罩)
 * 当 needActivation=true 时显示, 不允许关闭(没激活就用不了)
 * 输入激活码 -> 调 store.activateAgent -> 成功后自动消失
 */
export default function ActivateDialog() {
  const needActivation = useStore((s) => s.needActivation)
  const activateAgent = useStore((s) => s.activateAgent)
  const setToast = useStore((s) => s.setToast)

  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (needActivation) {
      setCode('')
      setErr('')
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [needActivation])

  if (!needActivation) return null

  // 自动格式化: 输入 16 个字符自动加 - (MW-XXXX-XXXX-XXXX)
  function formatCode(raw: string): string {
    const cleaned = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    // 自动加 MW- 前缀
    let body = cleaned
    if (body.startsWith('MW')) body = body.slice(2)
    const parts: string[] = []
    for (let i = 0; i < body.length; i += 4) {
      parts.push(body.slice(i, i + 4))
    }
    return 'MW-' + parts.join('-').slice(0, 14)
  }

  async function handleSubmit() {
    if (loading) return
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setErr('请输入激活码')
      return
    }
    setErr('')
    setLoading(true)
    try {
      await activateAgent(trimmed)
      setToast('激活成功！正在同步商品库…')
    } catch (e: any) {
      setErr(e?.message || '激活失败')
      setShake(true)
      setTimeout(() => setShake(false), 400)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-purple-900/80 to-pink-900/80 backdrop-blur-md">
      <div
        className={`m3-dialog w-[460px] max-w-[92vw] ${shake ? 'animate-shake' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-6 pb-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-violet-500 text-white shadow-md">
            <Icon name="key" size={22} weight={2} />
          </div>
          <div className="flex-1 pt-1">
            <div className="text-title-lg text-on-surface">激活客户端</div>
            <div className="mt-1 text-body-sm text-on-surface-variant">
              请输入管理员发给你的激活码
            </div>
          </div>
        </div>

        <div className="px-6 pb-2">
          <input
            ref={inputRef}
            type="text"
            className="m3-field-input w-full font-mono text-center tracking-widest text-base"
            placeholder="MW-XXXX-XXXX-XXXX"
            value={code}
            maxLength={20}
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            onChange={(e) => {
              setCode(formatCode(e.target.value))
              if (err) setErr('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSubmit()
              }
            }}
            disabled={loading}
          />
          {err ? (
            <div className="mt-2 flex items-center gap-1 text-label-md text-error-40">
              <Icon name="alert" size={13} weight={2} />
              {err}
            </div>
          ) : (
            <div className="mt-2 text-label-sm text-on-surface-variant/70">
              激活码格式: MW-AB12-CD34-EF56 (4 位 4 位地输, 自动加 MW- 前缀和 -)
            </div>
          )}
        </div>

        <div className="px-6 py-4">
          <button
            className="m3-btn-filled w-full !h-11"
            disabled={!code.trim() || loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
                激活中…
              </>
            ) : (
              <>
                <Icon name="check" size={14} weight={2.5} />
                激活
              </>
            )}
          </button>
          <div className="mt-3 text-center text-label-sm text-on-surface-variant/60">
            激活后此客户端将连接到品牌方的商品库
            <br />
            服务条款: 商品由品牌方统一维护，停用后将无法继续使用
          </div>
        </div>
      </div>
    </div>
  )
}
