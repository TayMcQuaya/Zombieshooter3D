// player.js - Player movement, shooting, and controls

// Player movement state
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    run: false  // New state for running
};

// Player properties
const PLAYER_SPEED = 0.04;
const WALK_SPEED = 0.02;  // New walking speed (half of original speed)
const RUN_SPEED = 0.04;   // Run speed (same as original speed)
const PLAYER_RADIUS = 0.5;
const JUMP_FORCE = 0.2;
const GRAVITY = 0.01;
const MAX_PROJECTILES = 20;
const PROJECTILE_LIFETIME = 1500;
const PROJECTILE_SPEED = 0.8;  // Reduced from 2.0 for slower bullets
const JUMP_COOLDOWN = 500;
const SHOOT_COOLDOWN = 400;    // 400ms between shots
const COLLISION_BUFFER = 0.1;  // Small buffer to prevent getting too close to objects

// Stamina system
const MAX_STAMINA = 100;
const STAMINA_DEPLETION_RATE = 0.1;  // Reduced from 0.2 for even slower depletion
const STAMINA_RECOVERY_RATE = 0.1;   // Keeping the same recovery rate
let currentStamina = MAX_STAMINA;
let canRun = true;

let velocity = new THREE.Vector3();
let isJumping = false;
let canJump = true;
let lastJumpTime = 0;
let lastShootTime = 0;
let projectiles = [];
let lastStuckCheck = 0;
let lastPosition = new THREE.Vector3();
let stuckCounter = 0;

// Weapon model
let weaponModel = null;
let handModel = null;
let weaponBobTime = 0;
let weaponSwayAmount = 0.02;
let weaponBobAmount = 0.03;
let weaponBobSpeed = 5;

// Camera smoothing properties
const mouseSensitivity = 0.001; // Reduced sensitivity for smoother control
let targetRotationX = 0;
let targetRotationY = 0;
const rotationSmoothingFactor = 0.1; // Lower = smoother but more delayed

// Store previous camera rotation for clamping
let previousQuaternion = new THREE.Quaternion();

// Initialize player
function initPlayer() {
    console.log("Initializing player...");
    
    // Set up key listeners for movement
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Set up mouse movement for looking around
    document.addEventListener('mousemove', onMouseMove);
    
    // Set up mouse click for shooting
    document.addEventListener('mousedown', onMouseDown);
    
    // Set up pointer lock change event
    document.addEventListener('pointerlockchange', onPointerLockChange);
    
    // Initialize last position
    lastPosition = new THREE.Vector3();
    lastPosition.copy(camera.position);
    
    // Export player functions to global scope for debugging
    window.createWeaponModel = createWeaponModel;
    window.updateWeaponPosition = updateWeaponPosition;
    
    // Create the weapon model
    createWeaponModel();
    
    // Also create it with a delay to ensure it's visible
    setTimeout(() => {
        console.log("Creating weapon model again with delay to ensure visibility");
        createWeaponModel();
    }, 300);
    
    console.log("Player initialized, camera:", camera);
}

// Create weapon model (pistol and hand)
function createWeaponModel() {
    console.log("Creating enhanced weapon model - should be very visible");
    
    // Remove any existing weapon model
    if (weaponModel) {
        camera.remove(weaponModel);
    }
    
    // Create a group to hold the weapon
    weaponModel = new THREE.Group();
    
    // Create a dramatically larger, brightly colored pistol

    // Main body - bright NEON RED box (much larger)
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.3, 0.8);
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0.3, -0.3, -0.7);
    weaponModel.add(body);
    
    // Barrel - BRIGHT BLUE cylinder (larger)
    const barrelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6);
    const barrelMat = new THREE.MeshBasicMaterial({ color: 0x00FFFF });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2; // Rotate to point forward
    barrel.position.set(0.3, -0.3, -1.1);
    weaponModel.add(barrel);
    
    // Handle - BRIGHT YELLOW box (larger)
    const handleGeo = new THREE.BoxGeometry(0.3, 0.5, 0.3);
    const handleMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0.3, -0.6, -0.7);
    weaponModel.add(handle);
    
    // Add a very bright green sphere as a sight (much larger)
    const sightGeo = new THREE.SphereGeometry(0.08);
    const sightMat = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
    const sight = new THREE.Mesh(sightGeo, sightMat);
    sight.position.set(0.3, -0.2, -0.7);
    weaponModel.add(sight);
    
    // Add a hand (pink cube)
    const handGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const handMat = new THREE.MeshBasicMaterial({ color: 0xFF69B4 });
    const hand = new THREE.Mesh(handGeo, handMat);
    hand.position.set(0.3, -0.7, -0.5);
    weaponModel.add(hand);
    
    // Position the weapon model in front of the camera
    // Position it VERY close and high in view to be impossible to miss
    weaponModel.position.set(0.3, 0, -0.5);
    
    // Make it larger overall
    weaponModel.scale.set(1.5, 1.5, 1.5);
    
    // Disable frustum culling to ensure it's always rendered
    weaponModel.traverse(function(object) {
        if (object.isMesh) {
            object.frustumCulled = false;
        }
    });
    
    // Add the weapon model to the camera
    camera.add(weaponModel);
    
    console.log("Enhanced weapon model created and added to camera:", weaponModel);
    
    return weaponModel;
}

