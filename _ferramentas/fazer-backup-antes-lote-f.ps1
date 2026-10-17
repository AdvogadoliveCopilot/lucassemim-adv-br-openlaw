# Backup (zip, com as subpastas) dos arquivos que o Lote F substitui. So le a pasta do site; nao apaga nada.
$site = 'C:\Users\adm\Desktop\lucassemim.adv.br'
if (-not (Test-Path (Join-Path $site 'advogado-criminalista'))) { Write-Host "Pasta do site nao encontrada: $site"; exit 1 }
$stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$dir = Join-Path $site '_ferramentas\backups'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$zipPath = Join-Path $dir ("lote-f-antes-" + $stamp + ".zip")
$rels = @()
foreach ($n in 'barreiro','betim','brumadinho','caete','contagem','esmeraldas','ibirite','igarape','lagoasanta','neves','novalima','pedroleopoldo','sabara','santaluzia','saojosedalapa','vespasiano','index') { $rels += ('advogado-criminalista\' + $n + '.html') }
$rels += 'css\lucas-local.css'
$rels += 'css\lucas-hub.css'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
$count = 0
foreach ($r in $rels) {
  $p = Join-Path $site $r
  if (Test-Path $p) { [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $p, $r.Replace('\', '/')); $count++ }
}
$zip.Dispose()
Write-Host ("Arquivos guardados no backup: " + $count)
Write-Host ("Backup gravado em: " + $zipPath)
Write-Host "Para voltar atras: abra o zip, extraia e copie cada arquivo de volta para a mesma pasta de origem."
