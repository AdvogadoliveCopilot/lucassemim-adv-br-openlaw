# -*- coding: utf-8 -*-
"""
AGENTE 4 — PUBLICADOR (modo RASCUNHO primeiro)
==============================================
Por padrão este agente NÃO publica nada: ele guarda o artigo pronto em
    agentes\\rascunhos\\AAAA-MM-DD_slug\\   (artigo.html + REVISAO.txt + artigo.json)
Você abre o artigo.html no navegador, revisa, edita se quiser, e só então manda publicar:
    python pipeline.py --publicar <slug>

Na publicação:
  1. roda de novo as travas (promessa de resultado, telefone antigo, JSON-LD, [CONFERIR]...) no arquivo EDITADO;
  2. atualiza datas e carimbo ?v= para os de hoje;
  3. grava o artigo na pasta do site e acrescenta a URL no sitemap.xml (com cópia de segurança);
  4. se a senha do FTP estiver configurada: envia SÓ esses 2 arquivos (nunca pasta inteira) e confere o tamanho;
     senão: avisa quais 2 arquivos você sobe pelo FileZilla;
  5. confere se a URL abriu (somente leitura) e atualiza a memória editorial.
"""
import argparse
import datetime
import os
import re
import shutil
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agente_redator
import compliance
import config
import memoria
from util import agora_iso, console_utf8, gravar_json, gravar_texto, ler_json, rodar_principal

ENTRADA = os.path.join(config.PASTA_AGENTES, "output_seo.json")
LOG_FILE = os.path.join(config.PASTA_AGENTES, "log_publicacoes.jsonl")


def _log(evento):
    from util import anexar_jsonl
    evento["ts"] = agora_iso()
    anexar_jsonl(LOG_FILE, evento)


# ─── RASCUNHO ────────────────────────────────────────────────────────────────
def _escrever_revisao(pasta, artigo):
    v = artigo.get("verificacao", {})
    seo = artigo.get("relatorio_seo", {})
    uso = artigo.get("modelo_usado", {})
    L = []
    L.append("REVISÃO DO RASCUNHO — %s" % artigo["titulo"])
    L.append("=" * 70)
    L.append("Criado em: %s   |   IA usada: %s" % (agora_iso(), uso.get("usado", "?")))
    L.append("Abra no navegador:  artigo.html   (pode editar o HTML à vontade)")
    L.append("Para publicar:      python pipeline.py --publicar %s" % artigo["slug"])
    L.append("Para descartar:     python pipeline.py --descartar %s" % artigo["slug"])
    L.append("")
    destino = os.path.join(config.SITE_DIR, artigo.get("pasta", config.PASTA_PUBLICACAO), artigo["nome_arquivo"])
    if os.path.exists(destino):
        L.append("!! JÁ EXISTE uma página com este endereço no site: %s" % destino)
        L.append("   Mude o título/slug ou publique com --sobrescrever (substitui a página existente).")
        L.append("")
    L.append("1) O QUE BLOQUEIA A PUBLICAÇÃO (precisa ficar vazio)")
    L.extend(["   - " + e for e in v.get("erros", [])] or ["   (nada)"])
    L.append("")
    L.append("2) PARA OLHAR COM ATENÇÃO")
    L.extend(["   - " + a for a in v.get("avisos", [])] or ["   (nada)"])
    L.append("")
    L.append("3) CITAÇÕES PARA CONFERIR EM FONTE OFICIAL (a IA pode errar número de súmula/artigo)")
    L.append("   Fontes: planalto.gov.br (leis), portal.stf.jus.br (súmulas STF), scon.stj.jus.br (STJ)")
    L.extend(["   [ ] " + c for c in v.get("citacoes", [])] or ["   (nenhuma citação encontrada)"])
    L.append("")
    L.append("4) SEO — nota %s/100%s" % (seo.get("nota_seo", "?"),
                                          " (meta description nova aplicada)" if seo.get("meta_description_aplicada") else ""))
    L.extend(["   - " + m for m in seo.get("melhorias", [])])
    L.extend(["   - (automático) " + p for p in seo.get("problemas_automaticos", [])])
    if seo.get("palavras_chave_faltando"):
        L.append("   Palavras-chave que faltam no texto: " + ", ".join(seo["palavras_chave_faltando"]))
    L.append("")
    san = artigo.get("sanitizacao", {})
    if san.get("tags_removidas") or san.get("links_removidos"):
        L.append("5) LIMPEZA AUTOMÁTICA FEITA NO TEXTO DA IA")
        if san.get("tags_removidas"):
            L.append("   Tags removidas: " + ", ".join(san["tags_removidas"]))
        if san.get("links_removidos"):
            L.append("   Links removidos (não existiam no site ou eram inseguros): " + ", ".join(san["links_removidos"]))
        L.append("")
    L.append("CHECKLIST DO ADVOGADO")
    L.append("   [ ] Li o texto inteiro e concordo com cada afirmação")
    L.append("   [ ] Conferi cada citação da seção 3 e apaguei qualquer [CONFERIR]")
    L.append("   [ ] Sem promessa de resultado, valores, depoimentos ou comparação com outros advogados")
    L.append("   [ ] Título, descrição e categoria estão como eu quero")
    L.append("   [ ] O telefone %s aparece no quadro de contato do artigo" % config.TELEFONE)
    L.append("   [ ] Se quiser o artigo listado em artigos.html, adicionar o link manualmente no capítulo certo")
    gravar_texto(os.path.join(pasta, "REVISAO.txt"), "\n".join(L) + "\n")


