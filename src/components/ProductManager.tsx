import { useRef, useState } from 'react'
import Icon from './Icon'
import { useStore } from '../store'
import { SCENES } from '../constants'
import { uploadCloudImage } from '../cloudApi'
import type { Product } from '../types'

// 图片上传上限 5MB (服务器配置 MAX_UPLOAD_MB 也是 5)
const MAX_COVER_BYTES = 5 * 1024 * 1024

/**
 * 商品管理页面
 * 每个激活的代理管理自己私有的商品库, 全部走云端 API
 */
export default function ProductManager() {
  const products = useStore((s) => s.products)
  const addProduct = useStore((s) => s.addProduct)
  const updateProduct = useStore((s) => s.updateProduct)
  const removeProduct = useStore((s) => s.removeProduct)
  const setToast = useStore((s) => s.setToast)

  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave(form: ProductForm) {
    const cleaned: Omit<Product, 'id' | 'builtIn'> = {
      name: form.name.trim(),
      tagline: form.tagline.trim() || undefined,
      sellingPoints: form.sellingPoints
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      description: form.description.trim() || undefined,
      scenes: form.scenes.length ? form.scenes : undefined,
      extraRules: form.extraRules.trim() || undefined,
      priceText: form.priceText.trim() || undefined,
      coverUrl: form.coverUrl.trim() || undefined,
    }
    if (!cleaned.name) {
      setToast('商品名不能为空')
      return
    }
    if (cleaned.sellingPoints.length === 0) {
      setToast('至少填写 1 条核心卖点')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await updateProduct(editing.id, cleaned)
        setToast('已保存')
        setEditing(null)
      } else {
        await addProduct(cleaned)
        setToast('已新增商品')
        setCreating(false)
      }
    } catch (e: any) {
      setToast(e?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`确定删除商品「${p.name}」？此操作不可撤销。`)) return
    try {
      await removeProduct(p.id)
      setToast('已删除')
    } catch (e: any) {
      setToast(e?.message || '删除失败')
    }
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[900px] px-8 py-8">
          {/* 页头 */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-display-sm font-display font-medium text-on-surface">
                商品管理
              </h1>
              <p className="mt-1.5 text-body-md text-on-surface-variant">
                新增、编辑或删除商品 —— 代理只能在「文案生成」页从这里列出的商品中选择
              </p>
            </div>
            <button
              className="m3-btn-filled"
              onClick={() => {
                setEditing(null)
                setCreating(true)
              }}
            >
              <Icon name="plus" size={14} weight={2.5} />
              新增商品
            </button>
          </div>

          {/* 商品列表 */}
          <div className="space-y-3">
            {products.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                onEdit={() => {
                  setCreating(false)
                  setEditing(p)
                }}
                onDelete={() => handleDelete(p)}
              />
            ))}
          </div>

          {products.length === 0 && (
            <div className="rounded-3xl bg-surface-container-low px-6 py-16 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant">
                <Icon name="info" size={24} weight={1.8} />
              </div>
              <div className="text-title-lg font-display text-on-surface">
                还没有商品
              </div>
              <div className="mt-1.5 text-body-md text-on-surface-variant">
                点击右上角「新增商品」添加第一个
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 编辑/新增弹窗 */}
      {(editing || creating) && (
        <ProductFormDialog
          product={editing}
          saving={saving}
          onCancel={() => {
            setEditing(null)
            setCreating(false)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function ProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: Product
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 hover:shadow-sm transition-shadow">
      {/* 缩略图 */}
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-title-lg font-display font-semibold"
        style={{
          background: product.coverUrl
            ? `url(${product.coverUrl}) center/cover`
            : `linear-gradient(135deg, hsl(${hashHue(product.id)}, 75%, 88%), hsl(${
                (hashHue(product.id) + 40) % 360
              }, 70%, 78%))`,
          color: `hsl(${hashHue(product.id)}, 60%, 32%)`,
        }}
      >
        {!product.coverUrl && Array.from(product.name).slice(0, 2).join('')}
      </div>

      {/* 信息 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-title-md text-on-surface" title={product.name}>
            {product.name}
          </div>
          {product.priceText && (
            <span className="text-label-md text-on-surface-variant">
              {product.priceText}
            </span>
          )}
        </div>
        {product.tagline && (
          <div className="mt-0.5 truncate text-body-sm text-on-surface-variant">
            {product.tagline}
          </div>
        )}
        {product.sellingPoints?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.sellingPoints.map((sp, i) => (
              <span
                key={i}
                className="rounded-md bg-surface-container-high/60 px-1.5 py-0.5 text-label-sm text-on-surface-variant"
              >
                {sp}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 操作 */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          className="m3-icon-btn"
          onClick={onEdit}
          title="编辑"
          aria-label="编辑"
        >
          <Icon name="sliders" size={15} weight={2} />
        </button>
        <button
          className="m3-icon-btn hover:!text-error-40"
          onClick={onDelete}
          title="删除"
          aria-label="删除"
        >
          <Icon name="trash" size={15} weight={2} />
        </button>
      </div>
    </div>
  )
}

interface ProductForm {
  name: string
  tagline: string
  sellingPoints: string // 换行分隔
  description: string
  scenes: string[]
  extraRules: string
  priceText: string
  coverUrl: string
}

function ProductFormDialog({
  product,
  saving,
  onCancel,
  onSave,
}: {
  product: Product | null
  saving: boolean
  onCancel: () => void
  onSave: (form: ProductForm) => void | Promise<void>
}) {
  const [form, setForm] = useState<ProductForm>({
    name: product?.name || '',
    tagline: product?.tagline || '',
    sellingPoints: (product?.sellingPoints || []).join('\n'),
    description: product?.description || '',
    scenes: product?.scenes || [],
    extraRules: product?.extraRules || '',
    priceText: product?.priceText || '',
    coverUrl: product?.coverUrl || '',
  })

  function toggleScene(key: string) {
    setForm((f) => ({
      ...f,
      scenes: f.scenes.includes(key)
        ? f.scenes.filter((s) => s !== key)
        : [...f.scenes, key],
    }))
  }

  const title = product ? '编辑商品' : '新增商品'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="m3-dialog flex w-[560px] max-w-[92vw] max-h-[88vh] flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-start gap-3 border-b border-outline-variant px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
            <Icon name={product ? 'sliders' : 'plus'} size={18} weight={2} />
          </div>
          <div className="flex-1">
            <div className="text-title-lg text-on-surface">{title}</div>
            {product?.builtIn && (
              <div className="mt-0.5 text-label-sm text-on-surface-variant">
                这是内置商品，编辑后会覆盖默认配置
              </div>
            )}
          </div>
          <button
            className="m3-icon-btn !h-8 !w-8"
            onClick={onCancel}
            aria-label="关闭"
          >
            <Icon name="close" size={16} weight={2} />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <Field label="商品名称" required>
            <input
              className="m3-field-input w-full"
              placeholder="例如：山茶菁华婴童呵护膏"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </Field>

          <Field label="一句话卖点" hint="展示在商品卡片上，辅助 AI 理解产品定位">
            <input
              className="m3-field-input w-full"
              placeholder="例如：天然山茶油提取，宝宝夏日外出常备"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
          </Field>

          <Field
            label="核心卖点"
            required
            hint="每行一条，建议 3~5 条，AI 会从中挑选融入文案"
          >
            <textarea
              className="m3-field-textarea w-full"
              rows={4}
              placeholder={'例如：\n天然山茶油萃取，温和不刺激\n蚊虫叮咬后舒缓，不黏腻\n全家可用，婴童孕妇友好'}
              value={form.sellingPoints}
              onChange={(e) => setForm({ ...form, sellingPoints: e.target.value })}
            />
          </Field>

          <Field
            label="商品详细介绍"
            hint="可选长文本 · 写产品背景、成分、适用人群、使用方法、品牌故事等，AI 会基于这段创作"
          >
            <textarea
              className="m3-field-textarea w-full"
              rows={5}
              placeholder={
                '（可选）可以详细介绍这个商品的背景故事、适用人群、使用方法、核心成分、品牌理念等。\n例如：\n山茶菁华婴童呵护膏是一款专为 0~6 岁宝宝设计的日常护肤膏，以天然山茶油为核心成分…\n适合夏天户外蚊虫多的场景，妈妈可以随手涂一涂，温和不刺激。'
              }
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <Field label="价格展示" hint="仅显示用，不会发给 AI">
            <input
              className="m3-field-input w-full"
              placeholder="例如：¥89 / 限时 ¥69"
              value={form.priceText}
              onChange={(e) => setForm({ ...form, priceText: e.target.value })}
            />
          </Field>

          <Field label="商品封面图" hint="支持本地上传或粘贴图片 URL，建议正方形、不超过 2MB">
            <CoverUploader
              value={form.coverUrl}
              onChange={(url) => setForm({ ...form, coverUrl: url })}
            />
          </Field>

          <Field label="推荐场景" hint="勾选后，代理选中本商品时会自动推荐这些场景">
            <div className="flex flex-wrap gap-1.5">
              {SCENES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={`m3-chip !h-8 !text-label-md ${
                    form.scenes.includes(s.key) ? 'is-active' : ''
                  }`}
                  onClick={() => toggleScene(s.key)}
                >
                  {form.scenes.includes(s.key) && (
                    <Icon name="check" size={12} weight={2.5} />
                  )}
                  {s.key}
                </button>
              ))}
            </div>
          </Field>

          <Field
            label="AI 写作提示词（高级）"
            hint="可选 · 专属这个商品的额外写作规则，优先级最高，会附加到系统指令末尾"
          >
            <textarea
              className="m3-field-textarea w-full"
              rows={3}
              placeholder={
                '（可选）例如：\n- 必须提到"限时 89 元"活动价\n- 不要出现"止痒""消炎"等医疗词\n- 至少一条文案用妈妈的第一人称口吻\n- 强调产品小巧便携、15g 净含量'
              }
              value={form.extraRules}
              onChange={(e) => setForm({ ...form, extraRules: e.target.value })}
            />
          </Field>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-2 border-t border-outline-variant px-6 py-4">
          <button className="m3-btn-text" onClick={onCancel}>
            取消
          </button>
          <button
            className="m3-btn-filled"
            onClick={() => onSave(form)}
            disabled={!form.name.trim() || saving}
          >
            {saving ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
                保存中…
              </>
            ) : (
              <>
                <Icon name="check" size={14} weight={2.5} />
                保存
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="text-label-lg font-medium text-on-surface">
          {label}
          {required && <span className="ml-0.5 text-error-40">*</span>}
        </span>
        {hint && (
          <span className="text-label-sm text-on-surface-variant">{hint}</span>
        )}
      </div>
      {children}
    </div>
  )
}

function hashHue(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff
  return h % 360
}

/**
 * 封面图上传组件
 * - 本地文件: 上传到云端服务器, 拿到绝对 URL
 * - 图片 URL: 允许直接粘贴 http(s)://
 * - 预览 + 清除
 */
function CoverUploader({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const setToast = useStore((s) => s.setToast)
  const agentToken = useStore((s) => s.agentToken)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [urlMode, setUrlMode] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setToast('请选择图片文件')
      return
    }
    if (file.size > MAX_COVER_BYTES) {
      setToast(`图片过大 (${(file.size / 1024 / 1024).toFixed(1)}MB), 请压缩到 5MB 以下`)
      return
    }
    if (!agentToken) {
      setToast('请先激活客户端')
      return
    }
    setUploading(true)
    try {
      const url = await uploadCloudImage(agentToken, file)
      onChange(url)
      setToast('图片上传成功')
    } catch (e: any) {
      setToast(e?.message || '上传失败')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        {/* 预览 */}
        <div
          className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low"
          style={
            value
              ? {
                  backgroundImage: `url(${value})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          {!value && (
            <div className="text-center text-label-sm text-on-surface-variant/60">
              <Icon name="wand" size={18} weight={1.5} className="mx-auto" />
              <div className="mt-1">暂无图片</div>
            </div>
          )}
        </div>

        {/* 操作 */}
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="m3-btn-tonal"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-on-surface/30 border-t-primary" />
                  上传中…
                </>
              ) : (
                <>
                  <Icon name="plus" size={13} weight={2} />
                  {value ? '替换图片' : '上传图片'}
                </>
              )}
            </button>
            <button
              type="button"
              className="m3-btn-text"
              onClick={() => setUrlMode((v) => !v)}
            >
              <Icon name="external" size={13} weight={2} />
              {urlMode ? '收起 URL' : '粘贴 URL'}
            </button>
            {value && (
              <button
                type="button"
                className="m3-btn-text hover:!text-error-40"
                onClick={() => onChange('')}
              >
                <Icon name="trash" size={13} weight={2} />
                清除
              </button>
            )}
          </div>
          {urlMode && (
            <input
              className="m3-field-input w-full"
              placeholder="https://example.com/product.jpg"
              value={value.startsWith('data:') ? '' : value}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
          <div className="text-label-sm text-on-surface-variant/70">
            {value.startsWith('data:')
              ? '已上传本地图片 (数据已内嵌到商品配置)'
              : value
                ? '使用远程图片 URL'
                : '点击"上传图片"从电脑选一张，或粘贴一个图片网址'}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          // 允许选同一文件再次触发
          e.target.value = ''
        }}
      />
    </div>
  )
}
