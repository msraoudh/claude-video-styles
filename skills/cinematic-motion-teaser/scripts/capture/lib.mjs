import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

export const APP = 'http://localhost:8081';
export const MOCK = 'http://localhost:4000';
export const OUT = process.env.OUT_DIR || '/home/you/nearmatch-motion/screens';
export const SCALE = Number(process.env.SCALE || 3);

export const GEO = { latitude: 36.8065, longitude: 10.1815, accuracy: 12 };

// Fixture venues around Avenue Habib Bourguiba, Tunis (fictional names). Le Comptoir is the closest.
const VENUES = [
  { id: 'ChIJ-le-comptoir-tunis', name: 'Le Comptoir', types: ['bar'], addr: 'Av. Habib Bourguiba, Tunis', lat: 36.80662, lng: 10.18163 },
  { id: 'ChIJ-cafe-bourguiba', name: 'Café Bourguiba', types: ['cafe'], addr: 'Rue de Marseille, Tunis', lat: 36.80612, lng: 10.18101 },
  { id: 'ChIJ-studio-lounge', name: 'Studio Lounge', types: ['night_club'], addr: 'Rue Ibn Khaldoun, Tunis', lat: 36.80721, lng: 10.18236 },
  { id: 'ChIJ-la-terrasse', name: 'La Terrasse', types: ['restaurant'], addr: 'Rue de Rome, Tunis', lat: 36.80581, lng: 10.18232 },
  { id: 'ChIJ-iron-gym', name: 'Iron Gym', types: ['gym'], addr: 'Rue de Hollande, Tunis', lat: 36.80745, lng: 10.18062 },
  { id: 'ChIJ-galerie-32', name: 'Galerie 32', types: ['art_gallery'], addr: 'Rue Charles de Gaulle, Tunis', lat: 36.80778, lng: 10.18144 },
  { id: 'ChIJ-jardin-centre', name: 'Jardin du Centre', types: ['park'], addr: 'Place de l\'Indépendance, Tunis', lat: 36.80532, lng: 10.18166 },
];
const toPlace = (v) => ({
  id: v.id,
  displayName: { text: v.name, languageCode: 'fr' },
  shortFormattedAddress: v.addr,
  types: v.types,
  primaryType: v.types[0],
  location: { latitude: v.lat, longitude: v.lng },
});

let patchedBundle = null;

export const ME_SHELL = { id: 'u-youssef', phone: 'oauth:google:demo', hasProfile: true };

