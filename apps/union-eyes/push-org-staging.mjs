#!/usr/bin/env node
/**
 * Non-interactive wrapper: runs drizzle-kit push for organizations schema,
 * auto-answering "No" to any destructive rename prompts.
 */
import { spawn } from 'node:child_process';

const child = spawn('npx', ['drizzle-kit', 'push', '--config', 'drizzle-org.config.ts'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true,
  cwd: import.meta.dirname,
  env: { ...process.env },
});

const promptInterval = setInterval(() => {
  if (child.stdin?.writable) {
    child.stdin.write('No\n');
  }
}, 500);

child.on('close', (code) => {
  clearInterval(promptInterval);
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  clearInterval(promptInterval);
  process.stderr.write(`Failed: ${err.message}\n`);
  process.exit(1);
});
