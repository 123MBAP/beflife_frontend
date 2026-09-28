@echo off
echo ================================================
echo    BELIFE E-COMMERCE - FRONTEND ONLY
echo ================================================
echo.
echo Starting Frontend Website (React Development Server)...
echo Backend is disabled for frontend-focused development.
echo.
cd /d "D:\MBI logo\E-commerce"
echo Installing dependencies if needed...
call npm install
echo.
echo Starting React development server...
call npm start
echo.
echo ================================================
echo Frontend Website: http://localhost:3000
echo ================================================
echo.
pause