-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'faculty', 'admin');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL DEFAULT 3,
  max_students INTEGER NOT NULL DEFAULT 30,
  semester TEXT NOT NULL,
  days TEXT[] NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  instructor_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Courses policies - all authenticated users can view courses
CREATE POLICY "Authenticated users can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Faculty can view their courses"
  ON courses FOR SELECT
  TO authenticated
  USING (auth.uid() = instructor_id);

-- Create enrollments table
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'enrolled',
  UNIQUE(student_id, course_id)
);

-- Enable RLS on enrollments
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Enrollments policies
CREATE POLICY "Students can view their own enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Students can enroll in courses"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can drop their courses"
  ON enrollments FOR DELETE
  TO authenticated
  USING (auth.uid() = student_id);

-- Create function to handle new user signup
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to check course conflicts
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
$$ LANGUAGE plpgsql SECURITY DEFINER;