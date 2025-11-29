import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface Course {
  id: string;
  code: string;
  name: string;
  days: string[];
  start_time: string;
  end_time: string;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  self_study_hours: number;
  room_number: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

const FacultyScheduleView = ({ userId }: { userId: string }) => {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetchCourses();
  }, [userId]);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('instructor_id', userId);

    if (error) {
      console.error('Error fetching courses:', error);
      return;
    }

    setCourses(data || []);
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getCourseForSlot = (day: string, timeSlot: string) => {
    return courses.find(course => {
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
        <h2 className="text-2xl font-bold mb-2">My Teaching Schedule</h2>
        <p className="text-muted-foreground">
          Your weekly class timetable
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-6 border-b">
                <div className="p-4 font-semibold border-r bg-muted/50">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Time
                </div>
                {DAYS.map(day => (
                  <div key={day} className="p-4 font-semibold text-center">
                    {day}
                  </div>
                ))}
              </div>

              {TIME_SLOTS.map(timeSlot => (
                <div key={timeSlot} className="grid grid-cols-6 border-b">
                  <div className="p-4 border-r bg-muted/30 text-sm font-medium">
                    {formatTime(timeSlot)}
                  </div>
                  {DAYS.map(day => {
                    const course = getCourseForSlot(day, timeSlot);

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
    </div>
  );
};

export default FacultyScheduleView;
