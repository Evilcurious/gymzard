import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line,
  LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { formatCurrency } from '../lib/utils'

const axis = { fontSize: 11, fill: '#8191aa', fontWeight: 500 }
const grid = '#e8eefb'

function moneyTick(value: number) {
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}K`
  return String(value)
}

export function RevenueAreaChart({ data, currency = 'Rs' }: { data: { month: string; revenue: number; expenses: number; target: number }[]; currency?: string }) {
  return (
    <ResponsiveContainer width="100%" height={290}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1557d6" stopOpacity={0.3} /><stop offset="100%" stopColor="#1557d6" stopOpacity={0.01} /></linearGradient>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#65a7f7" stopOpacity={0.2} /><stop offset="100%" stopColor="#65a7f7" stopOpacity={0.01} /></linearGradient>
        </defs>
        <CartesianGrid stroke={grid} strokeDasharray="4 6" vertical={false} />
        <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={moneyTick} tick={axis} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v: number, name) => [formatCurrency(v, currency), name === 'revenue' ? 'Revenue' : name === 'expenses' ? 'Expenses' : 'Target']} />
        <Area type="monotone" dataKey="revenue" stroke="#1557d6" strokeWidth={2.5} fill="url(#revenueFill)" />
        <Area type="monotone" dataKey="expenses" stroke="#67a4ee" strokeWidth={2} fill="url(#expenseFill)" />
        <Line type="monotone" dataKey="target" stroke="#a8b6cb" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function MemberGrowthChart({ data }: { data: { month: string; members: number; renewals: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }} barGap={3}>
        <CartesianGrid stroke={grid} strokeDasharray="4 6" vertical={false} />
        <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: '#eef5ff' }} />
        <Bar dataKey="members" name="Total members" fill="#1557d6" radius={[5, 5, 0, 0]} maxBarSize={22} />
        <Bar dataKey="renewals" name="Renewals" fill="#9bc1ff" radius={[5, 5, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function PeakHoursChart({ data }: { data: { hour: string; visits: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="4 6" vertical={false} />
        <XAxis dataKey="hour" tick={axis} axisLine={false} tickLine={false} interval={1} />
        <YAxis tick={axis} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: '#eef5ff' }} formatter={(v: number) => [`${v} visits`, 'Check-ins']} />
        <Bar dataKey="visits" fill="#3a87f7" radius={[5, 5, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}

const donutColors = ['#1557d6', '#4f91f7', '#12a3c7', '#8b5cf6', '#e6a21a', '#e56b45', '#168a5b', '#d64d70', '#86a7ca']

export function PlanDonutChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3} stroke="none">
          {data.map((_, i) => <Cell key={i} fill={donutColors[i % donutColors.length]} />)}
        </Pie>
        <Tooltip formatter={(v: number, name) => [`${v} members`, name]} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function BranchBarChart({ data, currency = 'Rs' }: { data: { name: string; revenue: number; target: number }[]; currency?: string }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="4 6" vertical={false} />
        <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={moneyTick} tick={axis} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v: number, name) => [formatCurrency(v, currency), name === 'revenue' ? 'Revenue' : 'Target']} />
        <Bar dataKey="revenue" name="Revenue" fill="#1557d6" radius={[5, 5, 0, 0]} maxBarSize={34} />
        <Line type="monotone" dataKey="target" name="Target" stroke="#e6a21a" strokeWidth={2} dot={{ r: 3, fill: '#e6a21a' }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function ProgressLineChart({ data, dataKeys }: { data: Record<string, string | number>[]; dataKeys: { key: string; color: string; name: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="4 6" vertical={false} />
        <XAxis dataKey="date" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
        <Tooltip />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
        {dataKeys.map((d) => <Line key={d.key} type="monotone" dataKey={d.key} name={d.name} stroke={d.color} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5 }} />)}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function FinanceBarChart({ data, currency = 'Rs' }: { data: { name: string; value: number; color?: string }[]; currency?: string }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="4 6" vertical={false} />
        <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={moneyTick} tick={axis} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: '#eef5ff' }} formatter={(v: number) => [formatCurrency(v, currency), 'Amount']} />
        <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={36}>
          {data.map((d, i) => <Cell key={i} fill={d.color || donutColors[i % donutColors.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
