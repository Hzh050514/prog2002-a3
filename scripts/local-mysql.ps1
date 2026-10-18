<#
.SYNOPSIS
    Start / stop / check the local MySQL instance used by this project.

.DESCRIPTION
    The project runs against a dedicated MySQL instance on port 3307 so it never
    interferes with any other MySQL installation on the machine (for example the
    "MySQL80" Windows service on port 3306).

    Data lives on an ASCII-only path (C:\Users\Public\a3-mysql) because mysqld
    cannot parse non-ASCII paths such as C:\Users\<Chinese name>\...

    Usage (from the project root):
        powershell -ExecutionPolicy Bypass -File scripts\local-mysql.ps1 start
        powershell -ExecutionPolicy Bypass -File scripts\local-mysql.ps1 stop
        powershell -ExecutionPolicy Bypass -File scripts\local-mysql.ps1 status
        powershell -ExecutionPolicy Bypass -File scripts\local-mysql.ps1 init     # first time only
#>
param(
    [Parameter(Position = 0)]
    [ValidateSet('start', 'stop', 'status', 'init')]
    [string]$Action = 'status'
)

$MySqlBin  = 'C:\Program Files\MySQL\MySQL Server 8.0\bin'
$MysqldExe = Join-Path $MySqlBin 'mysqld.exe'
$Home_     = 'C:\Users\Public\a3-mysql'
$IniFile   = Join-Path $Home_ 'my.ini'
$DataDir   = Join-Path $Home_ 'data'

function Get-LocalInstance {
    Get-CimInstance Win32_Process -Filter "Name='mysqld.exe'" |
        Where-Object { $_.CommandLine -match 'a3-mysql' }
}

switch ($Action) {
    'status' {
        $proc = Get-LocalInstance
        $port = Get-NetTCPConnection -LocalPort 3307 -State Listen -ErrorAction SilentlyContinue
        if ($proc -and $port) {
            Write-Host "RUNNING  (127.0.0.1:3307, pid $($proc.ProcessId -join ', '))" -ForegroundColor Green
        } else {
            Write-Host 'STOPPED' -ForegroundColor Yellow
        }
    }

    'start' {
        if (Get-LocalInstance) { Write-Host 'Already running.' -ForegroundColor Yellow; break }
        if (-not (Test-Path $DataDir)) {
            Write-Host 'Data directory missing - run: .\scripts\local-mysql.ps1 init' -ForegroundColor Red
            break
        }
        Start-Process -FilePath $MysqldExe -ArgumentList "--defaults-file=$IniFile" | Out-Null
        for ($i = 0; $i -lt 30; $i++) {
            Start-Sleep -Seconds 1
            if (Get-NetTCPConnection -LocalPort 3307 -State Listen -ErrorAction SilentlyContinue) { break }
        }
        if (Get-NetTCPConnection -LocalPort 3307 -State Listen -ErrorAction SilentlyContinue) {
            Write-Host 'STARTED on 127.0.0.1:3307' -ForegroundColor Green
        } else {
            Write-Host 'Failed to start - see the error log:' -ForegroundColor Red
            Get-Content (Join-Path $Home_ 'mysqld.err') -Encoding UTF8 -Tail 15
        }
    }

    'stop' {
        $proc = Get-LocalInstance
        if (-not $proc) { Write-Host 'Not running.' -ForegroundColor Yellow; break }
        $proc | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
        Write-Host 'STOPPED' -ForegroundColor Green
    }

    'init' {
        # Creates a fresh data directory with an empty root password, then sets
        # the password found in api/.env, then imports the schema + sample data.
        if (Test-Path $DataDir) { Remove-Item $DataDir -Recurse -Force }
        New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
        New-Item -ItemType Directory -Force -Path (Join-Path $Home_ 'tmp') | Out-Null

        Start-Process -FilePath $MysqldExe -ArgumentList "--defaults-file=$IniFile", '--initialize-insecure' -Wait | Out-Null
        Start-Process -FilePath $MysqldExe -ArgumentList "--defaults-file=$IniFile" | Out-Null
        Start-Sleep -Seconds 12

        $mysql = Join-Path $MySqlBin 'mysql.exe'
        $pw = (Select-String -Path 'api\.env' -Pattern '^DB_PASSWORD=(.*)$').Matches[0].Groups[1].Value.Trim()
        $common = @('-u', 'root', '--host=127.0.0.1', '--port=3307', '--protocol=TCP')

        & $mysql $common -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '$pw'; CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED WITH mysql_native_password BY '$pw'; GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION; FLUSH PRIVILEGES;"

        # Import on an ASCII path: mysqld/mysql cannot read non-ASCII paths.
        Copy-Item 'api\db\charity_events.sql' (Join-Path $Home_ 'db.sql') -Force
        & $mysql @('-u', 'root', "-p$pw", '--host=127.0.0.1', '--port=3307', '--protocol=TCP', '--default-character-set=utf8mb4') -e "source C:/Users/Public/a3-mysql/db.sql"

        Write-Host 'Database initialised and imported.' -ForegroundColor Green
    }
}
