/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-toc.js === */
/* === FUNÇÃO: Índice Automático Platinum === */
/* =========================================================== */

window.civelReady(() => {
    const container = document.getElementById('indice-magico-container');
    // Tenta achar o conteúdo em várias classes
    const contentArea = document.querySelector('.artigo-conteudo') || document.querySelector('.artigo-familia');

    if (!container || !contentArea) return;

    const headings = contentArea.querySelectorAll('h2, h3');
    if (headings.length < 2) { container.style.display = 'none'; return; }

    // CSS Injetado
    const style = document.createElement('style');
    style.innerHTML = `
        .indice-platinum {
            background: rgba(15, 15, 15, 0.8);
            border-left: 3px solid #d4af37;
            padding: 20px; margin-bottom: 40px;
            border-radius: 0 10px 10px 0;
        }
        .indice-title {
            font-family: 'Playfair Display', serif; color: #d4af37;
            font-size: 1.4rem; margin-bottom: 15px;
        }
        .indice-list { list-style: none; padding: 0; margin: 0; }
        .indice-list li { margin-bottom: 8px; }
        .indice-link {
            text-decoration: none; color: #999; font-family: 'Lato', sans-serif;
            font-size: 0.9rem; transition: 0.3s; display:block;
        }
        .indice-link:hover { color: #fff; padding-left: 5px; }
        .sub-h3 { margin-left: 15px; font-size: 0.85rem; }
    `;
    document.head.appendChild(style);

    let html = `<nav class="indice-platinum"><div class="indice-title">Sumário Executivo</div><ul class="indice-list">`;
    
    headings.forEach((heading, index) => {
        if (!heading.id) heading.id = `section-${index}`;
        const classe = heading.tagName.toLowerCase() === 'h3' ? 'sub-h3' : '';
        html += `<li><a href="#${heading.id}" class="indice-link ${classe}">${heading.innerText}</a></li>`;
    });
    
    html += `</ul></nav>`;
    container.innerHTML = html;
    
    // Força Visibilidade
    container.style.display = 'block';
});