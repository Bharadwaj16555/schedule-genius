-- Allow faculty to view enrollments for their courses
CREATE POLICY "Faculty can view enrollments for their courses"
ON public.enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = enrollments.course_id
    AND courses.instructor_id = auth.uid()
  )
);

-- Allow faculty to view student profiles enrolled in their courses
CREATE POLICY "Faculty can view student profiles in their courses"
ON public.profiles
FOR SELECT
USING (
  role = 'student' AND EXISTS (
    SELECT 1 
    FROM public.enrollments e
    JOIN public.courses c ON e.course_id = c.id
    WHERE e.student_id = profiles.id
    AND c.instructor_id = auth.uid()
  )
);

-- Allow faculty to update enrollment status to help resolve conflicts
CREATE POLICY "Faculty can update enrollments for their courses"
ON public.enrollments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = enrollments.course_id
    AND courses.instructor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = enrollments.course_id
    AND courses.instructor_id = auth.uid()
  )
);