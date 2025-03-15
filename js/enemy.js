// enemy.js - Enemy spawning, movement, and collision

// Enemy properties
const BASE_ENEMY_SPEED = 0.008; // Base speed for regular zombies
const PURPLE_ENEMY_SPEED = 0.011; // 37.5% faster than base speed
const TANK_ENEMY_SPEED = 0.005; // 60% of base speed
const enemyDamage = 1; // One heart of damage
const TANK_DAMAGE = 2; // Tank zombies deal double damage
const enemySpawnInterval = 5000; // 5 seconds between wave checks
const zombieColors = [0x50FF50, 0x80FF80, 0x40FF40]; // Brighter, more visible greens
const ATTACK_COOLDOWN = 1500; // 1.5 seconds between attacks
const SPAWN_ANIMATION_DURATION = 2000; // 2 seconds to emerge
const MAX_PARTICLES = 50;
const MAX_ENEMIES = 15;

// Zombie types
const ZOMBIE_TYPES = {
    BASE: 'base',
    PURPLE: 'purple',
    TANK: 'tank'
};

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
    if (!waveInProgress && enemies.length === 0) {
        console.log("All enemies defeated, starting new wave");
        
        // Show wave cleared indicator
        if (typeof showWaveClearedIndicator === 'function') {
            showWaveClearedIndicator();
        }
        
        // Play wave cleared sound
        if (typeof playSound === 'function') {
            playSound('wave_cleared');
        }
        
        // Update score with wave clear bonus
        if (typeof updateScore === 'function') {
            updateScore(50); // 50 points for clearing a wave
        }
        
        // Start the next wave
        spawnEnemyWave();
    }
}

// Stop spawning enemies
function stopEnemySpawner() {
    // Clear the enemy spawner interval
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
    const baseEnemyCount = Math.min(3 + Math.floor(waveNumber / 2), MAX_ENEMIES);
    
    // Clear any remaining power-ups from previous wave
    if (typeof clearPowerups === 'function') {
        clearPowerups();
    }
    
    // Calculate enemy type distribution based on wave number
    let purpleCount = 0;
    let tankCount = 0;
    
    if (waveNumber >= 3) { // Purple zombies start appearing at wave 3
        // Calculate purple zombies (25% of total after wave 5, less before)
        const purplePercentage = waveNumber >= 5 ? 0.25 : 0.15;
        purpleCount = Math.min(1 + Math.floor((waveNumber - 3) / 2), Math.floor(baseEnemyCount * purplePercentage));
    }
    
    if (waveNumber >= 5) { // Tank zombies start appearing at wave 5
        // Only 1 tank in earlier waves, max 2 in later waves
        tankCount = Math.min(1, Math.floor(baseEnemyCount * 0.15));
        if (waveNumber >= 8) {
            tankCount = Math.min(2, Math.floor(baseEnemyCount * 0.15));
        }
    }
    
    // Adjust base zombie count
    const baseCount = baseEnemyCount - purpleCount - tankCount;
    
    // Spawn enemies with delay
    let spawnIndex = 0;
    
    // Spawn base zombies
    for (let i = 0; i < baseCount; i++) {
        setTimeout(() => {
            if (enemies.length < MAX_ENEMIES) {
                spawnEnemy(ZOMBIE_TYPES.BASE);
                
                // Chance to spawn a power-up with each enemy
                if (typeof spawnRandomPowerup === 'function' && spawnIndex % 3 === 0) {
                    spawnRandomPowerup(waveNumber);
                }
            }
        }, spawnIndex * 1000);
        spawnIndex++;
    }
    
    // Spawn purple zombies
    for (let i = 0; i < purpleCount; i++) {
        setTimeout(() => {
            if (enemies.length < MAX_ENEMIES) {
                spawnEnemy(ZOMBIE_TYPES.PURPLE);
                
                // Higher chance to spawn power-ups from purple zombies
                if (typeof spawnRandomPowerup === 'function' && Math.random() < 0.4) {
                    spawnRandomPowerup(waveNumber);
                }
            }
        }, spawnIndex * 1000);
        spawnIndex++;
    }
    
    // Spawn tank zombies with maximum spacing
    if (tankCount > 0) {
        const tankSpacing = Math.floor(spawnIndex / (tankCount + 1));
        for (let i = 0; i < tankCount; i++) {
            const tankSpawnIndex = (i + 1) * tankSpacing;
            setTimeout(() => {
                if (enemies.length < MAX_ENEMIES) {
                    spawnEnemy(ZOMBIE_TYPES.TANK);
                    
                    // Guaranteed power-up from tank zombies
                    if (typeof spawnRandomPowerup === 'function') {
                        spawnRandomPowerup(waveNumber);
                    }
                }
            }, tankSpawnIndex * 1000);
        }
    }
    
    // Play wave sound
    if (typeof playSound === 'function') {
        playSound('wave');
    }
    
    // Update UI with wave number
    if (typeof updateWaveUI === 'function') {
        updateWaveUI(waveNumber);
    }
}

