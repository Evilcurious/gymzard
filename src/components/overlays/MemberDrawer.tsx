import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRightLeft, Ban, CalendarDays, CheckCircle2, Clock, CreditCard, Dumbbell, FileText,
  HeartPulse, Mail, MapPin, Phone, Plus, Printer, Save, Snowflake, StickyNote, Upload,
  UserPlus, Utensils, X,
} from 'lucide-react'
import { useApp } from '../../lib/app-context'
import { useActions } from '../../lib/actions'
import { daysUntil, formatCurrency, formatDate, formatDateTime, formatTime, isoDateTime, uid } from '../../lib/utils'
import { Avatar, Badge, Button, Drawer, EmptyState, MiniMetric, ProgressBar, StatusBadge, Tabs, Textarea } from '../ui'

const tabItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'membership', label: 'Membership' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'payments', label: 'Payments' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'notes', label: 'Notes' },
  { id: 'documents', label: 'Documents' },
]

export function MemberDrawer() {
  const { db, ui, closeOverlay, updateDb, toast, logActivity, openCard, openReceipt } = useApp()
  const actions = useActions()
  const [tab, setTab] = useState('overview')
  const [notes, setNotes] = useState('')
  const member = db.members.find((m) => m.id === ui.memberDetailId)

  useEffect(() => {
    setTab('overview')
    setNotes(member?.notes || '')
  }, [ui.memberDetailId, member?.notes])

  const plan = db.plans.find((p) => p.id === member?.planId)
  const branch = db.branches.find((b) => b.id === member?.branchId)
  const currency = db.settings.currency
  const data = useMemo(() => ({
    attendance: db.attendance.filter((a) => a.memberId === member?.id).sort((a, b) => +new Date(b.checkIn) - +new Date(a.checkIn)).slice(0, 12),
    payments: db.payments.filter((p) => p.memberId === member?.id).sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 12),
    workouts: db.workoutPlans.filter((w) => w.memberId === member?.id),
    diets: db.dietPlans.filter((d) => d.memberId === member?.id),
    progress: db.progress.filter((p) => p.memberId === member?.id).sort((a, b) => +new Date(b.date) - +new Date(a.date)),
  }), [db, member?.id])

  if (!member) return null
  const remaining = daysUntil(member.expiresAt)
  const planProgress = plan ? Math.min(100, Math.max(0, Math.round(((plan.durationDays - Math.max(0, remaining)) / plan.durationDays) * 100))) : 0

  function checkIn(method: 'QR Code' | 'Manual' = 'Manual') {
    if (!member) return
    if (member.status === 'Expired' || member.status === 'Inactive') {
      toast(`${member.name}'s membership is not active. Renew before check-in.`, 'error')
      return
    }
    const now = new Date()
    updateDb((prev) => ({
      ...prev,
      attendance: [{ id: uid('att'), memberId: member.id, memberName: member.name, branchId: member.branchId, date: now.toISOString().slice(0, 10), checkIn: isoDateTime(now), method }, ...prev.attendance],
      members: prev.members.map((m) => m.id === member.id ? { ...m, lastVisit: isoDateTime(now), attendanceCount: m.attendanceCount + 1 } : m),
    }))
    logActivity('Member check-in', `${member.name} checked in via ${method}`, 'attendance')
    toast(`${member.name} checked in successfully`)
  }

  function cancelMembership() {
    if (!member) return
    if (!window.confirm(`Cancel ${member.name}'s membership? You can reactivate later by renewing.`)) return
    updateDb((prev) => ({ ...prev, members: prev.members.map((m) => m.id === member.id ? { ...m, status: 'Inactive' } : m) }))
    logActivity('Membership cancelled', `${member.name}'s membership was cancelled`, 'member')
    toast('Membership cancelled', 'warning')
  }

  function unfreeze() {
    if (!member) return
    updateDb((prev) => ({ ...prev, members: prev.members.map((m) => m.id === member.id ? { ...m, status: 'Active' } : m) }))
    toast('Membership reactivated')
  }

  function saveNotes() {
    if (!member) return
    updateDb((prev) => ({ ...prev, members: prev.members.map((m) => m.id === member.id ? { ...m, notes } : m) }))
    toast('Member notes saved')
  }

  return (
    <Drawer
      open={!!member}
      onClose={closeOverlay}
      width="max-w-2xl"
      title={<span className="flex items-center gap-2"><span>Member profile</span><StatusBadge status={member.status} /></span>}
      subtitle={`${member.memberId} · Registered ${formatDate(member.joinedAt)}`}
      footer={
        <div className="no-print flex flex-wrap gap-2">
          <Button size="sm" icon={CreditCard} onClick={() => actions.openRenewForm(member)}>Renew</Button>
          <Button size="sm" variant="outline" icon={Printer} onClick={() => openCard(member.id)}>Digital card</Button>
          <Button size="sm" variant="outline" icon={CheckCircle2} onClick={() => checkIn('Manual')}>Check-in</Button>
          <Button size="sm" variant="ghost" icon={X} onClick={closeOverlay}>Close</Button>
        </div>
      }
    >
      <div className="no-print">
        <div className="blue-gradient px-5 py-6 text-white">
          <div className="flex items-start gap-4">
            <Avatar name={member.name} src={member.photo} size="xl" className="!ring-white/40" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xl font-extrabold">{member.name}</h3>
              <p className="mt-0.5 text-sm text-blue-100">{member.memberId} · {branch?.name}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="blue" className="!bg-white/15 !text-white !ring-white/20">{plan?.name}</Badge>
                <Badge tone="blue" className="!bg-white/15 !text-white !ring-white/20">{member.gender}</Badge>
                {member.tags.slice(0, 2).map((t) => <Badge key={t} tone="blue" className="!bg-white/15 !text-white !ring-white/20">{t}</Badge>)}
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/10 px-2 py-2.5"><p className="text-lg font-extrabold">{member.attendanceCount}</p><p className="text-[10px] uppercase tracking-wide text-blue-100">Visits</p></div>
            <div className="rounded-xl bg-white/10 px-2 py-2.5"><p className="text-lg font-extrabold">{member.healthScore}</p><p className="text-[10px] uppercase tracking-wide text-blue-100">Health score</p></div>
            <div className="rounded-xl bg-white/10 px-2 py-2.5"><p className="text-lg font-extrabold">{member.engagementScore}</p><p className="text-[10px] uppercase tracking-wide text-blue-100">Engagement</p></div>
          </div>
        </div>
        <div className="px-5 pt-4"><Tabs items={tabItems} value={tab} onChange={setTab} /></div>
      </div>

      <div className="space-y-4 px-5 py-5">
        {tab === 'overview' ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniMetric label="Expiry" value={formatDate(member.expiresAt)} />
              <MiniMetric label="Days left" value={remaining >= 0 ? remaining : 'Expired'} tone={remaining < 8 ? 'text-rose-600' : 'text-brand-950'} />
              <MiniMetric label="Outstanding" value={formatCurrency(member.dueAmount, currency)} tone={member.dueAmount > 0 ? 'text-amber-600' : 'text-emerald-600'} />
              <MiniMetric label="Auto-renew" value={member.autoRenew ? 'On' : 'Off'} />
            </div>
            <div className="surface !shadow-none">
              <div className="border-b border-blue-50 px-4 py-3 text-sm font-bold text-brand-950">Contact & personal information</div>
              <div className="grid gap-3 p-4 text-sm sm:grid-cols-2">
                <Info icon={Mail} label="Email" value={member.email} />
                <Info icon={Phone} label="Phone" value={member.phone} />
                <Info icon={CalendarDays} label="Date of birth" value={formatDate(member.dob)} />
                <Info icon={MapPin} label="Home branch" value={branch?.name || '—'} />
                <Info icon={Phone} label="Emergency contact" value={`${member.emergencyName || '—'} · ${member.emergencyPhone || '—'}`} />
                <Info icon={Clock} label="Last visit" value={formatDateTime(member.lastVisit)} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-blue-50 bg-brand-50/30 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Medical history</p>
                <p className="mt-2 text-sm text-slate-600">{member.medical || 'No medical history recorded.'}</p>
              </div>
              <div className="rounded-xl border border-blue-50 bg-brand-50/30 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Fitness goals</p>
                <p className="mt-2 text-sm text-slate-600">{member.goals || 'No fitness goals set.'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" icon={UserPlus} onClick={() => actions.openMemberForm(member)}>Edit profile</Button>
              <Button size="sm" variant="outline" icon={CreditCard} onClick={() => actions.openPaymentForm(member.id)}>Collect payment</Button>
              <Button size="sm" variant="outline" icon={ArrowRightLeft} onClick={() => actions.openTransferForm(member)}>Transfer branch</Button>
            </div>
          </>
        ) : null}

        {tab === 'membership' ? (
          <>
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-brand-50 p-5">
              <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-brand-600">Current plan</p><h4 className="mt-1 text-xl font-extrabold text-brand-950">{plan?.name}</h4><p className="mt-1 text-sm text-slate-500">{plan?.description}</p></div><Badge tone="blue">{plan?.category}</Badge></div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniMetric label="Price" value={formatCurrency(plan?.price || 0, currency)} />
                <MiniMetric label="Duration" value={`${plan?.durationDays || 0} days`} />
                <MiniMetric label="PT sessions" value={plan?.sessions ?? 0} />
                <MiniMetric label="Status" value={member.status} />
              </div>
              <div className="mt-4"><div className="mb-1.5 flex justify-between text-xs font-semibold text-slate-500"><span>Plan timeline</span><span>{planProgress}% used</span></div><ProgressBar value={planProgress} tone={remaining < 8 ? 'red' : 'blue'} /></div>
              <p className="mt-2 text-xs text-slate-500">{formatDate(member.startsAt)} → {formatDate(member.expiresAt)} · {remaining >= 0 ? `${remaining} days remaining` : `${Math.abs(remaining)} days expired`}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon={CreditCard} onClick={() => actions.openRenewForm(member)}>Renew / upgrade</Button>
              <Button size="sm" variant="outline" icon={Snowflake} onClick={() => actions.openFreezeForm(member)}>Freeze</Button>
              {member.status === 'Frozen' ? <Button size="sm" variant="soft" icon={CheckCircle2} onClick={unfreeze}>Reactivate</Button> : null}
              <Button size="sm" variant="outline" icon={Ban} onClick={cancelMembership}>Cancel</Button>
            </div>
            <div className="surface !shadow-none">
              <div className="border-b border-blue-50 px-4 py-3 text-sm font-bold text-brand-950">Membership history</div>
              <div className="divide-y divide-blue-50">
                {member.membershipHistory.map((h, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div><p className="text-sm font-semibold text-slate-700">{h.plan}</p><p className="text-xs text-slate-400">{formatDate(h.from)} – {formatDate(h.to)}</p></div>
                    <p className="text-sm font-bold text-brand-700">{formatCurrency(h.amount, currency)}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {tab === 'attendance' ? (
          <>
            <div className="flex flex-wrap gap-2"><Button size="sm" icon={CheckCircle2} onClick={() => checkIn('QR Code')}>QR check-in now</Button><Button size="sm" variant="outline" icon={Plus} onClick={() => checkIn('Manual')}>Manual check-in</Button></div>
            <div className="surface !shadow-none">
              <div className="border-b border-blue-50 px-4 py-3 text-sm font-bold text-brand-950">Recent attendance</div>
              {data.attendance.length ? <div className="divide-y divide-blue-50">{data.attendance.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div><p className="text-sm font-semibold text-slate-700">{formatDate(a.checkIn)}</p><p className="text-xs text-slate-400">{a.method} · {formatTime(a.checkIn)} – {a.checkOut ? formatTime(a.checkOut) : 'Still in gym'}</p></div>
                  {a.checkOut ? <Badge tone="green">Completed</Badge> : <Badge tone="amber">In gym</Badge>}
                </div>
              ))}</div> : <EmptyState icon={Clock} title="No attendance yet" description="Use the check-in button to record the first visit." />}
            </div>
          </>
        ) : null}

        {tab === 'payments' ? (
          <>
            <Button size="sm" icon={CreditCard} onClick={() => actions.openPaymentForm(member.id)}>Collect payment</Button>
            <div className="surface !shadow-none">
              <div className="border-b border-blue-50 px-4 py-3 text-sm font-bold text-brand-950">Payment history</div>
              {data.payments.length ? <div className="divide-y divide-blue-50">{data.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div><p className="text-sm font-semibold text-slate-700">{p.invoiceNo}</p><p className="text-xs text-slate-400">{formatDate(p.date)} · {p.method}</p></div>
                  <div className="flex items-center gap-2"><StatusBadge status={p.status} /><span className="text-sm font-bold text-brand-700">{formatCurrency(p.total, currency)}</span><button onClick={() => openReceipt(p.id)} className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50" title="View receipt"><FileText className="h-4 w-4" /></button></div>
                </div>
              ))}</div> : <EmptyState icon={CreditCard} title="No invoices yet" />}
            </div>
          </>
        ) : null}

        {tab === 'fitness' ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniMetric label="Height" value={`${member.height} cm`} />
              <MiniMetric label="Weight" value={`${member.weight} kg`} />
              <MiniMetric label="Target" value={`${member.targetWeight} kg`} />
              <MiniMetric label="Goal" value={member.goals || '—'} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FitnessCard icon={Dumbbell} title="Workout plans" items={data.workouts.map((w) => `${w.name} · ${w.completedSessions}/${w.totalSessions} sessions`)} onAdd={() => actions.openWorkoutForm()} />
              <FitnessCard icon={Utensils} title="Diet plans" items={data.diets.map((d) => `${d.name} · ${d.calories} kcal`)} onAdd={() => actions.openDietForm()} />
            </div>
            <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" icon={HeartPulse} onClick={() => actions.openProgressForm(member.id)}>Log progress</Button></div>
            {data.progress.length ? <div className="surface !shadow-none p-4"><p className="text-sm font-bold text-brand-950">Latest body metrics</p><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"><MiniMetric label="Weight" value={`${data.progress[0].weight} kg`} /><MiniMetric label="Body fat" value={`${data.progress[0].bodyFat}%`} /><MiniMetric label="Muscle mass" value={`${data.progress[0].muscleMass} kg`} /><MiniMetric label="BMI" value={data.progress[0].bmi} /></div></div> : null}
          </>
        ) : null}

        {tab === 'notes' ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-xs text-amber-800"><StickyNote className="mr-1 inline h-3.5 w-3.5" /> Notes are visible to authorized staff only.</div>
            <Textarea rows={8} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add remarks about preferences, follow-ups, injuries, or membership conversations..." />
            <Button icon={Save} onClick={saveNotes}>Save notes</Button>
          </div>
        ) : null}

        {tab === 'documents' ? (
          <>
            <Button size="sm" variant="outline" icon={Upload} onClick={() => actions.openDocumentForm(member.id)}>Upload document</Button>
            <div className="surface !shadow-none">
              {member.documents.length ? <div className="divide-y divide-blue-50">{member.documents.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-4 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><FileText className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-700">{d.name}</p><p className="text-xs text-slate-400">{d.type} · {formatDate(d.date)} · {d.size}</p></div><Badge tone="slate">Stored</Badge></div>
              ))}</div> : <EmptyState icon={FileText} title="No documents uploaded" description="Add ID proof, medical certificates, or signed agreements." />}
            </div>
          </>
        ) : null}
      </div>
    </Drawer>
  )
}

function Info({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 truncate text-sm font-medium text-slate-700">{value || '—'}</p></div>
    </div>
  )
}

function FitnessCard({ icon: Icon, title, items, onAdd }: { icon: typeof Dumbbell; title: string; items: string[]; onAdd: () => void }) {
  return (
    <div className="rounded-xl border border-blue-50 bg-white p-4">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-bold text-brand-950"><Icon className="h-4 w-4 text-brand-600" />{title}</div><button onClick={onAdd} className="rounded-lg p-1 text-brand-600 hover:bg-brand-50"><Plus className="h-4 w-4" /></button></div>
      <div className="mt-3 space-y-2">{items.length ? items.slice(0, 3).map((x) => <p key={x} className="rounded-lg bg-brand-50/60 px-2.5 py-2 text-xs font-medium text-slate-600">{x}</p>) : <p className="text-xs text-slate-400">No plans assigned yet.</p>}</div>
    </div>
  )
}
