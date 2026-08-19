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

## Known issue and fix

Firebase security rules do not cascade `.read` permissions upward automatically. `.read: true` was initially set only at the per-user path (`/leaderboard/$username`), so individual writes succeeded but the app's listener on the full `/leaderboard` node returned `permission_denied`. Resolved by setting `.read: true` at the `leaderboard` parent level as well.

## AI usage

Frontend code, animations, and Firebase integration were built with assistance from Claude (Anthropic). Design decisions — the 50/50 roll mechanic, the uncapped high-roll range, and unweighted randomness with no formula shaping outcomes — were made by the project owner. The Firebase permissions issue was diagnosed and resolved using the browser console and the Firebase Rules Playground.

## Run locally

Open `index.html` directly in a browser — no build step or dependencies required. A separate Firebase project and `firebaseConfig` are needed for a working leaderboard.
