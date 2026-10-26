import { Copy, CreditCard, Printer, ShieldCheck, X } from 'lucide-react'
import { useApp } from '../../lib/app-context'
import { formatDate } from '../../lib/utils'
import { QrPreview } from '../QrPreview'
import { Badge, Button } from '../ui'

export function DigitalCardModal() {
  const { db, ui, closeOverlay, toast } = useApp()
  const member = db.members.find((m) => m.id === ui.cardId)
  if (!member) return null
  const plan = db.plans.find((p) => p.id === member.planId)
  const branch = db.branches.find((b) => b.id === member.branchId)

  async function copyId() {
    try {
      await navigator.clipboard.writeText(member!.memberId)
      toast('Member ID copied to clipboard')
    } catch {
      toast(`Member ID: ${member!.memberId}`, 'info')
    }
  }

  return (
    <div className="card-overlay fixed inset-0 z-[95] flex items-center justify-center bg-brand-950/50 p-4 backdrop-blur-[2px]">
      <div className="card-actions no-print absolute top-5 right-5 flex gap-2">
        <Button variant="outline" icon={Copy} onClick={copyId} className="!bg-white">Copy ID</Button>
        <Button icon={Printer} onClick={() => window.print()}>Print card</Button>
        <Button variant="ghost" size="icon" onClick={closeOverlay} className="!bg-white/90 !text-slate-700"><X className="h-5 w-5" /></Button>
      </div>
      <div className="card-sheet w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-fade-up">
        <div className="blue-gradient relative overflow-hidden px-6 py-6 text-white">
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[28px] border-white/5" />
          <div className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full border-[22px] border-white/5" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-2"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-brand-700">GZ</span><div><p className="text-sm font-extrabold leading-tight">{db.settings.gymName}</p><p className="text-[10px] uppercase tracking-widest text-blue-200">Digital Membership</p></div></div>
            <ShieldCheck className="h-6 w-6 text-blue-200" />
          </div>
          <div className="relative mt-8 flex items-end justify-between gap-4">
            <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Member</p><h3 className="mt-1 truncate text-2xl font-extrabold">{member.name}</h3><p className="mt-1 font-mono text-sm tracking-wider text-blue-100">{member.memberId}</p></div>
            <div className="shrink-0 rounded-xl bg-white p-1.5"><QrPreview value={member.memberId} className="h-20 w-20" /></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px bg-blue-100">
          <div className="bg-white px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Plan</p><p className="mt-1 truncate text-sm font-extrabold text-brand-950">{plan?.name}</p></div>
          <div className="bg-white px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Valid until</p><p className="mt-1 text-sm font-extrabold text-brand-950">{formatDate(member.expiresAt)}</p></div>
          <div className="bg-white px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Home branch</p><p className="mt-1 truncate text-sm font-extrabold text-brand-950">{branch?.name}</p></div>
          <div className="bg-white px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</p><div className="mt-1"><Badge tone={member.status === 'Active' ? 'green' : member.status === 'Frozen' ? 'purple' : 'amber'} dot>{member.status}</Badge></div></div>
        </div>
        <div className="flex items-center gap-3 border-t border-blue-50 px-5 py-4">
          <CreditCard className="h-5 w-5 text-brand-600" />
          <p className="text-xs leading-relaxed text-slate-500">Show this QR code at the front desk for a contactless check-in. This is a demo QR pattern for prototype testing.</p>
        </div>
      </div>
    </div>
  )
}
