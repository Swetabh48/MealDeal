const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const env = fs.readFileSync(path.join(root, '.env'), 'utf8');
const key = (env.match(/^MANUS_API_KEY=(.+)$/m) || [])[1]?.trim();
if (!key) {
  console.error('no key');
  process.exit(1);
}

const schema = {
  type: 'object',
  properties: {
    site_shell_css: {
      type: 'string',
      description: 'CSS only (no @tailwind directives). Classes: .md-page, .md-nav, .md-card, .md-btn-primary, .md-btn-secondary for forest+mango soft-3D theme matching MealDeal landing.',
    },
    notes: { type: 'string' },
  },
  required: ['site_shell_css', 'notes'],
  additionalProperties: false,
};

const prompt = `MealDeal already has a landing page with soft-3D clay look: forest emerald + mango amber, Fraunces/Outfit, classes like bg-mesh, clay-card, clay-btn, animate-float.

Produce ONE CSS stylesheet (site_shell_css) to theme the REST of the Next.js app consistently:
- .md-page = full page background (mesh/sage)
- .md-nav = frosted pill/header bar
- .md-card = elevated white/clay card
- .md-btn-primary = mango CTA
- .md-btn-secondary = forest outline/ghost
- Keep soft shadows, no purple gradients, no Inter.

Do NOT rebuild pages. CSS classes only. No @tailwind base/components/utilities lines.`;

(async () => {
  const res = await fetch('https://api.manus.ai/v2/task.create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-manus-api-key': key },
    body: JSON.stringify({
      message: { content: prompt },
      structured_output_schema: schema,
    }),
  });
  const j = await res.json();
  console.log(JSON.stringify({ status: res.status, ok: j.ok, task_id: j.task_id, task_url: j.task_url, error: j.error }, null, 2));
  if (j.task_id) {
    fs.writeFileSync(
      path.join(root, 'manus-task.json'),
      JSON.stringify({ task_id: j.task_id, task_url: j.task_url, purpose: 'site-theme-css', createdAt: new Date().toISOString() }, null, 2)
    );
  }
})();
