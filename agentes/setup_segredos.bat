@echo off
rem setup_segredos.bat - guarda a senha do FTP (e a chave do OmniRoute) criptografadas. Quem digita e voce.
rem Para apagar o que foi guardado:  setup_segredos.bat remover
cd /d "%~dp0"
if /i "%~1"=="remover" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_segredos.ps1" -Remover
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_segredos.ps1"
)
echo.
pause
