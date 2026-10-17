@echo off
chcp 65001 >nul
title Ver o site neste computador (nada vai para a internet)
rem ------------------------------------------------------------------------------
rem Abre o site (a pasta acima desta) no navegador, SO neste computador (127.0.0.1).
rem Serve para ver as paginas novas como ficarao no ar, antes de enviar pelo FileZilla.
rem Para parar: feche esta janela.
rem ATENCAO: no aviso de cookies, clique em "Rejeitar" - se clicar em "Aceitar", o Google
rem Analytics pode contar esta visita de teste como visita real.
rem ------------------------------------------------------------------------------
cd /d "%~dp0.."
set PY=python
where py >nul 2>nul && set PY=py
echo.
echo  Servindo a pasta: %CD%
echo  Endereco: http://127.0.0.1:8080/advogado-criminalista/belohorizonte.html
echo  (outras paginas: troque o final do endereco; ex.: /faq.html, /404.html)
echo.
start "" /min cmd /c "ping -n 3 127.0.0.1 >nul & start "" http://127.0.0.1:8080/advogado-criminalista/belohorizonte.html"
%PY% -m http.server 8080 --bind 127.0.0.1
echo.
echo Se apareceu erro acima, o Python nao foi encontrado neste computador.
pause
