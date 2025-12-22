#!/bin/bash

# Start iOS Build and Get Build URL
# This script starts an iOS build and captures the build URL

echo "🚀 Starting iOS production build..."
echo ""

# Start the build and capture output
BUILD_OUTPUT=$(eas build --platform ios --profile production 2>&1)

# Display the output
echo "$BUILD_OUTPUT"

# Extract build URL from output
BUILD_URL=$(echo "$BUILD_OUTPUT" | grep -oP 'https://expo.dev/[^\s]+' | head -1)

if [ -n "$BUILD_URL" ]; then
    echo ""
    echo "✅ Build started successfully!"
    echo "📱 Build URL: $BUILD_URL"
    echo ""
    echo "You can monitor the build at: $BUILD_URL"
    echo "The build will take approximately 15-25 minutes."
else
    echo ""
    echo "⚠️  Could not extract build URL from output."
    echo "Please check the output above for the build URL."
    echo ""
    echo "You can also find your builds at:"
    echo "https://expo.dev/accounts/nandan_07/projects/glowcheck01-app/builds"
fi

