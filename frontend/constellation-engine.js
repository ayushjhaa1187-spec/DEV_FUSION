/**
 * Constellation Engine v1.0 - "Multi-Zone Spark" 
 * Optimized for SkillBridge Landing Page
 */

(function() {
    // Mobile Guard
    if (window.matchMedia('(hover: none)').matches) return;

    const canvas = document.getElementById('constellation-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const instances = [];
    let canvasVisible = false;
    let lastSpawn = 0;
    let mouseX = 0;
    let mouseY = 0;

    const CONFIG = {
        MAX_ACTIVE: 3,
        SPAWN_THROTTLE: 1200,
        STAR_COLOR: 'rgba(210, 228, 255, 0.92)',
        GLOW_COLOR: 'rgba(100, 160, 255, 0.3)',
        LINE_COLOR: 'rgba(210, 228, 255, 0.15)',
        DRIFT_SPEED: 0.4,
        LIFESPAN: 8000,
        ZONE_SELECTORS: [
            '.hero', 
            '.navbar', 
            '.feature-card-small', 
            '.bento-card', 
            '.mentor-card', 
            '.step-card', 
            '.cta', 
            '.trust-bar',
            '.btn-primary'
        ]
    };

    function createStar(options) {
        const speedMult = (0.5 + Math.random());
        return {
            x: options.x,
            y: options.y,
            vx: (Math.random() - 0.5) * CONFIG.DRIFT_SPEED * speedMult,
            vy: (Math.random() - 0.5) * CONFIG.DRIFT_SPEED * speedMult,
            opacity: 0,
            birth: Date.now(),
            update: function() {
                this.x += this.vx;
                this.y += this.vy;
                
                const age = Date.now() - this.birth;
                if (age < 1000) {
                    this.opacity = age / 1000;
                } else if (age > CONFIG.LIFESPAN - 1000) {
                    this.opacity = Math.max(0, (CONFIG.LIFESPAN - age) / 1000);
                } else {
                    this.opacity = 1;
                }
                return age < CONFIG.LIFESPAN;
            },
            draw: function() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, 1.2, 0, Math.PI * 2);
                ctx.fillStyle = CONFIG.STAR_COLOR.replace('0.92', this.opacity * 0.92);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = CONFIG.GLOW_COLOR.replace('0.3', this.opacity * 0.3);
                ctx.fill();
            }
        };
    }

    function createConstellation(x, y) {
        const stars = [];
        const starCount = 6 + Math.floor(Math.random() * 6);
        for (let i = 0; i < starCount; i++) {
            stars.push(createStar({
                x: x + (Math.random() - 0.5) * 100,
                y: y + (Math.random() - 0.5) * 100
            }));
        }
        return {
            stars: stars,
            isDying: false,
            update: function() {
                let alive = false;
                this.stars.forEach(s => {
                    if (s.update()) alive = true;
                });
                return alive && (!this.isDying || this.getAverageOpacity() > 0.01);
            },
            draw: function() {
                this.stars.forEach(s => s.draw());
                this.drawConnections();
            },
            getAverageOpacity: function() {
                return this.stars.reduce((sum, s) => sum + s.opacity, 0) / this.stars.length;
            },
            drawConnections: function() {
                ctx.lineWidth = 0.5;
                ctx.setLineDash([2, 4]);
                for (let i = 0; i < this.stars.length; i++) {
                    for (let j = i + 1; j < this.stars.length; j++) {
                        const s1 = this.stars[i];
                        const s2 = this.stars[j];
                        const dist = Math.hypot(s1.x - s2.x, s1.y - s2.y);
                        if (dist < 150) {
                            const alpha = (1 - dist / 150) * Math.min(s1.opacity, s2.opacity) * 0.15;
                            ctx.beginPath();
                            ctx.moveTo(s1.x, s1.y);
                            ctx.lineTo(s2.x, s2.y);
                            ctx.strokeStyle = `rgba(210, 228, 255, ${alpha})`;
                            ctx.stroke();
                        }
                    }
                }
            }
        };
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function checkZone(target) {
        const targetZones = document.querySelectorAll(CONFIG.ZONE_SELECTORS.join(', '));
        let inZone = false;
        for (let zone of targetZones) {
            if (zone.contains(target)) {
                inZone = true;
                break;
            }
        }
        
        if (inZone && !canvasVisible) {
            canvas.style.opacity = '1';
            canvasVisible = true;
        } else if (!inZone && canvasVisible) {
            canvas.style.opacity = '0';
            canvasVisible = false;
            // Mouseleave cleanup: only mark instances as dying if they are established (alpha > 0.5)
            instances.forEach(inst => {
                if (inst.getAverageOpacity() > 0.5) {
                    inst.isDying = true;
                }
            });
        }
    }

    function spawn() {
        if (!canvasVisible) return;
        
        // CORRECT order: cap check first, then throttle
        if (instances.length >= CONFIG.MAX_ACTIVE) return;
        if (Date.now() - lastSpawn < CONFIG.SPAWN_THROTTLE) return;

        instances.push(createConstellation(mouseX, mouseY));
        lastSpawn = Date.now();
    }

    function animate() {
        // Stop loop if nothing to draw
        if (instances.length === 0 && !canvasVisible) {
            requestAnimationFrame(animate); 
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = instances.length - 1; i >= 0; i--) {
            if (!instances[i].update()) {
                instances.splice(i, 1);
            } else {
                instances[i].draw();
            }
        }
        
        spawn();
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        checkZone(e.target);
    });

    resize();
    animate();
})();
