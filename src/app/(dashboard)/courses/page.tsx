import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CoursesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">
            Manage your learning materials
          </p>
        </div>
        <Button>Create Course</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-dashed border-2 flex items-center justify-center min-h-[200px]">
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">No courses yet</p>
            <Button variant="outline">Create your first course</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
