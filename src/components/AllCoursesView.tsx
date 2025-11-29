import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, Users, BookOpen, Search } from "lucide-react";

interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  self_study_hours: number;
  days: string[];
  start_time: string;
  end_time: string;
  semester: string;
  max_students: number;
  room_number: string;
  instructor_id: string;
  profiles: {
    full_name: string;
  };
}

const AllCoursesView = ({ userId }: { userId: string }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        profiles:instructor_id (
          full_name
        )
      `)
      .eq('status', 'active')
      .order('code');

    if (error) {
      console.error('Error fetching courses:', error);
      setLoading(false);
      return;
    }

    setCourses(data || []);
    setLoading(false);
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const filteredCourses = courses.filter(course =>
    course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">All Courses</h2>
        <p className="text-muted-foreground">
          Browse all {courses.length} active courses in the system
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by code, name, or instructor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="card-hover">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-1 flex items-center gap-2">
                    {course.code}
                    {course.instructor_id === userId && (
                      <Badge variant="default" className="text-xs">Your Course</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-base font-medium text-foreground">
                    {course.name}
                  </CardDescription>
                </div>
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {course.credits} Credits
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {course.description && (
                <p className="text-sm text-muted-foreground">{course.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    L-T-P-S: {course.lecture_hours}-{course.tutorial_hours}-{course.practical_hours}-{course.self_study_hours}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {course.days.join(', ')}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground ml-6">
                  {formatTime(course.start_time)} - {formatTime(course.end_time)}
                  {course.room_number && ` • Room ${course.room_number}`}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">Instructor: </span>
                  <span className="font-medium">{course.profiles?.full_name}</span>
                </div>
                <Badge variant="secondary">
                  <Users className="w-3 h-3 mr-1" />
                  Max: {course.max_students}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">
              {searchQuery ? 'No courses found matching your search' : 'No courses available'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AllCoursesView;
