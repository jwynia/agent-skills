#!/bin/bash
# Setup Python virtual environment for TTS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Setting up Python virtual environment for TTS..."

# Check Python version
PYTHON_CMD=""
if command -v python3.12 &> /dev/null; then
    PYTHON_CMD="python3.12"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    echo "Error: Python 3 not found"
    exit 1
fi

echo "Using Python: $($PYTHON_CMD --version)"

# Create venv
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv .venv
fi

# Activate and install
echo "Installing dependencies..."
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "Setup complete!"
echo ""
echo "To activate the environment:"
echo "  source $SCRIPT_DIR/.venv/bin/activate"
echo ""
echo "To run TTS:"
echo "  python ../scripts/narrate-scenes.py ./output/scenes/"
