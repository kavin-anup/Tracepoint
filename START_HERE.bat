@echo off
echo ========================================
echo Starting Bug Tracker Server
echo ========================================
echo.
cd /d "%~dp0"
echo Current Directory: %CD%
echo.
echo Checking environment variables...
if exist .env.local (
    echo Found .env.local
) else (
    echo ERROR: .env.local not found!
    pause
    exit /b 1
)
echo.
echo Starting server...
echo Please wait for "Ready in X.Xs" message
echo Then open browser to: http://localhost:3000
echo.
call npm run dev
pause
