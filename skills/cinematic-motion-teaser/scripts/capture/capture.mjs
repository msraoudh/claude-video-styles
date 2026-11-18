// Full capture run. Usage: node capture.mjs [sceneName ...]  (no args = every scene)
import { launch, newContext, attachLogs, goto, settle, shot, mock, MOCK } from './lib.mjs';

const MIN = 60_000;
const MEDIA = '/home/you/nearmatch-motion/capture-tooling/media';
const SELFIE = `${MEDIA}/youssef-3.jpg`;
const only = new Set(process.argv.slice(2));
const browser = await launch();
const results = [];

async function serverNow() {
  return (await (await fetch(`${MOCK}/__mock/clock`)).json()).now;
}

async function scene(name, opts, fn) {
  if (only.size && !only.has(name)) return;
  console.log(`\n=== ${name}`);
  await mock('reset');
  if (opts.state) await mock('set', opts.state);
  if (opts.me) await mock('patch-me', opts.me);
  const ctx = await newContext(browser, { loggedIn: opts.loggedIn !== false, shell: opts.shell });
  const page = await ctx.newPage();
  attachLogs(page, ` ${name}`);
  try {
    await fn(page, ctx);
  } catch (e) {
    console.log(`!! scene ${name} failed:`, e.message.split('\n')[0]);
    await shot(page, `zz-failed-${name}`).catch(() => {});
  } finally {
    await ctx.close();
  }
}

const tid = (page, id) => page.getByTestId(id, { exact: true }).first();
async function tap(page, id, ms = 1200) {
  await tid(page, id).click();
  await page.waitForTimeout(ms);
}

// ── Onboarding ─────────────────────────────────────────────────────────────────
await scene('welcome', { loggedIn: false }, async (page) => {
  await page.goto('http://localhost:8081/onboarding/welcome', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="welcome.screen"]', { timeout: 60000 });
  await page.waitForTimeout(450);
  await shot(page, '01-onboarding-welcome-intro');
  await settle(page, 2500);
  await shot(page, '02-onboarding-welcome');
});

const NEW_USER = { id: 'u-youssef', phone: 'oauth:google:demo', hasProfile: false };
await scene('onboarding', { me: { hasProfile: false }, state: { consent: { terms: false, ai: false } }, shell: NEW_USER }, async (page) => {
  await goto(page, '/', 2500);
  await shot(page, '03-onboarding-consent');
  await tap(page, 'consent.terms', 500);
  await tap(page, 'consent.ai', 900);
  await shot(page, '04-onboarding-consent-accepted');
  await tap(page, 'consent.continue', 2200);
  await shot(page, '05-onboarding-name-empty');
  await tid(page, 'name.input').fill('Youssef');
  await tid(page, 'name.birthInput').pressSequentially('07241998', { delay: 70 });
  await page.waitForTimeout(1200);
  await shot(page, '06-onboarding-name-filled');
  await tap(page, 'name.continue', 2200);
  await shot(page, '07-onboarding-photo-empty');
  for (let i = 0; i < 3; i++) {
    const chooser = page.waitForEvent('filechooser', { timeout: 8000 });
    await tid(page, `photos.add.${i}`).click();
    const fc = await chooser;
    await fc.setFiles(`${MEDIA}/youssef-${i + 1}.jpg`);
    await page.waitForTimeout(1800);
    if (i === 0) await shot(page, '08-onboarding-photo-one-added');
  }
  await settle(page, 1200);
  await shot(page, '09-onboarding-photo-complete');
  await tap(page, 'photo.continue', 2200);
  await shot(page, '10-onboarding-interests-empty');
  for (const id of ['music', 'travel', 'food', 'photo', 'concerts']) await tap(page, `interests.option.${id}`, 250);
  await page.waitForTimeout(800);
  await shot(page, '11-onboarding-interests-selected');
  await tap(page, 'interests.continue', 2200);
  await shot(page, '12-onboarding-lifestyle-empty');
  for (const id of ['smoking.non_smoker', 'drinking.yes', 'sport.regular', 'looking.meeting']) await tap(page, `lifestyle.option.${id}`, 250);
  await page.waitForTimeout(800);
  await shot(page, '13-onboarding-lifestyle-selected');
  await tap(page, 'lifestyle.continue', 2600);
  await shot(page, '14-onboarding-notifications');
  await tap(page, 'notifPrompt.notNow', 2800);
  await shot(page, '15-onboarding-done');
});

