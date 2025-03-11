// main.js - Main game setup and loop

// Game state variables
let scene, camera, renderer;
let floor, arena;
let clock;
let gameActive = false;
let score = 0;
let health = 100;
let sun, skybox;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.7; // Player height
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    
    // Create lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(10, 10, 10);
    sunLight.castShadow = true;
    scene.add(sunLight);
    
    // Initialize environment first
    window.environmentObjects = [];
    createEnvironment();
    
    // Initialize game systems
    initPlayer();
    initEnemies();
    initUI();
    initAudio();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize, false);
    
    // Start game loop
    animate();

    
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

// Create sun
function createSun() {
    // Create a sun (directional light)
    sun = new THREE.DirectionalLight(0xffffcc, 1);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    
    // Configure shadow properties
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 500;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    
    scene.add(sun);
    
    // Add ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    // Create a visual representation of the sun
    const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunMesh.position.copy(sun.position);
    scene.add(sunMesh);
}

// Create ground
function createGround() {
    // Create a large ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200, 20, 20);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x556B2F, // Dark olive green for grass
        side: THREE.DoubleSide
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
        const wallMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        
        // Position wall
        wall.position.set((x1 + x2) / 2, wallHeight / 2, (z1 + z2) / 2);
        
        // Rotate wall to face center
        wall.lookAt(new THREE.Vector3(0, wall.position.y, 0));
        
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
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    
    const leavesGeo = new THREE.ConeGeometry(1, 3, 8);
    const leavesMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 2.5;
    
    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(leaves);
    
    tree.position.set(x, y + 1, z);
    
    // Add collision data with larger radius
    tree.userData = {
        isCollidable: true,
        radius: 2.0  // Increased from 1.0
    };
    
    scene.add(tree);
    window.environmentObjects.push(tree);
}

// Create a rock
function createRock(x, y, z) {
    const size = Math.random() * 0.5 + 0.5;
    const rockGeo = new THREE.DodecahedronGeometry(size);
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    
    rock.position.set(x, y + size / 2, z);
    rock.rotation.y = Math.random() * Math.PI * 2;
    rock.rotation.z = Math.random() * 0.5 - 0.25;
    
    // Add collision data with larger radius
    rock.userData = {
        isCollidable: true,
        radius: size * 3.0  // Increased from size
    };
    
    scene.add(rock);
    window.environmentObjects.push(rock);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Main game loop
function animate() {
    requestAnimationFrame(animate);
    
    if (gameActive) {
        // Update player movement and shooting
        updatePlayer();
        
        // Update enemies
        updateEnemies();
        
        // Check game state (health, score)
        updateGameState();
    }
    
    // Render the scene
    renderer.render(scene, camera);
}

// Start the game
function startGame() {
    // Request pointer lock
    document.body.requestPointerLock();
    
    // Hide start screen
    document.getElementById('start-screen').style.display = 'none';
    
    // Reset game state
    score = 0;
    health = 3;
    gameActive = true;
    
    // Clear any existing enemies
    clearEnemies();
    
    // Start spawning enemies
    startEnemySpawner();
    
    // Update UI
    updateUI();
}

// End the game
function endGame() {
    gameActive = false;
    
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