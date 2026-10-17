/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-pje-engine.js === */
/* === FUNÇÃO: Motor de Renderização do Painel Processual === */
/* =========================================================== */
//
// ATUALIZADO 11/09/2026: antes lia um PJE_DB fictício (dado fixo no JS
// público). Agora busca o processo de verdade no backend (Apps Script
// "Advogado Live", função buscarProcessoClientePortal em
// 24_Painel_Cliente.gs), que por sua vez lê a aba "Dashboard Principal"
// -- a mesma que 02_Mapeamento_Drive.gs e 10_Sentinela_Arvore.gs mantêm
// atualizada. Requer codeleicivel/civel-api-config.js carregado antes
// deste arquivo (define CIVEL_API_URL).
//
// NOTA: esta página (painel-processo.html) não carrega civel-core.js de
// propósito -- civel-core.js puxa ~20 módulos de marketing/SEO do site
// público (chat, popups, HubSpot, funil de retorno etc.) que não fazem
// sentido numa página privada e autenticada de dados de processo. Por
// isso definimos aqui uma cópia mínima do helper window.civelReady em
// vez de depender de civel-core.js.
window.civelReady = window.civelReady || function(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
};

window.civelReady(function() {
    console.log("⚖️ [PJe Engine] Inicializando Tribunal Virtual...");

    // 1. VERIFICAÇÃO DE SEGURANÇA
    // Pega o e-mail e a "chave" do cliente salvos no login (painel-cliente.html).
    // Sem os dois, não dá para buscar processo nenhum -- manda de volta pro login.
    const userEmail = sessionStorage.getItem('civel_user_email');
    const clienteChave = sessionStorage.getItem('civel_user_chave');

    if (!userEmail || !clienteChave) {
        alert("Sessão expirada. Faça login novamente.");
        window.location.href = 'painel-cliente.html';
        return;
    }

    if (!window.CIVEL_API_URL || CIVEL_API_URL.indexOf('COLE_AQUI') !== -1) {
        mostrarErroProcesso('Portal ainda em configuração. Fale com o escritório pelo WhatsApp.');
        return;
    }

    const url = CIVEL_API_URL
        + '?acao=buscarProcessoCliente'
        + '&email=' + encodeURIComponent(userEmail)
        + '&clienteChave=' + encodeURIComponent(clienteChave);

    fetch(url)
        .then(function(resp) { return resp.json(); })
        .then(function(data) {
            if (data && data.sucesso && data.processo) {
                renderizarProcesso(data.processo);
            } else {
                mostrarErroProcesso((data && data.mensagem) || 'Não foi possível localizar seu processo.');
            }
        })
        .catch(function() {
            mostrarErroProcesso('Não foi possível conectar ao portal agora. Tente novamente em instantes.');
        });
});

function atualizarChecklistDocumento(idElemento, pronto) {
    const el = document.getElementById(idElemento);
    if (!el) return;
    const icone = el.querySelector('.doc-check-icon');
    const status = el.querySelector('.doc-check-status');
    if (pronto) {
        el.classList.remove('pendente');
        el.classList.add('pronto');
        if (icone) icone.innerText = '✅';
        if (status) status.innerText = 'Pronto';
    } else {
        el.classList.remove('pronto');
        el.classList.add('pendente');
        if (icone) icone.innerText = '⏳';
        if (status) status.innerText = 'Pendente';
    }
}

function mostrarErroProcesso(mensagem) {
    document.getElementById('pje-container').innerHTML = `
        <div style="text-align:center; padding:50px; color:#888;">
            <h2>Não foi possível carregar seu processo.</h2>
            <p>${mensagem}</p>
            <p style="margin-top:20px;"><a href="https://wa.me/5531989420094" style="color:#d4af37;">Falar com o escritório pelo WhatsApp</a></p>
        </div>
    `;
}

