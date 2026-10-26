import { useMemo } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, CreditCard, Download,
  Dumbbell, Plus, QrCode, Receipt, Sparkles, TrendingUp, UserPlus, Users, Wallet,
} from 'lucide-react'
import { useApp } from '../lib/app-context'
import { useActions } from '../lib/actions'
import { branchPerformance, dashboardMetrics, peakHourData, planDistribution } from '../lib/analytics'
import { daysUntil, downloadFile, formatCurrency, formatDate, formatShortDate, relativeTime, toCsv } from '../lib/utils'
import { BranchBarChart, MemberGrowthChart, PeakHoursChart, PlanDonutChart, RevenueAreaChart } from '../components/charts'
import { Avatar, Badge, Button, Card, CardHeader, DataTable, PageHeader, ProgressBar, StatCard, StatusBadge } from '../components/ui'

const activityIcons = {
  payment: CreditCard, member: UserPlus, attendance: QrCode, class: CalendarDays, system: Sparkles, alert: AlertTriangle,
}
const activityTones = {
  payment: 'bg-emerald-50 text-emerald-600', member: 'bg-brand-50 text-brand-600', attendance: 'bg-cyan-50 text-cyan-600',
  class: 'bg-violet-50 text-violet-600', system: 'bg-blue-50 text-blue-600', alert: 'bg-amber-50 text-amber-600',
}

