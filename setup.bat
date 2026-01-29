@echo off
REM JobFlow AI - Windows Quick Start Script
REM This script automates the setup process

echo ========================================
echo   JobFlow AI - Quick Start Setup
echo ========================================
echo.

REM Check Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.11+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/6] Python detected
python --version

REM Create virtual environment
echo.
echo [2/6] Creating virtual environment...
if exist venv (
    echo Virtual environment already exists, skipping...
) else (
    python -m venv venv
    echo Virtual environment created
)

REM Activate virtual environment
echo.
echo [3/6] Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo.
echo [4/6] Installing dependencies...
pip install -r requirements.txt

REM Setup environment variables
echo.
echo [5/6] Setting up environment variables...
if exist .env (
    echo .env file already exists, skipping...
) else (
    copy .env.example .env
    echo .env file created
    echo.
    echo IMPORTANT: Edit .env file and add your GEMINI_API_KEY
    echo.
    notepad .env
)

REM Initialize database
echo.
echo [6/6] Initializing database...
python -c "from database import init_db; init_db()"
if %errorlevel% equ 0 (
    echo Database initialized successfully
) else (
    echo [ERROR] Database initialization failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To run the application:
echo   1. Activate virtual environment: venv\Scripts\activate
echo   2. Run Streamlit: streamlit run app.py
echo   3. Open browser: http://localhost:8501
echo.
echo Press any key to start the application now...
pause >nul

REM Run the application
echo.
echo Starting JobFlow AI...
streamlit run app.py
