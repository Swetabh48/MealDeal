const fs = require('fs');
const path = require('path');

const env = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const key = (env.match(/^MANUS_API_KEY=(.+)$/m) || [])[1]?.trim();
if (!key) {
  console.error('MANUS_API_KEY missing');
  process.exit(1);
}

const prompt = `You are helping redesign an existing Indian nutrition app called MealDeal (Next.js). Do NOT rebuild a full production clone with auth/DB.

Deliverables (design inspiration only):
1) A short visual direction for a soft 3D / depth look (depth, shadows, subtle tilt) — avoid purple-on-white AI cliches, avoid cream+terracotta newspaper looks.
2) Color tokens (CSS variables) for: background, surface, accent, text.
3) Concrete CSS/Tailwind class ideas for: landing hero, dashboard cards, grocery table header.
4) 3 motion ideas that feel premium but not noisy.
5) Optional: a simple static HTML mock of the landing hero only (brand MealDeal prominent, one headline, one sentence, one CTA).

Context: MealDeal helps Indian users with AI meal plans, grocery lists (weekly/monthly), water/sleep logs, recipes, doctor chat.
Keep output concise and copy-paste friendly.`;

(async () => {
  const res = await fetch('https://api.manus.ai/v2/task.create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-manus-api-key': key,
    },
    body: JSON.stringify({ message: { content: prompt } }),
  });
  const j = await res.json();
  console.log(
    JSON.stringify(
      {
        status: res.status,
        ok: j.ok,
        task_id: j.task_id,
        task_url: j.task_url,
        title: j.task_title,
        error: j.error,
      },
      null,
      2
    )
  );
  if (j.task_id) {
    fs.writeFileSync(
      path.join(__dirname, '../manus-task.json'),
      JSON.stringify(
        { task_id: j.task_id, task_url: j.task_url, createdAt: new Date().toISOString() },
        null,
        2
      )
    );
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
