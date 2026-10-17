# -*- coding: utf-8 -*-
"""
AGENTE 2 — REDATOR
Lê o briefing do Pesquisador e escreve o artigo completo, já no padrão visual do site
(fundo preto e dourado, cabeçalho/rodapé do site entrando pelos scripts, JSON-LD, FAQ, CTA).
Usa o combo auto/legal-writer do OmniRoute.

Diferenças importantes em relação à versão antiga:
- Não usa mais str.format (o CSS com chaves quebrava tudo): troca de <<CHAVES>>.
- Pede a resposta por marcadores (===TITULO===, ===HTML===...), bem mais confiável que JSON com HTML dentro.
- O HTML que a IA devolve passa por sanitização (sem script/iframe/eventos) e por verificação de ética.
- Telefone/WhatsApp vêm do config.py (uma fonte só).
"""
import datetime
import html as htmllib
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import compliance
import config
import omni_client
from util import console_utf8, extrair_blocos, extrair_json, gravar_json, ler_json, preencher, rodar_principal, slugify

ENTRADA = os.path.join(config.PASTA_AGENTES, "output_pesquisador.json")
SAIDA = os.path.join(config.PASTA_AGENTES, "output_redator.json")

CATEGORIAS_CRIMINAL = ["Flagrante e Custódia", "Prisão Preventiva", "Habeas Corpus", "Maria da Penha", "Tráfico de Drogas",
                       "Júri", "Execução Penal", "Trânsito", "Crimes Digitais", "Delegacia", "Outros"]
CATEGORIAS_CIVEL = ["Plano de Saúde", "Direito Bancário", "Acidentes de Trânsito", "Seguros e Indenização",
                    "Erro Médico", "Apostas (Bets)", "Usucapião e Imóveis", "Família e Sucessões",
                    "Contratos e Negócios", "Cobrança e Execução", "Blindagem Patrimonial", "Outros"]
CATEGORIAS = CATEGORIAS_CIVEL if config.AREA_CIVEL else CATEGORIAS_CRIMINAL
MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro",
         "outubro", "novembro", "dezembro"]

LINKS_FIXOS_CRIMINAL = [
    ("/advogado-criminalista/sabara.html", "Advogado criminalista em Sabará"),
    ("/advogado-criminalista/belohorizonte.html", "Advogado criminalista em Belo Horizonte"),
    ("/o-que-fazer-agora/acabei-de-ser-preso-em-flagrante.html", "Acabei de ser preso em flagrante: o que fazer agora"),
    ("/emergencia.html", "Atendimento de urgência criminal"),
]
LINKS_FIXOS_CIVEL = [
    ("/civel/", "Direito Cível — Advocacia Patrimonial"),
    ("/civel/reajuste-plano-saude-civel.html", "Reajuste abusivo do plano de saúde"),
    ("/civel/bancario-juros.html", "Juros bancários abusivos"),
    ("/civel/erro-medico.html", "Erro médico: direitos e indenização"),
    ("/civel/acidentes-transito.html", "Acidentes de trânsito: indenização"),
    ("/civel/usucapiao-civel.html", "Usucapião: como regularizar o imóvel"),
]
LINKS_FIXOS = LINKS_FIXOS_CIVEL if config.AREA_CIVEL else LINKS_FIXOS_CRIMINAL

