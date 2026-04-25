@echo off
setlocal enabledelayedexpansion
title Market Intelligence Suite Launcher
color 0A

echo.
echo  =====================================================
echo    MARKET INTELLIGENCE SUITE - LAUNCHER
echo  =====================================================
echo.

REM ── Root folder = wherever this .bat file is ──────────
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

REM ── Refresh PATH to pick up newly installed software ──
set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files\Python311;C:\Program Files\Python312;C:\Program Files\Python310;C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311;C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python312;C:\Users\%USERNAME%\AppData\Roaming\npm"

echo  Project folder: %ROOT%
echo.

REM ─── STEP 1: Check Python ─────────────────────────────
echo  [1/6] Checking Python...
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Python not found.
    echo.
    echo  Please:
    echo  1. Download from https://www.python.org/downloads/
    echo  2. During install, CHECK "Add Python to PATH"
    echo  3. RESTART your PC completely
    echo  4. Run start.bat again
    echo.
    pause
    start https://www.python.org/downloads/
    exit /b 1
)
python --version
echo  [OK] Python found.
echo.

REM ─── STEP 2: Check Node.js ────────────────────────────
echo  [2/6] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Node.js not found even after install.
    echo.
    echo  This usually means your PC needs a RESTART
    echo  so Windows can detect the new installation.
    echo.
    echo  Please:
    echo  1. Close everything
    echo  2. RESTART your PC
    echo  3. Run start.bat again
    echo.
    pause
    exit /b 1
)
node --version
npm --version
echo  [OK] Node.js found.
echo.

REM ─── STEP 3: Verify project files ─────────────────────
echo  [3/6] Checking project files...

if not exist "%ROOT%\backend\main.py" (
    echo.
    echo  ERROR: backend\main.py is missing.
    echo  Make sure you extracted the full ZIP and are running
    echo  start.bat from the market-intel folder.
    echo.
    pause
    exit /b 1
)
if not exist "%ROOT%\frontend\package.json" (
    echo.
    echo  ERROR: frontend\package.json is missing.
    echo.
    pause
    exit /b 1
)

if not exist "%ROOT%\backend\agents"   mkdir "%ROOT%\backend\agents"
if not exist "%ROOT%\backend\documents" mkdir "%ROOT%\backend\documents"
if not exist "%ROOT%\backend\chroma_db" mkdir "%ROOT%\backend\chroma_db"

echo  [OK] All project files found.
echo.

REM ─── STEP 4: Check API keys ───────────────────────────
echo  [4/6] Checking API keys in backend\.env ...

if not exist "%ROOT%\backend\.env" (
    echo  Creating backend\.env ...
    (
        echo GEMINI_API_KEY=YOUR_GROQ_KEY_HERE
        echo TAVILY_API_KEY=YOUR_TAVILY_KEY_HERE
        echo CHROMA_PERSIST_DIR=./chroma_db
        echo MAX_RESEARCH_ITERATIONS=3
        echo LOG_LEVEL=INFO
    ) > "%ROOT%\backend\.env"
    echo.
    echo  Notepad will open. Paste your API keys, save, close,
    echo  then run start.bat again.
    echo.
    pause
    notepad "%ROOT%\backend\.env"
    exit /b 0
)

findstr /c:"YOUR_GROQ_KEY_HERE" "%ROOT%\backend\.env" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo  ERROR: You have not added your Gemini API key yet.
    echo  Opening backend\.env in Notepad...
    echo  Replace YOUR_GROQ_KEY_HERE with your real key, save, run again.
    echo.
    pause
    notepad "%ROOT%\backend\.env"
    exit /b 1
)

echo  [OK] API keys configured.
echo.

REM ─── STEP 5: Python virtual environment ───────────────
echo  [5/6] Setting up Python backend...

if not exist "%ROOT%\backend\venv\Scripts\activate.bat" (
    echo  Creating virtual environment...
    cd /d "%ROOT%\backend"
    python -m venv venv
    if %errorlevel% neq 0 (
        echo.
        echo  ERROR: Could not create Python virtual environment.
        echo.
        pause
        exit /b 1
    )

    echo.
    echo  Installing Python packages...
    echo  This takes 3-5 minutes on first run. Please wait.
    echo.
    call "%ROOT%\backend\venv\Scripts\activate.bat"
    python -m pip install --upgrade pip --quiet
    pip install -r "%ROOT%\backend\requirements.txt"
    if %errorlevel% neq 0 (
        echo.
        echo  ERROR: pip install failed.
        echo  Please take a screenshot of the error above.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo  [OK] Backend packages installed.
) else (
    echo  [OK] Backend already installed - skipping.
)
echo.

REM ─── STEP 6: Frontend packages ────────────────────────
echo  [6/6] Setting up React frontend...

if not exist "%ROOT%\frontend\node_modules" (
    echo  Installing frontend packages...
    echo  This takes 1-2 minutes on first run. Please wait.
    echo.
    cd /d "%ROOT%\frontend"
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo  ERROR: npm install failed.
        echo  Please take a screenshot of the error above.
        echo.
        pause
        exit /b 1
    )
    echo  [OK] Frontend packages installed.
) else (
    echo  [OK] Frontend already installed - skipping.
)
echo.

REM ─── LAUNCH ───────────────────────────────────────────
echo  =====================================================
echo   All ready! Launching servers...
echo  =====================================================
echo.

echo  Starting Backend (http://localhost:8000)...
start "BACKEND - DO NOT CLOSE" cmd /k "cd /d "%ROOT%\backend" && call venv\Scripts\activate.bat && echo. && echo  Backend running on http://localhost:8000 && echo  Press Ctrl+C to stop. && echo. && uvicorn main:app --reload --port 8000"

echo  Waiting 5 seconds for backend to boot...
timeout /t 5 /nobreak >nul

echo  Starting Frontend (http://localhost:3000)...
start "FRONTEND - DO NOT CLOSE" cmd /k "cd /d "%ROOT%\frontend" && echo. && echo  Frontend running on http://localhost:3000 && echo  Press Ctrl+C to stop. && echo. && npm run dev"

echo  Waiting 5 seconds for frontend to boot...
timeout /t 5 /nobreak >nul

echo.
echo  =====================================================
echo.
echo   App is running!
echo.
echo   Open your browser and go to:
echo   >>> http://localhost:3000 <<<
echo.
echo   Keep the BACKEND and FRONTEND windows open.
echo   Close them to stop the app.
echo.
echo  =====================================================
echo.

start "" "http://localhost:3000"

echo  You can close this launcher window now.
echo.
pause