// ── Main app: home ────────────────────────────────────────────────────────────
await scene('home', {}, async (page) => {
  await goto(page, '/', 2500);
  await shot(page, '16-home-checked-in');
  await page.mouse.move(195, 600);
  await page.mouse.wheel(0, 520);
  await settle(page, 1200);
  await shot(page, '17-home-checked-in-scrolled');
  await page.mouse.wheel(0, -2000);
  await settle(page, 800);
  await tap(page, 'home.leaveCta', 1300);
  await shot(page, '19-home-leave-sheet');
});

await scene('home-idle', { state: { checkin: { active: false } } }, async (page) => {
  await goto(page, '/', 2500);
  await shot(page, '18-home-not-checked-in');
});

// ── Check-in ───────────────────────────────────────────────────────────────────
await scene('checkin', { state: { checkin: { active: false } } }, async (page) => {
  await goto(page, '/', 2000);
  await page.goto('http://localhost:8081/checkin/places');
  await settle(page, 2500);
  await shot(page, '20-checkin-places');
});

// ── Swipe deck → match ─────────────────────────────────────────────────────────
await scene('swipe', {}, async (page) => {
  await goto(page, '/', 2200);
  await tap(page, 'home.swipeCta', 2500);
  await settle(page, 1200);
  await shot(page, '21-swipe-deck');

  // Mid-drag right (like) and left (pass), held while capturing.
  const box = await tid(page, 'swipe.deck').boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height * 0.42;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) { await page.mouse.move(cx + i * 7.5, cy + i * 1.2); await page.waitForTimeout(16); }
  await page.waitForTimeout(350);
  await shot(page, '22-swipe-drag-like');
  for (let i = 11; i >= -12; i--) { await page.mouse.move(cx + i * 7.5, cy - Math.abs(i) * 0.6); await page.waitForTimeout(16); }
  await page.waitForTimeout(350);
  await shot(page, '23-swipe-drag-pass');
  for (let i = -11; i <= 0; i++) { await page.mouse.move(cx + i * 7.5, cy); await page.waitForTimeout(16); }
  await page.mouse.up();
  await page.waitForTimeout(900);

  // Profile from the deck.
  await tap(page, 'swipe.openProfile', 2800);
  await shot(page, '24-profile-view-from-deck');
  await page.mouse.wheel(0, 700);
  await settle(page, 900);
  await shot(page, '25-profile-view-from-deck-scrolled');
  await tap(page, 'profileView.close', 1400);

  // Report / block sheet from the deck.
  await tap(page, 'swipe.more', 1200);
  await shot(page, '26-swipe-report-block-sheet');
  await page.keyboard.press('Escape');
  await tap(page, 'reportSheet.cancel', 900).catch(() => {});
  await page.waitForTimeout(600);

  // Like the top card: Inès likes back → match celebration.
  await tap(page, 'swipe.like', 250);
  await page.waitForTimeout(650);
  await shot(page, '27-match-celebration-burst');
  await page.waitForTimeout(1800);
  await shot(page, '28-match-celebration');
});

await scene('swipe-empty', { state: { deck: [] } }, async (page) => {
  await goto(page, '/', 2200);
  await tap(page, 'home.swipeCta', 2500);
  await shot(page, '29-swipe-empty-deck');
});

// ── Chat ───────────────────────────────────────────────────────────────────────
await scene('chat-active', {}, async (page) => {
  await goto(page, '/chat/m-lina', 2500);
  await shot(page, '30-chat-active-timer');
  // A new message lands live.
  await mock('push-message', { matchId: 'm-lina', senderId: 'u-lina', body: "I'll wave 👋" });
  await page.waitForTimeout(1400);
  // Type a reply (not sent yet).
  await tid(page, 'chat.input').fill('On my way, two minutes 🏃');
  await page.waitForTimeout(700);
  await shot(page, '31-chat-typing-reply');
  await tap(page, 'chat.send', 1400);
  await page.locator('body').click({ position: { x: 195, y: 420 } }).catch(() => {});
  await page.waitForTimeout(600);
  await shot(page, '32-chat-reply-sent');
  // Zone picker.
  await tap(page, 'chat.zonePicker', 1200);
  await shot(page, '33-chat-zone-sheet');
});

await scene('chat-meet-outgoing', {}, async (page) => {
  await goto(page, '/chat/m-lina', 2500);
  await tap(page, 'chat.meet.comeToMe', 1500);
  await shot(page, '34-chat-meet-request-waiting');
});

