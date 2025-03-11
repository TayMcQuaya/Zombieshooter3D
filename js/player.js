// player.js - Player movement, shooting, and controls

// Player movement state
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false
};

// Player properties
const playerSpeed = 0.08; // Reduced from 0.15 for slower movement
const jumpForce = 0.5;
const gravity = 0.02;
let playerVelocity = new THREE.Vector3(0, 0, 0);
let canJump = true;
let shootCooldown = 0;
const shootCooldownTime = 0.2; // Time between shots in seconds

// Camera smoothing properties
const mouseSensitivity = 0.001; // Reduced sensitivity for smoother control
let targetRotationX = 0;
let targetRotationY = 0;
const rotationSmoothingFactor = 0.1; // Lower = smoother but more delayed

// Store previous camera rotation for clamping
let previousQuaternion = new THREE.Quaternion();

// Initialize player
function initPlayer() {
    // Set up key listeners for movement
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Set up mouse movement for looking around
    document.addEventListener('mousemove', onMouseMove);
    
    // Set up mouse click for shooting
    document.addEventListener('mousedown', onMouseDown);
}

// Handle key down events
function onKeyDown(event) {
    if (!gameActive) return;
    
    switch (event.key.toLowerCase()) {
        case 'w':
            moveState.forward = true;
            break;
        case 's':
            moveState.backward = true;
            break;
        case 'a':
            moveState.left = true;
            break;
        case 'd':
            moveState.right = true;
            break;
        case ' ':
            moveState.jump = true;
            break;
    }
}

// Handle key up events
function onKeyUp(event) {
    if (!gameActive) return;
    
    switch (event.key.toLowerCase()) {
        case 'w':
            moveState.forward = false;
            break;
        case 's':
            moveState.backward = false;
            break;
        case 'a':
            moveState.left = false;
            break;
        case 'd':
            moveState.right = false;
            break;
        case ' ':
            moveState.jump = false;
            break;
    }
}

// Handle mouse movement for looking around
function onMouseMove(event) {
    if (!gameActive || !document.pointerLockElement) return;
    
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    
    // Reduced sensitivity for smoother control
    const mouseSensitivity = 0.001;
    
    // Create a quaternion for horizontal rotation (around Y axis)
    const horizontalRotation = new THREE.Quaternion();
    horizontalRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -movementX * mouseSensitivity);
    camera.quaternion.premultiply(horizontalRotation);
    
    // Create a quaternion for vertical rotation (around X axis)
    const verticalRotation = new THREE.Quaternion();
    const rightVector = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    verticalRotation.setFromAxisAngle(rightVector, -movementY * mouseSensitivity);
    camera.quaternion.premultiply(verticalRotation);
    
    // Clamp vertical rotation
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const angle = Math.acos(forward.y);
    if (angle < 0.1 || angle > Math.PI - 0.1) {
        camera.quaternion.copy(previousQuaternion);
    } else {
        previousQuaternion.copy(camera.quaternion);
    }
}

// Handle mouse down for shooting
function onMouseDown(event) {
    if (!gameActive || !document.pointerLockElement) return;
    
    // Left click to shoot
    if (event.button === 0) {
        shoot();
    }
}

// Update player position and state
function updatePlayer() {
    // Handle shooting cooldown
    if (shootCooldown > 0) {
        shootCooldown -= clock.getElapsedTime();
    }
    
    // Apply gravity
    playerVelocity.y -= gravity;
    
    // Handle jumping
    if (moveState.jump && canJump) {
        playerVelocity.y = jumpForce;
        canJump = false;
        playJumpSound();
    }
    
    // Update player position based on velocity
    camera.position.y += playerVelocity.y;
    
    // Check floor collision
    if (camera.position.y < 2) { // Player height
        camera.position.y = 2;
        playerVelocity.y = 0;
        canJump = true;
    }
    
    // FIXED MOVEMENT SYSTEM - Completely rewritten
    // Get camera's forward and right vectors
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0; // Keep movement on horizontal plane
    forward.normalize();
    
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0; // Keep movement on horizontal plane
    right.normalize();
    
    // Reset movement vector
    const movement = new THREE.Vector3(0, 0, 0);
    
    // Add movement based on keys pressed
    if (moveState.forward) {
        movement.add(forward);
    }
    if (moveState.backward) {
        movement.sub(forward);
    }
    if (moveState.right) {
        movement.add(right);
    }
    if (moveState.left) {
        movement.sub(right);
    }
    
    // Normalize movement vector if moving diagonally to prevent faster diagonal movement
    if (movement.length() > 0) {
        movement.normalize();
        
        // Apply movement with reduced player speed
        movement.multiplyScalar(playerSpeed);
        camera.position.add(movement);
    }
    
    // Keep player within arena bounds
    const arenaSize = 24; // Slightly smaller than actual arena to prevent clipping
    camera.position.x = Math.max(-arenaSize, Math.min(arenaSize, camera.position.x));
    camera.position.z = Math.max(-arenaSize, Math.min(arenaSize, camera.position.z));
}

