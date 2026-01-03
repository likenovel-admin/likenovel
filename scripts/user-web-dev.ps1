<#
.SYNOPSIS
  likenovel-user(유저웹) 로컬 개발 서버 실행 스크립트 (Windows PowerShell)

.DESCRIPTION
  의도:
  - 윈도우11 환경에서 유저웹을 빠르게 실행할 수 있게 합니다.
  - `.env`는 git에 커밋하지 않고 로컬에서만 관리합니다. (ENV.example 참고)

.PARAMETER Port
  Next dev 서버 포트 (기본 3000)
#>

param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$UserWebPath = Join-Path $RepoRoot "service"

if (!(Test-Path $UserWebPath)) {
  Write-Error "유저웹 경로를 찾지 못했습니다: $UserWebPath"
  exit 1
}

Set-Location $UserWebPath

if (!(Test-Path ".env")) {
  Write-Host ""
  Write-Host "[주의] .env 파일이 없습니다." -ForegroundColor Yellow
  Write-Host "       아래 예시 파일을 참고해서 `.env`를 생성하세요:" -ForegroundColor Yellow
  Write-Host "       $UserWebPath\ENV.example" -ForegroundColor Yellow
  Write-Host ""
}

# corepack은 Node에 포함되어 있으며, package.json의 packageManager(yarn@4.x)를 맞춰줍니다.
try {
  corepack enable | Out-Null
} catch {
  Write-Host "[WARN] corepack enable 실패. Node 버전/권한을 확인하세요. (가능하면 Node 20 LTS 권장)" -ForegroundColor Yellow
}

Write-Host "yarn version:" -ForegroundColor Cyan
yarn --version

Write-Host "Installing dependencies (yarn --immutable)..." -ForegroundColor Cyan
yarn --immutable

$env:PORT = $Port

Write-Host "Starting dev server on port $Port ..." -ForegroundColor Cyan
yarn dev


