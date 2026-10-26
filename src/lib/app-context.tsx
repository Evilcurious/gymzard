import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Activity, Database, ModuleKey, Role, User } from '../types'
import { createSeedDatabase } from '../data/seed'
import { uid } from './utils'

const DB_KEY = 'gymzard:db:v1'
const SESSION_KEY = 'gymzard:session:v1'
const BRANCH_KEY = 'gymzard:branch:v1'

export type FormFieldType = 'text' | 'email' | 'tel' | 'number' | 'date' | 'time' | 'datetime-local' | 'select' | 'textarea' | 'checkbox' | 'image' | 'file' | 'color' | 'password'

export interface FormOption { value: string; label: string }

export interface FormField {
  name: string
  label: string
  type?: FormFieldType
  options?: FormOption[]
  placeholder?: string
  required?: boolean
  defaultValue?: string | number | boolean
  hint?: string
  min?: number
  max?: number
  step?: number
  span?: 1 | 2
  accept?: string
  rows?: number
  disabled?: boolean
}

export type FormValues = Record<string, string | number | boolean | undefined>

export interface FormConfig {
  key?: string
  title: string
  subtitle?: string
  fields: FormField[]
  initial?: FormValues
  submitLabel?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  onSubmit: (values: FormValues) => void
}

export interface ToastItem {
  id: string
  message: string
  tone: 'success' | 'info' | 'warning' | 'error'
}

interface UIState {
  form: FormConfig | null
  memberDetailId: string | null
  receiptId: string | null
  cardId: string | null
  checkInOpen: boolean
  aiType: 'workout' | 'diet' | null
}

interface AppContextValue {
  db: Database
  updateDb: (updater: (prev: Database) => Database) => void
  resetDb: () => void
  logActivity: (title: string, detail: string, type: Activity['type']) => void
  user: User | null
  role: Role
  branchId: string
  setBranchId: (id: string) => void
  activeModule: ModuleKey
  navigate: (module: ModuleKey) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  login: (role: Role) => void
  logout: () => void
  switchRole: (role: Role) => void
  toasts: ToastItem[]
  toast: (message: string, tone?: ToastItem['tone']) => void
  dismissToast: (id: string) => void
  ui: UIState
  openForm: (config: FormConfig) => void
  closeForm: () => void
  openMember: (id: string) => void
  openReceipt: (id: string) => void
  openCard: (id: string) => void
  openCheckIn: () => void
  openAI: (type: 'workout' | 'diet') => void
  closeOverlay: () => void
  scope: <T extends { branchId: string }>(items: T[]) => T[]
  can: (module: ModuleKey) => boolean
}

const demoUsers: Record<Role, User> = {
  super_admin: { name: 'Alex Morgan', email: 'alex@gymzard.io', role: 'super_admin', branchId: 'all', title: 'Platform Super Admin' },
  owner: { name: 'Usman Ali', email: 'owner@gymzard.fit', role: 'owner', branchId: 'all', title: 'Gym Owner' },
  manager: { name: 'Sana Iqbal', email: 'manager@gymzard.fit', role: 'manager', branchId: 'br-1', title: 'Branch Manager' },
  trainer: { name: 'Hammad Raza', email: 'hammad@gymzard.fit', role: 'trainer', branchId: 'br-1', title: 'Head Trainer' },
  receptionist: { name: 'Areeba Khan', email: 'frontdesk@gymzard.fit', role: 'receptionist', branchId: 'br-2', title: 'Front Desk Executive' },
  member: { name: 'Ayesha Khan', email: 'ayesha@example.com', role: 'member', branchId: 'br-1', title: 'Premium Member' },
}

export const roleLabels: Record<Role, string> = {
  super_admin: 'Super Admin',
  owner: 'Gym Owner',
  manager: 'Gym Manager',
  trainer: 'Trainer',
  receptionist: 'Receptionist',
  member: 'Member',
}

const roleModules: Record<Role, ModuleKey[] | 'all'> = {
  super_admin: 'all',
  owner: 'all',
  manager: ['dashboard', 'members', 'memberships', 'payments', 'attendance', 'trainers', 'staff', 'classes', 'inventory', 'pos', 'notifications', 'reports', 'branches', 'leads', 'settings'],
  trainer: ['dashboard', 'members', 'attendance', 'trainers', 'diet', 'workout', 'progress', 'classes', 'notifications', 'advanced'],
  receptionist: ['dashboard', 'members', 'memberships', 'payments', 'attendance', 'classes', 'pos', 'inventory', 'notifications', 'leads'],
  member: ['portal'],
}

const AppContext = createContext<AppContextValue | null>(null)

