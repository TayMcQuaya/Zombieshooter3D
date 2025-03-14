// main.js - Main game setup and loop

// Game state variables
let scene, camera, renderer;
let floor, arena;
let clock;
let gameActive = false;
let gamePaused = false; // New variable to track pause state
let score = 0;
let zombieKills = 0; // New variable to track zombie kills
let health = 100;
let sun, skybox;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    // Create camera with a closer near clipping plane to see the weapon
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.position.y = 1.7; // Player height
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    renderer.outputEncoding = THREE.sRGBEncoding; // Better color representation
    renderer.gammaFactor = 2.2; // Standard gamma correction
    renderer.physicallyCorrectLights = true; // More realistic lighting
    document.body.appendChild(renderer.domElement);
    
    // Expose camera and renderer to global scope for debugging
    window.camera = camera;
    window.renderer = renderer;
    window.scene = scene;
    window.zombieKills = zombieKills; // Make zombieKills globally accessible
    
    // Initialize environment first (which will set up lighting)
    window.environmentObjects = [];
    createEnvironment();
    
    // Initialize game systems
    initPlayer();
    initEnemies();
    initUI();
    initAudio();
    
    // Initialize pause menu
    initPauseMenu();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', handleKeyDown, false); // Add keydown listener for pause
    
    // Make updateScore function globally accessible
    window.updateScore = updateScore;
    window.updateZombieKills = updateZombieKills;
    
    // Start game loop
    animate();
}

// Function to update the score when zombies are killed
function updateScore(points) {
    // Increase the score
    score += points;
    
    // Update the score display in the UI
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = score;
    }
    
    console.log("Score updated: " + score);
}

// Function to update the zombie kill count
function updateZombieKills() {
    // Increase the zombie kill count
    zombieKills++;
    
    // Update the zombie kill count display in the UI
    const zombieKillsElement = document.getElementById('zombie-kills');
    if (zombieKillsElement) {
        zombieKillsElement.textContent = zombieKills;
    }
    
    console.log("Zombie kills updated: " + zombieKills);
}

// Create a realistic environment with skybox and terrain
function createEnvironment() {
    console.log("Creating environment from main.js");
    
    // Ensure environmentObjects array is initialized
    window.environmentObjects = [];
    
    // Create skybox
    createSkybox();
    
    // Create sun
    createSun();
    
    // Create ground
    createGround();
    
    // Create arena boundaries (walls)
    createArenaBoundaries();
    
    // Add some environmental objects
    addEnvironmentalObjects();
    
    console.log("Environment created with", window.environmentObjects.length, "objects");
}

// Create a skybox
function createSkybox() {
    // Create a blue sky background
    scene.background = new THREE.Color(0x87CEEB);
    
    // Add clouds
    createClouds();
    
    console.log("Skybox created");
}

// Create clouds
function createClouds() {
    const cloudCount = 20;
    
    // Create cloud texture using canvas
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 128;
    cloudCanvas.height = 128;
    const ctx = cloudCanvas.getContext('2d');
    
    // Draw cloud
    ctx.fillStyle = 'rgba(255, 255, 255, 0)';
    ctx.fillRect(0, 0, 128, 128);
    
    // Draw cloud puffs
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(64, 64, 32, 0, Math.PI * 2);
    ctx.arc(45, 50, 25, 0, Math.PI * 2);
    ctx.arc(85, 55, 23, 0, Math.PI * 2);
    ctx.arc(40, 75, 20, 0, Math.PI * 2);
    ctx.arc(85, 80, 22, 0, Math.PI * 2);
    ctx.fill();
    
    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    
    for (let i = 0; i < cloudCount; i++) {
        // Create cloud sprite
        const cloudMaterial = new THREE.SpriteMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.8
        });
        
        const cloud = new THREE.Sprite(cloudMaterial);
        
        // Random position in sky
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 30 + 30; // Between 30 and 60 units from center
        const height = Math.random() * 20 + 20; // Between 20 and 40 units high
        
        cloud.position.set(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );
        
        // Random scale
        const scale = Math.random() * 10 + 10;
        cloud.scale.set(scale, scale, 1);
        
        scene.add(cloud);
    }
    
    console.log("Clouds created");
}