// Update weapon position for bobbing and swaying effects
function updateWeaponPosition() {
    if (!weaponModel) {
        console.log("Weapon model not found, recreating...");
        createWeaponModel();
        return;
    }
    
    // Log weapon visibility status to help with debugging
    console.log("Weapon model update - position:", weaponModel.position, "visible in scene:", camera.children.includes(weaponModel));
    
    // Reset position to our new more visible position
    weaponModel.position.set(0.3, 0, -0.5);
    weaponModel.rotation.set(0, 0, 0);
    
    // Make sure scale is maintained
    weaponModel.scale.set(1.5, 1.5, 1.5);
    
    // Add weapon bob when moving
    if (moveState.forward || moveState.backward || moveState.left || moveState.right) {
        weaponBobTime += 0.1;
        const bobY = Math.sin(weaponBobTime * weaponBobSpeed) * weaponBobAmount;
        const bobX = Math.cos(weaponBobTime * weaponBobSpeed * 0.5) * weaponBobAmount * 0.5;
        
        weaponModel.position.y += bobY;
        weaponModel.position.x += bobX;
    }
    
    // Add weapon sway based on mouse movement
    if (window.lastX || window.lastY) {
        const swayX = -window.lastX * weaponSwayAmount * 0.1;
        const swayY = -window.lastY * weaponSwayAmount * 0.1;
        
        weaponModel.rotation.y += swayX;
        weaponModel.rotation.x += swayY;
    }
    
    // Add recoil effect when shooting
    const timeSinceShot = Date.now() - lastShootTime;
    if (timeSinceShot < 200) {
        const recoilAmount = 0.2 * (1 - timeSinceShot / 200);
        weaponModel.position.z += recoilAmount;
        weaponModel.rotation.x -= recoilAmount * 0.5;
    }
}

// Handle key down events
function onKeyDown(event) {
    if (!gameActive) return;
    
    switch (event.key.toLowerCase()) {
        case 'w':
            moveState.forward = true;  // W key maps to forward
            break;
        case 's':
            moveState.backward = true; // S key maps to backward
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
        case 'shift':
            moveState.run = true;  // Shift key for running
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
        case 'shift':
            moveState.run = false;  // Release shift key to stop running
            break;
    }
}