export async function mock(route, body = {}) {
  const r = await fetch(`${MOCK}/__mock/${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json().catch(() => ({}));
}

export async function launch() {
  return chromium.launch({
    args: ['--font-render-hinting=none', '--disable-lcd-text', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });
}

export async function newContext(browser, { loggedIn = true, shell = ME_SHELL, video = null, scale = SCALE, locale = 'en-US' } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: scale,
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
    locale,
    timezoneId: 'Africa/Tunis',
    geolocation: GEO,
    permissions: ['geolocation', 'notifications', 'camera'],
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    ...(video ? { recordVideo: { dir: video, size: { width: 390 * 2, height: 844 * 2 } } } : {}),
  });

  // Capture-time shim (served bundle only, repo untouched): expo-notifications' web emitter has no
  // getLastNotificationResponse, so the tab bar's useLastNotificationResponse() throws on web.
  await ctx.route(/entry\.bundle\?/, async (r) => {
    if (!patchedBundle) {
      const resp = await r.fetch();
      let body = await resp.text();
      const before = body.length;
      body = body.replace(
        /(Emitting notifications is not yet fully supported[\s\S]{0,300}?removeListeners: \(\) => \{\})/,
        '$1, getLastNotificationResponse: () => null, clearLastNotificationResponse: () => {}',
      );
      if (body.length === before) console.log('WARN: notifications shim not applied');
      // expo-location web: the watcher's stop() calls an EventEmitter method that no longer exists.
      const loc = '_LocationEventEmitter.LocationEventEmitter.removeSubscription(this.eventSubscription);';
      if (!body.includes(loc)) console.log('WARN: location shim not applied');
      body = body.replace(loc, 'this.eventSubscription && this.eventSubscription.remove && this.eventSubscription.remove();');
      patchedBundle = { body, headers: resp.headers() };
    }
    return r.fulfill({ status: 200, headers: { 'content-type': 'application/javascript' }, body: patchedBundle.body });
  });

  // Safety: nothing may reach a real NearMatch backend, Sentry or Google.
  await ctx.route(/getnearmatch\.com|kolide\.app|sentry\.io|15\.224\.28\.139/, (r) => r.abort());
  await ctx.route(/places\.googleapis\.com/, async (r) => {
    const req = r.request();
    const cors = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
    };
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
    const url = req.url();
    if (url.includes(':searchNearby')) {
      return r.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ places: VENUES.map(toPlace) }) });
    }
    const m = /\/v1\/places\/([^?]+)/.exec(url);
    const v = VENUES.find((x) => m && decodeURIComponent(m[1]) === x.id);
    if (v) return r.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(toPlace(v)) });
    return r.fulfill({ status: 404, headers: cors, body: '{}' });
  });

  // The scene happens at 21:40 in Tunis: shift the browser's Date by the mock server's offset
  // (timers, rAF and performance.now are untouched, so animations run normally).
  const { offset } = await (await fetch(`${MOCK}/__mock/clock`)).json();
  await ctx.addInitScript((OFF) => {
    const RealDate = Date;
    class ShiftedDate extends RealDate {
      constructor(...a) { if (a.length === 0) super(RealDate.now() + OFF); else super(...a); }
      static now() { return RealDate.now() + OFF; }
    }
    ShiftedDate.parse = RealDate.parse;
    ShiftedDate.UTC = RealDate.UTC;
    window.Date = ShiftedDate;
  }, offset);

  const seed = {
    'nm_auth_user': loggedIn ? JSON.stringify(shell) : null,
  };
  // Pre-fill the places cache so venue names resolve instantly.
  await ctx.addInitScript(({ seed, venues }) => {
    try {
      if (sessionStorage.getItem('__seeded')) return;
      sessionStorage.setItem('__seeded', '1');
      for (const [k, v] of Object.entries(seed)) {
        if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v);
      }
    } catch {}
  }, { seed, venues: VENUES });
  // Web-only paint-order fix: react-native-svg renders a non-positioned <svg>, so an absolutely
  // positioned sibling drawn before it (GlassFill) paints over the icon. On native, later siblings
  // always paint on top; making svg positioned restores that order. Capture-time CSS only.
  await ctx.addInitScript(() => {
    const add = () => {
      const st = document.createElement('style');
      st.textContent = 'svg, textarea, input { position: relative; } * { scrollbar-width: none; } ::-webkit-scrollbar { display: none; } input, textarea { caret-color: transparent; } *:focus, *:focus-visible { outline: none !important; }';
      document.head.appendChild(st);
    };
    if (document.head) add(); else document.addEventListener('DOMContentLoaded', add);
  });
  return ctx;
}

export function attachLogs(page, tag = '') {
  page.on('pageerror', (e) => console.log(`[pageerror${tag}]`, e.message.slice(0, 400)));
  page.on('console', (m) => {
    if (m.type() === 'error') {
      const t = m.text();
      if (/vibrate|Failed to load resource|ERR_FAILED/.test(t)) return;
      console.log(`[console.error${tag}]`, t.slice(0, 300));
    }
  });
}

export async function settle(page, ms = 1500) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await page.waitForTimeout(ms);
}

export async function goto(page, route, ms = 1800) {
  await page.goto(APP + route, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await settle(page, ms);
}

/** Client-side navigation (keeps app state, like a tap would). */
export async function nav(page, route, ms = 1800) {
  await page.evaluate((r) => {
    // expo-router exposes the router on window only in dev; fall back to history API.
    window.history.pushState({}, '', r);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, route);
  await settle(page, ms);
}

export async function shot(page, name, { fullPage = false } = {}) {
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage, animations: 'allow' });
  console.log('saved', file);
  return file;
}
