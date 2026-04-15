param(
  [string]$DockerUser,
  [string]$DockerToken,
  [string]$Image,
  [string]$Port,
  [string]$Container
)
$ErrorActionPreference = 'Stop'

$dockerConfig = Join-Path $env:TEMP 'docker-gha-auth'
$configFile = Join-Path $dockerConfig 'config.json'
$authBytes = [System.Text.Encoding]::UTF8.GetBytes("${DockerUser}:${DockerToken}")
$authValue = [System.Convert]::ToBase64String($authBytes)

if (Test-Path $dockerConfig) {
  Remove-Item -Recurse -Force $dockerConfig
}
New-Item -ItemType Directory -Path $dockerConfig | Out-Null
$env:DOCKER_CONFIG = $dockerConfig

Set-Content -Path $configFile -Value "{`"auths`":{`"https://index.docker.io/v1/`":{`"auth`":`"$authValue`"}}}" -Encoding ascii

docker pull $Image
if ($LASTEXITCODE -ne 0) { throw 'docker pull fehlgeschlagen' }

$exists = docker ps -a --format '{{.Names}}' | Select-String -Pattern "^$Container$" -Quiet
if ($exists) {
  docker rm -f $Container
  if ($LASTEXITCODE -ne 0) { throw 'docker rm fehlgeschlagen' }
}

docker run -d --restart unless-stopped --name $Container -p $Port $Image
if ($LASTEXITCODE -ne 0) { throw 'docker run fehlgeschlagen' }

docker ps -a
docker logs $Container

Remove-Item -Recurse -Force $dockerConfig