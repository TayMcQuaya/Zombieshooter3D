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
const JUMP_FORCE = 0.06;  // Reduced from 0.22 for a lower jump
const GRAVITY = 0.002;    // Reduced from 0.004 for even slower falling
const AIR_CONTROL = 0.7;  // Air control factor (70% of normal movement speed in air)
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
    
    // Create debug indicator in HTML
    const debugElement = document.createElement('div');
    debugElement.id = 'weapon-debug';
    debugElement.style.position = 'fixed';
    debugElement.style.top = '50px';
    debugElement.style.left = '20px';
    debugElement.style.backgroundColor = 'rgba(255,0,0,0.7)';
    debugElement.style.color = 'white';
    debugElement.style.padding = '10px';
    debugElement.style.zIndex = '1000';
    debugElement.style.fontFamily = 'monospace';
    debugElement.style.fontSize = '14px';
    debugElement.innerText = 'Weapon Debug: Initializing...';
    document.body.appendChild(debugElement);
    
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
    
    // Add event listener for checking weapon visibility
    setInterval(debugWeaponVisibility, 1000);
    
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

// Debug function to check weapon visibility
function debugWeaponVisibility() {
    const debugElement = document.getElementById('weapon-debug');
    if (!debugElement) return;
    
    if (!weaponModel) {
        debugElement.innerText = 'Weapon Debug: NO WEAPON MODEL FOUND!';
        debugElement.style.backgroundColor = 'rgba(255,0,0,0.7)';
        return;
    }
    
    if (!scene.children.includes(weaponModel)) {
        debugElement.innerText = 'Weapon Debug: Weapon not in scene!';
        debugElement.style.backgroundColor = 'rgba(255,0,0,0.7)';
        return;
    }
    
    const positionMode = weaponPhysics.useFixedPosition ? "FIXED POSITION" : "PHYSICS MODE";
    const springInfo = `Spring: strength=${weaponPhysics.springStrength}, damping=${weaponPhysics.damping}`;
    debugElement.innerText = `Weapon Debug: ${positionMode}\nModel at position ${weaponModel.position.x.toFixed(2)}, ${weaponModel.position.y.toFixed(2)}, ${weaponModel.position.z.toFixed(2)}\n${springInfo}`;
    debugElement.style.backgroundColor = 'rgba(0,255,0,0.7)';
}