await scene('chat-meet-incoming', {}, async (page) => {
  const t = await serverNow();
  await mock('meet', { matchId: 'm-lina', state: { phase: 'requested', frozen: false, request: { matchId: 'm-lina', requesterId: 'u-lina', mode: 'going_to_you', createdAt: t - 20_000 } } });
  await goto(page, '/chat/m-lina', 2800);
  await shot(page, '35-chat-meet-request-incoming');
});

await scene('chat-frozen', {}, async (page) => {
  const t = await serverNow();
  await mock('meet', { matchId: 'm-lina', state: { phase: 'accepted', showerId: 'u-youssef', entererId: 'u-lina', codeExpiresAt: t + 8 * MIN + 40_000, frozen: true } });
  await goto(page, '/chat/m-lina', 2800);
  await shot(page, '36-chat-paused-code-live');
});

await scene('code-gen', {}, async (page) => {
  const t = await serverNow();
  await mock('meet', { matchId: 'm-lina', state: { phase: 'accepted', showerId: 'u-youssef', entererId: 'u-lina', codeExpiresAt: t + 9 * MIN + 32_000, frozen: true } });
  await goto(page, '/chat/m-lina', 2200);
  await tap(page, 'chat.meet.showCode', 2600);
  await shot(page, '37-chat-code-show');
});

