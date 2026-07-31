/**
 * Seed a fully filled test account for local QA.
 * Run: npx tsx scripts/seed-test-user.ts
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../src/lib/mongodb';
import User from '../src/models/User';
import DietPlan from '../src/models/DietPlan';

const EMAIL = 'test@mealdeal.com';
const PASSWORD = 'Test@1234';

function sampleDay(seed: number) {
  const meals = [
    {
      name: 'Breakfast',
      time: '7:30 AM',
      foods: [
        {
          item: 'Oats + Peanut Butter + Banana Bowl',
          quantity: '1 bowl',
          calories: 380,
          protein: 14,
          carbs: 52,
          fats: 14,
          estimatedCost: 45,
          brand: 'Quaker + Pintola',
          recipe: 'Cook oats, stir PB, top with banana.',
          benefits: 'B vitamins + pre-workout carbs.',
          source: 'market',
        },
      ],
      totalCalories: 380,
      totalProtein: 14,
      totalCarbs: 52,
      totalFats: 14,
      totalCost: 45,
    },
    {
      name: 'Pre-Workout Snack',
      time: '4:30 PM',
      foods: [
        {
          item: 'Banana + Black Coffee',
          quantity: '1 banana + 1 cup',
          calories: 120,
          protein: 2,
          carbs: 28,
          fats: 0,
          estimatedCost: 20,
          brand: 'Local fruit',
          recipe: 'Eat banana 30–45 mins before gym.',
          benefits: 'Quick carbs for training.',
          source: 'market',
        },
      ],
      totalCalories: 120,
      totalProtein: 2,
      totalCarbs: 28,
      totalFats: 0,
      totalCost: 20,
    },
    {
      name: 'Post-Workout Meal',
      time: '6:30 PM',
      foods: [
        {
          item: 'Grilled Paneer with Broccoli & Bell Peppers',
          quantity: '150g paneer + veggies',
          calories: 380,
          protein: 28,
          carbs: 14,
          fats: 24,
          estimatedCost: 90,
          brand: 'Amul paneer',
          recipe: 'Grill paneer; sauté broccoli + peppers.',
          benefits: 'High protein recovery + vitamin C.',
          source: 'market',
        },
        {
          item: 'Whey / Plant Protein Shake',
          quantity: '1 scoop',
          calories: 120,
          protein: 24,
          carbs: 3,
          fats: 1,
          estimatedCost: 40,
          brand: 'MuscleBlaze',
          recipe: 'Mix with water.',
          benefits: 'Fast protein post-workout.',
          source: 'market',
        },
      ],
      totalCalories: 500,
      totalProtein: 52,
      totalCarbs: 17,
      totalFats: 25,
      totalCost: 130,
    },
    {
      name: 'Lunch',
      time: '1:00 PM',
      foods: [
        {
          item: seed % 2 === 0 ? 'Dal + Palak Sabzi + Roti' : 'Pesto Protein Pasta',
          quantity: seed % 2 === 0 ? '2 roti + dal + palak' : '1 bowl',
          calories: seed % 2 === 0 ? 420 : 480,
          protein: seed % 2 === 0 ? 18 : 32,
          carbs: seed % 2 === 0 ? 58 : 52,
          fats: seed % 2 === 0 ? 10 : 16,
          estimatedCost: seed % 2 === 0 ? 50 : 90,
          brand: seed % 2 === 0 ? 'Homemade' : 'Barilla',
          recipe: 'Cook as usual.',
          benefits: 'Balanced lunch with variety.',
          source: 'market',
        },
        {
          item: 'Curd with Mixed Berries / Seasonal Fruit',
          quantity: '200g',
          calories: 200,
          protein: 10,
          carbs: 28,
          fats: 5,
          estimatedCost: 50,
          brand: 'Amul dahi',
          recipe: 'Mix curd + fruit.',
          benefits: 'Calcium + probiotics.',
          source: 'market',
        },
      ],
      totalCalories: seed % 2 === 0 ? 620 : 680,
      totalProtein: seed % 2 === 0 ? 28 : 42,
      totalCarbs: seed % 2 === 0 ? 86 : 80,
      totalFats: seed % 2 === 0 ? 15 : 21,
      totalCost: seed % 2 === 0 ? 100 : 140,
    },
    {
      name: 'Dinner',
      time: '8:30 PM',
      foods: [
        {
          item: 'Veggie Omelette (Onion Capsicum Tomato)',
          quantity: '2–3 eggs',
          calories: 280,
          protein: 20,
          carbs: 8,
          fats: 18,
          estimatedCost: 45,
          brand: 'Local eggs',
          recipe: 'Scramble with veggies.',
          benefits: 'Protein + B12.',
          source: 'market',
        },
        {
          item: 'Carrot + Spinach + Lemon Salad',
          quantity: '1 bowl',
          calories: 90,
          protein: 3,
          carbs: 14,
          fats: 3,
          estimatedCost: 25,
          brand: 'Local mandi',
          recipe: 'Toss with lemon.',
          benefits: 'Vitamin A + C.',
          source: 'market',
        },
      ],
      totalCalories: 370,
      totalProtein: 23,
      totalCarbs: 22,
      totalFats: 21,
      totalCost: 70,
    },
  ];

  const dailyTotal = meals.reduce(
    (a, m) => ({
      calories: a.calories + m.totalCalories,
      protein: a.protein + m.totalProtein,
      carbs: a.carbs + m.totalCarbs,
      fats: a.fats + m.totalFats,
      cost: a.cost + m.totalCost,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, cost: 0 }
  );

  return { meals, dailyTotal };
}

async function main() {
  await connectDB();

  const hash = await bcrypt.hash(PASSWORD, 12);

  const user = await User.findOneAndUpdate(
    { email: EMAIL },
    {
      $set: {
        name: 'Test Athlete',
        email: EMAIL,
        password: hash,
        age: 24,
        gender: 'male',
        height: 175,
        weight: 72,
        activityLevel: 'active',
        goal: 'muscle_gain',
        dietaryRestrictions: ['eggetarian'],
        medicalConditions: [],
        budget: 'middle',
        location: {
          country: 'India',
          state: 'Karnataka',
          city: 'Bengaluru',
        },
        additionalInfo: {
          goalDescription: 'Build lean muscle while staying hostel/budget friendly.',
          challenges: 'Irregular mess protein and late-night snacking.',
          expectations: 'Clear meal plan with pre/post workout slots and grocery list.',
          livesInHostel: false,
          messMenuText: '',
        },
        workoutPreferences: {
          gymTiming: 'evening',
          workoutDays: 5,
          preferredType: 'gym',
          availableEquipment: ['dumbbells', 'barbell', 'cables', 'machines'],
          experience: 'intermediate',
          focusAreas: ['chest', 'back', 'legs', 'shoulders'],
        },
        onboardingCompleted: true,
        workoutPlanGenerated: false,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ] as const;

  const weeklyPlan: Record<string, ReturnType<typeof sampleDay>> = {};
  days.forEach((d, i) => {
    weeklyPlan[d] = sampleDay(i);
  });

  await DietPlan.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        userId: user._id,
        dailyCalories: 2400,
        dailyProtein: 150,
        dailyCarbs: 260,
        dailyFats: 70,
        weeklyPlan,
        recommendations: [
          'Hit protein every meal; use paneer/eggs/soya when chicken is skipped.',
          'Gym evening: keep Pre-Workout light and Post-Workout protein-forward.',
          'Rotate pesto pasta / dal-palak so meals do not feel boring.',
        ],
        supplements: [
          {
            name: 'Whey protein',
            dosage: '1 scoop post-workout',
            reason: 'Convenient protein',
            timing: 'After training',
          },
          {
            name: 'Vitamin D3',
            dosage: '600–1000 IU (as advised)',
            reason: 'Common deficiency',
            timing: 'With a meal containing fat',
          },
        ],
        hydration: '3–3.5 litres water daily; extra around workouts.',
        exerciseRecommendations: '5 gym days/week — evening sessions as set in profile.',
        progressTracking: 'Weigh weekly; check-in meals daily for streak.',
        cautionaryNotes: 'Educational plan only — not medical advice.',
        generatedAt: new Date(),
        generationMeta: {
          pipeline: 'seed-test-user',
          sources: { gemini: false, rules: true, winner: 'seed' },
          generatedAt: new Date().toISOString(),
        },
      },
    },
    { upsert: true, new: true }
  );

  console.log('\n✅ Test account ready\n');
  console.log('  Email:    ', EMAIL);
  console.log('  Password: ', PASSWORD);
  console.log('  Name:     ', user.name);
  console.log('  Goal:     ', user.goal);
  console.log('  Gym:      ', user.workoutPreferences?.gymTiming);
  console.log('  City:     ', user.location?.city);
  console.log('  Diet plan: seeded (7 days with pre/post workout)\n');
  console.log('Sign in at http://localhost:3000/signin\n');

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
