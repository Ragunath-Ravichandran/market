@echo off
REM Market Intelligence Suite - Setup Script (Windows)
REM Run this script to set up the project for local development

setlocal enabledelayedexpansion

echo.
echo 🚀 Market Intelligence Suite - Setup Script
echo ==========================================="
echo.

REM Check for Python
echo 📋 Checking prerequisites...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.9+
    pause
    exit /b 1
)

REM Check for Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16+
    pause
    exit /b 1
)

for /f "tokens=*" %%A in ('python --version 2^>^&1') do set PYTHON_VERSION=%%A
for /f "tokens=*" %%A in ('node --version 2^>^&1') do set NODE_VERSION=%%A

echo ✅ %PYTHON_VERSION%
echo ✅ Node %NODE_VERSION%
echo.

REM Setup Backend
echo 🔧 Setting up Backend...
cd backend

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo ✅ Backend setup complete
echo.

REM Setup Frontend
echo 🎨 Setting up Frontend...
cd ..\frontend

echo Installing Node dependencies...
call npm install

echo ✅ Frontend setup complete
echo.

REM Setup environment file
echo 🔐 Setting up environment variables...
cd ..

if not exist ".env" (
    copy .env.example .env
    echo 📝 Created .env file from .env.example
    echo ⚠️  Please edit .env and add your API keys:
    echo    - GROQ_API_KEY
    echo    - GOOGLE_API_KEY
    echo    - TAVILY_API_KEY
) else (
    echo ✅ .env already exists
)

echo.
echo ==========================================="
echo ✨ Setup complete!
echo ==========================================="
echo.
echo Next steps:
echo 1. Edit .env and add your API keys
echo 2. Run the backend:    cd backend ^& python -m uvicorn main:app --reload
echo 3. Run the frontend:   cd frontend ^& npm run dev
echo 4. Visit:              http://localhost:5173
echo.
echo For more info, see README.md and DEPLOYMENT.md
echo.
pause
