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
    scene.background = new THREE.Color(0x050A14); // Darker night sky color
    
    // We'll add custom ground fog later, so don't add fog here
    // scene.fog = new THREE.Fog(0x0A0E1A, 10, 70); // Linear fog with near=10, far=70
    
    // Create camera with a SUPER close near clipping plane to see the weapon
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.0001, 1000); // Wider FOV (90 instead of 75) and closer near plane
    camera.position.y = 1.7; // Player height
    
    // Force the camera to render child objects
    camera.matrixAutoUpdate = true;
    
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
    
    // Add atmospheric effects
    addAtmosphericEffects();
    
    console.log("Environment created with", window.environmentObjects.length, "objects");
}

// Create a skybox
function createSkybox() {
    // Create a dark night sky background - darker for better star visibility
    scene.background = new THREE.Color(0x020508); // Very dark blue/black night sky
    
    // We'll create stars in the addAtmosphericEffects function
    // Don't call createStars here to avoid duplication
    
    console.log("Night skybox created");
}

// Create stars for night sky
function createStars() {
    const starCount = 500;
    
    // Create star texture using canvas
    const starCanvas = document.createElement('canvas');
    starCanvas.width = 32;
    starCanvas.height = 32;
    const ctx = starCanvas.getContext('2d');
    
    // Draw star
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 32, 32);
    
    // Create a radial gradient for the star
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(200, 200, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    const starTexture = new THREE.CanvasTexture(starCanvas);
    
    for (let i = 0; i < starCount; i++) {
        // Create star sprite
        const starMaterial = new THREE.SpriteMaterial({
            map: starTexture,
            transparent: true,
            opacity: Math.random() * 0.5 + 0.5 // Vary star brightness
        });
        
        const star = new THREE.Sprite(starMaterial);
        
        // Random position in sky dome
        const phi = Math.random() * Math.PI * 2; // Around
        const theta = Math.random() * Math.PI / 2; // Up
        const radius = 100; // Sky dome radius
        
        star.position.set(
            radius * Math.sin(theta) * Math.cos(phi),
            radius * Math.cos(theta),
            radius * Math.sin(theta) * Math.sin(phi)
        );
        
        // Random scale for different star sizes
        const scale = Math.random() * 0.5 + 0.5;
        star.scale.set(scale, scale, 1);
        
        scene.add(star);
    }
    
    console.log("Stars created");
}

