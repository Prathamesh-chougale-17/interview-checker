import { Briefcase } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="py-6 px-4 md:px-8 border-b">
      <div className="container mx-auto flex items-center gap-3">
        <Briefcase className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">
          Resume Interview Ace
        </h1>
      </div>
    </header>
  );
}
