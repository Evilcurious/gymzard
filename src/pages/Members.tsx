import { useMemo, useState } from 'react'
import {
  ArrowRight, Bell, Download, Grid2X2, List, MoreHorizontal, Plus, Search, Snowflake,
  Trash2, Upload, UserCheck, Users, UserX,
} from 'lucide-react'
import { useApp } from '../lib/app-context'
import { useActions } from '../lib/actions'
import { daysUntil, downloadFile, formatCurrency, formatDate, toCsv, uid } from '../lib/utils'
import { Avatar, Badge, Button, Card, DataTable, EmptyState, PageHeader, ProgressBar, SearchInput, Select, StatCard, StatusBadge } from '../components/ui'

export function Members() {
  const { db, scope, branchId, openMember, updateDb, toast, logActivity } = useApp()
  const actions = useActions()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [plan, setPlan] = useState('all')
  const [view, setView] = useState<'table' | 'grid'>('table')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const currency = db.settings.currency

  const all = scope(db.members)
  const filtered = useMemo(() => all.filter((m) => {
    const q = query.toLowerCase()
    const matchQuery = !q || `${m.name} ${m.memberId} ${m.phone} ${m.email} ${m.goals}`.toLowerCase().includes(q)
    const matchStatus = status === 'all' || m.status === status
    const matchPlan = plan === 'all' || m.planId === plan
    return matchQuery && matchStatus && matchPlan
  }).sort((a, b) => a.name.localeCompare(b.name)), [all, query, status, plan])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const stats = useMemo(() => ({
    active: all.filter((m) => m.status === 'Active').length,
    expired: all.filter((m) => m.status === 'Expired').length,
    trial: all.filter((m) => m.status === 'Trial').length,
    frozen: all.filter((m) => m.status === 'Frozen').length,
    dues: all.reduce((s, m) => s + m.dueAmount, 0),
  }), [all])

  function exportMembers() {
    downloadFile('gymzard-members.csv', toCsv(filtered.map((m) => ({
      'Member ID': m.memberId, Name: m.name, Email: m.email, Phone: m.phone, Status: m.status,
      Plan: db.plans.find((p) => p.id === m.planId)?.name || '', Branch: db.branches.find((b) => b.id === m.branchId)?.name || '',
      Joined: m.joinedAt, Expiry: m.expiresAt, Dues: m.dueAmount, Attendance: m.attendanceCount,
      'Emergency contact': `${m.emergencyName} ${m.emergencyPhone}`, Goals: m.goals, Medical: m.medical,
    }))), 'text/csv;charset=utf-8')
    toast('Member list exported as CSV')
  }

  function sendReminders() {
    if (!filtered.length) return toast('No members match the current filters', 'warning')
    updateDb((prev) => ({ ...prev, notifications: [{
      id: uid('ntf'), title: 'Membership status reminder', body: `A personalized reminder was queued for ${filtered.length} selected members.`,
      channel: 'WhatsApp', audience: 'Filtered members', sentAt: new Date().toISOString(), status: 'Sent', read: false,
    }, ...prev.notifications] }))
    logActivity('Bulk reminder sent', `${filtered.length} members received a demo reminder`, 'system')
    toast(`Reminder queued for ${filtered.length} members`)
  }

  function deleteMember(id: string, name: string) {
    if (!window.confirm(`Delete ${name}'s demo profile? This will also remove their related records from the local dataset.`)) return
    updateDb((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
      payments: prev.payments.filter((p) => p.memberId !== id),
      attendance: prev.attendance.filter((a) => a.memberId !== id),
      bookings: prev.bookings.filter((b) => b.memberId !== id),
      workoutPlans: prev.workoutPlans.filter((w) => w.memberId !== id),
      dietPlans: prev.dietPlans.filter((d) => d.memberId !== id),
      progress: prev.progress.filter((p) => p.memberId !== id),
    }))
    toast(`${name}'s profile deleted`, 'warning')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Member management"
        title="Members"
        subtitle="Registration, profiles, documents, status, membership history, and branch transfers."
        actions={<>
          <Button variant="outline" icon={Upload} onClick={() => toast('CSV import is simulated in this prototype', 'info')}>Import</Button>
          <Button variant="outline" icon={Download} onClick={exportMembers}>Export</Button>
          <Button icon={Plus} onClick={() => actions.openMemberForm()}>Add member</Button>
        </>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total members" value={all.length} icon={Users} hint={branchId === 'all' ? 'All branches' : db.branches.find((b) => b.id === branchId)?.name} />
        <StatCard title="Active" value={stats.active} icon={UserCheck} tone="green" hint="currently valid" />
        <StatCard title="Expired" value={stats.expired} icon={UserX} tone="red" hint="renewal needed" />
        <StatCard title="Trial / frozen" value={`${stats.trial} / ${stats.frozen}`} icon={Snowflake} tone="purple" hint="special status" />
        <StatCard title="Outstanding dues" value={formatCurrency(stats.dues, currency, true)} icon={MoreHorizontal} tone="amber" hint="to collect" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-blue-50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1) }} placeholder="Search name, ID, phone, email, goal…" className="w-full sm:w-72" />
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="h-10 w-auto min-w-[130px]"><option value="all">All statuses</option>{['Active', 'Expired', 'Trial', 'Frozen', 'Inactive'].map((s) => <option key={s}>{s}</option>)}</Select>
            <Select value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1) }} className="h-10 w-auto min-w-[160px]"><option value="all">All plans</option>{db.plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" icon={Bell} onClick={sendReminders}>Send reminder</Button>
            <div className="flex rounded-xl border border-blue-100 bg-white p-0.5"><button onClick={() => setView('table')} className={`rounded-lg p-1.5 ${view === 'table' ? 'bg-brand-50 text-brand-600' : 'text-slate-400'}`}><List className="h-4 w-4" /></button><button onClick={() => setView('grid')} className={`rounded-lg p-1.5 ${view === 'grid' ? 'bg-brand-50 text-brand-600' : 'text-slate-400'}`}><Grid2X2 className="h-4 w-4" /></button></div>
          </div>
        </div>

        {view === 'table' ? (
          <>
            <DataTable
              rows={pageRows}
              rowKey={(m) => m.id}
              onRowClick={(m) => openMember(m.id)}
              columns={[
                { key: 'name', header: 'Member', render: (m) => <div className="flex items-center gap-3"><Avatar name={m.name} src={m.photo} size="sm" /><div><p className="font-bold text-slate-700">{m.name}</p><p className="text-[11px] text-slate-400">{m.memberId} · {m.phone}</p></div></div> },
                { key: 'plan', header: 'Plan', render: (m) => <div><p className="text-xs font-semibold text-slate-700">{db.plans.find((p) => p.id === m.planId)?.name}</p><p className="text-[11px] text-slate-400">{db.branches.find((b) => b.id === m.branchId)?.name}</p></div> },
                { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
                { key: 'expiry', header: 'Expiry', render: (m) => <div><p className="text-xs font-medium text-slate-700">{formatDate(m.expiresAt)}</p><p className={`text-[11px] ${daysUntil(m.expiresAt) < 8 ? 'text-rose-500' : 'text-slate-400'}`}>{daysUntil(m.expiresAt) >= 0 ? `${daysUntil(m.expiresAt)} days left` : `${Math.abs(daysUntil(m.expiresAt))} days ago`}</p></div> },
                { key: 'engagement', header: 'Engagement', render: (m) => <div className="w-24"><div className="flex justify-between text-[10px] font-semibold text-slate-400"><span>{m.engagementScore}%</span><span>{m.attendanceCount} visits</span></div><ProgressBar className="mt-1.5" value={m.engagementScore} tone={m.engagementScore > 70 ? 'green' : m.engagementScore > 45 ? 'blue' : 'amber'} /></div> },
                { key: 'dues', header: 'Dues', align: 'right', render: (m) => <span className={`text-xs font-bold ${m.dueAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{formatCurrency(m.dueAmount, currency)}</span> },
                { key: 'actions', header: '', align: 'right', render: (m) => <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}><Button size="sm" variant="ghost" onClick={() => openMember(m.id)}>View</Button><Button size="sm" variant="soft" onClick={() => actions.openRenewForm(m)}>Renew</Button><button onClick={() => deleteMember(m.id, m.name)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete"><Trash2 className="h-4 w-4" /></button></div> },
              ]}
              empty={<EmptyState icon={Search} title="No members found" description="Try changing the filters or search term." action={<Button size="sm" onClick={() => { setQuery(''); setStatus('all'); setPlan('all') }}>Clear filters</Button>} />}
            />
            <Pagination page={currentPage} totalPages={totalPages} total={filtered.length} pageSize={pageSize} onPage={setPage} />
          </>
        ) : (
          <div className="p-4">
            {pageRows.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{pageRows.map((m) => (
              <button key={m.id} onClick={() => openMember(m.id)} className="rounded-2xl border border-blue-100 bg-white p-4 text-left transition hover:border-brand-300 hover:shadow-soft">
                <div className="flex items-start gap-3"><Avatar name={m.name} src={m.photo} size="lg" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-slate-800">{m.name}</p><p className="text-[11px] text-slate-400">{m.memberId}</p><div className="mt-1.5"><StatusBadge status={m.status} /></div></div><ArrowRight className="h-4 w-4 text-slate-300" /></div>
                <div className="mt-4 space-y-2 text-xs"><div className="flex justify-between"><span className="text-slate-400">Plan</span><span className="font-semibold text-slate-700">{db.plans.find((p) => p.id === m.planId)?.name}</span></div><div className="flex justify-between"><span className="text-slate-400">Expiry</span><span className="font-semibold text-slate-700">{formatDate(m.expiresAt)}</span></div><div className="flex justify-between"><span className="text-slate-400">Dues</span><span className={m.dueAmount ? 'font-bold text-amber-600' : 'font-bold text-emerald-600'}>{formatCurrency(m.dueAmount, currency)}</span></div></div>
                <div className="mt-3"><ProgressBar value={m.healthScore} tone={m.healthScore > 70 ? 'green' : 'amber'} showLabel /></div>
              </button>
            ))}</div> : <EmptyState icon={Users} title="No members found" description="Try changing the filters." />}
            <Pagination page={currentPage} totalPages={totalPages} total={filtered.length} pageSize={pageSize} onPage={setPage} />
          </div>
        )}
      </Card>
    </div>
  )
}

export function Pagination({ page, totalPages, total, pageSize, onPage }: { page: number; totalPages: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-blue-50 px-4 py-3 sm:flex-row">
      <p className="text-xs text-slate-400">Showing <span className="font-bold text-slate-600">{total ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)}</span> of <span className="font-bold text-slate-600">{total}</span> members</p>
      <div className="flex items-center gap-1"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button><span className="px-3 text-xs font-bold text-slate-500">{page} / {totalPages}</span><Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</Button></div>
    </div>
  )
}
