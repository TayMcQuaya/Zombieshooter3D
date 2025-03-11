// enemy.js - Enemy spawning, movement, and collision

// Enemy properties
const enemySpeed = 0.015; // Even slower movement
const enemyDamage = 1; // One heart of damage
const enemySpawnInterval = 5000; // 5 seconds between wave checks
const zombieColors = [0x50FF50, 0x80FF80, 0x40FF40]; // Brighter, more visible greens
const ATTACK_COOLDOWN = 1500; // 1.5 seconds between attacks

// Array to track enemies
let enemies = [];
let enemySpawner = null;
let waveNumber = 0;
let waveInProgress = false;

// Initialize enemy system
function initEnemies() {
    // Nothing to initialize yet
    enemies = [];
    waveNumber = 0;
    waveInProgress = false;
}

// Start spawning enemies
function startEnemySpawner() {
    // Clear any existing spawner
    if (enemySpawner) {
        clearInterval(enemySpawner);
    }
    
    // Reset wave number
    waveNumber = 0;
    waveInProgress = false;
    
    // Start spawning enemies
    spawnEnemyWave();
    
    // Set up interval for checking if we need to spawn a new wave
    enemySpawner = setInterval(checkForNewWave, enemySpawnInterval);
}

// Check if we need to spawn a new wave
function checkForNewWave() {
    // Only spawn a new wave if there are no enemies left and no wave is in progress
    if (enemies.length === 0 && !waveInProgress) {
        spawnEnemyWave();
    }
}

// Stop spawning enemies
function stopEnemySpawner() {
    if (enemySpawner) {
        clearInterval(enemySpawner);
        enemySpawner = null;
    }
}

// Spawn a wave of enemies
function spawnEnemyWave() {
    waveNumber++;
    waveInProgress = true;
    
    // Calculate number of enemies to spawn based on wave number (fewer zombies)
    const enemyCount = 3 + Math.floor(waveNumber / 2);
    
    // Spawn enemies
    for (let i = 0; i < enemyCount; i++) {
        // Stagger the spawning of zombies to make them appear one by one
        setTimeout(() => {
            spawnEnemy();
        }, i * 1000); // Spawn one zombie every second
    }
    
    // Play wave sound
    playWaveSound();
    
    // Update UI with wave number
    updateWaveUI(waveNumber);
}

// Spawn a single enemy
function spawnEnemy() {
    const geo = new THREE.BoxGeometry(1, 2, 1); // Zombie-like shape
    const mat = new THREE.MeshLambertMaterial({ 
        color: zombieColors[Math.floor(Math.random() * zombieColors.length)],
        emissive: 0x202020, // Slight glow to make them more visible
        emissiveIntensity: 0.5
    });
    const mesh = new THREE.Mesh(geo, mat);
    
    // Random position at arena edge
    const angle = Math.random() * Math.PI * 2;
    const radius = 20; // Spawn distance from center
    mesh.position.set(
        Math.cos(angle) * radius,
        1, // Height off ground
        Math.sin(angle) * radius
    );
    
    const enemy = {
        mesh: mesh,
        health: 3,
        lastHit: 0,
        isHit: false,
        lastAttack: 0 // Track last attack time
    };
    
    scene.add(mesh);
    enemies.push(enemy);
}

// Handle enemy being hit
function hitEnemy(enemy) {
    enemy.health--;
    enemy.lastHit = Date.now();
    enemy.isHit = true;
    
    // Flash red
    enemy.mesh.material.emissive.setHex(0xff0000);
    
    // Play hit sound
    playHitSound();
    
    if (enemy.health <= 0) {
        destroyEnemy(enemy);
    }
}

// Update enemies
function updateEnemies() {
    const now = Date.now();
    
    enemies.forEach((enemy) => {
        // Move towards player
        const directionToPlayer = new THREE.Vector3()
            .subVectors(camera.position, enemy.mesh.position)
            .normalize();
        
        enemy.mesh.position.add(
            directionToPlayer.multiplyScalar(enemySpeed)
        );
        
        // Check for hit effect reset
        if (enemy.isHit && now - enemy.lastHit > 200) {
            enemy.isHit = false;
            enemy.mesh.material.emissive.setHex(0x202020); // Return to default glow
        }
        
        // Check for collision with player
        if (enemy.mesh.position.distanceTo(camera.position) < 2) {
            // Only attack if enough time has passed since last attack
            if (now - enemy.lastAttack >= ATTACK_COOLDOWN) {
                damagePlayer();
                enemy.lastAttack = now;
                // Push enemy back slightly
                enemy.mesh.position.sub(directionToPlayer.multiplyScalar(3));
            }
        }
        
        // Make zombie face player
        enemy.mesh.lookAt(camera.position);
    });
}

