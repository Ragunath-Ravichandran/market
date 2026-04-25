@echo off
title Manual Runner
color 0B

echo.
echo  =====================================================
echo    MANUAL STEP-BY-STEP RUNNER
echo    Use this if start.bat has issues
echo  =====================================================
echo.
echo  This will guide you step by step.
echo  Press any key to continue each step.
echo.
pause

REM Step 1
echo.
echo  STEP 1: Setting up backend...
echo  Opening a new window for backend setup.
echo  When it finishes, come back here and press any key.
echo.
start "Backend Setup" cmd /k "cd /d "%~dp0backend" && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && echo DONE - close this window && pause"
pause

REM Step 2
echo.
echo  STEP 2: Setting up frontend...
echo  Opening a new window for frontend setup.
echo  When npm install finishes, come back here and press any key.
echo.
start "Frontend Setup" cmd /k "cd /d "%~dp0frontend" && npm install && echo DONE - close this window && pause"
pause

REM Step 3
echo.
echo  STEP 3: Starting Backend server...
echo.
start "BACKEND SERVER" cmd /k "cd /d "%~dp0backend" && venv\Scripts\activate && uvicorn main:app --reload --port 8000"
timeout /t 4 /nobreak >nul

REM Step 4
echo  STEP 4: Starting Frontend server...
echo.
start "FRONTEND SERVER" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 4 /nobreak >nul

echo.
echo  Done! Open http://localhost:3000 in your browser.
echo.
start "" "http://localhost:3000"
pause
