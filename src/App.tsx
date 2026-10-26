import type { ReactNode } from 'react'
import { AppProvider, useApp } from './lib/app-context'
import { ToastViewport } from './components/ui'
import { Login } from './components/Login'
import { Layout } from './components/Layout'
import { Overlays } from './components/overlays/Overlays'
import { Dashboard } from './pages/Dashboard'
import { Members } from './pages/Members'
import { Memberships } from './pages/Memberships'
import { Payments } from './pages/Payments'
import { Attendance } from './pages/Attendance'
import { Trainers } from './pages/Trainers'
import { Staff, Classes, Inventory } from './pages/Operations'
import { Pos, Notifications, Leads } from './pages/Commerce'
import { Workout, Diet, Progress } from './pages/Fitness'
import { Reports, Branches, Roles, Advanced, Settings } from './pages/Insights'
import { MemberPortal } from './pages/MemberPortal'

function Routes() {
  const { user, role, activeModule, can } = useApp()
  if (!user) return <Login />
  if (role === 'member') return <Layout><MemberPortal /></Layout>

  const module = can(activeModule) ? activeModule : 'dashboard'
  const pages: Record<string, ReactNode> = {
    dashboard: <Dashboard />,
    members: <Members />,
    memberships: <Memberships />,
    payments: <Payments />,
    attendance: <Attendance />,
    trainers: <Trainers />,
    staff: <Staff />,
    classes: <Classes />,
    inventory: <Inventory />,
    pos: <Pos />,
    notifications: <Notifications />,
    leads: <Leads />,
    workout: <Workout />,
    diet: <Diet />,
    progress: <Progress />,
    reports: <Reports />,
    branches: <Branches />,
    roles: <Roles />,
    advanced: <Advanced />,
    settings: <Settings />,
  }
  return <Layout>{pages[module] || <Dashboard />}</Layout>
}

function AppShell() {
  const { toasts, dismissToast } = useApp()
  return (
    <>
      <ToastViewport toasts={toasts} dismiss={dismissToast} />
      <Overlays />
      <Routes />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
