import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Users, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
  max_students: number;
  days: string[];
  start_time: string;
  end_time: string;
  semester: string;
  room_number: string;
  instructor_id: string | null;
}

interface Enrollment {
  id: string;
  course_id: string;
  courses: Course;
}

const DashboardView = ({ userId }: { userId: string }) => {
  const [enrolledCourses, setEnrolledCourses] = useState<Enrollment[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchEnrolledCourses();
    fetchAvailableCourses();
  }, [userId]);

  const fetchEnrolledCourses = async () => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('student_id', userId)
      .eq('status', 'enrolled');

    if (error) {
      console.error('Error fetching enrollments:', error);
      return;
    }

    setEnrolledCourses(data || []);
  };

  const fetchAvailableCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('code');

    if (error) {
      console.error('Error fetching courses:', error);
      return;
    }

    setAvailableCourses(data || []);
  };

  const handleEnroll = async (courseId: string) => {
    const { error } = await supabase
      .from('enrollments')
      .insert({
        student_id: userId,
        course_id: courseId,
        status: 'enrolled',
      });

    if (error) {
      toast({
        title: "Enrollment failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Successfully enrolled",
      description: "The course has been added to your schedule",
    });

    fetchEnrolledCourses();
  };

  const handleDrop = async (enrollmentId: string) => {
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', enrollmentId);

    if (error) {
      toast({
        title: "Drop failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Course dropped",
      description: "The course has been removed from your schedule",
    });

    fetchEnrolledCourses();
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const enrolledCourseIds = enrolledCourses.map(e => e.course_id);
  const filteredCourses = availableCourses.filter(
    course => 
      !enrolledCourseIds.includes(course.id) &&
      (course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
       course.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Enrolled Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{enrolledCourses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {enrolledCourses.reduce((sum, e) => sum + (e.courses?.credits || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{availableCourses.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">My Courses</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Available Courses</DialogTitle>
                <DialogDescription>
                  Browse and enroll in available courses
                </DialogDescription>
              </DialogHeader>

              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4"
              />

              <div className="space-y-4">
                {filteredCourses.map((course) => (
                  <Card key={course.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{course.code}</CardTitle>
                          <CardDescription className="text-base font-medium text-foreground mt-1">
                            {course.name}
                          </CardDescription>
                        </div>
                        <Button size="sm" onClick={() => handleEnroll(course.id)}>
                          Enroll
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {course.description && (
                        <p className="text-sm text-muted-foreground">{course.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <Badge variant="secondary">{course.credits} Credits</Badge>
                        <Badge variant="outline">
                          L-T-P-S: {course.lecture_hours}-{course.tutorial_hours}-{course.practical_hours}-{course.self_study_hours}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-4 h-4" />
                        {course.days.join(', ')} • {formatTime(course.start_time)} - {formatTime(course.end_time)}
                        {course.room_number && ` • Room ${course.room_number}`}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {enrolledCourses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-4">
                You haven't enrolled in any courses yet
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Browse Courses</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Available Courses</DialogTitle>
                    <DialogDescription>
                      Browse and enroll in available courses
                    </DialogDescription>
                  </DialogHeader>

                  <Input
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mb-4"
                  />

                  <div className="space-y-4">
                    {filteredCourses.map((course) => (
                      <Card key={course.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{course.code}</CardTitle>
                              <CardDescription className="text-base font-medium text-foreground mt-1">
                                {course.name}
                              </CardDescription>
                            </div>
                            <Button size="sm" onClick={() => handleEnroll(course.id)}>
                              Enroll
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {course.description && (
                            <p className="text-sm text-muted-foreground">{course.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm flex-wrap">
                            <Badge variant="secondary">{course.credits} Credits</Badge>
                            <Badge variant="outline">
                              L-T-P-S: {course.lecture_hours}-{course.tutorial_hours}-{course.practical_hours}-{course.self_study_hours}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="w-4 h-4" />
                            {course.days.join(', ')} • {formatTime(course.start_time)} - {formatTime(course.end_time)}
                            {course.room_number && ` • Room ${course.room_number}`}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {enrolledCourses.map((enrollment) => (
              <Card key={enrollment.id} className="card-hover">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{enrollment.courses.code}</CardTitle>
                      <CardDescription className="text-base font-medium text-foreground mt-1">
                        {enrollment.courses.name}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDrop(enrollment.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {enrollment.courses.description && (
                    <p className="text-sm text-muted-foreground">
                      {enrollment.courses.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <Badge variant="secondary">{enrollment.courses.credits} Credits</Badge>
                    <Badge variant="outline">
                      L-T-P-S: {enrollment.courses.lecture_hours}-{enrollment.courses.tutorial_hours}-{enrollment.courses.practical_hours}-{enrollment.courses.self_study_hours}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="w-4 h-4" />
                    {enrollment.courses.days.join(', ')}
                  </div>
                  <div className="text-sm text-muted-foreground ml-6">
                    {formatTime(enrollment.courses.start_time)} -{' '}
                    {formatTime(enrollment.courses.end_time)}
                    {enrollment.courses.room_number && ` • Room ${enrollment.courses.room_number}`}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
