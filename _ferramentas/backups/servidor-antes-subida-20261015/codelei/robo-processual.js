/* =========================================================== */
/* === ARQUIVO: codelei/robo-processual.js === */
/* === O ROBÔ DE DADOS: Leitura JSON & Renderização Tática === */
/* =========================================================== */

document.addEventListener("DOMContentLoaded", async function() {
    
    // 1. BUSCA O CONTAINER
    const containerTimeline = document.querySelector('.pje-container');
    if (!containerTimeline) return;

    // 2. EXIBE "LOADING DE DADOS" (Efeito Visual)
    containerTimeline.innerHTML = `
        <div style="text-align:center; padding:40px; color:#666;">
            <div class="spinner" style="margin-bottom:10px;">🔄</div>
            <span style="font-family:'Fira Code'">SINCRONIZANDO DADOS DO PROCESSO...</span>
        </div>
    `;

    // 3. TENTA CARREGAR OS DADOS (Com Cache Busting)
    try {
        // O parâmetro ?v=timestamp garante que o cliente sempre veja a versão nova do JSON
        const response = await fetch(`dados.json?v=${new Date().getTime()}`);
        
        if (!response.ok) throw new Error("Arquivo de dados não encontrado.");
        
        const dados = await response.json();
        
        // Pequeno delay artificial para dar peso à "análise"
        setTimeout(() => {
            executarRobo(dados, containerTimeline);
        }, 500);

    } catch (erro) {
        console.warn("⚠️ [Robô Live] Modo Demonstração Ativo (JSON não encontrado).");
        // Em caso de erro, renderiza dados de exemplo ou limpa o loading
        containerTimeline.innerHTML = `
            <div style="text-align:center; padding:40px; border:1px dashed #333; border-radius:10px;">
                <h3 style="color:#d4af37;">AGUARDANDO INSTALAÇÃO</h3>
                <p style="color:#ccc;">Os dados deste processo ainda estão sendo indexados pelo sistema.</p>
            </div>
        `;
    }
});