# ─── TEMPLATE DA PÁGINA ──────────────────────────────────────────────────────
# Os <<TOKENS>> são trocados por str.replace (seguro com CSS e JSON dentro do texto).
TEMPLATE_ARTIGO = r'''<!DOCTYPE html>
<html lang="pt-BR" prefix="og: https://ogp.me/ns#">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><<TITULO_TAG>></title>
    <meta name="description" content="<<META>>">
    <meta name="keywords" content="<<KEYWORDS>>">
    <meta name="author" content="<<ADVOGADO>>">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="<<URL>>">
    <link rel="icon" href="<<ICON>>" type="image/png">

    <meta property="og:title" content="<<TITULO_ATTR>>">
    <meta property="og:description" content="<<META>>">
    <meta property="og:url" content="<<URL>>">
    <meta property="og:type" content="article">
    <meta property="og:locale" content="pt_BR">
    <meta property="og:site_name" content="<<ESCRITORIO>>">
    <meta property="og:image" content="<<SITE>>/img/lucasrenansemimeadvogado.jpeg">
    <meta property="article:author" content="<<ADVOGADO>>">
    <meta property="article:published_time" content="<<DATA_ISO>>T10:00:00-03:00">
    <meta property="article:modified_time" content="<<DATA_ISO>>T10:00:00-03:00">
    <meta property="article:section" content="<<CATEGORIA>>">

    <script type="application/ld+json">
<<JSONLD>>
    </script>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,800;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Lato:wght@300;400;700&family=Teko:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        :root {
            --ink: #060606; --ink-2: #0d0c0a; --ink-3: #15130f;
            --gold: #d4af37; --gold-hi: #f1dd8f; --gold-deep: #8a6a10;
            --text: #e6e2d8; --muted: #a39d8d; --line: rgba(212,175,55,.22);
        }
        body { background: var(--ink); color: var(--text); font-family: 'Lato', sans-serif; line-height: 1.8; }
        .artigo-wrapper { max-width: 900px; margin: 0 auto; padding: 2rem 1.25rem 3rem; }
        .breadcrumb a { color: var(--gold); text-decoration: none; }
        .artigo-header h1 { font-family: 'Playfair Display', serif; font-size: clamp(1.9rem, 4vw, 2.7rem); font-weight: 800; color: #fff; margin: 1.1rem 0; line-height: 1.2; text-wrap: balance; }
        .artigo-meta { color: var(--muted); font-size: .95rem; border-bottom: 1px solid var(--line); padding-bottom: 1.25rem; margin-bottom: 1.75rem; display: flex; gap: .5rem 1.5rem; flex-wrap: wrap; }
        .artigo-meta b { color: var(--gold); }
        .artigo-corpo { font-family: 'Source Serif 4', Georgia, serif; font-size: 1.15rem; color: #d8d4c9; }
        .artigo-corpo h2 { font-family: 'Playfair Display', serif; color: var(--gold-hi); margin: 2.2rem 0 1rem; font-size: 1.65rem; border-left: 3px solid var(--gold); padding-left: .8rem; }
        .artigo-corpo h3 { color: #fff; margin: 1.5rem 0 .75rem; font-size: 1.3rem; }
        .artigo-corpo p { margin-bottom: 1.3rem; }
        .artigo-corpo a { color: var(--gold-hi); }
        .artigo-corpo blockquote { border-left: 3px solid var(--gold-deep); margin: 1.5rem 0; padding: .4rem 1.1rem; color: var(--muted); font-style: italic; }
        .artigo-corpo table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 1rem; }
        .artigo-corpo th, .artigo-corpo td { border: 1px solid var(--line); padding: .55rem .7rem; }
        .aviso-info { font-family: 'Lato', sans-serif; font-size: .92rem; color: var(--muted); border: 1px dashed var(--line); border-radius: 6px; padding: .8rem 1rem; margin-bottom: 1.5rem; }
        .destaque-box { background: rgba(212,175,55,.08); border: 1px solid var(--line); border-left: 4px solid var(--gold); padding: 1.1rem 1.4rem; border-radius: 4px; margin: 1.75rem 0; }
        .faq details { border-bottom: 1px solid var(--line); padding: .8rem 0; }
        .faq summary { cursor: pointer; font-weight: 700; color: #fff; }
        .cta-box { background: linear-gradient(135deg, #1b1308 0%, #120d05 100%); border: 1px solid var(--gold-deep); border-radius: 8px; padding: 1.75rem 1.5rem; margin: 2.5rem 0; text-align: center; font-family: 'Lato', sans-serif; }
        .cta-box h3 { color: var(--gold-hi); font-family: 'Playfair Display', serif; font-size: 1.5rem; margin: 0 0 .75rem; }
        .cta-box .fone { display: block; font-size: 1.5rem; font-weight: 700; color: #fff; text-decoration: none; margin: .5rem 0 1rem; }
        .btn-whatsapp-cta { background: #25D366; color: #fff; font-weight: 700; padding: .85rem 1.8rem; border-radius: 50px; display: inline-flex; align-items: center; gap: .6rem; text-decoration: none; transition: transform .2s, background .2s; }
        .btn-whatsapp-cta:hover { background: #1eb754; color: #fff; transform: scale(1.03); }
        .leia-tambem ul { padding-left: 1.1rem; }
        .rodape-artigo { font-family: 'Lato', sans-serif; color: var(--muted); font-size: .92rem; border-top: 1px solid var(--line); margin-top: 2rem; padding-top: 1rem; }
        mark { background: #7a5b00; color: #fff; padding: 0 .2em; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
    </style>
</head>
<body>
    <div class="artigo-wrapper">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="/">Início</a></li>
                <li class="breadcrumb-item"><a href="<<URL_AREA>>"><<NOME_AREA>></a></li>
                <li class="breadcrumb-item active text-muted" aria-current="page"><<CATEGORIA>></li>
            </ol>
        </nav>

        <header class="artigo-header">
            <h1><<H1>></h1>
            <div class="artigo-meta">
                <span>Por: <b><<ADVOGADO>> (<<OAB>>)</b></span>
                <span>Publicado em: <time datetime="<<DATA_ISO>>"><<DATA_BR>></time></span>
                <span>Leitura: <b><<TEMPO>> min</b></span>
            </div>
        </header>

        <main class="artigo-corpo" id="conteudo">
            <aside class="aviso-info">Conteúdo informativo, sem caráter de consulta jurídica. Cada caso tem particularidades e não há garantia de resultado: procure um advogado de confiança para analisar a sua situação.</aside>

            <div class="destaque-box"><strong>Resumo:</strong> <<RESUMO>></div>

<!--ARTIGO-INICIO-->
<<CONTEUDO>>

<<FAQ>>
<!--ARTIGO-FIM-->

            <section class="cta-box" aria-label="Contato">
                <h3>Precisa de orientação jurídica sobre o seu caso?</h3>
                <p><<FRASE_ATUACAO>></p>
                <a class="fone" href="<<TEL_URL>>"><<TELEFONE>></a>
                <a href="<<WHATSAPP_URL>>?text=Ol%C3%A1%2C%20Dr.%20Lucas.%20Li%20o%20artigo%20no%20site%20e%20preciso%20de%20orienta%C3%A7%C3%A3o." class="btn-whatsapp-cta" target="_blank" rel="noopener">
                    <i class="fab fa-whatsapp"></i> Falar com o Dr. Lucas pelo WhatsApp
                </a>
            </section>

<<LEIA_TAMBEM>>

            <div class="rodape-artigo">
                <div><<TAGS_HTML>></div>
                <p class="mb-0"><small><<ADVOGADO>> — <<OAB>> — <<FRASE_RODAPE>></small></p>
            </div>
        </main>
    </div>

    </body>

    <!--SCRIPTS-RODAPE-->
</html>
'''

