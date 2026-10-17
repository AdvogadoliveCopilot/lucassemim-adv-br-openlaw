# -*- coding: utf-8 -*-
"""
FTP do site — usado SÓ quando você manda publicar (pipeline.py --publicar) e no --testar.
A senha vem do setup_segredos.bat (criptografada) ou da variável LS_FTP_PASS; nunca é impressa.
Tenta FTP com criptografia (FTPS explícito) primeiro; se o servidor não aceitar, avisa e usa FTP comum.
"""
import ftplib
import os

import config


class FtpErro(Exception):
    pass


def conectar(timeout=30, avisar=print):
    senha = config.obter_senha_ftp()
    if not senha:
        raise FtpErro("Senha do FTP não configurada. Dê dois cliques em setup_segredos.bat (você digita a senha uma vez).")
    ultimo = None
    for tls in (True, False):
        ftp = None
        try:
            ftp = ftplib.FTP_TLS() if tls else ftplib.FTP()
            ftp.connect(config.FTP_HOST, config.FTP_PORT, timeout=timeout)
            ftp.login(config.FTP_USER, senha)
            if tls:
                ftp.prot_p()
            else:
                avisar("  ⚠️  Este servidor não aceitou FTP criptografado; usando FTP comum (a senha trafega sem criptografia).")
            ftp.set_pasv(True)
            ftp.voidcmd("TYPE I")
            return ftp
        except ftplib.error_perm as e:
            raise FtpErro("O servidor FTP recusou o login (%s). Confira usuário/senha." % str(e)[:80])
        except (ftplib.all_errors, OSError) as e:
            ultimo = e
            try:
                if ftp is not None:
                    ftp.close()
            except Exception:
                pass
    raise FtpErro("Não consegui conectar ao FTP %s:%s (%s)" % (config.FTP_HOST, config.FTP_PORT, str(ultimo)[:120]))


def existe(ftp, remoto):
    try:
        ftp.size(remoto)
        return True
    except ftplib.error_perm:
        return False


def garantir_pasta(ftp, pasta_remota):
    partes = [p for p in pasta_remota.split("/") if p]
    caminho = ""
    for p in partes:
        caminho += "/" + p
        try:
            ftp.cwd(caminho)
        except ftplib.error_perm:
            ftp.mkd(caminho)
    ftp.cwd("/")


def baixar(ftp, remoto, local):
    os.makedirs(os.path.dirname(os.path.abspath(local)), exist_ok=True)
    with open(local, "wb") as f:
        ftp.retrbinary("RETR " + remoto, f.write)
    return os.path.getsize(local)


def enviar(ftp, local, remoto):
    """Envia 1 arquivo e confere o tamanho no servidor. Nunca envia pastas inteiras."""
    garantir_pasta(ftp, os.path.dirname(remoto).replace("\\", "/"))
    tamanho = os.path.getsize(local)
    with open(local, "rb") as f:
        ftp.storbinary("STOR " + remoto, f)
    remoto_tam = ftp.size(remoto)
    if remoto_tam != tamanho:
        raise FtpErro("Tamanho diferente após o envio de %s (local %d, servidor %s)" % (remoto, tamanho, remoto_tam))
    return tamanho


def testar(avisar=print):
    """Conecta e lista a raiz. Retorna (ok, mensagem)."""
    try:
        ftp = conectar(avisar=avisar)
    except FtpErro as e:
        return False, str(e)
    try:
        itens = ftp.nlst(config.FTP_ROOT)
        agentes_no_servidor = any(os.path.basename(i.rstrip("/")) == "agentes" for i in itens)
        msg = "conectou; %d itens em %s" % (len(itens), config.FTP_ROOT)
        if agentes_no_servidor:
            msg += " — ATENÇÃO: existe uma pasta 'agentes' no servidor; ela não deveria estar lá"
        return True, msg
    except ftplib.all_errors as e:
        return False, "conectou, mas não listou %s: %s" % (config.FTP_ROOT, str(e)[:100])
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()
