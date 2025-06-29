
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from "@/hooks/use-toast";
import { generateFocusTip } from '@/ai/flows/generate-focus-tip';
import { Bell, Play, Pause, BarChart2, Lightbulb, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';

export default function Home() {
  const [intervalMinutes, setIntervalMinutes] = useState<number>(1);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [isSilent, setIsSilent] = useState<boolean>(false);
  const [stats, setStats] = useState({ prompts: 0, focused: 0, distracted: 0 });
  const [userPreferences, setUserPreferences] = useState<string>('');
  const [pastTips, setPastTips] = useState<string[]>([]);
  const [focusTip, setFocusTip] = useState<string>('');
  const [isLoadingTip, setIsLoadingTip] = useState<boolean>(false);
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
    if (notificationPermission !== 'granted' || !('serviceWorker' in navigator)) {
      return;
    }
    navigator.serviceWorker.ready.then((registration) => {
      if(registration.active) {
        registration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          silent: isSilent,
        });
        setStats((s) => ({ ...s, prompts: s.prompts + 1 }));
        setIsAwaitingResponse(true);
      }
    });
  }, [notificationPermission, isSilent]);
  
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'notification-action') {
        const { action } = event.data;
        if (action === 'focused' || action === 'distracted' || action === 'closed') {
          handleFocusResponse(action as 'focused' | 'distracted' | 'closed');
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(error => {
        console.error('Service Worker registration failed:', error);
        toast({
          title: 'App Error',
          description: 'Could not initialize a required component. Notifications may not work.',
          variant: 'destructive',
        });
      });
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
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
      setTimeLeft(intervalMinutes * 60);

      timerId.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            showNotification();
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

  const handleGetFocusTip = async () => {
    setIsLoadingTip(true);
    setFocusTip('');
    try {
      const result = await generateFocusTip({
        userPreferences: userPreferences || 'general productivity and well-being',
        pastResponses: pastTips.join('\n'),
      });
      const newTip = result.focusTip;
      setFocusTip(newTip);
      setPastTips(prev => [...prev.slice(-5), newTip]);
    } catch (error) {
      console.error('Error generating focus tip:', error);
      toast({
        title: 'AI Tip Generation Failed',
        description: 'Could not generate a focus tip. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTip(false);
    }
  };

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
                <div className="flex items-center space-x-2 pt-2">
                    <Switch id="silent-mode" checked={isSilent} onCheckedChange={setIsSilent} aria-label="Silent notifications" />
                    <Label htmlFor="silent-mode">Silent notifications</Label>
                </div>
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
        
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles /> AI-Powered Focus Tips</CardTitle>
            <CardDescription>Get personalized tips to help you stay sharp and productive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="preferences">Your Preferences (optional)</Label>
              <Textarea id="preferences" placeholder="e.g., 'I prefer short breaks', 'interested in mindfulness', 'struggle with digital distractions'" value={userPreferences} onChange={e => setUserPreferences(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">Tell the AI what you like for better tips.</p>
            </div>
            <Button onClick={handleGetFocusTip} disabled={isLoadingTip} className="w-full">
              <Lightbulb className="mr-2 h-4 w-4" /> {isLoadingTip ? 'Generating...' : 'Get a New Tip'}
            </Button>
            {isLoadingTip && (
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            )}
            {focusTip && !isLoadingTip && (
              <div className="p-4 bg-secondary rounded-lg border">
                <p className="text-secondary-foreground animate-in fade-in-50">{focusTip}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
