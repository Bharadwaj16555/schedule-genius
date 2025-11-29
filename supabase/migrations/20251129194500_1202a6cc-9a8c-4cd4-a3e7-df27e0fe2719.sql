-- Drop the problematic function and policy
DROP POLICY IF EXISTS "Faculty can view student profiles in their courses" ON public.profiles;
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Recreate the policy without recursion - just check enrollments directly
CREATE POLICY "Faculty can view student profiles in their courses" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always view their own profile
  auth.uid() = id
  OR
  -- Faculty can view profiles of students enrolled in their courses
  EXISTS (
    SELECT 1
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.student_id = profiles.id 
    AND c.instructor_id = auth.uid()
  )
);