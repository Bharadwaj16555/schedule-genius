import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  self_study_hours: number;
  days: string[];
  start_time: string;
  end_time: string;
  room_number: string;
}

interface Enrollment {
  course_id: string;
  courses: Course;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

const ScheduleView = ({ userId }: { userId: string }) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    fetchEnrollments();
  }, [userId]);

  const fetchEnrollments = async () => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('student_id', userId)
      .eq('status', 'enrolled');

    if (error) {
      console.error('Error fetching enrollments:', error);
      return;
    }

    setEnrollments(data || []);
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getCourseForSlot = (day: string, timeSlot: string) => {
    return enrollments.find(enrollment => {
      const course = enrollment.courses;
      const slotTime = new Date(`2000-01-01T${timeSlot}:00`);
      const courseStart = new Date(`2000-01-01T${course.start_time}`);
      const courseEnd = new Date(`2000-01-01T${course.end_time}`);

      return (
        course.days.includes(day) &&
        slotTime >= courseStart &&
        slotTime < courseEnd
      );
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Weekly Schedule</h2>
        <p className="text-muted-foreground">
          Your class timetable for the semester
        </p>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-6 border-b">
                <div className="p-4 font-semibold border-r bg-muted/50">Time</div>
                {DAYS.map(day => (
                  <div key={day} className="p-4 font-semibold text-center">
                    {day}
                  </div>
                ))}
              </div>

              {/* Time slots */}
              {TIME_SLOTS.map(timeSlot => (
                <div key={timeSlot} className="grid grid-cols-6 border-b">
                  <div className="p-4 border-r bg-muted/30 text-sm font-medium">
                    {formatTime(timeSlot)}
                  </div>
                  {DAYS.map(day => {
                    const enrollment = getCourseForSlot(day, timeSlot);
                    const course = enrollment?.courses;

                    return (
                      <div
                        key={`${day}-${timeSlot}`}
                        className="p-2 border-l min-h-[80px]"
                      >
                        {course && (
                          <div className="h-full bg-primary/10 border border-primary/20 rounded-lg p-3">
                            <div className="font-semibold text-sm">{course.code}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {course.name}
                            </div>
                            <div className="text-xs mt-2 space-y-1">
                              <div>{formatTime(course.start_time)} - {formatTime(course.end_time)}</div>
                              <div className="font-medium text-primary">
                                L-T-P-S: {course.lecture_hours}-{course.tutorial_hours}-{course.practical_hours}-{course.self_study_hours}
                              </div>
                              {course.room_number && (
                                <div className="text-muted-foreground">Room {course.room_number}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course List */}
      <Card>
        <CardHeader>
          <CardTitle>Enrolled Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {enrollments.map(enrollment => (
              <div
                key={enrollment.course_id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="font-semibold">{enrollment.courses.code}</div>
                  <div className="text-sm text-muted-foreground">
                    {enrollment.courses.name}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="secondary">{enrollment.courses.credits} Credits</Badge>
                  <Badge variant="outline">
                    L-T-P-S: {enrollment.courses.lecture_hours}-{enrollment.courses.tutorial_hours}-{enrollment.courses.practical_hours}-{enrollment.courses.self_study_hours}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {enrollment.courses.days.join(', ')}
                  </div>
                </div>
              </div>
            ))}
            {enrollments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No courses enrolled yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleView;