REGRAS_REDACAO = """REGRAS OBRIGATÓRIAS (o texto vai ao ar com o nome e a OAB de um advogado):
- Você NÃO tem acesso à internet. NÃO invente notícias, datas, números de processo, nomes, endereços, telefones,
  súmulas, temas de repercussão geral ou julgados. Cite só o que você tem CERTEZA que existe (ex.: art. 312 do CPP).
  Se não tiver certeza do número, escreva de forma geral e coloque [CONFERIR] ao lado.
- NÃO prometa nem sugira resultado ("garantimos", "vamos soltar", "100%"). NÃO cite preço, desconto, gratuidade.
  NÃO compare com outros advogados. NÃO use depoimento de cliente. NÃO use tom alarmista.
- NÃO escreva "hoje", "ontem", "recentemente" nem "novidade": o texto tem que continuar certo por anos.
- Não escreva telefone, WhatsApp, e-mail ou endereço no texto (o site já coloca o contato no lugar certo).
- Linguagem clara para quem não é da área, com precisão técnica. Parágrafos curtos."""


# ─── FUNÇÕES AUXILIARES ──────────────────────────────────────────────────────
def data_br(d):
    return "%02d de %s de %d" % (d.day, MESES[d.month - 1], d.year)


def versao_do_site():
    """Carimbo ?v= em uso no site (lido do sw.js/index.html) para a página nova usar o mesmo cache."""
    for rel, padrao in (("index.html", r"\?v=(\d{8})"), ("sw.js", r"v=(\d{8})")):
        try:
            with open(os.path.join(config.SITE_DIR, rel), encoding="utf-8", errors="ignore") as f:
                achados = re.findall(padrao, f.read())
            if achados:
                return max(set(achados), key=achados.count)
        except OSError:
            continue
    return datetime.date.today().strftime("%Y%m%d")