// Create sun and lighting
function createSun() {
    // Create a main directional light (sun)
    sun = new THREE.DirectionalLight(0xffffcc, 0.8);
    sun.position.set(0, 100, 0); // Position directly overhead for more even lighting
    sun.castShadow = true;
    
    // Configure shadow properties for better quality
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 500;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    
    // Add a helper to visualize the light's shadow camera (useful for debugging)
    // const helper = new THREE.CameraHelper(sun.shadow.camera);
    // scene.add(helper);
    
    scene.add(sun);
    
    // Add hemisphere light for more natural outdoor lighting
    // This light gradually changes from sky color to ground color
    const hemisphereLight = new THREE.HemisphereLight(
        0x87CEEB, // Sky color (light blue)
        0x556B2F, // Ground color (dark olive green)
        0.6       // Intensity
    );
    scene.add(hemisphereLight);
    
    // Add ambient light for general illumination (fill light)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    
    // Add a secondary directional light from a different angle to reduce harsh shadows
    const secondaryLight = new THREE.DirectionalLight(0xffffee, 0.3);
    secondaryLight.position.set(-50, 50, -50); // Coming from the opposite direction
    scene.add(secondaryLight);
    
    // Create a visual representation of the sun
    const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunMesh.position.copy(sun.position);
    scene.add(sunMesh);
    
    console.log("Enhanced lighting system created");
}

// Create ground
function createGround() {
    // Create a large ground plane with more segments for better lighting
    const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    
    // Create grass texture
    const grassTexture = createGrassTexture();
    
    // Create a more realistic ground material with texture
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff, // Use white as base color to show texture properly
        specular: 0x111111, // Low specular highlights
        shininess: 5, // Very low shininess
        side: THREE.DoubleSide,
        map: grassTexture // Apply grass texture
    });
    
    floor = new THREE.Mesh(groundGeometry, groundMaterial);
    floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Create arena boundaries (invisible walls)
    createArenaBoundaries();
}

// Create arena boundaries
function createArenaBoundaries() {
    const radius = 25;
    const wallHeight = 3;
    const segments = 20;
    
    // Create a texture for the walls to add more detail
    const wallTexture = createWoodTexture();
    
    for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        const x1 = Math.cos(angle1) * radius;
        const z1 = Math.sin(angle1) * radius;
        const x2 = Math.cos(angle2) * radius;
        const z2 = Math.sin(angle2) * radius;
        
        // Calculate wall dimensions
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));
        const wallGeo = new THREE.BoxGeometry(length, wallHeight, 0.5);
        
        // Use PhongMaterial for better lighting response
        const wallMat = new THREE.MeshPhongMaterial({ 
            color: 0x8B4513, // Saddle brown
            specular: 0x222222,
            shininess: 10,
            map: wallTexture
        });
        
        const wall = new THREE.Mesh(wallGeo, wallMat);
        
        // Position wall
        wall.position.set((x1 + x2) / 2, wallHeight / 2, (z1 + z2) / 2);
        
        // Rotate wall to face center
        wall.lookAt(new THREE.Vector3(0, wall.position.y, 0));
        
        // Enable shadows
        wall.castShadow = true;
        wall.receiveShadow = true;
        
        // Add to scene
        scene.add(wall);
        
        // Add collision data - use a larger radius for walls
        wall.userData = {
            isCollidable: true,
            radius: 2.0  // Much larger radius for walls
        };
        
        // Add to environment objects
        window.environmentObjects.push(wall);
    }
    
    console.log("Arena boundaries created:", segments, "walls");
}

