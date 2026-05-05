/**
 * 应用标识图标组件 - 与打包 app icon 同主题的迷你版
 * 粉紫渐变圆角方块 + 立体小纸飞机
 */
interface AppLogoProps {
  size?: number
  className?: string
}

export default function AppLogo({ size = 28, className }: AppLogoProps) {
  // 同一个文档里可能会用多次, 用稳定 id 避免 SVG filter/gradient 冲突
  const gid = 'applogo'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="朋友圈文案助手"
      role="img"
    >
      <defs>
        <linearGradient id={`${gid}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF85A1" />
          <stop offset="55%" stopColor="#E2558D" />
          <stop offset="100%" stopColor="#7B2FCB" />
        </linearGradient>
        <linearGradient id={`${gid}-plane`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F2E8F9" />
        </linearGradient>
        <linearGradient id={`${gid}-plane2`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C0A9D9" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#8B5CB8" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      {/* 背景圆角方块 */}
      <rect
        x="0"
        y="0"
        width="64"
        height="64"
        rx="14"
        ry="14"
        fill={`url(#${gid}-bg)`}
      />
      {/* 左上角柔光 */}
      <ellipse cx="18" cy="14" rx="24" ry="18" fill="#FFFFFF" opacity="0.25" />
      {/* 立体纸飞机 */}
      <g transform="translate(32 33) rotate(-8) translate(-32 -33)">
        {/* 下翼 (折面暗色) */}
        <path
          d="M 16 40 L 34 42 L 32 51 Z"
          fill={`url(#${gid}-plane2)`}
        />
        {/* 主机身 */}
        <path
          d="M 52 16 L 16 40 L 34 42 L 48 36 Z"
          fill={`url(#${gid}-plane)`}
        />
        {/* 右翼折面 */}
        <path
          d="M 52 16 L 48 36 L 41 40 L 37 46 L 34.5 38 Z"
          fill={`url(#${gid}-plane2)`}
        />
        {/* 中缝折痕高光 */}
        <path
          d="M 52 16 L 34 42"
          stroke="#FFFFFF"
          strokeWidth="1.1"
          strokeLinecap="round"
          opacity="0.9"
          fill="none"
        />
      </g>
    </svg>
  )
}
