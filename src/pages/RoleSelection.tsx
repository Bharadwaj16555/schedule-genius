import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome to ScheduleCo
          </h1>
          <p className="text-lg text-muted-foreground">
            Select your role to continue
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="card-hover cursor-pointer border-2 hover:border-primary transition-all" onClick={() => navigate('/auth?role=student')}>
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Student</CardTitle>
                <CardDescription className="text-base mt-2">
                  Access course catalog, build your schedule, and manage your enrollments
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">
                Continue as Student
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer border-2 hover:border-accent transition-all" onClick={() => navigate('/auth?role=faculty')}>
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-accent" />
              </div>
              <div>
                <CardTitle className="text-2xl">Faculty</CardTitle>
                <CardDescription className="text-base mt-2">
                  View your assigned courses and teaching schedule
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-accent hover:bg-accent/90" size="lg">
                Continue as Faculty
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