def criar_rascunho(artigo):
    """Salva o artigo em agentes\\rascunhos\\ (nada vai para o site). Retorna a pasta."""
    pasta = os.path.join(config.RASCUNHOS_DIR, "%s_%s" % (datetime.date.today().isoformat(),
                                   (getattr(config, "AREA_PREFIXO_RASCUNHO", "") or "") + artigo["slug"]))
    os.makedirs(pasta, exist_ok=True)
    gravar_texto(os.path.join(pasta, "artigo.html"), artigo["html"])
    meta = {k: artigo.get(k) for k in ("titulo", "slug", "meta_description", "tags", "categoria", "pasta",
                                       "nome_arquivo", "pauta_id", "palavras", "modelo_usado", "relatorio_seo",
                                       "verificacao")}
    meta["criado_em"] = agora_iso()
    meta["pasta"] = artigo.get("pasta", config.PASTA_PUBLICACAO)
    meta["area"] = "civel" if getattr(config, "AREA_CIVEL", False) else "criminal"
    gravar_json(os.path.join(pasta, "artigo.json"), meta)
    _escrever_revisao(pasta, artigo)
    mem = memoria.carregar()
    memoria.registrar_rascunho(mem, artigo, pasta, pauta_id=artigo.get("pauta_id"))
    memoria.salvar(mem)
    _log({"tipo": "rascunho", "slug": artigo["slug"], "pasta": os.path.basename(pasta),
          "erros": len(artigo.get("verificacao", {}).get("erros", []))})
    return pasta


def listar_rascunhos():
    saida = []
    if not os.path.isdir(config.RASCUNHOS_DIR):
        return saida
    for nome in sorted(os.listdir(config.RASCUNHOS_DIR)):
        pasta = os.path.join(config.RASCUNHOS_DIR, nome)
        meta = ler_json(os.path.join(pasta, "artigo.json"))
        if os.path.isdir(pasta) and meta and not nome.startswith("_"):
            saida.append({"pasta": nome, "slug": meta.get("slug"), "titulo": meta.get("titulo"),
                          "erros": len((meta.get("verificacao") or {}).get("erros", [])),
                          "criado_em": meta.get("criado_em", "")})
    return saida


def localizar_rascunho(ref):
    ref = (ref or "").strip().strip("\\/")
    itens = listar_rascunhos()
    exatos = [i for i in itens if ref in (i["pasta"], i["slug"])]
    parciais = [i for i in itens if ref and ref in i["pasta"]]
    achados = exatos or parciais
    if len(achados) != 1:
        raise LookupError("Rascunho '%s' não encontrado (ou ambíguo). Veja:  python pipeline.py --listar" % ref)
    return os.path.join(config.RASCUNHOS_DIR, achados[0]["pasta"])


