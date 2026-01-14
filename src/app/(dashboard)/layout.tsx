import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Learning Star
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/courses" className="text-sm hover:text-primary">
              Courses
            </Link>
            <Link href="/progress" className="text-sm hover:text-primary">
              Progress
            </Link>
            <Link href="/schedule" className="text-sm hover:text-primary">
              Schedule
            </Link>
            <Link href="/settings" className="text-sm hover:text-primary">
              Settings
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
