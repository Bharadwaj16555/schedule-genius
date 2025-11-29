-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION check_schedule_conflict(
  p_student_id UUID,
  p_course_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conflict BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM enrollments e
    JOIN courses c1 ON e.course_id = c1.id
    JOIN courses c2 ON c2.id = p_course_id
    WHERE e.student_id = p_student_id
      AND e.status = 'enrolled'
      AND c1.days && c2.days
      AND (
        (c1.start_time, c1.end_time) OVERLAPS (c2.start_time, c2.end_time)
      )
  ) INTO v_conflict;
  
  RETURN v_conflict;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;