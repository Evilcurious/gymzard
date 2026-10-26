import type {
  Activity, Attendance, Booking, Branch, Coupon, Database, DietPlan, Exercise, Expense, Food, GymClass,
  InventoryItem, Lead, Member, NotificationItem, Payment, Plan, Product, ProgressEntry, Sale,
  StaffMember, Trainer, WorkoutPlan,
} from '../types'
import { addDays, addMonths, isoDate, isoDateTime, seededRandom, uid } from '../lib/utils'

const now = new Date()
const rand = seededRandom(20261026)
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
const round = (n: number, d = 0) => Number(n.toFixed(d))

const branches: Branch[] = [
  { id: 'br-1', name: 'Gulberg Main', code: 'GZB-01', address: '14-A Main Boulevard', city: 'Lahore', manager: 'Usman Ali', phone: '+92 42 3577 1100', status: 'Open', openedAt: isoDate(addMonths(now, -38)), monthlyTarget: 1250000, color: '#1557d6' },
  { id: 'br-2', name: 'DHA Phase 5', code: 'GZB-02', address: '88-C Commercial Area', city: 'Lahore', manager: 'Sana Iqbal', phone: '+92 42 3711 2244', status: 'Open', openedAt: isoDate(addMonths(now, -21)), monthlyTarget: 980000, color: '#2f80ed' },
  { id: 'br-3', name: 'Johar Town Studio', code: 'GZB-03', address: 'Block F-2, Civic Center', city: 'Lahore', manager: 'Bilal Ahmed', phone: '+92 42 3531 8890', status: 'Open', openedAt: isoDate(addMonths(now, -11)), monthlyTarget: 720000, color: '#12a3c7' },
]

const plans: Plan[] = [
  { id: 'plan-monthly', name: 'Monthly Flex', category: 'Standard', durationDays: 30, price: 8500, sessions: 0, description: 'Flexible monthly gym access with full floor equipment.', features: ['Full gym access', 'Locker facility', '2 guest passes', 'Free fitness assessment'], active: true, branchId: 'all' },
  { id: 'plan-quarterly', name: 'Quarterly Saver', category: 'Standard', durationDays: 90, price: 22500, sessions: 0, description: 'Three months of training with a 12% saving.', features: ['Everything in Monthly', '1 PT session', 'Diet consultation', 'Priority class booking'], active: true, popular: true, branchId: 'all' },
  { id: 'plan-halfyearly', name: 'Half-Yearly Pro', category: 'Standard', durationDays: 180, price: 42000, sessions: 0, description: 'Six-month membership for committed members.', features: ['Everything in Quarterly', '4 PT sessions', 'Body composition scan', 'Freezed days: 15'], active: true, branchId: 'all' },
  { id: 'plan-yearly', name: 'Yearly Champion', category: 'Standard', durationDays: 365, price: 76000, sessions: 0, description: 'Best-value annual membership with maximum perks.', features: ['Everything in Half-Yearly', '12 PT sessions', '30 freeze days', 'Free merchandise kit'], active: true, branchId: 'all' },
  { id: 'plan-pt-starter', name: 'PT Starter', category: 'Personal Training', durationDays: 30, price: 18000, sessions: 12, description: 'One-on-one personal training for focused results.', features: ['12 personal sessions', 'Custom workout plan', 'Weekly progress review', 'Nutrition guidance'], active: true, branchId: 'all' },
  { id: 'plan-pt-pro', name: 'PT Transformation', category: 'Personal Training', durationDays: 90, price: 48000, sessions: 36, description: '90-day transformation with a dedicated coach.', features: ['36 personal sessions', 'Workout + diet plans', 'Body scans', 'Transformation tracker'], active: true, branchId: 'all' },
  { id: 'plan-family', name: 'Family Plus', category: 'Family', durationDays: 365, price: 128000, sessions: 8, description: 'Annual membership for up to four family members.', features: ['Up to 4 members', '8 PT sessions', 'Family diet plan', 'Priority support'], active: true, branchId: 'all' },
  { id: 'plan-corporate', name: 'Corporate Wellness', category: 'Corporate', durationDays: 365, price: 68000, sessions: 4, description: 'Annual corporate plan for teams of 10 or more.', features: ['Team dashboard', 'Quarterly health camps', '4 PT sessions', 'Corporate reporting'], active: true, branchId: 'all' },
  { id: 'plan-trial', name: '7-Day Trial', category: 'Trial', durationDays: 7, price: 0, sessions: 1, description: 'Free trial with one orientation session.', features: ['7-day access', '1 orientation session', 'Fitness assessment', 'No commitment'], active: true, branchId: 'all' },
  { id: 'plan-dha-premium', name: 'DHA Premium', category: 'Standard', durationDays: 30, price: 10500, sessions: 2, description: 'Branch-exclusive premium access at DHA Phase 5.', features: ['Premium floor', 'Steam room', '2 PT sessions', 'Towel service'], active: true, branchId: 'br-2' },
]

