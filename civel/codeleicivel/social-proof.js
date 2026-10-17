/* =========================================================== */
/* === ARQUIVO: codeleicivel/social-proof.js (Geo-Smart) === */
/* === FUNÇÃO: Aviso Contextual Real (sem eventos inventados) === */
/* =========================================================== */
/* REESCRITO 11/09/2026: a versão anterior mostrava um toast de
   "prova social" com cidades e ações de terceiros TOTALMENTE
   inventadas e sorteadas ao acaso (ex.: "Alguém de Contagem agendou
   uma consultoria há 15 min" — não existia consultoria nenhuma,
   era só uma string fixa no array `eventos`). Isso não é apenas uma
   questão de gosto: alegar uma atividade de terceiro que nunca
   aconteceu é propaganda enganosa (CDC) e esbarra na vedação à
   mercantilização/captação de clientela da advocacia (Provimento
   205/2021 da OAB). A versão abaixo só mostra fatos verificáveis:
   - horário real de atendimento (relógio do visitante);
   - cidade real do visitante, obtida por geolocalização de IP real
     (civel-geo.js, que agora roda em toda página — ver correção
     em civel-core.js e civel-geo.js na mesma data);
   - número real de visitas deste navegador a este conteúdo, lido
     do contador que civel-return-lead.js já mantém honestamente;
   - fatos institucionais sempre verdadeiros (sigilo profissional,
     análise inicial sem custo).
   Nenhuma dessas mensagens afirma nada sobre outra pessoa que não
   possa ser verificado. */

