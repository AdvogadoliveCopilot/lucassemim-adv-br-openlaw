# -*- coding: utf-8 -*-
"""Gera advogado-criminalista/index.html — "A Bússola": regiões de atendimento + quadro de atendimentos.
Uso: python3 build_bussola.py [saida.html]
Para incluir uma cidade/foto nova: edite CIDADES (e FOTOS) abaixo e rode de novo.
"""
import json, html, math, os, sys
from livro_data import WHATS, TEL, TEL_FMT

E = lambda s: html.escape(s, quote=True)
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "bussola.html")
BASE = "https://lucassemim.adv.br/"
LAT0, LON0 = -19.883, -43.806   # Sabará (sede / pivô da bússola)

# (chave, nome, página, lat, lon, texto, foto|None, rótulo(dx,dy,âncora))
CIDADES = [
    ("sabara", "Sabará", "sabara.html", LAT0, LON0,
     "Sede do escritório e base do plantão: a resposta mais rápida para flagrante e audiência de custódia.", None, (0, 30, "middle")),
    ("belohorizonte", "Belo Horizonte", "belohorizonte.html", -19.919, -43.939,
     "A capital: flagrante, audiência de custódia, habeas corpus e acompanhamento de processos em curso.", None, (0, -44, "middle", 1)),
    ("barreiro", "Barreiro (BH)", "barreiro.html", -19.976, -44.022,
     "A maior regional de BH, do flagrante ao recurso.", None, (12, 5, "start")),
    ("contagem", "Contagem", "contagem.html", -19.932, -44.054,
     "Atendimento na 1ª Delegacia de Polícia Civil de Contagem e acompanhamento dos processos da comarca.", "contagem", (-30, -30, "end", 1)),
    ("betim", "Betim", "betim.html", -19.968, -44.198,
     "Plantão na Delegacia Regional de Betim e atuação nas audiências da comarca.", "betim", (-12, 5, "end")),
    ("ibirite", "Ibirité", "ibirite.html", -20.022, -44.058,
     "Atendimento direto para quem precisa na regional oeste.", None, (-12, 5, "end")),
    ("igarape", "Igarapé", "igarape.html", -20.070, -44.301,
     "Cobertura para o município e para a região vizinha.", None, (0, 26, "middle")),
    ("brumadinho", "Brumadinho", "brumadinho.html", -20.143, -44.200,
     "Atuação criminal local: flagrante, custódia e habeas corpus.", None, (0, 26, "middle")),
    ("esmeraldas", "Esmeraldas", "esmeraldas.html", -19.763, -44.314,
     "Defesa técnica próxima de quem precisa, na hora certa.", None, (0, 26, "middle")),
    ("neves", "Ribeirão das Neves", "neves.html", -19.767, -44.087,
     "Cobertura do flagrante à execução penal.", None, (-12, 5, "end")),
    ("pedroleopoldo", "Pedro Leopoldo", "pedroleopoldo.html", -19.619, -44.043,
     "Atendimento no Plantão Digital de Pedro Leopoldo e atuação na comarca.", "pedroleopoldo", (-12, -2, "end")),
    ("setelagoas", "Sete Lagoas", None, -19.466, -44.247,
     "Também atendemos na Delegacia de Polícia de Sete Lagoas. Atuação sob demanda: fale com o plantão.", "setelagoas", (-14, 4, "end")),
    ("lagoasanta", "Lagoa Santa", "lagoasanta.html", -19.628, -43.896,
     "Atuação criminal para flagrante e para processos já em curso.", None, (-12, -10, "end")),
    ("saojosedalapa", "São José da Lapa", "saojosedalapa.html", -19.697, -43.957,
     "Defesa técnica imediata para a comunidade local.", None, (-12, 12, "end")),
    ("vespasiano", "Vespasiano", "vespasiano.html", -19.693, -43.923,
     "Presença na cidade e nos distritos vizinhos.", None, (12, 0, "start")),
    ("santaluzia", "Santa Luzia", "santaluzia.html", -19.770, -43.851,
     "Resposta rápida para flagrante em toda a regional norte.", None, (12, 4, "start")),
    ("caete", "Caeté", "caete.html", -19.900, -43.670,
     "Presença na região histórica e nos municípios vizinhos.", None, (0, 26, "middle")),
    ("novalima", "Nova Lima", "novalima.html", -19.985, -43.847,
     "Atuação criminal para toda a região sul da Grande BH.", None, (0, 26, "middle")),
]

# fotos do quadro: arquivo, cidade (chave p/ ligar ao mapa) ou None, local, legenda, rotação
FOTOS = {
    "betim": ("betim-plantao-delegacia-regional.jpg", "Betim", "Plantão da Delegacia Regional de Betim"),
    "contagem": ("contagem-1-delegacia-policia-civil.jpg", "Contagem", "1ª Delegacia de Polícia Civil de Contagem"),
    "pedroleopoldo": ("pedro-leopoldo-plantao-digital.jpg", "Pedro Leopoldo", "Plantão Digital de Pedro Leopoldo"),
    "setelagoas": ("sete-lagoas-delegacia-de-policia.jpg", "Sete Lagoas", "Delegacia de Polícia de Sete Lagoas"),
    "reds": ("atendimento-reds-policia-civil.jpg", "Registro de ocorrência", "Atendimento de REDS · Polícia Civil de MG"),
}
MURAL = ["betim", "contagem", "reds", "pedroleopoldo", "setelagoas"]   # ordem no quadro
ROT = {"betim": -1.6, "contagem": 1.2, "reds": -0.8, "pedroleopoldo": 1.5, "setelagoas": -1.1}

VENTOS = ["Norte", "Nordeste", "Leste", "Sudeste", "Sul", "Sudoeste", "Oeste", "Noroeste"]
RUMO_ORDEM = ["Norte", "Noroeste", "Oeste", "Sudoeste", "Sul", "Leste"]

