import { useMemo, useState } from 'react'
import {
  Award, CalendarDays, CheckCircle2, Clock, Dumbbell, MessageSquare, Plus, Search, Star,
  TrendingUp, UserPlus, Users, Wallet, X,
} from 'lucide-react'
import { useApp } from '../lib/app-context'
import { useActions } from '../lib/actions'
import { formatCurrency, formatDate } from '../lib/utils'
import type { Trainer } from '../types'
import { Avatar, Badge, Button, Card, CardHeader, DataTable, EmptyState, Modal, PageHeader, ProgressBar, StatCard, StatusBadge, Tabs } from '../components/ui'

export function Trainers() {
  const { db, scope, updateDb, toast, openMember } = useApp()
  const actions = useActions()
  const [tab, setTab] = useState('trainers')
  const [selected, setSelected] = useState<Trainer | null>(null)
  const trainers = scope(db.trainers)
  const members = scope(db.members)
  const ptSessions = scope(db.classes).filter((c) => c.type === 'Personal Training')
  const currency = db.settings.currency
  const avgRating = trainers.length ? (trainers.reduce((s, t) => s + t.rating, 0) / trainers.length).toFixed(1) : '0.0'
  const totalSessions = trainers.reduce((s, t) => s + t.sessions, 0)
  const commissions = trainers.reduce((s, t) => s + Math.round(t.sessions * 1500 * t.commissionRate / 100), 0)
  const assigned = members.filter((m) => m.trainerId).length
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  function sessionMember(classId: string) {
    const booking = db.bookings.find((b) => b.classId === classId)
    return booking ? db.members.find((m) => m.id === booking.memberId) : undefined
  }

  function setSessionStatus(id: string, status: 'Completed' | 'Cancelled') {
    updateDb((prev) => ({ ...prev, classes: prev.classes.map((c) => c.id === id ? { ...c, status } : c) }))
    toast(`Session marked ${status.toLowerCase()}`)
  }

  const tabs = [
    { id: 'trainers', label: 'Trainers', count: trainers.length },
    { id: 'sessions', label: 'PT sessions', count: ptSessions.length },
    { id: 'schedule', label: 'Availability' },
    { id: 'commissions', label: 'Commissions' },
    { id: 'feedback', label: 'Feedback' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Trainer management"
        title="Trainers & coaches"
        subtitle="Profiles, availability, member assignments, PT sessions, commissions, payroll, and feedback."
        actions={<>
          <Button variant="outline" icon={UserPlus} onClick={() => actions.openTrainerAssignmentForm()}>Assign member</Button>
          <Button icon={Plus} onClick={() => actions.openTrainerForm()}>Add trainer</Button>
        </>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Active trainers" value={trainers.filter((t) => t.status === 'Active').length} icon={Dumbbell} hint={`${trainers.length} total`} />
        <StatCard title="Assigned members" value={assigned} icon={Users} tone="green" hint="personal coaching" />
        <StatCard title="PT sessions" value={totalSessions} icon={CalendarDays} tone="cyan" hint="completed this period" />
        <StatCard title="Average rating" value={avgRating} icon={Star} tone="amber" hint="member feedback" />
        <StatCard title=" commissions" value={formatCurrency(commissions, currency, true)} icon={Wallet} tone="purple" hint="this period" />
      </div>

      <Tabs items={tabs} value={tab} onChange={setTab} className="rounded-t-2xl border border-blue-100 bg-white px-2" />

      {tab === 'trainers' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trainers.map((t) => {
            const assignedMembers = members.filter((m) => m.trainerId === t.id)
            const workload = Math.min(100, Math.round((assignedMembers.length / 20) * 100))
            return (
              <Card key={t.id} className="p-5">
                <div className="flex items-start gap-3"><Avatar name={t.name} size="lg" color={t.color} /><div className="min-w-0 flex-1"><h3 className="truncate text-base font-extrabold text-brand-950">{t.name}</h3><p className="text-xs text-slate-500">{t.specialization}</p><div className="mt-1.5 flex flex-wrap gap-1.5"><StatusBadge status={t.status} /><Badge tone="amber"><Star className="mr-1 h-3 w-3" />{t.rating}</Badge></div></div></div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-lg bg-brand-50/60 p-2"><p className="text-sm font-extrabold text-brand-950">{assignedMembers.length}</p><p className="text-[10px] text-slate-400">Members</p></div><div className="rounded-lg bg-brand-50/60 p-2"><p className="text-sm font-extrabold text-brand-950">{t.sessions}</p><p className="text-[10px] text-slate-400">Sessions</p></div><div className="rounded-lg bg-brand-50/60 p-2"><p className="text-sm font-extrabold text-brand-950">{t.performance}%</p><p className="text-[10px] text-slate-400">Score</p></div></div>
                <div className="mt-4"><div className="flex justify-between text-[11px] font-semibold text-slate-500"><span>Workload</span><span>{workload}%</span></div><ProgressBar className="mt-1.5" value={workload} tone={workload > 80 ? 'red' : workload > 55 ? 'amber' : 'green'} /></div>
                <div className="mt-4 flex flex-wrap gap-1.5">{t.certifications.slice(0, 2).map((c) => <Badge key={c} tone="blue">{c}</Badge>)}</div>
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400"><Clock className="h-3.5 w-3.5" />{t.availability} · {db.branches.find((b) => b.id === t.branchId)?.name}</p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-blue-50 pt-4"><Button size="sm" onClick={() => setSelected(t)}>View profile</Button><Button size="sm" variant="outline" icon={CalendarDays} onClick={() => actions.openPtSessionForm(t)}>Book PT</Button><Button size="sm" variant="ghost" onClick={() => actions.openTrainerForm(t)}>Edit</Button></div>
              </Card>
            )
          })}
        </div>
      ) : null}

      {tab === 'sessions' ? (
        <Card>
          <CardHeader title="Personal training sessions" subtitle="Upcoming and completed one-on-one sessions" action={<Button size="sm" icon={Plus} onClick={() => actions.openPtSessionForm()}>Schedule session</Button>} />
          {ptSessions.length ? <DataTable rows={ptSessions.sort((a, b) => +new Date(b.date) - +new Date(a.date))} rowKey={(c) => c.id} columns={[
            { key: 'session', header: 'Session', render: (c) => <div><p className="font-bold text-slate-700">{c.title}</p><p className="text-[11px] text-slate-400">{c.room} · {c.duration} min</p></div> },
            { key: 'trainer', header: 'Trainer', render: (c) => <span className="text-xs text-slate-600">{db.trainers.find((t) => t.id === c.trainerId)?.name}</span> },
            { key: 'member', header: 'Member', render: (c) => { const m = sessionMember(c.id); return m ? <button onClick={() => openMember(m.id)} className="text-xs font-semibold text-brand-600 hover:underline">{m.name}</button> : <span className="text-xs text-slate-400">Unassigned</span> } },
            { key: 'date', header: 'Date & time', render: (c) => <div><p className="text-xs font-semibold text-slate-700">{formatDate(c.date)}</p><p className="text-[11px] text-slate-400">{c.time}</p></div> },
            { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
            { key: 'actions', header: '', align: 'right', render: (c) => <div className="flex justify-end gap-1"><Button size="sm" variant="soft" onClick={() => setSessionStatus(c.id, 'Completed')}>Complete</Button><Button size="sm" variant="ghost" onClick={() => setSessionStatus(c.id, 'Cancelled')}>Cancel</Button></div> },
          ]} /> : <EmptyState icon={CalendarDays} title="No PT sessions" description="Schedule a personal training session to get started." />}
        </Card>
      ) : null}

      {tab === 'schedule' ? (
        <Card>
          <CardHeader title="Trainer availability" subtitle="Weekly shift coverage at a glance" action={<Button size="sm" variant="outline" onClick={() => actions.openTrainerForm()}>Update availability</Button>} />
          <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-4 py-3">Trainer</th>{weekDays.map((d) => <th key={d} className="px-2 py-3 text-center">{d}</th>)}<th className="px-4 py-3">Shift</th></tr></thead><tbody className="divide-y divide-blue-50">{trainers.map((t, ti) => <tr key={t.id}><td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar name={t.name} size="xs" color={t.color} /><span className="text-xs font-bold text-slate-700">{t.name}</span></div></td>{weekDays.map((d, di) => {
            const off = (ti + di) % 7 === 0
            const half = (ti + di) % 5 === 0
            return <td key={d} className="px-2 py-3 text-center"><span className={`inline-block h-6 w-14 rounded-md ${off ? 'bg-slate-100' : half ? 'bg-brand-100' : 'bg-brand-600/85'}`} title={off ? 'Off' : half ? 'Half day' : 'Full day'} /></td>
          })}<td className="px-4 py-3 text-xs text-slate-500">{t.availability}</td></tr>)}</tbody></table></div>
          <div className="flex flex-wrap items-center gap-4 border-t border-blue-50 px-4 py-3 text-[11px] text-slate-500"><span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-brand-600/85" />Full day</span><span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-brand-100" />Half day</span><span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-slate-100" />Off</span></div>
        </Card>
      ) : null}

      {tab === 'commissions' ? (
        <Card>
          <CardHeader title="Trainer commission & payroll" subtitle="Session-based commission and monthly salary overview" action={<Button size="sm" variant="outline" icon={Wallet} onClick={() => toast('Payroll report generated for this period', 'info')}>Generate payroll</Button>} />
          <DataTable rows={trainers} rowKey={(t) => t.id} columns={[
            { key: 'name', header: 'Trainer', render: (t) => <div className="flex items-center gap-2.5"><Avatar name={t.name} size="sm" color={t.color} /><div><p className="font-bold text-slate-700">{t.name}</p><p className="text-[11px] text-slate-400">{t.specialization}</p></div></div> },
            { key: 'sessions', header: 'Sessions', render: (t) => <span className="text-xs font-semibold text-slate-700">{t.sessions}</span> },
            { key: 'rate', header: 'Commission', render: (t) => <Badge tone="blue">{t.commissionRate}%</Badge> },
            { key: 'revenue', header: 'PT revenue', render: (t) => <span className="text-xs text-slate-600">{formatCurrency(t.sessions * 1500, currency, true)}</span> },
            { key: 'commission', header: 'Commission', render: (t) => <span className="text-xs font-bold text-emerald-600">{formatCurrency(Math.round(t.sessions * 1500 * t.commissionRate / 100), currency, true)}</span> },
            { key: 'salary', header: 'Base salary', render: (t) => <span className="text-xs text-slate-600">{formatCurrency(t.salary, currency, true)}</span> },
            { key: 'total', header: 'Total payout', align: 'right', render: (t) => <span className="text-sm font-extrabold text-brand-950">{formatCurrency(t.salary + Math.round(t.sessions * 1500 * t.commissionRate / 100), currency, true)}</span> },
          ]} />
          <div className="grid gap-3 border-t border-blue-50 p-4 sm:grid-cols-3"><Summary label="Total base salary" value={formatCurrency(trainers.reduce((s, t) => s + t.salary, 0), currency, true)} /><Summary label="Total commissions" value={formatCurrency(commissions, currency, true)} /><Summary label="Total payroll" value={formatCurrency(trainers.reduce((s, t) => s + t.salary + Math.round(t.sessions * 1500 * t.commissionRate / 100), 0), currency, true)} /></div>
        </Card>
      ) : null}

      {tab === 'feedback' ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {[
            { name: 'Ayesha Khan', trainer: trainers[0]?.name || 'Hammad Raza', rating: 5, text: 'My strength has improved so much. The workouts are challenging but easy to follow.', tag: 'Strength' },
            { name: 'Ali Malik', trainer: trainers[1]?.name || 'Alishba Noor', rating: 5, text: 'The diet plan is practical and I never feel hungry. Down four kilograms this month!', tag: 'Weight loss' },
            { name: 'Fatima Ahmed', trainer: trainers[2]?.name || 'Furqan Shah', rating: 4, text: 'Great attention to form and posture. Would love more mobility work at the end.', tag: 'Posture' },
            { name: 'Hamza Butt', trainer: trainers[3]?.name || 'Nayab Khan', rating: 5, text: 'Very motivating sessions. The progress tracking keeps me accountable every week.', tag: 'Motivation' },
            { name: 'Zainab Raza', trainer: trainers[4]?.name || 'Zohaib Anwar', rating: 4, text: 'Good variety in workouts. Sometimes the gym is crowded during my slot.', tag: 'Facility' },
            { name: 'Omar Sheikh', trainer: trainers[5]?.name || 'Mehak Sultan', rating: 5, text: 'Excellent nutrition advice and supplement guidance. Highly recommended!', tag: 'Nutrition' },
          ].map((f, i) => <Card key={i} className="p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><Avatar name={f.name} size="sm" /><div><p className="text-sm font-bold text-slate-700">{f.name}</p><p className="text-[11px] text-slate-400">with {f.trainer}</p></div></div><Badge tone="blue">{f.tag}</Badge></div><div className="mt-3 flex gap-0.5">{Array.from({ length: 5 }).map((_, s) => <Star key={s} className={`h-4 w-4 ${s < f.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}</div><p className="mt-3 text-xs leading-relaxed text-slate-600">“{f.text}”</p><div className="mt-4 flex items-center justify-between border-t border-blue-50 pt-3"><span className="text-[11px] text-slate-400">{formatDate(new Date(Date.now() - i * 86400000 * 3).toISOString())}</span><Button size="sm" variant="ghost" icon={MessageSquare} onClick={() => toast('Reply saved to feedback thread', 'info')}>Reply</Button></div></Card>)}
        </div>
      ) : null}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || ''} subtitle={selected?.specialization} size="lg">
        {selected ? <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center"><Avatar name={selected.name} size="xl" color={selected.color} /><div className="flex-1"><div className="flex flex-wrap gap-2"><StatusBadge status={selected.status} /><Badge tone="amber"><Star className="mr-1 h-3 w-3" />{selected.rating} rating</Badge><Badge tone="blue">{selected.performance}% performance</Badge></div><p className="mt-3 text-xs text-slate-500">{selected.email} · {selected.phone}</p><p className="mt-1 text-xs text-slate-500">{selected.availability} · {db.branches.find((b) => b.id === selected.branchId)?.name}</p></div></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Summary label="Assigned" value={members.filter((m) => m.trainerId === selected.id).length} /><Summary label="Sessions" value={selected.sessions} /><Summary label="Commission" value={`${selected.commissionRate}%`} /><Summary label="Salary" value={formatCurrency(selected.salary, currency, true)} /></div>
          <div><p className="text-sm font-bold text-brand-950">Certifications</p><div className="mt-2 flex flex-wrap gap-2">{selected.certifications.map((c) => <Badge key={c} tone="green"><Award className="mr-1 h-3 w-3" />{c}</Badge>)}</div></div>
          <div><p className="text-sm font-bold text-brand-950">Assigned members</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{members.filter((m) => m.trainerId === selected.id).slice(0, 6).map((m) => <button key={m.id} onClick={() => { setSelected(null); openMember(m.id) }} className="flex items-center gap-2 rounded-xl border border-blue-50 p-2.5 text-left hover:bg-brand-50/60"><Avatar name={m.name} src={m.photo} size="xs" /><span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{m.name}</span><StatusBadge status={m.status} /></button>)}{!members.some((m) => m.trainerId === selected.id) ? <p className="text-xs text-slate-400">No members assigned yet.</p> : null}</div></div>
          <div className="flex flex-wrap gap-2 border-t border-blue-50 pt-4"><Button icon={CalendarDays} onClick={() => actions.openPtSessionForm(selected)}>Book PT session</Button><Button variant="outline" icon={UserPlus} onClick={() => actions.openTrainerAssignmentForm(selected)}>Assign member</Button><Button variant="ghost" icon={X} onClick={() => setSelected(null)}>Close</Button></div>
        </div> : null}
      </Modal>
    </div>
  )
}

function Summary({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-xl border border-blue-50 bg-brand-50/40 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-base font-extrabold text-brand-950">{value}</p></div>
}
