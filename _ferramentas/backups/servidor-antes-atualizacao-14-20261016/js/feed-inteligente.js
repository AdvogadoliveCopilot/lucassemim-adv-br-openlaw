/* =========================================================== */
/* === FICHEIRO: js/feed-inteligente.js (Recomendação V2) ==== */
/* === FUNÇÃO: IA de Artigos Relacionados (Dwell Time) ======= */
/* =========================================================== */

document.addEventListener("DOMContentLoaded", function() {
    
    // BANCO DE DADOS ATUALIZADO (As Novas Bombas Virais)
    const bancoDeNoticias = [
        {
            titulo: "Máfia de Distintivo e Extorsão Policial",
            link: "mafia-de-distintivo-extorsao-policial-operacao-gaeco-stj.html",
            resumo: "Entenda por que pagar a propina é um erro fatal e como trancamos megaoperações do GAECO no STJ.",
            tags: ["gaeco", "extorsão", "propina", "empresário", "servidor público"]
        },
        {
            titulo: "A Fraude na Reincidência e o Cálculo de Pena",
            link: "reincidencia-generica-especifica-calculo-pena-stj.html",
            resumo: "O Estado pode estar roubando anos de vida na sua Execução Penal. Descubra a matemática do STJ para soltura.",
            tags: ["execução penal", "reincidência", "cálculo de pena", "stj", "progressão"]
        },
        {
            titulo: "O STF e a Saidinha Negada",
            link: "stf-saidinha-marco-2026-juiz-execucao-penal-ilegal.html",
            resumo: "O juiz negou a saída de Páscoa? A nossa Advocacia Auditada usa o Marco Temporal do STF para garantir seu direito.",
            tags: ["saidinha", "stf", "execução penal", "páscoa", "lei nova"]
        },
        {
            titulo: "Blitz: Faca no Carro e Recusa do Bafômetro",
            link: "blitz-bafometro-faca-carro-multa-suspensao-cnh.html",
            resumo: "O policial usa o terror psicológico. Descubra como anular a multa de 3 mil reais e o TCO por 'arma branca'.",
            tags: ["blitz", "bafômetro", "trânsito", "arma branca", "multa", "cnh"]
        },
        {
            titulo: "Falsa Acusação e Tornozeleira no Divórcio",
            link: "falsa-acusacao-medida-protetiva-tornozeleira-eletronica-divorcio.html",
            resumo: "Quando a Lei Maria da Penha é usada como vingança patrimonial. A anatomia da extorsão no divórcio litigioso.",
            tags: ["maria da penha", "falsa acusação", "tornozeleira", "divórcio", "medida protetiva"]
        }
    ];

    const feedContainer = document.getElementById("feed-infinito-container");
    if (!feedContainer) return; 

    const isNewsFolder = window.location.pathname.indexOf("/news/") !== -1;
    const currentFile = window.location.pathname.split("/").pop();
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    let pageTags = metaKeywords ? metaKeywords.content.toLowerCase().split(',').map(t => t.trim()) : [];
    
    let noticiasRankeadas = bancoDeNoticias
        .filter(n => n.link !== currentFile)
        .map(n => {
            let score = 0;
            n.tags.forEach(tag => {
                pageTags.forEach(pageTag => { if (pageTag.includes(tag) || tag.includes(pageTag)) score++; });
            });
            return { ...n, score: score };
        })
        .sort((a, b) => b.score - a.score);

    const top3 = noticiasRankeadas.slice(0, 3);

    feedContainer.innerHTML = `
        <div class="col-12 mb-4 mt-5">
            <h3 class="font-teko text-white border-bottom border-secondary pb-2">
                <i class="fas fa-radar text-gold me-2"></i> RECOMENDADO PARA VOCÊ
            </h3>
        </div>
    `;

    top3.forEach(data => {
        let linkFinal = isNewsFolder ? data.link : "news/" + data.link;
        const seloRecomendado = data.score > 0 ? `<span class="badge bg-danger mb-2 font-teko" style="letter-spacing:1px;">CONEXÃO DETECTADA</span>` : ``;

        feedContainer.innerHTML += `
            <div class="col-md-4 mb-4">
                <div class="p-4 rounded position-relative h-100" style="background: rgba(10,10,12,0.9); border: 1px solid #333; transition: 0.3s;">
                    <div style="position:absolute; top:0; left:0; width:4px; height:100%; background: #d4af37; border-radius: 4px 0 0 4px;"></div>
                    ${seloRecomendado}
                    <h4 class="text-white font-teko mb-3" style="font-size: 1.4rem; line-height:1.2;">${data.titulo}</h4>
                    <p class="text-secondary small mb-4" style="font-family:'Lato'; line-height: 1.5;">${data.resumo}</p>
                    <a href="${linkFinal}" class="btn btn-sm btn-outline-light font-teko" style="letter-spacing:1px; border-color: #555;">
                        <i class="fas fa-book-reader text-gold me-1"></i> LER MATÉRIA
                    </a>
                </div>
            </div>
        `;
    });
});