# Neon Strike

A fast-paced, minimalist 3D first-person shooter with neon aesthetics for the web browser.

![Neon Strike Game](assets/textures/screenshot.png)

## Overview

**Neon Strike** is a simple yet addictive browser-based FPS where you blast glowing enemies in a neon-lit arena while chasing a high score. The game features:

- Vibrant neon visuals
- Fast-paced gameplay
- Increasing difficulty with each wave
- Shareable scores for social media

**Tagline:** "Survive the glow. Share the score."

## How to Play

1. Open `index.html` in a modern web browser (Chrome, Firefox, Edge recommended)
2. Click the "START GAME" button
3. Use the following controls:
   - **WASD**: Move around
   - **Mouse**: Aim
   - **Left Click**: Shoot
   - **Spacebar**: Jump
4. Survive as long as possible by shooting enemies before they reach you
5. Each enemy destroyed gives you 10 points
6. Clearing a wave gives you a 50-point bonus
7. Share your score on social media when the game ends

## Game Mechanics

- Enemies spawn in waves from the edges of the arena
- Each wave increases in difficulty with more enemies
- Enemies move toward the player
- Player loses health when enemies make contact
- Game ends when player health reaches zero

## Technical Details

### Built With

- **HTML5**: Game structure and canvas
- **CSS3**: Styling and visual effects
- **JavaScript**: Game logic and rendering
- **Three.js**: 3D graphics rendering (loaded via CDN)
- **Howler.js**: Sound effects and music (loaded via CDN)

### Project Structure

```
NeonStrike/
├── index.html        # Main entry point
├── styles.css        # UI styling
├── js/
│   ├── main.js       # Game setup, loop, and rendering
│   ├── player.js     # Player movement and shooting
│   ├── enemy.js      # Enemy spawning and AI
│   ├── ui.js         # Score, health, and overlays
│   └── audio.js      # Sound management
├── assets/
│   ├── sounds/       # Game sound effects
│   └── textures/     # Game textures
└── lib/              # Third-party libraries
```

## Development

This game was built as a simple demonstration of browser-based 3D gaming. To modify or extend the game:

1. Clone the repository
2. Make changes to the JavaScript files in the `js/` directory
3. Open `index.html` to test your changes
4. No build process required - it's all vanilla JavaScript!

> **Note**: The game uses CDN links to load Three.js and Howler.js libraries. An internet connection is required to run the game. If you prefer to use local files, you can download the libraries and update the script tags in index.html.

## Future Enhancements

- Power-ups and special weapons
- Multiple enemy types with different behaviors
- Level progression with unique arenas
- Local high score leaderboard
- Mobile touch controls

## Credits

- Game concept and development: [Your Name]
- Inspired by classic arcade shooters and modern neon aesthetics

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Enjoy the game and aim for a high score! Remember to share your achievements with friends. 