import React, { useEffect } from 'react'
import {
  AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, Info, Search, TrendingDown,
  TrendingUp, X, type LucideIcon,
} from 'lucide-react'
import { cn, initials } from '../lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'soft'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export function Button({
  variant = 'primary', size = 'md', className, children, icon: Icon, loading, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  loading?: boolean
}) {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus:ring-brand-200',
    secondary: 'bg-brand-950 text-white hover:bg-brand-900 focus:ring-brand-200',
    outline: 'border border-blue-200 bg-white text-brand-700 hover:bg-brand-50 focus:ring-brand-100',
    ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-200',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-200',
    soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100 focus:ring-brand-100',
  }
  const sizes: Record<ButtonSize, string> = {
    sm: 'h-8 gap-1.5 px-3 text-xs',
    md: 'h-10 gap-2 px-4 text-sm',
    lg: 'h-11 gap-2 px-5 text-sm',
    icon: 'h-9 w-9 justify-center p-0',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-xl font-semibold transition focus:outline-none focus:ring-4 disabled:opacity-50',
        variants[variant], sizes[size], className,
      )}
      {...props}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  )
}

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('surface', className)} {...props}>{children}</div>
}

export function CardHeader({ title, subtitle, action, className }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3 border-b border-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div>
        <h3 className="text-[15px] font-bold text-brand-950">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

export type BadgeTone = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate' | 'cyan'
const badgeTones: Record<BadgeTone, string> = {
  blue: 'bg-brand-50 text-brand-700 ring-brand-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  red: 'bg-rose-50 text-rose-700 ring-rose-100',
  purple: 'bg-violet-50 text-violet-700 ring-violet-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
}
export function Badge({ children, tone = 'blue', dot, className }: { children: React.ReactNode; tone?: BadgeTone; dot?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset', badgeTones[tone], className)}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}

export function statusTone(status: string): BadgeTone {
  const s = status.toLowerCase()
  if (['active', 'paid', 'completed', 'open', 'sent', 'confirmed', 'excellent', 'converted'].some((x) => s.includes(x))) return 'green'
  if (['pending', 'partial', 'scheduled', 'trial', 'contacted', 'new', 'waitlisted', 'good', 'draft'].some((x) => s.includes(x))) return 'amber'
  if (['expired', 'cancelled', 'inactive', 'failed', 'lost', 'refunded', 'needs service', 'closed'].some((x) => s.includes(x))) return 'red'
  if (['frozen', 'on leave', 'personal training'].some((x) => s.includes(x))) return 'purple'
  if (['scheduled', 'qr code', 'biometric'].some((x) => s.includes(x))) return 'cyan'
  return 'blue'
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)} dot>{status}</Badge>
}

export function Avatar({ name, src, size = 'md', color, className }: { name: string; src?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; color?: string; className?: string }) {
  const sizes = { xs: 'h-7 w-7 text-[10px]', sm: 'h-9 w-9 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-20 w-20 text-xl' }
  return src ? (
    <img src={src} alt={name} className={cn('shrink-0 rounded-full object-cover ring-2 ring-white', sizes[size], className)} />
  ) : (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white ring-2 ring-white', sizes[size], className)}
      style={{ backgroundColor: color || '#1557d6' }}
    >{initials(name)}</span>
  )
}

export function Field({ label, hint, required, children, className, span }: { label: string; hint?: string; required?: boolean; children: React.ReactNode; className?: string; span?: 1 | 2 }) {
  return (
    <div className={cn(span === 2 && 'sm:col-span-2', className)}>
      <label className="label-base">
        {label}{required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  )
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('input-base', className)} {...props} />
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn('input-base appearance-none pr-9', className)} {...props}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('input-base resize-y', className)} {...props} />
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className, autoFocus }: { value: string; onChange: (value: string) => void; placeholder?: string; className?: string; autoFocus?: boolean }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-base h-10 pl-10" />
      {value ? <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button> : null}
    </div>
  )
}

export function Modal({
  open, onClose, title, subtitle, children, footer, size = 'md', className,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  subtitle?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' }
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-brand-950/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cn('relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-up', widths[size], className)}>
        <div className="flex items-start justify-between gap-4 border-b border-blue-50 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-extrabold text-brand-950">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-blue-50 bg-slate-50/60 px-5 py-3.5 sm:px-6">{footer}</div> : null}
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'max-w-xl' }: {
  open: boolean; onClose: () => void; title: React.ReactNode; subtitle?: React.ReactNode;
  children: React.ReactNode; footer?: React.ReactNode; width?: string;
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[85]">
      <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside className={cn('absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl animate-slide-in', width)}>
        <div className="flex items-start justify-between border-b border-blue-50 px-5 py-4">
          <div><h2 className="text-lg font-extrabold text-brand-950">{title}</h2>{subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}</div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? <div className="border-t border-blue-50 bg-white px-5 py-3">{footer}</div> : null}
      </aside>
    </div>
  )
}

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
  headClassName?: string
  align?: 'left' | 'center' | 'right'
}

