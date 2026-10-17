#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
aplicar_v2_artigos.py - liga o "molde de leitura" (design V2) nas paginas de artigos.

O que faz em cada pagina (pastas defesa-criminal e news):
  1) poe 2 linhas no <head>:  css/lucas-v2-article.css  +  a classe v2a no <html>
  2) poe 1 linha antes de </body>: js/article-v2.js
  3) troca o numero de versao ?v=20261004 / ?v=20261008 por ?v=<versao> nos arquivos do proprio
     site (para o navegador baixar a versao nova em vez de usar a copia guardada)
NAO muda texto, titulo, links, schema, canonical nem qualquer outro SEO.

Extras (so com --aplicar):
  - tira o aviso temporario "novo WhatsApp em breve" de js\footer-seo.js
    (o proprio codigo manda remover quando o numero novo entrar no ar);
  - sobe a versao do cache do sw.js para v13 (limpa as copias antigas dos visitantes).

Seguranca:
  * sem argumentos = so mostra (nada e gravado).
  * --aplicar faz ANTES um backup .zip de tudo que vai mudar, confere cada pagina (desfaz a mudanca em
    memoria e compara com o original) e so entao grava. Rodar 2x nao duplica nada.
  * Pula paginas que ja tem o molde, paginas do design V2 antigo e paginas sem <h1>/</head>/</body> certinhos.

Uso (na pasta do site):
  python _ferramentas\aplicar_v2_artigos.py                 (so mostra)
  python _ferramentas\aplicar_v2_artigos.py --aplicar       (grava)
  python _ferramentas\aplicar_v2_artigos.py --desfazer ARQUIVO.zip   (volta tudo como estava)
