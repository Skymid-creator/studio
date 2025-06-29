import FocusTimer from '@/components/focus-timer';

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <main className="w-full max-w-2xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground tracking-tight">FocusPrompt</h1>
          <p className="text-muted-foreground text-lg">Your personal coach for staying on task and improving productivity.</p>
        </header>

        <FocusTimer />
        
      </main>
    </div>
  );
}
