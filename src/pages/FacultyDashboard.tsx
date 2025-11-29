import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, BookOpen, Clock, Users, AlertCircle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FacultyScheduleView from "@/components/FacultyScheduleView";
import CourseRegistrationsView from "@/components/CourseRegistrationsView";
import ConflictManagementView from "@/components/ConflictManagementView";

interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  days: string[];
  start_time: string;
  end_time: string;
  semester: string;
}

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/');
        return;
      }
      setUser(session.user);
      fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/');
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    if (data.role !== 'faculty') {
      toast({
        title: "Access denied",
        description: "This dashboard is for faculty only",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    setProfile(data);
    fetchCourses(userId);
  };

  const fetchCourses = async (userId: string) => {
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">ScheduleCo Faculty Portal</h1>
            <p className="text-sm text-muted-foreground">Welcome, {profile.full_name}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-[600px]">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              My Courses
            </TabsTrigger>
            <TabsTrigger value="registrations" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Registrations
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="conflicts" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Conflicts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">My Courses</h2>
              <p className="text-muted-foreground">
                You are teaching {courses.length} course{courses.length !== 1 ? 's' : ''} this semester
                {courses.length >= 2 && ' (Maximum limit reached)'}
              </p>
            </div>

            {courses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No courses assigned yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <Card key={course.id} className="card-hover">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1">{course.code}</CardTitle>
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
                      
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {course.days.join(', ')}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground ml-6">
                          {formatTime(course.start_time)} - {formatTime(course.end_time)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="registrations">
            <CourseRegistrationsView userId={user.id} />
          </TabsContent>

          <TabsContent value="schedule">
            <FacultyScheduleView userId={user.id} />
          </TabsContent>

          <TabsContent value="conflicts">
            <ConflictManagementView userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FacultyDashboard;
