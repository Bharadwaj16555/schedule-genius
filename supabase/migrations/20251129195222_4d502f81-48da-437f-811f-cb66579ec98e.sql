-- Create a security definer function to get user role without RLS
CREATE OR REPLACE FUNCTION public.get_user_role_secure(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = user_id;
$$;

-- Drop the problematic courses policies that query profiles
DROP POLICY IF EXISTS "Faculty can create courses" ON public.courses;
DROP POLICY IF EXISTS "Faculty can view all courses" ON public.courses;

-- Recreate courses policies using the security definer function
CREATE POLICY "Faculty can create courses" ON public.courses
FOR INSERT
WITH CHECK (
  public.get_user_role_secure(auth.uid()) = 'faculty' 
  AND instructor_id = auth.uid()
);

CREATE POLICY "Faculty can view all courses" ON public.courses
FOR SELECT
USING (public.get_user_role_secure(auth.uid()) = 'faculty');