#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
aplicar_oqfa_v3.py — molde de conversão das páginas /o-que-fazer-agora (guias).

O que faz em cada guia (NENHUM texto, título, meta, schema ou FAQ existente é alterado):
  • <html lang="pt-BR">                → ganha class="oq3" (liga o molde)
  • <head>                             → + css/oqfa-v3.css
  • depois do <h1>                     → botões WhatsApp + Ligar (+ link da Central do Caso) e linha de provas
                                         + card lateral (só aparece no desktop)
  • dentro da faixa do advogado        → + frase "Defendo pessoas, não processos."
  • depois dos 5 passos                → blocos "Como funciona" e "O que você pode esperar da defesa"
  • antes do FAQ                       → faixa de ação
  • antes de </main>                   → fechamento "Você não precisa enfrentar isso sozinho"
  • barra fixa do celular              → só WhatsApp + Ligar (o texto específico do botão vai para o topo)
  • scripts                            → + js/oqfa-v3.js e page-v2.js com novo ?v= (para respeitar o molde)

Uso (pasta das páginas = a pasta onde o script está, ../o-que-fazer-agora, ou --pasta):
  python aplicar_oqfa_v3.py                  → simulação (não grava nada)
  python aplicar_oqfa_v3.py --aplicar        → grava (faz backup .zip antes em _ferramentas/backups)
  python aplicar_oqfa_v3.py --desfazer ZIP   → restaura as páginas do backup
  opções: --pasta CAMINHO  --versao 20261009  --so SLUG[,SLUG]
