/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-process-db.js === */
/* === FUNÇÃO: Banco de Dados de Processos (Simulado) === */
/* =========================================================== */

const PJE_DB = {
    // SANITIZADO 10/09/2026: dados reais de processo/valor/partes de clientes reais
    // estavam hardcoded em texto puro aqui, sem autenticação real. Substituído por
    // dado fictício até existir backend com autenticação de verdade.
    // Conta de demonstração
    "DEMO-001": {
        numero: "0000000-00.0000.0.00.0000",
        classe: "PROCEDIMENTO COMUM CÍVEL",
        assunto: "Exemplo de Andamento Processual",
        juizo: "VARA CÍVEL DE EXEMPLO",
        juiz: "Exemplo",
        valor: "R$ 0,00",
        partes: {
            autor: "CLIENTE DEMONSTRAÇÃO",
            reu: "PARTE EXEMPLO"
        },
        movimentacoes: [
            { data: "01/01/2026", hora: "00:00", evento: "EXEMPLO DE MOVIMENTAÇÃO", doc: "exemplo.pdf" }
        ]
    },

    // ADMIN (Visão Geral)
    "ADMIN-MASTER": {
        numero: "0000000-00.2025.8.00.0000",
        classe: "PAINEL ADMINISTRATIVO",
        assunto: "Gestão Geral do Escritório",
        juizo: "GABINETE DR. LUCAS SEMIM",
        juiz: "Lucas Semim",
        valor: "R$ ---",
        partes: { autor: "LUCAS SEMIM ADVOCACIA", reu: "DIVERSOS" },
        movimentacoes: [
            { data: "HOJE", hora: "NOW", evento: "SISTEMA OPERANDO 100%", doc: "Checklist.pdf" }
        ]
    }
};