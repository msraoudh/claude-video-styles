// Mock NearMatch API + Socket.io for screenshot capture. Never talks to any real backend.
// Shapes follow mobile/lib/api/*.ts and backend/src/modules/*.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { Server } = require('socket.io');

const PORT = 4000;
const ORIGIN = 'http://localhost:8081';
const BASE = `http://localhost:${PORT}`;
const MEDIA = path.join(__dirname, 'media');

const MIN = 60_000;
const TARGET = Date.parse(process.env.MOCK_CLOCK || '2026-10-13T21:40:00+01:00');
const OFFSET = TARGET - Date.now();
const now = () => Date.now() + OFFSET;
const iso = (ms) => new Date(ms).toISOString();
const photo = (n, i) => `${BASE}/media/${n}-${i}.jpg`;

const ME = 'u-youssef';
const VENUE = {
  id: 'ChIJ-le-comptoir-tunis',
  name: 'Le Comptoir',
};

function person(id, firstName, age, key, extra = {}) {
  return {
    id: `p-${key}`,
    userId: id,
    firstName,
    age,
    photoUrl: photo(key, 1),
    photoUrls: [photo(key, 1), photo(key, 2), photo(key, 3)],
    interests: [],
    smoking: 'non_smoker',
    drinking: 'rarely',
    sport: 'sometimes',
    looking: 'meeting',
    bio: null,
    zodiacSun: null,
    zodiacMoon: null,
    verified: false,
    verifyDeadline: null,
    ...extra,
  };
}

