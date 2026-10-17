/* =====================================================================
   CONFIG ÚNICA DO BACKEND — Dr. Lucas Semim
   Usada pela Central do Caso (diagnostico.html) e por futuras páginas
   que conversam com o Apps Script ("Api site") + Google Drive.

   ▸ apiUrl   : URL terminada em /exec da implantação "Api site"
                (Apps Script > Implantar > Gerenciar implantações).
                Depois de colar o código novo, publique uma NOVA VERSÃO
                da MESMA implantação — a URL não muda.
   ▸ apiUrlPortal : URL terminada em /exec da implantação "Portal API" (projeto "Portal do Cliente – Lucas Semim").
                Usada só pela página do cliente (portal/painel-cliente.html). Sem esta linha, a página usa apiUrl.
   ▸ whatsapp : número com DDI, só dígitos (a troca de número do site
                também cobre este arquivo).
   ===================================================================== */
window.LS_CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycbxNkBiodBFUxvDK-kfBuSLjBDxTcbhyWfllEv87-wFJlhCO3_d1H2CO_zDPjb_Qs2BK/exec",
  apiUrlPortal: "https://script.google.com/macros/s/AKfycbwQjmF-cyZ4NwLLLI79rXEVCxlhydj25kGOUDQ-XJuZdozeegL-jSc6t0Nrak8a39XT/exec",
  whatsapp: "5531989420094",
  versao: "2026-10-03"
};