"""
import sys, os, re, io, zipfile, datetime, argparse

WA_NUM = '5531989420094'
TEL_HREF = 'tel:+5531989420094'
TEL_TXT = '(31) 98942-0094'
FOTO_ORIG = 'https://lucassemim.adv.br/img/lucasrenansemimeadvogado.jpeg'
FOTO = 'https://lucassemim.adv.br/img/lucas-semim-avatar-192.jpg'   # 7 KB (a original tem 770 KB)
BASE = 'https://lucassemim.adv.br'

# Central do Caso: modo mais adequado a cada guia (urgencia | processo | busca)
MODO = {
    'mandado-de-busca-e-apreensao-o-que-fazer': 'busca',
    'tenho-audiencia-de-instrucao-o-que-fazer': 'processo',
    'progressao-de-regime-atrasada-o-que-fazer': 'processo',
    'fui-pronunciado-tribunal-do-juri-o-que-fazer': 'processo',
    'conta-bloqueada-processo-criminal-o-que-fazer': 'processo',
    'fui-acusado-calunia-difamacao-injuria-o-que-fazer': 'processo',
    'fui-acusado-de-ameaca-o-que-fazer': 'processo',
    'fui-acusado-de-perseguicao-stalking-o-que-fazer': 'processo',
    'fui-notificado-investigado-apostas-ilegais-bets': 'processo',
    'fui-notificado-crime-eleitoral-redes-sociais-o-que-fazer': 'processo',
    'recebi-medida-protetiva-o-que-fazer': 'processo',
}


def cta_pair(wa_href, wa_label, local):
    """par de botões (WhatsApp + Ligar)."""
    return (
        '<a class="oq-btn oq-wa" href="%s" target="_blank" rel="noopener" data-oq-cta="whatsapp_%s">'
        '<span class="oq-ico" aria-hidden="true"><i class="fab fa-whatsapp"></i></span>'
        '<span class="oq-btn-t"><b>%s</b><small>Resposta rápida · sigilo profissional</small></span>'
        '<i class="fas fa-arrow-right oq-arrow" aria-hidden="true"></i></a>'
        '<a class="oq-btn oq-tel" href="%s" data-oq-cta="ligar_%s">'
        '<span class="oq-ico" aria-hidden="true"><i class="fas fa-phone"></i></span>'
        '<span class="oq-btn-t"><b>Ligar agora</b><small>%s</small></span></a>'
    ) % (wa_href, local, wa_label, TEL_HREF, local, TEL_TXT)


def central_link(modo, local, extra=''):
    return ('<a class="oq-central%s" href="/diagnostico.html?modo=%s" data-oq-cta="central_%s">'
            '<i class="fas fa-pen-to-square" aria-hidden="true"></i> Prefere escrever? Conte seu caso na Central do Caso</a>') % (extra, modo, local)


def blocos(slug, wa_href, wa_label, btn_curto, hub=False):
    modo = MODO.get(slug, 'urgencia')
    hero = (
        '<div class="oq-cta oq-hero-cta">' + cta_pair(wa_href, wa_label, 'topo') + '</div>'
        + central_link(modo, 'topo', ' oq-hero-central') +
        '<ul class="oq-proof" aria-label="Quem atende e diferenciais">'
        '<li class="oq-who-mini"><img src="' + FOTO + '" alt="" width="44" height="44" decoding="async">'
        '<span><b>Dr. Lucas Renan Semim</b><small>Advogado criminalista · OAB/MG 222.539</small></span></li>'
        '<li><i class="fas fa-shield-halved" aria-hidden="true"></i>Sigilo profissional</li>'
        '<li><i class="fas fa-location-dot" aria-hidden="true"></i>Sabará, BH e região</li></ul>'
    )

    aside = (
        '<aside class="oq-side" aria-label="Atendimento imediato"><div class="oq-card">'
        '<div class="oq-live"><span class="oq-dot" aria-hidden="true"></span>Plantão ativo agora</div>'
        '<div class="oq-who"><img src="' + FOTO + '" alt="Dr. Lucas Renan Semim, advogado criminalista" width="72" height="72" loading="lazy" decoding="async">'
        '<div><b>Dr. Lucas Renan Semim</b><span>Advogado criminalista · OAB/MG 222.539</span></div></div>'
        '<p class="oq-card-q">Precisa de um advogado agora?</p>'
        '<div class="oq-cta">' + cta_pair(wa_href, wa_label, 'lateral') + '</div>'
        '<ul class="oq-card-list">'
        '<li><i class="fas fa-lock" aria-hidden="true"></i>Sigilo profissional</li>'
        '<li><i class="fas fa-building-shield" aria-hidden="true"></i>Atuação em delegacias, audiências e presídios</li>'
        '<li><i class="fas fa-location-dot" aria-hidden="true"></i>Sabará, Belo Horizonte e região</li></ul>'
        + central_link(modo, 'lateral') +
        '</div></aside>'
    )

    quote = '<p class="oq-quote">“Defendo pessoas, não processos.”</p>'

    como = (
        '<section class="oq-how" aria-label="Como funciona o atendimento">'
        '<div class="oq-h2">Como funciona o atendimento</div>'
        '<ol class="oq-how-list">'
        '<li><span class="oq-st" aria-hidden="true"><i class="fas fa-comment-dots"></i></span><div><b>Você chama</b>'
        '<p>Conte em poucas linhas o que aconteceu, por WhatsApp ou ligação. Se tiver, envie foto dos documentos que recebeu (intimação, mandado, boletim de ocorrência ou decisão).</p></div></li>'
        '<li><span class="oq-st" aria-hidden="true"><i class="fas fa-user-shield"></i></span><div><b>O Dr. Lucas analisa e orienta</b>'
        '<p>Antes de falar ou assinar qualquer coisa, você recebe a primeira orientação sobre o que fazer e o que evitar.</p></div></li>'
        '<li><span class="oq-st" aria-hidden="true"><i class="fas fa-gavel"></i></span><div><b>A defesa entra em ação</b>'
        '<p>Acompanhamento na delegacia, na audiência ou no processo, conforme o seu caso e a urgência.</p></div></li>'
        '</ol></section>'
        '<section class="oq-pledge" aria-label="Compromissos da defesa">'
        '<div class="oq-h2">O que você pode esperar da defesa</div>'
        '<ul class="oq-pledge-grid">'
        '<li><i class="fas fa-ear-listen" aria-hidden="true"></i><b>Escuta primeiro</b><p>Antes de montar a tese, ouvir a sua versão inteira, sem pressa e sem julgamento.</p></li>'
        '<li><i class="fas fa-location-crosshairs" aria-hidden="true"></i><b>Presença real</b><p>Delegacia, audiência de custódia, presídio e fórum. A defesa acontece onde a pessoa está.</p></li>'
        '<li><i class="fas fa-comments" aria-hidden="true"></i><b>Franqueza</b><p>Sem promessa de resultado e sem falsa esperança. Você recebe o cenário real e as estratégias possíveis.</p></li>'
        '<li><i class="fas fa-lock" aria-hidden="true"></i><b>Sigilo</b><p>O que você conta ao seu advogado é protegido pelo sigilo profissional previsto no Estatuto da Advocacia.</p></li>'
        '</ul>'
        '<a class="oq-pledge-link" href="' + BASE + '/sobre-mim.html">Conheça o Dr. Lucas <i class="fas fa-arrow-right" aria-hidden="true"></i></a>'
        '</section>'
    )

    faixa = (
        '<div class="oq-band"><p class="oq-band-t">Isso está acontecendo com você ou com sua família?</p>'
        '<div class="oq-cta">' + cta_pair(wa_href, wa_label, 'meio') + '</div></div>'
    )

    if hub:
        titulo_final = 'Não encontrou a sua situação?'
        texto_final = 'Cada caso tem os seus detalhes. Conte ao Dr. Lucas o que aconteceu e receba a primeira orientação sobre o que fazer e o que evitar.'
    else:
        titulo_final = 'Você não precisa enfrentar isso sozinho'
        texto_final = 'Cada decisão tomada hoje pesa no processo. Fale com o Dr. Lucas e descubra qual é o próximo passo certo para o seu caso.'
    final = (
        '<section class="oq-final" aria-label="Fale com o Dr. Lucas">'
        '<p class="oq-final-k">Plantão criminal 24h</p>'
        '<div class="oq-final-h">' + titulo_final + '</div>'
        '<p class="oq-final-p">' + texto_final + '</p>'
        '<div class="oq-cta">' + cta_pair(wa_href, wa_label, 'final') + '</div>'
        + central_link(modo, 'final') +
        '<p class="oq-final-foot"><i class="fas fa-lock" aria-hidden="true"></i>Sigilo profissional · Atendimento em Sabará, Belo Horizonte e região · OAB/MG 222.539</p>'
        '</section>'
    )

    barra = (
        '<div class="sticky-cta-urgency">'
        '<a href="%s" class="btn-whatsapp-urgency" target="_blank" rel="noopener" data-oq-cta="whatsapp_barra">'
        '<i class="fab fa-whatsapp"></i> WhatsApp agora</a>'
        '<a href="%s" class="oq-s-tel" data-oq-cta="ligar_barra"><i class="fas fa-phone"></i> Ligar</a>'
        '</div>'
    ) % (wa_href, TEL_HREF)

    return dict(hero=hero, aside=aside, quote=quote, como=como, faixa=faixa, final=final, barra=barra)


# ---------------------------------------------------------------- ÍNDICE (hub)
# Grupos do índice (situação do visitante) e os 16 guias que o índice original não listava.
# Os textos dos 16 cartões novos saem da descrição (meta description) e do título de cada guia.
GRUPOS = [
    ('Acabei de ser preso ou levado à delegacia', 'fa-handcuffs', [
        'acabei-de-ser-preso-em-flagrante', 'tenho-audiencia-de-custodia-o-que-fazer', 'meu-filho-foi-preso',
        'fui-levado-para-delegacia-mas-nao-fui-preso', 'preso-nao-consigo-pagar-fianca-o-que-fazer',
        'estou-preso-preventivamente-o-que-fazer']),
    ('Fui preso por um crime específico', 'fa-scale-balanced', [
        'fui-preso-acusado-trafico-drogas', 'fui-preso-por-furto-ou-roubo-o-que-fazer', 'fui-preso-porte-ilegal-de-arma',
        'preso-embriaguez-ao-volante-como-sair-da-delegacia', 'fui-preso-maria-da-penha', 'fui-preso-boca-de-urna-o-que-fazer',
        'agi-em-legitima-defesa-o-que-fazer', 'acidente-de-transito-com-vitima-o-que-fazer']),
    ('Mandado de prisão, busca e apreensão e bloqueio', 'fa-file-signature', [
        'tenho-mandado-de-prisao-o-que-fazer', 'mandado-de-busca-e-apreensao-o-que-fazer',
        'conta-bloqueada-processo-criminal-o-que-fazer']),
    ('Fui intimado, notificado ou acusado', 'fa-envelope-open-text', [
        'fui-intimado-para-depor-na-delegacia', 'fui-acusado-de-ameaca-o-que-fazer',
        'fui-acusado-calunia-difamacao-injuria-o-que-fazer', 'fui-acusado-de-perseguicao-stalking-o-que-fazer',
        'fui-notificado-crime-eleitoral-redes-sociais-o-que-fazer', 'fui-notificado-investigado-apostas-ilegais-bets',
        'recebi-medida-protetiva-o-que-fazer']),
    ('Já tenho processo ou pena em andamento', 'fa-gavel', [
        'tenho-audiencia-de-instrucao-o-que-fazer', 'fui-pronunciado-tribunal-do-juri-o-que-fazer',
        'progressao-de-regime-atrasada-o-que-fazer', 'tornozeleira-eletronica-descarregou-o-que-fazer']),
]

GUIAS_NOVOS = {
    'tenho-audiencia-de-custodia-o-que-fazer': ('Custódia', 'Tenho Audiência de Custódia Marcada',
        'Como se preparar para a audiência de custódia, em 5 passos.'),
    'preso-nao-consigo-pagar-fianca-o-que-fazer': ('Fiança', 'Não Consigo Pagar a Fiança',
        'Se é possível ser mantido preso por falta de dinheiro e como pedir a dispensa.'),
    'estou-preso-preventivamente-o-que-fazer': ('Preventiva', 'Estou Preso Preventivamente',
        'Primeiros passos e como funciona o pedido de Habeas Corpus.'),
    'fui-preso-boca-de-urna-o-que-fazer': ('Eleição', 'Boca de Urna ou Preso na Eleição',
        'Seus direitos em flagrante eleitoral e a lei que protege o eleitor.'),
    'agi-em-legitima-defesa-o-que-fazer': ('Legítima Defesa', 'Agi em Legítima Defesa e Fui Preso',
        'Os 5 passos imediatos para demonstrar a legítima defesa.'),
    'acidente-de-transito-com-vitima-o-que-fazer': ('Trânsito', 'Acidente de Trânsito com Vítima',
        'Passos imediatos no local e a diferença entre culpa e dolo eventual.'),
    'fui-acusado-de-ameaca-o-que-fazer': ('Ameaça', 'Fui Acusado de Ameaça',
        'Chamado na delegacia ou intimado por ameaça (art. 147 do CP): os 5 passos imediatos.'),
    'fui-acusado-calunia-difamacao-injuria-o-que-fazer': ('Honra', 'Fui Acusado de Calúnia, Difamação ou Injúria',
        'Citado ou intimado por ofensas no WhatsApp ou nas redes sociais: o que fazer.'),
    'fui-acusado-de-perseguicao-stalking-o-que-fazer': ('Perseguição', 'Fui Acusado de Perseguição (Stalking)',
        'Chamado na delegacia ou intimado por perseguição (art. 147-A do CP): os 5 passos imediatos.'),
    'fui-notificado-crime-eleitoral-redes-sociais-o-que-fazer': ('Crime Eleitoral', 'Postei Sobre um Candidato e Fui Notificado',
        'Calúnia, difamação e injúria eleitoral nas redes: guarde a prova e não responda sozinho.'),
    'fui-notificado-investigado-apostas-ilegais-bets': ('Apostas (Bets)', 'Fui Notificado ou Investigado por Apostas Ilegais',
        'Os riscos penais e o que fazer antes de responder à fiscalização.'),
    'recebi-medida-protetiva-o-que-fazer': ('Medida Protetiva', 'Recebi uma Medida Protetiva de Urgência',
        'O que fazer ao ser notificado, mesmo sem ter sido preso.'),
    'tenho-audiencia-de-instrucao-o-que-fazer': ('Audiência', 'Fui Intimado para Audiência de Instrução',
        'O que esperar da audiência e os 5 passos de preparação.'),
    'fui-pronunciado-tribunal-do-juri-o-que-fazer': ('Tribunal do Júri', 'Fui Pronunciado para o Tribunal do Júri',
        'Os 5 passos imediatos antes do Plenário.'),
    'progressao-de-regime-atrasada-o-que-fazer': ('Execução Penal', 'Progressão de Regime Atrasada',
        'Já cumpriu a fração da pena e segue no regime fechado? Veja os passos imediatos.'),
    'tornozeleira-eletronica-descarregou-o-que-fazer': ('Tornozeleira', 'Tornozeleira Eletrônica Descarregou ou Disparou',
        'Os 5 passos imediatos para evitar a falta grave.'),
}


def card_novo(slug, eol):
    tag, titulo, texto = GUIAS_NOVOS[slug]
    return eol.join([
        '            <a href="%s/o-que-fazer-agora/%s.html" class="guide-card">' % (BASE, slug),
        '                <span class="guide-tag">%s</span>' % tag,
        '                <h3>%s</h3>' % titulo,
        '                <p>%s</p>' % texto,
        '                <span class="guide-arrow">Ver guia completo →</span>',
        '            </a>'])


def transformar_hub(src, versao, completar=True):
    """Índice: mesmas camadas do molde + busca + grupos por situação (+ os 16 guias que faltavam)."""
    if 'class="oq3' in src[:400]:
        return None
    eol = '\r\n' if '\r\n' in src else '\n'
    out = src

    def uma(pat, flags=0):
        ms = list(re.finditer(pat, out, flags))
        if len(ms) != 1:
            raise Falha('marcador "%s" encontrado %d vez(es)' % (pat[:60], len(ms)))
        return ms[0]

    m = uma(r'<div class="sticky-cta-urgency">(.*?)</div>', re.S)
    inner = m.group(1)
    mh = re.search(r'href="([^"]+)"', inner)
    ml = re.search(r'</i>\s*(.*?)\s*</a>', inner, re.S)
    if not mh or not ml or WA_NUM not in mh.group(1):
        raise Falha('barra fixa do índice fora do padrão')
    wa_href, wa_label = mh.group(1), re.sub(r'\s+', ' ', ml.group(1)).strip()
    B = blocos('', wa_href, wa_label, None, hub=True)
    out = out[:m.start()] + B['barra'] + out[m.end():]

    m = uma(r'<html lang="pt-BR">')
    out = out[:m.start()] + '<html lang="pt-BR" class="oq3 oq-hub">' + out[m.end():]

    m = uma(r'<link rel="stylesheet" href="https://lucassemim\.adv\.br/css/lucas-v2-pages\.css\?v=\d+">')
    out = out[:m.end()] + eol + '<link rel="stylesheet" href="%s/css/oqfa-v3.css?v=%s">' % (BASE, versao) + out[m.end():]

    m = uma(r'<h1 class="h1-urgency">.*?</h1>', re.S)
    ins = eol + eol + '        <!-- OQ3: ação imediata -->' + eol + '        ' + B['hero'] + eol + '        ' + B['aside']
    out = out[:m.end()] + ins + out[m.end():]

    # --- busca + grupos
    m = uma(r'(<h2 class="section-title-urgency">[^<]*</h2>\s*)<div class="guide-grid">(.*)</div>(\s*)</main>', re.S)
    cards = {}
    for c in re.finditer(r'<a href="https://lucassemim\.adv\.br/o-que-fazer-agora/([a-z0-9-]+)\.html" class="guide-card">.*?</a>',
                         m.group(2), re.S):
        cards[c.group(1)] = c.group(0)
    if len(cards) != 12:
        raise Falha('esperava 12 cartões no índice original, achei %d' % len(cards))
    usados = set()
    partes = ['<!-- OQ3: busca e grupos por situação -->',
              '        <div class="oq-search"><i class="fas fa-magnifying-glass" aria-hidden="true"></i>'
              '<input id="oq-q" type="search" placeholder="Busque sua situação: flagrante, mandado, tráfico, filho preso…" '
              'aria-label="Buscar guia por situação" autocomplete="off"></div>',
              '        <p class="oq-empty" id="oq-empty" role="status">Não achou o seu caso? '
              '<a href="/diagnostico.html?modo=urgencia">Conte para o Dr. Lucas pela Central do Caso</a>.</p>']
    for i, (nome, icone, slugs) in enumerate(GRUPOS, 1):
        itens = []
        for sl in slugs:
            if sl in cards:
                itens.append('            ' + cards[sl].lstrip()); usados.add(sl)
            elif completar:
                itens.append(card_novo(sl, eol)); usados.add(sl)
        if not itens:
            continue
        partes.append('        <section class="oq-group" aria-labelledby="oq-g%d">' % i)
        partes.append('            <h3 class="oq-gh" id="oq-g%d"><i class="fas %s" aria-hidden="true"></i>%s</h3>' % (i, icone, nome))
        partes.append('            <div class="guide-grid">')
        partes.append((eol + eol).join(itens))
        partes.append('            </div>')
        partes.append('        </section>')
    faltou = set(cards) - usados
    if faltou:
        raise Falha('cartões originais sem grupo: %s' % ', '.join(sorted(faltou)))
    corpo = m.group(1) + eol.join(partes[:3]) + eol + eol + eol.join(partes[3:]) + eol + eol + \
        '        ' + B['como'] + eol + eol + '        ' + B['final'] + eol + eol + '    </main>'
    out = out[:m.start()] + corpo + out[m.end():]

    m = uma(r'<script src="https://lucassemim\.adv\.br/js/page-v2\.js\?v=\d+" defer></script>')
    novo = ('<script src="%s/js/oqfa-v3.js?v=%s" defer></script>' % (BASE, versao) + eol +
            '<script src="%s/js/page-v2.js?v=%s" defer></script>' % (BASE, versao))
    out = out[:m.start()] + novo + out[m.end():]

    # --- dados estruturados: acrescenta os guias novos na lista hasPart (os 12 originais ficam como estão)
    if completar:
        itens = []
        for sl in [x for g in GRUPOS for x in g[2] if x in GUIAS_NOVOS]:
            itens.append('          { "@type": "Article", "headline": "%s", "url": "%s/o-que-fazer-agora/%s.html" }' % (GUIAS_NOVOS[sl][1], BASE, sl))
        m = uma(r'(\{ "@type": "Article", "headline": "Fui Levado para a Delegacia Mas Não Fui Preso", "url": "[^"]+" \})(\s*\]\s*\}\s*\]\s*</script>)')
        out = out[:m.end(1)] + ',' + eol + (',' + eol).join(itens) + out[m.end(1):]
    return out


# Rótulos do botão que prometem RESULTADO (Provimento 205/2021 e Código de Ética da OAB vedam promessa de resultado).
# O texto original da página é reaproveitado no botão do topo; estes casos são trocados por uma versão neutra.
LABEL_OVERRIDE = {
    'preso-embriaguez-ao-volante-como-sair-da-delegacia': 'FALAR NO WHATSAPP E VERIFICAR A FIANÇA',
}


class Falha(Exception):
    pass


def transformar(src, slug, versao):
    """devolve o novo HTML (str) ou levanta Falha. src usa o EOL original; o texto inserido usa o mesmo."""
    if 'class="oq3"' in src[:400] or ' oq3"' in src[:400]:
        return None  # já aplicado
    eol = '\r\n' if '\r\n' in src else '\n'
    out = src

    def uma(pat, flags=0):
        ms = list(re.finditer(pat, out, flags))
        if len(ms) != 1:
            raise Falha('marcador "%s" encontrado %d vez(es)' % (pat[:60], len(ms)))
        return ms[0]

    # --- dados da barra fixa original (href e texto do botão específico da página)
    m = uma(r'<div class="sticky-cta-urgency">(.*?)</div>', re.S)
    inner = m.group(1)
    mh = re.search(r'href="([^"]+)"', inner)
    ml = re.search(r'</i>\s*(.*?)\s*</a>', inner, re.S)
    if not mh or not ml:
        raise Falha('barra fixa sem link/rótulo')
    wa_href, wa_label = mh.group(1), re.sub(r'\s+', ' ', ml.group(1)).strip()
    if WA_NUM not in wa_href:
        raise Falha('link do WhatsApp não usa o número esperado')
    if slug in LABEL_OVERRIDE:
        wa_label = LABEL_OVERRIDE[slug]
    B = blocos(slug, wa_href, wa_label, None)
    nl = lambda s: s.replace('\n', eol)

    # 1) barra fixa (substitui) — faz primeiro porque o resto não mexe nela
    out = out[:m.start()] + B['barra'] + out[m.end():]

    # 2) html class
    m = uma(r'<html lang="pt-BR">')
    out = out[:m.start()] + '<html lang="pt-BR" class="oq3">' + out[m.end():]

    # 3) css
    m = uma(r'<link rel="stylesheet" href="https://lucassemim\.adv\.br/css/lucas-v2-pages\.css\?v=\d+">')
    out = out[:m.end()] + eol + '<link rel="stylesheet" href="%s/css/oqfa-v3.css?v=%s">' % (BASE, versao) + out[m.end():]

    # 5) hero + aside depois do h1
    m = uma(r'<h1 class="h1-urgency">.*?</h1>', re.S)
    ins = eol + eol + '        <!-- OQ3: ação imediata -->' + eol + '        ' + B['hero'] + eol + '        ' + B['aside']
    out = out[:m.end()] + ins + out[m.end():]

    # 5b) foto da faixa do advogado: avatar leve (7 KB) no lugar do JPEG de 770 KB exibido em 68 px
    m = uma(r'<img src="' + re.escape(FOTO_ORIG) + r'" alt="Dr\. Lucas Renan Semim" onerror=')
    out = (out[:m.start()] + '<img src="' + FOTO + '" alt="Dr. Lucas Renan Semim" width="68" height="68" loading="lazy" decoding="async" onerror=' + out[m.end():])

    # 6) frase na faixa do advogado
    m = uma(r'(<div class="trust-badge-info">.*?</p>)(\s*</div>)', re.S)
    out = out[:m.end(1)] + eol + '                ' + B['quote'] + out[m.end(1):]

    # 7) como funciona + compromissos antes do corpo do texto que vem depois dos passos
    pos_chk = out.index('class="checklist-urgency"')
    pos_body = out.find('<div class="content-body">', pos_chk)
    if pos_body < 0:
        raise Falha('content-body depois dos passos não encontrado')
    out = out[:pos_body] + '<!-- OQ3: como funciona + compromissos -->' + eol + '        ' + B['como'] + eol + eol + '        ' + out[pos_body:]

    # 8) faixa de ação antes do FAQ
    m = uma(r'<!-- 5\. Bloco FAQ[^>]*-->\s*<section class="faq-container-urgency">|<section class="faq-container-urgency">')
    out = out[:m.start()] + '<!-- OQ3: faixa de ação -->' + eol + '        ' + B['faixa'] + eol + eol + '        ' + out[m.start():]

    # 9) fechamento antes de </main>
    m = uma(r'</main>')
    out = out[:m.start()] + '<!-- OQ3: fechamento -->' + eol + '        ' + B['final'] + eol + eol + '    ' + out[m.start():]

    # 10) scripts: oqfa-v3.js antes do page-v2.js e page-v2.js com ?v= novo
    m = uma(r'<script src="https://lucassemim\.adv\.br/js/page-v2\.js\?v=\d+" defer></script>')
    novo = ('<script src="%s/js/oqfa-v3.js?v=%s" defer></script>' % (BASE, versao) + eol +
            '<script src="%s/js/page-v2.js?v=%s" defer></script>' % (BASE, versao))
    out = out[:m.start()] + novo + out[m.end():]
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--aplicar', action='store_true')
    ap.add_argument('--desfazer', metavar='ZIP')
    ap.add_argument('--pasta')
    ap.add_argument('--versao', default='20261009')
    ap.add_argument('--so')
    ap.add_argument('--saida', help='grava as páginas novas nesta pasta em vez de sobrescrever (testes)')
    ap.add_argument('--atualizar-versao', metavar='NOVA', help='páginas já convertidas: troca só o ?v= do oqfa-v3.css, oqfa-v3.js e page-v2.js (use depois de mexer no CSS/JS)')
    ap.add_argument('--sem-indice', action='store_true', help='não mexe no index.html (índice dos guias)')
    ap.add_argument('--indice-12', action='store_true', help='índice só com os 12 guias que ele já listava (não acrescenta os 16 que faltavam)')
    a = ap.parse_args()

    aqui = os.path.dirname(os.path.abspath(__file__))
    pasta = a.pasta or os.path.join(os.path.dirname(aqui), 'o-que-fazer-agora')

    if a.desfazer:
        with zipfile.ZipFile(a.desfazer) as z:
            nomes = [n for n in z.namelist() if n.endswith('.html')]
            for n in nomes:
                with open(os.path.join(pasta, os.path.basename(n)), 'wb') as f:
                    f.write(z.read(n))
        print('Restauradas %d páginas de %s' % (len(nomes), a.desfazer)); return

    if a.atualizar_versao:
        nova = a.atualizar_versao
        if not re.fullmatch(r'[0-9A-Za-z._-]{4,32}', nova):
            sys.exit('versão inválida (use letras, números, ponto, hífen ou sublinhado)')
        mudou = {}
        for f in sorted(os.listdir(pasta)):
            if not f.endswith('.html'):
                continue
            with open(os.path.join(pasta, f), 'rb') as fh:
                src = fh.read().decode('utf-8')
            if 'class="oq3' not in src[:400]:
                continue
            novo = re.sub(r'(oqfa-v3\.css\?v=)[^"]+', r'\g<1>' + nova, src)
            novo = re.sub(r'(oqfa-v3\.js\?v=)[^"]+', r'\g<1>' + nova, novo)
            novo = re.sub(r'(js/page-v2\.js\?v=)[^"]+', r'\g<1>' + nova, novo)
            if novo != src:
                mudou[f] = novo
        print('%d página(s) com ?v= para trocar por %s' % (len(mudou), nova))
        if a.aplicar:
            for f, r in mudou.items():
                with open(os.path.join(pasta, f), 'wb') as fh:
                    fh.write(r.encode('utf-8'))
            print('Gravado.')
        else:
            print('Simulação: nada foi gravado (use --aplicar).')
        return

    alvo = [f for f in sorted(os.listdir(pasta)) if f.endswith('.html') and f != 'index.html']
    if not a.sem_indice and os.path.exists(os.path.join(pasta, 'index.html')):
        alvo.append('index.html')
    if a.so:
        qs = set(a.so.split(',')); alvo = [f for f in alvo if f[:-5] in qs]
    ok, pulou, falhou, novos = 0, 0, 0, {}
    for f in alvo:
        p = os.path.join(pasta, f)
        with open(p, 'rb') as fh:
            src = fh.read().decode('utf-8')
        try:
            r = transformar_hub(src, a.versao, completar=not a.indice_12) if f == 'index.html' else transformar(src, f[:-5], a.versao)
        except Falha as e:
            print('FALHA  %-62s %s' % (f, e)); falhou += 1; continue
        if r is None:
            print('já     %-62s' % f); pulou += 1; continue
        novos[f] = r; ok += 1
        print('ok     %-62s %7d -> %7d bytes (+%d)' % (f, len(src.encode()), len(r.encode()), len(r.encode()) - len(src.encode())))
    print('\nresumo: %d prontas, %d já aplicadas, %d falhas' % (ok, pulou, falhou))
    if falhou:
        print('Nada foi gravado porque houve falha.'); sys.exit(2)
    if not a.aplicar:
        print('Simulação: nada foi gravado (use --aplicar).'); return
    if a.saida:
        os.makedirs(a.saida, exist_ok=True)
        for f, r in novos.items():
            with open(os.path.join(a.saida, f), 'wb') as fh:
                fh.write(r.encode('utf-8'))
        print('Gravadas %d páginas em %s' % (len(novos), a.saida)); return
    bk = os.path.join(aqui, 'backups')
    os.makedirs(bk, exist_ok=True)
    zp = os.path.join(bk, 'oqfa-antes-%s.zip' % datetime.datetime.now().strftime('%Y%m%d-%H%M%S'))
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in novos:
            z.write(os.path.join(pasta, f), 'o-que-fazer-agora/' + f)
    for f, r in novos.items():
        with open(os.path.join(pasta, f), 'wb') as fh:
            fh.write(r.encode('utf-8'))
    print('Backup: %s\nGravadas %d páginas.' % (zp, len(novos)))


if __name__ == '__main__':
    main()
