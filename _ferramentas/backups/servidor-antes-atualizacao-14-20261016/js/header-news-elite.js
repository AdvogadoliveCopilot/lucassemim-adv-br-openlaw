/* =========================================================== */
/* === FICHEIRO: js/header-news-elite.js (Slideshow V2) ====== */
/* === FUNÇÃO: Cabeçalho Cinematográfico para Páginas Master = */
/* =========================================================== */

document.addEventListener("DOMContentLoaded", function() {
    initHeaderElite();
});

function initHeaderElite() {
    const header = document.querySelector('.page-header');
    if (!header) return;

    console.log("🎬 [Header Elite] Slideshow Cinematográfico Ativado.");

    // 1. BANCO DE IMAGENS DE ELITE (Alta Resolução)
    const imagens = [
        "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=2000&auto=format&fit=crop", // Balança Justiça
        "https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2000&auto=format&fit=crop", // Pilares
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2000&auto=format&fit=crop", // Contrato
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2000&auto=format&fit=crop"  // Prisão/Grades
    ];

    // 2. INJETAR ESTILOS CSS PREMIUM
    const style = document.createElement('style');
    style.innerHTML = `
        .page-header {
            position: relative;
            overflow: hidden;
            background: #050505 !important;
            min-height: 45vh; /* Altura imponente */
            display: flex;
            align-items: center;
            justify-content: center;
            border-bottom: 2px solid rgba(212, 175, 55, 0.3);
        }
        
        .elite-bg-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }

        .elite-slide {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background-size: cover; background-position: center;
            opacity: 0; transform: scale(1);
            transition: opacity 2s ease-in-out, transform 12s linear;
        }

        .elite-slide.active { opacity: 1; transform: scale(1.15); }

        /* Overlay Gradiente Perfeito para Leitura */
        .elite-overlay {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(to bottom, rgba(5,5,5,0.85) 0%, rgba(5,5,5,0.6) 50%, #050505 100%);
            z-index: 1;
        }

        .page-header .container { position: relative; z-index: 2; animation: textFloatUp 1.2s ease-out; }

        @keyframes textFloatUp {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    // 3. CONSTRUIR ESTRUTURA HTML
    const bgContainer = document.createElement('div');
    bgContainer.className = 'elite-bg-container';

    imagens.forEach((imgUrl, index) => {
        const slide = document.createElement('div');
        slide.className = index === 0 ? 'elite-slide active' : 'elite-slide';
        slide.style.backgroundImage = `url('${imgUrl}')`;
        bgContainer.appendChild(slide);
    });

    const overlay = document.createElement('div');
    overlay.className = 'elite-overlay';

    header.insertBefore(bgContainer, header.firstChild);
    header.insertBefore(overlay, header.children[1]);

    // 4. MOTOR DO SLIDESHOW
    let currentSlide = 0;
    const slides = document.querySelectorAll('.elite-slide');

    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 6000); 
}