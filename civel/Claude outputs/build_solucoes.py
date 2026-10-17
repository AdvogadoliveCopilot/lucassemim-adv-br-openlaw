# -*- coding: utf-8 -*-
"""Gera solucoes.html — página curta de soluções criminais, ligada ao diagnóstico e ao Livro.
Uso: python3 build_solucoes.py [saida.html]
"""
import json, html, os, sys
from livro_data import WHATS, TEL, TEL_FMT

E = lambda s: html.escape(s, quote=True)
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "solucoes.html")
G = "o-que-fazer-agora/"
D = "defesa-criminal/"

# (ícone FA, título, tag, resumo, [3 entregas], guia, modo do diagnóstico)
FASES = [
    ("Fase 1", "Prisão e primeiras horas", "Quando cada hora conta.", [
        ("fa-handcuffs", "Defesa em flagrante e delegacia", "Plantão 24h",
         "O advogado vai até a delegacia, acompanha o depoimento e atua para que a prisão seja analisada com todas as garantias.",
         ["Atendimento presencial em Sabará e BH", "Direito ao silêncio e acompanhamento do depoimento", "Pedido de relaxamento da prisão ou liberdade provisória, quando cabível"],
         G + "acabei-de-ser-preso-em-flagrante.html", "urgencia"),
        ("fa-gavel", "Audiência de custódia", "Em até 24h da prisão",
         "A primeira audiência com o juiz é decisiva para a liberdade. O advogado participa e prepara a defesa para ela.",
         ["Presença obrigatória do advogado", "Arguição de ilegalidades na prisão e na abordagem", "Pedido de liberdade e de medidas cautelares alternativas"],
         G + "tenho-audiencia-de-custodia-o-que-fazer.html", "urgencia"),
        ("fa-file-signature", "Habeas Corpus e liberdade", "Pedido de urgência",
         "Petição ao tribunal contra prisão ilegal e pedido de revogação da preventiva, com ou sem fiança.",
         ["HC liberatório e preventivo (salvo-conduto)", "Pedido de liminar no TJMG, STJ e STF", "Revogação da preventiva e medidas cautelares (arts. 312 e 321 do CPP)"],
         D + "habeas-corpus-guia-impetracao-liminar.html", "urgencia"),
    ]),
    ("Fase 2", "Investigação e processo", "Defesa técnica em cada etapa.", [
        ("fa-magnifying-glass", "Inquérito e intimações", "Antes da denúncia",
         "Agir na investigação pode evitar que ela vire processo. A defesa começa antes de qualquer acusação formal.",
         ["Acompanhamento em depoimentos", "Medidas contra mandado de busca ou prisão ilegal", "Produção de provas favoráveis e pedido de arquivamento"],
         G + "fui-intimado-para-depor-na-delegacia.html", "processo"),
        ("fa-folder-open", "Defesa no processo", "Prazo de 10 dias",
         "Da primeira resposta ao MP até as alegações finais, com foco em provas, testemunhas e nulidades.",
         ["Resposta à acusação no prazo legal", "Arguição de nulidades e de provas ilícitas", "Preparação do cliente e das testemunhas para a audiência"],
         D + "audiencia-instrucao.html", "processo"),
        ("fa-scale-balanced", "Tribunal do Júri", "Da pronúncia ao plenário",
         "Defesa em crimes dolosos contra a vida, com estratégia própria para cada fase do procedimento.",
         ["Recurso contra a pronúncia", "Preparação do réu e das testemunhas", "Sustentação oral perante os jurados"],
         D + "defesa-tribunal-do-juri-guia-completo.html", "processo"),
    ]),
    ("Fase 3", "Temas sensíveis e depois da sentença", "Do mérito ao cumprimento da pena.", [
        ("fa-pills", "Lei de Drogas", "Uso ou tráfico: a prova decide",
         "A diferença entre uso e tráfico costuma estar na forma como a prova foi colhida e na tese apresentada.",
         ["Desclassificação de tráfico para uso", "Tráfico privilegiado e redução de pena", "Nulidade de busca e de abordagem policial"],
         D + "trafico-de-drogas-defesa-desclassificacao-privilegiado.html", "processo"),
        ("fa-shield-halved", "Maria da Penha e medidas protetivas", "Defesa desde o início",
         "Defesa de quem foi acusado ou recebeu medida protetiva, com cuidado com prazos e com o risco de descumprimento.",
         ["Defesa na medida protetiva e na audiência", "Orientação para evitar prisão por descumprimento", "Análise das provas e garantia do contraditório"],
         D + "lei-maria-da-penha-defesa-medida-protetiva.html", "processo"),
        ("fa-arrow-trend-up", "Recursos e execução penal", "Progressão, remição, benefícios",
         "Depois da sentença ainda há caminhos: recursos aos tribunais e, no cumprimento da pena, o acompanhamento no SEEU.",
         ["Apelação e recursos aos tribunais superiores, conforme o caso", "Cálculo e pedido de progressão de regime e remição", "Livramento condicional e saída temporária"],
         D + "advocacia-execucao-penal-estrategia-defesa.html", "busca"),
    ]),
]

