/* =========================================================== */
/* === ARQUIVO: codelei/related.js (Quantum Recommendations v4.0) === */
/* === FUNÇÃO: Garante que sempre haja sugestões visíveis === */
/* =========================================================== */

// 1. BANCO DE DADOS MESTRE (Mantenha a lista CODIGOS_TESES completa aqui...)
// ... (Mantenha a lista que você já tem, ou use a do código anterior) ...
// Se precisar da lista completa de novo, me avise. Vou focar na lógica abaixo.

document.addEventListener('DOMContentLoaded', () => {
    
    const container = document.getElementById('related-articles-container');
    
    // Se não achar o container, para (evita erro no console em páginas sem ele)
    if (!container) return;

    const currentPage = window.location.pathname.split('/').pop();
    const metaKeywords = document.querySelector('meta[name="keywords"]')?.content || "";
    const pageContext = metaKeywords.toLowerCase();

    // Filtra a própria página
    let pool = window.CODIGOS_TESES.filter(artigo => artigo.url !== currentPage);

    // Pontuação
    pool.forEach(artigo => {
        artigo.score = 0;
        if (pageContext.includes(artigo.categoria)) artigo.score += 5;
        
        const keys = artigo.keywords.split(' ');
        keys.forEach(k => {
            if (pageContext.includes(k) && k.length > 3) artigo.score += 2;
        });
    });

    // Ordena
    pool.sort((a, b) => b.score - a.score);
    
    // GARANTIA: Se não tiver relevância, pega aleatórios para preencher
    if (pool.length > 0 && pool[0].score === 0) {
        pool = pool.sort(() => 0.5 - Math.random());
    }
    
    const selected = pool.slice(0, 3); 

    // Renderização (Com estilo inline para forçar visibilidade)
    let html = `
        <h3 style="color: #d4af37; text-align:center; font-family:'Teko'; font-size:2rem; margin-bottom:30px; border-top:1px solid #333; padding-top:40px; display:block;">
            CONTINUE SUA ESTRATÉGIA:
        </h3>
        <div class="row g-4 justify-content-center">
    `; 
    
    selected.forEach((artigo) => {
        html += `
            <div class="col-md-4">
                <a href="${artigo.url}" class="card-artigo tilt-effect" style="display:block; text-decoration:none; border: 1px solid #333; background: rgba(20,20,20,0.8); border-radius: 10px; overflow: hidden; transition: transform 0.3s;">
                    <div style="padding: 25px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                            <span style="font-size: 2.5rem;">${artigo.icon}</span>
                            <span style="color: #d4af37; font-size: 0.7rem; border: 1px solid #d4af37; padding: 2px 6px; border-radius: 4px;">RECOMENDADO</span>
                        </div>
                        <h3 style="color: #fff; margin: 0 0 10px 0; font-family: 'Teko'; font-size: 1.6rem; line-height:1.1;">${artigo.title}</h3>
                        <p style="color: #ccc; font-size: 0.9rem; line-height: 1.4; margin-bottom: 20px;">${artigo.desc}</p>
                        <span style="color: #d4af37; font-weight: bold; font-size: 0.9rem;">LER TESE &rarr;</span>
                    </div>
                </a>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Força exibição (Patch de Visibilidade)
    container.style.opacity = '1';
    container.style.visibility = 'visible';
});