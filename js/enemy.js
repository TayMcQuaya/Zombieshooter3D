// enemy.js - Enemy spawning, movement, and collision

// Enemy properties
const enemySpeed = 0.008; // Reduced from 0.015 for slower zombies
const enemyDamage = 1; // One heart of damage
const enemySpawnInterval = 5000; // 5 seconds between wave checks
const zombieColors = [0x50FF50, 0x80FF80, 0x40FF40]; // Brighter, more visible greens
const ATTACK_COOLDOWN = 1500; // 1.5 seconds between attacks
const SPAWN_ANIMATION_DURATION = 2000; // 2 seconds to emerge
const MAX_PARTICLES = 50;
const MAX_ENEMIES = 15;

// Array to track enemies and particles
let enemies = [];
let particles = [];
let enemySpawner = null;
let waveNumber = 0;
let waveInProgress = false;

// Initialize enemy system
function initEnemies() {
    enemies = [];
    particles = [];
    waveNumber = 0;
    waveInProgress = false;
    
    // Make enemies globally accessible
    window.enemies = enemies;
    window.hitEnemy = hitEnemy;
    
    console.log("Enemy system initialized");
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
    
    // Calculate number of enemies (capped at MAX_ENEMIES)
    const enemyCount = Math.min(3 + Math.floor(waveNumber / 2), MAX_ENEMIES);
    
    // Spawn enemies with delay
    for (let i = 0; i < enemyCount; i++) {
        setTimeout(() => {
            if (enemies.length < MAX_ENEMIES) {
                spawnEnemy();
            }
        }, i * 1000);
    }
    
    // Play wave sound
    playWaveSound();
    
    // Update UI with wave number
    updateWaveUI(waveNumber);
}

// Spawn a single enemy
function spawnEnemy() {
    // Create zombie body
    const geo = new THREE.BoxGeometry(1, 2, 1);
    const mat = new THREE.MeshLambertMaterial({ 
        color: zombieColors[Math.floor(Math.random() * zombieColors.length)],
        emissive: 0x202020,
        emissiveIntensity: 0.5
    });
    const mesh = new THREE.Mesh(geo, mat);
    
    // Create zombie face (smiley)
    const faceGeo = new THREE.PlaneGeometry(0.8, 0.8);
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 128;
    faceCanvas.height = 128;
    const ctx = faceCanvas.getContext('2d');
    
    // Clear canvas with transparent background
    ctx.clearRect(0, 0, 128, 128);
    
    // Draw face outline
    ctx.fillStyle = '#50FF50';
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw eyes
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(40, 40, 12, 0, Math.PI * 2); // Left eye socket
    ctx.arc(88, 40, 12, 0, Math.PI * 2); // Right eye socket
    ctx.fill();
    
    // Draw red pupils
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(40, 40, 6, 0, Math.PI * 2); // Left pupil
    ctx.arc(88, 40, 6, 0, Math.PI * 2); // Right pupil
    ctx.fill();
    
    // Draw evil smile
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(64, 75, 30, 0, Math.PI);
    ctx.fill();
    
    // Add teeth
    ctx.fillStyle = 'white';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(44 + i * 10, 75, 5, 10);
    }
    
    // Add some blood dripping
    ctx.fillStyle = 'darkred';
    ctx.beginPath();
    ctx.moveTo(50, 75);
    ctx.lineTo(45, 100);
    ctx.lineTo(55, 100);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(78, 75);
    ctx.lineTo(73, 105);
    ctx.lineTo(83, 105);
    ctx.fill();
    
    // Create texture from canvas
    const faceTexture = new THREE.CanvasTexture(faceCanvas);
    const faceMat = new THREE.MeshBasicMaterial({
        map: faceTexture,
        transparent: true
    });
    const face = new THREE.Mesh(faceGeo, faceMat);
    
    // Position face on front of zombie
    face.position.z = 0.51;
    face.position.y = 0.5;
    mesh.add(face);
    
    // Random position at arena edge
    const angle = Math.random() * Math.PI * 2;
    const radius = 20;
    const spawnX = Math.cos(angle) * radius;
    const spawnZ = Math.sin(angle) * radius;
    
    // Start position (underground)
    mesh.position.set(spawnX, -2, spawnZ);
    
    const enemy = {
        mesh: mesh,
        health: 3,  // Zombie dies after 3 hits
        lastHit: 0,
        isHit: false,
        lastAttack: 0,
        spawnTime: Date.now(),
        isSpawning: true,
        targetY: 1
    };
    
    scene.add(mesh);
    enemies.push(enemy);
    
    // Update global reference
    window.enemies = enemies;
    
    console.log("Spawned zombie with health:", enemy.health);
}

// Hit enemy (reduce health)
function hitEnemy(enemy) {
    console.log("Hit enemy called, health before:", enemy.health);
    
    // Prevent multiple hits in quick succession
    const now = Date.now();
    if (enemy.isHit && now - enemy.lastHit < 200) {
        console.log("Hit ignored - too soon after last hit");
        return;
    }
    
    // Reduce health
    enemy.health -= 1;
    enemy.isHit = true;
    enemy.lastHit = now;
    
    // Visual feedback - flash red
    enemy.mesh.material.emissive.setHex(0xff0000);
    
    // Play hit sound
    if (typeof playSound === 'function') {
        playSound('hit');
    }
    
    // Create hit effect
    createHitEffect(enemy.mesh.position, 0xff0000);
    
    console.log("Enemy health after hit:", enemy.health);
    
    // Check if enemy is destroyed
    if (enemy.health <= 0) {
        console.log("Enemy destroyed");
        destroyEnemy(enemy);
    }
}