const firstNames = ['Ayesha', 'Ali', 'Fatima', 'Hamza', 'Zainab', 'Omar', 'Mariam', 'Usman', 'Hina', 'Bilal', 'Sana', 'Ahmed', 'Noor', 'Kamran', 'Iqra', 'Faisal', 'Laiba', 'Junaid', 'Mehwish', 'Daniyal', 'Areeba', 'Rizwan', 'Sadia', 'Talha', 'Mahnoor', 'Asad', 'Nida', 'Waleed', 'Kinza', 'Haris', 'Amna', 'Saad', 'Eman', 'Fahad', 'Huda', 'Zeeshan', 'Rabia', 'Moiz', 'Anum', 'Shahbaz', 'Maha', 'Yasir', 'Sidra', 'Noman', 'Aiman', 'Basit', 'Samia', 'Rehan', 'Maria', 'Kashif', 'Nimra', 'Farhan']
const lastNames = ['Khan', 'Ahmed', 'Malik', 'Hassan', 'Butt', 'Raza', 'Sheikh', 'Iqbal', 'Ali', 'Farooq', 'Siddiqui', 'Chaudhry', 'Javed', 'Nawaz', 'Qureshi', 'Tariq', 'Younas', 'Aslam', 'Shah', 'Bhatti']
const goals = ['Weight loss', 'Muscle gain', 'General fitness', 'Strength training', 'Improved stamina', 'Posture correction', 'Athletic performance', 'Body recomposition']
const medicalNotes = ['No known conditions', 'Mild asthma', 'Lower-back sensitivity', 'Thyroid managed with medication', 'Knee injury in 2022', 'None reported', 'High blood pressure — monitored']
const tagsPool = ['VIP', 'Early bird', 'Referral', 'PT client', 'Yoga lover', 'Corporate', 'Student', 'Renewal due', 'High engagement']

const members: Member[] = firstNames.map((first, i) => {
  const name = `${first} ${lastNames[i % lastNames.length]}`
  const plan = plans[int(0, 7)]
  const statusRoll = i % 20
  const status: Member['status'] = statusRoll === 2 || statusRoll === 11 ? 'Expired'
    : statusRoll === 5 ? 'Trial'
      : statusRoll === 8 ? 'Frozen'
        : statusRoll === 14 ? 'Inactive'
          : 'Active'
  const joinedAt = addDays(now, -int(20, 700))
  const expiresAt = status === 'Expired' || status === 'Inactive'
    ? addDays(now, -int(2, 65))
    : status === 'Trial' ? addDays(now, int(1, 7)) : addDays(now, int(3, 210))
  const startsAt = addDays(expiresAt, -plan.durationDays)
  const branch = branches[i % branches.length]
  const due = status === 'Active' && i % 6 === 0 ? int(1500, 6000) : status === 'Expired' ? int(4000, 12000) : 0
  return {
    id: `mem-${i + 1}`,
    memberId: `GZ-${String(2401 + i)}`,
    name,
    email: `${first.toLowerCase()}.${lastNames[i % lastNames.length].toLowerCase()}${i + 1}@example.com`,
    phone: `+92 3${int(0, 9)}${int(10000000, 99999999)}`,
    gender: i % 3 === 0 ? 'Female' : i % 7 === 0 ? 'Other' : 'Male',
    dob: isoDate(addDays(now, -(365 * int(19, 48) + int(1, 300)))),
    branchId: branch.id,
    planId: plan.id,
    trainerId: `tr-${(i % 8) + 1}`,
    status,
    joinedAt: isoDate(joinedAt),
    startsAt: isoDate(startsAt),
    expiresAt: isoDate(expiresAt),
    emergencyName: `${pick(firstNames)} ${lastNames[(i + 3) % lastNames.length]}`,
    emergencyPhone: `+92 3${int(0, 9)}${int(10000000, 99999999)}`,
    medical: medicalNotes[i % medicalNotes.length],
    goals: goals[i % goals.length],
    notes: i % 5 === 0 ? 'Prefers morning sessions. Responded well to the strength program.' : '',
    tags: [tagsPool[i % tagsPool.length], ...(i % 4 === 0 ? ['Renewal due'] : [])].filter((v, idx, a) => a.indexOf(v) === idx),
    dueAmount: due,
    lastVisit: status === 'Inactive' ? isoDateTime(addDays(now, -int(22, 70))) : isoDateTime(addDays(now, -int(0, 9))),
    attendanceCount: int(8, 180),
    healthScore: int(48, 96),
    engagementScore: int(35, 98),
    referralCode: `REF-${first.slice(0, 3).toUpperCase()}-${240 + i}`,
    documents: i % 4 === 0 ? [{ id: uid('doc'), name: 'ID_Copy.pdf', type: 'Identity', date: isoDate(joinedAt), size: '412 KB' }] : [],
    membershipHistory: [{
      plan: plan.name,
      from: isoDate(startsAt),
      to: isoDate(expiresAt),
      amount: plan.price,
    }],
    height: int(154, 188),
    weight: int(52, 98),
    targetWeight: int(52, 84),
    autoRenew: i % 3 === 0,
  }
})

