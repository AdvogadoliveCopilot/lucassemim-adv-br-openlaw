#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TROCA DE NÚMERO — lucassemim.adv.br / civel.lucassemim.adv.br
================================================================
Troca o WhatsApp antigo (31) 98394-4973 pelo número novo em TODOS os
formatos encontrados no site (link wa.me, schema JSON-LD, texto visível,
tel:), em qualquer quantidade de arquivos .html/.js/.json passados.

Uso:
    python3 trocar_numero_site.py --novo 31988887777 --dry-run arquivo1.html arquivo2.html ...
    python3 trocar_numero_site.py --novo 31988887777 arquivo1.html arquivo2.html ...

--dry-run   : só mostra quantas trocas faria em cada arquivo, não grava nada.
--novo      : o número novo, só dígitos, com DDD (ex: 31988887777). Não
              precisa incluir o "55" do Brasil — o script monta todas as
              variações sozinho.
--banner    : se passado, também injeta (ou atualiza) o aviso de "número
              atualizado" logo antes de </body> em cada página processada.

O script é seguro para rodar em lote em várias pastas (civel/, defesa-
criminal/, news/, o-que-fazer-agora/, advogado-criminalista/, raiz) —
cada arquivo é tratado de forma independente e só é regravado se alguma
troca de fato aconteceu.
"""

import argparse
import re
import sys

# ----------------------------------------------------------------------
# NÚMERO ANTIGO (fixo — é o que está publicado hoje em todo o site)
# ----------------------------------------------------------------------
DDI = "55"
DDD_ANTIGO = "31"
NUM_ANTIGO = "983944973"  # 9 dígitos, sem DDD

FULL_ANTIGO_COM_DDI = DDI + DDD_ANTIGO + NUM_ANTIGO          # 5531983944973
FULL_ANTIGO_SEM_DDI = DDD_ANTIGO + NUM_ANTIGO                 # 31983944973
DISPLAY_ANTIGO = f"({DDD_ANTIGO}) {NUM_ANTIGO[:5]}-{NUM_ANTIGO[5:]}"  # (31) 98394-4973

BANNER_ID = "aviso-numero-novo-live"

BANNER_HTML_TEMPLATE = """
<!-- ====== AVISO DE NÚMERO NOVO (injetado automaticamente) ====== -->
<div id="{banner_id}" style="position:fixed;left:0;right:0;bottom:0;z-index:99998;
  background:linear-gradient(90deg,#0b0b0b,#1a1a1a);color:#f3f3f3;
  font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4;
  padding:12px 16px;display:flex;align-items:center;justify-content:center;
  gap:14px;flex-wrap:wrap;box-shadow:0 -2px 14px rgba(0,0,0,.35);
  border-top:2px solid #C9A227;">
  <span>📱 <strong>Atualizamos nosso atendimento:</strong> novo WhatsApp
  <strong>({ddd_novo}) {num_novo_fmt}</strong>. Salve o contato novo!</span>
  <a href="https://wa.me/{full_novo}" target="_blank" rel="noopener noreferrer"
     style="background:#C9A227;color:#111;text-decoration:none;font-weight:700;
     padding:8px 14px;border-radius:6px;white-space:nowrap;">FALAR AGORA</a>
  <button onclick="document.getElementById('{banner_id}').style.display='none';
     try{{localStorage.setItem('{banner_id}-fechado','1')}}catch(e){{}}"
     aria-label="Fechar aviso" style="background:transparent;border:none;
     color:#bbb;font-size:18px;cursor:pointer;line-height:1;padding:0 4px;">×</button>
</div>
<script>
  try {{
    if (localStorage.getItem('{banner_id}-fechado') === '1') {{
      document.getElementById('{banner_id}').style.display = 'none';
    }}
  }} catch (e) {{}}
</script>
"""


def montar_variacoes_novo(novo_bruto: str):
    digitos = re.sub(r"\D", "", novo_bruto)
    if digitos.startswith("55") and len(digitos) >= 13:
        digitos = digitos[2:]
    if len(digitos) != 11:
        raise ValueError(
            f"Número novo deve ter 11 dígitos (DDD + 9 dígitos). Recebido: {digitos!r}"
        )
    ddd_novo = digitos[:2]
    num_novo = digitos[2:]
    return {
        "ddd": ddd_novo,
        "num": num_novo,
        "full_com_ddi": DDI + digitos,
        "full_sem_ddi": digitos,
        "display": f"({ddd_novo}) {num_novo[:5]}-{num_novo[5:]}",
    }


def processar_arquivo(caminho: str, novo: dict, dry_run: bool, injetar_banner: bool) -> int:
    with open(caminho, "r", encoding="utf-8") as f:
        conteudo = f.read()

    original = conteudo
    trocas = 0

    # 1) Qualquer ocorrência do número completo COM DDI (cobre wa.me/55...,
    #    tel:+55..., tel:55..., JSON-LD "telephone":"+55...", etc. de uma vez,
    #    porque todos esses formatos contêm essa sequência de dígitos crua).
    if FULL_ANTIGO_COM_DDI in conteudo:
        trocas += conteudo.count(FULL_ANTIGO_COM_DDI)
        conteudo = conteudo.replace(FULL_ANTIGO_COM_DDI, novo["full_com_ddi"])

    # 2) Mesma coisa sem o 55 (usado às vezes em wa.me sem DDI, ou em configs)
    if FULL_ANTIGO_SEM_DDI in conteudo:
        trocas += conteudo.count(FULL_ANTIGO_SEM_DDI)
        conteudo = conteudo.replace(FULL_ANTIGO_SEM_DDI, novo["full_sem_ddi"])

    # 3) Texto visível formatado "(31) 98394-4973"
    if DISPLAY_ANTIGO in conteudo:
        trocas += conteudo.count(DISPLAY_ANTIGO)
        conteudo = conteudo.replace(DISPLAY_ANTIGO, novo["display"])

    # 4) Variante sem parênteses "31 98394-4973" (defensivo)
    display_sem_parenteses = f"{DDD_ANTIGO} {NUM_ANTIGO[:5]}-{NUM_ANTIGO[5:]}"
    novo_sem_parenteses = f"{novo['ddd']} {novo['num'][:5]}-{novo['num'][5:]}"
    if display_sem_parenteses in conteudo:
        trocas += conteudo.count(display_sem_parenteses)
        conteudo = conteudo.replace(display_sem_parenteses, novo_sem_parenteses)

    # 5) Varredura final de segurança: qualquer dígito-a-dígito igual ao
    #    número antigo (DDD+número), com ou sem separadores no meio,
    #    que tenha escapado dos padrões acima.
    padrao_defensivo = re.compile(
        r"(?<!\d)" + re.escape(DDD_ANTIGO) + r"[\s\.\-\)]*" + re.escape(NUM_ANTIGO[:5])
        + r"[\s\.\-]*" + re.escape(NUM_ANTIGO[5:]) + r"(?!\d)"
    )
    def _sub_defensivo(m):
        nonlocal trocas
        trocas += 1
        return novo["display"]
    conteudo = padrao_defensivo.sub(_sub_defensivo, conteudo)

    if injetar_banner and "</body>" in conteudo and BANNER_ID not in conteudo:
        banner = BANNER_HTML_TEMPLATE.format(
            banner_id=BANNER_ID,
            ddd_novo=novo["ddd"],
            num_novo_fmt=f"{novo['num'][:5]}-{novo['num'][5:]}",
            full_novo=novo["full_com_ddi"],
        )
        conteudo = conteudo.replace("</body>", banner + "\n</body>")
        trocas += 1  # conta a injeção do banner como 1 alteração

    if conteudo != original and not dry_run:
        with open(caminho, "w", encoding="utf-8") as f:
            f.write(conteudo)

    return trocas


def main():
    ap = argparse.ArgumentParser(description="Troca o número de WhatsApp em massa no site.")
    ap.add_argument("--novo", required=True, help="Número novo, só dígitos, com DDD (ex: 31988887777)")
    ap.add_argument("--dry-run", action="store_true", help="Não grava nada, só reporta")
    ap.add_argument("--banner", action="store_true", help="Também injeta o aviso de número novo antes de </body>")
    ap.add_argument("arquivos", nargs="+", help="Arquivos .html/.js/.json a processar")
    args = ap.parse_args()

    novo = montar_variacoes_novo(args.novo)
    print(f"Número antigo : ({DDD_ANTIGO}) {NUM_ANTIGO[:5]}-{NUM_ANTIGO[5:]}  [{FULL_ANTIGO_COM_DDI}]")
    print(f"Número novo   : {novo['display']}  [{novo['full_com_ddi']}]")
    print(f"Modo          : {'DRY-RUN (nada será gravado)' if args.dry_run else 'GRAVANDO'}")
    print(f"Banner        : {'sim' if args.banner else 'não'}")
    print("-" * 70)

    total_arquivos_alterados = 0
    total_trocas = 0
    for caminho in args.arquivos:
        try:
            n = processar_arquivo(caminho, novo, args.dry_run, args.banner)
        except Exception as e:
            print(f"[ERRO] {caminho}: {e}")
            continue
        if n > 0:
            total_arquivos_alterados += 1
            total_trocas += n
            print(f"  {n:3d} troca(s)  ->  {caminho}")

    print("-" * 70)
    print(f"Arquivos alterados: {total_arquivos_alterados} / {len(args.arquivos)}")
    print(f"Total de trocas   : {total_trocas}")


if __name__ == "__main__":
    sys.exit(main())
