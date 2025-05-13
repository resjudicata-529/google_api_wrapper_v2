#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found!"
  echo "Please copy .env.example to .env and fill in your configuration."
  exit 1
fi

# Start the server
if [ "$NODE_ENV" = "production" ]; then
  npm start
else
  npm run dev
fi 