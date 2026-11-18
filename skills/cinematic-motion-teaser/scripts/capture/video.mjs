// Short screen recordings of the most dynamic flows. Usage: node video.mjs [name ...]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { launch, newContext, attachLogs, goto, settle, mock, MOCK } from './lib.mjs';

const OUT = '/home/you/nearmatch-motion/screens/video';
const TMP = '/home/you/nearmatch-motion/capture-tooling/.video-raw';
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });
const only = new Set(process.argv.slice(2));
const browser = await launch();
const MIN = 60_000;
const tid = (page, id) => page.getByTestId(id, { exact: true }).first();

async function serverNow() {
  return (await (await fetch(`${MOCK}/__mock/clock`)).json()).now;
}

async function record(name, opts, fn) {
  if (only.size && !only.has(name)) return;
  console.log(`\n=== video ${name}`);
  await mock('reset');
  if (opts.state) await mock('set', opts.state);
  const dir = path.join(TMP, name);
  fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  const ctx = await newContext(browser, { scale: 2, video: dir, loggedIn: opts.loggedIn !== false });
  const page = await ctx.newPage();
  attachLogs(page, ` ${name}`);
  let startAt = 0;
  try {
    startAt = await fn(page, () => (Date.now() - t0) / 1000);
  } catch (e) {
    console.log(`!! video ${name} failed:`, e.message.split('\n')[0]);
  }
  const video = page.video();
  await ctx.close();
  const raw = await video.path();
  const out = path.join(OUT, `${name}.mp4`);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(Math.max(0, startAt - 0.2)), '-i', raw,
    '-vf', 'scale=780:1688:flags=lanczos,fps=30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', out]);
  console.log('saved', out);
}

async function drag(page, dx, { steps = 28, hold = 0, release = true, back = false } = {}) {
  const box = await tid(page, 'swipe.deck').boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height * 0.42;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    const e = i / steps;
    await page.mouse.move(cx + dx * e, cy + Math.abs(dx) * 0.05 * e);
    await page.waitForTimeout(18);
  }
  if (hold) await page.waitForTimeout(hold);
  if (back) {
    for (let i = steps; i >= 0; i--) {
      await page.mouse.move(cx + dx * (i / steps), cy);
      await page.waitForTimeout(14);
    }
  }
  if (release) await page.mouse.up();
}

// 1. Home → deck → pass one → like Inès by swiping → "It's a match" → open the chat.
await record('swipe-to-match', { state: { deck: ['u-mariem', 'u-ines', 'u-rania', 'u-salma', 'u-chloe'], matchOnLike: ['u-ines'] } }, async (page, el) => {
  await goto(page, '/', 2200);
  const start = el();
  await page.waitForTimeout(900);
  await tid(page, 'home.swipeCta').click();
  await settle(page, 2000);
  await drag(page, -60, { hold: 300, back: true });         // a hesitant tease
  await page.waitForTimeout(500);
  await drag(page, -240, { steps: 22 });                     // pass Mariem
  await page.waitForTimeout(1300);
  await drag(page, 260, { steps: 48 });                      // like Inès, slowly
  await page.waitForTimeout(3600);                           // the celebration
  await tid(page, 'match.openChat').click().catch(async () => {
    await page.getByText('Open chat').click();
  });
  await settle(page, 2500);
  return start;
});

// 2. Chat → a message lands → "Come see me" → Lina says yes → the code → she types it → "You met!".
await record('meet-and-validate', {}, async (page, el) => {
  await goto(page, '/chat/m-lina', 2500);
  const start = el();
  await page.waitForTimeout(1000);
  await mock('push-message', { matchId: 'm-lina', senderId: 'u-lina', body: "I'll wave 👋" });
  await page.waitForTimeout(1600);
  await tid(page, 'chat.meet.comeToMe').click();
  await page.waitForTimeout(2200);
  const t = await serverNow();
  const accepted = { matchId: 'm-lina', showerId: 'u-youssef', entererId: 'u-lina', codeExpiresAt: t + 10 * MIN };
  await mock('meet', { matchId: 'm-lina', state: { phase: 'accepted', showerId: 'u-youssef', entererId: 'u-lina', codeExpiresAt: accepted.codeExpiresAt, frozen: true } });
  await mock('emit', { event: 'meet:accepted', payload: accepted });
  await page.waitForTimeout(4200);                           // the code screen
  const vAt = new Date(await serverNow()).toISOString();
  await mock('emit', { event: 'match:validated', payload: { matchId: 'm-lina', validatedAt: vAt } });
  await page.waitForTimeout(4000);
  return start;
});

// 3. The welcome screen's opening animation.
await record('welcome-intro', { loggedIn: false }, async (page, el) => {
  await page.goto('http://localhost:8081/onboarding/welcome', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="welcome.screen"]', { timeout: 60000 });
  const start = el();
  await page.waitForTimeout(6000);
  return start;
});

await browser.close();
console.log('\nvideos done');
