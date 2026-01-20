# Supabase Security Advisor Fixes

**Date**: January 12, 2026  
**Status**: ✅ SQL Migration Created

---

## 🔴 **Critical Issues Found**

### 1. **RLS Disabled in Public** (1 Error)
- **Table**: `public.storage_metrics`
- **Issue**: Row Level Security not enabled
- **Risk**: High - Data could be exposed
- **Fix**: ✅ Included in migration

### 2. **Function Search Path Mutable** (18 Warnings)
- **Issue**: Functions don't have `search_path` set
- **Risk**: Medium - SQL injection vulnerability
- **Affected Functions**: 
  - `refresh_user_statistics_cache`
  - `update_user_last_active`
  - `set_cached_ai_response`
  - `check_rate_limit`
  - `get_storage_statistics`
  - `cleanup_old_images`
  - `get_user_storage_usage`
  - `cleanup_old_metrics`
  - `cleanup_old_rate_limits`
  - `log_storage_metrics`
  - `update_updated_at_column`
  - `handle_new_user`
  - `get_paginated_analyses`
  - `get_cached_ai_response`
  - `cleanup_expired_cache`
- **Fix**: ✅ All functions updated in migration

### 3. **Extension in Public Schema** (2 Warnings)
- **Extensions**: `pg_trgm`, `btree_gin`
- **Issue**: Extensions installed in public schema
- **Risk**: Low - Acceptable for most use cases
- **Fix**: ⚠️ Documented - Optional fix (requires careful migration)

### 4. **Materialized View in API** (1 Warning)
- **View**: `public.user_statistics_cache`
- **Issue**: Materialized view accessible via API
- **Risk**: Medium - Could expose aggregated data
- **Fix**: ✅ Secure view wrapper created

### 5. **Leaked Password Protection Disabled** (1 Warning)
- **Issue**: Password leak checking not enabled
- **Risk**: Medium - Users could use compromised passwords
- **Fix**: ⚠️ Must be enabled in Supabase Dashboard (cannot be done via SQL)

---

## ✅ **How to Apply Fixes**

### Step 1: Run SQL Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of:
   ```
   supabase/migrations/20250112000000_fix_security_issues.sql
   ```
5. Paste into SQL Editor
6. Click **Run** to execute

### Step 2: Enable Leaked Password Protection (Manual)

1. Go to **Authentication** → **Settings** → **Password**
2. Find **"Check for leaked passwords"**
3. Enable the toggle
4. Save changes

### Step 3: Verify Fixes

After running the migration, go back to **Security Advisor** and:
1. Click **"Rerun linter"** button
2. Verify all errors are resolved
3. Check that warnings are reduced

---

## 📋 **What the Migration Does**

### 1. **Enables RLS on storage_metrics**
```sql
ALTER TABLE public.storage_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage storage_metrics" ...
```

### 2. **Fixes All Functions with search_path**
All SECURITY DEFINER functions now have:
```sql
SET search_path = public, pg_temp
```
This prevents SQL injection attacks.

### 3. **Creates Secure View Wrapper**
```sql
CREATE VIEW public.user_statistics_secure AS
SELECT * FROM public.user_statistics_cache
WHERE user_id = auth.uid();
```

### 4. **Enables RLS on All Tables**
Automatically enables RLS on any tables that don't have it.

---

## ⚠️ **Important Notes**

### Extensions in Public Schema
The warnings about `pg_trgm` and `btree_gin` in the public schema are **low priority**. Moving them requires:
1. Recreating extensions in a new schema
2. Updating all references
3. Extensive testing

**Recommendation**: Leave as-is for now. This is acceptable for most production apps.

### Materialized View
The materialized view warning is addressed by creating a secure view wrapper. The original view is still accessible but should be used through the secure wrapper.

---

## 🔍 **Verification Queries**

The migration includes verification queries at the end. After running, you can check:

1. **Functions without search_path**:
   ```sql
   SELECT proname, pg_get_functiondef(oid) 
   FROM pg_proc 
   WHERE pronamespace = 'public'::regnamespace
     AND prosecdef = true
     AND pg_get_functiondef(oid) NOT LIKE '%SET search_path%';
   ```

2. **Tables without RLS**:
   ```sql
   SELECT schemaname, tablename
   FROM pg_tables
   WHERE schemaname = 'public'
     AND relrowsecurity = false;
   ```

---

## ✅ **Expected Results**

After applying fixes:
- ✅ **0 Errors** (down from 1)
- ✅ **~2-3 Warnings** (down from 18)
  - Extension warnings (optional to fix)
  - Any remaining issues will be documented

---

## 🚀 **Next Steps**

1. ✅ **Run the migration** in Supabase SQL Editor
2. ✅ **Enable leaked password protection** in dashboard
3. ✅ **Rerun Security Advisor** to verify fixes
4. ✅ **Test your app** to ensure nothing broke
5. ✅ **Monitor** for any new security issues

---

## 📝 **Files Created**

- `supabase/migrations/20250112000000_fix_security_issues.sql` - Complete migration file
- `SUPABASE_SECURITY_FIXES.md` - This documentation

---

**Status**: Ready to apply ✅

