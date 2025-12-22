#!/bin/bash

# Simple iOS Build Starter
# This will start the build and show you the URL

echo "🚀 Starting iOS Production Build"
echo "================================"
echo ""
echo "📋 Instructions:"
echo "1. When asked about encryption, type: yes"
echo "2. When asked about Apple login, type: no"
echo "3. Copy the Build URL that appears"
echo ""
echo "Starting build now..."
echo ""

# Start the build
eas build --platform ios --profile production

echo ""
echo "✅ If build started successfully, you should see a Build URL above."
echo "📱 Copy that URL and share it with me!"
echo ""
echo "Monitor builds at: https://expo.dev/accounts/nandan_07/projects/glowcheck01-app/builds"