function freshState() {
  const t0 = now();
  const profiles = {
    [ME]: person(ME, 'Youssef', 28, 'youssef', {
      interests: ['music', 'travel', 'food', 'photo', 'concerts'],
      bio: 'Architect by day, terrible DJ by night. Looking for someone to argue about the best brik in town.',
      zodiacSun: 'leo', zodiacMoon: 'libra', verified: true, sport: 'regular', drinking: 'yes',
      verifyDeadline: iso(t0 + 20 * 24 * 60 * MIN),
    }),
    'u-lina': person('u-lina', 'Lina', 26, 'lina', {
      interests: ['music', 'cinema', 'travel', 'wines'],
      bio: 'Film nerd, espresso snob. Ask me about my top 3 Kiarostami films.',
      zodiacSun: 'gemini', zodiacMoon: 'pisces', verified: true, looking: 'relationship',
    }),
    'u-yasmine': person('u-yasmine', 'Yasmine', 25, 'yasmine', {
      interests: ['art', 'photo', 'concerts', 'parties'],
      bio: 'Painter. Collector of vinyl and bad puns.',
      zodiacSun: 'scorpio', verified: true,
    }),
    'u-amira': person('u-amira', 'Amira', 27, 'amira', {
      interests: ['reading', 'nature', 'food', 'pets'],
      bio: 'Bookshop on Saturdays, hiking on Sundays.',
      zodiacSun: 'virgo', verified: true, looking: 'relationship',
    }),
    'u-nour': person('u-nour', 'Nour', 25, 'nour', {
      interests: ['travel', 'surf', 'music'], bio: 'Surf in Kélibia, coffee in La Marsa.', zodiacSun: 'aries',
    }),
    'u-sarra': person('u-sarra', 'Sarra', 27, 'sarra', {
      interests: ['sport', 'food', 'travel'], bio: 'Marathon in progress. Brunch enthusiast.', zodiacSun: 'taurus', verified: true,
    }),
    'u-ines': person('u-ines', 'Inès', 24, 'ines', {
      interests: ['music', 'concerts', 'parties', 'travel', 'photo'],
      bio: 'Here for the live set tonight. Tell me your most underrated album.',
      zodiacSun: 'sagittarius', zodiacMoon: 'leo', verified: true, drinking: 'yes', looking: 'meeting',
    }),
    'u-mariem': person('u-mariem', 'Mariem', 28, 'mariem', {
      interests: ['wines', 'food', 'cinema'], bio: 'Chef in training. Will judge your couscous.', zodiacSun: 'cancer', verified: true,
    }),
    'u-rania': person('u-rania', 'Rania', 26, 'rania', {
      interests: ['nature', 'travel', 'photo'], bio: 'Weekend road trips. Sunset chaser.', zodiacSun: 'libra',
    }),
    'u-salma': person('u-salma', 'Salma', 25, 'salma', {
      interests: ['art', 'reading', 'music'], bio: 'Tattoo artist. Ask about the one on my wrist.', zodiacSun: 'aquarius', verified: true,
    }),
    'u-chloe': person('u-chloe', 'Chloé', 27, 'chloe', {
      interests: ['travel', 'food', 'wines'], bio: 'French in Tunis for a year. Teach me Derja?', zodiacSun: 'pisces',
    }),
    'u-emna': person('u-emna', 'Emna', 26, 'emna', {}),
  };

  const match = (id, other, status, createdAgoMin, extra = {}) => ({
    id,
    pairKey: [ME, other].sort().join(':'),
    userAId: ME,
    userBId: other,
    googlePlaceId: VENUE.id,
    placeName: VENUE.name,
    status,
    createdAt: iso(t0 - createdAgoMin * MIN),
    expiresAt: iso(t0 - createdAgoMin * MIN + 45 * MIN),
    validatedAt: null,
    expiredAt: null,
    ...extra,
  });

  const matches = [
    match('m-lina', 'u-lina', 'active', 17),
    match('m-yasmine', 'u-yasmine', 'active', 2),
    match('m-amira', 'u-amira', 'validated', 60 * 26, {
      googlePlaceId: 'ChIJ-cafe-bourguiba', placeName: 'Café Bourguiba',
      validatedAt: iso(t0 - (60 * 26 - 21) * MIN),
    }),
    match('m-sarra', 'u-sarra', 'validated', 60 * 24 * 5, {
      googlePlaceId: 'ChIJ-studio-lounge', placeName: 'Studio Lounge',
      validatedAt: iso(t0 - (60 * 24 * 5 - 30) * MIN),
    }),
    match('m-nour', 'u-nour', 'expired', 60 * 20, {
      googlePlaceId: 'ChIJ-studio-lounge', placeName: 'Studio Lounge',
      expiredAt: iso(t0 - (60 * 20 - 45) * MIN),
    }),
  ];

  let seq = 0;
  const msg = (matchId, senderId, body, agoMin, extra = {}) => ({
    id: `msg-${++seq}`,
    matchId,
    senderId,
    body,
    kind: 'text',
    zone: null,
    createdAt: iso(t0 - agoMin * MIN),
    readAt: senderId === ME ? iso(t0 - agoMin * MIN + 20_000) : null,
    ...extra,
  });

  const messages = {
    'm-lina': [
      msg('m-lina', 'u-lina', 'Hey! Is that you by the window? 👀', 14, { readAt: iso(t0 - 13 * MIN) }),
      msg('m-lina', ME, 'Haha yes, the one with the very serious mojito', 13),
      msg('m-lina', ME, 'Where are you sitting?', 13),
      msg('m-lina', 'u-lina', 'Right at the bar, red top 🙂', 6, { zone: 'au_bar' }),
      msg('m-lina', 'u-lina', 'Come say hi before the timer runs out?', 5),
    ],
    'm-yasmine': [],
    'm-amira': [
      msg('m-amira', 'u-amira', 'That was the best spontaneous coffee ever ☕', 60 * 25, { readAt: iso(t0 - 60 * 24 * MIN) }),
      msg('m-amira', ME, 'Agreed. Same place on Saturday?', 60 * 24),
      msg('m-amira', 'u-amira', "Deal. I'll bring the board game 😄", 60 * 3, { readAt: iso(t0 - 60 * 2 * MIN) }),
      msg('m-amira', 'u-amira', 'And you owe me a rematch', 60 * 3 - 1),
    ],
    'm-sarra': [
      msg('m-sarra', ME, 'Good luck at the run tomorrow!', 60 * 24 * 2),
      msg('m-sarra', 'u-sarra', 'Thanks!! See you Friday?', 60 * 24 * 2 - 30, { readAt: iso(t0 - 60 * 24 * MIN) }),
    ],
    'm-nour': [],
  };

  // The chat previews GET /matches carries (backend MatchesService.listWithChats).
  return {
    profiles,
    matches,
    messages,
    seq,
    me: { id: ME, phone: 'oauth:google:demo', hasProfile: true },
    consent: { terms: true, ai: true },
    checkin: { active: true, googlePlaceId: VENUE.id, displayName: VENUE.name, placeType: 'bar', countryCode: 'TN' },
    deck: ['u-ines', 'u-mariem', 'u-rania', 'u-salma', 'u-chloe'],
    matchOnLike: ['u-ines'],
    meet: {}, // matchId -> MeetState
    likes: { total: 7, here: 3, hereSuppressed: false },
    blocks: [{ blockedId: 'u-emna', firstName: 'Emna', photoUrl: photo('emna', 1), createdAt: iso(t0 - 3 * 24 * 60 * MIN) }],
    counts: {
      'ChIJ-le-comptoir-tunis': 14,
      'ChIJ-cafe-bourguiba': 6,
      'ChIJ-studio-lounge': 23,
      'ChIJ-la-terrasse': 9,
      'ChIJ-iron-gym': 4,
      'ChIJ-jardin-centre': 3,
      'ChIJ-galerie-32': 5,
    },
    code: '4827',
    verify: { verified: true, verifyLevel: 1 },
    photoKeys: [],
    pending: [],
    failSwipe: false,
  };
}

