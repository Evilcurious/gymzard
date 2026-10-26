export type Role = 'super_admin' | 'owner' | 'manager' | 'trainer' | 'receptionist' | 'member'

export type ModuleKey =
  | 'dashboard'
  | 'members'
  | 'memberships'
  | 'payments'
  | 'attendance'
  | 'trainers'
  | 'diet'
  | 'workout'
  | 'progress'
  | 'staff'
  | 'classes'
  | 'inventory'
  | 'pos'
  | 'notifications'
  | 'reports'
  | 'branches'
  | 'roles'
  | 'leads'
  | 'advanced'
  | 'settings'
  | 'portal'

export type MemberStatus = 'Active' | 'Expired' | 'Inactive' | 'Frozen' | 'Trial'
export type PaymentStatus = 'Paid' | 'Partial' | 'Pending' | 'Refunded'
export type ClassStatus = 'Scheduled' | 'Completed' | 'Cancelled'
export type BookingStatus = 'Confirmed' | 'Waitlisted' | 'Cancelled'

export interface Branch {
  id: string
  name: string
  code: string
  address: string
  city: string
  manager: string
  phone: string
  status: 'Open' | 'Closed'
  openedAt: string
  monthlyTarget: number
  color: string
}

export interface Plan {
  id: string
  name: string
  category: 'Standard' | 'Personal Training' | 'Family' | 'Corporate' | 'Trial'
  durationDays: number
  price: number
  sessions: number
  description: string
  features: string[]
  active: boolean
  popular?: boolean
  branchId: string
}

export interface MemberDocument {
  id: string
  name: string
  type: string
  date: string
  size: string
}

export interface MembershipHistoryItem {
  plan: string
  from: string
  to: string
  amount: number
}

export interface Member {
  id: string
  memberId: string
  name: string
  email: string
  phone: string
  gender: 'Male' | 'Female' | 'Other'
  dob: string
  photo?: string
  branchId: string
  planId: string
  trainerId?: string
  status: MemberStatus
  joinedAt: string
  startsAt: string
  expiresAt: string
  emergencyName: string
  emergencyPhone: string
  medical: string
  goals: string
  notes: string
  tags: string[]
  dueAmount: number
  lastVisit?: string
  attendanceCount: number
  healthScore: number
  engagementScore: number
  referralCode: string
  documents: MemberDocument[]
  membershipHistory: MembershipHistoryItem[]
  height: number
  weight: number
  targetWeight: number
  autoRenew: boolean
}

export interface Payment {
  id: string
  invoiceNo: string
  memberId: string
  memberName: string
  planId: string
  branchId: string
  date: string
  dueDate: string
  subtotal: number
  discount: number
  tax: number
  total: number
  paid: number
  method: 'Cash' | 'UPI' | 'Card' | 'Online' | 'Bank Transfer'
  status: PaymentStatus
  gateway?: string
  note?: string
  refunded?: number
}

export interface Attendance {
  id: string
  memberId: string
  memberName: string
  branchId: string
  date: string
  checkIn: string
  checkOut?: string
  method: 'QR Code' | 'RFID' | 'Biometric' | 'Manual'
}

export interface Trainer {
  id: string
  name: string
  email: string
  phone: string
  specialization: string
  certifications: string[]
  rating: number
  status: 'Active' | 'On Leave' | 'Inactive'
  branchId: string
  assignedMembers: number
  sessions: number
  commissionRate: number
  salary: number
  joiningDate: string
  color: string
  availability: string
  performance: number
}

export interface StaffMember {
  id: string
  name: string
  role: string
  department: string
  phone: string
  email: string
  shift: string
  salary: number
  status: 'Active' | 'On Leave' | 'Inactive'
  joiningDate: string
  branchId: string
  leaves: number
  performance: number
  documents: number
}

export interface GymClass {
  id: string
  title: string
  type: 'Yoga' | 'Zumba' | 'CrossFit' | 'Strength' | 'HIIT' | 'Pilates' | 'Personal Training'
  trainerId: string
  date: string
  time: string
  duration: number
  capacity: number
  room: string
  status: ClassStatus
  branchId: string
  color: string
}

export interface Booking {
  id: string
  classId: string
  memberId: string
  status: BookingStatus
  bookedAt: string
}

export interface InventoryItem {
  id: string
  name: string
  category: 'Equipment' | 'Supplement' | 'Retail' | 'Accessory'
  sku: string
  quantity: number
  reorderLevel: number
  unitCost: number
  supplier: string
  branchId: string
  lastRestocked: string
  maintenanceDate?: string
  condition: 'Excellent' | 'Good' | 'Needs Service'
  depreciation: number
}

