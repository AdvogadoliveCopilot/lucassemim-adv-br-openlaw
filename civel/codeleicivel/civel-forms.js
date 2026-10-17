/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-forms.js (Quantum V3.0) === */
/* === FUNÇÃO: Validação Jurídica, Máscaras, Fluxo Guiado e Integração CRM === */
/* =========================================================== */

window.civelReady(function() {
    console.log("⚖️ [Legal Forms] Módulo de Admissão de Processos Ativo.");
    setupMasks(); // Ativa máscaras de input
});

// ESTADO DO WIZARD
let currentStep = 1;
const totalSteps = 3;

// --- 1. NAVEGAÇÃO E VALIDAÇÃO ---
window.nextStep = function(step) {
    if (validarPasso(step - 1)) {
        showStep(step);
    }
};

window.prevStep = function(step) {
    showStep(step);
};

function showStep(step) {
    // Esconde todos
    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });
    
    // Mostra o atual com efeito
    const target = document.getElementById(`step-${step}`);
    target.style.display = 'block';
    setTimeout(() => target.classList.add('active'), 10);

    // Atualiza Barra
    const progress = (step / totalSteps) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
    
    currentStep = step;
}

// --- 2. MOTOR DE VALIDAÇÃO (O "ESTAGIÁRIO SÊNIOR") ---
function validarPasso(step) {
    if (step === 1) {
        // Validação de Identidade
        const nome = document.getElementById('cad-nome');
        const doc = document.getElementById('cad-doc');
        const email = document.getElementById('cad-email');
        const tel = document.getElementById('cad-tel');

        if (!validarNome(nome.value)) { erroInput(nome, "Digite nome e sobrenome."); return false; }
        if (!validarDocumento(doc.value)) { erroInput(doc, "CPF/CNPJ Inválido."); return false; }
        if (!validarEmail(email.value)) { erroInput(email, "E-mail inválido."); return false; }
        if (tel.value.length < 14) { erroInput(tel, "WhatsApp incompleto."); return false; }
    }
    
    if (step === 2) {
        // Validação da Causa
        const servico = document.getElementById('cad-servico').value;
        if (!servico) { alert("Selecione o tipo de procedimento jurídico."); return false; }
    }
    
    return true;
}

// Algoritmos Matemáticos
function validarNome(nome) {
    return nome.trim().split(' ').length >= 2;
}

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarDocumento(val) {
    val = val.replace(/[^\d]+/g, '');
    if (val === '') return false;
    
    // Validação CPF (Módulo 11)
    if (val.length === 11) {
        if (/^(\d)\1{10}$/.test(val)) return false; // Bloqueia 111.111.111-11
        let soma = 0, resto;
        for (let i = 1; i <= 9; i++) soma = soma + parseInt(val.substring(i-1, i)) * (11 - i);
        resto = (soma * 10) % 11;
        if ((resto == 10) || (resto == 11)) resto = 0;
        if (resto != parseInt(val.substring(9, 10))) return false;
        soma = 0;
        for (let i = 1; i <= 10; i++) soma = soma + parseInt(val.substring(i-1, i)) * (12 - i);
        resto = (soma * 10) % 11;
        if ((resto == 10) || (resto == 11)) resto = 0;
        if (resto != parseInt(val.substring(10, 11))) return false;
        return true;
    }
    
    // Validação CNPJ (Básica por tamanho para simplificar, ideal usar lib completa se rigoroso)
    if (val.length === 14) return true; 
    
    return false;
}

function erroInput(el, msg) {
    el.style.borderColor = "#e74c3c";
    el.classList.add('shake-anim'); // Adicione css shake se quiser
    // Opcional: Mostrar tooltip
    alert(msg); // Fallback simples
    setTimeout(() => {
        el.style.borderColor = "#444";
        el.classList.remove('shake-anim');
    }, 2000);
}

// --- 3. DINÂMICA DE SERVIÇOS JURÍDICOS ---
window.selectService = function(btn, valor, tipo) {
    document.querySelectorAll('.btn-select').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('cad-servico').value = valor;

    // Lógica Dinâmica (Campos Extras)
    const container = document.getElementById('campos-dinamicos');
    container.innerHTML = ""; // Limpa

    if (tipo === 'execucao') {
        container.innerHTML = `
            <label class="form-label fade-in">Título Executivo (Cheque, Contrato, Nota...)</label>
            <input type="text" id="extra-titulo" class="input-plat" placeholder="Ex: Contrato de Mútuo assinado">
            <label class="form-label fade-in">Data do Vencimento</label>
            <input type="date" id="extra-data" class="input-plat">
        `;
    } else if (tipo === 'busca') {
        container.innerHTML = `
            <label class="form-label fade-in">Nome do Devedor / Parte Contrária</label>
            <input type="text" id="extra-parte" class="input-plat" placeholder="Quem vamos investigar?">
        `;
    } else if (tipo === 'comum') {
        container.innerHTML = `
            <label class="form-label fade-in">Tipo de Ação (Indenização, Obrigação...)</label>
            <input type="text" id="extra-acao" class="input-plat" placeholder="Ex: Danos Morais">
        `;
    }
};