CX = CY = 380
RMAX, DMAX = 270, 70


def geo(lat, lon):
    dx = (lon - LON0) * math.cos(math.radians(LAT0)) * 111.32
    dy = (lat - LAT0) * 110.57
    d = math.hypot(dx, dy)
    b = (math.degrees(math.atan2(dx, dy)) + 360) % 360
    r = RMAX * math.sqrt(d / DMAX)
    a = math.radians(b)
    return d, b, r, CX + r * math.sin(a), CY - r * math.cos(a)


DATA = []
for key, nome, pag, lat, lon, txt, foto, lab in CIDADES:
    d, b, r, x, y = geo(lat, lon)
    DATA.append({"k": key, "n": nome, "u": ("advogado-criminalista/" + pag) if pag else None, "t": txt,
                 "d": round(d), "b": round(b, 1), "r": round(r, 1), "x": round(x, 1), "y": round(y, 1),
                 "rumo": VENTOS[int(((b + 22.5) % 360) // 45)], "f": FOTOS[foto][0] if foto else None,
                 "fc": FOTOS[foto][2] if foto else None, "l": list(lab)})
BYKEY = {c["k"]: c for c in DATA}

# ------------------------------------------------------------ SVG da bússola
def ticks():
    out = []
    for deg in range(0, 360, 5):
        a = math.radians(deg)
        big = deg % 45 == 0
        mid = deg % 15 == 0
        r1, r2 = (346, 318) if big else (346, 328) if mid else (346, 336)
        out.append(f'<line x1="{CX + r1 * math.sin(a):.1f}" y1="{CY - r1 * math.cos(a):.1f}" x2="{CX + r2 * math.sin(a):.1f}" y2="{CY - r2 * math.cos(a):.1f}" '
                   f'stroke="#d4af37" stroke-opacity="{.95 if big else .55 if mid else .3}" stroke-width="{2.4 if big else 1.4 if mid else 1}"/>')
    return "".join(out)


def cardinais():
    out = []
    for lab, deg, big in (("N", 0, 1), ("L", 90, 1), ("S", 180, 1), ("O", 270, 1), ("NE", 45, 0), ("SE", 135, 0), ("SO", 225, 0), ("NO", 315, 0)):
        a = math.radians(deg)
        r = 296 if big else 300
        fs = 30 if big else 15
        fill = "#e5322d" if lab == "N" else "#f1dd8f" if big else "#a39d8d"
        out.append(f'<text x="{CX + r * math.sin(a):.1f}" y="{CY - r * math.cos(a) + fs * .36:.1f}" text-anchor="middle" font-family="Teko,sans-serif" '
                   f'font-weight="600" font-size="{fs}" letter-spacing="1" fill="{fill}">{lab}</text>')
    return "".join(out)


def aneis():
    out = []
    for km in (10, 25, 50):
        r = RMAX * math.sqrt(km / DMAX)
        out.append(f'<circle cx="{CX}" cy="{CY}" r="{r:.1f}" fill="none" stroke="#d4af37" stroke-opacity=".22" stroke-dasharray="3 7"/>')
        out.append(f'<text x="{CX + 5}" y="{CY - r + 15:.1f}" font-family="Lato,sans-serif" font-size="12" fill="#a39d8d" fill-opacity=".85">{km} km</text>')
    return "".join(out)


def pins():
    out = []
    for c in DATA:
        k = c["k"]
        dx, dy, anc = c["l"][:3]
        lead = (f'<line x1="0" y1="-9" x2="{dx}" y2="{dy + 5}" stroke="#d4af37" stroke-opacity=".4" stroke-width="1"/>' if len(c["l"]) > 3 else "")
        sede = k == "sabara"
        foto = c["f"] is not None
        if sede:
            continue
        halo = f'<circle class="pin__halo" r="15" fill="none" stroke="#f1dd8f" stroke-width="1.5" stroke-dasharray="2 3"/>' if foto else ""
        out.append(
            f'<g class="pin" data-k="{k}" transform="translate({c["x"]} {c["y"]})" tabindex="0" role="button" aria-label="{E(c["n"])}, {c["d"]} km, rumo {c["rumo"].lower()}">'
            f'<circle class="pin__hit" r="26" fill="transparent"/>{lead}{halo}'
            f'<circle class="pin__dot" r="7"/>'
            f'<text class="pin__txt" x="{dx}" y="{dy}" text-anchor="{anc}">{E(c["n"])}</text></g>')
    return "".join(out)


SVG = f'''<svg id="compass" viewBox="0 0 760 760" role="img" aria-labelledby="cmp-t cmp-d">
  <title id="cmp-t">Bússola das regiões de atendimento</title>
  <desc id="cmp-d">Mapa radial com Sabará ao centro e as cidades atendidas na direção e na distância aproximadas.</desc>
  <defs>
    <radialGradient id="disc" cx="50%" cy="48%" r="60%"><stop offset="0" stop-color="#1b160c"/><stop offset=".7" stop-color="#0e0c08"/><stop offset="1" stop-color="#070605"/></radialGradient>
    <linearGradient id="bez" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1dd8f"/><stop offset=".5" stop-color="#b8901f"/><stop offset="1" stop-color="#e6c75a"/></linearGradient>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <circle cx="{CX}" cy="{CY}" r="372" fill="none" stroke="url(#bez)" stroke-width="5"/>
  <circle cx="{CX}" cy="{CY}" r="360" fill="url(#disc)" stroke="#d4af37" stroke-opacity=".5" stroke-width="1"/>
  {ticks()}
  <circle cx="{CX}" cy="{CY}" r="310" fill="none" stroke="#d4af37" stroke-opacity=".18"/>
  {aneis()}
  <line x1="{CX}" y1="40" x2="{CX}" y2="720" stroke="#d4af37" stroke-opacity=".08"/>
  <line x1="40" y1="{CY}" x2="720" y2="{CY}" stroke="#d4af37" stroke-opacity=".08"/>
  {cardinais()}
  {pins()}
  <g transform="translate({CX} {CY})">
    <g id="needle">
      <polygon id="needle-tip" points="-10,0 0,-170 10,0" fill="#e5322d" filter="url(#glow)"/>
      <polygon points="-10,0 0,62 10,0" fill="#d9d2bd" fill-opacity=".85"/>
    </g>
    <circle r="15" fill="#0b0a07" stroke="url(#bez)" stroke-width="3"/>
    <circle r="5" fill="#f1dd8f"/>
  </g>
  <text x="{CX}" y="{CY + 40}" text-anchor="middle" font-family="Teko,sans-serif" font-size="19" letter-spacing="3" fill="#f1dd8f">SABARÁ · SEDE</text>
</svg>'''

# ------------------------------------------------------------ listas estáticas (SEO) por rumo
grupos = {}
for c in DATA:
    if c["k"] == "sabara":
        continue
    grupos.setdefault(c["rumo"], []).append(c)
rumos_html = ""
for rumo in RUMO_ORDEM + [r for r in grupos if r not in RUMO_ORDEM]:
    if rumo not in grupos:
        continue
    its = sorted(grupos[rumo], key=lambda c: c["d"])
    li = "".join(
        f'<li><a href="{c["u"]}"><b>{E(c["n"])}</b><small>{c["d"]} km da sede</small></a></li>' if c["u"] else
        f'<li><a href="https://wa.me/{WHATS}?text={E("Olá, Dr. Lucas! Preciso de atendimento em Sete Lagoas.".replace(" ", "%20"))}" target="_blank" rel="noopener"><b>{E(c["n"])}</b><small>{c["d"]} km da sede · sob demanda</small></a></li>'
        for c in its)
    rumos_html += f'<div class="rumo"><h3><span aria-hidden="true">↑</span> Rumo {rumo}</h3><ul>{li}</ul></div>'

# ------------------------------------------------------------ quadro
def print_html(k):
    arq, local, leg = FOTOS[k]
    cid = next((c for c in DATA if c["k"] == k), None)
    btn = (f'<button class="print__map" type="button" data-goto="{k}"><i class="fas fa-compass" aria-hidden="true"></i> Ver no mapa</button>'
           if cid else "")
    alt = f"Dr. Lucas Semim, advogado criminalista, em atendimento: {leg}"
    return (f'<figure class="print" style="--r:{ROT[k]}deg"><span class="tack" aria-hidden="true"></span>'
            f'<img src="https://lucassemim.adv.br/img/atendimento/{arq}" alt="{E(alt)}" width="900" height="{952 if k == "contagem" else 1200}" loading="lazy">'
            f'<figcaption><span class="print__loc">{E(local)}</span><span class="print__leg">{E(leg)}</span>{btn}</figcaption></figure>')


quadro = "".join(print_html(k) for k in MURAL)
quadro += ('<aside class="print print--cta" style="--r:.9deg"><span class="tack" aria-hidden="true"></span>'
           '<p class="eyebrow">Próximo rumo</p><h3>A próxima delegacia pode ser a da sua família.</h3>'
           '<p>Se alguém foi preso, o plantão é acionado pelo WhatsApp, a qualquer hora.</p>'
           f'<a class="btn-g" href="https://wa.me/{WHATS}?text=Ol%C3%A1%2C%20Dr.%20Lucas!%20Preciso%20de%20atendimento%20urgente%20em%20delegacia." target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Chamar o plantão</a></aside>')

# ------------------------------------------------------------ FAQ + JSON-LD
FAQ = [
    ("O advogado vai até a delegacia da minha cidade?",
     "Nas cidades listadas nesta página, sim: o advogado comparece à delegacia para acompanhar o depoimento e o auto de prisão em flagrante. Para outras cidades, fale com o plantão, porque a disponibilidade depende do horário, da distância e da urgência do caso."),
    ("Em quanto tempo o advogado chega?",
     "Depende da cidade, do horário e do trânsito. A base fica em Sabará, e BH, Santa Luzia e Nova Lima estão a menos de 15 km em linha reta; Contagem, Vespasiano e Lagoa Santa, a menos de 30 km. Ao acionar o plantão, você recebe uma estimativa realista, sem promessa de horário."),
    ("Vale a cidade onde moro ou onde o fato aconteceu?",
     "Em regra, a competência é definida pelo lugar em que a infração se consumou (art. 70 do Código de Processo Penal), e não pela cidade onde o acusado mora. Por isso o atendimento acompanha a comarca do fato, onde fica a delegacia e, depois, o fórum."),
    ("Atendem quem está fora da Grande BH?",
     "Sim. Com o Juízo 100% Digital, a procuração é assinada por celular e o processo é acompanhado à distância. Quando a presença física é indispensável, o escritório avalia caso a caso com você."),
]
LD = {
    "@context": "https://schema.org",
    "@graph": [
        {"@type": ["LegalService", "LocalBusiness"], "@id": BASE + "advogado-criminalista/#escritorio",
         "name": "Lucas Semim — Advocacia Criminal", "url": BASE + "advogado-criminalista/",
         "telephone": TEL, "image": BASE + "img/atendimento/og-bussola.jpg", "priceRange": "$$",
         "address": {"@type": "PostalAddress", "streetAddress": "Rua dos Timbiras, 3488 - Barro Preto", "addressLocality": "Belo Horizonte", "addressRegion": "MG", "postalCode": "30140-062", "addressCountry": "BR"},
         "geo": {"@type": "GeoCoordinates", "latitude": LAT0, "longitude": LON0},
         "openingHoursSpecification": {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], "opens": "00:00", "closes": "23:59"},
         "areaServed": [{"@type": "City", "name": c["n"].replace(" (BH)", "")} for c in DATA] + [{"@type": "AdministrativeArea", "name": "Região Metropolitana de Belo Horizonte"}]},
        {"@type": "CollectionPage", "name": "Advogado criminalista na Grande BH: comarcas atendidas", "url": BASE + "advogado-criminalista/", "inLanguage": "pt-BR",
         "about": {"@id": BASE + "advogado-criminalista/#escritorio"},
         "mainEntity": {"@type": "ItemList", "numberOfItems": sum(1 for c in DATA if c["u"]),
                        "itemListElement": [{"@type": "ListItem", "position": i, "name": "Advogado criminalista em " + c["n"].replace(" (BH)", ""), "url": BASE + c["u"]}
                                            for i, c in enumerate([c for c in DATA if c["u"]], 1)]}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Início", "item": BASE},
            {"@type": "ListItem", "position": 2, "name": "Onde atendemos", "item": BASE + "advogado-criminalista/"}]},
        {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]},
    ],
}
ld_html = '<script type="application/ld+json">\n' + json.dumps(LD, ensure_ascii=False, indent=1) + "\n</script>"
faq_html = "".join(f'<details class="faq__i"><summary>{E(q)}</summary><p>{E(a)}</p></details>' for q, a in FAQ)
n_pag = sum(1 for c in DATA if c["u"])

