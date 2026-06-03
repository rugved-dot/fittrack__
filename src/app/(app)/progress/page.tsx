import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/data'
import ProgressClient from './ProgressClient'

async function getData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { weightLogs: [], workoutLogs: [], foodByDate: {}, profile: null, health: {}, bodyFatLogs: [] }

  const last30 = new Date(); last30.setDate(last30.getDate() - 30)
  const last7 = new Date(); last7.setDate(last7.getDate() - 7)
  const last7str = last7.toISOString().slice(0, 10)
  const last30str = last30.toISOString().slice(0, 10)

  const [
    { data: weights }, { data: workouts }, { data: foods }, profile,
    { data: sleepLogs }, { data: stepLogs }, { data: hrLogs }, { data: stressLogs },
    { data: bodyFatLogs },
  ] = await Promise.all([
    supabase.from('weight_logs').select('*').eq('user_id', user.id).order('date').limit(60),
    supabase.from('workout_logs').select('date,template_name').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
    supabase.from('food_logs').select('date,calories,protein_g').eq('user_id', user.id).gte('date', last30str),
    getProfile(),
    supabase.from('sleep_logs').select('*').eq('user_id', user.id).gte('date', last7str).order('date'),
    supabase.from('step_logs').select('*').eq('user_id', user.id).gte('date', last7str).order('date'),
    supabase.from('heart_rate_logs').select('*').eq('user_id', user.id).gte('date', last7str).order('date'),
    supabase.from('stress_logs').select('*').eq('user_id', user.id).gte('date', last7str).order('date'),
    supabase.from('body_fat_logs').select('*').eq('user_id', user.id).order('date').limit(60),
  ])

  const foodByDate: Record<string, { calories: number; protein: number }> = {}
  for (const f of (foods ?? [])) {
    if (!foodByDate[f.date]) foodByDate[f.date] = { calories: 0, protein: 0 }
    foodByDate[f.date].calories += f.calories
    foodByDate[f.date].protein += f.protein_g
  }

  return {
    weightLogs: weights ?? [],
    workoutLogs: workouts ?? [],
    foodByDate,
    profile,
    health: {
      sleep: sleepLogs ?? [],
      steps: stepLogs ?? [],
      hr: hrLogs ?? [],
      stress: stressLogs ?? [],
    },
    bodyFatLogs: bodyFatLogs ?? [],
  }
}

export default async function ProgressPage() {
  const data = await getData()
  return <ProgressClient {...data} />
}
