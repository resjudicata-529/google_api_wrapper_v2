@echo off

:: Run tests with coverage
call npm run test:all

:: Check test coverage thresholds
if %ERRORLEVEL% EQU 0 (
  echo Tests passed successfully!
) else (
  echo Tests failed. Please check the output above.
  exit /b 1
) 