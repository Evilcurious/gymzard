import type { Database, Payment } from '../types'
import { daysUntil, isoDate } from './utils'

export function scoped<T extends { branchId: string }>(items: T[], branchId: string) {
  return branchId === 'all' ? items : items.filter((x) => x.branchId === branchId || x.branchId === 'all')
}

export function dashboardMetrics(db: Database, branchId: string) {
  const members = scoped(db.members, branchId)
  const payments = scoped(db.payments, branchId)
  const attendance = scoped(db.attendance, branchId)
  const expenses = scoped(db.expenses, branchId)
  const today = isoDate(new Date())
  const month = today.slice(0, 7)
  const todayCollection = payments.filter((p) => isoDate(p.date) === today).reduce((s, p) => s + p.paid, 0)
  const monthlyRevenue = payments.filter((p) => p.date.startsWith(month)).reduce((s, p) => s + p.paid, 0)
  const monthlyExpenses = expenses.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0)
  const pendingDues = members.reduce((s, m) => s + m.dueAmount, 0)
  const activeMembers = members.filter((m) => m.status === 'Active' || m.status === 'Trial').length
  const expiredMembers = members.filter((m) => m.status === 'Expired').length
  const inactiveMembers = members.filter((m) => m.status === 'Inactive' || m.status === 'Frozen').length
  const expiringSoon = members.filter((m) => daysUntil(m.expiresAt) >= 0 && daysUntil(m.expiresAt) <= 7 && ['Active', 'Trial'].includes(m.status))
  const todayAttendance = attendance.filter((a) => a.date === today).length
  const insideNow = attendance.filter((a) => a.date === today && !a.checkOut).length
  const newThisMonth = members.filter((m) => m.joinedAt.startsWith(month)).length
  const totalRevenue = payments.reduce((s, p) => s + p.paid, 0)
  const mrr = monthlyRevenue
  const arpm = activeMembers ? Math.round(monthlyRevenue / Math.max(1, activeMembers)) : 0
  const retention = members.length ? Math.round(((members.length - expiredMembers - inactiveMembers) / members.length) * 100) : 0
  return {
    members, payments, attendance, expenses, todayCollection, monthlyRevenue, monthlyExpenses, pendingDues,
    activeMembers, expiredMembers, inactiveMembers, expiringSoon, todayAttendance, insideNow, newThisMonth,
    totalRevenue, mrr, arpm, retention, profit: monthlyRevenue - monthlyExpenses,
  }
}

export function peakHourData(attendance: Database['attendance']) {
  return Array.from({ length: 16 }).map((_, i) => {
    const hour = i + 6
    return {
      hour: `${String(hour).padStart(2, '0')}:00`,
      visits: attendance.filter((a) => new Date(a.checkIn).getHours() === hour).length,
    }
  })
}

export function planDistribution(db: Database, branchId: string) {
  const members = scoped(db.members, branchId)
  const groups = new Map<string, number>()
  members.forEach((m) => {
    const plan = db.plans.find((p) => p.id === m.planId)
    const key = plan?.category || 'Other'
    groups.set(key, (groups.get(key) || 0) + 1)
  })
  return [...groups.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

export function branchPerformance(db: Database) {
  return db.branches.map((b) => {
    const payments = db.payments.filter((p) => p.branchId === b.id)
    const members = db.members.filter((m) => m.branchId === b.id)
    const attendance = db.attendance.filter((a) => a.branchId === b.id)
    const revenue = payments.reduce((s, p) => s + p.paid, 0)
    return {
      id: b.id, name: b.name, code: b.code, manager: b.manager, revenue, target: b.monthlyTarget,
      members: members.length, active: members.filter((m) => m.status === 'Active' || m.status === 'Trial').length,
      attendance: attendance.length, dues: members.reduce((s, m) => s + m.dueAmount, 0), status: b.status,
    }
  })
}

export function paymentMethodBreakdown(payments: Payment[]) {
  const methods = ['Cash', 'UPI', 'Card', 'Online', 'Bank Transfer']
  return methods.map((method) => ({ name: method, value: payments.filter((p) => p.method === method).reduce((s, p) => s + p.paid, 0) })).filter((x) => x.value > 0)
}

export function expenseCategoryBreakdown(db: Database, branchId: string) {
  const expenses = scoped(db.expenses, branchId)
  const categories = ['Rent', 'Salaries', 'Utilities', 'Maintenance', 'Marketing', 'Equipment', 'Other']
  return categories.map((category) => ({ name: category, value: expenses.filter((e) => e.category === category).reduce((s, e) => s + e.amount, 0) })).filter((x) => x.value > 0)
}

export function attendanceTrend(attendance: Database['attendance'], days = 14) {
  return Array.from({ length: days }).map((_, i) => {
    const date = isoDate(new Date(Date.now() - (days - 1 - i) * 86400000))
    return { date: date.slice(5), visits: attendance.filter((a) => a.date === date).length }
  })
}

export function churnRiskScore(member: Database['members'][number]) {
  let score = 0
  const days = daysUntil(member.expiresAt)
  if (days < 0) score += 45
  else if (days < 8) score += 25
  else if (days < 20) score += 12
  score += Math.max(0, 35 - member.engagementScore)
  score += member.dueAmount > 0 ? 15 : 0
  if (member.status === 'Inactive' || member.status === 'Frozen') score += 20
  return Math.min(99, Math.max(5, score))
}
