// powerup.js - Power-up system for health and stamina items

// Power-up properties
const POWERUP_TYPES = {
    HEART: {
        name: "Heart",
        model: null,
        effect: "health",
        spinSpeed: 0.02,
        hoverSpeed: 0.5,
        hoverHeight: 0.2,
        color: 0xff0000, // Red
        flashColor: "rgba(0, 255, 0, 0.3)", // Green flash
        soundEffect: "healthPickup"
    },
    SODA: {
        name: "Soda Can",
        model: null,
        effect: "stamina",
        staminaAmount: 50, // Amount of stamina to restore
        spinSpeed: 0.03,
        hoverSpeed: 0.4,
        hoverHeight: 0.15,
        color: 0x0088ff, // Blue
        flashColor: "rgba(0, 100, 255, 0.3)", // Blue flash
        soundEffect: "staminaPickup"
    }
};

// Power-up system properties
const MAX_POWERUPS = 3; // Maximum number of power-ups that can exist at once
const POWERUP_SPAWN_CHANCE = 0.3; // Base chance of a power-up spawning during a wave
const WAVE_SCALING_FACTOR = 0.05; // Increased chance per wave
const MIN_SPAWN_DISTANCE = 5; // Minimum distance from player to spawn power-ups
const MAX_SPAWN_DISTANCE = 15; // Maximum distance from player to spawn power-ups
const OBSTACLE_CHECK_RADIUS = 2; // Radius to check for obstacles when spawning
const HOVER_AMPLITUDE = 0.15; // How high power-ups hover

// Track active power-ups
let powerups = [];
let lastPowerupTime = 0;
const POWERUP_MIN_INTERVAL = 20000; // Minimum time between power-up spawns (20 seconds)

// Initialize the power-up system
function initPowerups() {
    // Clear any existing power-ups
    clearPowerups();
    
    // Create models for power-ups
    createPowerupModels();
    
    // Make powerups globally accessible
    window.powerups = powerups;
    
    console.log("Power-up system initialized");
}

// Create models for power-ups
function createPowerupModels() {
    // Create heart model
    POWERUP_TYPES.HEART.model = createHeartModel();
    
    // Create soda can model
    POWERUP_TYPES.SODA.model = createSodaCanModel();
}

// Create a heart model
function createHeartModel() {
    // Use a simple heart shape made from a sphere and cone
    const heartGroup = new THREE.Group();
    
    // Main heart shape - two spheres and a cone
    const sphereGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const heartMat = new THREE.MeshPhongMaterial({ 
        color: POWERUP_TYPES.HEART.color,
        shininess: 100,
        emissive: POWERUP_TYPES.HEART.color,
        emissiveIntensity: 0.5
    });
    
    // Left lobe
    const leftLobe = new THREE.Mesh(sphereGeo, heartMat);
    leftLobe.position.set(-0.13, 0, 0);
    heartGroup.add(leftLobe);
    
    // Right lobe
    const rightLobe = new THREE.Mesh(sphereGeo, heartMat);
    rightLobe.position.set(0.13, 0, 0);
    heartGroup.add(rightLobe);
    
    // Bottom point
    const coneGeo = new THREE.ConeGeometry(0.3, 0.4, 16);
    const cone = new THREE.Mesh(coneGeo, heartMat);
    cone.rotation.z = Math.PI; // Flip the cone
    cone.position.set(0, -0.3, 0);
    heartGroup.add(cone);
    
    // Add glow effect
    const glowMat = new THREE.MeshBasicMaterial({
        color: POWERUP_TYPES.HEART.color,
        transparent: true,
        opacity: 0.4
    });
    
    const glowSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 16, 16),
        glowMat
    );
    heartGroup.add(glowSphere);
    
    // Set scale
    heartGroup.scale.set(0.7, 0.7, 0.7);
    
    return heartGroup;
}

