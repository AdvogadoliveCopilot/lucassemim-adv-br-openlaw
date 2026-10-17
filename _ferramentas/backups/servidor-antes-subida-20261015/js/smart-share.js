/* =========================================================== */
/* === FICHEIRO: js/smart-share.js (Prova Social Elite V2) === */
/* === FUNÇÃO: Botões de Partilha e Contador Psicológico ===== */
/* =========================================================== */

document.addEventListener("DOMContentLoaded", function() {
    initSmartShare();
});

function initSmartShare() {
    const shareButtons = document.querySelectorAll('.share-btn');
    if (shareButtons.length === 0) return;

    const pageUrl = encodeURIComponent(window.location.href);
    const pageTitle = encodeURIComponent(document.title.split('|')[0].trim());

    // Algoritmo de "Prova Social" (Contador Psicológico)
    let baseCount = 0;
    for (let i = 0; i < window.location.href.length; i++) { baseCount += window.location.href.charCodeAt(i); }
    const shareCount = (baseCount % 250) + 45; 

    // Configura Botões e Estilo Glassmorphism
    shareButtons.forEach(btn => {
        const icon = btn.querySelector('i');
        
        btn.style.transition = "all 0.3s ease";
        btn.style.background = "rgba(15, 15, 15, 0.6)";
        btn.style.border = "1px solid rgba(255,255,255,0.1)";
        btn.style.backdropFilter = "blur(5px)";
        btn.style.color = "#ccc";

        btn.addEventListener('mouseenter', () => { 
            btn.style.transform = "translateY(-3px)"; 
            btn.style.borderColor = "#d4af37";
            btn.style.color = "#d4af37"; 
            btn.style.boxShadow = "0 5px 15px rgba(212,175,55,0.2)";
        });
        btn.addEventListener('mouseleave', () => { 
            btn.style.transform = "translateY(0)"; 
            btn.style.borderColor = "rgba(255,255,255,0.1)";
            btn.style.color = "#ccc"; 
            btn.style.boxShadow = "none";
        });

        if (icon.classList.contains('fa-whatsapp')) {
            btn.href = `https://api.whatsapp.com/send?text=🚨 *${pageTitle}*%0A%0ALeia agora: ${pageUrl}`;
            btn.target = "_blank";
        } else if (icon.classList.contains('fa-linkedin-in')) {
            btn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`;
            btn.target = "_blank";
        }
    });

    // Injeta o Contador Visual (Badge Elite)
    const container = shareButtons[0].parentElement;
    if (!document.getElementById('share-counter-badge')) {
        const badge = document.createElement('div');
        badge.id = 'share-counter-badge';
        badge.className = 'ms-3 px-3 py-1 rounded';
        badge.style.cssText = "background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); border-left: 3px solid #d4af37;";
        badge.innerHTML = `
            <small class="text-white font-teko" style="letter-spacing:1px; font-size:1.1rem;">
                <i class="fas fa-fire text-gold me-1" style="color: #d4af37;"></i> 
                <span id="share-counter-number" class="fw-bold">${shareCount}</span> 
                <span style="color:#aaa;">LEITORES ENGAJADOS</span>
            </small>
        `;
        container.appendChild(badge);
    }
}