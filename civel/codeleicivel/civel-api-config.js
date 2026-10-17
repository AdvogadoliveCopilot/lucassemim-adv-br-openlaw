/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-api-config.js (NOVO) === */
/* === FUNÇÃO: URL única do backend real do Painel do Cliente === */
/* =========================================================== */
// Criado 11/09/2026 junto com a correção do doPost duplicado no projeto
// "Advogado Live" (Apps Script). Depois de publicar uma NOVA VERSÃO da
// implantação "Api site" (Implantar > Gerenciar implantações > editar
// "Api site" > Nova versão), cole aqui a URL terminada em /exec.
//
// Enquanto isso não for feito, o login e a consulta de processo do site
// mostram uma mensagem de erro clara ao cliente, em vez de travar
// silenciosamente ou usar dados fictícios.
const CIVEL_API_URL = "https://script.google.com/macros/s/AKfycbxNkBiodBFUxvDK-kfBuSLjBDxTcbhyWfllEv87-wFJlhCO3_d1H2CO_zDPjb_Qs2BK/exec";