const payments: Payment[] = members.flatMap((m, i) => {
  const plan = plans.find((p) => p.id === m.planId) || plans[0]
  const base = plan.price || 3500
  const subtotal = base
  const discount = i % 8 === 0 ? round(base * 0.1) : 0
  const tax = round((subtotal - discount) * 0.05)
  const total = subtotal - discount + tax
  const paid = m.status === 'Expired' && i % 3 === 0 ? round(total * 0.5) : total
  const status: Payment['status'] = paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Pending'
  const date = addDays(m.startsAt, -int(0, 3))
  return [{
    id: `pay-${i + 1}`,
    invoiceNo: `INV-${2026001 + i}`,
    memberId: m.id,
    memberName: m.name,
    planId: m.planId,
    branchId: m.branchId,
    date: isoDateTime(date),
    dueDate: isoDate(addDays(date, 7)),
    subtotal,
    discount,
    tax,
    total,
    paid,
    method: pick(['Cash', 'UPI', 'Card', 'Online', 'Bank Transfer'] as const),
    status,
    gateway: pick(['Razorpay', 'Stripe', 'JazzCash', 'Manual']),
    note: status === 'Partial' ? 'Balance to be cleared at next visit.' : '',
  }]
}).concat([
  { id: 'pay-extra-1', invoiceNo: 'INV-2026091', memberId: 'mem-3', memberName: members[2].name, planId: 'plan-pt-starter', branchId: 'br-3', date: isoDateTime(addDays(now, -1)), dueDate: isoDate(addDays(now, 6)), subtotal: 18000, discount: 1000, tax: 850, total: 17850, paid: 17850, method: 'UPI', status: 'Paid', gateway: 'Razorpay', note: '' },
  { id: 'pay-extra-2', invoiceNo: 'INV-2026092', memberId: 'mem-6', memberName: members[5].name, planId: 'plan-quarterly', branchId: 'br-1', date: isoDateTime(addDays(now, -2)), dueDate: isoDate(addDays(now, 5)), subtotal: 22500, discount: 0, tax: 1125, total: 23625, paid: 12000, method: 'Card', status: 'Partial', gateway: 'Stripe', note: 'Awaiting balance payment' },
  { id: 'pay-extra-3', invoiceNo: 'INV-2026093', memberId: 'mem-11', memberName: members[10].name, planId: 'plan-yearly', branchId: 'br-2', date: isoDateTime(addDays(now, -4)), dueDate: isoDate(addDays(now, 3)), subtotal: 76000, discount: 4000, tax: 3600, total: 75600, paid: 75600, method: 'Online', status: 'Paid', gateway: 'Razorpay', note: '' },
])

const weightedHours = [6, 6, 7, 7, 7, 8, 8, 9, 10, 11, 12, 16, 17, 17, 18, 18, 18, 19, 19, 20, 20, 21]
const attendance: Attendance[] = []
for (let d = 29; d >= 0; d--) {
  const date = addDays(now, -d)
  const dayCount = date.getDay() === 0 ? int(12, 22) : int(24, 46)
  for (let j = 0; j < dayCount; j++) {
    const m = pick(members)
    const hour = pick(weightedHours)
    const minute = int(0, 59)
    const checkIn = new Date(date)
    checkIn.setHours(hour, minute, 0, 0)
    const checkOut = rand() > 0.18 ? new Date(checkIn.getTime() + int(45, 105) * 60000) : undefined
    attendance.push({
      id: uid('att'),
      memberId: m.id,
      memberName: m.name,
      branchId: m.branchId,
      date: isoDate(date),
      checkIn: isoDateTime(checkIn),
      checkOut: checkOut ? isoDateTime(checkOut) : undefined,
      method: pick(['QR Code', 'RFID', 'Biometric', 'Manual'] as const),
    })
  }
}

const trainerNames = ['Hammad Raza', 'Alishba Noor', 'Furqan Shah', 'Nayab Khan', 'Zohaib Anwar', 'Mehak Sultan', 'Rohail Asim', 'Tehmina Javed']
const specializations = ['Strength & Conditioning', 'Weight Management', 'Yoga & Mobility', 'CrossFit', 'Bodybuilding', 'Functional Training', 'Pilates', 'Sports Nutrition']
const certifications = ['ACE Certified', 'NASM-CPT', 'ISSA Nutrition', 'CrossFit L1', 'Yoga RYT-200', 'Precision Nutrition']
const trainers: Trainer[] = trainerNames.map((name, i) => ({
  id: `tr-${i + 1}`,
  name,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@gymzard.com`,
  phone: `+92 3${int(0, 9)}${int(10000000, 99999999)}`,
  specialization: specializations[i],
  certifications: [certifications[i % certifications.length], certifications[(i + 2) % certifications.length]],
  rating: round(3.8 + i * 0.07, 1),
  status: i === 6 ? 'On Leave' : 'Active',
  branchId: branches[i % branches.length].id,
  assignedMembers: int(8, 24),
  sessions: int(40, 145),
  commissionRate: int(8, 22),
  salary: int(65000, 145000),
  joiningDate: isoDate(addMonths(now, -int(3, 40))),
  color: ['#1557d6', '#0e9f9f', '#7c5ce0', '#e68a19', '#d64d70', '#2f80ed', '#168a5b', '#b15ac7'][i],
  availability: pick(['6 AM – 2 PM', '2 PM – 10 PM', '7 AM – 4 PM', 'Flexible']),
  performance: int(72, 98),
}))

const staffRoles = ['Receptionist', 'Manager', 'Cleaner', 'Security', 'Accountant', 'Sales Executive', 'Maintenance', 'Floor Supervisor', 'Nutritionist', 'Marketing Lead', 'HR Executive', 'Store Keeper']
const staff: StaffMember[] = staffRoles.map((role, i) => {
  const name = `${pick(firstNames)} ${pick(lastNames)}`
  return {
    id: `st-${i + 1}`,
    name,
    role,
    department: pick(['Operations', 'Finance', 'Sales', 'Admin', 'Facilities']),
    phone: `+92 3${int(0, 9)}${int(10000000, 99999999)}`,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@gymzard.com`,
    shift: pick(['Morning 6–2', 'Evening 2–10', 'General 9–6']),
    salary: int(35000, 120000),
    status: i === 9 ? 'On Leave' : 'Active',
    joiningDate: isoDate(addMonths(now, -int(2, 36))),
    branchId: branches[i % branches.length].id,
    leaves: int(0, 9),
    performance: int(68, 98),
    documents: int(1, 5),
  }
})

