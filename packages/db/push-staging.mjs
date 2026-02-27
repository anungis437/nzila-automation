#!/usr/bin/env node
/**
 * Non-interactive wrapper: runs drizzle-kit push, auto-answering "No"
 * to any destructive rename prompts that drizzle-kit generates.
 * 
 * Usage: node push-staging.mjs
 */
import { spawn } from 'node:child_process';

const child = spawn('npx', ['drizzle-kit', 'push'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true,
  cwd: import.meta.dirname,
  env: { ...process.env },
});

// Buffer to detect prompts
let buf = '';
child.stdout?.on?.('data', (data) => {
  const str = data.toString();
  buf += str;
  process.stdout.write(str);
});

// Auto-answer any prompts with "No" (skip destructive renames)
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
  console.error('Failed to run drizzle-kit push:', err.message);
  process.exit(1);
});
