import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">
              Learning Star
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Transform any educational content into personalized, interactive learning experiences powered by AI.
            </p>
          </div>

          <div className="flex gap-4">
            <Link href="/courses">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/docs">
              <Button variant="outline" size="lg">Learn More</Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle>Upload Anything</CardTitle>
                <CardDescription>
                  PDFs, slides, videos, audio - we handle it all
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Upload your course materials and let our AI agents transform them into engaging lessons.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Tutoring</CardTitle>
                <CardDescription>
                  Patient, personalized guidance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get help from AI tutors that adapt to your learning style and pace.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Track Progress</CardTitle>
                <CardDescription>
                  Smart review scheduling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Spaced repetition and mastery tracking ensure long-term retention.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
