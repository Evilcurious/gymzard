import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Dumbbell, RefreshCw, Save, Sparkles, Utensils } from 'lucide-react'
import { useApp } from '../../lib/app-context'
import { isoDate, uid } from '../../lib/utils'
import type { DietPlan, WorkoutPlan } from '../../types'
import { Badge, Button, Input, Modal, Select } from '../ui'

export function AiModal() {
  const { db, ui, closeOverlay, updateDb, toast, logActivity } = useApp()
  const type = ui.aiType
  const [memberId, setMemberId] = useState(db.members[0]?.id || '')
  const [goal, setGoal] = useState('Weight loss')
  const [level, setLevel] = useState('Beginner')
  const [days, setDays] = useState('Mon / Wed / Fri')
  const [dietType, setDietType] = useState('Vegetarian')
  const [calories, setCalories] = useState(1900)
  const [seed, setSeed] = useState(1)
  const [generated, setGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => { setGenerated(false); setSeed(1) }, [ui.aiType, ui.aiType && memberId])

  const workout = useMemo(() => {
    const pool = db.exercises.filter((e) => type === 'workout' && (level === 'Beginner' ? e.level === 'Beginner' : true))
    return pool.slice((seed - 1) % Math.max(1, pool.length - 4)).slice(0, 6)
  }, [db.exercises, type, level, seed])
  const meals = useMemo(() => {
    const pool = db.foods.filter((f) => dietType === 'Non-Vegetarian' || f.type !== 'Non-Veg')
    return ['Breakfast', 'Mid-morning', 'Lunch', 'Snack', 'Dinner'].map((name, i) => ({ name, food: pool[(i + seed) % pool.length], portion: Math.round(calories / 5) }))
  }, [db.foods, dietType, calories, seed])

  function generate() {
    setGenerating(true)
    setGenerated(false)
    window.setTimeout(() => { setGenerating(false); setGenerated(true); toast('AI demo plan generated', 'info') }, 700)
  }

  function save() {
    const member = db.members.find((m) => m.id === memberId)
    if (!member) return toast('Please select a member', 'error')
    if (type === 'workout') {
      const plan: WorkoutPlan = {
        id: uid('wp'), name: `AI ${goal} Plan`, memberId, goal, level: level as WorkoutPlan['level'], days,
        trainerId: db.trainers[0]?.id || '', exercises: workout.map((e, i) => ({ name: e.name, muscle: e.muscle, sets: 3 + (i % 2), reps: i % 2 ? '12–15' : '8–10', weight: level === 'Beginner' ? 'Light' : 'Moderate', completed: false })),
        status: 'Active', createdAt: isoDate(new Date()), completedSessions: 0, totalSessions: 20, feedback: 'Generated with the GymZard AI demo assistant.',
      }
      updateDb((prev) => ({ ...prev, workoutPlans: [plan, ...prev.workoutPlans] }))
      logActivity('AI workout plan generated', `${plan.name} assigned to ${member.name}`, 'system')
    } else {
      const plan: DietPlan = {
        id: uid('dp'), name: `AI ${goal} Nutrition`, memberId, goal: goal.includes('Loss') ? 'Weight Loss' : goal.includes('Gain') ? 'Muscle Gain' : 'Maintenance',
        type: dietType as DietPlan['type'], calories, protein: Math.round(calories * 0.28 / 4), carbs: Math.round(calories * 0.42 / 4), fat: Math.round(calories * 0.3 / 9), waterTarget: 3,
        meals: meals.map((m, i) => ({ time: ['07:30', '10:30', '13:30', '17:00', '20:00'][i], name: m.name, items: `${m.food.name} · ${m.food.serving}`, calories: m.portion, protein: Math.round(m.food.protein * 1.8), carbs: Math.round(m.food.carbs * 1.5), fat: Math.round(m.food.fat * 1.5) })),
        status: 'Active', createdAt: isoDate(new Date()),
      }
      updateDb((prev) => ({ ...prev, dietPlans: [plan, ...prev.dietPlans] }))
      logActivity('AI diet plan generated', `${plan.name} assigned to ${member.name}`, 'system')
    }
    toast('Generated plan saved successfully')
    closeOverlay()
  }

  return (
    <Modal open={!!type} onClose={closeOverlay} title={type === 'workout' ? 'AI Workout Plan Generator' : 'AI Diet Plan Generator'} subtitle="Prototype generator — plans are created locally from your exercise and food libraries." size="lg">
      <div className="space-y-5">
        <div className="blue-gradient relative overflow-hidden rounded-2xl p-5 text-white">
          <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full border-[20px] border-white/5" />
          <div className="relative flex items-start gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><Sparkles className="h-6 w-6" /></span><div><h3 className="text-base font-extrabold">Smart plan assistant</h3><p className="mt-1 max-w-xl text-xs leading-relaxed text-blue-100">Choose a member and a goal. The demo engine builds a balanced plan using workout difficulty, muscle groups, and food macros.</p></div></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div><label className="label-base">Member</label><Select value={memberId} onChange={(e) => setMemberId(e.target.value)}>{db.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></div>
          <div><label className="label-base">Goal</label><Select value={goal} onChange={(e) => setGoal(e.target.value)}>{['Weight loss', 'Muscle gain', 'General fitness', 'Strength training', 'Improved stamina'].map((g) => <option key={g}>{g}</option>)}</Select></div>
          {type === 'workout' ? <div><label className="label-base">Level</label><Select value={level} onChange={(e) => setLevel(e.target.value)}>{['Beginner', 'Intermediate', 'Advanced'].map((l) => <option key={l}>{l}</option>)}</Select></div> : <div><label className="label-base">Diet type</label><Select value={dietType} onChange={(e) => setDietType(e.target.value)}>{['Vegetarian', 'Non-Vegetarian', 'Vegan'].map((d) => <option key={d}>{d}</option>)}</Select></div>}
          {type === 'workout' ? <div className="lg:col-span-2"><label className="label-base">Training days</label><Input value={days} onChange={(e) => setDays(e.target.value)} /></div> : <div className="lg:col-span-2"><label className="label-base">Daily calories</label><Input type="number" value={calories} onChange={(e) => setCalories(Number(e.target.value))} /></div>}
          <div className="flex items-end"><Button icon={Sparkles} onClick={generate} disabled={generating} className="w-full">{generating ? 'Generating plan…' : 'Generate plan'}</Button></div>
        </div>
        {generated ? (
          <div className="rounded-2xl border border-blue-100 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge tone="green" dot>Generated</Badge><h4 className="text-sm font-extrabold text-brand-950">{type === 'workout' ? `${goal} · ${level} · ${days}` : `${goal} · ${dietType} · ${calories} kcal`}</h4></div><Button size="sm" variant="ghost" icon={RefreshCw} onClick={() => { setSeed((s) => s + 1); generate() }}>Regenerate</Button></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {type === 'workout' ? workout.map((e, i) => (
                <div key={e.id} className="rounded-xl border border-blue-50 bg-brand-50/30 p-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-brand-600"><Dumbbell className="h-3.5 w-3.5" /></span><p className="text-sm font-bold text-slate-700">{e.name}</p></div><p className="mt-2 text-xs text-slate-500">{e.muscle} · {3 + (i % 2)} sets · {i % 2 ? '12–15' : '8–10'} reps</p><p className="mt-1 text-[11px] text-slate-400">{e.instructions}</p></div>
              )) : meals.map((m, i) => (
                <div key={m.name} className="rounded-xl border border-blue-50 bg-brand-50/30 p-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-brand-600"><Utensils className="h-3.5 w-3.5" /></span><p className="text-sm font-bold text-slate-700">{m.name}</p></div><p className="mt-2 text-xs text-slate-500">{m.food.name} · {m.food.serving}</p><p className="mt-1 text-[11px] text-slate-400">≈ {m.portion} kcal · {m.food.protein}g protein · {m.food.carbs}g carbs</p></div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-blue-50 pt-4"><p className="flex items-center gap-1.5 text-xs text-slate-500"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Demo suggestion — review with a certified trainer or dietitian.</p><Button icon={Save} onClick={save}>Save plan to member</Button></div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-brand-50/30 px-6 py-10 text-center"><Sparkles className="mx-auto h-8 w-8 text-brand-300" /><p className="mt-3 text-sm font-bold text-brand-950">Your generated plan will appear here</p><p className="mt-1 text-xs text-slate-500">Set the parameters above and click “Generate plan”.</p></div>
        )}
      </div>
    </Modal>
  )
}
