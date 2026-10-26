import { useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, CreditCard, Download, Plus, Printer,
  Receipt, RefreshCw, RotateCcw, Search, ShieldCheck, TrendingUp, Wallet, Zap,
} from 'lucide-react'
import { useApp } from '../lib/app-context'
import { useActions } from '../lib/actions'
import { dashboardMetrics, paymentMethodBreakdown } from '../lib/analytics'
import { addDays, downloadFile, formatCurrency, formatDate, isoDate, isoDateTime, toCsv, uid } from '../lib/utils'
import type { Member, Payment } from '../types'
import { FinanceBarChart, ProgressLineChart } from '../components/charts'
import { Avatar, Badge, Button, Card, CardHeader, DataTable, EmptyState, PageHeader, ProgressBar, SearchInput, Select, StatCard, StatusBadge, Tabs, Toggle } from '../components/ui'
import { Pagination } from './Members'

export function Payments() {
  const { db, scope, openReceipt, openMember, updateDb, toast, logActivity, branchId } = useApp()
  const actions = useActions()
  const [tab, setTab] = useState('overview')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [method, setMethod] = useState('all')
  const [page, setPage] = useState(1)
  const [gatewayState, setGatewayState] = useState<Record<string, boolean>>({ Razorpay: true, Stripe: true, JazzCash: false, PayPal: false })
  const currency = db.settings.currency
  const payments = scope(db.payments)
  const members = scope(db.members)
  const metrics = useMemo(() => dashboardMetrics(db, branchId), [db, branchId])
  const pageSize = 10

  const filtered = useMemo(() => payments.filter((p) => {
    const q = query.toLowerCase()
    const matchQuery = !q || `${p.invoiceNo} ${p.memberName} ${p.method} ${p.gateway}`.toLowerCase().includes(q)
    const matchStatus = status === 'all' || p.status === status
    const matchMethod = method === 'all' || p.method === method
    return matchQuery && matchStatus && matchMethod
  }).sort((a, b) => +new Date(b.date) - +new Date(a.date)), [payments, query, status, method])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const dailyRevenue = useMemo(() => Array.from({ length: 14 }).map((_, i) => {
    const date = isoDate(new Date(Date.now() - (13 - i) * 86400000))
    return { date: date.slice(5), Revenue: payments.filter((p) => isoDate(p.date) === date).reduce((s, p) => s + p.paid, 0), Target: 45000 }
  }), [payments])
  const methodData = useMemo(() => paymentMethodBreakdown(payments), [payments])
  const gst = payments.reduce((s, p) => s + p.tax, 0)
  const refunded = payments.reduce((s, p) => s + (p.refunded || 0), 0)
  const duesMembers = members.filter((m) => m.dueAmount > 0)
  const recurring = members.filter((m) => m.autoRenew)
  const refundRows = payments.filter((p) => p.status === 'Refunded' || (p.refunded || 0) > 0 || p.status === 'Partial')

  function exportLedger() {
    downloadFile('gymzard-payment-ledger.csv', toCsv(filtered.map((p) => ({
      Invoice: p.invoiceNo, Member: p.memberName, Date: p.date, Plan: db.plans.find((x) => x.id === p.planId)?.name || '',
      Method: p.method, Gateway: p.gateway, Subtotal: p.subtotal, Discount: p.discount, Tax: p.tax,
      Total: p.total, Paid: p.paid, Balance: p.total - p.paid, Status: p.status,
    }))), 'text/csv;charset=utf-8')
    toast('Payment ledger exported as CSV')
  }

  function chargeNow(member: Member) {
    const plan = db.plans.find((p) => p.id === member.planId) || db.plans[0]
    const tax = Math.round(plan.price * db.settings.taxRate / 100)
    const total = plan.price + tax
    const payment: Payment = {
      id: uid('pay'), invoiceNo: `${db.settings.receiptPrefix}-${Date.now().toString().slice(-7)}`, memberId: member.id, memberName: member.name,
      planId: plan.id, branchId: member.branchId, date: isoDateTime(new Date()), dueDate: isoDate(new Date()), subtotal: plan.price,
      discount: 0, tax, total, paid: total, method: 'Card', status: 'Paid', gateway: 'Stripe', note: 'Recurring subscription charge',
    }
    updateDb((prev) => ({
      ...prev,
      payments: [payment, ...prev.payments],
      members: prev.members.map((m) => m.id === member.id ? { ...m, dueAmount: 0, status: 'Active', startsAt: isoDate(new Date()), expiresAt: isoDate(addDays(new Date(), plan.durationDays)) } : m),
    }))
    logActivity('Recurring charge', `${formatCurrency(total, currency)} charged to ${member.name}`, 'payment')
    toast(`Recurring charge of ${formatCurrency(total, currency)} simulated`)
  }

  function toggleAutoRenew(member: Member) {
    updateDb((prev) => ({ ...prev, members: prev.members.map((m) => m.id === member.id ? { ...m, autoRenew: !m.autoRenew } : m) }))
    toast(`${member.name}'s auto-renewal ${member.autoRenew ? 'paused' : 'enabled'}`)
  }

  function sendReminder(member: Member) {
    updateDb((prev) => ({ ...prev, notifications: [{
      id: uid('ntf'), title: 'Payment reminder', body: `Hi ${member.name.split(' ')[0]}, your outstanding balance is ${formatCurrency(member.dueAmount, currency)}.`,
      channel: 'SMS', audience: member.name, sentAt: new Date().toISOString(), status: 'Sent', read: false,
    }, ...prev.notifications] }))
    toast(`Payment reminder queued for ${member.name}`)
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'invoices', label: 'Invoices', count: filtered.length },
    { id: 'dues', label: 'Pending dues', count: duesMembers.length },
    { id: 'refunds', label: 'Refunds', count: refundRows.length },
    { id: 'gateways', label: 'Gateways' },
    { id: 'recurring', label: 'Recurring', count: recurring.length },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payments & billing"
        title="Billing center"
        subtitle="Collect fees, generate invoices, track dues, process refunds, and manage recurring payments."
        actions={<>
          <Button variant="outline" icon={Download} onClick={exportLedger}>Export ledger</Button>
          <Button icon={Plus} onClick={() => actions.openPaymentForm()}>Collect payment</Button>
        </>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Today's collection" value={formatCurrency(metrics.todayCollection, currency, true)} icon={Wallet} tone="green" hint="cash + digital" />
        <StatCard title="Monthly revenue" value={formatCurrency(metrics.monthlyRevenue, currency, true)} icon={TrendingUp} hint="current month" />
        <StatCard title="Pending dues" value={formatCurrency(metrics.pendingDues, currency, true)} icon={AlertTriangle} tone="amber" hint={`${duesMembers.length} members`} />
        <StatCard title="GST collected" value={formatCurrency(gst, currency, true)} icon={Receipt} tone="blue" hint={`${db.settings.taxRate}% tax rate`} />
        <StatCard title="Refunds" value={formatCurrency(refunded, currency, true)} icon={RotateCcw} tone="red" hint="demo total" />
      </div>

      <Tabs items={tabs} value={tab} onChange={(v) => { setTab(v); setPage(1) }} className="rounded-t-2xl border border-blue-100 bg-white px-2" />

      {tab === 'overview' ? (
        <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
          <div className="space-y-5">
            <Card>
              <CardHeader title="Daily revenue" subtitle="Collections over the last 14 days" action={<Badge tone="blue"><TrendingUp className="mr-1 h-3 w-3" />Live</Badge>} />
              <div className="px-2 py-4 sm:px-4"><ProgressLineChart data={dailyRevenue} dataKeys={[{ key: 'Revenue', name: 'Revenue', color: '#1557d6' }, { key: 'Target', name: 'Target', color: '#e6a21a' }]} /></div>
            </Card>
            <Card>
              <CardHeader title="Recent invoices" subtitle="Latest payment activity" action={<Button size="sm" variant="ghost" onClick={() => setTab('invoices')}>View all <ArrowRight className="h-3.5 w-3.5" /></Button>} />
              <DataTable rows={payments.slice(0, 6)} rowKey={(p) => p.id} compact columns={[
                { key: 'invoice', header: 'Invoice', render: (p) => <div><p className="font-bold text-slate-700">{p.invoiceNo}</p><p className="text-[11px] text-slate-400">{formatDate(p.date)}</p></div> },
                { key: 'member', header: 'Member', render: (p) => <span className="text-xs font-medium text-slate-600">{p.memberName}</span> },
                { key: 'method', header: 'Method', render: (p) => <Badge tone="slate">{p.method}</Badge> },
                { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
                { key: 'total', header: 'Total', align: 'right', render: (p) => <span className="font-bold text-brand-700">{formatCurrency(p.total, currency)}</span> },
                { key: 'action', header: '', align: 'right', render: (p) => <button onClick={() => openReceipt(p.id)} className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"><Printer className="h-4 w-4" /></button> },
              ]} />
            </Card>
          </div>
          <div className="space-y-5">
            <Card>
              <CardHeader title="Revenue by method" subtitle="Collection channel distribution" />
              <div className="px-2 py-4"><FinanceBarChart data={methodData.map((m) => ({ name: m.name, value: m.value, color: '#1557d6' }))} currency={currency} /></div>
            </Card>
            <Card>
              <CardHeader title="Billing health" subtitle="Key collection indicators" />
              <div className="space-y-4 p-5">
                <HealthRow label="Collection rate" value={Math.round((payments.reduce((s, p) => s + p.paid, 0) / Math.max(1, payments.reduce((s, p) => s + p.total, 0))) * 100)} tone="green" />
                <HealthRow label="Invoices paid" value={Math.round((payments.filter((p) => p.status === 'Paid').length / Math.max(1, payments.length)) * 100)} tone="blue" />
                <HealthRow label="Partial payments" value={Math.round((payments.filter((p) => p.status === 'Partial').length / Math.max(1, payments.length)) * 100)} tone="amber" />
                <HealthRow label="Recurring coverage" value={Math.round((recurring.length / Math.max(1, members.length)) * 100)} tone="purple" />
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Zap className="h-5 w-5" /></span><div><p className="text-sm font-extrabold text-brand-950">Quick billing actions</p><p className="text-xs text-slate-500">Common front-desk tasks</p></div></div>
              <div className="mt-4 grid grid-cols-2 gap-2"><Button size="sm" variant="soft" onClick={() => actions.openPaymentForm()}>New invoice</Button><Button size="sm" variant="outline" onClick={() => setTab('dues')}>Pending dues</Button><Button size="sm" variant="outline" onClick={() => setTab('refunds')}>Refunds</Button><Button size="sm" variant="outline" onClick={() => setTab('recurring')}>Auto-renew</Button></div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === 'invoices' ? (
        <Card>
          <div className="flex flex-col gap-3 border-b border-blue-50 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap gap-2"><SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1) }} placeholder="Search invoice, member, gateway…" className="w-full sm:w-72" /><Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="h-10 w-auto min-w-[130px]"><option value="all">All statuses</option>{['Paid', 'Partial', 'Pending', 'Refunded'].map((s) => <option key={s}>{s}</option>)}</Select><Select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1) }} className="h-10 w-auto min-w-[130px]"><option value="all">All methods</option>{['Cash', 'UPI', 'Card', 'Online', 'Bank Transfer'].map((m) => <option key={m}>{m}</option>)}</Select></div>
            <Button size="sm" icon={Plus} onClick={() => actions.openPaymentForm()}>New invoice</Button>
          </div>
          <DataTable rows={pageRows} rowKey={(p) => p.id} columns={[
            { key: 'invoice', header: 'Invoice', render: (p) => <div><p className="font-bold text-slate-700">{p.invoiceNo}</p><p className="text-[11px] text-slate-400">{formatDate(p.date)} · {p.gateway || 'Manual'}</p></div> },
            { key: 'member', header: 'Member', render: (p) => <button onClick={() => { const m = db.members.find((x) => x.id === p.memberId); if (m) openMember(m.id) }} className="flex items-center gap-2 text-left"><Avatar name={p.memberName} size="xs" /><span className="text-xs font-semibold text-slate-700 hover:text-brand-600">{p.memberName}</span></button> },
            { key: 'plan', header: 'Plan', render: (p) => <span className="text-xs text-slate-500">{db.plans.find((x) => x.id === p.planId)?.name}</span> },
            { key: 'method', header: 'Method', render: (p) => <Badge tone="slate">{p.method}</Badge> },
            { key: 'breakdown', header: 'Breakdown', render: (p) => <div className="text-[11px] text-slate-400"><p>Base {formatCurrency(p.subtotal, currency)} · GST {formatCurrency(p.tax, currency)}</p><p>{p.discount ? `Discount −${formatCurrency(p.discount, currency)}` : 'No discount'}</p></div> },
            { key: 'paid', header: 'Paid / Total', render: (p) => <div className="w-28"><div className="flex justify-between text-[10px] font-semibold text-slate-500"><span>{formatCurrency(p.paid, currency, true)}</span><span>{formatCurrency(p.total, currency, true)}</span></div><ProgressBar className="mt-1.5" value={p.paid} max={p.total} tone={p.paid >= p.total ? 'green' : 'amber'} /></div> },
            { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
            { key: 'actions', header: '', align: 'right', render: (p) => <div className="flex justify-end gap-1"><Button size="sm" variant="ghost" icon={Printer} onClick={() => openReceipt(p.id)}>Receipt</Button>{p.paid < p.total ? <Button size="sm" variant="soft" onClick={() => actions.openPaymentForm(undefined, p.id)}>Collect</Button> : null}{p.paid > 0 ? <button onClick={() => actions.openRefundForm(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Refund"><RotateCcw className="h-4 w-4" /></button> : null}</div> },
          ]} empty={<EmptyState icon={Search} title="No invoices found" description="Adjust the filters to see more results." />} />
          <Pagination page={currentPage} totalPages={totalPages} total={filtered.length} pageSize={pageSize} onPage={setPage} />
        </Card>
      ) : null}

      {tab === 'dues' ? (
        <Card>
          <CardHeader title="Outstanding balance report" subtitle="Members with pending or partial membership fees" action={<Button size="sm" variant="outline" icon={Download} onClick={() => downloadFile('gymzard-dues.csv', toCsv(duesMembers.map((m) => ({ Member: m.name, ID: m.memberId, Phone: m.phone, Due: m.dueAmount, Expiry: m.expiresAt, Status: m.status }))), 'text/csv;charset=utf-8')}>Export dues</Button>} />
          {duesMembers.length ? <DataTable rows={duesMembers} rowKey={(m) => m.id} columns={[
            { key: 'member', header: 'Member', render: (m) => <div className="flex items-center gap-2.5"><Avatar name={m.name} src={m.photo} size="sm" /><div><p className="font-bold text-slate-700">{m.name}</p><p className="text-[11px] text-slate-400">{m.memberId} · {m.phone}</p></div></div> },
            { key: 'plan', header: 'Plan', render: (m) => <span className="text-xs text-slate-500">{db.plans.find((p) => p.id === m.planId)?.name}</span> },
            { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
            { key: 'due', header: 'Outstanding', render: (m) => <span className="font-extrabold text-amber-600">{formatCurrency(m.dueAmount, currency)}</span> },
            { key: 'expiry', header: 'Expiry', render: (m) => <span className="text-xs text-slate-500">{formatDate(m.expiresAt)}</span> },
            { key: 'actions', header: '', align: 'right', render: (m) => <div className="flex justify-end gap-1"><Button size="sm" variant="outline" onClick={() => sendReminder(m)}>Remind</Button><Button size="sm" onClick={() => actions.openPaymentForm(m.id)}>Collect</Button></div> },
          ]} /> : <EmptyState icon={CheckCircle2} title="No outstanding dues" description="All member balances are clear." />}
        </Card>
      ) : null}

      {tab === 'refunds' ? (
        <Card>
          <CardHeader title="Refund management" subtitle="Partial payments and processed refunds" action={<Badge tone="red">{formatCurrency(refunded, currency)} refunded</Badge>} />
          {refundRows.length ? <DataTable rows={refundRows} rowKey={(p) => p.id} columns={[
            { key: 'invoice', header: 'Invoice', render: (p) => <div><p className="font-bold text-slate-700">{p.invoiceNo}</p><p className="text-[11px] text-slate-400">{formatDate(p.date)}</p></div> },
            { key: 'member', header: 'Member', render: (p) => <span className="text-xs text-slate-600">{p.memberName}</span> },
            { key: 'paid', header: 'Paid', render: (p) => <span className="text-xs font-semibold text-slate-700">{formatCurrency(p.paid, currency)}</span> },
            { key: 'refunded', header: 'Refunded', render: (p) => <span className="text-xs font-bold text-rose-600">{formatCurrency(p.refunded || 0, currency)}</span> },
            { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
            { key: 'action', header: '', align: 'right', render: (p) => <Button size="sm" variant="outline" icon={RotateCcw} onClick={() => actions.openRefundForm(p)}>Process refund</Button> },
          ]} /> : <EmptyState icon={RotateCcw} title="No refunds to process" />}
        </Card>
      ) : null}

      {tab === 'gateways' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { name: 'Razorpay', desc: 'UPI, cards, netbanking', fee: '2.0% + GST', color: '#1557d6' },
            { name: 'Stripe', desc: 'International cards', fee: '2.9% + 30c', color: '#635bff' },
            { name: 'JazzCash', desc: 'Mobile wallet payments', fee: '1.8%', color: '#e11d48' },
            { name: 'PayPal', desc: 'Global online checkout', fee: '3.4%', color: '#0e7bb8' },
          ].map((g) => {
            const volume = payments.filter((p) => p.gateway === g.name).reduce((s, p) => s + p.paid, 0)
            return (
              <Card key={g.name} className="p-5">
                <div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: g.color }}><CreditCard className="h-5 w-5" /></span><Badge tone={gatewayState[g.name] ? 'green' : 'slate'} dot>{gatewayState[g.name] ? 'Connected' : 'Not connected'}</Badge></div>
                <h3 className="mt-4 text-base font-extrabold text-brand-950">{g.name}</h3><p className="mt-1 text-xs text-slate-500">{g.desc}</p>
                <div className="mt-4 space-y-2 text-xs"><div className="flex justify-between"><span className="text-slate-400">Demo volume</span><span className="font-bold text-slate-700">{formatCurrency(volume, currency, true)}</span></div><div className="flex justify-between"><span className="text-slate-400">Processing fee</span><span className="font-bold text-slate-700">{g.fee}</span></div></div>
                <div className="mt-4 border-t border-blue-50 pt-3"><Toggle checked={!!gatewayState[g.name]} onChange={(v) => { setGatewayState((s) => ({ ...s, [g.name]: v })); toast(`${g.name} ${v ? 'connected' : 'disconnected'} (demo)`, 'info') }} label="Enable gateway" /></div>
              </Card>
            )
          })}
          <Card className="md:col-span-2 xl:col-span-4 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck className="h-5 w-5" /></span><div><p className="text-sm font-extrabold text-brand-950">Secure payment simulation</p><p className="text-xs text-slate-500">Gateway toggles and transactions are demo-only. No credentials or real money are involved.</p></div></div><Button variant="outline" onClick={() => toast('Gateway settings saved', 'info')}>Save gateway settings</Button></div></Card>
        </div>
      ) : null}

      {tab === 'recurring' ? (
        <Card>
          <CardHeader title="Recurring subscriptions" subtitle="Auto-renewal schedule and simulated subscription charges" action={<Badge tone="cyan">{recurring.length} active mandates</Badge>} />
          <DataTable rows={recurring} rowKey={(m) => m.id} columns={[
            { key: 'member', header: 'Member', render: (m) => <div className="flex items-center gap-2.5"><Avatar name={m.name} size="sm" /><div><p className="font-bold text-slate-700">{m.name}</p><p className="text-[11px] text-slate-400">{m.memberId}</p></div></div> },
            { key: 'plan', header: 'Plan', render: (m) => <span className="text-xs text-slate-600">{db.plans.find((p) => p.id === m.planId)?.name}</span> },
            { key: 'amount', header: 'Next charge', render: (m) => <span className="text-xs font-bold text-brand-700">{formatCurrency(db.plans.find((p) => p.id === m.planId)?.price || 0, currency)}</span> },
            { key: 'next', header: 'Renewal date', render: (m) => <div className="flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{formatDate(m.expiresAt)}</div> },
            { key: 'status', header: 'Mandate', render: (m) => <StatusBadge status={m.autoRenew ? 'Active' : 'Paused'} /> },
            { key: 'actions', header: '', align: 'right', render: (m) => <div className="flex justify-end gap-1"><Button size="sm" variant="outline" onClick={() => toggleAutoRenew(m)}>Pause</Button><Button size="sm" icon={RefreshCw} onClick={() => chargeNow(m)}>Charge now</Button></div> },
          ]} empty={<EmptyState icon={RefreshCw} title="No recurring mandates" description="Enable auto-renewal on a member profile to see it here." />} />
        </Card>
      ) : null}
    </div>
  )
}

function HealthRow({ label, value, tone }: { label: string; value: number; tone: 'green' | 'blue' | 'amber' | 'purple' }) {
  const colors = { green: 'bg-emerald-500', blue: 'bg-brand-600', amber: 'bg-amber-500', purple: 'bg-violet-500' }
  return <div><div className="flex justify-between text-xs font-semibold text-slate-600"><span>{label}</span><span className="text-brand-950">{value}%</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`meter-fill h-full rounded-full ${colors[tone]}`} style={{ width: `${value}%` }} /></div></div>
}