def descartar_rascunho(ref):
    """Move para rascunhos\\_descartados (não apaga) e devolve o tema ao fim da fila."""
    pasta = localizar_rascunho(ref)
    meta = ler_json(os.path.join(pasta, "artigo.json"), {})
    destino_base = os.path.join(config.RASCUNHOS_DIR, "_descartados")
    os.makedirs(destino_base, exist_ok=True)
    destino = os.path.join(destino_base, os.path.basename(pasta))
    if os.path.exists(destino):
        destino += "-" + datetime.datetime.now().strftime("%H%M%S")
    shutil.move(pasta, destino)
    mem = memoria.carregar()
    memoria.devolver_a_fila(mem, meta)
    memoria.salvar(mem)
    _log({"tipo": "descartado", "slug": meta.get("slug")})
    return destino


# ─── PUBLICAÇÃO ──────────────────────────────────────────────────────────────
def _atualizar_datas_e_carimbo(html, hoje):
    iso, br = hoje.isoformat(), agente_redator.data_br(hoje)
    html = re.sub(r'("datePublished":\s*")\d{4}-\d{2}-\d{2}(")', r"\g<1>%s\g<2>" % iso, html)
    html = re.sub(r'("dateModified":\s*")\d{4}-\d{2}-\d{2}(")', r"\g<1>%s\g<2>" % iso, html)
    html = re.sub(r'(article:(?:published|modified)_time" content=")\d{4}-\d{2}-\d{2}', r"\g<1>%s" % iso, html)
    html = re.sub(r'(<time datetime=")\d{4}-\d{2}-\d{2}(">)[^<]*(</time>)', r"\g<1>%s\g<2>%s\g<3>" % (iso, br), html)
    versao = agente_redator.versao_do_site()
    html = re.sub(r'(src="%s/(?:js|codelei)/[^"?]+\.js)\?v=\d+' % re.escape(config.SITE_URL), r"\g<1>?v=%s" % versao, html)
    return html


def _inserir_no_sitemap(xml_texto, url, lastmod):
    """Acrescenta a <url> antes de </urlset>; devolve (novo_texto, inseriu_bool). Valida o XML."""
    if "<loc>%s</loc>" % url in xml_texto:
        return xml_texto, False
    nl = "\r\n" if "\r\n" in xml_texto else "\n"           # respeita o estilo de quebra de linha do arquivo
    bloco = nl.join(["    <url>", "        <loc>%s</loc>" % url, "        <lastmod>%s</lastmod>" % lastmod,
                     "        <priority>0.85</priority>", "    </url>"]) + nl
    pos = xml_texto.rfind("</urlset>")
    if pos == -1:
        raise ValueError("sitemap.xml sem </urlset>")
    novo = xml_texto[:pos] + bloco + xml_texto[pos:]
    ET.fromstring(novo.encode("utf-8"))       # levanta ParseError se ficou inválido
    return novo, True


def _ler_arquivo(caminho):
    with open(caminho, "rb") as f:
        return f.read()


