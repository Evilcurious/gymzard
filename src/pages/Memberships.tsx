import { useMemo, useState } from 'react'
import {
  ArrowRight, Building2, CalendarDays, CheckCircle2, CreditCard, Crown, Dumbbell, Heart,
  Layers, Pencil, Percent, Plus, RefreshCw, Snowflake, Sparkles, Ticket, Timer, Trash2,
  TrendingUp, UserPlus, Users, Zap,
} from 'lucide-react'
import { useApp } from '../lib/app-context'
import { useActions } from '../lib/actions'
import { addDays, daysUntil, formatCurrency, formatDate, isoDate } from '../lib/utils'
import type { Member, Plan } from '../types'
import { Avatar, Badge, Button, Card, CardHeader, DataTable, EmptyState, PageHeader, ProgressBar, StatCard, StatusBadge, Tabs } from '../components/ui'
import { Pagination } from './Members'

const categoryIcons: Record<Plan['category'], typeof CreditCard> = {
  Standard: CreditCard, 'Personal Training': Dumbbell, Family: Heart, Corporate: Building2, Trial: Timer,
}
const categoryTones: Record<Plan['category'], string> = {
  Standard: 'from-brand-500 to-blue-600', 'Personal Training': 'from-violet-500 to-brand-600',
  Family: 'from-rose-500 to-pink-500', Corporate: 'from-cyan-500 to-blue-600', Trial: 'from-amber-500 to-orange-500',
}

