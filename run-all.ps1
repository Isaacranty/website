param(
  [switch]$Production
)

$ErrorActionPreference = 'Stop'

if ($Production) {
  Write-Host "=== Starting production stack via docker-compose.prod.yml ===" -ForegroundColor Cyan
  docker compose -f docker-compose.prod.yml up --build --remove-orphans
  return
}

Write-Host "=== Starting Polyglot API services ===" -ForegroundColor Cyan

function Start-ServiceProcess($name, $command, $arguments, $workdir) {
  Write-Host "Starting $name in $workdir..." -ForegroundColor Green
  $argArray = @()
  if ($arguments -is [System.Array]) { $argArray = $arguments }
  elseif ($arguments) { $argArray = @($arguments) }

  Write-Host "  command: $command" -ForegroundColor Cyan
  Write-Host "  args: $($argArray -join ', ')" -ForegroundColor Cyan

  if ($argArray.Count -eq 0) {
    return Start-Process -FilePath $command -WorkingDirectory $workdir -NoNewWindow -PassThru
  } else {
    return Start-Process -FilePath $command -ArgumentList $argArray -WorkingDirectory $workdir -NoNewWindow -PassThru
  }
}

$procs = @{}

$nodeArgs = @('server.js')
$pythonArgs = @('service.py')
$goArgs = @('run','service.go')

$procs.node = Start-ServiceProcess -name 'node-api' -command 'node' -arguments $nodeArgs -workdir 'api\node'
$procs.python = Start-ServiceProcess -name 'python-api' -command 'python' -arguments $pythonArgs -workdir 'api\python'
$procs.go = Start-ServiceProcess -name 'go-api' -command 'go' -arguments $goArgs -workdir 'api\go'

$phpExecutable = Get-Command php -ErrorAction SilentlyContinue
$phpFromDownloads = 'C:\Users\Admin\Downloads\php-8-5-1\php.exe'

if ($null -ne $phpExecutable) {
  Write-Host "PHP found on PATH at $($phpExecutable.Source)" -ForegroundColor Green
  $phpCommand = $phpExecutable.Source
} elseif (Test-Path $phpFromDownloads) {
  Write-Host "PHP found in Downloads at $phpFromDownloads" -ForegroundColor Green
  $phpCommand = $phpFromDownloads
} else {
  $phpCommand = $null
}

if ($null -ne $phpCommand) {
  $procs.php = Start-ServiceProcess -name 'php-api' -command $phpCommand -arguments @('-S','0.0.0.0:8082','index.php') -workdir 'api\php'
} else {
  $dockerExecutable = Get-Command docker -ErrorAction SilentlyContinue
  if ($null -ne $dockerExecutable) {
    Write-Host "PHP not found in PATH and not found at Downloads; using Docker php:8.5-cli container fallback" -ForegroundColor Yellow
    $dockerArgs = @('run','--rm','-d','-p','8082:8082','-v',"$PWD\api\php:/app",'-w','/app','php:8.5-cli','php','-S','0.0.0.0:8082','index.php')
    $dockerProc = Start-ServiceProcess -name 'php-api-docker' -command 'docker' -arguments $dockerArgs -workdir $PWD
    $procs.php = $dockerProc
  } else {
    Write-Host "PHP not found on PATH, not found at Downloads, and Docker not available. PHP service will not run." -ForegroundColor Yellow
    Write-Host "Install PHP (admin shell): choco install -y php" -ForegroundColor Yellow
    Write-Host "Or install Docker Desktop and rerun this script." -ForegroundColor Yellow
  }
}

Start-Sleep -Seconds 5

$urls = @(
  @{name='node-status'; url='http://localhost:3000/status'},
  @{name='node-quote'; url='http://localhost:3000/quote'},
  @{name='python-status'; url='http://localhost:5000/status'},
  @{name='python-quote'; url='http://localhost:5000/quote'},
  @{name='go-status'; url='http://localhost:8081/status'},
  @{name='go-quote'; url='http://localhost:8081/quote'},
  @{name='php-status'; url='http://localhost:8082/status'},
  @{name='php-quote'; url='http://localhost:8082/quote'}
)

Write-Host "=== Health check results ===" -ForegroundColor Cyan
foreach ($entry in $urls) {
  try {
    $resp = Invoke-WebRequest -Uri $entry.url -UseBasicParsing -TimeoutSec 5
    Write-Host "OK [$($entry.name)] $($entry.url): $($resp.StatusCode)" -ForegroundColor Green
  } catch {
    Write-Host "FAIL [$($entry.name)] $($entry.url): $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host "\n=== Stack is running ===" -ForegroundColor Cyan
Write-Host "Open http://localhost for the frontend (or http://localhost:8080 if using docker-compose + Traefik)." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop this script; processes keep running until you terminate them." -ForegroundColor Cyan

Read-Host "Press Enter to stop and clean up" | Out-Null

Write-Host "Stopping child processes..." -ForegroundColor Cyan
foreach ($p in $procs.Values) {
  if ($p -and -not $p.HasExited) {
    try { $p.Kill() } catch {};
  }
}
Write-Host "Done" -ForegroundColor Green
