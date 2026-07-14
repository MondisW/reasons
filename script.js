/* =============================================================
   1. Scroll-triggered card reveal
   Sets a --i custom property on each list item so the CSS
   keyframe stagger (animation-delay: calc(var(--i) * step))
   can fire once the parent card enters the viewport.
   ============================================================= */
(function initRevealAnimations() {
    const cards = document.querySelectorAll('[data-animate]');

    cards.forEach((card) => {
        const items = card.querySelectorAll('ul.good li');
        items.forEach((li, index) => {
            li.style.setProperty('--i', index);
        });
    });

    if (!('IntersectionObserver' in window)) {
        // Fallback for very old browsers: just show everything.
        cards.forEach((card) => card.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    cards.forEach((card) => observer.observe(card));
})();

/* =============================================================
   2. Floating heart particle field
   Lightweight canvas system: each particle is a small hand-
   drawn-style heart outline that drifts upward with a gentle
   sine-wave sway, fades in/out, then respawns at the bottom.
   Pauses automatically when the tab is hidden or the user
   prefers reduced motion.
   ============================================================= */
(function initHeartField() {
    const canvas = document.getElementById('hearts-canvas');
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    let animationId = null;
    let isRunning = true;

    const PARTICLE_COUNT_BASE = 22; // baseline for a 1440px-wide viewport

    class HeartParticle {
        constructor() {
            this.reset(true);
        }

        reset(initialSpawn) {
            this.x = Math.random() * width;
            this.y = initialSpawn ? Math.random() * height : height + 30;
            this.size = 6 + Math.random() * 10;
            this.speed = 0.15 + Math.random() * 0.35;
            this.sway = 0.5 + Math.random() * 1.2;
            this.swayOffset = Math.random() * Math.PI * 2;
            this.rotation = (Math.random() - 0.5) * 0.4;
            this.opacity = 0;
            this.maxOpacity = 0.12 + Math.random() * 0.18;
            this.life = 0;
            this.fadeInDuration = 90 + Math.random() * 60;
            this.fadeOutStart = height * (0.15 + Math.random() * 0.1);
        }

        update() {
            this.life += 1;
            this.y -= this.speed;
            this.x += Math.sin(this.life * 0.02 + this.swayOffset) * (this.sway * 0.05);

            if (this.life < this.fadeInDuration) {
                this.opacity = (this.life / this.fadeInDuration) * this.maxOpacity;
            } else if (this.y < this.fadeOutStart) {
                const fadeProgress = Math.max(this.y / this.fadeOutStart, 0);
                this.opacity = fadeProgress * this.maxOpacity;
            } else {
                this.opacity = this.maxOpacity;
            }

            if (this.y < -20) {
                this.reset(false);
            }
        }

        draw(context) {
            context.save();
            context.translate(this.x, this.y);
            context.rotate(this.rotation);
            context.strokeStyle = `rgba(255, 154, 213, ${this.opacity.toFixed(3)})`;
            context.lineWidth = 1.4;
            context.beginPath();

            const s = this.size;
            // Simple heart path built from two arcs and a point,
            // drawn as an outline to echo the hand-drawn artwork.
            context.moveTo(0, s * 0.3);
            context.bezierCurveTo(-s, -s * 0.4, -s * 0.5, -s, 0, -s * 0.2);
            context.bezierCurveTo(s * 0.5, -s, s, -s * 0.4, 0, s * 0.3);
            context.closePath();
            context.stroke();
            context.restore();
        }
    }

    function targetParticleCount() {
        const scaleFactor = Math.max(width / 1440, 0.4);
        return Math.round(PARTICLE_COUNT_BASE * scaleFactor);
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const desired = targetParticleCount();
        if (particles.length < desired) {
            while (particles.length < desired) {
                particles.push(new HeartParticle());
            }
        } else {
            particles.length = desired;
        }
    }

    function tick() {
        if (!isRunning) return;
        ctx.clearRect(0, 0, width, height);
        for (const particle of particles) {
            particle.update();
            particle.draw(ctx);
        }
        animationId = requestAnimationFrame(tick);
    }

    function start() {
        if (animationId === null) {
            isRunning = true;
            animationId = requestAnimationFrame(tick);
        }
    }

    function stop() {
        isRunning = false;
        if (animationId !== null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stop();
        } else {
            start();
        }
    });

    window.addEventListener('resize', resize);

    resize();
    start();
})();
