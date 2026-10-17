/* =========================================================== */
/* === ARQUIVO: js/smart-cta.js (SmartCta V5)              === */
/* === FUNÇÃO: Banner CTA dinâmico por score de contexto   === */
/* === Corrigido: window.gtag, transition CSS, semântica   === */
/* === BUGFIX 5: containerSelector agora usa querySelectorAll */
/* ===   (preenche TODOS os .cta-internal da página) e ganha  */
/* ===   fallback de auto-inserção de container — sem isso,   */
/* ===   nenhuma página do site tinha .cta-internal no HTML   */
/* ===   e o sistema nunca renderizava nada em produção.      */
/* =========================================================== */

/*
  COMO FUNCIONA:
  1. Lê URL + título + meta + H1 + H2 da página
  2. Remove acentos e normaliza o texto
  3. Calcula um score para cada entrada do banco (mais keywords = maior score)
  4. Preenche TODOS os containers .cta-internal da página com o banner mais
     relevante (uma página de artigo longo pode ter mais de um)
  5. Se a página não tiver NENHUM .cta-internal, tenta criar um
     automaticamente em um ponto seguro do conteúdo principal
     (ver autoInsertContainer) — se não achar um ponto seguro, não insere nada
  6. Botão abre WhatsApp com mensagem pré-formatada para aquele contexto

  COMO ADICIONAR EM UMA PÁGINA (opcional — o script agora se auto-insere):
  <div class="cta-internal"></div>
  O SmartCta preenche automaticamente com o CTA certo. Pode haver mais de
  um por página.
*/