function executarRobo(dados, container) {
    console.log("🤖 [Robô Live] Dados carregados para:", dados.cliente.nome);

    // 1. INJEÇÃO DE DADOS NO CABEÇALHO (DOM Manipulation)
    atualizarTexto('nome-cliente', dados.cliente.nome);
    atualizarTexto('num-processo', dados.cliente.processo);
    atualizarTexto('vara-processo', dados.cliente.vara);
    
    // 2. ATUALIZAÇÃO DO STATUS (Badge Inteligente)
    const statusBadge = document.getElementById('status-geral');
    if (statusBadge && dados.status_atual) {
        statusBadge.innerText = dados.status_atual.fase.toUpperCase();
        
        // Lógica de Cores do Status
        const cores = {
            'verde': { border: '#2ecc71', bg: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' },
            'vermelho': { border: '#e74c3c', bg: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' },
            'amarelo': { border: '#f1c40f', bg: 'rgba(241, 196, 15, 0.1)', color: '#f1c40f' },
            'azul': { border: '#00d2ff', bg: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff' }
        };
        
        const tema = cores[dados.status_atual.cor] || cores['azul'];
        
        statusBadge.style.borderColor = tema.border;
        statusBadge.style.backgroundColor = tema.bg;
        statusBadge.style.color = tema.color;
        
        // Se for vermelho ou amarelo, adiciona pulso
        if(dados.status_atual.cor === 'vermelho' || dados.status_atual.cor === 'amarelo') {
            statusBadge.style.animation = "pulse 2s infinite";
        }
    }

    // 3. CONSTRUÇÃO DA TIMELINE (Renderização Dinâmica)
    // Limpa o loading
    container.innerHTML = '';

    // Cria a área da timeline
    const areaDinamica = document.createElement('div');
    areaDinamica.id = 'timeline-dinamica';
    areaDinamica.style.opacity = 0; // Começa invisível para animação
    areaDinamica.style.transition = "opacity 0.5s ease";
    
    let htmlTimeline = '<h3 style="color: var(--cor-ouro-destaque); margin: 20px 0 30px 0; font-family: \'Teko\'; letter-spacing: 1px;">HISTÓRICO PROCESSUAL (LIVE)</h3>';

    if (dados.timeline && dados.timeline.length > 0) {
        dados.timeline.forEach((evento, index) => {
            const icone = getIconePorTipo(evento.tipo);
            
            // Define classes visuais
            const classeStatus = evento.concluido ? 'concluido' : 'futuro';
            const animationDelay = index * 100; // Efeito cascata
            
            // Se for o primeiro item não concluído, marca como "EM ANDAMENTO"
            let activeClass = '';
            if (!evento.concluido && index > 0 && dados.timeline[index-1].concluido) {
                activeClass = 'active-pulse';
            }

            // Botão de Download (Só aparece se tiver arquivo)
            const btnDownload = evento.arquivo 
                ? `<a href="${evento.arquivo}" class="doc-link" target="_blank">
                     <span class="doc-icon">📄</span> Baixar PDF
                   </a>` 
                : '';

            // Descrição opcional
            const descricao = evento.obs 
                ? `<p style="font-size:0.85rem; color:#888; margin-bottom:10px;">${evento.obs}</p>` 
                : '';

            htmlTimeline += `
                <div class="fase-box ${classeStatus} ${activeClass}" onclick="toggleFase(this)" style="animation: fadeInUp 0.5s ease forwards; animation-delay: ${animationDelay}ms;">
                    <div class="fase-header">
                        <div class="fase-icon">${icone}</div>
                        <div class="fase-title">
                            ${evento.titulo}
                            <span style="display:block; font-size:0.75rem; color:rgba(255,255,255,0.5); font-family:'Fira Code'; margin-top:2px;">${evento.tipo.toUpperCase()}</span>
                        </div>
                        <div class="fase-data">${evento.data}</div>
                    </div>
                    <div class="fase-content">
                        ${descricao}
                        ${btnDownload}
                    </div>
                </div>
            `;
        });
    } else {
        htmlTimeline += '<p style="color:#666;">Nenhuma movimentação registrada no sistema Live.</p>';
    }

    areaDinamica.innerHTML = htmlTimeline;
    container.appendChild(areaDinamica);
    
    // Revela a timeline
    requestAnimationFrame(() => {
        areaDinamica.style.opacity = 1;
    });
}

// --- FUNÇÕES AUXILIARES (Helper Methods) ---

function atualizarTexto(id, texto) {
    const el = document.getElementById(id);
    if (el) el.innerText = texto;
}

function getIconePorTipo(tipo) {
    const mapa = {
        'Decisão': '⚖️',
        'Sentença': '🔨',
        'Petição': '📜',
        'Audiência': '🗣️',
        'Diligência': '🔍',
        'Alvará': '🔓',
        'Recurso': '📈',
        'Prisão': '🔒'
    };
    return mapa[tipo] || '📂';
}

// Função de Acordeão (Expandir/Recolher)
// Exposta globalmente para o HTML acessar via onclick=""
window.toggleFase = function(element) {
    // Fecha os outros (Modo Foco Unico) - Opcional
    /* document.querySelectorAll('.fase-box').forEach(box => {
        if(box !== element) box.classList.remove('open');
    }); 
    */
    
    // Alterna o atual
    element.classList.toggle('open');
}

// Injeta CSS específico para animações do Robô
const styleRobot = document.createElement('style');
styleRobot.innerHTML = `
    @keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    .active-pulse { border-color: var(--cor-ouro-destaque) !important; }
    .active-pulse .fase-icon { animation: pulse 2s infinite; background: var(--cor-ouro-destaque) !important; color: #000 !important; }
`;
document.head.appendChild(styleRobot);