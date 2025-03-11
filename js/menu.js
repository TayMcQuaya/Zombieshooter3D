// Menu-specific functionality
let gameStartTime = 0;

// Audio control elements
const soundToggle = document.getElementById('sound-toggle');
const musicToggle = document.getElementById('music-toggle');

// Initialize audio controls
function initAudioControls() {
    // Set initial button states based on audio manager
    updateSoundButtonState();
    updateMusicButtonState();

    // Add click listeners
    soundToggle.addEventListener('click', () => {
        audioManager.toggleSound();
        updateSoundButtonState();
        if (audioManager.isSoundEnabled) {
            audioManager.playSound('click');
        }
    });

    musicToggle.addEventListener('click', () => {
        audioManager.toggleMusic();
        updateMusicButtonState();
        if (audioManager.isSoundEnabled) {
            audioManager.playSound('click');
        }
    });
}

// Update sound button state
function updateSoundButtonState() {
    if (audioManager.isSoundEnabled) {
        soundToggle.classList.add('active');
        soundToggle.textContent = 'Sound: ON';
    } else {
        soundToggle.classList.remove('active');
        soundToggle.textContent = 'Sound: OFF';
    }
}

// Update music button state
function updateMusicButtonState() {
    if (audioManager.isMusicEnabled) {
        musicToggle.classList.add('active');
        musicToggle.textContent = 'Music: ON';
    } else {
        musicToggle.classList.remove('active');
        musicToggle.textContent = 'Music: OFF';
    }
}

// Initialize menu
function initMenu() {
    console.log('Initializing menu...');
    // Initialize audio controls
    if (typeof audioManager !== 'undefined') {
        initAudioControls();
    } else {
        console.warn('Audio manager not initialized yet');
        // Wait for audio manager to be ready
        window.addEventListener('audioManagerReady', initAudioControls);
    }
    
    // Add button hover effects
    addButtonEffects();
}

// Add hover effects to buttons
function addButtonEffects() {
    console.log('Adding button effects...');
    const buttons = document.querySelectorAll('.start-button, .menu-button, .audio-button');
    
    buttons.forEach(button => {
        // Remove any existing listeners first
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add hover sound
        newButton.addEventListener('mouseenter', () => {
            if (typeof audioManager !== 'undefined' && audioManager.isSoundEnabled) {
                audioManager.playSound('hover');
            }
        });
        
        // Add click sound
        newButton.addEventListener('click', () => {
            if (typeof audioManager !== 'undefined' && audioManager.isSoundEnabled) {
                audioManager.playSound('click');
            }
        });
    });
    
    console.log('Button effects added');
}

// Share score on social media
function shareScore() {
    const score = document.getElementById('final-score').textContent;
    const survivalTime = document.getElementById('survival-time').textContent;
    const text = `I survived ${survivalTime} and killed ${score} zombies in Zombie Survival! Can you beat my score?`;
    
    // Create a temporary input to copy the text
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    
    // Show copied notification with neon effect
    const shareButton = document.getElementById('share-score');
    const originalText = shareButton.textContent;
    shareButton.textContent = 'Score Copied!';
    shareButton.style.boxShadow = '0 0 20px #00fff2';
    
    setTimeout(() => {
        shareButton.textContent = originalText;
        shareButton.style.boxShadow = '';
    }, 2000);
}

// Initialize menu when the page loads
document.addEventListener('DOMContentLoaded', initMenu);

// Export functions
window.initMenu = initMenu;
window.updateSoundButtonState = updateSoundButtonState;
window.updateMusicButtonState = updateMusicButtonState; 