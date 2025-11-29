import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus } from "lucide-react";

const DAYS_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SEMESTERS = ['Fall 2024', 'Spring 2025', 'Summer 2025', 'Fall 2025'];

interface CourseCreateFormProps {
  userId: string;
  onCourseCreated: () => void;
}

const CourseCreateForm = ({ userId, onCourseCreated }: CourseCreateFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    credits: 3,
    lecture_hours: 3,
    tutorial_hours: 0,
    practical_hours: 0,
    self_study_hours: 3,
    days: [] as string[],
    start_time: '09:00',
    end_time: '10:00',
    semester: 'Fall 2024',
    max_students: 30,
    room_number: ''
  });

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.days.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one day",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('courses')
      .insert({
        code: formData.code,
        name: formData.name,
        description: formData.description,
        credits: formData.credits,
        lecture_hours: formData.lecture_hours,
        tutorial_hours: formData.tutorial_hours,
        practical_hours: formData.practical_hours,
        self_study_hours: formData.self_study_hours,
        days: formData.days,
        start_time: formData.start_time,
        end_time: formData.end_time,
        semester: formData.semester,
        max_students: formData.max_students,
        room_number: formData.room_number,
        instructor_id: userId
      });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Course created successfully",
    });

    // Reset form
    setFormData({
      code: '',
      name: '',
      description: '',
      credits: 3,
      lecture_hours: 3,
      tutorial_hours: 0,
      practical_hours: 0,
      self_study_hours: 3,
      days: [],
      start_time: '09:00',
      end_time: '10:00',
      semester: 'Fall 2024',
      max_students: 30,
      room_number: ''
    });
    setShowForm(false);
    onCourseCreated();
  };

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Create New Course
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Create New Course
        </CardTitle>
        <CardDescription>Add a new course to the system</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Course Code *</Label>
              <Input
                id="code"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="CS101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Course Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Introduction to Computer Science"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Course description..."
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                max="10"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lecture_hours">Lecture (L)</Label>
              <Input
                id="lecture_hours"
                type="number"
                min="0"
                value={formData.lecture_hours}
                onChange={(e) => setFormData({ ...formData, lecture_hours: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tutorial_hours">Tutorial (T)</Label>
              <Input
                id="tutorial_hours"
                type="number"
                min="0"
                value={formData.tutorial_hours}
                onChange={(e) => setFormData({ ...formData, tutorial_hours: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="practical_hours">Practical (P)</Label>
              <Input
                id="practical_hours"
                type="number"
                min="0"
                value={formData.practical_hours}
                onChange={(e) => setFormData({ ...formData, practical_hours: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="self_study_hours">Self Study (S)</Label>
              <Input
                id="self_study_hours"
                type="number"
                min="0"
                value={formData.self_study_hours}
                onChange={(e) => setFormData({ ...formData, self_study_hours: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_students">Max Students</Label>
              <Input
                id="max_students"
                type="number"
                min="1"
                value={formData.max_students}
                onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Days *</Label>
            <div className="flex flex-wrap gap-4">
              {DAYS_OPTIONS.map(day => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={formData.days.includes(day)}
                    onCheckedChange={() => handleDayToggle(day)}
                  />
                  <label htmlFor={day} className="text-sm cursor-pointer">
                    {day}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room_number">Room Number</Label>
              <Input
                id="room_number"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                placeholder="A-101"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="semester">Semester</Label>
            <select
              id="semester"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              {SEMESTERS.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Course"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CourseCreateForm;
