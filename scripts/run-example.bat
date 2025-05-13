@echo off

:: Check if example name is provided
if "%1"=="" (
  echo Please provide an example name:
  echo   list_emails   - List Gmail messages
  echo   create_event  - Create a calendar event
  exit /b 1
)

:: Check if .env file exists in examples directory
if not exist examples\.env (
  echo Creating examples\.env file...
  echo API_BASE_URL=http://localhost:3000> examples\.env
  echo TEST_USER_ID=test_user>> examples\.env
  echo Created examples\.env with default values
)

:: Run the example
if "%1"=="list_emails" (
  call npx ts-node examples/list_emails.ts
) else if "%1"=="create_event" (
  call npx ts-node examples/create_event.ts
) else (
  echo Unknown example: %1
  echo Available examples:
  echo   list_emails   - List Gmail messages
  echo   create_event  - Create a calendar event
  exit /b 1
) 