// Shoot a projectile
function shoot() {
    if (shootCooldown > 0) return;
    
    // Create bullet
    const bulletGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
    bulletGeometry.rotateX(Math.PI / 2); // Rotate to point forward
    
    const bulletMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFD700 // Gold color for bullet
    });
    
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    // Set bullet position slightly in front of the camera
    const bulletOffset = new THREE.Vector3(0, 0, -1);
    bulletOffset.applyQuaternion(camera.quaternion);
    bullet.position.copy(camera.position).add(bulletOffset);
    
    // Set bullet rotation to match camera direction
    bullet.quaternion.copy(camera.quaternion);
    
    // Add muzzle flash effect
    createMuzzleFlash();
    
    // Add bullet to scene
    scene.add(bullet);
    
    // Set bullet direction based on camera direction
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    
    // Add to projectiles array for tracking
    projectiles.push({
        mesh: bullet,
        direction: direction,
        speed: 2.0, // Increased bullet speed
        created: Date.now()
    });
    
    // Reset cooldown
    shootCooldown = shootCooldownTime;
    
    // Play shoot sound
    playShootSound();
    
    // Check for immediate hit (raycast)
    checkProjectileHit(bullet.position, direction);
}

// Create muzzle flash effect
function createMuzzleFlash() {
    // Create a point light for the muzzle flash
    const flash = new THREE.PointLight(0xFFFF00, 2, 10);
    
    // Position the flash in front of the camera
    const flashOffset = new THREE.Vector3(0, 0, -2);
    flashOffset.applyQuaternion(camera.quaternion);
    flash.position.copy(camera.position).add(flashOffset);
    
    // Add to scene
    scene.add(flash);
    
    // Remove after a short time
    setTimeout(() => {
        scene.remove(flash);
    }, 50);
}

// Check if a projectile hits an enemy
function checkProjectileHit(position, direction) {
    const raycaster = new THREE.Raycaster(position, direction);
    const hits = raycaster.intersectObjects(enemies.map(e => e.mesh));
    
    if (hits.length > 0 && hits[0].distance < 50) {
        // Hit an enemy
        const hitEnemy = enemies.find(e => e.mesh === hits[0].object);
        if (hitEnemy) {
            destroyEnemy(hitEnemy);
        }
    }
}

// Update all projectiles
function updateProjectiles() {
    const now = Date.now();
    const projectilesToRemove = [];
    
    // Update each projectile
    projectiles.forEach((projectile, index) => {
        // Move projectile
        projectile.mesh.position.add(
            projectile.direction.clone().multiplyScalar(projectile.speed)
        );
        
        // Check for collisions with enemies
        enemies.forEach(enemy => {
            if (projectile.mesh.position.distanceTo(enemy.mesh.position) < 1) {
                // Hit an enemy
                hitEnemy(enemy);
                projectilesToRemove.push(index);
            }
        });
        
        // Remove projectiles that have been alive too long (2 seconds)
        if (now - projectile.created > 2000) {
            projectilesToRemove.push(index);
        }
        
        // Remove projectiles that are out of bounds
        if (
            Math.abs(projectile.mesh.position.x) > 25 ||
            Math.abs(projectile.mesh.position.z) > 25 ||
            projectile.mesh.position.y < 0 ||
            projectile.mesh.position.y > 20
        ) {
            projectilesToRemove.push(index);
        }
    });
    
    // Remove projectiles (in reverse order to avoid index issues)
    projectilesToRemove.sort((a, b) => b - a).forEach(index => {
        const projectile = projectiles[index];
        // Make sure to remove the mesh from the scene
        if (projectile && projectile.mesh) {
            scene.remove(projectile.mesh);
            projectile.mesh.geometry.dispose();
            projectile.mesh.material.dispose();
        }
        projectiles.splice(index, 1);
    });
}

// Array to track projectiles
let projectiles = []; 