const classTitles = ['Sunrise Yoga', 'Power Zumba', 'CrossFit WOD', 'Strength Lab', 'HIIT Express', 'Core & Mobility', 'Pilates Flow', 'Weekend Bootcamp', 'Personal Training', 'Evening Spin']
const classTypes: GymClass['type'][] = ['Yoga', 'Zumba', 'CrossFit', 'Strength', 'HIIT', 'Pilates', 'Personal Training']
const classColors = ['#1557d6', '#8b5cf6', '#e56b45', '#0e9f9f', '#d64d70', '#168a5b', '#e3a21a']
const classes: GymClass[] = []
for (let d = -2; d <= 7; d++) {
  for (let slot = 0; slot < 3; slot++) {
    const typeIdx = (d + slot + 10) % classTypes.length
    const date = addDays(now, d)
    const hour = [7, 12, 18][slot]
    classes.push({
      id: `cls-${d + 2}-${slot}`,
      title: classTitles[(d + slot + 20) % classTitles.length],
      type: classTypes[typeIdx],
      trainerId: trainers[(d + slot + 20) % trainers.length].id,
      date: isoDate(date),
      time: `${String(hour).padStart(2, '0')}:${slot === 1 ? '30' : '00'}`,
      duration: pick([45, 50, 60, 75]),
      capacity: pick([12, 16, 20, 24, 30]),
      room: pick(['Studio A', 'Studio B', 'Main Floor', 'Turf Zone', 'PT Room']),
      status: d < 0 ? 'Completed' : 'Scheduled',
      branchId: branches[(d + slot + 10) % branches.length].id,
      color: classColors[typeIdx],
    })
  }
}
const bookings: Booking[] = classes.filter((c) => c.status === 'Scheduled').flatMap((c, idx) => {
  const count = Math.min(c.capacity + (idx % 6 === 0 ? 3 : 0), int(Math.floor(c.capacity * 0.45), c.capacity + 2))
  return Array.from({ length: count }).map((_, j) => ({
    id: uid('bk'),
    classId: c.id,
    memberId: members[(idx * 5 + j) % members.length].id,
    status: j >= c.capacity ? 'Waitlisted' as const : 'Confirmed' as const,
    bookedAt: isoDateTime(addDays(now, -int(0, 5))),
  }))
})

const inventoryNames = ['Olympic Barbell', 'Adjustable Bench', 'Treadmill Pro X9', 'Spin Bike S7', 'Dumbbell Set 5–40kg', 'Kettlebell Rack', 'Cable Crossover', 'Leg Press Machine', 'Whey Protein 2kg', 'Creatine Monohydrate', 'BCAA Energy', 'Protein Shaker', 'Gym Towels', 'Resistance Bands', 'Yoga Mats', 'Locker Keys', 'Foam Rollers', 'Heart-rate Monitor']
const inventory: InventoryItem[] = inventoryNames.map((name, i) => {
  const qty = i % 5 === 0 ? int(1, 5) : int(8, 60)
  return {
    id: `inv-${i + 1}`,
    name,
    category: i < 8 ? 'Equipment' : i < 12 ? 'Supplement' : i < 16 ? 'Retail' : 'Accessory',
    sku: `SKU-${1000 + i}`,
    quantity: qty,
    reorderLevel: int(4, 12),
    unitCost: i < 8 ? int(18000, 480000) : int(450, 13500),
    supplier: pick(['FitCore Supplies', 'Prime Nutrition', 'Alpha Equipment', 'Sports Hub PK']),
    branchId: branches[i % branches.length].id,
    lastRestocked: isoDate(addDays(now, -int(3, 90))),
    maintenanceDate: i < 8 ? isoDate(addDays(now, int(5, 70))) : undefined,
    condition: i % 7 === 0 ? 'Needs Service' : i % 3 === 0 ? 'Good' : 'Excellent',
    depreciation: i < 8 ? int(8, 46) : 0,
  }
})

const productData = [
  ['Whey Protein 1kg', 'Supplements', 9500, 24, '🥤'], ['Creatine 300g', 'Supplements', 4800, 35, '⚡'],
  ['BCAA 30 Servings', 'Supplements', 6200, 18, '🧪'], ['Multivitamins', 'Supplements', 3200, 42, '💊'],
  ['Electrolyte Drink', 'Drinks', 350, 80, '🧃'], ['Protein Water', 'Drinks', 550, 46, '💧'],
  ['Gym T-Shirt', 'Merchandise', 2400, 28, '👕'], ['Branded Hoodie', 'Merchandise', 4800, 12, '🧥'],
  ['Shaker Bottle', 'Accessories', 1200, 52, '🥛'], ['Lifting Straps', 'Accessories', 1800, 21, '🪢'],
  ['Training Gloves', 'Accessories', 2200, 30, '🧤'], ['Yoga Mat', 'Accessories', 3600, 16, '🧘'],
]
const products: Product[] = productData.map((p, i) => ({
  id: `prd-${i + 1}`,
  name: String(p[0]),
  category: p[1] as Product['category'],
  price: Number(p[2]),
  stock: Number(p[3]),
  sku: `POS-${201 + i}`,
  barcode: `880${1000000 + i * 137}`,
  taxRate: i < 4 ? 5 : 10,
  emoji: String(p[4]),
  branchId: branches[i % branches.length].id,
}))

