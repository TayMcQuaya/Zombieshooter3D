// bench.js - Weapon bench for collecting different weapon types

// Bench properties
const BENCH_POSITION = { x: 0, y: 0, z: 5 }; // Position behind player's starting position
const BENCH_ROTATION = Math.PI; // Rotate to face the player
const BENCH_INTERACTION_DISTANCE = 2.0; // Distance at which player can interact with bench
let weaponBench = null; // Reference to the bench object
let isPlayerNearBench = false; // Track if player is near bench
let benchInteractionMessage = null; // UI element for interaction prompt

// Initialize the weapon bench
function initWeaponBench() {
    console.log("Initializing weapon bench...");
    
    // Create the bench model
    createWeaponBench();
    
    // Create interaction message (hidden initially)
    createBenchInteractionMessage();
    
    // Make bench globally accessible
    window.weaponBench = weaponBench;
    window.isPlayerNearBench = isPlayerNearBench;
    
    console.log("Weapon bench initialized at position:", BENCH_POSITION);
}

// Create the weapon bench model
function createWeaponBench() {
    // Create a group for the bench
    const benchGroup = new THREE.Group();
    
    // Use the existing wood texture function from main.js
    const woodTexture = window.createWoodTexture ? window.createWoodTexture() : null;
    
    // Create bench top
    const benchTopGeo = new THREE.BoxGeometry(2.5, 0.1, 1);
    const benchTopMat = new THREE.MeshPhongMaterial({ 
        color: 0x8B4513, // Brown
        map: woodTexture,
        shininess: 10
    });
    const benchTop = new THREE.Mesh(benchTopGeo, benchTopMat);
    benchTop.position.y = 0.8; // Height of bench
    benchTop.castShadow = true;
    benchTop.receiveShadow = true;
    benchGroup.add(benchTop);
    
    // Create bench legs
    const legGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
    const legMat = new THREE.MeshPhongMaterial({ 
        color: 0x8B4513, // Brown
        map: woodTexture,
        shininess: 10
    });
    
    // Front left leg
    const frontLeftLeg = new THREE.Mesh(legGeo, legMat);
    frontLeftLeg.position.set(-1.1, 0.4, 0.4);
    frontLeftLeg.castShadow = true;
    frontLeftLeg.receiveShadow = true;
    benchGroup.add(frontLeftLeg);
    
    // Front right leg
    const frontRightLeg = new THREE.Mesh(legGeo, legMat);
    frontRightLeg.position.set(1.1, 0.4, 0.4);
    frontRightLeg.castShadow = true;
    frontRightLeg.receiveShadow = true;
    benchGroup.add(frontRightLeg);
    
    // Back left leg
    const backLeftLeg = new THREE.Mesh(legGeo, legMat);
    backLeftLeg.position.set(-1.1, 0.4, -0.4);
    backLeftLeg.castShadow = true;
    backLeftLeg.receiveShadow = true;
    benchGroup.add(backLeftLeg);
    
    // Back right leg
    const backRightLeg = new THREE.Mesh(legGeo, legMat);
    backRightLeg.position.set(1.1, 0.4, -0.4);
    backRightLeg.castShadow = true;
    backRightLeg.receiveShadow = true;
    benchGroup.add(backRightLeg);
    
    // Add a weapon display on the bench
    addWeaponDisplay(benchGroup);
    
    // Add lights to the bench
    addBenchLights(benchGroup);
    
    // Position and rotate the bench
    benchGroup.position.set(BENCH_POSITION.x, BENCH_POSITION.y, BENCH_POSITION.z);
    benchGroup.rotation.y = BENCH_ROTATION;
    
    // Add to scene
    scene.add(benchGroup);
    
    // Add collision data
    benchGroup.userData = {
        isCollidable: true,
        radius: 1.5, // Collision radius
        isBench: true // Flag to identify as bench
    };
    
    // Add to environment objects
    window.environmentObjects.push(benchGroup);
    
    // Store reference to bench
    weaponBench = benchGroup;
}

// Add lights to the bench to make it more noticeable
function addBenchLights(benchGroup) {
    // Add a spotlight above the bench
    const spotLight = new THREE.SpotLight(0x00ffff, 1.5);
    spotLight.position.set(0, 2.5, 0);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.3;
    spotLight.decay = 1.5;
    spotLight.distance = 6;
    spotLight.castShadow = true;
    
    // Configure shadow properties
    spotLight.shadow.mapSize.width = 512;
    spotLight.shadow.mapSize.height = 512;
    spotLight.shadow.camera.near = 0.5;
    spotLight.shadow.camera.far = 10;
    
    // Add spotlight to bench group
    benchGroup.add(spotLight);
    
    // Add a point light for ambient glow
    const pointLight = new THREE.PointLight(0x00ffff, 0.8, 3);
    pointLight.position.set(0, 1, 0);
    benchGroup.add(pointLight);
    
    // Add small glowing orbs around the bench
    const orbGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const orbMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
    });
    
    // Create 4 orbs at the corners
    const orbPositions = [
        [-1.2, 0.9, 0.5],
        [1.2, 0.9, 0.5],
        [-1.2, 0.9, -0.5],
        [1.2, 0.9, -0.5]
    ];
    
    orbPositions.forEach((pos, index) => {
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.set(pos[0], pos[1], pos[2]);
        
        // Add animation data
        orb.userData = {
            originalY: pos[1],
            phase: index * Math.PI / 2, // Different starting phase for each orb
            glowIntensity: 0
        };
        
        benchGroup.add(orb);
    });
}

