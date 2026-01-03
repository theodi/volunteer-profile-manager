#!/bin/bash
# Generate SHACL shapes from OWL ontology using owl2shacl rules
# 
# This script uses various approaches to apply the owl2shacl-closed
# rules from Sparna to generate SHACL shapes from the volunteer profile ontology.
#
# Approaches (in order of preference):
#   1. Node.js implementation (always available, no extra dependencies)
#   2. Apache Jena's shaclinfer (requires Jena installation)
#   3. Python with rdflib/pyshacl (requires Python packages)
#
# Usage: ./scripts/generate-shapes.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Paths
ONTOLOGY_FILE="$PROJECT_ROOT/src/ontology/volunteer-profile.ttl"
OUTPUT_FILE="$PROJECT_ROOT/src/shapes/volunteer-profile-shapes-generated.ttl"
RULES_URL="https://raw.githubusercontent.com/sparna-git/owl2shacl/refs/heads/main/owl2sh-closed.ttl"
RULES_FILE="$SCRIPT_DIR/.owl2sh-closed.ttl"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}OWL to SHACL Shape Generator${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check for Jena installation
check_jena() {
    if command -v shaclinfer &> /dev/null; then
        return 0
    elif [ -n "$JENA_HOME" ] && [ -f "$JENA_HOME/bin/shaclinfer" ]; then
        export PATH="$JENA_HOME/bin:$PATH"
        return 0
    else
        return 1
    fi
}

# Download owl2shacl rules if not present
download_rules() {
    if [ ! -f "$RULES_FILE" ]; then
        echo -e "${YELLOW}Downloading owl2shacl rules...${NC}"
        curl -sL "$RULES_URL" -o "$RULES_FILE"
        echo -e "${GREEN}✓ Rules downloaded${NC}"
    else
        echo -e "${GREEN}✓ Using cached owl2shacl rules${NC}"
    fi
}

# Main function
main() {
    # Check if ontology file exists
    if [ ! -f "$ONTOLOGY_FILE" ]; then
        echo -e "${RED}Error: Ontology file not found at $ONTOLOGY_FILE${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Found ontology: $ONTOLOGY_FILE${NC}"

    # Prefer Node.js implementation (always available in this project)
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✓ Using Node.js implementation${NC}"
        node "$SCRIPT_DIR/generate-shapes.js"
        exit 0
    fi

    # Download rules for Jena/Python approaches
    download_rules

    # Try Apache Jena
    if check_jena; then
        echo -e "${GREEN}✓ Apache Jena found${NC}"
        echo ""
        echo -e "${YELLOW}Generating SHACL shapes...${NC}"
        
        # Use Jena's shaclinfer to apply the rules
        shaclinfer \
            --shapes "$RULES_FILE" \
            --data "$ONTOLOGY_FILE" \
            --output "$OUTPUT_FILE" \
            2>&1 || {
                echo -e "${RED}Error: SHACL inference failed${NC}"
                exit 1
            }
        
        echo ""
        echo -e "${GREEN}✓ SHACL shapes generated successfully!${NC}"
        echo -e "Output: ${OUTPUT_FILE}"
        exit 0
    fi
        
    # Try Python-based approach
    if command -v python3 &> /dev/null; then
        echo "Using Python-based RDFLib approach..."
        python3 "$SCRIPT_DIR/generate-shapes.py"
        exit 0
    fi

    echo -e "${RED}Error: No suitable runtime found (Node.js, Jena, or Python).${NC}"
    echo ""
    echo "Please install one of the following:"
    echo ""
    echo "Option 1: Node.js (recommended)"
    echo "  https://nodejs.org/"
    echo ""
    echo "Option 2: Apache Jena"
    echo "  macOS:   brew install jena"
    echo "  Ubuntu:  apt-get install jena"
    echo "  Or download from: https://jena.apache.org/download/"
    echo ""
    echo "Option 3: Python 3 with rdflib"
    echo "  pip3 install rdflib pyshacl requests"
    exit 1
}

main "$@"
