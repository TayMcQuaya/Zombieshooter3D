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
const PLAYER_SPEED = 0.04;
const PLAYER_RADIUS = 0.5;
const JUMP_FORCE = 0.2;
const GRAVITY = 0.01;
const MAX_PROJECTILES = 20;
const PROJECTILE_LIFETIME = 1500;
const PROJECTILE_SPEED = 0.8;  // Reduced from 2.0 for slower bullets
const JUMP_COOLDOWN = 500;
const SHOOT_COOLDOWN = 400;    // 400ms between shots

let velocity = new THREE.Vector3();
let isJumping = false;
let canJump = true;
let lastJumpTime = 0;
let lastShootTime = 0;
let projectiles = [];

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
    
    if (event.button === 0) { // Left mouse button
        shoot();
    }
}

// Update player position
function updatePlayer() {
    const now = Date.now();
    
    // Apply gravity
    velocity.y -= GRAVITY;
    
    // Update position based on velocity
    camera.position.y += velocity.y;
    
    // Ground collision
    if (camera.position.y < 1.7) {
        camera.position.y = 1.7;
        velocity.y = 0;
        isJumping = false;
    }
    
    // Update jump cooldown
    if (!canJump && now - lastJumpTime > JUMP_COOLDOWN) {
        canJump = true;
    }
    
    // Get movement input
    if (moveState.forward) {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        forward.y = 0;
        forward.normalize();
        
        const newPosition = camera.position.clone().add(forward.multiplyScalar(PLAYER_SPEED));
        moveWithCollision(newPosition);
    }
    if (moveState.backward) {
        const backward = new THREE.Vector3(0, 0, 1);
        backward.applyQuaternion(camera.quaternion);
        backward.y = 0;
        backward.normalize();
        
        const newPosition = camera.position.clone().add(backward.multiplyScalar(PLAYER_SPEED));
        moveWithCollision(newPosition);
    }
    if (moveState.left) {
        const left = new THREE.Vector3(-1, 0, 0);
        left.applyQuaternion(camera.quaternion);
        left.y = 0;
        left.normalize();
        
        const newPosition = camera.position.clone().add(left.multiplyScalar(PLAYER_SPEED));
        moveWithCollision(newPosition);
    }
    if (moveState.right) {
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(camera.quaternion);
        right.y = 0;
        right.normalize();
        
        const newPosition = camera.position.clone().add(right.multiplyScalar(PLAYER_SPEED));
        moveWithCollision(newPosition);
    }
    
    // Jump
    if (moveState.jump && !isJumping && canJump) {
        velocity.y = JUMP_FORCE;
        isJumping = true;
        canJump = false;
        lastJumpTime = now;
        playSound('jump');
    }
    
    updateProjectiles();
}

// Move with collision detection
function moveWithCollision(newPosition) {
    // Check for collision with environment if the function exists
    if (typeof window.checkEnvironmentCollision === 'function') {
        const collision = window.checkEnvironmentCollision(newPosition, PLAYER_RADIUS);
        
        if (!collision.collided) {
            camera.position.copy(newPosition);
        } else {
            // Calculate slide movement along the collision surface
            const pushDirection = new THREE.Vector3()
                .subVectors(camera.position, collision.object.position)
                .normalize();
            pushDirection.y = 0;
            
            const slidePosition = camera.position.clone()
                .add(pushDirection.multiplyScalar(collision.penetration));
            
            camera.position.copy(slidePosition);
        }
    } else {
        // If collision check isn't available, just move
        camera.position.copy(newPosition);
    }
}

// Create and shoot projectile
function shoot() {
    const now = Date.now();
    
    // Check if we can shoot (cooldown)
    if (now - lastShootTime < SHOOT_COOLDOWN) {
        console.log("Shot ignored - cooldown active");
        return;
    }
    
    // Update last shoot time
    lastShootTime = now;
    
    // Remove oldest projectile if at max
    if (projectiles.length >= MAX_PROJECTILES) {
        const oldest = projectiles.shift();
        if (oldest) {
            scene.remove(oldest.mesh);
            oldest.mesh.geometry.dispose();
            oldest.mesh.material.dispose();
        }
    }
    
    const bulletGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.3);
    const bulletMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    const bullet = new THREE.Mesh(bulletGeo, bulletMat);
    
    // Position bullet at camera position
    const bulletOffset = new THREE.Vector3(0, 0, -1);
    bulletOffset.applyQuaternion(camera.quaternion);
    bullet.position.copy(camera.position).add(bulletOffset);
    
    // Set bullet rotation to match camera
    bullet.quaternion.copy(camera.quaternion);
    bullet.rotateX(Math.PI / 2);
    
    // Create projectile object with velocity
    const direction = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(camera.quaternion)
        .normalize();
    
    const projectile = {
        mesh: bullet,
        velocity: direction.multiplyScalar(PROJECTILE_SPEED),
        createTime: now
    };
    
    scene.add(bullet);
    projectiles.push(projectile);
    
    createMuzzleFlash();
    
    if (typeof playSound === 'function') {
        playSound('shoot');
    }
    
    console.log("Shot fired, total projectiles:", projectiles.length);
}

// Update projectiles
function updateProjectiles() {
    const now = Date.now();
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        
        // Move projectile
        projectile.mesh.position.add(projectile.velocity);
        
        // Check for collision with environment if the function exists
        let environmentCollision = false;
        if (typeof window.checkEnvironmentCollision === 'function') {
            const collision = window.checkEnvironmentCollision(projectile.mesh.position, 0.05);
            environmentCollision = collision.collided;
        }
        
        // Check for collision with enemies
        let hitEnemy = false;
        if (window.enemies && window.enemies.length > 0) {
            for (let j = window.enemies.length - 1; j >= 0; j--) {
                const enemy = window.enemies[j];
                if (!enemy.isSpawning && projectile.mesh.position.distanceTo(enemy.mesh.position) < 1) {
                    hitEnemy = true;
                    if (typeof window.hitEnemy === 'function') {
                        console.log("Calling hitEnemy function");
                        window.hitEnemy(enemy);
                    } else {
                        console.log("hitEnemy function not found");
                    }
                    break;
                }
            }
        }
        
        // Remove projectile if it hits something or is too old
        if (environmentCollision || hitEnemy || now - projectile.createTime > PROJECTILE_LIFETIME) {
            scene.remove(projectile.mesh);
            projectile.mesh.geometry.dispose();
            projectile.mesh.material.dispose();
            projectiles.splice(i, 1);
            
            if (environmentCollision) {
                createHitEffect(projectile.mesh.position);
            }
        }
    }
}

// Create muzzle flash effect
function createMuzzleFlash() {
    const light = new THREE.PointLight(0xFFFF00, 2, 3);
    const flashOffset = new THREE.Vector3(0, 0, -1);
    flashOffset.applyQuaternion(camera.quaternion);
    light.position.copy(camera.position).add(flashOffset);
    
    scene.add(light);
    
    setTimeout(() => {
        scene.remove(light);
    }, 50);
}

// Create hit effect
function createHitEffect(position) {
    const particleCount = 3;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.05),
            new THREE.MeshBasicMaterial({ color: 0xFFD700 })
        );
        
        particle.position.copy(position);
        
        scene.add(particle);
        
        setTimeout(() => {
            scene.remove(particle);
            particle.geometry.dispose();
            particle.material.dispose();
        }, 200);
    }
}

// Export functions
window.updatePlayer = updatePlayer;
window.shoot = shoot; 