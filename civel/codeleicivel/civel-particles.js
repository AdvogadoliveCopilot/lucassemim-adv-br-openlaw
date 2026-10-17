/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-particles.js === */
/* === FUNÇÃO: Fundo Interativo Leve (Swiss Bank Effect) === */
/* =========================================================== */

window.civelReady(function() {

    // Respeita quem pediu menos animação no sistema (acessibilidade + performance)
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        console.log("✨ [Quantum Graphics] Desativado (prefers-reduced-motion).");
        return;
    }

    // Verifica se é Desktop (para economizar bateria em celulares antigos)
    // Em celulares modernos roda bem, mas vamos limitar a quantidade
    const isMobile = window.innerWidth < 768;
    
    // Configurações Quânticas
    const config = {
        particleCount: isMobile ? 40 : 90,
        colorGold: '212, 175, 55',    // Ouro
        colorSilver: '192, 192, 192', // Prata
        connectDistance: 120,
        mouseDistance: 150
    };

    // 1. CRIA O CANVAS (TELA DE PINTURA)
    const canvas = document.createElement('canvas');
    canvas.id = 'quantum-canvas';
    Object.assign(canvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '-1', // Fica atrás de tudo
        pointerEvents: 'none', // Não atrapalha cliques
        opacity: '0.6' // Sutileza
    });
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    
    // Rastreamento do Mouse
    let mouse = { x: null, y: null };

    window.addEventListener('mousemove', e => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // 2. CLASSE DA PARTÍCULA (O ÁTOMO)
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5; // Velocidade X
            this.vy = (Math.random() - 0.5) * 0.5; // Velocidade Y
            this.size = Math.random() * 2 + 1;
            // 30% Ouro, 70% Prata (Elegância)
            this.isGold = Math.random() > 0.7; 
            this.color = this.isGold ? config.colorGold : config.colorSilver;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bate e volta nas bordas
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;

            // Interação com Mouse (Foge suavemente ou atrai)
            if (mouse.x != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance < config.mouseDistance) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (config.mouseDistance - distance) / config.mouseDistance;
                    
                    // Efeito de Repulsão Suave (Campo de Força)
                    const direction = -1; 
                    this.vx += forceDirectionX * force * direction * 0.05;
                    this.vy += forceDirectionY * force * direction * 0.05;
                }
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, 0.8)`;
            ctx.fill();
        }
    }

    // 3. MOTOR GRÁFICO (RENDER LOOP)
    function init() {
        resize();
        for (let i = 0; i < config.particleCount; i++) {
            particles.push(new Particle());
        }
        animate();
    }

    let rafId = null;

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            // Desenha as conexões (A Rede)
            for (let j = i; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < config.connectDistance) {
                    ctx.beginPath();
                    // A linha fica mais transparente quanto mais longe
                    const opacity = 1 - (distance / config.connectDistance);
                    ctx.strokeStyle = `rgba(180, 180, 180, ${opacity * 0.2})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        rafId = requestAnimationFrame(animate);
    }

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', () => {
        resize();
        // Reinicia para não esticar
        particles = []; 
        for (let i = 0; i < config.particleCount; i++) {
            particles.push(new Particle());
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
        } else if (rafId === null) {
            animate();
        }
    });

    console.log("✨ [Quantum Graphics] Fundo Interativo Ativo.");
    init();
});