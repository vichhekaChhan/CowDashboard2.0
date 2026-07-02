#!/bin/bash

# Ensure we are in the script's directory
cd "$(dirname "$0")"

echo "==========================================="
echo "   Starting Cow Dashboard v2.0 Services    "
echo "==========================================="

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running."
    echo "Please start Docker Desktop/Daemon and try again."
    read -p "Press Enter to exit..."
    exit 1
fi

echo "🚀 Launching Docker containers in background..."
docker compose up -d --build

echo "⏳ Waiting for frontend service to start (http://localhost:3000)..."

# Try to detect when port 3000 is open (maximum 30 seconds wait)
for i in {1..30}; do
    if curl -s http://localhost:3000 >/dev/null; then
        echo "✅ Services are online!"
        break
    fi
    sleep 1
done

URL="http://localhost:3000"
echo "🌐 Opening $URL in your browser..."

# Open browser based on OS/environment
if grep -q Microsoft /proc/version; then
    # We are inside WSL, launch default Windows browser
    cmd.exe /c start "$URL" 2>/dev/null || powershell.exe -Command "Start-Process '$URL'" 2>/dev/null
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux desktop
    if command -v xdg-open >/dev/null; then
        xdg-open "$URL"
    else
        echo "Please open $URL manually in your web browser."
    fi
else
    # Windows Git Bash or similar
    start "$URL" 2>/dev/null || open "$URL" 2>/dev/null || echo "Please open $URL in your browser."
fi

echo "==========================================="
echo "Dashboard is running. To stop it, run:"
echo "  docker compose down"
echo "==========================================="
