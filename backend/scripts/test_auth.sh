#!/bin/bash

# Authentication System Test Script
# Tests all authentication endpoints

API_URL="http://localhost:3001"
COOKIE_FILE="/tmp/gategroup_cookies.txt"

echo "======================================"
echo "GateGroup Authentication Test Script"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
response=$(curl -s -w "\n%{http_code}" ${API_URL}/api/health)
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Health check failed (Status: $status)${NC}"
fi
echo ""

# Test 2: Login as Supervisor
echo -e "${YELLOW}Test 2: Login as Supervisor${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST ${API_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"supervisor","password":"password123"}' \
  -c ${COOKIE_FILE})

status=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ Supervisor login successful${NC}"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Supervisor login failed (Status: $status)${NC}"
    echo "$body"
fi
echo ""

# Test 3: Get Current User
echo -e "${YELLOW}Test 3: Get Current User Info${NC}"
response=$(curl -s -w "\n%{http_code}" ${API_URL}/api/auth/me \
  -b ${COOKIE_FILE})

status=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ User info retrieved${NC}"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Failed to get user info (Status: $status)${NC}"
fi
echo ""

# Test 4: Access Supervisor Dashboard
echo -e "${YELLOW}Test 4: Access Supervisor Dashboard${NC}"
response=$(curl -s -w "\n%{http_code}" ${API_URL}/api/metrics/dashboard \
  -b ${COOKIE_FILE})

status=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ Dashboard data retrieved${NC}"
    echo "$body" | python3 -m json.tool 2>/dev/null | head -n 30 || echo "$body"
    echo "... (truncated)"
else
    echo -e "${RED}✗ Failed to get dashboard (Status: $status)${NC}"
fi
echo ""

# Test 5: Logout
echo -e "${YELLOW}Test 5: Logout${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST ${API_URL}/api/auth/logout \
  -b ${COOKIE_FILE})

status=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ Logout successful${NC}"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Logout failed (Status: $status)${NC}"
fi
echo ""

# Test 6: Try to access protected endpoint without auth
echo -e "${YELLOW}Test 6: Access Protected Endpoint (No Auth)${NC}"
response=$(curl -s -w "\n%{http_code}" ${API_URL}/api/auth/me)

status=$(echo "$response" | tail -n1)

if [ "$status" = "401" ]; then
    echo -e "${GREEN}✓ Correctly blocked unauthenticated request${NC}"
else
    echo -e "${RED}✗ Should have returned 401 (Got: $status)${NC}"
fi
echo ""

# Test 7: Login as Employee
echo -e "${YELLOW}Test 7: Login as Employee${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST ${API_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"employee","password":"password123"}' \
  -c ${COOKIE_FILE})

status=$(echo "$response" | tail -n1)

if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ Employee login successful${NC}"
else
    echo -e "${RED}✗ Employee login failed (Status: $status)${NC}"
fi
echo ""

# Test 8: Try to access supervisor endpoint as employee
echo -e "${YELLOW}Test 8: Employee Access to Supervisor Dashboard${NC}"
response=$(curl -s -w "\n%{http_code}" ${API_URL}/api/metrics/dashboard \
  -b ${COOKIE_FILE})

status=$(echo "$response" | tail -n1)

if [ "$status" = "403" ]; then
    echo -e "${GREEN}✓ Correctly blocked employee from supervisor dashboard${NC}"
else
    echo -e "${RED}✗ Should have returned 403 (Got: $status)${NC}"
fi
echo ""

# Cleanup
rm -f ${COOKIE_FILE}

echo "======================================"
echo "Test Suite Complete!"
echo "======================================"