await scene('code-entry', {}, async (page) => {
  const t = await serverNow();
  await mock('meet', { matchId: 'm-lina', state: { phase: 'accepted', showerId: 'u-lina', entererId: 'u-youssef', codeExpiresAt: t + 9 * MIN, frozen: true } });
  await goto(page, '/chat/m-lina', 2200);
  await tap(page, 'chat.meet.enterCode', 2200);
  await shot(page, '38-chat-code-entry-empty');
  const input = tid(page, 'codeEntry.input');
  await input.click().catch(() => {});
  await page.keyboard.type('48', { delay: 120 });
  await page.waitForTimeout(700);
  await shot(page, '39-chat-code-entry-typing');
  await page.keyboard.type('19', { delay: 120 });
  await page.waitForTimeout(400);
  await tap(page, 'codeEntry.submit', 1500).catch(() => {});
  await page.waitForTimeout(600);
  await shot(page, '40-chat-code-entry-wrong');
  for (let i = 0; i < 4; i++) await page.keyboard.press('Backspace');
  await mock('set', { codeVerifyDelayMs: 2500 });
  await page.keyboard.type('4827', { delay: 140 });
  await page.waitForTimeout(450);
  await shot(page, '41-chat-code-entry-filled');
  await tid(page, 'codeEntry.submit').click({ timeout: 1500 }).catch(() => {});
  await page.waitForURL(/\/chat\/validated\//, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(2200);
  await shot(page, '42-chat-validated-celebration');
});

await scene('chat-permanent', {}, async (page) => {
  await goto(page, '/chat/m-amira', 2500);
  await shot(page, '43-chat-permanent');
  await tap(page, 'chat.more', 1100).catch(async () => {
    await page.getByLabel(/more/i).first().click();
    await page.waitForTimeout(1100);
  });
  await shot(page, '44-chat-more-menu');
});

await scene('chat-new-match', {}, async (page) => {
  await goto(page, '/chat/m-yasmine', 2500);
  await shot(page, '45-chat-new-match-empty');
});

await scene('chat-report', {}, async (page) => {
  await goto(page, '/chat/m-lina', 2500);
  await tid(page, 'chat.more').click().catch(async () => { await page.getByLabel(/more/i).first().click(); });
  await page.waitForTimeout(1000);
  await page.getByText('Report', { exact: false }).last().click();
  await page.waitForTimeout(1300);
  await shot(page, '46-chat-report-menu');
  await tap(page, 'reportSheet.menuReport', 1300);
  await shot(page, '47-chat-report-reasons');
});

await scene('chat-expired', {}, async (page) => {
  await goto(page, '/chat/expired/m-nour', 2800);
  await shot(page, '48-chat-match-expired');
});

// ── Tabs ───────────────────────────────────────────────────────────────────────
await scene('matches', {}, async (page) => {
  await goto(page, '/matches', 2500);
  await shot(page, '49-matches-active');
  await tap(page, 'matches.tab.validated', 1300);
  await shot(page, '50-matches-validated');
  await tap(page, 'matches.tab.expired', 1300);
  await shot(page, '51-matches-expired');
});

await scene('chats', {}, async (page) => {
  await goto(page, '/chats', 2500);
  await shot(page, '52-chats-list');
});

await scene('profile', {}, async (page) => {
  await goto(page, '/profile', 2500);
  await shot(page, '53-profile');
  await page.mouse.move(195, 500);
  await page.mouse.wheel(0, 420);
  await settle(page, 1000);
  await shot(page, '54-profile-scrolled');
  await page.mouse.wheel(0, 2000);
  await settle(page, 1000);
  await shot(page, '55-profile-settings');
});

await scene('profile-edit', {}, async (page) => {
  await goto(page, '/profile', 2000);
  await tap(page, 'profile.edit', 2200);
  await shot(page, '56-profile-edit');
  await page.mouse.move(195, 500);
  await page.mouse.wheel(0, 900);
  await settle(page, 900);
  await shot(page, '57-profile-edit-scrolled');
});

await scene('profile-view', {}, async (page) => {
  await goto(page, '/chat/m-lina', 2000);
  await page.goto('http://localhost:8081/profile-view/u-lina');
  await settle(page, 2500);
  await shot(page, '58-profile-view');
});

await scene('verify', { state: { verify: { verified: true, verifyLevel: 1 }, verifyDelayMs: 2500 } }, async (page) => {
  await mock('profile', { userId: 'u-youssef', patch: { verified: false } });
  await goto(page, '/verify-id', 2500);
  await shot(page, '59-verify-id-intro');
  const chooser = page.waitForEvent('filechooser', { timeout: 8000 });
  await page.getByRole('button').filter({ hasText: /selfie|photo|start|verify/i }).last().click();
  const fc = await chooser;
  await fc.setFiles(SELFIE);
  await page.waitForTimeout(900);
  await shot(page, '60-verify-id-checking');
  await page.waitForTimeout(3200);
  await shot(page, '61-verify-id-verified');
});

await scene('verify-failed', { state: { verify: { verified: false, verifyLevel: 0, reason: 'no_match' }, verifyDelayMs: 600 } }, async (page) => {
  await mock('profile', { userId: 'u-youssef', patch: { verified: false } });
  await goto(page, '/verify-id', 2500);
  const chooser = page.waitForEvent('filechooser', { timeout: 8000 });
  await page.getByRole('button').filter({ hasText: /selfie|photo|start|verify/i }).last().click();
  const fc = await chooser;
  await fc.setFiles(SELFIE);
  await page.waitForTimeout(2600);
  await shot(page, '62-verify-id-failed');
});

await scene('blocked', {}, async (page) => {
  await goto(page, '/blocked', 2500);
  await shot(page, '63-blocked-list');
});

await scene('dev', {}, async (page) => {
  await goto(page, '/dev', 2000);
  await shot(page, '64-dev-screen-jumper');
});

// ── Extra states (appended after the first numbering pass) ─────────────────────
await scene('geofence', { state: { checkin: { active: false } } }, async (page, ctx) => {
  await goto(page, '/', 2200);
  await page.getByText('Check in', { exact: true }).first().click();
  await settle(page, 2500);
  await tid(page, 'checkin.primaryCheckin').click();
  await settle(page, 1500);
  await shot(page, '65-checkin-confirm-sheet');
  await tid(page, 'checkin.confirm').click();
  await settle(page, 3500);
  console.log('after check-in:', page.url());
  await tid(page, 'swipe.back').click().catch(() => {});
  await settle(page, 1500);
  // Walk ~400 m away (two alternating far fixes so the watcher keeps receiving positions).
  const far = [{ latitude: 36.8101, longitude: 10.1842 }, { latitude: 36.8104, longitude: 10.1846 }];
  for (let i = 0; i < 12; i++) {
    await ctx.setGeolocation({ ...far[i % 2], accuracy: 10 });
    await page.waitForTimeout(4000);
  }
  await settle(page, 1500);
  await shot(page, '67-home-geofenced-out');
});

await scene('chat-unmatch', {}, async (page) => {
  await goto(page, '/chat/m-amira', 2500);
  await tid(page, 'chat.more').click();
  await page.waitForTimeout(1000);
  await page.getByText('Unmatch', { exact: true }).last().click();
  await page.waitForTimeout(1300);
  await shot(page, '66-chat-unmatch-confirm');
});

await browser.close();
console.log('\ndone');
