#!/bin/bash

# Script to push to GitHub with authentication
cd "$(dirname "$0")"

echo "🔐 Setting up GitHub authentication..."

# Try to use GitHub CLI if available
if command -v gh &> /dev/null; then
    echo "📋 Attempting to use GitHub CLI..."
    gh auth login --hostname github.com --web --git-protocol https
    git config --global credential.https://github.com.helper "!gh auth git-credential"
fi

echo "🚀 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
else
    echo "❌ Push failed. Please try one of these options:"
    echo ""
    echo "Option 1: Use Personal Access Token"
    echo "  1. Go to: https://github.com/settings/tokens"
    echo "  2. Generate new token (classic) with 'repo' scope"
    echo "  3. Run: git push origin main"
    echo "  4. When prompted, use your GitHub username and the token as password"
    echo ""
    echo "Option 2: Use GitHub CLI"
    echo "  Run: gh auth login"
    echo "  Then: git push origin main"
    echo ""
    echo "Option 3: Use SSH (if you have SSH keys)"
    echo "  git remote set-url origin git@github.com:nandanreddy077-spec/dubai01.git"
    echo "  git push origin main"
fi

