import { useState } from 'react'
import {
  ArrowRight, BarChart3, Building2, CheckCircle2, ClipboardList, Dumbbell, Lock, Mail,
  QrCode, ShieldCheck, Sparkles, UserRound, Users,
} from 'lucide-react'
import { roleLabels, useApp } from '../lib/app-context'
import type { Role } from '../types'
import { Badge, Button, Input } from './ui'
import { cn } from '../lib/utils'

const roles: { id: Role; icon: typeof ShieldCheck; description: string; email: string; color: string }[] = [
  { id: 'super_admin', icon: ShieldCheck, description: 'Platform-wide control', email: 'alex@gymzard.io', color: 'from-brand-600 to-blue-500' },
  { id: 'owner', icon: Building2, description: 'Full business management', email: 'owner@gymzard.fit', color: 'from-blue-600 to-cyan-500' },
  { id: 'manager', icon: ClipboardList, description: 'Daily branch operations', email: 'manager@gymzard.fit', color: 'from-indigo-600 to-blue-500' },
  { id: 'trainer', icon: Dumbbell, description: 'Members, workouts, progress', email: 'hammad@gymzard.fit', color: 'from-violet-600 to-blue-500' },
  { id: 'receptionist', icon: UserRound, description: 'Front desk and billing', email: 'frontdesk@gymzard.fit', color: 'from-sky-600 to-blue-500' },
  { id: 'member', icon: Users, description: 'Personal member portal', email: 'ayesha@example.com', color: 'from-emerald-600 to-cyan-500' },
]

const highlights = [
  { icon: Users, label: 'Unified member CRM' },
  { icon: QrCode, label: 'Smart QR attendance' },
  { icon: BarChart3, label: 'Real-time analytics' },
  { icon: Sparkles, label: 'AI-powered planning' },
]

export function Login() {
  const { login, db } = useApp()
  const [role, setRole] = useState<Role>('owner')
  const [password, setPassword] = useState('demo1234')
  const selected = roles.find((r) => r.id === role)!

  return (
    <div className="flex min-h-screen bg-white">
      <div className="blue-gradient blue-grid relative hidden w-[48%] flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-14">
        <div className="absolute -left-24 top-1/3 h-80 w-80 rounded-full border-[50px] border-white/5" />
        <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full border-[36px] border-white/5" />
        <div className="relative">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-brand-700">GZ</span><div><p className="text-xl font-extrabold tracking-tight">GymZard</p><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200">Gym ERP Suite</p></div></div>
          <div className="mt-16 max-w-xl">
            <Badge tone="blue" className="!border-white/20 !bg-white/10 !text-white !ring-white/10" dot>Complete gym operating system</Badge>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-5xl">Run every part of your gym from one beautiful workspace.</h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-blue-100">Memberships, billing, attendance, trainers, classes, diet plans, inventory, POS, reports, and multi-branch analytics — all connected in one blue-and-white ERP.</p>
          </div>
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">{highlights.map((h) => <div key={h.label} className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 backdrop-blur-sm"><h.icon className="h-5 w-5 text-blue-100" /><span className="text-xs font-semibold">{h.label}</span></div>)}</div>
        </div>
        <div className="relative grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
          <div><p className="text-2xl font-extrabold">20+</p><p className="text-[11px] text-blue-200">Connected modules</p></div>
          <div><p className="text-2xl font-extrabold">6</p><p className="text-[11px] text-blue-200">Role-based views</p></div>
          <div><p className="text-2xl font-extrabold">3</p><p className="text-[11px] text-blue-200">Demo branches</p></div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-[#f6f9ff] px-5 py-10 sm:px-10">
        <div className="w-full max-w-lg">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-lg font-black text-white">GZ</span><div><p className="text-xl font-extrabold text-brand-950">GymZard</p><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-500">Gym ERP Suite</p></div></div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-500">Welcome back</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-950">Sign in to {db.settings.gymName}</h2>
          <p className="mt-2 text-sm text-slate-500">Choose a demo role to explore a workspace with realistic test data.</p>

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {roles.map((r) => (
              <button key={r.id} onClick={() => setRole(r.id)} className={cn(
                'group rounded-xl border p-3 text-left transition',
                role === r.id ? 'border-brand-500 bg-brand-50 shadow-sm ring-2 ring-brand-100' : 'border-blue-100 bg-white hover:border-brand-300',
              )}>
                <span className={cn('mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white', r.color)}><r.icon className="h-4 w-4" /></span>
                <span className="block text-xs font-extrabold text-brand-950">{roleLabels[r.id]}</span>
                <span className="mt-0.5 block text-[10px] leading-tight text-slate-400">{r.description}</span>
              </button>
            ))}
          </div>

          <form className="mt-6 space-y-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-card" onSubmit={(e) => { e.preventDefault(); login(role) }}>
            <div>
              <label className="label-base">Email address</label>
              <div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={selected.email} readOnly className="pl-10" /></div>
            </div>
            <div>
              <label className="label-base">Password</label>
              <div className="relative"><Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" /></div>
            </div>
            <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5 font-semibold text-emerald-600"><CheckCircle2 className="h-4 w-4" />Demo mode is ready</span><span className="text-slate-400">Any password works</span></div>
            <Button type="submit" className="w-full" size="lg">Enter {roleLabels[role]} workspace <ArrowRight className="h-4 w-4" /></Button>
            <p className="text-center text-[11px] leading-relaxed text-slate-400">Prototype for testing only. No real authentication, payments, emails, or SMS are processed.</p>
          </form>
        </div>
      </div>
    </div>
  )
}
