@echo off
chcp 65001 >nul
title Backup antes do Lote F
rem ------------------------------------------------------------------------------
rem Guarda uma copia (zip) das paginas e estilos que o Lote F vai SUBSTITUIR, como estao agora
rem na pasta do site. Rode ANTES de copiar os arquivos novos para a pasta do site.
rem Resultado: _ferramentas\backups\lote-f-antes-AAAAMMDD-HHMM.zip dentro da pasta do site.
rem ------------------------------------------------------------------------------
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fazer-backup-antes-lote-f.ps1"
echo.
pause
