/**
 * google-ai-brain.js v5.1 (Lote E, 09/10/2026) - dados estruturados (JSON-LD) do site
 * lucassemim.adv.br · Dr. Lucas Renan Semim · OAB/MG 222.539
 *
 * Regras desta versão (Provimento 205/2021 da OAB e diretrizes do Google):
 *  - sem nota/avaliação (aggregateRating), sem faixa de preço (priceRange) e sem preço "0";
 *  - sem FAQPage gerado aqui: FAQ só pode ser marcado quando está visível na página
 *    (faq-brain.js e o JSON-LD escrito na própria página cuidam disso);
 *  - nunca inventar datas: sem data real na página, o nó Article não é criado;
 *  - não duplicar o que a página já declara (Article, BreadcrumbList, ProfilePage...);
 *  - sem textos de promessa, superlativo ou "especialista".
 */

// MÓDULO 1 — DETECTOR DE CONTEXTO
function detectPageContext() {
    const url = window.location.href;
    const path = window.location.pathname.toLowerCase();
    const title = document.title;
    const description = document.querySelector('meta[name="description"]')?.content || '';
    const canonical = document.querySelector('link[rel="canonical"]')?.href || url;
    
    let pageType = 'WebPage'; // default
    
    if (path === '/' || path === '/index.html' || path === '/index' || path === '') pageType = 'WebSite';
    else if (path.includes('/noticias') && !path.includes('/news/') && !path.endsWith('.html')) pageType = 'CollectionPage';
    else if (path.includes('/news/') || path.includes('/noticias/')) pageType = 'Article';
    else if (path.includes('/sobre') || path.includes('/sobre-mim')) pageType = 'ProfilePage';
    else if (path.includes('/contato') || path.includes('/contact')) pageType = 'ContactPage';
    else if (path.includes('/legal-tech') || path.includes('/calculadora')) pageType = 'SoftwareApplication';
    else if (path.includes('/solucoes') || path.includes('/servicos') || path.includes('/areas')) pageType = 'Service';
    else if (path.includes('/blog') || path.includes('/artigos')) pageType = 'Article';
    
    return { url, path, title, description, canonical, pageType };
}