// --- 4. ENVIO FINAL (O PROTOCOLO INTEGRADO) ---
// CORREÇÃO (bug de lead perdido silenciosamente):
// Antes, a tela de sucesso era exibida SEM checar o retorno real do HubSpot
// (fire-and-forget) e o fallback de WhatsApp abria via window.open() dentro de
// um setTimeout assíncrono — fora do gesto direto do clique, o que bloqueadores
// de pop-up (principalmente mobile) tendem a barrar silenciosamente. Resultado:
// o cliente podia ver "sucesso" e o escritório nunca receber o lead, sem ninguém
// perceber. Agora: (a) aguardamos o resultado real do HubSpot antes de decidir
// qual tela mostrar; (b) o link do WhatsApp fica sempre visível como <a href>
// (não depende de window.open nem de heurística de pop-up); (c) se tudo falhar,
// o usuário vê um erro claro com telefone e link de WhatsApp como alternativa.
window.submitCadastro = async function() {
    // Coleta Dados Base
    const dados = {
        nome: document.getElementById('cad-nome').value,
        doc: document.getElementById('cad-doc').value,
        email: document.getElementById('cad-email').value,
        tel: document.getElementById('cad-tel').value,
        servico: document.getElementById('cad-servico').value,
        valor: document.getElementById('cad-valor').value,
        resumo: document.getElementById('cad-resumo').value
    };

    // Coleta Dados Dinâmicos
    let extras = "";
    if(document.getElementById('extra-titulo')) extras += ` | Título: ${document.getElementById('extra-titulo').value}`;
    if(document.getElementById('extra-parte')) extras += ` | Alvo: ${document.getElementById('extra-parte').value}`;

    // Feedback Visual
    const btn = document.querySelector('.btn-next-final');
    const btnTextoOriginal = btn.innerHTML;
    btn.innerHTML = "📡 SINCRONIZANDO SISTEMA...";
    btn.style.background = "#333";
    btn.disabled = true;

    // 1. PREPARA O LINK DE WHATSAPP JÁ AGORA (não depende do CRM nem de rede).
    // Construir e exibir esse link não precisa esperar nada, então ele fica
    // pronto e clicável imediatamente, e serve tanto como confirmação quanto
    // como fallback caso o HubSpot falhe logo abaixo.
    const texto = `🏛️ *NOVA DEMANDA CÍVEL* 🏛️%0A%0A` +
                  `*Requerente:* ${encodeURIComponent(dados.nome)}%0A` +
                  `*CPF/CNPJ:* ${encodeURIComponent(dados.doc)}%0A` +
                  `*Procedimento:* ${encodeURIComponent(dados.servico)}%0A` +
                  `*Detalhes:* ${encodeURIComponent(extras)}%0A` +
                  `*Valor da Causa:* ${encodeURIComponent(dados.valor)}%0A` +
                  `*Resumo:* ${encodeURIComponent(dados.resumo)}%0A%0A` +
                  `*Status:* Novo lead enviado pelo site (cadastro cível).`;
    const whatsappURL = `https://wa.me/5531989420094?text=${texto}`;

    // 2. GERA PDF (Browser) — melhor esforço, independente do CRM
    if (window.gerarDossiePDF) {
        try {
            window.gerarDossiePDF({
                nome: dados.nome,
                telefone: dados.tel,
                area: dados.servico.toUpperCase(),
                valor: dados.valor,
                detalhe: "Protocolo Digital - " + extras,
                relato: dados.resumo
            });
        } catch (e) {
            console.error("⚠️ [Cadastro] Falha ao gerar dossiê PDF:", e);
        }
    }

    // 3. DISPARO HUBSPOT (CRM) — agora aguardamos (await) o resultado REAL
    // antes de decidir se mostramos a tela de sucesso. Isso substitui o antigo
    // padrão "fire and forget" (window.enviarHubspot(dados); sem await, seguido
    // direto da tela de sucesso).
    let hubspotOk = false;
    try {
        if (window.enviarHubspot) {
            hubspotOk = await window.enviarHubspot(dados);
        }
    } catch (e) {
        console.error("❌ [Cadastro] Falha ao enviar para o HubSpot:", e);
        hubspotOk = false;
    }

    btn.disabled = false;
    btn.style.background = "";

    if (hubspotOk) {
        // 4. SUCESSO REAL (confirmado pelo HubSpot) E REDIRECIONAMENTO
        btn.innerHTML = "✅ ENVIADO!";
        document.getElementById('form-cadastro').style.display = 'none';
        document.getElementById('final-screen').style.display = 'block';
        document.getElementById('progress-bar').style.width = '100%';

        // Link de WhatsApp sempre visível (não é window.open) — serve como
        // confirmação extra e não depende de bloqueador de pop-up.
        exibirLinkWhatsapp('final-screen', whatsappURL, false);

        setTimeout(() => {
            window.location.href = 'sala-reuniao.html';
        }, 2500);
    } else {
        // 4b. FALHA REAL: NÃO mostramos tela de sucesso falsa.
        // O usuário vê um erro claro e um caminho alternativo de contato
        // (link de WhatsApp sempre visível + telefone), sem depender de
        // window.open assíncrono.
        btn.innerHTML = btnTextoOriginal || "🔄 Tentar novamente";
        exibirErroEnvio(whatsappURL);
    }
};

