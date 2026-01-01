#!/bin/bash

# iOS Build with Capability Sync Disabled
# This fixes the capability syncing error

echo "🚀 Starting iOS Build (Capability Sync Disabled)"
echo "================================================"
echo ""
echo "This build will skip capability syncing to avoid errors."
echo ""

# Set the environment variable to disable capability sync
export EXPO_NO_CAPABILITY_SYNC=1

# Start the build
eas build --platform ios --profile production

echo ""
echo "✅ If build started, you'll see a Build URL above."
echo "📱 Copy that URL and share it!"





