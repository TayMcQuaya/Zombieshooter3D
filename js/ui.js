// ui.js - User interface handling

// UI elements
let scoreElement;
let waveElement;
let hearts = [];
const MAX_HEALTH = 3;
let currentHealth = MAX_HEALTH;

// Initialize UI
function initUI() {
    // First, remove any existing UI elements to prevent duplicates
    cleanupUI();
    
    // Create main UI container
    const uiContainer = document.createElement('div');
    uiContainer.id = 'game-ui-container';
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '0';
    uiContainer.style.left = '0';
    uiContainer.style.width = '100%';
    uiContainer.style.height = '100%';
    uiContainer.style.pointerEvents = 'none';
    uiContainer.style.zIndex = '100';
    document.body.appendChild(uiContainer);
    
    // Create hearts container (top left)
    const heartsContainer = document.createElement('div');
    heartsContainer.id = 'hearts-container';
    heartsContainer.style.position = 'absolute';
    heartsContainer.style.top = '20px';
    heartsContainer.style.left = '20px';
    heartsContainer.style.display = 'flex';
    heartsContainer.style.gap = '15px';  // Increased gap for bigger hearts
    uiContainer.appendChild(heartsContainer);
    
    // Create hearts
    hearts = []; // Clear existing hearts
    for (let i = 0; i < MAX_HEALTH; i++) {
        const heart = document.createElement('div');
        heart.innerHTML = '❤️';
        heart.style.fontSize = '48px';  // Increased from 32px to 48px
        heart.style.textShadow = '0 0 5px black, 0 0 5px black'; // Double shadow for better visibility
        heartsContainer.appendChild(heart);
        hearts.push(heart);
    }
    
    // Create wave display (below hearts)
    const waveContainer = document.createElement('div');
    waveContainer.id = 'wave-container';
    waveContainer.style.position = 'absolute';
    waveContainer.style.top = '90px';  // Increased from 70px to 90px to avoid overlap with bigger hearts
    waveContainer.style.left = '20px';
    waveContainer.style.color = '#ff3333';  // Changed to match theme
    waveContainer.style.textShadow = '0 0 10px #800000';  // Changed to match theme
    waveContainer.style.fontSize = '32px';  // Increased from 24px to 32px
    waveContainer.style.fontWeight = 'bold';
    waveContainer.style.fontFamily = "'Creepster', cursive";  // Added themed font
    
    // Create wave text and number separately to style them
    const waveText = document.createElement('span');
    waveText.textContent = 'Wave: ';
    
    const waveNumber = document.createElement('span');
    waveNumber.id = 'wave';
    waveNumber.textContent = '1';
    waveNumber.style.fontSize = '32px'; // Match the container font size
    waveNumber.style.fontFamily = "'Creepster', cursive";
    waveNumber.style.color = '#ff3333';
    waveNumber.style.textShadow = '0 0 10px #800000';
    
    waveContainer.appendChild(waveText);
    waveContainer.appendChild(waveNumber);
    uiContainer.appendChild(waveContainer);
    
    // Create score display (top right)
    const scoreContainer = document.createElement('div');
    scoreContainer.id = 'score-container';
    scoreContainer.style.position = 'absolute';
    scoreContainer.style.top = '20px';
    scoreContainer.style.right = '20px';
    scoreContainer.style.color = '#ff3333';  // Changed to match theme
    scoreContainer.style.textShadow = '0 0 10px #800000';  // Changed to match theme
    scoreContainer.style.fontSize = '32px';  // Increased from 24px to 32px
    scoreContainer.style.fontWeight = 'bold';
    scoreContainer.style.fontFamily = "'Creepster', cursive";  // Added themed font
    scoreContainer.innerHTML = 'Score: <span id="score">0</span>';
    uiContainer.appendChild(scoreContainer);
    
    // Create stamina bar (top middle)
    const staminaContainer = document.createElement('div');
    staminaContainer.id = 'stamina-container';
    staminaContainer.style.position = 'absolute';
    staminaContainer.style.top = '20px';
    staminaContainer.style.left = '50%';
    staminaContainer.style.transform = 'translateX(-50%)';
    staminaContainer.style.width = '350px';  // Increased from 300px to 350px
    staminaContainer.style.display = 'flex';
    staminaContainer.style.flexDirection = 'column';
    staminaContainer.style.alignItems = 'center';
    staminaContainer.style.gap = '5px';
    uiContainer.appendChild(staminaContainer);
    
    // Stamina label
    const staminaLabel = document.createElement('div');
    staminaLabel.id = 'stamina-label';
    staminaLabel.style.color = '#ff3333';
    staminaLabel.style.textShadow = '0 0 10px #800000';
    staminaLabel.style.fontSize = '32px';  // Increased from 24px to 32px
    staminaLabel.style.fontWeight = 'bold';
    staminaLabel.style.fontFamily = "'Creepster', cursive";
    staminaLabel.textContent = 'STAMINA';
    staminaContainer.appendChild(staminaLabel);
    
    // Stamina bar background
    const staminaBar = document.createElement('div');
    staminaBar.id = 'stamina-bar';
    staminaBar.style.width = '100%';
    staminaBar.style.height = '25px';  // Increased from 20px to 25px
    staminaBar.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    staminaBar.style.border = '2px solid #990000';
    staminaBar.style.boxShadow = '0 0 10px #ff0000';
    staminaBar.style.borderRadius = '10px';
    staminaBar.style.overflow = 'hidden';
    staminaContainer.appendChild(staminaBar);
    
    // Stamina fill
    const staminaFill = document.createElement('div');
    staminaFill.id = 'stamina-fill';
    staminaFill.style.width = '100%';
    staminaFill.style.height = '100%';
    staminaFill.style.backgroundColor = '#ff3333';
    staminaFill.style.boxShadow = '0 0 10px #ff0000';
    staminaFill.style.transition = 'width 0.3s ease';
    staminaBar.appendChild(staminaFill);
    
    // Get references to elements we need to update
    scoreElement = document.getElementById('score');
    waveElement = document.getElementById('wave');
    
    // Initialize UI values
    updateHealth();
    updateUI();
    
    console.log("UI initialized with clean layout");
}

