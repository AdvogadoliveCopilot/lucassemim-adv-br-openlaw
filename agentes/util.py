# -*- coding: utf-8 -*-
"""
Utilidades comuns dos agentes — lucassemim.adv.br
Só biblioteca padrão do Python (nada para instalar).
"""
import datetime
import json
import os
import re
import sys
import tempfile
import unicodedata


def console_utf8():
    """Evita o erro 'charmap codec can't encode' (emoji/acentos) no console do Windows."""
    for nome in ("stdout", "stderr"):
        fluxo = getattr(sys, nome, None)
        if fluxo is not None and hasattr(fluxo, "reconfigure"):
            try:
                fluxo.reconfigure(encoding="utf-8", errors="replace")
            except Exception:
                pass


def agora_iso():
    return datetime.datetime.now().isoformat(timespec="seconds")


def hoje_iso():
    return datetime.date.today().isoformat()


def slugify(texto, limite=80):
    """Título -> slug de URL (sem acento, minúsculo, hífens)."""
    s = unicodedata.normalize("NFKD", (texto or "").lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s).strip("-")
    if len(s) > limite:
        corte = s[:limite]
        s = corte.rsplit("-", 1)[0] if "-" in corte else corte
    return s or "artigo"


def ler_json(caminho, padrao=None):
    try:
        with open(caminho, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return padrao


def gravar_json(caminho, dados):
    """Grava de forma atômica (arquivo temporário + troca), sem deixar JSON pela metade."""
    pasta = os.path.dirname(os.path.abspath(caminho))
    os.makedirs(pasta, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=".tmp-", suffix=".json", dir=pasta)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(dados, f, ensure_ascii=False, indent=2)
            f.write("\n")
        try:
            os.chmod(tmp, 0o644)
        except OSError:
            pass
        os.replace(tmp, caminho)
    except Exception:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def gravar_texto(caminho, texto):
    pasta = os.path.dirname(os.path.abspath(caminho))
    os.makedirs(pasta, exist_ok=True)
    with open(caminho, "w", encoding="utf-8", newline="\n") as f:
        f.write(texto)


def anexar_jsonl(caminho, registro):
    pasta = os.path.dirname(os.path.abspath(caminho))
    os.makedirs(pasta, exist_ok=True)
    with open(caminho, "a", encoding="utf-8") as f:
        f.write(json.dumps(registro, ensure_ascii=False) + "\n")


_CERCA = re.compile(r"^\s*```[a-zA-Z0-9_-]*\s*\n?(.*?)\n?```\s*$", re.S)


def tirar_cerca(texto):
    """Remove ```json ... ``` em volta da resposta, se houver."""
    t = (texto or "").strip()
    m = _CERCA.match(t)
    if m:
        return m.group(1).strip()
    if t.startswith("```"):
        t = re.sub(r"^```[a-zA-Z0-9_-]*\s*\n?", "", t)
        t = re.sub(r"\n?```\s*$", "", t)
    return t.strip()


def extrair_json(texto):
    """
    Pega o JSON de uma resposta de IA mesmo com texto antes/depois, cerca ``` ou
    vírgula sobrando. Levanta ValueError se não achar nada válido.
    """
    t = tirar_cerca(texto)
    candidatos = [t]
    for abre, fecha in (("{", "}"), ("[", "]")):
        i, j = t.find(abre), t.rfind(fecha)
        if i != -1 and j > i:
            candidatos.append(t[i:j + 1])
    ultimo_erro = None
    for c in candidatos:
        for tentativa in (c, re.sub(r",\s*([}\]])", r"\1", c)):
            try:
                return json.loads(tentativa)
            except ValueError as e:
                ultimo_erro = e
    raise ValueError("resposta da IA não contém JSON válido: %s" % ultimo_erro)


def extrair_blocos(texto, marcadores):
    """
    Lê respostas no formato:
        ===TITULO===
        ...
        ===HTML===
        ...
    Devolve {marcador: texto}. Marcadores ausentes ficam de fora.
    """
    t = tirar_cerca(texto) if (texto or "").lstrip().startswith("```") else (texto or "")
    nomes = "|".join(re.escape(m) for m in marcadores)
    partes = re.split(r"^[ \t]*={3,}\s*(%s)\s*={3,}[ \t]*$" % nomes, t, flags=re.M)
    blocos = {}
    for i in range(1, len(partes) - 1, 2):
        blocos[partes[i]] = partes[i + 1].strip()
    return blocos


def tamanho_legivel(n):
    if n >= 1024 * 1024:
        return "%.2f MB" % (n / (1024 * 1024))
    if n >= 1024:
        return "%.1f KB" % (n / 1024)
    return "%d B" % n


def preencher(modelo, **valores):
    """
    Troca <<CHAVE>> por valores — sem usar str.format (que quebra com chaves de CSS/JSON dentro do texto).
        preencher("Olá <<NOME>>", nome="Lucas")  ->  "Olá Lucas"
    """
    for k, v in valores.items():
        modelo = modelo.replace("<<%s>>" % k.upper(), str(v))
    return modelo


def rodar_principal(funcao):
    """Executa main() sem despejar traceback na tela: mostra a mensagem em português e grava o detalhe em log_erros.txt."""
    import traceback
    try:
        funcao()
    except SystemExit:
        raise
    except KeyboardInterrupt:
        print("\nInterrompido por você.")
        sys.exit(130)
    except Exception as e:
        pasta = os.path.dirname(os.path.abspath(__file__))
        try:
            with open(os.path.join(pasta, "log_erros.txt"), "a", encoding="utf-8") as f:
                f.write("\n[%s]\n%s\n" % (agora_iso(), traceback.format_exc()))
        except OSError:
            pass
        print("\n❌ %s: %s" % (type(e).__name__, e))
        print("   (detalhes técnicos em agentes\\log_erros.txt)")
        sys.exit(1)
