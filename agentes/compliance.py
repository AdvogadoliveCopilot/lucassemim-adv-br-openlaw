# -*- coding: utf-8 -*-
"""
TRAVAS DE SEGURANÇA E ÉTICA DOS ARTIGOS GERADOS POR IA
======================================================
1) sanitizar_html()        -> só deixa passar tags seguras (sem <script>, <iframe>, onclick etc.)
2) verificar_artigo()      -> acha o que NÃO pode ir ao ar (promessa de resultado, telefone antigo,
                              JSON-LD quebrado...) e o que merece olho humano (valores, datas, "grátis").
3) extrair_citacoes()      -> lista artigos de lei, súmulas, temas e julgados citados, para o Dr. Lucas
                              conferir um a um antes de publicar (IA pode errar número de súmula).

Referência: Provimento 205/2021 do CFOAB (publicidade e marketing jurídicos): conteúdo informativo,
sem promessa de resultado, sem mercantilização, sem sensacionalismo.
"""
import json
import os
import re
from html import escape, unescape
from html.parser import HTMLParser

import config

# ─── 1. SANITIZAÇÃO ──────────────────────────────────────────────────────────
TAGS_BLOCO_E_TEXTO = {
    "p", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "cite", "div", "section", "hr", "br",
    "table", "thead", "tbody", "tr", "th", "td", "details", "summary",
    "strong", "b", "em", "i", "u", "mark", "small", "sup", "sub", "span", "a", "time", "abbr", "q",
}
TAGS_VAZIAS = {"br", "hr"}
TAGS_DESCARTAR_COM_CONTEUDO = {
    "script", "style", "iframe", "object", "embed", "form", "button", "textarea", "select",
    "svg", "math", "noscript", "template", "head", "title", "applet", "frame", "frameset",
}
CLASSES_OK = re.compile(r"^[a-zA-Z0-9_\- ]{1,60}$")
HREF_PROIBIDO = re.compile(r"^\s*(javascript|data|vbscript|file):", re.I)


class _Sanitizador(HTMLParser):
    def __init__(self, link_ok=None):
        super().__init__(convert_charrefs=True)
        self.saida = []
        self.pilha = []            # tags abertas que escrevemos
        self.descartando = 0       # profundidade dentro de tag a descartar com conteúdo
        self.link_ok = link_ok
        self.links_removidos = []
        self.tags_removidas = set()
        self._links_pulados = []   # pilha de bools: True se o <a> aberto foi "desembrulhado"

    def handle_starttag(self, tag, attrs):
        if self.descartando:
            if tag in TAGS_DESCARTAR_COM_CONTEUDO and tag not in TAGS_VAZIAS:
                self.descartando += 1
            return
        if tag in TAGS_DESCARTAR_COM_CONTEUDO:
            self.descartando = 1
            self.tags_removidas.add(tag)
            return
        if tag == "h1":
            tag = "h2"
        if tag not in TAGS_BLOCO_E_TEXTO:
            self.tags_removidas.add(tag)
            return
        atributos = []
        d = {k.lower(): (v or "") for k, v in attrs}
        if tag == "a":
            href = d.get("href", "").strip()
            if not href or HREF_PROIBIDO.match(href) or (self.link_ok and not self.link_ok(href)):
                if href:
                    self.links_removidos.append(href)
                self._links_pulados.append(True)
                return
            self._links_pulados.append(False)
            atributos.append(' href="%s"' % escape(href, quote=True))
            if re.match(r"^https?://", href, re.I) and not href.lower().startswith(config.SITE_URL.lower()):
                atributos.append(' rel="noopener noreferrer" target="_blank"')
            if d.get("title"):
                atributos.append(' title="%s"' % escape(d["title"][:160], quote=True))
        elif tag == "abbr" and d.get("title"):
            atributos.append(' title="%s"' % escape(d["title"][:160], quote=True))
        elif tag == "time" and re.match(r"^[0-9T:\-+Z. ]{4,40}$", d.get("datetime", "")):
            atributos.append(' datetime="%s"' % d["datetime"])
        if d.get("class") and CLASSES_OK.match(d["class"]) and tag != "a":
            atributos.append(' class="%s"' % escape(d["class"], quote=True))
        elif d.get("class") and CLASSES_OK.match(d["class"]):
            atributos.append(' class="%s"' % escape(d["class"], quote=True))
        self.saida.append("<%s%s>" % (tag, "".join(atributos)))
        if tag not in TAGS_VAZIAS:
            self.pilha.append(tag)

    def handle_startendtag(self, tag, attrs):
        if tag in TAGS_VAZIAS and not self.descartando:
            self.saida.append("<%s>" % tag)
        else:
            self.handle_starttag(tag, attrs)
            if not self.descartando:
                self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if self.descartando:
            if tag in TAGS_DESCARTAR_COM_CONTEUDO:
                self.descartando -= 1
            return
        if tag == "h1":
            tag = "h2"
        if tag == "a":
            if self._links_pulados and self._links_pulados.pop():
                return
        if tag in TAGS_VAZIAS or tag not in TAGS_BLOCO_E_TEXTO:
            return
        if tag in self.pilha:
            while self.pilha:
                topo = self.pilha.pop()
                self.saida.append("</%s>" % topo)
                if topo == tag:
                    break

    def handle_data(self, data):
        if not self.descartando:
            self.saida.append(escape(data, quote=False))

    def fechar_tudo(self):
        while self.pilha:
            self.saida.append("</%s>" % self.pilha.pop())


