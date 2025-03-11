// Environment objects array (accessible to other modules)
window.environmentObjects = [];

// Create environment
function createEnvironment() {
    console.log("Creating environment from environment.js");
    
    // Create ground
    const groundGeo = new THREE.PlaneGeometry(50, 50);
    const groundMat = new THREE.MeshLambertMaterial({ 
        color: 0x404040,
        map: new THREE.TextureLoader().load('textures/grass.jpg')
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);
    
    // Note: We're not creating objects here anymore
    // They are created in main.js
    
    console.log("Environment base created");
}

// Check collision between point and environment
function checkEnvironmentCollision(position, radius) {
    // Arena boundary collision (invisible wall)
    const distanceFromCenter = Math.sqrt(position.x * position.x + position.z * position.z);
    if (distanceFromCenter > 24) {
        const direction = new THREE.Vector3(position.x, 0, position.z).normalize();
        return {
            collided: true,
            object: { position: direction.multiplyScalar(24) },
            penetration: distanceFromCenter - 24 + radius
        };
    }
    
    // Check collision with environment objects
    if (!window.environmentObjects || window.environmentObjects.length === 0) {
        console.log("No environment objects to check collisions with");
        return { collided: false };
    }
    
    for (const obj of window.environmentObjects) {
        if (!obj || !obj.position) continue;
        
        if (obj.userData && obj.userData.isCollidable) {
            const distance = position.distanceTo(obj.position);
            const minDistance = radius + (obj.userData.radius || 0.5);
            
            if (distance < minDistance) {
                return {
                    collided: true,
                    object: obj,
                    penetration: minDistance - distance
                };
            }
        }
    }
    
    return { collided: false };
}

// Export functions
window.createEnvironment = createEnvironment;
window.checkEnvironmentCollision = checkEnvironmentCollision;
console.log("Environment functions exported to global scope"); 