export function Memberships() {
  const { db, scope, updateDb, toast, openMember } = useApp()
  const actions = useActions()
  const [tab, setTab] = useState('plans')
  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(1)
  const currency = db.settings.currency
  const members = scope(db.members)
  const plans = scope(db.plans)
  const filteredPlans = plans.filter((p) => category === 'all' || p.category === category)
  const trialMembers = members.filter((m) => m.status === 'Trial')
  const frozenMembers = members.filter((m) => m.status === 'Frozen')
  const expiring = members.filter((m) => ['Active', 'Trial'].includes(m.status) && daysUntil(m.expiresAt) >= 0 && daysUntil(m.expiresAt) <= 14)
  const expired = members.filter((m) => m.status === 'Expired')
  const autoRenew = members.filter((m) => m.autoRenew).length
  const avgPlan = plans.length ? Math.round(plans.reduce((s, p) => s + p.price, 0) / plans.length) : 0
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(members.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedMembers = members.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function togglePlan(plan: Plan) {
    updateDb((prev) => ({ ...prev, plans: prev.plans.map((p) => p.id === plan.id ? { ...p, active: !p.active } : p) }))
    toast(`${plan.name} ${plan.active ? 'deactivated' : 'activated'}`)
  }

  function deletePlan(plan: Plan) {
    const used = db.members.some((m) => m.planId === plan.id)
    if (used) return toast('This plan is assigned to members. Deactivate it instead.', 'warning')
    if (!window.confirm(`Delete ${plan.name}?`)) return
    updateDb((prev) => ({ ...prev, plans: prev.plans.filter((p) => p.id !== plan.id) }))
    toast('Plan deleted', 'warning')
  }

  function extend(member: Member, days: number) {
    updateDb((prev) => ({ ...prev, members: prev.members.map((m) => m.id === member.id ? { ...m, expiresAt: isoDate(addDays(new Date(m.expiresAt), days)), status: 'Active' } : m) }))
    toast(`${member.name}'s membership extended by ${days} days`)
  }

  function unfreeze(member: Member) {
    updateDb((prev) => ({ ...prev, members: prev.members.map((m) => m.id === member.id ? { ...m, status: 'Active' } : m) }))
    toast(`${member.name}'s membership reactivated`)
  }

  function deleteCoupon(id: string) {
    if (!window.confirm('Delete this coupon?')) return
    updateDb((prev) => ({ ...prev, coupons: prev.coupons.filter((c) => c.id !== id) }))
    toast('Coupon deleted', 'warning')
  }

  const tabs = [
    { id: 'plans', label: 'Plans', count: plans.length },
    { id: 'subscriptions', label: 'Subscriptions', count: members.length },
    { id: 'coupons', label: 'Coupons', count: db.coupons.length },
    { id: 'trials', label: 'Trials', count: trialMembers.length },
    { id: 'requests', label: 'Requests', count: frozenMembers.length + expiring.length },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Membership & subscriptions"
        title="Membership plans"
        subtitle="Create plans, manage upgrades, freezes, renewals, trials, discounts, and auto-renewal."
        actions={<>
          <Button variant="outline" icon={Ticket} onClick={() => setTab('coupons')}>View offers</Button>
          <Button icon={Plus} onClick={() => actions.openPlanForm()}>Create plan</Button>
        </>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Active plans" value={plans.filter((p) => p.active).length} icon={Layers} hint={`${plans.length} total plans`} />
        <StatCard title="Active subscriptions" value={members.filter((m) => m.status === 'Active').length} icon={Users} tone="green" hint="paying members" />
        <StatCard title="Trial members" value={trialMembers.length} icon={Timer} tone="purple" hint="awaiting conversion" />
        <StatCard title="Auto-renew on" value={autoRenew} icon={RefreshCw} tone="cyan" hint="recurring billing" />
        <StatCard title="Average plan" value={formatCurrency(avgPlan, currency, true)} icon={CreditCard} tone="amber" hint="catalog price" />
      </div>

      <Tabs items={tabs} value={tab} onChange={(v) => { setTab(v); setPage(1) }} className="rounded-t-2xl border border-blue-100 bg-white px-2" />

      {tab === 'plans' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {['all', 'Standard', 'Personal Training', 'Family', 'Corporate', 'Trial'].map((c) => <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${category === c ? 'bg-brand-600 text-white' : 'border border-blue-100 bg-white text-slate-500 hover:bg-brand-50'}`}>{c === 'all' ? 'All plans' : c}</button>)}
            <span className="ml-auto text-xs text-slate-400">{filteredPlans.length} plans</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPlans.map((plan) => {
              const Icon = categoryIcons[plan.category]
              const assigned = db.members.filter((m) => m.planId === plan.id).length
              return (
                <Card key={plan.id} className={`relative overflow-hidden p-5 ${plan.popular ? 'ring-2 ring-brand-300' : ''}`}>
                  {plan.popular ? <div className="absolute right-0 top-0 rounded-bl-xl bg-brand-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">Popular</div> : null}
                  <div className="flex items-start gap-3"><span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${categoryTones[plan.category]} text-white`}><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-brand-500">{plan.category}</p><h3 className="mt-0.5 truncate text-base font-extrabold text-brand-950">{plan.name}</h3></div><StatusBadge status={plan.active ? 'Active' : 'Inactive'} /></div>
                  <p className="mt-3 line-clamp-2 min-h-[36px] text-xs leading-relaxed text-slate-500">{plan.description}</p>
                  <div className="mt-4 flex items-end gap-2"><span className="text-2xl font-extrabold text-brand-950">{formatCurrency(plan.price, currency)}</span><span className="pb-1 text-xs text-slate-400">/ {plan.durationDays} days</span></div>
                  <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-lg bg-brand-50/70 p-2.5"><p className="text-[10px] font-semibold uppercase text-slate-400">PT sessions</p><p className="mt-0.5 text-sm font-extrabold text-brand-950">{plan.sessions}</p></div><div className="rounded-lg bg-brand-50/70 p-2.5"><p className="text-[10px] font-semibold uppercase text-slate-400">Members</p><p className="mt-0.5 text-sm font-extrabold text-brand-950">{assigned}</p></div></div>
                  <div className="mt-4 space-y-1.5">{plan.features.slice(0, 4).map((f) => <p key={f} className="flex items-center gap-2 text-xs text-slate-600"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />{f}</p>)}</div>
                  <p className="mt-4 text-[11px] text-slate-400">Available at: {plan.branchId === 'all' ? 'All branches' : db.branches.find((b) => b.id === plan.branchId)?.name}</p>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-blue-50 pt-4"><Button size="sm" icon={CreditCard} onClick={() => actions.openPaymentForm(undefined, undefined, plan.id)}>Sell plan</Button><Button size="sm" variant="outline" icon={Pencil} onClick={() => actions.openPlanForm(plan)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => togglePlan(plan)}>{plan.active ? 'Deactivate' : 'Activate'}</Button><button onClick={() => deletePlan(plan)} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></div>
                </Card>
              )
            })}
          </div>
        </div>
      ) : null}

      {tab === 'subscriptions' ? (
        <Card>
          <CardHeader title="Member subscriptions" subtitle="Upgrade, downgrade, freeze, extend, or view a member profile." action={<Button size="sm" variant="outline" icon={RefreshCw} onClick={() => toast('Auto-renewal rules refreshed', 'info')}>Sync renewals</Button>} />
          <DataTable
            rows={pagedMembers}
            rowKey={(m) => m.id}
            onRowClick={(m) => openMember(m.id)}
            columns={[
              { key: 'name', header: 'Member', render: (m) => <div className="flex items-center gap-2.5"><Avatar name={m.name} src={m.photo} size="sm" /><div><p className="font-bold text-slate-700">{m.name}</p><p className="text-[11px] text-slate-400">{m.memberId}</p></div></div> },
              { key: 'plan', header: 'Current plan', render: (m) => <div><p className="text-xs font-semibold text-slate-700">{db.plans.find((p) => p.id === m.planId)?.name}</p><p className="text-[11px] text-slate-400">{formatDate(m.startsAt)} – {formatDate(m.expiresAt)}</p></div> },
              { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
              { key: 'renew', header: 'Auto-renew', render: (m) => m.autoRenew ? <Badge tone="green" dot>Enabled</Badge> : <Badge tone="slate">Off</Badge> },
              { key: 'days', header: 'Days left', render: (m) => <span className={daysUntil(m.expiresAt) < 8 ? 'font-bold text-rose-600' : 'font-semibold text-slate-600'}>{daysUntil(m.expiresAt)}</span> },
              { key: 'actions', header: '', align: 'right', render: (m) => <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}><Button size="sm" variant="soft" onClick={() => actions.openRenewForm(m)}>Upgrade</Button><Button size="sm" variant="ghost" onClick={() => extend(m, 15)}>+15d</Button><Button size="sm" variant="ghost" icon={Snowflake} onClick={() => actions.openFreezeForm(m)}>Freeze</Button></div> },
            ]}
          />
          <Pagination page={currentPage} totalPages={totalPages} total={members.length} pageSize={pageSize} onPage={setPage} />
        </Card>
      ) : null}

      {tab === 'coupons' ? (
        <div className="space-y-4">
          <div className="flex justify-end"><Button icon={Plus} onClick={() => actions.openCouponForm()}>Create coupon</Button></div>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {db.coupons.map((c) => (
              <Card key={c.id} className="relative overflow-hidden p-5">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-50" />
                <div className="relative flex items-start justify-between"><div><div className="flex items-center gap-2"><Ticket className="h-4 w-4 text-brand-600" /><p className="font-mono text-base font-extrabold tracking-wider text-brand-950">{c.code}</p></div><p className="mt-1 text-xs text-slate-500">{c.description}</p></div><StatusBadge status={c.status} /></div>
                <div className="mt-4 flex items-end gap-3"><span className="text-3xl font-extrabold text-brand-600">{c.discountType === 'percent' ? `${c.value}%` : formatCurrency(c.value, currency)}</span><span className="pb-1 text-xs text-slate-400">discount</span></div>
                <div className="mt-4 space-y-2 text-xs"><div className="flex justify-between"><span className="text-slate-400">Minimum invoice</span><span className="font-semibold text-slate-700">{formatCurrency(c.minAmount, currency)}</span></div><div className="flex justify-between"><span className="text-slate-400">Validity</span><span className="font-semibold text-slate-700">{formatDate(c.validFrom)} – {formatDate(c.validTo)}</span></div><div className="flex justify-between"><span className="text-slate-400">Applies to</span><span className="font-semibold text-slate-700">{c.appliesTo}</span></div></div>
                <div className="mt-4"><div className="flex justify-between text-[11px] font-semibold text-slate-500"><span>Usage</span><span>{c.used} / {c.usageLimit}</span></div><ProgressBar className="mt-1.5" value={c.used} max={c.usageLimit} tone="blue" /></div>
                <div className="mt-4 flex gap-2 border-t border-blue-50 pt-4"><Button size="sm" variant="outline" icon={Pencil} onClick={() => actions.openCouponForm(c)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => deleteCoupon(c.id)}>Delete</Button></div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'trials' ? (
        <Card>
          <CardHeader title="Trial membership pipeline" subtitle="Convert trial members into paying subscriptions." action={<Button size="sm" icon={UserPlus} onClick={() => actions.openMemberForm()}>Add trial member</Button>} />
          {trialMembers.length ? <DataTable rows={trialMembers} rowKey={(m) => m.id} columns={[
            { key: 'name', header: 'Member', render: (m) => <div className="flex items-center gap-2.5"><Avatar name={m.name} src={m.photo} size="sm" /><div><p className="font-bold text-slate-700">{m.name}</p><p className="text-[11px] text-slate-400">{m.phone}</p></div></div> },
            { key: 'trial', header: 'Trial ends', render: (m) => <span className="text-xs text-slate-600">{formatDate(m.expiresAt)}</span> },
            { key: 'days', header: 'Remaining', render: (m) => <Badge tone={daysUntil(m.expiresAt) <= 3 ? 'red' : 'amber'}>{daysUntil(m.expiresAt)} days</Badge> },
            { key: 'goal', header: 'Goal', render: (m) => <span className="text-xs text-slate-500">{m.goals}</span> },
            { key: 'engagement', header: 'Engagement', render: (m) => <div className="w-24"><ProgressBar value={m.engagementScore} tone={m.engagementScore > 60 ? 'green' : 'amber'} /></div> },
            { key: 'action', header: '', align: 'right', render: (m) => <Button size="sm" onClick={() => actions.openRenewForm(m)}>Convert to paid</Button> },
          ]} /> : <EmptyState icon={Timer} title="No active trials" description="Add a trial member or change an existing member's status to Trial." />}
        </Card>
      ) : null}

      {tab === 'requests' ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <RequestColumn title="Freeze requests" subtitle="Memberships currently paused" icon={Snowflake} tone="purple" items={frozenMembers} render={(m) => <RequestRow key={m.id} title={m.name} detail={`Frozen until ${formatDate(m.expiresAt)}`} action={<Button size="sm" variant="soft" onClick={() => unfreeze(m)}>Unfreeze</Button>} />} />
          <RequestColumn title="Upgrade opportunities" subtitle="Expiring within 14 days" icon={TrendingUp} tone="amber" items={expiring} render={(m) => <RequestRow key={m.id} title={m.name} detail={`Expires in ${daysUntil(m.expiresAt)} days`} action={<Button size="sm" variant="soft" onClick={() => actions.openRenewForm(m)}>Renew</Button>} />} />
          <RequestColumn title="Expired follow-ups" subtitle="Win back lapsed members" icon={Zap} tone="red" items={expired} render={(m) => <RequestRow key={m.id} title={m.name} detail={`Due ${formatCurrency(m.dueAmount, currency)}`} action={<Button size="sm" variant="outline" onClick={() => actions.openPaymentForm(m.id)}>Collect</Button>} />} />
        </div>
      ) : null}
    </div>
  )
}

function RequestColumn({ title, subtitle, icon: Icon, tone, items, render }: { title: string; subtitle: string; icon: typeof Snowflake; tone: 'purple' | 'amber' | 'red'; items: Member[]; render: (m: Member) => React.ReactNode }) {
  const tones = { purple: 'bg-violet-50 text-violet-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-rose-50 text-rose-600' }
  return (
    <Card>
      <CardHeader title={<span className="flex items-center gap-2"><span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tones[tone]}`}><Icon className="h-4 w-4" /></span>{title}</span>} subtitle={subtitle} action={<Badge tone={tone}>{items.length}</Badge>} />
      <div className="max-h-[420px] space-y-2 overflow-y-auto p-3">{items.length ? items.slice(0, 10).map(render) : <EmptyState icon={CheckCircle2} title="All clear" description="No pending requests in this queue." />}</div>
    </Card>
  )
}

function RequestRow({ title, detail, action }: { title: string; detail: string; action: React.ReactNode }) {
  return <div className="flex items-center gap-2 rounded-xl border border-blue-50 bg-white p-3"><Avatar name={title} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-700">{title}</p><p className="truncate text-[11px] text-slate-400">{detail}</p></div>{action}</div>
}
