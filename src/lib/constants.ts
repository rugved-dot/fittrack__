export const EXERCISE_LIBRARY: Record<string, string[]> = {
  Chest: ['Bench Press','Incline Bench Press','Decline Bench Press','DB Fly','Cable Fly','Push-ups','Dips','Incline DB Press','Close Grip Bench'],
  Back: ['Deadlift','Pull-ups','Lat Pulldown','Barbell Row','Cable Row','Single-arm DB Row','Chest-supported Row','Face Pulls','T-Bar Row','Seated Cable Row','Rack Pull'],
  Shoulders: ['Overhead Press','DB Shoulder Press','Arnold Press','Lateral Raises','Front Raises','Reverse Fly','Cable Lateral Raise','Shrugs'],
  Biceps: ['Barbell Curl','Hammer Curl','Incline Curl','Preacher Curl','Cable Curl','Concentration Curl','Spider Curl'],
  Triceps: ['Tricep Pushdown','Overhead Tricep Ext.','Tricep Dips','Skull Crushers','Close Grip Bench','Cable Kickback','Diamond Push-ups'],
  Legs: ['Squat','Front Squat','Romanian Deadlift','Leg Press','Hack Squat','Lunges','Leg Curl','Leg Extension','Calf Raises','Hip Thrust','Bulgarian Split Squat','Step-ups','Seated Leg Curl','Standing Calf'],
  Core: ['Plank','Crunches','Leg Raises','Russian Twists','Cable Crunch','Ab Wheel','Hanging Knee Raise','Side Plank','Dead Bug'],
  Cardio: ['Treadmill Run','Stationary Bike','Jump Rope','Rowing Machine','Stair Climber','HIIT Sprint','Swimming'],
}

export const ALL_EXERCISES = Object.entries(EXERCISE_LIBRARY).flatMap(([cat, exs]) =>
  exs.map(name => ({ name, cat }))
)

export const TEMPLATES: Record<string, { name: string; sets: number; reps: number }[]> = {
  'Push A': [
    { name: 'Bench Press', sets: 4, reps: 8 },
    { name: 'Overhead Press', sets: 3, reps: 10 },
    { name: 'Incline DB Press', sets: 3, reps: 12 },
    { name: 'Lateral Raises', sets: 3, reps: 15 },
    { name: 'Tricep Pushdown', sets: 3, reps: 15 },
    { name: 'Overhead Tricep Ext.', sets: 3, reps: 12 },
  ],
  'Pull A': [
    { name: 'Deadlift', sets: 4, reps: 5 },
    { name: 'Pull-ups', sets: 4, reps: 8 },
    { name: 'Barbell Row', sets: 3, reps: 10 },
    { name: 'Cable Row', sets: 3, reps: 12 },
    { name: 'Face Pulls', sets: 3, reps: 15 },
    { name: 'Barbell Curl', sets: 3, reps: 12 },
    { name: 'Hammer Curl', sets: 3, reps: 12 },
  ],
  'Legs A': [
    { name: 'Squat', sets: 4, reps: 8 },
    { name: 'Romanian Deadlift', sets: 3, reps: 10 },
    { name: 'Leg Press', sets: 3, reps: 12 },
    { name: 'Leg Curl', sets: 3, reps: 12 },
    { name: 'Leg Extension', sets: 3, reps: 15 },
    { name: 'Calf Raises', sets: 4, reps: 20 },
  ],
  'Push B': [
    { name: 'Incline Bench Press', sets: 4, reps: 8 },
    { name: 'DB Shoulder Press', sets: 3, reps: 10 },
    { name: 'Cable Fly', sets: 3, reps: 15 },
    { name: 'Front Raises', sets: 3, reps: 12 },
    { name: 'Tricep Dips', sets: 3, reps: 12 },
    { name: 'Close Grip Bench', sets: 3, reps: 10 },
  ],
  'Pull B': [
    { name: 'Pull-ups', sets: 4, reps: 6 },
    { name: 'Single-arm DB Row', sets: 3, reps: 10 },
    { name: 'Chest-supported Row', sets: 3, reps: 12 },
    { name: 'Reverse Fly', sets: 3, reps: 15 },
    { name: 'Preacher Curl', sets: 3, reps: 12 },
    { name: 'Incline Curl', sets: 3, reps: 12 },
  ],
  'Legs B': [
    { name: 'Front Squat', sets: 4, reps: 8 },
    { name: 'Lunges', sets: 3, reps: 12 },
    { name: 'Hack Squat', sets: 3, reps: 10 },
    { name: 'Seated Leg Curl', sets: 3, reps: 12 },
    { name: 'Hip Thrust', sets: 3, reps: 12 },
    { name: 'Standing Calf', sets: 4, reps: 20 },
  ],
}

