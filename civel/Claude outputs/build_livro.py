# -*- coding: utf-8 -*-
"""Gera artigos.html — O Livro da Defesa Criminal (versão "livro do site inteiro").
Uso:  python3 build_livro.py   (lê teses.json, noticias.json e livro_data.py; escreve ../artigos.html)
"""
import json, re, html, os, sys
from livro_data import *

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = "/mnt/user-data/uploads/lucassemim.adv.br/"
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE, "artigos.html")
E = lambda s: html.escape(s, quote=True)

# ------------------------------------------------------------------ teses (45 do índice antigo + a nova, ainda sem lugar)
teses = json.load(open(os.path.join(BASE, "teses.json"), encoding="utf8"))


def split_title(t):
    for sep in (": ", " — ", " | "):
        if sep in t:
            a, b = t.split(sep, 1)
            return a.strip(), b.strip()
    return t.strip(), ""


def read_min(path):
    try:
        h = open(path, encoding="utf8", errors="ignore").read()
        h = re.sub(r"<(script|style|nav|header|footer)[^>]*>.*?</\1>", " ", h, flags=re.S)
        w = len(re.sub(r"<[^>]+>", " ", h).split())
        return max(3, round(w / 210))
    except Exception:
        return None

NOVAS = {  # teses que existem no site mas ainda não tinham lugar no índice
    "flagrante-liberdade": [("defesa-criminal/fianca-hipossuficiencia-dispensa-reducao-habeas-corpus.html",
                             "Fiança e Hipossuficiência", "Prisão por pobreza, dispensa, redução e Habeas Corpus")],
}
caps2 = []
for i, c in enumerate(teses, 1):
    items = []
    for it in c["items"]:
        a, b = split_title(it["titulo"])
        items.append((it["href"], a, b, it["min"]))
    for href, a, b in NOVAS.get(c["tag"], []):
        items.append((href, a, b, read_min(SRC + href)))
    caps2.append({"titulo": c["titulo"], "desc": c["desc"], "items": items})
PARTE2 = {
    "id": "parte-2", "rot": "II", "titulo": "As teses",
    "intro": "Quarenta e seis estudos técnicos, da teoria do crime ao Tribunal do Júri. É o raciocínio jurídico que sustenta cada defesa — escrito para ser lido por quem não é advogado.",
    "caps": caps2,
}

# ------------------------------------------------------------------ notícias (Parte V)
news = json.load(open(SRC + "dados/noticias.json", encoding="utf8"))
ORDEM = [
    ("Flagrante & Plantão 24h", "Prisão em flagrante, delegacia e as primeiras horas."),
    ("Habeas Corpus & Liberdade", "Preventiva, fiança e o caminho até a soltura."),
    ("Nulidades & Provas", "Quando a prova é ilícita e o processo pode ser anulado."),
    ("Tráfico & Lei de Drogas", "Uso, tráfico e a linha que separa os dois."),
    ("Violência Doméstica", "Medida protetiva, Maria da Penha e a defesa do acusado."),
    ("Execução Penal", "Progressão, remição, tornozeleira e saídas temporárias."),
    ("Trânsito & Lei Seca", "Bafômetro, blitz e crimes de trânsito."),
    ("Crimes Digitais & Golpes", "Pix, estelionato eletrônico, conta bloqueada e provas digitais."),
    ("STF & STJ — Teses", "Decisões dos tribunais superiores que mudam a defesa."),
    ("Direito Penal — Geral", "Leis novas e temas gerais de direito penal."),
    ("Bastidores da Advocacia", "Como a advocacia criminal funciona por dentro."),
    ("Direito Internacional & Política Criminal", "Política criminal e casos de repercussão."),
    ("Indenização & Direito Civil", "Quando o problema também é cível. Veja o site cível do escritório."),
]


def clean_news_title(t):
    t = t.split(" | ")[0].strip()
    if len(t) > 125:
        t = t[:122].rsplit(" ", 1)[0] + "…"
    return t

