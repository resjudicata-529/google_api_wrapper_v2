@echo off

:: Clean previous build
if exist dist\ rmdir /s /q dist

:: Build TypeScript
call npm run build

:: Copy static files
if not exist dist\public\ mkdir dist\public
xcopy /s /e /y public dist\public\

echo Build completed successfully! 