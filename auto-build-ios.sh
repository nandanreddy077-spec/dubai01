#!/bin/bash

# Automated iOS Build Script
# Assumes standard/exempt encryption (Yes)

echo "🚀 Starting iOS Production Build"
echo "================================"
echo ""
echo "📱 Platform: iOS"
echo "📦 Profile: Production"
echo "🔐 Encryption: Yes (standard/exempt)"
echo ""
echo "Starting build..."
echo ""

# Try to start build with automated response
# Using printf to send "yes" to the prompt
printf "yes\n" | eas build --platform ios --profile production 2>&1 | tee /tmp/ios_build_output.txt

# Check if build started successfully
if grep -q "https://expo.dev" /tmp/ios_build_output.txt; then
    BUILD_URL=$(grep -oP 'https://expo.dev/[^\s]+' /tmp/ios_build_output.txt | head -1)
    echo ""
    echo "✅ Build started successfully!"
    echo ""
    echo "📱 Build URL: $BUILD_URL"
    echo ""
    echo "⏱️  Build time: 15-25 minutes"
    echo "📧 You'll receive an email when complete"
    echo ""
    echo "Monitor at: https://expo.dev/accounts/nandan_07/projects/glowcheck01-app/builds"
else
    echo ""
    echo "⚠️  Could not automatically start build"
    echo "Please run manually: eas build --platform ios --profile production"
    echo "When prompted, answer 'yes' to encryption compliance"
fi