ncaps = []
for cat, desc in ORDEM:
    its = sorted([n for n in news if n.get("categoria") == cat], key=lambda n: n["dataISO"], reverse=True)
    if not its:
        continue
    ncaps.append({"titulo": cat, "desc": desc, "det": True,
                  "items": [(n["link"], clean_news_title(n["titulo"]), n["data"], None) for n in its]})
known = {c for c, _ in ORDEM}
resto = [n for n in news if n.get("categoria") not in known]
if resto:
    ncaps.append({"titulo": "Outros temas", "desc": "", "det": True,
                  "items": [(n["link"], clean_news_title(n["titulo"]), n["data"], None) for n in resto]})
PARTE5 = {
    "id": "parte-5", "rot": "V", "titulo": "Atualidades",
    "intro": "O Radar Criminal: decisões, leis novas e casos que mudam a defesa. É a única parte do livro que cresce todo mês — por isso fica no fim, e os capítulos abrem sob demanda.",
    "caps": ncaps,
}

PARTES = [PROLOGO, PARTE1, PARTE2, PARTE3, PARTE4, PARTE5]
NAVNAME = {"prologo": "Prólogo", "parte-1": "I · Urgência", "parte-2": "II · Teses", "parte-3": "III · Território",
           "parte-4": "IV · Ferramentas", "parte-5": "V · Atualidades"}

# ------------------------------------------------------------------ numeração das páginas (folios)
folio = 0
for p in PARTES:
    p["first"] = None
    for c in p["caps"]:
        c["_items"] = []
        for href, t, sub, extra in c["items"]:
            if href:
                folio += 1
                p["first"] = p["first"] or folio
                p["last"] = folio
                c["_items"].append((href, t, sub, extra, folio))
            else:
                c["_items"].append((href, t, sub, extra, None))
TOTAL = folio
p5_base = PARTE5["first"]
n_teses = sum(len(c["items"]) for c in PARTE2["caps"])
n_guias = sum(len(c["items"]) for c in PARTE1["caps"]) - 1
n_cid = len(CIDADES)
n_news = len(news)


# ------------------------------------------------------------------ HTML
def li(href, t, sub, extra, f, tag_text=""):
    ext = extra == "ext"
    attrs = ' target="_blank" rel="noopener noreferrer"' if ext else ""
    sub_html = f'<small class="toc__s">{E(sub)}</small>' if sub else ""
    if href is None:
        return (f'<li class="toc__li toc__li--soon" data-t="{E((t + " " + sub).lower())}"><div class="toc__a">'
                f'<span class="toc__t">{E(t)}{sub_html}</span><span class="toc__dots"></span><span class="toc__p">em breve</span></div></li>')
    return (f'<li class="toc__li" data-t="{E((t + " " + sub).lower())}"><a class="toc__a" href="{E(href)}"{attrs}>'
            f'<span class="toc__t">{E(t)}{sub_html}</span><span class="toc__dots"></span>'
            f'<span class="toc__p" title="Página {f}">{"↗" if ext else ""}{f}</span></a></li>')


def chapter(p, ci, c):
    num = f"Capítulo {ci}" if p["id"] != "prologo" else "Prólogo"
    n_ok = sum(1 for i in c["_items"] if i[0])
    items = "".join(li(*i) for i in c["_items"])
    desc = f'<p class="cap__d">{E(c["desc"])}</p>' if c["desc"] else ""
    if c.get("det"):
        extra_civ = ""
        if c["titulo"].startswith("Indenização"):
            extra_civ = '<p class="cap__civ"><a href="https://civel.lucassemim.adv.br/" target="_blank" rel="noopener">Ver o site de advocacia cível do escritório →</a></p>'
        return (f'<details class="cap cap--det"><summary class="cap__h"><span class="cap__n">{num}</span>'
                f'<span class="cap__tt">{E(c["titulo"])}</span><span class="cap__c">{n_ok}</span></summary>{desc}{extra_civ}'
                f'<ol class="toc">{items}</ol></details>')
    return (f'<section class="cap"><h3 class="cap__h"><span class="cap__n">{num}</span>'
            f'<span class="cap__tt">{E(c["titulo"])}</span></h3>{desc}<ol class="toc">{items}</ol></section>')


