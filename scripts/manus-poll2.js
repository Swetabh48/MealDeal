const fs = require('fs');
const path = require('path');

const env = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const key = (env.match(/^MANUS_API_KEY=(.+)$/m) || [])[1]?.trim();
const meta = JSON.parse(fs.readFileSync(path.join(__dirname, '../manus-task.json'), 'utf8'));

async function listMessages() {
  const url = new URL('https://api.manus.ai/v2/task.listMessages');
  url.searchParams.set('task_id', meta.task_id);
  url.searchParams.set('order', 'desc');
  url.searchParams.set('limit', '30');
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

(async () => {
  for (let i = 0; i < 30; i++) {
    const payload = await listMessages();
    const msgs = payload.messages || [];
    let status = 'running';
    let waiting = null;
    for (const m of msgs) {
      if (m.type === 'status_update') {
        status = m.status_update?.agent_status || status;
        const d = m.status_update?.status_detail;
        if (status === 'waiting' && d?.waiting_for_event_id) {
          waiting = d;
        }
      }
    }
    if (waiting) {
      console.log('waiting', waiting.waiting_for_event_type);
      let input = { accept: true };
      if (waiting.waiting_for_event_type === 'needConnectMyBrowser') input = { action: 'skip' };
      if (waiting.waiting_for_event_type === 'apiHighCreditNotice') input = { action: 'accept' };
      await confirm(waiting.waiting_for_event_id, input);
    } else if (status === 'stopped') {
      const texts = msgs
        .filter((m) => m.type === 'assistant_message')
        .map((m) => m.assistant_message?.content || '')
        .filter(Boolean);
      fs.writeFileSync(path.join(__dirname, '../manus-design-result.md'), texts.join('\n\n---\n\n'));
      console.log('DONE, messages:', texts.length, 'chars:', texts.join('').length);
      process.exit(0);
    } else {
      console.log(`[${i}]`, status);
    }
    await new Promise((r) => setTimeout(r, 8000));
  }
  console.log('timeout');
})();