// MÓDULO 2 — NÚCLEO DE ENTIDADES (KNOWLEDGE GRAPH COMPLETO)
const entityOrganization = {
    "@type": ["LegalService", "LocalBusiness", "ProfessionalService"],
    "@id": "https://lucassemim.adv.br/#organization",
    "name": "Dr. Lucas Semim Advocacia Criminal",
    "alternateName": [
        "Semim & Associados",
        "Advogado Live Consultoria Jurídica",
        "Advogado Live"
    ],
    "legalName": "Lucas Renan Semim Advogado",
    "description": "Advocacia criminal em Sabará e na comarca de Belo Horizonte, Minas Gerais: defesa em delegacias, audiências e processos, Tribunal do Júri, crimes de drogas, crimes financeiros e execução penal. Plantão criminal 24 horas.",
    "url": "https://lucassemim.adv.br",
    "telephone": "+55-31-98942-0094",
    "email": "contato@lucassemim.adv.br",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "R. Cel. Abílio Pereira, 337",
        "addressLocality": "Sabará",
        "addressRegion": "MG",
        "postalCode": "34505-460",
        "addressCountry": "BR"
    },
    "geo": {
        "@type": "GeoCoordinates",
        "latitude": "-19.8875",
        "longitude": "-43.8261"
    },
    "hasMap": "https://maps.google.com/?q=R.+Cel.+Ab%C3%ADlio+Pereira,+337,+Sabar%C3%A1+-+MG",
    "openingHoursSpecification": [
        {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
                "Monday","Tuesday","Wednesday","Thursday",
                "Friday","Saturday","Sunday"
            ],
            "opens": "00:00",
            "closes": "23:59",
            "name": "Plantão Criminal 24 Horas"
        }
    ],
    "contactPoint": [
        {
            "@type": "ContactPoint",
            "telephone": "+55-31-98942-0094",
            "contactType": "customer support",
            "availableLanguage": ["Portuguese"],
            "areaServed": "BR",
            "hoursAvailable": {
                "@type": "OpeningHoursSpecification",
                "opens": "00:00",
                "closes": "23:59",
                "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
            }
        },
        {
            "@type": "ContactPoint",
            "telephone": "+55-31-98942-0094",
            "contactType": "emergency",
            "name": "Plantão Policial — Atendimento em Delegacia",
            "availableLanguage": ["Portuguese"]
        }
    ],
    "areaServed": [
        {
            "@type": "City",
            "name": "Sabará",
            "sameAs": "https://www.wikidata.org/wiki/Q1451808"
        },
        {
            "@type": "City",
            "name": "Belo Horizonte",
            "sameAs": "https://www.wikidata.org/wiki/Q42800"
        },
        { "@type": "City", "name": "Vespasiano" },
        { "@type": "City", "name": "Lagoa Santa" },
        { "@type": "City", "name": "Contagem" },
        { "@type": "City", "name": "Betim" },
        { "@type": "City", "name": "Nova Lima" },
        { "@type": "City", "name": "Santa Luzia" },
        { "@type": "City", "name": "Ribeirão das Neves" },
        {
            "@type": "AdministrativeArea",
            "name": "Comarca de Belo Horizonte",
            "containedInPlace": {
                "@type": "State",
                "name": "Minas Gerais",
                "sameAs": "https://www.wikidata.org/wiki/Q39109"
            }
        }
    ],
    "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Serviços de Advocacia Criminal",
        "itemListElement": [
            {
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Service",
                    "name": "Defesa Criminal",
                    "description": "Defesa técnica em inquéritos policiais, ações penais e tribunais. Atuação em delegacias 24 horas.",
                    "provider": { "@id": "https://lucassemim.adv.br/#organization" }
                }
            },
            {
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Service",
                    "name": "Tribunal do Júri",
                    "description": "Defesa em crimes dolosos contra a vida: homicídio, latrocínio, tentativa de homicídio. Sustentação oral e estratégia para o plenário.",
                    "provider": { "@id": "https://lucassemim.adv.br/#organization" }
                }
            },
            {
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Service",
                    "name": "Defesa em Lei de Drogas",
                    "description": "Defesa em crimes de tráfico de entorpecentes (Art. 33 Lei 11.343/06), porte para uso pessoal (Art. 28) e tráfico privilegiado.",
                    "provider": { "@id": "https://lucassemim.adv.br/#organization" }
                }
            },
            {
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Service",
                    "name": "Habeas Corpus",
                    "description": "Impetração de Habeas Corpus para liberdade provisória, revogação de prisão preventiva e trancamento de ação penal.",
                    "provider": { "@id": "https://lucassemim.adv.br/#organization" }
                }
            },
            {
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Service",
                    "name": "Execução Penal",
                    "description": "Acompanhamento de progressão de regime, livramento condicional, remição de pena e cálculo de prescrição penal.",
                    "provider": { "@id": "https://lucassemim.adv.br/#organization" }
                }
            },
            {
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Service",
                    "name": "Crimes Financeiros e Colarinho Branco",
                    "description": "Defesa em estelionato, lavagem de dinheiro, crimes contra o sistema financeiro e corrupção.",
                    "provider": { "@id": "https://lucassemim.adv.br/#organization" }
                }
            },
            {
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Service",
                    "name": "Atendimento em Delegacia 24 Horas",
                    "description": "Plantão criminal 24 horas para flagrantes, depoimentos e prisões.",
                    "provider": { "@id": "https://lucassemim.adv.br/#organization" }
                }
            },
            {
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Service",
                    "name": "Prescrição Penal",
                    "description": "Análise e peticionamento para extinção da punibilidade por prescrição penal (Art. 107, IV CP).",
                    "provider": { "@id": "https://lucassemim.adv.br/#organization" }
                }
            }
        ]
    },
    "identifier": [
        {
            "@type": "PropertyValue",
            "name": "OAB/MG",
            "value": "222.539",
            "propertyID": "OAB"
        }
    ],
    "logo": {
        "@type": "ImageObject",
        "url": "https://lucassemim.adv.br/img/logodosemim1.png",
        "width": 300,
        "height": 100
    },
    "image": [
        {
            "@type": "ImageObject",
            "url": "https://lucassemim.adv.br/img/lucasrenansemimeadvogado.jpeg",
            "caption": "Dr. Lucas Renan Semim — Advogado Criminalista OAB/MG 222.539"
        }
    ],
    "sameAs": [
        "https://www.linkedin.com/company/advogado-live-%E2%80%93-consultoria-jur%C3%ADdica-sua-defesa-ao-vivo-e-sob-medida/",
        "https://lucasrenansemim.jusbrasil.com.br/",
        "https://wa.me/5531989420094"
    ],
    "potentialAction": [
        {
            "@type": "ReserveAction",
            "name": "Agendar Consulta Criminal",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://cal.read.ai/lucas-fjd9a",
                "actionPlatform": [
                    "http://schema.org/DesktopWebPlatform",
                    "http://schema.org/MobileWebPlatform"
                ]
            }
        },
        {
            "@type": "CommunicateAction",
            "name": "Plantão Criminal 24h — WhatsApp",
            "target": "https://wa.me/5531989420094"
        }
    ]
};

