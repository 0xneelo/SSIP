/**
 * SSIP Three.js Background Effect
 * Dynamic interactive particle network with mouse movement and click reactions
 */

class SSIPBackground {
    constructor() {
        this.container = document.getElementById('hero-canvas');
        if (!this.container) return;
        
        // Get hero section for bounds
        this.heroSection = this.container.closest('.hero') || this.container.parentElement;
        
        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.clickWaves = [];
        this.time = 0;
        this.updateDimensions();
        
        this.init();
        this.createParticles();
        this.createConnections();
        this.animate();
        this.addEventListeners();
    }
    
    updateDimensions() {
        const rect = this.heroSection.getBoundingClientRect();
        this.width = rect.width || window.innerWidth;
        this.height = rect.height || window.innerHeight;
        this.containerHalf = { x: this.width / 2, y: this.height / 2 };
    }
    
    init() {
        // Scene
        this.scene = new THREE.Scene();
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.width / this.height,
            0.1,
            1000
        );
        this.camera.position.z = 50;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(this.width, this.height);
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
        this.particleCount = 120; // More particles
        
        for (let i = 0; i < this.particleCount; i++) {
            const isLarge = Math.random() > 0.8;
            const isMedium = !isLarge && Math.random() > 0.6;
            const size = isLarge ? 0.4 : (isMedium ? 0.25 : 0.1 + Math.random() * 0.1);
            
            const particleGeometry = new THREE.SphereGeometry(size, 12, 12);
            
            // Varied colors - amber spectrum
            const hue = 0.08 + Math.random() * 0.05; // Orange to yellow
            const color = new THREE.Color().setHSL(hue, 1, isLarge ? 0.6 : 0.5);
            
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: isLarge ? 0.9 : (isMedium ? 0.7 : 0.5)
            });
            
            const particle = new THREE.Mesh(particleGeometry, material);
            
            // Random position in a wider sphere
            const radius = 25 + Math.random() * 30;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            particle.position.x = radius * Math.sin(phi) * Math.cos(theta);
            particle.position.y = radius * Math.sin(phi) * Math.sin(theta);
            particle.position.z = radius * Math.cos(phi) - 15;
            
            // Store properties for animation
            particle.userData = {
                originalX: particle.position.x,
                originalY: particle.position.y,
                originalZ: particle.position.z,
                velocityX: (Math.random() - 0.5) * 0.15, // Faster base velocity
                velocityY: (Math.random() - 0.5) * 0.15,
                velocityZ: (Math.random() - 0.5) * 0.08,
                phase: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 1.5, // Variable speeds
                orbitRadius: 2 + Math.random() * 5,
                orbitSpeed: 0.02 + Math.random() * 0.04,
                isLarge: isLarge,
                isMedium: isMedium,
                pulseSpeed: 2 + Math.random() * 3,
                originalOpacity: material.opacity
            };
            
            this.particles.push(particle);
            this.particleGroup.add(particle);
        }
        
        // Central rotating structure
        this.createCentralStructure();
    }
    
    createCentralStructure() {
        // Outer wireframe icosahedron
        const outerGeometry = new THREE.IcosahedronGeometry(2.5, 1);
        const outerMaterial = new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            wireframe: true,
            transparent: true,
            opacity: 0.6
        });
        this.outerCore = new THREE.Mesh(outerGeometry, outerMaterial);
        this.outerCore.position.z = -5;
        this.scene.add(this.outerCore);
        
        // Middle ring
        const ringGeometry = new THREE.TorusGeometry(1.8, 0.05, 16, 50);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xfbbf24,
            transparent: true,
            opacity: 0.8
        });
        this.ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
        this.ring1.position.z = -5;
        this.scene.add(this.ring1);
        
        // Second ring (perpendicular)
        this.ring2 = new THREE.Mesh(ringGeometry.clone(), ringMaterial.clone());
        this.ring2.position.z = -5;
        this.ring2.rotation.x = Math.PI / 2;
        this.scene.add(this.ring2);
        
        // Inner core
        const innerGeometry = new THREE.OctahedronGeometry(0.8, 0);
        const innerMaterial = new THREE.MeshBasicMaterial({
            color: 0xfcd34d,
            transparent: true,
            opacity: 0.9
        });
        this.innerCore = new THREE.Mesh(innerGeometry, innerMaterial);
        this.innerCore.position.z = -5;
        this.scene.add(this.innerCore);
        
        // Glowing center point
        const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        this.glowCenter = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowCenter.position.z = -5;
        this.scene.add(this.glowCenter);
    }
    
    createConnections() {
        this.connections = [];
        this.connectionMaterial = new THREE.LineBasicMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 0.2
        });
    }
    
    updateConnections() {
        // Remove old connections
        this.connections.forEach(line => {
            this.connectionGroup.remove(line);
            line.geometry.dispose();
        });
        this.connections = [];
        
        const maxDistance = 18;
        
        for (let i = 0; i < this.particles.length; i++) {
            // Limit connections per particle for performance
            let connectionCount = 0;
            const maxConnectionsPerParticle = 3;
            
            for (let j = i + 1; j < this.particles.length && connectionCount < maxConnectionsPerParticle; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                const distance = p1.position.distanceTo(p2.position);
                
                if (distance < maxDistance) {
                    const geometry = new THREE.BufferGeometry().setFromPoints([
                        p1.position.clone(),
                        p2.position.clone()
                    ]);
                    
                    const opacity = 0.25 * (1 - distance / maxDistance);
                    const material = new THREE.LineBasicMaterial({
                        color: 0xf59e0b,
                        transparent: true,
                        opacity: opacity
                    });
                    
                    const line = new THREE.Line(geometry, material);
                    this.connections.push(line);
                    this.connectionGroup.add(line);
                    connectionCount++;
                }
            }
            
            // Connect larger particles to core with brighter lines
            if (this.particles[i].userData.isLarge || this.particles[i].userData.isMedium) {
                const p = this.particles[i];
                const corePos = this.outerCore.position;
                const distance = p.position.distanceTo(corePos);
                
                if (distance < 40) {
                    const geometry = new THREE.BufferGeometry().setFromPoints([
                        p.position.clone(),
                        corePos.clone()
                    ]);
                    
                    const opacity = this.particles[i].userData.isLarge ? 0.3 : 0.15;
                    const material = new THREE.LineBasicMaterial({
                        color: 0xfbbf24,
                        transparent: true,
                        opacity: opacity * (1 - distance / 40)
                    });
                    
                    const line = new THREE.Line(geometry, material);
                    this.connections.push(line);
                    this.connectionGroup.add(line);
                }
            }
        }
    }
    
    // Click wave explosion effect
    createClickWave(x, y) {
        const wave = {
            x: x * 30, // Convert normalized coords to scene coords
            y: -y * 20,
            z: 0,
            radius: 0,
            maxRadius: 60,
            speed: 2,
            strength: 15,
            life: 1
        };
        this.clickWaves.push(wave);
        
        // Create visual ripple
        const rippleGeometry = new THREE.RingGeometry(0.1, 0.3, 32);
        const rippleMaterial = new THREE.MeshBasicMaterial({
            color: 0xfbbf24,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
        ripple.position.set(wave.x, wave.y, wave.z);
        ripple.userData = { wave: wave };
        this.scene.add(ripple);
        wave.ripple = ripple;
    }
    
    updateClickWaves() {
        for (let i = this.clickWaves.length - 1; i >= 0; i--) {
            const wave = this.clickWaves[i];
            wave.radius += wave.speed;
            wave.life -= 0.02;
            
            // Update ripple visual
            if (wave.ripple) {
                wave.ripple.scale.setScalar(wave.radius);
                wave.ripple.material.opacity = wave.life * 0.8;
            }
            
            // Affect particles
            this.particles.forEach(particle => {
                const dx = particle.position.x - wave.x;
                const dy = particle.position.y - wave.y;
                const dz = particle.position.z - wave.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                // Particles near the wave edge get pushed
                const waveDist = Math.abs(dist - wave.radius);
                if (waveDist < 8) {
                    const force = (1 - waveDist / 8) * wave.strength * wave.life;
                    const angle = Math.atan2(dy, dx);
                    particle.position.x += Math.cos(angle) * force * 0.3;
                    particle.position.y += Math.sin(angle) * force * 0.3;
                    particle.position.z += (dz / (dist || 1)) * force * 0.1;
                }
            });
            
            // Remove expired waves
            if (wave.life <= 0) {
                if (wave.ripple) {
                    this.scene.remove(wave.ripple);
                    wave.ripple.geometry.dispose();
                    wave.ripple.material.dispose();
                }
                this.clickWaves.splice(i, 1);
            }
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.016; // ~60fps time increment
        
        // Smooth mouse follow
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;
        
        // Rotate particle group based on mouse (more responsive)
        this.particleGroup.rotation.y = this.mouse.x * 0.5;
        this.particleGroup.rotation.x = this.mouse.y * 0.3;
        
        // Animate central structure (faster, more dynamic)
        this.outerCore.rotation.x += 0.008;
        this.outerCore.rotation.y += 0.012;
        this.outerCore.rotation.z += 0.004;
        
        this.ring1.rotation.z += 0.02;
        this.ring2.rotation.y += 0.025;
        
        this.innerCore.rotation.x -= 0.015;
        this.innerCore.rotation.y += 0.02;
        this.innerCore.rotation.z -= 0.01;
        
        // Pulse the glow center
        const glowPulse = 0.8 + Math.sin(this.time * 4) * 0.2;
        this.glowCenter.scale.setScalar(glowPulse);
        this.glowCenter.material.opacity = 0.6 + Math.sin(this.time * 3) * 0.3;
        
        // Move core with mouse (more movement)
        const coreX = this.mouse.x * 8;
        const coreY = -this.mouse.y * 6;
        this.outerCore.position.x = coreX;
        this.outerCore.position.y = coreY;
        this.ring1.position.x = coreX;
        this.ring1.position.y = coreY;
        this.ring2.position.x = coreX;
        this.ring2.position.y = coreY;
        this.innerCore.position.x = coreX;
        this.innerCore.position.y = coreY;
        this.glowCenter.position.x = coreX;
        this.glowCenter.position.y = coreY;
        
        // Animate particles with more dynamic movement
        this.particles.forEach((particle, i) => {
            const data = particle.userData;
            
            // Orbital motion around original position
            const orbitX = Math.cos(this.time * data.orbitSpeed + data.phase) * data.orbitRadius;
            const orbitY = Math.sin(this.time * data.orbitSpeed + data.phase) * data.orbitRadius;
            
            // Wave motion
            const waveOffset = Math.sin(this.time * data.speed + i * 0.1) * 2;
            
            // Apply position with smooth return to orbit
            particle.position.x += (data.originalX + orbitX - particle.position.x) * 0.02;
            particle.position.y += (data.originalY + orbitY + waveOffset - particle.position.y) * 0.02;
            particle.position.z += (data.originalZ - particle.position.z) * 0.01;
            
            // Pulse effect for all particles (stronger for larger ones)
            if (data.isLarge) {
                const scale = 1 + Math.sin(this.time * data.pulseSpeed) * 0.4;
                particle.scale.setScalar(scale);
                particle.material.opacity = data.originalOpacity + Math.sin(this.time * 2) * 0.2;
            } else if (data.isMedium) {
                const scale = 1 + Math.sin(this.time * data.pulseSpeed + i) * 0.25;
                particle.scale.setScalar(scale);
            } else {
                // Subtle twinkle for small particles
                particle.material.opacity = data.originalOpacity * (0.7 + Math.sin(this.time * data.pulseSpeed + i * 0.5) * 0.3);
            }
        });
        
        // Update click wave effects
        this.updateClickWaves();
        
        // Update connections more frequently for smoother look
        if (Math.floor(this.time * 60) % 2 === 0) {
            this.updateConnections();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    addEventListeners() {
        // Mouse move - calculate relative to hero section
        document.addEventListener('mousemove', (e) => {
            const rect = this.heroSection.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Normalize to -1 to 1 range
            this.mouse.targetX = (x / this.width) * 2 - 1;
            this.mouse.targetY = (y / this.height) * 2 - 1;
            
            // Clamp values when mouse is outside hero
            this.mouse.targetX = Math.max(-1, Math.min(1, this.mouse.targetX));
            this.mouse.targetY = Math.max(-1, Math.min(1, this.mouse.targetY));
        });
        
        // Mouse click - create explosion wave
        this.heroSection.addEventListener('click', (e) => {
            const rect = this.heroSection.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / this.width) * 2 - 1;
            const y = ((e.clientY - rect.top) / this.height) * 2 - 1;
            this.createClickWave(x, y);
        });
        
        // Resize
        window.addEventListener('resize', () => {
            this.updateDimensions();
            
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
            
            this.renderer.setSize(this.width, this.height);
        });
        
        // Touch support for mobile
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const rect = this.heroSection.getBoundingClientRect();
                const x = e.touches[0].clientX - rect.left;
                const y = e.touches[0].clientY - rect.top;
                
                this.mouse.targetX = (x / this.width) * 2 - 1;
                this.mouse.targetY = (y / this.height) * 2 - 1;
                
                this.mouse.targetX = Math.max(-1, Math.min(1, this.mouse.targetX));
                this.mouse.targetY = Math.max(-1, Math.min(1, this.mouse.targetY));
            }
        });
        
        // Touch tap - create explosion
        this.heroSection.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                const rect = this.heroSection.getBoundingClientRect();
                const x = ((e.touches[0].clientX - rect.left) / this.width) * 2 - 1;
                const y = ((e.touches[0].clientY - rect.top) / this.height) * 2 - 1;
                this.createClickWave(x, y);
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SSIPBackground();
});
