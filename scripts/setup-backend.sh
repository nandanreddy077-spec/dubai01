#!/bin/bash

# Backend Setup Script for Glow App
# This script helps set up the scalable backend for 50k+ users

set -e

echo "🚀 Setting up scalable backend for Glow App..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Installing...${NC}"
    npm install -g supabase
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Check for environment variables
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${RED}❌ EXPO_PUBLIC_SUPABASE_URL not set${NC}"
    echo "Please set your Supabase environment variables in .env file"
    exit 1
fi

if [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ EXPO_PUBLIC_SUPABASE_ANON_KEY not set${NC}"
    echo "Please set your Supabase environment variables in .env file"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

# Instructions
echo -e "${YELLOW}📋 Setup Instructions:${NC}"
echo ""
echo "1. Go to your Supabase Dashboard → SQL Editor"
echo "2. Run the following migrations in order:"
echo "   - supabase/migrations/20240102000000_complete_backend_setup.sql"
echo "   - supabase/storage-optimized.sql"
echo ""
echo "3. Enable Connection Pooling:"
echo "   - Go to Settings → Database → Connection Pooling"
echo "   - Enable Transaction Mode pooling"
echo ""
echo "4. Enable Extensions (if not already enabled):"
echo "   - Go to Database → Extensions"
echo "   - Enable: pg_cron (for scheduled jobs)"
echo ""
echo "5. Set up Storage Buckets:"
echo "   - The storage-optimized.sql script creates the buckets"
echo "   - Verify in Storage → Buckets"
echo ""
echo -e "${GREEN}✅ Setup script completed!${NC}"
echo ""
echo "📚 For detailed instructions, see: BACKEND_SCALABILITY_SETUP.md"

