// Create weapon model (pistol and hand)
function createWeaponModel() {
    console.log("WEAPON DEBUG: Creating scene-based weapon model with fixed position");
    
    // Remove HTML overlay
    let existingOverlay = document.getElementById('weapon-overlay');
    if (existingOverlay) {
        document.body.removeChild(existingOverlay);
    }
    
    // Remove any existing weapon model
    if (weaponModel) {
        console.log("WEAPON DEBUG: Removing old weapon model");
        if (camera.children.includes(weaponModel)) {
            camera.remove(weaponModel);
        } else if (scene.children.includes(weaponModel)) {
            scene.remove(weaponModel);
        }
    }
    
    // Create a group to hold the weapon
    weaponModel = new THREE.Group();
    
    // COMPACT WEAPON DESIGN - 50% SMALLER

    // Main body - Black metal pistol body with reduced dimensions
    const bodyGeo = new THREE.BoxGeometry(0.16, 0.08, 0.25); // Much smaller
    const bodyMat = new THREE.MeshStandardMaterial({ 
        color: 0x151515, // Darker gunmetal
        emissive: 0x000000,
        roughness: 0.3,
        metalness: 0.9
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0, 0);
    weaponModel.add(body);
    
    // Slide - Top part of pistol
    const slideGeo = new THREE.BoxGeometry(0.15, 0.04, 0.23);
    const slideMat = new THREE.MeshStandardMaterial({ 
        color: 0x222222, // Slightly lighter than body
        roughness: 0.4,
        metalness: 0.9
    });
    const slide = new THREE.Mesh(slideGeo, slideMat);
    slide.position.set(0, 0.06, -0.01);
    weaponModel.add(slide);
    
    // Barrel - Dark metal cylinder - much thinner
    const barrelGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.35);
    const barrelMat = new THREE.MeshStandardMaterial({ 
        color: 0x101010, // Very dark metal
        roughness: 0.2,
        metalness: 1.0
    });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2; // Rotate to point forward
    barrel.position.set(0, 0.02, -0.18);
    weaponModel.add(barrel);
    
    // Add slide details - ejection port
    const ejectionPortGeo = new THREE.BoxGeometry(0.05, 0.01, 0.06);
    const ejectionPort = new THREE.Mesh(ejectionPortGeo, slideMat);
    ejectionPort.position.set(0.05, 0.065, 0);
    weaponModel.add(ejectionPort);
    
    // Handle - Textured grip with wood texture
    const handleGeo = new THREE.BoxGeometry(0.08, 0.16, 0.1);
    const handleMat = new THREE.MeshStandardMaterial({ 
        color: 0x2A1506, // Rich wood color
        roughness: 0.9,
        metalness: 0.0
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, -0.12, 0.02);
    weaponModel.add(handle);
    
    // Handle texture details - wood grain lines
    for (let i = 0; i < 3; i++) {
        const grainGeo = new THREE.BoxGeometry(0.082, 0.008, 0.102);
        const grainMat = new THREE.MeshStandardMaterial({ 
            color: 0x170A00, // Darker wood grain
            roughness: 0.9,
            metalness: 0.0
        });
        const grain = new THREE.Mesh(grainGeo, grainMat);
        grain.position.set(0, -0.08 - (i * 0.04), 0.02);
        weaponModel.add(grain);
    }
    
    // Trigger guard - thinner and more elliptical
    const guardGeo = new THREE.TorusGeometry(0.02, 0.004, 8, 12, Math.PI);
    const guardMat = new THREE.MeshStandardMaterial({ 
        color: 0x101010,
        roughness: 0.3,
        metalness: 0.7
    });
    const guard = new THREE.Mesh(guardGeo, guardMat);
    guard.rotation.x = Math.PI / 2;
    guard.position.set(0, -0.04, 0.02);
    weaponModel.add(guard);
    
    // Trigger - small
    const triggerGeo = new THREE.BoxGeometry(0.008, 0.03, 0.008);
    const triggerMat = new THREE.MeshStandardMaterial({ 
        color: 0x505050,
        roughness: 0.5,
        metalness: 0.6
    });
    const trigger = new THREE.Mesh(triggerGeo, triggerMat);
    trigger.position.set(0, -0.05, 0.02);
    weaponModel.add(trigger);
    
    // Sights - Front (very small)
    const frontSightGeo = new THREE.BoxGeometry(0.004, 0.008, 0.004);
    const sightMat = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF, // White sight dot
        roughness: 0.2,
        metalness: 0.0
    });
    const frontSight = new THREE.Mesh(frontSightGeo, sightMat);
    frontSight.position.set(0, 0.08, -0.11);
    weaponModel.add(frontSight);
    
    // Sights - Rear (very small)
    const rearSightGeo = new THREE.BoxGeometry(0.03, 0.006, 0.004);
    const rearSight = new THREE.Mesh(rearSightGeo, bodyMat);
    rearSight.position.set(0, 0.08, 0.1);
    weaponModel.add(rearSight);
    
    // Create a realistic hand model
    const handGroup = new THREE.Group();
    
    // Hand materials
    const handMat = new THREE.MeshStandardMaterial({ 
        color: 0xE0C8B0, // Base flesh color
        roughness: 0.9,
        metalness: 0.0
    });
    
    const darkHandMat = new THREE.MeshStandardMaterial({ 
        color: 0xD6BEA0, // Slightly darker flesh for shadows
        roughness: 0.9,
        metalness: 0.0
    });
    
    // Wrist/forearm - made thicker and longer
    const wristGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.12, 8);
    wristGeo.rotateX(Math.PI / 2);
    const wrist = new THREE.Mesh(wristGeo, handMat);
    wrist.position.set(0, -0.22, 0.16); // Moved back to prevent cutoff
    handGroup.add(wrist);
    
    // Palm - made larger
    const palmGeo = new THREE.SphereGeometry(0.04, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    palmGeo.scale(1, 0.7, 1.3);
    const palm = new THREE.Mesh(palmGeo, darkHandMat);
    palm.rotation.x = Math.PI / 2;
    palm.position.set(0, -0.19, 0.08); // Adjusted position
    handGroup.add(palm);
    
    // Create thumb - larger
    const thumbBase = new THREE.SphereGeometry(0.014, 8, 8);
    const thumbBaseMesh = new THREE.Mesh(thumbBase, handMat);
    thumbBaseMesh.position.set(-0.035, -0.18, 0.05);
    handGroup.add(thumbBaseMesh);
    
    const thumbJoint = new THREE.SphereGeometry(0.012, 8, 8);
    const thumbJointMesh = new THREE.Mesh(thumbJoint, handMat);
    thumbJointMesh.position.set(-0.045, -0.17, 0.03);
    handGroup.add(thumbJointMesh);
    
    const thumbGeo = new THREE.CylinderGeometry(0.012, 0.01, 0.045, 8);
    const thumb = new THREE.Mesh(thumbGeo, handMat);
    thumb.position.set(-0.04, -0.175, 0.04);
    thumb.rotation.x = 0.6;
    thumb.rotation.z = -0.4;
    handGroup.add(thumb);
    
    // Create finger joints and segments - increased size and improved function
    function createFinger(x, y, z, length, thickness, rotX, name) {
        const fingerGroup = new THREE.Group();
        fingerGroup.name = name;
        
        // Base joint - larger
        const baseJoint = new THREE.Mesh(
            new THREE.SphereGeometry(thickness + 0.003, 8, 8),
            handMat
        );
        baseJoint.position.set(x, y, z);
        fingerGroup.add(baseJoint);
        
        // First segment - thicker
        const segment1 = new THREE.Mesh(
            new THREE.CylinderGeometry(thickness, thickness * 0.95, length * 0.6, 8),
            handMat
        );
        segment1.rotation.x = rotX;
        segment1.position.set(x, y - (length * 0.3 * Math.sin(rotX)), z - (length * 0.3 * Math.cos(rotX)));
        fingerGroup.add(segment1);
        
        // Middle joint - larger
        const middleJoint = new THREE.Mesh(
            new THREE.SphereGeometry(thickness * 0.95, 8, 8),
            handMat
        );
        middleJoint.position.set(
            x, 
            y - (length * 0.6 * Math.sin(rotX)), 
            z - (length * 0.6 * Math.cos(rotX))
        );
        fingerGroup.add(middleJoint);
        
        // Second segment - thicker
        const segment2 = new THREE.Mesh(
            new THREE.CylinderGeometry(thickness * 0.95, thickness * 0.9, length * 0.4, 8),
            handMat
        );
        segment2.rotation.x = rotX + 0.3; // Slight extra bend
        segment2.position.set(
            x,
            y - (length * 0.6 * Math.sin(rotX)) - (length * 0.2 * Math.sin(rotX + 0.3)),
            z - (length * 0.6 * Math.cos(rotX)) - (length * 0.2 * Math.cos(rotX + 0.3))
        );
        fingerGroup.add(segment2);
        
        return fingerGroup;
    }
    
    // Add fingers - positioned to grip the handle - increased sizes and adjusted positions
    const indexFinger = createFinger(0.025, -0.16, -0.01, 0.09, 0.01, -0.5, "index");
    const middleFinger = createFinger(0.01, -0.17, 0, 0.095, 0.01, -0.5, "middle");
    const ringFinger = createFinger(-0.015, -0.17, 0, 0.09, 0.009, -0.5, "ring");
    const pinkyFinger = createFinger(-0.035, -0.16, -0.01, 0.08, 0.008, -0.5, "pinky");
    
    handGroup.add(indexFinger);
    handGroup.add(middleFinger);
    handGroup.add(ringFinger);
    handGroup.add(pinkyFinger);
    
    // Add hand to weapon
    weaponModel.add(handGroup);
    
    // Apply separate scaling to hand to make it larger relative to the weapon
    handGroup.scale.set(1.2, 1.2, 1.2);
    
    // Adjust hand position to ensure visibility
    handGroup.position.set(0, 0.02, 0.04);
    
    // Invisible muzzle marker for bullet origin
    const tipMarkerGeo = new THREE.SphereGeometry(0.004);
    const tipMarkerMat = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.1
    });
    const tipMarker = new THREE.Mesh(tipMarkerGeo, tipMarkerMat);
    tipMarker.position.set(0, 0.02, -0.38);
    weaponModel.add(tipMarker);
    
    // Disable frustum culling to ensure it's always rendered
    weaponModel.traverse(function(object) {
        if (object.isMesh) {
            object.frustumCulled = false;
            object.material.needsUpdate = true;
            object.renderOrder = 999; // Render this after everything else
            object.layers.enable(1); // Put on a special layer
        }
    });
    
    // Scale down the entire weapon but not as much as before
    weaponModel.scale.set(0.65, 0.65, 0.65); // Slightly larger than before (was 0.6)
    
    // Add the weapon to the scene
    scene.add(weaponModel);
    
    // Create a very subtle light for the weapon
    const weaponLight = new THREE.PointLight(0xFFFFFF, 0.3, 2);
    weaponLight.position.set(0, 0.1, -0.2);
    weaponModel.add(weaponLight);
    
    // Initialize physics system with current camera position
    weaponPhysics.lastTime = Date.now();
    weaponPhysics.useFixedPosition = true; // Ensure we're using fixed position
    
    // Get initial camera vectors
    const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    
    // Position it to better show the hand
    const initialPos = new THREE.Vector3();
    initialPos.copy(camera.position);
    initialPos.add(cameraDirection.clone().multiplyScalar(0.48)); // Moved slightly forward
    initialPos.add(cameraUp.clone().multiplyScalar(-0.22)); // Higher in view
    initialPos.add(cameraRight.clone().multiplyScalar(0.12)); // More to the right
    
    // Initialize physics values to prevent initial jump
    weaponPhysics.targetPosition.copy(initialPos);
    weaponPhysics.currentPosition.copy(initialPos);
    weaponPhysics.positionVelocity.set(0, 0, 0);
    
    weaponPhysics.targetRotation.copy(camera.quaternion);
    weaponPhysics.currentRotation.copy(camera.quaternion);
    weaponPhysics.rotationVelocity.set(0, 0, 0);
    
    // Set initial position immediately
    weaponModel.position.copy(initialPos);
    weaponModel.quaternion.copy(camera.quaternion);
    
    console.log("WEAPON DEBUG: Added smaller weapon with realistic hand");
    
    return weaponModel;
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
    
    // COMPLETELY DISABLE BOBBING FOR ABSOLUTE STABILITY
    // We're removing all bobbing to eliminate stuttering
    
    // Set target rotation to match camera exactly
    const targetQuaternion = camera.quaternion.clone();
    
    // ELIMINATE ALL SWAY - Already disabled but making it clearer
    
    // Apply very minimal recoil effect when shooting
    const now = Date.now();
    const timeSinceShot = now - lastShootTime;
    if (timeSinceShot < 200) {
        const recoilProgress = 1 - (timeSinceShot / 200);
        const recoilCurve = Math.sin(recoilProgress * Math.PI); 
        const recoilAmount = 0.008 * recoilCurve; // Extremely minimal recoil
        
        // Very slight backward movement
        targetPos.add(cameraDirection.clone().multiplyScalar(-recoilAmount));
        
        // Very slight upward rotation
        const recoilQuat = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(-recoilAmount, 0, 0, 'XYZ'));
        targetQuaternion.multiply(recoilQuat);
    }
    
    // Set position and rotation directly without physics
    weaponModel.position.copy(targetPos);
    weaponModel.quaternion.copy(targetQuaternion);
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