export interface Product {
  id: string
  name: string
  category: 'Supplements' | 'Drinks' | 'Merchandise' | 'Accessories'
  sku: string
  price: number
  stock: number
  barcode: string
  taxRate: number
  emoji: string
  branchId: string
}

export interface SaleItem {
  productId: string
  name: string
  qty: number
  price: number
}

export interface Sale {
  id: string
  invoiceNo: string
  items: SaleItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  method: 'Cash' | 'UPI' | 'Card' | 'Online'
  date: string
  memberId?: string
  branchId: string
  status: 'Completed' | 'Refunded'
}

export interface Expense {
  id: string
  title: string
  category: 'Rent' | 'Salaries' | 'Utilities' | 'Maintenance' | 'Marketing' | 'Equipment' | 'Other'
  amount: number
  date: string
  branchId: string
  vendor: string
  status: 'Paid' | 'Pending'
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  channel: 'WhatsApp' | 'SMS' | 'Email' | 'Push'
  audience: string
  sentAt: string
  status: 'Sent' | 'Scheduled' | 'Failed'
  read: boolean
}

export interface Lead {
  id: string
  name: string
  phone: string
  email: string
  source: 'Website' | 'Walk-in' | 'Referral' | 'Instagram' | 'Google Ads'
  interest: string
  status: 'New' | 'Contacted' | 'Trial Booked' | 'Converted' | 'Lost'
  assignedTo: string
  followUpDate: string
  score: number
  notes: string
}

export interface ProgressEntry {
  id: string
  memberId: string
  date: string
  weight: number
  bodyFat: number
  muscleMass: number
  bmi: number
  chest: number
  waist: number
  hips: number
  arms: number
  notes: string
}

export interface WorkoutExercise {
  name: string
  muscle: string
  sets: number
  reps: string
  weight: string
  completed?: boolean
}

export interface WorkoutPlan {
  id: string
  name: string
  memberId: string
  goal: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  days: string
  trainerId: string
  exercises: WorkoutExercise[]
  status: 'Active' | 'Draft' | 'Completed'
  createdAt: string
  completedSessions: number
  totalSessions: number
  feedback: string
}

export interface DietMeal {
  time: string
  name: string
  items: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface DietPlan {
  id: string
  name: string
  memberId: string
  goal: 'Weight Loss' | 'Muscle Gain' | 'Maintenance' | 'Performance'
  type: 'Vegetarian' | 'Non-Vegetarian' | 'Vegan'
  calories: number
  protein: number
  carbs: number
  fat: number
  waterTarget: number
  meals: DietMeal[]
  status: 'Active' | 'Draft'
  createdAt: string
}

export interface Food {
  id: string
  name: string
  serving: string
  calories: number
  protein: number
  carbs: number
  fat: number
  type: 'Veg' | 'Non-Veg' | 'Vegan' | 'Supplement'
}

export interface Exercise {
  id: string
  name: string
  muscle: string
  equipment: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  instructions: string
  duration: string
}

export interface Coupon {
  id: string
  code: string
  description: string
  discountType: 'percent' | 'fixed'
  value: number
  minAmount: number
  validFrom: string
  validTo: string
  usageLimit: number
  used: number
  status: 'Active' | 'Expired' | 'Draft'
  appliesTo: string
}

export interface Activity {
  id: string
  title: string
  detail: string
  time: string
  type: 'payment' | 'member' | 'attendance' | 'class' | 'system' | 'alert'
}

export interface Settings {
  gymName: string
  tagline: string
  email: string
  phone: string
  address: string
  currency: string
  taxRate: number
  receiptPrefix: string
  autoRenew: boolean
  qrEntry: boolean
  whatsappEnabled: boolean
  smsEnabled: boolean
  emailEnabled: boolean
  primaryColor: string
}

export interface Database {
  branches: Branch[]
  plans: Plan[]
  members: Member[]
  payments: Payment[]
  attendance: Attendance[]
  trainers: Trainer[]
  staff: StaffMember[]
  classes: GymClass[]
  bookings: Booking[]
  inventory: InventoryItem[]
  products: Product[]
  sales: Sale[]
  expenses: Expense[]
  notifications: NotificationItem[]
  coupons: Coupon[]
  leads: Lead[]
  progress: ProgressEntry[]
  workoutPlans: WorkoutPlan[]
  dietPlans: DietPlan[]
  foods: Food[]
  exercises: Exercise[]
  activity: Activity[]
  settings: Settings
  monthlyRevenue: { month: string; revenue: number; expenses: number; target: number }[]
  memberGrowth: { month: string; members: number; renewals: number }[]
}

export interface User {
  name: string
  email: string
  role: Role
  branchId: string
  title: string
}
