/**
 * SSIP Three.js Background Effect
 * Solar System: SSIP as the Sun, Janich PRG / SYMMIO / Futarchy as orbiting planets
 */

class SSIPBackground {
    constructor() {
        this.container = document.getElementById('hero-canvas');
        if (!this.container) return;
        
        this.heroSection = this.container.closest('.hero') || this.container.parentElement;
        
        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.clickWaves = [];
        this.time = 0;
        this.updateDimensions();
        
        this.init();
        this.createSolarSystem();
        this.createParticles();
        this.createOrbits();
        this.animate();
        this.addEventListeners();
    }
    
    updateDimensions() {
        const rect = this.heroSection.getBoundingClientRect();
        this.width = rect.width || window.innerWidth;
        this.height = rect.height || window.innerHeight;
    }
    
    init() {
        this.scene = new THREE.Scene();
        
        this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
        this.camera.position.z = 80;
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);
        
        // Groups - offset to the RIGHT side to not overlap text
        this.solarSystem = new THREE.Group();
        this.particleGroup = new THREE.Group();
        this.orbitGroup = new THREE.Group();
        
        // Position solar system to the right side of the screen
        const xOffset = 25; // Move right
        const zOffset = -20; // Push back
        this.solarSystem.position.set(xOffset, 0, zOffset);
        this.orbitGroup.position.set(xOffset, 0, zOffset);
        this.particleGroup.position.set(xOffset, 0, zOffset);
        
