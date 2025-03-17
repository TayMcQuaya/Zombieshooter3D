// player.js - Player movement, shooting, and controls

// Player movement state
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    run: false,  // New state for running
    switchWeapon: false  // New state for weapon switching
};

// Player properties
const PLAYER_SPEED = 0.04;
const WALK_SPEED = 0.02;  // New walking speed (half of original speed)
const RUN_SPEED = 0.04;   // Run speed (same as original speed)
const PLAYER_RADIUS = 0.5;
const JUMP_FORCE = 0.06;  // Slightly increased from 0.06 for a better jump feel
const GRAVITY = 0.002;    // Keeping the same low gravity for floaty feel
const AIR_CONTROL = 1;  // Increased from 0.7 to give better control while in air
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

// Weapon system
const WEAPONS = {
    PISTOL: {
        name: 'Pistol',
        shootCooldown: 400,
        projectileSpeed: 0.8,
        model: null,
        damage: 25,
        ammo: Infinity,
        slot: 1
    },
    RIFLE: {
        name: 'Rifle',
        shootCooldown: 100,
        projectileSpeed: 1.0,
        model: null,
        damage: 35,
        maxAmmo: 30,
        ammo: 30,
        slot: 2
    },
    SHOTGUN: {
        name: 'Shotgun',
        shootCooldown: 800,
        projectileSpeed: 0.9,
        model: null,
        damage: 15, // Increased from 8 for more damage per pellet
        pellets: 8,
        spread: 0.4,
        maxRange: 5,
        maxAmmo: 8,
        ammo: 8,
        slot: 3
    }
};

let currentWeapon = 'PISTOL';
let isWeaponSwitching = false;
let isAutoFiring = false;
const WEAPON_SWITCH_TIME = 500; // Time for switch animation in ms
let weaponSwitchStart = 0;
let reloadStartTime = 0;
const RELOAD_TIME = 2000; // 2 seconds to reload
let isReloading = false;

// Weapon model
let weaponModel = null;
let handModel = null;
let weaponBobTime = 0;
let weaponSwayAmount = 0.02;
let weaponBobAmount = 0.03;
let weaponBobSpeed = 5;

// Breathing animation parameters
let breathingTime = 0;
const BREATHING_SPEED = 0.2; // Slow, natural breathing rate
const BREATHING_AMOUNT = 0.004; // Increased from 0.002 to 0.004 for more noticeable movement
const BREATHING_ROTATION = 0.0015; // Increased from 0.001 to 0.0015 for slightly more rotation

// Weapon physics state - NEW
const weaponPhysics = {
    // Target and current positions (for smooth lerping)
    targetPosition: new THREE.Vector3(),
    currentPosition: new THREE.Vector3(),
    
    // Target and current rotations (for smooth lerping)
    targetRotation: new THREE.Quaternion(),
    currentRotation: new THREE.Quaternion(),
    
    // Spring physics properties
    springStrength: 50.0,  // INCREASED from 15.0 to 50.0 for faster response
    damping: 0.95,         // INCREASED from 0.6 to 0.95 for much less oscillation
    
    // Velocity vectors for spring physics
    positionVelocity: new THREE.Vector3(),
    rotationVelocity: new THREE.Vector3(),
    
    // Last frame time for delta calculation
    lastTime: 0,
    
    // Fixed position mode
    useFixedPosition: true  // NEW: toggle for using fixed position instead of physics
};

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
    
    // Set up mouse events for shooting
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp); // Add mouse up listener
    
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
    
    // COMMENTED OUT the debug visibility checker
    // setInterval(debugWeaponVisibility, 1000);
    
    // Also create it with a delay to ensure it's visible
    setTimeout(() => {
        console.log("Creating weapon model again with delay to ensure visibility");
        createWeaponModel();
    }, 300);
    
    // Try one more time after a longer delay for reliability
    setTimeout(() => {
        console.log("Creating weapon model with longer delay for extra reliability");
        createWeaponModel();
        // Force an update of the weapon position
        updateWeaponPosition();
    }, 1000);
    
    console.log("Player initialized, camera:", camera);
}

// Debug function to check weapon visibility - MODIFIED to just log to console instead of showing on screen
function debugWeaponVisibility() {
    // Remove on-screen debug display
    /* const debugElement = document.getElementById('weapon-debug');
    if (!debugElement) return; */
    
    if (!weaponModel) {
        console.log('Weapon Debug: NO WEAPON MODEL FOUND!');
        return;
    }
    
    if (!scene.children.includes(weaponModel)) {
        console.log('Weapon Debug: Weapon not in scene!');
        return;
    }
    
    const positionMode = weaponPhysics.useFixedPosition ? "FIXED POSITION" : "PHYSICS MODE";
    const springInfo = `Spring: strength=${weaponPhysics.springStrength}, damping=${weaponPhysics.damping}`;
    console.log(`Weapon Debug: ${positionMode} - Model at position ${weaponModel.position.x.toFixed(2)}, ${weaponModel.position.y.toFixed(2)}, ${weaponModel.position.z.toFixed(2)} - ${springInfo}`);
}

// Create weapon model (pistol and hand)
function createWeaponModel() {
    console.log("WEAPON DEBUG: Creating scene-based weapon models");
    
    // Remove existing weapon model
    if (weaponModel) {
        if (camera.children.includes(weaponModel)) {
            camera.remove(weaponModel);
        } else if (scene.children.includes(weaponModel)) {
            scene.remove(weaponModel);
        }
    }
    
    // Create weapon models container
    weaponModel = new THREE.Group();
    
    // Create pistol model
    WEAPONS.PISTOL.model = createPistolModel();
    WEAPONS.PISTOL.model.visible = currentWeapon === 'PISTOL';
    weaponModel.add(WEAPONS.PISTOL.model);
    
    // Create rifle model
    WEAPONS.RIFLE.model = createRifleModel();
    WEAPONS.RIFLE.model.visible = currentWeapon === 'RIFLE';
    weaponModel.add(WEAPONS.RIFLE.model);
    
    // Create shotgun model
    WEAPONS.SHOTGUN.model = createShotgunModel();
    WEAPONS.SHOTGUN.model.visible = currentWeapon === 'SHOTGUN';
    weaponModel.add(WEAPONS.SHOTGUN.model);
    
    // Add the weapon model to the scene
    scene.add(weaponModel);
    
    // Update weapon position
    updateWeaponPosition();
}

