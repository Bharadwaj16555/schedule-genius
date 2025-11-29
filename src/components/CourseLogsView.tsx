import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, UserPlus, UserMinus, BookOpen, AlertCircle } from "lucide-react";

interface CourseLog {
  id: string;
  course_id: string;
  action_type: string;
  description: string;
  metadata: any;
  created_at: string;
  courses: {
    code: string;
    name: string;
  };
}

const CourseLogsView = ({ userId }: { userId: string }) => {
  const [logs, setLogs] = useState<CourseLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [userId]);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('course_logs')
      .select(`
        *,
        courses (
          code,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching logs:', error);
      setLoading(false);
      return;
    }

    setLogs(data || []);
    setLoading(false);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'enrollment':
        return <UserPlus className="w-4 h-4" />;
      case 'drop':
        return <UserMinus className="w-4 h-4" />;
      case 'course_created':
        return <BookOpen className="w-4 h-4" />;
      case 'course_update':
        return <FileText className="w-4 h-4" />;
      case 'conflict_resolution':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'enrollment':
        return 'default';
      case 'drop':
        return 'destructive';
      case 'course_created':
        return 'default';
      case 'course_update':
        return 'secondary';
      case 'conflict_resolution':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Course Activity Logs</h2>
        <p className="text-muted-foreground">
          Track all activities related to your courses
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest {logs.length} course events</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No activity logs yet
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="mt-1">
                      {getActionIcon(log.action_type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getActionColor(log.action_type) as any}>
                          {log.action_type.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm font-medium">
                          {log.courses.code}
                        </span>
                      </div>
                      <p className="text-sm">{log.description}</p>
                      {log.metadata && (
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mt-2">
                          {JSON.stringify(log.metadata, null, 2)}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseLogsView;
