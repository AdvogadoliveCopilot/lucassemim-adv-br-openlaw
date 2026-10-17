# -*- coding: utf-8 -*-
"""
AGENTE 3 — SEO
1) Confere o artigo SEM IA (título, descrição, H1/H2, canonical, JSON-LD, links internos, telefone).
2) Pede à IA (combo auto/smart) uma nota e melhorias; aplica só o que é seguro (meta description).
3) Roda as travas de ética/segurança (compliance.py) e deixa tudo registrado para a sua revisão.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agente_redator
import compliance
import config
import omni_client
from util import console_utf8, gravar_json, ler_json, preencher, rodar_principal

ENTRADA = os.path.join(config.PASTA_AGENTES, "output_redator.json")
SAIDA = os.path.join(config.PASTA_AGENTES, "output_seo.json")


def _texto(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html or "")).strip()


def verificar_seo_basico(artigo):
    """Verificações automáticas, sem IA. Retorna lista de problemas (texto)."""
    html = artigo["html"]
    problemas = []
    m = re.search(r"<title>([^<]*)</title>", html)
    titulo_tag = m.group(1) if m else ""
    if not (30 <= len(titulo_tag) <= 70):
        problemas.append("título da página com %d caracteres (ideal 30–70)" % len(titulo_tag))
    m = re.search(r'<meta name="description" content="([^"]*)"', html)
    meta = m.group(1) if m else ""
    if not (70 <= len(meta) <= 160):
        problemas.append("meta description com %d caracteres (ideal 70–160)" % len(meta))
    if len(re.findall(r"<h1\b", html)) != 1:
        problemas.append("a página precisa ter exatamente 1 H1")
    if len(re.findall(r"<h2\b", artigo.get("conteudo_html", ""))) < 3:
        problemas.append("menos de 3 subtítulos H2 no texto")
    esperado = "%s/%s/%s" % (config.SITE_URL, artigo.get("pasta", config.PASTA_PUBLICACAO), artigo["slug"] + ".html")
    if ('rel="canonical" href="%s"' % esperado) not in html:
        problemas.append("canonical diferente de %s" % esperado)
    if "og:title" not in html or "og:description" not in html:
        problemas.append("faltam tags Open Graph")
    n_links = len(re.findall(r'<a [^>]*href="/', artigo.get("conteudo_html", "") + html[html.find("leia-tambem"):]))
    if n_links < 2:
        problemas.append("poucos links internos (%d) — ideal 2 ou mais" % n_links)
    if artigo.get("palavras", 0) < 500:
        problemas.append("texto com %d palavras (meta do site: 600 ou mais)" % artigo.get("palavras", 0))
    chave = (artigo.get("tags") or [""])[0].lower()
    if chave and chave not in _texto(artigo.get("conteudo_html", ""))[:600].lower() and chave not in artigo["titulo"].lower():
        problemas.append("palavra-chave principal “%s” não aparece no título nem no início do texto" % chave)
    return problemas


def otimizar_seo(artigo):
    problemas = verificar_seo_basico(artigo)
    estrutura = re.findall(r"<h2[^>]*>(.*?)</h2>", artigo.get("conteudo_html", ""), flags=re.S)
    inicio = _texto(artigo.get("conteudo_html", ""))[:1200]
    prompt = preencher("""Você é especialista em SEO para sites jurídicos brasileiros, com foco em busca local (Sabará/Belo Horizonte).

ARTIGO
Título: <<TITULO>>
Meta description atual: <<META>>
Palavras-chave: <<TAGS>>
Subtítulos (H2): <<H2>>
Início do texto: <<INICIO>>

PROBLEMAS DETECTADOS AUTOMATICAMENTE:
<<PROBLEMAS>>

REGRAS: não prometa resultado, não cite preço, não invente fatos. A meta description tem de ter entre 120 e 155
caracteres, sem aspas duplas, e conter a palavra-chave principal.

TAREFA: avalie o SEO (nota 0-100), liste até 5 melhorias prioritárias, sugira uma meta description melhor
(ou repita a atual se já estiver boa), e liste palavras-chave importantes que faltam no texto.

Responda SOMENTE em JSON:
{"nota_seo": 85, "melhorias": ["..."], "meta_description_sugerida": "...", "palavras_chave_faltando": ["..."]}""",
                      titulo=artigo["titulo"], meta=artigo["meta_description"], tags=", ".join(artigo["tags"]),
                      h2=" | ".join(_texto(h) for h in estrutura) or "(nenhum)", inicio=inicio,
                      problemas="\n".join("- " + p for p in problemas) or "- Nenhum problema grave detectado")
    try:
        relatorio = omni_client.chat_json(prompt, papel="seo")
        if isinstance(relatorio, list):
            relatorio = relatorio[0]
    except Exception as e:
        relatorio = {"nota_seo": None, "melhorias": ["(IA indisponível na etapa de SEO: %s)" % str(e)[:160]],
                     "meta_description_sugerida": "", "palavras_chave_faltando": []}

    artigo = dict(artigo)
    nova = (relatorio.get("meta_description_sugerida") or "").replace('"', "'").strip()
    aplicada = False
    if 110 <= len(nova) <= 155 and nova != artigo["meta_description"]:
        teste = compliance.verificar_artigo("<h1>x</h1>" + nova, corpo_html=nova)
        if not [e for e in teste["erros"] if "Promessa" in e]:
            artigo["meta_description"] = nova
            aplicada = True
    if aplicada:     # re-monta a página para meta, Open Graph e JSON-LD ficarem iguais
        artigo["html"] = agente_redator.montar_pagina({
            "titulo": artigo["titulo"], "meta": artigo["meta_description"], "categoria": artigo["categoria"],
            "tags": artigo["tags"], "conteudo_html": artigo["conteudo_html"], "faq": artigo.get("faq", []),
            "slug": artigo["slug"], "pasta": artigo.get("pasta", config.PASTA_PUBLICACAO)})
    relatorio["meta_description_aplicada"] = aplicada
    relatorio["problemas_automaticos"] = problemas
    artigo["relatorio_seo"] = relatorio
    artigo["verificacao"] = compliance.verificar_artigo(artigo["html"], corpo_html=artigo["conteudo_html"])
    return artigo


def main():
    console_utf8()
    if not os.path.exists(ENTRADA):
        print("❌ Rode o agente_redator.py primeiro.")
        sys.exit(1)
    dados = ler_json(ENTRADA, {})
    otimizados = []
    for artigo in dados["artigos"]:
        print("🔍 Otimizando SEO: %s" % artigo["titulo"])
        ok = otimizar_seo(artigo)
        nota = ok["relatorio_seo"].get("nota_seo", "?")
        print("  ✅ Nota SEO: %s/100%s" % (nota, " (meta nova aplicada)" if ok["relatorio_seo"]["meta_description_aplicada"] else ""))
        v = ok["verificacao"]
        print("  🛡️  Travas: %d erro(s) a corrigir, %d aviso(s) para olhar" % (len(v["erros"]), len(v["avisos"])))
        otimizados.append(ok)
    gravar_json(SAIDA, {**dados, "artigos": otimizados})
    print("💾 Salvo em output_seo.json")


if __name__ == "__main__":
    rodar_principal(main)
