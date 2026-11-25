param(
  [Parameter(Mandatory)] [ValidatePattern('^[a-zA-Z0-9_.-]+@[a-zA-Z0-9_.-]+$')] [string] $SshHost,
  [string] $OutputDirectory = (Join-Path $env:LOCALAPPDATA 'HZCubing/backups')
)

$ErrorActionPreference = 'Stop'

function Invoke-MongoArchiveSsh([string] $Command, [byte[]] $Data) {
  $options = [Diagnostics.ProcessStartInfo]::new('ssh.exe')
  $options.UseShellExecute = $false
  $options.RedirectStandardInput = $true
  $options.RedirectStandardOutput = $true
  $options.RedirectStandardError = $true
  foreach ($argument in @('-o', 'BatchMode=yes', '-o', 'ConnectTimeout=8', '-o', 'StrictHostKeyChecking=accept-new', $SshHost, $Command)) {
    $options.ArgumentList.Add($argument)
  }
  $process = [Diagnostics.Process]::Start($options)
  $output = [IO.MemoryStream]::new()
  try {
    $errors = $process.StandardError.ReadToEndAsync()
    $copy = $process.StandardOutput.BaseStream.CopyToAsync($output)
    if ($Data) { $process.StandardInput.BaseStream.Write($Data, 0, $Data.Length) }
    $process.StandardInput.Close()
    if (!$process.WaitForExit(45000)) { throw 'MongoDB archive command timed out' }
    $null = $copy.GetAwaiter().GetResult()
    $null = $errors.GetAwaiter().GetResult()
    if ($process.ExitCode -ne 0) { throw "MongoDB archive command returned exit $($process.ExitCode)" }
    ,$output.ToArray()
  } finally {
    $process.Dispose()
    $output.Dispose()
  }
}

[byte[]] $archive = Invoke-MongoArchiveSsh 'docker exec hzcubing-mongo mongodump --db hzcubing --archive --gzip --quiet' $null
if ($archive.Length -lt 32 -or $archive[0] -ne 31 -or $archive[1] -ne 139) { throw 'Missing gzip archive' }
$scope = [Security.Cryptography.DataProtectionScope]::CurrentUser
$null = New-Item -ItemType Directory -Path $OutputDirectory -Force
$archiveFile = Join-Path $OutputDirectory ('hzcubing-' + [DateTimeOffset]::UtcNow.ToString('yyyyMMdd-HHmmss') + '.archive.gz.dpapi')
try {
  [IO.File]::WriteAllBytes($archiveFile, [Security.Cryptography.ProtectedData]::Protect($archive, $null, $scope))
  $restored = [Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($archiveFile), $null, $scope)
  if ([Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($archive)) -ne [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($restored))) {
    throw 'Archive checksum mismatch'
  }
  $restoreCheck = 'docker exec -i hzcubing-mongo mongorestore --archive --gzip --dryRun --nsInclude "hzcubing.*" --quiet; rc=$?; cat >/dev/null; exit "$rc"'
  $null = Invoke-MongoArchiveSsh $restoreCheck $restored
  [pscustomobject]@{ Path = $archiveFile; Bytes = $archive.Length; RestoreDryRun = 'passed' }
} finally {
  [Array]::Clear($archive)
  if ($restored) { [Array]::Clear($restored) }
}
