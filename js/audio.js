// audio.js - Sound effects and music

// Audio settings
let soundEnabled = true;
let musicEnabled = true;
let backgroundMusic = null;
let musicWasEnabledBeforePause = true;

// Zombie sound system
const zombieSoundSystem = {
    sounds: [],
    lastSoundTime: {},
    minInterval: 5000,
    maxInterval: 15000
};

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
    
    // Update to use the ambiente.mp3 file for background music
    backgroundMusic.src = 'assets/sounds/ambiente.mp3';
    
    // Add themed audio controls to the page
    const audioControls = document.createElement('div');
    audioControls.style.position = 'absolute';
    audioControls.style.bottom = '30px';
    audioControls.style.right = '30px';
    audioControls.style.zIndex = '100';
    audioControls.style.display = 'flex';
    audioControls.style.gap = '20px';
    
    // Sound button with zombie theme
    const soundButton = document.createElement('button');
    soundButton.id = 'toggle-sound';
    soundButton.textContent = 'Sound: ON';
    soundButton.style.padding = '15px 25px';
    soundButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    soundButton.style.color = '#ff3333';
    soundButton.style.border = '3px solid #990000';
    soundButton.style.borderRadius = '8px';
    soundButton.style.fontFamily = "'Creepster', cursive";
    soundButton.style.fontSize = '28px';
    soundButton.style.cursor = 'pointer';
    soundButton.style.boxShadow = '0 0 15px #ff0000';
    soundButton.style.transition = 'all 0.3s ease';
    soundButton.style.textTransform = 'uppercase';
    soundButton.style.letterSpacing = '2px';
    
    // Add hover effects
    soundButton.addEventListener('mouseover', () => {
        soundButton.style.backgroundColor = 'rgba(153, 0, 0, 0.7)';
        soundButton.style.boxShadow = '0 0 20px #ff0000';
        soundButton.style.transform = 'scale(1.05)';
    });
    
    soundButton.addEventListener('mouseout', () => {
        soundButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        soundButton.style.boxShadow = '0 0 15px #ff0000';
        soundButton.style.transform = 'scale(1)';
    });
    
    // Music button with zombie theme
    const musicButton = document.createElement('button');
    musicButton.id = 'toggle-music';
    musicButton.textContent = 'Music: ON';
    musicButton.style.padding = '15px 25px';
    musicButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    musicButton.style.color = '#ff3333';
    musicButton.style.border = '3px solid #990000';
    musicButton.style.borderRadius = '8px';
    musicButton.style.fontFamily = "'Creepster', cursive";
    musicButton.style.fontSize = '28px';
    musicButton.style.cursor = 'pointer';
    musicButton.style.boxShadow = '0 0 15px #ff0000';
    musicButton.style.transition = 'all 0.3s ease';
    musicButton.style.textTransform = 'uppercase';
    musicButton.style.letterSpacing = '2px';
    
    // Add hover effects
    musicButton.addEventListener('mouseover', () => {
        musicButton.style.backgroundColor = 'rgba(153, 0, 0, 0.7)';
        musicButton.style.boxShadow = '0 0 20px #ff0000';
        musicButton.style.transform = 'scale(1.05)';
    });
    
    musicButton.addEventListener('mouseout', () => {
        musicButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        musicButton.style.boxShadow = '0 0 15px #ff0000';
        musicButton.style.transform = 'scale(1)';
    });
    
    // Add buttons to controls
    audioControls.appendChild(soundButton);
    audioControls.appendChild(musicButton);
    document.body.appendChild(audioControls);
    
    // Set up audio control buttons
    document.getElementById('toggle-sound').addEventListener('click', toggleSound);
    document.getElementById('toggle-music').addEventListener('click', toggleMusic);
    
    // Export audio functions to global scope
    window.playSound = playSound;
    window.pauseBackgroundMusic = pauseBackgroundMusic;
    window.resumeBackgroundMusic = resumeBackgroundMusic;
    
    // Initialize zombie sound system
    initZombieSoundSystem();
}

