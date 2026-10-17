/* =========================================================== */
/* === ARQUIVO: codelei/slider.js (Quantum Cinematic v3.0) === */
/* === FUNÇÃO: Efeito Ken Burns, Smart Pause e Gestos Touch === */
/* =========================================================== */

document.addEventListener("DOMContentLoaded", function() {
    
    const slides = document.querySelectorAll('.slider-image');
    const container = document.querySelector('.hero-slider');
    
    // Se não houver slider, encerra.
    if (slides.length === 0) return;

    // 1. INJEÇÃO DE CSS CINEMATOGRÁFICO (KEN BURNS)
    // Cria o movimento suave de zoom e fade sem sujar o arquivo CSS principal
    const style = document.createElement('style');
    style.innerHTML = `
        .slider-image {
            opacity: 0;
            transform: scale(1);
            transition: opacity 1.5s ease-in-out, transform 7s linear;
            will-change: opacity, transform;
            z-index: 0;
        }
        .slider-image.active {
            opacity: 1;
            transform: scale(1.1); /* O Zoom Lento */
            z-index: 1;
        }
    `;
    document.head.appendChild(style);

    let currentSlide = 0;
    let slideInterval;
    const intervalTime = 5000; // 5 segundos
    let isPaused = false;

    // --- FUNÇÃO DE TROCA ---
    function nextSlide() {
        // Remove a classe da atual (reseta o zoom)
        slides[currentSlide].classList.remove('active');
        
        // Calcula próxima
        currentSlide = (currentSlide + 1) % slides.length;
        
        // Ativa a próxima (inicia zoom e fade)
        slides[currentSlide].classList.add('active');
    }

    // --- CONTROLE DO MOTOR (Start/Stop) ---
    function startSlider() {
        if (!slideInterval && !isPaused) {
            slideInterval = setInterval(nextSlide, intervalTime);
            // console.log("▶️ [Quantum Slider] Motor ligado.");
        }
    }

    function stopSlider() {
        clearInterval(slideInterval);
        slideInterval = null;
        // console.log("⏸️ [Quantum Slider] Motor em stand-by.");
    }

    // --- 2. INTELIGÊNCIA DE SCROLL (INTERSECTION OBSERVER) ---
    // Se o slider saiu da tela (usuário desceu), PAUSA para economizar bateria/GPU
    if ('IntersectionObserver' in window && container) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    isPaused = false;
                    startSlider();
                } else {
                    isPaused = true;
                    stopSlider();
                }
            });
        }, { threshold: 0 }); // 0% visível = pausa
        
        observer.observe(container);
    } else {
        // Fallback para navegadores antigos
        startSlider();
    }

    // --- 3. INTELIGÊNCIA DE ABA (VISIBILITY API) ---
    document.addEventListener("visibilitychange", function() {
        if (document.hidden) {
            stopSlider();
        } else if (!isPaused) { // Só retoma se estiver na tela
            startSlider();
        }
    });

    // --- 4. SUPORTE A GESTOS (SWIPE NO CELULAR) ---
    let touchStartX = 0;
    let touchEndX = 0;

    if (container) {
        container.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, {passive: true});

        container.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, {passive: true});
    }

    function handleSwipe() {
        // Deslize para esquerda (Próximo)
        if (touchStartX - touchEndX > 50) {
            stopSlider(); // Para o automático
            nextSlide();
            startSlider(); // Reinicia contagem
        }
        // Deslize para direita (Anterior)
        if (touchEndX - touchStartX > 50) {
            stopSlider();
            slides[currentSlide].classList.remove('active');
            // Lógica para voltar um
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            slides[currentSlide].classList.add('active');
            startSlider();
        }
    }

    // Inicialização Imediata (Garante que a primeira imagem apareça)
    slides[currentSlide].classList.add('active');
});