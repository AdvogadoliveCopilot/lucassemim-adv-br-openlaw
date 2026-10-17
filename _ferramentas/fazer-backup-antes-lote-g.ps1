# Backup do index.html (home) antes do Lote G. So le a pasta do site e copia; nao apaga nem altera nada.
$site = 'C:\Users\adm\Desktop\lucassemim.adv.br'
if (-not (Test-Path (Join-Path $site 'index.html'))) { $site = Split-Path -Parent $PSScriptRoot }
$src = Join-Path $site 'index.html'
if (-not (Test-Path $src)) { Write-Host "index.html nao encontrado em: $site"; exit 1 }
$stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$dir = Join-Path $site '_ferramentas\backups'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$dst = Join-Path $dir ("index-antes-lote-g-" + $stamp + ".html")
Copy-Item -LiteralPath $src -Destination $dst
Write-Host ("Copia gravada em: " + $dst)
Write-Host ("Tamanho do original: " + (Get-Item -LiteralPath $src).Length + " bytes")
Write-Host "Para voltar atras: copie esse arquivo de volta para a pasta do site com o nome index.html e reenvie pelo FileZilla."