// Initialize zombie sound system to handle ambient zombie sounds
function initZombieSoundSystem() {
    // Clear any existing sounds
    zombieSoundSystem.sounds = [];
    zombieSoundSystem.lastSoundTime = {};
    
    // Start the zombie sound loop
    setInterval(updateZombieSounds, 1000);
}

// Update zombie sounds - periodically play ambient sounds from alive zombies
function updateZombieSounds() {
    if (!soundEnabled || !window.enemies || window.enemies.length === 0) return;
    
    const now = Date.now();
    
    // For each zombie that's alive, maybe play a sound
    for (const enemy of window.enemies) {
        // Skip if zombie is spawning or we just played a sound recently
        if (enemy.isSpawning) continue;
        
        const enemyId = enemy.mesh.uuid;
        
        // Only play sounds occasionally with random intervals
        if (!zombieSoundSystem.lastSoundTime[enemyId] || 
            (now - zombieSoundSystem.lastSoundTime[enemyId] > 
             Math.random() * (zombieSoundSystem.maxInterval - zombieSoundSystem.minInterval) + zombieSoundSystem.minInterval)) {
            
            // Play a random zombie sound
            playRandomZombieSound();
            
            // Update last sound time
            zombieSoundSystem.lastSoundTime[enemyId] = now;
        }
    }
}

// Toggle sound effects
function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundButton = document.getElementById('toggle-sound');
    soundButton.textContent = `Sound: ${soundEnabled ? 'ON' : 'OFF'}`;
    
    // Update button style based on state
    if (!soundEnabled) {
        soundButton.style.opacity = '0.7';
        soundButton.style.boxShadow = '0 0 8px #ff0000';
    } else {
        soundButton.style.opacity = '1';
        soundButton.style.boxShadow = '0 0 15px #ff0000';
    }
}

// Toggle background music
function toggleMusic() {
    musicEnabled = !musicEnabled;
    const musicButton = document.getElementById('toggle-music');
    musicButton.textContent = `Music: ${musicEnabled ? 'ON' : 'OFF'}`;
    
    // Update button style based on state
    if (!musicEnabled) {
        musicButton.style.opacity = '0.7';
        musicButton.style.boxShadow = '0 0 8px #ff0000';
        backgroundMusic.pause();
    } else {
        musicButton.style.opacity = '1';
        musicButton.style.boxShadow = '0 0 15px #ff0000';
        backgroundMusic.play().catch(e => {
            console.warn('Could not play background music:', e);
        });
    }
}

// Pause background music (for game pause)
function pauseBackgroundMusic() {
    if (!backgroundMusic) return;
    
    // Store current music state
    musicWasEnabledBeforePause = musicEnabled;
    
    // Pause the music if it was playing
    if (musicEnabled) {
        backgroundMusic.pause();
    }
}

