-- Drop the old redundant policy since the new policy covers it
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;