// Spawn a single enemy
function spawnEnemy(type = ZOMBIE_TYPES.BASE) {
    // Create zombie body with our detailed zombie skin texture
    const geo = new THREE.BoxGeometry(1, 2, 1);
    
    // Adjust size for tank zombies
    if (type === ZOMBIE_TYPES.TANK) {
        geo.scale(1.5, 1.5, 1.5);
    }
    
    // Use our detailed zombie skin texture
    const zombieSkinTexture = createZombieSkinTexture(type);
    
    // Create a more realistic material with the texture
    const mat = new THREE.MeshPhongMaterial({ 
        map: zombieSkinTexture,
        bumpMap: zombieSkinTexture,
        bumpScale: 0.05,
        shininess: 0,
        emissive: new THREE.Color(getZombieEmissiveColor(type)),
        emissiveIntensity: type === ZOMBIE_TYPES.TANK ? 0.4 : 
                          type === ZOMBIE_TYPES.PURPLE ? 0.3 : 0.2
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Create zombie face with our detailed zombie face texture
    const faceGeo = new THREE.PlaneGeometry(
        type === ZOMBIE_TYPES.TANK ? 1.2 : 0.8, 
        type === ZOMBIE_TYPES.TANK ? 1.2 : 0.8
    );
    
    // Use our detailed zombie face texture
    const faceTexture = createZombieFaceTexture(type);
    
    const faceMat = new THREE.MeshBasicMaterial({
        map: faceTexture,
        transparent: true
    });
    const face = new THREE.Mesh(faceGeo, faceMat);
    
    // Position face on front of zombie
    face.position.z = type === ZOMBIE_TYPES.TANK ? 0.8 : 0.51; // Move Tank face more forward, keep others at original position
    face.position.y = type === ZOMBIE_TYPES.TANK ? 0.85 : 0.5; // Lower Tank face more, keep others at original position
    mesh.add(face);
    
    // Add limbs with the same zombie skin texture
    
    // Arms
    const armGeo = new THREE.BoxGeometry(
        type === ZOMBIE_TYPES.TANK ? 0.4 : 0.25,
        type === ZOMBIE_TYPES.TANK ? 1.2 : 0.8,
        type === ZOMBIE_TYPES.TANK ? 0.4 : 0.25
    );
    
    // Left arm - positioned extended forward
    const leftArm = new THREE.Mesh(armGeo, mat);
    leftArm.position.x = type === ZOMBIE_TYPES.TANK ? -0.9 : -0.6;
    leftArm.position.y = type === ZOMBIE_TYPES.TANK ? 0.2 : 0;
    // Rotate arm to extend forward
    leftArm.rotation.z = Math.random() * 0.2 - 0.1; // Slight random Z rotation
    leftArm.rotation.x = -Math.PI / 2; // Rotate forward by 90 degrees (straight forward)
    leftArm.position.z = type === ZOMBIE_TYPES.TANK ? 0.6 : 0.4; // Move forward
    leftArm.castShadow = true;
    mesh.add(leftArm);
    
    // Right arm - positioned extended forward
    const rightArm = new THREE.Mesh(armGeo, mat);
    rightArm.position.x = type === ZOMBIE_TYPES.TANK ? 0.9 : 0.6;
    rightArm.position.y = type === ZOMBIE_TYPES.TANK ? 0.2 : 0;
    // Rotate arm to extend forward
    rightArm.rotation.z = Math.random() * 0.2 - 0.1; // Slight random Z rotation
    rightArm.rotation.x = -Math.PI / 2; // Rotate forward by 90 degrees (straight forward)
    rightArm.position.z = type === ZOMBIE_TYPES.TANK ? 0.6 : 0.4; // Move forward
    rightArm.castShadow = true;
    mesh.add(rightArm);
    
    // Legs
    const legGeo = new THREE.BoxGeometry(
        type === ZOMBIE_TYPES.TANK ? 0.4 : 0.25,
        type === ZOMBIE_TYPES.TANK ? 1.2 : 0.8,
        type === ZOMBIE_TYPES.TANK ? 0.4 : 0.25
    );
    
    // Left leg
    const leftLeg = new THREE.Mesh(legGeo, mat);
    leftLeg.position.set(
        type === ZOMBIE_TYPES.TANK ? -0.3 : -0.2,
        type === ZOMBIE_TYPES.TANK ? -1.5 : -1,
        0
    );
    leftLeg.castShadow = true;
    mesh.add(leftLeg);
    
    // Right leg
    const rightLeg = new THREE.Mesh(legGeo, mat);
    rightLeg.position.set(
        type === ZOMBIE_TYPES.TANK ? 0.3 : 0.2,
        type === ZOMBIE_TYPES.TANK ? -1.5 : -1,
        0
    );
    rightLeg.castShadow = true;
    mesh.add(rightLeg);
    
    // Add some random rotation to make zombies look more shambling
    mesh.rotation.x = Math.random() * 0.2 - 0.1;
    mesh.rotation.z = Math.random() * 0.2 - 0.1;
    
    // Random position at arena edge
    const angle = Math.random() * Math.PI * 2;
    const radius = 20;
    const spawnX = Math.cos(angle) * radius;
    const spawnZ = Math.sin(angle) * radius;
    
    // Start position (underground)
    mesh.position.set(spawnX, -2, spawnZ);
    
    const enemy = {
        mesh: mesh,
        health: getZombieHealth(type),
        type: type,
        damage: type === ZOMBIE_TYPES.TANK ? TANK_DAMAGE : enemyDamage,
        lastHit: 0,
        isHit: false,
        lastAttack: 0,
        spawnTime: Date.now(),
        isSpawning: true,
        targetY: 1,
        originalScale: mesh.scale.clone(),
        originalMaterialProps: {
            color: mat.color.getHex(),
            emissive: mat.emissive.getHex(),
            emissiveIntensity: mat.emissiveIntensity
        },
        // Store references to limbs for animation
        leftArm: leftArm,
        rightArm: rightArm,
        // Store original arm rotations for animation
        leftArmDefaultRotation: leftArm.rotation.clone(),
        rightArmDefaultRotation: rightArm.rotation.clone()
    };
    
    // Add blood splatter effects on random parts of the zombie
    addBloodSplatter(mesh);
    
    scene.add(mesh);
    enemies.push(enemy);
    
    // Update global reference
    window.enemies = enemies;
    
    // Play zombie spawn sound
    if (typeof playSound === 'function') {
        playSound('zombieSpawn');
    }
    
    console.log("Spawned zombie with health:", enemy.health);
}

// Helper function to get zombie health based on type
function getZombieHealth(type) {
    switch(type) {
        case ZOMBIE_TYPES.TANK:
            return 8;
        case ZOMBIE_TYPES.PURPLE:
            return 3;
        default:
            return 5;
    }
}

// Helper function to get zombie emissive color based on type
function getZombieEmissiveColor(type) {
    switch(type) {
        case ZOMBIE_TYPES.TANK:
            return 0x300000; // Red glow
        case ZOMBIE_TYPES.PURPLE:
            return 0x300030; // Purple glow
        default:
            return 0x003300; // Green glow
    }
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
    
    // Store original properties if not already stored
    if (!enemy.originalScale) {
        enemy.originalScale = enemy.mesh.scale.clone();
    }
    
    if (!enemy.originalMaterialProps) {
        // Store original material properties
        enemy.originalMaterialProps = {
            emissive: enemy.mesh.material.emissive.getHex(),
            emissiveIntensity: enemy.mesh.material.emissiveIntensity || 0.2
        };
    }
    
    // Visual feedback - make zombie glow red when hit
    enemy.mesh.material.emissive.setHex(0xff0000);  // Set emissive to red
    enemy.mesh.material.emissiveIntensity = 0.8;    // Strong emissive effect
    
    // Apply the same effect to all limbs, but not to blood splatters
    enemy.mesh.children.forEach(child => {
        // Only apply to limbs with emissive properties, not to blood splatters
        if (child.material && child.material.emissive && (!child.userData || !child.userData.isBloodSplatter)) {
            child.material.emissive.setHex(0xff0000);
            child.material.emissiveIntensity = 0.8;
        }
    });
    
    // Add a slight scale effect (make zombie slightly larger when hit)
    enemy.mesh.scale.set(
        enemy.originalScale.x * 1.2,
        enemy.originalScale.y * 1.2,
        enemy.originalScale.z * 1.2
    );
    
    // Add a new blood splatter at the hit location
    const hitPosition = new THREE.Vector3(
        Math.random() * 0.8 - 0.4,
        Math.random() * 1.6 - 0.8,
        0.53 // Slightly in front of existing splatters
    );
    
    // Create blood splatter
    const splatterGeo = new THREE.PlaneGeometry(0.4 + Math.random() * 0.3, 0.4 + Math.random() * 0.3);
    
    // Create blood texture
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Draw blood splatter
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 128, 128);
    
    // Blood color - brighter red for fresh blood
    ctx.fillStyle = `rgba(${200 + Math.random() * 55}, ${10 + Math.random() * 20}, ${10 + Math.random() * 20}, 0.95)`;
    
    // Create splatter shape
    ctx.beginPath();
    ctx.arc(64, 64, 40 + Math.random() * 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Add drips
    const dripCount = 4 + Math.floor(Math.random() * 4);
    for (let j = 0; j < dripCount; j++) {
        const angle = Math.random() * Math.PI * 2;
        const length = 30 + Math.random() * 40;
        const width = 8 + Math.random() * 12;
        
        const x = 64 + Math.cos(angle) * 30;
        const y = 64 + Math.sin(angle) * 30;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        ctx.lineWidth = width;
        ctx.strokeStyle = `rgba(${200 + Math.random() * 55}, ${10 + Math.random() * 20}, ${10 + Math.random() * 20}, 0.9)`;
        ctx.stroke();
    }
    
    // Create texture
    const splatterTexture = new THREE.CanvasTexture(canvas);
    
    // Create material with improved rendering properties
    const splatterMat = new THREE.MeshBasicMaterial({
        map: splatterTexture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false, // Prevent z-fighting
        depthTest: true,   // Still test against depth buffer
        alphaTest: 0.1     // Discard very transparent pixels
    });
    
    // Create mesh
    const splatter = new THREE.Mesh(splatterGeo, splatterMat);
    splatter.position.copy(hitPosition);
    splatter.rotation.z = Math.random() * Math.PI * 2;
    
    // Mark this as a blood splatter for special handling
    splatter.userData = { isBloodSplatter: true };
    
    // Set render order to ensure blood splatters render after the zombie parts
    splatter.renderOrder = 1;
    
    enemy.mesh.add(splatter);
    
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
    
    // Also update power-ups if the function exists
    if (typeof updatePowerups === 'function') {
        updatePowerups();
    }
    
    // Occasionally try to spawn a power-up during the wave
    if (waveInProgress && typeof spawnRandomPowerup === 'function' && Math.random() < 0.001) {
        spawnRandomPowerup(waveNumber);
    }
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Update attack animation if in progress
        if (enemy.isAttacking) {
            updateZombieAttackAnimation(enemy);
        }
        
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
            // Calculate direction to player
            const directionToPlayer = new THREE.Vector3()
                .subVectors(camera.position, enemy.mesh.position)
                .normalize();
            
            // Keep direction on the ground plane
            directionToPlayer.y = 0;
            
            // Store the current position before moving
            const previousPosition = enemy.mesh.position.clone();
            
            // Move towards player with type-specific speed
            const speed = enemy.type === ZOMBIE_TYPES.PURPLE ? PURPLE_ENEMY_SPEED :
                         enemy.type === ZOMBIE_TYPES.TANK ? TANK_ENEMY_SPEED :
                         BASE_ENEMY_SPEED;
            enemy.mesh.position.add(directionToPlayer.multiplyScalar(speed));
            enemy.mesh.position.y = enemy.targetY;
            
            // Look at player
            enemy.mesh.lookAt(new THREE.Vector3(
                camera.position.x,
                enemy.mesh.position.y,
                camera.position.z
            ));
            
            // Player collision detection
            const playerRadius = 0.5; // Player collision radius
            const zombieRadius = 0.5; // Zombie collision radius
            const minDistance = playerRadius + zombieRadius;
            
            // Calculate distance to player (only in XZ plane)
            const playerPos2D = new THREE.Vector2(camera.position.x, camera.position.z);
            const zombiePos2D = new THREE.Vector2(enemy.mesh.position.x, enemy.mesh.position.z);
            const distanceToPlayer = playerPos2D.distanceTo(zombiePos2D);
            
            // If too close to player, move back to previous position
            if (distanceToPlayer < minDistance) {
                // Prevent going through player by restoring previous position
                enemy.mesh.position.copy(previousPosition);
                
                // Try to move around the player instead
                const sideStep = new THREE.Vector3(-directionToPlayer.z, 0, directionToPlayer.x);
                sideStep.normalize();
                
                // Randomly choose left or right to avoid getting stuck
                if (Math.random() > 0.5) {
                    sideStep.multiplyScalar(-1);
                }
                
                // Apply a small side movement
                enemy.mesh.position.add(sideStep.multiplyScalar(speed * 0.5));
            }
            
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
            
            // Check for player attack with type-specific damage
            if (!enemy.isSpawning && enemy.mesh.position.distanceTo(camera.position) < 2) {
                if (now - enemy.lastAttack >= ATTACK_COOLDOWN) {
                    if (typeof damagePlayer === 'function') {
                        const damage = enemy.type === ZOMBIE_TYPES.TANK ? 2 : 1;
                        damagePlayer(damage); // Use type-specific damage
                    }
                    enemy.lastAttack = now;
                    
                    // Trigger attack animation if not already attacking
                    if (!enemy.isAttacking) {
                        animateZombieAttack(enemy);
                    }
                }
            }
        }
        
        // Reset hit effect
        if (enemy.isHit && now - enemy.lastHit > 200) {
            enemy.isHit = false;
            
            // Reset material properties to original values
            if (enemy.originalMaterialProps) {
                // Restore original emissive properties
                enemy.mesh.material.emissive.setHex(enemy.originalMaterialProps.emissive);
                enemy.mesh.material.emissiveIntensity = enemy.originalMaterialProps.emissiveIntensity;
                
                // Reset emissive properties on all limbs, but not on blood splatters
                enemy.mesh.children.forEach(child => {
                    if (child.material && child.material.emissive && (!child.userData || !child.userData.isBloodSplatter)) {
                        child.material.emissive.setHex(enemy.originalMaterialProps.emissive);
                        child.material.emissiveIntensity = enemy.originalMaterialProps.emissiveIntensity;
                    }
                });
            } else {
                // Fallback to default values if original properties weren't stored
                enemy.mesh.material.emissive.setHex(0x003300);
                enemy.mesh.material.emissiveIntensity = 0.2;
                
                // Reset all limbs, but not blood splatters
                enemy.mesh.children.forEach(child => {
                    if (child.material && child.material.emissive && (!child.userData || !child.userData.isBloodSplatter)) {
                        child.material.emissive.setHex(0x003300);
                        child.material.emissiveIntensity = 0.2;
                    }
                });
            }
            
            // Reset scale
            if (enemy.originalScale) {
                enemy.mesh.scale.copy(enemy.originalScale);
            }
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
    
    // Left arm - positioned extended forward
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.7, 1.5, 0);
    // Rotate arm to extend forward
    leftArm.rotation.x = -Math.PI / 4; // Rotate forward by 45 degrees
    leftArm.position.z = 0.5; // Move forward
    leftArm.castShadow = true;
    leftArm.receiveShadow = true;
    zombie.add(leftArm);
    
    // Right arm - positioned extended forward
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.7, 1.5, 0);
    // Rotate arm to extend forward
    rightArm.rotation.x = -Math.PI / 4; // Rotate forward by 45 degrees
    rightArm.position.z = 0.5; // Move forward
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
    
    // Store original arm positions for attack animation
    zombie.userData.leftArmDefaultRotation = leftArm.rotation.clone();
    zombie.userData.rightArmDefaultRotation = rightArm.rotation.clone();
    
    return zombie;
}