// FIX for pause menu - Add this new function to ensure pointer lock on resume
function resumePointerLock() {
    if (gameActive && !gamePaused) {
        // Request pointer lock again
        document.body.requestPointerLock();
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
            velocity.y -= GRAVITY * 0.5; // Reduced from 0.5 for a longer hover effect
        }
        // Apply reduced gravity when falling for a slower descent
        else {
            velocity.y -= GRAVITY * 0.4; // Only 80% of gravity when falling
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

// Modified shoot function to work with the scene-based weapon model
function shoot() {
    const now = Date.now();
    
    // Check if we can shoot (cooldown)
    if (now - lastShootTime < SHOOT_COOLDOWN) {
        console.log("Shot ignored - cooldown active");
        return;
    }
    
    // Update last shoot time
    lastShootTime = now;
    
    // Ensure weapon model exists
    if (!weaponModel || !scene.children.includes(weaponModel)) {
        console.log("WEAPON DEBUG: Recreating weapon before shooting");
        createWeaponModel();
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
    
    // Find the barrel tip in world space - adjusted position for new smaller model
    const barrelTip = new THREE.Vector3(0, 0.02, -0.38);
    barrelTip.applyMatrix4(weaponModel.matrixWorld);
    
    // Calculate direction from barrel tip to hit point
    const direction = new THREE.Vector3();
    direction.subVectors(hitPoint, barrelTip).normalize();
    
    // Position bullet at barrel tip
    bullet.position.copy(barrelTip);
    
    // Align bullet with trajectory
    bullet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    
    // Create projectile object
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
    
    // Create muzzle flash
    createMuzzleFlash(barrelTip);
    
    // Play sound
    if (typeof playSound === 'function') {
        playSound('shoot');
    }
    
    // Update debug display
    const debugElement = document.getElementById('weapon-debug');
    if (debugElement) {
        debugElement.innerText = `Weapon Debug: Shot fired from ${barrelTip.x.toFixed(2)}, ${barrelTip.y.toFixed(2)}, ${barrelTip.z.toFixed(2)}`;
        debugElement.style.backgroundColor = 'rgba(255,255,0,0.7)';
    }
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
window.resumePointerLock = resumePointerLock; // Export the new function for pause menu 