"""
import argparse, datetime, os, re, sys, zipfile
from pathlib import Path

BASE = "https://lucassemim.adv.br"
PASTAS_PADRAO = ["defesa-criminal", "news"]
MARCA_CSS = "lucas-v2-article.css"
MARCA_JS = "article-v2.js"
# numeros de versao ja usados nos arquivos do site (releases de 04/10 e 08/10/2026)
TOKENS_ANTIGOS = ("20261004", "20261008")
TOKEN_RE = re.compile(r"\?v=(?:" + "|".join(TOKENS_ANTIGOS) + r")(?!\d)")
SW_VERSAO_ALVO = 13


def snippets(v):
    head = ('<link rel="stylesheet" href="%s/css/lucas-v2-article.css?v=%s">\n'
            "<script>document.documentElement.classList.add('v2a')</script>\n") % (BASE, v)
    body = '<script src="%s/js/article-v2.js?v=%s" defer></script>\n' % (BASE, v)
    return head, body


def ler(p):
    b = Path(p).read_bytes()
    bom = b.startswith(b"\xef\xbb\xbf")
    t = b[3:].decode("utf-8") if bom else b.decode("utf-8")
    return t, bom


def gravar(p, t, bom):
    b = t.encode("utf-8")
    if bom:
        b = b"\xef\xbb\xbf" + b
    tmp = str(p) + ".tmp_v2a"
    Path(tmp).write_bytes(b)
    os.replace(tmp, p)


def transformar(t, v):
    """devolve (novo_texto, motivo_de_pular). motivo None = ok."""
    if MARCA_CSS in t or MARCA_JS in t:
        return None, "ja-aplicado"
    if "lucas-v2-pages.css" in t or "lucas-v2.css" in t:
        return None, "ja-e-v2"
    if "<h1" not in t.lower():
        return None, "sem-h1"
    # primeiro troca o numero de versao no texto original; so depois entram as 3 linhas novas
    base = TOKEN_RE.sub("?v=" + v, t)
    low = base.lower()
    if low.count("</head>") != 1 or low.count("</body>") < 1:
        return None, "estrutura-head-body"
    i_head = low.index("</head>")
    i_body = low.rindex("</body>")
    if i_body < i_head:
        return None, "estrutura-ordem"
    nl = "\r\n" if "\r\n" in base else "\n"
    head, body = snippets(v)
    head = head.replace("\n", nl)
    body = body.replace("\n", nl)
    novo = base[:i_head] + head + base[i_head:i_body] + body + base[i_body:]
    return novo, None


def conferir(novo, t_original, v):
    """desfaz a transformacao em memoria e confere que so mudaram as 3 linhas e o numero de versao."""
    head, body = snippets(v)
    nl = "\r\n" if "\r\n" in novo else "\n"
    head = head.replace("\n", nl)
    body = body.replace("\n", nl)
    if novo.count(head) != 1 or novo.count(body) != 1:
        return False
    r = novo.replace(head, "", 1).replace(body, "", 1)
    neutro = lambda s: re.sub(r"\?v=\d{8}(?!\d)", "?v=X", s)
    if neutro(r) != neutro(t_original):
        return False
    # nenhum numero de versao antigo pode sobrar
    return TOKEN_RE.search(novo) is None


def extras(raiz, aplicar):
    out = []
    # 1) aviso temporario no footer-seo.js
    p = raiz / "js" / "footer-seo.js"
    if p.exists():
        t, bom = ler(p)
        if "aviso-transicao-atendimento" in t:
            m_ini = re.search(r"/\* =+ \*/\s*\n/\* === AVISO: ATENDIMENTO EM TRANSI", t)
            i_ini = m_ini.start() if m_ini else -1
            i_fun = t.find("mostrarAvisoTransicao();", i_ini if i_ini >= 0 else 0)
            m_fim = re.compile(r"\n\}\)\(\);[ \t]*\r?\n?").search(t, i_fun) if i_fun >= 0 else None
            if i_ini >= 0 and m_fim:
                novo = (t[:i_ini]
                        + "/* Aviso temporario de troca de WhatsApp removido em 08/10/2026 (numero definitivo no ar). */\n"
                        + t[m_fim.end():])
                out.append("footer-seo.js: aviso de transicao removido (%d bytes a menos)" % (len(t.encode()) - len(novo.encode())))
                if aplicar:
                    gravar(p, novo, bom)
            else:
                out.append("footer-seo.js: bloco do aviso NAO encontrado no formato esperado (nada alterado)")
        else:
            out.append("footer-seo.js: ja esta sem o aviso")
    # 2) versao do cache do service worker
    p = raiz / "sw.js"
    if p.exists():
        t, bom = ler(p)
        m = re.search(r"const CACHE_VERSION = 'v(\d+)'", t)
        if m and int(m.group(1)) < SW_VERSAO_ALVO:
            novo = t.replace(m.group(0), "const CACHE_VERSION = 'v%d'" % SW_VERSAO_ALVO, 1)
            out.append("sw.js: CACHE_VERSION v%s -> v%d" % (m.group(1), SW_VERSAO_ALVO))
            if aplicar:
                gravar(p, novo, bom)
        else:
            out.append("sw.js: versao ja e %s (nada alterado)" % (m.group(1) if m else "?"))
    return out


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--raiz", default=None)
    ap.add_argument("--aplicar", action="store_true")
    ap.add_argument("--versao", default="20261009")
    ap.add_argument("--pastas", default=",".join(PASTAS_PADRAO))
    ap.add_argument("--desfazer", default=None, help="zip de backup para restaurar")
    ap.add_argument("--sem-extras", action="store_true")
    a = ap.parse_args()
    raiz = Path(a.raiz) if a.raiz else Path(__file__).resolve().parent.parent
    bkdir = raiz / "_ferramentas" / "backups"

    if a.desfazer:
        z = zipfile.ZipFile(a.desfazer)
        n = 0
        for nome in z.namelist():
            destino = raiz / nome
            destino.write_bytes(z.read(nome))
            n += 1
        print("Restaurados %d arquivos de %s" % (n, a.desfazer))
        return

    plano, pulados, lidas = [], {}, 0
    for pasta in [x.strip() for x in a.pastas.split(",") if x.strip()]:
        for f in sorted((raiz / pasta).glob("*.html")):
            lidas += 1
            if lidas % 40 == 0:
                print("  ...conferidas %d paginas" % lidas, file=sys.stderr, flush=True)
            try:
                t, bom = ler(f)
            except Exception:
                pulados.setdefault("erro-leitura", []).append(f.name)
                continue
            novo, motivo = transformar(t, a.versao)
            if motivo:
                pulados.setdefault(motivo, []).append(pasta + "/" + f.name)
                continue
            if not conferir(novo, t, a.versao):
                pulados.setdefault("conferencia-falhou", []).append(pasta + "/" + f.name)
                continue
            plano.append((f, t, novo, bom, pasta))

    por = {}
    for f, t, n, b, pasta in plano:
        por[pasta] = por.get(pasta, 0) + 1
    trocas = sum(len(TOKEN_RE.findall(t)) for f, t, n, b, pasta in plano)
    print("MODO:", "APLICAR" if a.aplicar else "SO MOSTRAR (dry-run)")
    print("Paginas que recebem o molde:", len(plano), por)
    print("Numero de versao dos arquivos do site: %d trocas para ?v=%s" % (trocas, a.versao))
    for k, v in pulados.items():
        print("  puladas (%s): %d  %s" % (k, len(v), (", ".join(v[:6]) + (" ..." if len(v) > 6 else ""))))
    for linha in (extras(raiz, False) if not a.sem_extras else []):
        print("  extra:", linha)

    if not a.aplicar:
        print("\nNada foi gravado. Para gravar: python _ferramentas\\aplicar_v2_artigos.py --aplicar")
        return

    bkdir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    zpath = bkdir / ("artigos-antes-%s.zip" % stamp)
    extras_arq = ["js/footer-seo.js", "sw.js"] if not a.sem_extras else []
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for f, t, n, b, pasta in plano:
            # o original ja esta na memoria (mesmos bytes que o arquivo tem agora)
            z.writestr(pasta + "/" + f.name, (b"\xef\xbb\xbf" if b else b"") + t.encode("utf-8"))
        for e in extras_arq:
            if (raiz / e).exists():
                z.write(raiz / e, e)
    print("\nBackup:", zpath, "(%d arquivos)" % (len(plano) + len(extras_arq)), flush=True)

    lista = []
    for f, t, n, b, pasta in plano:
        gravar(f, n, b)
        lista.append(pasta + "/" + f.name)
        if len(lista) % 40 == 0:
            print("  ...gravadas %d paginas" % len(lista), file=sys.stderr, flush=True)
    if not a.sem_extras:
        for linha in extras(raiz, True):
            print("  extra gravado:", linha)
    # conferencia final
    ruins = []
    for i, (f, t, n, b, pasta) in enumerate(plano, 1):
        t2, _ = ler(f)
        if t2 != n:
            ruins.append(pasta + "/" + f.name)
        if i % 40 == 0:
            print("  ...conferidas %d paginas gravadas" % i, file=sys.stderr, flush=True)
    arq_lista = raiz / "_ferramentas" / ("lote-artigos-%s.txt" % a.versao)
    extra_up = ["css/lucas-v2-article.css", "js/article-v2.js"] + ([] if a.sem_extras else ["js/footer-seo.js", "sw.js"])
    arq_lista.write_text("\n".join(extra_up + lista) + "\n", encoding="utf-8")
    print("Gravadas: %d | conferencia final com problema: %d %s" % (len(lista), len(ruins), ruins[:5]))
    print("Lista para subir ao servidor:", arq_lista)


if __name__ == "__main__":
    main()