// Create the pistol model
function createPistolModel() {
    const pistolGroup = new THREE.Group();
    
    // Main body - Black metal pistol body with reduced dimensions
    const bodyGeo = new THREE.BoxGeometry(0.16, 0.08, 0.25);
    const bodyMat = new THREE.MeshStandardMaterial({ 
        color: 0x151515,
        emissive: 0x000000,
        roughness: 0.3,
        metalness: 0.9
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0, 0);
    pistolGroup.add(body);
    
    // Slide - Top part of pistol
    const slideGeo = new THREE.BoxGeometry(0.15, 0.04, 0.23);
    const slideMat = new THREE.MeshStandardMaterial({ 
        color: 0x222222,
        roughness: 0.4,
        metalness: 0.9
    });
    const slide = new THREE.Mesh(slideGeo, slideMat);
    slide.position.set(0, 0.06, -0.01);
    pistolGroup.add(slide);
    
    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.35);
    const barrelMat = new THREE.MeshStandardMaterial({ 
        color: 0x101010,
        roughness: 0.2,
        metalness: 1.0
    });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.18);
    pistolGroup.add(barrel);
    
    // Handle
    const handleGeo = new THREE.BoxGeometry(0.08, 0.16, 0.1);
    const handleMat = new THREE.MeshStandardMaterial({ 
        color: 0x2A1506,
        roughness: 0.9,
        metalness: 0.0
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, -0.08, 0.02);
    pistolGroup.add(handle);
    
    // Create hand model
    const handGroup = new THREE.Group();
    
    // Palm
    const palmGeo = new THREE.BoxGeometry(0.08, 0.12, 0.06);
    const skinMat = new THREE.MeshStandardMaterial({ 
        color: 0xFFDBBF,
        roughness: 0.3,
        metalness: 0.0
    });
    const palm = new THREE.Mesh(palmGeo, skinMat);
    palm.position.set(0, -0.08, 0.08);
    handGroup.add(palm);
    
    // Thumb
    const thumbGeo = new THREE.BoxGeometry(0.03, 0.06, 0.03);
    const thumb = new THREE.Mesh(thumbGeo, skinMat);
    thumb.position.set(-0.05, -0.05, 0.08);
    thumb.rotation.z = -0.3;
    handGroup.add(thumb);
    
    // Fingers
    const fingerGeo = new THREE.BoxGeometry(0.025, 0.08, 0.03);
    for (let i = 0; i < 4; i++) {
        const finger = new THREE.Mesh(fingerGeo, skinMat);
        finger.position.set(-0.03 + (i * 0.02), -0.14, 0.08);
        finger.rotation.x = -0.2;
        handGroup.add(finger);
    }
    
    // Add hand to pistol group
    pistolGroup.add(handGroup);
    
    return pistolGroup;
}

// Create the new rifle model
function createRifleModel() {
    const rifleGroup = new THREE.Group();
    
    // Main body - Longer than pistol
    const bodyGeo = new THREE.BoxGeometry(0.16, 0.08, 0.45);
    const bodyMat = new THREE.MeshStandardMaterial({ 
        color: 0x151515,
        emissive: 0x000000,
        roughness: 0.3,
        metalness: 0.9
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0, 0);
    rifleGroup.add(body);
    
    // Barrel - Longer than pistol
    const barrelGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.6);
    const barrelMat = new THREE.MeshStandardMaterial({ 
        color: 0x101010,
        roughness: 0.2,
        metalness: 1.0
    });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.35);
    rifleGroup.add(barrel);
    
    // Stock
    const stockGeo = new THREE.BoxGeometry(0.1, 0.15, 0.25);
    const stockMat = new THREE.MeshStandardMaterial({ 
        color: 0x2A1506,
        roughness: 0.9,
        metalness: 0.0
    });
    const stock = new THREE.Mesh(stockGeo, stockMat);
    stock.position.set(0, -0.02, 0.2);
    rifleGroup.add(stock);
    
    // Magazine
    const magGeo = new THREE.BoxGeometry(0.05, 0.15, 0.08);
    const magMat = new THREE.MeshStandardMaterial({ 
        color: 0x222222,
        roughness: 0.4,
        metalness: 0.9
    });
    const magazine = new THREE.Mesh(magGeo, magMat);
    magazine.position.set(0, -0.1, 0);
    rifleGroup.add(magazine);
    
    // Scope mount
    const mountGeo = new THREE.BoxGeometry(0.05, 0.04, 0.15);
    const mount = new THREE.Mesh(mountGeo, bodyMat);
    mount.position.set(0, 0.06, -0.1);
    rifleGroup.add(mount);
    
    return rifleGroup;
}

// Create shotgun model
function createShotgunModel() {
    const shotgunGroup = new THREE.Group();
    
    // Main body (longer and thicker than rifle)
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.15, 1.2),
        new THREE.MeshPhongMaterial({ color: 0x444444 })
    );
    body.position.z = -0.6;
    
    // Barrel (double barrel effect)
    const barrel1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 1.0, 8),
        new THREE.MeshPhongMaterial({ color: 0x333333 })
    );
    barrel1.rotation.x = Math.PI / 2;
    barrel1.position.set(0.04, 0.02, -0.5);
    
    const barrel2 = barrel1.clone();
    barrel2.position.set(-0.04, 0.02, -0.5);
    
    // Stock
    const stock = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.18, 0.4),
        new THREE.MeshPhongMaterial({ color: 0x554433 })
    );
    stock.position.z = 0.1;
    
    // Grip
    const grip = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.25, 0.1),
        new THREE.MeshPhongMaterial({ color: 0x554433 })
    );
    grip.position.set(0, -0.1, -0.2);
    grip.rotation.x = Math.PI / 6;
    
    // Assemble shotgun
    shotgunGroup.add(body, barrel1, barrel2, stock, grip);
    
    return shotgunGroup;
}

