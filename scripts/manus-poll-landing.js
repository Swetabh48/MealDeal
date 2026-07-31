const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const env = fs.readFileSync(path.join(root, '.env'), 'utf8');
const key = (env.match(/^MANUS_API_KEY=(.+)$/m) || [])[1]?.trim();
const meta = JSON.parse(fs.readFileSync(path.join(root, 'manus-task.json'), 'utf8'));

async function listMessages() {
  const url = new URL('https://api.manus.ai/v2/task.listMessages');
  url.searchParams.set('task_id', meta.task_id);
  url.searchParams.set('order', 'desc');
  url.searchParams.set('limit', '40');
  const res = await fetch(url, { headers: { 'x-manus-api-key': key } });
  return res.json();
}

async function confirm(eventId, input) {
  const res = await fetch('https://api.manus.ai/v2/task.confirmAction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-manus-api-key': key },
    body: JSON.stringify({ task_id: meta.task_id, event_id: eventId, input }),
  });
  return res.json();
}

function findStatus(msgs) {
  let status = 'running';
  let waiting = null;
  let structured = null;
  for (const m of msgs) {
    if (m.type === 'status_update') {
      status = m.status_update?.agent_status || status;
      const d = m.status_update?.status_detail;
      if (status === 'waiting' && d?.waiting_for_event_id) waiting = d;
    }
    if (m.type === 'structured_output_result') {
      structured = m.structured_output_result;
    }
  }
  return { status, waiting, structured };
}

(async () => {
  console.log('Polling', meta.task_id, meta.task_url);
  for (let i = 0; i < 60; i++) {
    const payload = await listMessages();
    const msgs = payload.messages || [];
    const { status, waiting, structured } = findStatus(msgs);

    if (waiting) {
      console.log('waiting', waiting.waiting_for_event_type);
      let input = { accept: true };
      if (waiting.waiting_for_event_type === 'needConnectMyBrowser') input = { action: 'skip' };
      if (waiting.waiting_for_event_type === 'apiHighCreditNotice') input = { action: 'accept' };
      if (waiting.waiting_for_event_type === 'webdevRunAction') input = { accept: true, mode: 'speed' };
      if (waiting.waiting_for_event_type === 'deployAction') input = { accept: false };
      if (waiting.waiting_for_event_type === 'messageAskUser') {
        console.log('needs user — open', meta.task_url);
        process.exit(2);
      }
      await confirm(waiting.waiting_for_event_id, input);
    } else if (status === 'stopped') {
      // Prefer structured output
      let value = structured?.value;
      if (!value) {
        // fallback: dump assistant texts
        const texts = msgs
          .filter((m) => m.type === 'assistant_message')
          .map((m) => m.assistant_message?.content || '');
        fs.writeFileSync(path.join(root, 'manus-design-result.md'), texts.join('\n\n---\n\n'));
        console.log('DONE without structured output — see manus-design-result.md');
        process.exit(0);
      }
      fs.writeFileSync(path.join(root, 'manus-landing-output.json'), JSON.stringify(value, null, 2));
      if (value.globals_css) fs.writeFileSync(path.join(root, 'manus-globals.css'), value.globals_css);
      if (value.landing_tsx) fs.writeFileSync(path.join(root, 'manus-landing.tsx'), value.landing_tsx);
      console.log('DONE structured');
      console.log('direction:', (value.direction_summary || '').slice(0, 200));
      console.log('css chars', (value.globals_css || '').length, 'tsx chars', (value.landing_tsx || '').length);
      process.exit(0);
    } else if (status === 'error') {
      console.log('ERROR', JSON.stringify(payload).slice(0, 500));
      process.exit(1);
    } else {
      console.log(`[${i}]`, status);
    }
    await new Promise((r) => setTimeout(r, 10000));
  }
  console.log('timeout', meta.task_url);
  process.exit(3);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
