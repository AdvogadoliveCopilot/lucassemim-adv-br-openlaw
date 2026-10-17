# Injeta header-elite.js antes de </head> nas paginas que nao tinham menu.
# Preserva encoding original (le bytes, escreve bytes).
$targets = @(
  'news\advocacia-humanizada-reintegracao-esperanca.html',
  'news\calendario-saidinha-2026-mg-regras.html',
  'news\crimes-ia-deepfake.html',
  'news\crise-stf-fe-justica-limites-do-poder.html',
  'news\o-justo-juiz-justica-crise-integridade-judiciario.html',
  'news\venezuela-anistia-el-helicoide-direito-penal.html',
  'news\volta-aulas-ia-cyberbullying.html',
  'defesa-criminal\audiencia-de-custodia-prazos-direitos-liberdade-provisoria-bh.html',
  'legal-tech\calculadora-prescricao.html',
  'politica-de-privacidade.html',
  'portal-investidor.html',
  'projeto-anjo.html',
  'emergencia.html',
  'civel\painel-processo.html'
)
$tag = '    <script src="../js/header-elite.js?v=20261015"></script>' + "`n</head>"
$ok = 0; $skip = @(); $erro = @()
foreach ($f in $targets) {
  $p = Join-Path (Get-Location) $f
  if (-not (Test-Path $p)) { $erro += $f; continue }
  $b = [IO.File]::ReadAllBytes($p)
  $t = [Text.Encoding]::UTF8.GetString($b)
  if ($t.Contains('header-elite.js')) { $skip += $f; continue }
  $idx = $t.IndexOf('</head>')
  if ($idx -lt 0) { $erro += "$f (sem </head>)"; continue }
  $n = $t.Substring(0, $idx) + $tag + $t.Substring($idx + 7)
  [IO.File]::WriteAllText($p, $n, (New-Object System.Text.UTF8Encoding($false)))
  $ok++
}
Write-Output "OK: $ok"
Write-Output "SKIP: $($skip -join '; ')"
Write-Output "ERRO: $($erro -join '; ')"