// Update weapon position for bobbing and swaying effects
function updateWeaponPosition() {
    if (!weaponModel) {
        console.log("WEAPON DEBUG: No weapon model found, recreating...");
        createWeaponModel();
        return;
    }
    
    // ANTI-STUTTER FIX: Skip weapon updates when game is paused
    if (typeof gamePaused !== 'undefined' && gamePaused) {
        return;
    }
    
    // Get camera vectors for positioning - optimized to reduce calculations
    const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    
    // Base offset from camera - adjusted for better hand visibility
    const weaponOffset = {
        forward: 0.48,  // Slightly further from camera
        down: 0.22,     // Higher in view
        right: 0.12     // More to the right
    };
    
    // Calculate the target position in world space
    const targetPos = new THREE.Vector3();
    targetPos.copy(camera.position);
    targetPos.add(cameraDirection.clone().multiplyScalar(weaponOffset.forward));
    targetPos.add(cameraUp.clone().multiplyScalar(-weaponOffset.down));
    targetPos.add(cameraRight.clone().multiplyScalar(weaponOffset.right));
    
    // Update breathing animation time
    breathingTime += BREATHING_SPEED * 0.016; // Assuming 60fps, adjust time increment
    
    // Apply subtle breathing animation
    const breathingOffset = Math.sin(breathingTime * Math.PI) * BREATHING_AMOUNT;
    targetPos.add(cameraUp.clone().multiplyScalar(breathingOffset));
    
    // Set target rotation to match camera exactly
    const targetQuaternion = camera.quaternion.clone();
    
    // Apply subtle breathing rotation (slight forward/backward tilt)
    const breathingRotation = Math.sin(breathingTime * Math.PI) * BREATHING_ROTATION;
    const breathingQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(breathingRotation, 0, 0, 'XYZ')
    );
    targetQuaternion.multiply(breathingQuat);
    
    // Apply very minimal recoil effect when shooting
    const now = Date.now();
    const timeSinceShot = now - lastShootTime;
    if (timeSinceShot < 200) {
        const recoilProgress = 1 - (timeSinceShot / 200);
        const recoilCurve = Math.sin(recoilProgress * Math.PI); 
        const recoilAmount = 0.02 * recoilCurve; // Increased from 0.008 to 0.02 for more noticeable recoil
        
        // More noticeable backward movement
        targetPos.add(cameraDirection.clone().multiplyScalar(-recoilAmount));
        
        // More noticeable upward rotation
        const recoilQuat = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(-recoilAmount * 1.5, 0, 0, 'XYZ')); // Added multiplier for more rotation
        targetQuaternion.multiply(recoilQuat);
    }
    
    // Set position and rotation directly without physics
    weaponModel.position.copy(targetPos);
    weaponModel.quaternion.copy(targetQuaternion);
}

// Handle key down events
function onKeyDown(event) {
    if (!gameActive || document.pointerLockElement !== document.body) return;
    
    switch (event.code) {
        case 'KeyW':
            moveState.forward = true;  // W key maps to forward
            break;
        case 'KeyS':
            moveState.backward = true; // S key maps to backward
            break;
        case 'KeyA':
            moveState.left = true;
            break;
        case 'KeyD':
            moveState.right = true;
            break;
        case 'Space':
            moveState.jump = true;
            break;
        case 'ShiftLeft':
            moveState.run = true;  // Shift key for running
            break;
        case 'Digit1':
            switchToWeapon('PISTOL');
            break;
        case 'Digit2':
            switchToWeapon('RIFLE');
            break;
        case 'Digit3':
            switchToWeapon('SHOTGUN');
            break;
        case 'Digit4':
            // Reserved for future weapon
            break;
        case 'R':
            // Get camera's forward direction
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(camera.quaternion);
            direction.y = 0; // Keep it on the ground plane
            direction.normalize();
            
            // Spawn position is 5 units in front of player
            const spawnPos = camera.position.clone().add(direction.multiplyScalar(5));
            
            // Store original spawn position
            const originalPosition = spawnPos.clone();
            
            // Override enemy spawn position
            const originalSpawnEnemy = window.spawnEnemy;
            window.spawnEnemy = function(type) {
                const enemy = originalSpawnEnemy(type);
                if (enemy && enemy.mesh) {
                    enemy.mesh.position.copy(originalPosition);
                    enemy.mesh.position.y = 0; // Place on ground
                    enemy.isSpawning = false; // Make it appear instantly
                }
                return enemy;
            };
            
            // Spawn all zombie types
            window.spawnEnemy('base'); // Spawn a base zombie
            window.spawnEnemy('purple'); // Spawn a purple zombie
            window.spawnEnemy('ranged'); // Spawn a ranged zombie
            window.spawnEnemy('tank'); // Spawn a tank zombie
            
            // Restore original spawn function
            window.spawnEnemy = originalSpawnEnemy;
            break;
        case 'M': // M key for testing moon hit
            console.log("M key pressed - testing moon hit");
            if (typeof window.handleMoonHit === 'function') {
                window.handleMoonHit();
            } else {
                console.error("handleMoonHit function not available on window object");
                
                // Fallback: Try to directly modify the moon's scale as a test
                if (window.moon) {
                    const currentScale = window.moon.scale.x;
                    const newScale = currentScale < 1.8 ? currentScale * 1.2 : 1.0;
                    console.log(`Direct moon scaling: ${currentScale} -> ${newScale}`);
                    window.moon.scale.set(newScale, newScale, newScale);
                    
                    if (window.moonGlow) {
                        window.moonGlow.scale.set(newScale, newScale, newScale);
                    }
                } else {
                    console.error("Moon object not available on window object");
                }
            }
            break;
    }
}

