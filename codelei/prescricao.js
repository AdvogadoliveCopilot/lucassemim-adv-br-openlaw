/* =========================================================== */
/* === ARQUIVO: codelei/prescricao.js (Quantum Math v3.0) === */
/* === FUNÇÃO: Cálculo Penal com UX e Feedback Visual === */
/* =========================================================== */

// --- 1. BANCO DE DADOS MATEMÁTICO (Art. 109 CP) ---
const TABELA_ART_109 = [
    { max: 1, prazo: 3 },
    { max: 2, prazo: 4 },
    { max: 4, prazo: 8 },
    { max: 8, prazo: 12 },
    { max: 12, prazo: 16 },
    { max: Infinity, prazo: 20 }
];

function getPrazoPrescricao(pena) {
    return TABELA_ART_109.find(faixa => pena <= faixa.max).prazo;
}

function diffDias(fim, inicio) {
    const dF = new Date(fim + 'T00:00:00');
    const dI = new Date(inicio + 'T00:00:00');
    return Math.ceil(Math.abs(dF - dI) / (1000 * 60 * 60 * 24));
}

// --- 2. NAVEGAÇÃO WIZARD (UX) ---
window.showStep = function(stepId) {
    document.querySelectorAll('.calc-step').forEach(s => {
        if (s.id !== 'step-1-tipo' && s.id !== 'calc-resultado') s.style.display = 'none';
    });
    
    if (stepId === 'step-1-tipo') {
        document.getElementById('calc-resultado').style.display = 'none';
        document.querySelectorAll('.calc-choice-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('form')?.reset(); // Limpa dados ao voltar
    }

    const target = document.getElementById(stepId);
    if (target) {
        target.style.display = 'block';
        requestAnimationFrame(() => target.classList.add('active'));
    }
};

// Seleção de Tipo (Passo 1)
window.selectTipo = function(tipo, btn) {
    document.getElementById('tipoPrescricao').value = tipo;
    updateBtnState('#step-1-tipo', btn);
    window.showStep(tipo === 'PPP' ? 'step-2-ppp' : 'step-3-inputs-ppe');
};

// Seleção de Subtipo (Passo 2)
window.selectTipoPPP = function(subtipo, btn) {
    document.getElementById('tipoPPP').value = subtipo;
    updateBtnState('#step-2-ppp', btn);
    window.showStep(subtipo === 'Abstrata' ? 'step-3-inputs-ppp-abstrata' : 'step-3-inputs-ppp-retro');
};

function updateBtnState(context, activeBtn) {
    document.querySelectorAll(`${context} .calc-choice-btn`).forEach(b => b.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
}

// --- 3. LÓGICA DE CÁLCULO (CORE) ---
window.calcularPrescricao = function() {
    const tipo = document.getElementById('tipoPrescricao').value;
    
    // Mapa de Inputs por Cenário
    const cenarios = {
        'PPP-Abstrata': {
            pena: 'ppp-pena-max', inicio: 'ppp-data-fato', fim: 'ppp-data-denuncia', 
            nome: 'Prescrição da Pretensão Punitiva (Abstrata)'
        },
        'PPP-Retroativa': {
            pena: 'ppp-retro-pena', inicio: 'ppp-retro-denuncia', fim: 'ppp-retro-sentenca',
            nome: 'Prescrição da Pretensão Punitiva (Retroativa)'
        },
        'PPE': {
            pena: 'ppe-pena', inicio: 'ppe-data-transito', fim: null, // Fim é hoje
            nome: 'Prescrição da Pretensão Executória (PPE)'
        }
    };

    // Determina cenário atual
    let chave = tipo;
    if (tipo === 'PPP') chave += '-' + document.getElementById('tipoPPP').value;
    
    const config = cenarios[chave];
    
    // Coleta e Validação
    const penaVal = document.getElementById(config.pena).value;
    const inicioVal = document.getElementById(config.inicio).value;
    const fimVal = config.fim ? document.getElementById(config.fim).value : new Date().toISOString().split('T')[0];

    if (!penaVal || !inicioVal || !fimVal) {
        if(window.notificar) window.notificar("Preencha todos os campos obrigatórios.", "erro");
        else alert("Preencha todos os campos.");
        return;
    }

    // UX: Feedback de Processamento
    const loading = document.getElementById('loading-screen');
    const stepAtual = document.querySelector('.calc-step[style*="block"]'); // Pega o passo visível
    
    if (stepAtual) stepAtual.classList.remove('active'); // Esconde form temporariamente
    if (loading) loading.style.display = 'block';

    setTimeout(() => {
        executarLogicaFinal(parseFloat(penaVal), inicioVal, fimVal, config.nome, tipo);
    }, 1500); // 1.5s de suspense
};

function executarLogicaFinal(penaBase, dataInicio, dataFim, nomeCenario, tipo) {
    const loading = document.getElementById('loading-screen');
    if (loading) loading.style.display = 'none';

    let prazoLegal = getPrazoPrescricao(penaBase);
    let contextoExtra = "";

    // Regra PPE Reincidência
    if (tipo === 'PPE' && document.getElementById('ppe-reincidente').checked) {
        prazoLegal *= 1.333; // +1/3
        contextoExtra = " (Com Reincidência)";
    }

    const dias = diffDias(dataFim, dataInicio);
    const anos = dias / 365.25;
    const prescrito = anos >= prazoLegal;

    // Renderiza Resultado
    const resultadoDiv = document.getElementById('calc-resultado');
    const textoDiv = document.getElementById('resultado-texto');
    const displayHeader = document.getElementById('display-header');

    if (displayHeader) displayHeader.innerText = `PRAZO LEGAL: ${prazoLegal.toFixed(0)} ANOS`;

    let html = `<strong>DIAGNÓSTICO: ${nomeCenario}${contextoExtra}</strong><br><br>`;
    html += `Pena Base: <span style="color:var(--cor-ouro)">${penaBase} anos</span> | Prazo Art. 109: <span style="color:var(--cor-ouro)">${prazoLegal.toFixed(2)} anos</span>.<br>`;
    html += `Tempo Decorrido: <span style="color:#fff">${anos.toFixed(2)} anos</span> (${dias} dias).<br><br>`;

    if (prescrito) {
        resultadoDiv.className = 'calc-step prescrito active';
        html += `<span style="color:#2ecc71; font-size:1.3rem;">✅ ALERTA: PRESCRIÇÃO DETECTADA!</span><br>O tempo decorrido superou o prazo legal. A punibilidade deve ser extinta.`;
    } else {
        resultadoDiv.className = 'calc-step nao-prescrito active';
        const falta = (prazoLegal - anos).toFixed(2);
        html += `<span style="color:#e74c3c; font-size:1.3rem;">❌ AINDA VIGENTE.</span><br>Faltam aproximadamente <strong>${falta} anos</strong> para a prescrição.`;
    }

    textoDiv.innerHTML = html;
    resultadoDiv.style.display = 'block';
    resultadoDiv.scrollIntoView({ behavior: 'smooth' });
}

// Reset Global
window.resetCalc = function() {
    window.showStep('step-1-tipo');
    if(document.getElementById('display-header')) 
        document.getElementById('display-header').innerText = "00 ANOS 00 MESES";
};