const sales: Sale[] = Array.from({ length: 28 }).map((_, i) => {
  const itemCount = int(1, 3)
  const chosen = Array.from({ length: itemCount }).map(() => pick(products))
  const items = chosen.map((p) => ({ productId: p.id, name: p.name, qty: int(1, 3), price: p.price }))
  const subtotal = items.reduce((s, x) => s + x.qty * x.price, 0)
  const discount = i % 6 === 0 ? round(subtotal * 0.08) : 0
  const tax = round((subtotal - discount) * 0.08)
  return {
    id: uid('sale'),
    invoiceNo: `POS-${3201 + i}`,
    items,
    subtotal,
    discount,
    tax,
    total: subtotal - discount + tax,
    method: pick(['Cash', 'UPI', 'Card', 'Online'] as const),
    date: isoDateTime(addDays(now, -int(0, 29))),
    memberId: i % 3 === 0 ? members[int(0, members.length - 1)].id : undefined,
    branchId: branches[i % branches.length].id,
    status: i === 24 ? 'Refunded' : 'Completed',
  }
})

const expenseTitles = ['Branch rent', 'Electricity bill', 'Trainer payroll', 'Equipment servicing', 'Social media ads', 'Water & gas', 'Cleaning supplies', 'New dumbbells', 'Front-desk salaries', 'Software subscriptions', 'Air-conditioning repair', 'Member merchandise', 'Marketing flyers', 'Security services', 'Internet package', 'Supplement restock', 'Insurance premium', 'Annual maintenance', 'Staff incentives', 'Renovation supplies']
const expenses: Expense[] = expenseTitles.map((title, i) => ({
  id: `exp-${i + 1}`,
  title,
  category: pick(['Rent', 'Salaries', 'Utilities', 'Maintenance', 'Marketing', 'Equipment', 'Other'] as const),
  amount: int(8000, 340000),
  date: isoDate(addDays(now, -int(0, 55))),
  branchId: branches[i % branches.length].id,
  vendor: pick(['Pioneer Properties', 'LESCO', 'FitCore Supplies', 'Meta Ads', 'Staff Payroll', 'City Services']),
  status: i % 5 === 0 ? 'Pending' : 'Paid',
}))

const notifications: NotificationItem[] = [
  ['Membership expiry reminder', 'Your membership expires in 5 days. Renew now to keep your access.', 'WhatsApp', 'Expiring members', -1, 'Sent'],
  ['Payment due reminder', 'A friendly reminder to clear your pending balance at reception.', 'SMS', 'Members with dues', -2, 'Sent'],
  ['New Zumba batch', 'A new evening Zumba batch starts Monday. Limited seats available!', 'Email', 'All active members', -3, 'Sent'],
  ['Birthday wishes', 'Happy birthday! Enjoy a free protein shake on your next visit.', 'WhatsApp', 'Birthday members', -4, 'Sent'],
  ['Class booking confirmation', 'Your seat in Sunrise Yoga has been confirmed for 7:00 AM.', 'Push', 'Booked members', -5, 'Sent'],
  ['Workout streak milestone', 'Amazing work! You completed a 10-day workout streak.', 'Push', 'Active members', -6, 'Sent'],
  ['Festival offer', 'Eid special: 20% off annual memberships until Sunday.', 'WhatsApp', 'All leads & members', -7, 'Scheduled'],
  ['Diet reminder', 'Log your meals today to stay on track with your calorie target.', 'Email', 'Diet plan members', -8, 'Sent'],
  ['Inactivity alert', 'We miss you at the gym! Your trainer is waiting.', 'SMS', 'Inactive members', -9, 'Sent'],
  ['Trainer feedback request', 'How was your session? Rate your trainer and help us improve.', 'Email', 'PT members', -10, 'Sent'],
  ['Maintenance notice', 'The steam room will be closed for servicing tomorrow.', 'Push', 'DHA branch members', -11, 'Sent'],
  ['Renewal thank-you', 'Thanks for renewing! Your new digital card is ready.', 'WhatsApp', 'Renewed members', -12, 'Failed'],
].map((n, i) => ({
  id: `ntf-${i + 1}`,
  title: String(n[0]),
  body: String(n[1]),
  channel: n[2] as NotificationItem['channel'],
  audience: String(n[3]),
  sentAt: isoDateTime(addDays(now, Number(n[4]))),
  status: n[5] as NotificationItem['status'],
  read: i > 3,
}))

const coupons: Coupon[] = [
  { id: 'cpn-1', code: 'WELCOME10', description: '10% off first membership', discountType: 'percent', value: 10, minAmount: 5000, validFrom: isoDate(addDays(now, -30)), validTo: isoDate(addDays(now, 45)), usageLimit: 100, used: 34, status: 'Active', appliesTo: 'New members' },
  { id: 'cpn-2', code: 'SUMMER2K', description: 'Flat Rs 2,000 off quarterly plans', discountType: 'fixed', value: 2000, minAmount: 20000, validFrom: isoDate(addDays(now, -15)), validTo: isoDate(addDays(now, 20)), usageLimit: 60, used: 21, status: 'Active', appliesTo: 'Quarterly plans' },
  { id: 'cpn-3', code: 'FAMILY15', description: '15% family plan discount', discountType: 'percent', value: 15, minAmount: 50000, validFrom: isoDate(addDays(now, -60)), validTo: isoDate(addDays(now, 12)), usageLimit: 30, used: 8, status: 'Active', appliesTo: 'Family plans' },
  { id: 'cpn-4', code: 'CORP2026', description: 'Corporate wellness launch offer', discountType: 'percent', value: 12, minAmount: 100000, validFrom: isoDate(addDays(now, -90)), validTo: isoDate(addDays(now, 3)), usageLimit: 25, used: 6, status: 'Active', appliesTo: 'Corporate plans' },
  { id: 'cpn-5', code: 'EID25', description: 'Expired festival campaign', discountType: 'percent', value: 25, minAmount: 8000, validFrom: isoDate(addDays(now, -120)), validTo: isoDate(addDays(now, -20)), usageLimit: 200, used: 187, status: 'Expired', appliesTo: 'All plans' },
]

