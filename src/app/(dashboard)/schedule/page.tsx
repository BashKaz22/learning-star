import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SchedulePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Study Schedule</h1>
        <p className="text-muted-foreground">
          Your personalized review plan
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Tasks</CardTitle>
            <CardDescription>Items due for review today</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              No reviews scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
            <CardDescription>Reviews scheduled this week</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              No upcoming reviews
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