function renderizarProcesso(processo) {
    // 2. RENDERIZAÇÃO DOS DADOS (CABECALHO)
    document.getElementById('proc-num').innerText = processo.numero;
    document.getElementById('proc-classe').innerText = processo.classe;
    document.getElementById('proc-assunto').innerText = processo.assunto;
    document.getElementById('proc-juizo').innerText = processo.juizo;
    // O campo antes rotulado "JUIZ" agora mostra a FASE PROCESSUAL (o
    // sistema ainda não rastreia o nome do juiz responsável).
    const elFase = document.getElementById('proc-fase');
    if (elFase) elFase.innerText = processo.fase || 'Não informado';
    document.getElementById('proc-valor').innerText = processo.valor;

    document.getElementById('partes-autor').innerText = processo.partes.autor;
    document.getElementById('partes-reu').innerText = processo.partes.reu;

    // 2b. CHECKLIST DE DOCUMENTOS (Contrato / Procuração / Declaração)
    // Adicionado 17/09/2026 -- le processo.documentos (novo campo do backend,
    // 24_Painel_Cliente.gs V8.4) que confere na pasta do Drive do cliente se
    // os arquivos ja foram gerados/assinados. Se o backend ainda nao envia
    // esse campo (versao antiga do Web App ainda no ar), o bloco mostra
    // "Verificando..." sem quebrar o resto do painel.
    if (processo.documentos) {
        atualizarChecklistDocumento('doc-check-contrato', processo.documentos.contrato);
        atualizarChecklistDocumento('doc-check-procuracao', processo.documentos.procuracao);
        atualizarChecklistDocumento('doc-check-declaracao', processo.documentos.declaracao);

        const todosProntos = processo.documentos.contrato && processo.documentos.procuracao && processo.documentos.declaracao;
        const nota = document.getElementById('doc-checklist-nota');
        if (nota) {
            nota.innerText = todosProntos
                ? '✅ Todos os documentos essenciais estão prontos. Seu processo já pode avançar da fase de protocolo.'
                : 'Assim que todos os documentos estiverem prontos, seu processo pode avançar da fase de protocolo.';
        }
    }

    // 3. RENDERIZAÇÃO DA TIMELINE (MOVIMENTAÇÕES)
    const tbody = document.getElementById('mov-table-body');
    tbody.innerHTML = ""; // Limpa

    processo.movimentacoes.forEach(mov => {
        const tr = document.createElement('tr');

        // Ícone de Documento ou Cadeado
        let docIcon = `<span class="doc-icon lock" title="Documento Interno">🔒</span>`;
        let docClass = "disabled";

        if (mov.doc && mov.doc !== "pendente") {
            docIcon = `<span class="doc-icon pdf" onclick="baixarPeca('${mov.doc}')" title="Baixar Peça">📄</span>`;
            docClass = "active";
        }

        tr.innerHTML = `
            <td class="col-data">
                <span class="pje-date">${mov.data || ''}</span>
                <span class="pje-time">${mov.hora || ''}</span>
            </td>
            <td class="col-desc">
                <div class="mov-evento">${mov.evento}</div>
                <div class="mov-sub">Juntada automática pelo sistema</div>
            </td>
            <td class="col-doc ${docClass}">
                ${docIcon}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// FUNÇÃO DE DOWNLOAD -- AINDA SIMULADA (11/09/2026)
// O backend ainda não expõe um endpoint de download de peça real do
// Drive; isso fica para uma próxima etapa. Por enquanto mantém o toast
// visual para não quebrar a experiência, mas não entrega arquivo nenhum.
window.baixarPeca = function(nomeArquivo) {
    const btn = document.createElement('div');
    btn.innerHTML = `
        <div style="position:fixed; top:20px; right:20px; background:#2ecc71; color:#fff; padding:15px; border-radius:8px; z-index:9999; display:flex; gap:10px; align-items:center; box-shadow:0 10px 30px rgba(0,0,0,0.5); animation: slideIn 0.5s;">
            <span>⬇️</span>
            <div>
                <strong>Download Iniciado</strong><br>
                <small>${nomeArquivo}</small>
            </div>
        </div>
    `;
    document.body.appendChild(btn);
    setTimeout(() => btn.remove(), 3000);
};
