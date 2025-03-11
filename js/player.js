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
const COLLISION_BUFFER = 0.1;  // Small buffer to prevent getting too close to objects

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
    
    // Apply movement speed
    moveX *= PLAYER_SPEED;
    moveZ *= PLAYER_SPEED;
    
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
    
    // Position bullet at barrel tip if weapon exists, otherwise at camera
    let bulletStartPosition;
    if (weaponModel) {
        // Find the barrel in the weapon model
        let barrelTip = new THREE.Vector3(0.3, -0.4, -1.0); // Default position
        
        // Apply weapon model's world matrix to get the barrel tip in world space
        barrelTip.applyMatrix4(weaponModel.matrixWorld);
        
        // Set bullet start position to barrel tip
        bulletStartPosition = barrelTip.clone();
        bullet.position.copy(barrelTip);
    } else {
        // Fallback to camera position with offset
        bulletStartPosition = camera.position.clone();
        const bulletOffset = new THREE.Vector3(0, 0, -0.5);
        bulletOffset.applyQuaternion(camera.quaternion);
        bullet.position.copy(camera.position).add(bulletOffset);
        bulletStartPosition.add(bulletOffset);
    }
    
    // Create a raycaster from the camera center (where crosshair is)
    const raycaster = new THREE.Raycaster();
    // Use 0,0 as the normalized device coordinates (center of the screen where the crosshair is)
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    // Get the exact direction from the raycaster
    const direction = raycaster.ray.direction.clone().normalize();
    
    // Set bullet rotation to align with the ray direction
    bullet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    
    // Create projectile object with velocity
    const projectile = {
        mesh: bullet,
        velocity: direction.multiplyScalar(PROJECTILE_SPEED),
        created: now
    };
    
    // Add bullet to scene and projectiles array
    scene.add(bullet);
    projectiles.push(projectile);
    
    // Create muzzle flash effect
    createMuzzleFlash(bulletStartPosition);
    
    // Play sound
    if (typeof playSound === 'function') {
        playSound('shoot');
    }
    
    console.log("Shot fired, projectiles count:", projectiles.length);
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
            projectile.mesh.position.clone().sub(projectile.velocity), // Start position (previous position)
            projectile.velocity.clone().normalize(), // Direction
            0, // Near
            projectile.velocity.length() * 1.5 // Far (slightly more than movement distance)
        );
        
        // Check collision with environment objects
        const environmentIntersects = raycaster.intersectObjects(window.environmentObjects || [], true);
        if (environmentIntersects.length > 0) {
            environmentCollision = true;
            
            // Create hit effect at collision point
            createHitEffect(environmentIntersects[0].point);
            
            console.log("Projectile hit environment at", environmentIntersects[0].point);
        }
        
        // Check for collision with enemies
        let hitEnemy = false;
        
        if (window.enemies && window.enemies.length > 0) {
            for (const enemy of window.enemies) {
                if (!enemy.mesh) continue;
                
                const distance = projectile.mesh.position.distanceTo(enemy.mesh.position);
                if (distance < 1.0) { // Enemy hit radius
                    hitEnemy = true;
                    
                    // Call enemy hit function if it exists
                    if (typeof window.hitEnemy === 'function') {
                        window.hitEnemy(enemy);
                    }
                    
                    // Create hit effect
                    createHitEffect(projectile.mesh.position.clone());
                    
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

// Export functions
window.updatePlayer = updatePlayer;
window.shoot = shoot; 