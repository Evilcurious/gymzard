import {
  Activity, Bell, Building2, CalendarDays, CreditCard, Dumbbell, HeartPulse, LayoutDashboard,
  Package, PieChart, ScanLine, Settings, ShieldCheck, ShoppingCart, Sparkles, Target, UserCog,
  Users, Utensils, Wallet, ClipboardList, type LucideIcon,
} from 'lucide-react'
import type { ModuleKey } from '../types'

export interface NavItem {
  key: ModuleKey
  label: string
  icon: LucideIcon
  description: string
  group: string
}

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Business overview and live KPIs', group: 'Overview' },
  { key: 'members', label: 'Members', icon: Users, description: 'Profiles, status, documents, and history', group: 'Operations' },
  { key: 'memberships', label: 'Membership Plans', icon: CreditCard, description: 'Plans, packages, upgrades, and freezes', group: 'Operations' },
  { key: 'payments', label: 'Payments & Billing', icon: Wallet, description: 'Invoices, dues, refunds, and receipts', group: 'Operations' },
  { key: 'attendance', label: 'Attendance', icon: ScanLine, description: 'QR, RFID, biometric, and manual check-ins', group: 'Operations' },
  { key: 'classes', label: 'Classes & Sessions', icon: CalendarDays, description: 'Schedules, bookings, and waitlists', group: 'Operations' },
  { key: 'trainers', label: 'Trainers', icon: Dumbbell, description: 'Coaches, schedules, commissions, ratings', group: 'People' },
  { key: 'staff', label: 'Staff & HR', icon: UserCog, description: 'Employees, shifts, leave, and payroll', group: 'People' },
  { key: 'workout', label: 'Workout Plans', icon: Activity, description: 'Exercise library and training programs', group: 'Fitness Experience' },
  { key: 'diet', label: 'Diet & Nutrition', icon: Utensils, description: 'Meal plans, macros, foods, and water', group: 'Fitness Experience' },
  { key: 'progress', label: 'Fitness Progress', icon: HeartPulse, description: 'Body metrics, charts, and milestones', group: 'Fitness Experience' },
  { key: 'inventory', label: 'Inventory', icon: Package, description: 'Equipment, supplements, and maintenance', group: 'Commerce' },
  { key: 'pos', label: 'POS Billing', icon: ShoppingCart, description: 'Product sales, cart, stock, and returns', group: 'Commerce' },
  { key: 'leads', label: 'Leads & CRM', icon: Target, description: 'Enquiries, follow-ups, and conversions', group: 'Commerce' },
  { key: 'notifications', label: 'Notifications', icon: Bell, description: 'WhatsApp, SMS, email, and campaigns', group: 'Engagement' },
  { key: 'advanced', label: 'Smart Features', icon: Sparkles, description: 'AI tools, scores, challenges, and cards', group: 'Engagement' },
  { key: 'reports', label: 'Reports & Analytics', icon: PieChart, description: 'Financial, member, and attendance reports', group: 'Insights' },
  { key: 'branches', label: 'Branches', icon: Building2, description: 'Multi-branch performance and transfers', group: 'Insights' },
  { key: 'roles', label: 'Roles & Access', icon: ShieldCheck, description: 'RBAC permissions and user accounts', group: 'Administration' },
  { key: 'settings', label: 'Settings', icon: Settings, description: 'Gym profile, tax, and integrations', group: 'Administration' },
]

export const moduleMeta = Object.fromEntries(navItems.map((n) => [n.key, n])) as Record<ModuleKey, NavItem>

export const navGroups = ['Overview', 'Operations', 'People', 'Fitness Experience', 'Commerce', 'Engagement', 'Insights', 'Administration']

export const portalItems: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'portal', label: 'My Dashboard', icon: LayoutDashboard },
  { key: 'memberships', label: 'My Membership', icon: CreditCard },
  { key: 'payments', label: 'My Payments', icon: Wallet },
  { key: 'attendance', label: 'My Attendance', icon: ScanLine },
  { key: 'workout', label: 'My Workouts', icon: Activity },
  { key: 'diet', label: 'My Diet', icon: Utensils },
  { key: 'progress', label: 'My Progress', icon: HeartPulse },
  { key: 'classes', label: 'My Classes', icon: ClipboardList },
]