// Update enemies
function updateEnemies() {
    const now = Date.now();
    updateParticles();
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        if (enemy.isSpawning) {
            const spawnProgress = (now - enemy.spawnTime) / SPAWN_ANIMATION_DURATION;
            if (spawnProgress < 1) {
                const targetY = enemy.targetY;
                const currentY = -2 + (spawnProgress * (targetY + 2));
                enemy.mesh.position.y = currentY;
                enemy.mesh.rotation.x = Math.sin(spawnProgress * Math.PI * 4) * 0.1;
                enemy.mesh.rotation.z = Math.cos(spawnProgress * Math.PI * 4) * 0.1;
                continue;
            } else {
                enemy.isSpawning = false;
                enemy.mesh.position.y = enemy.targetY;
                enemy.mesh.rotation.x = 0;
                enemy.mesh.rotation.z = 0;
            }
        }
        
        if (!enemy.isSpawning) {
            const directionToPlayer = new THREE.Vector3()
                .subVectors(camera.position, enemy.mesh.position)
                .normalize();
            
            directionToPlayer.y = 0;
            enemy.mesh.position.add(directionToPlayer.multiplyScalar(enemySpeed));
            enemy.mesh.position.y = enemy.targetY;
            
            enemy.mesh.lookAt(new THREE.Vector3(
                camera.position.x,
                enemy.mesh.position.y,
                camera.position.z
            ));
            
            // Simple environment collision check (less frequent)
            if (typeof window.environmentObjects !== 'undefined' && Math.random() < 0.1) {
                const zombieRadius = 0.5;
                // Only check nearby objects for better performance
                for (let j = 0; j < window.environmentObjects.length; j++) {
                    const obj = window.environmentObjects[j];
                    if (obj.userData && obj.userData.isCollidable) {
                        const distance = enemy.mesh.position.distanceTo(obj.position);
                        if (distance < 2) { // Only check close objects
                            const minDistance = zombieRadius + (obj.userData.radius || 0.5);
                            
                            if (distance < minDistance) {
                                // Push zombie away from object
                                const pushDirection = new THREE.Vector3()
                                    .subVectors(enemy.mesh.position, obj.position)
                                    .normalize();
                                enemy.mesh.position.add(pushDirection.multiplyScalar(0.1));
                                break; // Only handle one collision per frame
                            }
                        }
                    }
                }
            }
            
            // Check for player attack
            if (!enemy.isSpawning && enemy.mesh.position.distanceTo(camera.position) < 2) {
                if (now - enemy.lastAttack >= ATTACK_COOLDOWN) {
                    damagePlayer();
                    enemy.lastAttack = now;
                    // Don't push enemy back when attacking
                }
            }
        }
        
        // Reset hit effect
        if (enemy.isHit && now - enemy.lastHit > 200) {
            enemy.isHit = false;
            enemy.mesh.material.emissive.setHex(0x202020);
        }
    }
    
    // Update global reference
    window.enemies = enemies;
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
    console.log("Destroying enemy");
    
    // Create explosion effect
    createExplosionEffect(enemy.mesh.position, 0xff0000);
    
    // Play explosion sound
    if (typeof playSound === 'function') {
        playSound('explode');
    }
    
    // Remove from scene
    scene.remove(enemy.mesh);
    
    // Dispose of geometry and material to free memory
    if (enemy.mesh.geometry) enemy.mesh.geometry.dispose();
    if (enemy.mesh.material) enemy.mesh.material.dispose();
    
    // Remove from array
    const index = enemies.indexOf(enemy);
    if (index !== -1) {
        enemies.splice(index, 1);
    }
    
    // Update score
    if (typeof updateScore === 'function') {
        updateScore(10);
    }
    
    // Update global reference
    window.enemies = enemies;
    
    // Check if wave is complete
    if (enemies.length === 0) {
        waveInProgress = false;
    }
}

// Clear all enemies and particles
function clearEnemies() {
    enemies.forEach(enemy => {
        scene.remove(enemy.mesh);
        enemy.mesh.geometry.dispose();
        enemy.mesh.material.dispose();
    });
    enemies = [];
    
    particles.forEach(particle => {
        scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        particle.mesh.material.dispose();
    });
    particles = [];
}

// Create explosion effect at position
function createExplosionEffect(position, color) {
    // Limit total particles
    if (particles.length >= MAX_PARTICLES) return;
    
    const particleCount = Math.min(10, MAX_PARTICLES - particles.length);
    
    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({ color: color })
        );
        
        particle.position.copy(position);
        particle.position.y += 1;
        
        const velocity = new THREE.Vector3(
            Math.random() * 0.2 - 0.1,
            Math.random() * 0.2,
            Math.random() * 0.2 - 0.1
        );
        
        scene.add(particle);
        particles.push({
            mesh: particle,
            velocity: velocity,
            created: Date.now()
        });
    }
}

// Update particles
function updateParticles() {
    const now = Date.now();
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Move particle
        particle.mesh.position.add(particle.velocity);
        particle.velocity.y -= 0.005;
        
        // Remove old particles
        if (now - particle.created > 1000) {
            scene.remove(particle.mesh);
            particle.mesh.geometry.dispose();
            particle.mesh.material.dispose();
            particles.splice(i, 1);
        }
    }
}

// Create hit effect at position
function createHitEffect(position, color) {
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

// Export functions
window.updateEnemies = updateEnemies;
window.startEnemySpawner = startEnemySpawner;
window.stopEnemySpawner = stopEnemySpawner;
window.clearEnemies = clearEnemies;
window.enemies = enemies;
window.hitEnemy = hitEnemy; 