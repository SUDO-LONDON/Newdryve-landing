param(
  [string]$Environment = "production",
  [string]$Service = "",
  [string]$Project = "",
  [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot ".env.local"

if (-not (Test-Path -LiteralPath $envPath)) {
  throw ".env.local not found. Populate it before deploying to Railway."
}

function Read-DotEnv {
  param([string]$Path)

  $values = @{}
  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if ($trimmed.Length -eq 0 -or $trimmed.StartsWith("#")) {
      continue
    }

    $parts = $trimmed -split "=", 2
    if ($parts.Count -ne 2) {
      continue
    }

    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    $values[$key] = $value
  }

  return $values
}

function Invoke-Railway {
  & npx --yes "@railway/cli" @args
}

$envValues = Read-DotEnv -Path $envPath
$requiredKeys = @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPS_FOUNDER_ALLOWLIST",
  "OPS_SESSION_TIMEOUT_MINUTES"
)

$missing = @($requiredKeys | Where-Object {
  -not $envValues.ContainsKey($_) -or [string]::IsNullOrWhiteSpace($envValues[$_])
})

if ($missing.Count -gt 0) {
  throw "Missing required Railway variables in .env.local: $($missing -join ', ')"
}

$scopeArgs = @("--environment", $Environment)
if (-not [string]::IsNullOrWhiteSpace($Service)) {
  $scopeArgs += @("--service", $Service)
}
if (-not [string]::IsNullOrWhiteSpace($Project)) {
  $scopeArgs += @("--project", $Project)
}

Write-Host "Setting Railway variables from .env.local..."
foreach ($key in $requiredKeys) {
  $envValues[$key] | Invoke-Railway variable set $key --stdin --skip-deploys @scopeArgs | Out-Null
  Write-Host "  set $key"
}

if ($SkipDeploy) {
  Write-Host "Skipped Railway deploy."
  exit 0
}

Write-Host "Deploying to Railway..."
Invoke-Railway up --detach --yes @scopeArgs
