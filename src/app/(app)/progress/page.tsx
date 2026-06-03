import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/data'
import ProgressClient from './ProgressClient'

async function getData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { weightLogs: [], workoutLogs: [], foodByDate: {}, profile: null }

  const last30 = new Date(); last30.setDate(last30.getDate() - 30)
  const [{ data: weights }, { data: workouts }, { data: foods }, profile] = await Promise.all([
    supabase.from('weight_logs').select('*').eq('user_id', user.id).order('date').limit(30),
    supabase.from('workout_logs').select('date,template_name').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
    supabase.from('food_logs').select('date,calories,protein_g').eq('user_id', user.id).gte('date', last30.toISOString().slice(0, 10)),
    getProfile(),
  ])

  const foodByDate: Record<string, { calories: number; protein: number }> = {}
  for (const f of (foods ?? [])) {
    if (!foodByDate[f.date]) foodByDate[f.date] = { calories: 0, protein: 0 }
    foodByDate[f.date].calories += f.calories
    foodByDate[f.date].protein += f.protein_g
  }

  return { weightLogs: weights ?? [], workoutLogs: workouts ?? [], foodByDate, profile }
}

export default async function ProgressPage() {
  const data = await getData()
  return <ProgressClient {...data} />
}
