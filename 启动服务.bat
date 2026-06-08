@echo off
chcp 65001 >nul 2>&1
title simiaoChat - Local Server

echo ============================================
echo    simiaoChat - Start Local Server
echo ============================================
echo.

:: cd to script directory
cd /d "%~dp0"

:: -------------------------------------------
:: Find an available port (8080-8090)
:: -------------------------------------------
set PORT=
for /l %%i in (8080,1,8090) do (
    if not defined PORT (
        netstat -ano 2>nul | findstr ":%%i " | findstr "LISTENING" >nul 2>&1
        if errorlevel 1 (
            set PORT=%%i
        )
    )
)
if not defined PORT (
    echo [ERROR] Ports 8080-8090 are all in use. Please free a port and retry.
    pause
    goto :eof
)
echo [OK] Using port: %PORT%

:: -------------------------------------------
:: Detect which server tool is available
:: -------------------------------------------
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

:: Fallback: PowerShell (built into Windows, zero dependency)
echo [OK] Using PowerShell (built-in)
goto :run_ps1

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
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1" -Port %PORT%
goto :eof