// Create moon and night lighting
function createSun() {
    // Create a main directional light (moonlight)
    sun = new THREE.DirectionalLight(0xCCDDFF, 0.4); // Slightly brighter moonlight
    sun.position.set(30, 50, 30); // Position at an angle for dramatic shadows
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
    
    scene.add(sun);
    
    // Add hemisphere light for subtle night lighting
    const hemisphereLight = new THREE.HemisphereLight(
        0x0A1030, // Sky color (dark blue)
        0x0A1010, // Ground color (very dark)
        0.3       // Increased intensity
    );
    scene.add(hemisphereLight);
    
    // Add ambient light for minimal illumination (night vision)
    const ambientLight = new THREE.AmbientLight(0x101020, 0.3); // Increased ambient light
    scene.add(ambientLight);
    
    // Create a visual representation of the moon
    const moonGeometry = new THREE.SphereGeometry(40, 32, 32); // Even larger for better visibility
    
    // Create moon texture using canvas
    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = 512;
    moonCanvas.height = 512;
    const ctx = moonCanvas.getContext('2d');
    
    // Draw moon base with a bright white color
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(256, 256, 240, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a subtle glow around the edge
    const edgeGradient = ctx.createRadialGradient(256, 256, 220, 256, 256, 240);
    edgeGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    edgeGradient.addColorStop(1, 'rgba(220, 220, 255, 0.8)');
    ctx.fillStyle = edgeGradient;
    ctx.beginPath();
    ctx.arc(256, 256, 240, 0, Math.PI * 2);
    ctx.fill();
    
    // Add some subtle moon details/craters
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * 450 + 30;
        const y = Math.random() * 450 + 30;
        const radius = Math.random() * 15 + 5;
        
        // Use a gradient for more realistic craters
        const craterGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        craterGradient.addColorStop(0, 'rgba(180, 180, 190, 0.6)');
        craterGradient.addColorStop(0.8, 'rgba(210, 210, 220, 0.3)');
        craterGradient.addColorStop(1, 'rgba(248, 248, 240, 0)');
        
        ctx.fillStyle = craterGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Add some larger mare (dark areas)
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * 350 + 80;
        const y = Math.random() * 350 + 80;
        const radius = Math.random() * 60 + 30;
        
        ctx.fillStyle = 'rgba(150, 150, 170, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    const moonTexture = new THREE.CanvasTexture(moonCanvas);
    
    // Create a glowing material for the moon
    const moonMaterial = new THREE.MeshBasicMaterial({ 
        map: moonTexture,
        color: 0xFFFFFF,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.2 // Make the moon glow
    });
    
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    // Position the moon directly in front of the player's starting position
    moon.position.set(0, 60, -120);
    
    // Add a stronger glow effect around the moon
    const moonGlowGeometry = new THREE.SphereGeometry(44, 32, 32);
    const moonGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.4
    });
    const moonGlow = new THREE.Mesh(moonGlowGeometry, moonGlowMaterial);
    moonGlow.position.copy(moon.position);
    
    scene.add(moon);
    scene.add(moonGlow);
    
    // Update the directional light to match the moon position
    sun.position.copy(moon.position);
    
    // Create a custom height fog that's more intense at ground level
    // We'll remove the standard fog and handle it in the shader
    scene.fog = null; // Remove standard fog
    
    // Add subtle volumetric fog to the scene
    addVolumetricFog();
    
    // Create a custom ground fog effect
    createGroundFog();
    
    console.log("Night lighting system created with moon");
}

