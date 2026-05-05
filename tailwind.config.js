/** @type {import('tailwindcss').Config} */
// 设计系统 - Material Design 3 / Google 风格
// Primary: Google Blue (#1a73e8) 变种 / Material You purple-blue (#6750a4)
// 中性表面用稍带 primary 色调的灰 (surface tint)

module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '"Google Sans"',
          '"Google Sans Text"',
          'Roboto',
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Segoe UI"',
          '"Helvetica Neue"',
          'sans-serif',
        ],
        display: [
          '"Google Sans"',
          'Inter',
          '-apple-system',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
      fontSize: {
        // M3 type scale
        'display-sm': ['28px', { lineHeight: '36px', letterSpacing: '0' }],
        'headline-sm': ['22px', { lineHeight: '28px', letterSpacing: '0' }],
        'title-lg': ['18px', { lineHeight: '24px', letterSpacing: '0' }],
        'title-md': ['15px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '600' }],
        'title-sm': ['13px', { lineHeight: '18px', letterSpacing: '0.01em', fontWeight: '600' }],
        'body-lg': ['15px', { lineHeight: '22px', letterSpacing: '0.005em' }],
        'body-md': ['14px', { lineHeight: '20px', letterSpacing: '0.01em' }],
        'body-sm': ['12.5px', { lineHeight: '18px', letterSpacing: '0.015em' }],
        'label-lg': ['13px', { lineHeight: '18px', letterSpacing: '0.02em', fontWeight: '500' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.04em', fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '14px', letterSpacing: '0.05em', fontWeight: '500' }],
      },
      colors: {
        // Primary - Material 3 purple (tinted)
        primary: {
          0: '#000000',
          10: '#21005d',
          20: '#381e72',
          30: '#4f378b',
          40: '#6750a4',
          50: '#7f67be',
          60: '#9a82db',
          70: '#b69df8',
          80: '#d0bcff',
          90: '#eaddff',
          95: '#f6edff',
          99: '#fffbfe',
          100: '#ffffff',
          DEFAULT: '#6750a4',
        },
        // Secondary - warm coral/pink for 朋友圈 vibe
        secondary: {
          10: '#2b1700',
          20: '#452b0b',
          30: '#624020',
          40: '#7d5734',
          50: '#996f4a',
          60: '#b68962',
          70: '#d5a27c',
          80: '#f3bd96',
          90: '#ffdcbe',
          95: '#ffede0',
          99: '#fffbf8',
          DEFAULT: '#7d5734',
        },
        // Tertiary - Google-blue for accents
        tertiary: {
          40: '#1a73e8',
          80: '#a7c8ff',
          90: '#d3e3fd',
          95: '#ecf3fe',
        },
        // Error
        error: {
          40: '#ba1a1a',
          80: '#ffb4ab',
          90: '#ffdad6',
          95: '#ffedea',
        },
        // Success (Google green)
        success: {
          40: '#137333',
          80: '#81c995',
          90: '#ceead6',
        },
        // Surface levels (Material 3 surface container)
        surface: {
          dim: '#ded8e1',
          DEFAULT: '#fdf8fd',
          bright: '#fef7ff',
          'container-lowest': '#ffffff',
          'container-low': '#f7f2fa',
          container: '#f3edf7',
          'container-high': '#ece6f0',
          'container-highest': '#e6e0e9',
        },
        // Text on surface
        'on-surface': '#1d1b20',
        'on-surface-variant': '#49454f',
        outline: '#79747e',
        'outline-variant': '#cac4d0',
      },
      boxShadow: {
        // M3 elevation
        'el-1': '0 1px 2px 0 rgba(0,0,0,0.05), 0 1px 3px 1px rgba(0,0,0,0.06)',
        'el-2': '0 1px 2px 0 rgba(0,0,0,0.05), 0 2px 6px 2px rgba(0,0,0,0.08)',
        'el-3': '0 1px 3px 0 rgba(0,0,0,0.05), 0 4px 10px 4px rgba(0,0,0,0.08)',
        'el-4': '0 2px 3px 0 rgba(0,0,0,0.05), 0 6px 16px 4px rgba(0,0,0,0.1)',
        'el-5': '0 4px 8px 0 rgba(0,0,0,0.08), 0 8px 24px 8px rgba(0,0,0,0.12)',
        'focus-ring': '0 0 0 3px rgba(103,80,164,0.18)',
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '28px',
        '3xl': '36px',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.2, 0, 0, 1)',
        'slide-down': 'slideDown 0.25s cubic-bezier(0.2, 0, 0, 1)',
        'scale-in': 'scaleIn 0.22s cubic-bezier(0.2, 0, 0, 1)',
        shimmer: 'shimmer 1.8s infinite linear',
        'spin-slow': 'spin 1.2s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'emphasized': 'cubic-bezier(0.2, 0, 0, 1)',
        'emphasized-decel': 'cubic-bezier(0.05, 0.7, 0.1, 1)',
        'emphasized-accel': 'cubic-bezier(0.3, 0, 0.8, 0.15)',
        'standard': 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
}
