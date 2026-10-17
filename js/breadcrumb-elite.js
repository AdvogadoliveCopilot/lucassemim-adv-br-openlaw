/* =========================================================== */
/* === FICHEIRO: js/breadcrumb-elite.js (SEO & UI V2) ======== */
/* === FUNÇÃO: Navegação Smart, Glassmorphism e SEO JSON-LD == */
/* =========================================================== */

document.addEventListener("DOMContentLoaded", function() {
    initBreadcrumbElite();
});

function initBreadcrumbElite() {
    const nav = document.querySelector('nav[aria-label="breadcrumb"]');
    if (!nav) return;

    console.log("🧭 [Breadcrumb Elite V2] Ativado com injeção de SEO.");

    // 1. INJEÇÃO DE ESTILO PREMIUM (Glassmorphism e Animações)
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fadeInUpBreadcrumb {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .breadcrumb-elite-wrapper {
            background: rgba(15, 15, 15, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: 50px;
            padding: 8px 25px;
            display: inline-flex;
            align-items: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            transition: all 0.3s ease;
            animation: fadeInUpBreadcrumb 0.6s ease forwards;
        }
        .breadcrumb-elite-wrapper:hover {
            border-color: rgba(212, 175, 55, 0.5);
            box-shadow: 0 4px 25px rgba(212, 175, 55, 0.15);
            transform: translateY(-2px);
        }

        .breadcrumb { margin: 0; padding: 0; background: transparent !important; display: flex; align-items: center; flex-wrap: wrap; }
        
        .breadcrumb-item {
            font-family: 'Teko', sans-serif;
            font-size: 1.15rem;
            letter-spacing: 1px;
            display: flex; align-items: center;
        }
        .breadcrumb-item + .breadcrumb-item::before {
            content: '›' !important; 
            color: #d4af37 !important;
            font-size: 1.6rem;
            line-height: 0.8;
            padding: 0 10px;
            opacity: 0.7;
        }
        
        .breadcrumb-item a {
            color: #aaa !important;
            text-decoration: none;
            transition: 0.3s;
            display: flex; align-items: center; gap: 6px;
        }
        .breadcrumb-item a:hover { color: #fff !important; text-shadow: 0 0 10px rgba(212, 175, 55, 0.5); }

        .breadcrumb-item.active {
            color: #d4af37 !important;
            font-weight: 600;
            text-shadow: 0 0 15px rgba(212, 175, 55, 0.2);
            display: flex; align-items: center; gap: 6px;
        }

        .smart-back-btn {
            margin-right: 15px;
            padding-right: 15px;
            border-right: 1px solid rgba(255,255,255,0.15);
            color: #fff;
            cursor: pointer;
            transition: 0.3s;
            display: flex; align-items: center;
        }
        .smart-back-btn:hover { color: #d4af37; transform: translateX(-4px); }
        
        @media(max-width: 768px) {
            .breadcrumb-elite-wrapper { padding: 6px 15px; border-radius: 8px; }
            .breadcrumb-item { font-size: 1rem; }
        }
    `;
    document.head.appendChild(style);

    // 2. REESTRUTURAÇÃO DO HTML
    const wrapper = document.createElement('div');
    wrapper.className = 'breadcrumb-elite-wrapper';

    const ol = nav.querySelector('ol');
    if (!ol) return; // Segurança
    ol.classList.remove('breadcrumb'); 
    ol.classList.add('breadcrumb'); 
    
    // 3. ENRIQUECIMENTO VISUAL E EXTRAÇÃO DE DADOS PARA SEO
    const items = ol.querySelectorAll('li');
    let schemaListItems = []; // Array para guardar os dados do Google

    items.forEach((item, index) => {
        const link = item.querySelector('a');
        let text = item.innerText.trim().toUpperCase();

        if (link) {
            // Guardar para SEO
            schemaListItems.push({
                "@type": "ListItem",
                "position": index + 1,
                "name": text,
                "item": link.href
            });

            // Ícones Visuais
            if (text === 'HOME' || text === 'INÍCIO') {
                link.innerHTML = `<i class="fas fa-home"></i> <span class="d-none d-sm-inline">${text}</span>`;
            } else if (text === 'NOTÍCIAS' || text.includes('NEWS') || text.includes('INFORMATIVO')) {
                link.innerHTML = `<i class="fas fa-newspaper"></i> ${text}`;
                link.href = "../noticias.html"; // Garante o caminho correto
            }
        } else if (item.classList.contains('active')) {
            // Item atual
            schemaListItems.push({
                "@type": "ListItem",
                "position": index + 1,
                "name": text
            });
            item.innerHTML = `<i class="fas fa-bookmark text-gold"></i> <span class="text-truncate" style="max-width: 200px;">${item.innerText}</span>`;
        }
    });

    // 4. CRIAÇÃO DO BOTÃO "VOLTAR" INTELIGENTE (Smart History)
    const backBtn = document.createElement('div');
    backBtn.className = 'smart-back-btn';
    backBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
    backBtn.title = "Voltar";
    backBtn.onclick = function() {
        // Se o cliente veio do nosso próprio site, volta no histórico para não perder a rolagem
        if (document.referrer.includes(window.location.hostname)) {
            window.history.back();
        } else {
            // Se veio do Google direto para a notícia, o botão manda para a lista de notícias
            window.location.href = '../noticias.html';
        }
    };

    // Montagem Final do UI
    wrapper.appendChild(backBtn);
    wrapper.appendChild(ol);
    nav.innerHTML = ''; 
    nav.appendChild(wrapper);

    // 5. INJEÇÃO DA BOMBA DE SEO (JSON-LD BreadcrumbList)
    if (schemaListItems.length > 0) {
        const schemaJSON = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": schemaListItems
        };
        const scriptSchema = document.createElement('script');
        scriptSchema.type = 'application/ld+json';
        scriptSchema.text = JSON.stringify(schemaJSON);
        document.head.appendChild(scriptSchema);
        console.log("✅ [Breadcrumb SEO] Schema BreadcrumbList injetado na mente do Google.");
    }
}