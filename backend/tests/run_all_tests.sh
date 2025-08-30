#!/bin/bash

# Test runner script for all integration tests
# Run with: ./tests/run_all_tests.sh

echo "🧪 Running all integration tests..."
echo "=================================="

# Set test environment
export NODE_ENV=test

# Run tests in order (dependencies first)
echo "1. Health check test..."
bun test tests/integration/health.spec.ts

echo "2. Game routes test..."
bun test tests/integration/game.test.ts

echo "3. User routes test..."
bun test tests/integration/user_routes.test.ts

echo "4. Team routes test..."
bun test tests/integration/team.test.ts

echo "5. Join requests and admin management test..."
bun test tests/integration/join_requests.test.ts

echo "=================================="
echo "✅ All tests completed!"

# Optional: Run all tests together
echo ""
echo "🔄 Running all tests together..."
bun test tests/integration/
