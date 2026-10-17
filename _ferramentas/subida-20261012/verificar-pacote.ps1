# Verifica se cada arquivo desta pasta continua igual ao manifesto (SHA-256). So le; nao altera nada.
$pacote = $PSScriptRoot
$csv = Join-Path $pacote 'manifesto-subida-20261012.csv'
if (-not (Test-Path -LiteralPath $csv)) { Write-Host ("Manifesto nao encontrado: " + $csv); exit 1 }
$linhas = Import-Csv -LiteralPath $csv -Delimiter ';' -Encoding UTF8
$ok = 0; $dif = 0; $aus = 0
foreach ($l in $linhas) {
  $rel = $l.grupo + '\' + ($l.caminho -replace '/', '\')
  $f = Join-Path $pacote $rel
  if (-not (Test-Path -LiteralPath $f)) { Write-Host ("AUSENTE    " + $rel); $aus++; continue }
  $h = (Get-FileHash -LiteralPath $f -Algorithm SHA256).Hash.ToLower()
  if ($h -eq $l.sha256.ToLower()) { $ok++ } else { Write-Host ("DIFERENTE  " + $rel); $dif++ }
}
Write-Host ""
Write-Host ("Arquivos na lista: " + @($linhas).Count + " | iguais: " + $ok + " | diferentes: " + $dif + " | ausentes: " + $aus)
if (($dif -eq 0) -and ($aus -eq 0)) { Write-Host "Tudo certo: a pasta esta igual ao que eu preparei." } else { Write-Host "Ha diferencas: me avise antes de enviar." }
