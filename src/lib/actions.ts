import type {
  Attendance, Booking, Branch, Coupon, DietPlan, Expense, GymClass, InventoryItem, Lead, Member, NotificationItem,
  Payment, Plan, Product, ProgressEntry, Sale, StaffMember, Trainer, WorkoutPlan,
} from '../types'
import { useApp, type FormField, type FormOption, type FormValues } from './app-context'
import { addDays, isoDate, isoDateTime, uid } from './utils'

const str = (v: FormValues, key: string, fallback = '') => String(v[key] ?? fallback)
const num = (v: FormValues, key: string, fallback = 0) => Number(v[key] ?? fallback)
const bool = (v: FormValues, key: string, fallback = false) => Boolean(v[key] ?? fallback)
const today = () => isoDate(new Date())

function options<T>(items: T[], value: (x: T) => string, label: (x: T) => string): FormOption[] {
  return items.map((item) => ({ value: value(item), label: label(item) }))
}

export function useActions() {
  const { db, updateDb, openForm, toast, logActivity, openReceipt, branchId } = useApp()

  const branchOptions = () => options(db.branches.filter((b) => b.status === 'Open'), (b) => b.id, (b) => b.name)
  const planOptions = () => options(db.plans.filter((p) => p.active && (branchId === 'all' || p.branchId === 'all' || p.branchId === branchId)), (p) => p.id, (p) => `${p.name} — ${db.settings.currency} ${p.price.toLocaleString()}`)
  const memberOptions = () => options(db.members, (m) => m.id, (m) => `${m.name} (${m.memberId})`)
  const trainerOptions = () => options(db.trainers.filter((t) => t.status !== 'Inactive'), (t) => t.id, (t) => t.name)

  function openMemberForm(member?: Member) {
    const defaultPlan = db.plans.find((p) => p.id === 'plan-monthly') || db.plans[0]
    openForm({
      title: member ? 'Edit member profile' : 'Register new member',
      subtitle: member ? `Update ${member.name}'s profile and membership details.` : 'Create a digital member profile with emergency, health, and plan information.',
      size: 'xl',
      submitLabel: member ? 'Save changes' : 'Register member',
      initial: member ? {
        ...member,
        photo: member.photo || '',
        document: '',
      } as unknown as FormValues : {
        gender: 'Male', branchId: branchId === 'all' ? db.branches[0].id : branchId,
        planId: defaultPlan.id, status: 'Active', joinedAt: today(), startsAt: today(),
        expiresAt: isoDate(addDays(new Date(), defaultPlan.durationDays)), height: 170, weight: 70,
        targetWeight: 68, autoRenew: db.settings.autoRenew, medical: 'No known conditions',
      },
      fields: [
        { name: 'name', label: 'Full name', required: true, placeholder: 'e.g. Ayesha Khan' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'name@example.com' },
        { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '+92 300 1234567' },
        { name: 'dob', label: 'Date of birth', type: 'date' },
        { name: 'gender', label: 'Gender', type: 'select', options: [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }] },
        { name: 'photo', label: 'Profile photo', type: 'image', accept: 'image/*', hint: 'Uploaded photos are resized and stored locally for this demo.' },
        { name: 'branchId', label: 'Home branch', type: 'select', options: branchOptions(), required: true },
        { name: 'planId', label: 'Membership plan', type: 'select', options: planOptions(), required: true },
        { name: 'trainerId', label: 'Assigned trainer', type: 'select', options: [{ value: '', label: 'Unassigned' }, ...trainerOptions()] },
        { name: 'status', label: 'Member status', type: 'select', options: ['Active', 'Trial', 'Frozen', 'Expired', 'Inactive'].map((x) => ({ value: x, label: x })) },
        { name: 'startsAt', label: 'Membership start', type: 'date', required: true },
        { name: 'expiresAt', label: 'Membership expiry', type: 'date', required: true },
        { name: 'joinedAt', label: 'Registration date', type: 'date' },
        { name: 'emergencyName', label: 'Emergency contact name', placeholder: 'Contact person' },
        { name: 'emergencyPhone', label: 'Emergency contact phone', type: 'tel' },
        { name: 'goals', label: 'Fitness goals', placeholder: 'e.g. Weight loss, muscle gain' },
        { name: 'medical', label: 'Medical history', type: 'textarea', span: 2, rows: 2, placeholder: 'Any injuries, conditions, or allergies' },
        { name: 'height', label: 'Height (cm)', type: 'number', min: 100, max: 230 },
        { name: 'weight', label: 'Current weight (kg)', type: 'number', min: 25, max: 250 },
        { name: 'targetWeight', label: 'Target weight (kg)', type: 'number', min: 25, max: 250 },
        { name: 'autoRenew', label: 'Enable auto-renewal', type: 'checkbox' },
        { name: 'notes', label: 'Notes & remarks', type: 'textarea', span: 2, rows: 2, placeholder: 'Internal staff notes' },
        { name: 'document', label: 'Upload document', type: 'file', accept: '.pdf,.jpg,.jpeg,.png', hint: 'Demo stores the file name in the member profile.' },
      ],
      onSubmit: (v) => {
        const plan = db.plans.find((p) => p.id === str(v, 'planId')) || db.plans[0]
        const payload: Partial<Member> = {
          name: str(v, 'name'), email: str(v, 'email'), phone: str(v, 'phone'), gender: str(v, 'gender', 'Male') as Member['gender'],
          dob: str(v, 'dob'), photo: str(v, 'photo') || undefined, branchId: str(v, 'branchId'), planId: plan.id,
          trainerId: str(v, 'trainerId') || undefined, status: str(v, 'status', 'Active') as Member['status'], joinedAt: str(v, 'joinedAt') || today(), startsAt: str(v, 'startsAt'), expiresAt: str(v, 'expiresAt'),
          emergencyName: str(v, 'emergencyName'), emergencyPhone: str(v, 'emergencyPhone'), medical: str(v, 'medical'), goals: str(v, 'goals'),
          notes: str(v, 'notes'), height: num(v, 'height', 170), weight: num(v, 'weight', 70), targetWeight: num(v, 'targetWeight', 68), autoRenew: bool(v, 'autoRenew'),
        }
        if (str(v, 'document')) payload.documents = [{ id: uid('doc'), name: str(v, 'document'), type: 'Uploaded', date: today(), size: 'Local file' }]
        if (member) {
          updateDb((prev) => ({ ...prev, members: prev.members.map((m) => m.id === member.id ? { ...m, ...payload } : m) }))
          logActivity('Member profile updated', `${payload.name}'s profile was updated`, 'member')
          toast('Member profile updated')
        } else {
          const maxId = db.members.reduce((max, m) => Math.max(max, Number(m.memberId.replace(/\D/g, '')) || 0), 2400)
          const newMember: Member = {
            id: uid('mem'), memberId: `GZ-${maxId + 1}`, tags: ['New member'], dueAmount: 0, lastVisit: undefined,
            attendanceCount: 0, healthScore: 70, engagementScore: 65, referralCode: `REF-${uid('').slice(-5).toUpperCase()}`,
            documents: [], membershipHistory: [{ plan: plan.name, from: str(v, 'startsAt'), to: str(v, 'expiresAt'), amount: plan.price }],
            ...payload,
          } as Member
          updateDb((prev) => ({ ...prev, members: [newMember, ...prev.members] }))
          logActivity('New member registered', `${newMember.name} joined on the ${plan.name} plan`, 'member')
          toast(`${newMember.name} registered successfully`)
        }
      },
    })
  }

  function openPaymentForm(memberId?: string, invoiceId?: string, planId?: string) {
    const selected = db.members.find((m) => m.id === memberId) || db.members[0]
    const existing = db.payments.find((p) => p.id === invoiceId)
    const plan = db.plans.find((p) => p.id === (planId || existing?.planId || selected?.planId)) || db.plans[0]
    openForm({
      title: existing ? 'Record payment against invoice' : 'Collect membership payment',
      subtitle: existing ? `${existing.invoiceNo} · Balance ${db.settings.currency} ${(existing.total - existing.paid).toLocaleString()}` : 'Create an invoice with GST, discounts, partial payment, and renewal.',
      size: 'lg',
      submitLabel: 'Save payment',
      initial: {
        memberId: existing?.memberId || selected?.id || '', planId: existing?.planId || plan.id,
        amount: existing ? existing.total - existing.paid : plan.price, discount: 0, paid: existing ? existing.total - existing.paid : plan.price,
        method: 'Cash', gateway: 'Manual', date: today(), dueDate: isoDate(addDays(new Date(), 7)),
        renewMembership: !existing, note: '',
      },
      fields: [
        { name: 'memberId', label: 'Member', type: 'select', options: memberOptions(), required: true, disabled: !!existing },
        { name: 'planId', label: 'Plan / package', type: 'select', options: planOptions(), required: true },
        { name: 'amount', label: 'Base amount', type: 'number', min: 0, required: true },
        { name: 'discount', label: 'Discount', type: 'number', min: 0, defaultValue: 0 },
        { name: 'paid', label: 'Amount received', type: 'number', min: 0, required: true },
        { name: 'method', label: 'Payment method', type: 'select', options: ['Cash', 'UPI', 'Card', 'Online', 'Bank Transfer'].map((x) => ({ value: x, label: x })) },
        ...(existing ? [] as FormField[] : [{ name: 'gateway', label: 'Gateway / reference', type: 'select' as const, options: ['Manual', 'Razorpay', 'Stripe', 'JazzCash'].map((x: string) => ({ value: x, label: x })) }]),
        ...(existing ? [] as FormField[] : [{ name: 'date', label: 'Payment date', type: 'date' as const, required: true }]),
        ...(existing ? [] as FormField[] : [{ name: 'dueDate', label: 'Due date', type: 'date' as const }]),
        ...(existing ? [] as FormField[] : [{ name: 'renewMembership', label: 'Renew / activate membership', type: 'checkbox' as const }]),
        { name: 'note', label: 'Note', type: 'textarea', span: 2, rows: 2, placeholder: 'Optional invoice note' },
      ],
      onSubmit: (v) => {
        const member = db.members.find((m) => m.id === str(v, 'memberId'))
        const chosenPlan = db.plans.find((p) => p.id === str(v, 'planId')) || plan
        if (!member) return toast('Please select a member', 'error')
        if (existing) {
          const added = Math.min(num(v, 'paid'), existing.total - existing.paid)
          const paid = Math.min(existing.total, existing.paid + added)
          updateDb((prev) => ({
            ...prev,
            payments: prev.payments.map((p) => p.id === existing.id ? { ...p, paid, status: paid >= p.total ? 'Paid' : 'Partial', method: str(v, 'method', p.method) as Payment['method'], note: str(v, 'note') || p.note } : p),
            members: prev.members.map((m) => m.id === existing.memberId ? { ...m, dueAmount: Math.max(0, m.dueAmount - added) } : m),
          }))
          logActivity('Payment recorded', `${db.settings.currency} ${added.toLocaleString()} received from ${existing.memberName}`, 'payment')
          toast('Payment recorded successfully')
          return
        }
        const subtotal = num(v, 'amount')
        const discount = num(v, 'discount')
        const tax = Math.round((subtotal - discount) * (db.settings.taxRate / 100))
        const total = subtotal - discount + tax
        const paid = Math.min(num(v, 'paid'), total)
        const date = str(v, 'date') || today()
        const payment: Payment = {
          id: uid('pay'), invoiceNo: `${db.settings.receiptPrefix}-${Date.now().toString().slice(-7)}`,
          memberId: member.id, memberName: member.name, planId: chosenPlan.id, branchId: member.branchId,
          date: isoDateTime(new Date(date)), dueDate: str(v, 'dueDate') || isoDate(addDays(new Date(date), 7)),
          subtotal, discount, tax, total, paid, method: str(v, 'method', 'Cash') as Payment['method'],
          status: paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Pending', gateway: str(v, 'gateway', 'Manual'), note: str(v, 'note'),
        }
        updateDb((prev) => ({
          ...prev,
          payments: [payment, ...prev.payments],
          members: prev.members.map((m) => {
            if (m.id !== member.id) return m
            const renew = bool(v, 'renewMembership')
            return {
              ...m,
              planId: renew ? chosenPlan.id : m.planId,
              startsAt: renew ? date : m.startsAt,
              expiresAt: renew ? isoDate(addDays(new Date(date), chosenPlan.durationDays)) : m.expiresAt,
              status: renew ? 'Active' : m.status,
              dueAmount: Math.max(0, (renew ? total - paid : m.dueAmount + total - paid)),
              membershipHistory: renew ? [{ plan: chosenPlan.name, from: date, to: isoDate(addDays(new Date(date), chosenPlan.durationDays)), amount: total }, ...m.membershipHistory] : m.membershipHistory,
            }
          }),
        }))
        logActivity('Invoice created', `${payment.invoiceNo} created for ${member.name}`, 'payment')
        toast(`${payment.invoiceNo} created successfully`)
      },
    })
  }

  function openPlanForm(plan?: Plan) {
    openForm({
      title: plan ? 'Edit membership plan' : 'Create membership plan',
      subtitle: 'Configure duration, pricing, sessions, perks, and branch availability.',
      size: 'lg', submitLabel: plan ? 'Save plan' : 'Create plan',
      initial: plan ? { ...plan, features: plan.features.join(', ') } as FormValues : { category: 'Standard', durationDays: 30, price: 8500, sessions: 0, branchId: 'all', active: true, features: 'Full gym access, Locker facility' },
      fields: [
        { name: 'name', label: 'Plan name', required: true, placeholder: 'e.g. Summer Slim Down' },
        { name: 'category', label: 'Category', type: 'select', options: ['Standard', 'Personal Training', 'Family', 'Corporate', 'Trial'].map((x) => ({ value: x, label: x })) },
        { name: 'durationDays', label: 'Duration (days)', type: 'number', min: 1, required: true },
        { name: 'price', label: 'Price', type: 'number', min: 0, required: true },
        { name: 'sessions', label: 'Included PT sessions', type: 'number', min: 0 },
        { name: 'branchId', label: 'Available at', type: 'select', options: [{ value: 'all', label: 'All branches' }, ...branchOptions()] },
        { name: 'description', label: 'Description', type: 'textarea', span: 2, rows: 2 },
        { name: 'features', label: 'Features (comma separated)', span: 2 },
        { name: 'active', label: 'Plan is active', type: 'checkbox' },
        { name: 'popular', label: 'Mark as most popular', type: 'checkbox' },
      ],
      onSubmit: (v) => {
        const payload = {
          name: str(v, 'name'), category: str(v, 'category') as Plan['category'], durationDays: num(v, 'durationDays', 30),
          price: num(v, 'price'), sessions: num(v, 'sessions'), branchId: str(v, 'branchId', 'all'),
          description: str(v, 'description'), features: str(v, 'features').split(',').map((x) => x.trim()).filter(Boolean),
          active: bool(v, 'active', true), popular: bool(v, 'popular'),
        }
        if (plan) {
          updateDb((prev) => ({ ...prev, plans: prev.plans.map((p) => p.id === plan.id ? { ...p, ...payload } : p) }))
          toast('Membership plan updated')
        } else {
          updateDb((prev) => ({ ...prev, plans: [...prev.plans, { id: uid('plan'), ...payload }] }))
          logActivity('Membership plan created', `${payload.name} was added to the catalog`, 'system')
          toast('Membership plan created')
        }
      },
    })
  }

  function openTrainerForm(trainer?: Trainer) {
    openForm({
      title: trainer ? 'Edit trainer profile' : 'Add trainer',
      subtitle: 'Manage specialization, certifications, availability, salary, and commission.',
      size: 'lg',
      initial: trainer ? { ...trainer, certifications: trainer.certifications.join(', ') } as FormValues : { branchId: branchId === 'all' ? db.branches[0].id : branchId, status: 'Active', commissionRate: 12, rating: 4.5, availability: '6 AM – 2 PM' },
      fields: [
        { name: 'name', label: 'Full name', required: true },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phone', label: 'Phone', type: 'tel' },
        { name: 'specialization', label: 'Specialization', required: true },
        { name: 'certifications', label: 'Certifications (comma separated)', span: 2 },
        { name: 'branchId', label: 'Branch', type: 'select', options: branchOptions() },
        { name: 'availability', label: 'Availability', placeholder: 'e.g. 6 AM – 2 PM' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'On Leave', 'Inactive'].map((x) => ({ value: x, label: x })) },
        { name: 'salary', label: 'Monthly salary', type: 'number', min: 0 },
        { name: 'commissionRate', label: 'Commission rate (%)', type: 'number', min: 0, max: 100 },
        { name: 'rating', label: 'Rating', type: 'number', min: 0, max: 5, step: 0.1 },
      ],
      onSubmit: (v) => {
        const payload = {
          name: str(v, 'name'), email: str(v, 'email'), phone: str(v, 'phone'), specialization: str(v, 'specialization'),
          certifications: str(v, 'certifications').split(',').map((x) => x.trim()).filter(Boolean), branchId: str(v, 'branchId'),
          availability: str(v, 'availability'), status: str(v, 'status', 'Active') as Trainer['status'], salary: num(v, 'salary'),
          commissionRate: num(v, 'commissionRate'), rating: num(v, 'rating', 4.5),
        }
        if (trainer) {
          updateDb((prev) => ({ ...prev, trainers: prev.trainers.map((t) => t.id === trainer.id ? { ...t, ...payload } : t) }))
          toast('Trainer profile updated')
        } else {
          updateDb((prev) => ({ ...prev, trainers: [...prev.trainers, {
            id: uid('tr'), assignedMembers: 0, sessions: 0, joiningDate: today(), color: '#1557d6', performance: 75, ...payload,
          }] }))
          logActivity('Trainer added', `${payload.name} joined the training team`, 'system')
          toast('Trainer added successfully')
        }
      },
    })
  }

  function openStaffForm(staff?: StaffMember) {
    openForm({
      title: staff ? 'Edit staff member' : 'Add staff member',
      subtitle: 'Employee profile, role, shift, branch, payroll, and status.',
      size: 'lg',
      initial: (staff || { branchId: branchId === 'all' ? db.branches[0].id : branchId, status: 'Active', shift: 'Morning 6–2', department: 'Operations' }) as FormValues,
      fields: [
        { name: 'name', label: 'Full name', required: true },
        { name: 'role', label: 'Job role', required: true },
        { name: 'department', label: 'Department', type: 'select', options: ['Operations', 'Finance', 'Sales', 'Admin', 'Facilities', 'Training'].map((x) => ({ value: x, label: x })) },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phone', label: 'Phone', type: 'tel' },
        { name: 'branchId', label: 'Branch', type: 'select', options: branchOptions() },
        { name: 'shift', label: 'Shift', placeholder: 'e.g. Evening 2–10' },
        { name: 'salary', label: 'Monthly salary', type: 'number', min: 0 },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'On Leave', 'Inactive'].map((x) => ({ value: x, label: x })) },
      ],
      onSubmit: (v) => {
        const payload = {
          name: str(v, 'name'), role: str(v, 'role'), department: str(v, 'department'), email: str(v, 'email'), phone: str(v, 'phone'),
          branchId: str(v, 'branchId'), shift: str(v, 'shift'), salary: num(v, 'salary'), status: str(v, 'status', 'Active') as StaffMember['status'],
        }
        if (staff) {
          updateDb((prev) => ({ ...prev, staff: prev.staff.map((s) => s.id === staff.id ? { ...s, ...payload } : s) }))
          toast('Staff member updated')
        } else {
          updateDb((prev) => ({ ...prev, staff: [...prev.staff, {
            id: uid('st'), joiningDate: today(), leaves: 0, performance: 75, documents: 0, ...payload,
          }] }))
          toast('Staff member added')
        }
      },
    })
  }

  function openClassForm(date?: string) {
    openForm({
      title: 'Schedule new class',
      subtitle: 'Create a group class, assign a trainer, and set capacity.',
      size: 'lg',
      initial: { date: date || today(), time: '07:00', duration: 60, capacity: 20, type: 'Yoga', branchId: branchId === 'all' ? db.branches[0].id : branchId, status: 'Scheduled', room: 'Studio A' },
      fields: [
        { name: 'title', label: 'Class title', required: true, placeholder: 'e.g. Sunrise Yoga' },
        { name: 'type', label: 'Class type', type: 'select', options: ['Yoga', 'Zumba', 'CrossFit', 'Strength', 'HIIT', 'Pilates', 'Personal Training'].map((x) => ({ value: x, label: x })) },
        { name: 'trainerId', label: 'Trainer', type: 'select', options: trainerOptions(), required: true },
        { name: 'branchId', label: 'Branch', type: 'select', options: branchOptions() },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'time', label: 'Start time', type: 'time', required: true },
        { name: 'duration', label: 'Duration (min)', type: 'number', min: 15 },
        { name: 'capacity', label: 'Capacity', type: 'number', min: 1 },
        { name: 'room', label: 'Room / area', placeholder: 'Studio A' },
        { name: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'Completed', 'Cancelled'].map((x) => ({ value: x, label: x })) },
      ],
      onSubmit: (v) => {
        const type = str(v, 'type', 'Yoga') as GymClass['type']
        const colors: Record<GymClass['type'], string> = { Yoga: '#8b5cf6', Zumba: '#e56b45', CrossFit: '#d64d70', Strength: '#1557d6', HIIT: '#e6a21a', Pilates: '#168a5b', 'Personal Training': '#12a3c7' }
        const item: GymClass = {
          id: uid('cls'), title: str(v, 'title'), type, trainerId: str(v, 'trainerId'), branchId: str(v, 'branchId'),
          date: str(v, 'date'), time: str(v, 'time'), duration: num(v, 'duration', 60), capacity: num(v, 'capacity', 20),
          room: str(v, 'room'), status: str(v, 'status', 'Scheduled') as GymClass['status'], color: colors[type],
        }
        updateDb((prev) => ({ ...prev, classes: [...prev.classes, item] }))
        logActivity('Class scheduled', `${item.title} scheduled on ${item.date}`, 'class')
        toast('Class scheduled successfully')
      },
    })
  }

  function openBookingForm(classId?: string) {
    const availableClasses = db.classes.filter((c) => c.status === 'Scheduled' && c.date >= today())
    openForm({
      title: 'Book a class',
      subtitle: 'Members over capacity are automatically added to the waiting list.',
      initial: { classId: classId || availableClasses[0]?.id || '', memberId: db.members[0]?.id || '' },
      fields: [
        { name: 'classId', label: 'Class', type: 'select', options: options(availableClasses, (c) => c.id, (c) => `${c.title} · ${c.date} ${c.time}`), required: true },
        { name: 'memberId', label: 'Member', type: 'select', options: memberOptions(), required: true },
      ],
      onSubmit: (v) => {
        const cls = db.classes.find((c) => c.id === str(v, 'classId'))
        const member = db.members.find((m) => m.id === str(v, 'memberId'))
        if (!cls || !member) return
        const confirmed = db.bookings.filter((b) => b.classId === cls.id && b.status === 'Confirmed').length
        const booking: Booking = { id: uid('bk'), classId: cls.id, memberId: member.id, status: confirmed >= cls.capacity ? 'Waitlisted' : 'Confirmed', bookedAt: new Date().toISOString() }
        updateDb((prev) => ({ ...prev, bookings: [...prev.bookings, booking] }))
        logActivity('Class booking', `${member.name} booked ${cls.title}`, 'class')
        toast(booking.status === 'Confirmed' ? 'Booking confirmed' : 'Member added to waiting list', booking.status === 'Confirmed' ? 'success' : 'warning')
      },
    })
  }

  function openExpenseForm() {
    openForm({
      title: 'Record expense',
      subtitle: 'Track rent, salaries, utilities, maintenance, marketing, and more.',
      initial: { date: today(), category: 'Utilities', branchId: branchId === 'all' ? db.branches[0].id : branchId, status: 'Paid' },
      fields: [
        { name: 'title', label: 'Expense title', required: true },
        { name: 'category', label: 'Category', type: 'select', options: ['Rent', 'Salaries', 'Utilities', 'Maintenance', 'Marketing', 'Equipment', 'Other'].map((x) => ({ value: x, label: x })) },
        { name: 'amount', label: 'Amount', type: 'number', min: 0, required: true },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'vendor', label: 'Vendor / payee' },
        { name: 'branchId', label: 'Branch', type: 'select', options: branchOptions() },
        { name: 'status', label: 'Status', type: 'select', options: ['Paid', 'Pending'].map((x) => ({ value: x, label: x })) },
      ],
      onSubmit: (v) => {
        updateDb((prev) => ({ ...prev, expenses: [{
          id: uid('exp'), title: str(v, 'title'), category: str(v, 'category') as Expense['category'], amount: num(v, 'amount'),
          date: str(v, 'date'), vendor: str(v, 'vendor'), branchId: str(v, 'branchId'), status: str(v, 'status', 'Paid') as Expense['status'],
        }, ...prev.expenses] }))
        logActivity('Expense recorded', `${str(v, 'title')} added to expense reports`, 'payment')
        toast('Expense recorded')
      },
    })
  }

  function openInventoryForm(item?: InventoryItem) {
    openForm({
      title: item ? 'Edit inventory item' : 'Add inventory item',
      subtitle: 'Track stock, equipment condition, suppliers, and maintenance.',
      size: 'lg',
      initial: (item || { category: 'Equipment', branchId: branchId === 'all' ? db.branches[0].id : branchId, condition: 'Excellent', quantity: 1, reorderLevel: 5, unitCost: 1000, lastRestocked: today() }) as FormValues,
      fields: [
        { name: 'name', label: 'Item name', required: true },
        { name: 'category', label: 'Category', type: 'select', options: ['Equipment', 'Supplement', 'Retail', 'Accessory'].map((x) => ({ value: x, label: x })) },
        { name: 'sku', label: 'SKU', required: true },
        { name: 'quantity', label: 'Quantity', type: 'number', min: 0 },
        { name: 'reorderLevel', label: 'Reorder level', type: 'number', min: 0 },
        { name: 'unitCost', label: 'Unit cost', type: 'number', min: 0 },
        { name: 'supplier', label: 'Supplier' },
        { name: 'branchId', label: 'Branch', type: 'select', options: branchOptions() },
        { name: 'lastRestocked', label: 'Last restocked', type: 'date' },
        { name: 'maintenanceDate', label: 'Next maintenance', type: 'date' },
        { name: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Needs Service'].map((x) => ({ value: x, label: x })) },
      ],
      onSubmit: (v) => {
        const payload = {
          name: str(v, 'name'), category: str(v, 'category') as InventoryItem['category'], sku: str(v, 'sku'), quantity: num(v, 'quantity'),
          reorderLevel: num(v, 'reorderLevel'), unitCost: num(v, 'unitCost'), supplier: str(v, 'supplier'), branchId: str(v, 'branchId'),
          lastRestocked: str(v, 'lastRestocked'), maintenanceDate: str(v, 'maintenanceDate') || undefined,
          condition: str(v, 'condition', 'Excellent') as InventoryItem['condition'], depreciation: item?.depreciation || 0,
        }
        if (item) updateDb((prev) => ({ ...prev, inventory: prev.inventory.map((x) => x.id === item.id ? { ...x, ...payload } : x) }))
        else updateDb((prev) => ({ ...prev, inventory: [{ id: uid('inv'), ...payload }, ...prev.inventory] }))
        toast(item ? 'Inventory item updated' : 'Inventory item added')
      },
    })
  }

  function openProductForm(product?: Product) {
    openForm({
      title: product ? 'Edit POS product' : 'Add POS product',
      subtitle: 'Products appear in the point-of-sale catalog and stock reports.',
      initial: (product || { category: 'Supplements', price: 1000, stock: 20, taxRate: 5, branchId: branchId === 'all' ? db.branches[0].id : branchId, emoji: '🛍️' }) as FormValues,
      fields: [
        { name: 'name', label: 'Product name', required: true },
        { name: 'category', label: 'Category', type: 'select', options: ['Supplements', 'Drinks', 'Merchandise', 'Accessories'].map((x) => ({ value: x, label: x })) },
        { name: 'sku', label: 'SKU', required: true },
        { name: 'barcode', label: 'Barcode' },
        { name: 'price', label: 'Selling price', type: 'number', min: 0, required: true },
        { name: 'stock', label: 'Stock on hand', type: 'number', min: 0 },
        { name: 'taxRate', label: 'Tax rate (%)', type: 'number', min: 0 },
        { name: 'branchId', label: 'Branch', type: 'select', options: branchOptions() },
        { name: 'emoji', label: 'Icon emoji', placeholder: '🥤' },
      ],
      onSubmit: (v) => {
        const payload = {
          name: str(v, 'name'), category: str(v, 'category') as Product['category'], sku: str(v, 'sku'), barcode: str(v, 'barcode'),
          price: num(v, 'price'), stock: num(v, 'stock'), taxRate: num(v, 'taxRate'), branchId: str(v, 'branchId'), emoji: str(v, 'emoji', '🛍️'),
        }
        if (product) updateDb((prev) => ({ ...prev, products: prev.products.map((x) => x.id === product.id ? { ...x, ...payload } : x) }))
        else updateDb((prev) => ({ ...prev, products: [{ id: uid('prd'), ...payload }, ...prev.products] }))
        toast(product ? 'Product updated' : 'Product added to catalog')
      },
    })
  }

  function openLeadForm(lead?: Lead) {
    openForm({
      title: lead ? 'Edit lead' : 'Add new lead',
      subtitle: 'Capture enquiries, assign follow-ups, and track conversion.',
      size: 'lg',
      initial: (lead || { source: 'Walk-in', status: 'New', score: 60, interest: 'General membership', followUpDate: isoDate(addDays(new Date(), 2)), assignedTo: db.staff[0]?.name || '' }) as FormValues,
      fields: [
        { name: 'name', label: 'Full name', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: true },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'source', label: 'Lead source', type: 'select', options: ['Website', 'Walk-in', 'Referral', 'Instagram', 'Google Ads'].map((x) => ({ value: x, label: x })) },
        { name: 'interest', label: 'Interested in', required: true },
        { name: 'status', label: 'Pipeline status', type: 'select', options: ['New', 'Contacted', 'Trial Booked', 'Converted', 'Lost'].map((x) => ({ value: x, label: x })) },
        { name: 'assignedTo', label: 'Assigned to', type: 'select', options: options(db.staff, (s) => s.name, (s) => s.name) },
        { name: 'followUpDate', label: 'Next follow-up', type: 'date' },
        { name: 'score', label: 'Lead score', type: 'number', min: 0, max: 100 },
        { name: 'notes', label: 'Notes', type: 'textarea', span: 2, rows: 2 },
      ],
      onSubmit: (v) => {
        const payload = {
          name: str(v, 'name'), phone: str(v, 'phone'), email: str(v, 'email'), source: str(v, 'source') as Lead['source'],
          interest: str(v, 'interest'), status: str(v, 'status') as Lead['status'], assignedTo: str(v, 'assignedTo'),
          followUpDate: str(v, 'followUpDate'), score: num(v, 'score'), notes: str(v, 'notes'),
        }
        if (lead) updateDb((prev) => ({ ...prev, leads: prev.leads.map((x) => x.id === lead.id ? { ...x, ...payload } : x) }))
        else updateDb((prev) => ({ ...prev, leads: [{ id: uid('lead'), ...payload }, ...prev.leads] }))
        toast(lead ? 'Lead updated' : 'Lead added to pipeline')
      },
    })
  }

  function openNotificationForm() {
    openForm({
      title: 'Create notification campaign',
      subtitle: 'Send or schedule a message across WhatsApp, SMS, email, or push.',
      size: 'lg',
      initial: { channel: 'WhatsApp', audience: 'All active members', scheduledFor: today(), status: 'Sent' },
      fields: [
        { name: 'title', label: 'Campaign title', required: true },
        { name: 'channel', label: 'Channel', type: 'select', options: ['WhatsApp', 'SMS', 'Email', 'Push'].map((x) => ({ value: x, label: x })) },
        { name: 'audience', label: 'Audience', type: 'select', options: ['All active members', 'Expiring members', 'Members with dues', 'Inactive members', 'PT members', 'All leads'].map((x) => ({ value: x, label: x })) },
        { name: 'scheduledFor', label: 'Send date', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: ['Sent', 'Scheduled', 'Failed'].map((x) => ({ value: x, label: x })) },
        { name: 'body', label: 'Message', type: 'textarea', span: 2, rows: 4, required: true },
      ],
      onSubmit: (v) => {
        const item: NotificationItem = {
          id: uid('ntf'), title: str(v, 'title'), body: str(v, 'body'), channel: str(v, 'channel') as NotificationItem['channel'],
          audience: str(v, 'audience'), sentAt: isoDateTime(new Date(str(v, 'scheduledFor') || today())), status: str(v, 'status') as NotificationItem['status'], read: false,
        }
        updateDb((prev) => ({ ...prev, notifications: [item, ...prev.notifications] }))
        logActivity('Campaign created', `${item.title} queued for ${item.audience}`, 'system')
        toast(`${item.channel} campaign ${item.status.toLowerCase()} successfully`)
      },
    })
  }

  function openProgressForm(memberId?: string) {
    openForm({
      title: 'Log fitness progress',
      subtitle: 'Record body weight, body fat, muscle mass, and measurements.',
      size: 'lg',
      initial: { memberId: memberId || db.members[0]?.id || '', date: today(), weight: 75, bodyFat: 22, muscleMass: 50, bmi: 24, chest: 96, waist: 84, hips: 98, arms: 32 },
      fields: [
        { name: 'memberId', label: 'Member', type: 'select', options: memberOptions(), required: true },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'weight', label: 'Weight (kg)', type: 'number', min: 20, step: 0.1 },
        { name: 'bodyFat', label: 'Body fat (%)', type: 'number', min: 1, step: 0.1 },
        { name: 'muscleMass', label: 'Muscle mass (kg)', type: 'number', min: 1, step: 0.1 },
        { name: 'bmi', label: 'BMI', type: 'number', min: 10, step: 0.1 },
        { name: 'chest', label: 'Chest (cm)', type: 'number', min: 1 },
        { name: 'waist', label: 'Waist (cm)', type: 'number', min: 1 },
        { name: 'hips', label: 'Hips (cm)', type: 'number', min: 1 },
        { name: 'arms', label: 'Arms (cm)', type: 'number', min: 1 },
        { name: 'notes', label: 'Trainer notes', type: 'textarea', span: 2, rows: 2 },
      ],
      onSubmit: (v) => {
        const item: ProgressEntry = {
          id: uid('prg'), memberId: str(v, 'memberId'), date: str(v, 'date'), weight: num(v, 'weight'), bodyFat: num(v, 'bodyFat'),
          muscleMass: num(v, 'muscleMass'), bmi: num(v, 'bmi'), chest: num(v, 'chest'), waist: num(v, 'waist'), hips: num(v, 'hips'),
          arms: num(v, 'arms'), notes: str(v, 'notes'),
        }
        updateDb((prev) => ({ ...prev, progress: [...prev.progress, item] }))
        logActivity('Progress logged', `New body metrics recorded for ${db.members.find((m) => m.id === item.memberId)?.name}`, 'system')
        toast('Fitness progress logged')
      },
    })
  }

  function openWorkoutForm() {
    openForm({
      title: 'Create workout plan',
      subtitle: 'Build a repeatable plan from the exercise library.',
      size: 'lg',
      initial: { memberId: db.members[0]?.id || '', trainerId: db.trainers[0]?.id || '', level: 'Beginner', status: 'Active', days: 'Mon / Wed / Fri', goal: 'General fitness', totalSessions: 20 },
      fields: [
        { name: 'name', label: 'Plan name', required: true },
        { name: 'memberId', label: 'Assign to member', type: 'select', options: memberOptions(), required: true },
        { name: 'trainerId', label: 'Trainer', type: 'select', options: trainerOptions() },
        { name: 'goal', label: 'Goal', placeholder: 'e.g. Weight loss' },
        { name: 'level', label: 'Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'].map((x) => ({ value: x, label: x })) },
        { name: 'days', label: 'Schedule', placeholder: 'e.g. Mon / Wed / Fri' },
        { name: 'totalSessions', label: 'Total sessions', type: 'number', min: 1 },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Draft', 'Completed'].map((x) => ({ value: x, label: x })) },
        { name: 'notes', label: 'Plan notes', type: 'textarea', span: 2, rows: 3 },
      ],
      onSubmit: (v) => {
        const level = str(v, 'level', 'Beginner') as WorkoutPlan['level']
        const exercises = db.exercises.filter((e) => e.level === level).slice(0, 6).map((e) => ({ name: e.name, muscle: e.muscle, sets: 3, reps: '10–12', weight: 'Moderate', completed: false }))
        const item: WorkoutPlan = {
          id: uid('wp'), name: str(v, 'name'), memberId: str(v, 'memberId'), trainerId: str(v, 'trainerId'), goal: str(v, 'goal'),
          level, days: str(v, 'days'), exercises, status: str(v, 'status', 'Active') as WorkoutPlan['status'], createdAt: today(),
          completedSessions: 0, totalSessions: num(v, 'totalSessions', 20), feedback: str(v, 'notes'),
        }
        updateDb((prev) => ({ ...prev, workoutPlans: [item, ...prev.workoutPlans] }))
        logActivity('Workout plan created', `${item.name} assigned to a member`, 'system')
        toast('Workout plan created')
      },
    })
  }

  function openDietForm() {
    openForm({
      title: 'Create diet plan',
      subtitle: 'Set calorie and macro targets; a five-meal template is generated automatically.',
      size: 'lg',
      initial: { memberId: db.members[0]?.id || '', goal: 'Weight Loss', type: 'Vegetarian', calories: 1900, protein: 130, carbs: 200, fat: 55, waterTarget: 3, status: 'Active' },
      fields: [
        { name: 'name', label: 'Plan name', required: true },
        { name: 'memberId', label: 'Assign to member', type: 'select', options: memberOptions(), required: true },
        { name: 'goal', label: 'Goal', type: 'select', options: ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Performance'].map((x) => ({ value: x, label: x })) },
        { name: 'type', label: 'Diet type', type: 'select', options: ['Vegetarian', 'Non-Vegetarian', 'Vegan'].map((x) => ({ value: x, label: x })) },
        { name: 'calories', label: 'Daily calories', type: 'number', min: 800 },
        { name: 'protein', label: 'Protein (g)', type: 'number', min: 0 },
        { name: 'carbs', label: 'Carbs (g)', type: 'number', min: 0 },
        { name: 'fat', label: 'Fat (g)', type: 'number', min: 0 },
        { name: 'waterTarget', label: 'Water target (L)', type: 'number', min: 1, step: 0.5 },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Draft'].map((x) => ({ value: x, label: x })) },
      ],
      onSubmit: (v) => {
        const calories = num(v, 'calories', 1900)
        const protein = num(v, 'protein', 130)
        const carbs = num(v, 'carbs', 200)
        const fat = num(v, 'fat', 55)
        const veg = str(v, 'type') !== 'Non-Vegetarian'
        const item: DietPlan = {
          id: uid('dp'), name: str(v, 'name'), memberId: str(v, 'memberId'), goal: str(v, 'goal') as DietPlan['goal'], type: str(v, 'type') as DietPlan['type'],
          calories, protein, carbs, fat, waterTarget: num(v, 'waterTarget', 3), status: str(v, 'status', 'Active') as DietPlan['status'], createdAt: today(),
          meals: [
            { time: '07:30', name: 'Breakfast', items: veg ? 'Greek yogurt, oats, berries' : 'Egg whites, oats, berries', calories: Math.round(calories * .24), protein: Math.round(protein * .25), carbs: Math.round(carbs * .26), fat: Math.round(fat * .22) },
            { time: '10:30', name: 'Mid-morning', items: 'Protein shake, fruit, green tea', calories: Math.round(calories * .12), protein: Math.round(protein * .17), carbs: Math.round(carbs * .12), fat: Math.round(fat * .10) },
            { time: '13:30', name: 'Lunch', items: veg ? 'Lentil bowl, brown rice, salad' : 'Grilled chicken, brown rice, salad', calories: Math.round(calories * .34), protein: Math.round(protein * .35), carbs: Math.round(carbs * .36), fat: Math.round(fat * .38) },
            { time: '17:00', name: 'Snack', items: 'Cottage cheese, nuts, coffee', calories: Math.round(calories * .11), protein: Math.round(protein * .12), carbs: Math.round(carbs * .08), fat: Math.round(fat * .14) },
            { time: '20:00', name: 'Dinner', items: veg ? 'Tofu stir-fry, vegetables, roti' : 'Fish, sweet potato, steamed greens', calories: Math.round(calories * .19), protein: Math.round(protein * .11), carbs: Math.round(carbs * .18), fat: Math.round(fat * .16) },
          ],
        }
        updateDb((prev) => ({ ...prev, dietPlans: [item, ...prev.dietPlans] }))
        logActivity('Diet plan created', `${item.name} assigned to a member`, 'system')
        toast('Diet plan created')
      },
    })
  }

  function openDocumentForm(memberId: string) {
    openForm({
      title: 'Upload member document',
      subtitle: 'Store ID proof, medical certificates, contracts, or progress photos.',
      initial: { type: 'Identity', date: today() },
      fields: [
        { name: 'document', label: 'Choose file', type: 'file', accept: '.pdf,.jpg,.jpeg,.png', required: true },
        { name: 'type', label: 'Document type', type: 'select', options: ['Identity', 'Medical', 'Contract', 'Progress Photo', 'Other'].map((x) => ({ value: x, label: x })) },
        { name: 'date', label: 'Document date', type: 'date' },
      ],
      onSubmit: (v) => {
        updateDb((prev) => ({
          ...prev,
          members: prev.members.map((m) => m.id === memberId ? {
            ...m, documents: [{ id: uid('doc'), name: str(v, 'document'), type: str(v, 'type'), date: str(v, 'date'), size: 'Local file' }, ...m.documents],
          } : m),
        }))
        toast('Document added to member profile')
      },
    })
  }

  function openTransferForm(member: Member) {
    openForm({
      title: 'Transfer member branch',
      subtitle: `Move ${member.name} to another branch while keeping their history.`,
      initial: { branchId: member.branchId, effectiveDate: today(), reason: '' },
      fields: [
        { name: 'branchId', label: 'Destination branch', type: 'select', options: branchOptions(), required: true },
        { name: 'effectiveDate', label: 'Effective date', type: 'date', required: true },
        { name: 'reason', label: 'Reason', type: 'textarea', span: 2, rows: 2 },
      ],
      onSubmit: (v) => {
        updateDb((prev) => ({ ...prev, members: prev.members.map((m) => m.id === member.id ? { ...m, branchId: str(v, 'branchId'), notes: `${m.notes ? `${m.notes} ` : ''}[Transfer ${str(v, 'effectiveDate')}] ${str(v, 'reason')}`.trim() } : m) }))
        logActivity('Member transferred', `${member.name} moved to a new branch`, 'member')
        toast('Member branch updated')
      },
    })
  }

  function openRenewForm(member: Member) {
    const plan = db.plans.find((p) => p.id === member.planId) || db.plans[0]
    openForm({
      title: 'Renew membership',
      subtitle: `Extend ${member.name}'s membership and create a new invoice.`,
      initial: { planId: plan.id, startDate: today(), discount: 0, method: 'Cash', autoRenew: member.autoRenew },
      fields: [
        { name: 'planId', label: 'Renewal plan', type: 'select', options: planOptions(), required: true },
        { name: 'startDate', label: 'Start date', type: 'date', required: true },
        { name: 'discount', label: 'Loyalty discount', type: 'number', min: 0, defaultValue: 0 },
        { name: 'method', label: 'Payment method', type: 'select', options: ['Cash', 'UPI', 'Card', 'Online'].map((x) => ({ value: x, label: x })) },
        { name: 'autoRenew', label: 'Keep auto-renewal on', type: 'checkbox' },
      ],
      onSubmit: (v) => {
        const chosen = db.plans.find((p) => p.id === str(v, 'planId')) || plan
        const start = str(v, 'startDate')
        const end = isoDate(addDays(new Date(start), chosen.durationDays))
        const discount = num(v, 'discount')
        const tax = Math.round((chosen.price - discount) * db.settings.taxRate / 100)
        const total = chosen.price - discount + tax
        const payment: Payment = {
          id: uid('pay'), invoiceNo: `${db.settings.receiptPrefix}-${Date.now().toString().slice(-7)}`, memberId: member.id, memberName: member.name,
          planId: chosen.id, branchId: member.branchId, date: isoDateTime(new Date()), dueDate: start, subtotal: chosen.price,
          discount, tax, total, paid: total, method: str(v, 'method') as Payment['method'], status: 'Paid', note: 'Membership renewal',
        }
        updateDb((prev) => ({
          ...prev,
          payments: [payment, ...prev.payments],
          members: prev.members.map((m) => m.id === member.id ? {
            ...m, planId: chosen.id, startsAt: start, expiresAt: end, status: 'Active', dueAmount: 0, autoRenew: bool(v, 'autoRenew'),
            membershipHistory: [{ plan: chosen.name, from: start, to: end, amount: total }, ...m.membershipHistory],
          } : m),
        }))
        logActivity('Membership renewed', `${member.name} renewed until ${end}`, 'member')
        toast('Membership renewed and invoice created')
      },
    })
  }

  function openFreezeForm(member: Member) {
    openForm({
      title: 'Freeze membership',
      subtitle: 'Pause access and extend the membership expiry date.',
      initial: { days: 14, reason: 'Travel' },
      fields: [
        { name: 'days', label: 'Freeze duration (days)', type: 'number', min: 1, max: 90, required: true },
        { name: 'reason', label: 'Reason', type: 'select', options: ['Travel', 'Medical', 'Work', 'Personal', 'Other'].map((x) => ({ value: x, label: x })) },
        { name: 'notes', label: 'Notes', type: 'textarea', span: 2, rows: 2 },
      ],
      onSubmit: (v) => {
        const days = num(v, 'days', 14)
        updateDb((prev) => ({
          ...prev,
          members: prev.members.map((m) => m.id === member.id ? {
            ...m, status: 'Frozen', expiresAt: isoDate(addDays(new Date(m.expiresAt), days)),
            notes: `${m.notes ? `${m.notes} ` : ''}[Freeze ${days}d: ${str(v, 'reason')}] ${str(v, 'notes')}`.trim(),
          } : m),
        }))
        logActivity('Membership frozen', `${member.name}'s membership paused for ${days} days`, 'member')
        toast('Membership frozen and expiry extended')
      },
    })
  }

  function openRefundForm(payment: Payment) {
    openForm({
      title: 'Process refund',
      subtitle: `${payment.invoiceNo} · Maximum refund ${db.settings.currency} ${payment.paid.toLocaleString()}`,
      initial: { amount: payment.paid, reason: 'Member request' },
      fields: [
        { name: 'amount', label: 'Refund amount', type: 'number', min: 1, max: payment.paid, required: true },
        { name: 'reason', label: 'Reason', type: 'select', options: ['Member request', 'Duplicate payment', 'Service cancellation', 'Billing error', 'Other'].map((x) => ({ value: x, label: x })) },
        { name: 'notes', label: 'Notes', type: 'textarea', span: 2, rows: 2 },
      ],
      onSubmit: (v) => {
        const amount = Math.min(num(v, 'amount'), payment.paid)
        updateDb((prev) => ({ ...prev, payments: prev.payments.map((p) => p.id === payment.id ? { ...p, refunded: (p.refunded || 0) + amount, status: 'Refunded' } : p) }))
        logActivity('Refund processed', `${db.settings.currency} ${amount.toLocaleString()} refunded for ${payment.invoiceNo}`, 'payment')
        toast('Refund processed successfully')
      },
    })
  }

  function openSaleRefundForm(sale: Sale) {
    openForm({
      title: 'Refund POS sale',
      subtitle: `${sale.invoiceNo} · ${db.settings.currency} ${sale.total.toLocaleString()}`,
      initial: { reason: 'Product return' },
      fields: [{ name: 'reason', label: 'Reason', type: 'select', options: ['Product return', 'Wrong item', 'Damaged product', 'Billing error'].map((x) => ({ value: x, label: x })) }],
      onSubmit: () => {
        updateDb((prev) => ({
          ...prev,
          sales: prev.sales.map((s) => s.id === sale.id ? { ...s, status: 'Refunded' } : s),
          products: prev.products.map((p) => {
            const sold = sale.items.find((i) => i.productId === p.id)
            return sold ? { ...p, stock: p.stock + sold.qty } : p
          }),
        }))
        toast('Sale refunded and stock restored')
      },
    })
  }

  function openCheckOutForm(record: Attendance) {
    openForm({
      title: 'Record check-out',
      subtitle: `${record.memberName} checked in at ${new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      initial: { time: new Date().toTimeString().slice(0, 5) },
      fields: [{ name: 'time', label: 'Check-out time', type: 'time', required: true }],
      onSubmit: (v) => {
        const date = new Date(record.checkIn)
        const [h, m] = str(v, 'time').split(':').map(Number)
        date.setHours(h || 0, m || 0, 0, 0)
        updateDb((prev) => ({ ...prev, attendance: prev.attendance.map((a) => a.id === record.id ? { ...a, checkOut: isoDateTime(date) } : a) }))
        toast('Check-out recorded')
      },
    })
  }

  function openBranchForm(branch?: Branch) {
    openForm({
      title: branch ? 'Edit branch' : 'Add gym branch',
      subtitle: 'Configure branch profile, manager, contact, and monthly target.',
      size: 'lg',
      initial: (branch || { status: 'Open', openedAt: today(), monthlyTarget: 800000, color: '#1557d6' }) as FormValues,
      fields: [
        { name: 'name', label: 'Branch name', required: true },
        { name: 'code', label: 'Branch code', required: true },
        { name: 'manager', label: 'Branch manager', required: true },
        { name: 'phone', label: 'Phone', type: 'tel' },
        { name: 'city', label: 'City' },
        { name: 'address', label: 'Address' },
        { name: 'monthlyTarget', label: 'Monthly revenue target', type: 'number', min: 0 },
        { name: 'openedAt', label: 'Opened on', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed'].map((x) => ({ value: x, label: x })) },
        { name: 'color', label: 'Branch color', type: 'color' },
      ],
      onSubmit: (v) => {
        const payload = {
          name: str(v, 'name'), code: str(v, 'code'), manager: str(v, 'manager'), phone: str(v, 'phone'), city: str(v, 'city'),
          address: str(v, 'address'), monthlyTarget: num(v, 'monthlyTarget'), openedAt: str(v, 'openedAt'), status: str(v, 'status', 'Open') as Branch['status'], color: str(v, 'color', '#1557d6'),
        }
        if (branch) updateDb((prev) => ({ ...prev, branches: prev.branches.map((b) => b.id === branch.id ? { ...b, ...payload } : b) }))
        else updateDb((prev) => ({ ...prev, branches: [...prev.branches, { id: uid('br'), ...payload }] }))
        toast(branch ? 'Branch updated' : 'New branch added')
      },
    })
  }

  function openTrainerAssignmentForm(trainer?: Trainer) {
    openForm({
      title: 'Assign trainer to member',
      subtitle: 'Link a member to a coach and optionally attach a personal training package.',
      size: 'lg',
      initial: { trainerId: trainer?.id || db.trainers[0]?.id || '', memberId: db.members[0]?.id || '', packageId: 'plan-pt-starter', startDate: today(), notes: '' },
      fields: [
        { name: 'trainerId', label: 'Trainer', type: 'select', options: trainerOptions(), required: true },
        { name: 'memberId', label: 'Member', type: 'select', options: memberOptions(), required: true },
        { name: 'packageId', label: 'PT package', type: 'select', options: options(db.plans.filter((p) => p.category === 'Personal Training'), (p) => p.id, (p) => p.name) },
        { name: 'startDate', label: 'Start date', type: 'date', required: true },
        { name: 'notes', label: 'Coaching notes', type: 'textarea', span: 2, rows: 3 },
      ],
      onSubmit: (v) => {
        const member = db.members.find((m) => m.id === str(v, 'memberId'))
        const chosenTrainer = db.trainers.find((t) => t.id === str(v, 'trainerId'))
        const pkg = db.plans.find((p) => p.id === str(v, 'packageId'))
        if (!member || !chosenTrainer) return
        updateDb((prev) => ({
          ...prev,
          members: prev.members.map((m) => m.id === member.id ? { ...m, trainerId: chosenTrainer.id, notes: `${m.notes ? `${m.notes} ` : ''}[Coach ${chosenTrainer.name}] ${str(v, 'notes')}`.trim() } : m),
          trainers: prev.trainers.map((t) => t.id === chosenTrainer.id ? { ...t, assignedMembers: t.assignedMembers + (member.trainerId === t.id ? 0 : 1) } : t),
        }))
        logActivity('Trainer assigned', `${chosenTrainer.name} assigned to ${member.name}${pkg ? ` for ${pkg.name}` : ''}`, 'system')
        toast(`${chosenTrainer.name} assigned to ${member.name}`)
      },
    })
  }

  function openPtSessionForm(trainer?: Trainer) {
    openForm({
      title: 'Schedule personal training session',
      subtitle: 'Book a one-on-one session with a trainer and member.',
      size: 'lg',
      initial: { trainerId: trainer?.id || db.trainers[0]?.id || '', memberId: db.members[0]?.id || '', date: today(), time: '17:00', duration: 60, room: 'PT Room' },
      fields: [
        { name: 'memberId', label: 'Member', type: 'select', options: memberOptions(), required: true },
        { name: 'trainerId', label: 'Trainer', type: 'select', options: trainerOptions(), required: true },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'time', label: 'Start time', type: 'time', required: true },
        { name: 'duration', label: 'Duration (min)', type: 'number', min: 15 },
        { name: 'room', label: 'Room / area' },
        { name: 'focus', label: 'Session focus', placeholder: 'e.g. Upper body strength' },
      ],
      onSubmit: (v) => {
        const member = db.members.find((m) => m.id === str(v, 'memberId'))
        const chosenTrainer = db.trainers.find((t) => t.id === str(v, 'trainerId'))
        if (!member || !chosenTrainer) return
        const session: GymClass = {
          id: uid('cls'), title: `PT — ${str(v, 'focus') || member.name}`, type: 'Personal Training', trainerId: chosenTrainer.id,
          date: str(v, 'date'), time: str(v, 'time'), duration: num(v, 'duration', 60), capacity: 1, room: str(v, 'room', 'PT Room'),
          status: 'Scheduled', branchId: chosenTrainer.branchId, color: '#12a3c7',
        }
        const booking: Booking = { id: uid('bk'), classId: session.id, memberId: member.id, status: 'Confirmed', bookedAt: new Date().toISOString() }
        updateDb((prev) => ({ ...prev, classes: [...prev.classes, session], bookings: [...prev.bookings, booking] }))
        logActivity('PT session booked', `${member.name} booked a session with ${chosenTrainer.name}`, 'class')
        toast('Personal training session scheduled')
      },
    })
  }

  function openCouponForm(coupon?: Coupon) {
    openForm({
      title: coupon ? 'Edit coupon' : 'Create discount coupon',
      subtitle: 'Set promo rules, validity, usage limits, and eligible plans.',
      size: 'lg',
      initial: (coupon || { discountType: 'percent', value: 10, minAmount: 0, validFrom: today(), validTo: isoDate(addDays(new Date(), 30)), usageLimit: 100, used: 0, status: 'Active', appliesTo: 'All plans' }) as FormValues,
      fields: [
        { name: 'code', label: 'Coupon code', required: true, placeholder: 'e.g. NEWYEAR20' },
        { name: 'description', label: 'Description', required: true },
        { name: 'discountType', label: 'Discount type', type: 'select', options: [{ value: 'percent', label: 'Percentage (%)' }, { value: 'fixed', label: 'Fixed amount' }] },
        { name: 'value', label: 'Discount value', type: 'number', min: 0, required: true },
        { name: 'minAmount', label: 'Minimum invoice amount', type: 'number', min: 0 },
        { name: 'usageLimit', label: 'Usage limit', type: 'number', min: 1 },
        { name: 'validFrom', label: 'Valid from', type: 'date', required: true },
        { name: 'validTo', label: 'Valid until', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Expired', 'Draft'].map((x) => ({ value: x, label: x })) },
        { name: 'appliesTo', label: 'Applies to', placeholder: 'e.g. All plans' },
      ],
      onSubmit: (v) => {
        const payload = {
          code: str(v, 'code').toUpperCase(), description: str(v, 'description'), discountType: str(v, 'discountType') as Coupon['discountType'],
          value: num(v, 'value'), minAmount: num(v, 'minAmount'), validFrom: str(v, 'validFrom'), validTo: str(v, 'validTo'),
          usageLimit: num(v, 'usageLimit', 100), used: coupon?.used || 0, status: str(v, 'status', 'Active') as Coupon['status'], appliesTo: str(v, 'appliesTo', 'All plans'),
        }
        if (coupon) updateDb((prev) => ({ ...prev, coupons: prev.coupons.map((c) => c.id === coupon.id ? { ...c, ...payload } : c) }))
        else updateDb((prev) => ({ ...prev, coupons: [{ id: uid('cpn'), ...payload }, ...prev.coupons] }))
        toast(coupon ? 'Coupon updated' : `Coupon ${payload.code} created`)
      },
    })
  }

  function openSettingsForm() {
    openForm({
      title: 'Gym settings',
      subtitle: 'Update branding, contact details, tax rate, and automation.',
      size: 'lg',
      initial: { ...db.settings } as FormValues,
      fields: [
        { name: 'gymName', label: 'Gym name', required: true },
        { name: 'tagline', label: 'Tagline' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phone', label: 'Phone', type: 'tel' },
        { name: 'address', label: 'Address', span: 2 },
        { name: 'currency', label: 'Currency symbol', required: true },
        { name: 'taxRate', label: 'GST / tax rate (%)', type: 'number', min: 0, max: 100 },
        { name: 'receiptPrefix', label: 'Invoice prefix', required: true },
        { name: 'primaryColor', label: 'Primary brand color', type: 'color' },
        { name: 'autoRenew', label: 'Enable auto-renewal', type: 'checkbox' },
        { name: 'qrEntry', label: 'Enable QR-based entry', type: 'checkbox' },
        { name: 'whatsappEnabled', label: 'Enable WhatsApp notifications', type: 'checkbox' },
        { name: 'smsEnabled', label: 'Enable SMS notifications', type: 'checkbox' },
        { name: 'emailEnabled', label: 'Enable email notifications', type: 'checkbox' },
      ],
      onSubmit: (v) => {
        updateDb((prev) => ({
          ...prev,
          settings: {
            gymName: str(v, 'gymName'), tagline: str(v, 'tagline'), email: str(v, 'email'), phone: str(v, 'phone'), address: str(v, 'address'),
            currency: str(v, 'currency', 'Rs'), taxRate: num(v, 'taxRate', 5), receiptPrefix: str(v, 'receiptPrefix', 'INV'),
            primaryColor: str(v, 'primaryColor', '#1557d6'), autoRenew: bool(v, 'autoRenew'), qrEntry: bool(v, 'qrEntry'),
            whatsappEnabled: bool(v, 'whatsappEnabled'), smsEnabled: bool(v, 'smsEnabled'), emailEnabled: bool(v, 'emailEnabled'),
          },
        }))
        toast('Settings saved')
      },
    })
  }

  return {
    openMemberForm, openPaymentForm, openPlanForm, openTrainerForm, openStaffForm, openClassForm,
    openBookingForm, openExpenseForm, openInventoryForm, openProductForm, openLeadForm,
    openNotificationForm, openProgressForm, openWorkoutForm, openDietForm, openDocumentForm,
    openTransferForm, openRenewForm, openFreezeForm, openRefundForm, openSaleRefundForm,
    openCheckOutForm, openBranchForm, openSettingsForm, openCouponForm, openTrainerAssignmentForm,
    openPtSessionForm, openReceipt,
  }
}