// Add environmental objects
function addEnvironmentalObjects() {
    // Add trees
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 15 + 5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        createTree(x, 0, z);
    }
    
    // Add rocks
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 15 + 5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        createRock(x, 0, z);
    }
    
    console.log("Environmental objects added");
}

// Create a tree
function createTree(x, y, z) {
    // Create bark texture for trunk
    const barkTexture = createBarkTexture();
    
    // Create leaf texture for foliage
    const leafTexture = createLeafTexture();
    
    // Create trunk with bark texture
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 8, 1);
    const trunkMat = new THREE.MeshPhongMaterial({ 
        color: 0xffffff, 
        map: barkTexture,
        shininess: 5
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    
    // Create leaves with leaf texture
    const leavesGeo = new THREE.ConeGeometry(1, 3, 8);
    const leavesMat = new THREE.MeshPhongMaterial({ 
        color: 0xffffff, 
        map: leafTexture,
        shininess: 10,
        specular: 0x004400
    });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 2.5;
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    
    // Add some randomness to the tree
    trunk.rotation.y = Math.random() * Math.PI;
    leaves.rotation.y = Math.random() * Math.PI;
    
    // Slightly tilt the tree for natural look
    const tiltAngle = Math.random() * 0.2 - 0.1;
    trunk.rotation.x = tiltAngle;
    trunk.rotation.z = tiltAngle;
    
    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(leaves);
    
    tree.position.set(x, y + 1, z);
    
    // Add collision data with more accurate radius
    tree.userData = {
        isCollidable: true,
        radius: 0.8  // Reduced from 2.0 to be closer to visual size
    };
    
    scene.add(tree);
    window.environmentObjects.push(tree);
}

// Create a rock
function createRock(x, y, z) {
    // Create rock texture
    const rockTexture = createRockTexture();
    
    const size = Math.random() * 0.5 + 0.5;
    const rockGeo = new THREE.DodecahedronGeometry(size);
    const rockMat = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        map: rockTexture,
        shininess: 30,
        specular: 0x333333,
        bumpMap: rockTexture,
        bumpScale: 0.05
    });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    
    rock.position.set(x, y + size / 2, z);
    rock.rotation.y = Math.random() * Math.PI * 2;
    rock.rotation.z = Math.random() * 0.5 - 0.25;
    
    // Add some random scaling to make rocks look more varied
    const scaleX = 0.8 + Math.random() * 0.4;
    const scaleY = 0.8 + Math.random() * 0.4;
    const scaleZ = 0.8 + Math.random() * 0.4;
    rock.scale.set(scaleX, scaleY, scaleZ);
    
    // Enable shadows
    rock.castShadow = true;
    rock.receiveShadow = true;
    
    // Add collision data with proper radius
    rock.userData = {
        isCollidable: true,
        radius: size * 1.2  // Increased from 0.8 to ensure collisions work
    };
    
    scene.add(rock);
    window.environmentObjects.push(rock);
    
    // Debug log to verify rock is added to environment objects
    console.log("Created rock with radius:", size * 1.2, "at position:", x, y, z);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle key down events for game control
function handleKeyDown(event) {
    // Check for Escape key to pause only (not unpause)
    if (event.key === 'Escape' && gameActive && !gamePaused) {
        togglePause();
    }
    
    // Toggle controls display with H key
    if (event.key.toLowerCase() === 'h' && gameActive) {
        const controlsDisplay = document.getElementById('controls-display');
        if (controlsDisplay) {
            controlsDisplay.classList.toggle('visible');
        }
    }
}

// Toggle game pause state
function togglePause() {
    // Only allow pausing if the game is active
    if (!gameActive) return;
    
    gamePaused = !gamePaused;
    console.log("Game pause toggled:", gamePaused);
    
    if (gamePaused) {
        // Pause the game
        document.exitPointerLock();
        document.body.classList.remove('game-active');
        showPauseMenu();
        if (typeof pauseBackgroundMusic === 'function') {
            pauseBackgroundMusic();
        }
    } else {
        // Resume the game
        hidePauseMenu();
        document.body.classList.add('game-active');
        document.body.requestPointerLock();
        if (typeof resumeBackgroundMusic === 'function') {
            resumeBackgroundMusic();
        }
    }
}

