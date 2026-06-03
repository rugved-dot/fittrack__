import { createClient } from '@/lib/supabase/server'
import { TEMPLATES } from '@/lib/constants'
import WorkoutClient from './WorkoutClient'

async function getData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { workoutLogs: [] }

  const { data } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  return { workoutLogs: data ?? [] }
}

export default async function WorkoutPage() {
  const { workoutLogs } = await getData()
  return <WorkoutClient workoutLogs={workoutLogs} templates={TEMPLATES} />
}
