-- Add L-T-P-S structure to courses table
ALTER TABLE public.courses
ADD COLUMN lecture_hours integer NOT NULL DEFAULT 3,
ADD COLUMN tutorial_hours integer NOT NULL DEFAULT 0,
ADD COLUMN practical_hours integer NOT NULL DEFAULT 0,
ADD COLUMN self_study_hours integer NOT NULL DEFAULT 3,
ADD COLUMN room_number text,
ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'));

-- Create course_logs table for tracking activities
CREATE TABLE public.course_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('enrollment', 'drop', 'course_update', 'conflict_resolution', 'course_created')),
  description text NOT NULL,
  metadata jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on course_logs
ALTER TABLE public.course_logs ENABLE ROW LEVEL SECURITY;

-- Update RLS policies for courses to allow faculty to view all courses
DROP POLICY IF EXISTS "Faculty can view their courses" ON public.courses;

CREATE POLICY "Faculty can view all courses"
ON public.courses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'faculty'
  )
);

-- Allow faculty to insert new courses
CREATE POLICY "Faculty can create courses"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'faculty'
  )
  AND instructor_id = auth.uid()
);

-- Allow faculty to update their own courses
CREATE POLICY "Faculty can update their own courses"
ON public.courses
FOR UPDATE
TO authenticated
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

-- Course logs policies
CREATE POLICY "Faculty can view logs for their courses"
ON public.course_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = course_logs.course_id
    AND courses.instructor_id = auth.uid()
  )
);

CREATE POLICY "Faculty can insert logs for their courses"
ON public.course_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = course_logs.course_id
    AND courses.instructor_id = auth.uid()
  )
);

-- Create function to automatically log course creation
CREATE OR REPLACE FUNCTION public.log_course_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.course_logs (course_id, action_type, description, created_by)
  VALUES (
    NEW.id,
    'course_created',
    'Course ' || NEW.code || ' - ' || NEW.name || ' was created',
    NEW.instructor_id
  );
  RETURN NEW;
END;
$$;

-- Create trigger for course creation logging
CREATE TRIGGER on_course_created
AFTER INSERT ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.log_course_creation();

-- Create function to log course updates
CREATE OR REPLACE FUNCTION public.log_course_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.days != NEW.days OR OLD.start_time != NEW.start_time OR OLD.end_time != NEW.end_time THEN
    INSERT INTO public.course_logs (course_id, action_type, description, created_by, metadata)
    VALUES (
      NEW.id,
      'course_update',
      'Course schedule updated',
      auth.uid(),
      jsonb_build_object(
        'old_days', OLD.days,
        'new_days', NEW.days,
        'old_time', OLD.start_time || '-' || OLD.end_time,
        'new_time', NEW.start_time || '-' || NEW.end_time
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for course updates logging
CREATE TRIGGER on_course_updated
AFTER UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.log_course_update();

-- Create function to log enrollments
CREATE OR REPLACE FUNCTION public.log_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_name text;
  v_course_code text;
BEGIN
  SELECT full_name INTO v_student_name FROM public.profiles WHERE id = NEW.student_id;
  SELECT code INTO v_course_code FROM public.courses WHERE id = NEW.course_id;
  
  INSERT INTO public.course_logs (course_id, action_type, description, created_by, metadata)
  VALUES (
    NEW.course_id,
    'enrollment',
    v_student_name || ' enrolled in ' || v_course_code,
    NEW.student_id,
    jsonb_build_object('student_id', NEW.student_id, 'enrollment_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for enrollment logging
CREATE TRIGGER on_enrollment_created
AFTER INSERT ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.log_enrollment();

-- Create function to log drops
CREATE OR REPLACE FUNCTION public.log_drop()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_name text;
  v_course_code text;
BEGIN
  IF OLD.status = 'enrolled' AND NEW.status = 'dropped' THEN
    SELECT full_name INTO v_student_name FROM public.profiles WHERE id = NEW.student_id;
    SELECT code INTO v_course_code FROM public.courses WHERE id = NEW.course_id;
    
    INSERT INTO public.course_logs (course_id, action_type, description, created_by, metadata)
    VALUES (
      NEW.course_id,
      'drop',
      v_student_name || ' dropped ' || v_course_code,
      auth.uid(),
      jsonb_build_object('student_id', NEW.student_id, 'enrollment_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for drop logging
CREATE TRIGGER on_enrollment_dropped
AFTER UPDATE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.log_drop();