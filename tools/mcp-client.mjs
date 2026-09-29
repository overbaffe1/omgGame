#!/usr/bin/env node
// Minimal MCP stdio client to drive aseprite-mcp from the shell.
// Usage: node mcp-client.mjs <toolName> '<json-args>'
//        node mcp-client.mjs --list
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const proc = spawn('aseprite-mcp', [], {
  env: { ...process.env, ASEPRITE_PATH: process.env.ASEPRITE_PATH || '/tmp/aseprite-build/bin/aseprite' },
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buf = '';
const pending = new Map();
let nextId = 1;

proc.stdout.on('data', (d) => {
  buf += d.toString();
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    } catch { /* ignore partial */ }
  }
});
proc.stderr.on('data', (d) => process.stderr.write('[mcp-err] ' + d.toString()));

function send(method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, resolve);
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error('timeout ' + method)); } }, 120000);
  });
}

const init = await send('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'arena-shell-client', version: '1.0.0' },
});
send('notifications/initialized', {}).catch(() => {});

if (args[0] === '--list') {
  const res = await send('tools/list', {});
  for (const t of res.result.tools) {
    console.log(t.name.padEnd(28), '—', (t.description || '').split('\n')[0].slice(0, 100));
  }
} else if (args[0] === '--call') {
  // --call <tool> <json>  → raw output
  const res = await send('tools/call', { name: args[1], arguments: JSON.parse(args[2] || '{}') });
  console.log(JSON.stringify(res, null, 2));
} else {
  // <tool> <json> → human output
  const res = await send('tools/call', { name: args[0], arguments: JSON.parse(args[1] || '{}') });
  for (const c of res.result?.content || []) {
    if (c.type === 'text') console.log(c.text);
    else console.log('[content]', c.type);
  }
  if (res.result?.isError) { console.error('TOOL ERROR'); process.exit(1); }
}
proc.kill();
process.exit(0);
