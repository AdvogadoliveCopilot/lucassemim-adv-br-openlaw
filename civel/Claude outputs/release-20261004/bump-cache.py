#!/usr/bin/env python3
"""Carimba ?v=VERSAO em todo <script src> e <link href> LOCAL (.js/.css).
Uso: python3 bump-cache.py PASTA_DO_SITE 20261004   (rode uma vez na pasta do site principal e outra na pasta civel)
Motivo: o nginx da hospedagem manda JS/CSS com cache de 10 anos e ignora o .htaccess.
Mudar o ?v= na pagina (que nunca fica em cache) forca o navegador a baixar o arquivo novo."""
import re, sys, os
root, ver = sys.argv[1], sys.argv[2]
tag = re.compile(r'''(<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*)(["'])([^"']+?\.(?:js|css))(\?[^"']*)?\2''', re.I)
def local(u):
    m = re.match(r'(?i)^(?:https?:)?//([^/]+)/', u)
    return (m is None) or (m.group(1).lower() in ('lucassemim.adv.br', 'www.lucassemim.adv.br', 'civel.lucassemim.adv.br'))
tot_files = tot_refs = 0
for d, _, fs in os.walk(root):
    for f in fs:
        if not f.lower().endswith('.html'): continue
        p = os.path.join(d, f)
        t = open(p, encoding='utf-8', newline='').read()
        n = 0
        def sub(m):
            global n
            if not local(m.group(3)): return m.group(0)
            new = f'{m.group(1)}{m.group(2)}{m.group(3)}?v={ver}{m.group(2)}'
            if new != m.group(0): n += 1
            return new
        t2 = tag.sub(sub, t)
        if t2 != t:
            open(p, 'w', encoding='utf-8', newline='').write(t2)
            tot_files += 1; tot_refs += n
print(f'{tot_files} paginas alteradas, {tot_refs} referencias carimbadas com v={ver}')
