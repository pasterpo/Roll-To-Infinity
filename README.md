# Roll to Infinity

Roll for a score and compete on a live leaderboard.

## Security model

The browser never submits a score. It sends a registration request or a roll request to the Cloudflare Worker in [worker.js](worker.js). The Worker generates scores with cryptographic randomness, enforces the one-second cooldown, and writes the result to D1. The browser receives only the result.

Player sessions use an `HttpOnly`, `Secure`, `SameSite=None` cookie. The cookie is not readable by page JavaScript. Usernames are unique case-insensitively, and only public name/score fields are returned by the leaderboard endpoint.

The Worker restricts browser requests to the production GitHub Pages origin and local development origins, uses prepared SQL statements, validates names and score bounds, uses an atomic cooldown check, and sends browser security headers.

## Project files

- `index.html`: static game interface.
- `worker.js`: registration, session, leaderboard, and server-side roll API.
- `schema.sql`: D1 database schema.
- `wrangler.toml`: Cloudflare Worker and D1 binding.

## Development

The deployed API is configured in `index.html` as `https://roll-to-infinity.ar-project.workers.dev`. To run a local Worker, install Wrangler, authenticate with Cloudflare, and use `wrangler dev`. Add the local origin to `ALLOWED_ORIGINS` if using a different development port.

Deploy the Worker with:

```powershell
npx wrangler d1 execute roll-to-infinity --remote --file=schema.sql
npx wrangler deploy
```

GitHub Pages hosts the static page. Cloudflare hosts the trusted API and D1 database. Do not commit credentials, tokens, database exports, or local `.env` files.
