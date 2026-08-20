# Roll to Infinity

This is a really simple game where you roll for a score and hope it gets huge. Sometimes your score goes down a lot, and sometimes it suddenly jumps way higher. It is mostly luck, so there is no secret strategy to figure out.

[Play the game](https://pasterpo.github.io/Roll-To-Infinity/)

## How to play

1. Type in a name and make a 4-digit PIN.
2. Click **Start rolling**.
3. Press **Roll** and see what number you get.
4. Try to get higher than everyone else on the leaderboard.

Each roll has two possible outcomes:

- Half the time, your score becomes a random number between 0 and your current score.
- The other half, it becomes a random number between your current score and 1 trillion.

You can roll once every second. Your score cannot go below zero, and the leaderboard updates for everyone while they are playing. The game only saves your latest score, not a history of every roll.

## What it uses

- HTML, CSS, and regular JavaScript
- Firebase Realtime Database for the leaderboard
- GitHub Pages for hosting

There is no framework or build step. The whole game is in `index.html`.

## Run it yourself

Download the project and open `index.html` in a browser. The leaderboard uses the Firebase project in the code. If you make your own copy and want your own leaderboard, replace the Firebase config with one from your own project.
