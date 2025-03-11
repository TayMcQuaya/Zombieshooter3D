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
    // Set up renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    
    // Create the scene
    scene = new THREE.Scene();
    
    // Create the camera (player's view)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 0); // Player height
    
    // Add a crosshair
    const crosshair = document.createElement('div');
    crosshair.className = 'crosshair';
    document.body.appendChild(crosshair);
    
    // Create the realistic environment
    createEnvironment();
    
    // Set up the clock for timing
    clock = new THREE.Clock();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
    
    // Lock pointer for FPS controls
    document.addEventListener('click', () => {
        if (!gameActive) return;
        document.body.requestPointerLock();
    });
    
    // Initialize player, enemies, and UI
    initPlayer();
    initEnemies();
    initUI();
    initAudio();
}

// Create a realistic environment with skybox and terrain
function createEnvironment() {
    // Create skybox
    createSkybox();
    
    // Create sun
    createSun();
    
    // Create ground
    createGround();
    
    // Add some environmental objects
    addEnvironmentalObjects();
}

// Create a skybox
function createSkybox() {
    const skyboxGeometry = new THREE.BoxGeometry(500, 500, 500);
    const skyboxMaterials = [
        new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB, // Sky blue
            side: THREE.BackSide 
        }),
        new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB, 
            side: THREE.BackSide 
        }),
        new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB, 
            side: THREE.BackSide 
        }),
        new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB, 
            side: THREE.BackSide 
        }),
        new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB, 
            side: THREE.BackSide 
        }),
        new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB, 
            side: THREE.BackSide 
        })
    ];
    
    skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
    scene.add(skybox);
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

// Create arena boundaries (invisible walls)
function createArenaBoundaries() {
    const arenaSize = 50;
    const wallHeight = 5;
    const wallGeometry = new THREE.BoxGeometry(1, wallHeight, arenaSize);
    const wallMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x8B4513, // Saddle brown for wooden fence
        transparent: false,
        opacity: 0.7
    });
    
    // North wall
    const northWall = new THREE.Mesh(wallGeometry, wallMaterial);
    northWall.position.set(0, wallHeight / 2, -arenaSize / 2);
    northWall.rotation.y = Math.PI / 2;
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    scene.add(northWall);
    
    // South wall
    const southWall = new THREE.Mesh(wallGeometry, wallMaterial);
    southWall.position.set(0, wallHeight / 2, arenaSize / 2);
    southWall.rotation.y = Math.PI / 2;
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    scene.add(southWall);
    
    // East wall
    const eastWall = new THREE.Mesh(wallGeometry, wallMaterial);
    eastWall.position.set(arenaSize / 2, wallHeight / 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);
    
    // West wall
    const westWall = new THREE.Mesh(wallGeometry, wallMaterial);
    westWall.position.set(-arenaSize / 2, wallHeight / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    scene.add(westWall);
}

// Add environmental objects like trees and rocks
function addEnvironmentalObjects() {
    // Add trees
    for (let i = 0; i < 20; i++) {
        createTree(
            Math.random() * 100 - 50,
            0,
            Math.random() * 100 - 50
        );
    }
    
    // Add rocks
    for (let i = 0; i < 15; i++) {
        createRock(
            Math.random() * 80 - 40,
            0,
            Math.random() * 80 - 40
        );
    }
}

// Create a simple tree
function createTree(x, y, z) {
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, y + 2.5, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);
    
    // Tree foliage
    const foliageGeometry = new THREE.ConeGeometry(3, 6, 8);
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // Forest green
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(x, y + 7, z);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    scene.add(foliage);
}

// Create a simple rock
function createRock(x, y, z) {
    const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 1 + 0.5, 0);
    const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 }); // Gray
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, y + 0.5, z);
    rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
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
    if (!gameActive) {
        // Hide start screen if it exists
        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            startScreen.style.display = 'none';
        }
        
        // Request pointer lock
        document.body.requestPointerLock();
        
        gameActive = true;
        score = 0;
        health = 100;
        updateUI();
        startEnemySpawner();
    }
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
    animate();
    
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