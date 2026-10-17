/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-slider.js === */
/* === FUNÇÃO: Slider Platinum com Efeito Ken Burns === */
/* =========================================================== */

window.civelReady(function() {
    const slides = document.querySelectorAll('.civel-slide');
    if (slides.length === 0) return;

    let currentSlide = 0;
    const intervalTime = 6000; // 6 segundos (mais lento para elegância)

    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    setInterval(nextSlide, intervalTime);
    
    console.log("💎 [Slider] Modo Cinematográfico Ativado.");
});