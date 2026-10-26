import { CheckCircle2, Download, Printer, X } from 'lucide-react'
import { useApp } from '../../lib/app-context'
import { formatCurrency, formatDate } from '../../lib/utils'
import { Badge, Button } from '../ui'

export function ReceiptModal() {
  const { db, ui, closeOverlay, toast } = useApp()
  const payment = db.payments.find((p) => p.id === ui.receiptId)
  if (!payment) return null
  const plan = db.plans.find((p) => p.id === payment.planId)
  const branch = db.branches.find((b) => b.id === payment.branchId)
  const member = db.members.find((m) => m.id === payment.memberId)
  const currency = db.settings.currency
  const balance = Math.max(0, payment.total - payment.paid)

  function print() {
    window.print()
  }

  return (
    <div className="receipt-overlay fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto bg-brand-950/50 p-3 backdrop-blur-[2px] sm:p-6">
      <div className="receipt-actions no-print absolute top-4 right-4 flex gap-2 sm:top-6 sm:right-6">
        <Button variant="outline" icon={Download} onClick={() => { toast('Use your browser’s “Save as PDF” option in the print dialog', 'info'); setTimeout(print, 250) }} className="!bg-white">Download PDF</Button>
        <Button icon={Printer} onClick={print}>Print receipt</Button>
        <Button variant="ghost" size="icon" onClick={closeOverlay} className="!bg-white/90 !text-slate-700"><X className="h-5 w-5" /></Button>
      </div>
      <div className="receipt-sheet my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="blue-gradient px-7 py-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-700">GZ</span><div><p className="text-lg font-extrabold leading-tight">{db.settings.gymName}</p><p className="text-xs text-blue-100">{db.settings.tagline}</p></div></div>
              <p className="mt-4 max-w-xs text-xs leading-relaxed text-blue-100">{db.settings.address}<br />{db.settings.phone} · {db.settings.email}</p>
            </div>
            <div className="text-right"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">Invoice</p><p className="mt-1 text-xl font-extrabold">{payment.invoiceNo}</p><Badge tone={payment.status === 'Paid' ? 'green' : payment.status === 'Partial' ? 'amber' : 'red'} className="mt-2">{payment.status}</Badge></div>
          </div>
        </div>
        <div className="px-7 py-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Billed to</p><p className="mt-1.5 text-sm font-extrabold text-brand-950">{payment.memberName}</p><p className="text-xs text-slate-500">{member?.memberId} · {member?.phone}</p><p className="text-xs text-slate-500">{member?.email}</p></div>
            <div className="sm:text-right"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Invoice details</p><p className="mt-1.5 text-xs text-slate-600">Issue date: <span className="font-semibold text-slate-800">{formatDate(payment.date)}</span></p><p className="text-xs text-slate-600">Due date: <span className="font-semibold text-slate-800">{formatDate(payment.dueDate)}</span></p><p className="text-xs text-slate-600">Branch: <span className="font-semibold text-slate-800">{branch?.name}</span></p></div>
          </div>
          <div className="mt-6 overflow-hidden rounded-xl border border-blue-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-50 text-[11px] font-bold uppercase tracking-wider text-brand-700"><tr><th className="px-4 py-3">Description</th><th className="px-4 py-3 text-right">Amount</th></tr></thead>
              <tbody className="divide-y divide-blue-50 text-slate-600">
                <tr><td className="px-4 py-3"><p className="font-semibold text-slate-800">{plan?.name || 'Membership plan'}</p><p className="text-xs text-slate-400">Membership subscription · {plan?.durationDays || 30} days</p></td><td className="px-4 py-3 text-right font-semibold">{formatCurrency(payment.subtotal, currency)}</td></tr>
                {payment.discount > 0 ? <tr><td className="px-4 py-3">Discount / coupon</td><td className="px-4 py-3 text-right text-emerald-600">− {formatCurrency(payment.discount, currency)}</td></tr> : null}
                <tr><td className="px-4 py-3">GST / Tax ({db.settings.taxRate}%)</td><td className="px-4 py-3 text-right">{formatCurrency(payment.tax, currency)}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex justify-end"><div className="w-full max-w-xs space-y-2 text-sm"><div className="flex justify-between text-slate-500"><span>Total</span><span className="font-extrabold text-brand-950">{formatCurrency(payment.total, currency)}</span></div><div className="flex justify-between text-slate-500"><span>Paid</span><span className="font-semibold text-emerald-600">{formatCurrency(payment.paid, currency)}</span></div><div className="flex justify-between border-t border-dashed border-blue-200 pt-2 text-base font-extrabold text-brand-950"><span>Balance due</span><span>{formatCurrency(balance, currency)}</span></div></div></div>
          <div className="mt-7 grid gap-4 border-t border-blue-100 pt-5 sm:grid-cols-2">
            <div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Payment information</p><p className="mt-1.5 text-xs text-slate-600">Method: <span className="font-semibold text-slate-800">{payment.method}</span></p><p className="text-xs text-slate-600">Gateway / reference: <span className="font-semibold text-slate-800">{payment.gateway || 'Manual'}</span></p>{payment.note ? <p className="mt-1 text-xs text-slate-500">Note: {payment.note}</p> : null}</div>
            <div className="flex items-end justify-start gap-2 sm:justify-end"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><p className="max-w-[220px] text-xs leading-relaxed text-slate-500">This is a demo receipt generated by GymZard. No real payment was processed.</p></div>
          </div>
          <p className="mt-6 text-center text-[11px] font-medium text-slate-400">Thank you for training with {db.settings.gymName}.</p>
        </div>
      </div>
    </div>
  )
}
