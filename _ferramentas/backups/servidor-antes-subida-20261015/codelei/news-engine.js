/* =========================================================== */
/* === ARQUIVO: codelei/news-engine.js (Motor de Notícias) === */
/* === FUNÇÃO: Busca notícias reais e conecta à atuação === */
/* =========================================================== */

const PROXY_URL = "https://api.allorigins.win/get?url="; // Proxy para evitar bloqueio CORS
const NEWS_FEEDS = [
    "https://www.conjur.com.br/rss.xml",
    "https://www.migalhas.com.br/rss",
    "https://stj.jus.br/sites/portalp/Rss/Noticias" 
];

async function carregarNoticias() {
    const container = document.getElementById('feed-noticias-live');
    if (!container) return;

    container.innerHTML = '<div class="loading-news">📡 Conectando aos Tribunais e Portais...</div>';
    
    let noticias = [];

    try {
        // Busca em todos os feeds
        const promises = NEWS_FEEDS.map(url => 
            fetch(PROXY_URL + encodeURIComponent(url))
            .then(response => response.json())
            .then(data => {
                const parser = new DOMParser();
                const xml = parser.parseFromString(data.contents, "text/xml");
                const items = xml.querySelectorAll("item");
                
                items.forEach(item => {
                    noticias.push({
                        titulo: item.querySelector("title").textContent,
                        link: item.querySelector("link").textContent,
                        data: new Date(item.querySelector("pubDate").textContent),
                        fonte: new URL(url).hostname.replace('www.','')
                    });
                });
            })
        );

        await Promise.all(promises);

        // Ordena por data (mais recente primeiro)
        noticias.sort((a, b) => b.data - a.data);
        
        // Filtra apenas as mais relevantes (opcional) e pega as top 6
        const topNoticias = noticias.slice(0, 6);
        
        renderizarNoticias(topNoticias, container);

    } catch (error) {
        console.error("Erro ao carregar notícias:", error);
        container.innerHTML = '<div class="error-news">⚠️ Sistema de Notícias em Manutenção. Consulte via WhatsApp.</div>';
    }
}

function renderizarNoticias(lista, container) {
    let html = '';
    
    lista.forEach(news => {
        // Simula a "Atuação da Equipe"
        const atuacaoTexto = gerarTextoAtuacao(news.titulo);
        
        html += `
            <div class="news-card reveal">
                <div class="news-header">
                    <span class="news-source">📰 ${news.fonte}</span>
                    <span class="news-date">${news.data.toLocaleDateString('pt-BR')}</span>
                </div>
                <h3 class="news-title">${news.titulo}</h3>
                
                <div class="news-live-action">
                    <div class="live-indicator">
                        <span class="dot"></span> EM ANÁLISE TÁTICA
                    </div>
                    <p class="atuacao-desc">${atuacaoTexto}</p>
                    <div class="advogado-atuando">
                        <img src="img/LUCAS-SEMIM.jpg" class="avatar-mini">
                        <span>Dr. Lucas + Equipe</span>
                    </div>
                    <a href="https://wa.me/5531989420094?text=Vi%20a%20not%C3%ADcia%20'${encodeURIComponent(news.titulo)}'%20e%20quero%20saber%20se%20cabe%20no%20meu%20caso." target="_blank" class="btn-entrar-caso-news">
                        Entrar neste Caso &rarr;
                    </a>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Gera um texto dinâmico baseado no título da notícia
function gerarTextoAtuacao(titulo) {
    titulo = titulo.toLowerCase();
    if (titulo.includes("fraude") || titulo.includes("golpe")) return "Nossa equipe de Penal Econômico está mapeando as vítimas para Ação Coletiva.";
    if (titulo.includes("stj") || titulo.includes("stf")) return "Analisando o precedente para aplicar em recursos de nossos clientes.";
    if (titulo.includes("prisão") || titulo.includes("polícia")) return "Monitorando a operação. Plantão 24h ativo para flagrantes relacionados.";
    return "Avaliando impacto jurídico para nossos clientes.";
}

// Inicia
document.addEventListener("DOMContentLoaded", carregarNoticias);