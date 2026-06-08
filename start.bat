@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title simiaoChat

echo ============================================
echo    simiaoChat - Local Server
echo ============================================
echo.

:: cd to script directory
cd /d "%~dp0"

:: -------------------------------------------
:: Find an available port (8080-8090)
:: -------------------------------------------
set "PORT="
for /l %%i in (8080,1,8090) do (
    if not defined PORT (
        netstat -ano 2>nul | findstr ":%%i " | findstr "LISTENING" >nul 2>&1
        if errorlevel 1 (
            set "PORT=%%i"
        )
    )
)
if not defined PORT (
    echo [ERROR] Ports 8080-8090 are all in use.
    echo         Please close the occupying program and retry.
    pause
    goto :eof
)
echo [OK] Using port: %PORT%

:: -------------------------------------------
:: Detect server tool (PowerShell first - always available on Windows)
:: -------------------------------------------
where powershell >nul 2>&1 && (
    echo [OK] PowerShell detected
    goto :run_ps1
)
where python >nul 2>&1 && (
    echo [OK] Python detected
    goto :run_python
)
where python3 >nul 2>&1 && (
    echo [OK] Python3 detected
    goto :run_python3
)
where py >nul 2>&1 && (
    echo [OK] py detected
    goto :run_py
)
where npx >nul 2>&1 && (
    echo [OK] npx detected
    goto :run_npx
)

echo.
echo [ERROR] No available server tool found.
echo         This script requires one of:
echo         - PowerShell (built into Windows)
echo         - Python
echo         - Node.js / npx
echo.
pause
goto :eof

:: -------------------------------------------
:: Server start sections
:: -------------------------------------------

:run_python
echo.
echo     Open in browser: http://localhost:%PORT%
echo     Press Ctrl+C to stop
echo ============================================
echo.
start "" cmd /c "ping -n 2 127.0.0.1 >nul & start http://localhost:%PORT%"
python -m http.server %PORT%
goto :eof

:run_python3
echo.
echo     Open in browser: http://localhost:%PORT%
echo     Press Ctrl+C to stop
echo ============================================
echo.
start "" cmd /c "ping -n 2 127.0.0.1 >nul & start http://localhost:%PORT%"
python3 -m http.server %PORT%
goto :eof

:run_py
echo.
echo     Open in browser: http://localhost:%PORT%
echo     Press Ctrl+C to stop
echo ============================================
echo.
start "" cmd /c "ping -n 2 127.0.0.1 >nul & start http://localhost:%PORT%"
py -m http.server %PORT%
goto :eof

:run_npx
echo.
echo     Open in browser: http://localhost:%PORT%
echo     Press Ctrl+C to stop
echo ============================================
echo.
start "" cmd /c "ping -n 3 127.0.0.1 >nul & start http://localhost:%PORT%"
npx -y serve -l %PORT%
goto :eof

:run_ps1
echo.
echo     Open in browser: http://localhost:%PORT%
echo     Press Ctrl+C to stop
echo ============================================
echo.
start "" cmd /c "ping -n 2 127.0.0.1 >nul & start http://localhost:%PORT%"
:: Try external .ps1 file first, fall back to inline PowerShell server
if exist "%~dp0server.ps1" (
    powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0server.ps1" -Port %PORT%
) else (
    echo [WARN] server.ps1 not found, using inline server...
    powershell -ExecutionPolicy Bypass -NoProfile -Command "$p=%PORT%;$r='%~dp0'.TrimEnd('\');$m=@{'.html'='text/html';'.css'='text/css';'.js'='application/javascript';'.json'='application/json';'.png'='image/png';'.jpg'='image/jpeg';'.jpeg'='image/jpeg';'.gif'='image/gif';'.svg'='image/svg+xml';'.ico'='image/x-icon';'.webp'='image/webp';'.woff'='font/woff';'.woff2'='font/woff2';'.ttf'='font/ttf';'.map'='application/json'};$l=New-Object System.Net.HttpListener;$l.Prefixes.Add(\"http://localhost:$p/\");try{$l.Start();Write-Host \"Server running at http://localhost:$p/\" -F Green;while($l.IsListening){$c=$l.GetContext();$u=$c.Request.Url.AbsolutePath;if($u -eq '/'){$u='/index.html'};$d=[System.Uri]::UnescapeDataString($u);$f=Join-Path $r $d.TrimStart('/');if(Test-Path $f -PathType Leaf){$e=[IO.Path]::GetExtension($f).ToLower();$c.Response.ContentType=$m[$e];$b=[IO.File]::ReadAllBytes($f);$c.Response.ContentLength64=$b.Length;$c.Response.OutputStream.Write($b,0,$b.Length);$c.Response.Close();Write-Host \"  200 $u\" -F Cyan}else{$c.Response.StatusCode=404;$c.Response.Close();Write-Host \"  404 $u\" -F Red}}}catch{}finally{$l.Stop()}"
)
goto :eof