// Add volumetric fog to the scene
function addVolumetricFog() {
    // Create several layers of fog particles at different heights
    const fogParticleCount = 200;
    const fogGeometry = new THREE.BufferGeometry();
    const fogPositions = [];
    const fogSizes = [];
    
    // Create fog particles in a cylinder around the player area
    for (let i = 0; i < fogParticleCount; i++) {
        // Random position in a cylinder
        const radius = 5 + Math.random() * 20; // Between 5-25 units from center
        const angle = Math.random() * Math.PI * 2;
        const height = Math.random() * 3; // Between 0-3 units high
        
        const x = Math.cos(angle) * radius;
        const y = height;
        const z = Math.sin(angle) * radius;
        
        fogPositions.push(x, y, z);
        
        // Random sizes for fog particles
        fogSizes.push(Math.random() * 4 + 2); // Between 2-6 units
    }
    
    // Add positions and sizes to the geometry
    fogGeometry.setAttribute('position', new THREE.Float32BufferAttribute(fogPositions, 3));
    fogGeometry.setAttribute('size', new THREE.Float32BufferAttribute(fogSizes, 1));
    
    // Create a custom shader material for the fog particles
    const fogMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0x050A14) },
            fogTexture: { value: createFogTexture() },
            time: { value: 0.0 }
        },
        vertexShader: `
            attribute float size;
            varying vec3 vColor;
            uniform float time;
            
            void main() {
                // Slow vertical movement based on time
                vec3 pos = position;
                pos.y += sin(time * 0.2 + position.x * 0.05 + position.z * 0.05) * 0.2;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
                
                // Pass fog color to fragment shader
                vColor = vec3(0.05, 0.05, 0.1);
            }
        `,
        fragmentShader: `
            uniform sampler2D fogTexture;
            varying vec3 vColor;
            
            void main() {
                // Sample the fog texture
                vec4 texColor = texture2D(fogTexture, gl_PointCoord);
                
                // Apply the fog color
                gl_FragColor = vec4(vColor, texColor.r * 0.3); // Low opacity
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    
    // Create the fog particles
    const fogParticles = new THREE.Points(fogGeometry, fogMaterial);
    scene.add(fogParticles);
    
    // Store the material for animation updates
    window.fogParticleMaterial = fogMaterial;
    
    console.log("Volumetric fog added");
}

// Create a texture for fog particles
function createFogTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    // Draw a soft circular gradient for fog particles
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    return new THREE.CanvasTexture(canvas);
}

// Create a custom ground fog effect
function createGroundFog() {
    // Create a large plane for the ground fog
    const fogPlaneGeometry = new THREE.PlaneGeometry(500, 500, 50, 50); // More segments for better blending
    
    // Create a custom shader material for height-based fog
    const fogMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0x050A14) }, // Darker color to match sky
            fogDensity: { value: 0.08 }, // Lower density for subtler effect
            time: { value: 0.0 } // Time uniform for subtle movement
        },
        vertexShader: `
            varying vec3 vWorldPosition;
            varying vec2 vUv;
            
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            uniform float fogDensity;
            uniform float time;
            
            varying vec3 vWorldPosition;
            varying vec2 vUv;
            
            // Simple noise function
            float noise(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            void main() {
                // Calculate height-based fog (more intense closer to ground)
                float height = vWorldPosition.y;
                
                // Add some noise based on position for a more natural look
                float noiseValue = noise(vUv * 10.0 + time * 0.01) * 0.1;
                
                // Exponential falloff with height + noise
                float fogFactor = exp(-fogDensity * (height + noiseValue) * 2.0);
                
                // Softer transition at the edges
                float distanceFromCenter = length(vUv - 0.5) * 2.0;
                float edgeFade = 1.0 - smoothstep(0.7, 1.0, distanceFromCenter);
                
                // Combine factors and clamp
                fogFactor = fogFactor * edgeFade;
                fogFactor = clamp(fogFactor, 0.0, 0.6); // Lower maximum opacity
                
                // Fade out completely above player height
                if (height > 3.0) {
                    fogFactor *= max(0.0, 1.0 - (height - 3.0) / 2.0);
                }
                
                gl_FragColor = vec4(color, fogFactor);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false // Don't write to depth buffer to avoid z-fighting
    });
    
    // Create the fog plane
    const fogPlane = new THREE.Mesh(fogPlaneGeometry, fogMaterial);
    fogPlane.rotation.x = -Math.PI / 2; // Horizontal
    fogPlane.position.y = 0.5; // Lower to ground level
    scene.add(fogPlane);
    
    // Store the material for animation updates
    window.fogMaterial = fogMaterial;
    
    console.log("Improved ground fog effect created");
}

// Create ground
function createGround() {
    // Create a large ground plane with more segments for better lighting
    const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    
    // Create grass texture
    const grassTexture = createGrassTexture();
    
    // Create a more realistic ground material with texture - darker for night
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x223322, // Dark green tint for night
        map: grassTexture,
        bumpMap: grassTexture,
        bumpScale: 0.2,
        shininess: 5,
        specular: 0x111111 // Low specular for wet grass look
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = 0;
    ground.receiveShadow = true;
    
    scene.add(ground);
    
    console.log("Ground created");
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
        
        // Use our new resumePointerLock function if available (more reliable)
        if (typeof window.resumePointerLock === 'function') {
            window.resumePointerLock();
        } else {
            document.body.requestPointerLock();
        }
        
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
            
            // Use our new resumePointerLock function if available (more reliable)
            if (typeof window.resumePointerLock === 'function') {
                window.resumePointerLock();
            } else {
                document.body.requestPointerLock();
            }
            
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
    
    // Check if weapon model exists and create/update it
    if (gameActive && typeof createWeaponModel === 'function') {
        // Check if weapon exists
        if (!weaponModel || !scene.children.includes(weaponModel)) {
            console.log("WEAPON DEBUG: Weapon missing in scene, creating new one");
            createWeaponModel();
        }
        
        // Always update weapon position to match camera
        if (typeof updateWeaponPosition === 'function') {
            updateWeaponPosition();
        }
    }
    
    // Update player movement and shooting
    updatePlayer();
    
    // Update enemies
    updateEnemies();
    
    // Update atmospheric effects
    updateAtmosphericEffects();
    
    // Check game state (health, score)
    updateGameState();
    
    // Render scene
    renderer.render(scene, camera);
}