        this.scene.add(this.solarSystem);
        this.scene.add(this.particleGroup);
        this.scene.add(this.orbitGroup);
    }
    
    createSolarSystem() {
        // === THE SUN: SSIP ===
        this.sun = new THREE.Group();
        
        // Core glow - more subtle
        const sunCoreGeo = new THREE.SphereGeometry(3.5, 32, 32);
        const sunCoreMat = new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 0.7
        });
        this.sunCore = new THREE.Mesh(sunCoreGeo, sunCoreMat);
        this.sun.add(this.sunCore);
        
        // Outer glow layers - more subtle
        for (let i = 1; i <= 3; i++) {
            const glowGeo = new THREE.SphereGeometry(3.5 + i * 1.2, 32, 32);
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0xfbbf24,
                transparent: true,
                opacity: 0.1 / i
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            this.sun.add(glow);
        }
        
        // Corona rays - fewer and more subtle
        this.coronaRays = [];
        const rayCount = 8;
        for (let i = 0; i < rayCount; i++) {
            const rayGeo = new THREE.ConeGeometry(0.4, 6, 8);
            const rayMat = new THREE.MeshBasicMaterial({
                color: 0xfcd34d,
                transparent: true,
                opacity: 0.2
            });
            const ray = new THREE.Mesh(rayGeo, rayMat);
            ray.rotation.z = (i / rayCount) * Math.PI * 2;
            ray.position.x = Math.cos(ray.rotation.z) * 5;
            ray.position.y = Math.sin(ray.rotation.z) * 5;
            ray.rotation.z += Math.PI / 2;
            this.coronaRays.push(ray);
            this.sun.add(ray);
        }
        
        // Inner rotating structure
        const innerGeo = new THREE.IcosahedronGeometry(2, 0);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
        this.sunInner = new THREE.Mesh(innerGeo, innerMat);
        this.sun.add(this.sunInner);
        
        this.solarSystem.add(this.sun);
        
        // === PLANETS === (smaller, more subtle)
        this.planets = [];
        
        const planetData = [
            { name: 'Janich PRG', color: 0xf59e0b, orbitRadius: 18, speed: 0.006, size: 1.5, startAngle: 0 },
            { name: 'SYMMIO', color: 0xfbbf24, orbitRadius: 26, speed: 0.009, size: 1.8, startAngle: Math.PI * 2/3 },
            { name: 'Futarchy', color: 0xfcd34d, orbitRadius: 34, speed: 0.004, size: 1.4, startAngle: Math.PI * 4/3 }
        ];
        
        planetData.forEach((data, index) => {
            const planet = this.createPlanet(data);
            planet.userData = { ...data, angle: data.startAngle };
            this.planets.push(planet);
            this.solarSystem.add(planet);
        });
    }
    
    createPlanet(data) {
        const group = new THREE.Group();
        
        // Planet core - more subtle
        const coreGeo = new THREE.SphereGeometry(data.size, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({
            color: data.color,
            transparent: true,
            opacity: 0.6
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);
        
        // Planet ring/aura - subtle
        const ringGeo = new THREE.RingGeometry(data.size + 0.3, data.size + 0.6, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: data.color,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        
        // Inner wireframe - subtle
        const wireGeo = new THREE.IcosahedronGeometry(data.size * 0.6, 0);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.25
        });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        group.add(wire);
        group.userData.wire = wire;
        group.userData.ring = ring;
        
        return group;
    }
    
    createOrbits() {
        // Create visible orbit paths - very subtle
        const orbitRadii = [18, 26, 34];
        const orbitColors = [0xf59e0b, 0xfbbf24, 0xfcd34d];
        
        orbitRadii.forEach((radius, i) => {
            const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
            const points = curve.getPoints(80);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: orbitColors[i],
                transparent: true,
                opacity: 0.08 // Very subtle
            });
            const orbit = new THREE.Line(geometry, material);
            orbit.rotation.x = Math.PI / 2;
            this.orbitGroup.add(orbit);
        });
        
        // Orbit group tilts slightly for 3D effect
        this.orbitGroup.rotation.x = 0.4;
        this.solarSystem.rotation.x = 0.4;
    }
    
    createParticles() {
        this.particles = [];
        this.particleCount = 80; // Fewer particles
        
        for (let i = 0; i < this.particleCount; i++) {
            const size = 0.08 + Math.random() * 0.12; // Smaller particles
            const geo = new THREE.SphereGeometry(size, 6, 6);
            
            // Particles in amber spectrum
            const hue = 0.08 + Math.random() * 0.06;
            const color = new THREE.Color().setHSL(hue, 0.9, 0.55);
            
            const mat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.25 + Math.random() * 0.25 // More subtle
            });
            
            const particle = new THREE.Mesh(geo, mat);
            
            // Distribute particles in orbital bands and around planets
            const band = Math.floor(Math.random() * 4); // 0 = inner, 1-3 = planet orbits
            let radius, orbitSpeed;
            
            if (band === 0) {
                // Inner particles around sun
                radius = 6 + Math.random() * 6;
                orbitSpeed = 0.015 + Math.random() * 0.015;
            } else {
                // Particles in orbital bands (updated radii)
                const baseRadius = [18, 26, 34][band - 1];
                radius = baseRadius - 2 + Math.random() * 4;
                orbitSpeed = [0.006, 0.009, 0.004][band - 1] * (0.8 + Math.random() * 0.4);
            }
            
            const angle = Math.random() * Math.PI * 2;
            const verticalSpread = (Math.random() - 0.5) * 10;
            
            particle.position.x = Math.cos(angle) * radius;
            particle.position.z = Math.sin(angle) * radius;
            particle.position.y = verticalSpread;
            
            particle.userData = {
                angle: angle,
                radius: radius,
                orbitSpeed: orbitSpeed,
                verticalOffset: verticalSpread,
                verticalSpeed: 0.01 + Math.random() * 0.02,
                phase: Math.random() * Math.PI * 2,
                pulseSpeed: 2 + Math.random() * 3,
                originalOpacity: mat.opacity
            };
            
            this.particles.push(particle);
            this.particleGroup.add(particle);
        }
        
        // Tilt particle group to match orbits
        this.particleGroup.rotation.x = 0.3;
    }
    
    createClickWave(x, y) {
        const wave = {
            x: x * 40,
            y: -y * 30,
            z: 0,
            radius: 0,
            maxRadius: 80,
            speed: 3,
            strength: 20,
            life: 1
        };
        this.clickWaves.push(wave);
        
        // Visual ripple
        const rippleGeo = new THREE.RingGeometry(0.1, 0.5, 32);
        const rippleMat = new THREE.MeshBasicMaterial({
            color: 0xfbbf24,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const ripple = new THREE.Mesh(rippleGeo, rippleMat);
        ripple.position.set(wave.x, wave.y, wave.z);
        this.scene.add(ripple);
        wave.ripple = ripple;
        
        // Pulse the sun on click
        this.sunPulse = 1.5;
    }
    
    updateClickWaves() {
        for (let i = this.clickWaves.length - 1; i >= 0; i--) {
            const wave = this.clickWaves[i];
            wave.radius += wave.speed;
            wave.life -= 0.015;
            
            if (wave.ripple) {
                wave.ripple.scale.setScalar(wave.radius);
                wave.ripple.material.opacity = wave.life * 0.9;
            }
            
            // Push particles
            this.particles.forEach(particle => {
                const dx = particle.position.x - wave.x;
                const dy = particle.position.y - wave.y;
                const dz = particle.position.z - wave.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                const waveDist = Math.abs(dist - wave.radius);
                if (waveDist < 10) {
                    const force = (1 - waveDist / 10) * wave.strength * wave.life;
                    particle.userData.radius += force * 0.1;
                    particle.userData.verticalOffset += (dy / (dist || 1)) * force * 0.5;
                }
            });
            
            // Affect planet orbits slightly
            this.planets.forEach(planet => {
                const dx = planet.position.x - wave.x;
                const dy = planet.position.y - wave.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < wave.radius + 15 && dist > wave.radius - 15) {
                    planet.userData.speedBoost = (planet.userData.speedBoost || 0) + 0.01 * wave.life;
                }
            });
            
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
        
        this.time += 0.016;
        
        // Smooth mouse follow
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;
        
        // Tilt entire solar system with mouse
        this.solarSystem.rotation.y = this.mouse.x * 0.3;
        this.solarSystem.rotation.x = 0.3 + this.mouse.y * 0.2;
        this.orbitGroup.rotation.y = this.mouse.x * 0.3;
        this.orbitGroup.rotation.x = 0.3 + this.mouse.y * 0.2;
        this.particleGroup.rotation.y = this.mouse.x * 0.3;
        this.particleGroup.rotation.x = 0.3 + this.mouse.y * 0.2;
        
        // === ANIMATE SUN ===
        // Sun pulse (from clicks or natural)
        if (this.sunPulse > 1) {
            this.sunPulse -= 0.02;
        }
        const basePulse = 1 + Math.sin(this.time * 2) * 0.05;
        const pulse = basePulse * (this.sunPulse || 1);
        this.sunCore.scale.setScalar(pulse);
        
        // Rotate sun inner structure
        this.sunInner.rotation.x += 0.01;
        this.sunInner.rotation.y += 0.015;
        
        // Animate corona rays
        this.coronaRays.forEach((ray, i) => {
            const rayPulse = 1 + Math.sin(this.time * 3 + i * 0.5) * 0.3;
            ray.scale.y = rayPulse;
            ray.material.opacity = 0.2 + Math.sin(this.time * 2 + i) * 0.15;
        });
        
        // === ANIMATE PLANETS ===
        this.planets.forEach((planet, i) => {
            const data = planet.userData;
            
            // Orbital motion
            const speedBoost = data.speedBoost || 0;
            data.angle += data.speed + speedBoost;
            data.speedBoost = speedBoost * 0.95; // Decay boost
            
            planet.position.x = Math.cos(data.angle) * data.orbitRadius;
            planet.position.z = Math.sin(data.angle) * data.orbitRadius;
            planet.position.y = Math.sin(data.angle * 2) * 2; // Slight vertical bob
            
            // Rotate planet
            if (data.wire) {
                data.wire.rotation.x += 0.02;
                data.wire.rotation.y += 0.03;
            }
            if (data.ring) {
                data.ring.rotation.z += 0.01;
            }
            
            // Planet pulse
            const planetPulse = 1 + Math.sin(this.time * 1.5 + i * 2) * 0.1;
            planet.children[0].scale.setScalar(planetPulse);
        });
        
        // === ANIMATE PARTICLES ===
        this.particles.forEach((particle, i) => {
            const data = particle.userData;
            
            // Orbital motion
            data.angle += data.orbitSpeed;
            
            // Gradually return radius to original
            const targetRadius = data.radius > 50 ? data.radius * 0.99 : data.radius;
            
            particle.position.x = Math.cos(data.angle) * targetRadius;
            particle.position.z = Math.sin(data.angle) * targetRadius;
            
            // Vertical wave motion
            const verticalWave = Math.sin(this.time * data.verticalSpeed * 10 + data.phase) * 3;
            data.verticalOffset *= 0.99; // Decay any disturbance
            particle.position.y = data.verticalOffset + verticalWave;
            
            // Twinkle
            particle.material.opacity = data.originalOpacity * (0.6 + Math.sin(this.time * data.pulseSpeed + i) * 0.4);
        });
        
        // Update click waves
        this.updateClickWaves();
        
        this.renderer.render(this.scene, this.camera);
    }
    
    addEventListeners() {
        document.addEventListener('mousemove', (e) => {
            const rect = this.heroSection.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.mouse.targetX = (x / this.width) * 2 - 1;
            this.mouse.targetY = (y / this.height) * 2 - 1;
            
            this.mouse.targetX = Math.max(-1, Math.min(1, this.mouse.targetX));
            this.mouse.targetY = Math.max(-1, Math.min(1, this.mouse.targetY));
        });
        
        // Click creates explosion + sun pulse
        this.heroSection.addEventListener('click', (e) => {
            const rect = this.heroSection.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / this.width) * 2 - 1;
            const y = ((e.clientY - rect.top) / this.height) * 2 - 1;
            this.createClickWave(x, y);
        });
        
        window.addEventListener('resize', () => {
            this.updateDimensions();
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.width, this.height);
        });
        
        // Touch support
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

document.addEventListener('DOMContentLoaded', () => {
    new SSIPBackground();
});