CIDADES = [("sabara", "Sabará"), ("belohorizonte", "Belo Horizonte"), ("contagem", "Contagem"), ("betim", "Betim"),
           ("santaluzia", "Santa Luzia"), ("neves", "Ribeirão das Neves"), ("vespasiano", "Vespasiano"), ("lagoasanta", "Lagoa Santa")]

FAQ = [
    ("Quanto custa contratar um advogado criminal?",
     "Os honorários dependem da complexidade do caso, da fase processual e de haver urgência de plantão (madrugada ou feriado). Seguimos a tabela da OAB/MG como piso, e toda análise começa com uma conversa transparente sobre valores e formas de pagamento."),
    ("O que fazer se alguém for preso às 2h da manhã?",
     "Não espere amanhecer. Acione o plantão 24h pela Central do Caso, pelo telefone ou pelo WhatsApp. Oriente a pessoa presa a exercer o direito ao silêncio e a não assinar nada sem a presença do advogado."),
    ("O Habeas Corpus consegue soltar uma pessoa presa em quanto tempo?",
     "Quando há pedido de liminar, por urgência, o relator no tribunal pode analisá-lo em poucos dias. O resultado depende dos fundamentos da prisão e das provas do caso; não é possível garantir soltura."),
    ("Dá para ser atendido por WhatsApp ou só presencialmente?",
     "Das duas formas. O escritório atua presencialmente nas delegacias de Sabará e Belo Horizonte e, no Juízo 100% Digital, assina procurações por celular e acompanha processos de qualquer cidade."),
]

SERV_LD = []
for _, _, _, cards in FASES:
    for ic, t, tag, resumo, ent, guia, modo in cards:
        SERV_LD.append({"@type": "Offer", "itemOffered": {"@type": "Service", "name": t, "description": resumo, "url": "https://lucassemim.adv.br/" + guia}})
LD = [{
    "@context": "https://schema.org", "@type": "LegalService", "name": "Lucas Semim — Advocacia Criminal",
    "url": "https://lucassemim.adv.br/solucoes.html", "image": "https://lucassemim.adv.br/img/lucasrenansemimeadvogado.jpeg",
    "telephone": TEL, "areaServed": ["Sabará", "Belo Horizonte", "Região Metropolitana de Belo Horizonte"],
    "address": {"@type": "PostalAddress", "streetAddress": "Rua dos Timbiras, 3488 - Barro Preto", "addressLocality": "Belo Horizonte", "addressRegion": "MG", "postalCode": "30140-062", "addressCountry": "BR"},
    "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Soluções de defesa criminal", "itemListElement": SERV_LD}
}, {
    "@context": "https://schema.org", "@type": "FAQPage",
    "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]
}]
ld_html = "\n".join('    <script type="application/ld+json">\n' + json.dumps(x, ensure_ascii=False, indent=1) + '\n    </script>' for x in LD)