// Cria (ou reaproveita) um link <a> clicável e SEMPRE VISÍVEL para o WhatsApp,
// em vez de disparar window.open() de forma assíncrona. Um <a href> normal,
// aberto pelo próprio clique do usuário (target="_blank"), não é bloqueado por
// bloqueadores de pop-up da forma que um window.open() programático fora do
// gesto do usuário costuma ser.
function exibirLinkWhatsapp(containerId, url, isErro) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let link = container.querySelector('.wa-fallback-link');
    if (!link) {
        link = document.createElement('a');
        link.className = 'wa-fallback-link';
        link.target = '_blank';
        link.rel = 'noopener';
        link.style.display = 'inline-block';
        link.style.marginTop = '16px';
        link.style.padding = '12px 22px';
        link.style.background = '#25D366';
        link.style.color = '#fff';
        link.style.borderRadius = '8px';
        link.style.fontWeight = 'bold';
        link.style.textDecoration = 'none';
        container.appendChild(link);
    }

    link.href = url;
    link.innerHTML = isErro
        ? '📲 Falar agora no WhatsApp'
        : '✅ Confirmar recebimento no WhatsApp';
}

// Exibe um bloco de erro claro (não uma tela de sucesso falsa) com alternativas
// reais de contato: link de WhatsApp sempre visível (com os dados já digitados)
// e telefone do escritório.
function exibirErroEnvio(whatsappURL) {
    let container = document.getElementById('erro-envio-screen');
    if (!container) {
        container = document.createElement('div');
        container.id = 'erro-envio-screen';
        container.style.marginTop = '20px';
        container.style.padding = '20px';
        container.style.border = '1px solid #e74c3c';
        container.style.borderRadius = '8px';
        container.style.background = 'rgba(231, 76, 60, 0.08)';

        const formEl = document.getElementById('form-cadastro');
        if (formEl && formEl.parentNode) {
            formEl.parentNode.insertBefore(container, formEl.nextSibling);
        } else {
            document.body.appendChild(container);
        }
    }

    container.style.display = 'block';
    container.innerHTML = `
        <p style="color:#e74c3c; font-weight:bold; margin:0 0 8px 0;">
            ⚠️ Não conseguimos enviar seus dados automaticamente.
        </p>
        <p style="margin:0 0 12px 0;">
            Seus dados preenchidos continuam aqui. Clique no botão abaixo para
            falar direto com o escritório no WhatsApp (mensagem já preenchida),
            ou ligue para <strong>(31) 98942-0094</strong>.
        </p>
    `;

    exibirLinkWhatsapp('erro-envio-screen', whatsappURL, true);

    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// --- MÁSCARAS DE INPUT ---
function setupMasks() {
    const telInput = document.getElementById('cad-tel');
    const docInput = document.getElementById('cad-doc');
    const valorInput = document.getElementById('cad-valor');

    if(telInput) telInput.addEventListener('input', e => {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });

    if(docInput) docInput.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length <= 11) { // CPF
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else { // CNPJ
            v = v.replace(/^(\d{2})(\d)/, '$1.$2');
            v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
            v = v.replace(/(\d{4})(\d)/, '$1-$2');
        }
        e.target.value = v;
    });
}