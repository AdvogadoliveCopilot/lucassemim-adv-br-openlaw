#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
validar_guia_v3.py - confere uma pagina de /o-que-fazer-agora/ (molde V3) ANTES de entregar.
Usa so a biblioteca padrao do Python: nao precisa instalar nada.

Uso:
  python validar_guia_v3.py PAGINA.html [PAGINA2.html ...] [opcoes]
  python validar_guia_v3.py --todas PASTA_O_QUE_FAZER_AGORA [opcoes]

Opcoes:
  --raiz PASTA       raiz do site (onde ficam defesa-criminal/, news/ ...) para conferir se os links
                     internos existem. Alternativa: --existentes ARQ.txt (um caminho por linha, ex.:
                     defesa-criminal/habeas-corpus.html)
  --sitemap ARQ.xml  confere se a pagina esta no sitemap-urgencia.xml (1 vez, com data)
  --hub ARQ.html     confere se a pagina esta no indice (cartao + dados estruturados)
  --guias PASTA      pasta com as OUTRAS paginas: detecta tema repetido e texto copiado
  --novo             pagina nova (ainda nao publicada): "especialista" passa a ser ERRO
  --calma            nao lista as citacoes legais no fim

Saida: ERRO (corrigir antes de entregar), AVISO (conferir e decidir), ok.  Codigo de saida 1 se houver ERRO.
"""
import argparse, glob, html, json, os, re, sys, difflib
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

BASE = 'https://lucassemim.adv.br'
FONE = '5531989420094'
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
TRACK = {'html', 'head', 'body', 'main', 'section', 'div', 'nav', 'ul', 'ol', 'li', 'a', 'button', 'span', 'strong',
         'em', 'b', 'i', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'script', 'style', 'footer', 'header', 'article',
         'aside', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'details', 'summary', 'form', 'label', 'blockquote',
         'small', 'figure', 'figcaption', 'select', 'option', 'noscript'}
BLOCOS = ['oq-live', 'oq-hero-cta', 'oq-hero-central', 'oq-proof', 'oq-side', 'oq-quote', 'oq-how', 'oq-pledge',
          'oq-band', 'oq-final', 'sticky-cta-urgency', 'faq-item-urgency', 'warning-box', 'container-urgency',
          'h1-urgency', 'breadcrumb-custom', 'trust-badge-compact', 'btn-whatsapp-urgency']
CTAS = ['whatsapp_topo', 'ligar_topo', 'central_topo', 'whatsapp_lateral', 'ligar_lateral', 'central_lateral',
        'whatsapp_meio', 'ligar_meio', 'whatsapp_final', 'ligar_final', 'central_final', 'whatsapp_barra',
        'ligar_barra']
SCRIPTS = ['bootstrap.bundle.min.js', 'codelei/analytics.js', 'js/ai-neural-seo.js', 'js/ads-intelligence.js',
           'js/lgpd.js', 'js/tradutor-global.js', 'js/vlibras-plugin.js', 'js/vcard-smart.js', 'js/diagnostico.js',
           'js/header-elite.js', 'js/footer-seo.js', 'js/chat-elite.js', 'js/smart-cta.js', 'js/oqfa-v3.js',
           'js/page-v2.js']
CSSV3 = ['css/header-lux.css', 'css/lucas-v2-pages.css', 'css/oqfa-v3.css']
EXT_OK = ('wa.me', 'planalto.gov.br', 'www.planalto.gov.br', 'stf.jus.br', 'portal.stf.jus.br', 'www.stf.jus.br',
          'stj.jus.br', 'www.stj.jus.br', 'processo.stj.jus.br', 'cnj.jus.br', 'www.cnj.jus.br', 'oab.org.br',
          'www.oab.org.br', 'conselho.saude.gov.br', 'cal.com', 'app.cal.com')
FONES_ANTIGOS = [r'5531983944973', r'98394[\s.\-]?4973', r'9\s?8394\s?4973', r'983944973', r'3183944973']

P_PROMESSA = re.compile(
    r'garantimos|garantia de (?:êxito|exito|resultado|absolvição|absolvicao|liberdade)|resultado garantido|'
    r'sucesso garantido|liberdade garantida|100\s?%\s?(?:de\s)?(?:êxito|exito|sucesso|aprova|eficaz|garant)|'
    r'certeza de (?:vitória|vitoria|absolvição|liberdade)|vamos (?:te |lhe )?(?:livrar|soltar|tirar da)|'
    r'conseguimos (?:a )?(?:sua )?liberdade|(?:já|ja) (?:soltamos|libertamos|absolvemos|livramos)', re.I)
P_GRATIS = re.compile(r'gratuit|gr[áa]tis|sem custo|sem cobran[çc]a|de gra[çc]a|desconto', re.I)
P_SUPER = re.compile(
    r'melhor(?:es)? (?:advogad|escrit)|maior escrit|n[úu]mero 1|\bn[º°o]\s?1\b|\bl[íi]der\b|refer[êe]ncia (?:em|nacional|no )|'
    r'renomad|mais procurad', re.I)
P_PRAZO = re.compile(
    r'em at[ée]\s*\d+\s*(?:min|minuto|hora|h\b)|(?:resposta|retorno|atendimento)\s+(?:imediat|em\s+\d+|em at[ée])|'
    r'respond\w*\s+em\s+\d+|em\s+\d+\s*minutos|\d+\s*min(?:utos)?\s+(?:ou menos|para)', re.I)
P_CASOS = re.compile(
    r'depoimentos? d[eo]s? (?:nossos |meus )?clientes?|testemunho de cliente|cliente(?:s)? satisfeit|caso real|j[áa] (?:atuei|defendi|atendi)|'
    r'(?:mais de|centenas de|milhares de)\s+\d*\s*(?:casos|clientes|processos)', re.I)
P_HONOR = re.compile(r'honor[áa]ri|parcel(?:a|amento)|R\$\s?\d', re.I)
P_ESPEC = re.compile(r'\bespecialista', re.I)
P_CATEG = re.compile(
    r'\b(?:sempre|nunca|jamais|imposs[íi]vel|obrigatoriamente|em hip[óo]tese alguma|sob nenhuma|automaticamente|'
    r'necessariamente|todos os casos)\b', re.I)
NEGA = re.compile(r'(?:n[ãa]o|nenhum[a]?|sem|nem)\b[^.]{0,28}$', re.I)

CITA = [
    ('Lei', r'\bLei (?:Complementar |Federal |Estadual )?(?:n[ºo.]*\s*)?\d{1,3}(?:\.\d{3})?/\d{2,4}'),
    ('Artigo', r'\bart(?:igos?|s?\.)\s*\d+[A-Za-zº°\-]*(?:[,\s]+(?:§|par[áa]grafo|inciso|caput)[^,.;)]{0,18})?'),
    ('Sumula', r'\bS[úu]mula(?: Vinculante)?\s*(?:n[ºo.]*\s*)?\d+(?:\s*d[oa]\s*(?:STF|STJ))?'),
    ('Julgado', r'\b(?:HC|RHC|REsp|AREsp|RE|ADI|ADPF|ADC|ARE|Rcl)\s*(?:n[ºo.]*\s*)?\d[\d.]*'),
    ('Tema', r'\bTema\s*(?:n[ºo.]*\s*)?\d+'),
    ('Norma', r'\b(?:Resolu[çc][ãa]o|Provimento|Recomenda[çc][ãa]o)\s*(?:CNJ\s*)?(?:n[ºo.]*\s*)?\d+(?:/\d{2,4})?'),
]


def nz(t):
    return re.sub(r'\s+', ' ', html.unescape(t or '')).strip()


class Pg(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.stack = []; s.balance = []; s.ids = []; s.attrvals = []; s.metas = {}; s.title = ''
        s.ld = []; s.inline = []; s.text = []; s.h1 = []; s.faq_q = []; s.faq_a = []
        s.classes = set(); s.html_class = ''; s.links = []; s.scripts = []; s.css = []; s.imgs = []
        s.ctas = []; s.tags = {}; s.canonical = ''; s.hrefs = []
        s._cur = None; s._skip = 0; s._head = False; s._title = False; s._cap = None
        s.charset = False; s.viewport = False; s.hdr_in_body = False; s._body = False

    # ---- helpers
    def _push_cap(s, kind):
        s._cap = {'kind': kind, 'depth': len(s.stack), 'buf': []}

    def handle_starttag(s, tag, attrs):
        a = {k: (v if v is not None else '') for k, v in attrs}
        s.tags[tag] = s.tags.get(tag, 0) + 1
        for v in a.values():
            s.attrvals.append(v)
        if 'id' in a:
            s.ids.append(a['id'])
        cls = a.get('class', '').split()
        for c in cls:
            s.classes.add(c)
        if tag == 'html':
            s.html_class = a.get('class', '')
        if tag == 'head':
            s._head = True
        if tag == 'body':
            s._body = True
        if tag == 'header' and s._body:
            s.hdr_in_body = True
        if tag == 'title':
            s._title = True
        if tag == 'meta':
            k = a.get('name') or a.get('property') or ''
            if k:
                s.metas[k.lower()] = a.get('content', '')
            if 'charset' in a:
                s.charset = True
            if k.lower() == 'viewport':
                s.viewport = True
        if tag == 'link':
            rel = a.get('rel', '').lower()
            if rel == 'canonical':
                s.canonical = a.get('href', '')
            if 'stylesheet' in rel:
                s.css.append(a.get('href', ''))
        if tag == 'script':
            s.scripts.append(a.get('src', ''))
            if a.get('type', '').lower() == 'application/ld+json':
                s._cur = 'ld'; s.ld.append('')
            elif not a.get('src'):
                s._cur = 'inline'; s.inline.append('')
        if tag in ('script', 'style', 'noscript', 'template'):
            s._skip += 1
        if tag == 'a':
            s.links.append((a.get('href', ''), a))
            if 'data-oq-cta' in a:
                s.ctas.append((a['data-oq-cta'], a.get('href', '')))
        if tag == 'img':
            s.imgs.append(a)
        if 'faq-question-urgency' in cls:
            s._push_cap('q')
        elif 'faq-answer-urgency' in cls:
            s._push_cap('a')
        if tag == 'h1':
            s._push_cap('h1') if s._cap is None else None
        if tag in TRACK and tag not in VOID:
            s.stack.append((tag, s.getpos()[0]))

    def handle_endtag(s, tag):
        if tag == 'title':
            s._title = False
        if tag == 'head':
            s._head = False
        if tag in ('script', 'style', 'noscript', 'template') and s._skip:
            s._skip -= 1
        if tag == 'script':
            s._cur = None
        if tag in TRACK and tag not in VOID:
            idx = None
            for i in range(len(s.stack) - 1, -1, -1):
                if s.stack[i][0] == tag:
                    idx = i; break
            if idx is None:
                s.balance.append('</%s> sem abertura (linha %d)' % (tag, s.getpos()[0]))
            else:
                for t, ln in s.stack[idx + 1:]:
                    s.balance.append('<%s> aberto na linha %d nao foi fechado antes de </%s> (linha %d)' % (t, ln, tag, s.getpos()[0]))
                del s.stack[idx:]
        c = s._cap
        if c and len(s.stack) == c['depth']:
            txt = nz(''.join(c['buf']))
            {'q': s.faq_q, 'a': s.faq_a, 'h1': s.h1}[c['kind']].append(txt)
            s._cap = None

    def handle_data(s, d):
        if s._title:
            s.title += d
        if s._cur == 'ld':
            s.ld[-1] += d
        elif s._cur == 'inline':
            s.inline[-1] += d
        if s._skip or s._head:
            return
        s.text.append(d)
        if s._cap is not None:
            s._cap['buf'].append(d)

    def close(s):
        super().close()
        for t, ln in s.stack:
            if t not in ('html', 'body'):
                s.balance.append('<%s> aberto na linha %d nunca foi fechado' % (t, ln))


class Rel:
    def __init__(s, nome):
        s.nome = nome; s.itens = []

    def add(s, nivel, cod, msg):
        s.itens.append((nivel, cod, msg))

    @property
    def erros(s):
        return sum(1 for i in s.itens if i[0] == 'ERRO')

    @property
    def avisos(s):
        return sum(1 for i in s.itens if i[0] == 'AVISO')


def trecho(txt, m, n=70):
    a = max(0, m.start() - n // 2); b = min(len(txt), m.end() + n // 2)
    return '...' + txt[a:b].replace('\n', ' ') + '...'


def palavras(t):
    return re.findall(r'[0-9a-zA-ZÀ-ÿ]+', t.lower())


def shingles(t, k=6):
    w = palavras(t)
    return set(tuple(w[i:i + k]) for i in range(max(0, len(w) - k + 1)))


def texto_visivel(p):
    return nz(' '.join(p.text))


def carregar(path):
    raw = open(path, 'rb').read()
    return raw, raw.decode('utf-8')


def existe_local(url, raiz, existentes):
    path = url[len(BASE):].split('#')[0].split('?')[0]
    cand = []
    if path in ('', '/'):
        cand = ['index.html']
    elif path.endswith('/'):
        cand = [path.lstrip('/') + 'index.html']
    else:
        p = path.lstrip('/')
        cand = [p] if os.path.splitext(p)[1] else [p + '.html', p + '/index.html']
    for c in cand:
        if existentes is not None and c in existentes:
            return True
        if raiz and os.path.exists(os.path.join(raiz, c.replace('/', os.sep))):
            return True
    return False


def validar(path, o):
    r = Rel(os.path.basename(path))
    raw, s = carregar(path)
    nome = os.path.basename(path)
    url = '%s/o-que-fazer-agora/%s' % (BASE, nome)
    p = Pg(); p.feed(s); p.close()
    vis = texto_visivel(p)
    meta_txt = ' '.join([p.title, p.metas.get('description', ''), p.metas.get('og:title', ''), p.metas.get('og:description', '')])
    ld_txt = ' '.join(p.ld)
    tudo = ' '.join([vis, meta_txt, ld_txt])

    # ---------------- arquivo
    if raw.startswith(b'\xef\xbb\xbf'):
        r.add('ERRO', 'A01', 'arquivo com BOM (grave em UTF-8 puro)')
    if b'\r\n' in raw and raw.count(b'\n') != raw.count(b'\r\n'):
        r.add('AVISO', 'A02', 'quebras de linha misturadas (CRLF e LF no mesmo arquivo)')
    if re.search(r'Ã[§£©³¡ª´]|â€|�', s):
        r.add('ERRO', 'A03', 'texto com caracteres quebrados (acentos corrompidos)')
    kb = len(raw) / 1024.0
    if kb < 30 or kb > 70:
        r.add('AVISO', 'A04', 'tamanho %.0f KB fora da faixa usual (30 a 70 KB) das outras paginas' % kb)
    if not p.charset or not p.viewport:
        r.add('ERRO', 'A05', 'faltam <meta charset> e/ou <meta viewport>')
    if not s.lstrip().lower().startswith('<!doctype html'):
        r.add('ERRO', 'A06', 'falta <!DOCTYPE html> na primeira linha')

    # ---------------- molde V3
    if 'oq3' not in p.html_class.split():
        r.add('ERRO', 'E01', 'a tag <html> nao tem class="oq3"')
    for f in CSSV3:
        if not any(f in h for h in p.css):
            r.add('ERRO', 'E02', 'falta carregar %s' % f)
    falt = [b for b in BLOCOS if b not in p.classes]
    if falt:
        r.add('ERRO', 'E03', 'blocos do molde V3 ausentes: ' + ', '.join(falt))
    rot = [c for c, _ in p.ctas]
    faltc = [c for c in CTAS if c not in rot]
    extra = [c for c in rot if c not in CTAS]
    dup = sorted(set(c for c in rot if rot.count(c) > 1))
    if faltc:
        r.add('ERRO', 'E04', 'faltam botoes rastreados (data-oq-cta): ' + ', '.join(faltc))
    if extra:
        r.add('AVISO', 'E04', 'botoes rastreados fora do padrao: ' + ', '.join(extra))
    if dup:
        r.add('ERRO', 'E04', 'data-oq-cta repetido: ' + ', '.join(dup))
    for c, h in p.ctas:
        if c.startswith('whatsapp_') and not h.startswith('https://wa.me/' + FONE):
            r.add('ERRO', 'E05', 'botao %s nao aponta para https://wa.me/%s (href=%s)' % (c, FONE, h[:60]))
        if c.startswith('ligar_') and h != 'tel:+' + FONE:
            r.add('ERRO', 'E05', 'botao %s deve ser tel:+%s (href=%s)' % (c, FONE, h[:60]))
        if c.startswith('central_') and 'diagnostico.html' not in h:
            r.add('ERRO', 'E05', 'botao %s deve abrir diagnostico.html (href=%s)' % (c, h[:60]))
    if len(p.h1) != 1 or p.tags.get('h1', 0) != 1:
        r.add('ERRO', 'E06', 'a pagina precisa de exatamente 1 <h1> (achei %d)' % p.tags.get('h1', 0))
    if 'footer-master-injecao' not in p.ids:
        r.add('ERRO', 'E07', 'falta <div id="footer-master-injecao"></div> (rodape injetado)')
    if p.hdr_in_body:
        r.add('AVISO', 'E07', 'ha <header> manual no corpo; o cabecalho vem de header-elite.js')
    pos = []
    for chave in SCRIPTS:
        ix = next((i for i, sc in enumerate(p.scripts) if chave in sc), None)
        if ix is None:
            r.add('ERRO', 'E08', 'falta o script ' + chave)
        pos.append(ix)
    got = [x for x in pos if x is not None]
    if got != sorted(got):
        r.add('ERRO', 'E08', 'scripts fora da ordem padrao do final do <body>')
    if not any("'consent', 'default'" in x and 'denied' in x for x in p.inline):
        r.add('ERRO', 'E09', 'falta o Consent Mode "negado por padrao" (gtag consent default) no <head>')
    if p.balance:
        for b in p.balance[:8]:
            r.add('ERRO', 'E10', 'tags: ' + b)
    dups = sorted(set(i for i in p.ids if p.ids.count(i) > 1))
    if dups:
        r.add('ERRO', 'E11', 'ids duplicados: ' + ', '.join(dups))
    vazios = [h for h, _ in p.links if h.strip() in ('#', '', 'javascript:void(0)') or h.strip().lower().startswith('javascript:')]
    if vazios:
        r.add('ERRO', 'E12', '%d link(s) vazio(s) (href="#" ou javascript:)' % len(vazios))
    if 'noindex' in p.metas.get('robots', '').lower():
        r.add('ERRO', 'E13', 'meta robots com noindex numa pagina que deve aparecer no Google')

    # ---------------- SEO / URLs
    t = nz(p.title)
    d = nz(p.metas.get('description', ''))
    if len(t) < 30 or len(t) > 95:
        r.add('AVISO', 'S01', 'title com %d caracteres (usual: 45 a 90)' % len(t))
    if len(d) < 90 or len(d) > 170:
        r.add('AVISO', 'S01', 'description com %d caracteres (usual: 110 a 165)' % len(d))
    if p.canonical != url:
        r.add('ERRO', 'S02', 'canonical deveria ser %s (achei %s)' % (url, p.canonical or 'nada'))
    if p.metas.get('og:url', '') != url:
        r.add('ERRO', 'S02', 'og:url deveria ser %s (achei %s)' % (url, p.metas.get('og:url', 'nada')))
    if not p.metas.get('og:image', '').startswith(BASE + '/'):
        r.add('AVISO', 'S02', 'og:image ausente ou fora de %s' % BASE)
    for local in ('sabar', 'belo horizonte'):
        if local not in vis.lower():
            r.add('AVISO', 'S03', 'o texto visivel nao cita "%s" (SEO local)' % ('Sabará' if local == 'sabar' else 'Belo Horizonte'))
    hub_link = any(h in (BASE + '/o-que-fazer-agora/', BASE + '/o-que-fazer-agora') for h, _ in p.links)
    if not hub_link:
        r.add('ERRO', 'S04', 'falta link para o indice %s/o-que-fazer-agora/' % BASE)
    outros_guias = set(h for h, _ in p.links if h.startswith(BASE + '/o-que-fazer-agora/') and h not in (url, BASE + '/o-que-fazer-agora/') and h.endswith('.html'))
    if len(outros_guias) < 2:
        r.add('AVISO', 'S04', 'poucos links para outros guias do indice (%d); o usual e 3 ou mais' % len(outros_guias))
    arts = set(h for h, _ in p.links if re.match(re.escape(BASE) + r'/(?:defesa-criminal|news)/', h))
    if not arts:
        r.add('AVISO', 'S04', 'nenhum link para artigo de /defesa-criminal/ ou /news/')
    for h, a in p.links:
        hh = h.strip()
        if hh.startswith('http://'):
            r.add('ERRO', 'S05', 'link sem https: ' + hh[:80])
        if '://www.lucassemim' in hh:
            r.add('ERRO', 'S05', 'link com www (o site usa o dominio sem www): ' + hh[:80])
        if hh and not re.match(r'(?:https?:|tel:|mailto:|#|javascript:|/(?!/))', hh):
            r.add('AVISO', 'S05', 'link relativo (use URL absoluta): ' + hh[:80])
        if a.get('target') == '_blank' and 'noopener' not in a.get('rel', ''):
            r.add('AVISO', 'S06', 'target="_blank" sem rel="noopener": ' + hh[:70])
        m = re.match(r'https?://([^/]+)', hh)
        if m and m.group(1) != 'lucassemim.adv.br' and m.group(1) not in EXT_OK:
            r.add('AVISO', 'S07', 'link externo fora da lista usual: ' + hh[:90])
    sem_alt = [i for i in p.imgs if 'alt' not in i]
    if sem_alt:
        r.add('AVISO', 'S08', '%d imagem(ns) sem alt' % len(sem_alt))
    # links internos existem?
    if o.raiz or o.existentes is not None:
        internos = set((BASE + h) if re.match(r'/(?!/)', h) else h for h, _ in p.links if h.startswith(BASE) or re.match(r'/(?!/)', h))
        for h in sorted(internos):
            if not existe_local(h, o.raiz, o.existentes):
                r.add('ERRO', 'S09', 'link interno para arquivo que nao existe: ' + h)
    else:
        r.add('AVISO', 'S09', 'nao conferi se os links internos existem (use --raiz ou --existentes)')

    # ---------------- JSON-LD
    objs = []
    for i, raw_ld in enumerate(p.ld):
        try:
            v = json.loads(raw_ld)
            objs.extend(v if isinstance(v, list) else [v])
        except Exception as e:
            r.add('ERRO', 'J01', 'JSON-LD #%d invalido: %s' % (i + 1, e))
    tipos = {}
    for ob in objs:
        tp = ob.get('@type')
        tipos[tp if isinstance(tp, str) else str(tp)] = ob
    for tp in ('LegalService', 'Article', 'FAQPage'):
        if tp not in tipos:
            r.add('ERRO', 'J02', 'falta o bloco JSON-LD %s' % tp)
    ls = tipos.get('LegalService')
    if ls:
        if ls.get('@id') != BASE + '/#LegalService':
            r.add('ERRO', 'J03', 'LegalService com @id diferente do padrao do site')
        if ls.get('telephone') != '+' + FONE:
            r.add('ERRO', 'J03', 'LegalService com telefone diferente de +%s' % FONE)
    ar = tipos.get('Article')
    if ar:
        if not str(ar.get('@id', '')).startswith(url):
            r.add('ERRO', 'J04', 'Article com @id fora da URL da pagina')
        if len(ar.get('headline', '')) > 110:
            r.add('AVISO', 'J04', 'headline do Article com mais de 110 caracteres')
    fq = tipos.get('FAQPage')
    if fq:
        ents = fq.get('mainEntity', [])
        if len(ents) != len(p.faq_q):
            r.add('ERRO', 'J05', 'FAQ: %d perguntas nos dados estruturados e %d no acordeao visivel' % (len(ents), len(p.faq_q)))
        if not 4 <= len(p.faq_q) <= 9:
            r.add('AVISO', 'J05', 'FAQ com %d perguntas (usual: 5 a 7)' % len(p.faq_q))
        vis_q = {x: i for i, x in enumerate(p.faq_q)}
        for e in ents:
            q = nz(e.get('name', ''))
            a = nz(re.sub(r'<[^>]+>', ' ', e.get('acceptedAnswer', {}).get('text', '')))
            if q not in vis_q:
                r.add('ERRO', 'J05', 'FAQ: pergunta dos dados estruturados nao aparece igual na pagina: ' + q[:70])
                continue
            va = p.faq_a[vis_q[q]] if vis_q[q] < len(p.faq_a) else ''
            if a != va:
                if a and va and (a in va or va in a):
                    r.add('AVISO', 'J05', 'FAQ: resposta difere em detalhe do texto visivel: ' + q[:60])
                else:
                    r.add('ERRO', 'J05', 'FAQ: resposta dos dados estruturados diferente da visivel: ' + q[:60])
    # ---------------- telefone
    if FONE not in s or '98942-0094' not in s:
        r.add('ERRO', 'T01', 'falta o telefone novo (%s e/ou 98942-0094)' % FONE)
    for pad in FONES_ANTIGOS:
        if re.search(pad, s):
            r.add('ERRO', 'T02', 'contem o telefone ANTIGO (padrao %s)' % pad)
    pool = ' '.join([vis] + p.attrvals + p.ld)
    achados = set()
    for m in re.finditer(r'(?<![\d.])(?:\+?55\s?)?\(?(\d{2})\)?[\s\-.]?(9?\d{4})[\s\-.]?(\d{4})(?!\d)', pool):
        dig = re.sub(r'\D', '', m.group(0))
        if dig.startswith('55') and len(dig) > 11:
            dig = dig[2:]
        if dig != '31989420094' and dig not in achados:
            achados.add(dig)
            r.add('AVISO', 'T03', 'numero parecido com telefone diferente do oficial: ' + m.group(0).strip())
    for h, _ in p.links:
        if h.startswith('tel:') and h != 'tel:+' + FONE:
            r.add('ERRO', 'T04', 'link tel: diferente do oficial: ' + h)
        if 'wa.me/' in h and 'wa.me/' + FONE not in h:
            r.add('ERRO', 'T04', 'link wa.me diferente do oficial: ' + h[:70])
        if 'wa.me/' in h and re.search(r'text=[^"]*[ "]', h):
            r.add('ERRO', 'T05', 'mensagem do WhatsApp com espaco ou aspas sem codificar (use %20): ' + h[:70])

    # ---------------- conformidade (Provimento 205/2021)
    if not re.search(r'Provimento\s*(?:n[ºo.]*\s*)?205', vis):
        r.add('ERRO', 'C01', 'falta o paragrafo de conformidade com o Provimento 205/2021 da OAB')
    for m in P_ESPEC.finditer(tudo):
        r.add('ERRO' if o.novo else 'AVISO', 'C02', '"especialista" so pode ser usado com titulo certificado (Prov. 205/2021, art. 3o, III): ' + trecho(tudo, m))
        break
    for pat, cod, msg, nivel in ((P_PROMESSA, 'C03', 'promessa de resultado (Prov. 205/2021, art. 6o)', 'ERRO'),
                                  (P_GRATIS, 'C04', 'gratuidade/desconto (Prov. 205/2021, art. 3o, I)', 'ERRO'),
                                  (P_SUPER, 'C05', 'autoengrandecimento ou comparacao (Prov. 205/2021, art. 3o, IV)', 'ERRO'),
                                  (P_CASOS, 'C06', 'depoimento/caso concreto/numero de clientes (Prov. 205/2021, art. 6o)', 'ERRO')):
        for m in pat.finditer(tudo):
            if pat is P_PROMESSA and NEGA.search(tudo[max(0, m.start() - 40):m.start()]):
                continue
            r.add(nivel, cod, msg + ': ' + trecho(tudo, m))
    for m in P_PRAZO.finditer(tudo):
        r.add('AVISO', 'C07', 'prazo: confira se e prazo da LEI (ok) ou promessa do escritorio (proibido): ' + trecho(tudo, m))
    for m in P_HONOR.finditer(tudo):
        r.add('AVISO', 'C08', 'honorarios/valores: nao cite valores nem forma de pagamento (Prov. 205/2021, art. 3o, I): ' + trecho(tudo, m))
    cat = list(P_CATEG.finditer(vis))
    if cat:
        ex = '; '.join(trecho(vis, m, 50) for m in cat[:5])
        r.add('AVISO', 'C09', '%d afirmacao(oes) categorica(s) (sempre/nunca/impossivel...): confirme base legal ou suavize. Ex.: %s' % (len(cat), ex))

    # ---------------- cruzamentos opcionais
    if o.sitemap:
        try:
            rt = ET.parse(o.sitemap).getroot()
            ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            achou = [u for u in rt.findall('s:url', ns) if (u.findtext('s:loc', '', ns) or '').strip() == url]
            if len(achou) != 1:
                r.add('ERRO', 'X01', 'sitemap: a URL aparece %d vez(es) (deve ser 1)' % len(achou))
            elif not re.fullmatch(r'\d{4}-\d{2}-\d{2}', (achou[0].findtext('s:lastmod', '', ns) or '').strip()):
                r.add('ERRO', 'X01', 'sitemap: lastmod ausente ou fora do formato AAAA-MM-DD')
        except Exception as e:
            r.add('ERRO', 'X01', 'sitemap ilegivel: %s' % e)
    if o.hub:
        hs = open(o.hub, 'rb').read().decode('utf-8')
        n_card = len(re.findall(r'<a href="%s" class="guide-card">' % re.escape(url), hs))
        if n_card != 1:
            r.add('ERRO', 'X02', 'indice: o cartao do guia aparece %d vez(es) (deve ser 1)' % n_card)
        n_ld = len(re.findall(r'"url": "%s"' % re.escape(url), hs))
        if n_ld != 1:
            r.add('ERRO', 'X02', 'indice: o guia aparece %d vez(es) na lista de dados estruturados (deve ser 1)' % n_ld)

    return r, p, vis, tudo


def citacoes(tudo):
    out = []
    for nome, pat in CITA:
        achados = sorted(set(nz(m.group(0)) for m in re.finditer(pat, tudo, re.I)))
        if achados:
            out.append('  %s: %s' % (nome, '; '.join(achados[:40])))
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('paginas', nargs='*')
    ap.add_argument('--todas')
    ap.add_argument('--raiz')
    ap.add_argument('--existentes')
    ap.add_argument('--sitemap')
    ap.add_argument('--hub')
    ap.add_argument('--guias')
    ap.add_argument('--novo', action='store_true')
    ap.add_argument('--calma', action='store_true')
    o = ap.parse_args()
    if o.existentes:
        o.existentes = set(l.strip().replace('\\', '/').lstrip('/') for l in open(o.existentes, encoding='utf-8') if l.strip())
    else:
        o.existentes = None
    pgs = list(o.paginas)
    if o.todas:
        pgs += sorted(f for f in glob.glob(os.path.join(o.todas, '*.html')) if os.path.basename(f) != 'index.html')
        if not o.guias:
            o.guias = o.todas
    if not pgs:
        ap.error('informe a pagina (ou --todas PASTA)')
    outros = None
    if o.guias:
        outros = {}
        arqs = sorted(f for f in glob.glob(os.path.join(o.guias, '*.html')) if os.path.basename(f) != 'index.html')
        cont = {}
        tmp = {}
        for f in arqs:
            _, s = carregar(f)
            pp = Pg(); pp.feed(s); pp.close()
            v = texto_visivel(pp)
            tmp[os.path.basename(f)] = (nz(pp.title), shingles(v))
        # remove o texto padrao (trechos que aparecem em muitas paginas)
        if len(tmp) >= 8:
            for _, (_, sh) in tmp.items():
                for x in sh:
                    cont[x] = cont.get(x, 0) + 1
            lim = max(4, int(0.25 * len(tmp)))
            padrao = set(x for x, c in cont.items() if c >= lim)
            for k, (t, sh) in tmp.items():
                outros[k] = (t, sh - padrao)
            o._padrao = padrao
        else:
            outros = tmp
            o._padrao = set()
    tot_e = tot_a = 0
    resumo = []
    padrao = getattr(o, '_padrao', set())
    for f in pgs:
        r, p, vis, tudo = validar(f, o)
        resumo_d = ''
        if outros is not None:
            resumo_d = duplicidade(r, p, vis, os.path.basename(f), outros, padrao)
        print('=' * 78)
        print('PAGINA: %s' % r.nome)
        for nivel, cod, msg in r.itens:
            print('  %-5s [%s] %s' % (nivel, cod, msg))
        if not r.itens:
            print('  ok    nenhuma pendencia')
        print('  -> %d erro(s), %d aviso(s)%s' % (r.erros, r.avisos, ('; maior semelhanca: ' + resumo_d) if resumo_d else ''))
        if not o.calma and len(pgs) == 1:
            ci = citacoes(tudo)
            if ci:
                print('  CITACOES LEGAIS NO TEXTO (confira cada uma em fonte oficial):')
                for l in ci:
                    print(l)
        tot_e += r.erros; tot_a += r.avisos
        resumo.append((r.nome, r.erros, r.avisos))
    if len(pgs) > 1:
        print('=' * 78)
        print('RESUMO: %d pagina(s), %d erro(s), %d aviso(s)' % (len(pgs), tot_e, tot_a))
        for n, e, a in resumo:
            if e or a:
                print('  %-62s erros=%d avisos=%d' % (n, e, a))
    sys.exit(1 if tot_e else 0)


def duplicidade(r, p, vis, nome, outros, padrao):
    """tema repetido (titulo parecido) e texto copiado (trechos de 6 palavras que nao sao texto padrao do site)"""
    mine = shingles(vis) - padrao
    res = []
    for onome, (ot, osh) in outros.items():
        if onome == nome:
            continue
        ratio = difflib.SequenceMatcher(None, _norm_t(p.title).split(), _norm_t(ot).split()).ratio()
        if ratio >= 0.75:
            r.add('ERRO', 'D01', 'titulo muito parecido com o de %s (%.0f%%): tema repetido?' % (onome, ratio * 100))
        comum = mine & osh
        res.append((len(comum) / float(max(1, len(mine))), onome, comum))
    if not res:
        return ''
    res.sort(key=lambda x: -x[0])
    fr, onome, comum = res[0]
    ex = sorted(' '.join(c) for c in comum)[:1]
    if fr >= 0.25:
        r.add('ERRO', 'D02', 'texto muito parecido com %s (%.0f%% dos trechos proprios de 6 palavras ja existem la; ex.: "%s")' % (onome, fr * 100, ex[0] if ex else ''))
    elif fr >= 0.12:
        r.add('AVISO', 'D02', 'texto parecido com %s (%.0f%% dos trechos proprios); ex.: "%s"' % (onome, fr * 100, ex[0] if ex else ''))
    return '%s %.0f%%' % (onome, fr * 100)


def _norm_t(t):
    t = re.sub(r'\b(?:o que fazer|agora|passo a passo|dr\.? lucas semim|guia)\b', ' ', (t or '').lower())
    return re.sub(r'[^\wÀ-ÿ ]+', ' ', t)


if __name__ == '__main__':
    main()
