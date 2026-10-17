/* =========================================================== */
/* === ARQUIVO: civel-financas.js (Quantum Financial Core) === */
/* === FUNÇÃO: Motores de Cálculo Patrimonial e Bancário === */
/* =========================================================== */

// --- 1. FERRAMENTAS AUXILIARES (UTILITIES) ---

// Formata número para Real (R$)
const formatMoney = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Animação de Números (Efeito Slot Machine / Processamento)
function animateValue(obj, start, end, duration) {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Easing (suavização)
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        
        const currentVal = Math.floor(progress * (end - start) + start);
        obj.innerHTML = formatMoney(currentVal);
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = formatMoney(end); // Garante valor final exato
        }
    };
    window.requestAnimationFrame(step);
}

// --- 2. SIMULADOR DE HOLDING (A CÉLULA COFRE) ---
// Lógica: Inventário custa ~20% do patrimônio. Holding custa ~6%.
window.simularHolding = function() {
    const input = document.getElementById('valor-bens');
    if (!input || !input.value) {
        shakeElement(input); // Treme se vazio
        return;
    }

    const patrimonio = parseFloat(input.value);
    
    // Parâmetros de Mercado (Médias Nacionais)
    const taxaInventario = 0.20; // 20% (ITCMD + Advogado + Custas + Cartório)
    const taxaHolding = 0.06;    // 6% (ITBI + Estruturação + Contador)

    const custoInv = patrimonio * taxaInventario;
    const custoHold = patrimonio * taxaHolding;
    const economia = custoInv - custoHold;

    // Exibe o container de resultado
    const resultadoBox = document.getElementById('resultado-simulacao') || document.getElementById('resultado-box');
    if (resultadoBox) {
        resultadoBox.style.display = 'block';
        
        // Animação suave de entrada
        resultadoBox.style.opacity = 0;
        setTimeout(() => { resultadoBox.style.opacity = 1; }, 100);
        
        // Dispara contadores
        animateValue(document.getElementById('custo-inv'), 0, custoInv, 1500);
        animateValue(document.getElementById('custo-hold'), 0, custoHold, 1500);
        animateValue(document.getElementById('economia-total'), 0, economia, 2000);
    }
};

// --- 3. AUDITOR BANCÁRIO (Juros Abusivos) ---
// Lógica: Estima o valor pago a maior com base em spread médio.
window.calcularAbuso = function() {
    const valorFin = parseFloat(document.getElementById('valor-fin')?.value || document.getElementById('valor-emp')?.value);
    const numParc = parseFloat(document.getElementById('num-parc').value);
    const valParc = parseFloat(document.getElementById('val-parc').value);

    if (!valorFin || !numParc || !valParc) {
        alert("Preencha todos os campos para a auditoria.");
        return;
    }

    // Cálculos
    const totalPago = numParc * valParc;
    const jurosTotais = totalPago - valorFin;
    
    // Estimativa Tática: Em contratos abusivos, cerca de 30% a 40% dos juros são indevidos/abusivos
    // (Venda casada, tarifas, juro acima da média)
    const gorduraAbusiva = jurosTotais * 0.35; 

    // Exibe Resultado
    const resultadoAudit = document.getElementById('resultado-audit');
    if (resultadoAudit) {
        resultadoAudit.style.display = 'block';
        
        // Anima o valor recuperável
        const displayRecuperar = document.getElementById('valor-recuperar') || document.getElementById('val-recuperar');
        animateValue(displayRecuperar, 0, gorduraAbusiva, 2000);
    }
};

// --- 4. ATUALIZADOR DE DÍVIDA (Execução/Cobrança) ---
// Lógica: Simula Juros Compostos + Correção Monetária + Multa
window.atualizarDivida = function() {
    const valorOriginal = parseFloat(document.getElementById('valor-divida').value);
    const meses = parseFloat(document.getElementById('tempo-atraso').value);

    if (!valorOriginal || !meses) {
        alert("Informe o valor e o tempo de atraso.");
        return;
    }

    // Taxas Médias Judiciais (Simulação)
    const correcaoMensal = 1.005; // 0.5% Correção Monetária
    const jurosMora = 1.01;       // 1.0% Juros de Mora
    const multa = 1.10;           // 10% Multa + Honorários (Conservador)

    // Cálculo Composto (Juros sobre Juros na dívida bancária ou simples na judicial)
    // Usaremos composto para mostrar o potencial máximo da execução para o credor
    let montante = valorOriginal * Math.pow((correcaoMensal * jurosMora), meses);
    
    // Aplica Multa/Honorários
    montante = montante * multa;

    const resultadoDiv = document.getElementById('resultado-divida');
    if (resultadoDiv) {
        resultadoDiv.style.display = 'block';
        const displayFinal = document.getElementById('valor-final');
        animateValue(displayFinal, valorOriginal, montante, 2000);
    }
};

// --- EFEITOS VISUAIS DE ERRO (SHAKE) ---
function shakeElement(element) {
    element.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(0)' }
    ], { duration: 400 });
    element.style.borderColor = '#e74c3c'; // Vermelho
    setTimeout(() => element.style.borderColor = '', 2000);
}

// Inicialização
window.civelReady(function() {
    console.log("💰 [Cível Finances] Módulo de Cálculo Ativo.");
});