export function Dashboard() {
  const { db, user, branchId, navigate, openMember, openCheckIn, openAI, openReceipt } = useApp()
  const actions = useActions()
  const currency = db.settings.currency
  const metrics = useMemo(() => dashboardMetrics(db, branchId), [db, branchId])
  const peak = useMemo(() => peakHourData(metrics.attendance), [metrics.attendance])
  const plans = useMemo(() => planDistribution(db, branchId), [db, branchId])
  const branches = useMemo(() => branchPerformance(db), [db])
  const lastMonth = db.monthlyRevenue.at(-1)?.revenue || 1
  const prevMonth = db.monthlyRevenue.at(-2)?.revenue || lastMonth
  const revenueChange = Math.round(((lastMonth - prevMonth) / prevMonth) * 100)
  const memberChange = Math.round(((db.memberGrowth.at(-1)?.members || 1) / (db.memberGrowth.at(-2)?.members || 1) - 1) * 100)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const branchName = branchId === 'all' ? 'All branches' : db.branches.find((b) => b.id === branchId)?.name

  function exportOverview() {
    const rows = metrics.members.map((m) => ({
      'Member ID': m.memberId, Name: m.name, Email: m.email, Phone: m.phone, Status: m.status,
      Plan: db.plans.find((p) => p.id === m.planId)?.name || '', Expiry: m.expiresAt,
      'Outstanding': m.dueAmount, Branch: db.branches.find((b) => b.id === m.branchId)?.name || '',
    }))
    downloadFile(`gymzard-members-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows), 'text/csv;charset=utf-8')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${greeting}, ${user?.name.split(' ')[0] || 'there'}`}
        title="Gym overview"
        subtitle={`Live performance snapshot for ${branchName} · ${formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
        actions={<>
          <Button variant="outline" icon={Download} onClick={exportOverview}>Export CSV</Button>
          <Button variant="soft" icon={QrCode} onClick={openCheckIn}>Quick check-in</Button>
          <Button icon={Plus} onClick={() => actions.openMemberForm()}>Add member</Button>
        </>}
      />

      <div className="blue-gradient relative overflow-hidden rounded-2xl px-5 py-5 text-white shadow-soft sm:px-7 sm:py-6">
        <div className="blue-grid absolute inset-0 opacity-30" />
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[42px] border-white/5" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2"><span className="flex h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_#6ee7b7]" /><span className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-100">Live workspace</span></div>
            <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">Everything your gym needs, working together.</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-blue-100">Monitor revenue, memberships, attendance, classes, and staff performance from a single source of truth.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <HeroStat label="Today's collection" value={formatCurrency(metrics.todayCollection, currency, true)} />
            <HeroStat label="Visits today" value={metrics.todayAttendance} />
            <HeroStat label="Inside now" value={metrics.insideNow} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total members" value={metrics.members.length} icon={Users} change={memberChange} hint="vs last month" />
        <StatCard title="Active memberships" value={metrics.activeMembers} icon={CheckCircle2} tone="green" change={8} hint={`${metrics.retention}% retention`} />
        <StatCard title="Monthly revenue" value={formatCurrency(metrics.monthlyRevenue, currency, true)} icon={Wallet} change={revenueChange} hint="current month" />
        <StatCard title="Pending dues" value={formatCurrency(metrics.pendingDues, currency, true)} icon={AlertTriangle} tone="amber" hint={`${metrics.payments.filter((p) => p.status !== 'Paid').length} invoices`} />
        <StatCard title="Expired memberships" value={metrics.expiredMembers} icon={Activity} tone="red" hint="needs renewal" />
        <StatCard title="Expiring in 7 days" value={metrics.expiringSoon.length} icon={CalendarDays} tone="purple" hint="send reminders" />
        <StatCard title="Today's attendance" value={metrics.todayAttendance} icon={QrCode} tone="cyan" hint={`${metrics.insideNow} inside now`} />
        <StatCard title="New this month" value={metrics.newThisMonth} icon={TrendingUp} hint="registrations" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.8fr_1fr]">
        <Card>
          <CardHeader title="Revenue & expenses" subtitle="12-month financial performance" action={<div className="flex gap-1.5"><Badge tone="blue">Revenue</Badge><Badge tone="slate">Expenses</Badge><Badge tone="amber">Target</Badge></div>} />
          <div className="px-2 py-4 sm:px-4"><RevenueAreaChart data={db.monthlyRevenue} currency={currency} /></div>
        </Card>
        <Card>
          <CardHeader title="Membership mix" subtitle="Members by plan category" action={<Button size="sm" variant="ghost" onClick={() => navigate('memberships')}>View plans <ArrowRight className="h-3.5 w-3.5" /></Button>} />
          <div className="px-2 py-3"><PlanDonutChart data={plans} /></div>
          <div className="grid grid-cols-2 gap-2 border-t border-blue-50 px-5 py-4">
            <div className="rounded-xl bg-brand-50/60 p-3"><p className="text-[11px] font-semibold text-slate-500">MRR</p><p className="mt-1 text-base font-extrabold text-brand-950">{formatCurrency(metrics.mrr, currency, true)}</p></div>
            <div className="rounded-xl bg-brand-50/60 p-3"><p className="text-[11px] font-semibold text-slate-500">Revenue / member</p><p className="mt-1 text-base font-extrabold text-brand-950">{formatCurrency(metrics.arpm, currency, true)}</p></div>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Membership growth" subtitle="New members and renewals over time" action={<Badge tone="green"><TrendingUp className="mr-1 h-3 w-3" />+{memberChange}%</Badge>} />
          <div className="px-2 py-4 sm:px-4"><MemberGrowthChart data={db.memberGrowth} /></div>
        </Card>
        <Card>
          <CardHeader title="Peak gym hours" subtitle="Check-ins by hour across the last 30 days" action={<Badge tone="blue">Last 30 days</Badge>} />
          <div className="px-2 py-4 sm:px-4"><PeakHoursChart data={peak} /></div>
          <div className="border-t border-blue-50 px-5 py-3"><div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-500">Live capacity</span><span className="font-bold text-brand-700">{metrics.insideNow} / {Math.max(60, metrics.members.length)}</span></div><ProgressBar className="mt-2" value={metrics.insideNow} max={Math.max(60, metrics.members.length)} tone="blue" /></div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader title="Memberships expiring soon" subtitle="Renewal opportunities in the next 7 days" action={<Button size="sm" variant="outline" icon={ArrowRight} onClick={() => navigate('members')}>View all</Button>} />
          <DataTable
            rows={metrics.expiringSoon.slice(0, 6)}
            rowKey={(m) => m.id}
            onRowClick={(m) => openMember(m.id)}
            compact
            columns={[
              { key: 'name', header: 'Member', render: (m) => <div className="flex items-center gap-2.5"><Avatar name={m.name} src={m.photo} size="sm" /><div><p className="font-bold text-slate-700">{m.name}</p><p className="text-[11px] text-slate-400">{m.memberId}</p></div></div> },
              { key: 'plan', header: 'Plan', render: (m) => <span className="text-xs font-semibold text-slate-600">{db.plans.find((p) => p.id === m.planId)?.name}</span> },
              { key: 'expiry', header: 'Expiry', render: (m) => <span className="text-xs text-slate-500">{formatDate(m.expiresAt)}</span> },
              { key: 'days', header: 'Days left', render: (m) => <Badge tone={daysUntil(m.expiresAt) <= 3 ? 'red' : 'amber'}>{daysUntil(m.expiresAt)} days</Badge> },
              { key: 'action', header: '', align: 'right', render: () => <ArrowRight className="ml-auto h-4 w-4 text-slate-300" /> },
            ]}
            empty="No memberships expire in the next 7 days."
          />
        </Card>
        <Card>
          <CardHeader title="Recent activity" subtitle="Latest events across your workspace" action={<Badge tone="blue"><Activity className="mr-1 h-3 w-3" />Live</Badge>} />
          <div className="max-h-[350px] space-y-0 overflow-y-auto p-4">
            {db.activity.slice(0, 7).map((a) => {
              const Icon = activityIcons[a.type]
              return (
                <div key={a.id} className="flex gap-3 border-b border-blue-50 py-3 last:border-0">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activityTones[a.type]}`}><Icon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-700">{a.title}</p><p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{a.detail}</p><p className="mt-1 text-[10px] text-slate-400">{relativeTime(a.time)}</p></div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.55fr]">
        <Card>
          <CardHeader title="Quick actions" subtitle="Common front-desk workflows" />
          <div className="grid grid-cols-2 gap-2.5 p-4">
            <QuickAction icon={QrCode} label="Scan check-in" onClick={openCheckIn} />
            <QuickAction icon={UserPlus} label="Register member" onClick={() => actions.openMemberForm()} />
            <QuickAction icon={Receipt} label="Collect payment" onClick={() => actions.openPaymentForm()} />
            <QuickAction icon={CalendarDays} label="Schedule class" onClick={() => actions.openClassForm()} />
            <QuickAction icon={Dumbbell} label="AI workout plan" onClick={() => openAI('workout')} />
            <QuickAction icon={Wallet} label="Record expense" onClick={() => actions.openExpenseForm()} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Branch performance" subtitle="Revenue vs target across all branches" action={<Button size="sm" variant="ghost" onClick={() => navigate('branches')}>Manage <ArrowRight className="h-3.5 w-3.5" /></Button>} />
          <div className="px-2 py-4 sm:px-4"><BranchBarChart data={branches} currency={currency} /></div>
          <div className="overflow-x-auto border-t border-blue-50"><table className="w-full min-w-[560px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-4 py-2.5">Branch</th><th className="px-4 py-2.5">Members</th><th className="px-4 py-2.5">Revenue</th><th className="px-4 py-2.5">Target</th><th className="px-4 py-2.5">Status</th></tr></thead><tbody className="divide-y divide-blue-50">{branches.map((b) => <tr key={b.id}><td className="px-4 py-2.5 font-bold text-slate-700">{b.name}</td><td className="px-4 py-2.5 text-slate-500">{b.members}</td><td className="px-4 py-2.5 font-semibold text-brand-700">{formatCurrency(b.revenue, currency, true)}</td><td className="px-4 py-2.5 text-slate-500">{Math.round((b.revenue / b.target) * 100)}%</td><td className="px-4 py-2.5"><StatusBadge status={b.status} /></td></tr>)}</tbody></table></div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard label="Projected month-end" value={formatCurrency(lastMonth, currency, true)} hint="based on current run rate" icon={TrendingUp} />
        <InsightCard label="Profit this month" value={formatCurrency(metrics.profit, currency, true)} hint={`${formatCurrency(metrics.monthlyExpenses, currency, true)} expenses`} icon={Wallet} />
        <InsightCard label="Avg. daily visits" value={Math.round(metrics.attendance.length / 30)} hint="last 30 days" icon={QrCode} />
        <InsightCard label="Recent invoices" value={metrics.payments.length} hint={<button onClick={() => openReceipt(metrics.payments[0]?.id || '')} className="text-brand-600 hover:underline">Open latest receipt</button>} icon={CreditCard} />
      </div>
    </div>
  )
}

function HeroStat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="min-w-[110px] rounded-xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur-sm"><p className="text-[10px] font-semibold uppercase tracking-wide text-blue-100">{label}</p><p className="mt-1 text-lg font-extrabold sm:text-xl">{value}</p></div>
}

function QuickAction({ icon: Icon, label, onClick }: { icon: typeof QrCode; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="group flex items-center gap-3 rounded-xl border border-blue-100 bg-white p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/60"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white"><Icon className="h-4 w-4" /></span><span className="text-xs font-bold text-slate-700">{label}</span><ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300 group-hover:text-brand-500" /></button>
}

function InsightCard({ label, value, hint, icon: Icon }: { label: string; value: React.ReactNode; hint: React.ReactNode; icon: typeof TrendingUp }) {
  return <Card className="flex items-center gap-3 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-[11px] font-semibold text-slate-500">{label}</p><p className="mt-0.5 text-lg font-extrabold text-brand-950">{value}</p><p className="truncate text-[10px] text-slate-400">{hint}</p></div></Card>
}
