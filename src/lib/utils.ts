export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function uid(prefix = 'id') {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${random}`
}

export function addDays(date: Date | string, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addMonths(date: Date | string, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function isoDate(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10)
}

export function isoDateTime(date: Date | string) {
  return new Date(date).toISOString()
}

export function formatDate(date?: string | Date, opts?: Intl.DateTimeFormatOptions) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', opts || { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatShortDate(date?: string | Date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function formatDateTime(date?: string | Date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function formatTime(date?: string | Date) {
  if (!date) return '—'
  return new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function daysUntil(date: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

export function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  return formatDate(date)
}

export function formatCurrency(value: number, symbol = 'Rs', compact = false) {
  if (compact && Math.abs(value) >= 1000000) return `${symbol} ${(value / 1000000).toFixed(1)}M`
  if (compact && Math.abs(value) >= 1000) return `${symbol} ${(value / 1000).toFixed(1)}K`
  return `${symbol} ${Math.round(value).toLocaleString('en-US')}`
}

export function initials(name: string) {
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export function seededRandom(seed: number) {
  let value = seed % 2147483647
  if (value <= 0) value += 2147483646
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

export function downloadFile(filename: string, content: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return ''
  const keys = Object.keys(rows[0])
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [keys.join(','), ...rows.map((row) => keys.map((k) => escape(row[k])).join(','))].join('\n')
}

export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const max = 320
        const ratio = Math.min(max / img.width, max / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(String(reader.result))
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = () => reject(new Error('Could not read image'))
      img.src = String(reader.result)
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export function printHtml(html: string, title = 'GymZard document') {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#122246;margin:0;padding:32px}h1{font-size:24px;margin:0 0 6px}h2{font-size:16px;margin:22px 0 8px}p{font-size:12px;color:#475569;line-height:1.6}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{text-align:left;padding:8px;border-bottom:1px solid #dbeafe;font-size:12px}th{background:#eef5ff;color:#1645aa}.badge{display:inline-block;background:#eef5ff;color:#1645aa;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:bold}.header{border-bottom:3px solid #1557d6;padding-bottom:14px;margin-bottom:18px}.footer{margin-top:28px;border-top:1px solid #dbeafe;padding-top:12px;font-size:10px;color:#94a3b8}@page{margin:14mm}
  </style></head><body>${html}</body></html>`
  document.body.appendChild(iframe)
  iframe.onload = () => {
    window.setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      window.setTimeout(() => iframe.remove(), 1500)
    }, 150)
  }
}

export function escapeHtml(value: string) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0
}
