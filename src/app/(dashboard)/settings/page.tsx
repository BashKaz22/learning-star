import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Customize your learning experience
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teaching Style</CardTitle>
          <CardDescription>How should AI explain concepts to you?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col">
              <span className="font-medium">Rigorous</span>
              <span className="text-xs text-muted-foreground">Academic, precise</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col">
              <span className="font-medium">Fun</span>
              <span className="text-xs text-muted-foreground">Casual, relatable</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col">
              <span className="font-medium">ELI5</span>
              <span className="text-xs text-muted-foreground">Maximum simplicity</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col">
              <span className="font-medium">Progressive</span>
              <span className="text-xs text-muted-foreground">Build complexity</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>UI Theme</CardTitle>
          <CardDescription>Choose your visual style</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col">
              <span className="font-medium">Neobrutalism</span>
              <span className="text-xs text-muted-foreground">Bold, raw aesthetic</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col">
              <span className="font-medium">Glassmorphism</span>
              <span className="text-xs text-muted-foreground">Frosted glass</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col">
              <span className="font-medium">Retro</span>
              <span className="text-xs text-muted-foreground">Nostalgic vibe</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col">
              <span className="font-medium">Terminal</span>
              <span className="text-xs text-muted-foreground">Developer-friendly</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Length</CardTitle>
          <CardDescription>Preferred study session duration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline">15 min</Button>
            <Button variant="outline">25 min</Button>
            <Button variant="outline">45 min</Button>
            <Button variant="outline">60 min</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