const leadNames = ['Ahmad Raza', 'Sana Tariq', 'Mubeen Shah', 'Iqra Yousuf', 'Danish Ali', 'Hania Amir', 'Faisal Nawaz', 'Rida Khan', 'Arsalan Iqbal', 'Mehak Ali', 'Umer Farooq', 'Zoya Nasir', 'Salman Butt', 'Aina Qureshi', 'Waqas Javed', 'Marium Sheikh', 'Asim Riaz', 'Naila Hassan']
const leads: Lead[] = leadNames.map((name, i) => ({
  id: `lead-${i + 1}`,
  name,
  phone: `+92 3${int(0, 9)}${int(10000000, 99999999)}`,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
  source: pick(['Website', 'Walk-in', 'Referral', 'Instagram', 'Google Ads'] as const),
  interest: pick(['Weight loss', 'Muscle gain', 'Personal training', 'Yoga classes', 'Family plan']),
  status: pick(['New', 'Contacted', 'Trial Booked', 'Converted', 'Lost'] as const),
  assignedTo: staff[i % 6].name,
  followUpDate: isoDate(addDays(now, int(-4, 14))),
  score: int(35, 95),
  notes: i % 4 === 0 ? 'Requested a callback in the evening.' : 'Interested in a trial session.',
}))

const progress: ProgressEntry[] = []
for (let w = 11; w >= 0; w--) {
  const weight = 88 - (11 - w) * 0.85 + round((rand() - 0.5) * 1.1, 1)
  progress.push({
    id: uid('prg'),
    memberId: 'mem-1',
    date: isoDate(addDays(now, -w * 7)),
    weight,
    bodyFat: round(27 - (11 - w) * 0.38 + (rand() - 0.5) * 0.5, 1),
    muscleMass: round(58 + (11 - w) * 0.42, 1),
    bmi: round(weight / (1.75 * 1.75), 1),
    chest: round(102 - (11 - w) * 0.35, 1),
    waist: round(94 - (11 - w) * 0.62, 1),
    hips: round(104 - (11 - w) * 0.3, 1),
    arms: round(34 + (11 - w) * 0.16, 1),
    notes: w === 0 ? 'Great progress — increased protein target slightly.' : '',
  })
}
for (let i = 0; i < 16; i++) {
  const weight = members[i + 3].weight
  progress.push({
    id: uid('prg'),
    memberId: members[i + 3].id,
    date: isoDate(addDays(now, -int(0, 60))),
    weight,
    bodyFat: round(16 + rand() * 16, 1),
    muscleMass: round(38 + rand() * 28, 1),
    bmi: round(weight / 3.06, 1),
    chest: round(84 + rand() * 28, 1),
    waist: round(70 + rand() * 30, 1),
    hips: round(84 + rand() * 26, 1),
    arms: round(28 + rand() * 12, 1),
    notes: '',
  })
}

const exerciseLibrary: Exercise[] = [
  ['Barbell Back Squat', 'Legs', 'Barbell', 'Intermediate', 'Keep chest tall, descend until thighs are parallel, then drive through heels.', '12 min'],
  ['Incline Dumbbell Press', 'Chest', 'Dumbbells', 'Beginner', 'Set bench at 30 degrees and press with controlled tempo.', '10 min'],
  ['Romanian Deadlift', 'Hamstrings', 'Barbell', 'Intermediate', 'Hinge at hips with a neutral spine and feel the stretch.', '12 min'],
  ['Lat Pulldown', 'Back', 'Cable', 'Beginner', 'Pull elbows toward hips and squeeze lats at the bottom.', '10 min'],
  ['Walking Lunges', 'Legs', 'Dumbbells', 'Beginner', 'Take long steps and keep the front knee aligned.', '8 min'],
  ['Plank Hold', 'Core', 'Bodyweight', 'Beginner', 'Maintain a straight line from head to heels.', '5 min'],
  ['Shoulder Press', 'Shoulders', 'Dumbbells', 'Intermediate', 'Press overhead without arching the lower back.', '10 min'],
  [' seated Cable Row', 'Back', 'Cable', 'Beginner', 'Retract shoulder blades before pulling the handle.', '10 min'],
  ['Leg Press', 'Legs', 'Machine', 'Beginner', 'Lower to 90 degrees and avoid locking knees.', '10 min'],
  ['Bicep Curl', 'Arms', 'Dumbbells', 'Beginner', 'Keep elbows fixed and curl through a full range.', '8 min'],
  ['Tricep Pushdown', 'Arms', 'Cable', 'Beginner', 'Keep elbows tucked and extend fully.', '8 min'],
  ['Treadmill Intervals', 'Cardio', 'Treadmill', 'Intermediate', 'Alternate 1 minute sprint with 2 minutes recovery.', '20 min'],
  ['Kettlebell Swing', 'Full Body', 'Kettlebell', 'Advanced', 'Drive from hips and keep arms relaxed.', '10 min'],
  ['Hip Thrust', 'Glutes', 'Barbell', 'Intermediate', 'Drive through heels and pause at the top.', '12 min'],
  ['Chest Fly', 'Chest', 'Cable', 'Beginner', 'Maintain a slight elbow bend throughout.', '8 min'],
  ['Battle Ropes', 'Cardio', 'Ropes', 'Intermediate', 'Alternate arms in 30-second bursts.', '10 min'],
].map((e, i) => ({
  id: `exe-${i + 1}`,
  name: String(e[0]).trim(),
  muscle: String(e[1]),
  equipment: String(e[2]),
  level: e[3] as Exercise['level'],
  instructions: String(e[4]),
  duration: String(e[5]),
}))

