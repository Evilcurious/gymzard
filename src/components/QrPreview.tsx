import { useMemo } from 'react'

function hash(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function QrPreview({ value, className, color = '#122246' }: { value: string; className?: string; color?: string }) {
  const cells = useMemo(() => {
    const size = 21
    const base = hash(value)
    const isFinder = (x: number, y: number, ox: number, oy: number) => {
      const dx = x - ox
      const dy = y - oy
      if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null
      const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3))
      return ring === 3 || ring <= 1
    }
    const result: { x: number; y: number }[] = []
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const f1 = isFinder(x, y, 0, 0)
        const f2 = isFinder(x, y, size - 7, 0)
        const f3 = isFinder(x, y, 0, size - 7)
        if (f1 !== null || f2 !== null || f3 !== null) {
          if (f1 || f2 || f3) result.push({ x, y })
          continue
        }
        const noise = hash(`${base}:${x}:${y}`)
        if (noise % 100 < 47) result.push({ x, y })
      }
    }
    return result
  }, [value])

  return (
    <svg viewBox="0 0 23 23" className={className} role="img" aria-label={`Demo QR code for ${value}`} shapeRendering="crispEdges">
      <rect width="23" height="23" fill="white" />
      {cells.map(({ x, y }) => <rect key={`${x}-${y}`} x={x + 1} y={y + 1} width="1" height="1" fill={color} />)}
    </svg>
  )
}
