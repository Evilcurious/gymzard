import React, { useMemo, useState } from 'react'
import {
  ArrowRight, Bell, Building2, CheckCircle2, ChevronDown, CreditCard, LayoutDashboard, LogOut,
  Menu, Package, Plus, Search, Settings, Sparkles, UserRound, X, QrCode,
} from 'lucide-react'
import { roleLabels, useApp } from '../lib/app-context'
import { moduleMeta, navGroups, navItems, portalItems } from '../lib/navigation'
import { cn, formatDate, relativeTime } from '../lib/utils'
import type { ModuleKey, Role } from '../types'
import { Avatar, Badge, Button, Card, Modal, SearchInput, Select, StatusBadge } from './ui'

export function Layout({ children }: { children: React.ReactNode }) {
  const {
    db, user, role, branchId, setBranchId, activeModule, navigate, sidebarOpen, setSidebarOpen,
    switchRole, logout, updateDb, toast, openCheckIn, openMember, resetDb, can,
  } = useApp()
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const unread = db.notifications.filter((n) => !n.read).length
  const isMember = role === 'member'
  const pageTitle = isMember ? 'Member Portal' : moduleMeta[activeModule]?.label || 'Dashboard'
  const groupedNav = useMemo(() => navGroups.map((group) => ({ group, items: navItems.filter((n) => n.group === group && can(n.key)) })).filter((g) => g.items.length), [can])

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { members: [], classes: [], plans: [], products: [], leads: [] }
    return {
      members: db.members.filter((m) => `${m.name} ${m.memberId} ${m.phone} ${m.email}`.toLowerCase().includes(q)).slice(0, 5),
      classes: db.classes.filter((c) => `${c.title} ${c.type} ${c.date}`.toLowerCase().includes(q)).slice(0, 4),
      plans: db.plans.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(q)).slice(0, 4),
      products: db.products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(q)).slice(0, 4),
      leads: db.leads.filter((l) => `${l.name} ${l.phone} ${l.interest}`.toLowerCase().includes(q)).slice(0, 4),
    }
  }, [db, query])

  function go(module: ModuleKey) {
    navigate(module)
    setNotifOpen(false)
    setProfileOpen(false)
    setSidebarOpen(false)
  }

  function goPortalSection(key: string) {
    go('portal')
    window.setTimeout(() => document.getElementById(`portal-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
  }

  function markAllRead() {
    updateDb((prev) => ({ ...prev, notifications: prev.notifications.map((n) => ({ ...n, read: true })) }))
    toast('All notifications marked as read', 'info')
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-blue-50 px-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-black text-white shadow-sm">GZ</span>
        <div className="min-w-0"><p className="truncate text-[15px] font-extrabold tracking-tight text-brand-950">{db.settings.gymName}</p><p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-brand-500">ERP Workspace</p></div>
        <button onClick={() => setSidebarOpen(false)} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"><X className="h-5 w-5" /></button>
      </div>

      <nav className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {isMember ? (
          <div className="space-y-1">
            <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">My Gym</p>
            {portalItems.map((item, idx) => (
              <button key={item.key} onClick={() => goPortalSection(item.key)} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition', idx === 0 ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-brand-50/60 hover:text-brand-700')}>
                <item.icon className="h-[18px] w-[18px]" />{item.label}
              </button>
            ))}
          </div>
        ) : groupedNav.map(({ group, items }) => (
          <div key={group} className="mb-5">
            <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{group}</p>
            <div className="space-y-0.5">{items.map((item) => {
              const active = activeModule === item.key
              return (
                <button key={item.key} onClick={() => go(item.key)} className={cn('group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition', active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-brand-50/60 hover:text-brand-700')}>
                  {active ? <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-600" /> : null}
                  <item.icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-brand-600' : 'text-slate-400 group-hover:text-brand-500')} />
                  <span className="truncate">{item.label}</span>
                  {item.key === 'members' ? <span className="ml-auto rounded-md bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">{db.members.length}</span> : null}
                </button>
              )
            })}</div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-blue-50 p-3">
        <div className="rounded-xl bg-gradient-to-br from-brand-50 to-white p-3.5">
          <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white"><Sparkles className="h-3.5 w-3.5" /></span><p className="text-xs font-extrabold text-brand-950">Demo workspace</p></div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">All changes are saved in your browser. Reset any time to restore the sample data.</p>
          <button onClick={() => { if (window.confirm('Reset all demo data to the original sample? This cannot be undone.')) resetDb() }} className="mt-2.5 text-[11px] font-bold text-brand-600 hover:text-brand-800">Reset demo data →</button>
        </div>
        <p className="mt-3 text-center text-[10px] font-medium text-slate-400">GymZard ERP v1.0 · Prototype</p>
      </div>
    </div>
  )

  return (
    <div className="app-shell no-print flex min-h-screen bg-[#f4f8ff]">
      {sidebarOpen ? <div className="fixed inset-0 z-40 bg-brand-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} /> : null}
      <aside className={cn('fixed inset-y-0 left-0 z-50 w-[268px] border-r border-blue-100 shadow-soft transition-transform lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>{sidebar}</aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[268px]">
        <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center gap-2 border-b border-blue-100 bg-white/90 px-3 backdrop-blur-xl sm:px-5 lg:px-7">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><Menu className="h-5 w-5" /></button>
          <div className="min-w-0">
            <div className="flex items-center gap-2"><h2 className="truncate text-base font-extrabold text-brand-950 sm:text-lg">{pageTitle}</h2><Badge tone="blue" className="hidden sm:inline-flex">{formatDate(new Date(), { weekday: 'short', day: '2-digit', month: 'short' })}</Badge></div>
            <p className="hidden truncate text-[11px] text-slate-400 sm:block">{isMember ? 'Your membership, workouts, diet, and progress' : moduleMeta[activeModule]?.description || 'Manage your gym operations'}</p>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button onClick={() => setSearchOpen(true)} className="hidden items-center gap-2 rounded-xl border border-blue-100 bg-brand-50/50 px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-brand-50 md:flex lg:w-56"><Search className="h-4 w-4" /><span className="flex-1 text-left">Search anything…</span><span className="rounded border border-blue-100 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400">⌘K</span></button>
            <button onClick={() => setSearchOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"><Search className="h-5 w-5" /></button>

            {!isMember ? (
              <div className="relative hidden sm:block">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="h-9 min-w-[140px] pl-9 pr-8 text-xs font-semibold"><option value="all">All branches</option>{db.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
              </div>
            ) : null}

            {!isMember ? <Button size="sm" variant="soft" icon={QrCode} onClick={openCheckIn} className="hidden xl:inline-flex">Check-in</Button> : null}

            <div className="relative">
              <button onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false) }} className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"><Bell className="h-5 w-5" />{unread ? <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{unread}</span> : null}</button>
              {notifOpen ? <NotificationDropdown onClose={() => setNotifOpen(false)} onMarkAll={markAllRead} /> : null}
            </div>

            <div className="relative hidden sm:block">
              <Select value={role} onChange={(e) => switchRole(e.target.value as Role)} className="h-9 min-w-[130px] pr-8 text-xs font-semibold">{Object.entries(roleLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select>
            </div>

            <div className="relative">
              <button onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false) }} className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-slate-100"><Avatar name={user?.name || 'User'} size="sm" /><ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" /></button>
              {profileOpen ? (
                <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-blue-100 bg-white p-2 shadow-soft">
                  <div className="flex items-center gap-3 rounded-lg bg-brand-50 px-3 py-2.5"><Avatar name={user?.name || 'User'} size="md" /><div className="min-w-0"><p className="truncate text-sm font-extrabold text-brand-950">{user?.name}</p><p className="truncate text-[11px] text-slate-500">{user?.title}</p></div></div>
                  <div className="mt-2 space-y-1">
                    <button onClick={() => { go('settings'); setProfileOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Settings className="h-4 w-4" />Workspace settings</button>
                    <button onClick={() => { switchRole('member'); setProfileOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:hidden"><UserRound className="h-4 w-4" />Switch to member view</button>
                    <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" />Sign out</button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="soft-grid min-h-0 flex-1 px-3 py-5 sm:px-5 lg:px-7 lg:py-7">
          <div className="mx-auto w-full max-w-[1600px] animate-fade-up">{children}</div>
        </main>
      </div>

      <Modal open={searchOpen} onClose={() => { setSearchOpen(false); setQuery('') }} title="Search workspace" subtitle="Find members, classes, plans, products, and leads instantly." size="lg">
        <SearchInput value={query} onChange={setQuery} placeholder="Try a member name, plan, class, or SKU…" autoFocus />
        <div className="mt-4 max-h-[55vh] space-y-4 overflow-y-auto pr-1">
          {!query ? <div className="rounded-xl border border-dashed border-blue-200 bg-brand-50/40 px-5 py-10 text-center"><Search className="mx-auto h-7 w-7 text-brand-300" /><p className="mt-2 text-sm font-bold text-brand-950">Start typing to search</p><p className="text-xs text-slate-500">Search across every module in this demo workspace.</p></div> : null}
          {query && Object.values(searchResults).every((r) => !r.length) ? <p className="py-10 text-center text-sm text-slate-400">No results found for “{query}”.</p> : null}
          <SearchGroup title="Members" items={searchResults.members.map((m) => ({ label: m.name, detail: `${m.memberId} · ${m.phone}`, status: m.status, onClick: () => { openMember(m.id); setSearchOpen(false); setQuery('') } }))} />
          <SearchGroup title="Classes" items={searchResults.classes.map((c) => ({ label: c.title, detail: `${c.date} · ${c.time} · ${c.type}`, onClick: () => { go('classes'); setSearchOpen(false); setQuery('') } }))} />
          <SearchGroup title="Plans" items={searchResults.plans.map((p) => ({ label: p.name, detail: `${p.category} · ${db.settings.currency} ${p.price.toLocaleString()}`, onClick: () => { go('memberships'); setSearchOpen(false); setQuery('') } }))} />
          <SearchGroup title="Products" items={searchResults.products.map((p) => ({ label: p.name, detail: `${p.sku} · ${p.stock} in stock`, onClick: () => { go('pos'); setSearchOpen(false); setQuery('') } }))} />
          <SearchGroup title="Leads" items={searchResults.leads.map((l) => ({ label: l.name, detail: `${l.interest} · ${l.phone}`, status: l.status, onClick: () => { go('leads'); setSearchOpen(false); setQuery('') } }))} />
        </div>
      </Modal>
    </div>
  )
}

function NotificationDropdown({ onClose, onMarkAll }: { onClose: () => void; onMarkAll: () => void }) {
  const { db, navigate } = useApp()
  return (
    <div className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-blue-100 bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-blue-50 px-4 py-3"><div><p className="text-sm font-extrabold text-brand-950">Notifications</p><p className="text-[11px] text-slate-400">{db.notifications.filter((n) => !n.read).length} unread updates</p></div><button onClick={onMarkAll} className="text-[11px] font-bold text-brand-600 hover:text-brand-800">Mark all read</button></div>
      <div className="max-h-80 overflow-y-auto">{db.notifications.slice(0, 7).map((n) => (
        <div key={n.id} className={cn('flex gap-3 border-b border-blue-50 px-4 py-3 last:border-0', !n.read && 'bg-brand-50/40')}>
          <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-slate-300' : 'bg-brand-600')} />
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-700">{n.title}</p><p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{n.body}</p><p className="mt-1 text-[10px] font-medium text-slate-400">{n.channel} · {relativeTime(n.sentAt)}</p></div>
        </div>
      ))}</div>
      <button onClick={() => { navigate('notifications'); onClose() }} className="flex w-full items-center justify-center gap-1.5 bg-slate-50 py-2.5 text-xs font-bold text-brand-600 hover:bg-brand-50">View all notifications <ArrowRight className="h-3.5 w-3.5" /></button>
    </div>
  )
}

function SearchGroup({ title, items }: { title: string; items: { label: string; detail: string; status?: string; onClick: () => void }[] }) {
  if (!items.length) return null
  return (
    <div>
      <p className="mb-1.5 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{title}</p>
      <div className="space-y-1">{items.map((item, i) => (
        <button key={`${title}-${i}`} onClick={item.onClick} className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition hover:border-blue-100 hover:bg-brand-50/60">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{title === 'Members' ? <UserRound className="h-4 w-4" /> : title === 'Classes' ? <LayoutDashboard className="h-4 w-4" /> : title === 'Plans' ? <CreditCard className="h-4 w-4" /> : title === 'Products' ? <Package className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-700">{item.label}</span><span className="block truncate text-[11px] text-slate-400">{item.detail}</span></span>
          {item.status ? <StatusBadge status={item.status} /> : <ArrowRight className="h-4 w-4 text-slate-300" />}
        </button>
      ))}</div>
    </div>
  )
}
