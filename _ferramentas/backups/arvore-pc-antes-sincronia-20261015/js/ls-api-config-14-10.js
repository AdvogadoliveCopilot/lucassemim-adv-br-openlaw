/* =====================================================================
   CONFIG ÚNICA DO BACKEND — Dr. Lucas Semim
   Usada pela Central do Caso (diagnostico.html) e por futuras páginas
   que conversam com o Apps Script ("Api site") + Google Drive.

   ▸ apiUrl   : URL terminada em /exec da implantação "Api site"
                (Apps Script > Implantar > Gerenciar implantações).
                Depois de colar o código novo, publique uma NOVA VERSÃO
                da MESMA implantação — a URL não muda.
   ▸ whatsapp : número com DDI, só dígitos (a troca de número do site
                também cobre este arquivo).
   ===================================================================== */
window.LS_CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycbxNkBiodBFUxvDK-kfBuSLjBDxTcbhyWfllEv87-wFJlhCO3_d1H2CO_zDPjb_Qs2BK/exec",
  // Painel de Gestão (25_Painel_Admin.gs) — mesma implantação hoje; separado aqui
  // para poder migrar de implantação sem tocar no HTML (orientação 3.6 de 14/10).
  apiUrlAdmin: "https://script.google.com/macros/s/AKfycbxNkBiodBFUxvDK-kfBuSLjBDxTcbhyWfllEv87-wFJlhCO3_d1H2CO_zDPjb_Qs2BK/exec",
  whatsapp: "5531989420094",
  versao: "2026-10-14"
};