// Handle key up events
function onKeyUp(event) {
    if (!gameActive) return;
    
    switch (event.code) {
        case 'KeyW':
            moveState.forward = false;
            break;
        case 'KeyS':
            moveState.backward = false;
            break;
        case 'KeyA':
            moveState.left = false;
            break;
        case 'KeyD':
            moveState.right = false;
            break;
        case 'Space':
            moveState.jump = false;
            break;
        case 'ShiftLeft':
            moveState.run = false;  // Release shift key to stop running
            break;
        case 'Digit1':
            moveState.switchWeapon = false;
            break;
        case 'Digit2':
            moveState.switchWeapon = false;
            break;
        case 'Digit3':
            moveState.switchWeapon = false;
            break;
        case 'Digit4':
            // Reserved for future weapon
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
        isAutoFiring = true;
        shoot(); // Initial shot
    }
}

// Add mouse up handler to stop auto-fire
function onMouseUp(event) {
    if (event.button === 0) { // Left mouse button
        isAutoFiring = false;
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

// FIX for pause menu - Completely redesigned with persistent multi-attempt strategy
function resumePointerLock() {
    console.log("Starting enhanced pointer lock sequence...");
    
    // Only proceed if game is active and not paused
    if (!gameActive || gamePaused) {
        console.log("Game not active or paused - skipping pointer lock");
        return;
    }
    
    // First ensure any existing pointer lock is cleared
    if (document.pointerLockElement) {
        console.log("Releasing existing pointer lock");
        document.exitPointerLock();
    }
    
    // Create a variable to track attempts
    let attemptCount = 0;
    const MAX_ATTEMPTS = 5;
    
    // Schedule multiple attempts with increasing delays
    const attemptLock = function() {
        attemptCount++;
        
        if (!gameActive || gamePaused) {
            console.log("Game state changed - aborting remaining lock attempts");
            return;
        }
        
        if (document.pointerLockElement === document.body) {
            console.log("Pointer lock successfully acquired on attempt", attemptCount);
            return; // Success, stop trying
        }
        
        console.log(`Pointer lock attempt ${attemptCount}/${MAX_ATTEMPTS}`);
        
        // Focus on document body first
        document.body.focus();
        
        // Request pointer lock
        try {
            document.body.requestPointerLock();
        } catch (e) {
            console.error("Error requesting pointer lock:", e);
        }
        
        // Continue attempts if needed
        if (attemptCount < MAX_ATTEMPTS) {
            // Schedule next attempt with increasing delay
            setTimeout(attemptLock, 100 * attemptCount); // 100ms, 200ms, 300ms, etc.
        } else {
            console.log("Maximum pointer lock attempts reached");
            
            // Final fallback: try forcing game state refresh
            if (!document.pointerLockElement && gameActive && !gamePaused) {
                console.log("Attempting emergency game state refresh...");
                
                // Add a click event listener to the document that will request pointer lock
                const emergencyLockHandler = function() {
                    if (gameActive && !gamePaused) {
                        document.body.requestPointerLock();
                    }
                    document.removeEventListener('click', emergencyLockHandler);
                };
                
                document.addEventListener('click', emergencyLockHandler);
                
                // Alert the user that they need to click
                const lockMessage = document.createElement('div');
                lockMessage.textContent = 'Click anywhere to continue';
                lockMessage.style.position = 'fixed';
                lockMessage.style.top = '50%';
                lockMessage.style.left = '50%';
                lockMessage.style.transform = 'translate(-50%, -50%)';
                lockMessage.style.color = 'white';
                lockMessage.style.background = 'rgba(0,0,0,0.7)';
                lockMessage.style.padding = '20px';
                lockMessage.style.borderRadius = '10px';
                lockMessage.style.zIndex = '10000';
                lockMessage.style.fontFamily = 'Arial, sans-serif';
                lockMessage.style.fontSize = '24px';
                lockMessage.id = 'emergency-lock-message';
                
                document.body.appendChild(lockMessage);
                
                // Remove the message after 3 seconds
                setTimeout(() => {
                    const msgElement = document.getElementById('emergency-lock-message');
                    if (msgElement) {
                        document.body.removeChild(msgElement);
                    }
                }, 3000);
            }
        }
    };
    
    // Start the first attempt immediately, but give a small delay to ensure 
    // any previous pointer lock operations have completed
    setTimeout(attemptLock, 20);
}

// Function to update crosshair color based on moon aim
function updateCrosshairForMoonAim(angleInDegrees) {
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
        // If aiming within 25 degrees of the moon (slightly larger than hit threshold)
        // This gives the player a visual cue that they're getting close to a hit
        if (angleInDegrees < 25) {
            // Make it brighter yellow the closer you get to the center
            const brightness = 100 - (angleInDegrees * 4); // 100% at 0 degrees, 0% at 25 degrees
            crosshair.style.setProperty('--crosshair-color', `hsl(60, 100%, ${brightness}%)`);
        } else {
            crosshair.style.setProperty('--crosshair-color', '#ffffff'); // White when not aiming at moon
        }
    }
}

// Update player position
function updatePlayer() {
    const now = Date.now();
    
    // Apply gravity with air resistance for a more floaty feel
    if (isJumping) {
        // Apply less gravity when moving upward for a floaty ascent
        if (velocity.y > 0) {
            velocity.y -= GRAVITY * 0.35; // Reduced from 0.8 for even slower rising
        } 
        // Add a stronger hover effect at the peak of the jump
        else if (velocity.y > -0.02 && velocity.y < 0.02) { // Widened from 0.01 to 0.02
            velocity.y -= GRAVITY * 0.6; // Reduced from 0.5 for a longer hover effect
        }
        // Apply reduced gravity when falling for a slower descent
        else {
            velocity.y -= GRAVITY * 0.6; // Increased from 0.4 for slightly faster falling
        }
    } else {
        // Normal gravity when not jumping
        velocity.y -= GRAVITY;
    }
    
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
    
    // Apply air control factor if jumping
    if (isJumping) {
        moveX *= AIR_CONTROL;
        moveZ *= AIR_CONTROL;
    }
    
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
        // Add a slight initial upward force for a controlled jump
        velocity.y = JUMP_FORCE; // Removed the 1.1 multiplier for a more controlled jump
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
    
    // Update moon aim indicator
    if (window.moon) {
        // Get direction from camera to moon
        const directionToMoon = new THREE.Vector3();
        directionToMoon.subVectors(window.moon.position, camera.position).normalize();
        
        // Get camera's forward direction
        const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        
        // Calculate the angle between camera direction and direction to moon
        const angleToMoon = cameraDirection.angleTo(directionToMoon);
        const angleInDegrees = angleToMoon * (180 / Math.PI);
        
        // Update crosshair color based on moon aim
        updateCrosshairForMoonAim(angleInDegrees);
    }
    
    // Update weapon position
    updateWeaponPosition();
    
    updateProjectiles();
    
    // Handle auto-fire for rifle only when mouse button is held
    if (isAutoFiring && currentWeapon === 'RIFLE') {
        shoot();
    }
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
    
    // Check collision with zombies
    if (window.enemies && window.enemies.length > 0) {
        const playerPos2D = new THREE.Vector2(position.x, position.z);
        
        for (const enemy of window.enemies) {
            if (!enemy.mesh || !enemy.mesh.position) continue;
            
            // Skip zombies that are spawning (underground)
            if (enemy.isSpawning) continue;
            
            // Calculate distance to zombie (only in XZ plane)
            const zombiePos2D = new THREE.Vector2(enemy.mesh.position.x, enemy.mesh.position.z);
            const distanceToZombie = playerPos2D.distanceTo(zombiePos2D);
            
            // Define collision radii
            const playerRadius = PLAYER_RADIUS;
            const zombieRadius = 0.5; // Same as in updateEnemies
            const minDistance = playerRadius + zombieRadius;
            
            if (distanceToZombie < minDistance) {
                return true; // Collision with zombie
            }
        }
    }
    
    return false; // No collision
}

// Add reload completion handler
function handleReloadComplete() {
    const weapon = WEAPONS[currentWeapon];
    isReloading = false;
    weapon.ammo = weapon.maxAmmo;
    updateAmmoDisplay(weapon.ammo);
    // Hide reloading text
    if (typeof showReloadingText === 'function') {
        showReloadingText(false);
    }
}

// Modified shoot function
function shoot() {
    const now = Date.now();
    const weapon = WEAPONS[currentWeapon];
    
    // Check if reloading
    if (isReloading) {
        if (now - reloadStartTime < RELOAD_TIME) {
            return; // Still reloading
        } else {
            handleReloadComplete();
        }
    }
    
    // Check ammo
    if (weapon.ammo <= 0) {
        // Start reloading
        isReloading = true;
        reloadStartTime = now;
        // Play the appropriate reload sound
        if (typeof playSound === 'function') {
            if (currentWeapon === 'RIFLE') {
                playSound('rifle_reload');
            } else if (currentWeapon === 'SHOTGUN') {
                playSound('shotgun_reload');
            } else {
                playSound('reload');
            }
        }
        // Show reloading text
        if (typeof showReloadingText === 'function') {
            showReloadingText(true);
        }
        // Set up automatic reload completion
        setTimeout(() => {
            handleReloadComplete();
        }, RELOAD_TIME);
        return;
    }
    
    if (now - lastShootTime < weapon.shootCooldown) return;
    
    // Update last shoot time
    lastShootTime = now;
    
    // Decrease ammo for weapons with limited ammo
    if (currentWeapon !== 'PISTOL') {
        weapon.ammo--;
        updateAmmoDisplay(weapon.ammo);
    }
    
    // Ensure weapon model exists
    if (!weaponModel || !scene.children.includes(weaponModel)) {
        console.log("WEAPON DEBUG: Recreating weapon before shooting");
        createWeaponModel();
    }
    
    if (currentWeapon === 'SHOTGUN') {
        // Play shotgun sound once before creating pellets
        if (typeof playSound === 'function') {
            playSound('shotgunshot');
        }
        
        let hasHitEnvironment = false;
        const pelletHits = new Map(); // Track damage per enemy from this blast
        
        // Create multiple pellets for shotgun
        for (let i = 0; i < weapon.pellets; i++) {
            // Calculate spread angles with more horizontal bias
            const spreadX = (Math.random() - 0.5) * weapon.spread * 1.5; // 1.5x wider horizontal spread
            const spreadY = (Math.random() - 0.5) * weapon.spread * 0.7; // 0.7x reduced vertical spread
            
            // Create a raycaster with spread
            const raycaster = new THREE.Raycaster();
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(camera.quaternion);
            
            // Apply spread to direction
            direction.x += spreadX;
            direction.y += spreadY;
            direction.normalize();
            
            raycaster.set(camera.position, direction);
            
            // Check for enemy hits first
            if (window.enemies && window.enemies.length > 0) {
                for (const enemy of window.enemies) {
                    if (!enemy.mesh) continue;
                    
                    const distanceFromPlayer = camera.position.distanceTo(enemy.mesh.position);
                    if (distanceFromPlayer <= weapon.maxRange) {
                        const toEnemy = new THREE.Vector3().subVectors(enemy.mesh.position, camera.position).normalize();
                        const angleToEnemy = direction.angleTo(toEnemy);
                        const maxAngle = Math.atan2(1.0, distanceFromPlayer);
                        
                        if (angleToEnemy <= maxAngle) {
                            // Calculate damage with distance falloff
                            const damageFalloff = Math.max(0, 1 - (distanceFromPlayer / weapon.maxRange));
                            const pelletDamage = weapon.damage * damageFalloff;
                            
                            // Add hit effect immediately
                            if (typeof window.hitEnemy === 'function') {
                                window.hitEnemy(enemy);
                            }
                            
                            // Accumulate damage for this enemy
                            const currentDamage = pelletHits.get(enemy.mesh.uuid) || 0;
                            pelletHits.set(enemy.mesh.uuid, currentDamage + pelletDamage);
                        }
                    }
                }
            }
            
            // Create pellet
            const bulletGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.1);
            const bulletMat = new THREE.MeshBasicMaterial({ 
                color: 0xD4AF37,
                emissive: 0xD4AF37
            });
            const bullet = new THREE.Mesh(bulletGeo, bulletMat);
            
            // Calculate hit point with range limit
            const intersects = raycaster.intersectObjects(window.environmentObjects || [], true);
            let hitPoint;
            
            if (intersects.length > 0 && intersects[0].distance <= weapon.maxRange) {
                hitPoint = intersects[0].point;
                
                // Only create one environment hit effect per shotgun blast
                if (!hasHitEnvironment) {
                    hasHitEnvironment = true;
                    createEnvironmentHitEffect(hitPoint, true);
                    // Play impact sound once for the shotgun blast
                    if (typeof playSound === 'function') {
                        playSound('impact');
                    }
                }
            } else {
                // If no hit within range, set point at max range
                hitPoint = new THREE.Vector3();
                hitPoint.copy(camera.position).add(direction.multiplyScalar(weapon.maxRange));
            }
            
            // Define barrel tip position
            const localBarrelTip = new THREE.Vector3(0, 0.02, -0.38);
            const barrelTipWorld = localBarrelTip.clone();
            barrelTipWorld.applyMatrix4(weaponModel.matrixWorld);
            
            // Position and orient pellet
            bullet.position.copy(barrelTipWorld);
            const pelletDirection = new THREE.Vector3().subVectors(hitPoint, barrelTipWorld).normalize();
            bullet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pelletDirection);
            
            // Calculate damage based on distance
            const distance = barrelTipWorld.distanceTo(hitPoint);
            const damageFalloff = Math.max(0, 1 - (distance / weapon.maxRange));
            const pelletDamage = weapon.damage * damageFalloff;
            
            // Create projectile object
            const projectile = {
                mesh: bullet,
                velocity: pelletDirection.multiplyScalar(weapon.projectileSpeed),
                created: now,
                damage: pelletDamage,
                startPoint: barrelTipWorld.clone(),
                targetPoint: hitPoint.clone(),
                isShotgunPellet: true // Mark this as a shotgun pellet
            };
            
            // Add pellet to scene and projectiles array
            scene.add(bullet);
            projectiles.push(projectile);
        }
        
        // Apply accumulated damage to each hit enemy
        for (const [enemyId, totalDamage] of pelletHits) {
            const hitEnemy = window.enemies.find(e => e.mesh && e.mesh.uuid === enemyId);
            if (hitEnemy && typeof window.hitEnemy === 'function') {
                // Create a custom hit event with accumulated damage
                const hitEvent = {
                    enemy: hitEnemy,
                    damage: totalDamage,
                    isShotgunBlast: true
                };
                window.hitEnemy(hitEnemy);
            }
        }
    } else {
        // Original shooting logic for other weapons
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        
        // SPECIAL MOON HIT DETECTION - Enhanced with debugging
        // Check if player is aiming at the moon, regardless of distance
        if (window.moon) {
            console.log("Moon object exists, attempting hit detection");
            
            // Get direction from camera to moon
            const directionToMoon = new THREE.Vector3();
            directionToMoon.subVectors(window.moon.position, camera.position).normalize();
            
            // Get camera's forward direction
            const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            
            // Calculate the angle between camera direction and direction to moon
            const angleToMoon = cameraDirection.angleTo(directionToMoon);
            const angleInDegrees = angleToMoon * (180 / Math.PI);
            
            console.log("Angle to moon:", angleInDegrees.toFixed(2), "degrees");
            
            // If the angle is small enough, consider it a hit
            // Using a much larger threshold (20 degrees) to make it very easy to hit
            if (angleInDegrees < 20) {
                console.log("Moon hit detected based on angle!");
                
                // Call the moon hit handler function
                if (typeof window.handleMoonHit === 'function') {
                    console.log("Calling handleMoonHit function");
                    window.handleMoonHit();
                } else {
                    console.error("handleMoonHit function not found on window object!");
                    
                    // Fallback: Try to directly modify the moon's scale as a test
                    if (window.moon) {
                        const currentScale = window.moon.scale.x;
                        const newScale = currentScale < 1.8 ? currentScale * 1.2 : 1.0;
                        console.log(`Direct moon scaling: ${currentScale} -> ${newScale}`);
                        window.moon.scale.set(newScale, newScale, newScale);
                        
                        if (window.moonGlow) {
                            window.moonGlow.scale.set(newScale, newScale, newScale);
                        }
                    }
                }
                
                // Create a special visual effect showing the bullet "hitting" the moon
                // Calculate a hit point along the ray for the visual effect
                const hitPoint = new THREE.Vector3();
                hitPoint.copy(camera.position).add(cameraDirection.multiplyScalar(100));
                createMoonHitEffect(hitPoint);
            } else {
                console.log("No moon hit detected - angle too large");
            }
        } else {
            console.error("Moon object not found on window object!");
        }
        
        // Remove oldest projectile if at max
        if (projectiles.length >= MAX_PROJECTILES) {
            const oldest = projectiles.shift();
            if (oldest) {
                scene.remove(oldest.mesh);
                oldest.mesh.geometry.dispose();
                oldest.mesh.material.dispose();
            }
        }
        
        const bulletGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15); // Smaller bullet
        const bulletMat = new THREE.MeshBasicMaterial({ 
            color: 0xD4AF37, // More realistic gold color for bullet
            emissive: 0xD4AF37
        });
        const bullet = new THREE.Mesh(bulletGeo, bulletMat);
        
        // Calculate the exact hit point in world space
        // Cast ray to find the intersection with objects or use a far point if no intersection
        const intersects = raycaster.intersectObjects(window.environmentObjects || [], true);
        let hitPoint;
        
        if (intersects.length > 0) {
            // If we hit something, use that point
            hitPoint = intersects[0].point;
        } else {
            // If we didn't hit something, use a point far along the ray
            hitPoint = new THREE.Vector3();
            hitPoint.copy(camera.position).add(raycaster.ray.direction.multiplyScalar(100));
        }
        
        // Define the barrel tip position in local space
        const localBarrelTip = new THREE.Vector3(0, 0.02, -0.38);
        
        // Calculate the world position of the barrel tip for the bullet
        const barrelTipWorld = localBarrelTip.clone();
        barrelTipWorld.applyMatrix4(weaponModel.matrixWorld);
        
        // Calculate direction from barrel tip to hit point
        const direction = new THREE.Vector3();
        direction.subVectors(hitPoint, barrelTipWorld).normalize();
        
        // Position bullet at barrel tip world position
        bullet.position.copy(barrelTipWorld);
        
        // Align bullet with trajectory
        bullet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        
        // Create projectile object
        const projectile = {
            mesh: bullet,
            velocity: direction.clone().multiplyScalar(weapon.projectileSpeed),
            created: now,
            startPoint: barrelTipWorld.clone(),
            targetPoint: hitPoint.clone()
        };
        
        // Add bullet to scene and projectiles array
        scene.add(bullet);
        projectiles.push(projectile);
        
        // Create muzzle flash - passing no position as we now use local coordinates
        createMuzzleFlash();
        
        // Play sound - use pistolshot.wav
        if (typeof playSound === 'function') {
            if (currentWeapon === 'PISTOL') {
                playSound('shoot');  // pistol sound
            } else if (currentWeapon === 'RIFLE') {
                playSound('shoot');  // rifle uses same sound for now
            }
        }
        
        // Log debug info
        console.log(`Shot fired from ${barrelTipWorld.x.toFixed(2)}, ${barrelTipWorld.y.toFixed(2)}, ${barrelTipWorld.z.toFixed(2)}`);
    }
}

