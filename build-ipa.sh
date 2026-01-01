#!/bin/bash

# iOS IPA Build Script
# This script will build your iOS app and provide the download link

echo "🚀 Starting iOS Production Build"
echo "================================"
echo ""

# Check if encryption answer is provided
if [ -z "$1" ]; then
    echo "❌ Missing encryption compliance answer"
    echo ""
    echo "Usage: ./build-ipa.sh [yes|no]"
    echo ""
    echo "Most apps use standard/exempt encryption (HTTPS, standard libraries)."
    echo "Answer 'yes' unless your app uses custom encryption."
    echo ""
    exit 1
fi

ENCRYPTION_ANSWER=$1

echo "📱 Platform: iOS"
echo "📦 Profile: Production"
echo "🔐 Encryption: $ENCRYPTION_ANSWER"
echo ""
echo "Starting build..."
echo ""

# Start the build
# Note: We'll need to handle the interactive prompt for encryption
eas build --platform ios --profile production <<EOF
$ENCRYPTION_ANSWER
EOF

BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Build started successfully!"
    echo ""
    echo "📱 Monitor your build at:"
    echo "https://expo.dev/accounts/nandan_07/projects/glowcheck01-app/builds"
    echo ""
    echo "⏱️  Build time: 15-25 minutes"
    echo "📧 You'll receive an email when complete"
else
    echo ""
    echo "❌ Build failed to start"
    echo "Please check the error messages above"
fi





