const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { defineSecret } = require('firebase-functions/params');

initializeApp();
setGlobalOptions({ maxInstances: 10 });

const database = getDatabase();
const migrationKey = defineSecret('MIGRATION_KEY');
const SCORE_LIMIT = 1000000000000;
const ROLL_DELAY = 1000;

function requireAuth(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in before playing.');
  }
  return request.auth.uid;
}

function makeLegacyKey(name) {
  return name.replace(/[.#$[\]\/]/g, '_');
}

function validName(name) {
  return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 20;
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.legacyLogin = onCall(async (request) => {
  const uid = requireAuth(request);
  const name = typeof request.data?.name === 'string' ? request.data.name.trim() : '';
  const pin = typeof request.data?.pin === 'string' ? request.data.pin : '';

  if (!validName(name) || !/^[0-9]{4}$/.test(pin)) {
    throw new HttpsError('invalid-argument', 'Enter a name and a 4-digit PIN.');
  }

  const legacyKey = makeLegacyKey(name);
  const legacySnapshot = await database.ref(`leaderboard/${legacyKey}`).once('value');
  const legacyPlayer = legacySnapshot.val();
  if (!legacyPlayer || legacyPlayer.name !== name || legacyPlayer.pin !== pin) {
    throw new HttpsError('permission-denied', 'Name or PIN is incorrect.');
  }

  const claim = await database.ref(`legacyClaims/${legacyKey}`).transaction((owner) => owner || uid);
  if (!claim.committed || (claim.snapshot.val() !== uid)) {
    throw new HttpsError('already-exists', 'That player is already signed in elsewhere.');
  }

  const score = Number.isSafeInteger(legacyPlayer.score) && legacyPlayer.score >= 0
    ? Math.min(legacyPlayer.score, SCORE_LIMIT)
    : 0;
  await database.ref(`playerState/${uid}`).set({ name, score, lastRollAt: 0, legacyKey });
  await database.ref(`publicLeaderboard/${uid}`).set({ name, score });
  return { name, score };
});

exports.roll = onCall(async (request) => {
  const uid = requireAuth(request);
  const stateRef = database.ref(`playerState/${uid}`);
  let result;

  const transaction = await stateRef.transaction((state) => {
    if (!state || !validName(state.name)) return;
    const now = Date.now();
    if (now - (state.lastRollAt || 0) < ROLL_DELAY) return;

    const previousScore = Math.max(0, Math.min(Number(state.score) || 0, SCORE_LIMIT));
    const goLower = Math.random() < 0.5;
    const score = goLower
      ? randomInteger(0, previousScore)
      : randomInteger(Math.min(previousScore + 1, SCORE_LIMIT), SCORE_LIMIT);

    result = {
      name: state.name,
      previousScore,
      score,
      direction: score > previousScore ? 'up' : (score < previousScore ? 'down' : null)
    };
    return { ...state, score, lastRollAt: now };
  });

  if (!transaction.committed) {
    throw new HttpsError('resource-exhausted', 'Please wait before rolling again.');
  }

  await database.ref(`publicLeaderboard/${uid}`).update({ name: result.name, score: result.score });
  return result;
});

exports.migrateLegacyLeaderboard = onRequest({ secrets: [migrationKey] }, async (request, response) => {
  if (request.method !== 'POST' || request.get('x-migration-key') !== migrationKey.value()) {
    response.status(403).send('Forbidden');
    return;
  }

  const snapshot = await database.ref('leaderboard').once('value');
  const players = snapshot.val() || {};
  const updates = {};
  for (const [legacyKey, player] of Object.entries(players)) {
    if (!validName(player.name) || !Number.isSafeInteger(player.score)) continue;
    const safeKey = legacyKey.replace(/[^A-Za-z0-9_-]/g, '_');
    updates[`publicLeaderboard/legacy_${safeKey}`] = {
      name: player.name,
      score: Math.max(0, Math.min(player.score, SCORE_LIMIT))
    };
  }

  await database.ref().update(updates);
  response.json({ migrated: Object.keys(updates).length });
});