// Create muzzle flash effect
function createMuzzleFlash() {
    // Create a bright point light and attach it to the weapon model
    const flashLight = new THREE.PointLight(0xFFFF00, 5, 2);
    
    // Define the barrel tip position in local space
    const localBarrelTip = new THREE.Vector3(0, 0.02, -0.38);
    
    // Position the light at the barrel tip in local space
    flashLight.position.copy(localBarrelTip);
    
    // Create a small glowing cylinder for visual effect
    const flashGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.05);
    const flashMat = new THREE.MeshBasicMaterial({ 
        color: 0xFFFF88,
        transparent: true,
        opacity: 0.9
    });
    const flashMesh = new THREE.Mesh(flashGeo, flashMat);
    
    // Position the mesh at the barrel tip in local space
    flashMesh.position.copy(localBarrelTip);
    
    // Orient the flash correctly
    flashMesh.rotation.x = Math.PI / 2;
    
    // Add the flash light and mesh to the weapon model (not the scene)
    weaponModel.add(flashLight);
    weaponModel.add(flashMesh);
    
    // Store the time when the flash was created
    const flashCreatedTime = Date.now();
    
    // Schedule removal of the flash effect
    setTimeout(() => {
        // Remove the flash light and mesh from the weapon model
        weaponModel.remove(flashLight);
        weaponModel.remove(flashMesh);
        
        // Dispose of resources
        flashGeo.dispose();
        flashMat.dispose();
        
        console.log("Muzzle flash removed after " + (Date.now() - flashCreatedTime) + "ms");
    }, 50); // Short duration flash
}