let S = freshState();

function chatPreview(m) {
  const list = S.messages[m.id] || [];
  const last = list[list.length - 1];
  return {
    ...m,
    lastMessage: last ? { body: last.body, senderId: last.senderId, kind: last.kind, createdAt: last.createdAt } : null,
    unreadCount: list.filter((x) => x.senderId !== ME && !x.readAt).length,
  };
}

function send(res, status, body, extraHeaders = {}) {
  const headers = {
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Expose-Headers': 'x-server-time',
    'x-server-time': String(now()),
    ...extraHeaders,
  };
  if (body === undefined || status === 204) {
    res.writeHead(status, headers);
    res.end();
    return;
  }
  headers['Content-Type'] = 'application/json';
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { resolve({ __raw: raw.length }); }
    });
  });
}

const log = [];
let io;

function emitAll(event, payload) {
  io.emit(event, payload);
}

function meetState(matchId) {
  return S.meet[matchId] || { phase: 'idle', frozen: false };
}

async function handle(req, res) {
  const url = new URL(req.url, BASE);
  const p = url.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': ORIGIN,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '*',
      'Access-Control-Max-Age': '600',
    });
    return res.end();
  }

  if (p.startsWith('/media/')) {
    const f = path.join(MEDIA, path.basename(p));
    if (!fs.existsSync(f)) return send(res, 404, { error: 'nf' });
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' });
    return fs.createReadStream(f).pipe(res);
  }
  if (p.startsWith('/upload/')) {
    req.resume();
    return req.on('end', () => send(res, 200, {}));
  }

  const body = method === 'GET' ? {} : await readBody(req);
  log.push(`${method} ${p}`);
  if (log.length > 400) log.shift();

  // ── control plane (used by the capture script) ──
  if (p === '/__mock/reset') { S = freshState(); return send(res, 200, { ok: true }); }
  if (p === '/__mock/set') { Object.assign(S, body); return send(res, 200, { ok: true }); }
  if (p === '/__mock/patch-me') { Object.assign(S.me, body); return send(res, 200, S.me); }
  if (p === '/__mock/profile') { Object.assign(S.profiles[body.userId], body.patch); return send(res, 200, S.profiles[body.userId]); }
  if (p === '/__mock/meet') { S.meet[body.matchId] = body.state; return send(res, 200, { ok: true }); }
  if (p === '/__mock/emit') { emitAll(body.event, body.payload); return send(res, 200, { ok: true, sockets: io.engine.clientsCount }); }
  if (p === '/__mock/push-message') {
    const list = S.messages[body.matchId] || (S.messages[body.matchId] = []);
    const m = {
      id: `msg-${++S.seq}`, matchId: body.matchId, senderId: body.senderId, body: body.body,
      kind: body.kind || 'text', zone: body.zone || null, createdAt: iso(now()), readAt: null,
    };
    list.push(m);
    emitAll('message:new', { matchId: body.matchId, message: m });
    emitAll('match:newMessage', { matchId: body.matchId, message: m });
    return send(res, 200, m);
  }
  if (p === '/__mock/log') return send(res, 200, log);
  if (p === '/__mock/clock') return send(res, 200, { offset: OFFSET, now: now() });
  if (p === '/__mock/state') return send(res, 200, S);

  // ── /health + /v1 ──
  if (p === '/health') return send(res, 200, { status: 'ok', ts: now(), version: 'mock' });
  if (!p.startsWith('/v1/')) return send(res, 404, { error: 'not_found' });
  const r = p.slice(3);
  let m;

  if (r === '/config') return send(res, 200, { matchTimerMinutes: 45, meetingCodeTtlMinutes: 10 });

  // auth
  if (r === '/auth/refresh') return send(res, 200, { accessToken: 'mock-access-token' });
  if (r === '/auth/me') return send(res, 200, S.me);
  if (r === '/auth/logout') return send(res, 204);
  if (r === '/auth/apple' || r === '/auth/google' || r === '/auth/oauth/exchange') {
    return send(res, 200, { accessToken: 'mock-access-token', user: S.me, isNew: !S.me.hasProfile });
  }

  // consent
  if (r === '/consent' && method === 'GET') {
    const v = (acc) => ({ currentVersion: '2026-10-06', accepted: acc, acceptedAt: acc ? iso(now() - 86400000) : null });
    return send(res, 200, { terms: v(S.consent.terms), aiProcessing: v(S.consent.ai) });
  }
  if (r === '/consent' && method === 'POST') {
    if (body.kind === 'terms') S.consent.terms = true; else S.consent.ai = true;
    return send(res, 201, { kind: body.kind, version: body.version, acceptedAt: iso(now()) });
  }

  // users
  if (r === '/users/profile' && method === 'POST') {
    const prof = { ...S.profiles[ME], ...body, age: 28 };
    delete prof.birthdate;
    S.profiles[ME] = prof;
    S.me.hasProfile = true;
    return send(res, 201, prof);
  }
  if (r === '/users/me' && method === 'GET') {
    if (!S.me.hasProfile) return send(res, 404, { code: 'profile_not_found', message: 'No profile' });
    return send(res, 200, S.profiles[ME]);
  }
  if (r === '/users/me' && method === 'PATCH') { Object.assign(S.profiles[ME], body); return send(res, 200, S.profiles[ME]); }
  if (r === '/users/me' && method === 'DELETE') return send(res, 204);
  if ((m = /^\/users\/([^/]+)$/.exec(r))) {
    const prof = S.profiles[decodeURIComponent(m[1])];
    return prof ? send(res, 200, prof) : send(res, 404, { code: 'not_found', message: 'Not found' });
  }

  // photos
  if (r === '/photos/presign') {
    const n = (S.photoKeys.length % 3) + 1;
    const key = `users/${ME}/youssef-${n}.jpg`;
    return send(res, 200, { uploadUrl: `${BASE}/upload/${key}`, key, publicUrl: `${BASE}/media/${key}` });
  }
  if (r === '/photos/confirm') {
    S.photoKeys.push(body.key);
    await new Promise((ok) => setTimeout(ok, S.confirmDelayMs || 300));
    return send(res, 200, { ok: true, key: body.key, publicUrl: `${BASE}/media/${body.key}`, photoKeys: S.photoKeys });
  }
  if (r === '/photos/pending') {
    const urls = (S.pending || []).map((n) => `${BASE}/media/users/${ME}/${n}.jpg`);
    return send(res, 200, { photoKeys: urls.map((u) => u.slice(u.indexOf('/users/') + 1)), photoUrls: urls });
  }
  if (r === '/photos/order') return send(res, 200, { ok: true, photoKeys: body.keys || [] });
  if (r === '/photos/remove') return send(res, 200, { ok: true, photoKeys: [] });
  if (r === '/photos/me') return send(res, 204);

  // verify
  if (r === '/verify/status') return send(res, 200, { ...S.verify, verifyDeadline: S.profiles[ME].verifyDeadline });
  if (r === '/verify/selfie/presign') return send(res, 200, { uploadUrl: `${BASE}/upload/selfie.jpg`, key: 'selfies/x.jpg' });
  if (r === '/verify/selfie') {
    await new Promise((ok) => setTimeout(ok, S.verifyDelayMs || 1200));
    return send(res, 200, S.verify);
  }

  // checkin
  if (r === '/checkin/start') {
    S.checkin = { active: true, googlePlaceId: body.googlePlaceId, displayName: body.displayName, placeType: body.placeType, countryCode: body.countryCode };
    return send(res, 201, { checkinId: 'c-1', googlePlaceId: body.googlePlaceId, invisible: false });
  }
  if (r === '/checkin/heartbeat') return send(res, 200, { active: S.checkin.active, googlePlaceId: S.checkin.googlePlaceId });
  if (r === '/checkin/leave') { S.checkin = { active: false }; return send(res, 200, { ok: true, expiredMatches: 0 }); }
  if (r === '/checkin/me') return send(res, 200, S.checkin.active ? S.checkin : { active: false });
  if (r === '/checkin/nearby-counts') {
    const counts = {};
    for (const id of body.googlePlaceIds || []) counts[id] = S.counts[id] ?? 2;
    return send(res, 200, { counts });
  }
  if (r === '/checkin/peers') return send(res, 200, { peers: S.deck.map((id) => S.profiles[id]).filter(Boolean) });

  // swipes
  if (r === '/swipes/likes-received') return send(res, 200, S.likes);
  if (r === '/swipes' && method === 'POST') {
    S.deck = S.deck.filter((id) => id !== body.swipedUserId);
    const out = { swipeId: `s-${now()}` };
    if (body.decision === 'like' && S.matchOnLike.includes(body.swipedUserId)) {
      const t0 = now();
      const key = body.swipedUserId.replace(/^u-/, '');
      const mm = {
        id: `m-${key}`, pairKey: [ME, body.swipedUserId].sort().join(':'), userAId: ME, userBId: body.swipedUserId,
        googlePlaceId: body.googlePlaceId || VENUE.id, placeName: body.placeName || VENUE.name, status: 'active',
        createdAt: iso(t0), expiresAt: iso(t0 + 45 * MIN), validatedAt: null, expiredAt: null,
      };
      S.matches = [mm, ...S.matches.filter((x) => x.id !== mm.id)];
      S.messages[mm.id] = S.messages[mm.id] || [];
      out.match = mm;
    }
    return send(res, 201, out);
  }

  // matches
  if (r === '/matches' && method === 'GET') {
    const st = url.searchParams.get('status');
    const list = S.matches.filter((x) => !st || x.status === st).map(chatPreview);
    return send(res, 200, { matches: list });
  }
  if ((m = /^\/matches\/([^/]+)$/.exec(r))) {
    const mm = S.matches.find((x) => x.id === m[1]);
    return mm ? send(res, 200, mm) : send(res, 404, { code: 'match_not_found', message: 'Not found' });
  }
  if ((m = /^\/matches\/([^/]+)\/unmatch$/.exec(r))) return send(res, 204);

  // chat
  if ((m = /^\/chat\/([^/]+)\/messages$/.exec(r)) && method === 'GET') {
    return send(res, 200, { messages: S.messages[m[1]] || [] });
  }
  if ((m = /^\/chat\/([^/]+)\/messages$/.exec(r)) && method === 'POST') {
    const list = S.messages[m[1]] || (S.messages[m[1]] = []);
    const msg = {
      id: `msg-${++S.seq}`, matchId: m[1], senderId: ME, body: body.body, kind: 'text', zone: body.zone || null,
      createdAt: iso(now()), readAt: null,
    };
    list.push(msg);
    return send(res, 201, { message: msg });
  }
  if ((m = /^\/chat\/([^/]+)\/read$/.exec(r))) {
    for (const x of S.messages[m[1]] || []) if (x.senderId !== ME && !x.readAt) x.readAt = iso(now());
    return send(res, 204);
  }

  // codes / meet handshake
  if ((m = /^\/codes\/([^/]+)\/meet-state$/.exec(r))) return send(res, 200, { state: meetState(m[1]) });
  if ((m = /^\/codes\/([^/]+)\/meet-request$/.exec(r))) {
    const request = { matchId: m[1], requesterId: ME, mode: body.mode, createdAt: now() };
    S.meet[m[1]] = { phase: 'requested', request, frozen: false };
    return send(res, 201, { request });
  }
  if ((m = /^\/codes\/([^/]+)\/meet-response$/.exec(r))) {
    const cur = meetState(m[1]);
    const other = S.matches.find((x) => x.id === m[1])?.userBId;
    if (!body.accept) { S.meet[m[1]] = { phase: 'idle', frozen: false }; return send(res, 200, { state: S.meet[m[1]] }); }
    const mode = cur.request?.mode || 'come_to_me';
    // come_to_me: the requester stays and shows the code.
    const requester = cur.request?.requesterId || other;
    const partner = requester === ME ? other : ME;
    const showerId = mode === 'come_to_me' ? requester : partner;
    const entererId = showerId === ME ? other : ME;
    S.meet[m[1]] = { phase: 'accepted', showerId, entererId, codeExpiresAt: now() + 10 * MIN, frozen: true };
    return send(res, 200, { state: S.meet[m[1]] });
  }
  if ((m = /^\/codes\/([^/]+)\/meet-cancel$/.exec(r))) {
    S.meet[m[1]] = { phase: 'idle', frozen: false };
    return send(res, 200, { state: S.meet[m[1]] });
  }
  if ((m = /^\/codes\/([^/]+)\/(generate|regenerate)$/.exec(r))) {
    const exp = S.meet[m[1]]?.codeExpiresAt || now() + 10 * MIN;
    return send(res, 200, { code: S.code, expiresAt: exp });
  }
  if ((m = /^\/codes\/([^/]+)\/verify$/.exec(r))) {
    if (S.codeVerifyDelayMs) await new Promise((ok) => setTimeout(ok, S.codeVerifyDelayMs));
    if (String(body.code) !== S.code) {
      return send(res, 400, { code: 'meeting_code_invalid', message: 'Invalid code', details: { attemptsLeft: 3 } });
    }
    const mm = S.matches.find((x) => x.id === m[1]);
    if (mm) { mm.status = 'validated'; mm.validatedAt = iso(now()); }
    S.meet[m[1]] = { phase: 'idle', frozen: false };
    setTimeout(() => emitAll('match:validated', { matchId: m[1], validatedAt: mm?.validatedAt }), 50);
    return send(res, 200, { match: mm });
  }

  // notifications
  if (r === '/notifications/token') return method === 'DELETE' ? send(res, 204) : send(res, 200, { ok: true });

  // reports & blocks
  if (r === '/reports' && method === 'POST') return send(res, 201, { id: 'r-1', status: 'open' });
  if (r === '/reports/block' && method === 'POST') return send(res, 201, { id: 'b-1' });
  if (r === '/reports/blocks') return send(res, 200, { blocks: S.blocks });
  if ((m = /^\/reports\/block\/([^/]+)$/.exec(r))) {
    S.blocks = S.blocks.filter((b) => b.blockedId !== m[1]);
    return send(res, 204);
  }

  return send(res, 404, { code: 'not_found', message: `mock: no route ${method} ${r}` });
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => {
    console.error(e);
    send(res, 500, { code: 'mock_error', message: String(e) });
  });
});

io = new Server(server, { cors: { origin: true, credentials: true } });
io.on('connection', (socket) => {
  socket.on('match:join', () => {});
  socket.on('match:leave', () => {});
  socket.on('match:subscribeAll', () => {});
  socket.on('zone:set', () => {});
  socket.on('presence:heartbeat', () => {});
});

server.listen(PORT, () => console.log(`mock api on ${BASE}`));