// ─── FOOD DATABASE ────────────────────────────────────────────────────────────
// Sources: ICMR-NIN Indian Food Composition Tables, USDA FoodData Central,
// nutritionix.com. All values per standard serving unless noted.
// Fields: calories (kcal), protein_g, carbs_g, fat_g

export interface FoodItem {
  name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  category: string
}

export const FOODS_DB: FoodItem[] = [
  // ── INDIAN BREAKFAST ────────────────────────────────────────
  { name: 'Idli (2 pieces)', calories: 130, protein_g: 4, carbs_g: 26, fat_g: 0.8, category: 'Indian Breakfast' },
  { name: 'Plain Dosa (1 medium)', calories: 168, protein_g: 3.7, carbs_g: 34, fat_g: 2.6, category: 'Indian Breakfast' },
  { name: 'Masala Dosa (1)', calories: 280, protein_g: 6, carbs_g: 45, fat_g: 8, category: 'Indian Breakfast' },
  { name: 'Uttapam (1 medium)', calories: 120, protein_g: 3.5, carbs_g: 20, fat_g: 3, category: 'Indian Breakfast' },
  { name: 'Poha (100g cooked)', calories: 180, protein_g: 3, carbs_g: 36, fat_g: 2, category: 'Indian Breakfast' },
  { name: 'Upma (100g)', calories: 120, protein_g: 3, carbs_g: 22, fat_g: 2.5, category: 'Indian Breakfast' },
  { name: 'Plain Paratha (1)', calories: 150, protein_g: 3, carbs_g: 22, fat_g: 5.5, category: 'Indian Breakfast' },
  { name: 'Aloo Paratha (1)', calories: 200, protein_g: 4, carbs_g: 30, fat_g: 7, category: 'Indian Breakfast' },
  { name: 'Besan Chilla (1)', calories: 150, protein_g: 7, carbs_g: 20, fat_g: 4, category: 'Indian Breakfast' },
  { name: 'Medu Vada (1)', calories: 97, protein_g: 3.5, carbs_g: 13, fat_g: 3.5, category: 'Indian Breakfast' },
  { name: 'Pesarattu (1)', calories: 100, protein_g: 5, carbs_g: 16, fat_g: 2, category: 'Indian Breakfast' },
  { name: 'Thepla (1)', calories: 110, protein_g: 3, carbs_g: 16, fat_g: 4, category: 'Indian Breakfast' },
  { name: 'Puri (1)', calories: 110, protein_g: 2, carbs_g: 13, fat_g: 5.5, category: 'Indian Breakfast' },
  { name: 'Dhokla (2 pieces)', calories: 80, protein_g: 4, carbs_g: 14, fat_g: 1, category: 'Indian Breakfast' },
  { name: 'Missi Roti (1)', calories: 100, protein_g: 4, carbs_g: 17, fat_g: 2.5, category: 'Indian Breakfast' },

  // ── INDIAN ROTIS & BREADS ────────────────────────────────────
  { name: 'Roti / Chapati (1)', calories: 71, protein_g: 2.5, carbs_g: 15, fat_g: 0.5, category: 'Indian Bread' },
  { name: 'Multigrain Roti (1)', calories: 80, protein_g: 3, carbs_g: 15, fat_g: 1.5, category: 'Indian Bread' },
  { name: 'Naan (1 medium)', calories: 262, protein_g: 9, carbs_g: 45, fat_g: 5, category: 'Indian Bread' },
  { name: 'Kulcha (1)', calories: 180, protein_g: 5, carbs_g: 33, fat_g: 3, category: 'Indian Bread' },

  // ── INDIAN RICE & GRAINS ─────────────────────────────────────
  { name: 'White Rice (100g cooked)', calories: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, category: 'Indian Rice' },
  { name: 'Brown Rice (100g cooked)', calories: 112, protein_g: 2.6, carbs_g: 24, fat_g: 0.8, category: 'Indian Rice' },
  { name: 'Jeera Rice (100g)', calories: 145, protein_g: 3, carbs_g: 28, fat_g: 2.5, category: 'Indian Rice' },
  { name: 'Khichdi (100g)', calories: 130, protein_g: 5, carbs_g: 24, fat_g: 2, category: 'Indian Rice' },
  { name: 'Veg Pulao (100g)', calories: 140, protein_g: 3, carbs_g: 28, fat_g: 2, category: 'Indian Rice' },
  { name: 'Chicken Biryani (200g)', calories: 350, protein_g: 22, carbs_g: 45, fat_g: 8, category: 'Indian Rice' },
  { name: 'Veg Biryani (200g)', calories: 280, protein_g: 7, carbs_g: 52, fat_g: 5, category: 'Indian Rice' },
  { name: 'Egg Fried Rice (100g)', calories: 160, protein_g: 5, carbs_g: 28, fat_g: 4, category: 'Indian Rice' },

  // ── INDIAN DALS & LEGUMES ────────────────────────────────────
  { name: 'Dal Tadka (100g)', calories: 116, protein_g: 7, carbs_g: 18, fat_g: 2.5, category: 'Indian Dal' },
  { name: 'Dal Makhani (100g)', calories: 152, protein_g: 8, carbs_g: 18, fat_g: 5, category: 'Indian Dal' },
  { name: 'Moong Dal (100g cooked)', calories: 104, protein_g: 7, carbs_g: 19, fat_g: 0.4, category: 'Indian Dal' },
  { name: 'Masoor Dal (100g cooked)', calories: 116, protein_g: 9, carbs_g: 20, fat_g: 0.4, category: 'Indian Dal' },
  { name: 'Chana Dal (100g cooked)', calories: 164, protein_g: 9, carbs_g: 27, fat_g: 2.5, category: 'Indian Dal' },
  { name: 'Rajma (100g cooked)', calories: 127, protein_g: 8.7, carbs_g: 22, fat_g: 0.5, category: 'Indian Dal' },
  { name: 'Chole / Chickpeas (100g)', calories: 164, protein_g: 9, carbs_g: 27, fat_g: 2.6, category: 'Indian Dal' },
  { name: 'Lobia (100g cooked)', calories: 116, protein_g: 8, carbs_g: 21, fat_g: 0.4, category: 'Indian Dal' },
  { name: 'Urad Dal (100g cooked)', calories: 127, protein_g: 9, carbs_g: 22, fat_g: 0.5, category: 'Indian Dal' },

  // ── INDIAN CURRIES ───────────────────────────────────────────
  { name: 'Paneer Butter Masala (100g)', calories: 180, protein_g: 9, carbs_g: 8, fat_g: 13, category: 'Indian Curry' },
  { name: 'Palak Paneer (100g)', calories: 140, protein_g: 8, carbs_g: 7, fat_g: 9, category: 'Indian Curry' },
  { name: 'Kadai Paneer (100g)', calories: 175, protein_g: 9, carbs_g: 8, fat_g: 12, category: 'Indian Curry' },
  { name: 'Matar Paneer (100g)', calories: 145, protein_g: 7, carbs_g: 10, fat_g: 9, category: 'Indian Curry' },
  { name: 'Butter Chicken (100g)', calories: 160, protein_g: 18, carbs_g: 6, fat_g: 7, category: 'Indian Curry' },
  { name: 'Chicken Curry (200g)', calories: 300, protein_g: 28, carbs_g: 8, fat_g: 18, category: 'Indian Curry' },
  { name: 'Chicken Tikka (100g)', calories: 165, protein_g: 25, carbs_g: 5, fat_g: 5, category: 'Indian Curry' },
  { name: 'Mutton Curry (100g)', calories: 180, protein_g: 18, carbs_g: 4, fat_g: 10, category: 'Indian Curry' },
  { name: 'Fish Curry (100g)', calories: 120, protein_g: 15, carbs_g: 5, fat_g: 4.5, category: 'Indian Curry' },
  { name: 'Egg Curry (2 eggs)', calories: 210, protein_g: 14, carbs_g: 6, fat_g: 15, category: 'Indian Curry' },
  { name: 'Aloo Matar (100g)', calories: 90, protein_g: 3, carbs_g: 15, fat_g: 2.5, category: 'Indian Curry' },
  { name: 'Baingan Bharta (100g)', calories: 65, protein_g: 2, carbs_g: 8, fat_g: 3, category: 'Indian Curry' },
  { name: 'Bhindi Masala (100g)', calories: 70, protein_g: 2, carbs_g: 8, fat_g: 3.5, category: 'Indian Curry' },
  { name: 'Chapati with Dal (1 plate)', calories: 300, protein_g: 12, carbs_g: 50, fat_g: 5, category: 'Indian Curry' },
  { name: 'Chapati with Sabzi (1 plate)', calories: 350, protein_g: 10, carbs_g: 52, fat_g: 12, category: 'Indian Curry' },

  // ── INDIAN DAIRY ─────────────────────────────────────────────
  { name: 'Paneer (100g)', calories: 265, protein_g: 18, carbs_g: 3, fat_g: 20, category: 'Indian Dairy' },
  { name: 'Curd / Dahi (100g)', calories: 61, protein_g: 3.5, carbs_g: 4.7, fat_g: 3.3, category: 'Indian Dairy' },
  { name: 'Raita (100g)', calories: 65, protein_g: 3, carbs_g: 6, fat_g: 3, category: 'Indian Dairy' },
  { name: 'Lassi Sweet (200ml)', calories: 170, protein_g: 6, carbs_g: 28, fat_g: 4, category: 'Indian Dairy' },
  { name: 'Lassi Salted (200ml)', calories: 100, protein_g: 5, carbs_g: 10, fat_g: 4, category: 'Indian Dairy' },
  { name: 'Buttermilk / Chaas (200ml)', calories: 40, protein_g: 2, carbs_g: 5, fat_g: 1, category: 'Indian Dairy' },
  { name: 'Milk Full Fat (200ml)', calories: 130, protein_g: 6.6, carbs_g: 9.6, fat_g: 7.2, category: 'Indian Dairy' },
  { name: 'Milk Toned (200ml)', calories: 84, protein_g: 6.4, carbs_g: 9.4, fat_g: 2, category: 'Indian Dairy' },

  // ── INDIAN SNACKS ────────────────────────────────────────────
  { name: 'Samosa (1 medium)', calories: 150, protein_g: 3, carbs_g: 18, fat_g: 7, category: 'Indian Snacks' },
  { name: 'Pakora / Bhajiya (4 pcs)', calories: 180, protein_g: 4, carbs_g: 22, fat_g: 8, category: 'Indian Snacks' },
  { name: 'Bhel Puri (1 plate)', calories: 180, protein_g: 4, carbs_g: 35, fat_g: 3, category: 'Indian Snacks' },
  { name: 'Pani Puri (6 pcs)', calories: 200, protein_g: 4, carbs_g: 38, fat_g: 4, category: 'Indian Snacks' },
  { name: 'Aloo Tikki (1)', calories: 120, protein_g: 2.5, carbs_g: 18, fat_g: 4.5, category: 'Indian Snacks' },
  { name: 'Kachori (1)', calories: 200, protein_g: 4, carbs_g: 22, fat_g: 10, category: 'Indian Snacks' },
  { name: 'Pav Bhaji (1 serving)', calories: 380, protein_g: 9, carbs_g: 55, fat_g: 13, category: 'Indian Snacks' },
  { name: 'Vada Pav (1)', calories: 300, protein_g: 7, carbs_g: 42, fat_g: 11, category: 'Indian Snacks' },
  { name: 'Roasted Chana (30g)', calories: 120, protein_g: 8, carbs_g: 16, fat_g: 2, category: 'Indian Snacks' },
  { name: 'Makhana / Fox Nuts (30g)', calories: 107, protein_g: 3.5, carbs_g: 22, fat_g: 0.5, category: 'Indian Snacks' },
  { name: 'Chakli (3 pcs)', calories: 150, protein_g: 2.5, carbs_g: 18, fat_g: 7.5, category: 'Indian Snacks' },

  // ── INDIAN SWEETS ────────────────────────────────────────────
  { name: 'Gulab Jamun (2 pcs)', calories: 380, protein_g: 6, carbs_g: 55, fat_g: 15, category: 'Indian Sweets' },
  { name: 'Kheer (100g)', calories: 180, protein_g: 5, carbs_g: 28, fat_g: 5, category: 'Indian Sweets' },
  { name: 'Halwa (100g)', calories: 280, protein_g: 4, carbs_g: 40, fat_g: 12, category: 'Indian Sweets' },
  { name: 'Jalebi (2 pcs)', calories: 160, protein_g: 1.5, carbs_g: 33, fat_g: 3, category: 'Indian Sweets' },

  // ── CONTINENTAL PROTEINS ─────────────────────────────────────
  { name: 'Chicken Breast (100g)', calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, category: 'Protein' },
  { name: 'Chicken Thigh (100g)', calories: 209, protein_g: 26, carbs_g: 0, fat_g: 11, category: 'Protein' },
  { name: 'Grilled Salmon (100g)', calories: 182, protein_g: 25, carbs_g: 0, fat_g: 8, category: 'Protein' },
  { name: 'Tuna Canned in Water (100g)', calories: 130, protein_g: 29, carbs_g: 0, fat_g: 1, category: 'Protein' },
  { name: 'Turkey Breast (100g)', calories: 135, protein_g: 30, carbs_g: 0, fat_g: 1, category: 'Protein' },
  { name: 'Lean Beef / Steak (100g)', calories: 217, protein_g: 26, carbs_g: 0, fat_g: 12, category: 'Protein' },
  { name: 'Pork Loin (100g)', calories: 143, protein_g: 26, carbs_g: 0, fat_g: 4, category: 'Protein' },
  { name: 'Shrimp (100g)', calories: 99, protein_g: 24, carbs_g: 0.2, fat_g: 0.3, category: 'Protein' },
  { name: 'Sardines in Oil (100g)', calories: 208, protein_g: 25, carbs_g: 0, fat_g: 11, category: 'Protein' },
  { name: 'Cottage Cheese (100g)', calories: 98, protein_g: 11, carbs_g: 3.4, fat_g: 4.3, category: 'Protein' },
  { name: 'Eggs (1 whole)', calories: 78, protein_g: 6, carbs_g: 0.6, fat_g: 5, category: 'Protein' },
  { name: 'Egg White (1)', calories: 17, protein_g: 3.6, carbs_g: 0.2, fat_g: 0.1, category: 'Protein' },
  { name: 'Boiled Eggs (2)', calories: 156, protein_g: 12, carbs_g: 1.2, fat_g: 10, category: 'Protein' },

  // ── CONTINENTAL DAIRY ────────────────────────────────────────
  { name: 'Greek Yogurt (100g)', calories: 59, protein_g: 10, carbs_g: 3.6, fat_g: 0.4, category: 'Dairy' },
  { name: 'Skim Milk (200ml)', calories: 70, protein_g: 6.8, carbs_g: 9.9, fat_g: 0.2, category: 'Dairy' },
  { name: 'Cheddar Cheese (30g)', calories: 120, protein_g: 7, carbs_g: 0.4, fat_g: 10, category: 'Dairy' },
  { name: 'Mozzarella (30g)', calories: 85, protein_g: 6.3, carbs_g: 0.6, fat_g: 6.3, category: 'Dairy' },
  { name: 'Butter (10g)', calories: 72, protein_g: 0.1, carbs_g: 0, fat_g: 8, category: 'Dairy' },

  // ── CONTINENTAL CARBS ────────────────────────────────────────
  { name: 'Oats Rolled (100g dry)', calories: 389, protein_g: 17, carbs_g: 66, fat_g: 7, category: 'Carbs' },
  { name: 'Whole Wheat Pasta (100g dry)', calories: 348, protein_g: 13, carbs_g: 70, fat_g: 2.5, category: 'Carbs' },
  { name: 'White Pasta (100g dry)', calories: 371, protein_g: 13, carbs_g: 74, fat_g: 1.8, category: 'Carbs' },
  { name: 'Potato Boiled (100g)', calories: 87, protein_g: 1.9, carbs_g: 20, fat_g: 0.1, category: 'Carbs' },
  { name: 'Sweet Potato (100g)', calories: 86, protein_g: 1.6, carbs_g: 20, fat_g: 0.1, category: 'Carbs' },
  { name: 'White Bread (1 slice)', calories: 79, protein_g: 2.7, carbs_g: 15, fat_g: 1, category: 'Carbs' },
  { name: 'Whole Wheat Bread (1 slice)', calories: 69, protein_g: 3.6, carbs_g: 12, fat_g: 1, category: 'Carbs' },
  { name: 'Quinoa (100g cooked)', calories: 120, protein_g: 4.4, carbs_g: 22, fat_g: 1.9, category: 'Carbs' },
  { name: 'Couscous (100g cooked)', calories: 112, protein_g: 3.8, carbs_g: 23, fat_g: 0.2, category: 'Carbs' },
  { name: 'Cornflakes (30g)', calories: 114, protein_g: 2.4, carbs_g: 25, fat_g: 0.3, category: 'Carbs' },

  // ── FRUITS ───────────────────────────────────────────────────
  { name: 'Banana (1 medium)', calories: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3, category: 'Fruits' },
  { name: 'Apple (1 medium)', calories: 95, protein_g: 0.5, carbs_g: 25, fat_g: 0.3, category: 'Fruits' },
  { name: 'Orange (1 medium)', calories: 62, protein_g: 1.2, carbs_g: 15, fat_g: 0.2, category: 'Fruits' },
  { name: 'Mango (100g)', calories: 60, protein_g: 0.8, carbs_g: 15, fat_g: 0.4, category: 'Fruits' },
  { name: 'Papaya (100g)', calories: 43, protein_g: 0.5, carbs_g: 11, fat_g: 0.3, category: 'Fruits' },
  { name: 'Guava (100g)', calories: 68, protein_g: 2.6, carbs_g: 14, fat_g: 1, category: 'Fruits' },
  { name: 'Pomegranate (100g)', calories: 83, protein_g: 1.7, carbs_g: 19, fat_g: 1.2, category: 'Fruits' },
  { name: 'Watermelon (100g)', calories: 30, protein_g: 0.6, carbs_g: 7.6, fat_g: 0.2, category: 'Fruits' },
  { name: 'Strawberries (100g)', calories: 32, protein_g: 0.7, carbs_g: 7.7, fat_g: 0.3, category: 'Fruits' },
  { name: 'Blueberries (100g)', calories: 57, protein_g: 0.7, carbs_g: 14, fat_g: 0.3, category: 'Fruits' },
  { name: 'Grapes (100g)', calories: 69, protein_g: 0.7, carbs_g: 18, fat_g: 0.2, category: 'Fruits' },
  { name: 'Pineapple (100g)', calories: 50, protein_g: 0.5, carbs_g: 13, fat_g: 0.1, category: 'Fruits' },
  { name: 'Kiwi (1 medium)', calories: 42, protein_g: 0.8, carbs_g: 10, fat_g: 0.4, category: 'Fruits' },
  { name: 'Dates (2 pcs)', calories: 110, protein_g: 0.8, carbs_g: 29, fat_g: 0.1, category: 'Fruits' },

  // ── VEGETABLES ───────────────────────────────────────────────
  { name: 'Broccoli (100g)', calories: 34, protein_g: 2.8, carbs_g: 7, fat_g: 0.4, category: 'Vegetables' },
  { name: 'Spinach (100g)', calories: 23, protein_g: 2.9, carbs_g: 3.6, fat_g: 0.4, category: 'Vegetables' },
  { name: 'Kale (100g)', calories: 49, protein_g: 4.3, carbs_g: 9, fat_g: 0.9, category: 'Vegetables' },
  { name: 'Cauliflower (100g)', calories: 25, protein_g: 1.9, carbs_g: 5, fat_g: 0.3, category: 'Vegetables' },
  { name: 'Carrots (100g)', calories: 41, protein_g: 0.9, carbs_g: 10, fat_g: 0.2, category: 'Vegetables' },
  { name: 'Cucumber (100g)', calories: 15, protein_g: 0.7, carbs_g: 3.6, fat_g: 0.1, category: 'Vegetables' },
  { name: 'Tomato (1 medium)', calories: 22, protein_g: 1.1, carbs_g: 4.8, fat_g: 0.2, category: 'Vegetables' },
  { name: 'Capsicum / Bell Pepper (100g)', calories: 31, protein_g: 1, carbs_g: 6, fat_g: 0.3, category: 'Vegetables' },
  { name: 'Mushrooms (100g)', calories: 22, protein_g: 3.1, carbs_g: 3.3, fat_g: 0.3, category: 'Vegetables' },
  { name: 'Peas (100g cooked)', calories: 84, protein_g: 5.4, carbs_g: 15, fat_g: 0.4, category: 'Vegetables' },
  { name: 'Corn (100g)', calories: 96, protein_g: 3.4, carbs_g: 21, fat_g: 1.5, category: 'Vegetables' },
  { name: 'Avocado (100g)', calories: 160, protein_g: 2, carbs_g: 9, fat_g: 15, category: 'Vegetables' },

  // ── NUTS & FATS ───────────────────────────────────────────────
  { name: 'Almonds (28g)', calories: 164, protein_g: 6, carbs_g: 6, fat_g: 14, category: 'Nuts & Seeds' },
  { name: 'Cashews (28g)', calories: 157, protein_g: 5, carbs_g: 9, fat_g: 12, category: 'Nuts & Seeds' },
  { name: 'Walnuts (28g)', calories: 185, protein_g: 4.3, carbs_g: 3.9, fat_g: 18.5, category: 'Nuts & Seeds' },
  { name: 'Peanuts (28g)', calories: 161, protein_g: 7, carbs_g: 5, fat_g: 14, category: 'Nuts & Seeds' },
  { name: 'Pistachios (28g)', calories: 159, protein_g: 6, carbs_g: 8, fat_g: 13, category: 'Nuts & Seeds' },
  { name: 'Peanut Butter (1 tbsp)', calories: 94, protein_g: 4, carbs_g: 3, fat_g: 8, category: 'Nuts & Seeds' },
  { name: 'Almond Butter (1 tbsp)', calories: 98, protein_g: 3.4, carbs_g: 3, fat_g: 9, category: 'Nuts & Seeds' },
  { name: 'Chia Seeds (1 tbsp)', calories: 49, protein_g: 1.7, carbs_g: 4.2, fat_g: 3.1, category: 'Nuts & Seeds' },
  { name: 'Flaxseeds (1 tbsp)', calories: 55, protein_g: 1.9, carbs_g: 3, fat_g: 4.3, category: 'Nuts & Seeds' },
  { name: 'Olive Oil (1 tbsp)', calories: 119, protein_g: 0, carbs_g: 0, fat_g: 14, category: 'Nuts & Seeds' },

  // ── SUPPLEMENTS & GYM FOODS ──────────────────────────────────
  { name: 'Whey Protein (1 scoop 30g)', calories: 120, protein_g: 25, carbs_g: 3, fat_g: 1.5, category: 'Supplements' },
  { name: 'Casein Protein (1 scoop 30g)', calories: 110, protein_g: 24, carbs_g: 4, fat_g: 1, category: 'Supplements' },
  { name: 'Mass Gainer (1 scoop 80g)', calories: 350, protein_g: 20, carbs_g: 60, fat_g: 3, category: 'Supplements' },
  { name: 'Protein Bar (~60g)', calories: 220, protein_g: 20, carbs_g: 22, fat_g: 7, category: 'Supplements' },
  { name: 'Protein Shake with Milk (350ml)', calories: 250, protein_g: 31, carbs_g: 15, fat_g: 8, category: 'Supplements' },
  { name: 'Banana Protein Shake (400ml)', calories: 320, protein_g: 26, carbs_g: 40, fat_g: 5, category: 'Supplements' },
  { name: 'Banana Shake (300ml)', calories: 280, protein_g: 8, carbs_g: 45, fat_g: 7, category: 'Supplements' },

  // ── BEVERAGES ─────────────────────────────────────────────────
  { name: 'Black Coffee (1 cup)', calories: 2, protein_g: 0.3, carbs_g: 0, fat_g: 0, category: 'Beverages' },
  { name: 'Coffee with Milk (200ml)', calories: 50, protein_g: 2.5, carbs_g: 5, fat_g: 2, category: 'Beverages' },
  { name: 'Masala Chai (200ml)', calories: 80, protein_g: 2, carbs_g: 12, fat_g: 2.5, category: 'Beverages' },
  { name: 'Green Tea (1 cup)', calories: 2, protein_g: 0, carbs_g: 0.5, fat_g: 0, category: 'Beverages' },
  { name: 'Orange Juice (200ml)', calories: 88, protein_g: 1.2, carbs_g: 21, fat_g: 0.3, category: 'Beverages' },
  { name: 'Coconut Water (200ml)', calories: 38, protein_g: 0.4, carbs_g: 9, fat_g: 0.2, category: 'Beverages' },
  { name: 'Whole Milk (200ml)', calories: 130, protein_g: 6.6, carbs_g: 9.6, fat_g: 7.2, category: 'Beverages' },

  // ── CONTINENTAL MEALS ─────────────────────────────────────────
  { name: 'Grilled Chicken Salad (300g)', calories: 280, protein_g: 35, carbs_g: 10, fat_g: 10, category: 'Continental' },
  { name: 'Caesar Salad (200g)', calories: 310, protein_g: 14, carbs_g: 16, fat_g: 22, category: 'Continental' },
  { name: 'Omelette 3 eggs', calories: 280, protein_g: 20, carbs_g: 2, fat_g: 21, category: 'Continental' },
  { name: 'Scrambled Eggs 3 eggs', calories: 260, protein_g: 18, carbs_g: 2, fat_g: 20, category: 'Continental' },
  { name: 'Pasta with Chicken (250g)', calories: 420, protein_g: 32, carbs_g: 50, fat_g: 9, category: 'Continental' },
  { name: 'Grilled Chicken Sandwich', calories: 350, protein_g: 30, carbs_g: 35, fat_g: 9, category: 'Continental' },
  { name: 'Tuna Salad Sandwich', calories: 310, protein_g: 25, carbs_g: 30, fat_g: 8, category: 'Continental' },
  { name: 'Pizza Slice (cheese, 1 slice)', calories: 285, protein_g: 12, carbs_g: 36, fat_g: 10, category: 'Continental' },
  { name: 'Burger (chicken)', calories: 450, protein_g: 28, carbs_g: 40, fat_g: 18, category: 'Continental' },
  { name: 'French Fries (medium)', calories: 365, protein_g: 4, carbs_g: 48, fat_g: 17, category: 'Continental' },
  { name: 'Soup Tomato (200ml)', calories: 74, protein_g: 2, carbs_g: 14, fat_g: 1.5, category: 'Continental' },
  { name: 'Soup Chicken (200ml)', calories: 90, protein_g: 8, carbs_g: 8, fat_g: 2.5, category: 'Continental' },
  { name: 'Overnight Oats (300g)', calories: 350, protein_g: 14, carbs_g: 55, fat_g: 8, category: 'Continental' },
  { name: 'Avocado Toast (1 slice)', calories: 195, protein_g: 5, carbs_g: 18, fat_g: 11, category: 'Continental' },
  { name: 'Greek Salad (200g)', calories: 180, protein_g: 5, carbs_g: 10, fat_g: 13, category: 'Continental' },
]

export const FOOD_CATEGORIES = [
  'All',
  'Indian Breakfast',
  'Indian Bread',
  'Indian Rice',
  'Indian Dal',
  'Indian Curry',
  'Indian Dairy',
  'Indian Snacks',
  'Indian Sweets',
  'Protein',
  'Dairy',
  'Carbs',
  'Fruits',
  'Vegetables',
  'Nuts & Seeds',
  'Supplements',
  'Beverages',
  'Continental',
]
