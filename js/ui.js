// ui.js - User interface handling

// UI elements
let scoreElement;
let healthElement;
let waveElement;
let hearts = [];
const MAX_HEALTH = 3;
let currentHealth = MAX_HEALTH;

// Initialize UI
function initUI() {
    // Get UI elements
    scoreElement = document.getElementById('score');
    healthElement = document.getElementById('health');
    
    // Create wave element if it doesn't exist
    if (!document.getElementById('wave-container')) {
        const waveContainer = document.createElement('div');
        waveContainer.id = 'wave-container';
        waveContainer.style.position = 'absolute';
        waveContainer.style.top = '60px';
        waveContainer.style.left = '20px';
        waveContainer.style.color = '#0f0';
        waveContainer.style.textShadow = '0 0 10px #0f0';
        waveContainer.style.fontSize = '20px';
        waveContainer.style.pointerEvents = 'none';
        waveContainer.innerHTML = 'Wave: <span id="wave">0</span>';
        document.body.appendChild(waveContainer);
    }
    
    waveElement = document.getElementById('wave');
    
    // Create hearts container
    const heartsContainer = document.createElement('div');
    heartsContainer.style.position = 'absolute';
    heartsContainer.style.top = '20px';
    heartsContainer.style.left = '20px';
    heartsContainer.style.display = 'flex';
    heartsContainer.style.gap = '10px';
    document.body.appendChild(heartsContainer);
    
    // Create hearts
    for (let i = 0; i < MAX_HEALTH; i++) {
        const heart = document.createElement('div');
        heart.innerHTML = '❤️';
        heart.style.fontSize = '32px';
        heart.style.color = 'red';
        heartsContainer.appendChild(heart);
        hearts.push(heart);
    }
    
    // Create score display
    const scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'score';
    scoreDisplay.style.position = 'absolute';
    scoreDisplay.style.top = '20px';
    scoreDisplay.style.right = '20px';
    scoreDisplay.style.color = 'white';
    scoreDisplay.style.fontSize = '24px';
    scoreDisplay.textContent = 'Score: 0';
    document.body.appendChild(scoreDisplay);
    
    // Initialize UI values
    updateUI();
}

// Update UI with current game state
function updateUI() {
    // Update score
    if (scoreElement) {
        scoreElement.textContent = score;
    }
    
    // Update health display
    updateHealth();
}

// Update health display
function updateHealth() {
    hearts.forEach((heart, index) => {
        if (index < currentHealth) {
            heart.innerHTML = '❤️'; // Full heart
        } else {
            heart.innerHTML = '🖤'; // Empty heart
        }
    });
    
    // Check for game over
    if (currentHealth <= 0) {
        gameOver();
    }
}

// Damage player
function damagePlayer() {
    if (currentHealth > 0) {
        currentHealth--;
        updateHealth();
        playDamageSound();
        showDamageEffect();
        
        // Vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
    }
}

// Show damage effect
function showDamageEffect() {
    // Create red overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.4)'; // More visible red flash
    overlay.style.pointerEvents = 'none';
    overlay.style.transition = 'opacity 0.15s ease-in-out';
    overlay.style.opacity = '0';
    document.body.appendChild(overlay);
    
    // Animate the flash
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 150);
        }, 150);
    });
    
    // Screen shake effect
    const gameContainer = document.querySelector('canvas');
    if (gameContainer) {
        gameContainer.style.transition = 'transform 0.1s ease-in-out';
        gameContainer.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
        
        setTimeout(() => {
            gameContainer.style.transform = 'translate(0, 0)';
        }, 100);
    }
}

// Game over screen
function gameOver() {
    gameActive = false;
    document.exitPointerLock();
    
    const gameOverScreen = document.createElement('div');
    gameOverScreen.style.position = 'fixed';
    gameOverScreen.style.top = '50%';
    gameOverScreen.style.left = '50%';
    gameOverScreen.style.transform = 'translate(-50%, -50%)';
    gameOverScreen.style.textAlign = 'center';
    gameOverScreen.style.color = 'white';
    gameOverScreen.style.fontSize = '32px';
    gameOverScreen.innerHTML = `
        <h1>GAME OVER</h1>
        <p>Zombies Killed: ${score}</p>
        <button onclick="location.reload()" style="font-size: 24px; padding: 10px 20px; margin: 10px;">Try Again</button>
        <button onclick="shareScore()" style="font-size: 24px; padding: 10px 20px; margin: 10px;">Share Score</button>
    `;
    document.body.appendChild(gameOverScreen);
}

