import type { SVGProps } from 'react'

/**
 * 统一 SVG 图标组件, 灵感来自 Material Symbols Rounded.
 * 全部使用 24x24 viewBox, stroke-based, currentColor.
 */

export type IconName =
  // UI 图标
  | 'sparkles'
  | 'wand'
  | 'clock'
  | 'star'
  | 'star-filled'
  | 'settings'
  | 'search'
  | 'copy'
  | 'trash'
  | 'eye'
  | 'eye-off'
  | 'external'
  | 'check'
  | 'check-circle'
  | 'close'
  | 'close-circle'
  | 'loader'
  | 'info'
  | 'alert'
  | 'sliders'
  | 'chevron-down'
  | 'chevron-right'
  | 'send'
  | 'send-plane'
  | 'refresh'
  | 'key'
  | 'bot'
  | 'bookmark'
  | 'plus'
  | 'menu'
  | 'shield'
  // 场景图标
  | 'scene-camera'
  | 'scene-food'
  | 'scene-airplane'
  | 'scene-coffee'
  | 'scene-dumbbell'
  | 'scene-book'
  | 'scene-briefcase'
  | 'scene-heart'
  | 'scene-gift'
  | 'scene-paw'
  | 'scene-shirt'
  | 'scene-home'
  | 'scene-moon'
  | 'scene-flame'
  | 'scene-baby'
  | 'scene-shopping'

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name' | 'stroke'> {
  name: IconName
  size?: number | string
  weight?: number
}

export default function Icon({ name, size = 20, weight = 2, className, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}

const PATHS: Record<IconName, JSX.Element> = {
  sparkles: (
    <>
      <path d="M12 3l1.912 5.813a3 3 0 0 0 1.9 1.9L21.625 12.6l-5.813 1.912a3 3 0 0 0-1.9 1.9L12 22.224l-1.912-5.813a3 3 0 0 0-1.9-1.9L2.375 12.6l5.813-1.912a3 3 0 0 0 1.9-1.9z" />
      <path d="M19 3v4M17 5h4" />
    </>
  ),
  wand: (
    <>
      <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M15 9h0M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  star: (
    <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345z" />
  ),
  'star-filled': (
    <path
      d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345z"
      fill="currentColor"
    />
  ),
  settings: (
    <>
      <path d="M10.325 4.317a1.724 1.724 0 0 1 3.35 0c.128.503.505.919 1.003 1.108.499.19 1.059.14 1.515-.135 1.527-.91 3.168.73 2.26 2.256a1.724 1.724 0 0 0 1.078 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.078 2.572c.909 1.526-.733 3.166-2.26 2.256a1.724 1.724 0 0 0-2.518 1.015c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.518-1.015c-1.527.91-3.169-.73-2.26-2.256a1.724 1.724 0 0 0-1.078-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.078-2.572c-.909-1.526.733-3.166 2.26-2.256.456.275 1.016.324 1.515.135a1.724 1.724 0 0 0 1.003-1.108z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2.5" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
      <path d="M5 6h14l-1.1 14.1A2 2 0 0 1 15.9 22H8.1A2 2 0 0 1 6.1 20.1z" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a19.81 19.81 0 0 1 4.22-5.19M9.9 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 7 10 7a19.8 19.8 0 0 1-2.16 3.18M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M2 2l20 20" />
    </>
  ),
  external: (
    <>
      <path d="M15 3h6v6M14 10L21 3M19 13v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" />
    </>
  ),
  check: <path d="M5 13l4 4L19 7" />,
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  close: <path d="M6 6l12 12M6 18L18 6" />,
  'close-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M9 15l6-6" />
    </>
  ),
  loader: (
    <>
      <path d="M12 3v3M12 18v3M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M3 12h3M18 12h3M5.64 18.36l2.12-2.12M16.24 7.76l2.12-2.12" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h0" />
    </>
  ),
  alert: (
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h0" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
    </>
  ),
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  send: (
    <>
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </>
  ),
  // 饱满立体纸飞机 - 用于"发送/生成"主按钮
  // 外轮廓 + 内折痕 + 飞行尾迹短线
  'send-plane': (
    <>
      {/* 半透明填充的机身 */}
      <path
        d="M21.5 2.5 3 10l7.5 2.5L13 20l8.5-17.5z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="none"
      />
      {/* 机身外轮廓 */}
      <path d="M21.5 2.5 3 10l7.5 2.5L13 20l8.5-17.5z" />
      {/* 中间折痕, 让纸飞机有立体感 */}
      <path d="m21.5 2.5-11 10" />
    </>
  ),
  refresh: (
    <>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
    </>
  ),
  key: (
    <>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" />
    </>
  ),
  bot: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="3" />
      <circle cx="8.5" cy="13" r="1" fill="currentColor" />
      <circle cx="15.5" cy="13" r="1" fill="currentColor" />
      <path d="M12 3v4M8 20v2M16 20v2" />
    </>
  ),
  bookmark: (
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),

  // ============ 场景图标 ============
  'scene-camera': (
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  'scene-food': (
    <>
      <path d="M3 2v7a4 4 0 0 0 4 4v9M7 2v11M15 3a4 4 0 0 0-4 4v5a1 1 0 0 0 1 1h3v9" />
    </>
  ),
  'scene-airplane': (
    <>
      <path d="M17.8 19.2 16 11l3.5-3.5A2.5 2.5 0 1 0 16 4L12.5 7.5 4.3 5.7a.5.5 0 0 0-.6.6l1.8 5.7L3 14l2 2 3-1.5 5.7 1.8a.5.5 0 0 0 .6-.6z" />
    </>
  ),
  'scene-coffee': (
    <>
      <path d="M3 8h14a4 4 0 1 1 0 8h-1M3 8h14v6a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6zM7 1v3M11 1v3M15 1v3" />
    </>
  ),
  'scene-dumbbell': (
    <>
      <path d="M6.5 6.5 17.5 17.5M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M7 17 3 21M17 7l4-4M9.5 14.5l5-5" />
    </>
  ),
  'scene-book': (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h6" />
    </>
  ),
  'scene-briefcase': (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16M2 13h20" />
    </>
  ),
  'scene-heart': (
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  ),
  'scene-gift': (
    <>
      <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7" />
    </>
  ),
  'scene-paw': (
    <>
      <circle cx="11" cy="4" r="2" />
      <circle cx="18" cy="8" r="2" />
      <circle cx="4" cy="8" r="2" />
      <circle cx="8" cy="14" r="2" />
      <path d="M9 22c1.1 0 2-.9 2-2v-2a3 3 0 1 1 6 0v2a2 2 0 0 0 2 2" />
    </>
  ),
  'scene-shirt': (
    <>
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </>
  ),
  'scene-home': (
    <>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </>
  ),
  'scene-moon': (
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  ),
  'scene-flame': (
    <>
      <path d="M12 2s4.5 4 4.5 8.5a4.5 4.5 0 1 1-9 0C7.5 6 12 2 12 2z" />
      <path d="M12 13s2 2 2 4a2 2 0 1 1-4 0c0-2 2-4 2-4z" />
    </>
  ),
  'scene-baby': (
    <>
      <path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5M19 8A7 7 0 1 0 5 8" />
      <circle cx="12" cy="12" r="10" />
    </>
  ),
  'scene-shopping': (
    <>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
    </>
  ),
}
