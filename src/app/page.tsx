'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Bell, Play, Pause, BarChart2, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function Home() {
  const [intervalMinutes, setIntervalMinutes] = useState<number>(1);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [stats, setStats] = useState({ prompts: 0, focused: 0, distracted: 0 });
  const [isAwaitingResponse, setIsAwaitingResponse] = useState<boolean>(false);

  const { toast } = useToast();
  const timerId = useRef<NodeJS.Timeout | null>(null);

  const handleFocusResponse = useCallback((type: 'focused' | 'distracted' | 'closed') => {
      if(type === 'focused') {
        setStats(s => ({ ...s, focused: s.focused + 1 }));
        toast({
            title: "Great job!",
            description: "Focus session logged.",
        });
      } else if (type === 'distracted'){
        setStats(s => ({ ...s, distracted: s.distracted + 1 }));
        toast({
            title: "It's okay!",
            description: "Distraction logged. You can get back on track!",
        });
      }
      setIsAwaitingResponse(false);
  }, [toast]);
  
  const showNotification = useCallback(() => {
    if (notificationPermission !== 'granted' || !('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return;
    }
    // Important: Wait for the service worker to be ready before posting a message.
    navigator.serviceWorker.ready.then(registration => {
      registration.active?.postMessage({ type: 'SHOW_NOTIFICATION' });
      setStats((s) => ({ ...s, prompts: s.prompts + 1 }));
      setIsAwaitingResponse(true);
    });
  }, [notificationPermission]);
  
  useEffect(() => {
    if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
    }

    const registerServiceWorker = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                await registration.update(); // Check for updates.
                
                const handleMessage = (event: MessageEvent) => {
                    if (event.data?.type === 'notification-action') {
                        const { action } = event.data;
                        if (action === 'focused' || action === 'distracted' || action === 'closed') {
                          handleFocusResponse(action as 'focused' | 'distracted' | 'closed');
                        }
                    }
                };
                
                navigator.serviceWorker.addEventListener('message', handleMessage);
                
                return () => {
                    navigator.serviceWorker.removeEventListener('message', handleMessage);
                };

            } catch (error) {
                console.error('Service Worker registration failed:', error);
                toast({
                    title: 'App Error',
                    description: 'Could not initialize a required component. Notifications may not work.',
                    variant: 'destructive',
                });
            }
        }
    };

    const cleanupPromise = registerServiceWorker();
    
    return () => {
        cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [handleFocusResponse, toast]);


  useEffect(() => {
    const stopTimer = () => {
      if (timerId.current) {
        clearInterval(timerId.current);
        timerId.current = null;
      }
    };

    if (isTimerRunning) {
      // Set initial time and start the timer immediately
      setTimeLeft(intervalMinutes * 60);

      timerId.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            showNotification();
            // Reset for the next interval
            return intervalMinutes * 60;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      stopTimer();
      setTimeLeft(0);
    }

    return stopTimer;
  }, [isTimerRunning, intervalMinutes, showNotification]);

  const handleRequestPermission = () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Error',
        description: 'This browser does not support desktop notifications.',
        variant: 'destructive',
      });
      return;
    }
    Notification.requestPermission().then(permission => {
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast({
          title: 'Success!',
          description: 'You will now receive focus notifications.',
        });
      } else if (permission === 'denied') {
        toast({
          title: 'Permission Denied',
          description: 'You have denied notification permissions. Please enable them in your browser settings to use the app.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleStartStopTimer = () => {
    if (notificationPermission !== 'granted') {
      handleRequestPermission();
      return;
    }
    setIsTimerRunning(!isTimerRunning);
  };
  
  const onPageFocusResponse = (type: 'focused' | 'distracted') => {
      handleFocusResponse(type);
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <main className="w-full max-w-2xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground tracking-tight">FocusPrompt</h1>
          <p className="text-muted-foreground text-lg">Your personal coach for staying on task and improving productivity.</p>
        </header>

        <Card className="w-full shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell /> Focus Timer</CardTitle>
            <CardDescription>Set how often you want to be prompted to check your focus.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {notificationPermission !== 'granted' ? (
              <div className="flex flex-col items-center justify-center p-6 bg-secondary rounded-lg text-center space-y-4">
                <p className="text-secondary-foreground">Please enable notifications to use the timer.</p>
                <Button onClick={handleRequestPermission}>Enable Notifications</Button>
              </div>
            ) : (
              <div className="space-y-4">
                 <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 w-full space-y-2">
                        <Label htmlFor="interval">Prompt Interval (minutes)</Label>
                        <Input id="interval" type="number" value={intervalMinutes} onChange={e => setIntervalMinutes(Math.max(1, parseInt(e.target.value, 10)) || 1)} min="1" disabled={isTimerRunning} />
                    </div>
                    <Button size="lg" onClick={handleStartStopTimer} className="w-full sm:w-auto mt-2 sm:mt-0 self-end">
                        {isTimerRunning ? <><Pause className="mr-2 h-4 w-4" /> Stop</> : <><Play className="mr-2 h-4 w-4" /> Start</>}
                    </Button>
                </div>
                {isTimerRunning && (
                  <div className="text-center pt-4 transition-opacity duration-300 animate-in fade-in">
                    <p className="text-sm text-muted-foreground">Next prompt in:</p>
                    <p className="text-4xl font-bold font-mono tracking-wider text-primary">{formatTime(timeLeft)}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart2 /> Focus Stats</CardTitle>
            <CardDescription>Track your focus sessions. {stats.prompts > 0 ? `Total prompts sent: ${stats.prompts}` : 'Start the timer to begin tracking.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-green-500 text-white rounded-lg">
                <p className="text-4xl font-bold">{stats.focused}</p>
                <p className="text-sm font-medium">Times Focused</p>
              </div>
              <div className="p-4 bg-red-500 text-white rounded-lg">
                <p className="text-4xl font-bold">{stats.distracted}</p>
                <p className="text-sm font-medium">Times Distracted</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={() => onPageFocusResponse('focused')} disabled={!isAwaitingResponse}>
                  <ThumbsUp className="mr-2 h-4 w-4" /> I was focused
              </Button>
              <Button variant="outline" onClick={() => onPageFocusResponse('distracted')} disabled={!isAwaitingResponse}>
                  <ThumbsDown className="mr-2 h-4 w-4" /> I got distracted
              </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
