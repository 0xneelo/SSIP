/**
 * SSIP Three.js Background Effect
 * Interactive particle network that responds to mouse movement
 */

class SSIPBackground {
    constructor() {
        this.container = document.getElementById('hero-canvas');
        if (!this.container) return;
        
        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.windowHalf = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        
        this.init();
        this.createParticles();
        this.createConnections();
        this.animate();
        this.addEventListeners();
    }
    
    init() {
        // Scene
        this.scene = new THREE.Scene();
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 50;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);
        
        // Groups
        this.particleGroup = new THREE.Group();
        this.connectionGroup = new THREE.Group();
        this.scene.add(this.particleGroup);
        this.scene.add(this.connectionGroup);
    }
    
    createParticles() {
        this.particles = [];
        this.particleCount = 80;
        
        // Particle geometry and material
        const geometry = new THREE.SphereGeometry(0.15, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 0.8
        });
        
        // Glow material for larger particles
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xfbbf24,
            transparent: true,
            opacity: 0.6
        });
        
        for (let i = 0; i < this.particleCount; i++) {
            const isLarge = Math.random() > 0.85;
            const size = isLarge ? 0.3 : 0.1 + Math.random() * 0.15;
            const particleGeometry = new THREE.SphereGeometry(size, 16, 16);
            const particle = new THREE.Mesh(
                particleGeometry, 
                isLarge ? glowMaterial.clone() : material.clone()
            );
            
            // Random position in a sphere
            const radius = 30 + Math.random() * 20;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            particle.position.x = radius * Math.sin(phi) * Math.cos(theta);
            particle.position.y = radius * Math.sin(phi) * Math.sin(theta);
            particle.position.z = radius * Math.cos(phi) - 20;
            
            // Store original position and velocity
            particle.userData = {
                originalX: particle.position.x,
                originalY: particle.position.y,
                originalZ: particle.position.z,
                velocityX: (Math.random() - 0.5) * 0.02,
                velocityY: (Math.random() - 0.5) * 0.02,
                velocityZ: (Math.random() - 0.5) * 0.01,
                isLarge: isLarge
            };
            
            this.particles.push(particle);
            this.particleGroup.add(particle);
        }
        
        // Add central node (SSIP core)
        const coreGeometry = new THREE.IcosahedronGeometry(1.5, 1);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        this.coreNode = new THREE.Mesh(coreGeometry, coreMaterial);
        this.coreNode.position.z = -10;
        this.scene.add(this.coreNode);
        
        // Inner core
        const innerCoreGeometry = new THREE.IcosahedronGeometry(0.8, 0);
        const innerCoreMaterial = new THREE.MeshBasicMaterial({
            color: 0xfbbf24,
            transparent: true,
            opacity: 0.6
        });
        this.innerCore = new THREE.Mesh(innerCoreGeometry, innerCoreMaterial);
        this.innerCore.position.z = -10;
        this.scene.add(this.innerCore);
    }
    
    createConnections() {
        this.connections = [];
        this.connectionMaterial = new THREE.LineBasicMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 0.15
        });
    }
    
    updateConnections() {
        // Remove old connections
        this.connections.forEach(line => {
            this.connectionGroup.remove(line);
            line.geometry.dispose();
        });
        this.connections = [];
        
        // Create new connections between nearby particles
        const maxDistance = 15;
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                const distance = p1.position.distanceTo(p2.position);
                
                if (distance < maxDistance) {
                    const geometry = new THREE.BufferGeometry().setFromPoints([
                        p1.position,
                        p2.position
                    ]);
                    
                    const opacity = 0.15 * (1 - distance / maxDistance);
                    const material = new THREE.LineBasicMaterial({
                        color: 0xf59e0b,
                        transparent: true,
                        opacity: opacity
                    });
                    
                    const line = new THREE.Line(geometry, material);
                    this.connections.push(line);
                    this.connectionGroup.add(line);
                }
            }
            
            // Connect large particles to core
            if (this.particles[i].userData.isLarge) {
                const p = this.particles[i];
                const distance = p.position.distanceTo(this.coreNode.position);
                
                if (distance < 35) {
                    const geometry = new THREE.BufferGeometry().setFromPoints([
                        p.position,
                        this.coreNode.position
                    ]);
                    
                    const material = new THREE.LineBasicMaterial({
                        color: 0xfbbf24,
                        transparent: true,
                        opacity: 0.2
                    });
                    
                    const line = new THREE.Line(geometry, material);
                    this.connections.push(line);
                    this.connectionGroup.add(line);
                }
            }
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Smooth mouse follow
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;
        
        // Rotate particle group based on mouse
        this.particleGroup.rotation.y = this.mouse.x * 0.3;
        this.particleGroup.rotation.x = this.mouse.y * 0.2;
        
        // Animate core
        this.coreNode.rotation.x += 0.003;
        this.coreNode.rotation.y += 0.005;
        this.innerCore.rotation.x -= 0.005;
        this.innerCore.rotation.y -= 0.003;
        
        // Move core slightly with mouse
        this.coreNode.position.x = this.mouse.x * 5;
        this.coreNode.position.y = -this.mouse.y * 5;
        this.innerCore.position.x = this.mouse.x * 5;
        this.innerCore.position.y = -this.mouse.y * 5;
        
        // Animate particles
        this.particles.forEach((particle, i) => {
            const data = particle.userData;
            
            // Gentle floating motion
            particle.position.x = data.originalX + Math.sin(Date.now() * 0.001 + i) * 0.5;
            particle.position.y = data.originalY + Math.cos(Date.now() * 0.001 + i) * 0.5;
            
            // Pulse effect for large particles
            if (data.isLarge) {
                const scale = 1 + Math.sin(Date.now() * 0.002 + i) * 0.2;
                particle.scale.setScalar(scale);
            }
        });
        
        // Update connections every few frames for performance
        if (Math.floor(Date.now() / 100) % 3 === 0) {
            this.updateConnections();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    addEventListeners() {
        // Mouse move
        document.addEventListener('mousemove', (e) => {
            this.mouse.targetX = (e.clientX - this.windowHalf.x) / this.windowHalf.x;
            this.mouse.targetY = (e.clientY - this.windowHalf.y) / this.windowHalf.y;
        });
        
        // Resize
        window.addEventListener('resize', () => {
            this.windowHalf.x = window.innerWidth / 2;
            this.windowHalf.y = window.innerHeight / 2;
            
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Touch support for mobile
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouse.targetX = (e.touches[0].clientX - this.windowHalf.x) / this.windowHalf.x;
                this.mouse.targetY = (e.touches[0].clientY - this.windowHalf.y) / this.windowHalf.y;
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SSIPBackground();
});