def _titulo_da_pagina(caminho):
    try:
        with open(caminho, encoding="utf-8", errors="ignore") as f:
            m = re.search(r"<title>(.*?)</title>", f.read(6000), flags=re.S | re.I)
        if m:
            t = htmllib.unescape(re.sub(r"\s+", " ", m.group(1))).strip()
            return re.split(r"\s+[|—–]\s+(?:Dr\.|Lucas|Semim)", t)[0].strip()[:90]
    except OSError:
        pass
    return None


def sugerir_links_relacionados(slug, tags, n=3):
    """Escolhe páginas REAIS do site relacionadas ao tema (por palavras em comum no nome do arquivo)."""
    palavras = {p for p in re.split(r"[^a-z0-9]+", slugify(" ".join([slug] + list(tags)))) if len(p) >= 4}
    candidatos = []
    if config.AREA_CIVEL:
        pastas = ["civel"]
    else:
        pastas = ["defesa-criminal", "o-que-fazer-agora"]
    for pasta in pastas:
        base = os.path.join(config.SITE_DIR, pasta)
        if not os.path.isdir(base):
            continue
        for nome in os.listdir(base):
            if not nome.endswith(".html") or nome == slug + ".html":
                continue
            pal_arq = {p for p in re.split(r"[^a-z0-9]+", nome[:-5]) if len(p) >= 4}
            pontos = len(palavras & pal_arq)
            if pontos:
                candidatos.append((pontos, "/%s/%s" % (pasta, nome), os.path.join(base, nome)))
    candidatos.sort(key=lambda x: (-x[0], x[1]))
    escolhidos = []
    for _, url, caminho in candidatos[:n]:
        escolhidos.append((url, _titulo_da_pagina(caminho) or url))
    for url, rotulo in LINKS_FIXOS:
        if len(escolhidos) >= n + 1:
            break
        if url not in [e[0] for e in escolhidos] and compliance.link_interno_existe(url):
            escolhidos.append((url, rotulo))
    return escolhidos


def montar_faq(pares):
    """pares: [(pergunta, resposta)] -> (html, lista para JSON-LD)"""
    itens, schema = [], []
    for pergunta, resposta in pares:
        p = htmllib.escape(pergunta.strip(), quote=False)
        r = htmllib.escape(resposta.strip(), quote=False)
        itens.append("<details><summary>%s</summary><p>%s</p></details>" % (p, r))
        schema.append({"@type": "Question", "name": pergunta.strip(),
                       "acceptedAnswer": {"@type": "Answer", "text": resposta.strip()}})
    if not itens:
        return "", []
    return '            <section class="faq"><h2>Perguntas frequentes</h2>\n            %s\n            </section>' % \
           "\n            ".join(itens), schema