// Clean up existing UI elements
function cleanupUI() {
    // Remove existing UI elements by ID
    const elementsToRemove = [
        'game-ui-container',
        'hearts-container', 
        'wave-container', 
        'score-container',
        'health-container',
        'health-label',
        'health-bar',
        'stamina-container',
        'stamina-label',
        'stamina-bar'
    ];
    
    elementsToRemove.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.parentNode.removeChild(element);
        }
    });
    
    // Also remove any elements with these classes
    const classesToRemove = ['health-heart'];
    
    classesToRemove.forEach(className => {
        const elements = document.getElementsByClassName(className);
        while (elements.length > 0) {
            elements[0].parentNode.removeChild(elements[0]);
        }
    });
}

// Helper function to clean up duplicate UI elements
function cleanupDuplicateUI() {
    // This function is now replaced by the more comprehensive cleanupUI
    cleanupUI();
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
    gameOverScreen.style.top = '0';
    gameOverScreen.style.left = '0';
    gameOverScreen.style.width = '100%';
    gameOverScreen.style.height = '100%';
    gameOverScreen.style.display = 'flex';
    gameOverScreen.style.flexDirection = 'column';
    gameOverScreen.style.justifyContent = 'center';
    gameOverScreen.style.alignItems = 'center';
    gameOverScreen.style.background = 'linear-gradient(rgba(20, 0, 0, 0.92), rgba(0, 0, 0, 0.98)), url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" x="50" text-anchor="middle" fill="rgba(255,0,0,0.15)" font-size="80">💀</text></svg>\')';
    gameOverScreen.style.backgroundSize = 'cover, 120px 120px';
    gameOverScreen.style.backgroundRepeat = 'no-repeat, repeat';
    gameOverScreen.style.zIndex = '1000';
    
    // Game over title
    const title = document.createElement('h1');
    title.textContent = 'GAME OVER';
    title.style.fontSize = '120px';
    title.style.fontFamily = "'Creepster', cursive";
    title.style.color = '#ff0000';
    title.style.textShadow = '0 0 30px #ff0000, 0 0 50px #800000, 0 0 70px #400000';
    title.style.marginBottom = '40px';
    title.style.letterSpacing = '12px';
    title.style.transform = 'rotate(-3deg)';
    title.style.animation = 'bloodDrip 3s infinite';
    gameOverScreen.appendChild(title);
    
    // Score display
    const scoreDisplay = document.createElement('p');
    scoreDisplay.textContent = `Zombies Killed: ${score}`;
    scoreDisplay.style.fontSize = '42px';
    scoreDisplay.style.color = '#ff3333';
    scoreDisplay.style.textShadow = '0 0 20px #800000';
    scoreDisplay.style.marginBottom = '50px';
    scoreDisplay.style.fontFamily = "'Creepster', cursive";
    scoreDisplay.style.letterSpacing = '3px';
    scoreDisplay.style.transform = 'rotate(-2deg)';
    gameOverScreen.appendChild(scoreDisplay);
    
    // Try again button
    const tryAgainButton = document.createElement('button');
    tryAgainButton.textContent = 'PLAY AGAIN';
    tryAgainButton.style.padding = '20px 40px';
    tryAgainButton.style.fontSize = '28px';
    tryAgainButton.style.backgroundColor = 'transparent';
    tryAgainButton.style.color = '#33ff33';
    tryAgainButton.style.border = '3px solid #33ff33';
    tryAgainButton.style.borderRadius = '8px';
    tryAgainButton.style.cursor = 'pointer';
    tryAgainButton.style.transition = 'all 0.3s ease';
    tryAgainButton.style.margin = '15px';
    tryAgainButton.style.width = '280px';
    tryAgainButton.style.fontFamily = "'Creepster', cursive";
    tryAgainButton.style.letterSpacing = '3px';
    tryAgainButton.style.textTransform = 'uppercase';
    tryAgainButton.style.boxShadow = '0 0 15px #006600';
    tryAgainButton.addEventListener('mouseover', () => {
        tryAgainButton.style.backgroundColor = '#006600';
        tryAgainButton.style.color = '#ffffff';
        tryAgainButton.style.boxShadow = '0 0 25px #00ff00';
        tryAgainButton.style.transform = 'scale(1.05)';
    });
    tryAgainButton.addEventListener('mouseout', () => {
        tryAgainButton.style.backgroundColor = 'transparent';
        tryAgainButton.style.color = '#33ff33';
        tryAgainButton.style.boxShadow = '0 0 15px #006600';
        tryAgainButton.style.transform = 'scale(1)';
    });
    tryAgainButton.addEventListener('click', () => {
        location.reload();
    });
    gameOverScreen.appendChild(tryAgainButton);
    
    // Share score button
    const shareButton = document.createElement('button');
    shareButton.textContent = 'SHARE SCORE';
    shareButton.style.padding = '20px 40px';
    shareButton.style.fontSize = '28px';
    shareButton.style.backgroundColor = 'transparent';
    shareButton.style.color = '#ff3333';
    shareButton.style.border = '3px solid #ff3333';
    shareButton.style.borderRadius = '8px';
    shareButton.style.cursor = 'pointer';
    shareButton.style.transition = 'all 0.3s ease';
    shareButton.style.margin = '15px';
    shareButton.style.width = '280px';
    shareButton.style.fontFamily = "'Creepster', cursive";
    shareButton.style.letterSpacing = '3px';
    shareButton.style.textTransform = 'uppercase';
    shareButton.style.boxShadow = '0 0 15px #800000';
    shareButton.addEventListener('mouseover', () => {
        shareButton.style.backgroundColor = '#800000';
        shareButton.style.color = '#ffffff';
        shareButton.style.boxShadow = '0 0 25px #ff0000';
        shareButton.style.transform = 'scale(1.05)';
    });
    shareButton.addEventListener('mouseout', () => {
        shareButton.style.backgroundColor = 'transparent';
        shareButton.style.color = '#ff3333';
        shareButton.style.boxShadow = '0 0 15px #800000';
        shareButton.style.transform = 'scale(1)';
    });
    shareButton.addEventListener('click', shareScore);
    gameOverScreen.appendChild(shareButton);
    
    // Add the bloodDrip animation if it doesn't exist
    if (!document.getElementById('game-over-animations')) {
        const style = document.createElement('style');
        style.id = 'game-over-animations';
        style.textContent = `
            @keyframes bloodDrip {
                0%, 100% {
                    text-shadow: 0 0 30px #ff0000, 0 0 50px #800000, 0 0 70px #400000;
                    transform: rotate(-3deg) translateY(0);
                }
                50% {
                    text-shadow: 0 0 40px #ff0000, 0 0 60px #800000, 0 0 80px #400000;
                    transform: rotate(-3deg) translateY(10px);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
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
        const originalSize = '32px';
        const enlargedSize = '40px';
        
        waveElement.style.fontSize = enlargedSize;
        waveElement.style.transition = 'font-size 0.3s ease';
        
        setTimeout(() => {
            waveElement.style.fontSize = originalSize;
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
    notification.style.color = '#ff3333'; // Changed to match theme
    notification.style.textShadow = '0 0 20px #800000'; // Changed to match theme
    notification.style.fontSize = '72px'; // Increased from 60px to 72px
    notification.style.fontWeight = 'bold';
    notification.style.fontFamily = "'Creepster', cursive"; // Added themed font
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s ease';
    notification.style.pointerEvents = 'none';
    notification.style.zIndex = '500'; // Reduced from 1000 to be below pause menu (which is 1000)
    
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
    overlay.style.zIndex = '1000';
    
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
function showKillIndicator(points) {
    // Create kill indicator
    const indicator = document.createElement('div');
    indicator.className = 'kill-indicator';
    indicator.textContent = `+${points}`;
    
    // Style indicator
    indicator.style.position = 'absolute';
    indicator.style.top = '40%';
    indicator.style.left = '55%';
    indicator.style.color = 'yellow';
    indicator.style.textShadow = '0 0 10px yellow';
    indicator.style.fontSize = '36px';
    indicator.style.fontWeight = 'bold';
    indicator.style.opacity = '0';
    indicator.style.transition = 'all 0.5s ease';
    indicator.style.pointerEvents = 'none';
    indicator.style.zIndex = '1000'; // High z-index to appear above crosshair
    
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
    indicator.style.top = '30%';
    indicator.style.left = '50%';
    indicator.style.transform = 'translateX(-50%)';
    indicator.style.color = 'gold';
    indicator.style.textShadow = '0 0 15px gold';
    indicator.style.fontSize = '40px';
    indicator.style.fontWeight = 'bold';
    indicator.style.opacity = '0';
    indicator.style.transition = 'all 1s ease';
    indicator.style.pointerEvents = 'none';
    indicator.style.zIndex = '1000'; // High z-index to appear above crosshair
    
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

function createUIContainer() {
    const uiContainer = document.createElement('div');
    uiContainer.classList.add('ui-container');
    return uiContainer;
}

function createHeartsContainer() {
    const heartsContainer = document.createElement('div');
    heartsContainer.classList.add('hearts-container');
    return heartsContainer;
}

function createHeart() {
    const heart = document.createElement('span');
    heart.classList.add('heart');
    heart.textContent = '❤️';
    return heart;
}

function createWaveContainer() {
    const waveContainer = document.createElement('div');
    waveContainer.classList.add('wave-container');
    waveContainer.textContent = 'Wave: 1';
    return waveContainer;
}

function createScoreContainer() {
    const scoreContainer = document.createElement('div');
    scoreContainer.classList.add('score-container');
    scoreContainer.textContent = 'Score: 0';
    return scoreContainer;
}

function createDamageOverlay() {
    const overlay = document.createElement('div');
    overlay.classList.add('damage-overlay');
    return overlay;
}

function showDamageOverlay() {
    const overlay = document.querySelector('.damage-overlay');
    overlay.classList.add('show');
    setTimeout(() => {
        overlay.classList.remove('show');
    }, 150);
}

function createGameContainer() {
    const container = document.createElement('div');
    container.classList.add('game-container');
    return container;
}

function shakeScreen() {
    const gameContainer = document.querySelector('.game-container');
    gameContainer.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
    setTimeout(() => {
        gameContainer.style.transform = 'translate(0, 0)';
    }, 100);
}

function createGameOverScreen() {
    const gameOverScreen = document.createElement('div');
    gameOverScreen.classList.add('game-over-screen');
    // ... rest of the game over screen creation code ...
    return gameOverScreen;
}

function updateWaveNumber(waveNumber) {
    const waveElement = document.querySelector('.wave-container');
    waveElement.classList.add('wave-animation');
    waveElement.textContent = `Wave: ${waveNumber}`;
    setTimeout(() => {
        waveElement.classList.add('shrink');
    }, 0);
    setTimeout(() => {
        waveElement.classList.remove('shrink');
    }, 300);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.textContent = message;
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 0);

    // Remove notification after animation
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 2000);
}

function showDamageIndicator(damage, x, y) {
    const indicator = document.createElement('div');
    indicator.classList.add('damage-indicator');
    indicator.textContent = `-${damage}`;
    document.body.appendChild(indicator);

    // Show indicator
    setTimeout(() => {
        indicator.classList.add('show');
    }, 0);

    // Remove indicator after animation
    setTimeout(() => {
        indicator.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(indicator);
        }, 500);
    }, 1000);
}

function showAchievementNotification(message) {
    const indicator = document.createElement('div');
    indicator.classList.add('achievement-indicator');
    indicator.textContent = `🏆 ${message}`;
    document.body.appendChild(indicator);

    // Show notification with fade-in
    setTimeout(() => {
        indicator.classList.add('show');
    }, 0);

    // Remove notification after delay
    setTimeout(() => {
        indicator.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(indicator);
        }, 500);
    }, 3000);
}
