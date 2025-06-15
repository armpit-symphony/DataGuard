@echo off
echo DataGuard Pro - Desktop Application Setup Verification
echo =====================================================
echo.

REM Check if we're in the right directory
echo Checking current directory...
if not exist "package.json" (
    echo Error: package.json not found. Please run this script from the frontend directory
    echo    cd frontend
    pause
    exit /b 1
)
echo ✓ In correct directory: %CD%
echo.

REM Check if dependencies are installed
echo Checking dependencies...
if not exist "node_modules" (
    echo Error: node_modules not found. Installing dependencies...
    yarn install
)
echo ✓ Dependencies should be installed
echo.

REM Check if build directory exists
echo Checking build directory...
if not exist "build" (
    echo Build directory not found. You may need to run: yarn build
) else (
    echo ✓ Build directory exists
)
echo.

echo Setup verification complete!
echo.
echo Available commands:
echo   yarn electron       - Run desktop app (production mode)
echo   yarn electron-dev   - Run desktop app (development mode)  
echo   yarn start          - Run web version in browser
echo   yarn build          - Build for production
echo   yarn dist           - Package for distribution
echo.
echo If you're still getting errors, make sure to:
echo 1. Run commands from the frontend directory
echo 2. Ensure backend server is running
echo 3. Use 'yarn electron' instead of 'electron .'
echo.
pause