function showPauseMenu() {
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) {
        pauseMenu.style.display = 'block';
    }
}

function hidePauseMenu() {
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) {
        pauseMenu.style.display = 'none';
    }
}

// Initialize pause menu event listeners
function initPauseMenu() {
    const resumeButton = document.getElementById('resume-button');
    if (resumeButton) {
        resumeButton.addEventListener('click', () => {
            gamePaused = false;
            hidePauseMenu();
            document.body.classList.add('game-active');
            document.body.requestPointerLock();
            if (typeof resumeBackgroundMusic === 'function') {
                resumeBackgroundMusic();
            }
        });
    }
    
    const quitButton = document.getElementById('quit-button');
    if (quitButton) {
        quitButton.addEventListener('click', () => {
            location.reload();
        });
    }
}

// Animate loop
function animate() {
    // Request next frame
    requestAnimationFrame(animate);
    
    // Skip updates if game is not active or is paused
    if (!gameActive || gamePaused) {
        renderer.render(scene, camera);
        return;
    }
    
    // Check if weapon model exists and create it if not
    if (gameActive && typeof createWeaponModel === 'function' && camera.children.length === 0) {
        console.log("No weapon model found, creating one");
        createWeaponModel();
    }
    
    // Update player movement and shooting
    updatePlayer();
    
    // Update enemies
    updateEnemies();
    
    // Check game state (health, score)
    updateGameState();
    
    // Render scene
    renderer.render(scene, camera);
}

// Start the game
function startGame() {
    // Set game as active
    gameActive = true;
    gamePaused = false; // Ensure game starts unpaused
    
    // Add game-active class to body
    document.body.classList.add('game-active');
    
    // Show controls display by default when game starts
    const controlsDisplay = document.getElementById('controls-display');
    if (controlsDisplay) {
        controlsDisplay.classList.add('visible');
    }
    
    // Hide start screen
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.style.display = 'none';
    }
    
    // Reset game state
    score = 0;
    zombieKills = 0; // Reset zombie kills
    health = 3;
    
    // Update UI
    if (typeof updateUI === 'function') {
        updateUI();
    }
    
    // Ensure weapon is created
    if (typeof createWeaponModel === 'function') {
        createWeaponModel();
    }
    
    // Start enemy spawner
    if (typeof startEnemySpawner === 'function') {
        startEnemySpawner();
    }
    
    // Play background music
    if (typeof playBackgroundMusic === 'function') {
        playBackgroundMusic();
    }
    
    // Request pointer lock for mouse control
    document.body.requestPointerLock();
    
    console.log("Game started, active:", gameActive, "paused:", gamePaused);
}

// End the game
function endGame() {
    gameActive = false;
    document.body.classList.remove('game-active');
    
    // Stop enemy spawner
    stopEnemySpawner();
    
    // Show game over screen
    const gameOverScreen = document.getElementById('game-over');
    if (gameOverScreen) {
        const finalScore = document.getElementById('final-score');
        if (finalScore) finalScore.textContent = score;
        gameOverScreen.style.display = 'block';
    }
    
    // Show start screen
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.style.display = 'block';
    }
    
    // Release pointer lock
    document.exitPointerLock();
}

// Update game state
function updateGameState() {
    // Check if player is dead
    if (health <= 0) {
        endGame();
    }
}

