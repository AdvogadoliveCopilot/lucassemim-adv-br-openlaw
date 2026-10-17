#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
adicionar_url_sitemap.py - acrescenta uma pagina nova no sitemap-urgencia.xml (ou atualiza a data de uma que ja existe)
sem estragar o arquivo: trabalha em bytes, preserva o final de linha (CRLF) e o formato das outras entradas.

Uso:
  # pagina nova (no fim da lista)
  python adicionar_url_sitemap.py --sitemap sitemap-urgencia.xml --loc https://lucassemim.adv.br/o-que-fazer-agora/NOME.html \\
        --lastmod 2026-10-09 --titulo "Fui Convidado para Delacao Premiada" [--saida NOVO.xml]
  # so atualizar a data de uma URL que ja existe (ex.: o indice, quando entra um guia novo)
  python adicionar_url_sitemap.py --sitemap sitemap-urgencia.xml --loc https://lucassemim.adv.br/o-que-fazer-agora/ \\
        --lastmod 2026-10-09 --so-lastmod

Se a URL ja existir e nao for --so-lastmod, nao faz nada. No fim confere: XML valido, sem URL repetida,
quantidade de <url> = anterior (+1 se for pagina nova), final de linha uniforme.
"""
import argparse, re, sys
import xml.etree.ElementTree as ET

NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'


def conta(b):
    r = ET.fromstring(b)
    locs = [(u.findtext(NS + 'loc') or '').strip() for u in r.findall(NS + 'url')]
    return locs


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--sitemap', required=True)
    ap.add_argument('--loc', required=True)
    ap.add_argument('--lastmod', required=True, help='AAAA-MM-DD')
    ap.add_argument('--titulo', help='nome do guia (vai no comentario da entrada)')
    ap.add_argument('--prioridade', default='0.90')
    ap.add_argument('--freq', default='daily')
    ap.add_argument('--so-lastmod', action='store_true')
    ap.add_argument('--saida')
    a = ap.parse_args()
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', a.lastmod):
        sys.exit('--lastmod deve ser AAAA-MM-DD')
    if not re.fullmatch(r'https://lucassemim\.adv\.br/[A-Za-z0-9._/\-]*', a.loc):
        sys.exit('--loc deve comecar com https://lucassemim.adv.br/ e ter so letras, numeros, ponto, hifen e barra')
    if not re.fullmatch(r'[01]\.\d{2}', a.prioridade) or a.freq not in ('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'):
        sys.exit('--prioridade (ex.: 0.90) ou --freq invalidos')
    b = open(a.sitemap, 'rb').read()
    crlf = b.count(b'\r\n')
    if crlf not in (0, b.count(b'\n')):
        sys.exit('finais de linha misturados no sitemap; nao vou mexer')
    eol = b'\r\n' if crlf else b'\n'
    antes = conta(b)
    if len(set(antes)) != len(antes):
        sys.exit('o sitemap ja tem URL repetida; corrija antes')
    loc_b = a.loc.encode()
    existe = a.loc in antes
    destino = a.saida or a.sitemap
    if a.so_lastmod:
        if not existe:
            sys.exit('a URL nao esta no sitemap (use sem --so-lastmod para incluir)')
        pad = re.compile(rb'(<loc>' + re.escape(loc_b) + rb'</loc>\s*<lastmod>)(\d{4}-\d{2}-\d{2})(</lastmod>)')
        if len(pad.findall(b)) != 1:
            sys.exit('formato da entrada diferente do esperado; nao vou mexer')
        novo = pad.sub(lambda m: m.group(1) + a.lastmod.encode() + m.group(3), b)
    else:
        if existe:
            print('a URL ja esta no sitemap; nada a fazer')
            if a.saida:
                open(a.saida, 'wb').write(b)
            return
        fim = b.rfind(b'</urlset>')
        if fim < 0:
            sys.exit('</urlset> nao encontrado')
        titulo = (a.titulo or a.loc.rsplit('/', 1)[-1]).replace('--', '-').replace('<', '').replace('>', '')
        n = len(antes)  # o indice e a entrada 0; o proximo numero = quantidade atual
        ind = b'    '
        linhas = [
            ind + ('<!-- %d. %s -->' % (n, titulo)).encode('utf-8'),
            ind + b'<url>',
            ind * 2 + b'<loc>' + loc_b + b'</loc>',
            ind * 2 + b'<lastmod>' + a.lastmod.encode() + b'</lastmod>',
            ind * 2 + b'<changefreq>' + a.freq.encode() + b'</changefreq>',
            ind * 2 + b'<priority>' + a.prioridade.encode() + b'</priority>',
            ind + b'</url>',
        ]
        novo = b[:fim] + eol.join(linhas) + eol + b[fim:]
    # conferencias
    depois = conta(novo)
    esperado = len(antes) + (0 if a.so_lastmod else 1)
    if len(depois) != esperado or len(set(depois)) != len(depois):
        sys.exit('conferencia falhou (quantidade/duplicidade); nada foi gravado')
    if novo.count(b'\r\n') not in (0, novo.count(b'\n')):
        sys.exit('o final de linha ficou misturado; nada foi gravado')
    open(destino, 'wb').write(novo)
    print('ok: %d URLs (antes %d); gravado em %s' % (len(depois), len(antes), destino))


if __name__ == '__main__':
    main()