const entityPerson = {
    "@type": "Person",
    "@id": "https://lucassemim.adv.br/#person",
    "name": "Dr. Lucas Renan Semim",
    "givenName": "Lucas",
    "familyName": "Semim",
    "additionalName": "Renan",
    "honorificPrefix": "Dr.",
    "jobTitle": "Advogado Criminalista",
    "description": "Advogado criminalista inscrito na OAB/MG sob o número 222.539. Atua em defesa criminal, Tribunal do Júri, Lei de Drogas, Habeas Corpus e Execução Penal, em Sabará e na comarca de Belo Horizonte, Minas Gerais.",
    "worksFor": { "@id": "https://lucassemim.adv.br/#organization" },
    "url": "https://lucassemim.adv.br/sobre-mim.html",
    "image": {
        "@type": "ImageObject",
        "url": "https://lucassemim.adv.br/img/lucasrenansemimeadvogado.jpeg",
        "caption": "Dr. Lucas Renan Semim — OAB/MG 222.539"
    },
    "hasCredential": [
        {
            "@type": "EducationalOccupationalCredential",
            "name": "Inscrição OAB/MG 222.539",
            "credentialCategory": "Registro Profissional",
            "recognizedBy": {
                "@type": "Organization",
                "name": "Ordem dos Advogados do Brasil — Seccional Minas Gerais",
                "url": "https://www.oabmg.org.br"
            }
        }
    ],
    "knowsAbout": [
        "Direito Penal",
        "Processo Penal",
        "Tribunal do Júri",
        "Defesa Criminal",
        "Habeas Corpus",
        "Lei de Drogas — Lei 11.343/2006",
        "Execução Penal — LEP",
        "Prescrição Penal",
        "Dosimetria da Pena",
        "Crimes Contra a Vida",
        "Crimes Financeiros",
        "Lavagem de Dinheiro",
        "Prisão em Flagrante",
        "Prisão Preventiva",
        "Liberdade Provisória",
        "Progressão de Regime",
        "Inquérito Policial"
    ],
    "address": {
        "@type": "PostalAddress",
        "addressLocality": "Sabará",
        "addressRegion": "MG",
        "addressCountry": "BR"
    },
    "telephone": "+55-31-98942-0094",
    "sameAs": [
        "https://www.linkedin.com/in/lucas-renan-a2a52910b/",
        "https://lucasrenansemim.jusbrasil.com.br/"
    ]
};

const entityWebSite = {
    "@type": "WebSite",
    "@id": "https://lucassemim.adv.br/#website",
    "name": "Dr. Lucas Semim — Advocacia Criminal",
    "url": "https://lucassemim.adv.br",
    "description": "Portal jurídico de advocacia criminal em Sabará e Belo Horizonte/MG. Artigos, notícias, calculadora de prescrição penal e consultoria jurídica online.",
    "inLanguage": "pt-BR",
    "publisher": { "@id": "https://lucassemim.adv.br/#organization" },
    "author": { "@id": "https://lucassemim.adv.br/#person" },
    "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["h1", ".hero-title", ".page-title", ".speakable"]
    }
};

// MÓDULO 3 — SCHEMA DINÂMICO POR TIPO DE PÁGINA

