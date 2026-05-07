#!/bin/bash
#
# Deployment verification script
# Checks that a website loads without 404/500 errors and contains expected content
#
# Usage:
#   ./scripts/verify-deployment.sh https://trial-finder-demo.netlify.app
#

set -e

URL="${1:-https://trial-finder-demo.netlify.app}"
TIMEOUT=30

echo "🔍 Verifying deployment: $URL"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track errors
ERRORS=0

# Function to check HTTP status
check_status() {
    local url=$1
    local expected=$2
    local description=$3
    
    echo -n "Checking $description... "
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "$expected" ]; then
        echo -e "${GREEN}✓ $HTTP_CODE${NC}"
        return 0
    else
        echo -e "${RED}✗ Got $HTTP_CODE (expected $expected)${NC}"
        ((ERRORS++))
        return 1
    fi
}

# Function to check content exists
check_content() {
    local url=$1
    local pattern=$2
    local description=$3
    
    echo -n "Checking $description... "
    
    CONTENT=$(curl -s --max-time $TIMEOUT "$url" 2>/dev/null || echo "")
    
    if echo "$CONTENT" | grep -qi "$pattern"; then
        echo -e "${GREEN}✓ Found${NC}"
        return 0
    else
        echo -e "${RED}✗ Not found${NC}"
        ((ERRORS++))
        return 1
    fi
}

# Function to check content does NOT exist (for errors)
check_no_content() {
    local url=$1
    local pattern=$2
    local description=$3
    
    echo -n "Checking $description... "
    
    CONTENT=$(curl -s --max-time $TIMEOUT "$url" 2>/dev/null || echo "")
    
    if echo "$CONTENT" | grep -qi "$pattern"; then
        echo -e "${RED}✗ Found (should not exist)${NC}"
        ((ERRORS++))
        return 1
    else
        echo -e "${GREEN}✓ Not found (good)${NC}"
        return 0
    fi
}

echo ""
echo "HTTP Status Checks:"
echo "-------------------"
check_status "$URL" "200" "Home page loads (200)"
check_status "$URL/about" "200" "About page (200)"
check_status "$URL/match" "200" "Match page (200)"
check_status "$URL/api/search" "200" "Search API (200)"
check_status "$URL/nonexistent-page-test" "404" "404 handling"

echo ""
echo "Content Checks (should exist):"
echo "------------------------------"
check_content "$URL" "Trial Finder" "Page title"
check_content "$URL" "cancer clinical trials" "Description text"
check_content "$URL" "Browse" "Navigation link"
check_content "$URL" "Find a match" "Match link"
check_content "$URL" "About" "About link"

echo ""
echo "Error Checks (should NOT exist):"
echo "--------------------------------"
check_no_content "$URL" "__next_error__" "Next.js error boundary"
check_no_content "$URL" "500 Internal Server Error" "500 error"
check_no_content "$URL" "Database connection" "DB error"
check_no_content "$URL" "DATABASE_URL" "Env var leak"

echo ""
echo "API Response Checks:"
echo "--------------------"

# Check API returns valid JSON
echo -n "Search API returns JSON... "
API_RESPONSE=$(curl -s --max-time $TIMEOUT "$URL/api/search?q=test" 2>/dev/null || echo "")
if echo "$API_RESPONSE" | jq -e . >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Valid JSON${NC}"
else
    echo -e "${YELLOW}⚠ Not JSON (might be error page)${NC}"
fi

echo ""
echo "=================================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS check(s) failed${NC}"
    exit 1
fi
