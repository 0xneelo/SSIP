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
        this.mouseScreen = { x: 0, y: 0 }; // For raycasting
        this.clickWaves = [];
        this.time = 0;
        this.labels = [];
        this.hoveredObject = null;
        this.updateDimensions();
        
        this.init();
        this.createSolarSystem();
        this.createParticles();
        this.createOrbits();
        this.createLabels();
        this.createTooltip();
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
        
        // Position solar system to the right side but not cut off
        const xOffset = 20; // Centered more on the right half
        const zOffset = -5; // Closer for better visibility
        this.solarSystem.position.set(xOffset, 0, zOffset);
        this.orbitGroup.position.set(xOffset, 0, zOffset);
        this.particleGroup.position.set(xOffset, 0, zOffset);
        
        this.scene.add(this.solarSystem);
        this.scene.add(this.particleGroup);
        this.scene.add(this.orbitGroup);
        
        // Raycaster for hover detection
        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Sphere = { threshold: 2 }; // Increase detection radius
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
        
        // Radiating glow layers - dynamic pulsing rings
        this.sunGlowLayers = [];
        const glowCount = 5;
        for (let i = 1; i <= glowCount; i++) {
            const glowGeo = new THREE.SphereGeometry(3.5 + i * 1.5, 32, 32);
            const glowMat = new THREE.MeshBasicMaterial({
                color: i <= 2 ? 0xf59e0b : 0xfbbf24,
                transparent: true,
                opacity: 0.25 / i
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.userData = { 
                baseOpacity: 0.3 / i, 
                layer: i,
                phaseOffset: i * 0.8 // Different phase for each layer
            };
            this.sunGlowLayers.push(glow);
            this.sun.add(glow);
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
        
        // === PLANETS === (sized to fit screen)
        this.planets = [];
        
        const planetData = [
            { name: 'Janich PRG', color: 0xf59e0b, orbitRadius: 14, speed: 0.006, size: 1.4, startAngle: 0 },
            { name: 'SYMMIO', color: 0xfbbf24, orbitRadius: 22, speed: 0.009, size: 1.6, startAngle: Math.PI * 2/3 },
            { name: 'Futarchy', color: 0xfcd34d, orbitRadius: 30, speed: 0.004, size: 1.3, startAngle: Math.PI * 4/3 }
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
        // Create visible orbit paths - sized to fit screen
        const orbitRadii = [14, 22, 30];
        const orbitColors = [0xf59e0b, 0xfbbf24, 0xfcd34d];
        
        orbitRadii.forEach((radius, i) => {
            const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
            const points = curve.getPoints(80);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: orbitColors[i],
                transparent: true,
                opacity: 0.12
            });
            const orbit = new THREE.Line(geometry, material);
            orbit.rotation.x = Math.PI / 2;
            this.orbitGroup.add(orbit);
        });
        
        // Orbit group tilts slightly for 3D effect
        this.orbitGroup.rotation.x = 0.4;
        this.solarSystem.rotation.x = 0.4;
    }
    
    createLabels() {
        // Create HTML labels for sun and planets
        const labelData = [
            { name: 'SSIP', target: 'sun', color: '#ffffff', size: '18px', fontWeight: '800', isSun: true },
            { name: 'PRG', target: 0, color: '#f59e0b', size: '11px', fontWeight: '600' },
            { name: 'SYMMIO', target: 1, color: '#fbbf24', size: '11px', fontWeight: '600' },
            { name: 'Futarchy', target: 2, color: '#fcd34d', size: '11px', fontWeight: '600' }
        ];
        
        this.labelContainer = document.createElement('div');
        this.labelContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        `;
        this.container.appendChild(this.labelContainer);
        
        labelData.forEach(data => {
            const label = document.createElement('div');
            label.textContent = data.name;
            
            if (data.isSun) {
                // Special styling for SSIP - diamond logo shape background
                label.style.cssText = `
                    position: absolute;
                    transform: translate(-50%, -50%);
                    width: 80px;
                    height: 80px;
                `;
                
                // Create diamond backdrop matching logo
                const diamond = document.createElement('div');
                diamond.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 60px;
                    height: 60px;
                    background: rgba(10, 10, 11, 0.9);
                    border: 2px solid #f59e0b;
                    transform: translate(-50%, -50%) rotate(45deg);
                    box-shadow: 0 0 20px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.3);
                `;
                
                // Text centered on top
                const textSpan = document.createElement('span');
                textSpan.textContent = data.name;
                textSpan.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: ${data.color};
                    font-family: 'JetBrains Mono', monospace;
                    font-size: ${data.size};
                    font-weight: ${data.fontWeight};
                    letter-spacing: 0.1em;
                    text-shadow: 0 0 10px rgba(245, 158, 11, 0.8);
                    white-space: nowrap;
                    z-index: 1;
                `;
                
                label.textContent = '';
                label.appendChild(diamond);
                label.appendChild(textSpan);
            } else {
                label.style.cssText = `
                    position: absolute;
                    color: ${data.color};
                    font-family: 'JetBrains Mono', monospace;
                    font-size: ${data.size};
                    font-weight: ${data.fontWeight};
                    text-shadow: 0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6);
                    white-space: nowrap;
                    transform: translate(-50%, -50%);
                    opacity: 0.9;
                    letter-spacing: 0.05em;
                `;
            }
            this.labelContainer.appendChild(label);
            this.labels.push({ element: label, target: data.target });
        });
    }
    
    updateLabels() {
        // Ensure matrices are up to date
        this.solarSystem.updateMatrixWorld(true);
        
        this.labels.forEach(label => {
            let position;
            let screenYOffset = 0;
            
            if (label.target === 'sun') {
                position = new THREE.Vector3();
                this.sun.getWorldPosition(position);
            } else {
                const planet = this.planets[label.target];
                if (planet) {
                    position = new THREE.Vector3();
                    planet.getWorldPosition(position);
                    screenYOffset = 25; // Offset label below planet in screen space
                }
            }
            
            if (position) {
                // Project 3D position to 2D screen coordinates
                position.project(this.camera);
                
                const x = (position.x * 0.5 + 0.5) * this.width;
                const y = (-position.y * 0.5 + 0.5) * this.height + screenYOffset;
                
                // Only show label if it's in front of camera
                if (position.z < 1) {
                    label.element.style.left = `${x}px`;
                    label.element.style.top = `${y}px`;
                    label.element.style.display = 'block';
                } else {
                    label.element.style.display = 'none';
                }
            }
        });
    }
    
    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.style.cssText = `
            position: absolute;
            background: rgba(10, 10, 11, 0.95);
            border: 1px solid rgba(245, 158, 11, 0.5);
            border-radius: 8px;
            padding: 12px 16px;
            color: #fafafa;
            font-family: 'Manrope', sans-serif;
            font-size: 13px;
            line-height: 1.5;
            max-width: 280px;
            pointer-events: none;
            z-index: 100;
            opacity: 0;
            transform: translate(-50%, -100%) translateY(-15px);
            transition: opacity 0.2s ease, transform 0.2s ease;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 30px rgba(245, 158, 11, 0.1);
        `;
        this.container.appendChild(this.tooltip);
        
        // Tooltip content for each object
        this.tooltipData = {
            'sun': {
                title: 'SSIP',
                subtitle: 'Symmio Sovereign Intent Protocol',
                description: 'The core protocol fusing anarcho-capitalism, bilateral settlement, and prediction market governance into a unified system.'
            },
            0: {
                title: 'PRG',
                subtitle: 'Privatrechtsgesellschaft',
                description: 'Oliver Janich\'s Private Law Society — the philosophical foundation based on voluntary contracts and the Non-Aggression Principle.'
            },
            1: {
                title: 'SYMMIO',
                subtitle: 'Bilateral Settlement Protocol',
                description: 'Technical infrastructure providing bilateral isolation, CVA collateral management, and solver competition mechanisms.'
            },
            2: {
                title: 'Futarchy',
                subtitle: 'Prediction Market Governance',
                description: 'Robin Hanson\'s governance model — "Vote on values, bet on beliefs" — replacing democracy with outcome-based markets.'
            }
        };
    }
    
    showTooltip(key, screenX, screenY) {
        const data = this.tooltipData[key];
        if (!data) return;
        
        this.tooltip.innerHTML = `
            <div style="color: #f59e0b; font-weight: 700; font-size: 14px; margin-bottom: 2px;">${data.title}</div>
            <div style="color: #a1a1aa; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">${data.subtitle}</div>
            <div style="color: #d4d4d8;">${data.description}</div>
        `;
        
        this.tooltip.style.left = `${screenX}px`;
        this.tooltip.style.top = `${screenY}px`;
        this.tooltip.style.opacity = '1';
        this.tooltip.style.transform = 'translate(-50%, -100%) translateY(-20px)';
    }
    
    hideTooltip() {
        this.tooltip.style.opacity = '0';
        this.tooltip.style.transform = 'translate(-50%, -100%) translateY(-15px)';
    }
    
    checkHover() {
        // Create mouse vector for raycasting
        const mouse = new THREE.Vector2(this.mouseScreen.x, this.mouseScreen.y);
        this.raycaster.setFromCamera(mouse, this.camera);
        
        // Get all interactive objects (sun core + planet cores)
        const interactiveObjects = [this.sunCore];
        this.planets.forEach(planet => {
            // Get the first child (the core sphere)
            if (planet.children[0]) {
                interactiveObjects.push(planet.children[0]);
            }
        });
        
        const intersects = this.raycaster.intersectObjects(interactiveObjects, false);
        
        if (intersects.length > 0) {
            const hitObject = intersects[0].object;
            
            // Determine which object was hit
            let key = null;
            let targetObject = null;
            
            if (hitObject === this.sunCore) {
                key = 'sun';
                targetObject = this.sun;
            } else {
                this.planets.forEach((planet, index) => {
                    if (planet.children[0] === hitObject) {
                        key = index;
                        targetObject = planet;
                    }
                });
            }
            
            if (key !== null && key !== this.hoveredObject) {
                this.hoveredObject = key;
                
                // Get screen position for tooltip
                const position = targetObject.position.clone();
                position.applyMatrix4(this.solarSystem.matrixWorld);
                position.project(this.camera);
                
                const screenX = (position.x * 0.5 + 0.5) * this.width;
                const screenY = (-position.y * 0.5 + 0.5) * this.height;
                
                this.showTooltip(key, screenX, screenY);
            }
        } else {
            if (this.hoveredObject !== null) {
                this.hoveredObject = null;
                this.hideTooltip();
            }
        }
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
                radius = 5 + Math.random() * 5;
                orbitSpeed = 0.015 + Math.random() * 0.015;
            } else {
                // Particles in orbital bands (sized to fit screen)
                const baseRadius = [14, 22, 30][band - 1];
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
        
        // Create geometric explosion group
        const geoGroup = new THREE.Group();
        geoGroup.position.set(wave.x, wave.y, wave.z);
        wave.shapes = [];
        
        // Geometry types: triangle, square, hexagon, octagon
        const geometries = [
            new THREE.RingGeometry(0.8, 1.0, 3),   // Triangle
            new THREE.RingGeometry(1.0, 1.2, 4),   // Square
            new THREE.RingGeometry(0.6, 0.8, 6),   // Hexagon
            new THREE.RingGeometry(1.2, 1.4, 8),   // Octagon
            new THREE.RingGeometry(0.5, 0.7, 3),   // Small triangle
            new THREE.RingGeometry(0.9, 1.1, 4),   // Another square
        ];
        
        const colors = [0xf59e0b, 0xfbbf24, 0xfcd34d, 0xfef3c7];
        
        geometries.forEach((geo, i) => {
            const mat = new THREE.MeshBasicMaterial({
                color: colors[i % colors.length],
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            const shape = new THREE.Mesh(geo, mat);
            
            // Random rotation and direction
            shape.rotation.z = Math.random() * Math.PI * 2;
            shape.userData = {
                rotationSpeed: (Math.random() - 0.5) * 0.15,
                expandSpeed: 0.8 + Math.random() * 0.6,
                directionX: (Math.random() - 0.5) * 0.5,
                directionY: (Math.random() - 0.5) * 0.5,
                delay: i * 0.02 // Stagger appearance
            };
            
            wave.shapes.push(shape);
            geoGroup.add(shape);
        });
        
        this.scene.add(geoGroup);
        wave.geoGroup = geoGroup;
        
        // Pulse the sun on click
        this.sunPulse = 1.5;
    }
    
    updateClickWaves() {
        for (let i = this.clickWaves.length - 1; i >= 0; i--) {
            const wave = this.clickWaves[i];
            wave.radius += wave.speed;
            wave.life -= 0.018;
            
            // Animate each geometric shape
            if (wave.shapes) {
                wave.shapes.forEach((shape, idx) => {
                    const data = shape.userData;
                    
                    // Delayed start
                    if (wave.life > 1 - data.delay) return;
                    
                    // Expand outward
                    const scale = (1 - wave.life) * 8 * data.expandSpeed;
                    shape.scale.setScalar(scale);
                    
                    // Drift in random direction
                    shape.position.x += data.directionX;
                    shape.position.y += data.directionY;
                    
                    // Rotate
                    shape.rotation.z += data.rotationSpeed;
                    
                    // Fade out
                    shape.material.opacity = wave.life * 0.8;
                });
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
                // Clean up geometric shapes
                if (wave.geoGroup) {
                    wave.shapes.forEach(shape => {
                        shape.geometry.dispose();
                        shape.material.dispose();
                    });
                    this.scene.remove(wave.geoGroup);
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
        const sunHovered = this.hoveredObject === 'sun';
        
        // Sun pulse (from clicks or natural) - bigger when hovered
        if (this.sunPulse > 1) {
            this.sunPulse -= 0.02;
        }
        const sunBasePulse = sunHovered ? 1.15 : 1;
        const sunPulseAmount = sunHovered ? 0.03 : 0.05;
        const basePulse = sunBasePulse + Math.sin(this.time * 2) * sunPulseAmount;
        const pulse = basePulse * (this.sunPulse || 1);
        this.sunCore.scale.setScalar(pulse);
        
        // Brighten sun when hovered
        this.sunCore.material.opacity = sunHovered ? 0.95 : 0.7;
        
        // Rotate sun inner structure - slower when hovered
        const sunRotationSpeed = sunHovered ? 0.003 : 0.01;
        this.sunInner.rotation.x += sunRotationSpeed;
        this.sunInner.rotation.y += sunRotationSpeed * 1.5;
        
        // Animate radiating glow layers - faster pulsing opacity
        this.sunGlowLayers.forEach((glow, i) => {
            const data = glow.userData;
            // Multiple overlapping sin waves for organic breathing effect
            const wave1 = Math.sin(this.time * 4 + data.phaseOffset) * 0.5;
            const wave2 = Math.sin(this.time * 6.5 + data.phaseOffset * 1.3) * 0.3;
            const wave3 = Math.sin(this.time * 2.5 + data.phaseOffset * 0.7) * 0.2;
            const combinedWave = (wave1 + wave2 + wave3) / 1.0;
            
            // Base opacity varies by layer, increases when hovered
            const baseOpacity = sunHovered ? data.baseOpacity * 2 : data.baseOpacity;
            glow.material.opacity = Math.max(0.05, baseOpacity + combinedWave * baseOpacity * 1.5);
            
            // Scale slightly with pulse for breathing effect
            const scalePulse = 1 + combinedWave * 0.08;
            glow.scale.setScalar(scalePulse);
        });
        
        // === ANIMATE PLANETS ===
        this.planets.forEach((planet, i) => {
            const data = planet.userData;
            const isHovered = this.hoveredObject === i;
            
            // Orbital motion - PAUSE when hovered
            if (!isHovered) {
                const speedBoost = data.speedBoost || 0;
                data.angle += data.speed + speedBoost;
                data.speedBoost = speedBoost * 0.95; // Decay boost
            }
            
            planet.position.x = Math.cos(data.angle) * data.orbitRadius;
            planet.position.z = Math.sin(data.angle) * data.orbitRadius;
            planet.position.y = Math.sin(data.angle * 2) * 2; // Slight vertical bob
            
            // Rotate planet - slower when hovered
            const rotationSpeed = isHovered ? 0.005 : 0.02;
            if (data.wire) {
                data.wire.rotation.x += rotationSpeed;
                data.wire.rotation.y += rotationSpeed * 1.5;
            }
            if (data.ring) {
                data.ring.rotation.z += rotationSpeed * 0.5;
            }
            
            // Planet pulse - larger when hovered
            const basePulse = isHovered ? 1.3 : 1;
            const pulseAmount = isHovered ? 0.05 : 0.1;
            const planetPulse = basePulse + Math.sin(this.time * 1.5 + i * 2) * pulseAmount;
            planet.children[0].scale.setScalar(planetPulse);
            
            // Brighten planet when hovered
            if (planet.children[0].material) {
                planet.children[0].material.opacity = isHovered ? 0.9 : 0.6;
            }
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
        
        // Update label positions
        this.updateLabels();
        
        // Check for hover
        this.checkHover();
        
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
            
            // Store normalized coordinates for raycasting
            this.mouseScreen.x = (x / this.width) * 2 - 1;
            this.mouseScreen.y = -(y / this.height) * 2 + 1;
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