// Share score
function shareScore() {
    const url = window.location.href.split('?')[0];
    const text = `I killed ${score} zombies in Zombie Survival! Can you survive longer? Try it: ${url}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
}

// Update wave number in UI
function updateWaveUI(wave) {
    if (waveElement) {
        waveElement.textContent = wave;
        
        // Animate wave number change
        waveElement.style.fontSize = '30px';
        waveElement.style.transition = 'font-size 0.3s ease';
        
        setTimeout(() => {
            waveElement.style.fontSize = '20px';
        }, 300);
    }
    
    // Show wave notification
    showWaveNotification(wave);
}

// Show wave notification
function showWaveNotification(wave) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'wave-notification';
    notification.textContent = `WAVE ${wave}`;
    
    // Style notification
    notification.style.position = 'absolute';
    notification.style.top = '50%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.color = '#0f0';
    notification.style.textShadow = '0 0 20px #0f0';
    notification.style.fontSize = '60px';
    notification.style.fontWeight = 'bold';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s ease';
    notification.style.pointerEvents = 'none';
    notification.style.zIndex = '100';
    
    // Add to document
    document.body.appendChild(notification);
    
    // Animate notification
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 2000);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 2500);
}

// Show damage indicator when player is hit
function showDamageIndicator() {
    // Create damage overlay
    const overlay = document.createElement('div');
    overlay.className = 'damage-overlay';
    
    // Style overlay
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    overlay.style.pointerEvents = 'none';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s ease';
    overlay.style.zIndex = '50';
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Animate overlay
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        overlay.style.opacity = '0';
    }, 200);
    
    setTimeout(() => {
        document.body.removeChild(overlay);
    }, 400);
}

// Show kill indicator when player destroys an enemy
function showKillIndicator() {
    // Create kill indicator
    const indicator = document.createElement('div');
    indicator.className = 'kill-indicator';
    indicator.textContent = '+10';
    
    // Random position near the center
    const offsetX = Math.random() * 100 - 50;
    const offsetY = Math.random() * 100 - 50;
    
    // Style indicator
    indicator.style.position = 'absolute';
    indicator.style.top = `calc(50% + ${offsetY}px)`;
    indicator.style.left = `calc(50% + ${offsetX}px)`;
    indicator.style.color = '#0f0';
    indicator.style.textShadow = '0 0 10px #0f0';
    indicator.style.fontSize = '24px';
    indicator.style.fontWeight = 'bold';
    indicator.style.opacity = '0';
    indicator.style.transition = 'all 0.5s ease';
    indicator.style.pointerEvents = 'none';
    indicator.style.zIndex = '100';
    
    // Add to document
    document.body.appendChild(indicator);
    
    // Animate indicator
    setTimeout(() => {
        indicator.style.opacity = '1';
        indicator.style.transform = 'translateY(-20px)';
    }, 10);
    
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 500);
    
    setTimeout(() => {
        document.body.removeChild(indicator);
    }, 1000);
}

// Show wave cleared bonus indicator
function showWaveClearedIndicator() {
    // Create wave cleared indicator
    const indicator = document.createElement('div');
    indicator.className = 'wave-cleared-indicator';
    indicator.textContent = 'WAVE CLEARED! +50';
    
    // Style indicator
    indicator.style.position = 'absolute';
    indicator.style.top = '40%';
    indicator.style.left = '50%';
    indicator.style.transform = 'translate(-50%, -50%)';
    indicator.style.color = '#ff0';
    indicator.style.textShadow = '0 0 20px #ff0';
    indicator.style.fontSize = '36px';
    indicator.style.fontWeight = 'bold';
    indicator.style.opacity = '0';
    indicator.style.transition = 'all 1s ease';
    indicator.style.pointerEvents = 'none';
    indicator.style.zIndex = '100';
    
    // Add to document
    document.body.appendChild(indicator);
    
    // Animate indicator
    setTimeout(() => {
        indicator.style.opacity = '1';
        indicator.style.transform = 'translate(-50%, -50%) scale(1.2)';
    }, 10);
    
    setTimeout(() => {
        indicator.style.opacity = '0';
        indicator.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 2000);
    
    setTimeout(() => {
        document.body.removeChild(indicator);
    }, 3000);
}