// Handle mouse movement for looking around
function onMouseMove(event) {
    // Only handle mouse movement if game is active and not paused
    if (!gameActive || gamePaused) return;
    
    // Get mouse movement
    let movementX = event.movementX || 0;
    let movementY = event.movementY || 0;
    
    // Filter out extreme mouse movements (which can happen due to browser bugs)
    // These are often the cause of sudden camera jumps
    const MAX_MOVEMENT = 100; // Maximum reasonable mouse movement in one frame
    if (Math.abs(movementX) > MAX_MOVEMENT || Math.abs(movementY) > MAX_MOVEMENT) {
        console.log("Filtered out extreme mouse movement:", movementX, movementY);
        return; // Skip this update
    }
    
    // Reduced sensitivity for smoother control
    const mouseSensitivity = 0.001;
    
    // Initialize camera rotation if not already done
    if (!window.cameraRotation) {
        window.cameraRotation = new THREE.Euler(0, 0, 0, 'YXZ');
    }
    
    // Initialize smoothing values if not already done
    if (!window.lastX) window.lastX = 0;
    if (!window.lastY) window.lastY = 0;
    
    // Apply smoothing (simple exponential moving average)
    const smoothingFactor = 0.7; // Higher = more smoothing
    movementX = movementX * (1 - smoothingFactor) + window.lastX * smoothingFactor;
    movementY = movementY * (1 - smoothingFactor) + window.lastY * smoothingFactor;
    
    // Store current values for next frame
    window.lastX = movementX;
    window.lastY = movementY;
    
    // Update Euler angles based on mouse movement
    window.cameraRotation.y -= movementX * mouseSensitivity;
    window.cameraRotation.x -= movementY * mouseSensitivity;
    
    // Clamp vertical rotation to prevent flipping
    window.cameraRotation.x = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, window.cameraRotation.x));
    
    // Apply rotation to camera
    camera.quaternion.setFromEuler(window.cameraRotation);
}

// Handle mouse down for shooting
function onMouseDown(event) {
    if (!gameActive || !document.pointerLockElement) return;
    
    if (event.button === 0) { // Left mouse button
        shoot();
    }
}