def _checar_url(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 LucasSemimPublicador/2.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            corpo = r.read(200000).decode("utf-8", errors="ignore")
            return r.status, corpo
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:
        return 0, str(e)


def publicar_rascunho(ref, sim=False, sem_ftp=False, sobrescrever=False, avisar=print):
    pasta = localizar_rascunho(ref)
    meta = ler_json(os.path.join(pasta, "artigo.json"), {})
    arq_html = os.path.join(pasta, "artigo.html")
    html = _ler_arquivo(arq_html).decode("utf-8")
    hoje = datetime.date.today()
    slug, pasta_pub = meta["slug"], meta.get("pasta", config.PASTA_PUBLICACAO)
    url = "%s/%s/%s.html" % (config.SITE_URL, pasta_pub, slug)

    avisar("📰 %s" % meta["titulo"])
    avisar("   endereço: %s" % url)

    # 1) travas no arquivo EDITADO por você
    v = compliance.verificar_artigo(html, corpo_html=compliance.extrair_corpo(html))
    if v["erros"]:
        avisar("\n🛑 NÃO PUBLICADO — corrija no artigo.html e rode de novo:")
        for e in v["erros"]:
            avisar("   - " + e)
        _log({"tipo": "bloqueado", "slug": slug, "erros": v["erros"]})
        return False
    if v["avisos"]:
        avisar("\n⚠️  Pontos de atenção:")
        for a in v["avisos"]:
            avisar("   - " + a)
    if v["citacoes"]:
        avisar("\n📚 Citações no texto (confirme cada uma): " + "; ".join(v["citacoes"][:12]))

    destino_local = os.path.join(config.SITE_DIR, pasta_pub, slug + ".html")
    if os.path.exists(destino_local) and not sobrescrever:
        avisar("\n🛑 Já existe %s. Use --sobrescrever se for mesmo substituir." % destino_local)
        return False

    usar_ftp = (not sem_ftp) and config.ftp_configurado()
    avisar("\nVai fazer: gravar a página em %s\\%s, acrescentar a URL no sitemap.xml%s." %
           (pasta_pub, slug + ".html", " e ENVIAR esses 2 arquivos por FTP" if usar_ftp else " (sem FTP: você sobe os 2 arquivos pelo FileZilla)"))
    if not sim:
        if not sys.stdin or not sys.stdin.isatty():
            avisar("   (sem terminal interativo: confirme rodando com --sim)")
            return False
        if input("Digite PUBLICAR para confirmar: ").strip() != "PUBLICAR":
            avisar("Cancelado. Nada foi publicado.")
            return False

    # 2) datas e carimbo de hoje
    final = _atualizar_datas_e_carimbo(html, hoje)

    # 3) grava local
    os.makedirs(os.path.dirname(destino_local), exist_ok=True)
    gravar_texto(destino_local, final)
    avisar("  ✅ Gravado: %s" % destino_local)

    # 4) sitemap: o cível tem sitemap próprio (civel/sitemap.xml); o criminal usa o da raiz
    if getattr(config, "AREA_CIVEL", False):
        sitemap_local = os.path.join(config.CIVEL_DIR, "sitemap.xml")
    else:
        sitemap_local = os.path.join(config.SITE_DIR, "sitemap.xml")
    sitemap_alterado_local = False
    if os.path.exists(sitemap_local):
        original = _ler_arquivo(sitemap_local).decode("utf-8")
        os.makedirs(config.BACKUPS_DIR, exist_ok=True)
        carimbo = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        shutil.copyfile(sitemap_local, os.path.join(config.BACKUPS_DIR, "sitemap-local-%s.xml" % carimbo))
        novo, inseriu = _inserir_no_sitemap(original, url, hoje.isoformat())
        if inseriu:
            with open(sitemap_local, "w", encoding="utf-8", newline="") as f:
                f.write(novo)
            sitemap_alterado_local = True
        avisar("  ✅ sitemap.xml local %s" % ("atualizado" if inseriu else "já tinha a URL"))

    # 5) FTP (só 2 arquivos)
    enviado = False
    if usar_ftp:
        import ftp_util
        try:
            ftp = ftp_util.conectar(avisar=avisar)
            try:
                remoto_pagina = "%s/%s/%s.html" % (config.FTP_ROOT, pasta_pub, slug)
                if ftp_util.existe(ftp, remoto_pagina) and not sobrescrever:
                    raise ftp_util.FtpErro("já existe %s no servidor (use --sobrescrever)" % remoto_pagina)
                ftp_util.enviar(ftp, destino_local, remoto_pagina)
                avisar("  ✅ Enviado: %s" % remoto_pagina)
                # sitemap: baixa o do servidor (é a versão que vale), acrescenta e sobe
                remoto_sitemap = config.FTP_ROOT + "/sitemap.xml"
                os.makedirs(config.BACKUPS_DIR, exist_ok=True)
                backup = os.path.join(config.BACKUPS_DIR, "sitemap-servidor-%s.xml" %
                                      datetime.datetime.now().strftime("%Y%m%d-%H%M%S"))
                ftp_util.baixar(ftp, remoto_sitemap, backup)
                novo, inseriu = _inserir_no_sitemap(_ler_arquivo(backup).decode("utf-8"), url, hoje.isoformat())
                if inseriu:
                    tmp = backup + ".novo"
                    with open(tmp, "w", encoding="utf-8", newline="") as f:
                        f.write(novo)
                    ftp_util.enviar(ftp, tmp, remoto_sitemap)
                    os.unlink(tmp)
                avisar("  ✅ sitemap.xml do servidor %s (cópia anterior em backups_publicacao)" %
                       ("atualizado" if inseriu else "já tinha a URL"))
                enviado = True
            finally:
                try:
                    ftp.quit()
                except Exception:
                    pass
        except ftp_util.FtpErro as e:
            avisar("  ❌ FTP: %s" % e)
            avisar("     O artigo ficou gravado na sua pasta; suba pelo FileZilla: %s e sitemap.xml" % destino_local)
    else:
        avisar("\n📤 Suba pelo FileZilla (somente estes 2 arquivos):")
        avisar("   %s  ->  /public_html/%s/" % (destino_local, pasta_pub))
        avisar("   %s  ->  /public_html/%s/" % (sitemap_local, pasta_pub))

    # 6) conferência pública (somente leitura)
    if enviado:
        status, corpo = _checar_url(url)
        if status == 200 and meta["titulo"][:30] in corpo:
            avisar("  ✅ No ar: %s (HTTP 200)" % url)
        elif status == 200:
            avisar("  ⚠️  HTTP 200, mas o conteúdo esperado não apareceu (pode ser a página de verificação do WAF). Abra no navegador: %s" % url)
        else:
            avisar("  ⚠️  Conferência retornou HTTP %s — abra no navegador e veja: %s" % (status or "sem resposta", url))

    # 7) memória e arquivo morto do rascunho
    mem = memoria.carregar()
    memoria.registrar_publicacao(mem, meta, url, len(final.encode("utf-8")))
    memoria.salvar(mem)
    destino_pub = os.path.join(config.RASCUNHOS_DIR, "_publicados")
    os.makedirs(destino_pub, exist_ok=True)
    shutil.move(pasta, os.path.join(destino_pub, os.path.basename(pasta)))
    _log({"tipo": "publicacao", "slug": slug, "url": url, "ftp": enviado,
          "sitemap_local": sitemap_alterado_local, "titulo": meta["titulo"]})
    avisar("\n✅ Publicação concluída%s." % ("" if enviado else " (falta subir os arquivos acima)"))
    return True


# ─── LINHA DE COMANDO ────────────────────────────────────────────────────────
def main():
    console_utf8()
    ap = argparse.ArgumentParser(description="Agente 4 — Publicador (rascunho primeiro)")
    ap.add_argument("--listar", action="store_true", help="lista os rascunhos aguardando revisão")
    ap.add_argument("--publicar", metavar="RASCUNHO", help="publica um rascunho já revisado")
    ap.add_argument("--descartar", metavar="RASCUNHO", help="move o rascunho para _descartados")
    ap.add_argument("--sim", action="store_true", help="confirma a publicação sem perguntar (use com cuidado)")
    ap.add_argument("--sem-ftp", action="store_true", help="grava na pasta do site mas não envia por FTP")
    ap.add_argument("--sobrescrever", action="store_true", help="permite substituir página que já existe")
    args = ap.parse_args()

    if args.listar:
        itens = listar_rascunhos()
        if not itens:
            print("Nenhum rascunho aguardando revisão.")
        for i in itens:
            print("• %s\n    %s%s" % (i["pasta"], i["titulo"], "   [%d erro(s) a corrigir]" % i["erros"] if i["erros"] else ""))
        return
    if args.descartar:
        print("Movido para:", descartar_rascunho(args.descartar))
        return
    if args.publicar:
        ok = publicar_rascunho(args.publicar, sim=args.sim, sem_ftp=args.sem_ftp, sobrescrever=args.sobrescrever)
        sys.exit(0 if ok else 1)

    # padrão: transforma o resultado da esteira em RASCUNHO
    if not os.path.exists(ENTRADA):
        print("❌ Rode o agente_seo.py primeiro.")
        sys.exit(1)
    dados = ler_json(ENTRADA, {})
    for artigo in dados["artigos"]:
        pasta = criar_rascunho(artigo)
        v = artigo.get("verificacao", {})
        print("📝 Rascunho salvo: %s" % os.path.relpath(pasta, config.PASTA_AGENTES))
        print("   %d erro(s) a corrigir, %d aviso(s). Leia REVISAO.txt e abra artigo.html no navegador." %
              (len(v.get("erros", [])), len(v.get("avisos", []))))
    print("\nNada foi enviado ao site. Para publicar depois da revisão:  python pipeline.py --publicar <slug>")


if __name__ == "__main__":
    rodar_principal(main)
