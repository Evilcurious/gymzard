import { useMemo, useState } from 'react'
import {
  ArrowRight, Barcode, Bell, CheckCircle2, Clock, Download, Gift, Mail, MessageCircle,
  Minus, Percent, Phone, Plus, Printer, RefreshCw, Search, Send, ShoppingCart, Smartphone,
  Sparkles, Target, Trash2, TrendingUp, Users, X, Zap,
} from 'lucide-react'
import { useApp } from '../lib/app-context'
import { useActions } from '../lib/actions'
import { addDays, downloadFile, escapeHtml, formatCurrency, formatDate, isoDate, isoDateTime, printHtml, relativeTime, toCsv, uid } from '../lib/utils'
import type { Lead, Sale } from '../types'
import { Avatar, Badge, Button, Card, CardHeader, DataTable, EmptyState, Input, PageHeader, ProgressBar, SearchInput, Select, StatCard, StatusBadge, Tabs, Toggle } from '../components/ui'

/* ---------------------------------- POS ---------------------------------- */

interface CartItem { productId: string; name: string; price: number; qty: number; emoji: string }

export function Pos() {
  const { db, scope, updateDb, toast, logActivity, branchId } = useApp()
  const actions = useActions()
  const [tab, setTab] = useState('billing')
  const [cart, setCart] = useState<CartItem[]>([])
  const [query, setQuery] = useState('')
  const [barcode, setBarcode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [method, setMethod] = useState<Sale['method']>('Cash')
  const [memberId, setMemberId] = useState('')
  const products = scope(db.products)
  const sales = scope(db.sales)
  const currency = db.settings.currency
  const filteredProducts = products.filter((p) => `${p.name} ${p.sku} ${p.barcode}`.toLowerCase().includes(query.toLowerCase()))
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const tax = Math.round(subtotal * 0.08)
  const total = Math.max(0, subtotal - discount + tax)
  const todaySales = sales.filter((s) => isoDate(s.date) === isoDate(new Date()) && s.status === 'Completed').reduce((v, s) => v + s.total, 0)
  const monthlySales = sales.filter((s) => s.date.startsWith(isoDate(new Date()).slice(0, 7)) && s.status === 'Completed').reduce((v, s) => v + s.total, 0)

  function addToCart(productId: string) {
    const p = products.find((x) => x.id === productId)
    if (!p || p.stock <= 0) return toast('Product is out of stock', 'warning')
    setCart((prev) => {
      const existing = prev.find((x) => x.productId === productId)
      if (existing) return prev.map((x) => x.productId === productId ? { ...x, qty: Math.min(p.stock, x.qty + 1) } : x)
      return [...prev, { productId: p.id, name: p.name, price: p.price, qty: 1, emoji: p.emoji }]
    })
  }

  function changeQty(productId: string, delta: number) {
    const p = products.find((x) => x.id === productId)
    setCart((prev) => prev.map((x) => x.productId === productId ? { ...x, qty: Math.max(0, Math.min(p?.stock || 99, x.qty + delta)) } : x).filter((x) => x.qty > 0))
  }

  function scanBarcode() {
    const p = products.find((x) => x.barcode === barcode.trim() || x.sku.toLowerCase() === barcode.trim().toLowerCase())
    if (!p) return toast('No product found for that barcode', 'error')
    addToCart(p.id)
    setBarcode('')
    toast(`${p.name} added to cart`)
  }

  function checkout() {
    if (!cart.length) return toast('Add at least one product to the cart', 'warning')
    const sale: Sale = {
      id: uid('sale'), invoiceNo: `POS-${Date.now().toString().slice(-6)}`,
      items: cart.map((i) => ({ productId: i.productId, name: i.name, qty: i.qty, price: i.price })),
      subtotal, discount, tax, total, method, date: isoDateTime(new Date()), memberId: memberId || undefined,
      branchId: branchId === 'all' ? db.branches[0].id : branchId, status: 'Completed',
    }
    updateDb((prev) => ({
      ...prev,
      sales: [sale, ...prev.sales],
      products: prev.products.map((p) => {
        const line = cart.find((i) => i.productId === p.id)
        return line ? { ...p, stock: Math.max(0, p.stock - line.qty) } : p
      }),
    }))
    logActivity('POS sale completed', `${sale.invoiceNo} · ${formatCurrency(total, currency)}`, 'payment')
    toast(`${sale.invoiceNo} completed — ${formatCurrency(total, currency)}`)
    setCart([]); setDiscount(0); setMemberId('')
  }

  function printPosReceipt(sale: Sale) {
    const rows = sale.items.map((i) => `<tr><td>${escapeHtml(i.name)}</td><td>${i.qty}</td><td>${formatCurrency(i.price, currency)}</td><td>${formatCurrency(i.qty * i.price, currency)}</td></tr>`).join('')
    printHtml(`<div class="header"><h1>POS receipt</h1><p>${escapeHtml(db.settings.gymName)} · ${escapeHtml(sale.invoiceNo)} · ${formatDate(sale.date)}</p></div><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><h2>Summary</h2><table><tr><td>Subtotal</td><td>${formatCurrency(sale.subtotal, currency)}</td></tr><tr><td>Discount</td><td>− ${formatCurrency(sale.discount, currency)}</td></tr><tr><td>Tax</td><td>${formatCurrency(sale.tax, currency)}</td></tr><tr><td><b>Total</b></td><td><b>${formatCurrency(sale.total, currency)}</b></td></tr></table><p>Payment method: ${escapeHtml(sale.method)}</p><div class="footer">Demo POS receipt generated by GymZard ERP.</div>`, `${sale.invoiceNo}-receipt`)
    toast('POS receipt opened', 'info')
  }

  const tabs = [
    { id: 'billing', label: 'Billing' },
    { id: 'catalog', label: 'Product catalog', count: products.length },
    { id: 'sales', label: 'Sales history', count: sales.length },
    { id: 'returns', label: 'Returns', count: sales.filter((s) => s.status === 'Refunded').length },
  ]

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Point of sale" title="POS & retail" subtitle="Sell supplements, drinks, merchandise, and accessories with barcode scanning and automatic stock deduction." actions={<><Button variant="outline" icon={Download} onClick={() => downloadFile('gymzard-sales.csv', toCsv(sales.map((s) => ({ Invoice: s.invoiceNo, Date: s.date, Items: s.items.map((i) => `${i.qty}x ${i.name}`).join(' | '), Total: s.total, Method: s.method, Status: s.status }))), 'text/csv;charset=utf-8')}>Export sales</Button><Button icon={Plus} onClick={() => actions.openProductForm()}>Add product</Button></>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><StatCard title="Today's sales" value={formatCurrency(todaySales, currency, true)} icon={ShoppingCart} tone="green" hint="completed orders" /><StatCard title="Monthly sales" value={formatCurrency(monthlySales, currency, true)} icon={TrendingUp} hint="current month" /><StatCard title="Products" value={products.length} icon={Gift} tone="blue" hint="active SKUs" /><StatCard title="Low stock" value={products.filter((p) => p.stock < 20).length} icon={Zap} tone="amber" hint="needs restock" /><StatCard title="Returns" value={sales.filter((s) => s.status === 'Refunded').length} icon={RefreshCw} tone="red" hint="processed" /></div>
      <Tabs items={tabs} value={tab} onChange={setTab} className="rounded-t-2xl border border-blue-100 bg-white px-2" />
      {tab === 'billing' ? <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]"><Card><CardHeader title="Product catalog" subtitle="Click a product to add it to the cart" action={<div className="flex w-full gap-2 sm:w-auto"><div className="relative flex-1 sm:w-52"><Barcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && scanBarcode()} placeholder="Scan barcode" className="h-9 pl-9" /></div><Button size="sm" variant="outline" onClick={scanBarcode}>Scan</Button></div>} /><div className="border-b border-blue-50 p-4"><SearchInput value={query} onChange={setQuery} placeholder="Search products…" /></div><div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">{filteredProducts.map((p) => <button key={p.id} onClick={() => addToCart(p.id)} disabled={p.stock <= 0} className="rounded-xl border border-blue-100 p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/40 disabled:opacity-50"><div className="flex items-start justify-between"><span className="text-3xl">{p.emoji}</span><Badge tone={p.stock < 20 ? 'red' : 'green'}>{p.stock} in stock</Badge></div><p className="mt-3 text-sm font-extrabold text-brand-950">{p.name}</p><p className="mt-0.5 text-[11px] text-slate-400">{p.sku} · Tax {p.taxRate}%</p><div className="mt-3 flex items-center justify-between"><span className="text-base font-extrabold text-brand-700">{formatCurrency(p.price, currency)}</span><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white"><Plus className="h-4 w-4" /></span></div></button>)}</div></Card><Card className="h-fit"><CardHeader title="Current sale" subtitle={`${cart.length} line items`} action={cart.length ? <button onClick={() => setCart([])} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button> : null} /><div className="p-4"><div className="max-h-72 space-y-2 overflow-y-auto">{cart.length ? cart.map((i) => <div key={i.productId} className="flex items-center gap-2 rounded-xl border border-blue-50 p-2.5"><span className="text-xl">{i.emoji}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-700">{i.name}</p><p className="text-[11px] text-slate-400">{formatCurrency(i.price, currency)} each</p></div><div className="flex items-center gap-1"><button onClick={() => changeQty(i.productId, -1)} className="rounded-md bg-slate-100 p-1"><Minus className="h-3 w-3" /></button><span className="w-6 text-center text-xs font-bold">{i.qty}</span><button onClick={() => changeQty(i.productId, 1)} className="rounded-md bg-brand-50 p-1 text-brand-600"><Plus className="h-3 w-3" /></button></div><span className="w-16 text-right text-xs font-bold text-slate-700">{formatCurrency(i.price * i.qty, currency, true)}</span></div>) : <EmptyState icon={ShoppingCart} title="Cart is empty" description="Select products from the catalog." />}</div><div className="mt-4 grid gap-3 border-t border-blue-50 pt-4"><Select value={memberId} onChange={(e) => setMemberId(e.target.value)}><option value="">Walk-in customer</option>{db.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select><div className="grid grid-cols-2 gap-2"><div><label className="label-base">Discount</label><Input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div><div><label className="label-base">Method</label><Select value={method} onChange={(e) => setMethod(e.target.value as Sale['method'])}>{['Cash', 'UPI', 'Card', 'Online'].map((m) => <option key={m}>{m}</option>)}</Select></div></div><div className="space-y-1.5 rounded-xl bg-brand-50/60 p-3 text-xs"><div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatCurrency(subtotal, currency)}</span></div><div className="flex justify-between text-slate-500"><span>Discount</span><span>− {formatCurrency(discount, currency)}</span></div><div className="flex justify-between text-slate-500"><span>Tax (8%)</span><span>{formatCurrency(tax, currency)}</span></div><div className="flex justify-between border-t border-blue-100 pt-2 text-base font-extrabold text-brand-950"><span>Total</span><span>{formatCurrency(total, currency)}</span></div></div><Button className="w-full" icon={CheckCircle2} disabled={!cart.length} onClick={checkout}>Complete sale</Button></div></div></Card></div> : null}
      {tab === 'catalog' ? <Card><CardHeader title="Product catalog" subtitle="Prices, stock levels, barcodes, and tax rates" action={<Button size="sm" icon={Plus} onClick={() => actions.openProductForm()}>Add product</Button>} /><DataTable rows={products} rowKey={(p) => p.id} columns={[
        { key: 'name', header: 'Product', render: (p) => <div className="flex items-center gap-2.5"><span className="text-2xl">{p.emoji}</span><div><p className="font-bold text-slate-700">{p.name}</p><p className="text-[11px] text-slate-400">{p.sku}</p></div></div> },
        { key: 'category', header: 'Category', render: (p) => <Badge tone="blue">{p.category}</Badge> },
        { key: 'barcode', header: 'Barcode', render: (p) => <span className="font-mono text-xs text-slate-500">{p.barcode}</span> },
        { key: 'price', header: 'Price', render: (p) => <span className="text-xs font-bold text-brand-700">{formatCurrency(p.price, currency)}</span> },
        { key: 'stock', header: 'Stock', render: (p) => <div className="w-24"><div className="flex justify-between text-[10px] text-slate-400"><span>{p.stock} units</span><span>{p.taxRate}% tax</span></div><ProgressBar className="mt-1.5" value={p.stock} max={80} tone={p.stock < 20 ? 'red' : 'green'} /></div> },
        { key: 'actions', header: '', align: 'right', render: (p) => <div className="flex justify-end gap-1"><Button size="sm" variant="soft" onClick={() => addToCart(p.id)}>Add to cart</Button><Button size="sm" variant="ghost" onClick={() => actions.openProductForm(p)}>Edit</Button></div> },
      ]} /></Card> : null}
      {tab === 'sales' ? <Card><CardHeader title="Sales history" subtitle="All completed POS transactions" /><DataTable rows={sales} rowKey={(s) => s.id} columns={[
        { key: 'invoice', header: 'Invoice', render: (s) => <div><p className="font-bold text-slate-700">{s.invoiceNo}</p><p className="text-[11px] text-slate-400">{formatDate(s.date)}</p></div> },
        { key: 'items', header: 'Items', render: (s) => <span className="text-xs text-slate-500">{s.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</span> },
        { key: 'method', header: 'Method', render: (s) => <Badge tone="slate">{s.method}</Badge> },
        { key: 'total', header: 'Total', render: (s) => <span className="text-xs font-bold text-brand-700">{formatCurrency(s.total, currency)}</span> },
        { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
        { key: 'actions', header: '', align: 'right', render: (s) => <div className="flex justify-end gap-1"><Button size="sm" variant="ghost" icon={Printer} onClick={() => printPosReceipt(s)}>Receipt</Button>{s.status === 'Completed' ? <Button size="sm" variant="outline" onClick={() => actions.openSaleRefundForm(s)}>Refund</Button> : null}</div> },
      ]} /></Card> : null}
      {tab === 'returns' ? <Card><CardHeader title="Returns & refunds" subtitle="Refunded POS transactions" />{sales.filter((s) => s.status === 'Refunded').length ? <DataTable rows={sales.filter((s) => s.status === 'Refunded')} rowKey={(s) => s.id} columns={[
        { key: 'invoice', header: 'Invoice', render: (s) => <span className="font-bold text-slate-700">{s.invoiceNo}</span> },
        { key: 'date', header: 'Date', render: (s) => <span className="text-xs text-slate-500">{formatDate(s.date)}</span> },
        { key: 'items', header: 'Returned items', render: (s) => <span className="text-xs text-slate-500">{s.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</span> },
        { key: 'amount', header: 'Refund amount', render: (s) => <span className="text-xs font-bold text-rose-600">{formatCurrency(s.total, currency)}</span> },
        { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
      ]} /> : <EmptyState icon={RefreshCw} title="No returns yet" description="Refunded sales will appear here." />}</Card> : null}
    </div>
  )
}

/* ---------------------------- Notifications ---------------------------- */

export function Notifications() {
  const { db, updateDb, toast, openForm } = useApp()
  const actions = useActions()
  const [tab, setTab] = useState('campaigns')
  const [automations, setAutomations] = useState<Record<string, boolean>>({ 'Expiry reminders': true, 'Payment reminders': true, 'Birthday wishes': true, 'Inactivity alerts': true, 'Class reminders': true, 'Workout reminders': false })
  const [channels, setChannels] = useState<Record<string, boolean>>({ WhatsApp: true, SMS: true, Email: true, Push: true })
  const notifications = db.notifications
  const channelIcons = { WhatsApp: MessageCircle, SMS: Smartphone, Email: Mail, Push: Bell }
  const tabs = [
    { id: 'campaigns', label: 'Campaigns', count: notifications.length },
    { id: 'templates', label: 'Templates' },
    { id: 'automation', label: 'Automation' },
    { id: 'channels', label: 'Channels' },
  ]

  function useTemplate(title: string, body: string, channel: string) {
    openForm({ title: 'Create campaign from template', subtitle: 'Edit the message before sending.', size: 'lg', initial: { title, body, channel, audience: 'All active members', status: 'Sent' }, fields: [
      { name: 'title', label: 'Campaign title', required: true }, { name: 'channel', label: 'Channel', type: 'select', options: ['WhatsApp', 'SMS', 'Email', 'Push'].map((x) => ({ value: x, label: x })) },
      { name: 'audience', label: 'Audience', type: 'select', options: ['All active members', 'Expiring members', 'Members with dues', 'Inactive members', 'PT members', 'All leads'].map((x) => ({ value: x, label: x })) },
      { name: 'status', label: 'Status', type: 'select', options: ['Sent', 'Scheduled'].map((x) => ({ value: x, label: x })) },
      { name: 'body', label: 'Message', type: 'textarea', span: 2, rows: 4, required: true },
    ], onSubmit: (v) => { updateDb((prev) => ({ ...prev, notifications: [{ id: uid('ntf'), title: String(v.title), body: String(v.body), channel: String(v.channel) as never, audience: String(v.audience), sentAt: new Date().toISOString(), status: String(v.status) as never, read: false }, ...prev.notifications] })); toast('Campaign created from template') } })
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Notifications & communication" title="Communication center" subtitle="WhatsApp, SMS, email, and push campaigns with automation rules and delivery history." actions={<><Button variant="outline" icon={Download} onClick={() => downloadFile('gymzard-notifications.csv', toCsv(notifications.map((n) => ({ Title: n.title, Channel: n.channel, Audience: n.audience, Sent: n.sentAt, Status: n.status }))), 'text/csv;charset=utf-8')}>Export</Button><Button icon={Plus} onClick={() => actions.openNotificationForm()}>Create campaign</Button></>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><StatCard title="Total messages" value={notifications.length} icon={Send} hint="all channels" /><StatCard title="Sent" value={notifications.filter((n) => n.status === 'Sent').length} icon={CheckCircle2} tone="green" hint="delivered" /><StatCard title="Scheduled" value={notifications.filter((n) => n.status === 'Scheduled').length} icon={Clock} tone="amber" hint="queued" /><StatCard title="Failed" value={notifications.filter((n) => n.status === 'Failed').length} icon={X} tone="red" hint="needs retry" /><StatCard title="Unread" value={notifications.filter((n) => !n.read).length} icon={Bell} tone="purple" hint="staff inbox" /></div>
      <Tabs items={tabs} value={tab} onChange={setTab} className="rounded-t-2xl border border-blue-100 bg-white px-2" />
      {tab === 'campaigns' ? <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{notifications.map((n) => { const Icon = channelIcons[n.channel]; return <Card key={n.id} className="p-5"><div className="flex items-start justify-between"><div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-4 w-4" /></span><div><p className="text-sm font-extrabold text-brand-950">{n.title}</p><p className="text-[11px] text-slate-400">{n.channel} · {n.audience}</p></div></div><StatusBadge status={n.status} /></div><p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-500">{n.body}</p><div className="mt-4 flex items-center justify-between border-t border-blue-50 pt-3"><span className="text-[11px] text-slate-400">{relativeTime(n.sentAt)}</span><div className="flex gap-1">{!n.read ? <Button size="sm" variant="ghost" onClick={() => updateDb((prev) => ({ ...prev, notifications: prev.notifications.map((x) => x.id === n.id ? { ...x, read: true } : x) }))}>Mark read</Button> : null}{n.status === 'Failed' ? <Button size="sm" variant="soft" icon={RefreshCw} onClick={() => { updateDb((prev) => ({ ...prev, notifications: prev.notifications.map((x) => x.id === n.id ? { ...x, status: 'Sent' } : x) })); toast('Message retried') }}>Retry</Button> : null}<button onClick={() => { if (window.confirm('Delete this campaign?')) updateDb((prev) => ({ ...prev, notifications: prev.notifications.filter((x) => x.id !== n.id) })) }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></div></div></Card> })}</div> : null}
      {tab === 'templates' ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[
        { title: 'Membership expiry', channel: 'WhatsApp', body: 'Hi {name}, your membership expires in {days} days. Renew today and keep your streak alive!', icon: Clock },
        { title: 'Payment due', channel: 'SMS', body: 'Friendly reminder: your outstanding balance is Rs {amount}. You can pay at the front desk or online.', icon: Phone },
        { title: 'Birthday wishes', channel: 'WhatsApp', body: 'Happy birthday, {name}! The GymZard team wishes you a strong and healthy year ahead.', icon: Gift },
        { title: 'Class booking', channel: 'Push', body: 'Your {class} session starts tomorrow at {time}. We can’t wait to see you!', icon: Bell },
        { title: 'Comeback offer', channel: 'Email', body: 'We miss you at the gym. Here’s an exclusive 15% discount on your next membership renewal.', icon: Sparkles },
        { title: 'Workout streak', channel: 'Push', body: 'Amazing work! You completed a {days}-day workout streak. Keep the momentum going!', icon: Zap },
      ].map((t) => <Card key={t.title} className="p-5"><div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><t.icon className="h-4 w-4" /></span><div><p className="text-sm font-extrabold text-brand-950">{t.title}</p><Badge tone="blue">{t.channel}</Badge></div></div><p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">{t.body}</p><Button size="sm" variant="outline" className="mt-4 w-full" icon={Send} onClick={() => useTemplate(t.title, t.body, t.channel)}>Use template</Button></Card>)}</div> : null}
      {tab === 'automation' ? <Card><CardHeader title="Automation rules" subtitle="Automatically trigger messages based on member activity" action={<Badge tone="green" dot>{Object.values(automations).filter(Boolean).length} active</Badge>} /><div className="grid gap-3 p-4 md:grid-cols-2">{Object.entries(automations).map(([name, enabled]) => <div key={name} className="rounded-xl border border-blue-50 p-3"><Toggle checked={enabled} onChange={(v) => { setAutomations((p) => ({ ...p, [name]: v })); toast(`${name} ${v ? 'enabled' : 'paused'}`, 'info') }} label={name} description={name.includes('Expiry') ? 'Sent 7 days and 1 day before expiry' : name.includes('Payment') ? 'Sent 3 days after invoice due date' : name.includes('Inactivity') ? 'Sent after 14 days without a check-in' : 'Triggered by member activity'} /></div>)}</div><div className="border-t border-blue-50 p-4"><Button icon={CheckCircle2} onClick={() => toast('Automation rules saved', 'info')}>Save automation rules</Button></div></Card> : null}
      {tab === 'channels' ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Object.entries(channels).map(([name, enabled]) => { const Icon = channelIcons[name as keyof typeof channelIcons]; return <Card key={name} className="p-5"><div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span><Badge tone={enabled ? 'green' : 'slate'} dot>{enabled ? 'Active' : 'Disabled'}</Badge></div><h3 className="mt-4 text-base font-extrabold text-brand-950">{name}</h3><p className="mt-1 text-xs text-slate-500">{notifications.filter((n) => n.channel === name).length} campaigns sent</p><div className="mt-4 border-t border-blue-50 pt-3"><Toggle checked={enabled} onChange={(v) => { setChannels((p) => ({ ...p, [name]: v })); toast(`${name} ${v ? 'enabled' : 'disabled'}`, 'info') }} label="Enable channel" /></div><Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => toast(`Test ${name} message sent`, 'info')}>Send test</Button></Card> })}</div> : null}
    </div>
  )
}

/* --------------------------------- Leads --------------------------------- */

export function Leads() {
  const { db, updateDb, toast, openForm } = useApp()
  const actions = useActions()
  const [tab, setTab] = useState('pipeline')
  const leads = db.leads
  const statuses: Lead['status'][] = ['New', 'Contacted', 'Trial Booked', 'Converted', 'Lost']
  const sources = ['Website', 'Walk-in', 'Referral', 'Instagram', 'Google Ads']
  const converted = leads.filter((l) => l.status === 'Converted').length
  const avgScore = leads.length ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0

  function moveLead(lead: Lead, status: Lead['status']) {
    updateDb((prev) => ({ ...prev, leads: prev.leads.map((l) => l.id === lead.id ? { ...l, status } : l) }))
    toast(`${lead.name} moved to ${status}`)
  }

  function convertLead(lead: Lead) {
    openForm({ title: `Convert ${lead.name} to member`, subtitle: 'Confirm the member details and choose a starting plan.', size: 'lg', initial: { name: lead.name, email: lead.email, phone: lead.phone, planId: 'plan-monthly', branchId: db.branches[0].id, status: 'Active' }, fields: [
      { name: 'name', label: 'Full name', required: true }, { name: 'email', label: 'Email', type: 'email' }, { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'planId', label: 'Membership plan', type: 'select', options: db.plans.map((p) => ({ value: p.id, label: p.name })) },
      { name: 'branchId', label: 'Branch', type: 'select', options: db.branches.map((b) => ({ value: b.id, label: b.name })) },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Trial'].map((x) => ({ value: x, label: x })) },
    ], onSubmit: (v) => {
      const plan = db.plans.find((p) => p.id === v.planId) || db.plans[0]
      const maxId = db.members.reduce((max, m) => Math.max(max, Number(m.memberId.replace(/\D/g, '')) || 0), 2400)
      const start = isoDate(new Date()); const end = isoDate(addDays(new Date(), plan.durationDays))
      updateDb((prev) => ({
        ...prev,
        leads: prev.leads.map((l) => l.id === lead.id ? { ...l, status: 'Converted' } : l),
        members: [{ id: uid('mem'), memberId: `GZ-${maxId + 1}`, name: String(v.name), email: String(v.email), phone: String(v.phone), gender: 'Other', dob: '', branchId: String(v.branchId), planId: plan.id, status: String(v.status) as never, joinedAt: start, startsAt: start, expiresAt: end, emergencyName: '', emergencyPhone: '', medical: '', goals: lead.interest, notes: `Converted from lead: ${lead.source}`, tags: ['Converted lead'], dueAmount: 0, lastVisit: undefined, attendanceCount: 0, healthScore: 70, engagementScore: 65, referralCode: `REF-${uid('').slice(-5).toUpperCase()}`, documents: [], membershipHistory: [{ plan: plan.name, from: start, to: end, amount: plan.price }], height: 170, weight: 70, targetWeight: 68, autoRenew: false }, ...prev.members],
      }))
      toast(`${lead.name} converted to member`)
    } })
  }

  const tabs = [
    { id: 'pipeline', label: 'Pipeline', count: leads.length },
    { id: 'list', label: 'All leads', count: leads.length },
    { id: 'followups', label: 'Follow-ups', count: leads.filter((l) => l.followUpDate <= isoDate(addDays(new Date(), 3))).length },
    { id: 'sources', label: 'Sources' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Leads & CRM" title="Sales pipeline" subtitle="Capture enquiries, assign follow-ups, score leads, book trials, and convert them into members." actions={<><Button variant="outline" icon={Download} onClick={() => downloadFile('gymzard-leads.csv', toCsv(leads.map((l) => ({ Name: l.name, Phone: l.phone, Email: l.email, Source: l.source, Interest: l.interest, Status: l.status, Score: l.score, Assigned: l.assignedTo, FollowUp: l.followUpDate }))), 'text/csv;charset=utf-8')}>Export</Button><Button icon={Plus} onClick={() => actions.openLeadForm()}>Add lead</Button></>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><StatCard title="Total leads" value={leads.length} icon={Target} hint="all sources" /><StatCard title="New enquiries" value={leads.filter((l) => l.status === 'New').length} icon={Sparkles} tone="purple" hint="needs first contact" /><StatCard title="Trials booked" value={leads.filter((l) => l.status === 'Trial Booked').length} icon={Clock} tone="cyan" hint="in progress" /><StatCard title="Converted" value={converted} icon={CheckCircle2} tone="green" hint={`${Math.round(converted / Math.max(1, leads.length) * 100)}% conversion`} /><StatCard title="Average score" value={avgScore} icon={TrendingUp} tone="amber" hint="lead quality" /></div>
      <Tabs items={tabs} value={tab} onChange={setTab} className="rounded-t-2xl border border-blue-100 bg-white px-2" />
      {tab === 'pipeline' ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{statuses.map((status) => { const items = leads.filter((l) => l.status === status); return <Card key={status} className="min-h-[360px]"><CardHeader title={status} subtitle={`${items.length} leads`} action={<Badge tone={status === 'Converted' ? 'green' : status === 'Lost' ? 'red' : status === 'Trial Booked' ? 'cyan' : 'blue'}>{items.length}</Badge>} /><div className="space-y-2 p-3">{items.map((l) => { const next = statuses[statuses.indexOf(status) + 1]; return <div key={l.id} className="rounded-xl border border-blue-50 bg-white p-3"><div className="flex items-start justify-between"><div className="flex items-center gap-2"><Avatar name={l.name} size="xs" /><div><p className="text-xs font-bold text-slate-700">{l.name}</p><p className="text-[10px] text-slate-400">{l.interest}</p></div></div><Badge tone={l.score > 75 ? 'green' : l.score > 50 ? 'amber' : 'red'}>{l.score}</Badge></div><p className="mt-2 text-[11px] text-slate-400">{l.source} · {l.assignedTo.split(' ')[0]}</p><p className="mt-1 text-[11px] text-slate-400">Follow-up: {formatDate(l.followUpDate)}</p><div className="mt-3 flex gap-1"><Button size="sm" variant="ghost" onClick={() => actions.openLeadForm(l)}>Edit</Button>{next ? <Button size="sm" variant="soft" onClick={() => moveLead(l, next)}>Move →</Button> : null}{status !== 'Converted' && status !== 'Lost' ? <button onClick={() => convertLead(l)} className="ml-auto rounded-lg p-1.5 text-brand-600 hover:bg-brand-50" title="Convert"><ArrowRight className="h-4 w-4" /></button> : null}</div></div> })}{!items.length ? <EmptyState icon={Target} title="No leads" /> : null}</div></Card> })}</div> : null}
      {tab === 'list' ? <Card><CardHeader title="Lead directory" subtitle="All enquiries with score, assignment, and next action" /><DataTable rows={leads} rowKey={(l) => l.id} columns={[
        { key: 'name', header: 'Lead', render: (l) => <div className="flex items-center gap-2.5"><Avatar name={l.name} size="sm" /><div><p className="font-bold text-slate-700">{l.name}</p><p className="text-[11px] text-slate-400">{l.phone}</p></div></div> },
        { key: 'source', header: 'Source', render: (l) => <Badge tone="blue">{l.source}</Badge> },
        { key: 'interest', header: 'Interest', render: (l) => <span className="text-xs text-slate-500">{l.interest}</span> },
        { key: 'score', header: 'Score', render: (l) => <div className="w-20"><ProgressBar value={l.score} tone={l.score > 75 ? 'green' : l.score > 50 ? 'amber' : 'red'} /></div> },
        { key: 'assigned', header: 'Assigned to', render: (l) => <span className="text-xs text-slate-500">{l.assignedTo}</span> },
        { key: 'status', header: 'Status', render: (l) => <StatusBadge status={l.status} /> },
        { key: 'actions', header: '', align: 'right', render: (l) => <div className="flex justify-end gap-1"><Button size="sm" variant="outline" onClick={() => actions.openLeadForm(l)}>Edit</Button>{l.status !== 'Converted' ? <Button size="sm" variant="soft" onClick={() => convertLead(l)}>Convert</Button> : null}</div> },
      ]} /></Card> : null}
      {tab === 'followups' ? <Card><CardHeader title="Follow-up queue" subtitle="Leads requiring attention in the next few days" />{leads.filter((l) => l.followUpDate <= isoDate(addDays(new Date(), 7))).length ? <DataTable rows={leads.filter((l) => l.followUpDate <= isoDate(addDays(new Date(), 7))).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate))} rowKey={(l) => l.id} columns={[
        { key: 'name', header: 'Lead', render: (l) => <span className="text-xs font-bold text-slate-700">{l.name}</span> },
        { key: 'date', header: 'Follow-up date', render: (l) => <span className={l.followUpDate < isoDate(new Date()) ? 'text-xs font-bold text-rose-600' : 'text-xs text-slate-500'}>{formatDate(l.followUpDate)}</span> },
        { key: 'notes', header: 'Notes', render: (l) => <span className="text-xs text-slate-500">{l.notes}</span> },
        { key: 'status', header: 'Status', render: (l) => <StatusBadge status={l.status} /> },
        { key: 'actions', header: '', align: 'right', render: (l) => <div className="flex justify-end gap-1"><Button size="sm" variant="outline" icon={Phone} onClick={() => toast(`Call reminder set for ${l.name}`, 'info')}>Call</Button><Button size="sm" variant="soft" onClick={() => actions.openLeadForm(l)}>Reschedule</Button></div> },
      ]} /> : <EmptyState icon={CheckCircle2} title="No follow-ups due" />}</Card> : null}
      {tab === 'sources' ? <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]"><Card><CardHeader title="Lead source performance" subtitle="Leads and conversion by acquisition channel" /><div className="space-y-4 p-5">{sources.map((s) => { const items = leads.filter((l) => l.source === s); const won = items.filter((l) => l.status === 'Converted').length; return <div key={s}><div className="flex justify-between text-xs font-semibold text-slate-600"><span>{s}</span><span>{items.length} leads · {won} converted</span></div><ProgressBar className="mt-1.5" value={won} max={Math.max(1, items.length)} tone={won / Math.max(1, items.length) > .3 ? 'green' : 'blue'} /></div> })}</div></Card><Card><CardHeader title="Growth recommendations" subtitle="Demo CRM insights" /><div className="space-y-3 p-5">{[
        { icon: TrendingUp, title: 'Referrals convert best', detail: 'Referral leads are 1.8× more likely to convert. Launch a member referral reward.' },
        { icon: Clock, title: 'Speed-to-lead matters', detail: 'Contact new web enquiries within 30 minutes to improve trial bookings.' },
        { icon: Users, title: 'Re-engage lost leads', detail: 'Send a limited-time comeback offer to leads marked as lost.' },
      ].map((r) => <div key={r.title} className="flex gap-3 rounded-xl border border-blue-50 p-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><r.icon className="h-4 w-4" /></span><div><p className="text-xs font-bold text-slate-700">{r.title}</p><p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{r.detail}</p></div></div>)}</div></Card></div> : null}
    </div>
  )
}