def parte(p):
    pro = p["id"] == "prologo"
    numeral = "❧" if pro else p["rot"]
    label = "Antes de começar" if pro else "Parte"
    nitems = sum(1 for c in p["caps"] for i in c["_items"] if i[0])
    rng = f'páginas {p["first"]}–{p["last"]}' if p["first"] != p["last"] else f'página {p["first"]}'
    caps = "".join(chapter(p, i, c) for i, c in enumerate(p["caps"], 1))
    base = f' data-base="{p5_base}"' if p["id"] == "parte-5" else ""
    return (f'<article class="parte" id="{p["id"]}" data-parte>'
            f'<header class="parte__abre"><div class="parte__sticky">'
            f'<span class="parte__num" aria-hidden="true">{numeral}</span>'
            f'<p class="parte__lbl">{label}</p><h2 class="parte__t">{E(p["titulo"])}</h2>'
            f'<p class="parte__i">{E(p["intro"])}</p>'
            f'<p class="parte__m"><span>{rng}</span><span>{nitems} páginas do site</span></p>'
            f'</div></header>'
            f'<div class="folha"><p class="folha__run"><span>O Livro da Defesa Criminal</span><span>{"Prólogo" if pro else "Parte " + p["rot"]}</span></p>'
            f'<div class="folha__corpo"{base}>{caps}</div></div></article>')


def json_ld():
    items, pos = [], 0
    for p in (PROLOGO, PARTE1, PARTE2, PARTE3, PARTE4):
        for c in p["caps"]:
            for href, t, sub, extra, f in c["_items"]:
                if href and not href.startswith("http"):
                    pos += 1
                    items.append({"@type": "ListItem", "position": pos,
                                  "name": t + (": " + sub if sub and p["id"] in ("parte-2",) else ""),
                                  "url": "https://lucassemim.adv.br/" + href})
    return json.dumps({
        "@context": "https://schema.org", "@type": "CollectionPage",
        "name": "O Livro da Defesa Criminal — Dr. Lucas Semim",
        "description": f"Livro digital com {TOTAL} páginas de defesa criminal: guias de urgência, {n_teses} teses, comarcas atendidas, ferramentas e atualidades. Sabará e Belo Horizonte/MG.",
        "url": "https://lucassemim.adv.br/artigos.html", "inLanguage": "pt-BR",
        "author": {"@type": "Person", "name": "Lucas Renan Semim", "url": "https://lucassemim.adv.br/sobre-mim.html"},
        "mainEntity": {"@type": "ItemList", "numberOfItems": len(items), "itemListElement": items}
    }, ensure_ascii=False, indent=1)


partes_html = "\n".join(parte(p) for p in PARTES)
nav_html = "".join(f'<a href="#{p["id"]}" data-spy="{p["id"]}">{E(NAVNAME[p["id"]])}</a>' for p in PARTES)
stats = [(TOTAL, "páginas"), (n_teses, "teses"), (n_guias, "guias de urgência"), (n_cid, "cidades")]
stats_html = "".join(f'<li><b data-n="{n}">{n}</b><span>{l}</span></li>' for n, l in stats)

TPL = open(os.path.join(BASE, "livro_template.html"), encoding="utf8").read()
rep = {
    "%%JSONLD%%": json_ld(), "%%PARTES%%": partes_html, "%%NAV%%": nav_html, "%%STATS%%": stats_html,
    "%%TOTAL%%": str(TOTAL), "%%NTESES%%": str(n_teses), "%%NGUIAS%%": str(n_guias), "%%NNEWS%%": str(n_news),
    "%%WHATS%%": WHATS, "%%TEL%%": TEL, "%%TELFMT%%": TEL_FMT, "%%P5BASE%%": str(p5_base), "%%ORDEM%%": json.dumps([list(o) for o in ORDEM], ensure_ascii=False),
}
for k, v in rep.items():
    TPL = TPL.replace(k, v)
open(OUT, "w", encoding="utf8").write(TPL)
print("OK", OUT, len(TPL), "bytes | páginas:", TOTAL, "| teses:", n_teses, "| guias:", n_guias, "| notícias:", n_news)