// Resume background music (after game pause)
function resumeBackgroundMusic() {
    if (!backgroundMusic) return;
    
    // Only resume if music was enabled before pausing
    if (musicWasEnabledBeforePause && musicEnabled) {
        backgroundMusic.play().catch(e => {
            console.warn('Could not resume background music:', e);
        });
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

// Generic sound player function
function playSound(soundType) {
    if (!soundEnabled) return;
    
    switch(soundType) {
        case 'shoot':
            playShootSound();
            break;
        case 'explosion':
            playExplosionSound();
            break;
        case 'damage':
            playDamageSound();
            break;
        case 'wave':
            playWaveSound();
            break;
        case 'wave_cleared':
            playWaveClearedSound();
            break;
        case 'jump':
            playJumpSound();
            break;
        case 'zombieAttack':
            playZombieAttackSound();
            break;
        case 'healthPickup':
        case 'staminaPickup':
            playCollectSound(); // Both health and stamina use the same collect sound
            break;
        case 'impact':
            playEnvironmentHitSound();
            break;
        case 'hit':
            playZombieHitSound();
            break;
        case 'explode':
            playZombieDeathSound();
            break;
        case 'zombieSpawn':
            playZombieSpawnSound();
            break;
        default:
            console.warn('Unknown sound type:', soundType);
    }
}

// Play shoot sound
function playShootSound() {
    if (!soundEnabled) return;
    
    // Create audio element for shoot sound
    const shootSound = document.createElement('audio');
    shootSound.volume = 0.3;
    
    // Use pistolshot.wav
    shootSound.src = 'assets/sounds/Pistol sfx/pistolshot.wav';
    
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
    explosionSound.volume = 0.4;
    
    // Use the explosion sound
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

// Play damage sound (when player takes damage)
function playDamageSound() {
    if (!soundEnabled) return;
    
    // Create audio element for damage sound
    const damageSound = document.createElement('audio');
    damageSound.volume = 0.4;
    
    // Use damage sound
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

// Play death sound (when player dies)
function playDeathSound() {
    if (!soundEnabled) return;
    
    // Create audio element for death sound
    const deathSound = document.createElement('audio');
    deathSound.volume = 0.5;
    
    // Use death.wav
    deathSound.src = 'assets/sounds/Player sfx/death.wav';
    
    // Play the sound
    deathSound.play().catch(e => {
        console.warn('Could not play death sound:', e);
    });
    
    // Remove the element after playing
    deathSound.onended = () => {
        deathSound.remove();
    };
}

// Play wave sound
function playWaveSound() {
    if (!soundEnabled) return;
    
    // Create audio element for wave sound
    const waveSound = document.createElement('audio');
    waveSound.volume = 0.4;
    
    // Use wave.wav
    waveSound.src = 'assets/sounds/wave.wav';
    
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
    
    // Use wave_cleared sound
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
    
    // Use jump sound
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

// Play zombie attack sound - one of the three attack sounds randomly
function playZombieAttackSound() {
    if (!soundEnabled) return;
    
    // Create audio element for zombie attack sound
    const zombieAttackSound = document.createElement('audio');
    zombieAttackSound.volume = 0.4;
    
    // Choose a random attack sound
    const attackSounds = [
        'assets/sounds/Zombie sfx/zombieattack1.wav',
        'assets/sounds/Zombie sfx/zombieattack2.wav',
        'assets/sounds/Zombie sfx/zombieattack3.wav'
    ];
    
    // Randomly select one of the three attack sounds
    const randomIndex = Math.floor(Math.random() * attackSounds.length);
    zombieAttackSound.src = attackSounds[randomIndex];
    
    // Play the sound
    zombieAttackSound.play().catch(e => {
        console.warn('Could not play zombie attack sound:', e);
    });
    
    // Remove the element after playing
    zombieAttackSound.onended = () => {
        zombieAttackSound.remove();
    };
}

// Play random zombie ambient sound
function playRandomZombieSound() {
    if (!soundEnabled) return;
    
    // Create audio element for zombie sound
    const zombieSound = document.createElement('audio');
    zombieSound.volume = 0.3;
    
    // Choose a random zombie sound
    const zombieSounds = [
        'assets/sounds/Zombie sfx/zombiesound1.wav',
        'assets/sounds/Zombie sfx/zombiesound2.wav',
        'assets/sounds/Zombie sfx/zombiesound3.wav',
        'assets/sounds/Zombie sfx/zombiesound4.wav'
    ];
    
    // Randomly select one of the four sounds
    const randomIndex = Math.floor(Math.random() * zombieSounds.length);
    zombieSound.src = zombieSounds[randomIndex];
    
    // Play the sound
    zombieSound.play().catch(e => {
        console.warn('Could not play zombie ambient sound:', e);
    });
    
    // Remove the element after playing
    zombieSound.onended = () => {
        zombieSound.remove();
    };
}

// Play health/stamina pickup sound
function playCollectSound() {
    if (!soundEnabled) return;
    
    // Create audio element for collect sound
    const collectSound = document.createElement('audio');
    collectSound.volume = 0.4;
    
    // Use your collect.wav file
    collectSound.src = 'assets/sounds/collect.wav';
    
    // Play the sound
    collectSound.play().catch(e => {
        console.warn('Could not play collect sound:', e);
    });
    
    // Remove the element after playing
    collectSound.onended = () => {
        collectSound.remove();
    };
}

// Play environment hit sound
function playEnvironmentHitSound() {
    if (!soundEnabled) return;
    
    // Create audio element for environment hit sound
    const environmentHitSound = document.createElement('audio');
    environmentHitSound.volume = 0.3;
    
    // Use the envhit.wav file
    environmentHitSound.src = 'assets/sounds/envhit.wav';
    
    // Play the sound
    environmentHitSound.play().catch(e => {
        console.warn('Could not play environment hit sound:', e);
    });
    
    // Remove the element after playing
    environmentHitSound.onended = () => {
        environmentHitSound.remove();
    };
}

// Play zombie hit sound - one of the three hit sounds randomly
function playZombieHitSound() {
    if (!soundEnabled) return;
    
    // Create audio element for zombie hit sound
    const zombieHitSound = document.createElement('audio');
    zombieHitSound.volume = 0.35;
    
    // Choose between the three hit sounds
    const hitSounds = [
        'assets/sounds/Zombie sfx/hit1.wav',
        'assets/sounds/Zombie sfx/hit2.wav',
        'assets/sounds/Zombie sfx/hit3.wav'
    ];
    
    // Randomly select one
    const randomIndex = Math.floor(Math.random() * hitSounds.length);
    zombieHitSound.src = hitSounds[randomIndex];
    
    // Always play the flesh hit sound
    const fleshHitSound = document.createElement('audio');
    fleshHitSound.volume = 0.3;
    fleshHitSound.src = 'assets/sounds/Zombie sfx/fleshhit.wav';
    
    // Play both sounds
    zombieHitSound.play().catch(e => {
        console.warn('Could not play zombie hit sound:', e);
    });
    
    fleshHitSound.play().catch(e => {
        console.warn('Could not play flesh hit sound:', e);
    });
    
    // Remove elements after playing
    zombieHitSound.onended = () => {
        zombieHitSound.remove();
    };
    
    fleshHitSound.onended = () => {
        fleshHitSound.remove();
    };
}

// Play zombie death sound
function playZombieDeathSound() {
    if (!soundEnabled) return;
    
    // Create audio element for zombie death sound
    const zombieDeathSound = document.createElement('audio');
    zombieDeathSound.volume = 0.4;
    
    // Use the zombiedeath.wav file
    zombieDeathSound.src = 'assets/sounds/Zombie sfx/zombiedeath.wav';
    
    // Play the sound
    zombieDeathSound.play().catch(e => {
        console.warn('Could not play zombie death sound:', e);
    });
    
    // Remove the element after playing
    zombieDeathSound.onended = () => {
        zombieDeathSound.remove();
    };
}

// Play zombie spawn sound
function playZombieSpawnSound() {
    if (!soundEnabled) return;
    
    // Create audio element for zombie spawn sound
    const zombieSpawnSound = document.createElement('audio');
    zombieSpawnSound.volume = 0.35;
    
    // Use the spawn.wav file
    zombieSpawnSound.src = 'assets/sounds/Zombie sfx/spawn.wav';
    
    // Play the sound
    zombieSpawnSound.play().catch(e => {
        console.warn('Could not play zombie spawn sound:', e);
    });
    
    // Remove the element after playing
    zombieSpawnSound.onended = () => {
        zombieSpawnSound.remove();
    };
}

// Export additional functions for the game over screen
window.playDeathSound = playDeathSound;