window.SmartCta = {

  config: {
    containerSelector: '.cta-internal',
    // Seletores do "conteúdo principal" da página, usados tanto para ler
    // contexto (H2s) quanto para decidir onde auto-inserir um container
    // quando a página não tem nenhum .cta-internal manual.
    mainContentSelector: 'article, .artigo-conteudo, .post-content, main',
    whatsapp: '5531989420094',
    waBase:   'https://wa.me/',
    styleId:  'smart-cta-styles',
    isDebug:  window.location.hostname !== 'lucassemim.adv.br',

    db: [
      /* ── URGÊNCIA ─────────────────────────────────────────── */
      {
        match: ['flagrante', 'preso', 'delegacia', 'custodia', 'preventiva', 'prisao', 'detido', 'algemado'],
        urgente: true,
        title: 'URGÊNCIA: ALGUÉM FOI PRESO AGORA?',
        desc:  'Cada minuto conta na Audiência de Custódia. Acione o Plantão Criminal do Dr. Lucas Semim e exija o relaxamento da prisão ilegal agora.',
        btnText: 'ACIONAR PLANTÃO 24H',
        btnClass: 'btn-cta-red',
        icon: 'fas fa-triangle-exclamation',
        msg: 'Dr. Lucas, URGÊNCIA! Preciso do Plantão Criminal. Alguém foi preso agora.'
      },
      {
        match: ['habeas corpus', 'hc', 'liminar', 'trancamento', 'ilegalidade', 'soltura'],
        urgente: true,
        title: 'HABEAS CORPUS DE EMERGÊNCIA',
        desc:  'O HC pode libertar seu familiar em horas. Dr. Lucas Semim impetrou HCs no TJMG, STJ e STF. Acione agora — cada hora importa.',
        btnText: 'IMPETRAR HC URGENTE',
        btnClass: 'btn-cta-red',
        icon: 'fas fa-scale-balanced',
        msg: 'Dr. Lucas, preciso de um Habeas Corpus urgente. Meu familiar está preso ilegalmente.'
      },
      {
        match: ['tornozeleira', 'monitoramento', 'descarga', 'bateria', 'violacao', 'rompimento'],
        urgente: true,
        title: 'TORNOZELEIRA COM PROBLEMA?',
        desc:  'O STJ proíbe a revogação automática por descarga de bateria (HC 978.495/MG). Dr. Lucas Semim entra com defesa imediata antes da audiência.',
        btnText: 'DEFESA IMEDIATA AGORA',
        btnClass: 'btn-cta-red',
        icon: 'fas fa-satellite-dish',
        msg: 'Dr. Lucas, a tornozeleira eletrônica do meu familiar deu problema. Preciso de defesa urgente.'
      },
      {
        match: ['lei seca', 'bafometro', 'cnh', 'multa', 'transito', 'blitz', 'etilometro', 'tco'],
        urgente: true,
        title: 'AUTO DE INFRAÇÃO PODE SER NULO',
        desc:  'Quase 90% dos Autos de Infração da Lei Seca têm falhas. Envie a foto da multa ou TCO e o Dr. Lucas Semim analisa a nulidade gratuitamente.',
        btnText: 'AUDITAR MULTA / TCO',
        btnClass: 'btn-cta-red',
        icon: 'fas fa-id-card',
        msg: 'Dr. Lucas, fui parado na Blitz. Quero auditar o Auto de Infração da Lei Seca / TCO para anular a suspensão da CNH.'
      },

      /* ── DEFESA CRIMINAL ───────────────────────────────────── */
      {
        match: ['trafico', 'drogas', 'entorpecentes', 'porte', 'usuario', '11343', 'privilegiado'],
        title: 'PRESO POR TRÁFICO? PODE SER USO.',
        desc:  'O STF reconhece que usuário não é traficante. Dr. Lucas Semim aplica o §4º do art. 33 — tráfico privilegiado — e reduz a pena em até 2/3.',
        btnText: 'ANALISAR MEU CASO AGORA',
        btnClass: 'btn-cta-elite',
        icon: 'fas fa-pills',
        msg: 'Dr. Lucas, fui preso com drogas. Preciso saber se tenho direito ao tráfico privilegiado ou uso pessoal.'
      },
      {
        match: ['execucao penal', 'seeu', 'reincidencia', 'dosimetria', 'detencao', 'calculo', 'fracao', 'stj tema'],
        title: 'AUDITORIA GRATUITA DO SEEU',
        desc:  'O Estado pode estar roubando anos da sua vida. Erros no SEEU são comuns. Envie o Atestado de Pena e aplicamos os Temas 1172 e 1084 do STJ.',
        btnText: 'ENVIAR ATESTADO (GRÁTIS)',
        btnClass: 'btn-cta-elite',
        icon: 'fas fa-calculator',
        msg: 'Dr. Lucas, quero auditar o cálculo de pena / progressão do meu familiar pelo SEEU. Qual documento devo enviar?'
      },
      {
        match: ['saidinha', 'saida temporaria', '14843', 'pascoa', 'natal', 'dia das maes', 'beneficio'],
        title: 'SAIDINHA BLOQUEADA INDEVIDAMENTE?',
        desc:  'A Lei 14.843/2024 não pode retroagir. Se o benefício foi negado para crimes anteriores à lei, há direito adquirido. Dr. Lucas Semim recorre imediatamente.',
        btnText: 'RECORRER DA NEGATIVA',
        btnClass: 'btn-cta-elite',
        icon: 'fas fa-door-open',
        msg: 'Dr. Lucas, o juiz negou a saidinha do meu familiar. Quero saber se tenho direito ao recurso.'
      },
      {
        match: ['preventiva', 'revogacao', 'art 312', 'fundamentacao', 'ordem publica', 'preso preventivo'],
        title: 'PRISÃO PREVENTIVA PODE SER ILEGAL',
        desc:  'Sem fundamentos concretos no art. 312 do CPP, a prisão é ilegal e o HC derruba. O Dr. Lucas Semim impugna preventivas no TJMG, STJ e STF.',
        btnText: 'VERIFICAR LEGALIDADE',
        btnClass: 'btn-cta-elite',
        icon: 'fas fa-unlock',
        msg: 'Dr. Lucas, meu familiar está preso preventivamente. Quero verificar se a prisão é legal.'
      },
      {
        match: ['gaeco', 'megaoperacao', 'servidor publico', 'propina', 'extorsao', 'corrupcao', 'colarinho', 'ocrim', '12850'],
        title: 'ALVO DE MEGAOPERAÇÃO DO GAECO?',
        desc:  'Denúncias genéricas são nulas. Dr. Lucas Semim exige a individualização da conduta e tranca inquéritos baseados em "pesca de arrasto" no STJ.',
        btnText: 'BLINDAR MEU PATRIMÔNIO',
        btnClass: 'btn-cta-elite',
        icon: 'fas fa-shield-halved',
        msg: 'Dr. Lucas, meu nome foi envolvido em operação do GAECO. Preciso de uma auditoria criminal urgente.'
      },
      {
        match: ['juri', 'tribunal do juri', 'homicidio', 'feminicidio', 'plenario', 'quesitos', 'pronuncia'],
        title: 'JULGAMENTO NO JÚRI SE APROXIMA?',
        desc:  'A Tropa de Choque do Dr. Lucas Semim no Tribunal do Júri é especializada em Sabará e BH. Cada detalhe no plenário define absolvição ou condenação.',
        btnText: 'MONTAR DEFESA NO JÚRI',
        btnClass: 'btn-cta-elite',
        icon: 'fas fa-gavel',
        msg: 'Dr. Lucas, tenho julgamento no Júri marcado. Preciso de defesa especializada urgente.'
      },
      {
        match: ['maria da penha', 'violencia domestica', 'medida protetiva', 'divorcio', 'falsa acusacao', 'boletim de ocorrencia'],
        title: 'ACUSAÇÃO FALSA DESTRÓI REPUTAÇÕES',
        desc:  'Medidas protetivas usadas como instrumento de coação no divórcio são ilegais. Dr. Lucas Semim monta a blindagem e processa quem acusou falsamente.',
        btnText: 'FALAR EM SIGILO AGORA',
        btnClass: 'btn-cta-elite',
        icon: 'fas fa-user-shield',
        msg: 'Dr. Lucas, preciso de orientação sigilosa sobre Medida Protetiva / Falsa Acusação.'
      },
      {
        match: ['crime informatico', 'fraude digital', 'estelionato', 'pix', 'hacker', 'invasao', '12737', 'marco civil', 'celular roubado', 'conta laranja'],
        title: 'INVESTIGADO POR CRIME DIGITAL?',
        desc:  'Provas digitais obtidas sem ordem judicial são ilícitas. Dr. Lucas Semim verifica a legalidade da prova e impugna inquéritos baseados em vigilância ilegal.',
        btnText: 'VERIFICAR AS PROVAS',
        btnClass: 'btn-cta-elite',
        icon: 'fas fa-laptop',
        msg: 'Dr. Lucas, estou sendo investigado por crime digital. Preciso verificar se as provas foram obtidas legalmente.'
      },
      {
        match: ['lavagem', 'dinheiro', 'criptoativos', 'bitcoin', 'ocultacao', 'dissimulacao', '9613'],
        title: 'ACUSADO DE LAVAGEM DE DINHEIRO?',
        desc:  'A prova em lavagem de dinheiro é complexa — rastreamento de cripto, quebra de sigilo bancário e fiscal. Dr. Lucas Semim audita cada camada da denúncia.',
        btnText: 'AUDITORIA CRIMINAL',
        btnClass: 'btn-cta-elite',
        icon: 'fas fa-coins',
        msg: 'Dr. Lucas, preciso de orientação jurídica sobre investigação de lavagem de dinheiro / criptoativos.'
      },
      {
        match: ['progressao de regime', 'semiaberto', 'aberto', 'detracao', 'remicao', 'atestado', 'bom comportamento'],
        title: 'FAMILIAR TEM DIREITO À PROGRESSÃO?',
        desc:  'Muitos detentos ficam mais tempo presos do que deveriam por falta de petição. Dr. Lucas Semim calcula a progressão e a detração e peticiona imediatamente.',
        btnText: 'CALCULAR PROGRESSÃO',
        btnClass: 'btn-cta-elite',
        icon: 'fas fa-hourglass-half',
        msg: 'Dr. Lucas, meu familiar pode ter direito à progressão de regime. Como posso verificar?'
      },
      {
        match: ['nulidade', 'cerceamento de defesa', 'contraditorio', 'ampla defesa', 'processo penal', 'recurso criminal'],
        title: 'SEU PROCESSO TEM NULIDADES?',
        desc:  'Vícios processuais podem anular condenações. Dr. Lucas Semim rastreia nulidades absolutas e relativas para construir a estratégia de recurso no TJMG e STJ.',
        btnText: 'ANALISAR MEU PROCESSO',
        btnClass: 'btn-cta-elite',
        icon: 'fas fa-magnifying-glass',
        msg: 'Dr. Lucas, quero que analise o meu processo criminal em busca de nulidades para recurso.'
      },
      /* ── NOVOS (Search Console 2026) ──────────────────────── */
      {
        // 8.8k impressões — porte de faca/canivete
        match: ['faca', 'canivete', 'arma branca', 'porte de faca', 'faca no carro'],
        title: 'PORTE DE FACA É CRIME?',
        desc:  'O STJ diferencia ferramenta de arma branca. Contexto e intenção de uso são determinantes. Se foi autuado, a abordagem pode ser ilegal. Dr. Lucas Semim analisa.',
        btnText: 'ANALISAR A AUTUAÇÃO',
        btnClass: 'btn-cta-elite',
        icon: 'fas fa-exclamation-triangle',
        msg: 'Dr. Lucas, fui abordado com uma faca/canivete. Quero saber se a conduta é crime ou fato atípico.'
      },
      {
        // Search Console: "fato atípico" 5.1k impressões
        match: ['fato atipico', 'atipico', 'nao e crime', 'conduta atipica', 'trancamento de inquerito'],
        title: 'SUA CONDUTA É REALMENTE UM CRIME?',
        desc:  'Se a conduta não se enquadra em nenhum tipo penal, o juiz deve absolver ou o advogado pode pedir trancamento do inquérito via HC por falta de justa causa.',
        btnText: 'VERIFICAR SE É CRIME',
        btnClass: 'btn-cta-elite',
        icon: 'fas fa-scale-balanced',
        msg: 'Dr. Lucas, me disseram que o que eu fiz pode ser fato atípico. Quero que analise se é realmente crime.'
      },
      {
        // Search Console: "calculadora prescrição" 5.1k impressões
        match: ['prescricao', 'calcular prescricao', 'prazo prescricional', 'prescreveu', 'extincao de punibilidade'],
        title: 'SEU PROCESSO JÁ PRESCREVEU?',
        desc:  'A prescrição extingue a punibilidade e encerra o processo. Dr. Lucas Semim calcula se o crime prescreveu com base no STJ e nos marcos interruptivos.',
        btnText: 'CALCULAR PRESCRIÇÃO (GRÁTIS)',
        btnClass: 'btn-cta-elite',
        icon: 'fas fa-calculator',
        msg: 'Dr. Lucas, quero calcular se o processo do meu familiar já prescreveu. Como faço?'
      },
      /* ── CIDADES ──────────────────────────────────────────── */
      {
        match: ['sabara', 'contagem', 'betim', 'neves', 'ibirite', 'barreiro', 'esmeraldas', 'caete', 'santa luzia', 'vespasiano', 'grande bh'],
        title: 'ADVOGADO CRIMINAL PERTO DE VOCÊ',
        desc:  'Dr. Lucas Semim atende em Sabará, BH e toda a Grande BH com plantão 24h. Se alguém foi preso na sua cidade, acione agora.',
        btnText: 'FALAR COM ADVOGADO',
        btnClass: 'btn-cta-elite',
        icon: 'fas fa-map-pin',
        msg: 'Dr. Lucas, preciso de um advogado criminalista próximo à minha região. Pode me atender?'
      }
    ],

    default: {
      title: 'PRECISA DE DEFESA ESTRATÉGICA?',
      desc:  'Fale diretamente com Dr. Lucas Semim para uma análise preliminar do seu caso. Plantão 24h — atendimento em Sabará, BH e Grande BH.',
      btnText: 'FALAR COM O ADVOGADO',
      btnClass: 'btn-cta-elite',
      icon: 'fab fa-whatsapp',
      msg: 'Dr. Lucas, estava no site e gostaria de uma consultoria sobre defesa criminal.'
    }
  },

  state: {
    match:         null,
    // BUGFIX 5: antes era um único elemento (`container`). Uma página pode
    // ter vários .cta-internal (ou nenhum, e nesse caso um é auto-inserido).
    containers:    [],
    reducedMotion: false
  },

  /* ── INICIALIZAÇÃO ─────────────────────────────────────────── */

  init() {
    try {
      this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // BUGFIX 5: querySelectorAll (não querySelector) — preenche TODOS os
      // containers .cta-internal da página, não só o primeiro.
      let containers = [...document.querySelectorAll(this.config.containerSelector)];

      // MELHORIA: se a página não tem NENHUM .cta-internal manual (era o
      // caso de 100% das páginas do site até aqui), tenta criar e inserir
      // um automaticamente em um ponto seguro do conteúdo principal.
      if (containers.length === 0) {
        const autoContainer = this.autoInsertContainer();
        if (autoContainer) containers = [autoContainer];
      }

      this.state.containers = containers;
      if (containers.length === 0) return; // nada para preencher e nenhum lugar seguro para criar

      const ctx  = this.buildPageContext();
      const best = this.findBestMatch(ctx);
      this.state.match = best;

      this.injectStyles();

      // Um banner por container — cada um precisa ser um nó de DOM próprio
      // (não dá para reaproveitar o mesmo elemento em vários lugares).
      containers.forEach(container => {
        const banner = this.buildBanner(best);
        container.appendChild(banner);
        this.initReveal(banner);
      });

      this.log(`[SmartCta V5] Match: "${best.title}" | Contexto: "${ctx.slice(0, 80)}..." | Banners inseridos: ${containers.length}`);
    } catch (err) {
      this.log(`[SmartCta V5] Erro: ${err.message}`);
    }
  },

  log(msg) {
    if (this.config.isDebug) console.log(msg);
  },

  /* ── FALLBACK: AUTO-INSERÇÃO DE CONTAINER ──────────────────────
     Quando a página não tem nenhum .cta-internal marcado manualmente no
     HTML, criamos um container e o inserimos em um ponto sensato dentro
     do conteúdo principal, seguindo esta ordem de prioridade:

       1) Logo após o BLOCO que contém o 2º <h2> encontrado — ponto natural
          de pausa no meio do conteúdo. Importante: nunca inserimos ENTRE um
          heading e o conteúdo que pertence a ele (isso quebraria pares
          título+parágrafo/lista dentro do mesmo wrapper flex/grid, comum
          nas páginas de cidade do site). Por isso subimos até o elemento
          que é filho direto da "raiz de conteúdo" (article/main/etc.):
            - se esse filho direto for uma <section>/<div> que já engloba o
              h2 E o conteúdo dele juntos, inserimos depois desse bloco
              inteiro;
            - se o h2 for "solto" (ele mesmo é o filho direto, sem wrapper
              próprio — caso visto nas páginas de /o-que-fazer-agora/, onde
              um <h2> antecede diretamente uma <div> de conteúdo), inserimos
              depois do irmão seguinte (o conteúdo daquele título), não
              entre os dois.
       2) Se a página tiver menos de 2 H2s, insere depois do bloco que
          contém o 1º <p> com mais de 200 caracteres de texto.
       3) Se nada disso existir (ex.: homepage, landing page pura de ads
          sem estrutura de artigo), NÃO insere nada — não forçamos o CTA
          onde não há um lugar natural para ele.

     Heurística validada lendo a estrutura real de duas páginas do site:
       - o-que-fazer-agora/acabei-de-ser-preso-em-flagrante.html: <main
         class="container-urgency"> com vários <h2> soltos direto como
         filhos de <main> (ex.: "5 PASSOS FUNDAMENTAIS..." seguido por
         <div class="checklist-urgency">) e outros dentro de
         <div class="content-body">.
       - advogado-criminalista/sabara.html: <main> com o conteúdo todo
         organizado em <section> cheias (hero, timeline, bairros, perfil,
         FAQ etc.), cada uma com seu próprio h2 interno.
     As duas estruturas são bem diferentes uma da outra (heading solto vs.
     heading dentro de section coesa) — por isso a lógica de "subir até o
     filho direto da raiz" acima, em vez de simplesmente inserir logo após
     o próprio <h2>, que quebraria o segundo caso.
  */
  autoInsertContainer() {
    try {
      const root = document.querySelector(this.config.mainContentSelector);
      if (!root) return null;

      const container = document.createElement('div');
      container.className = 'cta-internal';
      container.setAttribute('data-smart-cta-auto', 'true');

      // Sobe a árvore a partir de `el` até achar o filho direto de `root`
      // que contém `el` (ou o próprio `el`, se já for filho direto).
      const topLevelBlockOf = (el) => {
        let node = el;
        while (node.parentNode && node.parentNode !== root) node = node.parentNode;
        return node;
      };

      // Tentativa 1: depois do bloco do 2º <h2>
      const h2s = root.querySelectorAll('h2');
      if (h2s.length >= 2) {
        const target = topLevelBlockOf(h2s[1]);
        // Heading "solto" (é ele mesmo o filho direto de root): o conteúdo
        // dele é o irmão seguinte — inserimos depois DELE, não entre os dois.
        const after = (target === h2s[1] && target.nextElementSibling)
          ? target.nextElementSibling
          : target;
        after.insertAdjacentElement('afterend', container);
        return container;
      }

      // Tentativa 2: depois do bloco do 1º parágrafo "substancial" (> 200 chars)
      const paragraphs = root.querySelectorAll('p');
      for (const p of paragraphs) {
        if ((p.textContent || '').trim().length > 200) {
          const target = topLevelBlockOf(p);
          target.insertAdjacentElement('afterend', container);
          return container;
        }
      }

      // Nenhum ponto de inserção seguro — não força o CTA nesta página.
      return null;
    } catch {
      return null;
    }
  },

  /* ── CONTEXTO DA PÁGINA ────────────────────────────────────── */

  buildPageContext() {
    try {
      const path  = window.location.pathname;
      const title = document.title || '';
      const kw    = document.querySelector('meta[name="keywords"]')?.content   || '';
      const desc  = document.querySelector('meta[name="description"]')?.content || '';
      const h1    = document.querySelector('h1')?.textContent || '';
      const h2Selector = this.config.mainContentSelector
        .split(',')
        .map(s => `${s.trim()} h2`)
        .join(', ');
      const h2s   = [...document.querySelectorAll(h2Selector)]
        .slice(0, 4).map(h => h.textContent).join(' ');

      return [path, title, kw, desc, h1, h2s]
        .join(' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // remove acentos
    } catch {
      return (document.title || '').toLowerCase();
    }
  },

  /* ── SCORE-BASED MATCHING ──────────────────────────────────── */

  scoreMatch(item, ctx) {
    if (item === this.config.default) return -1;
    return item.match.reduce((score, kw) => {
      const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (!ctx.includes(kwNorm)) return score;
      // Peso extra para keywords que aparecem na URL (mais específico)
      const urlBonus = window.location.pathname.includes(kwNorm) ? 3 : 0;
      return score + Math.max(1, Math.floor(kwNorm.length / 4)) + urlBonus;
    }, 0);
  },

  findBestMatch(ctx) {
    let best      = null;
    let bestScore = 0;

    for (const item of this.config.db) {
      const score = this.scoreMatch(item, ctx);
      if (score > bestScore) { best = item; bestScore = score; }
    }

    return best || this.config.default;
  },

  /* ── CSS ───────────────────────────────────────────────────── */

  injectStyles() {
    if (document.getElementById(this.config.styleId)) return;
    const style = document.createElement('style');
    style.id = this.config.styleId;
    style.textContent = `
      /* === SmartCta V5 === */

      /* BUGFIX 3: transition na classe base (não na .cta-visible) */
      .smart-cta-elite {
        background: linear-gradient(135deg, #111112 0%, #050505 100%);
        border: 1px solid rgba(212,175,55,0.2);
        border-left: 5px solid #d4af37;
        border-radius: 8px;
        padding: 35px 30px; margin: 40px 0;
        display: flex; align-items: center;
        justify-content: space-between; gap: 30px;
        box-shadow: 0 15px 35px rgba(0,0,0,0.6);
        position: relative; overflow: hidden;
        /* Transição na base — funciona corretamente na entrada */
        transition: opacity 0.5s ease, transform 0.4s ease,
                    border-color 0.35s ease, box-shadow 0.35s ease;
      }
      .smart-cta-elite::after {
        content: ''; position: absolute; top: -50%; right: -10%;
        width: 150px; height: 200px;
        background: radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%);
        transform: rotate(45deg); pointer-events: none;
      }
      .smart-cta-elite:hover {
        border-color: rgba(212,175,55,0.5);
        box-shadow: 0 15px 40px rgba(212,175,55,0.15);
        transform: translateY(-2px);
      }
      @media (prefers-reduced-motion: reduce) {
        .smart-cta-elite { transition: none; }
        .smart-cta-elite:hover { transform: none; }
      }

      /* Estados de visibilidade */
      .smart-cta-elite.cta-hidden  { opacity: 0; transform: translateY(14px); }
      .smart-cta-elite.cta-visible { opacity: 1; transform: translateY(0); }
      @media (prefers-reduced-motion: reduce) {
        .smart-cta-elite.cta-hidden { opacity: 1; transform: none; }
      }

      /* Badge de urgência — para CTAs críticos */
      .cta-urgency-badge {
        position: absolute; top: -1px; left: 20px;
        background: #8b0000; color: #fff;
        font-family: 'Lato', sans-serif; font-size: 0.65rem; font-weight: 700;
        letter-spacing: 1px; text-transform: uppercase;
        padding: 3px 10px; border-radius: 0 0 4px 4px;
        display: flex; align-items: center; gap: 5px;
      }
      .cta-urgency-dot {
        width: 6px; height: 6px; background: #ff6060;
        border-radius: 50%; flex-shrink: 0;
        animation: ctaDotPulse 1.2s ease-in-out infinite;
      }
      @keyframes ctaDotPulse {
        0%,100% { opacity: 1; } 50% { opacity: 0.4; }
      }
      @media (prefers-reduced-motion: reduce) { .cta-urgency-dot { animation: none; } }

      /* Conteúdo */
      .cta-content-elite { flex: 1; }

      /* BUGFIX 4: p (não h4) — não quebra hierarquia de headings */
      .cta-title-elite {
        font-family: 'Teko', sans-serif; color: #fff;
        font-size: 2.2rem; line-height: 1.1;
        margin: 0 0 8px; letter-spacing: 1px;
        /* Evitar confusão com headings semânticos */
        display: block;
      }
      .cta-desc-elite {
        font-family: 'Lato', sans-serif; color: #aaa;
        font-size: 1.05rem; margin: 0; line-height: 1.55;
      }

      /* Botões */
      .btn-cta-elite {
        background: linear-gradient(45deg, #b8860b, #d4af37); color: #000;
        font-family: 'Teko', sans-serif; font-size: 1.4rem;
        letter-spacing: 1px; font-weight: 600;
        padding: 12px 30px; border-radius: 4px; text-decoration: none;
        display: inline-flex; align-items: center; gap: 10px;
        box-shadow: 0 5px 15px rgba(212,175,55,0.3);
        transition: background 0.25s, box-shadow 0.25s, transform 0.2s;
        white-space: nowrap; flex-shrink: 0;
      }
      .btn-cta-elite:hover {
        background: #fff; color: #000;
        box-shadow: 0 8px 20px rgba(255,255,255,0.2);
        transform: translateY(-1px);
      }
      .btn-cta-elite:focus-visible { outline: 2px solid #d4af37; outline-offset: 3px; }
      @media (prefers-reduced-motion: reduce) { .btn-cta-elite { transition: none; } }

      .btn-cta-red {
        background: linear-gradient(180deg, #8b0000 0%, #5c0000 100%);
        color: #fff; border: 1px solid rgba(255,77,77,0.5);
        box-shadow: 0 5px 15px rgba(255,77,77,0.3);
      }
      .btn-cta-red:hover {
        background: #a31a1a; color: #fff;
        box-shadow: 0 8px 20px rgba(255,77,77,0.5);
      }

      /* Mobile */
      @media (max-width: 768px) {
        .smart-cta-elite {
          flex-direction: column; text-align: center;
          padding: 30px 20px 25px; gap: 20px;
          border-left: 1px solid rgba(212,175,55,0.2);
          border-top: 4px solid #d4af37;
        }
        .cta-title-elite { font-size: 1.8rem; }
        .btn-cta-elite   { width: 100%; justify-content: center; }
        .cta-urgency-badge { left: 50%; transform: translateX(-50%); }
      }
    `;
    document.head.appendChild(style);
  },

  /* ── BUILD DO BANNER ────────────────────────────────────────── */

  buildBanner(cta) {
    const url = this.buildWhatsAppUrl(cta);
    const hora = new Date().getHours();
    const isNight = hora >= 20 || hora < 7;

    const box = document.createElement('div');
    box.className = 'smart-cta-elite cta-hidden';
    box.setAttribute('role', 'complementary');
    box.setAttribute('aria-label', 'Chamada para ação — atendimento jurídico');
    box.setAttribute('data-cta-context', cta.title.slice(0, 40));

    // MELHORIA: badge de urgência para CTAs críticos OU madrugada
    if (cta.urgente || isNight) {
      const badge = document.createElement('div');
      badge.className = 'cta-urgency-badge';
      badge.setAttribute('aria-label', 'Urgente');

      const dot = document.createElement('span');
      dot.className = 'cta-urgency-dot';
      dot.setAttribute('aria-hidden', 'true');

      const label = document.createElement('span');
      label.textContent = isNight && !cta.urgente
        ? '⚡ PLANTÃO ATIVO AGORA'
        : '🔴 URGENTE';

      badge.appendChild(dot);
      badge.appendChild(label);
      box.appendChild(badge);
    }

    const content = document.createElement('div');
    content.className = 'cta-content-elite';

    // BUGFIX 4: <p> com className (não h4 — preserva hierarquia semântica)
    const title = document.createElement('p');
    title.className = 'cta-title-elite';
    title.textContent = cta.title;

    const desc = document.createElement('p');
    desc.className = 'cta-desc-elite';
    desc.textContent = cta.desc;

    content.appendChild(title);
    content.appendChild(desc);

    const btn = this.buildBtn(cta, url);

    box.appendChild(content);
    box.appendChild(btn);

    return box;
  },

  buildBtn(cta, url) {
    const a = document.createElement('a');
    a.href   = url;
    a.target = '_blank';
    a.rel    = 'noopener noreferrer';
    a.className = `btn-cta-elite ${cta.btnClass}`;
    a.setAttribute('aria-label', `${cta.btnText} — WhatsApp Dr. Lucas Semim`);

    const icon = document.createElement('i');
    icon.className = cta.icon;
    icon.setAttribute('aria-hidden', 'true');

    a.appendChild(icon);
    a.appendChild(document.createTextNode(` ${cta.btnText}`));

    a.addEventListener('click', () => {
      this.trackEvent('smart_cta_click', cta.title);
    });

    return a;
  },

  buildWhatsAppUrl(cta) {
    const campanha = new URLSearchParams(window.location.search).get('utm_campaign');
    const msg      = campanha ? `${cta.msg}\n\n_(Origem: ${campanha})_` : cta.msg;
    return `${this.config.waBase}${this.config.whatsapp}?text=${encodeURIComponent(msg)}`;
  },

  /* ── REVEAL COM INTERSECTION OBSERVER ─────────────────────── */

  initReveal(bannerEl) {
    if (this.state.reducedMotion) {
      bannerEl.classList.replace('cta-hidden', 'cta-visible');
      return;
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.replace('cta-hidden', 'cta-visible');
        obs.unobserve(entry.target);
        this.trackEvent('smart_cta_shown', this.state.match?.title || 'default');
      });
    }, { threshold: 0.12 });

    obs.observe(bannerEl);
  },

  /* ── GA4 (BUGFIX 1: window.gtag) ───────────────────────────── */

  trackEvent(action, label) {
    try {
      // BUGFIX 1: window.gtag (não gtag solto)
      if (typeof window.gtag !== 'function') return;
      window.gtag('event', action, {
        event_category: 'Smart_CTA_V4',
        event_label:    label.slice(0, 100),
        cta_title:      this.state.match?.title || 'default',
        cta_urgente:    !!(this.state.match?.urgente),
        pagina_origem:  window.location.pathname,
        campanha:       new URLSearchParams(window.location.search).get('utm_campaign') || 'organico'
      });
    } catch { }
  }
};

document.addEventListener('DOMContentLoaded', () => window.SmartCta.init());