// Create a soda can model
function createSodaCanModel() {
    const canGroup = new THREE.Group();
    
    // Main can body
    const canGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 16);
    const canMat = new THREE.MeshPhongMaterial({
        color: POWERUP_TYPES.SODA.color,
        shininess: 80,
        metalness: 0.7,
        emissive: POWERUP_TYPES.SODA.color,
        emissiveIntensity: 0.3
    });
    
    const can = new THREE.Mesh(canGeo, canMat);
    canGroup.add(can);
    
    // Add top circle
    const topGeo = new THREE.CircleGeometry(0.15, 16);
    const topMat = new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        shininess: 100
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.rotation.x = -Math.PI / 2;
    top.position.y = 0.2;
    canGroup.add(top);
    
    // Add pull tab
    const tabGeo = new THREE.BoxGeometry(0.08, 0.02, 0.08);
    const tab = new THREE.Mesh(tabGeo, topMat);
    tab.position.set(0, 0.22, 0);
    canGroup.add(tab);
    
    // Add label (just a differently colored segment)
    const labelGeo = new THREE.CylinderGeometry(0.151, 0.151, 0.25, 16);
    const labelMat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        shininess: 10
    });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.y = -0.05;
    canGroup.add(label);
    
    // Add "SODA" text detail (simplified)
    const textGeo = new THREE.BoxGeometry(0.15, 0.05, 0.02);
    const textMat = new THREE.MeshPhongMaterial({
        color: POWERUP_TYPES.SODA.color,
    });
    const text = new THREE.Mesh(textGeo, textMat);
    text.position.set(0, -0.05, 0.13);
    canGroup.add(text);
    
    // Add glow effect
    const glowMat = new THREE.MeshBasicMaterial({
        color: POWERUP_TYPES.SODA.color,
        transparent: true,
        opacity: 0.4
    });
    
    const glowSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        glowMat
    );
    canGroup.add(glowSphere);
    
    // Set scale
    canGroup.scale.set(0.8, 0.8, 0.8);
    
    return canGroup;
}

// Spawn a random power-up during a wave
function spawnRandomPowerup(waveNumber) {
    const now = Date.now();
    
    // Don't spawn if we already have max power-ups
    if (powerups.length >= MAX_POWERUPS) {
        return;
    }
    
    // Don't spawn too frequently
    if (now - lastPowerupTime < POWERUP_MIN_INTERVAL) {
        return;
    }
    
    // Calculate spawn chance based on wave number
    const spawnChance = POWERUP_SPAWN_CHANCE + (waveNumber * WAVE_SCALING_FACTOR);
    
    // Random check if a power-up should spawn
    if (Math.random() > spawnChance) {
        return;
    }
    
    // Determine which type to spawn - more hearts in later waves
    const typeRoll = Math.random();
    const powerupType = typeRoll < 0.6 ? POWERUP_TYPES.SODA : POWERUP_TYPES.HEART;
    
    // Find a valid spawn position (not too close to player, no obstacles)
    const spawnPosition = findValidPowerupPosition();
    if (!spawnPosition) {
        console.log("Could not find valid power-up spawn position");
        return;
    }
    
    // Create the power-up
    createPowerup(powerupType, spawnPosition);
    
    // Update last spawn time
    lastPowerupTime = now;
}

// Find a valid position to spawn a power-up
function findValidPowerupPosition() {
    // Try up to 20 times to find a valid position
    for (let attempt = 0; attempt < 20; attempt++) {
        // Get random angle and distance from center
        const angle = Math.random() * Math.PI * 2;
        const distance = MIN_SPAWN_DISTANCE + Math.random() * (MAX_SPAWN_DISTANCE - MIN_SPAWN_DISTANCE);
        
        // Calculate position
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const position = new THREE.Vector3(x, 0, z);
        
        // Check if position is valid (not too close to player)
        const distanceToPlayer = position.distanceTo(camera.position);
        if (distanceToPlayer < MIN_SPAWN_DISTANCE) {
            continue;
        }
        
        // Check if position is clear of obstacles
        if (isPositionClearOfObstacles(position)) {
            return position;
        }
    }
    
    // Could not find valid position
    return null;
}

// Check if a position is clear of obstacles
function isPositionClearOfObstacles(position) {
    // Check if position is within arena bounds
    const distanceFromCenter = Math.sqrt(position.x * position.x + position.z * position.z);
    if (distanceFromCenter > 23) { // Slightly inside the 24-unit arena boundary
        return false;
    }
    
    // Check for collisions with environment objects
    if (window.environmentObjects && window.environmentObjects.length > 0) {
        for (const obj of window.environmentObjects) {
            if (!obj || !obj.position) continue;
            
            const distance = position.distanceTo(obj.position);
            if (distance < OBSTACLE_CHECK_RADIUS) {
                return false; // Too close to an obstacle
            }
        }
    }
    
    // Check for collisions with enemies
    if (window.enemies && window.enemies.length > 0) {
        for (const enemy of window.enemies) {
            if (!enemy.mesh || !enemy.mesh.position) continue;
            
            const distance = position.distanceTo(enemy.mesh.position);
            if (distance < OBSTACLE_CHECK_RADIUS) {
                return false; // Too close to an enemy
            }
        }
    }
    
    // Check for collisions with other power-ups
    for (const powerup of powerups) {
        const distance = position.distanceTo(powerup.mesh.position);
        if (distance < OBSTACLE_CHECK_RADIUS) {
            return false; // Too close to another power-up
        }
    }
    
    return true; // Position is clear
}