const workoutPlans: WorkoutPlan[] = [
  ['Fat Loss Accelerator', 'Weight loss', 'Intermediate', 'Mon / Wed / Fri', 18, 24],
  ['Strength Foundation', 'Strength gain', 'Beginner', 'Tue / Thu / Sat', 9, 20],
  ['Muscle Gain Blueprint', 'Muscle gain', 'Advanced', '5-day split', 14, 30],
  ['30-Day Challenge', 'General fitness', 'Beginner', 'Daily', 22, 30],
  ['Athletic Performance', 'Performance', 'Advanced', 'Mon–Fri', 11, 28],
  ['Posture Reset', 'Rehabilitation', 'Beginner', 'Mon / Wed', 7, 16],
  ['Core & Conditioning', 'Core strength', 'Intermediate', 'Tue / Thu / Sun', 12, 20],
  ['Beginner Onboarding', 'General fitness', 'Beginner', 'Mon / Wed / Fri', 3, 12],
].map((p, i) => ({
  id: `wp-${i + 1}`,
  name: String(p[0]),
  memberId: members[i].id,
  goal: String(p[1]),
  level: p[2] as WorkoutPlan['level'],
  days: String(p[3]),
  trainerId: trainers[i % trainers.length].id,
  exercises: exerciseLibrary.slice(i, i + 5).map((e, j) => ({ name: e.name, muscle: e.muscle, sets: 3 + (j % 2), reps: j % 2 ? '12–15' : '8–10', weight: j % 2 ? 'Light' : 'Moderate', completed: j < 2 })),
  status: i === 7 ? 'Draft' : 'Active',
  createdAt: isoDate(addDays(now, -int(7, 60))),
  completedSessions: Number(p[4]),
  totalSessions: Number(p[5]),
  feedback: i % 3 === 0 ? 'Feeling stronger and more consistent this month.' : '',
}))

const dietPlans: DietPlan[] = [
  ['Cut & Shape', 'Weight Loss', 'Non-Vegetarian', 1850, 145, 160, 55],
  ['Lean Bulk', 'Muscle Gain', 'Non-Vegetarian', 2700, 190, 310, 75],
  ['Balanced Vegetarian', 'Maintenance', 'Vegetarian', 2100, 120, 260, 62],
  ['Plant Power', 'Weight Loss', 'Vegan', 1700, 95, 210, 48],
  ['Performance Fuel', 'Performance', 'Non-Vegetarian', 2950, 200, 360, 72],
  ['Metabolic Reset', 'Weight Loss', 'Vegetarian', 1600, 105, 165, 52],
  ['Family Wellness', 'Maintenance', 'Vegetarian', 2200, 110, 285, 65],
  ['Post-Workout Recovery', 'Muscle Gain', 'Non-Vegetarian', 2450, 175, 275, 68],
].map((p, i) => ({
  id: `dp-${i + 1}`,
  name: String(p[0]),
  memberId: members[i + 1].id,
  goal: p[1] as DietPlan['goal'],
  type: p[2] as DietPlan['type'],
  calories: Number(p[3]),
  protein: Number(p[4]),
  carbs: Number(p[5]),
  fat: Number(p[6]),
  waterTarget: 3 + (i % 3) * 0.5,
  meals: [
    { time: '07:30', name: 'Breakfast', items: i % 2 ? 'Egg whites, oats, berries, almonds' : 'Greek yogurt, granola, banana', calories: Math.round(Number(p[3]) * 0.24), protein: Math.round(Number(p[4]) * 0.25), carbs: Math.round(Number(p[5]) * 0.26), fat: Math.round(Number(p[6]) * 0.22) },
    { time: '10:30', name: 'Mid-morning', items: 'Protein shake, apple, green tea', calories: Math.round(Number(p[3]) * 0.12), protein: Math.round(Number(p[4]) * 0.17), carbs: Math.round(Number(p[5]) * 0.12), fat: Math.round(Number(p[6]) * 0.1) },
    { time: '13:30', name: 'Lunch', items: i % 2 ? 'Grilled chicken, brown rice, salad' : 'Lentil bowl, quinoa, mixed vegetables', calories: Math.round(Number(p[3]) * 0.34), protein: Math.round(Number(p[4]) * 0.35), carbs: Math.round(Number(p[5]) * 0.36), fat: Math.round(Number(p[6]) * 0.38) },
    { time: '17:00', name: 'Snack', items: 'Cottage cheese, nuts, black coffee', calories: Math.round(Number(p[3]) * 0.11), protein: Math.round(Number(p[4]) * 0.12), carbs: Math.round(Number(p[5]) * 0.08), fat: Math.round(Number(p[6]) * 0.14) },
    { time: '20:00', name: 'Dinner', items: i % 2 ? 'Fish, sweet potato, steamed greens' : 'Tofu stir-fry, whole-wheat roti', calories: Math.round(Number(p[3]) * 0.19), protein: Math.round(Number(p[4]) * 0.11), carbs: Math.round(Number(p[5]) * 0.18), fat: Math.round(Number(p[6]) * 0.16) },
  ],
  status: i === 7 ? 'Draft' : 'Active',
  createdAt: isoDate(addDays(now, -int(5, 45))),
}))

