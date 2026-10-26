import { useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, Bell, CalendarDays, CheckCircle2, Clock, Download,
  Fingerprint, LogOut, QrCode, Radio, ScanLine, Search, TrendingUp, UserCheck, Users,
} from 'lucide-react'
import { useApp } from '../lib/app-context'
import { useActions } from '../lib/actions'
import { attendanceTrend, peakHourData } from '../lib/analytics'
import { downloadFile, formatDate, formatTime, isoDate, relativeTime, toCsv, uid } from '../lib/utils'
import { PeakHoursChart, ProgressLineChart } from '../components/charts'
import { Avatar, Badge, Button, Card, CardHeader, DataTable, EmptyState, PageHeader, ProgressBar, SearchInput, Select, StatCard, StatusBadge, Tabs } from '../components/ui'
import { Pagination } from './Members'

export function Attendance() {
  const { db, scope, branchId, openCheckIn, openMember, updateDb, toast, logActivity } = useApp()
  const actions = useActions()
  const [tab, setTab] = useState('live')
  const [query, setQuery] = useState('')
  const [method, setMethod] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [staffStatus, setStaffStatus] = useState<Record<string, 'Present' | 'Late' | 'Absent'>>({})
  const attendance = scope(db.attendance)
  const members = scope(db.members)
  const today = isoDate(new Date())
  const todayRecords = attendance.filter((a) => a.date === today)
  const inside = todayRecords.filter((a) => !a.checkOut).length
  const late = todayRecords.filter((a) => new Date(a.checkIn).getHours() >= 21).length
  const peak = useMemo(() => peakHourData(attendance), [attendance])
  const trend = useMemo(() => attendanceTrend(attendance, 14), [attendance])
  const pageSize = 10

  const filtered = useMemo(() => attendance.filter((a) => {
    const q = query.toLowerCase()
    const matchQuery = !q || `${a.memberName} ${a.method} ${a.date}`.toLowerCase().includes(q)
    const matchMethod = method === 'all' || a.method === method
    const matchDate = dateFilter === 'all' || a.date === dateFilter
    return matchQuery && matchMethod && matchDate
  }).sort((a, b) => +new Date(b.checkIn) - +new Date(a.checkIn)), [attendance, query, method, dateFilter])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const methodCounts = ['QR Code', 'RFID', 'Biometric', 'Manual'].map((m) => ({ name: m, count: attendance.filter((a) => a.method === m).length }))
  const mostActive = [...members].sort((a, b) => b.attendanceCount - a.attendanceCount).slice(0, 5)
  const leastActive = [...members].sort((a, b) => a.attendanceCount - b.attendanceCount).slice(0, 5)
  const inactive = members.filter((m) => m.status === 'Inactive' || (m.lastVisit && (Date.now() - new Date(m.lastVisit).getTime()) > 14 * 86400000) || m.engagementScore < 45).slice(0, 12)
  const staffPeople = [...db.trainers.map((t) => ({ id: t.id, name: t.name, role: t.specialization, shift: t.availability, branchId: t.branchId, type: 'Trainer' })), ...db.staff.map((s) => ({ id: s.id, name: s.name, role: s.role, shift: s.shift, branchId: s.branchId, type: 'Staff' }))].filter((p) => branchId === 'all' || p.branchId === branchId)

  function exportAttendance() {
    downloadFile('gymzard-attendance.csv', toCsv(filtered.map((a) => ({ Member: a.memberName, Date: a.date, 'Check-in': a.checkIn, 'Check-out': a.checkOut || '', Method: a.method, Branch: db.branches.find((b) => b.id === a.branchId)?.name || '' }))), 'text/csv;charset=utf-8')
    toast('Attendance report exported')
  }

  function sendInactiveAlerts() {
    updateDb((prev) => ({ ...prev, notifications: [{
      id: uid('ntf'), title: 'Inactive member re-engagement', body: `A personalized comeback offer was sent to ${inactive.length} inactive members.`,
      channel: 'WhatsApp', audience: 'Inactive members', sentAt: new Date().toISOString(), status: 'Sent', read: false,
    }, ...prev.notifications] }))
    logActivity('Inactivity campaign sent', `${inactive.length} inactive members were contacted`, 'system')
    toast(`Re-engagement alerts sent to ${inactive.length} members`)
  }

  function markStaff(id: string, status: 'Present' | 'Late' | 'Absent') {
    setStaffStatus((prev) => ({ ...prev, [id]: status }))
    toast(`Staff attendance marked ${status.toLowerCase()}`)
  }

  const tabs = [
    { id: 'live', label: 'Live check-ins' },
    { id: 'history', label: 'Attendance history', count: attendance.length },
    { id: 'reports', label: 'Reports' },
    { id: 'staff', label: 'Trainer & staff', count: staffPeople.length },
    { id: 'alerts', label: 'Inactive alerts', count: inactive.length },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Attendance management"
        title="Attendance & access"
        subtitle="QR, RFID, biometric, and manual check-ins with live occupancy and inactivity alerts."
        actions={<>
          <Button variant="outline" icon={Download} onClick={exportAttendance}>Export report</Button>
          <Button icon={QrCode} onClick={openCheckIn}>Open scanner</Button>
        </>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Today's check-ins" value={todayRecords.length} icon={UserCheck} tone="green" hint="unique and repeat visits" />
        <StatCard title="Inside right now" value={inside} icon={Radio} tone="cyan" hint="live occupancy" />
        <StatCard title="Avg. daily visits" value={Math.round(attendance.length / 30)} icon={TrendingUp} hint="last 30 days" />
        <StatCard title="Late check-ins" value={late} icon={Clock} tone="amber" hint="after 9 PM" />
        <StatCard title="Inactive members" value={inactive.length} icon={AlertTriangle} tone="red" hint="need attention" />
      </div>

      <Tabs items={tabs} value={tab} onChange={(v) => { setTab(v); setPage(1) }} className="rounded-t-2xl border border-blue-100 bg-white px-2" />

      {tab === 'live' ? (
        <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader title="Live attendance feed" subtitle="Most recent check-ins and check-outs" action={<Badge tone="green" dot>Live</Badge>} />
            <div className="max-h-[520px] divide-y divide-blue-50 overflow-y-auto">{todayRecords.slice(0, 20).map((a) => {
              const member = db.members.find((m) => m.id === a.memberId)
              return <div key={a.id} className="flex items-center gap-3 px-4 py-3"><Avatar name={a.memberName} src={member?.photo} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-700">{a.memberName}</p><p className="text-[11px] text-slate-400">{a.method} · {formatTime(a.checkIn)} · {db.branches.find((b) => b.id === a.branchId)?.name}</p></div>{a.checkOut ? <Badge tone="slate">Checked out {formatTime(a.checkOut)}</Badge> : <Badge tone="green" dot>In gym</Badge>}</div>
            })}</div>
          </Card>
          <div className="space-y-5">
            <Card className="p-5">
              <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Live occupancy</p><p className="mt-2 text-4xl font-extrabold text-brand-950">{inside}<span className="text-lg text-slate-400"> / {Math.max(60, members.length)}</span></p></div><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><Users className="h-7 w-7" /></span></div>
              <ProgressBar className="mt-4" value={inside} max={Math.max(60, members.length)} tone={inside > members.length * .7 ? 'amber' : 'blue'} showLabel />
              <div className="mt-4 grid grid-cols-2 gap-2"><Button size="sm" icon={ScanLine} onClick={openCheckIn}>Scan QR</Button><Button size="sm" variant="outline" icon={Fingerprint} onClick={openCheckIn}>Biometric</Button></div>
            </Card>
            <Card>
              <CardHeader title="Entry methods" subtitle="Last 30 days" />
              <div className="space-y-3 p-5">{methodCounts.map((m) => <div key={m.name}><div className="flex justify-between text-xs font-semibold text-slate-600"><span>{m.name}</span><span>{m.count}</span></div><ProgressBar className="mt-1.5" value={m.count} max={Math.max(...methodCounts.map((x) => x.count), 1)} tone={m.name === 'QR Code' ? 'blue' : m.name === 'RFID' ? 'purple' : m.name === 'Biometric' ? 'cyan' : 'amber'} /></div>)}</div>
            </Card>
            <Card>
              <CardHeader title="Branch occupancy" subtitle="Members currently checked in" />
              <div className="space-y-3 p-5">{db.branches.filter((b) => branchId === 'all' || b.id === branchId).map((b) => {
                const count = todayRecords.filter((a) => a.branchId === b.id && !a.checkOut).length
                const capacity = Math.max(25, Math.round(members.filter((m) => m.branchId === b.id).length * .65))
                return <div key={b.id}><div className="flex justify-between text-xs font-semibold"><span className="text-slate-600">{b.name}</span><span className="text-brand-700">{count} / {capacity}</span></div><ProgressBar className="mt-1.5" value={count} max={capacity} tone={count / capacity > .8 ? 'red' : 'blue'} /></div>
              })}</div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === 'history' ? (
        <Card>
          <div className="flex flex-col gap-3 border-b border-blue-50 p-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-1 flex-wrap gap-2"><SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1) }} placeholder="Search member or date…" className="w-full sm:w-64" /><Select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1) }} className="h-10 w-auto min-w-[140px]"><option value="all">All methods</option>{['QR Code', 'RFID', 'Biometric', 'Manual'].map((m) => <option key={m}>{m}</option>)}</Select><Select value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1) }} className="h-10 w-auto min-w-[150px]"><option value="all">All dates</option>{[...new Set(attendance.map((a) => a.date))].sort().reverse().slice(0, 30).map((d) => <option key={d} value={d}>{formatDate(d)}</option>)}</Select></div><Button size="sm" icon={QrCode} onClick={openCheckIn}>Add check-in</Button></div>
          <DataTable rows={pageRows} rowKey={(a) => a.id} columns={[
            { key: 'member', header: 'Member', render: (a) => <div className="flex items-center gap-2.5"><Avatar name={a.memberName} size="sm" /><div><p className="font-bold text-slate-700">{a.memberName}</p><p className="text-[11px] text-slate-400">{db.members.find((m) => m.id === a.memberId)?.memberId}</p></div></div> },
            { key: 'date', header: 'Date', render: (a) => <span className="text-xs text-slate-600">{formatDate(a.date)}</span> },
            { key: 'method', header: 'Method', render: (a) => <Badge tone={a.method === 'QR Code' ? 'blue' : a.method === 'Biometric' ? 'cyan' : a.method === 'RFID' ? 'purple' : 'slate'}>{a.method}</Badge> },
            { key: 'in', header: 'Check-in', render: (a) => <span className="text-xs font-semibold text-slate-700">{formatTime(a.checkIn)}</span> },
            { key: 'out', header: 'Check-out', render: (a) => a.checkOut ? <span className="text-xs text-slate-500">{formatTime(a.checkOut)}</span> : <Badge tone="amber">Still inside</Badge> },
            { key: 'duration', header: 'Duration', render: (a) => <span className="text-xs text-slate-500">{a.checkOut ? `${Math.round((new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 60000)} min` : '—'}</span> },
            { key: 'branch', header: 'Branch', render: (a) => <span className="text-xs text-slate-500">{db.branches.find((b) => b.id === a.branchId)?.name}</span> },
            { key: 'action', header: '', align: 'right', render: (a) => a.checkOut ? <button onClick={() => { const m = db.members.find((x) => x.id === a.memberId); if (m) openMember(m.id) }} className="text-brand-600 hover:underline"><ArrowRight className="h-4 w-4" /></button> : <Button size="sm" variant="outline" icon={LogOut} onClick={() => actions.openCheckOutForm(a)}>Check out</Button> },
          ]} empty={<EmptyState icon={Search} title="No attendance records" description="Adjust filters or add a check-in." />} />
          <Pagination page={currentPage} totalPages={totalPages} total={filtered.length} pageSize={pageSize} onPage={setPage} />
        </Card>
      ) : null}

      {tab === 'reports' ? (
        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <Card><CardHeader title="Peak hours" subtitle="Total check-ins by hour" /><div className="px-2 py-4 sm:px-4"><PeakHoursChart data={peak} /></div></Card>
            <Card><CardHeader title="Attendance trend" subtitle="Daily visits for the last 14 days" /><div className="px-2 py-4 sm:px-4"><ProgressLineChart data={trend} dataKeys={[{ key: 'visits', name: 'Visits', color: '#1557d6' }]} /></div></Card>
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            <Card><CardHeader title="Most active members" subtitle="Highest lifetime visits" /><div className="space-y-2 p-4">{mostActive.map((m, i) => <MemberRank key={m.id} rank={i + 1} name={m.name} value={`${m.attendanceCount} visits`} onClick={() => openMember(m.id)} />)}</div></Card>
            <Card><CardHeader title="Least active members" subtitle="May need re-engagement" /><div className="space-y-2 p-4">{leastActive.map((m, i) => <MemberRank key={m.id} rank={i + 1} name={m.name} value={`${m.attendanceCount} visits`} tone="amber" onClick={() => openMember(m.id)} />)}</div></Card>
            <Card><CardHeader title="Attendance insights" subtitle="Automated observations" /><div className="space-y-3 p-4"><Insight icon={TrendingUp} title="Busiest window" detail="6–9 PM accounts for the highest share of daily visits." /><Insight icon={Clock} title="Average workout" detail="Members spend an average of 74 minutes per visit." /><Insight icon={CheckCircle2} title="Consistency" detail="68% of active members visited at least 8 times this month." /><Insight icon={AlertTriangle} title="Late arrivals" detail={`${late} check-ins recorded after 9 PM today.`} /></div></Card>
          </div>
        </div>
      ) : null}

      {tab === 'staff' ? (
        <Card>
          <CardHeader title="Trainer & staff attendance" subtitle="Mark daily attendance and track late arrivals" action={<Button size="sm" variant="outline" onClick={() => toast('Staff attendance report generated', 'info')}>Generate report</Button>} />
          <DataTable rows={staffPeople} rowKey={(p) => p.id} columns={[
            { key: 'name', header: 'Name', render: (p) => <div className="flex items-center gap-2.5"><Avatar name={p.name} size="sm" /><div><p className="font-bold text-slate-700">{p.name}</p><p className="text-[11px] text-slate-400">{p.type} · {p.role}</p></div></div> },
            { key: 'shift', header: 'Shift', render: (p) => <span className="text-xs text-slate-500">{p.shift}</span> },
            { key: 'branch', header: 'Branch', render: (p) => <span className="text-xs text-slate-500">{db.branches.find((b) => b.id === p.branchId)?.name}</span> },
            { key: 'status', header: 'Today', render: (p) => <StatusBadge status={staffStatus[p.id] || (p.id.endsWith('1') ? 'Present' : p.id.endsWith('3') ? 'Late' : 'Present')} /> },
            { key: 'checkin', header: 'Check-in', render: (p) => <span className="text-xs text-slate-500">{(staffStatus[p.id] || 'Present') === 'Absent' ? '—' : (staffStatus[p.id] === 'Late' ? '09:42 AM' : '07:18 AM')}</span> },
            { key: 'actions', header: '', align: 'right', render: (p) => <div className="flex justify-end gap-1"><Button size="sm" variant="soft" onClick={() => markStaff(p.id, 'Present')}>Present</Button><Button size="sm" variant="ghost" onClick={() => markStaff(p.id, 'Late')}>Late</Button><Button size="sm" variant="ghost" onClick={() => markStaff(p.id, 'Absent')}>Absent</Button></div> },
          ]} />
        </Card>
      ) : null}

      {tab === 'alerts' ? (
        <Card>
          <CardHeader title="Inactive member alerts" subtitle="Members who have not visited recently or show low engagement" action={<Button size="sm" icon={Bell} onClick={sendInactiveAlerts}>Send all alerts</Button>} />
          {inactive.length ? <DataTable rows={inactive} rowKey={(m) => m.id} columns={[
            { key: 'member', header: 'Member', render: (m) => <div className="flex items-center gap-2.5"><Avatar name={m.name} src={m.photo} size="sm" /><div><p className="font-bold text-slate-700">{m.name}</p><p className="text-[11px] text-slate-400">{m.memberId}</p></div></div> },
            { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
            { key: 'last', header: 'Last visit', render: (m) => <span className="text-xs text-slate-500">{m.lastVisit ? relativeTime(m.lastVisit) : 'Never'}</span> },
            { key: 'engagement', header: 'Engagement', render: (m) => <div className="w-28"><div className="flex justify-between text-[10px] text-slate-400"><span>Score</span><span>{m.engagementScore}%</span></div><ProgressBar className="mt-1.5" value={m.engagementScore} tone={m.engagementScore < 40 ? 'red' : 'amber'} /></div> },
            { key: 'health', header: 'Health score', render: (m) => <span className="font-bold text-slate-700">{m.healthScore}</span> },
            { key: 'actions', header: '', align: 'right', render: (m) => <div className="flex justify-end gap-1"><Button size="sm" variant="outline" icon={Bell} onClick={() => { updateDb((prev) => ({ ...prev, notifications: [{ id: uid('ntf'), title: 'We miss you!', body: `Hi ${m.name.split(' ')[0]}, your trainer is waiting for you at the gym.`, channel: 'WhatsApp', audience: m.name, sentAt: new Date().toISOString(), status: 'Sent', read: false }, ...prev.notifications] })); toast(`Alert sent to ${m.name}`) }}>Send alert</Button><Button size="sm" variant="ghost" onClick={() => openMember(m.id)}>View</Button></div> },
          ]} /> : <EmptyState icon={CheckCircle2} title="No inactive members" description="Everyone is engaged. Great work!" />}
        </Card>
      ) : null}
    </div>
  )
}

function MemberRank({ rank, name, value, tone = 'blue', onClick }: { rank: number; name: string; value: string; tone?: 'blue' | 'amber'; onClick: () => void }) {
  return <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-blue-50 px-3 py-2.5 hover:bg-brand-50/60"><span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold ${tone === 'blue' ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700'}`}>{rank}</span><span className="min-w-0 flex-1 truncate text-left text-xs font-bold text-slate-700">{name}</span><span className="text-[11px] font-semibold text-slate-400">{value}</span><ArrowRight className="h-3.5 w-3.5 text-slate-300" /></button>
}

function Insight({ icon: Icon, title, detail }: { icon: typeof TrendingUp; title: string; detail: string }) {
  return <div className="flex gap-3 rounded-xl border border-blue-50 p-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Icon className="h-4 w-4" /></span><div><p className="text-xs font-bold text-slate-700">{title}</p><p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{detail}</p></div></div>
}
