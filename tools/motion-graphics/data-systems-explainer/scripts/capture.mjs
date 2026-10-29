#!/usr/bin/env node
/**
 * Deterministic frame capture → mp4.
 *
 * Steps window.render(t) at t = frame / fps in a 1920×1080 Chromium page,
 * screenshots every frame and pipes them into FFmpeg. Never real-time, so no
 * dropped or duplicated frames regardless of how slow the GPU is.
 *
 * Setup (once):   npm i -D playwright && npx playwright install chromium
 * Run:            npm run dev            (in another terminal)
 *                 npm run capture -- --fps 60 --out out/explainer.mp4
 * Options:        --url http://localhost:5173/   --fps 60   --from 0   --to 30
 *                 --out out/explainer.mp4   --headed (use the real GPU window)
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def;
};
const flag = (name) => argv.includes(`--${name}`);

const base = opt('url', 'http://localhost:5173/');
const fps = Number(opt('fps', 60));
const out = opt('out', 'out/explainer.mp4');
const url = base + (base.includes('?') ? '&' : '?') + 'capture';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright is missing. Run: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const browser = await chromium.launch({
  headless: !flag('headed'),
  args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--use-gl=angle'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('[page]', e.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => window.ready);

const duration = await page.evaluate(() => window.DURATION);
const from = Number(opt('from', 0));
const to = Math.min(Number(opt('to', duration)), duration);
const first = Math.round(from * fps);
const last = Math.round(to * fps) - 1;

mkdirSync(path.dirname(out), { recursive: true });
const ff = spawn('ffmpeg', [
  '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  out,
], { stdio: ['pipe', 'inherit', 'inherit'] });

const t0 = Date.now();
for (let f = first; f <= last; f++) {
  await page.evaluate((t) => window.render(t), f / fps);
  const png = await page.screenshot({ type: 'png' });
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
  if ((f - first) % fps === 0) {
    const done = f - first + 1;
    const total = last - first + 1;
    process.stdout.write(`\rframe ${done}/${total}  (${((Date.now() - t0) / done).toFixed(0)} ms/frame)`);
  }
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();
console.log(`\nwrote ${out}`);