// Update atmospheric effects
function updateAtmosphericEffects() {
    // Update time for fog animation
    const now = Date.now();
    const timeValue = now * 0.001; // Slow time factor
    
    // Update ground fog
    if (window.fogMaterial) {
        window.fogMaterial.uniforms.time.value = timeValue;
    }
    
    // Update volumetric fog particles
    if (window.fogParticleMaterial) {
        window.fogParticleMaterial.uniforms.time.value = timeValue;
    }
    
    // Update fireflies
    if (window.fireflies && window.fireflies.length > 0) {
        window.fireflies.forEach(firefly => {
            if (!firefly.userData) return;
            
            // Gentle floating movement - reduced amplitude
            firefly.position.y = firefly.userData.originalY + 
                Math.sin(now * firefly.userData.speed + firefly.userData.phase) * 0.15; // Reduced from 0.3
                
            // Random horizontal drift - reduced
            firefly.position.x += Math.sin(now * firefly.userData.speed * 0.3) * 0.005; // Reduced movement
            firefly.position.z += Math.cos(now * firefly.userData.speed * 0.3) * 0.005; // Reduced movement
            
            // Blinking effect
            if (now - firefly.userData.lastBlink > firefly.userData.blinkInterval) {
                // Start a blink
                firefly.userData.isBlinking = true;
                firefly.userData.blinkStart = now;
                firefly.userData.lastBlink = now;
                firefly.userData.blinkDuration = Math.random() * 1500 + 1000; // 1-2.5 seconds (slower)
            }
            
            // Handle blinking animation - more subtle
            if (firefly.userData.isBlinking) {
                const blinkProgress = (now - firefly.userData.blinkStart) / firefly.userData.blinkDuration;
                
                if (blinkProgress < 0.5) {
                    // Fade out - more subtle
                    firefly.material.opacity = 0.5 * (1 - blinkProgress * 1.5); // Less dramatic fade
                } else if (blinkProgress < 1) {
                    // Fade in - more subtle
                    firefly.material.opacity = 0.5 * ((blinkProgress - 0.5) * 1.5); // Less dramatic fade
                } else {
                    // Blink complete
                    firefly.material.opacity = 0.5;
                    firefly.userData.isBlinking = false;
                }
            }
        });
    }
    
    // Update twinkling stars
    if (window.brightStars && window.brightStars.length > 0) {
        window.brightStars.forEach(star => {
            if (!star.userData) return;
            
            // Twinkle effect - subtle variation in opacity
            star.material.opacity = star.userData.originalOpacity + 
                Math.sin(now * star.userData.twinkleSpeed + star.userData.twinklePhase) * 0.2;
        });
    }
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

// Add atmospheric effects for night scene
function addAtmosphericEffects() {
    // Create stars for night sky
    createStars();
    
    // Add fireflies
    createFireflies();
    
    console.log("Atmospheric effects added");
}

// Create fireflies for night atmosphere
function createFireflies() {
    const fireflyCount = 30; // Reduced from 100 to 30
    
    // Create firefly texture
    const fireflyCanvas = document.createElement('canvas');
    fireflyCanvas.width = 32;
    fireflyCanvas.height = 32;
    const ctx = fireflyCanvas.getContext('2d');
    
    // Draw firefly glow - more subtle
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(200, 200, 100, 0.8)'); // Less bright
    gradient.addColorStop(0.2, 'rgba(200, 200, 80, 0.6)'); // Less bright
    gradient.addColorStop(0.5, 'rgba(150, 200, 50, 0.3)'); // Less bright
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    const fireflyTexture = new THREE.CanvasTexture(fireflyCanvas);
    
    // Create firefly sprites
    for (let i = 0; i < fireflyCount; i++) {
        const fireflyMaterial = new THREE.SpriteMaterial({
            map: fireflyTexture,
            transparent: true,
            opacity: 0.5, // Reduced from 0.8 to 0.5
            blending: THREE.AdditiveBlending // Additive blending for glow effect
        });
        
        const firefly = new THREE.Sprite(fireflyMaterial);
        
        // Random position in the scene - keep them more to the edges
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 20 + 15; // Between 15-35 units from center (more at edges)
        const height = Math.random() * 2 + 1; // Between 1-3 units high
        
        firefly.position.set(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );
        
        // Random scale for different firefly sizes - smaller overall
        const scale = Math.random() * 0.2 + 0.1; // Reduced size
        firefly.scale.set(scale, scale, 1);
        
        // Add animation data
        firefly.userData = {
            originalY: height,
            speed: Math.random() * 0.005 + 0.002, // Slower movement
            phase: Math.random() * Math.PI * 2,
            blinkSpeed: Math.random() * 0.05 + 0.02, // Slower blinking
            lastBlink: Date.now(),
            blinkInterval: Math.random() * 5000 + 3000 // Longer intervals between blinks (3-8 seconds)
        };
        
        scene.add(firefly);
        
        // Add to a global array for animation
        if (!window.fireflies) window.fireflies = [];
        window.fireflies.push(firefly);
    }
    
    console.log("Fireflies created (reduced quantity)");
}

// Create stars for the night sky
function createStars() {
    // Create a star field with many small bright points
    const starCount = 1000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    const starColors = [];
    
    // Generate random star positions in a dome above the scene
    for (let i = 0; i < starCount; i++) {
        // Use spherical distribution for stars
        const theta = Math.random() * Math.PI * 2; // Around
        const phi = Math.random() * Math.PI * 0.5; // Above horizon only
        const radius = 300 + Math.random() * 200; // Far away
        
        // Convert spherical to cartesian coordinates
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi); // Up
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        starPositions.push(x, y, z);
        
        // Vary star colors slightly (mostly white with hints of blue/yellow)
        const colorChoice = Math.random();
        if (colorChoice > 0.9) {
            // Blue-ish stars
            starColors.push(0.8, 0.9, 1.0);
        } else if (colorChoice > 0.8) {
            // Yellow-ish stars
            starColors.push(1.0, 0.9, 0.7);
        } else {
            // White stars with varying brightness
            const brightness = 0.8 + Math.random() * 0.2;
            starColors.push(brightness, brightness, brightness);
        }
    }
    
    // Add positions and colors to the geometry
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    
    // Create material for stars
    const starMaterial = new THREE.PointsMaterial({
        size: 0.7,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: false // Stars don't get smaller with distance
    });
    
    // Create the star field
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    
    // Add a few brighter stars with glow
    for (let i = 0; i < 20; i++) {
        // Random position in the sky dome
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 0.4; // Higher in the sky
        const radius = 290;
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        // Create a sprite for the bright star
        const starSprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: createStarTexture(),
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            })
        );
        
        starSprite.position.set(x, y, z);
        starSprite.scale.set(5, 5, 1);
        
        // Add animation data for twinkling
        starSprite.userData = {
            originalOpacity: 0.8,
            twinkleSpeed: Math.random() * 0.002 + 0.001,
            twinklePhase: Math.random() * Math.PI * 2
        };
        
        scene.add(starSprite);
        
        // Add to a global array for animation
        if (!window.brightStars) window.brightStars = [];
        window.brightStars.push(starSprite);
    }
    
    console.log("Stars created for night sky");
}

// Create a texture for bright stars with glow
function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    // Draw star glow
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    return new THREE.CanvasTexture(canvas);
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