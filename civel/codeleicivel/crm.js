/* =========================================================== */
/* === ARQUIVO: codelei/crm.js (HubSpot Integration v2.0) === */
/* === FUNÇÃO: Conexão Oficial + Rastreamento de Leads === */
/* =========================================================== */

document.addEventListener("DOMContentLoaded", function() {
    
    // 1. CONFIGURAÇÃO DO SCRIPT OFICIAL (Seu Link Específico)
    const HS_SCRIPT_URL = "//js-na1.hs-scripts.com/50778347.js";
    const HS_SCRIPT_ID = "hs-script-loader";

    // Segurança: Evita carregar duas vezes
    if (document.getElementById(HS_SCRIPT_ID)) return;

    console.log("🚀 [CRM Live] Conectando ao HubSpot (NA1)...");

    // 2. INJEÇÃO DO EMBED CODE
    const script = document.createElement("script");
    script.src = HS_SCRIPT_URL;
    script.id = HS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.type = "text/javascript";
    document.body.appendChild(script);

    // 3. IDENTIFICAÇÃO INTELIGENTE DE USUÁRIO
    // Se o cliente já digitou o nome em algum formulário do site (Criminal ou Cível),
    // nós avisamos o HubSpot quem ele é assim que a página carrega.
    identifyUser();
});

function identifyUser() {
    // Inicializa o array do HubSpot (fila de eventos)
    var _hsq = window._hsq = window._hsq || [];

    // Tenta recuperar dados salvos na memória do navegador
    const nome = sessionStorage.getItem('diag-nome') || sessionStorage.getItem('cad-nome') || sessionStorage.getItem('civel-nome');
    const email = sessionStorage.getItem('diag-email') || sessionStorage.getItem('cad-email');

    if (email) {
        // Se temos e-mail, identificamos o usuário nominalmente
        _hsq.push(["identify", {
            email: email,
            firstname: nome || 'Visitante'
        }]);
        console.log("👤 [CRM Live] Visitante identificado e rastreado.");
    }
    
    // Rastreia a visualização da página atual
    _hsq.push(["trackPageView"]);
}

/* --- FUNÇÃO GLOBAL PARA DISPARO MANUAL ---
   Esta função será chamada pelos botões de "Enviar WhatsApp" futuramente
   para salvar o lead no CRM ao mesmo tempo.
*/
window.enviarParaHubSpot = function(dados) {
    var _hsq = window._hsq = window._hsq || [];

    // Identifica (ou re-identifica) com os dados novos
    if (dados.email) {
        _hsq.push(["identify", {
            email: dados.email,
            firstname: dados.nome,
            phone: dados.telefone
        }]);
    }

    // Registra o evento de interação
    _hsq.push(["trackEvent", {
        id: dados.evento || "Clique WhatsApp",
        value: dados.valor || 0
    }]);

    console.log("📝 [CRM Live] Dados enviados para o histórico do cliente.");
};