// Update projectiles
function updateProjectiles() {
    const now = Date.now();
    
    // Track environment hits for sound
    let hasPlayedShotgunHitSound = false;
    
    // Track accumulated damage per enemy for shotgun pellets
    const pelletHits = new Map();
    
    // Update each projectile
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        
        // Store previous position for ground collision detection
        const prevY = projectile.mesh.position.y;
        
        // Move projectile
        projectile.mesh.position.add(projectile.velocity);
        
        // Check for collision with environment
        let environmentCollision = false;
        
        // Check for ground/floor collision
        if (prevY > 0 && projectile.mesh.position.y <= 0) {
            environmentCollision = true;
            projectile.mesh.position.y = 0;
            
            // Create hit effect but only play sound once per frame for shotgun
            if (!projectile.isShotgunPellet) {
                createEnvironmentHitEffect(projectile.mesh.position);
            } else if (!hasPlayedShotgunHitSound) {
                createEnvironmentHitEffect(projectile.mesh.position, true);
                hasPlayedShotgunHitSound = true;
            }
        }
        
        // Use raycaster to check for collisions with environment
        if (!environmentCollision) {
            const raycaster = new THREE.Raycaster(
                projectile.mesh.position.clone().sub(projectile.velocity),
                projectile.velocity.clone().normalize(),
                0,
                projectile.velocity.length() * 1.5
            );
            
            const environmentIntersects = raycaster.intersectObjects(window.environmentObjects || [], true);
            if (environmentIntersects.length > 0) {
                environmentCollision = true;
                if (!projectile.isShotgunPellet) {
                    createEnvironmentHitEffect(environmentIntersects[0].point);
                } else if (!hasPlayedShotgunHitSound) {
                    createEnvironmentHitEffect(environmentIntersects[0].point, true);
                    hasPlayedShotgunHitSound = true;
                }
            }
        }
        
        // Check for collision with enemies
        let hitEnemy = false;
        
        if (window.enemies && window.enemies.length > 0) {
            for (const enemy of window.enemies) {
                if (!enemy.mesh) continue;
                
                const distanceFromBullet = projectile.mesh.position.distanceTo(enemy.mesh.position);
                const distanceFromPlayer = camera.position.distanceTo(enemy.mesh.position);
                
                if ((distanceFromPlayer <= 2 && distanceFromBullet < 2) || distanceFromBullet < 1.0) {
                    if (distanceFromPlayer <= 2) {
                        const toEnemy = new THREE.Vector3().subVectors(enemy.mesh.position, camera.position).normalize();
                        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
                        if (toEnemy.dot(forward) <= 0) continue;
                    }
                    
                    hitEnemy = true;
                    
                    if (projectile.isShotgunPellet) {
                        // Accumulate damage for shotgun pellets
                        const currentDamage = pelletHits.get(enemy.mesh.uuid) || 0;
                        pelletHits.set(enemy.mesh.uuid, currentDamage + projectile.damage);
                    } else {
                        // Immediate hit registration for non-shotgun projectiles
                        if (typeof window.hitEnemy === 'function') {
                            window.hitEnemy(enemy);
                        }
                    }
                    
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
    
    // Apply accumulated shotgun damage after all pellets are processed
    for (const [enemyId, totalDamage] of pelletHits) {
        const hitEnemy = window.enemies.find(e => e.mesh && e.mesh.uuid === enemyId);
        if (hitEnemy && typeof window.hitEnemy === 'function') {
            const hitEvent = {
                enemy: hitEnemy,
                damage: totalDamage,
                isShotgunBlast: true
            };
            window.hitEnemy(hitEnemy);
        }
    }
}

// Create environment hit effect
function createEnvironmentHitEffect(position, isShotgunHit = false, skipSound = false) {
    const particleCount = isShotgunHit ? 12 : 6; // More particles for shotgun
    
    for (let i = 0; i < particleCount; i++) {
        // Create a small spark/debris particle
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.03 + Math.random() * 0.02),
            new THREE.MeshBasicMaterial({ 
                color: Math.random() > 0.5 ? 0xCCCCCC : 0x888888,
                transparent: true,
                opacity: 0.8
            })
        );
        
        particle.position.copy(position);
        
        // Add random velocity away from hit point
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * (isShotgunHit ? 0.15 : 0.1),
            Math.random() * (isShotgunHit ? 0.15 : 0.1),
            (Math.random() - 0.5) * (isShotgunHit ? 0.15 : 0.1)
        );
        
        scene.add(particle);
        
        // Remove after a short time
        setTimeout(() => {
            scene.remove(particle);
            particle.geometry.dispose();
            particle.material.dispose();
        }, 400 + Math.random() * 200);
    }
    
    // Add a small dust effect
    const dustGeo = new THREE.SphereGeometry(isShotgunHit ? 0.3 : 0.2, 8, 8);
    const dustMat = new THREE.MeshBasicMaterial({
        color: 0xBBBBBB,
        transparent: true,
        opacity: 0.5
    });
    const dust = new THREE.Mesh(dustGeo, dustMat);
    dust.position.copy(position);
    scene.add(dust);
    
    // Animate the dust cloud expanding and fading
    let scale = 1.0;
    let opacity = 0.5;
    const dustAnim = setInterval(() => {
        scale += isShotgunHit ? 0.15 : 0.1;
        opacity -= 0.05;
        dust.scale.set(scale, scale, scale);
        dustMat.opacity = opacity;
        
        if (opacity <= 0) {
            clearInterval(dustAnim);
            scene.remove(dust);
            dustGeo.dispose();
            dustMat.dispose();
        }
    }, 30);
    
    // Play impact sound only if not skipped and not a shotgun hit
    if (!skipSound && !isShotgunHit && typeof playSound === 'function') {
        playSound('impact');
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

// Create a visual effect for moon hits
function createMoonHitEffect(hitPoint) {
    // Create a bright flash at the hit point on the moon
    const flashGeo = new THREE.SphereGeometry(2, 16, 16);
    const flashMat = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.8
    });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(hitPoint);
    scene.add(flash);
    
    // Create expanding ring effect
    const ringGeo = new THREE.RingGeometry(1, 2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    
    // Position the ring at the hit point, but make it face the camera
    ring.position.copy(hitPoint);
    ring.lookAt(camera.position);
    scene.add(ring);
    
    // Animate the flash and ring
    let age = 0;
    const duration = 1000; // ms
    const startTime = Date.now();
    
    const animateEffect = () => {
        const now = Date.now();
        age = now - startTime;
        
        if (age < duration) {
            // Calculate progress (0 to 1)
            const progress = age / duration;
            
            // Flash fades out
            flashMat.opacity = 0.8 * (1 - progress);
            
            // Ring expands and fades
            const ringSize = 1 + (progress * 5);
            ring.scale.set(ringSize, ringSize, 1);
            ringMat.opacity = 0.6 * (1 - progress);
            
            // Continue animation
            requestAnimationFrame(animateEffect);
        } else {
            // Clean up
            scene.remove(flash);
            scene.remove(ring);
            flashGeo.dispose();
            flashMat.dispose();
            ringGeo.dispose();
            ringMat.dispose();
        }
    };
    
    // Start animation
    animateEffect();
    
    // Play a special sound for moon hit
    if (typeof playSound === 'function') {
        // Use an existing sound that fits well for a moon hit
        playSound('powerup');
    }
}

// New function to switch to a specific weapon
function switchToWeapon(weaponName) {
    if (isWeaponSwitching || isReloading || !WEAPONS[weaponName] || currentWeapon === weaponName) return;
    
    isWeaponSwitching = true;
    weaponSwitchStart = Date.now();
    
    // Play weapon switch sound
    if (typeof playSound === 'function') {
        playSound('weaponSwitch');
    }
    
    // Update weapon display in UI with proper case
    const displayName = WEAPONS[weaponName].name;
    const ammoCount = WEAPONS[weaponName].ammo;
    if (typeof updateWeaponDisplay === 'function') {
        updateWeaponDisplay(displayName, weaponName === 'PISTOL' ? null : ammoCount);
    }
    
    // Update the weapon SVG icon
    if (typeof updateWeaponIcon === 'function') {
        updateWeaponIcon(displayName);
    }
    
    // Animate weapon switching
    const startY = weaponModel.position.y;
    const switchDuration = WEAPON_SWITCH_TIME;
    const switchStartTime = Date.now();
    
    function animateSwitch() {
        const elapsed = Date.now() - switchStartTime;
        const progress = Math.min(elapsed / switchDuration, 1);
        
        // First half of animation - current weapon moves down
        if (progress < 0.5) {
            const downProgress = progress * 2;
            const y = startY - (downProgress * 0.5);
            weaponModel.position.y = y;
            
            if (progress >= 0.45) {
                // Switch models
                Object.keys(WEAPONS).forEach(weapon => {
                    WEAPONS[weapon].model.visible = weapon === weaponName;
                });
                currentWeapon = weaponName;
            }
        } else {
            const upProgress = (progress - 0.5) * 2;
            const y = (startY - 0.5) + (upProgress * 0.5);
            weaponModel.position.y = y;
        }
        
        if (progress < 1) {
            requestAnimationFrame(animateSwitch);
        } else {
            isWeaponSwitching = false;
            updateWeaponPosition();
        }
    }
    
    animateSwitch();
}

// Export functions
window.updatePlayer = updatePlayer;
window.shoot = shoot;
window.resumePointerLock = resumePointerLock; // Export the new function for pause menu 