PAGE = r'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="index, follow, max-image-preview:large">

    <title>Advogado Criminalista na Grande BH: Onde Atendemos | Lucas Semim</title>
    <meta name="description" content="A bússola do atendimento criminal: Sabará, Belo Horizonte, Contagem, Betim, Pedro Leopoldo e mais. Veja a direção e a distância de cada comarca e chame o plantão 24h.">
    <meta name="author" content="Dr. Lucas Renan Semim">
    <link rel="canonical" href="https://lucassemim.adv.br/advogado-criminalista/">
    <link rel="icon" href="https://lucassemim.adv.br/img/Favicon-lucassemim.png" type="image/png">

    <meta property="og:title" content="A bússola da defesa criminal na Grande BH — Dr. Lucas Semim">
    <meta property="og:description" content="Do plantão em Sabará às delegacias de BH, Contagem, Betim e região: veja onde o Dr. Lucas atende e chame o plantão 24h.">
    <meta property="og:image" content="https://lucassemim.adv.br/img/atendimento/og-bussola.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="https://lucassemim.adv.br/advogado-criminalista/">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="pt_BR">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="A bússola da defesa criminal na Grande BH — Dr. Lucas Semim">
    <meta name="twitter:description" content="Veja onde o Dr. Lucas atende na Grande BH e chame o plantão 24h.">
    <meta name="twitter:image" content="https://lucassemim.adv.br/img/atendimento/og-bussola.jpg">
    <meta name="geo.region" content="BR-MG">
    <meta name="geo.placename" content="Sabará, Belo Horizonte, Minas Gerais">
    <meta name="geo.position" content="-19.883;-43.806">

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
        .btn-g,.btn-o{display:inline-flex;align-items:center;gap:10px;padding:14px 26px;border-radius:4px;text-decoration:none;font:500 1.3rem/1 'Teko',sans-serif;letter-spacing:1.2px;text-transform:uppercase;transition:transform .25s var(--ease),box-shadow .25s,border-color .25s,color .25s;border:0;cursor:pointer}
        .btn-g{background:linear-gradient(135deg,var(--gold-hi),var(--gold) 55%,#b8901f);color:#111;box-shadow:0 12px 34px rgba(212,175,55,.28)}
        .btn-g:hover{transform:translateY(-2px);color:#000;box-shadow:0 18px 44px rgba(212,175,55,.4)}
        .btn-o{border:1px solid rgba(255,255,255,.3);color:#fff;background:rgba(255,255,255,.04)}
        .btn-o:hover{border-color:var(--gold);color:var(--gold-hi);transform:translateY(-2px)}

        /* HERO + BÚSSOLA */
        .hero{padding:52px 0 70px;border-bottom:1px solid var(--line);background:
            radial-gradient(50% 60% at 78% 30%,rgba(212,175,55,.12),transparent 70%),
            radial-gradient(40% 50% at 0% 100%,rgba(229,50,45,.1),transparent 70%),var(--ink)}
        .hero__grid{display:grid;grid-template-columns:minmax(0,.88fr) minmax(0,1.12fr);grid-template-areas:"txt cmp" "card cmp";grid-template-rows:auto 1fr;gap:26px 52px;align-items:start}
        .hero__txt{grid-area:txt;min-width:0}
        .hero h1{font:800 clamp(2.4rem,5vw,4rem)/1.04 'Playfair Display',serif;color:#fff;margin:0 0 18px;text-wrap:balance}
        .hero h1 em{font-style:normal;color:var(--gold)}
        .hero__lead{font-size:1.12rem;line-height:1.65;color:#d6d1c4;max-width:34em;margin:0}
        .cmp{grid-area:cmp;position:relative;min-width:0}
        #compass{width:100%;height:auto;display:block;max-width:660px;margin-inline:auto;filter:drop-shadow(0 30px 60px rgba(0,0,0,.65))}
        #needle{transition:transform 1.1s cubic-bezier(.3,1.45,.5,1);transform-origin:0 0}
        .pin{cursor:pointer;outline:none}
        .pin__dot{fill:#0b0a07;stroke:var(--gold);stroke-width:2.4;transition:fill .25s,r .25s,stroke .25s}
        .pin__halo{opacity:.85;transform-box:fill-box;transform-origin:center}
        .pin__txt{font:700 16px 'Lato',sans-serif;fill:#cfc8b6;paint-order:stroke;stroke:#090806;stroke-width:4px;stroke-linejoin:round;transition:fill .25s}
        .pin:hover .pin__dot,.pin:focus-visible .pin__dot{fill:var(--gold-hi)}
        .pin:hover .pin__txt,.pin:focus-visible .pin__txt{fill:#fff}
        .pin.on .pin__dot{fill:var(--red);stroke:#fff;r:9}
        .pin.on .pin__txt{fill:#fff;font-size:17px}
        .pin.on .pin__halo{stroke:#fff;animation:giro 14s linear infinite}
        @keyframes giro{to{transform:rotate(360deg)}}
        .cmp__nota{margin:10px auto 0;max-width:660px;font-size:.8rem;color:#847e6e;text-align:center;line-height:1.5}
        .chips{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;overflow-x:auto;padding:14px 2px 6px;margin:0 auto;max-width:660px;scrollbar-width:thin;scrollbar-color:var(--gold) transparent}
        .chips button{flex:0 0 auto;padding:8px 14px;border:1px solid var(--line);border-radius:50px;background:rgba(255,255,255,.04);color:#e9e9e9;font:700 .85rem/1 'Lato',sans-serif;cursor:pointer;transition:border-color .2s,color .2s,background .2s}
        .chips button:hover{border-color:var(--gold);color:var(--gold-hi)}
        .chips button[aria-pressed="true"]{background:var(--gold);color:#111;border-color:var(--gold)}

        .info{grid-area:card;display:grid;grid-template-columns:170px 1fr;gap:0;border:1px solid var(--line);border-radius:3px;overflow:hidden;background:linear-gradient(180deg,var(--ink-3),var(--ink-2));box-shadow:0 24px 60px rgba(0,0,0,.5)}
        .info__img{position:relative;min-height:200px;background:radial-gradient(90% 90% at 30% 20%,#2a2110,#0b0a07);display:grid;place-items:center;overflow:hidden}
        .info__img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 25%}
        .info__img .big{font:800 3.2rem/1 'Playfair Display',serif;color:rgba(212,175,55,.28)}
        .info__img figcaption{position:absolute;left:0;right:0;bottom:0;padding:18px 8px 7px;background:linear-gradient(0deg,rgba(0,0,0,.86),transparent);font-size:.68rem;line-height:1.25;color:#e8e2d0}
        .info__b{padding:20px 22px 20px}
        .info__k{font:500 .98rem/1.15 'Teko',sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:var(--gold);margin:0 0 8px}
        .info h2{font:700 1.7rem/1.1 'Playfair Display',serif;color:#fff;margin:0 0 10px}
        .info p.t{color:#c9c3b3;font-size:.97rem;line-height:1.55;margin:0 0 16px}
        .info__a{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center}
        .info__a .btn-g{padding:11px 20px;font-size:1.15rem}
        .info__a a.l{font-size:.9rem;color:var(--muted);text-underline-offset:3px}
        .info__a a.l:hover{color:#fff}

        /* FAIXA */
        .faixa{border-bottom:1px solid var(--line);background:var(--ink-2)}
        .faixa ul{list-style:none;margin:0;padding:18px 0;display:flex;flex-wrap:wrap;gap:10px 34px;justify-content:center}
        .faixa li{display:flex;align-items:center;gap:10px;font:500 1.15rem/1 'Teko',sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:#d8d2c2}
        .faixa i{color:var(--gold)}

        /* QUADRO */
        .quadro{padding:84px 0 70px;background:
            radial-gradient(70% 50% at 50% 0%,rgba(212,175,55,.08),transparent 70%),var(--ink)}
        .mural{display:grid;grid-template-columns:repeat(3,1fr);gap:46px 30px;padding:14px 4px 10px;align-items:start}
        .print{position:relative;margin:0;padding:12px 12px 0;background:#14110b;border:1px solid rgba(212,175,55,.38);box-shadow:0 22px 44px rgba(0,0,0,.6);transform:rotate(var(--r,0deg));transition:transform .45s var(--ease),box-shadow .3s}
        .print:hover{transform:rotate(0deg) translateY(-6px) scale(1.015);box-shadow:0 30px 60px rgba(0,0,0,.7),0 0 0 1px var(--gold)}
        .print img{display:block;width:100%;height:auto;aspect-ratio:4/5;object-fit:cover;object-position:50% 22%;background:#000}
        .print figcaption{padding:12px 4px 14px;display:grid;gap:4px}
        .print__loc{font:500 1.05rem/1 'Teko',sans-serif;letter-spacing:2.2px;text-transform:uppercase;color:var(--gold)}
        .print__leg{font-size:.9rem;line-height:1.35;color:#d4cfc0}
        .print__map{justify-self:start;margin-top:6px;padding:0;border:0;background:none;color:var(--gold-hi);font:700 .85rem/1 'Lato',sans-serif;cursor:pointer;text-decoration:underline;text-underline-offset:4px}
        .print__map:hover{color:#fff}
        .tack{position:absolute;top:-11px;left:50%;width:22px;height:22px;margin-left:-11px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff8a80,#b3261e 55%,#5c0a06);box-shadow:0 5px 8px rgba(0,0,0,.6);z-index:2}
        .print--cta{display:flex;flex-direction:column;justify-content:center;padding:30px 26px;background:linear-gradient(160deg,#1d1608,#0d0c0a);min-height:100%;align-self:stretch;border-color:rgba(212,175,55,.6)}
        .print--cta h3{font:700 1.6rem/1.15 'Playfair Display',serif;color:#fff;margin:0 0 12px}
        .print--cta p:not(.eyebrow){color:#c9c3b3;line-height:1.55;margin:0 0 20px}
        .print--cta .btn-g{align-self:flex-start}
        .quadro__share{margin-top:44px;display:flex;flex-wrap:wrap;gap:12px;align-items:center}
        .quadro__share span{color:var(--muted);font-size:.95rem}
        #copiado{color:var(--gold-hi);font-size:.9rem;min-height:1.2em}

        /* POR RUMO */
        .rumos{padding:70px 0;border-top:1px solid var(--line);background:var(--ink-2)}
        .rumos__g{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .rumo{padding:22px 22px 14px;border:1px solid var(--line);border-radius:3px;background:var(--ink)}
        .rumo h3{font:500 1.25rem/1 'Teko',sans-serif;letter-spacing:2.5px;text-transform:uppercase;color:var(--gold);margin:0 0 12px;display:flex;gap:10px;align-items:center}
        .rumo ul{list-style:none;margin:0;padding:0}
        .rumo li a{display:flex;justify-content:space-between;gap:12px;align-items:baseline;padding:10px 0;border-top:1px solid rgba(255,255,255,.07);text-decoration:none;transition:color .2s,padding .25s var(--ease)}
        .rumo li:first-child a{border-top:0}
        .rumo li a b{font:700 1rem/1.3 'Lato',sans-serif;color:#fff}
        .rumo li a small{color:var(--muted);font-size:.8rem;white-space:nowrap}
        .rumo li a:hover{padding-left:6px}
        .rumo li a:hover b{color:var(--gold-hi)}

        /* DIGITAL + FAQ + CTA */
        .digital{padding:56px 0;border-top:1px solid var(--line)}
        .digital__box{display:grid;grid-template-columns:1.4fr 1fr;gap:28px;align-items:center;padding:32px 30px;border:1px solid rgba(212,175,55,.4);border-radius:3px;background:linear-gradient(135deg,#1b150a,#0d0c0a 70%)}
        .digital h2{font:700 1.7rem/1.15 'Playfair Display',serif;color:#fff;margin:0 0 10px}
        .digital p{color:#c9c3b3;line-height:1.6;margin:0}
        .digital__cta{display:flex;flex-wrap:wrap;gap:12px;justify-content:flex-end}
        .faq{padding:20px 0 70px}
        .faq__i{border-top:1px solid var(--line)}
        .faq__i:last-child{border-bottom:1px solid var(--line)}
        .faq__i summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;gap:16px;align-items:center;padding:20px 0;font:700 1.1rem/1.35 'Lato',sans-serif;color:#fff}
        .faq__i summary::-webkit-details-marker{display:none}
        .faq__i summary::after{content:"+";font:400 1.6rem/1 'Lato',sans-serif;color:var(--gold);transition:transform .25s var(--ease)}
        .faq__i[open] summary::after{transform:rotate(45deg)}
        .faq__i p{margin:0 0 22px;color:#bdb7a7;line-height:1.65;max-width:52em}
        .final{padding:80px 0 88px;text-align:center;border-top:1px solid var(--line);background:radial-gradient(60% 80% at 50% 0%,rgba(212,175,55,.1),transparent 70%),var(--ink-2)}
        .final h2{font:800 clamp(2rem,4.4vw,3.1rem)/1.08 'Playfair Display',serif;color:#fff;margin:0 auto 14px;max-width:18em;text-wrap:balance}
        .final h2 em{font-style:normal;color:var(--gold)}
        .final p{max-width:34em;margin:0 auto 28px;color:#cfc9ba;font-size:1.08rem;line-height:1.65}
        .final .cta{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
        .aviso{margin:40px auto 0;font-size:.82rem;color:#8a8474;max-width:60em;line-height:1.6;text-align:center}

        .btn-whatsapp-float{position:fixed;bottom:30px;right:30px;background:#25D366;color:#fff;width:60px;height:60px;border-radius:50%;display:flex;justify-content:center;align-items:center;font-size:32px;box-shadow:0 8px 24px rgba(0,0,0,.45);z-index:999;text-decoration:none;animation:pulse-wa 2.4s infinite;transition:transform .25s}
        .btn-whatsapp-float:hover{transform:scale(1.1);color:#fff}
        @keyframes pulse-wa{0%{box-shadow:0 0 0 0 rgba(37,211,102,.6)}70%{box-shadow:0 0 0 15px rgba(37,211,102,0)}100%{box-shadow:0 0 0 0 rgba(37,211,102,0)}}

        @media(max-width:1020px){
            .hero__grid{grid-template-columns:minmax(0,1fr);grid-template-areas:"txt" "cmp" "card";grid-template-rows:none;gap:22px}
            .mural{grid-template-columns:1fr 1fr}
            .rumos__g{grid-template-columns:1fr 1fr}
            .digital__box{grid-template-columns:1fr}
            .digital__cta{justify-content:flex-start}
        }
        @media(max-width:640px){
            body{padding-top:72px}
            .hero{padding:30px 0 48px}
            .pin__txt{font-size:19px}
            .pin.on .pin__txt{font-size:22px}
            .chips{flex-wrap:nowrap;justify-content:flex-start}
            .info{grid-template-columns:1fr}
            .info__img{min-height:230px}
            .mural{grid-template-columns:1fr;gap:40px}
            .print{transform:rotate(calc(var(--r,0deg)*.5))}
            .rumos__g{grid-template-columns:1fr}
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
        <!-- ═══ HERO: A BÚSSOLA ═══ -->
        <section class="hero" aria-labelledby="h-hero">
            <div class="wrap hero__grid">
                <div class="hero__txt">
                    <p class="eyebrow">Onde atendemos · Grande BH</p>
                    <h1 id="h-hero">Sua defesa tem um <em>norte</em>.</h1>
                    <p class="hero__lead">A base é Sabará. Dali, o Dr. Lucas Semim aponta o caminho até a delegacia, o fórum ou o presídio da sua comarca. Toque numa cidade e veja a direção, a distância e como o atendimento chega até você.</p>
                </div>

                <div class="cmp">
                    %%SVG%%
                    <div class="chips" id="chips" role="group" aria-label="Escolha uma cidade"></div>
                    <p class="cmp__nota">Posições e distâncias em linha reta, aproximadas e em escala ampliada perto da sede. O círculo tracejado marca as cidades com visita registrada no quadro abaixo.</p>
                </div>

                <article class="info" id="info" aria-live="polite">
                    <figure class="info__img" id="info-img" style="margin:0"><span class="big" id="info-big">—</span></figure>
                    <div class="info__b">
                        <p class="info__k" id="info-k">Rumo</p>
                        <h2 id="info-n">Selecione uma cidade</h2>
                        <p class="t" id="info-t">Toque num ponto da bússola.</p>
                        <div class="info__a">
                            <a class="btn-g" id="info-go" href="#"><i class="fas fa-arrow-right"></i> <span>Ver atendimento</span></a>
                            <a class="l" id="info-wa" href="#" target="_blank" rel="noopener">Chamar no WhatsApp</a>
                        </div>
                    </div>
                </article>
            </div>
        </section>

        <div class="faixa">
            <div class="wrap">
                <ul>
                    <li><i class="fas fa-clock"></i> Plantão 24h</li>
                    <li><i class="fas fa-map-location-dot"></i> %%NPAG%% cidades com página própria</li>
                    <li><i class="fas fa-building-shield"></i> Delegacia, fórum e presídio</li>
                    <li><i class="fas fa-laptop"></i> Juízo 100% Digital</li>
                </ul>
            </div>
        </div>

        <!-- ═══ QUADRO DE ATENDIMENTOS ═══ -->
        <section class="quadro" id="quadro" aria-labelledby="h-quadro">
            <div class="wrap">
                <p class="eyebrow">Quadro de atendimentos</p>
                <h2 class="sec-h" id="h-quadro">O advogado que vai até onde o caso está.</h2>
                <p class="sec-s">Registros do Dr. Lucas Semim em atendimento nas delegacias da região. Cada fotografia é um ponto da bússola: toque em &ldquo;Ver no mapa&rdquo; e veja a direção.</p>
                <div class="mural">%%QUADRO%%</div>
                <div class="quadro__share">
                    <button class="btn-o" type="button" id="share"><i class="fas fa-share-nodes"></i> Compartilhar este quadro</button>
                    <a class="btn-o" id="share-wa" href="#" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Enviar no WhatsApp</a>
                    <span id="copiado" role="status"></span>
                </div>
            </div>
        </section>

        <!-- ═══ POR RUMO (links indexáveis) ═══ -->
        <section class="rumos" aria-labelledby="h-rumos">
            <div class="wrap">
                <p class="eyebrow">Todas as comarcas</p>
                <h2 class="sec-h" id="h-rumos">Escolha o rumo e abra a página da sua cidade.</h2>
                <p class="sec-s">Cada página explica como funciona o atendimento naquela comarca: flagrante, audiência de custódia, habeas corpus e acompanhamento do processo.</p>
                <div class="rumos__g">%%RUMOS%%</div>
            </div>
        </section>

        <!-- ═══ FORA DA REGIÃO ═══ -->
        <section class="digital">
            <div class="wrap">
                <div class="digital__box">
                    <div>
                        <p class="eyebrow">Fora da Grande BH?</p>
                        <h2>A distância não impede a defesa.</h2>
                        <p>Pelo Juízo 100% Digital, a procuração é assinada por celular e o processo é acompanhado à distância. Comece pelo diagnóstico gratuito e sigiloso.</p>
                    </div>
                    <div class="digital__cta">
                        <a class="btn-g" href="https://lucassemim.adv.br/diagnostico.html"><i class="fas fa-clipboard-check"></i> Fazer o diagnóstico</a>
                        <a class="btn-o" href="https://lucassemim.adv.br/solucoes.html">Ver as soluções</a>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══ FAQ ═══ -->
        <section class="faq" aria-labelledby="h-faq">
            <div class="wrap">
                <p class="eyebrow">Dúvidas frequentes</p>
                <h2 class="sec-h" id="h-faq">Sobre o atendimento na sua cidade.</h2>
                <div style="margin-top:26px">%%FAQ%%</div>
            </div>
        </section>

        <!-- ═══ CTA FINAL ═══ -->
        <section class="final">
            <div class="wrap">
                <h2>Alguém foi preso? <em>Aponte a bússola para o plantão.</em></h2>
                <p>Chame pelo WhatsApp ou ligue. O atendimento começa pela escuta e pela análise do caso, sem promessa de resultado.</p>
                <div class="cta">
                    <a class="btn-g" href="https://wa.me/%%WHATS%%?text=Ol%C3%A1%2C%20Dr.%20Lucas!%20Preciso%20de%20atendimento%20criminal." target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Chamar no WhatsApp</a>
                    <a class="btn-o" href="tel:%%TEL%%"><i class="fas fa-phone"></i> %%TELFMT%%</a>
                </div>
                <p class="aviso">Dr. Lucas Renan Semim, OAB/MG 222.539 · Rua dos Timbiras, 3488, Barro Preto, Belo Horizonte/MG · Atendimento em Sabará, Belo Horizonte e região. Conteúdo informativo, conforme o Provimento 205/2021 do Conselho Federal da OAB; nenhum resultado pode ser garantido.</p>
            </div>
        </section>
    </main>

    <div id="footer-master-injecao"></div>

    <a href="https://wa.me/%%WHATS%%?text=Ol%C3%A1%20Dr.%20Lucas%2C%20vim%20do%20site%20e%20preciso%20de%20ajuda%20criminal%20urgente." class="btn-whatsapp-float" id="float-wpp" target="_blank" rel="noopener noreferrer" aria-label="Plantão Criminal 24h — WhatsApp"><i class="fab fa-whatsapp"></i></a>

    <script>
    (function(){
        var C = %%DATA%%;
        var WHATS = "%%WHATS%%", BASE = "https://lucassemim.adv.br/";
        var by = {}; C.forEach(function(c){ by[c.k] = c; });
        var needle = document.getElementById('needle'), tip = document.getElementById('needle-tip');
        var cur = 0, first = true;
        var chips = document.getElementById('chips');
        var el = {k:q('info-k'), n:q('info-n'), t:q('info-t'), go:q('info-go'), wa:q('info-wa'), img:q('info-img')};
        function q(id){ return document.getElementById(id); }

        C.filter(function(c){ return c.k !== 'sabara'; }).sort(function(a,b){ return a.d - b.d; }).forEach(function(c){
            var b = document.createElement('button');
            b.type = 'button'; b.textContent = c.n; b.setAttribute('data-k', c.k); b.setAttribute('aria-pressed', 'false');
            chips.appendChild(b);
        });

        function aim(b, r){
            var d = ((b - cur) % 360 + 540) % 360 - 180;
            cur += d;
            needle.style.transform = 'rotate(' + cur + 'deg)';
            var L = Math.max(60, r - 16);
            tip.setAttribute('points', '-10,0 0,-' + L + ' 10,0');
        }

        function select(k){
            var c = by[k]; if(!c) return;
            document.querySelectorAll('.pin').forEach(function(p){ p.classList.toggle('on', p.getAttribute('data-k') === k); });
            chips.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-k') === k ? 'true' : 'false'); });
            aim(c.b, c.r);
            el.k.textContent = 'Rumo ' + c.rumo + ' · ' + c.d + ' km da sede';
            el.n.textContent = c.n;
            el.t.textContent = c.t;
            var msg = 'Olá, Dr. Lucas! Preciso de atendimento criminal em ' + c.n.replace(' (BH)', '') + '.';
            el.wa.href = 'https://wa.me/' + WHATS + '?text=' + encodeURIComponent(msg);
            if(c.u){ el.go.href = c.u; el.go.querySelector('span').textContent = 'Ver atendimento em ' + c.n.replace(' (BH)', ''); el.go.removeAttribute('target'); }
            else { el.go.href = el.wa.href; el.go.target = '_blank'; el.go.rel = 'noopener'; el.go.querySelector('span').textContent = 'Falar com o plantão'; }
            el.img.innerHTML = '';
            if(c.f){
                var im = new Image(); im.src = BASE + 'img/atendimento/' + c.f; im.alt = 'Dr. Lucas Semim em atendimento: ' + c.fc; im.width = 900; im.height = 1200;
                var fc = document.createElement('figcaption'); fc.textContent = c.fc;
                el.img.appendChild(im); el.img.appendChild(fc);
            } else {
                var s = document.createElement('span'); s.className = 'big'; s.textContent = c.n.replace(/[^A-Za-zÀ-ú ]/g,'').split(' ').map(function(w){return w[0];}).join('').slice(0,3).toUpperCase();
                el.img.appendChild(s);
            }
            if(location.hash !== '#' + k && !first){ try{ history.replaceState(null, '', '#' + k); }catch(e){} }
            first = false;
        }

        document.querySelectorAll('.pin').forEach(function(p){
            p.addEventListener('click', function(){ select(p.getAttribute('data-k')); });
            p.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); select(p.getAttribute('data-k')); } });
        });
        chips.addEventListener('click', function(e){ var b = e.target.closest('button'); if(b) select(b.getAttribute('data-k')); });
        document.querySelectorAll('[data-goto]').forEach(function(b){
            b.addEventListener('click', function(){
                select(b.getAttribute('data-goto'));
                document.getElementById('compass').scrollIntoView({behavior: 'smooth', block: 'center'});
            });
        });

        var h = (location.hash || '').replace('#', '');
        select(by[h] ? h : 'contagem');

        // compartilhar
        var url = BASE + 'advogado-criminalista/', txt = 'O Dr. Lucas Semim atende nas delegacias de Sabará, BH, Contagem, Betim e região. Veja a bússola do atendimento:';
        q('share-wa').href = 'https://wa.me/?text=' + encodeURIComponent(txt + ' ' + url);
        q('share').addEventListener('click', function(){
            var out = q('copiado');
            if(navigator.share){ navigator.share({title: document.title, text: txt, url: url}).catch(function(){}); return; }
            if(navigator.clipboard){ navigator.clipboard.writeText(url).then(function(){ out.textContent = 'Link copiado.'; setTimeout(function(){ out.textContent = ''; }, 2500); }); }
        });
    })();
    </script>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://lucassemim.adv.br/js/ai-neural-seo.js"></script>
    <script src="https://lucassemim.adv.br/js/ads-intelligence.js"></script>
    <script src="https://lucassemim.adv.br/js/lgpd.js"></script>
    <script src="https://lucassemim.adv.br/js/tradutor-global.js"></script>
    <script src="https://lucassemim.adv.br/js/vlibras-plugin.js"></script>
    <script src="https://lucassemim.adv.br/js/vcard-smart.js"></script>
    <script src="https://lucassemim.adv.br/js/diagnostico.js"></script>
    <script src="https://lucassemim.adv.br/js/header-elite.js"></script>
    <script src="https://lucassemim.adv.br/js/footer-seo.js"></script>
    <script src="https://lucassemim.adv.br/js/chat-elite.js"></script>
    <script src="https://lucassemim.adv.br/js/smart-cta.js"></script>
</body>
</html>
'''
for k, v in {"%%LD%%": ld_html, "%%SVG%%": SVG, "%%QUADRO%%": quadro, "%%RUMOS%%": rumos_html, "%%FAQ%%": faq_html,
             "%%DATA%%": json.dumps(DATA, ensure_ascii=False), "%%NPAG%%": str(n_pag),
             "%%WHATS%%": WHATS, "%%TEL%%": TEL, "%%TELFMT%%": TEL_FMT}.items():
    PAGE = PAGE.replace(k, v)
open(OUT, "w", encoding="utf8").write(PAGE)
print("OK", OUT, len(PAGE), "bytes | cidades:", len(DATA), "| com página:", n_pag)
