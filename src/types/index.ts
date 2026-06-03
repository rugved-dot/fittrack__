export interface Profile {
  name: string
  weight_kg: number
  target_weight_kg: number
  height_cm: number
  age: number
  calories_goal: number
  protein_goal_g: number
  carbs_goal_g: number
  fat_goal_g: number
}

export interface WeightLog {
  id?: string
  user_id?: string
  date: string
  weight_kg: number
}

export interface SetData {
  weight: number
  reps: number
  done: boolean
}

export interface ExerciseData {
  name: string
  sets: SetData[]
}

export interface WorkoutLog {
  id?: string
  user_id?: string
  date: string
  template_name: string
  exercises: ExerciseData[]
}

export interface FoodLog {
  id?: string
  user_id?: string
  date: string
  name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface SleepLog {
  id?: string
  user_id?: string
  date: string
  duration_h: number
  deep_h?: number
  rem_h?: number
  score?: number
}

export interface HeartRateLog {
  id?: string
  user_id?: string
  date: string
  avg: number
  min?: number
  max?: number
  resting?: number
}

export interface StepLog {
  id?: string
  user_id?: string
  date: string
  steps: number
  distance_km?: number
  calories?: number
}

export interface StressLog {
  id?: string
  user_id?: string
  date: string
  avg: number
  max?: number
}

export interface Spo2Log {
  id?: string
  user_id?: string
  date: string
  avg: number
  min?: number
}

export interface BodyFatLog {
  id?: string
  user_id?: string
  date: string
  body_fat_pct: number
  muscle_mass_kg?: number
  bmi?: number
}