// Animate zombie attack
function animateZombieAttack(enemy) {
    // Get the arms
    const leftArm = enemy.leftArm;
    const rightArm = enemy.rightArm;
    
    if (!leftArm || !rightArm) return;
    
    // Store the current time as the attack start time
    enemy.attackAnimationStart = Date.now();
    enemy.isAttacking = true;
    
    // Play attack sound
    if (typeof playSound === 'function') {
        playSound('zombieAttack');
    }
}

// Update zombie attack animation
function updateZombieAttackAnimation(enemy) {
    if (!enemy.isAttacking || !enemy.attackAnimationStart) return;
    
    const now = Date.now();
    const attackDuration = 500; // 0.5 seconds for attack animation
    const progress = (now - enemy.attackAnimationStart) / attackDuration;
    
    // Get the arms
    const leftArm = enemy.leftArm;
    const rightArm = enemy.rightArm;
    
    if (!leftArm || !rightArm) return;
    
    if (progress < 0.5) {
        // First half of animation - arms go back
        const animationProgress = progress * 2; // Scale to 0-1 range
        
        // Rotate arms back (preparing for attack)
        leftArm.rotation.x = enemy.leftArmDefaultRotation.x + (Math.PI / 6) * animationProgress;
        rightArm.rotation.x = enemy.rightArmDefaultRotation.x + (Math.PI / 6) * animationProgress;
    } else if (progress < 1) {
        // Second half of animation - arms thrust forward quickly
        const animationProgress = (progress - 0.5) * 2; // Scale to 0-1 range
        
        // Thrust arms forward (attack motion)
        leftArm.rotation.x = enemy.leftArmDefaultRotation.x + (Math.PI / 6) - (Math.PI / 3) * animationProgress;
        rightArm.rotation.x = enemy.rightArmDefaultRotation.x + (Math.PI / 6) - (Math.PI / 3) * animationProgress;
    } else {
        // Animation complete, reset to default position
        leftArm.rotation.x = enemy.leftArmDefaultRotation.x;
        rightArm.rotation.x = enemy.rightArmDefaultRotation.x;
        enemy.isAttacking = false;
    }
}