window.civelReady(function() {

    // Aguarda 8 segundos para não assustar o visitante na chegada
    setTimeout(iniciarAvisoContextual, 8000);

    function iniciarAvisoContextual() {
        const mensagem = escolherMensagem(construirMensagensReais());
        if (!mensagem) return; // nunca deveria acontecer (sempre há fallback evergreen), mas por segurança

        exibirToast(mensagem);
    }

    // ===========================================================
    // 1. CONSTRÓI A LISTA DE MENSAGENS ELEGÍVEIS, TODAS REAIS
    //    Cada mensagem tem um "peso": mensagens mais pessoais/reais
    //    para ESTE visitante específico pesam mais na escolha do que
    //    os fatos institucionais genéricos (que servem de piso/fallback).
    // ===========================================================
    function construirMensagensReais() {
        const mensagens = [];
        const hora = new Date().getHours();
        const emHorarioComercial = hora >= 8 && hora < 19;

        // --- Fato real: horário de atendimento agora ---
        if (emHorarioComercial) {
            mensagens.push({
                icon: '🟢', cor: '#2ecc71', label: 'ATENDIMENTO ATIVO',
                texto: 'Nossa equipe está em horário de atendimento agora. Análise inicial sem custo.',
                peso: 2
            });
        } else {
            mensagens.push({
                icon: '🌙', cor: '#9b59b6', label: 'PLANTÃO JURÍDICO',
                texto: 'Fora do horário comercial, mas o plantão jurídico digital responde pelo WhatsApp.',
                peso: 2
            });
        }

        // --- Fato real: cidade do visitante, se a geolocalização de IP já respondeu ---
        // (sessionStorage 'user_city' só existe quando civel-geo.js conseguiu
        // uma resposta real da API — nunca é inventado aqui)
        try {
            const cidadeReal = sessionStorage.getItem('user_city');
            if (cidadeReal) {
                mensagens.push({
                    icon: '📍', cor: '#d4af37', label: 'SUA REGIÃO',
                    texto: `Também atendemos clientes de ${cidadeReal}, presencialmente ou por videoconferência.`,
                    peso: 3
                });
            }
        } catch (e) { /* sessionStorage indisponível (modo privado etc.) — segue sem essa mensagem */ }

        // --- Fato real: quantas vezes ESTE navegador já visitou este conteúdo ---
        // (lê o contador que civel-return-lead.js já mantém; nunca escreve nele)
        try {
            const raw = localStorage.getItem('semim_civel_rv_v1');
            if (raw) {
                const dados = JSON.parse(raw);
                if (dados && dados.count >= 2) {
                    mensagens.push({
                        icon: '👋', cor: '#d4af37', label: 'QUE BOM TE VER DE VOLTA',
                        texto: `Esta é a sua ${dados.count}ª visita a este conteúdo — alguma dúvida ficou pendente?`,
                        peso: 3
                    });
                }
            }
        } catch (e) { /* dado ausente ou corrompido — segue sem essa mensagem */ }

        // --- Fatos institucionais sempre verdadeiros (piso/fallback) ---
        mensagens.push({
            icon: '🔒', cor: '#2ecc71', label: 'SIGILO GARANTIDO',
            texto: 'Toda consulta é protegida pelo sigilo profissional do Estatuto da OAB (art. 25).',
            peso: 1
        });
        mensagens.push({
            icon: '📄', cor: '#d4af37', label: 'SEM CUSTO INICIAL',
            texto: 'A primeira análise do seu caso é gratuita e sem compromisso.',
            peso: 1
        });

        return mensagens;
    }

    // Sorteio ponderado: mensagens mais pessoais/reais têm mais chance de
    // aparecer que os fatos genéricos, mas tudo na lista já é verdadeiro.
    function escolherMensagem(lista) {
        const total = lista.reduce((soma, m) => soma + m.peso, 0);
        let sorteio = Math.random() * total;
        for (const m of lista) {
            if (sorteio < m.peso) return m;
            sorteio -= m.peso;
        }
        return lista[lista.length - 1];
    }

    // ===========================================================
    // 2. RENDERIZAÇÃO DO TOAST
    // ===========================================================
    function exibirToast(mensagem) {
        const toast = document.createElement('div');
        toast.className = 'social-proof-toast';
        toast.style.setProperty('--sp-cor', mensagem.cor);
        toast.innerHTML = `
            <div class="sp-icon-wrapper">
                <span class="sp-icon">${mensagem.icon}</span>
                <span class="sp-pulse"></span>
            </div>
            <div class="sp-content">
                <span class="sp-title">${mensagem.label}</span>
                <p>${mensagem.texto}</p>
            </div>
            <div class="sp-close" role="button" aria-label="Fechar aviso">×</div>
        `;

        injetarEstilo();
        document.body.appendChild(toast);

        // Animação de Entrada
        setTimeout(() => toast.classList.add('active'), 100);

        toast.querySelector('.sp-close').onclick = () => fecharToast();

        // Auto-fechar após alguns segundos (não pode ser muito longo)
        const autoFechar = setTimeout(() => fecharToast(), 8000);

        function fecharToast() {
            clearTimeout(autoFechar);
            if (document.body.contains(toast)) {
                toast.classList.remove('active');
                setTimeout(() => toast.remove(), 600);
            }
        }
    }

    function injetarEstilo() {
        if (document.getElementById('social-proof-styles')) return; // injeta o CSS uma única vez
        const style = document.createElement('style');
        style.id = 'social-proof-styles';
        style.innerHTML = `
            .social-proof-toast {
                position: fixed; bottom: 30px; left: 30px;
                background: rgba(12, 12, 14, 0.95);
                backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1);
                border-left: 3px solid var(--sp-cor, #2ecc71);
                color: #ccc; padding: 15px 20px; border-radius: 12px;
                display: flex; align-items: center; gap: 15px;
                box-shadow: 0 15px 40px rgba(0,0,0,0.6);
                z-index: 9980; /* Abaixo do Chat e do aviso de Privacidade */
                font-family: 'Lato', sans-serif;
                max-width: 340px;
                transform: translateY(100px); opacity: 0;
                transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
            }
            .social-proof-toast.active { transform: translateY(0); opacity: 1; }

            .sp-icon-wrapper { position: relative; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
            .sp-icon { font-size: 1.5rem; z-index: 2; position: relative; }
            .sp-pulse {
                position: absolute; width: 100%; height: 100%;
                background: var(--sp-cor, #2ecc71); opacity: 0.35;
                border-radius: 50%; z-index: 1;
                animation: sp-pulse-ring 2s infinite;
            }

            .sp-content { flex: 1; }
            .sp-title { font-size: 0.7rem; color: var(--sp-cor, #2ecc71); text-transform: uppercase; letter-spacing: 1px; font-weight: bold; display: block; margin-bottom: 3px; }
            .sp-content p { font-size: 0.88rem; color: #bbb; margin: 0; line-height: 1.4; }

            .sp-close { cursor: pointer; color: #555; font-size: 1.4rem; padding: 0 0 0 10px; transition: 0.2s; line-height: 1; flex-shrink: 0; }
            .sp-close:hover { color: #fff; }

            @keyframes sp-pulse-ring {
                0% { transform: scale(0.8); opacity: 0.5; }
                100% { transform: scale(2); opacity: 0; }
            }

            @media(max-width: 768px) {
                .social-proof-toast {
                    bottom: auto; top: 90px; /* No topo no mobile para não atrapalhar navegação */
                    left: 5%; width: 90%;
                    border-radius: 16px; padding: 12px 18px;
                }
                .sp-content p { font-size: 0.82rem; }
            }
        `;
        document.head.appendChild(style);
    }
});
