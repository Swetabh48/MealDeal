const fs = require('fs');
const path = require('path');

const env = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const key = (env.match(/^MANUS_API_KEY=(.+)$/m) || [])[1]?.trim();
const meta = JSON.parse(fs.readFileSync(path.join(__dirname, '../manus-task.json'), 'utf8'));

async function listMessages() {
  const url = new URL('https://api.manus.ai/v2/task.listMessages');
  url.searchParams.set('task_id', meta.task_id);
  url.searchParams.set('order', 'desc');
  url.searchParams.set('limit', '20');
  const res = await fetch(url, { headers: { 'x-manus-api-key': key } });
  return { status: res.status, ...(await res.json()) };
}

async function confirm(eventId, input) {
  const res = await fetch('https://api.manus.ai/v2/task.confirmAction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-manus-api-key': key,
    },
    body: JSON.stringify({ task_id: meta.task_id, event_id: eventId, input }),
  });
  return { status: res.status, ...(await res.json()) };
}

function extractAssistantText(payload) {
  const msgs = payload.messages || payload.data || payload.items || [];
  const texts = [];
  for (const m of msgs) {
    const type = m.type || m.event_type;
    if (type === 'assistant_message' || m.role === 'assistant') {
      const c =
        m.assistant_message?.content ||
        m.content ||
        m.message?.content ||
        m.text ||
        '';
      if (typeof c === 'string' && c.trim()) texts.push(c);
      else if (Array.isArray(c)) {
        texts.push(
          c
            .map((p) => (typeof p === 'string' ? p : p.text || p.content || ''))
            .join('\n')
        );
      }
    }
  }
  return texts;
}

function findWaiting(payload) {
  const msgs = payload.messages || payload.data || payload.items || [];
  for (const m of msgs) {
    const su = m.status_update || m;
    if (su.agent_status === 'waiting' || m.type === 'status_update') {
      const detail = su.status_detail || m.status_detail;
      if (detail?.waiting_for_event_id) {
        return {
          agent_status: su.agent_status || 'waiting',
          event_id: detail.waiting_for_event_id,
          event_type: detail.waiting_for_event_type,
          description: detail.waiting_description,
        };
      }
    }
    if (m.agent_status === 'waiting' && m.waiting_for_event_id) {
      return {
        agent_status: 'waiting',
        event_id: m.waiting_for_event_id,
        event_type: m.waiting_for_event_type,
        description: m.waiting_description,
      };
    }
  }
  // also scan for latest status
  for (const m of msgs) {
    const status = m.status_update?.agent_status || m.agent_status;
    if (status) return { agent_status: status, raw: true };
  }
  return null;
}

(async () => {
  console.log('Polling', meta.task_id, meta.task_url);
  for (let i = 0; i < 40; i++) {
    const payload = await listMessages();
    if (!payload.ok && payload.status !== 200) {
      console.log('poll fail', payload.status, JSON.stringify(payload).slice(0, 400));
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    // dump shape once
    if (i === 0) {
      const sample = JSON.stringify(payload).slice(0, 800);
      console.log('sample:', sample);
    }

    const waiting = findWaiting(payload);
    if (waiting?.event_id) {
      console.log('waiting for', waiting.event_type, waiting.description || '');
      // Auto-accept common non-destructive confirmations; skip browser connect
      let input = { accept: true };
      if (waiting.event_type === 'needConnectMyBrowser') input = { action: 'skip' };
      if (waiting.event_type === 'apiHighCreditNotice') input = { action: 'accept' };
      if (waiting.event_type === 'webdevRunAction') input = { accept: true, mode: 'speed' };
      if (waiting.event_type === 'messageAskUser') {
        // can't confirmAction — need sendMessage; skip for now
        console.log('needs user message — open task_url');
        break;
      }
      const conf = await confirm(waiting.event_id, input);
      console.log('confirmed', conf.ok, conf.error || '');
    } else if (waiting?.agent_status === 'stopped') {
      const texts = extractAssistantText(payload);
      const out = path.join(__dirname, '../manus-design-result.md');
      fs.writeFileSync(out, texts.join('\n\n---\n\n') || JSON.stringify(payload, null, 2));
      console.log('DONE ->', out);
      console.log('Open:', meta.task_url);
      process.exit(0);
    } else if (waiting?.agent_status === 'error') {
      console.log('ERROR', JSON.stringify(payload).slice(0, 600));
      process.exit(1);
    } else {
      console.log(`[${i}] status=`, waiting?.agent_status || 'running');
    }
    await new Promise((r) => setTimeout(r, 8000));
  }
  console.log('Still running — open', meta.task_url);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