// Destroy an enemy (when hit by projectile)
function destroyEnemy(enemy) {
    console.log("Destroying enemy");
    
    // Create explosion effect
    createExplosionEffect(enemy.mesh.position, 0xff0000);
    
    // Create dismemberment effect - break zombie into pieces
    createDismembermentEffect(enemy);
    
    // Play zombie death sound - use zombiedeath.wav instead of explode
    if (typeof playSound === 'function') {
        playSound('zombiedeath');
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
    
    // Update zombie kill count
    if (typeof updateZombieKills === 'function') {
        updateZombieKills();
    }
    
    // Small chance to spawn a power-up where enemy died
    if (typeof spawnRandomPowerup === 'function' && Math.random() < 0.1) {
        // Clone position but keep it on the ground
        const powerupPos = enemy.mesh.position.clone();
        powerupPos.y = 0;
        
        // Check if position is valid for a power-up
        if (typeof isPositionClearOfObstacles === 'function' && isPositionClearOfObstacles(powerupPos)) {
            spawnRandomPowerup(waveNumber);
        }
    }
    
    // Update global reference
    window.enemies = enemies;
    
    // Check if wave is complete
    if (enemies.length === 0) {
        waveInProgress = false;
    }
}

// Create dismemberment effect - break zombie into pieces
function createDismembermentEffect(enemy) {
    const position = enemy.mesh.position.clone();
    const rotation = enemy.mesh.rotation.clone();
    
    // Create zombie parts
    const parts = [];
    
    // Create torso part
    const torsoGeo = new THREE.BoxGeometry(1, 1, 0.5);
    const torsoMat = enemy.mesh.material.clone();
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.copy(position);
    torso.position.y += 0.25;
    torso.rotation.copy(rotation);
    scene.add(torso);
    
    // Create head part
    const headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const headMat = enemy.mesh.material.clone();
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.copy(position);
    head.position.y += 1;
    head.rotation.copy(rotation);
    scene.add(head);
    
    // Create limbs
    const limbGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const limbMat = enemy.mesh.material.clone();
    
    // Left arm - positioned extended forward like the original
    const leftArm = new THREE.Mesh(limbGeo, limbMat);
    leftArm.position.copy(position);
    leftArm.position.x -= 0.6;
    leftArm.position.y += 0.25;
    leftArm.position.z += 0.4; // Move forward
    leftArm.rotation.copy(rotation);
    leftArm.rotation.x += -Math.PI / 2; // Rotate forward by 90 degrees
    scene.add(leftArm);
    
    // Right arm - positioned extended forward like the original
    const rightArm = new THREE.Mesh(limbGeo, limbMat);
    rightArm.position.copy(position);
    rightArm.position.x += 0.6;
    rightArm.position.y += 0.25;
    rightArm.position.z += 0.4; // Move forward
    rightArm.rotation.copy(rotation);
    rightArm.rotation.x += -Math.PI / 2; // Rotate forward by 90 degrees
    scene.add(rightArm);
    
    // Left leg
    const leftLeg = new THREE.Mesh(limbGeo, limbMat);
    leftLeg.position.copy(position);
    leftLeg.position.x -= 0.2;
    leftLeg.position.y -= 0.5;
    leftLeg.rotation.copy(rotation);
    scene.add(leftLeg);
    
    // Right leg
    const rightLeg = new THREE.Mesh(limbGeo, limbMat);
    rightLeg.position.copy(position);
    rightLeg.position.x += 0.2;
    rightLeg.position.y -= 0.5;
    rightLeg.rotation.copy(rotation);
    scene.add(rightLeg);
    
    // Add all parts to the array
    parts.push(torso, head, leftArm, rightArm, leftLeg, rightLeg);
    
    // Add blood splatter to each part
    parts.forEach(part => {
        // Create blood texture
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Draw blood splatter
        ctx.fillStyle = 'rgba(150, 10, 10, 0.9)';
        ctx.fillRect(0, 0, 128, 128);
        
        // Create texture
        const bloodTexture = new THREE.CanvasTexture(canvas);
        
        // Create blood plane
        const bloodGeo = new THREE.PlaneGeometry(part.geometry.parameters.width * 1.2, part.geometry.parameters.height * 1.2);
        const bloodMat = new THREE.MeshBasicMaterial({
            map: bloodTexture,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            depthWrite: false, // Prevent z-fighting
            depthTest: true,   // Still test against depth buffer
            alphaTest: 0.1     // Discard very transparent pixels
        });
        
        const blood = new THREE.Mesh(bloodGeo, bloodMat);
        blood.position.z = 0.3;
        
        // Mark this as a blood splatter for special handling
        blood.userData = { isBloodSplatter: true };
        
        // Set render order to ensure blood splatters render after the zombie parts
        blood.renderOrder = 1;
        
        part.add(blood);
    });
    
    // Add physics to each part
    parts.forEach(part => {
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            Math.random() * 0.3,
            (Math.random() - 0.5) * 0.2
        );
        
        const rotationVel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        
        // Add to particles array with creation time
        particles.push({
            mesh: part,
            velocity: velocity,
            rotationVel: rotationVel,
            created: Date.now(),
            isDismembered: true
        });
    });
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
    
    // Create a bright flash of light
    const flash = new THREE.PointLight(0xff0000, 3, 8);
    flash.position.copy(position);
    flash.position.y += 1; // Adjust height for zombie center mass
    scene.add(flash);
    
    // Animate the flash intensity
    let intensity = 3;
    const fadeOut = setInterval(() => {
        intensity -= 0.3;
        if (intensity <= 0) {
            clearInterval(fadeOut);
            scene.remove(flash);
        } else {
            flash.intensity = intensity;
        }
    }, 30);
    
    // Create explosion particles - more particles for a bigger effect
    const particleCount = Math.min(20, MAX_PARTICLES - particles.length);
    
    // Create different types of particles for a more varied effect
    for (let i = 0; i < particleCount; i++) {
        // Determine particle type
        const particleType = Math.random();
        let particleGeo, particleMat;
        
        if (particleType < 0.3) {
            // Fire particles (orange/red)
            particleGeo = new THREE.SphereGeometry(0.1 + Math.random() * 0.15, 8, 8);
            particleMat = new THREE.MeshBasicMaterial({ 
                color: new THREE.Color(
                    0.9 + Math.random() * 0.1, // Red
                    0.3 + Math.random() * 0.4, // Green
                    0.0 + Math.random() * 0.2  // Blue
                ),
                transparent: true,
                opacity: 0.9
            });
        } else if (particleType < 0.6) {
            // Smoke particles (dark gray)
            particleGeo = new THREE.SphereGeometry(0.15 + Math.random() * 0.2, 8, 8);
            particleMat = new THREE.MeshBasicMaterial({ 
                color: new THREE.Color(
                    0.2 + Math.random() * 0.1, // Red
                    0.2 + Math.random() * 0.1, // Green
                    0.2 + Math.random() * 0.1  // Blue
                ),
                transparent: true,
                opacity: 0.7
            });
        } else if (particleType < 0.9) {
            // Blood particles (dark red)
            particleGeo = new THREE.SphereGeometry(0.08 + Math.random() * 0.12, 8, 8);
            particleMat = new THREE.MeshBasicMaterial({ 
                color: new THREE.Color(
                    0.7 + Math.random() * 0.2, // Red
                    0.0 + Math.random() * 0.1, // Green
                    0.0 + Math.random() * 0.1  // Blue
                ),
                transparent: true,
                opacity: 0.8
            });
        } else {
            // Bone fragments (off-white)
            particleGeo = new THREE.BoxGeometry(
                0.05 + Math.random() * 0.1,
                0.05 + Math.random() * 0.1,
                0.05 + Math.random() * 0.1
            );
            particleMat = new THREE.MeshBasicMaterial({ 
                color: new THREE.Color(
                    0.9 + Math.random() * 0.1, // Red
                    0.85 + Math.random() * 0.1, // Green
                    0.8 + Math.random() * 0.1  // Blue
                )
            });
        }
        
        const particle = new THREE.Mesh(particleGeo, particleMat);
        
        // Position at explosion center with slight randomness
        particle.position.copy(position);
        particle.position.x += (Math.random() - 0.5) * 0.3;
        particle.position.y += 1 + (Math.random() - 0.5) * 0.3;
        particle.position.z += (Math.random() - 0.5) * 0.3;
        
        // Add more explosive velocity
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            Math.random() * 0.3,
            (Math.random() - 0.5) * 0.3
        );
        
        // Add rotation for more realistic movement
        const rotationVel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        
        scene.add(particle);
        particles.push({
            mesh: particle,
            velocity: velocity,
            rotationVel: rotationVel,
            created: Date.now(),
            opacity: particleMat.opacity || 1.0,
            isExplosion: true
        });
    }
}

