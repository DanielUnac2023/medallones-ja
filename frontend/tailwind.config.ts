import type { Config } from 'tailwindcss'

/** hex -> "r g b / <alpha-value>" para que Tailwind pueda aplicar /10, /20, etc. */
const withAlpha = (hex: string) => {
  const n = hex.replace('#', '')
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return `rgb(${r} ${g} ${b} / <alpha-value>)`
}

/**
 * Tokens extraídos 1:1 de DESIGN.md (sistema "Kinetic Glass").
 * No inventar colores nuevos: usar estas clases semánticas.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: withAlpha('#10131a'),
        'surface-dim': withAlpha('#10131a'),
        'surface-bright': withAlpha('#363940'),
        'surface-container-lowest': withAlpha('#0b0e14'),
        'surface-container-low': withAlpha('#191c22'),
        'surface-container': withAlpha('#1d2026'),
        'surface-container-high': withAlpha('#272a31'),
        'surface-container-highest': withAlpha('#32353c'),
        'on-surface': withAlpha('#e1e2eb'),
        'on-surface-variant': withAlpha('#d0c6ab'),
        'inverse-surface': withAlpha('#e1e2eb'),
        'inverse-on-surface': withAlpha('#2e3037'),
        outline: withAlpha('#999077'),
        'outline-variant': withAlpha('#4d4732'),
        'surface-tint': withAlpha('#e9c400'),
        primary: withAlpha('#fff6df'),
        'on-primary': withAlpha('#3a3000'),
        'primary-container': withAlpha('#ffd700'),
        'on-primary-container': withAlpha('#705e00'),
        'inverse-primary': withAlpha('#705d00'),
        secondary: withAlpha('#adc7ff'),
        'on-secondary': withAlpha('#002e68'),
        'secondary-container': withAlpha('#4a8eff'),
        'on-secondary-container': withAlpha('#00285b'),
        tertiary: withAlpha('#e0ffda'),
        'on-tertiary': withAlpha('#00390f'),
        'tertiary-container': withAlpha('#7af386'),
        'on-tertiary-container': withAlpha('#006f25'),
        error: withAlpha('#ffb4ab'),
        'on-error': withAlpha('#690005'),
        'error-container': withAlpha('#93000a'),
        'on-error-container': withAlpha('#ffdad6'),
        'primary-fixed': withAlpha('#ffe16d'),
        'primary-fixed-dim': withAlpha('#e9c400'),
        'on-primary-fixed': withAlpha('#221b00'),
        'on-primary-fixed-variant': withAlpha('#544600'),
        'secondary-fixed': withAlpha('#d8e2ff'),
        'secondary-fixed-dim': withAlpha('#adc7ff'),
        'on-secondary-fixed': withAlpha('#001a41'),
        'on-secondary-fixed-variant': withAlpha('#004493'),
        'tertiary-fixed': withAlpha('#83fc8e'),
        'tertiary-fixed-dim': withAlpha('#66df75'),
        'on-tertiary-fixed': withAlpha('#002106'),
        'on-tertiary-fixed-variant': withAlpha('#00531a'),
        background: withAlpha('#10131a'),
        'on-background': withAlpha('#e1e2eb'),
        'surface-variant': withAlpha('#32353c'),
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '800' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '20px', letterSpacing: '0.05em', fontWeight: '600' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      spacing: {
        base: '8px',
        xs: '4px',
        sm: '12px',
        md: '24px',
        lg: '48px',
        xl: '80px',
        gutter: '24px',
        'margin-mobile': '16px',
        'margin-desktop': '64px',
      },
    },
  },
  plugins: [],
}

export default config