def _ler_faq(texto):
    pares, pergunta = [], None
    for linha in (texto or "").splitlines():
        l = linha.strip()
        if re.match(r"^P\s*[:\-]", l, re.I):
            pergunta = re.sub(r"^P\s*[:\-]\s*", "", l, flags=re.I)
        elif re.match(r"^R\s*[:\-]", l, re.I) and pergunta:
            pares.append((pergunta, re.sub(r"^R\s*[:\-]\s*", "", l, flags=re.I)))
            pergunta = None
    return pares[:4]


def _cortar_meta(meta, limite=155):
    meta = re.sub(r"\s+", " ", meta.replace('"', "'")).strip()
    if len(meta) <= limite:
        return meta
    corte = meta[:limite - 1].rsplit(" ", 1)[0].rstrip(",;:-")
    return corte + "…"


def _jsonld(url, titulo, meta, categoria, tags, palavras, data_iso, faq_schema):
    e = config.ENDERECO
    nome_servico = ("Dr. Lucas Semim - Advocacia Cível e Patrimonial" if config.AREA_CIVEL
                    else "Dr. Lucas Semim - Advocacia Criminal Estratégica")
    grafo = [
        {"@type": "Article", "@id": url + "#artigo", "headline": titulo, "description": meta,
         "mainEntityOfPage": url, "url": url, "inLanguage": "pt-BR",
         "datePublished": data_iso, "dateModified": data_iso, "articleSection": categoria,
         "keywords": ", ".join(tags), "wordCount": palavras,
         "image": config.SITE_URL + "/img/lucasrenansemimeadvogado.jpeg",
         "author": {"@type": "Person", "name": config.ADVOGADO, "url": config.SITE_URL + "/sobre-mim.html"},
         "publisher": {"@id": config.SITE_URL + "/#LegalService"}},
        {"@type": "LegalService", "@id": config.SITE_URL + "/#LegalService",
        "name": nome_servico, "url": config.SITE_URL,
         "telephone": config.TELEFONE_E164,
         "address": {"@type": "PostalAddress", "streetAddress": e["rua"], "addressLocality": e["cidade"],
                     "addressRegion": e["uf"], "postalCode": e["cep"], "addressCountry": "BR"},
         "areaServed": ["Sabará", "Belo Horizonte", "Região Metropolitana de Belo Horizonte"]},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Início", "item": config.SITE_URL + "/"},
            {"@type": "ListItem", "position": 2, "name": "Direito Cível" if config.AREA_CIVEL else "Defesa Criminal",
             "item": config.SITE_URL + ("/civel/" if config.AREA_CIVEL else "/artigos.html")},
            {"@type": "ListItem", "position": 3, "name": titulo, "item": url}]},
    ]
    if faq_schema:
        grafo.append({"@type": "FAQPage", "mainEntity": faq_schema})
    texto = json.dumps({"@context": "https://schema.org", "@graph": grafo}, ensure_ascii=False, indent=2)
    return texto.replace("</", "<\\/")


