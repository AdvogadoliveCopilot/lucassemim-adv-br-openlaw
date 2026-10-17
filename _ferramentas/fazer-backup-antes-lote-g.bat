@echo off
chcp 65001 >nul
title Backup antes do Lote G
rem ------------------------------------------------------------------------------
rem Guarda uma copia do index.html (a home) COMO ESTA AGORA na pasta do site. Rode ANTES de
rem copiar o index.html novo para a pasta do site.
rem Resultado: _ferramentas\backups\index-antes-lote-g-AAAAMMDD-HHMM.html dentro da pasta do site.
rem ------------------------------------------------------------------------------
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fazer-backup-antes-lote-g.ps1"
echo.
pause