def card(c):
    ic, t, tag, resumo, ent, guia, modo = c
    lis = "".join(f'<li><i class="fas fa-check" aria-hidden="true"></i><span>{E(x)}</span></li>' for x in ent)
    return (f'<article class="sol"><div class="sol__top"><span class="sol__ic"><i class="fas {ic}" aria-hidden="true"></i></span>'
            f'<span class="sol__tag">{E(tag)}</span></div><h3>{E(t)}</h3><p class="sol__r">{E(resumo)}</p>'
            f'<ul class="sol__l">{lis}</ul>'
            f'<div class="sol__f"><a class="sol__a" href="diagnostico.html?modo={modo}">Analisar o meu caso <i class="fas fa-arrow-right" aria-hidden="true"></i></a>'
            f'<a class="sol__g" href="{guia}">Ler o guia</a></div></article>')


fases_html = ""
for rot, nome, sub, cards in FASES:
    fases_html += (f'<div class="fase"><div class="fase__h"><span class="fase__n">{rot}</span><h3 class="fase__t">{E(nome)}</h3>'
                   f'<p class="fase__s">{E(sub)}</p></div><div class="sols">{"".join(card(c) for c in cards)}</div></div>')

cid_html = "".join(f'<a href="advogado-criminalista/{s}.html">{E(n)}</a>' for s, n in CIDADES)
faq_html = "".join(f'<details class="faq__i"><summary>{E(q)}</summary><p>{E(a)}</p></details>' for q, a in FAQ)

PAGE = r'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Soluções de Defesa Criminal em Sabará e BH | Dr. Lucas Semim</title>
    <meta name="description" content="Flagrante, custódia, habeas corpus, inquérito, processo, júri, drogas e execução penal: veja o que o escritório entrega e comece o diagnóstico gratuito. Plantão 24h.">
    <meta name="author" content="Dr. Lucas Renan Semim">
    <link rel="canonical" href="https://lucassemim.adv.br/solucoes.html">
    <link rel="icon" href="img/Favicon-lucassemim.png" type="image/png">

    <meta property="og:title" content="Soluções de Defesa Criminal — Dr. Lucas Semim | Plantão 24h">
    <meta property="og:description" content="Do flagrante ao recurso: o que o escritório entrega em cada fase do caso criminal. Diagnóstico gratuito e sigiloso. Sabará e Belo Horizonte/MG.">
    <meta property="og:image" content="https://lucassemim.adv.br/img/lucasrenansemimeadvogado.jpeg">
    <meta property="og:url" content="https://lucassemim.adv.br/solucoes.html">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="pt_BR">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Soluções de Defesa Criminal — Dr. Lucas Semim OAB/MG 222.539">
    <meta name="twitter:description" content="Do flagrante ao recurso, em Sabará e BH/MG. Plantão 24h e diagnóstico gratuito.">
    <meta name="twitter:image" content="https://lucassemim.adv.br/img/lucasrenansemimeadvogado.jpeg">
    <meta name="geo.region" content="BR-MG">
    <meta name="geo.placename" content="Sabará, Belo Horizonte, Minas Gerais">

<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NWBG9D4');</script>
<!-- End Google Tag Manager -->

