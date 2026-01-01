#!/bin/bash

echo "🔍 Edge Functions Deployment Verification"
echo "=========================================="
echo ""

ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcm9veml0bGRiZ25jaGFpbnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NjcxNDYsImV4cCI6MjA4MDE0MzE0Nn0.2a36x2xDZBE9XAmjmzsV_j4ljCp5aq3jx3uAlpFOWlY"
BASE_URL="https://pmroozitldbgnchainxv.supabase.co/functions/v1"

functions=("ai-analyze" "vision-analyze" "plan-generate" "insights-generate" "ai-advisor")

echo "Testing Edge Functions deployment..."
echo ""

for func in "${functions[@]}"; do
  echo -n "Testing $func... "
  
  status_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$BASE_URL/$func" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"test": true}' \
    --max-time 10)
  
  if [ "$status_code" = "200" ] || [ "$status_code" = "400" ] || [ "$status_code" = "401" ]; then
    echo "✅ DEPLOYED (HTTP $status_code)"
  elif [ "$status_code" = "404" ]; then
    echo "❌ NOT DEPLOYED (HTTP 404)"
  elif [ "$status_code" = "000" ]; then
    echo "⚠️  TIMEOUT/ERROR (Check network)"
  else
    echo "⚠️  UNKNOWN (HTTP $status_code)"
  fi
done

echo ""
echo "=========================================="
echo "Note: 200/400/401 = Function exists ✅"
echo "      404 = Function not deployed ❌"
echo ""
echo "For detailed verification, check Supabase Dashboard:"
echo "https://supabase.com/dashboard/project/pmroozitldbgnchainxv/functions"
