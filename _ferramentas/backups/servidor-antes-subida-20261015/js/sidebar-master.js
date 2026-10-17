/* =========================================================== */
/* === FICHEIRO: js/sidebar-master.js (Search Elite V2) ====== */
/* === FUNÇÃO: Busca Imersiva para a Página de Notícias ====== */
/* =========================================================== */

document.addEventListener("DOMContentLoaded", function() {
    setTimeout(initSidebarAutomation, 500);
});

function initSidebarAutomation() {
    if (typeof dbNoticias === 'undefined') return;
    console.log("🚀 [Sidebar Master] Sistema de Busca Imersiva Ativo.");
    injectSearchModal(); 
}

function injectSearchModal() {
    if(document.getElementById('immersive-search-overlay')) return;

    const modalHTML = `
        <div id="immersive-search-overlay">
            <button class="close-search-btn" onclick="closeImmersiveSearch()">&times;</button>
            <div class="search-container">
                <h2 class="font-teko text-gold mb-4 text-center" style="color:#d4af37;">PROCURAR JURISPRUDÊNCIA / NOTÍCIA</h2>
                <input type="text" id="immersive-input" placeholder="Digite um crime, lei ou tema..." autocomplete="off">
                <div id="immersive-results" class="mt-4"></div>
            </div>
        </div>
        <style>
            #immersive-search-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(5, 5, 5, 0.98); backdrop-filter: blur(15px);
                z-index: 100000; display: none; opacity: 0; transition: opacity 0.3s;
                justify-content: center; align-items: flex-start; padding-top: 10vh; overflow-y: auto;
            }
            #immersive-search-overlay.active { display: flex; opacity: 1; }
            .search-container { width: 100%; max-width: 800px; padding: 20px; }
            #immersive-input {
                width: 100%; background: transparent; border: none; border-bottom: 2px solid #333;
                color: #fff; font-size: 2rem; font-family: 'Teko'; text-align: center;
                padding: 10px; outline: none; transition: 0.3s;
            }
            #immersive-input:focus { border-color: #d4af37; }
            .close-search-btn { position: absolute; top: 20px; right: 40px; font-size: 3rem; color: #666; background: none; border: none; cursor: pointer; transition: 0.3s; }
            .close-search-btn:hover { color: #d4af37; transform: rotate(90deg); }
            .search-result-item { display: flex; gap: 15px; padding: 15px; border-bottom: 1px solid #222; transition: 0.2s; text-decoration: none; align-items: center; }
            .search-result-item:hover { background: rgba(212, 175, 55, 0.05); border-left: 3px solid #d4af37; }
            .s-img { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; filter: grayscale(100%); }
            .s-content h5 { color: #fff; margin: 0; font-size: 1.1rem; }
            .s-content span { color: #d4af37; font-size: 0.8rem; font-family: 'Teko'; letter-spacing: 1px;}
        </style>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('immersive-input').addEventListener('input', function(e) {
        doImmersiveSearch(e.target.value);
    });
    
    document.addEventListener('keydown', function(e) { if(e.key === "Escape") closeImmersiveSearch(); });
}

window.openImmersiveSearch = function(initialTerm = '') {
    const modal = document.getElementById('immersive-search-overlay');
    const input = document.getElementById('immersive-input');
    modal.classList.add('active');
    input.value = initialTerm;
    input.focus();
    if(initialTerm) doImmersiveSearch(initialTerm);
};

window.closeImmersiveSearch = function() {
    document.getElementById('immersive-search-overlay').classList.remove('active');
};

function doImmersiveSearch(term) {
    const container = document.getElementById('immersive-results');
    const cleanTerm = term.toLowerCase();
    
    if (cleanTerm.length < 2) { container.innerHTML = ''; return; }

    const results = dbNoticias.filter(n => n.titulo.toLowerCase().includes(cleanTerm) || n.categoria.toLowerCase().includes(cleanTerm)).slice(0, 6);

    let html = '';
    if (results.length > 0) {
        results.forEach(n => {
            html += `
                <a href="${n.link}" class="search-result-item">
                    <img src="${n.imagem}" class="s-img">
                    <div class="s-content"><span>${n.categoria}</span><h5>${n.titulo}</h5></div>
                    <i class="fas fa-chevron-right text-gold ms-auto" style="color:#d4af37;"></i>
                </a>
            `;
        });
    } else {
        html = `<p class="text-center text-secondary mt-4 font-teko fs-4">NENHUM RESULTADO ENCONTRADO</p>`;
    }
    container.innerHTML = html;
}