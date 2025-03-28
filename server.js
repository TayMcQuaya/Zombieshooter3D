const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve static files
app.use(express.static(path.join(__dirname)));

// Game state
const gameState = {
    players: {},
    zombies: [],
    powerUps: [],
    waveNumber: 1
};

// Constants from the game
const MAX_PLAYERS = 10;
const ZOMBIE_TYPES = {
    BASE: 'Base',
    PURPLE: 'Purple',
    TANK: 'Tank',
    RANGED: 'Ranged'
};

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Handle player join
    socket.on('join', (username) => {
        // Check if server is full
        if (Object.keys(gameState.players).length >= MAX_PLAYERS) {
            socket.emit('serverFull');
            return;
        }

        // Create new player
        gameState.players[socket.id] = {
            id: socket.id,
            username: username || `Player${Math.floor(Math.random() * 1000)}`,
            position: { x: Math.random() * 40 - 20, y: 0, z: Math.random() * 40 - 20 },
            rotation: { y: 0 },
            health: 3,
            weapon: 'Pistol',
            color: `hsl(${Math.random() * 360}, 80%, 50%)`,
            score: 0,
            zombieKills: 0
        };

        // Send initial game state to new player
        socket.emit('init', {
            playerId: socket.id,
            gameState: gameState
        });

        // Broadcast new player to others
        socket.broadcast.emit('playerJoined', gameState.players[socket.id]);
    });

    // Handle player movement/state updates
    socket.on('playerUpdate', (data) => {
        if (gameState.players[socket.id]) {
            Object.assign(gameState.players[socket.id], data);
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                ...data
            });
        }
    });

    // Handle player shooting
    socket.on('playerShoot', (data) => {
        if (gameState.players[socket.id]) {
            io.emit('playerShot', {
                playerId: socket.id,
                position: data.position,
                direction: data.direction,
                weapon: data.weapon
            });
        }
    });

    // Handle zombie hit
    socket.on('zombieHit', (data) => {
        io.emit('zombieHit', {
            zombieId: data.zombieId,
            damage: data.damage,
            playerId: socket.id
        });
    });

    // Handle zombie kill
    socket.on('zombieKilled', (data) => {
        if (gameState.players[socket.id]) {
            gameState.players[socket.id].zombieKills++;
            gameState.players[socket.id].score += data.points;
            io.emit('zombieKilled', {
                zombieId: data.zombieId,
                killerId: socket.id,
                points: data.points
            });
        }
    });

    // Handle power-up collection
    socket.on('powerUpCollected', (powerUpId) => {
        const index = gameState.powerUps.findIndex(p => p.id === powerUpId);
        if (index !== -1) {
            gameState.powerUps.splice(index, 1);
            io.emit('powerUpCollected', {
                powerUpId: powerUpId,
                playerId: socket.id
            });
        }
    });

    // Handle wave changes
    socket.on('waveComplete', (waveNumber) => {
        gameState.waveNumber = waveNumber;
        io.emit('newWave', waveNumber);
    });

    // Handle player disconnect
    socket.on('disconnect', () => {
        if (gameState.players[socket.id]) {
            delete gameState.players[socket.id];
            io.emit('playerLeft', socket.id);
        }
    });
});

// Spawn power-ups periodically
setInterval(() => {
    if (gameState.powerUps.length < 15) {
        const powerUp = {
            id: Date.now().toString(),
            type: Math.random() < 0.5 ? 'health' : 'stamina',
            position: {
                x: Math.random() * 480 - 240,
                y: 1,
                z: Math.random() * 480 - 240
            }
        };
        gameState.powerUps.push(powerUp);
        io.emit('powerUpSpawned', powerUp);
    }
}, 30000); // Every 30 seconds

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 