// Handle pointer lock change
function onPointerLockChange() {
    if (document.pointerLockElement === document.body) {
        console.log('Pointer lock active');
        if (gameActive && !gamePaused) {
            document.body.classList.add('game-active');
        }
    } else {
        console.log('Pointer lock inactive');
        if (gameActive && !gamePaused) {
            // If game is active and not paused, but we lost pointer lock, pause the game
            if (typeof togglePause === 'function') {
                togglePause();
            }
        }
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
    
    // Update stamina
    updateStamina();
    
    // Calculate movement vector
    let moveX = 0;
    let moveZ = 0;
    
    // Fixed: W now moves forward (negative Z), S moves backward (positive Z)
    // But we need to invert the Z direction to match the expected behavior
    if (moveState.forward) moveZ += 1;  // W key - move forward (into the screen)
    if (moveState.backward) moveZ -= 1; // S key - move backward (out of the screen)
    if (moveState.left) moveX -= 1;     // A key - move left
    if (moveState.right) moveX += 1;    // D key - move right
    
    // Normalize diagonal movement
    if (moveX !== 0 && moveZ !== 0) {
        moveX *= 0.7071; // 1/sqrt(2)
        moveZ *= 0.7071;
    }
    
    // Determine current speed based on running state
    const currentSpeed = (moveState.run && canRun) ? RUN_SPEED : WALK_SPEED;
    
    // Apply movement speed
    moveX *= currentSpeed;
    moveZ *= currentSpeed;
    
    // Convert movement to world space
    if (moveX !== 0 || moveZ !== 0) {
        // Get camera direction
        const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        cameraDirection.y = 0;
        cameraDirection.normalize();
        
        // Get camera right vector
        const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        cameraRight.y = 0;
        cameraRight.normalize();
        
        // Calculate world space movement
        // W key (moveState.forward) should move in the direction the camera is facing (negative Z)
        // S key (moveState.backward) should move in the opposite direction (positive Z)
        const worldMoveX = cameraRight.x * moveX + cameraDirection.x * moveZ;
        const worldMoveZ = cameraRight.z * moveX + cameraDirection.z * moveZ;
        
        // Try to move in X direction
        const newPositionX = camera.position.clone();
        newPositionX.x += worldMoveX;
        
        // Check collision in X direction
        if (!checkCollision(newPositionX)) {
            camera.position.x = newPositionX.x;
        }
        
        // Try to move in Z direction
        const newPositionZ = camera.position.clone();
        newPositionZ.z += worldMoveZ;
        
        // Check collision in Z direction
        if (!checkCollision(newPositionZ)) {
            camera.position.z = newPositionZ.z;
        }
    }
    
    // Jump
    if (moveState.jump && !isJumping && canJump) {
        velocity.y = JUMP_FORCE;
        isJumping = true;
        canJump = false;
        lastJumpTime = now;
        if (typeof playSound === 'function') {
            playSound('jump');
        }
    }
    
    // Check if player is stuck
    if (now - lastStuckCheck > 1000) { // Check every second
        lastStuckCheck = now;
        
        const distanceMoved = camera.position.distanceTo(lastPosition);
        
        // If player hasn't moved much but is trying to move
        if (distanceMoved < 0.1 && (moveState.forward || moveState.backward || moveState.left || moveState.right)) {
            stuckCounter++;
            console.log("Possible stuck detection, counter:", stuckCounter);
            
            // If stuck for 3 consecutive checks, try to unstick
            if (stuckCounter >= 3) {
                console.log("Player appears to be stuck, attempting to unstick");
                
                // Try to move player slightly towards center of arena
                const toCenter = new THREE.Vector3(-camera.position.x, 0, -camera.position.z).normalize();
                camera.position.x += toCenter.x * 0.5;
                camera.position.z += toCenter.z * 0.5;
                
                // Reset stuck counter
                stuckCounter = 0;
            }
        } else {
            // Reset stuck counter if player is moving normally
            stuckCounter = 0;
        }
        
        // Update last position
        lastPosition.copy(camera.position);
    }
    
    // Update weapon position
    updateWeaponPosition();
    
    updateProjectiles();
}

// Check collision with environment
function checkCollision(position) {
    // Check arena boundary
    const distanceFromCenter = Math.sqrt(position.x * position.x + position.z * position.z);
    if (distanceFromCenter > 24 - PLAYER_RADIUS - COLLISION_BUFFER) {
        return true; // Collision with arena boundary
    }
    
    // Check environment objects
    if (window.environmentObjects && window.environmentObjects.length > 0) {
        for (const obj of window.environmentObjects) {
            if (!obj || !obj.position) continue;
            
            if (obj.userData && obj.userData.isCollidable) {
                const objRadius = obj.userData.radius || 1.0;
                const distance = position.distanceTo(obj.position);
                const minDistance = PLAYER_RADIUS + objRadius + COLLISION_BUFFER;
                
                if (distance < minDistance) {
                    return true;
                }
            }
        }
    }
    
    return false; // No collision
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
    const bulletMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
    const bullet = new THREE.Mesh(bulletGeo, bulletMat);
    
    // Create a raycaster from the camera center (where crosshair is)
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    // Calculate the exact hit point in world space
    // Cast ray to find the intersection with objects or use a far point if no intersection
    const intersects = raycaster.intersectObjects(window.environmentObjects || [], true);
    let hitPoint;
    
    if (intersects.length > 0) {
        // If we hit something, use that point
        hitPoint = intersects[0].point;
    } else {
        // If we didn't hit anything, use a point far along the ray
        hitPoint = new THREE.Vector3();
        hitPoint.copy(camera.position).add(raycaster.ray.direction.multiplyScalar(100));
    }
    
    // Get the barrel position in world space - moved closer to camera
    const barrelTip = new THREE.Vector3(0.3, -0.3, -0.7); // Reduced forward offset from -1.1 to -0.7
    barrelTip.applyMatrix4(weaponModel.matrixWorld);
    
    // Calculate the exact direction from barrel to hit point
    const direction = new THREE.Vector3();
    direction.subVectors(hitPoint, barrelTip).normalize();
    
    // Position bullet at barrel tip
    bullet.position.copy(barrelTip);
    
    // Align bullet with the tilted trajectory
    bullet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    
    // Create projectile object with velocity
    const projectile = {
        mesh: bullet,
        velocity: direction.clone().multiplyScalar(PROJECTILE_SPEED),
        created: now,
        startPoint: barrelTip.clone(),
        targetPoint: hitPoint.clone()
    };
    
    // Add bullet to scene and projectiles array
    scene.add(bullet);
    projectiles.push(projectile);
    
    // Create muzzle flash effect at barrel tip
    createMuzzleFlash(barrelTip);
    
    // Play sound
    if (typeof playSound === 'function') {
        playSound('shoot');
    }
    
    console.log("Shot fired from", barrelTip, "to", hitPoint);
}

// Create muzzle flash effect
function createMuzzleFlash(position) {
    // Create a bright point light
    const flashLight = new THREE.PointLight(0xFFFF00, 5, 2);
    flashLight.position.copy(position);
    scene.add(flashLight);
    
    // Create a small glowing sphere
    const flashGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const flashMat = new THREE.MeshBasicMaterial({ 
        color: 0xFFFF00,
        transparent: true,
        opacity: 0.8
    });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(position);
    scene.add(flash);
    
    // Remove after a short time
    setTimeout(() => {
        scene.remove(flashLight);
        scene.remove(flash);
        flashMat.dispose();
        flashGeo.dispose();
    }, 100);
}

// Update projectiles
function updateProjectiles() {
    const now = Date.now();
    
    // Update each projectile
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        
        // Move projectile
        projectile.mesh.position.add(projectile.velocity);
        
        // Check for collision with environment
        let environmentCollision = false;
        
        // Use raycaster to check for collisions with environment
        const raycaster = new THREE.Raycaster(
            projectile.mesh.position.clone().sub(projectile.velocity), // Start from previous position
            projectile.velocity.clone().normalize(),
            0, // Near
            projectile.velocity.length() * 1.5 // Far (slightly more than movement distance)
        );
        
        // Check collision with environment objects
        const environmentIntersects = raycaster.intersectObjects(window.environmentObjects || [], true);
        if (environmentIntersects.length > 0) {
            environmentCollision = true;
            createHitEffect(environmentIntersects[0].point);
            console.log("Projectile hit environment at", environmentIntersects[0].point);
        }
        
        // Check for collision with enemies
        let hitEnemy = false;
        
        if (window.enemies && window.enemies.length > 0) {
            for (const enemy of window.enemies) {
                if (!enemy.mesh) continue;
                
                // For extremely close range, also check distance from camera to enemy
                const distanceFromPlayer = camera.position.distanceTo(enemy.mesh.position);
                const distanceFromBullet = projectile.mesh.position.distanceTo(enemy.mesh.position);
                
                // Hit detection for extremely close range (within 2 units of player) or normal range
                if ((distanceFromPlayer <= 2 && distanceFromBullet < 2) || distanceFromBullet < 1.0) {
                    // For close range, check if enemy is in front of player
                    if (distanceFromPlayer <= 2) {
                        // Get direction to enemy
                        const toEnemy = new THREE.Vector3().subVectors(enemy.mesh.position, camera.position).normalize();
                        // Get player's forward direction
                        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
                        // Check if enemy is in front (dot product > 0 means enemy is in front)
                        if (toEnemy.dot(forward) <= 0) continue;
                    }
                    
                    hitEnemy = true;
                    
                    // Call enemy hit function if it exists
                    if (typeof window.hitEnemy === 'function') {
                        window.hitEnemy(enemy);
                    }
                    
                    // Create hit effect at the impact point
                    createHitEffect(projectile.mesh.position.clone());
                    
                    console.log("Enemy hit at distance from player:", distanceFromPlayer, "bullet distance:", distanceFromBullet);
                    break;
                }
            }
        }
        
        // Remove projectile if it hits something or is too old
        if (environmentCollision || hitEnemy || now - projectile.created > PROJECTILE_LIFETIME) {
            scene.remove(projectile.mesh);
            projectile.mesh.geometry.dispose();
            projectile.mesh.material.dispose();
            projectiles.splice(i, 1);
        }
    }
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

// Update stamina based on player actions
function updateStamina() {
    // Deplete stamina when running
    if (moveState.run && (moveState.forward || moveState.backward || moveState.left || moveState.right)) {
        if (currentStamina > 0) {
            currentStamina -= STAMINA_DEPLETION_RATE;
            if (currentStamina < 0) currentStamina = 0;
        }
    } else {
        // Recover stamina when not running
        if (currentStamina < MAX_STAMINA) {
            currentStamina += STAMINA_RECOVERY_RATE;
            if (currentStamina > MAX_STAMINA) currentStamina = MAX_STAMINA;
        }
    }
    
    // Update running ability
    canRun = currentStamina > 0;
    
    // Update stamina UI
    updateStaminaUI();
}

// Update the stamina UI
function updateStaminaUI() {
    const staminaBar = document.getElementById('stamina-fill');
    if (staminaBar) {
        const staminaPercentage = (currentStamina / MAX_STAMINA) * 100;
        staminaBar.style.width = `${staminaPercentage}%`;
    }
}

// Export functions
window.updatePlayer = updatePlayer;
window.shoot = shoot; 