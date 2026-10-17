/* =========================================================== */
/* === ARQUIVO: js/ai-neural-seo.js (AiNeuralSeo V4)         === */
/* === FUNÇÃO: GEO Elite, Voice Search, Schemas e Local SEO  === */
/* === DATA: 02/09/2026                                      === */
/* =========================================================== */
/* LOTE E (09/10/2026) - conformidade com o Provimento 205/2021 da OAB e com as
   diretrizes do Google para dados estruturados:
   - REMOVIDOS: FAQPage, HowTo e "perguntas por voz" injetados sem que o conteúdo apareça
     na página; o bloco escondido fora da tela "para inteligências artificiais" e a segunda
     Person que ele criava; priceRange; tipo EmergencyService; estimatedCost; textos de
     promessa/superlativo ("melhor", "especialista", "gratuita", "resposta imediata").
   - CORRIGIDOS: IDs do Wikidata das cidades (estavam errados); contactOption "TollFree"
     (o número é celular); sameAs que apontava para a home da OAB.
   - REGRA: marcação estruturada só para o que o visitante também vê na página.
     Não reativar FAQ/HowTo/blocos ocultos sem conteúdo visível e revisão de conformidade. */

window.AiNeuralSeo = {
    config: {
        advogado: {
            nome: "Lucas Renan Semim",
            oab: "OAB/MG 222.539",
            telefone: "+5531989420094",
            whatsapp: "https://wa.me/5531989420094",
            endereco: "R. Cel. Abílio Pereira, 337",
            cidade: "Sabará",
            estado: "MG",
            cep: "34575-020",
            lat: -19.8878,
            lng: -43.8069
        },
        urlBase: "https://lucassemim.adv.br"
    },

    state: {
        schemasInjetados: new Set()
    },

    faqDatabase: {}, // Lote E: base removida (conteúdo promocional; FAQ só pode ser marcado se estiver visível)

    init() {
        try {
            // Métodos Base (Preservados integralmente)
            this.injectAiMeta();
            this.injectMetaDescricaoDinamica();
            this.injectLlmsTxtHint();
            this.injectPersonSchema();
            // Lote E: injectFAQSchema() removido (só se marca FAQ que está visível na página)
            this.injectSpeakable();
            this.injectEntitySummary();

            // NOVOS MÉTODOS V4 (Evolução Estratégica)
            this.injectLegalServiceSchema();
            this.injectGeoMeta();
            this.injectWebSiteSchema();
            this.injectUrgencySchema();
            // Lote E: removidos HowTo, FAQ por voz e o bloco oculto "para IAs" (conteúdo invisível ao visitante)

        } catch (error) {
            if (window.location.hostname !== 'lucassemim.adv.br') {
                console.error('[AiNeuralSeo V4] Erro:', error);
            }
        }
    },

    detectPageContext() {
        const path = window.location.pathname.toLowerCase();
        const title = document.title.toLowerCase();
        const meta = document.querySelector('meta[name="keywords"]')?.content?.toLowerCase() || '';
        const h1 = document.querySelector('h1')?.textContent?.toLowerCase() || '';
        const h2s = [...document.querySelectorAll('h2')].slice(0, 3).map(h => h.textContent.toLowerCase()).join(' ');
        const combined = path + ' ' + title + ' ' + meta + ' ' + h1 + ' ' + h2s;

        if (combined.includes('flagrante')) return 'flagrante';
        if (combined.includes('habeas')) return 'habeas';
        if (combined.includes('trafico') || combined.includes('tráfico')) return 'trafico';
        if (combined.includes('audiencia') || combined.includes('custodia')) return 'audiencia';
        if (combined.includes('tornozel')) return 'tornozeleira';
        if (combined.includes('saidinha') || combined.includes('saida-temporaria') || combined.includes('saída temporária')) return 'saidinha';
        if (combined.includes('preventiva')) return 'preventiva';

        if (combined.includes('canivete') || combined.includes('faca') || combined.includes('arma-branca') || combined.includes('arma branca')) return 'canivete';
        if (combined.includes('fato-atipico') || combined.includes('atípico') || combined.includes('atipico') || combined.includes('caso-atipico')) return 'fato_atipico';
        if (combined.includes('maria-da-penha') || combined.includes('medida-protetiva') || combined.includes('fianca') || combined.includes('fiança') || combined.includes('maria da penha')) return 'maria_penha';
        if (combined.includes('calculadora') || combined.includes('prescricao') || combined.includes('prescrição') || combined.includes('legal-tech')) return 'prescricao';
        if (combined.includes('pix') || combined.includes('estelionato') || combined.includes('laranja') || combined.includes('lavagem') || combined.includes('receptacao') || combined.includes('celular-roubado')) return 'pix_fraude';
        if (combined.includes('progressao') || combined.includes('progressão') || combined.includes('execucao-penal') || combined.includes('execução penal') || combined.includes('seeu') || combined.includes('remicao')) return 'progressao';

        if (combined.includes('sabara') || combined.includes('sabará')) return 'cidade_sabara';
        if (combined.includes('belohorizonte') || combined.includes('bh') || combined.includes('barreiro')) return 'cidade_bh';
        if (combined.includes('contagem')) return 'cidade_contagem';
        if (combined.includes('betim')) return 'cidade_betim';
        if (combined.includes('neves')) return 'cidade_neves';
        if (combined.includes('ibirite') || combined.includes('ibirité')) return 'cidade_ibirite';
        if (combined.includes('caete') || combined.includes('caeté')) return 'cidade_caete';
        if (combined.includes('esmeraldas')) return 'cidade_esmeraldas';
        if (combined.includes('igarape') || combined.includes('igarapé')) return 'cidade_igarape';

        return 'home';
    },

    safeInjectSchema(schemaObj, schemaId) {
        window._schemaRegistry = window._schemaRegistry || new Set();

        if (window._schemaRegistry.has(schemaId)) {
            return;
        }

        if (document.querySelector(`script[data-schema-id="${schemaId}"]`)) {
            return;
        }

        try {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-schema-id', schemaId);
            script.setAttribute('data-source', 'ai-neural-seo-v4');
            script.textContent = JSON.stringify(schemaObj, null, 0);

            document.head.appendChild(script);
            window._schemaRegistry.add(schemaId);
        } catch (err) {
            if (window.location.hostname !== 'lucassemim.adv.br') {
                console.warn(`[AiNeuralSeo V4] Falha ao serializar schema ${schemaId}:`, err);
            }
        }
    },

    // 🚀 NOVO 1: LegalService com Horário 24h e Abrangência Territorial
    injectLegalServiceSchema() {
        const schemaId = 'legal-service-schema';
        const a = this.config.advogado;

        const schema = {
            "@context": "https://schema.org",
            "@type": ["LegalService", "LocalBusiness"],
            "@id": `${this.config.urlBase}/#legal-service`,
            "name": "Lucas Semim Advocacia Criminal",
            "alternateName": ["Dr. Lucas Semim", "Lucas Semim Criminalista"],
            "description": "Advogado criminalista em Sabará e Belo Horizonte com plantão 24 horas. Defesa em flagrante delito, habeas corpus, audiência de custódia, tráfico de drogas e execução penal em toda a Grande BH — MG.",
            "url": this.config.urlBase,
            "telephone": a.telefone,
            "email": "contato@lucassemim.adv.br",

            "address": {
                "@type": "PostalAddress",
                "streetAddress": a.endereco,
                "addressLocality": a.cidade,
                "addressRegion": a.estado,
                "postalCode": a.cep,
                "addressCountry": "BR"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": a.lat,
                "longitude": a.lng
            },
            "hasMap": `https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}`,

            "openingHoursSpecification": [
                {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
                    "opens": "00:00",
                    "closes": "23:59",
                    "description": "Plantão criminal 24 horas — atendimento de urgência para flagrante e custódia"
                }
            ],
            "openingHours": "Mo-Su 00:00-23:59",

            "areaServed": [
                { "@type": "City", "name": "Sabará", "sameAs": "https://www.wikidata.org/wiki/Q1451808" },
                { "@type": "City", "name": "Belo Horizonte", "sameAs": "https://www.wikidata.org/wiki/Q42800" },
                { "@type": "City", "name": "Contagem", "sameAs": "https://www.wikidata.org/wiki/Q271333" },
                { "@type": "City", "name": "Betim", "sameAs": "https://www.wikidata.org/wiki/Q737644" },
                { "@type": "City", "name": "Ribeirão das Neves", "sameAs": "https://www.wikidata.org/wiki/Q737689" },
                { "@type": "City", "name": "Santa Luzia", "sameAs": "https://www.wikidata.org/wiki/Q942235" },
                { "@type": "City", "name": "Ibirité", "sameAs": "https://www.wikidata.org/wiki/Q1751207" },
                { "@type": "City", "name": "Vespasiano", "sameAs": "https://www.wikidata.org/wiki/Q1012546" },
                { "@type": "City", "name": "Nova Lima", "sameAs": "https://www.wikidata.org/wiki/Q1642662" },
                { "@type": "City", "name": "Caeté" },
                { "@type": "City", "name": "Esmeraldas" },
                { "@type": "City", "name": "Igarapé" },
                { "@type": "City", "name": "Sete Lagoas" },
                { "@type": "City", "name": "Lagoa Santa" },
                { "@type": "AdministrativeArea", "name": "Grande Belo Horizonte", "containedInPlace": { "@type": "State", "name": "Minas Gerais" } }
            ],

            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Defesa Criminal — Serviços de Urgência",
                "itemListElement": [
                    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Plantão 24h — Flagrante Delito", "description": "Atendimento em caso de prisão em flagrante: acompanhamento na delegacia, na audiência de custódia e pedido de liberdade provisória." } },
                    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Habeas Corpus", "description": "Impetração de HC no TJMG, STJ e STF para combater prisão ilegal." } },
                    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Defesa em Tráfico de Drogas", "description": "Aplicação do tráfico privilegiado (art. 33 §4º) e distinção uso/tráfico." } },
                    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Execução Penal — Progressão e Saidinha", "description": "Petições para progressão de regime, saída temporária e auditoria SEEU." } },
                    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Tornozeleira Eletrônica — Defesa", "description": "Defesa contra revogação indevida por descarga de bateria (STJ HC 978.495/MG)." } }
                ]
            },

            "contactPoint": [
                {
                    "@type": "ContactPoint",
                    "contactType": "emergency",
                    "telephone": a.telefone,
                    "availableLanguage": ["Portuguese"],
                    "hoursAvailable": {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
                        "opens": "00:00",
                        "closes": "23:59"
                    }
                },
                {
                    "@type": "ContactPoint",
                    "contactType": "customer support",
                    "telephone": a.telefone,
                    "availableLanguage": ["Portuguese"]
                }
            ],

            "sameAs": [
                `https://wa.me/${a.whatsapp.replace('https://wa.me/', '')}`,
                "https://www.instagram.com/lucasrenansemim/",
                "https://www.linkedin.com/in/lucas-renan-a2a52910b/"
            ],

            "founder": {
                "@type": "Person",
                "name": a.nome,
                "honorificPrefix": "Dr.",
                "hasCredential": {
                    "@type": "EducationalOccupationalCredential",
                    "credentialCategory": "OAB",
                    "recognizedBy": { "@type": "Organization", "name": "Ordem dos Advogados do Brasil — Seção MG", "url": "https://www.oabmg.org.br" },
                    "identifier": "OAB/MG 222.539"
                }
            }
        };

        this.safeInjectSchema(schema, schemaId);
    },

    // 🚀 NOVO 3: Geo Meta Tags para Buscas Locais e Mobile "Perto de Mim"
    injectGeoMeta() {
        const a = this.config.advogado;

        const geoMetas = [
            { name: 'geo.region', content: 'BR-MG' },
            { name: 'geo.placename', content: `${a.cidade}, Minas Gerais, Brasil` },
            { name: 'geo.position', content: `${a.lat};${a.lng}` },
            { name: 'ICBM', content: `${a.lat}, ${a.lng}` },
            { name: 'location', content: 'Sabará, Belo Horizonte, Grande BH, Minas Gerais' },
            { name: 'coverage', content: 'Minas Gerais, Brasil' },
            { name: 'target-country', content: 'Brasil' },
            { name: 'availability', content: 'available' },
            { name: 'revisit-after', content: '3 days' },
            { name: 'audience', content: 'público geral, família de presos, réus, investigados' },
            { name: 'category', content: 'Advocacia Criminal, Direito Penal, Emergência Jurídica' },
            { name: 'citation-author', content: 'Dr. Lucas Renan Semim — OAB/MG 222.539' },
            { name: 'citation-url', content: this.config.urlBase },
            { name: 'citation-type', content: 'Serviço Jurídico — Defesa Criminal' }
        ];

        geoMetas.forEach(({ name, content }) => {
            if (document.querySelector(`meta[name="${name}"]`)) return;
            const meta = document.createElement('meta');
            meta.name = name;
            meta.content = content;
            document.head.appendChild(meta);
        });
    },

    // 🚀 NOVO 5: Sitelinks Search Box para Home
    injectWebSiteSchema() {
        const schemaId = 'website-search';
        const path = window.location.pathname;
        if (path !== '/' && path !== '/index.html' && path !== '') return;

        const schema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${this.config.urlBase}/#website`,
            "name": "Lucas Semim — Advocacia Criminal",
            "url": this.config.urlBase,
            "description": "Site do Dr. Lucas Renan Semim — Advogado Criminalista em Sabará e BH. Plantão 24h para flagrante, habeas corpus e defesa criminal.",
            "inLanguage": "pt-BR",
            // Bug corrigido: removido o potentialAction/SearchAction que apontava para
            // "${urlBase}/search?q=..." — esse endpoint de busca interna não existe
            // (site estático, sem página /search). Um SearchAction inválido apontando
            // para um 404 é reportado como erro pelo Google Search Console.
            "publisher": {
                "@type": "Person",
                "@id": `${this.config.urlBase}/#lucas-semim`,
                "name": this.config.advogado.nome
            }
        };

        this.safeInjectSchema(schema, schemaId);
    },

    // 🚀 NOVO 6: Schema de Urgência em Páginas Críticas
    injectUrgencySchema() {
        const ctx = this.detectPageContext();
        const urgencyContexts = ['flagrante', 'emergencia', 'audiencia', 'habeas'];
        if (!urgencyContexts.includes(ctx)) return;

        const schemaId = `urgency-${ctx}`;
        const a = this.config.advogado;

        const schema = {
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": `${this.config.urlBase}${window.location.pathname}#urgency-service`,
            "name": "Defesa Criminal de Urgência — Plantão 24h",
            "serviceType": "Defesa Criminal de Emergência",
            "description": "Atendimento jurídico de urgência para prisão em flagrante, habeas corpus e audiência de custódia. Plantão 24 horas por dia, 7 dias por semana, inclusive feriados.",
            "availableChannel": {
                "@type": "ServiceChannel",
                "name": "WhatsApp e Telefone — Plantão 24h",
                "servicePhone": a.telefone,
                "serviceUrl": a.whatsapp,
                "availableLanguage": "Portuguese",
                "availableAtOrFrom": {
                    "@type": "Place",
                    "address": {
                        "@type": "PostalAddress",
                        "addressLocality": "Belo Horizonte",
                        "addressRegion": "MG",
                        "addressCountry": "BR"
                    }
                }
            },
            "hoursAvailable": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
                "opens": "00:00",
                "closes": "23:59"
            },
            "provider": {
                "@type": "Person",
                "@id": `${this.config.urlBase}/#lucas-semim`,
                "name": a.nome,
                "telephone": a.telefone
            },
            "areaServed": {
                "@type": "AdministrativeArea",
                "name": "Grande Belo Horizonte, Minas Gerais",
                "containedInPlace": { "@type": "State", "name": "Minas Gerais", "containedInPlace": { "@type": "Country", "name": "Brasil" } }
            }
        };

        this.safeInjectSchema(schema, schemaId);
    },

    injectMetaDescricaoDinamica() {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && metaDesc.content && metaDesc.content.length > 80) return;

        const ctx = this.detectPageContext();

        const descricoes = {
            canivete: 'É crime andar com canivete? Pode andar com faca no carro? Dr. Lucas Semim explica o que diz o STJ sobre porte de arma branca. (31) 98942-0094.',
            fato_atipico: 'O que é fato atípico no direito penal? Exemplos e como usar a atipicidade como defesa criminal. Dr. Lucas Semim — OAB/MG 222.539.',
            saidinha: 'Calendário de saidinha 2026 em MG: próximas datas, quem tem direito e o que mudou com a Lei 14.843/2024. Dr. Lucas Semim — (31) 98942-0094.',
            tornozeleira: 'Tornozeleira descarregou? Entenda o que o STJ decidiu sobre descarga de bateria e como o advogado pode atuar. Dr. Lucas Semim — (31) 98942-0094.',
            maria_penha: 'Maria da Penha tem fiança? Qual o valor? Tire suas dúvidas com o Dr. Lucas Semim, advogado criminalista. (31) 98942-0094.',
            prescricao: 'Calculadora de prescrição penal: estime o prazo prescricional do seu processo. Dr. Lucas Semim — OAB/MG 222.539 — Sabará/BH.',
            pix_fraude: 'Emprestar conta para Pix é crime? Comprou celular roubado sem saber? Dr. Lucas Semim explica seus direitos: (31) 98942-0094.',
            progressao: 'Progressão de regime, remição e saidinha: seus direitos na execução penal em MG. Dr. Lucas Semim — (31) 98942-0094.',
            home: 'Dr. Lucas Semim — Advogado Criminalista em Sabará e BH com plantão 24h. Flagrante, habeas corpus, audiência de custódia. OAB/MG 222.539. (31) 98942-0094.'
        };

        const desc = descricoes[ctx] || descricoes.home;

        const newMeta = document.createElement('meta');
        newMeta.name = 'description';
        newMeta.content = desc;
        document.head.appendChild(newMeta);
    },

    injectPersonSchema() {
        const schemaId = 'person-lucas-semim';
        const a = this.config.advogado;
        const schemaObj = {
            "@context": "https://schema.org",
            "@type": "Person",
            "@id": `${this.config.urlBase}/#lucas-semim`,
            "name": a.nome,
            "givenName": "Lucas Renan",
            "familyName": "Semim",
            "honorificPrefix": "Dr.",
            "jobTitle": "Advogado Criminalista",
            "description": "Advogado criminalista com atuação em flagrante delito, audiência de custódia, habeas corpus, crimes de drogas, operações do GAECO e processos criminais. Atende em Sabará, Belo Horizonte e Grande BH, com plantão 24 horas.",
            "hasCredential": [
                {
                    "@type": "EducationalOccupationalCredential",
                    "credentialCategory": "Inscrição na Ordem dos Advogados do Brasil",
                    "recognizedBy": {
                        "@type": "Organization",
                        "name": "OAB — Seccional Minas Gerais"
                    },
                    "identifier": a.oab
                }
            ],
            // Bug corrigido: antes redeclarava aqui um LegalService completo e DIFERENTE
            // ("Semim & Associados Advocacia", @id "#escritorio") do LegalService canônico
            // publicado por injectLegalServiceSchema() ("Lucas Semim Advocacia Criminal",
            // @id "#legal-service") — duas entidades de negócio com nomes distintos na
            // mesma página confundem dados estruturados. Agora apenas referencia, por
            // @id, a mesma entidade LegalService canônica (referência válida em JSON-LD).
            "worksFor": {
                "@id": `${this.config.urlBase}/#legal-service`
            },
            "url": this.config.urlBase,
            "telephone": a.telefone,
            "image": `${this.config.urlBase}/Favicon-lucassemim.png`,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": a.endereco,
                "addressLocality": a.cidade,
                "addressRegion": a.estado,
                "postalCode": a.cep,
                "addressCountry": "BR"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": a.lat,
                "longitude": a.lng
            },
            "areaServed": [
                "Sabará, MG", "Belo Horizonte, MG", "Contagem, MG", "Betim, MG",
                "Ribeirão das Neves, MG", "Santa Luzia, MG", "Ibirité, MG",
                "Caeté, MG", "Esmeraldas, MG", "Nova Lima, MG", "Vespasiano, MG",
                "Grande Belo Horizonte, MG"
            ],
            "knowsAbout": [
                "Prisão em Flagrante Delito",
                "Habeas Corpus",
                "Audiência de Custódia",
                "Liberdade Provisória",
                "Prisão Preventiva",
                "Tráfico de Drogas — Lei 11.343/2006",
                "Defesa em Operações GAECO",
                "Lavagem de Dinheiro — Lei 9.613/98",
                "Tribunal do Júri",
                "Crimes Cibernéticos — Lei 12.737/2012",
                "Lei Maria da Penha — Falsas Acusações",
                "Tornozeleira Eletrônica — HC STJ",
                "Saidinha Temporária — Lei de Execução Penal",
                "Recursos Criminais — TJMG, STJ, STF",
                "Defesa Criminal no Código Penal Brasileiro",
                "Fato Atípico — Atipicidade da Conduta",
                "Porte de Arma Branca — Canivete e Faca",
                "Lei Maria da Penha — Fiança e Medida Protetiva",
                "Prescrição Penal — Cálculo e Extinção",
                "Progressão de Regime — LEP e SEEU",
                "Estelionato Eletrônico — Pix e Conta Laranja",
                "Receptação de Celular Roubado",
                "Lei Seca — Bafômetro e CNH",
                "Saída Temporária — Calendário 2026 MG",
                "Execução Penal — Remição e Detração",
                "Desistência Voluntária — Ponte de Ouro Art. 15 CP",
                "Súmula 56 STF — Falta de Vaga Regime Semiaberto"
            ],
            "knowsLanguage": ["pt-BR", "pt"],
            "availableLanguage": "Portuguese"
        };

        this.safeInjectSchema(schemaObj, schemaId);
    },

    injectSpeakable() {
        const schemaId = 'speakable-spec';
        const schemaObj = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "speakable": {
                "@type": "SpeakableSpecification",
                "cssSelector": [
                    ".hero-title",
                    ".hero-desc",
                    "#llm-entity-summary",
                    "h1",
                    ".chat-msg-bot",
                    ".entity-name",
                    ".entity-desc",
                    ".faq-answer",
                    "[itemprop='description']"
                ]
            },
            "url": `https://lucassemim.adv.br${window.location.pathname}`
        };

        this.safeInjectSchema(schemaObj, schemaId);
    },

    injectAiMeta() {
        const metas = [
            { property: 'og:type', content: 'website' },
            { property: 'og:site_name', content: 'Lucas Semim — Advocacia Criminal' },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: document.title },
            { name: 'twitter:description', content: document.querySelector('meta[name="description"]')?.content || '' },
            // Nota: as <meta name="GPTBot" ...> abaixo não têm efeito técnico real —
            // crawlers de IA respeitam robots.txt (User-agent: GPTBot etc.), não meta
            // tags por nome de bot arbitrário. Mantidas como sinalização/documentação
            // legível por humanos e por LLMs que leem o HTML da página; não fazem mal,
            // mas não substituem as regras em /robots.txt.
            { name: 'GPTBot', content: 'index, follow' },
            { name: 'ChatGPT-User', content: 'index, follow' },
            { name: 'OAI-SearchBot', content: 'index, follow' },
            { name: 'PerplexityBot', content: 'index, follow' },
            { name: 'ClaudeBot', content: 'index, follow' },
            { name: 'Claude-SearchBot', content: 'index, follow' },
            { name: 'Claude-User', content: 'index, follow' },
            { name: 'Google-Extended', content: 'index, follow' },
            { name: 'Amazonbot', content: 'index, follow' },
            { name: 'Bytespider', content: 'index, follow' },
            { name: 'Applebot-Extended', content: 'index, follow' },
            { name: 'DuckAssistBot', content: 'index, follow' },
            { name: 'MistralAI-User', content: 'index, follow' },
            { name: 'YouBot', content: 'index, follow' },
            { name: 'meta-externalagent', content: 'index, follow' },
            { name: 'cohere-ai', content: 'index, follow' },
            { name: 'service-type', content: 'Advocacia Criminal — Plantão 24h' },
            { name: 'service-area', content: 'Sabará, Belo Horizonte, Grande BH, Minas Gerais' },
            { name: 'emergency-phone', content: '+55-31-98942-0094' },
            { 'http-equiv': 'content-language', content: 'pt-BR' }
        ];

        metas.forEach(({ name, property, content, 'http-equiv': httpEquiv }) => {
            const selector = name ? `meta[name="${name}"]`
                : property ? `meta[property="${property}"]`
                    : `meta[http-equiv="${httpEquiv}"]`;

            if (document.querySelector(selector)) return;

            const meta = document.createElement('meta');
            if (name) meta.name = name;
            if (property) meta.setAttribute('property', property);
            if (httpEquiv) meta.setAttribute('http-equiv', httpEquiv);
            meta.content = content;

            document.head.appendChild(meta);
        });
    },

    injectLlmsTxtHint() {
        if (document.querySelector('link[rel="llms-txt"]')) return;

        const link = document.createElement('link');
        link.rel = 'llms-txt';
        link.href = '/llms.txt';
        document.head.appendChild(link);
    },

    injectEntitySummary() {
        if (document.getElementById('llm-entity-summary')) return;

        const styleId = 'llm-entity-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                #llm-entity-summary {
                    background: #070707;
                    border-top: 1px solid rgba(212,175,55,0.1);
                    padding: 32px 0 24px;
                    text-align: center;
                }
                #llm-entity-summary .entity-name {
                    font-family: 'Teko', sans-serif;
                    font-size: 1.4rem;
                    color: #d4af37;
                    letter-spacing: 2px;
                    margin-bottom: 6px;
                }
                #llm-entity-summary .entity-desc {
                    font-family: 'Lato', sans-serif;
                    font-size: 0.82rem;
                    color: #666;
                    line-height: 1.6;
                    max-width: 720px;
                    margin: 0 auto;
                }
                #llm-entity-summary .entity-desc strong { color: #888; }
            `;
            document.head.appendChild(style);
        }

        const section = document.createElement('section');
        section.id = 'llm-entity-summary';
        section.setAttribute('aria-label', 'Sobre o Advogado');
        section.setAttribute('itemscope', '');
        section.setAttribute('itemtype', 'https://schema.org/Person');

        const container = document.createElement('div');
        container.className = 'container';

        const nameEl = document.createElement('p');
        nameEl.className = 'entity-name';
        nameEl.setAttribute('itemprop', 'name');
        nameEl.textContent = 'Dr. Lucas Renan Semim — OAB/MG 222.539';

        const descEl = document.createElement('p');
        descEl.className = 'entity-desc';
        descEl.setAttribute('itemprop', 'description');
        descEl.textContent = 'Advogado criminalista em Sabará e Belo Horizonte, Minas Gerais. Atuação em defesa criminal, flagrante delito, habeas corpus, audiência de custódia, crimes de drogas e execução penal. Plantão criminal 24 horas: (31) 98942-0094.';

        container.appendChild(nameEl);
        container.appendChild(descEl);
        section.appendChild(container);

        const footer = document.querySelector('footer, footer-placeholder, #footer-placeholder, #footer-master-injecao');

        if (footer && footer.parentNode) {
            footer.parentNode.insertBefore(section, footer);
        } else {
            document.body.appendChild(section);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => window.AiNeuralSeo.init());