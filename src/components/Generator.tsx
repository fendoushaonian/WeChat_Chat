import { useEffect, useRef, useState, type ReactNode } from 'react'
import Icon, { type IconName } from './Icon'
import { useStore } from '../store'
import { AUTO_SCENE_KEY, SCENES, STYLES, MOODS, LENGTH_LABEL } from '../constants'
import { buildSystemPrompt, buildUserPrompt, splitResults } from '../prompt'
import { postProcess } from '../postprocess'
import { classifyError } from '../errorUtils'
import { inferScenesForProduct } from '../sceneInfer'
import type { CopyItem, GenerateParams, Product } from '../types'
import ResultCard from './ResultCard'
import ResultPanel from './ResultPanel'
import ProductSelector from './ProductSelector'

export default function Generator() {
  const params = useStore((s) => s.params)
  const setParams = useStore((s) => s.setParams)
  const settings = useStore((s) => s.settings)
  const results = useStore((s) => s.results)
  const setResults = useStore((s) => s.setResults)
  const loading = useStore((s) => s.loading)
  const setLoading = useStore((s) => s.setLoading)
  const error = useStore((s) => s.error)
  const setError = useStore((s) => s.setError)
  const addHistory = useStore((s) => s.addHistory)
  const products = useStore((s) => s.products)
  const selectedProductId = useStore((s) => s.selectedProductId)

  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [showResultPanel, setShowResultPanel] = useState(false)
  const extraRef = useRef<HTMLTextAreaElement | null>(null)

  const selectedProduct: Product | null =
    products.find((p) => p.id === selectedProductId) || null
  const visibleStyles: { key: string; label: string; icon: IconName }[] = [
    { key: '朋友圈真实分享', label: '朋友圈文案', icon: 'scene-heart' },
    { key: '小红书风', label: '小红书风', icon: 'bookmark' },
    { key: '文艺清新', label: '文艺清新', icon: 'scene-book' },
  ]

  const hasProduct = !!selectedProduct
  const canGenerate = !!(
    settings.apiKey && settings.model &&
    (settings.provider !== 'custom' || settings.baseUrl) &&
    hasProduct
  )

  const update = <K extends keyof GenerateParams>(k: K, v: GenerateParams[K]) => {
    setParams({ [k]: v } as Partial<GenerateParams>)
  }

  async function handleGenerate() {
    if (loading) return
    if (!selectedProduct) {
      setError('请先在上方选择一个商品再生成文案')
      return
    }
    if (!canGenerate) {
      setError('内置 API Key 丢失，请重新启动软件或清理本地数据后重试')
      return
    }
    setError('')
    setLoading(true)
    setResults([])
    setShowResultPanel(true)

    // 根据选中商品自动构造 keywords: 名称 · 一句话卖点 · 核心卖点 · 详细介绍
    const kwPieces: string[] = []
    kwPieces.push(`【商品名称】${selectedProduct.name}`)
    if (selectedProduct.tagline?.trim()) {
      kwPieces.push(`【一句话卖点】${selectedProduct.tagline.trim()}`)
    }
    if (selectedProduct.sellingPoints?.length) {
      kwPieces.push(`【核心卖点】\n- ${selectedProduct.sellingPoints.join('\n- ')}`)
    }
    if (selectedProduct.description?.trim()) {
      kwPieces.push(`【商品详细介绍】\n${selectedProduct.description.trim()}`)
    }
    const paramsForGen: GenerateParams = {
      ...params,
      keywords: kwPieces.join('\n\n'),
    }

    // 智能推荐: 从商品内容推理一组候选场景, 让 AI 每条文案用不同场景
    const isAutoScene = !params.scene || params.scene === AUTO_SCENE_KEY
    const suggestedScenes = isAutoScene
      ? inferScenesForProduct(selectedProduct, params.count)
      : undefined

    const system = buildSystemPrompt(selectedProduct.extraRules)
    const user = buildUserPrompt(paramsForGen, suggestedScenes)
    const MIN_CHAR = params.length === 'short' ? 60 : params.length === 'medium' ? 85 : 115

    // 第一次调用
    let parts: string[] = []
    try {
      const resp = await window.api.ai.generate({
        settings,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      })
      if (!resp.ok) {
        setError(resp.error || '生成失败, 请稍后重试')
        setLoading(false)
        return
      }
      parts = splitResults(resp.text, params.count).slice(0, params.count)

      // 如果超过一半的条目太短, 自动追加一次"请重写, 每条要到目标字数"再试
      const tooShort = parts.filter((t) => Array.from(t).length < MIN_CHAR).length
      if (parts.length >= 2 && tooShort / parts.length > 0.5) {
        const retryResp = await window.api.ai.generate({
          settings,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
            { role: 'assistant', content: resp.text },
            {
              role: 'user',
              content:
                `你上一次输出的文案大多数不到 ${MIN_CHAR} 字，太短了。` +
                `请重写 ${params.count} 条，每条都必须 ≥ ${MIN_CHAR} 字且 ≤ 150 字，` +
                `多描写具体场景、人物动作、当下的感受细节，让画面更饱满。` +
                `多条之间场景、人物、切入角度必须完全不同。` +
                `请你亲自创作，禁止复用之前出现过的句子原文。` +
                `只输出文案本身，空行分隔。`,
            },
          ],
        })
        if (retryResp.ok) {
          const retryParts = splitResults(retryResp.text, params.count).slice(0, params.count)
          if (retryParts.length > 0) parts = retryParts
        }
      }
    } catch (err: any) {
      setError(err?.message || '生成失败')
      setLoading(false)
      return
    }

    if (parts.length === 0) {
      setError('AI 返回内容为空, 请调整参数后重试')
      setLoading(false)
      return
    }

    const now = Date.now()
    const items: CopyItem[] = parts.map((rawText, i) => {
      const pp = postProcess(rawText)
      return {
        id: `${now}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        text: pp.text,
        createdAt: now + i,
        params,
        truncated: pp.truncated || undefined,
        violations: pp.violations.length ? pp.violations : undefined,
      }
    })
    setResults(items)
    addHistory(items)
    setLoading(false)
  }

  // 快捷键: textarea 内 Ctrl/Cmd+Enter 触发生成; 其他位置直接 Enter 触发
  // 用 ref 保持指向最新的 handleGenerate, 避免重复注册监听器
  const handleRef = useRef(handleGenerate)
  handleRef.current = handleGenerate
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Enter') return
      // 兼容中文输入法组合中状态 (IME composition)
      // @ts-ignore - 某些浏览器/Electron 版本 keydown 的 isComposing 可能缺失
      if (e.isComposing || e.keyCode === 229) return
      const tag = (e.target as HTMLElement | null)?.tagName || ''
      const withMod = e.ctrlKey || e.metaKey
      // textarea 内: 普通 Enter 换行, 仅 Ctrl/Cmd+Enter 触发生成
      if (tag === 'TEXTAREA' && !withMod) return
      e.preventDefault()
      e.stopPropagation()
      handleRef.current()
    }
    document.addEventListener('keydown', onKeyDown, true) // capture 阶段, 优先拦截
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [])

  return (
    <div className="relative flex h-full flex-col bg-transparent">
      {/* 结果面板 (覆盖层) */}
      {showResultPanel && (
        <ResultPanel
          results={results}
          product={selectedProduct}
          loading={loading}
          onClose={() => setShowResultPanel(false)}
        />
      )}
      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[930px] px-5 pt-6 pb-32 md:px-6 md:pt-6">

          {/* 风格选择 */}
          <Section title="选择风格">
            <div className="no-scrollbar flex flex-nowrap items-center gap-4 overflow-x-auto pb-1">
              {visibleStyles.map((s) => (
                <button
                  key={s.key}
                  className={`shrink-0 inline-flex h-9 items-center gap-2 rounded-full px-5 text-[13px] font-semibold transition-all ${
                    params.style === s.key
                      ? 'bg-gradient-to-r from-[#6d42dc] to-[#8b5cf6] text-white shadow-[0_10px_22px_-16px_rgba(109,66,220,0.85)]'
                      : 'border border-[#ece7f2] bg-white/90 text-[#5f5869] shadow-[0_5px_18px_-16px_rgba(44,31,84,0.6)] hover:border-[#d9cdf0] hover:text-[#3d3153]'
                  }`}
                  onClick={() => update('style', s.key)}
                  title={STYLES.find((item) => item.key === s.key)?.desc}
                >
                  <Icon name={s.icon} size={15} weight={1.8} />
                  {s.label}
                </button>
              ))}
              <button
                className="shrink-0 inline-flex h-9 items-center gap-1.5 rounded-full border border-[#ece7f2] bg-white px-4 text-[13px] font-semibold text-[#5f5869] shadow-sm"
                type="button"
                onClick={() => setAdvancedOpen(true)}
              >
                更多
                <Icon name="chevron-down" size={13} weight={2} />
              </button>
            </div>
          </Section>

          {/* 商品选择器 */}
          <Section title="选择商品">
            <ProductSelector />
          </Section>

          {/* 进阶切换 */}
          <div className="mb-4">
            <button
              onClick={() => setAdvancedOpen((v) => !v)}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-[#eee8f4] bg-white/80 px-4 text-[13px] font-semibold text-[#7c3aed] shadow-sm transition-all hover:border-[#d8c9fb] hover:bg-[#fbf9ff]"
            >
              <Icon
                name="chevron-down"
                size={16}
                weight={2.2}
                className={`transition-transform duration-200 ${
                  advancedOpen ? 'rotate-180' : ''
                }`}
              />
              <Icon name="sliders" size={14} weight={2} />
              <span>{advancedOpen ? '收起进阶设置' : '进阶设置'}</span>
            </button>
          </div>

          {advancedOpen && (
            <div className="animate-slide-down space-y-6 rounded-[24px] border border-[#eee8f4] bg-[#fbf9ff] p-6 shadow-inner">
              {/* 场景 (移到进阶) */}
              <Section title="场景" subtitle="默认智能推荐，也可手动指定">
                <div className="flex flex-wrap gap-2">
                  {SCENES.map((s) => {
                    const active = params.scene === s.key
                    const isAuto = s.key === AUTO_SCENE_KEY
                    return (
                      <button
                        key={s.key}
                        className={`m3-chip ${active ? 'is-active' : ''} ${
                          isAuto ? '!border-primary/50 !text-primary font-semibold' : ''
                        }`}
                        onClick={() => update('scene', s.key)}
                        title={s.hint}
                      >
                        <Icon name={s.icon} size={15} weight={1.8} />
                        <span>{s.label || s.key}</span>
                      </button>
                    )
                  })}
                </div>
              </Section>

              <Section title="心情">
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`m3-chip ${params.mood === '' ? 'is-active' : ''}`}
                    onClick={() => update('mood', '')}
                  >
                    自动
                  </button>
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      className={`m3-chip ${params.mood === m ? 'is-active' : ''}`}
                      onClick={() => update('mood', m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </Section>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Section title="长度">
                  <div className="m3-segment">
                    {(['short', 'medium', 'long'] as const).map((l) => (
                      <button
                        key={l}
                        className={`m3-segment-item ${
                          params.length === l ? 'is-active' : ''
                        }`}
                        onClick={() => update('length', l)}
                      >
                        {LENGTH_LABEL[l].split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="生成条数">
                  <div className="m3-segment">
                    {[1, 3, 5, 8].map((n) => (
                      <button
                        key={n}
                        className={`m3-segment-item ${
                          params.count === n ? 'is-active' : ''
                        }`}
                        onClick={() => update('count', n)}
                      >
                        {n} 条
                      </button>
                    ))}
                  </div>
                </Section>
              </div>

              <Section title="其他">
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`m3-chip ${params.withEmoji ? 'is-active' : ''}`}
                    onClick={() => update('withEmoji', !params.withEmoji)}
                  >
                    {params.withEmoji && <Icon name="check" size={14} weight={2.5} />}
                    使用 emoji
                  </button>
                  <button
                    className={`m3-chip ${params.withHashtags ? 'is-active' : ''}`}
                    onClick={() => update('withHashtags', !params.withHashtags)}
                  >
                    {params.withHashtags && (
                      <Icon name="check" size={14} weight={2.5} />
                    )}
                    加话题标签
                  </button>
                </div>
              </Section>

              <Section
                title="其他补充要求"
                subtitle="比如：第一人称 / 适合女生发 / 避免某些词…"
              >
                <textarea
                  ref={extraRef}
                  className="m3-field-textarea"
                  placeholder="（可选）其他想告诉 AI 的要求…"
                  value={params.extra}
                  onChange={(e) => update('extra', e.target.value)}
                  rows={2}
                />
              </Section>
            </div>
          )}

          {/* 错误提示 - 智能分类友好显示 */}
          {error && <ErrorBanner error={error} onClear={() => setError('')} />}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="sticky bottom-0 shrink-0 bg-gradient-to-t from-white via-white/95 to-white/0 px-3 pt-7 pb-3">
        <div className="flex max-w-[930px] items-center justify-between gap-3 rounded-[22px] border border-[#eee8f4] bg-white/95 p-2 shadow-[0_16px_48px_-30px_rgba(44,31,84,0.55)] backdrop-blur-2xl">
          {/* 信息面板 */}
          <div className="hidden min-w-0 flex-1 items-stretch sm:flex">
            {/* 当前模型 */}
            <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f3edff] text-[#7c3aed]">
                <Icon name="bot" size={16} weight={2} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] leading-none text-[#9a91a8]">当前模型</div>
                <div className="mt-1 truncate text-[13px] font-semibold text-[#2a2238]">{settings.model || '未选择'}</div>
              </div>
            </div>
            <div className="my-2 w-px bg-[#eee8f4]" />
            {/* 已选商品 */}
            <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-[#f3edff]">
                {selectedProduct?.coverUrl ? (
                  <img src={selectedProduct.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#7c3aed]">
                    <Icon name="check" size={16} weight={2.4} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] leading-none text-[#9a91a8]">已选择商品</div>
                <div className="mt-1 truncate text-[13px] font-semibold text-[#2a2238]">{selectedProduct?.name || '未选商品'}</div>
              </div>
            </div>
            <div className="my-2 w-px bg-[#eee8f4]" />
            {/* 当前风格 */}
            <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f3edff] text-[#7c3aed]">
                <Icon name="scene-heart" size={16} weight={2} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] leading-none text-[#9a91a8]">当前风格</div>
                <div className="mt-1 truncate text-[13px] font-semibold text-[#7c3aed]">{params.style}</div>
              </div>
            </div>
          </div>
          {/* 生成按钮 */}
          <button
            className="m3-fab group shrink-0"
            disabled={loading}
            onClick={handleGenerate}
            title="生成文案（快捷键 Enter，文本框内 Ctrl+Enter）"
          >
            {loading ? (
              <>
                <Icon name="loader" size={18} className="animate-spin-slow" />
                <span>生成中…</span>
              </>
            ) : (
              <>
                <Icon
                  name="send-plane"
                  size={20}
                  weight={1.8}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
                <span>生成文案</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="mb-5">
      <div className="mb-3 flex items-baseline gap-2">
        <h3 className="text-[16px] font-bold text-[#1f1635]">{title}</h3>
        {subtitle && (
          <span className="text-[12px] text-[#8c8498]">{subtitle}</span>
        )}
      </div>
      {children}
    </div>
  )
}

function LoadingSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-5"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="space-y-2.5">
            <div className="m3-skeleton h-4 w-full" />
            <div className="m3-skeleton h-4 w-[88%]" />
            <div className="m3-skeleton h-4 w-[64%]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyHint() {
  return (
    <div className="rounded-3xl bg-surface-container-low px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container">
        <Icon name="wand" size={28} weight={1.8} />
      </div>
      <div className="text-title-lg font-display text-on-surface">
        准备好创作了吗？
      </div>
      <div className="mt-1.5 text-body-md text-on-surface-variant">
        选择场景与风格，写下关键词，点击右下角「生成文案」
      </div>
    </div>
  )
}

function ErrorBanner({
  error,
  onClear,
}: {
  error: string
  onClear: () => void
}) {
  const info = classifyError(error)
  const isSevere = info.kind === 'overdue' || info.kind === 'auth'

  // 只保留 href 类型的操作按钮 (外链); switch-key 类型已废弃, 因为偏好设置页移除
  const externalActions = (info.actions || []).filter((a) => !!a.href)

  return (
    <div
      className={`mt-6 animate-scale-in overflow-hidden rounded-2xl ${
        isSevere
          ? 'bg-gradient-to-br from-error-90 to-error-95 border border-error-80'
          : 'bg-error-90'
      }`}
    >
      <div className="flex items-start gap-3 px-5 py-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            isSevere ? 'bg-error-40 text-white' : 'bg-error-80 text-error-40'
          }`}
        >
          <Icon name="alert" size={18} weight={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-title-md text-error-40">{info.title}</div>
            <button
              className="m3-icon-btn !h-7 !w-7 -mr-1 -mt-0.5"
              onClick={onClear}
              aria-label="关闭提示"
              title="关闭"
            >
              <Icon name="close" size={14} weight={2} />
            </button>
          </div>
          <div className="mt-1 text-body-sm text-on-surface/80">{info.desc}</div>
          {externalActions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {externalActions.map((a, i) => (
                <button
                  key={i}
                  className="m3-btn-tonal !h-9 !px-4 text-label-lg"
                  onClick={() => window.api.shell.openExternal(a.href!)}
                >
                  <Icon name="external" size={14} weight={2} />
                  {a.label}
                </button>
              ))}
            </div>
          )}
          <details className="mt-2 text-label-sm text-on-surface-variant">
            <summary className="cursor-pointer select-none hover:text-on-surface">
              查看原始错误信息
            </summary>
            <pre className="mt-1.5 whitespace-pre-wrap break-all rounded-lg bg-surface-container-high/60 px-3 py-2 font-mono text-[11px] leading-relaxed">
              {info.raw}
            </pre>
          </details>
        </div>
      </div>
    </div>
  )
}