// Update particles
function updateParticles() {
    const now = Date.now();
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Store previous position for collision detection
        const prevY = particle.mesh.position.y;
        
        // Move particle
        particle.mesh.position.add(particle.velocity);
        particle.velocity.y -= 0.005; // Apply gravity
        
        // Apply rotation for particles with rotation velocity
        if (particle.rotationVel) {
            particle.mesh.rotation.x += particle.rotationVel.x;
            particle.mesh.rotation.y += particle.rotationVel.y;
            particle.mesh.rotation.z += particle.rotationVel.z;
        }
        
        // Check for ground collision
        if (prevY > 0 && particle.mesh.position.y <= 0) {
            // Hit the ground
            particle.mesh.position.y = 0; // Place on ground
            
            // Bounce with reduced velocity
            if (particle.isDismembered) {
                // Dismembered parts bounce less
                particle.velocity.y = -particle.velocity.y * 0.3;
                
                // Slow down horizontal movement due to friction
                particle.velocity.x *= 0.7;
                particle.velocity.z *= 0.7;
                
                // Create blood splatter on ground if it's a dismembered part
                createGroundBloodSplatter(particle.mesh.position);
            } else {
                // Regular particles bounce more
                particle.velocity.y = -particle.velocity.y * 0.5;
            }
            
            // If velocity is very low, stop bouncing
            if (Math.abs(particle.velocity.y) < 0.02) {
                particle.velocity.y = 0;
            }
        }
        
        // Fade out particles over time
        if (particle.opacity !== undefined) {
            particle.opacity -= 0.02;
            if (particle.opacity <= 0) {
                particle.opacity = 0;
            }
            if (particle.mesh.material && particle.mesh.material.opacity !== undefined) {
                particle.mesh.material.opacity = particle.opacity;
            }
        }
        
        // Special handling for dismembered parts
        if (particle.isDismembered) {
            // Keep dismembered parts around longer
            if (now - particle.created > 3000) {
                // Start fading out dismembered parts after 3 seconds
                if (particle.opacity === undefined) {
                    particle.opacity = 1.0;
                }
                particle.opacity -= 0.02;
                
                if (particle.opacity <= 0) {
                    // Remove when fully faded
                    scene.remove(particle.mesh);
                    if (particle.mesh.geometry) particle.mesh.geometry.dispose();
                    if (particle.mesh.material) particle.mesh.material.dispose();
                    particles.splice(i, 1);
                } else {
                    // Apply opacity to the part and its blood splatter
                    if (particle.mesh.material) {
                        particle.mesh.material.opacity = particle.opacity;
                    }
                    if (particle.mesh.children.length > 0 && particle.mesh.children[0].material) {
                        particle.mesh.children[0].material.opacity = particle.opacity;
                    }
                }
            }
        } 
        // Special handling for ground blood splatters
        else if (particle.isGroundSplatter) {
            // Keep blood splatters for a longer time, then fade them out
            if (now > particle.fadeStartTime) {
                // Start fading after the specified time
                if (particle.opacity === undefined) {
                    particle.opacity = 0.8;
                }
                
                // Fade out more slowly than other particles
                particle.opacity -= 0.01;
                
                if (particle.opacity <= 0) {
                    // Remove when fully faded
                    scene.remove(particle.mesh);
                    if (particle.mesh.geometry) particle.mesh.geometry.dispose();
                    if (particle.mesh.material) particle.mesh.material.dispose();
                    particles.splice(i, 1);
                } else {
                    // Apply opacity
                    if (particle.mesh.material) {
                        particle.mesh.material.opacity = particle.opacity;
                    }
                }
            }
        }
        // Special handling for explosion particles
        else if (particle.isExplosion) {
            // Add special effects for explosion particles
            
            // Gradually increase size for smoke particles (dark gray)
            if (particle.mesh.material && 
                particle.mesh.material.color && 
                particle.mesh.material.color.r < 0.3 &&
                particle.mesh.material.color.g < 0.3 &&
                particle.mesh.material.color.b < 0.3) {
                
                // Slowly increase size for smoke effect
                particle.mesh.scale.x += 0.01;
                particle.mesh.scale.y += 0.01;
                particle.mesh.scale.z += 0.01;
                
                // Fade out faster
                if (particle.opacity !== undefined) {
                    particle.opacity -= 0.03;
                    particle.mesh.material.opacity = particle.opacity;
                }
            }
            
            // Make fire particles flicker
            if (particle.mesh.material && 
                particle.mesh.material.color && 
                particle.mesh.material.color.r > 0.8 &&
                particle.mesh.material.color.g > 0.2 &&
                particle.mesh.material.color.g < 0.7) {
                
                // Random flickering intensity
                if (Math.random() > 0.5) {
                    particle.mesh.material.color.g += 0.05;
                } else {
                    particle.mesh.material.color.g -= 0.05;
                    if (particle.mesh.material.color.g < 0.2) {
                        particle.mesh.material.color.g = 0.2;
                    }
                }
            }
            
            // Remove explosion particles after 1.5 seconds
            if (now - particle.created > 1500) {
                scene.remove(particle.mesh);
                if (particle.mesh.geometry) particle.mesh.geometry.dispose();
                if (particle.mesh.material) particle.mesh.material.dispose();
                particles.splice(i, 1);
            }
        }
        // Regular particles
        else {
            // Remove old regular particles
            if (now - particle.created > 1000) {
                scene.remove(particle.mesh);
                if (particle.mesh.geometry) particle.mesh.geometry.dispose();
                if (particle.mesh.material) particle.mesh.material.dispose();
                particles.splice(i, 1);
            }
        }
    }
}

