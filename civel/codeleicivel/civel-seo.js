/* ================================================================
   ARQUIVO : codeleicivel/civel-seo.js
   VERSÃO  : 3.0 — LIVE SEO ENGINE
   FUNÇÃO  : Otimização SEO técnica avançada — Schema dinâmico por
             página, FAQPage Rich Snippets, Breadcrumb, GEO/AI,
             Core Web Vitals, CTR boost, canonical enforcement
   SITE    : https://civel.lucassemim.adv.br/
   AUTOR   : Semim & Associados (refatorado por Método Live)
   REGRAS  : Sem inline events · Sem var global · IIFE seguro
================================================================ */
 
(function () {
  'use strict';
 
  /* ──────────────────────────────────────────────────────────────
     1.  CONFIGURAÇÃO CENTRAL — edite apenas aqui
  ────────────────────────────────────────────────────────────── */
  var CFG = {
    base      : 'https://civel.lucassemim.adv.br',
    tel       : '+5531989420094',
    telDisplay: '(31) 98942-0094',
    oab       : 'OAB/MG 222.539',
    advogado  : 'Lucas Renan Semim',
    escritorio: 'Semim & Associados — Advocacia Cível',
    logo      : 'https://lucassemim.adv.br/Favicon-lucassemim.png',   /* ✅ favicon real — bug corrigido */
    // CORRIGIDO 11/09/2026: banner-civel-1.png NUNCA existiu em /img — a imagem
    // de compartilhamento (og:image / JSON-LD / preload) estava 404 em TODAS as
    // páginas do site. Trocado por uma foto real do Dr. Lucas como tapa-buraco
    // ate existir uma imagem de banner (1200x630) dedicada.
    banner    : 'https://civel.lucassemim.adv.br/img/lucasrenansemimeadvogado.jpeg',
    lat       : -19.8971635,
    lng       : -43.8889522,
    endereco  : {
      streetAddress   : 'Rua Coronel Abílio Pereira, 337',            /* ✅ endereço real corrigido */
      addressLocality : 'Belo Horizonte',
      addressRegion   : 'MG',
      postalCode      : '31050-120',
      addressCountry  : 'BR'
    },
    redes: [
      'https://www.instagram.com/lucasrenansemim/',
      'https://www.linkedin.com/in/lucas-renan-a2a52910b/'
    ],
    horario: {
      '@type'     : 'OpeningHoursSpecification',
      dayOfWeek   : ['Monday','Tuesday','Wednesday','Thursday','Friday'],
      opens       : '09:00',
      closes      : '18:00'
    }
  };
 
  /* ──────────────────────────────────────────────────────────────
     2.  MAPA DE PÁGINAS — título · description · Schema · FAQ
         Chave = pathname exato da página
  ────────────────────────────────────────────────────────────── */
  var PAGES = {
 
    '/': {
      title : 'Advogado Indenização em Belo Horizonte | Lucas Semim — Dano Moral, Acidente e Seguro',
      desc  : 'Sofreu acidente de trânsito, morte de familiar, apólice negada ou dano moral em BH? Dr. Lucas Semim (OAB/MG 222.539) recupera sua indenização. Análise gratuita.',
      bc    : [{ name:'Início', url:'/' }],
      services: [
        'Indenização por Dano Moral','Acidente de Trânsito','Indenização por Morte',
        'Apólice de Seguro Negada','Erro Médico','Plano de Saúde Recusado',
        'Responsabilidade Civil','Execução de Títulos','Blindagem Patrimonial'
      ],
      faq: [
        { q:'Quanto tempo tenho para ação por acidente de trânsito?',
          a:'O prazo prescricional é de 3 anos, contados da data do acidente (art. 206, §3º, V, CC). Não perca tempo — consulte o Dr. Lucas Semim gratuitamente.' },
        { q:'Plano de saúde negou procedimento urgente. Tenho direito à indenização?',
          a:'Sim. A negativa indevida gera dano moral in re ipsa e obrigação de custeio, conforme jurisprudência consolidada do STJ.' },
        { q:'A seguradora negou a apólice após morte de familiar. O que fazer?',
          a:'Conteste judicialmente. Além do capital segurado, os beneficiários têm direito a correção, juros e indenização por dano moral.' },
        { q:'Quanto vale uma ação de dano moral em Belo Horizonte?',
          a:'Contra bancos e planos: R$ 3.000 a R$ 15.000. Lesão grave ou morte: pode superar R$ 100.000. Análise individual gratuita.' },
        { q:'Preciso pagar honorários antes de ganhar?',
          a:'Na maioria dos casos trabalhamos com honorários de êxito — você só paga se ganhar.' }
      ]
    },
 
    '/blindagem-patrimonial.html': {
      title : 'Blindagem Patrimonial em BH | Lucas Semim — Holding Familiar e Proteção de Bens',
      desc  : 'Proteja seu patrimônio com holding familiar, planejamento sucessório e estratégias jurídicas em Belo Horizonte. Dr. Lucas Semim, OAB/MG 222.539. Consulta gratuita.',
      bc    : [{ name:'Início',url:'/' },{ name:'Blindagem Patrimonial',url:'/blindagem-patrimonial.html' }],
      services: ['Holding Familiar','Planejamento Sucessório','Proteção de Bens','Blindagem Patrimonial'],
      faq: [
        { q:'O que é blindagem patrimonial?',
          a:'É o conjunto de estratégias jurídicas — como holding familiar e planejamento sucessório — que protegem bens de credores, processos trabalhistas e partilha indevida.' },
        { q:'Holding familiar é legal no Brasil?',
          a:'Sim. A holding familiar é amplamente reconhecida pelo STJ e pela Receita Federal, sendo uma ferramenta legal de planejamento patrimonial e sucessório.' },
        { q:'Quanto custa criar uma holding familiar em Belo Horizonte?',
          a:'O custo varia conforme o volume patrimonial e a estrutura societária. Oferecemos análise gratuita para verificar a viabilidade no seu caso.' }
      ]
    },
 
    '/familia-sucessoes.html': {
      title : 'Advogado Família e Sucessões em BH | Inventário e Divórcio | Lucas Semim',
      desc  : 'Divórcio, inventário, alimentos, guarda e herança em Belo Horizonte. Dr. Lucas Semim (OAB/MG 222.539) resolve com agilidade e sigilo. Consulta gratuita.',
      bc    : [{ name:'Início',url:'/' },{ name:'Família e Sucessões',url:'/familia-sucessoes.html' }],
      services: ['Divórcio','Inventário','Pensão Alimentícia','Guarda de Filhos','Herança e Sucessão'],
      faq: [
        { q:'Qual o prazo para inventário após o falecimento?',
          a:'O inventário deve ser aberto em até 60 dias após o falecimento (art. 611, CPC). Atrasos geram multa sobre o ITCD.' },
        { q:'Posso fazer inventário extrajudicial em cartório?',
          a:'Sim, quando todos os herdeiros são maiores, capazes, concordam e não há testamento. É mais rápido e barato que o judicial.' }
      ]
    },
 
    '/execucao-cobranca.html': {
      title : 'Advogado Execução de Títulos em BH | Cobrança Judicial | Lucas Semim',
      desc  : 'Execução judicial de títulos extrajudiciais, cheques, contratos e dívidas em Belo Horizonte. Dr. Lucas Semim, OAB/MG 222.539. Análise gratuita do caso.',
      bc    : [{ name:'Início',url:'/' },{ name:'Execução e Cobrança',url:'/execucao-cobranca.html' }],
      services: ['Execução de Título Extrajudicial','Execução de Sentença','Cobrança Judicial','Penhora Online'],
      faq: [
        { q:'O que é execução de título extrajudicial?',
          a:'É o processo para cobrar judicialmente cheques, notas promissórias, contratos e outros títulos com valor legal, sem necessidade de ação de conhecimento prévia.' },
        { q:'Posso penhorar conta bancária do devedor?',
          a:'Sim. Via sistema SISBAJUD (antigo BacenJud) é possível penhorar contas correntes e aplicações do devedor de forma eletrônica e ágil.' }
      ]
    },
 
    '/acidentes-transito.html': {
      title : 'Advogado Acidente de Trânsito BH | Indenização Morte e Lesão | Lucas Semim',
      desc  : 'Acidente de trânsito, atropelamento ou morte em BH? Recupere indenização por danos morais, materiais e lucros cessantes. Dr. Lucas Semim, OAB/MG 222.539.',
      bc    : [{ name:'Início',url:'/' },{ name:'Acidente de Trânsito',url:'/acidentes-transito.html' }],
      services: ['Indenização Acidente de Trânsito','Indenização por Morte','Dano Moral','Lucros Cessantes'],
      faq: [
        { q:'Tenho direito à indenização mesmo sem culpa comprovada?',
          a:'Em casos de atropelamento o Código Civil presume responsabilidade objetiva do condutor. Mesmo sem sentença criminal, a indenização cível é possível.' },
        { q:'O DPVAT cobre todos os acidentes de trânsito?',
          a:'O DPVAT (hoje SPVAT) cobre morte e invalidez permanente em acidentes. Para danos morais e materiais amplos, a ação cível contra o responsável é necessária.' }
      ]
    },
 
    '/erro-medico.html': {
      title : 'Advogado Erro Médico em Belo Horizonte | Indenização | Lucas Semim',
      desc  : 'Erro médico, cirurgia mal-sucedida ou negligência médica em BH? Dr. Lucas Semim apura responsabilidade civil e conquista indenização. OAB/MG 222.539.',
      bc    : [{ name:'Início',url:'/' },{ name:'Erro Médico',url:'/erro-medico.html' }],
      services: ['Erro Médico','Negligência Médica','Responsabilidade Civil Médica','Indenização Cirurgia'],
      faq: [
        { q:'Como provar erro médico?',
          a:'Prontuários, laudos periciais, testemunhos e pareceres de outros especialistas são os principais meios de prova. O Dr. Lucas coordena toda a instrução probatória.' },
        { q:'Médico e hospital podem ser acionados juntos?',
          a:'Sim. O hospital responde objetivamente por danos causados por sua equipe (art. 14, CDC). O médico responde subjetivamente por culpa (imprudência, negligência, imperícia).' }
      ]
    },
 
    '/seguros-indenizacao.html': {
      title : 'Advogado Seguro Negado em BH | Apólice Recusada | Lucas Semim',
      desc  : 'Seguradora se recusou a pagar? Recupere seguro de vida, DPVAT, residencial ou empresarial negado em BH. Dr. Lucas Semim, OAB/MG 222.539.',
      bc    : [{ name:'Início',url:'/' },{ name:'Seguros e Indenização',url:'/seguros-indenizacao.html' }],
      services: ['Seguro de Vida Negado','DPVAT','Seguro Residencial','Seguro Empresarial','Apólice Recusada'],
      faq: [
        { q:'A seguradora pode negar o pagamento do seguro de vida?',
          a:'Apenas em casos expressamente previstos na apólice e com prova robusta. Negativas genéricas ou por suicídio após 2 anos de vigência são ilegais (STJ, Súmula 610).' }
      ]
    },
 
    '/bancario-juros.html': {
      title : 'Advogado Banco Cobrança Abusiva BH | Juros Ilegais | Lucas Semim',
      desc  : 'Banco cobrou juros abusivos, negativou indevidamente ou descontou benefício sem autorização? Dr. Lucas Semim recupera dano moral e valores. OAB/MG 222.539.',
      bc    : [{ name:'Início',url:'/' },{ name:'Bancário e Juros',url:'/bancario-juros.html' }],
      services: ['Revisão Contratual Bancária','Cobrança Abusiva','Negativação Indevida','Dano Moral Bancário'],
      faq: [
        { q:'Banco pode ser condenado por negativação indevida?',
          a:'Sim. A negativação indevida configura dano moral in re ipsa — o STJ dispensa prova do sofrimento. A indenização costuma ser entre R$ 3.000 e R$ 10.000.' }
      ]
    },
 
    '/contratos-negocios.html': {
      title : 'Advogado Contratos e Negócios em BH | Rescisão e Revisão | Lucas Semim',
      desc  : 'Rescisão de contrato, revisão de cláusulas abusivas, inadimplência e litígios empresariais em BH. Dr. Lucas Semim, OAB/MG 222.539.',
      bc    : [{ name:'Início',url:'/' },{ name:'Contratos e Negócios',url:'/contratos-negocios.html' }],
      services: ['Rescisão Contratual','Revisão de Contratos','Inadimplência','Litígio Empresarial'],
      faq: []
    },
 
    '/sabara-civel.html': {
      title : 'Advogado Cível em Sabará MG | Indenização e Contratos | Lucas Semim',
      desc  : 'Advogado cível em Sabará: indenização por acidente, dano moral, contratos e família. Dr. Lucas Semim (OAB/MG 222.539) atende presencialmente em Sabará e BH.',
      bc    : [{ name:'Início',url:'/' },{ name:'Advocacia Cível em Sabará',url:'/sabara-civel.html' }],
      services: ['Advogado Cível Sabará','Indenização Sabará','Dano Moral Sabará'],
      faq: []
    },
 
    '/belohorizonte-civel.html': {
      title : 'Advogado Cível em Belo Horizonte | Indenização e Dano Moral | Lucas Semim',
      desc  : 'Advogado cível em Belo Horizonte: indenização por acidente, dano moral, seguro negado e erro médico. Dr. Lucas Semim, OAB/MG 222.539. Análise gratuita.',
      bc    : [{ name:'Início',url:'/' },{ name:'Advocacia Cível em BH',url:'/belohorizonte-civel.html' }],
      services: ['Advogado Cível Belo Horizonte','Indenização BH','Dano Moral BH','Acidente de Trânsito BH'],
      faq: []
    },

    '/golpe-pix-civel.html': {
      title : 'Advogado Golpe do Pix em Sabará e BH | Recupere o Valor do Banco',
      desc  : 'Caiu no golpe do Pix? A TNU responsabiliza bancos que falham na segurança das transações. Dr. Lucas Semim (OAB/MG 222.539) atua em Sabará e BH. Análise gratuita.',
      bc    : [{ name:'Início',url:'/' },{ name:'Golpe do Pix',url:'/golpe-pix-civel.html' }],
      services: ['Recuperação de Golpe do Pix','Responsabilidade Civil Bancária','Ação contra Banco','Fraude Digital'],
      faq: [
        { q:'Fui vítima do golpe do Pix. O banco é sempre obrigado a devolver o dinheiro?',
          a:'Não automaticamente. O banco responde quando a fraude explora falha de segurança do próprio sistema bancário. Em novembro de 2025 a TNU firmou tese vinculante nesse sentido.' },
        { q:'Preciso ter feito Boletim de Ocorrência para entrar com a ação?',
          a:'Não é obrigatório, mas é fortemente recomendado como prova da fraude e da falha de segurança do banco.' }
      ]
    },

    '/rmc-consignado-civel.html': {
      title : 'Advogado Cartão RMC no INSS em Sabará e BH | Devolução em Dobro',
      desc  : 'Desconto de cartão RMC/RCC indevido no INSS de um idoso da família? A lei prevê devolução em dobro e dano moral. Dr. Lucas Semim (OAB/MG 222.539) atua em Sabará e BH.',
      bc    : [{ name:'Início',url:'/' },{ name:'Cartão RMC e Consignado do INSS',url:'/rmc-consignado-civel.html' }],
      services: ['Cancelamento de Cartão RMC','Cancelamento de RCC','Devolução em Dobro no INSS','Dano Moral contra Idoso'],
      faq: [
        { q:'O que é o cartão RMC e por que ele é perigoso para os idosos?',
          a:'É um cartão de crédito consignado descontado direto do benefício do INSS, muitas vezes vendido por telefone sem explicação clara, sem que o valor prometido chegue de forma proporcional ao desconto.' },
        { q:'A MP 1.355/2026 já resolve meu problema automaticamente?',
          a:'Não. Ela impede novas contratações de RMC/RCC no INSS, mas não cancela sozinha contratos e descontos já em curso — é preciso agir judicial ou administrativamente.' }
      ]
    },

    '/reajuste-plano-saude-civel.html': {
      title : 'Advogado Reajuste Abusivo de Plano de Saúde | Sabará e BH',
      desc  : 'Mensalidade do plano de saúde subiu acima do teto da ANS? Reajuste de plano coletivo pode ser revisado judicialmente. Dr. Lucas Semim (OAB/MG 222.539), Sabará e BH. Análise gratuita.',
      bc    : [{ name:'Início',url:'/' },{ name:'Reajuste Abusivo de Plano de Saúde',url:'/reajuste-plano-saude-civel.html' }],
      services: ['Revisão de Reajuste de Plano de Saúde','Ação contra Reajuste Abusivo','Revisão de Plano Coletivo','Direito do Consumidor em Saúde Suplementar'],
      faq: [
        { q:'Qual é o teto de reajuste dos planos de saúde individuais e familiares em 2026?',
          a:'A ANS fixou em 5,11% o índice máximo de reajuste para planos individuais e familiares em 2026. Reajuste acima desse teto pode ser revisado judicialmente, com devolução da diferença cobrada a mais.' },
        { q:'O teto de 5,11% da ANS vale também para plano coletivo (empresarial ou por adesão)?',
          a:'Não diretamente. Planos coletivos são reajustados por negociação com base na sinistralidade, sem teto fixo da ANS. Ainda assim, reajuste muito acima da média de mercado e sem justificativa técnica clara pode ser considerado abusivo e revisto judicialmente.' }
      ]
    },

    '/bets-civel.html': {
      title : 'Advogado Contra Casas de Apostas (Bets) em Sabará e BH | Lucas Semim',
      desc  : 'Saque bloqueado, conta zerada ou vício em apostas (bets)? A Justiça vem reconhecendo o dever de jogo responsável das plataformas. Dr. Lucas Semim (OAB/MG 222.539) atua em Sabará e BH. Análise gratuita.',
      bc    : [{ name:'Início',url:'/' },{ name:'Ações contra Casas de Apostas (Bets)',url:'/bets-civel.html' }],
      services: ['Ação contra Casa de Apostas (Bet)','Saque Bloqueado em Plataforma de Apostas','Restituição por Falha no Dever de Jogo Responsável','Restituição por Vício em Jogo (Ludopatia)'],
      faq: [
        { q:'Perdi dinheiro apostando em uma bet. Tenho direito a receber o valor de volta?',
          a:'Não automaticamente. Perder uma aposta feita de forma consciente, dentro das regras normais do jogo, não gera direito à devolução. O direito à restituição depende de uma falha identificável da plataforma, como bloqueio indevido de saque ou ausência de ferramentas de jogo responsável.' },
        { q:'Tenho vício em jogo (ludopatia). Isso me dá direito a recuperar valores perdidos?',
          a:'A ludopatia é reconhecida como transtorno pela OMS (CID-11). Quando há indícios do quadro e a plataforma não adotou medidas de proteção como autoexclusão, alguns tribunais vêm admitindo pedido de restituição, mediante análise individual das provas.' }
      ]
    },

    '/usucapiao-civel.html': {
      title : 'Advogado Usucapião em Sabará e BH | Regularize seu Imóvel',
      desc  : 'Mora ou possui um imóvel há anos sem escritura? Conheça as modalidades de usucapião e a via extrajudicial (em cartório). Dr. Lucas Semim (OAB/MG 222.539), Sabará e BH.',
      bc    : [{ name:'Início',url:'/' },{ name:'Usucapião',url:'/usucapiao-civel.html' }],
      services: ['Usucapião Extrajudicial','Usucapião Judicial','Usucapião Extraordinária','Usucapião Especial Urbana','Usucapião Familiar'],
      faq: [
        { q:'É verdade que hoje dá para fazer usucapião sem entrar na Justiça, direto no cartório?',
          a:'Sim. Desde o art. 1.071 do CPC/2015 e a regulamentação por provimento do CNJ, é possível pedir o reconhecimento da usucapião direto no Cartório de Registro de Imóveis, sem processo judicial, quando há documentação completa e concordância de todos os confrontantes.' },
        { q:'Quais são as modalidades de usucapião mais comuns?',
          a:'As mais comuns são a usucapião extraordinária, a usucapião especial urbana e a usucapião familiar (por abandono do lar), cada uma com requisitos próprios quanto a tempo de posse, tamanho do imóvel e finalidade de uso.' }
      ]
    },

    '/superendividamento-civel.html': {
      title : 'Advogado Superendividamento em Sabará e BH | Renegocie Dívidas | Lucas Semim',
      desc  : 'Não sabe mais o que fazer com tantas contas? A Lei do Superendividamento permite renegociar todas as dívidas de uma vez, com todos os credores. Dr. Lucas Semim (OAB/MG 222.539). Análise gratuita.',
      bc    : [{ name:'Início',url:'/' },{ name:'Superendividamento e Renegociação de Dívidas',url:'/superendividamento-civel.html' }],
      services: ['Ação de Repactuação de Dívidas','Superendividamento do Consumidor','Renegociação Judicial de Dívidas','Preservação do Mínimo Existencial'],
      faq: [
        { q:'Isso tem a ver com usucapião ou com recuperação judicial de empresa?',
          a:'Não. Usucapião é sobre propriedade de imóvel e recuperação judicial é para empresas. O superendividamento é um instrumento do CDC voltado à pessoa física que comprometeu parte relevante da renda com dívidas de consumo.' },
        { q:'Preciso estar negativado para pedir a renegociação das dívidas?',
          a:'Não é exigido estar negativado. O que importa é a dívida comprometer parcela relevante da renda a ponto de colocar em risco o mínimo existencial da família.' }
      ]
    }
 
  };
 
  /* ──────────────────────────────────────────────────────────────
     3.  UTILITÁRIOS
  ────────────────────────────────────────────────────────────── */
  function injetarLD(obj) {
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.text = JSON.stringify(obj);
    document.head.appendChild(s);
  }
 
  function metaSet(name, content, isProp) {
    if (!content) return;
    var sel  = isProp ? 'meta[property="' + name + '"]' : 'meta[name="' + name + '"]';
    var meta = document.querySelector(sel);
    if (!meta) {
      meta = document.createElement('meta');
      if (isProp) meta.setAttribute('property', name);
      else        meta.setAttribute('name', name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }
 
  function linkSet(rel, href) {
    var el = document.querySelector('link[rel="' + rel + '"]');
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  }
 
  function getPage() {
    var path = window.location.pathname.replace(/\/+$/, '') || '/';
    /* normaliza: /index.html → / */
    if (path === '/index.html') path = '/';
    /* Fix 03/10/2026: página fora do PAGES{} (guias, banco-master, central...) não herda mais
       título/descrição/canonical da home; mantém o <head> estático da própria página. */
    return PAGES[path] || null;
  }
 
  function fullUrl(path) {
    return CFG.base + (path === '/' ? '/' : path);
  }
 
  /* ──────────────────────────────────────────────────────────────
     4.  ENGINE A — META TAGS + TÍTULO (CTR Boost)
         Corrige title e description dinamicamente por página.
         Impacto direto no CTR do Search Console.
  ────────────────────────────────────────────────────────────── */
  function engineMeta(pg) {
    var pageUrl = fullUrl(window.location.pathname.replace(/\/+$/, '') || '/');
 
    /* Título: máximo 60 chars para não truncar no SERP */
    /* Fix 10/09/2026: título estático já contém "Lucas Semim" na maioria das páginas,
       então a checagem antiga nunca deixava o título otimizado do PAGES{} entrar. */
    if (pg.title) {
      document.title = pg.title;
    }
 
    /* Description: 150–160 chars — espaço premium de CTR */
    metaSet('description', pg.desc);
 
    /* Canonical — corrige o sinal de URL para o Googlebot */
    linkSet('canonical', pageUrl + (pageUrl.endsWith('/') ? '' : ''));
 
    /* Open Graph */
    metaSet('og:title',       pg.title,     true);
    metaSet('og:description', pg.desc,      true);
    metaSet('og:url',         pageUrl,      true);
    metaSet('og:image',       CFG.banner,   true);
    metaSet('og:type',        'website',    true);
    metaSet('og:locale',      'pt_BR',      true);
 
    /* Twitter */
    metaSet('twitter:card',        'summary_large_image');
    metaSet('twitter:title',       pg.title);
    metaSet('twitter:description', pg.desc);
 
    /* Geo tags — sinal local para buscas "perto de mim" */
    metaSet('geo.region',   'BR-MG');
    metaSet('geo.placename','Belo Horizonte');
    metaSet('geo.position', CFG.lat + ';' + CFG.lng);
    metaSet('ICBM',         CFG.lat + ', ' + CFG.lng);
 
    /* Robots e segurança */
    metaSet('robots',   'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    metaSet('referrer', 'no-referrer-when-downgrade');
 
    console.log('[CivelSEO] Metas ✅ | Title: ' + document.title.length + ' chars');
  }
 
  /* ──────────────────────────────────────────────────────────────
     5.  ENGINE B — SCHEMA LEGAL SERVICE (por página)
         Rich result base para o Google Knowledge Panel
  ────────────────────────────────────────────────────────────── */
  function engineSchemaBase(pg) {
    var pageUrl = fullUrl(window.location.pathname.replace(/\/+$/, '') || '/');
 
    injetarLD({
      '@context'  : 'https://schema.org',
      '@type'     : 'LegalService',
      'name'      : CFG.escritorio,
      'image'     : CFG.banner,
      '@id'       : pageUrl,
      'url'       : pageUrl,
      'telephone' : CFG.tel,
      'priceRange': '$$$',
      'logo'      : {
        '@type': 'ImageObject',
        'url'  : CFG.logo,
        'width': 512, 'height': 512                /* publisher.logo corrigido */
      },
      'address'     : { '@type': 'PostalAddress', ...CFG.endereco },
      'geo'         : { '@type': 'GeoCoordinates', 'latitude': CFG.lat, 'longitude': CFG.lng },
      'areaServed'  : [
        { '@type': 'City', 'name': 'Belo Horizonte' },
        { '@type': 'City', 'name': 'Sabará' },
        { '@type': 'City', 'name': 'Contagem' },
        { '@type': 'City', 'name': 'Nova Lima' },
        { '@type': 'City', 'name': 'Betim' }
      ],
      'openingHoursSpecification': CFG.horario,
      'sameAs'      : CFG.redes,
      'founder'     : {
        '@type'  : 'Person',
        'name'   : CFG.advogado,
        'jobTitle': 'Advogado Criminalista e Cível',
        'hasCredential': CFG.oab,
        'sameAs' : CFG.redes,
        'knowsAbout': pg.services || []
      },
      'serviceType' : pg.services || [],
      'description' : pg.desc
    });
 
    console.log('[CivelSEO] LegalService Schema ✅');
  }
 
  /* ──────────────────────────────────────────────────────────────
     6.  ENGINE C — FAQPAGE SCHEMA (Rich Snippets de FAQ)
         Impacto direto: ocupa mais espaço no SERP → sobe CTR
         250 impressões com 6 cliques = FAQ vai empurrar cliques
  ────────────────────────────────────────────────────────────── */
  function engineFAQ(pg) {
    if (!pg.faq || pg.faq.length === 0) return;
 
    injetarLD({
      '@context'   : 'https://schema.org',
      '@type'      : 'FAQPage',
      'mainEntity' : pg.faq.map(function (item) {
        return {
          '@type'         : 'Question',
          'name'          : item.q,
          'acceptedAnswer': { '@type': 'Answer', 'text': item.a }
        };
      })
    });
 
    console.log('[CivelSEO] FAQPage Schema ✅ — ' + pg.faq.length + ' perguntas indexáveis');
  }
 
  /* ──────────────────────────────────────────────────────────────
     7.  ENGINE D — BREADCRUMBLIST (navegação no SERP)
         Mostra o caminho no resultado: Site › Serviço › Página
         → resultado visual maior → mais cliques
  ────────────────────────────────────────────────────────────── */
  function engineBreadcrumb(pg) {
    if (!pg.bc || pg.bc.length === 0) return;
 
    injetarLD({
      '@context'        : 'https://schema.org',
      '@type'           : 'BreadcrumbList',
      'itemListElement' : pg.bc.map(function (item, i) {
        return {
          '@type'   : 'ListItem',
          'position': i + 1,
          'name'    : item.name,
          'item'    : fullUrl(item.url)
        };
      })
    });
 
    console.log('[CivelSEO] BreadcrumbList ✅');
  }
 
  /* ──────────────────────────────────────────────────────────────
     8.  ENGINE E — GEO / AI OPTIMIZATION
         Sinais para crawlers de IA (ChatGPT, Gemini, Perplexity)
         e para buscas por voz (SpeakableSpecification)
  ────────────────────────────────────────────────────────────── */
  function engineGeoAI(pg) {
 
    /* SpeakableSpecification — respostas de voz no Google Assistant */
    injetarLD({
      '@context': 'https://schema.org',
      '@type'   : 'WebPage',
      'url'     : fullUrl(window.location.pathname.replace(/\/+$/, '') || '/'),
      'name'    : pg.title,
      'description': pg.desc,
      'inLanguage' : 'pt-BR',
      'speakable'  : {
        '@type'      : 'SpeakableSpecification',
        'cssSelector': ['.hero__title', '.hero__sub', '.sec-titulo', 'h1', 'h2']
      },
      'about': {
        '@type' : 'LegalService',
        'name'  : CFG.escritorio,
        'areaServed': 'Belo Horizonte, Minas Gerais, Brasil'
      }
    });
 
    /* Attorney Schema — sinal de autoridade para E-E-A-T */
    injetarLD({
      '@context'    : 'https://schema.org',
      '@type'       : 'Attorney',
      'name'        : CFG.advogado,
      'hasCredential': CFG.oab,
      'memberOf'    : { '@type': 'BarAssociation', 'name': 'OAB — Seção Minas Gerais' },
      'areaServed'  : 'Belo Horizonte e Grande BH',
      'knowsAbout'  : pg.services || [],
      'url'         : fullUrl('/'),
      'telephone'   : CFG.tel,
      'image'       : CFG.banner,
      'sameAs'      : CFG.redes
    });
 
    console.log('[CivelSEO] GEO + AI Schema ✅');
  }
 
  /* ──────────────────────────────────────────────────────────────
     9.  ENGINE F — PERFORMANCE (Resource Hints)
         Reduz LCP → melhora Core Web Vitals → fator de ranking
  ────────────────────────────────────────────────────────────── */
  function enginePerformance() {
    var hints = [
      { rel:'preconnect',         href:'https://fonts.googleapis.com' },
      { rel:'preconnect',         href:'https://fonts.gstatic.com', cross:true },
      { rel:'preconnect',         href:'https://cdn.jsdelivr.net' },
      { rel:'dns-prefetch',       href:'https://www.google-analytics.com' },
      { rel:'dns-prefetch',       href:'https://www.googletagmanager.com' },
      { rel:'preload', as:'image',href: CFG.banner }
    ];
 
    hints.forEach(function (h) {
      var existing = document.querySelector('link[href="' + h.href + '"]');
      if (existing) return;
      var el = document.createElement('link');
      el.rel  = h.rel;
      el.href = h.href;
      if (h.as)    el.setAttribute('as', h.as);
      if (h.cross) el.setAttribute('crossorigin', '');
      /* Insere antes do primeiro link/script no head */
      var first = document.head.querySelector('link, script');
      document.head.insertBefore(el, first);
    });
 
    /* Lazy load nas imagens sem atributo loading */
    document.querySelectorAll('img:not([loading])').forEach(function (img) {
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    });
 
    /* Alt text fallback em imagens sem alt */
    document.querySelectorAll('img:not([alt])').forEach(function (img) {
      img.setAttribute('alt', 'Lucas Semim Advocacia Cível — Indenizações em BH');
    });
 
    console.log('[CivelSEO] Performance Hints ✅');
  }
 
  /* ──────────────────────────────────────────────────────────────
     10. ENGINE G — CORE WEB VITALS MONITOR
         Coleta LCP e CLS e loga no console para diagnóstico
         Integre com GA4 para monitorar no Search Console
  ────────────────────────────────────────────────────────────── */
  function engineCWV() {
    if (!('PerformanceObserver' in window)) return;
 
    /* LCP — Largest Contentful Paint (meta: < 2.5s) */
    try {
      new PerformanceObserver(function (list) {
        var entries = list.getEntries();
        var lcp = entries[entries.length - 1];
        console.log('[CivelSEO] LCP: ' + Math.round(lcp.startTime) + 'ms' +
          (lcp.startTime < 2500 ? ' ✅ bom' : lcp.startTime < 4000 ? ' ⚠️ melhorar' : ' ❌ ruim'));
 
        /* Envia para GA4 se disponível */
        if (typeof gtag === 'function') {
          gtag('event', 'web_vitals', { metric_name:'LCP', value: Math.round(lcp.startTime) });
        }
      }).observe({ type:'largest-contentful-paint', buffered:true });
    } catch (e) { /* browser sem suporte */ }
 
    /* CLS — Cumulative Layout Shift (meta: < 0.1) */
    try {
      var clsTotal = 0;
      new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (e) {
          if (!e.hadRecentInput) clsTotal += e.value;
        });
        console.log('[CivelSEO] CLS acumulado: ' + clsTotal.toFixed(4) +
          (clsTotal < 0.1 ? ' ✅' : clsTotal < 0.25 ? ' ⚠️' : ' ❌'));
      }).observe({ type:'layout-shift', buffered:true });
    } catch (e) { /* browser sem suporte */ }
 
    /* FID/INP — Interaction to Next Paint (meta: < 200ms) */
    try {
      new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (e) {
          console.log('[CivelSEO] INP/FID: ' + Math.round(e.processingStart - e.startTime) + 'ms');
        });
      }).observe({ type:'first-input', buffered:true });
    } catch (e) { /* browser sem suporte */ }
  }
 
  /* ──────────────────────────────────────────────────────────────
     11. ENGINE H — SEARCH CONSOLE SIGNALS
         Reforça sinais de autoridade local para o Googlebot:
         • hreflang correto
         • links internos com aria-label
         • verifica se há sitemap linkado
  ────────────────────────────────────────────────────────────── */
  function engineSearchConsole() {
 
    /* Hreflang pt-BR */
    var hreflang = document.querySelector('link[hreflang]');
    if (!hreflang) {
      var hl = document.createElement('link');
      hl.setAttribute('rel',      'alternate');
      hl.setAttribute('hreflang', 'pt-BR');
      hl.setAttribute('href',     fullUrl(window.location.pathname));
      document.head.appendChild(hl);
    }
 
    /* Sitemap link no head (descoberta automática pelo Googlebot) */
    var sm = document.querySelector('link[rel="sitemap"]');
    if (!sm) {
      var sml = document.createElement('link');
      sml.setAttribute('rel',  'sitemap');
      sml.setAttribute('type', 'application/xml');
      sml.setAttribute('href', CFG.base + '/codeleicivel/civel_sitemap.xml');
      document.head.appendChild(sml);
    }
 
    /* Aria-label nos links internos sem texto descritivo */
    document.querySelectorAll('a[href]').forEach(function (a) {
      var txt = (a.textContent || '').trim();
      if (!txt && !a.getAttribute('aria-label')) {
        a.setAttribute('aria-label', 'Link — ' + CFG.escritorio);
      }
      /* rel="noopener noreferrer" em links externos */
      if (a.hostname && a.hostname !== window.location.hostname) {
        if (!a.getAttribute('rel')) {
          a.setAttribute('rel',    'noopener noreferrer');
          a.setAttribute('target', '_blank');
        }
      }
    });
 
    console.log('[CivelSEO] Search Console Signals ✅');
  }
 
  /* ──────────────────────────────────────────────────────────────
     12. ENGINE I — CTR BOOSTER
         Analisa title e description e alerta no console se
         estiverem fora do tamanho ideal para o SERP
  ────────────────────────────────────────────────────────────── */
  function engineCTRBooster(pg) {
    var titleLen = document.title.length;
    var descEl   = document.querySelector('meta[name="description"]');
    var descLen  = descEl ? descEl.getAttribute('content').length : 0;
 
    console.group('[CivelSEO] Análise de CTR — ' + window.location.pathname);
    console.log('Title: ' + titleLen + ' chars' + (titleLen > 60 ? ' ⚠️ truncar no SERP' : ' ✅'));
    console.log('Desc : ' + descLen  + ' chars' + (descLen > 160 ? ' ⚠️ truncar no SERP' : descLen < 120 ? ' ⚠️ curta' : ' ✅'));
 
    /* CTR atual desta página (dados fixos do Search Console para log de referência) */
    var scData = {
      '/'                          : { clicks:6,   impressions:250, ctr:'2.4%', pos:'—' },
      '/blindagem-patrimonial.html': { clicks:0,   impressions:25,  ctr:'0%',   pos:'—' },
      '/familia-sucessoes.html'    : { clicks:0,   impressions:6,   ctr:'0%',   pos:'—' },
      '/execucao-cobranca.html'    : { clicks:0,   impressions:6,   ctr:'0%',   pos:'—' }
    };
 
    var path    = window.location.pathname.replace(/\/+$/, '') || '/';
    var current = scData[path];
    if (current) {
      console.log('Search Console (24/03–23/06/2026): '
        + current.clicks + ' cliques | '
        + current.impressions + ' impressões | CTR ' + current.ctr);
      if (current.clicks === 0 && current.impressions > 0) {
        console.warn('⚠️  0 cliques com ' + current.impressions + ' impressões → prioridade máxima de otimização de title e FAQ schema');
      }
    }
    console.groupEnd();
  }
 
  /* ──────────────────────────────────────────────────────────────
     13. BOOTSTRAP — executa todas as engines
  ────────────────────────────────────────────────────────────── */
  function init() {
    var pg = getPage();
 
    if (pg) {
          engineMeta(pg);           /* A — meta tags e títulos        */
          engineSchemaBase(pg);     /* B — LegalService Schema        */
          engineFAQ(pg);            /* C — FAQPage rich snippets      */
          engineBreadcrumb(pg);     /* D — BreadcrumbList no SERP     */
          engineGeoAI(pg);          /* E — GEO + AI + Voice search    */
    }
    enginePerformance();      /* F — Resource hints + lazy imgs */
    engineCWV();              /* G — Core Web Vitals monitor    */
    engineSearchConsole();    /* H — SC signals + hreflang      */
    if (pg) engineCTRBooster(pg); /* I — Diagnóstico de CTR     */
 
    console.log('%c[CivelSEO v3.0 LIVE] ✅ Todas as engines ativas — ' + window.location.pathname,
      'color:#D4AF37;font-weight:bold;font-family:monospace;');
  }
 
  /* Executa após DOM pronto */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
 
})();
 