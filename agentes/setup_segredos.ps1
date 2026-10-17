# setup_segredos.ps1
# Guarda a senha do FTP (e, se voce quiser, a chave do OmniRoute) CRIPTOGRAFADAS no seu usuario do Windows.
# - Quem digita e VOCE. A senha nunca e gravada em texto puro, nunca aparece na tela e nao fica na pasta do site.
# - O arquivo vai para %APPDATA%\LucasSemimAgentes (fora do site, nao sobe pelo FTP).
# - So o seu usuario do Windows, neste computador, consegue descriptografar (DPAPI).
#
# Como usar: de dois cliques em setup_segredos.bat
# Para apagar os segredos guardados: setup_segredos.bat remover

param([switch]$Remover)

$ErrorActionPreference = 'Stop'
$pasta = Join-Path $env:APPDATA 'LucasSemimAgentes'
$arqFtp = Join-Path $pasta 'ftp.dpapi'
$arqOmni = Join-Path $pasta 'omni.dpapi'

if ($Remover) {
    foreach ($a in @($arqFtp, $arqOmni)) {
        if (Test-Path -LiteralPath $a) {
            Remove-Item -LiteralPath $a -Force
            Write-Host ("Removido: " + $a)
        }
    }
    Write-Host "Pronto. Nenhum segredo guardado."
    exit 0
}

New-Item -ItemType Directory -Force -Path $pasta | Out-Null

Write-Host ""
Write-Host "=== Segredos dos agentes (lucassemim.adv.br) ==="
Write-Host "Nada que voce digitar aparece na tela. Para pular um item, so aperte Enter."
Write-Host ""

$ftp = Read-Host 'Senha do FTP da Hostinger (usuario lucassemim1)' -AsSecureString
if ($ftp.Length -gt 0) {
    $ftp | ConvertFrom-SecureString | Set-Content -LiteralPath $arqFtp -Encoding ASCII
    Write-Host "  OK - senha do FTP guardada (criptografada)."
} else {
    Write-Host "  Pulado - senha do FTP nao alterada."
}

Write-Host ""
Write-Host "Chave de API do OmniRoute (so e necessaria se voce ligar 'exigir chave' no painel)."
$omni = Read-Host 'Chave do OmniRoute (Enter para pular)' -AsSecureString
if ($omni.Length -gt 0) {
    $omni | ConvertFrom-SecureString | Set-Content -LiteralPath $arqOmni -Encoding ASCII
    Write-Host "  OK - chave do OmniRoute guardada (criptografada)."
} else {
    Write-Host "  Pulado - chave do OmniRoute nao alterada."
}

Write-Host ""
Write-Host "Guardado em: $pasta"
Write-Host "Teste agora (sem publicar nada):  python pipeline.py --testar"
