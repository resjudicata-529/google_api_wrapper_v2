#!/bin/bash

# Run tests with coverage
jest --coverage

# Check test coverage thresholds
if [ $? -eq 0 ]; then
  echo "Tests passed successfully!"
else
  echo "Tests failed. Please check the output above."
  exit 1
fi 