def sanitizar_html(html, link_ok=None):
    """Devolve (html_limpo, info) — info traz tags/links removidos para o relatório."""
    s = _Sanitizador(link_ok=link_ok)
    s.feed(html or "")
    s.close()
    s.fechar_tudo()
    limpo = "".join(s.saida)
    limpo = re.sub(r"\n{3,}", "\n\n", limpo).strip()
    return limpo, {"tags_removidas": sorted(s.tags_removidas), "links_removidos": s.links_removidos}


# ─── 2. LINKS INTERNOS ───────────────────────────────────────────────────────
def link_interno_existe(href, site_dir=None):
    """True se o link é externo/âncora/tel/mailto OU aponta para arquivo que existe no site local."""
    site_dir = site_dir or config.SITE_DIR
    h = href.strip()
    if h.startswith(("#", "mailto:", "tel:")):
        return True
    if re.match(r"^https?://", h, re.I):
        if not h.lower().startswith(config.SITE_URL.lower()):
            return True                      # link externo: não validamos aqui
        h = h[len(config.SITE_URL):] or "/"
    if h.startswith("//"):
        return True
    h = h.split("#", 1)[0].split("?", 1)[0]
    if not h.startswith("/"):
        return False                         # link relativo é ambíguo dentro de /pasta/: exigimos /caminho/completo
    destino = os.path.normpath(os.path.join(site_dir, h.lstrip("/").replace("/", os.sep)))
    if os.path.commonpath([os.path.abspath(site_dir), os.path.abspath(destino)]) != os.path.abspath(site_dir):
        return False
    if h.endswith("/") or os.path.isdir(destino):
        return os.path.exists(os.path.join(destino, "index.html"))
    return os.path.isfile(destino) or os.path.isfile(destino + ".html")