// Lote E: devolve true se a página já declara (em JSON-LD próprio) algum dos tipos pedidos.
// Serve para NÃO criar nós duplicados ou conflitantes (Article, BreadcrumbList, Service...).
function pageHasSchemaType(...wanted) {
    const blocks = document.querySelectorAll('script[type="application/ld+json"]');
    for (const block of blocks) {
        try {
            const data = JSON.parse(block.textContent);
            const items = Array.isArray(data) ? data : [data];
            for (const item of items) {
                const graph = Array.isArray(item && item['@graph']) ? item['@graph'] : [item];
                for (const node of graph) {
                    const t = node && node['@type'];
                    const types = Array.isArray(t) ? t : [t];
                    if (types.some(x => wanted.includes(x))) return true;
                }
            }
        } catch (err) {
            // JSON-LD malformado em outro bloco: ignora e segue
        }
    }
    return false;
}

function buildPageSpecificSchema(context, baseGraph) {
    const { path, url, title, description, canonical, pageType } = context;
    const nomeLimpo = title.replace(/ \| .*$/, '');

    if (pageType === 'WebSite' && !pageHasSchemaType('WebPage')) {
        baseGraph.push({
            "@type": "WebPage",
            "@id": canonical + "#webpage",
            "url": canonical,
            "name": title,
            "description": description,
            "isPartOf": { "@id": "https://lucassemim.adv.br/#website" },
            "about": { "@id": "https://lucassemim.adv.br/#person" },
            "breadcrumb": {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://lucassemim.adv.br/" }
                ]
            }
        });
    }

    if (pageType === 'Article' && !pageHasSchemaType('Article', 'NewsArticle', 'BlogPosting')) {
        const pubDate = document.querySelector('meta[name="article:published_time"]')?.content
                     || document.querySelector('meta[property="article:published_time"]')?.content
                     || document.querySelector('time')?.getAttribute('datetime')
                     || '';
        // Sem data real na página não se cria o Article: data inventada engana o buscador.
        if (pubDate) {
            const modDate = document.querySelector('meta[name="article:modified_time"]')?.content
                         || document.querySelector('meta[property="article:modified_time"]')?.content
                         || pubDate;
            baseGraph.push({
                "@type": "Article",
                "@id": canonical + "#article",
                "headline": nomeLimpo,
                "description": description,
                "url": canonical,
                "datePublished": pubDate,
                "dateModified": modDate,
                "author": { "@id": "https://lucassemim.adv.br/#person" },
                "publisher": { "@id": "https://lucassemim.adv.br/#organization" },
                "inLanguage": "pt-BR",
                "mainEntityOfPage": canonical,
                "image": {
                    "@type": "ImageObject",
                    "url": document.querySelector('meta[property="og:image"]')?.content
                        || "https://lucassemim.adv.br/img/lucasrenansemimeadvogado.jpeg"
                },
                "speakable": {
                    "@type": "SpeakableSpecification",
                    "cssSelector": ["h1", ".article-intro", ".artigo-resumo", ".lead"]
                }
            });
        }
    }

    if ((pageType === 'Service' || path.includes('solucoes') || path.includes('servicos')) && !pageHasSchemaType('Service')) {
        // Lote E: sem "offers" (o preço "A consultar" não é um valor válido e a OAB restringe divulgar valores).
        baseGraph.push({
            "@type": "Service",
            "@id": canonical + "#service",
            "name": nomeLimpo,
            "description": description,
            "provider": { "@id": "https://lucassemim.adv.br/#organization" },
            "areaServed": "Sabará, Belo Horizonte e Comarca de BH/MG",
            "url": canonical
        });
    }

    if ((pageType === 'ProfilePage' || path.includes('sobre')) && !pageHasSchemaType('ProfilePage')) {
        baseGraph.push({
            "@type": "ProfilePage",
            "@id": canonical + "#profilepage",
            "name": title,
            "url": canonical,
            "description": description,
            "mainEntity": { "@id": "https://lucassemim.adv.br/#person" }
        });
    }

    if ((pageType === 'SoftwareApplication' || path.includes('calculadora') || path.includes('legal-tech'))
        && !pageHasSchemaType('SoftwareApplication', 'WebApplication')) {
        // Lote E: sem "offers" (preço 0 = promessa de gratuidade).
        baseGraph.push({
            "@type": "SoftwareApplication",
            "@id": canonical + "#app",
            "name": nomeLimpo,
            "description": description,
            "applicationCategory": "LegalApplication",
            "operatingSystem": "Web Browser",
            "author": { "@id": "https://lucassemim.adv.br/#person" },
            "url": canonical
        });
    }

    if ((pageType === 'CollectionPage' || path === '/noticias' || path === '/noticias.html') && !pageHasSchemaType('CollectionPage')) {
        baseGraph.push({
            "@type": "CollectionPage",
            "@id": canonical + "#collectionpage",
            "name": "Notícias Jurídicas — Dr. Lucas Semim",
            "description": description,
            "url": canonical,
            "inLanguage": "pt-BR",
            "publisher": { "@id": "https://lucassemim.adv.br/#organization" }
        });
    }

    if (!pageHasSchemaType('BreadcrumbList')) {
        const breadcrumbs = buildDynamicBreadcrumb(path, title);
        if (breadcrumbs.length > 1) {
            baseGraph.push({
                "@type": "BreadcrumbList",
                "@id": canonical + "#breadcrumb",
                "itemListElement": breadcrumbs
            });
        }
    }

    return baseGraph;
}