def montar_pagina(d):
    """
    d: titulo, meta, categoria, tags, conteudo_html (já sanitizado), faq [(p, r)], slug, pasta, data (date)
    Retorna o HTML completo da página.
    """
    data = d.get("data") or datetime.date.today()
    url = "%s/%s/%s.html" % (config.SITE_URL, d["pasta"], d["slug"])
    titulo = d["titulo"]
    tag_titulo = titulo if len(titulo) + 18 > 70 else titulo + " | Dr. Lucas Semim"
    faq_html, faq_schema = montar_faq(d.get("faq", []))
    palavras = compliance.contar_palavras(d["conteudo_html"])
    tempo = max(1, round(palavras / 200))
    leia = ""
    rel = sugerir_links_relacionados(d["slug"], d.get("tags", []))
    if rel:
        itens = "".join('<li><a href="%s">%s</a></li>' % (u, htmllib.escape(r, quote=False)) for u, r in rel)
        leia = '            <section class="leia-tambem"><h2>Leia também</h2><ul>%s</ul></section>' % itens
    if config.AREA_CIVEL:
        url_area, nome_area = config.SITE_URL + "/civel/", "Direito Cível"
        frase_atuacao = "Advocacia cível e patrimonial em Sabará, Belo Horizonte e região."
        frase_rodape = "Advocacia Cível e Patrimonial em Sabará e Belo Horizonte/MG."
    else:
        url_area, nome_area = config.SITE_URL + "/artigos.html", "Defesa Criminal"
        frase_atuacao = "Atendimento de urgência criminal em Sabará, Belo Horizonte e região."
        frase_rodape = "Advocacia Criminal em Sabará e Belo Horizonte/MG."
    tags_html = " ".join('<span class="badge bg-dark text-warning me-1">#%s</span>' % htmllib.escape(t, quote=False)
                         for t in d.get("tags", []))
    resumo = htmllib.escape(d["meta"], quote=False)
    corpo = "\n".join("            " + l if l.strip() else l for l in d["conteudo_html"].splitlines())
    pagina = preencher(
        TEMPLATE_ARTIGO,
        titulo_tag=htmllib.escape(tag_titulo, quote=False), titulo_attr=htmllib.escape(titulo, quote=True),
        h1=htmllib.escape(titulo, quote=False), meta=htmllib.escape(d["meta"], quote=True),
        keywords=htmllib.escape(", ".join(d.get("tags", [])), quote=True), advogado=config.ADVOGADO,
        escritorio=config.NOME_ESCRITORIO, url=url, site=config.SITE_URL, data_iso=data.isoformat(),
        data_br=data_br(data), tempo=tempo, categoria=htmllib.escape(d.get("categoria", "Outros"), quote=False),
        jsonld=_jsonld(url, titulo, d["meta"], d.get("categoria", "Outros"), d.get("tags", []), palavras,
                       data.isoformat(), faq_schema),
        resumo=resumo, conteudo=corpo, faq=faq_html, leia_tambem=leia, tags_html=tags_html, oab=config.OAB,
        telefone=config.TELEFONE, tel_url=config.TELEFONE_TEL, whatsapp_url=config.WHATSAPP_URL,
        icon=("/civel/img/favicon-lucassemim.png" if config.AREA_CIVEL else "/Favicon-lucassemim.png"),
        versao=versao_do_site(), url_area=url_area, nome_area=nome_area,
        frase_atuacao=frase_atuacao, frase_rodape=frase_rodape)
    # scripts do rodapé: o cível usa o seu próprio pacote (codeleicivel); o criminal usa o da raiz
    if config.AREA_CIVEL:
        scripts = (
            '    <script src="<<SITE>>/codeleicivel/civel-analytics.js?v=<<VERSAO>>"></script>\n'
            '    <script src="<<SITE>>/codeleicivel/civel-footer.js?v=<<VERSAO>>"></script>\n'
            '    <script src="<<SITE>>/codeleicivel/structure.js?v=<<VERSAO>>" data-page="artigo"></script>\n'
        )
    else:
        scripts = (
            '    <script src="<<SITE>>/codelei/analytics.js?v=<<VERSAO>>"></script>\n'
            '    <script src="<<SITE>>/js/truth-shield.js?v=<<VERSAO>>"></script>\n'
            '    <script src="<<SITE>>/js/header-elite.js?v=<<VERSAO>>"></script>\n'
            '    <script src="<<SITE>>/js/footer-seo.js?v=<<VERSAO>>"></script>\n'
            '    <script src="<<SITE>>/js/google-ai-brain.js?v=<<VERSAO>>"></script>\n'
        )
    pagina = pagina.replace("<!--SCRIPTS-RODAPE-->", scripts.rstrip())
    # os scripts de rodapé entram com tokens crus; preenche-os também
    pagina = preencher(pagina, site=config.SITE_URL, versao=versao_do_site())
    # preencher() troca valor por valor; garante que nenhum <<TOKEN>> sobrou
    sobras = re.findall(r"<<[A-Z_]+>>", pagina)
    if sobras:
        raise RuntimeError("tokens do template sem valor: %s" % sorted(set(sobras)))
    return pagina


