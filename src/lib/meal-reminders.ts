/** Client-side meal reminders using Notification API + localStorage */

type ReminderMeal = { name: string; time: string };

function parseMealMinutes(mealTime: string): number | null {
  const m = mealTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = (m[3] || '').toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const res = await Notification.requestPermission();
  return res === 'granted';
}

export function scheduleMealReminders(meals: ReminderMeal[], leadMinutes = 20) {
  if (typeof window === 'undefined') return () => {};
  const firedKey = `yelediet:reminders:${new Date().toDateString()}`;
  let fired: string[] = [];
  try {
    fired = JSON.parse(localStorage.getItem(firedKey) || '[]');
  } catch {
    fired = [];
  }

  const markFired = (id: string) => {
    if (!fired.includes(id)) {
      fired.push(id);
      localStorage.setItem(firedKey, JSON.stringify(fired));
    }
  };

  const tick = () => {
    if (Notification.permission !== 'granted') return;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    // Sunday night regen nudge (11 PM) — browser push + optional email
    if (now.getDay() === 0 && now.getHours() === 23 && now.getMinutes() < 2) {
      const sid = 'sunday-regen';
      if (!fired.includes(sid)) {
        new Notification('MealDeal · New week plan', {
          body: 'Sunday night — regenerate your meal plan so next week is ready.',
          tag: sid,
        });
        markFired(sid);
        // Fire-and-forget email if SMTP is configured on the server
        fetch('/api/reminders/sunday-email', { method: 'POST' }).catch(() => {});
      }
    }

    for (const meal of meals) {
      const mealMin = parseMealMinutes(meal.time);
      if (mealMin == null) continue;
      const remindAt = mealMin - leadMinutes;
      const id = `${meal.name}@${meal.time}`;
      // Fire in a 2-minute window so the interval catch works
      if (nowMin >= remindAt && nowMin < remindAt + 2 && !fired.includes(id)) {
        new Notification(`MealDeal · ${meal.name} soon`, {
          body: `In ~${leadMinutes} min (${meal.time}). Open dashboard to check in when you eat.`,
          tag: id,
        });
        markFired(id);
      }
    }
  };

  tick();
  const interval = window.setInterval(tick, 60_000);
  return () => window.clearInterval(interval);
}
