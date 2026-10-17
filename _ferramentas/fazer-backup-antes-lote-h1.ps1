# Backup dos guias (pasta o-que-fazer-agora + sitemap-urgencia.xml) antes do Lote H1. So le a pasta do site e copia; nao apaga nem altera nada.
$site = 'C:\Users\adm\Desktop\lucassemim.adv.br'
if (-not (Test-Path (Join-Path $site 'o-que-fazer-agora'))) { $site = Split-Path -Parent $PSScriptRoot }
$src = Join-Path $site 'o-que-fazer-agora'
if (-not (Test-Path $src)) { Write-Host "Pasta o-que-fazer-agora nao encontrada em: $site"; exit 1 }
$stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$dir = Join-Path $site ('_ferramentas\backups\o-que-fazer-agora-antes-lote-h1-' + $stamp)
New-Item -ItemType Directory -Force -Path $dir | Out-Null
Copy-Item -Path (Join-Path $src '*.html') -Destination $dir
$sm = Join-Path $site 'sitemap-urgencia.xml'
if (Test-Path -LiteralPath $sm) { Copy-Item -LiteralPath $sm -Destination (Join-Path $dir 'sitemap-urgencia.xml') }
$n = (Get-ChildItem -LiteralPath $dir -File).Count
Write-Host ("Copia gravada em: " + $dir + " (" + $n + " arquivos)")
Write-Host "Para voltar atras: copie esses arquivos de volta para a pasta o-que-fazer-agora (e o sitemap-urgencia.xml para a raiz do site) e reenvie pelo FileZilla."
