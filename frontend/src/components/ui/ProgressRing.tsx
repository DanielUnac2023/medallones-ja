interface ProgressRingProps {
  porcentaje: number // 0-100
  tamaño?: number
  color?: string
  grosor?: number
  children?: React.ReactNode
}

/** Anillo circular animado (stroke-dashoffset), igual que el hero del mockup. */
export function ProgressRing({
  porcentaje,
  tamaño = 160,
  color = '#ffd700',
  grosor = 8,
  children,
}: ProgressRingProps) {
  const r = tamaño / 2 - grosor / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(100, Math.max(0, porcentaje)) / 100)

  return (
    <div className="relative" style={{ width: tamaño, height: tamaño }}>
      <svg className="h-full w-full" viewBox={`0 0 ${tamaño} ${tamaño}`}>
        <circle
          className="text-white/5"
          cx={tamaño / 2}
          cy={tamaño / 2}
          r={r}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={grosor}
        />
        <circle
          className="progress-ring-circle"
          cx={tamaño / 2}
          cy={tamaño / 2}
          r={r}
          fill="transparent"
          stroke={color}
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}