# ─── 3. REGRAS DE CONTEÚDO ───────────────────────────────────────────────────
# BLOQUEIA: promessa/garantia de resultado.
PROMESSA_DE_RESULTADO = [
    r"\bgarantimos\b", r"\bgarantirei\b", r"\bgarantia de (?:[êe]xito|resultado|absolvi[cç][aã]o|liberdade|sucesso|vit[óo]ria)",
    r"\b(?:[êe]xito|resultado|sucesso|liberdade|absolvi[cç][aã]o|vit[óo]ria) garantid[oa]s?\b",
    r"\b100\s?%\s*(?:de\s*)?(?:[êe]xito|sucesso|aprova[cç][aã]o|resultado|certeza|garantid)",
    r"\bsem (?:nenhum )?risco(?: de perder)?\b", r"\bcerteza de (?:soltura|absolvi[cç][aã]o|vit[óo]ria|liberdade)",
    r"\bvamos (?:te )?(?:soltar|absolver|livrar)\b", r"\bsolt(?:amos|aremos) (?:seu|o seu|sua)\b",
    r"\bgarantid[oa]s?\s+(?:a\s+)?(?:soltura|absolvi[cç][aã]o|libera[cç][aã]o|[êe]xito|resultado|vit[óo]ria)\b",
    r"\b(?:soltura|absolvi[cç][aã]o|libera[cç][aã]o|[êe]xito|resultado|vit[óo]ria)\s+(?:est[aá]|[ée]|ser[áa]|fica)\s+garantid[oa]s?\b",
    r"\b(?:vamos|iremos|v[ãa]o)\s+conseguir\s+(?:a\s+|sua\s+|seu\s+)?(?:soltura|liberdade|absolvi[cç][aã]o|liberta[cç][aã]o)\b",
    r"\bconseguimos\s+(?:a\s+)?(?:soltura|absolvi[cç][aã]o)\b",
]
# AVISA: mercantilização e superlativos (Provimento 205) — olho humano.
MERCANTILIZACAO = [
    r"\bgr[áa]tis\b", r"\bgratuit[oa]s?\b", r"\bdescontos?\b", r"\bpromo[cç][aã]o\b", r"\bbarat[oa]s?\b",
    r"\bo melhor advogado\b", r"\bmelhor escrit[óo]rio\b", r"\bn[úu]mero\s*1\b", r"\bl[íi]der\b",
    r"\bhonor[áa]rios? (?:a partir|de apenas)\b", r"\bparcel(?:amos|e em)\b",
]
# AVISA: afirmações presas a uma data que a IA não tem como saber.
AFIRMACAO_DATADA = [
    r"\bhoje\b", r"\bontem\b", r"\bamanh[ãa]\b", r"\bnesta semana\b", r"\bneste m[êe]s\b", r"\brecentemente\b",
    r"\bacabou de (?:ser )?(?:decidido|julgado|aprovado|publicado)\b", r"\b[úu]ltimas? horas\b", r"\bnovidade\b",
    r"\bem 202[4-9]\b",
]
VALOR_EM_REAIS = re.compile(r"R\$\s?\d")

PADROES_CITACAO = [
    r"\b[Aa]rts?\.?\s*\d+[\wº°\-]*(?:\s*,?\s*(?:§\s*\d+[º°]?|par[áa]grafo\s+[úu]nico|inciso\s+[IVXLC]+|caput|[IVXLC]{1,6}\b))?"
    r"(?:\s*(?:do|da|dos|das)\s+(?:CPP|CPC|CP|CC|CF(?:/88)?|LEP|CTB|ECA|Lei\s*(?:n[ºo°.]*\s*)?[\d./]+|"
    r"Constitui[cç][aã]o(?:\s+Federal)?|C[óo]digo\s+(?:Penal|Civil|de\s+Processo\s+\w+|de\s+Tr[âa]nsito[^,.;]{0,20}))\b)?",
    r"\bS[úu]mulas?(?:\s+Vinculante)?\s*(?:n[ºo°.]*\s*)?\d+(?:\s*(?:do|da|/)\s*(?:STF|STJ|TST|TSE))?",
    r"\bLei(?:\s+Complementar)?\s*(?:n[ºo°.]*\s*)?\d[\d.]*(?:/\d{2,4})?",
    r"\bTemas?\s*(?:n[ºo°.]*\s*)?\d[\d.]*(?:\s*(?:do|da)\s*(?:STF|STJ))?",
    r"\b(?:HC|RHC|REsp|AREsp|RE|ARE|ADPF|ADI|ADC|AgRg|EREsp|Rcl)\s*(?:n[ºo°.]*\s*)?\d[\d.]*(?:/[A-Z]{2})?",
    r"\bResolu[cç][aã]o(?:\s+CNJ)?\s*(?:n[ºo°.]*\s*)?\d+(?:/\d{2,4})?",
    r"\bDecreto(?:-Lei)?\s*(?:n[ºo°.]*\s*)?\d[\d.]*(?:/\d{2,4})?",
]


def _texto_puro(html):
    t = re.sub(r"<(script|style)\b.*?</\1>", " ", html or "", flags=re.S | re.I)
    t = re.sub(r"<[^>]+>", " ", t)
    return re.sub(r"\s+", " ", unescape(t)).strip()


def contar_palavras(html):
    return len(_texto_puro(html).split())


def extrair_citacoes(html):
    """Lista (sem repetir, na ordem do texto) tudo que parece citação legal/jurisprudencial."""
    texto = _texto_puro(html)
    achados = []
    for padrao in PADROES_CITACAO:
        for m in re.finditer(padrao, texto):
            achados.append((m.start(), re.sub(r"\s+", " ", m.group(0)).strip(" ,;.")))
    achados.sort()
    vistos, saida = set(), []
    for _, c in achados:
        chave = c.lower()
        if len(c) >= 4 and chave not in vistos:
            vistos.add(chave)
            saida.append(c)
    return saida


