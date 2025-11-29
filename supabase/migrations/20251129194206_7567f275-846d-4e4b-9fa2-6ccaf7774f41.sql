-- Drop the problematic policy
DROP POLICY IF EXISTS "Faculty can view student profiles in their courses" ON public.profiles;

-- Create a security definer function to safely get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Create a new policy that uses the security definer function
CREATE POLICY "Faculty can view student profiles in their courses" 
ON public.profiles 
FOR SELECT 
USING (
  (public.get_user_role(id) = 'student'::user_role) 
  AND (EXISTS (
    SELECT 1
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.student_id = profiles.id 
    AND c.instructor_id = auth.uid()
  ))
);