// Create a zombie mesh
function createZombie() {
    // Choose a random color from the zombie colors
    const colorIndex = Math.floor(Math.random() * zombieColors.length);
    const color = zombieColors[colorIndex];
    
    // Create a group to hold all zombie parts
    const zombie = new THREE.Group();
    zombie.userData = { color: color };
    
    // Zombie body
    const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.5;
    body.castShadow = true;
    body.receiveShadow = true;
    zombie.add(body);
    
    // Zombie head
    const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D }); // Brown
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.45;
    head.castShadow = true;
    head.receiveShadow = true;
    zombie.add(head);
    
    // Zombie arms
    const armGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.4);
    const armMaterial = new THREE.MeshLambertMaterial({ color: color });
    
    // Left arm
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.7, 1.5, 0);
    leftArm.castShadow = true;
    leftArm.receiveShadow = true;
    zombie.add(leftArm);
    
    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.7, 1.5, 0);
    rightArm.castShadow = true;
    rightArm.receiveShadow = true;
    zombie.add(rightArm);
    
    // Zombie legs
    const legGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.4);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 }); // Black
    
    // Left leg
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, 0.6, 0);
    leftLeg.castShadow = true;
    leftLeg.receiveShadow = true;
    zombie.add(leftLeg);
    
    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, 0.6, 0);
    rightLeg.castShadow = true;
    rightLeg.receiveShadow = true;
    zombie.add(rightLeg);
    
    // Store references to limbs for animation
    zombie.userData.leftArm = leftArm;
    zombie.userData.rightArm = rightArm;
    zombie.userData.leftLeg = leftLeg;
    zombie.userData.rightLeg = rightLeg;
    
    return zombie;
}

// Destroy an enemy (when hit by projectile)
function destroyEnemy(enemy) {
    // Remove enemy from scene
    scene.remove(enemy.mesh);
    
    // Remove enemy from array
    const index = enemies.indexOf(enemy);
    if (index !== -1) {
        enemies.splice(index, 1);
    }
    
    // Create explosion effect
    createExplosionEffect(enemy.mesh.position, 0x8B0000); // Dark red for blood
    
    // Play explosion sound
    playExplosionSound();
    
    // Show kill indicator
    showKillIndicator();
    
    // Increase score
    score += 10;
    updateUI();
    
    // Check if wave is cleared
    if (enemies.length === 0) {
        // Wave cleared bonus
        score += 50;
        updateUI();
        
        // Show wave cleared indicator
        showWaveClearedIndicator();
        
        // Play wave cleared sound
        playWaveClearedSound();
        
        // Mark wave as complete
        waveInProgress = false;
    }
}

// Clear all enemies
function clearEnemies() {
    // Remove all enemies from scene
    enemies.forEach(enemy => {
        scene.remove(enemy.mesh);
    });
    
    // Clear enemies array
    enemies = [];
}

// Create explosion effect at position
function createExplosionEffect(position, color) {
    // Create particle system for explosion (blood splatter)
    const particleCount = 20;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        // Create particle
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({ color: color })
        );
        
        // Set particle position
        particle.position.copy(position);
        particle.position.y += 1; // Adjust height for zombie center mass
        
        // Set random velocity
        const velocity = new THREE.Vector3(
            Math.random() * 0.2 - 0.1,
            Math.random() * 0.2,
            Math.random() * 0.2 - 0.1
        );
        
        // Add to scene
        scene.add(particle);
        
        // Add to particles array
        particles.push({
            mesh: particle,
            velocity: velocity,
            created: Date.now()
        });
    }
    
    // Animate particles
    const animateParticles = () => {
        const now = Date.now();
        const particlesToRemove = [];
        
        particles.forEach((particle, index) => {
            // Move particle
            particle.mesh.position.add(particle.velocity);
            
            // Apply gravity
            particle.velocity.y -= 0.005;
            
            // Remove particles after 1 second
            if (now - particle.created > 1000) {
                particlesToRemove.push(index);
            }
        });
        
        // Remove old particles
        particlesToRemove.sort((a, b) => b - a).forEach(index => {
            scene.remove(particles[index].mesh);
            particles.splice(index, 1);
        });
        
        // Continue animation if particles remain
        if (particles.length > 0) {
            requestAnimationFrame(animateParticles);
        }
    };
    
    // Start animation
    animateParticles();
}

// Create hit effect at position
function createHitEffect(position, color) {
    // Create a flash of light
    const flash = new THREE.PointLight(color, 1, 10);
    flash.position.copy(position);
    flash.position.y += 1; // Adjust height for zombie center mass
    scene.add(flash);
    
    // Remove flash after a short time
    setTimeout(() => {
        scene.remove(flash);
    }, 100);
} 