export function DataTable<T>({ columns, rows, onRowClick, empty, compact, className, rowKey }: {
  columns: Column<T>[]
  rows: T[]
  onRowClick?: (row: T) => void
  empty?: React.ReactNode
  compact?: boolean
  className?: string
  rowKey: (row: T) => string
}) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full min-w-[680px] border-collapse">
        <thead className="bg-slate-50/90"><tr>{columns.map((c) => <th key={c.key} className={cn('table-head', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.headClassName)}>{c.header}</th>)}</tr></thead>
        <tbody className="divide-y divide-blue-50">
          {rows.length ? rows.map((row) => (
            <tr key={rowKey(row)} onClick={() => onRowClick?.(row)} className={cn('transition hover:bg-brand-50/50', onRowClick && 'cursor-pointer')}>
              {columns.map((c) => <td key={c.key} className={cn('table-cell', compact && 'py-2.5', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.className)}>{c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-400">{empty || 'No records found.'}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function Tabs({ items, value, onChange, className }: { items: { id: string; label: string; count?: number; icon?: LucideIcon }[]; value: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b border-blue-100', className)}>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button key={item.id} onClick={() => onChange(item.id)} className={cn(
            'relative inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold transition',
            value === item.id ? 'text-brand-700' : 'text-slate-500 hover:text-brand-600',
          )}>
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}{item.label}
            {typeof item.count === 'number' ? <span className={cn('rounded-full px-1.5 py-0.5 text-[10px]', value === item.id ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500')}>{item.count}</span> : null}
            {value === item.id ? <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" /> : null}
          </button>
        )
      })}
    </div>
  )
}

export function StatCard({ title, value, icon: Icon, change, tone = 'blue', hint, children, className }: {
  title: string; value: React.ReactNode; icon: LucideIcon; change?: number; hint?: string; tone?: BadgeTone; children?: React.ReactNode; className?: string;
}) {
  const tones: Record<BadgeTone, string> = {
    blue: 'bg-brand-50 text-brand-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600',
    red: 'bg-rose-50 text-rose-600', purple: 'bg-violet-50 text-violet-600', slate: 'bg-slate-100 text-slate-600', cyan: 'bg-cyan-50 text-cyan-600',
  }
  const up = (change ?? 0) >= 0
  return (
    <Card className={cn('relative overflow-hidden p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-brand-950">{value}</p>
          <div className="mt-2 flex min-h-[20px] items-center gap-2">
            {typeof change === 'number' ? <span className={cn('inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold', up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>{up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{Math.abs(change)}%</span> : null}
            {hint ? <span className="truncate text-[11px] text-slate-400">{hint}</span> : null}
          </div>
        </div>
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tones[tone])}><Icon className="h-5 w-5" /></span>
      </div>
      {children}
    </Card>
  )
}

export function PageHeader({ title, subtitle, eyebrow, actions, className }: { title: string; subtitle?: string; eyebrow?: string; actions?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div>
        {eyebrow ? <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-500">{eyebrow}</p> : null}
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-950 sm:text-[28px]">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function ProgressBar({ value, max = 100, tone = 'blue', className, showLabel }: { value: number; max?: number; tone?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan'; className?: string; showLabel?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100))
  const colors = { blue: 'bg-brand-600', green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-rose-500', purple: 'bg-violet-500', cyan: 'bg-cyan-500' }
  return (
    <div className={cn('w-full', className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={cn('meter-fill h-full rounded-full', colors[tone])} style={{ width: `${pct}%` }} />
      </div>
      {showLabel ? <p className="mt-1 text-[11px] font-semibold text-slate-500">{Math.round(pct)}%</p> : null}
    </div>
  )
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <span><span className="block text-sm font-semibold text-slate-700">{label}</span>{description ? <span className="mt-0.5 block text-xs text-slate-400">{description}</span> : null}</span>
      <button type="button" onClick={() => onChange(!checked)} className={cn('relative h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-brand-600' : 'bg-slate-300')}>
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </button>
    </label>
  )
}

export function EmptyState({ icon: Icon = Info, title, description, action }: { icon?: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500"><Icon className="h-7 w-7" /></span>
      <h3 className="text-sm font-bold text-brand-950">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function ToastViewport({ toasts, dismiss }: { toasts: { id: string; message: string; tone: 'success' | 'info' | 'warning' | 'error' }[]; dismiss: (id: string) => void }) {
  const icons = { success: CheckCircle2, info: Info, warning: AlertTriangle, error: AlertCircle }
  const tones = { success: 'text-emerald-600', info: 'text-brand-600', warning: 'text-amber-600', error: 'text-rose-600' }
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.tone]
        return (
          <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-blue-100 bg-white p-3.5 shadow-soft animate-fade-up">
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', tones[t.tone])} />
            <p className="flex-1 text-sm font-medium text-slate-700">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
          </div>
        )
      })}
    </div>
  )
}

export function MiniMetric({ label, value, tone = 'text-brand-950' }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-xl border border-blue-50 bg-brand-50/40 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={cn('mt-1 text-lg font-extrabold', tone)}>{value}</p>
    </div>
  )
}