// Add a weapon display to the bench
function addWeaponDisplay(benchGroup) {
    // Create a simple gun model on the bench
    const gunGroup = new THREE.Group();
    
    // Gun barrel
    const barrelGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
    const barrelMat = new THREE.MeshPhongMaterial({ 
        color: 0x333333, // Dark gray
        shininess: 80,
        metalness: 0.8
    });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2; // Rotate to horizontal
    barrel.position.z = 0.25;
    gunGroup.add(barrel);
    
    // Gun handle
    const handleGeo = new THREE.BoxGeometry(0.08, 0.15, 0.04);
    const handleMat = new THREE.MeshPhongMaterial({ 
        color: 0x8B4513, // Brown
        shininess: 10
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, -0.1, 0);
    gunGroup.add(handle);
    
    // Gun body
    const bodyGeo = new THREE.BoxGeometry(0.1, 0.08, 0.3);
    const bodyMat = new THREE.MeshPhongMaterial({ 
        color: 0x333333, // Dark gray
        shininess: 80,
        metalness: 0.8
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0, 0.1);
    gunGroup.add(body);
    
    // Position the gun on the bench
    gunGroup.position.set(0, 0.85, 0); // Slightly above bench top
    gunGroup.rotation.y = Math.PI / 4; // Angled slightly
    
    // Add glow effect to make it more noticeable
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff, // Cyan
        transparent: true,
        opacity: 0.4
    });
    
    const glowSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        glowMat
    );
    glowSphere.position.set(0, 0, 0);
    gunGroup.add(glowSphere);
    
    // Add pulsing animation
    gunGroup.userData = {
        glowSphere: glowSphere,
        originalScale: 0.3,
        pulseTime: 0
    };
    
    // Add to bench group
    benchGroup.add(gunGroup);
    benchGroup.userData.gunDisplay = gunGroup;
}

// Create interaction message UI element (hidden for now, will be used in the future)
function createBenchInteractionMessage() {
    // Create message element but don't show it yet
    benchInteractionMessage = document.createElement('div');
    benchInteractionMessage.id = 'bench-interaction';
    benchInteractionMessage.className = 'interaction-message';
    benchInteractionMessage.textContent = 'Weapon Bench';
    benchInteractionMessage.style.display = 'none';
    
    // Add to UI
    document.body.appendChild(benchInteractionMessage);
}

// Update bench state
function updateBench() {
    if (!weaponBench || !camera) return;
    
    // Check if player is near bench
    const distanceToBench = camera.position.distanceTo(weaponBench.position);
    const wasNearBench = isPlayerNearBench;
    isPlayerNearBench = distanceToBench < BENCH_INTERACTION_DISTANCE;
    
    // Update interaction message visibility
    if (isPlayerNearBench && !wasNearBench) {
        // Player just entered interaction range
        showBenchInteractionMessage();
    } else if (!isPlayerNearBench && wasNearBench) {
        // Player just left interaction range
        hideBenchInteractionMessage();
    }
    
    // Animate gun display
    if (weaponBench.userData.gunDisplay) {
        const gunDisplay = weaponBench.userData.gunDisplay;
        const glowSphere = gunDisplay.userData.glowSphere;
        
        // Update pulse animation
        gunDisplay.userData.pulseTime += 0.05;
        const pulseFactor = 1 + 0.2 * Math.sin(gunDisplay.userData.pulseTime);
        
        // Apply pulse to glow sphere
        glowSphere.scale.set(pulseFactor, pulseFactor, pulseFactor);
    }
    
    // Animate orb lights
    weaponBench.children.forEach(child => {
        // Check if this is one of our orb lights
        if (child.geometry && child.geometry.type === 'SphereGeometry' && 
            child.geometry.parameters.radius === 0.1) {
            
            // Update orb animation
            child.userData.phase += 0.03;
            const newY = child.userData.originalY + Math.sin(child.userData.phase) * 0.1;
            child.position.y = newY;
            
            // Update glow intensity
            child.userData.glowIntensity = 0.5 + 0.5 * Math.sin(child.userData.phase);
            child.material.opacity = 0.5 + 0.3 * child.userData.glowIntensity;
        }
    });
}

// Show bench interaction message
function showBenchInteractionMessage() {
    if (benchInteractionMessage) {
        benchInteractionMessage.style.display = 'block';
    }
}

// Hide bench interaction message
function hideBenchInteractionMessage() {
    if (benchInteractionMessage) {
        benchInteractionMessage.style.display = 'none';
    }
}

// Note: The weapon collection functionality is removed for now
// It will be implemented in the future 