// Create blood splatter on the ground
function createGroundBloodSplatter(position) {
    // Create a blood pool on the ground
    const size = 0.5 + Math.random() * 0.5;
    const splatterGeo = new THREE.PlaneGeometry(size, size);
    
    // Create blood texture
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Draw blood splatter
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 128, 128);
    
    // Blood color
    const bloodColor = `rgba(${150 + Math.random() * 50}, ${10 + Math.random() * 20}, ${10 + Math.random() * 20}, 0.9)`;
    ctx.fillStyle = bloodColor;
    
    // Create irregular blood pool shape
    ctx.beginPath();
    const centerX = 64;
    const centerY = 64;
    const radius = 50;
    
    // Create irregular shape with multiple arcs
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const radiusVariation = radius * (0.7 + Math.random() * 0.6);
        const x = centerX + Math.cos(angle) * radiusVariation;
        const y = centerY + Math.sin(angle) * radiusVariation;
        
        if (angle === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.closePath();
    ctx.fill();
    
    // Add some darker spots for depth
    for (let i = 0; i < 5; i++) {
        const spotX = centerX + (Math.random() - 0.5) * 80;
        const spotY = centerY + (Math.random() - 0.5) * 80;
        const spotRadius = 5 + Math.random() * 15;
        
        ctx.beginPath();
        ctx.arc(spotX, spotY, spotRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 0, 0, 0.7)';
        ctx.fill();
    }
    
    // Create texture
    const splatterTexture = new THREE.CanvasTexture(canvas);
    
    // Create material with improved rendering properties
    const splatterMat = new THREE.MeshBasicMaterial({
        map: splatterTexture,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false, // Prevent z-fighting
        depthTest: true,   // Still test against depth buffer
        alphaTest: 0.1     // Discard very transparent pixels
    });
    
    // Create mesh
    const splatter = new THREE.Mesh(splatterGeo, splatterMat);
    
    // Position on ground with slight offset to prevent z-fighting
    splatter.position.copy(position);
    splatter.position.y = 0.01;
    splatter.rotation.x = -Math.PI / 2; // Lay flat on ground
    
    // Set render order to ensure blood splatters render properly
    splatter.renderOrder = 1;
    
    scene.add(splatter);
    
    // Add to particles array with long lifetime
    particles.push({
        mesh: splatter,
        velocity: new THREE.Vector3(0, 0, 0),
        created: Date.now(),
        opacity: 0.8,
        isGroundSplatter: true,
        fadeStartTime: Date.now() + 5000 // Start fading after 5 seconds
    });
}

// Create hit effect at position
function createHitEffect(position, color) {
    // Create a bright red flash of light
    const flash = new THREE.PointLight(0xff0000, 2, 5);
    flash.position.copy(position);
    flash.position.y += 1; // Adjust height for zombie center mass
    scene.add(flash);
    
    // Animate the flash intensity
    let intensity = 2;
    const fadeOut = setInterval(() => {
        intensity -= 0.2;
        if (intensity <= 0) {
            clearInterval(fadeOut);
            scene.remove(flash);
        } else {
            flash.intensity = intensity;
        }
    }, 30);
    
    // Create blood particles
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
        // Create a small red particle
        const particleGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const particleMat = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        const particle = new THREE.Mesh(particleGeo, particleMat);
        
        // Position at hit location
        particle.position.copy(position);
        particle.position.y += 1; // Center on zombie
        
        // Add random velocity
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            Math.random() * 0.1,
            (Math.random() - 0.5) * 0.1
        );
        
        scene.add(particle);
        
        // Add to particles array with creation time
        particles.push({
            mesh: particle,
            velocity: velocity,
            created: Date.now(),
            opacity: 0.8
        });
    }
}