def _blocos_jsonld(html):
    return re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html or "", flags=re.S | re.I)


def verificar_artigo(html, corpo_html=None):
    """
    Confere a página inteira (html) e, separado, o miolo gerado pela IA (corpo_html).
    Retorna {"erros": [...], "avisos": [...], "citacoes": [...], "palavras": n}
    erros  = NÃO publicar enquanto existir.
    avisos = publicar só depois de olhar.
    """
    erros, avisos = [], []
    corpo = corpo_html if corpo_html is not None else html
    texto = _texto_puro(corpo)
    texto_baixo = texto.lower()

    if re.search(r"\[\s*CONFERIR\s*\]", corpo or "", flags=re.I):
        erros.append("Ainda há marcador [CONFERIR] no texto — confirme a citação e apague o marcador")
    for padrao in PROMESSA_DE_RESULTADO:
        for m in re.finditer(padrao, texto_baixo, flags=re.I):
            antes = texto_baixo[max(0, m.start() - 35):m.start()]
            if re.search(r"\b(n[ãa]o|nem|sem|nunca|jamais|ningu[ée]m)\b", antes):
                continue            # "não há garantia de resultado" é o contrário de uma promessa
            erros.append("Promessa/garantia de resultado: “%s” (vedado pelo Provimento 205/2021)" % m.group(0))
            break
    for padrao in MERCANTILIZACAO:
        m = re.search(padrao, texto_baixo, flags=re.I)
        if m:
            avisos.append("Termo comercial/superlativo: “%s” — revisar (publicidade jurídica não pode mercantilizar)" % m.group(0))
    datadas = sorted({m.group(0) for p in AFIRMACAO_DATADA for m in re.finditer(p, texto_baixo, flags=re.I)})
    if datadas:
        avisos.append("Afirmação presa a data/momento (a IA não sabe o dia de hoje): %s — confirmar ou reescrever" % ", ".join(datadas[:8]))
    valores = VALOR_EM_REAIS.findall(texto)
    if valores:
        avisos.append("Há valores em reais no texto (%d) — conferir se são de lei/jurisprudência e nunca de honorários" % len(valores))

    for proibido in config.TELEFONES_PROIBIDOS:
        if proibido in (html or ""):
            erros.append("Telefone antigo/placeholder na página: %s" % proibido)
    if config.WHATSAPP_NUM not in (html or "") and config.TELEFONE not in (html or ""):
        erros.append("O telefone novo %s não aparece na página" % config.TELEFONE)

    if re.search(r"<\s*(script|iframe|object|embed|form)\b", corpo or "", flags=re.I) or \
       re.search(r"\son[a-z]+\s*=", corpo or "", flags=re.I) or re.search(r"javascript:", corpo or "", flags=re.I):
        erros.append("Código ativo (script/iframe/evento) dentro do texto do artigo")
    if len(re.findall(r"<h1\b", html or "", flags=re.I)) != 1:
        erros.append("A página precisa ter exatamente um H1")
    if not re.search(r"<h2\b", corpo or "", flags=re.I):
        avisos.append("O texto não tem nenhum subtítulo H2")

    for i, bloco in enumerate(_blocos_jsonld(html), start=1):
        try:
            json.loads(bloco)
        except ValueError as e:
            erros.append("JSON-LD nº %d inválido: %s" % (i, e))
    if not _blocos_jsonld(html):
        erros.append("Sem dados estruturados (JSON-LD)")

    palavras = contar_palavras(corpo)
    if palavras < 350:
        avisos.append("Texto curto: %d palavras (meta mínima do site: ~600)" % palavras)

    return {"erros": erros, "avisos": avisos, "citacoes": extrair_citacoes(corpo), "palavras": palavras}


def extrair_corpo(html):
    """Miolo do artigo (entre os marcadores do template), sem aviso legal, CTA e rodapé."""
    m = re.search(r"<!--ARTIGO-INICIO-->(.*?)<!--ARTIGO-FIM-->", html or "", flags=re.S)
    return m.group(1) if m else (html or "")