# ─── REDAÇÃO ─────────────────────────────────────────────────────────────────
def redigir_artigo(pauta, briefing, pasta=None):
    """Redige o artigo. Retorna dict pronto para o SEO/publicador."""
    pasta = pasta or (config.PASTA_PUBLICACAO_CIVEL if config.AREA_CIVEL else config.PASTA_PUBLICACAO)
    tipo = ("artigo URGENTE: curto e direto, 500 a 700 palavras" if pauta.get("urgente")
            else "artigo EXPLICATIVO: completo, 900 a 1400 palavras")
    if config.AREA_CIVEL:
        sobre = config.SOBRE_O_SITE_CIVEL
        papel = "advogado cível (Advocacia Patrimonial e Direito Civil) em Sabará/MG"
    else:
        sobre = config.SOBRE_O_SITE
        papel = "advogado criminalista em Sabará/MG"
    prompt = preencher("""Você é o redator do Dr. Lucas Renan Semim, <<PAPEL>>.

CONTEXTO DO SITE:
<<SOBRE>>

<<REGRAS>>

PAUTA:
Título sugerido: <<TITULO>>
Palavras-chave: <<PALAVRAS>>
Tipo: <<TIPO>>

BRIEFING DO PESQUISADOR:
<<BRIEFING>>

TAREFA: escreva o artigo COMPLETO. Responda usando EXATAMENTE estes marcadores, cada um sozinho na sua linha:

===TITULO===
(título final, até 65 caracteres, com a palavra-chave principal, sem prometer resultado)
===META===
(meta description entre 120 e 155 caracteres, sem aspas duplas)
===CATEGORIA===
(UMA destas: <<CATEGORIAS>>)
===TAGS===
(5 palavras-chave separadas por vírgula)
===HTML===
(corpo do artigo em HTML semântico)
===FAQ===
P: (pergunta que o leitor faria)
R: (resposta objetiva, até 60 palavras)
(3 a 4 pares P:/R:, cada linha começando com P: ou R:)

REGRAS DO ===HTML===:
- Comece com um parágrafo de 2 a 3 frases que já responde a dúvida principal do leitor.
- Use <h2> para as seções (mínimo 4) e <h3> quando precisar. Parágrafos em <p>, listas em <ul><li>, termos-chave em <strong>.
- Inclua uma seção "O que fazer agora" (lista de passos) e uma seção "Erros comuns".
- Inclua uma seção curta sobre como o tema aparece na prática em Sabará, Belo Horizonte e região, SEM inventar endereços,
   nomes de juízes/delegados nem números de telefone.
- Citações de lei em <blockquote> com <cite>, só se tiver certeza do texto.
- NÃO escreva <h1>, <html>, <head>, <body>, <script>, <style>, imagens ou links externos. Links internos só se forem do site.
- Termine com um parágrafo de conclusão que oriente o leitor a procurar um advogado de confiança (sem número de telefone).""",
                      sobre=sobre, papel=papel, regras=REGRAS_REDACAO, titulo=pauta["titulo"],
                      palavras=", ".join(pauta.get("palavras_chave", [])), tipo=tipo, briefing=briefing,
                      categorias=" | ".join(CATEGORIAS))
    ultimo_erro = None
    for tentativa in (1, 2):
        resposta = omni_client.chat(prompt, papel="redator")
        try:
            return processar_resposta(resposta, pauta, pasta)
        except ValueError as e:          # IA fugiu do formato: pede de novo uma vez
            ultimo_erro = e
            print("    ⚠️  Resposta fora do formato (tentativa %d/2): %s" % (tentativa, str(e)[:140]))
    raise ValueError("A IA não respeitou o formato do artigo duas vezes. %s" % ultimo_erro)