// Create a detailed zombie skin texture
function createZombieSkinTexture(type = ZOMBIE_TYPES.BASE) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base color based on zombie type
    const baseColor = type === ZOMBIE_TYPES.PURPLE ? {
        r: 140 + Math.floor(Math.random() * 30),
        g: 80 + Math.floor(Math.random() * 20),
        b: 150 + Math.floor(Math.random() * 30)
    } : type === ZOMBIE_TYPES.TANK ? {
        r: 180 + Math.floor(Math.random() * 30),
        g: 60 + Math.floor(Math.random() * 20),
        b: 60 + Math.floor(Math.random() * 20)
    } : {
        r: 100 + Math.floor(Math.random() * 30),
        g: 150 + Math.floor(Math.random() * 30),
        b: 80 + Math.floor(Math.random() * 20)
    };
    
    // Fill with base zombie skin color
    ctx.fillStyle = `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add mottled skin effect
    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = 1 + Math.random() * 5;
        
        // Vary between darker and lighter spots
        let spotColor;
        if (Math.random() < 0.7) {
            // Darker spots (decay)
            spotColor = `rgba(${baseColor.r * 0.6}, ${baseColor.g * 0.6}, ${baseColor.b * 0.5}, ${0.3 + Math.random() * 0.4})`;
        } else {
            // Lighter spots (exposed flesh)
            spotColor = `rgba(${baseColor.r * 1.2}, ${baseColor.g * 0.8}, ${baseColor.b * 0.7}, ${0.2 + Math.random() * 0.3})`;
        }
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = spotColor;
        ctx.fill();
    }
    
    // Add veins
    for (let i = 0; i < 30; i++) {
        const startX = Math.random() * 512;
        const startY = Math.random() * 512;
        let x = startX;
        let y = startY;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        // Create a jagged, branching vein
        const segments = 5 + Math.floor(Math.random() * 10);
        for (let j = 0; j < segments; j++) {
            x += (Math.random() * 40) - 20;
            y += (Math.random() * 40) - 20;
            ctx.lineTo(x, y);
            
            // Add a branch occasionally
            if (Math.random() < 0.3) {
                const branchX = x + (Math.random() * 30) - 15;
                const branchY = y + (Math.random() * 30) - 15;
                ctx.lineTo(branchX, branchY);
                ctx.lineTo(x, y); // Return to main vein
            }
        }
        
        // Dark purple/blue veins
        ctx.strokeStyle = `rgba(${30 + Math.random() * 20}, ${10 + Math.random() * 20}, ${50 + Math.random() * 30}, ${0.3 + Math.random() * 0.4})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.stroke();
    }
    
    // Add wounds and gashes
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const width = 5 + Math.random() * 30;
        const height = 3 + Math.random() * 15;
        const angle = Math.random() * Math.PI;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        // Draw wound
        ctx.beginPath();
        ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(120, 20, 20, 0.8)'; // Dark red
        ctx.fill();
        
        // Add darker center
        ctx.beginPath();
        ctx.ellipse(0, 0, width * 0.7, height * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(80, 10, 10, 0.9)'; // Darker red
        ctx.fill();
        
        ctx.restore();
    }
    
    // Add some bone showing through
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = 5 + Math.random() * 15;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(230, 230, 210, 0.9)'; // Off-white for bone
        ctx.fill();
        
        // Add some cracks to the bone
        for (let j = 0; j < 3; j++) {
            const startX = x - size/2 + Math.random() * size;
            const startY = y - size/2 + Math.random() * size;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + (Math.random() * 10) - 5, startY + (Math.random() * 10) - 5);
            ctx.strokeStyle = 'rgba(180, 170, 150, 0.8)';
            ctx.lineWidth = 0.5 + Math.random();
            ctx.stroke();
        }
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
}

