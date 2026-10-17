/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-hubspot.js === */
/* === FUNÇÃO: Integração Segura via Forms API v3 === */
/* =========================================================== */

window.enviarHubspot = function(dados) {
    console.log("🔗 [HubSpot Link] Iniciando transmissão segura...");

    const PORTAL_ID = '50778347';
    const FORM_ID = 'd50607f1-1308-4356-bfc7-8a50c1e39061';
    const URL = `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_ID}`;

    // Agrupa os dados técnicos no campo de "Mensagem" do CRM
    // para não perder nenhuma informação do formulário rico
    const relatorioTecnico = `
    DADOS DO DOSSIÊ (SITE CÍVEL):
    -----------------------------
    👤 Nome: ${dados.nome}
    📄 Doc: ${dados.doc}
    ⚖️ Demanda: ${dados.servico}
    💰 Valor Estimado: ${dados.valor}
    📝 Resumo: ${dados.resumo}
    `;

    // Payload (Pacote de Dados)
    const payload = {
        "fields": [
            { "name": "email", "value": dados.email },
            { "name": "firstname", "value": dados.nome },
            { "name": "phone", "value": dados.tel },
            { "name": "message", "value": relatorioTecnico } // Joga tudo aqui
        ],
        "context": {
            "pageUri": window.location.href,
            "pageName": document.title
        }
    };

    // Envio real: devolve uma Promise<boolean> para quem chamou,
    // que agora AGUARDA o resultado real antes de exibir sucesso ao usuário.
    // (Antes era "fire & forget": a tela de sucesso aparecia sem checar a resposta.)
    return fetch(URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (response.ok) {
            console.log("✅ [HubSpot] Lead cadastrado com sucesso.");
            return true;
        }
        console.warn("⚠️ [HubSpot] Retorno atípico:", response.status);
        return false;
    })
    .catch(error => {
        console.error("❌ [HubSpot] Falha na conexão API:", error);
        return false;
    });
};