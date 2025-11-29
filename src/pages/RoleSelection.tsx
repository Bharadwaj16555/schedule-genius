import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, Sparkles, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-5xl space-y-12 relative z-10">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold gradient-text tracking-tight">
            EduManage
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Smart Course Selection & Schedule Management Platform
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Build your perfect academic schedule</span>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card 
            className="card-hover cursor-pointer border-2 border-transparent hover:border-primary transition-all group relative overflow-hidden" 
            onClick={() => navigate('/auth?role=student')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="space-y-6 relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl mb-3">Student Portal</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Explore courses, build your academic schedule, and manage your enrollments with ease
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  Browse course catalog
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  Create your timetable
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  Track enrollments
                </li>
              </ul>
              <Button className="w-full shadow-lg" size="lg">
                Enter as Student
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="card-hover cursor-pointer border-2 border-transparent hover:border-accent transition-all group relative overflow-hidden" 
            onClick={() => navigate('/auth?role=faculty')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="space-y-6 relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl mb-3">Faculty Portal</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Manage your courses, track student registrations, and oversee your teaching schedule
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                  Create & manage courses
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                  View teaching schedule
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                  Handle registrations
                </li>
              </ul>
              <Button className="w-full bg-accent hover:bg-accent/90 shadow-lg" size="lg">
                Enter as Faculty
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
