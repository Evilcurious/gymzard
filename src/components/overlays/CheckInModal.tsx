import { useMemo, useState } from 'react'
import { CheckCircle2, Clock, Fingerprint, QrCode, ScanLine, Users } from 'lucide-react'
import { useApp } from '../../lib/app-context'
import { formatTime, isoDate, isoDateTime, uid } from '../../lib/utils'
import { Avatar, Badge, Button, Modal, Select } from '../ui'
import type { Attendance } from '../../types'

type Method = Attendance['method']

export function CheckInModal() {
  const { db, ui, closeOverlay, updateDb, toast, logActivity, branchId } = useApp()
  const [scanning, setScanning] = useState(false)
  const [last, setLast] = useState<{ name: string; time: string; method: Method } | null>(null)
  const [selected, setSelected] = useState('')
  const [method, setMethod] = useState<Method>('Manual')
  const today = isoDate(new Date())
  const todayRecords = useMemo(() => db.attendance.filter((a) => a.date === today && (branchId === 'all' || a.branchId === branchId)).sort((a, b) => +new Date(b.checkIn) - +new Date(a.checkIn)), [db.attendance, today, branchId])
  const inside = todayRecords.filter((a) => !a.checkOut).length

  function performCheckIn(memberId: string, checkMethod: Method) {
    const member = db.members.find((m) => m.id === memberId)
    if (!member) return
    if (member.status === 'Expired' || member.status === 'Inactive' || member.status === 'Frozen') {
      toast(`${member.name}'s membership is ${member.status.toLowerCase()}. Entry restricted.`, 'error')
      return
    }
    const now = new Date()
    updateDb((prev) => ({
      ...prev,
      attendance: [{ id: uid('att'), memberId: member.id, memberName: member.name, branchId: member.branchId, date: today, checkIn: isoDateTime(now), method: checkMethod }, ...prev.attendance],
      members: prev.members.map((m) => m.id === member.id ? { ...m, lastVisit: isoDateTime(now), attendanceCount: m.attendanceCount + 1 } : m),
    }))
    logActivity('Member check-in', `${member.name} checked in via ${checkMethod}`, 'attendance')
    setLast({ name: member.name, time: formatTime(now), method: checkMethod })
    toast(`${member.name} checked in successfully`)
  }

  function simulate(kind: Method) {
    setScanning(true)
    setLast(null)
    window.setTimeout(() => {
      const eligible = db.members.filter((m) => ['Active', 'Trial'].includes(m.status) && (branchId === 'all' || m.branchId === branchId))
      const member = eligible[Math.floor(Math.random() * eligible.length)]
      if (member) performCheckIn(member.id, kind)
      setScanning(false)
    }, 850)
  }

  return (
    <Modal open={ui.checkInOpen} onClose={closeOverlay} title="Smart attendance check-in" subtitle="Simulate QR, RFID, biometric, or manual entry in this demo." size="lg">
      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-brand-950">
            <div className="blue-grid absolute inset-0 opacity-40" />
            <div className={`relative flex h-44 w-44 items-center justify-center rounded-2xl border-2 ${scanning ? 'border-emerald-400' : 'border-white/40'} bg-white/5`}>
              <QrCode className={`h-20 w-20 text-white/80 ${scanning ? 'animate-pulse' : ''}`} />
              <span className="absolute -left-1 -top-1 h-8 w-8 rounded-tl-xl border-l-4 border-t-4 border-brand-300" />
              <span className="absolute -right-1 -top-1 h-8 w-8 rounded-tr-xl border-r-4 border-t-4 border-brand-300" />
              <span className="absolute -bottom-1 -left-1 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 border-brand-300" />
              <span className="absolute -bottom-1 -right-1 h-8 w-8 rounded-br-xl border-b-4 border-r-4 border-brand-300" />
              {scanning ? <span className="absolute left-2 right-2 h-0.5 animate-pulse bg-emerald-300 shadow-[0_0_14px_#6ee7b7]" /> : null}
            </div>
            <p className="absolute bottom-4 text-xs font-medium text-blue-200">{scanning ? 'Scanning member code…' : 'Position the member QR code inside the frame'}</p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Button size="sm" icon={ScanLine} onClick={() => simulate('QR Code')} disabled={scanning}>QR Scan</Button>
            <Button size="sm" variant="outline" icon={Users} onClick={() => simulate('RFID')} disabled={scanning}>RFID</Button>
            <Button size="sm" variant="outline" icon={Fingerprint} onClick={() => simulate('Biometric')} disabled={scanning}>Biometric</Button>
          </div>
          {last ? <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><span className="font-semibold text-emerald-800">{last.name}</span><span className="text-emerald-700">checked in · {last.time} · {last.method}</span></div> : null}
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-blue-100 bg-brand-50/60 p-3"><p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">Inside now</p><p className="mt-1 text-2xl font-extrabold text-brand-950">{inside}</p></div>
            <div className="rounded-xl border border-blue-100 bg-white p-3"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Today's visits</p><p className="mt-1 text-2xl font-extrabold text-brand-950">{todayRecords.length}</p></div>
          </div>
          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-sm font-bold text-brand-950">Manual check-in</p>
            <p className="mt-1 text-xs text-slate-500">Select a member and record the entry method.</p>
            <div className="mt-3 space-y-3">
              <Select value={selected} onChange={(e) => setSelected(e.target.value)}><option value="">Select member</option>{db.members.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.memberId}</option>)}</Select>
              <Select value={method} onChange={(e) => setMethod(e.target.value as Method)}>{['Manual', 'QR Code', 'RFID', 'Biometric'].map((m) => <option key={m} value={m}>{m}</option>)}</Select>
              <Button className="w-full" icon={CheckCircle2} disabled={!selected} onClick={() => performCheckIn(selected, method)}>Check in member</Button>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between"><p className="text-sm font-bold text-brand-950">Recent check-ins</p><Badge tone="blue"><Clock className="mr-1 h-3 w-3" />Live</Badge></div>
            <div className="max-h-52 space-y-2 overflow-y-auto pr-1">{todayRecords.slice(0, 8).map((a) => {
              const m = db.members.find((x) => x.id === a.memberId)
              return <div key={a.id} className="flex items-center gap-2.5 rounded-xl border border-blue-50 px-3 py-2"><Avatar name={a.memberName} size="xs" color={m?.status === 'Active' ? '#1557d6' : '#8b5cf6'} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-700">{a.memberName}</p><p className="text-[10px] text-slate-400">{a.method} · {formatTime(a.checkIn)}</p></div>{a.checkOut ? <Badge tone="slate">Out</Badge> : <Badge tone="green" dot>In</Badge>}</div>
            })}</div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
