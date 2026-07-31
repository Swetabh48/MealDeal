const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const env = fs.readFileSync(path.join(root, '.env'), 'utf8');
const key = (env.match(/^MANUS_API_KEY=(.+)$/m) || [])[1]?.trim();
if (!key) {
  console.error('MANUS_API_KEY missing');
  process.exit(1);
}

const schema = {
  type: 'object',
  properties: {
    direction_summary: { type: 'string' },
    globals_css: {
      type: 'string',
      description: 'Full CSS to append/replace for soft-3D + keyframe animations',
    },
    landing_tsx: {
      type: 'string',
      description: 'Complete React/Next.js client component JSX for the landing page body (no imports of unknown packages; use Tailwind + plain CSS classes only)',
    },
    notes: { type: 'string' },
  },
  required: ['direction_summary', 'globals_css', 'landing_tsx', 'notes'],
  additionalProperties: false,
};

const prompt = `Build COPY-PASTE READY code for MealDeal (existing Next.js 15 + Tailwind app). Do NOT create a separate hosted Manus website product. Do NOT use auth/DB.

Goal: a SPECIAL landing page that feels designed — soft 3D depth, appetizing Indian food energy (forest green + mango), premium motion (not noisy), brand MealDeal as the hero signal.

Hard rules:
- Brand "MealDeal" must dominate the first viewport
- First viewport: brand + one headline + one short sentence + one CTA group + one dominant visual atmosphere (gradients/orbs/shapes OK). No stats strip, no feature cards in hero.
- Avoid purple-on-white AI look, avoid cream+terracotta newspaper look
- No Inter/Roboto as the "special" font story — use distinctive CSS font stacks (e.g. Fraunces/Outfit via Google Fonts @import in CSS, or system display alternatives)
- Ship at least 3 intentional motions: hero entrance, floating depth shapes, CTA shimmer or breath
- Output must be usable inside Next.js: Tailwind classes + CSS. No Framer Motion unless you also provide a pure-CSS fallback that looks good alone. Prefer CSS keyframes so we can paste without new deps.

Deliver in the structured fields:
1) globals_css — complete CSS block with :root tokens, keyframes, utility classes
2) landing_tsx — a single React functional component return tree for the home page (assume 'use client' will be added). Use Link href="/register" and href="/login" as strings. Use lucide-react icons only if you keep names as comments OR use inline SVG. Prefer inline SVG to avoid import issues.
3) notes — how to paste into src/app/page.tsx and globals.css

Make it look expensive and alive — clay/soft-3D cards, layered shadows, mango CTA, forest text.`;

(async () => {
  const res = await fetch('https://api.manus.ai/v2/task.create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-manus-api-key': key,
    },
    body: JSON.stringify({
      message: { content: prompt },
      structured_output_schema: schema,
      agent_profile: 'manus-1.6',
    }),
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
      path.join(root, 'manus-task.json'),
      JSON.stringify(
        {
          task_id: j.task_id,
          task_url: j.task_url,
          createdAt: new Date().toISOString(),
          purpose: 'landing-code-paste',
        },
        null,
        2
      )
    );
  }
  if (!j.ok) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
