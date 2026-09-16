#!/bin/bash

# Verification script for Chrome Extension build

echo "🔍 Verifying Chrome Extension Build..."
echo ""

cd "$(dirname "$0")/out" || exit 1

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

check() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        ((pass_count++))
    else
        echo -e "${RED}❌ $1${NC}"
        ((fail_count++))
    fi
}

# Test 1: Manifest exists
test -f manifest.json
check "manifest.json exists" $?

# Test 2: Index.html exists
test -f index.html
check "index.html exists" $?

# Test 3: next/ folder exists
test -d next
check "next/ folder exists" $?

# Test 4: Chunks exist
chunk_count=$(ls next/static/chunks/*.js 2>/dev/null | wc -l)
[ "$chunk_count" -gt 5 ]
check "JavaScript chunks exist ($chunk_count files)" $?

# Test 5: Inline scripts exist
inline_count=$(ls inline-script-*.js 2>/dev/null | wc -l)
[ "$inline_count" -gt 5 ]
check "Inline scripts extracted ($inline_count files)" $?

# Test 6: No absolute paths in HTML
! grep -q 'src="/next/' index.html
check "No absolute /next/ paths in HTML" $?

! grep -q 'src="/inline-script' index.html
check "No absolute /inline-script paths in HTML" $?

# Test 7: Relative paths in HTML
grep -q 'src="next/' index.html
check "Relative next/ paths in HTML" $?

grep -q 'src="inline-script-' index.html
check "Relative inline-script paths in HTML" $?

# Test 8: Flight data has correct paths
if ls inline-script-*.js &>/dev/null; then
    grep -q '"next/static/chunks/' inline-script-*.js
    check "Flight data has correct paths" $?
else
    ((fail_count++))
    echo -e "${RED}❌ No inline scripts to check${NC}"
fi

# Test 9: CSP in manifest
grep -q "wasm-unsafe-eval" manifest.json
check "CSP includes wasm-unsafe-eval" $?

grep -q "unsafe-inline" manifest.json
check "CSP includes unsafe-inline for styles" $?

# Test 10: Debug page exists
test -f debug.html
check "debug.html diagnostic page exists" $?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Results: ${GREEN}$pass_count passed${NC}, ${RED}$fail_count failed${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}🎉 Build verification PASSED!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open chrome://extensions in Chrome"
    echo "2. Enable Developer mode"
    echo "3. Click 'Load unpacked'"
    echo "4. Select: $(pwd)"
    echo "5. Open a new tab"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Build verification FAILED${NC}"
    echo ""
    echo "Please run: npm run build:extension"
    echo ""
    exit 1
fi
