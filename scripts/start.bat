@echo off

:: Check if .env file exists
if not exist .env (
  echo Error: .env file not found!
  echo Please copy .env.example to .env and fill in your configuration.
  exit /b 1
)

:: Start the server
if "%NODE_ENV%"=="production" (
  call npm start
) else (
  call npm run dev
) 