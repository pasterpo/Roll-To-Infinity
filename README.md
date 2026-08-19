# Roll to Infinity

Roll a number. Half the time it crashes back toward zero, half the time it could rocket into the trillions. No skill, no strategy — just pure chaos and a live leaderboard.
 
**[Play it here](https://pasterpo.github.io/Roll-To-Infinity/)**

## How it works

- Pick a name and hit **Roll**.
- Every roll is a coin flip:
  - **50% chance — lower:** score drops to a random number between 0 and the current score.
  - **50% chance — higher:** score jumps to a random number between the current score and 1,000,000,000,000 (one trillion). No cap on how far it can go.
- Score can never go below 0.
- One roll per second.
- Current score updates live on a shared leaderboard visible to everyone playing. Only current scores are kept — no history.

## Tech

- Single-file static frontend: HTML, CSS, vanilla JS. No framework, no build step.
- Live leaderboard backed by Firebase Realtime Database.
- Hosted on GitHub Pages.

## AI usage

Built with assistance from Claude (Anthropic).

## Run locally

Open `index.html` directly in a browser. A separate Firebase project and config are needed for a working leaderboard.
