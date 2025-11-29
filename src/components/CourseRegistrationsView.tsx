import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Mail } from "lucide-react";

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface Enrollment {
  id: string;
  status: string;
  enrolled_at: string;
  student_id: string;
  profiles: Student;
}

interface Course {
  id: string;
  code: string;
  name: string;
  max_students: number;
}

interface CourseWithEnrollments extends Course {
  enrollments: Enrollment[];
}

const CourseRegistrationsView = ({ userId }: { userId: string }) => {
  const [courses, setCourses] = useState<CourseWithEnrollments[]>([]);

  useEffect(() => {
    fetchCourses();
  }, [userId]);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        enrollments (
          id,
          status,
          enrolled_at,
          student_id,
          profiles:student_id (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('instructor_id', userId);

    if (error) {
      console.error('Error fetching courses:', error);
      return;
    }

    setCourses(data || []);
  };

  const getEnrolledCount = (enrollments: Enrollment[]) => {
    return enrollments.filter(e => e.status === 'enrolled').length;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Course Registrations</h2>
        <p className="text-muted-foreground">
          View students enrolled in your courses
        </p>
      </div>

      <div className="grid gap-6">
        {courses.map((course) => {
          const enrolledCount = getEnrolledCount(course.enrollments);
          const enrolledStudents = course.enrollments.filter(e => e.status === 'enrolled');

          return (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{course.code}</CardTitle>
                    <CardDescription className="text-base">{course.name}</CardDescription>
                  </div>
                  <Badge variant={enrolledCount >= course.max_students ? "destructive" : "secondary"}>
                    <Users className="w-3 h-3 mr-1" />
                    {enrolledCount} / {course.max_students}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {enrolledStudents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No students enrolled yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {enrolledStudents.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{enrollment.profiles.full_name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3" />
                            {enrollment.profiles.email}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {courses.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">No courses assigned yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CourseRegistrationsView;