def processar_resposta(resposta, pauta, pasta=None):
    """Transforma a resposta da IA em artigo validado (separado para poder ser testado sem IA)."""
    pasta = pasta or (config.PASTA_PUBLICACAO_CIVEL if config.AREA_CIVEL else config.PASTA_PUBLICACAO)
    blocos = extrair_blocos(resposta, ["TITULO", "META", "CATEGORIA", "TAGS", "HTML", "FAQ"])
    if "HTML" not in blocos:
        # plano B: modelos que insistem em JSON
        try:
            j = extrair_json(resposta)
            blocos = {"TITULO": j.get("titulo_final") or j.get("titulo", ""), "META": j.get("meta_description", ""),
                      "CATEGORIA": j.get("categoria", "Outros"), "TAGS": ",".join(j.get("tags", [])),
                      "HTML": j.get("conteudo_html", ""), "FAQ": ""}
        except (ValueError, AttributeError):
            pass
    if not blocos.get("HTML"):
        raise ValueError("A IA não devolveu o bloco ===HTML===. Resposta recebida começa com: %r" % resposta[:160])

    titulo = re.sub(r"\s+", " ", blocos.get("TITULO") or pauta["titulo"]).strip(" \"'“”*#")[:110]
    meta = _cortar_meta(blocos.get("META") or "")
    categoria = blocos.get("CATEGORIA", "Outros").strip(" .*")
    if categoria not in CATEGORIAS:
        categoria = next((c for c in CATEGORIAS if c.lower() in categoria.lower()), "Outros")
    tags = [t.strip(" #.*") for t in re.split(r"[,;\n]", blocos.get("TAGS", "")) if t.strip(" #.*")][:6]
    if not tags:
        tags = pauta.get("palavras_chave", [])[:5]

    link_ok = lambda h: compliance.link_interno_existe(h)
    conteudo, info = compliance.sanitizar_html(blocos["HTML"], link_ok=link_ok)
    faq = _ler_faq(blocos.get("FAQ", ""))
    slug = slugify(titulo)
    if not meta:
        trecho = re.sub(r"<[^>]+>", " ", conteudo)
        meta = _cortar_meta(re.sub(r"\s+", " ", trecho).strip())

    pagina = montar_pagina({"titulo": titulo, "meta": meta, "categoria": categoria, "tags": tags,
                            "conteudo_html": conteudo, "faq": faq, "slug": slug, "pasta": pasta,
                            "data": datetime.date.today()})
    return {
        "html": pagina, "titulo": titulo, "slug": slug, "meta_description": meta, "tags": tags,
        "categoria": categoria, "nome_arquivo": slug + ".html", "pasta": pasta, "conteudo_html": conteudo,
        "faq": faq, "sanitizacao": info, "palavras": compliance.contar_palavras(conteudo),
        "modelo_usado": dict(omni_client.ultimo_uso),
    }


def main():
    console_utf8()
    if not os.path.exists(ENTRADA):
        print("❌ Rode o agente_pesquisador.py primeiro.")
        sys.exit(1)
    dados = ler_json(ENTRADA, {})
    pautas, briefings = dados["pautas"], dados["briefings"]
    artigos = []
    for i, (pauta, briefing) in enumerate(zip(pautas[:1], briefings)):
        print("✍️  Redigindo: %s" % pauta["titulo"])
        artigo = redigir_artigo(pauta, briefing)
        artigo["pauta_id"] = dados.get("pauta_id")
        artigos.append(artigo)
        print("  ✅ %s — %d palavras, %d KB" % (artigo["nome_arquivo"], artigo["palavras"], len(artigo["html"]) // 1024))
        if artigo["sanitizacao"]["tags_removidas"] or artigo["sanitizacao"]["links_removidos"]:
            print("  🧹 Limpeza: tags removidas %s; links removidos %s" %
                  (artigo["sanitizacao"]["tags_removidas"], artigo["sanitizacao"]["links_removidos"]))
    gravar_json(SAIDA, {"data": dados["data"], "artigos": artigos})
    print("💾 Salvo em output_redator.json")


if __name__ == "__main__":
    rodar_principal(main)