// CONSTRUTOR DE BREADCRUMB INTELIGENTE
function buildDynamicBreadcrumb(path, title) {
    const crumbs = [
        { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://lucassemim.adv.br/" }
    ];
    
    const segments = path.replace(/\.html$/, '').split('/').filter(Boolean);
    const segmentLabels = {
        'noticias': 'Notícias Jurídicas',
        'news': 'Artigo',
        'sobre-mim': 'Sobre o Dr. Lucas',
        'sobre': 'Sobre o Dr. Lucas',
        'solucoes': 'Áreas de Atuação',
        'servicos': 'Serviços',
        'contato': 'Contato',
        'legal-tech': 'Legal Tech',
        'calculadora-prescricao': 'Calculadora de Prescrição',
        'blog': 'Blog Jurídico',
        'artigos': 'Artigos',
        'defesa-criminal': 'Defesa Criminal',
        'o-que-fazer-agora': 'O que fazer agora',
        'advogado-criminalista': 'Advogado Criminalista',
        'presidios': 'Presídios'
    };
    
    let currentPath = 'https://lucassemim.adv.br';
    segments.forEach((seg, i) => {
        currentPath += '/' + seg;
        const label = segmentLabels[seg] || (i === segments.length - 1 ? title.replace(/ \| .*$/, '') : seg);
        crumbs.push({
            "@type": "ListItem",
            "position": i + 2,
            "name": label,
            "item": currentPath + (i === segments.length - 1 ? (path.endsWith('.html') ? '.html' : '') : '')
        });
    });
    
    return crumbs;
}

// MÓDULO 4 — INJETOR DE META TAGS AI (GEO — Generative Engine Optimization)
function injectAIMetaTags(context) {
    const { url, title, description } = context;
    const head = document.head;
    
    if (document.querySelector('meta[name="ai-entity"]')) return;
    
    const aiMetas = [
        { name: "ai-entity", content: "Dr. Lucas Renan Semim — Advogado Criminalista — OAB/MG 222.539" },
        { name: "ai-entity-type", content: "LegalService | CriminalDefenseAttorney | LocalBusiness" },
        { name: "ai-location", content: "Sabará, Minas Gerais, Brasil | Comarca de Belo Horizonte" },
        { name: "author", content: "Dr. Lucas Renan Semim" },
        { name: "author-credentials", content: "OAB/MG 222.539 — Advogado Criminalista" },
        { name: "geo.region", content: "BR-MG" },
        { name: "geo.placename", content: "Sabará, Minas Gerais" },
        { name: "geo.position", content: "-19.8875;-43.8261" },
        { itemprop: "name", content: "Dr. Lucas Semim Advocacia Criminal" },
        { property: "og:site_name", content: "Dr. Lucas Semim — Advocacia Criminal" },
        { property: "og:locale", content: "pt_BR" },
        { property: "og:type", content: "website" },
        { property: "og:image", content: "https://lucassemim.adv.br/img/lucasrenansemimeadvogado.jpeg" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: "https://lucassemim.adv.br/img/lucasrenansemimeadvogado.jpeg" },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
        { name: "ai-content-type", content: "Legal Information | Criminal Defense | Brazilian Law" },
        { name: "ai-primary-topic", content: "Advocacia Criminal, Direito Penal, Defesa Criminal, Habeas Corpus" },
        { name: "ai-geographic-scope", content: "Sabará MG, Belo Horizonte MG, Minas Gerais, Brasil" },
        { name: "ai-professional-license", content: "OAB/MG 222.539" },
        { name: "DC.title", content: title },
        { name: "DC.creator", content: "Dr. Lucas Renan Semim" },
        { name: "DC.subject", content: "Advocacia Criminal, Direito Penal, Belo Horizonte, Sabará" },
        { name: "DC.publisher", content: "Lucas Renan Semim" },
        { name: "DC.language", content: "pt-BR" },
        { name: "DC.coverage", content: "Sabará, Belo Horizonte, Minas Gerais, Brasil" },
        { name: "DC.rights", content: "© 2026 Dr. Lucas Renan Semim — Todos os direitos reservados" }
    ];
    
    aiMetas.forEach(meta => {
        const attr = meta.name ? `meta[name="${meta.name}"]` : 
                     meta.property ? `meta[property="${meta.property}"]` : null;
        if (attr && document.querySelector(attr)) return;
        
        const el = document.createElement('meta');
        Object.entries(meta).forEach(([key, val]) => el.setAttribute(key, val));
        head.appendChild(el);
    });
    
    const links = [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://cdn.jsdelivr.net" },
        { rel: "dns-prefetch", href: "https://wa.me" }
    ];
    links.forEach(link => {
        if (document.querySelector(`link[rel="${link.rel}"][href="${link.href}"]`)) return;
        const el = document.createElement('link');
        Object.entries(link).forEach(([k, v]) => el.setAttribute(k, v));
        head.appendChild(el);
    });
}

// MÓDULO 5 — (removido no Lote E) O FAQPage fixo de 5 perguntas era injetado em todas as páginas,
// sem aparecer para o visitante, e trazia "especialista" e "atendimento imediato".
// FAQ só pode ser marcado quando está visível: veja faq-brain.js e o JSON-LD da própria página.

// MÓDULO 6 — LOGGER DE DIAGNÓSTICO
function logDiagnostico(graphData, context, startTime) {
    const elapsed = (performance.now() - startTime).toFixed(2);
    const schemaTypes = graphData.map(e => e["@type"]).flat();
    
    const styles = {
        header: 'color:#d4af37; font-size:14px; font-weight:bold; background:#050505; padding:6px 12px; border-left:3px solid #d4af37;',
        success: 'color:#00c87a; font-size:11px;',
        info: 'color:#00e5ff; font-size:11px;',
        warn: 'color:#f39c12; font-size:11px;',
        dim: 'color:#555; font-size:10px;'
    };
    
    console.group('%c🧠 SEMIM AI BRAIN v5.0 — Ativado', styles.header);
    console.log('%c✓ Página detectada: ' + context.pageType, styles.success);
    console.log('%c✓ URL: ' + context.canonical, styles.info);
    console.log('%c✓ Schemas injetados (' + graphData.length + '):', styles.success, schemaTypes.join(', '));
    console.log('%c✓ Tempo de execução: ' + elapsed + 'ms', styles.success);
    console.log('%c─ Compatibilidade: Google · Bing · ChatGPT · Perplexity · Gemini · Claude · Copilot', styles.dim);
    console.log('%c─ E-E-A-T: OAB/MG 222.539 · Sabará e Comarca BH/MG · Plantão 24h', styles.dim);
    console.groupEnd();
}

// ORQUESTRADOR PRINCIPAL
document.addEventListener("DOMContentLoaded", function() {
    const startTime = performance.now();
    
    // --- MÓDULO 1: DETECTOR ---
    const context = detectPageContext();
    
    // --- MÓDULO 2: NÚCLEO DE ENTIDADES ---
    let graphData = [
        entityOrganization,
        entityPerson,
        entityWebSite
    ];
    
    // --- MÓDULO 3: SCHEMA DINÂMICO ---
    graphData = buildPageSpecificSchema(context, graphData);
    
    // --- MÓDULO 5: FAQ SCHEMA --- (removido no Lote E)

    // --- INJEÇÃO DO JSON-LD ---
    const scriptIA = document.createElement('script');
    scriptIA.type = 'application/ld+json';
    scriptIA.text = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": graphData
    }, null, 0); // minificado para performance
    document.head.appendChild(scriptIA);
    
    // --- MÓDULO 4: META TAGS AI ---
    injectAIMetaTags(context);
    
    // --- MÓDULO 6: LOG (somente com ?ai-debug=1 na URL) ---
    if (/[?&]ai-debug=1/.test(window.location.search)) logDiagnostico(graphData, context, startTime);
});
