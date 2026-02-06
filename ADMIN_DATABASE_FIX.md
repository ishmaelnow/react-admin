# Admin Dashboard Database Connection Fix

## Issues Found

1. **RLS Policies Blocking Admin Access** - The admin needs to bypass or have special RLS policies
2. **Foreign Key Joins** - The queries were trying to use joins that might not work with RLS
3. **Error Handling** - Errors weren't being logged properly

## Fixes Applied

### 1. Separated Queries
Instead of using Supabase joins (which can fail with RLS), we now:
- Fetch driver_profiles first
- Fetch profiles separately
- Merge the data in JavaScript

### 2. Better Error Logging
Added console.log statements to see exactly what's failing

### 3. Updated Supabase URL
Changed fallback to match the correct Supabase instance

## Critical: RLS Policies Must Be Fixed

The admin app **cannot work** without proper RLS policies. Run this SQL:

```sql
-- Fix driver_profiles RLS for admins
DROP POLICY IF EXISTS "Admins can view all driver profiles" ON driver_profiles;
DROP POLICY IF EXISTS "Admins can update driver profiles" ON driver_profiles;
DROP POLICY IF EXISTS "Admins can delete driver profiles" ON driver_profiles;

-- Create helper function
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin SELECT policy
CREATE POLICY "Admins can view all driver profiles"
ON driver_profiles FOR SELECT
TO authenticated
USING (is_admin_user());

-- Admin UPDATE policy
CREATE POLICY "Admins can update driver profiles"
ON driver_profiles FOR UPDATE
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Admin DELETE policy
CREATE POLICY "Admins can delete driver profiles"
ON driver_profiles FOR DELETE
TO authenticated
USING (is_admin_user());

-- Fix rides RLS for admins
DROP POLICY IF EXISTS "Admins can view all rides" ON rides;
DROP POLICY IF EXISTS "Admins can update rides" ON rides;

CREATE POLICY "Admins can view all rides"
ON rides FOR SELECT
TO authenticated
USING (is_admin_user());

CREATE POLICY "Admins can update rides"
ON rides FOR UPDATE
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());
```

## Testing

1. Open browser console (F12)
2. Go to Drivers page
3. Check console for:
   - "Fetching drivers..."
   - "Driver profiles loaded: X"
   - Any error messages

4. If you see errors, check:
   - Is the user logged in?
   - Does the user have role='admin' in profiles table?
   - Are the RLS policies created?

## Next Steps

1. Run the SQL above
2. Refresh the admin dashboard
3. Check browser console for errors
4. Share any error messages you see

