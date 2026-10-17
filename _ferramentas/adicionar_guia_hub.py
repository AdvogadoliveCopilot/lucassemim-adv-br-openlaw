#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
adicionar_guia_hub.py - coloca um guia novo no indice /o-que-fazer-agora/ (index.html).

O que faz (e so isso):
  1) acrescenta o cartao do guia no FINAL do grupo escolhido;
  2) acrescenta o guia na lista "hasPart" dos dados estruturados (JSON-LD) do indice.
Trabalha em bytes e preserva o final de linha do arquivo (o indice usa CRLF). Se o guia ja estiver no
indice, nao faz nada (pode rodar de novo sem medo). No fim confere que o JSON-LD continua valido e que
cartoes e itens do JSON-LD batem.

Grupos do indice:
  1 = Acabei de ser preso ou levado a delegacia
  2 = Fui preso por um crime especifico
  3 = Mandado de prisao, busca e apreensao e bloqueio
  4 = Fui intimado, notificado ou acusado
  5 = Ja tenho processo ou pena em andamento

Uso:
  python adicionar_guia_hub.py --hub CAMINHO/o-que-fazer-agora/index.html --slug fui-convidado-para-delacao-premiada-o-que-fazer \\
      --tag "Colaboracao Premiada" --titulo "Fui Convidado para Delacao Premiada" \\
      --texto "O que a lei exige, os riscos e os primeiros passos antes de assinar qualquer coisa." --grupo 4 [--saida NOVO.html]
(sem --saida, grava no proprio arquivo)
"""
import argparse, json, re, sys

BASE = 'https://lucassemim.adv.br'


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--hub', required=True)
    ap.add_argument('--slug', required=True, help='nome do arquivo do guia, sem .html')
    ap.add_argument('--tag', required=True, help='etiqueta curta do cartao (ex.: Flagrante)')
    ap.add_argument('--titulo', required=True)
    ap.add_argument('--texto', required=True, help='uma frase de apoio para o cartao')
    ap.add_argument('--grupo', required=True, type=int, choices=range(1, 6))
    ap.add_argument('--saida')
    a = ap.parse_args()
    if not re.fullmatch(r'[a-z0-9-]+', a.slug):
        sys.exit('slug invalido: use so letras minusculas, numeros e hifen')
    for nome, v in (('tag', a.tag), ('titulo', a.titulo), ('texto', a.texto)):
        if re.search(r'[<>"\\]', v):
            sys.exit('%s nao pode ter < > " ou barra invertida' % nome)

    b = open(a.hub, 'rb').read()
    eol = b'\r\n' if b.count(b'\r\n') > 0 and b.count(b'\r\n') == b.count(b'\n') else b'\n'
    if b.count(b'\r\n') not in (0, b.count(b'\n')):
        sys.exit('finais de linha misturados no indice; nao vou mexer')
    if b'class="oq3 oq-hub"' not in b[:600]:
        sys.exit('este indice nao esta no molde V3 (class="oq3 oq-hub")')
    url = ('%s/o-que-fazer-agora/%s.html' % (BASE, a.slug)).encode('utf-8')
    if url in b:
        print('o guia ja esta no indice; nada a fazer')
        if a.saida:
            open(a.saida, 'wb').write(b)
        return

    # --- 1) cartao no fim do grupo
    ini = b.find(('<section class="oq-group" aria-labelledby="oq-g%d">' % a.grupo).encode())
    if ini < 0:
        sys.exit('grupo %d nao encontrado' % a.grupo)
    fim = b.find(b'</section>', ini)
    trecho = b[ini:fim]
    m = list(re.finditer(rb'</a>(\r?\n)([ \t]*)</div>(\r?\n)([ \t]*)$', trecho))
    if len(m) != 1:
        sys.exit('nao achei o fim do grupo %d no formato esperado' % a.grupo)
    pos = ini + m[0].start() + len(b'</a>')
    card = eol.join([
        b'',
        b'            <a href="' + url + b'" class="guide-card">',
        b'                <span class="guide-tag">' + a.tag.encode('utf-8') + b'</span>',
        b'                <h3>' + a.titulo.encode('utf-8') + b'</h3>',
        b'                <p>' + a.texto.encode('utf-8') + b'</p>',
        '                <span class="guide-arrow">Ver guia completo →</span>'.encode('utf-8'),
        b'            </a>'])
    b = b[:pos] + eol + card + b[pos:]

    # --- 2) JSON-LD hasPart
    i = b.find(b'"hasPart": [')
    if i < 0:
        sys.exit('hasPart nao encontrado no JSON-LD')
    j = b.find(eol + b'        ]', i)
    if j < 0:
        sys.exit('fim da lista hasPart nao encontrado')
    item = ('          { "@type": "Article", "headline": "%s", "url": "%s" }' % (a.titulo, url.decode())).encode('utf-8')
    b = b[:j] + b',' + eol + item + b[j:]

    # --- conferencias
    s = b.decode('utf-8')
    blocos = re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S)
    ld = json.loads(blocos[0])
    nos = ld if isinstance(ld, list) else ld.get('@graph', [ld])
    parte = [x for x in nos if 'hasPart' in x][0]['hasPart']
    cards = re.findall(r'<a href="(https://lucassemim\.adv\.br/o-que-fazer-agora/[^"]+)" class="guide-card">', s)
    if len(parte) != len(cards) or set(x['url'] for x in parte) != set(cards):
        sys.exit('cartoes (%d) e JSON-LD (%d) nao batem; nada foi gravado' % (len(cards), len(parte)))
    if (b.count(b'\r\n') not in (0, b.count(b'\n'))):
        sys.exit('o final de linha ficou misturado; nada foi gravado')
    destino = a.saida or a.hub
    open(destino, 'wb').write(b)
    print('ok: %d guias no indice (cartoes = JSON-LD); gravado em %s' % (len(cards), destino))


if __name__ == '__main__':
    main()