// Create a procedural wood texture
function createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Fill with base wood color
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, 256, 256);
    
    // Add wood grain
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * 256;
        const y = 0;
        const width = 1 + Math.random() * 3;
        const height = 256;
        
        // Randomize grain color slightly
        const colorValue = 139 + Math.floor(Math.random() * 30 - 15);
        ctx.fillStyle = `rgb(${colorValue}, ${Math.floor(colorValue/2)}, 19)`;
        ctx.fillRect(x, y, width, height);
    }
    
    // Add some knots
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const radius = 3 + Math.random() * 7;
        
        // Draw knot
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#3D2B1F';
        ctx.fill();
        
        // Add highlight
        ctx.beginPath();
        ctx.arc(x - radius/3, y - radius/3, radius/3, 0, Math.PI * 2);
        ctx.fillStyle = '#A67D5D';
        ctx.fill();
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    
    return texture;
}

// Create a procedural grass texture
function createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Fill with base grass color
    ctx.fillStyle = '#3A5F0B';
    ctx.fillRect(0, 0, 256, 256);
    
    // Add darker patches for depth
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = 10 + Math.random() * 40;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(40, 70, 10, ${Math.random() * 0.3})`;
        ctx.fill();
    }
    
    // Add lighter patches for highlights
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = 5 + Math.random() * 20;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120, 180, 60, ${Math.random() * 0.3})`;
        ctx.fill();
    }
    
    // Add individual grass blades
    for (let i = 0; i < 1000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const length = 2 + Math.random() * 4;
        const width = 1 + Math.random();
        const angle = Math.random() * Math.PI;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        // Draw a single grass blade
        ctx.fillStyle = `rgb(${70 + Math.random() * 60}, ${120 + Math.random() * 60}, ${20 + Math.random() * 40})`;
        ctx.fillRect(-width/2, -length/2, width, length);
        
        ctx.restore();
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8); // Repeat the texture to avoid it looking too stretched
    
    return texture;
}

