# -*- coding: utf-8 -*-
"""
MEMÓRIA EDITORIAL — banco_memoria_conteudo.json
Guarda o que já foi publicado, os rascunhos e a FILA de temas (calendário editorial).
Assim o pesquisador não repete assunto e o ciclo de retroalimentação sabe o que falta cobrir.
"""
import os

import config
from util import agora_iso, gravar_json, ler_json

ARQ = os.path.join(config.PASTA_AGENTES, "banco_memoria_conteudo.json")


def carregar():
    dados = ler_json(ARQ, {}) or {}
    dados.setdefault("versao", "2.1")
    dados.setdefault("criado_em", agora_iso())
    for chave, padrao in (("artigos_publicados", []), ("rascunhos", []), ("palavras_chave_cobertas", []),
                          ("fila_pendente", []), ("metricas_monitor", {}), ("ciclos_executados", 0)):
        dados.setdefault(chave, padrao)
    return dados


def salvar(dados):
    dados["atualizado_em"] = agora_iso()
    gravar_json(ARQ, dados)


def _ids_usados(dados):
    usados = set()
    for a in dados["artigos_publicados"] + dados["rascunhos"]:
        for k in ("id", "slug", "pauta_id"):
            if a.get(k):
                usados.add(a[k])
    return usados


def limpar_fila(dados):
    """Tira da fila o que já virou rascunho/artigo e itens repetidos."""
    usados = _ids_usados(dados)
    vistos, nova = set(), []
    for item in dados["fila_pendente"]:
        if item and item not in usados and item not in vistos:
            vistos.add(item)
            nova.append(item)
    dados["fila_pendente"] = nova
    return nova


def proximo_da_fila(dados):
    fila = limpar_fila(dados)
    return fila[0] if fila else None


def semente_para_texto(item):
    """'trafico-privilegiado-stf-stj' -> 'trafico privilegiado stf stj' (ponto de partida para a IA)."""
    return item.replace("-", " ").strip()


def adicionar_a_fila(dados, itens):
    usados = _ids_usados(dados)
    for it in itens:
        if it and it not in usados and it not in dados["fila_pendente"]:
            dados["fila_pendente"].append(it)
    return dados["fila_pendente"]


def palavras_cobertas(dados):
    cobertas = {p.lower() for p in dados["palavras_chave_cobertas"]}
    for a in dados["artigos_publicados"] + dados["rascunhos"]:
        cobertas.update(p.lower() for p in a.get("palavras_chave", []))
    return sorted(cobertas)


def registrar_rascunho(dados, artigo, pasta_rascunho, pauta_id=None):
    dados["rascunhos"] = [r for r in dados["rascunhos"] if r.get("slug") != artigo["slug"]]
    dados["rascunhos"].append({
        "id": artigo["slug"], "slug": artigo["slug"], "pauta_id": pauta_id,
        "titulo": artigo["titulo"], "categoria": artigo.get("categoria", ""),
        "palavras_chave": artigo.get("tags", []), "pasta": os.path.basename(pasta_rascunho),
        "criado_em": agora_iso(), "status": "aguardando revisão",
    })
    limpar_fila(dados)
    return dados


def registrar_publicacao(dados, artigo_meta, url, tamanho_bytes):
    slug = artigo_meta["slug"]
    dados["rascunhos"] = [r for r in dados["rascunhos"] if r.get("slug") != slug]
    dados["artigos_publicados"] = [a for a in dados["artigos_publicados"] if a.get("slug") != slug]
    dados["artigos_publicados"].append({
        "id": artigo_meta.get("pauta_id") or slug, "slug": slug, "titulo": artigo_meta["titulo"],
        "url": url, "categoria": artigo_meta.get("categoria", ""),
        "palavras_chave": artigo_meta.get("tags", []), "publicado_em": agora_iso(),
        "tamanho_bytes": tamanho_bytes,
    })
    for p in artigo_meta.get("tags", []):
        if p not in dados["palavras_chave_cobertas"]:
            dados["palavras_chave_cobertas"].append(p)
    dados["ciclos_executados"] = int(dados.get("ciclos_executados", 0)) + 1
    limpar_fila(dados)
    return dados


def devolver_a_fila(dados, artigo_meta):
    """Rascunho descartado: o tema volta para o fim da fila."""
    slug = artigo_meta["slug"]
    dados["rascunhos"] = [r for r in dados["rascunhos"] if r.get("slug") != slug]
    semente = artigo_meta.get("pauta_id") or slug
    if semente not in dados["fila_pendente"]:
        dados["fila_pendente"].append(semente)
    return dados
