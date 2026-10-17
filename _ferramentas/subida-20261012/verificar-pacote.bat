@echo off
chcp 65001 >nul
title Conferir o pacote de subida 20261012 (so le, nao altera nada)
rem ------------------------------------------------------------------------------
rem Compara cada arquivo desta pasta com o manifesto-subida-20261012.csv (soma SHA-256).
rem Nada e enviado para a internet e nada e alterado.
rem ------------------------------------------------------------------------------
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0verificar-pacote.ps1"
echo.
pause