// Create a procedural rock texture
function createRockTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Fill with base rock color
    ctx.fillStyle = '#707070';
    ctx.fillRect(0, 0, 256, 256);
    
    // Add noise for rock texture
    const noiseData = createNoiseData(256, 256);
    
    // Apply noise to create rock texture
    const imageData = ctx.getImageData(0, 0, 256, 256);
    const data = imageData.data;
    
    for (let y = 0; y < 256; y++) {
        for (let x = 0; x < 256; x++) {
            const index = (y * 256 + x) * 4;
            const noise = noiseData[y * 256 + x];
            
            // Base gray color with noise variation
            const value = 112 + noise * 40;
            data[index] = value;     // R
            data[index + 1] = value; // G
            data[index + 2] = value; // B
            data[index + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Add cracks
    for (let i = 0; i < 10; i++) {
        const startX = Math.random() * 256;
        const startY = Math.random() * 256;
        let x = startX;
        let y = startY;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        // Create a jagged line for the crack
        const points = 5 + Math.floor(Math.random() * 10);
        for (let j = 0; j < points; j++) {
            x += (Math.random() * 30) - 15;
            y += (Math.random() * 30) - 15;
            ctx.lineTo(x, y);
        }
        
        ctx.strokeStyle = `rgba(40, 40, 40, ${0.3 + Math.random() * 0.5})`;
        ctx.lineWidth = 1 + Math.random();
        ctx.stroke();
    }
    
    // Add some highlights
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = 2 + Math.random() * 5;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 200, 200, ${Math.random() * 0.2})`;
        ctx.fill();
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    
    return texture;
}

// Helper function to create noise data
function createNoiseData(width, height) {
    const data = new Array(width * height);
    
    // Initialize with random values
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.random();
    }
    
    // Simple blur to create coherent noise
    const blurredData = new Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0;
            let count = 0;
            
            // Sample 3x3 neighborhood
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        sum += data[ny * width + nx];
                        count++;
                    }
                }
            }
            
            blurredData[y * width + x] = sum / count;
        }
    }
    
    return blurredData;
}

// Create a procedural tree bark texture
function createBarkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Fill with base bark color
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(0, 0, 256, 256);
    
    // Add vertical grain lines
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * 256;
        const width = 1 + Math.random() * 3;
        const height = 256;
        
        // Randomize grain color slightly
        const colorValue = 93 + Math.floor(Math.random() * 20 - 10);
        ctx.fillStyle = `rgb(${colorValue}, ${Math.floor(colorValue * 0.7)}, ${Math.floor(colorValue * 0.5)})`;
        ctx.fillRect(x, 0, width, height);
    }
    
    // Add horizontal cracks
    for (let i = 0; i < 30; i++) {
        const y = Math.random() * 256;
        const startX = Math.random() * 50;
        const width = 150 + Math.random() * 100;
        const height = 1 + Math.random() * 2;
        
        ctx.fillStyle = `rgba(30, 20, 10, ${0.3 + Math.random() * 0.5})`;
        ctx.fillRect(startX, y, width, height);
    }
    
    // Add knots
    for (let i = 0; i < 3; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const radius = 5 + Math.random() * 15;
        
        // Draw knot base
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#3E2723';
        ctx.fill();
        
        // Draw knot rings
        for (let j = 0; j < 3; j++) {
            const ringRadius = radius * (0.8 - j * 0.2);
            ctx.beginPath();
            ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(80, 50, 30, ${0.5 + Math.random() * 0.5})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // Add highlight
        ctx.beginPath();
        ctx.arc(x - radius/3, y - radius/3, radius/4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(120, 80, 60, 0.5)';
        ctx.fill();
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 2); // Repeat vertically for tree trunks
    
    return texture;
}

// Create a procedural leaf texture for tree foliage
function createLeafTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Fill with base leaf color
    ctx.fillStyle = '#2E7D32'; // Dark green
    ctx.fillRect(0, 0, 256, 256);
    
    // Add texture and variation
    const noiseData = createNoiseData(256, 256);
    
    // Apply noise to create leaf texture
    const imageData = ctx.getImageData(0, 0, 256, 256);
    const data = imageData.data;
    
    for (let y = 0; y < 256; y++) {
        for (let x = 0; x < 256; x++) {
            const index = (y * 256 + x) * 4;
            const noise = noiseData[y * 256 + x];
            
            // Vary the green color based on noise
            data[index] = 30 + noise * 40;     // R
            data[index + 1] = 125 + noise * 60; // G
            data[index + 2] = 30 + noise * 20;  // B
            data[index + 3] = 255;              // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Add leaf veins
    for (let i = 0; i < 20; i++) {
        const startX = 128;
        const startY = 128 + (Math.random() * 100 - 50);
        let x = startX;
        let y = startY;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        // Create a curved line for the vein
        const endX = Math.random() < 0.5 ? 0 : 256;
        const endY = startY + (Math.random() * 60 - 30);
        
        // Control points for curve
        const cpX = (startX + endX) / 2;
        const cpY = startY + (Math.random() * 40 - 20);
        
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        
        ctx.strokeStyle = `rgba(40, 100, 40, ${0.2 + Math.random() * 0.3})`;
        ctx.lineWidth = 1 + Math.random();
        ctx.stroke();
    }
    
    // Add some highlights to simulate light reflection
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = 2 + Math.random() * 5;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 255, 180, ${Math.random() * 0.2})`;
        ctx.fill();
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    
    return texture;
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    init();
    
    // Set up start button
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', startGame);
    }
    
    // Set up play again button
    const playAgainButton = document.getElementById('play-again');
    if (playAgainButton) {
        playAgainButton.addEventListener('click', () => {
            const gameOverScreen = document.getElementById('game-over');
            if (gameOverScreen) {
                gameOverScreen.style.display = 'none';
            }
            startGame();
        });
    }
    
    // Set up share score button
    document.getElementById('share-score').addEventListener('click', () => {
        const url = `${window.location.href.split('?')[0]}?score=${score}`;
        window.open(`https://twitter.com/intent/tweet?text=I killed ${score} zombies in Zombie Survival! Can you survive longer? Try it: ${url}`);
    });
}); 