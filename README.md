# Roll to Infinity

Roll a number. Half the time it crashes back toward zero, half the time it could rocket into the trillions. No skill, no strategy — just pure chaos and a live leaderboard.

**[Play it here](https://pasterpo.github.io/Roll-To-Infinity/)**

## How it works

- Pick a name and hit **Roll**.
- Every roll is a coin flip:
  - **50% chance — lower:** your score drops to a random number between 0 and your current score.
  - **50% chance — higher:** your score jumps to a random number anywhere between your current score and 1,000,000,000,000 (one trillion). No cap on how far it can go.
- Score can never go below 0.
- One roll per second — just to stop spam-clicking, doesn't reset anything.
- Your current score updates live on a shared leaderboard, visible to everyone playing. Only your *current* score is kept — no history, no old entries.

## Tech

- Single-file static frontend: HTML, CSS, vanilla JS. No framework, no build step.
- Live leaderboard backed by **Firebase Realtime Database** — writes and reads happen instantly for every visitor, no page refresh needed.
- Hosted on GitHub Pages.

## Notable bug I hit (and fixed)

Firebase security rules don't cascade `.read` permissions upward automatically. I had `.read: true` set only at the per-user path (`/leaderboard/$username`), which meant individual writes worked fine, but the app's listener on the whole `/leaderboard` node was silently getting `permission_denied`. Fixed by explicitly setting `.read: true` at the `leaderboard` parent level too.

## AI usage

Built with help from Claude (Anthropic) for the frontend code, animations, and Firebase integration. I made the actual design calls — the 50/50 roll mechanic, the uncapped high-roll range, no artificial formula shaping the randomness — and debugged the Firebase permissions issue myself using the browser console and the Firebase Rules Playground.

## Run it locally

Just open `index.html` in a browser — no build step, no dependencies to install. You'll need your own Firebase project and `firebaseConfig` if you want a working leaderboard of your own.
