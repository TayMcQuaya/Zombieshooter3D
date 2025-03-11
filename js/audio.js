// audio.js - Sound effects and music

// Audio settings
let soundEnabled = true;
let musicEnabled = true;
let backgroundMusic = null;

// Initialize audio system
function initAudio() {
    // Create audio context if Web Audio API is available
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Resume audio context on user interaction (required by some browsers)
        document.addEventListener('click', () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }, { once: true });
    } catch (e) {
        console.warn('Web Audio API not supported in this browser');
    }
    
    // Create background music element
    backgroundMusic = document.createElement('audio');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.3;
    
    // Use a placeholder URL for the music
    // In a real game, you would use an actual music file
    backgroundMusic.src = 'assets/sounds/background.mp3';
    
    // Add audio controls to the page (for debugging)
    const audioControls = document.createElement('div');
    audioControls.style.position = 'absolute';
    audioControls.style.bottom = '10px';
    audioControls.style.right = '10px';
    audioControls.style.zIndex = '100';
    audioControls.innerHTML = `
        <button id="toggle-sound" style="margin-right: 5px;">Sound: ON</button>
        <button id="toggle-music">Music: ON</button>
    `;
    document.body.appendChild(audioControls);
    
    // Set up audio control buttons
    document.getElementById('toggle-sound').addEventListener('click', toggleSound);
    document.getElementById('toggle-music').addEventListener('click', toggleMusic);
}

// Toggle sound effects
function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('toggle-sound').textContent = `Sound: ${soundEnabled ? 'ON' : 'OFF'}`;
}

// Toggle background music
function toggleMusic() {
    musicEnabled = !musicEnabled;
    document.getElementById('toggle-music').textContent = `Music: ${musicEnabled ? 'ON' : 'OFF'}`;
    
    if (musicEnabled) {
        backgroundMusic.play();
    } else {
        backgroundMusic.pause();
    }
}

// Play background music
function playBackgroundMusic() {
    if (!musicEnabled || !backgroundMusic) return;
    
    // Start playing background music
    backgroundMusic.currentTime = 0;
    backgroundMusic.play().catch(e => {
        console.warn('Could not play background music:', e);
    });
}

// Play shoot sound
function playShootSound() {
    if (!soundEnabled) return;
    
    // Create audio element for shoot sound
    const shootSound = document.createElement('audio');
    shootSound.volume = 0.2;
    
    // Use a placeholder URL for the sound
    // In a real game, you would use an actual sound file
    shootSound.src = 'assets/sounds/shoot.mp3';
    
    // Play the sound
    shootSound.play().catch(e => {
        console.warn('Could not play shoot sound:', e);
    });
    
    // Remove the element after playing
    shootSound.onended = () => {
        shootSound.remove();
    };
}

// Play explosion sound
function playExplosionSound() {
    if (!soundEnabled) return;
    
    // Create audio element for explosion sound
    const explosionSound = document.createElement('audio');
    explosionSound.volume = 0.3;
    
    // Use a placeholder URL for the sound
    explosionSound.src = 'assets/sounds/explosion.mp3';
    
    // Play the sound
    explosionSound.play().catch(e => {
        console.warn('Could not play explosion sound:', e);
    });
    
    // Remove the element after playing
    explosionSound.onended = () => {
        explosionSound.remove();
    };
}

// Play damage sound
function playDamageSound() {
    if (!soundEnabled) return;
    
    // Create audio element for damage sound
    const damageSound = document.createElement('audio');
    damageSound.volume = 0.4;
    
    // Use a placeholder URL for the sound
    damageSound.src = 'assets/sounds/damage.mp3';
    
    // Play the sound
    damageSound.play().catch(e => {
        console.warn('Could not play damage sound:', e);
    });
    
    // Remove the element after playing
    damageSound.onended = () => {
        damageSound.remove();
    };
}

// Play wave sound
function playWaveSound() {
    if (!soundEnabled) return;
    
    // Create audio element for wave sound
    const waveSound = document.createElement('audio');
    waveSound.volume = 0.3;
    
    // Use a placeholder URL for the sound
    waveSound.src = 'assets/sounds/wave.mp3';
    
    // Play the sound
    waveSound.play().catch(e => {
        console.warn('Could not play wave sound:', e);
    });
    
    // Remove the element after playing
    waveSound.onended = () => {
        waveSound.remove();
    };
}

// Play wave cleared sound
function playWaveClearedSound() {
    if (!soundEnabled) return;
    
    // Create audio element for wave cleared sound
    const waveClearedSound = document.createElement('audio');
    waveClearedSound.volume = 0.4;
    
    // Use a placeholder URL for the sound
    waveClearedSound.src = 'assets/sounds/wave_cleared.mp3';
    
    // Play the sound
    waveClearedSound.play().catch(e => {
        console.warn('Could not play wave cleared sound:', e);
    });
    
    // Remove the element after playing
    waveClearedSound.onended = () => {
        waveClearedSound.remove();
    };
}

// Play jump sound
function playJumpSound() {
    if (!soundEnabled) return;
    
    // Create audio element for jump sound
    const jumpSound = document.createElement('audio');
    jumpSound.volume = 0.2;
    
    // Use a placeholder URL for the sound
    jumpSound.src = 'assets/sounds/jump.mp3';
    
    // Play the sound
    jumpSound.play().catch(e => {
        console.warn('Could not play jump sound:', e);
    });
    
    // Remove the element after playing
    jumpSound.onended = () => {
        jumpSound.remove();
    };
} 