// Create a detailed zombie face texture
function createZombieFaceTexture(type = ZOMBIE_TYPES.BASE) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, 512, 512);
    
    // Base zombie skin color based on type
    const baseColor = type === ZOMBIE_TYPES.PURPLE ? {
        r: 140 + Math.floor(Math.random() * 30),
        g: 80 + Math.floor(Math.random() * 20),
        b: 150 + Math.floor(Math.random() * 30)
    } : type === ZOMBIE_TYPES.TANK ? {
        r: 180 + Math.floor(Math.random() * 30),
        g: 60 + Math.floor(Math.random() * 20),
        b: 60 + Math.floor(Math.random() * 20)
    } : {
        r: 100 + Math.floor(Math.random() * 30),
        g: 130 + Math.floor(Math.random() * 30),
        b: 80 + Math.floor(Math.random() * 20)
    };
    
    // Fill face with base color
    ctx.fillStyle = `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`;
    ctx.beginPath();
    ctx.arc(256, 256, 240, 0, Math.PI * 2);
    ctx.fill();
    
    // Add skin texture
    for (let i = 0; i < 3000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = 1 + Math.random() * 3;
        const dist = Math.sqrt(Math.pow(x - 256, 2) + Math.pow(y - 256, 2));
        
        // Only draw within face circle
        if (dist < 240) {
            // Vary between darker and lighter spots
            let spotColor;
            if (Math.random() < 0.7) {
                // Darker spots (decay)
                spotColor = `rgba(${baseColor.r * 0.6}, ${baseColor.g * 0.6}, ${baseColor.b * 0.5}, ${0.2 + Math.random() * 0.3})`;
            } else {
                // Lighter spots (exposed flesh)
                spotColor = `rgba(${baseColor.r * 1.2}, ${baseColor.g * 0.8}, ${baseColor.b * 0.7}, ${0.1 + Math.random() * 0.2})`;
            }
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = spotColor;
            ctx.fill();
        }
    }
    
    // Draw eyes - sunken and hollow
    const eyePositions = [
        { x: 180, y: 200 }, // Left eye
        { x: 332, y: 200 }  // Right eye
    ];
    
    eyePositions.forEach(pos => {
        // Draw eye socket - dark and sunken
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 50, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20, 20, 20, 0.8)';
        ctx.fill();
        
        // Add depth to socket with gradient
        const gradient = ctx.createRadialGradient(pos.x, pos.y, 20, pos.x, pos.y, 50);
        gradient.addColorStop(0, 'rgba(20, 20, 20, 0.9)');
        gradient.addColorStop(1, 'rgba(40, 30, 30, 0.5)');
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 50, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw eyeball - bloodshot
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(230, 230, 220, 0.9)'; // Yellowish white
        ctx.fill();
        
        // Add bloodshot effect
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const length = 15 + Math.random() * 15;
            
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(
                pos.x + Math.cos(angle) * length,
                pos.y + Math.sin(angle) * length
            );
            ctx.strokeStyle = `rgba(200, ${20 + Math.random() * 30}, ${20 + Math.random() * 30}, ${0.4 + Math.random() * 0.4})`;
            ctx.lineWidth = 0.5 + Math.random() * 1.5;
            ctx.stroke();
        }
        
        // Draw pupil - dead and scary
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
        
        // Random eye color - sometimes milky white, sometimes red, sometimes black
        const eyeType = Math.random();
        if (eyeType < 0.4) {
            // Dead milky eye
            ctx.fillStyle = 'rgba(200, 200, 180, 0.9)';
        } else if (eyeType < 0.7) {
            // Red demonic eye
            ctx.fillStyle = 'rgba(180, 20, 20, 0.9)';
        } else {
            // Black soulless eye
            ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
        }
        ctx.fill();
    });
    
    // Draw mouth - torn and bloody
    ctx.beginPath();
    ctx.arc(256, 320, 80, 0, Math.PI);
    ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
    ctx.fill();
    
    // Add teeth - jagged and bloody
    const teethCount = 6 + Math.floor(Math.random() * 4);
    const teethWidth = 160 / teethCount;
    
    for (let i = 0; i < teethCount; i++) {
        const x = 176 + i * teethWidth;
        const height = 15 + Math.random() * 20;
        
        // Tooth base shape
        ctx.beginPath();
        ctx.moveTo(x, 320);
        ctx.lineTo(x + teethWidth * 0.8, 320);
        ctx.lineTo(x + teethWidth * 0.7, 320 + height);
        ctx.lineTo(x + teethWidth * 0.1, 320 + height);
        ctx.closePath();
        
        // Yellowish tooth color
        ctx.fillStyle = `rgba(${220 + Math.random() * 35}, ${200 + Math.random() * 30}, ${150 + Math.random() * 30}, 0.9)`;
        ctx.fill();
        
        // Add blood to some teeth
        if (Math.random() < 0.7) {
            ctx.beginPath();
            ctx.moveTo(x, 320);
            ctx.lineTo(x + teethWidth * 0.8, 320);
            ctx.lineTo(x + teethWidth * 0.7, 320 + height * 0.3);
            ctx.lineTo(x + teethWidth * 0.1, 320 + height * 0.3);
            ctx.closePath();
            ctx.fillStyle = 'rgba(180, 20, 20, 0.7)';
            ctx.fill();
        }
    }
    
    // Add blood dripping from mouth
    for (let i = 0; i < 3; i++) {
        const x = 200 + Math.random() * 112;
        const startY = 320;
        const length = 30 + Math.random() * 70;
        const width = 5 + Math.random() * 10;
        
        // Create drip shape
        ctx.beginPath();
        ctx.moveTo(x - width/2, startY);
        ctx.lineTo(x + width/2, startY);
        ctx.lineTo(x + width/3, startY + length);
        ctx.lineTo(x - width/3, startY + length);
        ctx.closePath();
        
        // Blood red color
        ctx.fillStyle = 'rgba(180, 20, 20, 0.8)';
        ctx.fill();
    }
    
    // Add some wounds and scars on face
    for (let i = 0; i < 5; i++) {
        const x = 100 + Math.random() * 312;
        const y = 100 + Math.random() * 312;
        const dist = Math.sqrt(Math.pow(x - 256, 2) + Math.pow(y - 256, 2));
        
        // Only draw within face circle
        if (dist < 220) {
            const length = 10 + Math.random() * 40;
            const width = 2 + Math.random() * 8;
            const angle = Math.random() * Math.PI;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            
            // Draw wound
            ctx.beginPath();
            ctx.ellipse(0, 0, length/2, width/2, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(140, 30, 30, 0.8)';
            ctx.fill();
            
            // Add darker center
            ctx.beginPath();
            ctx.ellipse(0, 0, length/3, width/3, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(80, 10, 10, 0.9)';
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    
    return texture;
}

// Function to add blood splatter effects to the zombie
function addBloodSplatter(zombieMesh) {
    // Create 2-5 blood splatters on random parts of the zombie
    const splatterCount = 2 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < splatterCount; i++) {
        const splatterGeo = new THREE.PlaneGeometry(0.3 + Math.random() * 0.3, 0.3 + Math.random() * 0.3);
        
        // Create blood texture
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Draw blood splatter
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, 128, 128);
        
        // Blood color
        ctx.fillStyle = `rgba(${150 + Math.random() * 50}, ${10 + Math.random() * 20}, ${10 + Math.random() * 20}, 0.9)`;
        
        // Create splatter shape
        ctx.beginPath();
        ctx.arc(64, 64, 30 + Math.random() * 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Add drips
        const dripCount = 3 + Math.floor(Math.random() * 5);
        for (let j = 0; j < dripCount; j++) {
            const angle = Math.random() * Math.PI * 2;
            const length = 20 + Math.random() * 30;
            const width = 5 + Math.random() * 10;
            
            const x = 64 + Math.cos(angle) * 30;
            const y = 64 + Math.sin(angle) * 30;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            ctx.lineWidth = width;
            ctx.strokeStyle = `rgba(${150 + Math.random() * 50}, ${10 + Math.random() * 20}, ${10 + Math.random() * 20}, 0.8)`;
            ctx.stroke();
        }
        
        // Create texture
        const splatterTexture = new THREE.CanvasTexture(canvas);
        
        // Create material with improved rendering properties
        const splatterMat = new THREE.MeshBasicMaterial({
            map: splatterTexture,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false, // Prevent z-fighting
            depthTest: true,   // Still test against depth buffer
            alphaTest: 0.1     // Discard very transparent pixels
        });
        
        // Create mesh
        const splatter = new THREE.Mesh(splatterGeo, splatterMat);
        
        // Mark this as a blood splatter for special handling
        splatter.userData = { isBloodSplatter: true };
        
        // Position randomly on zombie body
        const part = Math.random();
        if (part < 0.5) {
            // On body
            splatter.position.z = 0.52; // Slightly in front of the face (which is at 0.51)
            splatter.position.x = Math.random() * 0.8 - 0.4;
            splatter.position.y = Math.random() * 1.6 - 0.8;
            zombieMesh.add(splatter);
        } else if (part < 0.7) {
            // On arm
            const arm = Math.random() < 0.5 ? zombieMesh.children[1] : zombieMesh.children[2];
            splatter.position.z = 0.15; // Slightly in front of arm
            splatter.position.x = Math.random() * 0.2 - 0.1;
            splatter.position.y = Math.random() * 0.6 - 0.3;
            arm.add(splatter);
        } else {
            // On leg
            const leg = Math.random() < 0.5 ? zombieMesh.children[3] : zombieMesh.children[4];
            splatter.position.z = 0.15; // Slightly in front of leg
            splatter.position.x = Math.random() * 0.2 - 0.1;
            splatter.position.y = Math.random() * 0.6 - 0.3;
            leg.add(splatter);
        }
        
        // Random rotation
        splatter.rotation.z = Math.random() * Math.PI * 2;
        
        // Set render order to ensure blood splatters render after the zombie parts
        splatter.renderOrder = 1;
    }
}

// Export functions
window.updateEnemies = updateEnemies;
window.startEnemySpawner = startEnemySpawner;
window.stopEnemySpawner = stopEnemySpawner;
window.clearEnemies = clearEnemies;
window.enemies = enemies;
window.hitEnemy = hitEnemy; 