function loadDb(): Database {
  const seed = createSeedDatabase()
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Database>
      if (parsed?.members?.length && parsed?.settings && parsed?.branches?.length) {
        return {
          ...seed,
          ...parsed,
          settings: { ...seed.settings, ...parsed.settings },
          coupons: parsed.coupons?.length ? parsed.coupons : seed.coupons,
        } as Database
      }
    }
  } catch {
    // Fall back to seed data.
  }
  return seed
}

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function moduleFromHash(): ModuleKey | null {
  const value = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  return value as ModuleKey | null
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Database>(loadDb)
  const [user, setUser] = useState<User | null>(loadSession)
  const [branchId, setBranchIdState] = useState<string>(() => localStorage.getItem(BRANCH_KEY) || 'all')
  const [activeModule, setActiveModule] = useState<ModuleKey>(() => moduleFromHash() || 'dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [ui, setUi] = useState<UIState>({
    form: null, memberDetailId: null, receiptId: null, cardId: null, checkInOpen: false, aiType: null,
  })

  useEffect(() => {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)) } catch { /* storage quota */ }
  }, [db])
  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    else localStorage.removeItem(SESSION_KEY)
  }, [user])
  useEffect(() => { localStorage.setItem(BRANCH_KEY, branchId) }, [branchId])

  useEffect(() => {
    const onHash = () => {
      const next = moduleFromHash()
      if (next) setActiveModule(next)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = useCallback((module: ModuleKey) => {
    setActiveModule(module)
    window.location.hash = `/${module}`
    setSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const updateDb = useCallback((updater: (prev: Database) => Database) => {
    setDb((prev) => updater(prev))
  }, [])

  const logActivity = useCallback((title: string, detail: string, type: Activity['type']) => {
    setDb((prev) => ({
      ...prev,
      activity: [{ id: uid('act'), title, detail, time: new Date().toISOString(), type }, ...prev.activity].slice(0, 40),
    }))
  }, [])

  const toast = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = uid('toast')
    setToasts((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3800)
  }, [])

  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  const setBranchId = useCallback((id: string) => setBranchIdState(id), [])

  const login = useCallback((role: Role) => {
    const next = demoUsers[role]
    setUser(next)
    setBranchIdState(next.branchId)
    navigate(role === 'member' ? 'portal' : 'dashboard')
    toast(`Welcome back, ${next.name.split(' ')[0]}!`, 'success')
  }, [navigate, toast])

  const logout = useCallback(() => {
    setUser(null)
    setUi({ form: null, memberDetailId: null, receiptId: null, cardId: null, checkInOpen: false, aiType: null })
    navigate('dashboard')
  }, [navigate])

  const switchRole = useCallback((role: Role) => {
    const next = demoUsers[role]
    setUser(next)
    setBranchIdState(next.branchId)
    navigate(role === 'member' ? 'portal' : 'dashboard')
    toast(`Switched to ${roleLabels[role]} view`, 'info')
  }, [navigate, toast])

  const resetDb = useCallback(() => {
    const fresh = createSeedDatabase()
    setDb(fresh)
    localStorage.removeItem(DB_KEY)
    setUi({ form: null, memberDetailId: null, receiptId: null, cardId: null, checkInOpen: false, aiType: null })
    toast('Demo data reset to its original state', 'info')
  }, [toast])

  const openForm = useCallback((config: FormConfig) => setUi((prev) => ({ ...prev, form: { ...config, key: uid('form') } })), [])
  const closeForm = useCallback(() => setUi((prev) => ({ ...prev, form: null })), [])
  const openMember = useCallback((id: string) => setUi((prev) => ({ ...prev, memberDetailId: id })), [])
  const openReceipt = useCallback((id: string) => setUi((prev) => ({ ...prev, receiptId: id })), [])
  const openCard = useCallback((id: string) => setUi((prev) => ({ ...prev, cardId: id })), [])
  const openCheckIn = useCallback(() => setUi((prev) => ({ ...prev, checkInOpen: true })), [])
  const openAI = useCallback((type: 'workout' | 'diet') => setUi((prev) => ({ ...prev, aiType: type })), [])
  const closeOverlay = useCallback(() => setUi({
    form: null, memberDetailId: null, receiptId: null, cardId: null, checkInOpen: false, aiType: null,
  }), [])

  const role = user?.role || 'owner'
  const can = useCallback((module: ModuleKey) => {
    const allowed = roleModules[role]
    return allowed === 'all' || allowed.includes(module)
  }, [role])

  const scope = useCallback(<T extends { branchId: string }>(items: T[]) => (
    branchId === 'all' ? items : items.filter((item) => item.branchId === branchId || item.branchId === 'all')
  ), [branchId])

  const value = useMemo<AppContextValue>(() => ({
    db, updateDb, resetDb, logActivity, user, role, branchId, setBranchId,
    activeModule, navigate, sidebarOpen, setSidebarOpen, login, logout, switchRole,
    toasts, toast, dismissToast, ui, openForm, closeForm, openMember, openReceipt,
    openCard, openCheckIn, openAI, closeOverlay, scope, can,
  }), [db, updateDb, resetDb, logActivity, user, role, branchId, setBranchId, activeModule, navigate,
    sidebarOpen, login, logout, switchRole, toasts, toast, dismissToast, ui, openForm, closeForm,
    openMember, openReceipt, openCard, openCheckIn, openAI, closeOverlay, scope, can])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

export function useCurrency() {
  const { db } = useApp()
  return db.settings.currency
}