%%LD%%

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,800;1,400&family=Lato:wght@300;400;700&family=Teko:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        :root{
            --ink:#060606; --ink-2:#0d0c0a; --ink-3:#15130f;
            --gold:#d4af37; --gold-hi:#f1dd8f; --red:#e5322d; --red-deep:#8b0000;
            --text:#e6e2d8; --muted:#a39d8d; --line:rgba(212,175,55,.22); --ease:cubic-bezier(.2,.7,.2,1);
        }
        html{scroll-behavior:smooth}
        body{background:var(--ink);color:var(--text);font-family:'Lato',sans-serif;overflow-x:hidden;padding-top:80px}
        ::selection{background:var(--gold);color:#000}
        a{color:inherit}
        .wrap{width:min(1180px,100% - 32px);margin-inline:auto}
        :focus-visible{outline:2px solid var(--gold);outline-offset:3px}
        .eyebrow{font:500 1.05rem/1 'Teko',sans-serif;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin:0 0 16px}
        .sec-h{font:700 clamp(1.9rem,3.6vw,2.7rem)/1.1 'Playfair Display',serif;color:#fff;margin:0 0 12px;text-wrap:balance}
        .sec-s{color:var(--muted);font-size:1.05rem;line-height:1.6;max-width:42em;margin:0 0 34px}
        .btn-g,.btn-o{display:inline-flex;align-items:center;gap:10px;padding:14px 26px;border-radius:4px;text-decoration:none;font:500 1.3rem/1 'Teko',sans-serif;letter-spacing:1.2px;text-transform:uppercase;transition:transform .25s var(--ease),box-shadow .25s,border-color .25s}
        .btn-g{background:linear-gradient(135deg,var(--gold-hi),var(--gold) 55%,#b8901f);color:#111;box-shadow:0 12px 34px rgba(212,175,55,.28)}
        .btn-g:hover{transform:translateY(-2px);color:#000;box-shadow:0 18px 44px rgba(212,175,55,.4)}
        .btn-o{border:1px solid rgba(255,255,255,.3);color:#fff;background:rgba(255,255,255,.04)}
        .btn-o:hover{border-color:var(--gold);color:var(--gold-hi);transform:translateY(-2px)}

        /* HERO */
        .hero{padding:60px 0 72px;border-bottom:1px solid var(--line);background:
            radial-gradient(55% 70% at 85% 20%,rgba(212,175,55,.13),transparent 70%),
            radial-gradient(40% 50% at 0% 100%,rgba(229,50,45,.13),transparent 70%),var(--ink)}
        .hero__grid{display:grid;grid-template-columns:1.2fr .8fr;gap:56px;align-items:center}
        .hero h1{font:800 clamp(2.5rem,5.6vw,4.4rem)/1.04 'Playfair Display',serif;color:#fff;margin:0 0 20px;text-wrap:balance}
        .hero h1 em{font-style:normal;color:var(--gold)}
        .hero__lead{font-size:1.14rem;line-height:1.65;color:#d6d1c4;max-width:34em;margin:0 0 28px}
        .hero__cta{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:26px}
        .chips{list-style:none;display:flex;flex-wrap:wrap;gap:8px;padding:0;margin:0}
        .chips li{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border:1px solid rgba(255,255,255,.16);border-radius:50px;font:700 .8rem/1 'Lato',sans-serif;letter-spacing:.4px;color:#e9e9e9;background:rgba(255,255,255,.05)}
        .chips i{color:var(--gold)}
        .painel{border:1px solid var(--line);border-radius:4px;background:linear-gradient(180deg,var(--ink-3),var(--ink-2));padding:26px 24px;box-shadow:0 30px 70px rgba(0,0,0,.6)}
        .painel h2{font:700 1.45rem/1.2 'Playfair Display',serif;color:#fff;margin:0 0 6px}
        .painel > p{color:var(--muted);font-size:.95rem;line-height:1.5;margin:0 0 18px}
        .painel a.p{display:flex;align-items:center;gap:14px;padding:14px 14px;margin-bottom:10px;border:1px solid var(--line);border-radius:3px;text-decoration:none;transition:border-color .25s,background .25s,transform .25s var(--ease)}
        .painel a.p:hover{border-color:var(--gold);background:#1a160d;transform:translateX(4px)}
        .painel a.p i.l{width:42px;height:42px;flex:0 0 42px;display:grid;place-items:center;border-radius:3px;background:rgba(212,175,55,.1);color:var(--gold);font-size:1.15rem}
        .painel a.p b{display:block;font:700 1.02rem/1.2 'Lato',sans-serif;color:#fff}
        .painel a.p small{display:block;color:var(--muted);font-size:.85rem;line-height:1.35;margin-top:2px}
        .painel a.p i.r{margin-left:auto;color:var(--gold);font-size:.9rem}
        .painel a.p.urg{border-color:rgba(139,0,0,.75);background:linear-gradient(180deg,#1a0b0b,#0f0808)}
        .painel a.p.urg i.l{background:rgba(229,50,45,.14);color:#ff6b5e}
        .painel .nota{margin:6px 0 0;font-size:.82rem;color:#7d7769;display:flex;gap:8px;align-items:center}

        /* SOLUÇÕES */
        .solucoes{padding:76px 0 40px}
        .fase{margin-bottom:46px}
        .fase__h{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 18px;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid var(--line)}
        .fase__n{font:500 1.05rem/1 'Teko',sans-serif;letter-spacing:3px;text-transform:uppercase;color:var(--gold)}
        .fase__t{font:700 1.55rem/1.15 'Playfair Display',serif;color:#fff;margin:0}
        .fase__s{margin:0 0 0 auto;color:var(--muted);font-style:italic;font-family:'Playfair Display',serif}
        .sols{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .sol{display:flex;flex-direction:column;padding:24px 22px 20px;border:1px solid var(--line);border-radius:3px;background:linear-gradient(180deg,var(--ink-3),var(--ink-2));transition:border-color .25s,transform .3s var(--ease)}
        .sol:hover{border-color:rgba(212,175,55,.6);transform:translateY(-4px)}
        .sol__top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}
        .sol__ic{width:48px;height:48px;display:grid;place-items:center;border-radius:3px;background:rgba(212,175,55,.1);border:1px solid var(--line);color:var(--gold);font-size:1.25rem}
        .sol__tag{font:500 .95rem/1.15 'Teko',sans-serif;letter-spacing:1.2px;text-transform:uppercase;color:var(--gold-hi);border:1px solid var(--line);border-radius:2px;padding:5px 9px;text-align:right}
        .sol h3{font:700 1.3rem/1.2 'Playfair Display',serif;color:#fff;margin:0 0 8px}
        .sol__r{color:#bdb7a7;font-size:.96rem;line-height:1.55;margin:0 0 14px}
        .sol__l{list-style:none;padding:0;margin:0 0 18px;display:grid;gap:8px}
        .sol__l li{display:flex;gap:10px;font-size:.92rem;line-height:1.4;color:#d9d4c6}
        .sol__l i{color:var(--gold);font-size:.78rem;margin-top:.32em}
        .sol__f{margin-top:auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding-top:14px;border-top:1px solid rgba(255,255,255,.07)}
        .sol__a{font:500 1.15rem/1 'Teko',sans-serif;letter-spacing:1.2px;text-transform:uppercase;color:var(--gold);text-decoration:none}
        .sol__a i{margin-left:6px;font-size:.8em;transition:transform .25s var(--ease)}
        .sol__a:hover{color:var(--gold-hi)}
        .sol__a:hover i{transform:translateX(4px)}
        .sol__g{font-size:.88rem;color:var(--muted);text-decoration:underline;text-underline-offset:3px}
        .sol__g:hover{color:#fff}

        /* COMO FUNCIONA */
        .como{padding:60px 0;border-top:1px solid var(--line);background:var(--ink-2)}
        .passos{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;list-style:none;padding:0;margin:0 0 22px}
        .passos li{padding:24px 22px;border:1px solid var(--line);border-radius:3px;background:var(--ink)}
        .passos b{display:block;font:700 1.25rem/1.2 'Playfair Display',serif;color:#fff;margin:0 0 8px}
        .passos b span{font:500 1.05rem/1 'Teko',sans-serif;letter-spacing:2px;color:var(--gold);margin-right:8px}
        .passos p{margin:0;color:#bdb7a7;line-height:1.55;font-size:.97rem}
        .aviso{margin:0;font-size:.84rem;color:#8a8474;max-width:60em;line-height:1.6}

        /* ONDE + LIVRO */
        .duo{padding:64px 0;display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .bloco{padding:30px 28px;border:1px solid var(--line);border-radius:3px;background:linear-gradient(180deg,var(--ink-3),var(--ink-2))}
        .bloco h2{font:700 1.6rem/1.15 'Playfair Display',serif;color:#fff;margin:0 0 10px}
        .bloco p{color:#bdb7a7;line-height:1.6;margin:0 0 18px}
        .tags{display:flex;flex-wrap:wrap;gap:8px}
        .tags a{padding:8px 14px;border:1px solid var(--line);border-radius:50px;text-decoration:none;font-size:.9rem;color:#e9e9e9;transition:border-color .2s,color .2s,background .2s}
        .tags a:hover{border-color:var(--gold);color:var(--gold-hi);background:rgba(212,175,55,.08)}
        .tags a.all{border-color:var(--gold);color:var(--gold)}
        .bloco--livro{background:linear-gradient(135deg,#1b150a,#0d0c0a 70%);border-color:rgba(212,175,55,.4)}
        .bloco--livro .eyebrow{margin-bottom:10px}

        /* FAQ */
        .faq{padding:20px 0 70px}
        .faq__i{border-top:1px solid var(--line)}
        .faq__i:last-child{border-bottom:1px solid var(--line)}
        .faq__i summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;gap:16px;align-items:center;padding:20px 0;font:700 1.1rem/1.35 'Lato',sans-serif;color:#fff}
        .faq__i summary::-webkit-details-marker{display:none}
        .faq__i summary::after{content:"+";font:400 1.6rem/1 'Lato',sans-serif;color:var(--gold);transition:transform .25s var(--ease)}
        .faq__i[open] summary::after{transform:rotate(45deg)}
        .faq__i p{margin:0 0 22px;color:#bdb7a7;line-height:1.65;max-width:52em}

        /* CTA FINAL */
        .final{padding:80px 0 88px;text-align:center;border-top:1px solid var(--line);background:radial-gradient(60% 80% at 50% 0%,rgba(212,175,55,.1),transparent 70%),radial-gradient(50% 60% at 50% 100%,rgba(139,0,0,.16),transparent 70%)}
        .final h2{font:800 clamp(2rem,4.4vw,3.1rem)/1.08 'Playfair Display',serif;color:#fff;margin:0 auto 14px;max-width:18em;text-wrap:balance}
        .final h2 em{font-style:normal;color:var(--gold)}
        .final p{max-width:34em;margin:0 auto 28px;color:#cfc9ba;font-size:1.08rem;line-height:1.65}
        .final .hero__cta{justify-content:center;margin:0}
        .final .aviso{margin:40px auto 0;text-align:center}

        .btn-whatsapp-float{position:fixed;bottom:30px;right:30px;background:#25D366;color:#fff;width:60px;height:60px;border-radius:50%;display:flex;justify-content:center;align-items:center;font-size:30px;box-shadow:0 4px 15px rgba(0,0,0,.5);z-index:9998;text-decoration:none;animation:pulse-wa 2s infinite;transition:.3s}
        .btn-whatsapp-float:hover{transform:scale(1.1);color:#fff}
        @keyframes pulse-wa{0%{box-shadow:0 0 0 0 rgba(37,211,102,.6)}70%{box-shadow:0 0 0 15px rgba(37,211,102,0)}100%{box-shadow:0 0 0 0 rgba(37,211,102,0)}}

        @media(max-width:1020px){
            .hero__grid{grid-template-columns:1fr;gap:34px}
            .sols{grid-template-columns:1fr 1fr}
            .duo{grid-template-columns:1fr}
        }
        @media(max-width:760px){
            body{padding-top:72px}
            .hero{padding:34px 0 52px}
            .sols,.passos{grid-template-columns:1fr}
            .fase__s{margin-left:0;flex-basis:100%}
            .btn-g,.btn-o{width:100%;justify-content:center}
            .btn-whatsapp-float{bottom:84px;right:16px;width:54px;height:54px;font-size:27px}
        }
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}html{scroll-behavior:auto}}
    </style>
</head>
<body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NWBG9D4" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

    <!-- INJEÇÃO DA NAVBAR -->
    <div id="header-master-injecao"></div>

    <main>
        <!-- ═══ HERO ═══ -->
        <section class="hero" aria-labelledby="h-hero">
            <div class="wrap hero__grid">
                <div>
                    <p class="eyebrow">Soluções criminais · Sabará &amp; Belo Horizonte</p>
                    <h1 id="h-hero">Defesa criminal em <em>cada fase</em> do caso.</h1>
                    <p class="hero__lead">Do plantão na delegacia ao recurso depois da sentença: veja, em poucas linhas, o que o escritório entrega — e comece pelo diagnóstico gratuito, que já aciona o advogado certo.</p>
                    <div class="hero__cta">
                        <a class="btn-g" href="diagnostico.html"><i class="fas fa-clipboard-check"></i> Fazer o diagnóstico grátis</a>
                        <a class="btn-o" href="https://wa.me/%%WHATS%%?text=Ol%C3%A1%2C%20Dr.%20Lucas!%20Vim%20pelo%20site%20e%20preciso%20de%20ajuda%20criminal." target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Plantão 24h</a>
                    </div>
                    <ul class="chips">
                        <li><i class="fas fa-clock"></i> Plantão 24h</li>
                        <li><i class="fas fa-location-dot"></i> Delegacias de Sabará e BH</li>
                        <li><i class="fas fa-lock"></i> Sigilo profissional</li>
                        <li><i class="fas fa-id-badge"></i> OAB/MG 222.539</li>
                    </ul>
                </div>
                <aside class="painel" aria-label="Comece pelo diagnóstico">
                    <h2>Comece pelo diagnóstico</h2>
                    <p>Gratuito e sigiloso. Você não precisa ter os documentos em mãos.</p>
                    <a class="p urg" href="diagnostico.html?modo=urgencia"><i class="l fas fa-triangle-exclamation"></i><span><b>Alguém foi preso agora</b><small>Aciona o plantão e orienta a família</small></span><i class="r fas fa-arrow-right"></i></a>
                    <a class="p" href="diagnostico.html?modo=processo"><i class="l fas fa-folder-open"></i><span><b>Tenho processo ou inquérito</b><small>Monte o caso e envie os documentos</small></span><i class="r fas fa-arrow-right"></i></a>
                    <a class="p" href="diagnostico.html?modo=busca"><i class="l fas fa-file-circle-question"></i><span><b>Não tenho os papéis</b><small>O escritório busca BO, REDS e dados do processo</small></span><i class="r fas fa-arrow-right"></i></a>
                </aside>
            </div>
        </section>

        <!-- ═══ SOLUÇÕES ═══ -->
        <section class="solucoes" aria-labelledby="h-sol">
            <div class="wrap">
                <p class="eyebrow">O que entregamos</p>
                <h2 class="sec-h" id="h-sol">Nove soluções, na ordem em que o caso acontece.</h2>
                <p class="sec-s">Cada cartão mostra o que o advogado faz naquela fase. Para entender o assunto com calma, abra o guia; para tratar do seu caso, comece o diagnóstico.</p>
                %%FASES%%
            </div>
        </section>

        <!-- ═══ COMO FUNCIONA ═══ -->
        <section class="como" aria-labelledby="h-como">
            <div class="wrap">
                <p class="eyebrow">Como funciona</p>
                <h2 class="sec-h" id="h-como">Três passos, sem burocracia.</h2>
                <ol class="passos">
                    <li><b><span>01</span>Diagnóstico</b><p>Você conta a situação na Central do Caso, de graça e em sigilo. Se há urgência, o plantão é acionado na hora.</p></li>
                    <li><b><span>02</span>Análise do advogado</b><p>O Dr. Lucas lê o caso, confere prazos e documentos e entra em contato pelo WhatsApp.</p></li>
                    <li><b><span>03</span>Estratégia e atuação</b><p>Você recebe o plano de defesa e as condições de honorários antes de decidir contratar.</p></li>
                </ol>
                <p class="aviso">Nenhum resultado pode ser garantido: ele depende das provas, da fase do processo e das decisões da Justiça. Conteúdo informativo, conforme o Provimento 205/2021 do Conselho Federal da OAB.</p>
            </div>
        </section>

        <!-- ═══ ONDE ATUAMOS + LIVRO ═══ -->
        <div class="wrap duo">
            <section class="bloco" aria-labelledby="h-onde">
                <p class="eyebrow">Onde atuamos</p>
                <h2 id="h-onde">Presença nas delegacias e fóruns da região.</h2>
                <p>Base em Sabará e atuação em Belo Horizonte e na Região Metropolitana. Fora dela, o Juízo 100% Digital permite assinar procuração por celular e acompanhar o processo à distância.</p>
                <div class="tags">%%CIDADES%%<a class="all" href="advogado-criminalista/index.html">Todas as cidades →</a></div>
            </section>
            <section class="bloco bloco--livro" aria-labelledby="h-livro">
                <p class="eyebrow">Para ler antes de decidir</p>
                <h2 id="h-livro">O Livro da Defesa Criminal</h2>
                <p>Mais de 200 páginas do site reunidas em um só volume: guias de urgência, teses técnicas, comarcas atendidas e atualidades. Tudo explicado para quem não é do Direito.</p>
                <div class="tags">
                    <a href="artigos.html#parte-1">Guias de urgência</a>
                    <a href="artigos.html#parte-2">Teses</a>
                    <a href="artigos.html#parte-3">Comarcas</a>
                    <a class="all" href="artigos.html">Abrir o livro →</a>
                </div>
            </section>
        </div>

        <!-- ═══ FAQ ═══ -->
        <section class="faq" aria-labelledby="h-faq">
            <div class="wrap">
                <p class="eyebrow">Dúvidas frequentes</p>
                <h2 class="sec-h" id="h-faq">O que as famílias mais perguntam.</h2>
                <div style="margin-top:26px">%%FAQ%%</div>
            </div>
        </section>

        <!-- ═══ CTA FINAL ═══ -->
        <section class="final">
            <div class="wrap">
                <h2>Não sabe qual é o seu caso? <em>O diagnóstico responde.</em></h2>
                <p>Conte a situação com as suas palavras. O advogado lê, confere os prazos e retorna pelo WhatsApp.</p>
                <div class="hero__cta">
                    <a class="btn-g" href="diagnostico.html"><i class="fas fa-clipboard-check"></i> Fazer o diagnóstico grátis</a>
                    <a class="btn-o" href="tel:%%TEL%%"><i class="fas fa-phone"></i> %%TELFMT%%</a>
                </div>
                <p class="aviso">Dr. Lucas Renan Semim — OAB/MG 222.539 · Rua dos Timbiras, 3488, Barro Preto, Belo Horizonte/MG · Atendimento em Sabará e Belo Horizonte.</p>
            </div>
        </section>
    </main>

    <div id="footer-master-injecao"></div>

    <a href="https://wa.me/%%WHATS%%?text=Ol%C3%A1%20Dr.%20Lucas%2C%20vim%20do%20site%20e%20preciso%20de%20ajuda%20criminal%20urgente." class="btn-whatsapp-float" id="float-wpp" target="_blank" rel="noopener noreferrer" aria-label="Plantão Criminal 24h — WhatsApp"><i class="fab fa-whatsapp"></i></a>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/ai-neural-seo.js"></script>
    <script src="js/ads-intelligence.js"></script>
    <script src="js/lgpd.js"></script>
    <script src="js/tradutor-global.js"></script>
    <script src="js/vlibras-plugin.js"></script>
    <script src="js/vcard-smart.js"></script>
    <script src="js/diagnostico.js"></script>
    <script src="js/header-elite.js"></script>
    <script src="js/footer-seo.js"></script>
    <script src="js/chat-elite.js"></script>
    <script src="js/smart-cta.js"></script>
</body>
</html>
'''
for k, v in {"%%LD%%": ld_html, "%%FASES%%": fases_html, "%%CIDADES%%": cid_html, "%%FAQ%%": faq_html,
             "%%WHATS%%": WHATS, "%%TEL%%": TEL, "%%TELFMT%%": TEL_FMT}.items():
    PAGE = PAGE.replace(k, v)
open(OUT, "w", encoding="utf8").write(PAGE)
print("OK", OUT, len(PAGE), "bytes")
