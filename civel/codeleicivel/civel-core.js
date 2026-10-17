/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-core.js (Evergreen V5.0) === */
/* === FUNÇÃO: Carregamento Inteligente com Cache Busting === */
/* =========================================================== */

(function() {
    console.log("💎 [Quantum Core] Iniciando Sistema Operacional Cível V5.0...");

    // =========================================================
    // ⚠️ DÍVIDA TÉCNICA CONHECIDA (auditoria de carregamento):
    // Cerca de ~26 dos ~30 módulos carregados abaixo (ex.: civel-geo.js,
    // civel-chat-opt.js, platinum-core.js) inicializam escutando
    // diretamente `document.addEventListener('DOMContentLoaded', ...)`.
    // Como esses módulos são injetados DINAMICAMENTE via <script src>
    // (depois do parse inicial do HTML), é possível — e comum em
    // conexões lentas — que o DOMContentLoaded JÁ TENHA DISPARADO antes
    // do script chegar via rede e ser executado. Nesse caso o listener
    // NUNCA dispara, e o módulo simplesmente não inicializa, SEM erro
    // no console (sumiço aleatório de menu/geo/chat etc).
    //
    // CORREÇÃO CENTRALIZADA: a função global `window.civelReady(fn)`
    // definida abaixo já trata esse caso corretamente (executa na hora
    // se o DOM já estiver pronto, ou espera o evento caso contrário).
    // Os ~30 módulos DEVERIAM migrar de
    // `document.addEventListener('DOMContentLoaded', fn)` para
    // `window.civelReady(fn)`. Essa migração NAO foi feita agora — é
    // mudança grande demais para ser feita com segurança de uma vez só;
    // fica para uma próxima revisão, arquivo por arquivo.
    // =========================================================
    window.civelReady = window.civelReady || function(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    };

    // 1. CONFIGURAÇÃO DE CAMINHO E VERSÃO
    const scriptTag = document.currentScript || document.querySelector('script[src*="civel-core.js"]');
    let path = 'codeleicivel/';
    
    // CONTROLE DE VERSÃO (Mude aqui quando atualizar algo grande)
    // Isso obriga o navegador do cliente a baixar os arquivos novos
    const VERSAO_SISTEMA = "5.5"; 

    if (scriptTag) {
        const src = scriptTag.src;
        path = src.substring(0, src.lastIndexOf('/') + 1);
    }

    // 2. LISTA MESTRA DE INTELIGÊNCIAS (Ordem de Prioridade)
    // ATUALIZAÇÃO 11/09/2026 (performance): módulos que só fazem sentido em
    // páginas específicas (calculadoras, wizard de diagnóstico, sala de
    // reunião, índice automático) agora entram como { file, gate } em vez de
    // uma string simples. 'gate' é um seletor CSS: o arquivo só é baixado se
    // `document.querySelector(gate)` achar algo na página atual. Isso evita
    // requisições de rede inúteis (ex.: civel-financas.js carregando numa
    // página de família, que não tem calculadora nenhuma).
    const modules = [
        // --- ESTRUTURA VISUAL (Críticos) ---
        'structure.js',             // Menu e Footer (Base)
        'platinum-ui.js',           // Efeitos 3D e Design
        { file: 'civel-slider.js', gate: '.civel-slide' }, // Banner da Home (nenhuma pagina usa mais -- ver blindagem-patrimonial.html 11/09/2026)
        'civel-particles.js',       // Gráficos Quânticos (Fundo)

        // --- SEO & GEOLOCALIZAÇÃO ---
        'civel-seo.js',             // Metadados Google
        'civel-geo.js', // Geolocalização real do visitante (grava sessionStorage 'user_city'); social-proof.js depende deste dado real. ATUALIZADO 11/09/2026: antes gateado por '.geo-cidade', que nenhuma página tinha, então nunca rodava.
        'civel-lgpd.js',            // Cookies
        // REMOVIDO 11/09/2026: 'platinum-core.js' — auditoria mostrou que suas
        // 3 funcoes estavam todas obsoletas: (1) reescrevia o favicon de TODA
        // pagina para https://lucassemim.adv.br/Favicon-lucassemim.png, desfazendo
        // o favicon.ico do civel ja corrigido no HTML estatico; (2) sua logica de
        // 'tab recovery' (titulo da aba) e sempre sobrescrita pela do civel-quantum.js,
        // que roda depois e faz a mesma coisa de forma mais completa; (3) sua logica
        // de anti-copia (assinatura no clipboard) tambem e sempre sobrescrita pela do
        // civel-quantum.js, pelo mesmo motivo. O proprio arquivo ja documentava que
        // sua 3a funcao (schema JSON-LD) tinha sido removida por duplicidade com
        // civel-seo.js. Nao sobrou nada de unico — arquivo mantido em disco mas
        // parou de ser carregado.

        // --- INTELIGÊNCIA DE DADOS ---
        'civel-form-intelligence.js', // Validação de CPF/CNPJ e Máscaras
        { file: 'civel-forms.js', gate: '#form-cadastro' }, // Lógica do Wizard de Cadastro (só em cadastro-cliente.html)
        'civel-hubspot.js',
        { file: 'civel-read-ai.js', gate: '.btn-agenda-ia, #process-dashboard' },  // Agenda IA / Auditoria (só onde há botão de agenda ou painel de reunião)
        { file: 'civel-pdf.js', gate: '#diag-civel-container' },                   // Gerador de Dossiê (só nas páginas com o wizard de diagnóstico)
        { file: 'civel-meeting-logic.js', gate: '#login-screen, #client-phone' },  // Sala de Reunião (só em sala-reuniao.html)

        // --- INTERAÇÃO & MARKETING ---
        'civel-interacao.js',       // Exit Intent
        'social-proof.js',          // "Fulano acabou de entrar"
        { file: 'civel-smart-cta.js', gate: '.cta-internal' },  // CTA por palavra-chave (ativado 10/09/2026 — NENHUMA página tem o container .cta-internal ainda)
        'civel-return-lead.js',     // Funil de retorno (ativado 10/09/2026 — envio desligado até configurar webhookUrl)
        'civel-chat.js',            // Chat do Dr. Lucas (balão dourado, IA + WhatsApp) — substitui o HubSpot chat-opt e o botão ⌘ de busca (03/10/2026)
        { file: 'civel-related.js', gate: '#related-articles-container' }, // Artigos Relacionados (NENHUMA página tem o container ainda)
        { file: 'civel-toc.js', gate: '#indice-magico-container' },               // Índice Automático (NENHUMA página tem esse container hoje — fica pronto pra quando existir)
        'civel-quantum.js',         // Barra de Progresso Dourada (sitewide, não gatear)

        // --- FERRAMENTAS ESPECÍFICAS ---
        { file: 'civel-financas.js', gate: '#valor-bens, #valor-fin, #valor-emp, #valor-divida' }, // Calculadoras
        { file: 'civel-diagnostico.js', gate: '#diag-civel-container' },          // Wizard de Diagnóstico Civel
        'civel-search.js',          // Busca Interna
        'civel-prefetch.js',
        'civel-time-aware.js',
        'pwa-install.js',            // Instalação App Mobile (registra o service-worker.js via navigator.serviceWorker.register — NAO carregar de novo aqui como <script>)
        'civel-mobile-optimizer.js' // TURBO MOBILE
    ];

    // 3. MOTOR DE CARREGAMENTO COM CACHE BUSTING (+ CARREGAMENTO CONDICIONAL)

    // Helper compartilhado: injeta um <script src> com retry, cache busting e
    // preservação de ordem. Exportado em window.semimLoadScript para que os
    // outros loaders do site reusem a MESMA logica (antes cada um tinha a sua
    // copia do retry e elas podiam divergir).
    //   opts.src     — URL completa do script (obrigatorio)
    //   opts.key     — trecho usado no seletor de duplicidade (default: o proprio src)
    //   opts.retries — tentativas extras em caso de erro (default: 3)
    //   opts.backoff — ms entre tentativas (default: 500)
    //   opts.onload / opts.onerror — callbacks opcionais
    //   opts.resolveOnError — se true, nao rejeita quando as tentativas acabam
    //                         (default: true, para nao travar o site)
    //   opts.timeoutMs — tempo maximo de espera por resposta (default: 15000)
    window.semimLoadScript = window.semimLoadScript || function(opts) {
        const cfg = opts || {};
        const src = cfg.src;
        const key = cfg.key || src;
        const backoff = cfg.backoff === undefined ? 500 : cfg.backoff;
        const resolveOnError = cfg.resolveOnError === undefined ? true : cfg.resolveOnError;
        const timeoutMs = cfg.timeoutMs === undefined ? 15000 : cfg.timeoutMs;

        return new Promise((resolve, reject) => {
            function tentar(restantes) {
                // Verifica se já existe (Evita duplicidade)
                if (key && document.querySelector(`script[src*="${key}"]`)) { resolve(); return; }

                const script = document.createElement('script');
                script.src = src;
                script.defer = true;
                // Preserva ordem de execução: scripts criados via createElement()
                // são `async=true` por padrão (defer é ignorado nesse caso), então
                // sem isto a ordem de execução segue a ordem de RESPOSTA da rede,
                // não a ordem da lista `modules`.
                script.async = false;

                let encerrado = false;
                const timer = timeoutMs > 0 ? setTimeout(() => falhar('timeout'), timeoutMs) : null;

                function limpar() {
                    if (timer) clearTimeout(timer);
                }

                function falhar(motivo) {
                    if (encerrado) return;
                    encerrado = true;
                    limpar();
                    script.remove();
                    if (typeof cfg.onerror === 'function') { try { cfg.onerror(motivo, restantes); } catch (e) { } }
                    if (restantes > 0) {
                        console.warn(`⚠️ Falha em ${key} (${motivo}). Retentando (${restantes})...`);
                        setTimeout(() => tentar(restantes - 1), backoff);
                    } else if (resolveOnError) {
                        console.error(`❌ Falha crítica: ${key}`);
                        resolve(); // Segue o jogo para não travar o site
                    } else {
                        reject(new Error(`Falha ao carregar ${key}`));
                    }
                }

                script.onload = () => {
                    if (encerrado) return;
                    encerrado = true;
                    limpar();
                    if (typeof cfg.onload === 'function') { try { cfg.onload(); } catch (e) { } }
                    resolve();
                };
                script.onerror = () => falhar('erro de rede');

                document.body.appendChild(script);
            }

            tentar(cfg.retries === undefined ? 3 : cfg.retries);
        });
    };

    function loadScript(mod, retries = 3) {
        // 'mod' pode ser uma string ('arquivo.js') ou um objeto
        // { file: 'arquivo.js', gate: '#seletor-css' } para módulos condicionais.
        const filename = typeof mod === 'string' ? mod : mod.file;
        const gate = typeof mod === 'string' ? null : mod.gate;

        // Módulo condicional: só baixa se a página atual tiver o elemento-gatilho.
        // Isso poupa uma requisição de rede inteira em páginas onde o módulo
        // nunca faria nada mesmo (ex.: calculadora bancária numa página de família).
        if (gate && !document.querySelector(gate)) {
            return Promise.resolve();
        }

        // AQUI ESTÁ A MÁGICA: o ?v= força o navegador a baixar a versão nova.
        return window.semimLoadScript({
            src: `${path}${filename}?v=${VERSAO_SISTEMA}`,
            key: filename,
            retries: retries
        });
    }

    // 4. EXECUÇÃO EM CADEIA OTIMIZADA
    Promise.all(modules.map(mod => loadScript(mod)))
        .then(() => {
            console.log("🚀 [Quantum Core] Sistema 100% Operacional e Atualizado.");
            document.dispatchEvent(new Event('CivelCoreReady'));
        });

    // 5. GARANTIAS FINAIS (HubSpot & Performance)
    window.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById('hs-script-loader')) {
            const hsScript = document.createElement('script');
            hsScript.src = "//js-na1.hs-scripts.com/50778347.js";
            hsScript.id = "hs-script-loader";
            hsScript.async = true;
            hsScript.defer = true;
            document.body.appendChild(hsScript);
        }
    });

    // Monitor de Velocidade
    window.addEventListener('load', () => {
        const time = window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart;
        console.log(`⚡ Tempo de Carregamento: ${time}ms`);
    });

})();