// Create a power-up
function createPowerup(type, position) {
    // Clone the model
    const model = type.model.clone();
    
    // Position the model
    model.position.copy(position);
    model.position.y = 0.5; // Start slightly above ground
    
    // Create power-up object
    const powerup = {
        type: type,
        mesh: model,
        spawnTime: Date.now(),
        hoverOffset: Math.random() * Math.PI * 2, // Random starting phase
    };
    
    // Add to scene and power-ups array
    scene.add(model);
    powerups.push(powerup);
    
    console.log(`Spawned ${type.name} power-up at`, position);
}

// Update power-ups (hover, spin, etc.)
function updatePowerups() {
    const now = Date.now();
    
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        
        // Update hover effect
        const hoverTime = now * 0.001 * powerup.type.hoverSpeed + powerup.hoverOffset;
        const hoverHeight = Math.sin(hoverTime) * HOVER_AMPLITUDE;
        powerup.mesh.position.y = 0.5 + hoverHeight;
        
        // Update spin effect
        powerup.mesh.rotation.y += powerup.type.spinSpeed;
        
        // Check for player collision
        const distanceToPlayer = powerup.mesh.position.distanceTo(camera.position);
        if (distanceToPlayer < 1.5) {
            collectPowerup(powerup);
        }
    }
}

// Collect a power-up
function collectPowerup(powerup) {
    // Apply power-up effect
    if (powerup.type.effect === "health") {
        // Only collect health if not full
        if (currentHealth < MAX_HEALTH) {
            // Restore health
            currentHealth = MAX_HEALTH;
            updateHealth();
            
            // Flash screen green
            showScreenFlash(powerup.type.flashColor);
            
            // Play sound
            if (typeof playSound === 'function') {
                playSound(powerup.type.soundEffect || 'healthPickup');
            }
            
            // Remove the power-up
            removePowerup(powerup);
        }
    } else if (powerup.type.effect === "stamina") {
        // Only collect stamina if not full
        if (currentStamina < MAX_STAMINA) {
            // Restore stamina
            currentStamina = Math.min(currentStamina + powerup.type.staminaAmount, MAX_STAMINA);
            updateStaminaUI();
            
            // Flash screen blue
            showScreenFlash(powerup.type.flashColor);
            
            // Play sound
            if (typeof playSound === 'function') {
                playSound(powerup.type.soundEffect || 'staminaPickup');
            }
            
            // Remove the power-up
            removePowerup(powerup);
        }
    }
}

// Remove a power-up
function removePowerup(powerup) {
    // Remove from scene
    scene.remove(powerup.mesh);
    
    // Remove from array
    const index = powerups.indexOf(powerup);
    if (index !== -1) {
        powerups.splice(index, 1);
    }
    
    // Dispose of resources
    if (powerup.mesh.geometry) {
        powerup.mesh.geometry.dispose();
    }
    if (powerup.mesh.material) {
        if (Array.isArray(powerup.mesh.material)) {
            powerup.mesh.material.forEach(mat => mat.dispose());
        } else {
            powerup.mesh.material.dispose();
        }
    }
}

// Show screen flash effect
function showScreenFlash(color) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = color;
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '9999';
    overlay.style.opacity = '0.7';
    overlay.style.transition = 'opacity 0.5s ease-out';
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Fade out and remove
    setTimeout(() => {
        overlay.style.opacity = '0';
    }, 100);
    
    setTimeout(() => {
        document.body.removeChild(overlay);
    }, 600);
}

// Clear all power-ups (call at end of wave or game reset)
function clearPowerups() {
    // Remove all power-ups from the scene
    for (const powerup of powerups) {
        scene.remove(powerup.mesh);
        
        // Dispose of resources
        if (powerup.mesh.geometry) {
            powerup.mesh.geometry.dispose();
        }
        if (powerup.mesh.material) {
            if (Array.isArray(powerup.mesh.material)) {
                powerup.mesh.material.forEach(mat => mat.dispose());
            } else {
                powerup.mesh.material.dispose();
            }
        }
    }
    
    // Clear the array
    powerups = [];
}

// Export functions to global scope
window.initPowerups = initPowerups;
window.updatePowerups = updatePowerups;
window.spawnRandomPowerup = spawnRandomPowerup;
window.clearPowerups = clearPowerups; 