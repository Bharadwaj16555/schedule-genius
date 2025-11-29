import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface Course {
  id: string;
  code: string;
  name: string;
  days: string[];
  start_time: string;
  end_time: string;
}

interface Enrollment {
  id: string;
  status: string;
  course_id: string;
  student_id: string;
  enrolled_at: string;
  profiles: Student;
  courses: Course;
}

interface ConflictInfo {
  enrollment: Enrollment;
  conflictingCourses: Course[];
}

const ConflictManagementView = ({ userId }: { userId: string }) => {
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchConflicts();
  }, [userId]);

  const fetchConflicts = async () => {
    setLoading(true);
    
    // Get all enrollments for faculty's courses
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        course_id,
        student_id,
        enrolled_at,
        profiles:student_id (
          id,
          full_name,
          email
        ),
        courses:course_id (
          id,
          code,
          name,
          days,
          start_time,
          end_time
        )
      `)
      .eq('status', 'enrolled')
      .in('course_id', 
        await supabase
          .from('courses')
          .select('id')
          .eq('instructor_id', userId)
          .then(({ data }) => data?.map(c => c.id) || [])
      );

    if (error) {
      console.error('Error fetching enrollments:', error);
      setLoading(false);
      return;
    }

    // Check for conflicts
    const conflictsList: ConflictInfo[] = [];
    
    for (const enrollment of enrollments || []) {
      const { data: studentEnrollments } = await supabase
        .from('enrollments')
        .select('*, courses(*)')
        .eq('student_id', enrollment.student_id)
        .eq('status', 'enrolled')
        .neq('course_id', enrollment.course_id);

      const conflicting = studentEnrollments?.filter(se => {
        const course1 = enrollment.courses;
        const course2 = se.courses;
        
        const hasOverlappingDays = course1.days.some(day => course2.days.includes(day));
        if (!hasOverlappingDays) return false;

        const time1Start = new Date(`2000-01-01T${course1.start_time}`);
        const time1End = new Date(`2000-01-01T${course1.end_time}`);
        const time2Start = new Date(`2000-01-01T${course2.start_time}`);
        const time2End = new Date(`2000-01-01T${course2.end_time}`);

        return (time1Start < time2End && time1End > time2Start);
      }).map(se => se.courses) || [];

      if (conflicting.length > 0) {
        conflictsList.push({
          enrollment,
          conflictingCourses: conflicting
        });
      }
    }

    setConflicts(conflictsList);
    setLoading(false);
  };

  const handleDropEnrollment = async (enrollmentId: string, studentName: string, courseName: string, courseId: string) => {
    const { error } = await supabase
      .from('enrollments')
      .update({ status: 'dropped' })
      .eq('id', enrollmentId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to drop enrollment",
        variant: "destructive",
      });
      return;
    }

    // Log the conflict resolution
    await supabase
      .from('course_logs')
      .insert({
        course_id: courseId,
        action_type: 'conflict_resolution',
        description: `Schedule conflict resolved: ${studentName} was dropped from ${courseName}`,
        created_by: userId,
        metadata: { enrollment_id: enrollmentId, student_name: studentName }
      });

    toast({
      title: "Enrollment Dropped",
      description: `${studentName} has been dropped from ${courseName}`,
    });

    fetchConflicts();
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading conflicts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Conflict Management</h2>
        <p className="text-muted-foreground">
          Help resolve student schedule conflicts
        </p>
      </div>

      {conflicts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium">No Schedule Conflicts</p>
            <p className="text-muted-foreground mt-2">All students in your courses have valid schedules</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conflicts.map((conflict) => (
            <Card key={conflict.enrollment.id} className="border-destructive/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      Schedule Conflict Detected
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {conflict.enrollment.profiles.full_name} ({conflict.enrollment.profiles.email})
                    </CardDescription>
                  </div>
                  <Badge variant="destructive">
                    {conflict.conflictingCourses.length} Conflict{conflict.conflictingCourses.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-accent/50 rounded-lg">
                  <div className="font-semibold text-sm mb-1">Your Course</div>
                  <div className="font-medium">{conflict.enrollment.courses.code}</div>
                  <div className="text-sm text-muted-foreground">{conflict.enrollment.courses.name}</div>
                  <div className="text-sm mt-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {conflict.enrollment.courses.days.join(', ')} | {formatTime(conflict.enrollment.courses.start_time)} - {formatTime(conflict.enrollment.courses.end_time)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold text-sm">Conflicts With:</div>
                  {conflict.conflictingCourses.map((course) => (
                    <div key={course.id} className="p-3 border rounded-lg bg-destructive/5">
                      <div className="font-medium">{course.code}</div>
                      <div className="text-sm text-muted-foreground">{course.name}</div>
                      <div className="text-sm mt-1 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {course.days.join(', ')} | {formatTime(course.start_time)} - {formatTime(course.end_time)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => handleDropEnrollment(
                      conflict.enrollment.id,
                      conflict.enrollment.profiles.full_name,
                      conflict.enrollment.courses.code,
                      conflict.enrollment.course_id
                    )}
                  >
                    Drop Student from Your Course
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    This will remove the student from {conflict.enrollment.courses.code} to resolve the conflict
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConflictManagementView;