const foods: Food[] = [
  ['Chicken breast', '100 g', 165, 31, 0, 3.6, 'Non-Veg'], ['Brown rice', '1 cup cooked', 216, 5, 45, 1.8, 'Veg'],
  ['Egg whites', '100 g', 52, 11, 0.7, 0.2, 'Non-Veg'], ['Greek yogurt', '170 g', 100, 17, 6, 0.7, 'Veg'],
  ['Oats', '40 g', 152, 5, 27, 3, 'Vegan'], ['Banana', '1 medium', 105, 1.3, 27, 0.4, 'Vegan'],
  ['Whey protein', '1 scoop', 120, 24, 3, 1.5, 'Supplement'], ['Almonds', '28 g', 164, 6, 6, 14, 'Vegan'],
  ['Salmon', '100 g', 208, 20, 0, 13, 'Non-Veg'], ['Sweet potato', '150 g', 135, 2.4, 31, 0.2, 'Vegan'],
  ['Lentils', '1 cup cooked', 230, 18, 40, 0.8, 'Vegan'], ['Paneer', '100 g', 265, 18, 1.2, 21, 'Veg'],
  ['Tofu', '100 g', 144, 17, 3, 9, 'Vegan'], ['Broccoli', '100 g', 34, 2.8, 7, 0.4, 'Vegan'],
  ['Whole eggs', '2 eggs', 143, 13, 1, 10, 'Non-Veg'], ['Creatine', '5 g', 0, 0, 0, 0, 'Supplement'],
].map((f, i) => ({
  id: `food-${i + 1}`,
  name: String(f[0]), serving: String(f[1]), calories: Number(f[2]), protein: Number(f[3]),
  carbs: Number(f[4]), fat: Number(f[5]), type: f[6] as Food['type'],
}))

const activity: Activity[] = [
  { id: uid('act'), title: 'New member registered', detail: `${members[0].name} joined the Quarterly Saver plan`, time: isoDateTime(addDays(now, -0.02)), type: 'member' },
  { id: uid('act'), title: 'Payment received', detail: `${members[10].name} paid Rs 75,600 via Razorpay`, time: isoDateTime(addDays(now, -0.08)), type: 'payment' },
  { id: uid('act'), title: 'Class fully booked', detail: 'Sunrise Yoga has reached full capacity', time: isoDateTime(addDays(now, -0.14)), type: 'class' },
  { id: uid('act'), title: 'Low-stock alert', detail: 'Whey Protein 1kg is below reorder level', time: isoDateTime(addDays(now, -0.2)), type: 'alert' },
  { id: uid('act'), title: 'Attendance milestone', detail: '1,240 check-ins recorded this week', time: isoDateTime(addDays(now, -0.3)), type: 'attendance' },
  { id: uid('act'), title: 'Workout plan assigned', detail: `${trainers[0].name} assigned Strength Foundation`, time: isoDateTime(addDays(now, -0.5)), type: 'system' },
  { id: uid('act'), title: 'Membership renewed', detail: `${members[6].name} renewed for 12 months`, time: isoDateTime(addDays(now, -0.8)), type: 'member' },
  { id: uid('act'), title: 'Expense recorded', detail: 'Equipment servicing added for Gulberg Main', time: isoDateTime(addDays(now, -1.1)), type: 'payment' },
]

const monthNames = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
const monthlyRevenue = monthNames.map((month, i) => ({
  month,
  revenue: 560000 + i * 68000 + int(-35000, 45000) + (i > 8 ? 90000 : 0),
  expenses: 340000 + i * 24000 + int(-18000, 22000),
  target: 650000 + i * 60000,
}))
const memberGrowth = monthNames.map((month, i) => ({
  month,
  members: 310 + i * 42 + int(-10, 16),
  renewals: 38 + i * 5 + int(-6, 9),
}))

export function createSeedDatabase(): Database {
  return {
    branches, plans, members, payments, attendance, trainers, staff, classes, bookings,
    inventory, products, sales, expenses, notifications, coupons, leads, progress, workoutPlans,
    dietPlans, foods, exercises: exerciseLibrary, activity, monthlyRevenue, memberGrowth,
    settings: {
      gymName: 'GymZard Fitness',
      tagline: 'Train smarter. Grow faster.',
      email: 'hello@gymzard.fit',
      phone: '+92 42 3577 1100',
      address: '14-A Main Boulevard, Gulberg, Lahore',
      currency: 'Rs',
      taxRate: 5,
      receiptPrefix: 'INV',
      autoRenew: true,
      qrEntry: true,
      whatsappEnabled: true,
      smsEnabled: true,
      emailEnabled: true,
      primaryColor: '#1557d6',
    },
  }
}
