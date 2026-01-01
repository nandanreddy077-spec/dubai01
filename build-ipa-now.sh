#!/bin/bash

# Build iOS IPA with version 1.0.2(2)
echo "🚀 Building iOS IPA - Version 1.0.2 (Build 2)"
echo "=============================================="
echo ""

# Check if logged in
echo "Checking EAS login status..."
eas whoami

if [ $? -ne 0 ]; then
    echo "❌ Not logged in to EAS. Please run: eas login"
    exit 1
fi

echo ""
echo "Starting build..."
echo "When prompted:"
echo "  1. 'Do you want to log in to your Apple account?' → Answer: no"
echo "  2. 'iOS app only uses standard/exempt encryption?' → Answer: yes"
echo ""

# Start the build
eas build --platform ios --profile production

echo ""
echo "✅ Build initiated!"
echo "📱 Monitor at: https://expo.dev/accounts/nandan_07/projects/glowcheck01-app/builds"

