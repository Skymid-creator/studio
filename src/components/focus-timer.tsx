
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from "@/hooks/use-toast";
import { Bell, Play, Pause, BarChart2, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function FocusTimer() {
  const [intervalMinutes, setIntervalMinutes] = useState<number>(2);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [isSilent, setIsSilent] = useState<boolean>(false);
  const [stats, setStats] = useState({ prompts: 0, focused: 0, distracted: 0 });
  const [isAwaitingResponse, setIsAwaitingResponse] = useState<boolean>(false);

  const { toast } = useToast();
  const timerId = useRef<NodeJS.Timeout | null>(null);

  // Using refs for callbacks and state values that are used inside setInterval
  // This prevents the useEffect that manages the timer from re-running unnecessarily
  const intervalRef = useRef(intervalMinutes);
  useEffect(() => { intervalRef.current = intervalMinutes }, [intervalMinutes]);

  const showNotificationRef = useRef(() => {});

  const handleFocusResponse = useCallback((type: 'focused' | 'distracted' | 'closed') => {
      setIsAwaitingResponse(false); // Always reset awaiting state
      if (type === 'focused') {
        setStats(s => ({ ...s, focused: s.focused + 1 }));
        toast({
            title: "Great job!",
            description: "Focus session logged.",
        });
      } else if (type === 'distracted') {
        setStats(s => ({ ...s, distracted: s.distracted + 1 }));
        toast({
            title: "It's okay!",
            description: "Distraction logged. You can get back on track!",
        });
      }
      // 'closed' action does not show a toast, just resets the UI.
  }, [toast]);

  const focusResponseHandlerRef = useRef(handleFocusResponse);
  useEffect(() => {
    focusResponseHandlerRef.current = handleFocusResponse;
  }, [handleFocusResponse]);


  // This effect runs only once to set up the service worker and its message listener.
  // This is critical to prevent accumulating listeners.
  useEffect(() => {
    if (!('serviceWorker' in navigator && 'Notification' in window)) {
        toast({ title: 'Unsupported', description: 'Service Worker or Notifications not supported in this browser.', variant: 'destructive'});
        return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered with scope:', registration.scope);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        toast({ title: 'Service Worker Failed', description: 'Could not register the service worker.', variant: 'destructive'});
      }
    };
    registerServiceWorker();

    setNotificationPermission(Notification.permission);
    
    const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'notification-action') {
            const { action } = event.data;
            if (['focused', 'distracted', 'closed'].includes(action)) {
                focusResponseHandlerRef.current(action as 'focused' | 'distracted' | 'closed');
            }
        }
    };
    
    navigator.serviceWorker.addEventListener('message', handleMessage);

    // The cleanup function is critical and will now be called correctly.
    return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [toast]); // Depends on toast to satisfy the linter, but it's stable.


  const showNotification = useCallback(() => {
    if (notificationPermission !== 'granted') {
      console.warn("Notification permission not granted.");
      return;
    }
    
    navigator.serviceWorker.ready.then(registration => {
      if (!registration.active) {
        console.warn("Service worker is not active.");
        return;
      }
      registration.active.postMessage({ type: 'show-notification', options: { silent: isSilent } });
      setStats(s => ({ ...s, prompts: s.prompts + 1 }));
      setIsAwaitingResponse(true);
    }).catch(error => {
      console.error("Service worker ready error:", error);
    });
  }, [notificationPermission, isSilent]);
  
  showNotificationRef.current = showNotification;

  // This effect manages the timer. It ONLY depends on `isTimerRunning`.
  // This is the key to fixing the multiple timer bug.
  useEffect(() => {
    if (isTimerRunning) {
      // Start timer
      const initialTime = intervalRef.current * 60;
      setTimeLeft(initialTime);

      timerId.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            showNotificationRef.current();
            return intervalRef.current * 60; // Reset for next interval
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      // Stop timer
      if (timerId.current) {
        clearInterval(timerId.current);
        timerId.current = null;
      }
      setTimeLeft(0);
    }
  
    // Cleanup on unmount or when isTimerRunning changes
    return () => {
      if (timerId.current) {
        clearInterval(timerId.current);
      }
    };
  }, [isTimerRunning]);


  const handleRequestPermission = useCallback(() => {
    if (!('Notification' in window)) return;
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
          description: 'You must enable notifications in browser settings.',
          variant: 'destructive',
        });
      }
    });
  }, [toast]);

  const handleStartStopTimer = () => {
    if (notificationPermission !== 'granted') {
      handleRequestPermission();
      // Do not start the timer if permission is not granted.
      // The user must click start again after granting permission.
      return;
    }
    setIsTimerRunning(prev => !prev);
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
    <>
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
            <div className="p-4 bg-green-500/20 text-green-800 dark:bg-green-500/10 dark:text-green-400 rounded-lg border border-green-500/30">
              <p className="text-4xl font-bold">{stats.focused}</p>
              <p className="text-sm font-medium">Times Focused</p>
            </div>
            <div className="p-4 bg-red-500/20 text-red-800 dark:bg-red-500/10 dark:text-red-400 rounded-lg border border-red-500/30">
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
    </>
  );
}
