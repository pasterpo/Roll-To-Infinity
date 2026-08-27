const SCORE_LIMIT = 1000000000000;
const ROLL_DELAY = 1000;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type, x-player-token',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
  });
}

async function hashToken(token) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomInteger(min, max) {
  const range = max - min + 1;
  const values = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / range) * range;
  do crypto.getRandomValues(values); while (values[0] >= limit);
  return min + (values[0] % range);
}

async function register(request, env) {
  const { name } = await request.json();
  const cleanName = typeof name === 'string' ? name.trim() : '';
  if (!cleanName || cleanName.length > 20) return json({ error: 'Enter a name up to 20 characters.' }, 400);

  const id = crypto.randomUUID();
  const token = crypto.randomUUID() + crypto.randomUUID();
  const tokenHash = await hashToken(token);
  try {
    await env.DB.prepare('INSERT INTO players (id, name, token_hash) VALUES (?, ?, ?)')
      .bind(id, cleanName, tokenHash).run();
  } catch (error) {
    if (String(error).includes('UNIQUE')) return json({ error: 'Username already used.' }, 409);
    throw error;
  }
  return json({ token, id, name: cleanName, score: 0 });
}

async function roll(request, env) {
  const token = request.headers.get('x-player-token');
  if (!token) return json({ error: 'Player token required.' }, 401);
  const tokenHash = await hashToken(token);
  const player = await env.DB.prepare('SELECT * FROM players WHERE token_hash = ?').bind(tokenHash).first();
  if (!player) return json({ error: 'Player session not found.' }, 401);

  const now = Date.now();
  if (now - player.last_roll_at < ROLL_DELAY) return json({ error: 'Please wait before rolling again.' }, 429);
  const previousScore = Math.max(0, Math.min(player.score, SCORE_LIMIT));
  const nextScore = Math.random() < 0.5
    ? randomInteger(0, previousScore)
    : randomInteger(Math.min(previousScore + 1, SCORE_LIMIT), SCORE_LIMIT);
  await env.DB.prepare('UPDATE players SET score = ?, last_roll_at = ? WHERE id = ?')
    .bind(nextScore, now, player.id).run();
  return json({ previousScore, score: nextScore, direction: nextScore > previousScore ? 'up' : (nextScore < previousScore ? 'down' : null) });
}

async function leaderboard(env) {
  const result = await env.DB.prepare('SELECT name, score FROM players ORDER BY score DESC LIMIT 100').all();
  return json(result.results);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
    try {
      const url = new URL(request.url);
      if (url.pathname === '/register' && request.method === 'POST') return register(request, env);
      if (url.pathname === '/roll' && request.method === 'POST') return roll(request, env);
      if (url.pathname === '/leaderboard' && request.method === 'GET') return leaderboard(env);
      return json({ error: 'Not found.' }, 404);
    } catch (error) {
      console.error(error);
      return json({ error: 'Server error.' }, 500);
    }
  }
};