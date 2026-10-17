/* =========================================================== */
/* === ARQUIVO: civel-diagnostico.js (Quantum Consultant) === */
/* === FUNÇÃO: Triagem Cível, Familiar e Empresarial === */
/* =========================================================== */

window.civelReady(function() {
    const container = document.getElementById('diag-civel-container');
    if(!container) return;
    console.log("🏛️ [Cível Intelligence] Módulo de Consultoria Ativo.");
});

// --- 1. NAVEGAÇÃO INTELIGENTE (WIZARD) ---
window.selectCivelArea = function(area, btn) {
    // Visual dos botões
    document.querySelectorAll('.btn-area-select').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Esconde todos os sub-passos
    document.querySelectorAll('.sub-step').forEach(el => el.style.display = 'none');

    // Mostra o passo específico da área
    const targetId = `step-${area}`;
    const target = document.getElementById(targetId);
    
    if (target) {
        target.style.display = 'block';
        target.style.opacity = 0;
        target.style.transform = 'translateY(10px)';
        
        requestAnimationFrame(() => {
            target.style.transition = 'all 0.4s ease';
            target.style.opacity = 1;
            target.style.transform = 'translateY(0)';
        });
    }

    // Salva a área selecionada
    document.getElementById('input-area-selecionada').value = area;
    
    // Rola suavemente
    setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
};

// --- 2. PROCESSAMENTO DO DIAGNÓSTICO ---
window.processarDiagnosticoCivel = function() {
    // Coleta Dados
    const nome = document.getElementById('civel-nome').value;
    const tel = document.getElementById('civel-tel').value;
    const area = document.getElementById('input-area-selecionada').value;

    if (!nome || !tel || !area) {
        shakeForm();
        alert("Preencha os dados obrigatórios.");
        return;
    }

    // Coleta Detalhes
    let detalhe = "";
    let valorEnvolvido = "Não estimado";
    let urgencia = "Normal";

    if (area === 'familia') {
        const tipo = document.getElementById('familia-tipo').value;
        const bens = document.getElementById('familia-bens').value;
        detalhe = `Tipo: ${tipo} | Patrimônio: ${bens}`;
        if(tipo.includes("Litigioso")) urgencia = "Alta (Conflito)";
    } 
    else if (area === 'bancario') {
        const divida = document.getElementById('bancario-tipo').value;
        const valor = document.getElementById('bancario-valor').value;
        detalhe = `Problema: ${divida}`;
        valorEnvolvido = valor;
        if(divida.includes("Busca")) urgencia = "CRÍTICA (Risco de Perda)";
    }
    else if (area === 'imobiliario' || area === 'empresarial') {
        detalhe = "Análise Geral"; // Simplificado para evitar erro se campo não existir
    }

    const relato = document.getElementById('civel-relato').value;

    // --- 3. AÇÃO (LOADING + PDF + WHATSAPP) ---
    const btn = document.getElementById('btn-analisar-civel');
    const originalText = btn.innerText;
    
    btn.innerText = "🧠 GERANDO DOSSIÊ PDF...";
    btn.style.background = "#333";
    btn.style.color = "#fff";
    btn.disabled = true;

    // Simula processamento
    setTimeout(() => {
        // 1. Envia WhatsApp
        enviarWhatsAppCivel({
            nome, tel, area, detalhe, valorEnvolvido, urgencia, relato
        });

        // 2. Gera PDF (se o módulo estiver carregado)
        if (window.gerarDossiePDF) {
            window.gerarDossiePDF({
                nome: nome,
                telefone: tel,
                area: area.toUpperCase(),
                valor: valorEnvolvido,
                detalhe: detalhe,
                relato: relato
            });
        }
        
        // Reset Visual
        btn.innerText = "✅ DOSSIÊ BAIXADO";
        btn.style.background = "#2ecc71"; // Verde
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = "";
            btn.disabled = false;
        }, 4000);

    }, 2000);
};

// --- 4. DISPARO WHATSAPP ---
function enviarWhatsAppCivel(dados) {
    const saudacao = getSaudacaoPorArea(dados.area);
    
    const texto = `🏛️ *DIAGNÓSTICO CÍVEL (LIVE)*%0A%0A` +
                  `*Cliente:* ${encodeURIComponent(dados.nome)}%0A` +
                  `*Contato:* ${encodeURIComponent(dados.tel)}%0A%0A` +
                  `*ÁREA:* ${dados.area.toUpperCase()}%0A` +
                  `*DETALHES:* ${encodeURIComponent(dados.detalhe)}%0A` +
                  `*VALOR:* ${encodeURIComponent(dados.valorEnvolvido)}%0A` +
                  `*RELATO:* ${encodeURIComponent(dados.relato || 'N/A')}%0A%0A` +
                  `*AÇÃO:* ${saudacao}`;

    window.open(`https://wa.me/5531989420094?text=${texto}`, '_blank');
}

function getSaudacaoPorArea(area) {
    if (area === 'familia') return "Gostaria de agendar uma reunião sigilosa.";
    if (area === 'bancario') return "Preciso de uma auditoria no contrato.";
    return "Gostaria de uma análise do meu caso.";
}

function shakeForm() {
    const card = document.querySelector('.dossie-card');
    if(card) {
        card.animate([
            { transform: 'translateX(0)' }, 
            { transform: 'translateX(-10px)' }, 
            { transform: 'translateX(10px)' }, 
            { transform: 'translateX(0)' }
        ], { duration: 400 });
    }
}