const SCORE_LIMIT = 1000000000000;
const ROLL_DELAY = 1000;
const SESSION_COOKIE = 'roll_session';
const ALLOWED_ORIGINS = new Set([
  'https://pasterpo.github.io',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
]);

function originFor(request) {
  const origin = request.headers.get('Origin');
  return ALLOWED_ORIGINS.has(origin) ? origin : null;
}

function responseHeaders(request, contentType = 'application/json') {
  const origin = originFor(request);
  return {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    ...(origin ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin'
    } : {})
  };
}

function json(request, data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...responseHeaders(request), ...extraHeaders }
  });
}

function requestOriginAllowed(request) {
  return !request.headers.get('Origin') || Boolean(originFor(request));
}

function cookieHeader(token) {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=None`;
}

function readCookie(request, name) {
  const cookies = request.headers.get('Cookie') || '';
  return cookies.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || null;
}

async function hashToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function secureRandomInt(min, max) {
  const range = max - min + 1;
  const limit = Math.floor(0x100000000 / range) * range;
  const values = new Uint32Array(1);
  do crypto.getRandomValues(values); while (values[0] >= limit);
  return min + (values[0] % range);
}

function validName(name) {
  return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 20;
}

async function currentPlayer(request, env) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  return env.DB.prepare('SELECT id, name, score, last_roll_at FROM players WHERE token_hash = ?')
    .bind(await hashToken(token)).first();
}

async function register(request, env) {
  const body = await request.json();
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!validName(name)) return json(request, { error: 'Enter a name up to 20 characters.' }, 400);

  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const id = crypto.randomUUID();
  try {
    await env.DB.prepare('INSERT INTO players (id, name, token_hash, created_at) VALUES (?, ?, ?, ?)')
      .bind(id, name, await hashToken(token), Date.now()).run();
  } catch (error) {
    if (String(error).toLowerCase().includes('unique')) return json(request, { error: 'Username already used.' }, 409);
    throw error;
  }
  return json(request, { name, score: 0 }, 201, { 'Set-Cookie': cookieHeader(token) });
}

async function me(request, env) {
  const player = await currentPlayer(request, env);
  return player ? json(request, { name: player.name, score: player.score }) : json(request, { error: 'No active session.' }, 401);
}

async function roll(request, env) {
  const player = await currentPlayer(request, env);
  if (!player) return json(request, { error: 'Start a game first.' }, 401);

  const now = Date.now();
  const previousScore = Math.max(0, Math.min(Number(player.score) || 0, SCORE_LIMIT));
  const nextScore = secureRandomInt(0, 1) === 0
    ? secureRandomInt(0, previousScore)
    : secureRandomInt(Math.min(previousScore + 1, SCORE_LIMIT), SCORE_LIMIT);
  const update = await env.DB.prepare(
    'UPDATE players SET score = ?, last_roll_at = ? WHERE id = ? AND last_roll_at <= ?'
  ).bind(nextScore, now, player.id, now - ROLL_DELAY).run();

  if (update.meta.changes !== 1) return json(request, { error: 'Please wait before rolling again.' }, 429);
  return json(request, {
    previousScore,
    score: nextScore,
    direction: nextScore > previousScore ? 'up' : (nextScore < previousScore ? 'down' : null)
  });
}

async function leaderboard(request, env) {
  const result = await env.DB.prepare('SELECT name, score FROM players ORDER BY score DESC, created_at ASC LIMIT 100').all();
  return json(request, result.results);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      if (!originFor(request)) return new Response(null, { status: 403 });
      return new Response(null, {
        headers: {
          ...responseHeaders(request),
          'Access-Control-Allow-Headers': 'content-type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        }
      });
    }
    if (!requestOriginAllowed(request)) return json(request, { error: 'Origin not allowed.' }, 403);

    try {
      const url = new URL(request.url);
      if (url.pathname === '/register' && request.method === 'POST') return register(request, env);
      if (url.pathname === '/me' && request.method === 'GET') return me(request, env);
      if (url.pathname === '/roll' && request.method === 'POST') return roll(request, env);
      if (url.pathname === '/leaderboard' && request.method === 'GET') return leaderboard(request, env);
      return json(request, { error: 'Not found.' }, 404);
    } catch (error) {
      console.error(error);
      return json(request, { error: 'Server error.' }, 500);
    }
  }
};
