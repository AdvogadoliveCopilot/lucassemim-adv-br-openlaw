/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-related.js === */
/* === FUNÇÃO: Sugestões Inteligentes (Correção de Caminho) === */
/* =========================================================== */

// BASE DE DADOS CÍVEL
window.ESTRATEGIAS_CIVEL = [
    {
        url: 'blindagem-patrimonial.html',
        categoria: 'patrimonio',
        title: 'Blindagem Patrimonial',
        desc: 'Proteja seus bens de riscos fiscais e trabalhistas com a Holding.',
        icon: '🏛️',
        keywords: 'holding bens proteção empresa'
    },
    {
        url: 'bancario-juros.html',
        categoria: 'financeiro',
        title: 'Revisional Bancária',
        desc: 'Reduza juros abusivos de veículos e empréstimos.',
        icon: '📈',
        keywords: 'juros banco divida busca apreensao'
    },
    {
        url: 'familia-sucessoes.html',
        categoria: 'familia',
        title: 'Divórcio e Sucessão',
        desc: 'Estratégias de alto padrão para partilha e herança.',
        icon: '💍',
        keywords: 'divorcio heranca inventario guarda'
    },
    {
        url: 'execucao-cobranca.html',
        categoria: 'patrimonio',
        title: 'Recuperação de Ativos',
        desc: 'Use a inteligência (Sniper) para encontrar bens de devedores.',
        icon: '💰',
        keywords: 'divida cobranca execucao'
    },
    {
        url: 'seguros-indenizacao.html',
        categoria: 'financeiro',
        title: 'Seguros Negados',
        desc: 'Como reverter a negativa da seguradora.',
        icon: '🛡️',
        keywords: 'seguro sinistro negativa'
    },
    {
        url: 'erro-medico.html',
        categoria: 'saude',
        title: 'Erro Médico',
        desc: 'Indenização por falhas médicas e estéticas.',
        icon: '🏥',
        keywords: 'medico hospital saude'
    }
];

window.civelReady(() => {
    const container = document.getElementById('related-articles-container');
    if (!container) return;

    const currentPage = window.location.pathname.split('/').pop();
    
    // Filtra e embaralha
    let pool = window.ESTRATEGIAS_CIVEL.filter(artigo => artigo.url !== currentPage);
    pool.sort(() => 0.5 - Math.random());
    const selected = pool.slice(0, 3);

    let html = `
        <h3 style="color: #d4af37; text-align:center; font-family:'Teko'; font-size:2rem; margin-bottom:30px; border-top:1px solid #333; padding-top:40px; display:block;">
            ESTRATÉGIAS RECOMENDADAS:
        </h3>
        <div class="row g-4 justify-content-center">
    `;

    selected.forEach((artigo) => {
        html += `
            <div class="col-md-4">
                <a href="${artigo.url}" class="card-solution tilt-effect" style="display:block; text-decoration:none; border: 1px solid #333; background: rgba(20,20,20,0.8); border-radius: 10px; min-height:280px; overflow: hidden; transition: transform 0.3s;">
                    <div style="padding: 25px; text-align:center;">
                        <span style="font-size: 2.5rem; display:block; margin-bottom:15px;">${artigo.icon}</span>
                        <h3 style="color: #fff; margin: 0 0 10px 0; font-family: 'Playfair Display'; font-size: 1.4rem;">${artigo.title}</h3>
                        <p style="color: #ccc; font-size: 0.9rem; line-height: 1.4; margin-bottom: 20px;">${artigo.desc}</p>
                        <span style="color: #d4af37; font-weight: bold; font-size: 0.8rem; border-bottom:1px solid #d4af37;">LER AGORA &rarr;</span>
                    </div>
                </a>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
    
    // Força visibilidade imediata
    container.style.opacity = '1';
    container.style.visibility = 'visible';
});