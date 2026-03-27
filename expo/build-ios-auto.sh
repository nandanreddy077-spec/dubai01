#!/bin/bash

# Automated iOS Build Script
# This script will start the build and capture the build URL

set -e

echo "🚀 Starting iOS Production Build..."
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Start the build and capture all output
echo "⏳ Initiating build (this may take a moment to start)..."
echo ""

# Run the build command and capture output
BUILD_OUTPUT=$(eas build --platform ios --profile production <<EOF
yes
yes
EOF
2>&1) || BUILD_EXIT_CODE=$?

# Display the output
echo "$BUILD_OUTPUT"
echo ""

# Try to extract build URL from various possible formats
BUILD_URL=$(echo "$BUILD_OUTPUT" | grep -oE 'https://expo\.dev/[^\s\)]+' | head -1)

# If not found, try alternative patterns
if [ -z "$BUILD_URL" ]; then
    BUILD_URL=$(echo "$BUILD_OUTPUT" | grep -oE 'https://[^\s\)]+builds[^\s\)]+' | head -1)
fi

# If still not found, try to get from build list
if [ -z "$BUILD_URL" ]; then
    echo "📋 Checking recent builds..."
    LATEST_BUILD=$(eas build:list --platform ios --limit 1 --json 2>/dev/null | grep -oE '"url":"[^"]+"' | head -1 | cut -d'"' -f4)
    if [ -n "$LATEST_BUILD" ]; then
        BUILD_URL="$LATEST_BUILD"
    fi
fi

if [ -n "$BUILD_URL" ]; then
    echo "✅ Build started successfully!"
    echo ""
    echo "📱 Build URL: $BUILD_URL"
    echo ""
    echo "You can monitor the build progress at the URL above."
    echo "The build typically takes 15-25 minutes to complete."
    echo ""
    echo "You'll receive an email notification when the build is complete."
    echo "The IPA file will be available for download at the build URL."
else
    echo "⚠️  Could not automatically extract build URL."
    echo ""
    echo "Please check the output above for the build URL, or visit:"
    echo "https://expo.dev/accounts/nandan_07/projects/glowcheck01-app/builds"
    echo ""
    echo "Look for the most recent iOS build in the list."
fi

echo ""
echo "To check build status later, run:"
echo "  eas build:list --platform ios --limit 1"

