@echo off
chcp 65001 >nul
title Backup antes do Lote H1
rem ------------------------------------------------------------------------------
rem Guarda uma copia dos guias (pasta o-que-fazer-agora) e do sitemap-urgencia.xml COMO ESTAO AGORA na pasta
rem do site. Rode ANTES de copiar os arquivos novos do Lote H1 para a pasta do site.
rem Resultado: _ferramentas\backups\o-que-fazer-agora-antes-lote-h1-AAAAMMDD-HHMM\ dentro da pasta do site.
rem ------------------------------------------------------------------------------
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fazer-backup-antes-lote-h1.ps1"
echo.
pause
