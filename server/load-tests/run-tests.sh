#!/bin/bash

# Load Testing Runner Script
# This script helps run various load tests with common configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
API_URL="${API_URL:-http://localhost:3000}"
TEST_EMAIL="${TEST_EMAIL:-admin@example.com}"
TEST_PASSWORD="${TEST_PASSWORD:-adminpassword}"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   PushSaaS Load Testing Runner            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if server is running
check_server() {
    echo -e "${YELLOW}Checking if server is running...${NC}"
    if curl -s "${API_URL}/healthz" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Server is running at ${API_URL}${NC}"
        return 0
    else
        echo -e "${RED}✗ Server is not running at ${API_URL}${NC}"
        echo -e "${YELLOW}Please start the server first: npm run dev${NC}"
        return 1
    fi
}

# Function to check if Artillery is installed
check_artillery() {
    if command -v artillery &> /dev/null; then
        echo -e "${GREEN}✓ Artillery is installed${NC}"
        return 0
    else
        echo -e "${RED}✗ Artillery is not installed${NC}"
        echo -e "${YELLOW}Install with: npm install -g artillery${NC}"
        return 1
    fi
}

# Function to check if k6 is installed
check_k6() {
    if command -v k6 &> /dev/null; then
        echo -e "${GREEN}✓ k6 is installed${NC}"
        return 0
    else
        echo -e "${RED}✗ k6 is not installed${NC}"
        echo -e "${YELLOW}Install from: https://k6.io/docs/get-started/installation/${NC}"
        return 1
    fi
}

# Main menu
show_menu() {
    echo ""
    echo -e "${BLUE}Select test type:${NC}"
    echo "  1) Jest Integration Tests (10K users)"
    echo "  2) Jest Integration Tests (All scales)"
    echo "  3) Artillery Load Test (Quick ~2 min)"
    echo "  4) Artillery Load Test (Full ~10 min)"
    echo "  5) k6 Stress Test (Sustained Load Only ~9 min)"
    echo "  6) k6 Stress Test (Full Suite ~65 min)"
    echo "  7) Run All Tests (Sequential)"
    echo "  8) Generate Artillery Report from JSON"
    echo "  9) View k6 HTML Report"
    echo "  0) Exit"
    echo ""
}

# Jest tests
run_jest_quick() {
    echo -e "${BLUE}Running Jest Integration Tests (10K users)...${NC}"
    cd ../
    npm test -- campaign-million-users.test.js --testNamePattern="10000" --testTimeout=600000
    cd load-tests
}

run_jest_full() {
    echo -e "${BLUE}Running Jest Integration Tests (All scales)...${NC}"
    echo -e "${YELLOW}Warning: This will take a long time (1-2 hours)${NC}"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd ../
        npm test -- campaign-million-users.test.js --testTimeout=3600000
        cd load-tests
    fi
}

# Artillery tests
run_artillery_quick() {
    if ! check_artillery || ! check_server; then
        return 1
    fi
    
    echo -e "${BLUE}Running Artillery Quick Load Test...${NC}"
    artillery run artillery-campaign-load-test.yml \
        --target "${API_URL}" \
        --config config.phases[0].duration=30 \
        --config config.phases[1].duration=60 \
        --config config.phases[2].duration=60 \
        --output "results/artillery-quick-$(date +%Y%m%d-%H%M%S).json"
}

run_artillery_full() {
    if ! check_artillery || ! check_server; then
        return 1
    fi
    
    echo -e "${BLUE}Running Artillery Full Load Test...${NC}"
    artillery run artillery-campaign-load-test.yml \
        --target "${API_URL}" \
        --output "results/artillery-full-$(date +%Y%m%d-%H%M%S).json"
}

# k6 tests
run_k6_sustained() {
    if ! check_k6 || ! check_server; then
        return 1
    fi
    
    echo -e "${BLUE}Running k6 Sustained Load Test...${NC}"
    k6 run k6-campaign-stress.js \
        --env API_URL="${API_URL}" \
        --env TEST_EMAIL="${TEST_EMAIL}" \
        --env TEST_PASSWORD="${TEST_PASSWORD}" \
        --out json="results/k6-sustained-$(date +%Y%m%d-%H%M%S).json"
}

run_k6_full() {
    if ! check_k6 || ! check_server; then
        return 1
    fi
    
    echo -e "${BLUE}Running k6 Full Stress Test Suite...${NC}"
    echo -e "${YELLOW}This will take approximately 65 minutes${NC}"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        k6 run k6-campaign-stress.js \
            --env API_URL="${API_URL}" \
            --env TEST_EMAIL="${TEST_EMAIL}" \
            --env TEST_PASSWORD="${TEST_PASSWORD}"
    fi
}

# Run all tests
run_all_tests() {
    echo -e "${BLUE}Running All Tests Sequentially...${NC}"
    echo -e "${YELLOW}This will take several hours!${NC}"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_jest_quick
        echo -e "${GREEN}✓ Jest tests completed${NC}"
        
        run_artillery_quick
        echo -e "${GREEN}✓ Artillery tests completed${NC}"
        
        run_k6_sustained
        echo -e "${GREEN}✓ k6 tests completed${NC}"
        
        echo -e "${GREEN}✓ All tests completed!${NC}"
    fi
}

# Generate Artillery report
generate_artillery_report() {
    if ! check_artillery; then
        return 1
    fi
    
    echo -e "${BLUE}Available Artillery JSON reports:${NC}"
    ls -1 results/artillery-*.json 2>/dev/null || echo "No reports found"
    echo ""
    read -p "Enter JSON filename (or press Enter for latest): " json_file
    
    if [ -z "$json_file" ]; then
        json_file=$(ls -t results/artillery-*.json 2>/dev/null | head -1)
    else
        json_file="results/${json_file}"
    fi
    
    if [ -f "$json_file" ]; then
        output_file="${json_file%.json}.html"
        artillery report "$json_file" --output "$output_file"
        echo -e "${GREEN}✓ Report generated: ${output_file}${NC}"
        
        # Try to open in browser
        if command -v xdg-open &> /dev/null; then
            xdg-open "$output_file"
        elif command -v open &> /dev/null; then
            open "$output_file"
        fi
    else
        echo -e "${RED}✗ File not found: ${json_file}${NC}"
    fi
}

# View k6 report
view_k6_report() {
    if [ -f "load-test-summary.html" ]; then
        echo -e "${GREEN}Opening k6 report...${NC}"
        if command -v xdg-open &> /dev/null; then
            xdg-open "load-test-summary.html"
        elif command -v open &> /dev/null; then
            open "load-test-summary.html"
        else
            echo -e "${YELLOW}Please open load-test-summary.html manually${NC}"
        fi
    else
        echo -e "${RED}✗ No k6 report found. Run k6 tests first.${NC}"
    fi
}

# Create results directory if it doesn't exist
mkdir -p results

# Main loop
while true; do
    show_menu
    read -p "Enter choice [0-9]: " choice
    
    case $choice in
        1) run_jest_quick ;;
        2) run_jest_full ;;
        3) run_artillery_quick ;;
        4) run_artillery_full ;;
        5) run_k6_sustained ;;
        6) run_k6_full ;;
        7) run_all_tests ;;
        8) generate_artillery_report ;;
        9) view_k6_report ;;
        0) 
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done
