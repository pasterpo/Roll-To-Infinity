# Roll to Infinity

Roll the dice on your score. It might tumble toward zero, or it might shoot into the trillions. There is no strategy here, just luck and a live leaderboard.

**[Play Roll to Infinity](https://pasterpo.github.io/Roll-To-Infinity/)**

## How it works

- Choose a name and a four-digit PIN, then press **Start rolling**.
- Every roll is a coin flip:
  - **50% chance — lower:** score drops to a random number between 0 and the current score.
  - **50% chance — higher:** the score jumps to a random number between the current score and 1,000,000,000,000 (one trillion).
- Score can never go below 0.
- One roll per second.
- Current score updates live on a shared leaderboard visible to everyone playing. Only current scores are kept — no history.

## Tech

- Single-file static frontend: HTML, CSS, vanilla JS. No framework, no build step.
- Live leaderboard backed by Firebase Realtime Database.
- Hosted on GitHub Pages.

## Run locally

Open `index.html` directly in a browser. The included Firebase project powers the shared leaderboard; use your own Firebase config if you deploy a separate copy.
