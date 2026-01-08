#!/bin/bash

# Automated iOS Build Script
# This script handles the build with all necessary prompts

cd /Users/nandanreddyavanaganti/dubai01

echo "🚀 Starting iOS build with all fixes applied..."
echo ""
echo "Version: 1.0.1"
echo "Build Number: 39"
echo ""

# Start the build
EXPO_NO_CAPABILITY_SYNC=1 eas build --platform ios --profile production <<EOF
yes
yes
nandanreddy05@icloud.com
Surekhareddy1661
EOF

echo ""
echo "✅ Build started! Check the URL above for progress."







