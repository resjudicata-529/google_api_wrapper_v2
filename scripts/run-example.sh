#!/bin/bash

# Check if example name is provided
if [ -z "$1" ]; then
  echo "Please provide an example name:"
  echo "  list_emails   - List Gmail messages"
  echo "  create_event  - Create a calendar event"
  exit 1
fi

# Check if .env file exists in examples directory
if [ ! -f examples/.env ]; then
  echo "Creating examples/.env file..."
  echo "API_BASE_URL=http://localhost:3000" > examples/.env
  echo "TEST_USER_ID=test_user" >> examples/.env
  echo "Created examples/.env with default values"
fi

# Run the example
case "$1" in
  "list_emails")
    npx ts-node examples/list_emails.ts
    ;;
  "create_event")
    npx ts-node examples/create_event.ts
    ;;
  *)
    echo "Unknown example: $1"
    echo "Available examples:"
    echo "  list_emails   - List Gmail messages"
    echo "  create_event  - Create a calendar event"
    exit 1
    ;;
esac 