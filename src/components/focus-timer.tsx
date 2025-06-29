'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from "@/hooks/use-toast";
import { Bell, Play, Pause, BarChart2 } from 'lucide-react';

export default function FocusTimer() {
  const [intervalMinutes, setIntervalMinutes] = useState<number>(2);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [isSilent, setIsSilent] = useState<boolean>(false);
  const [stats, setStats] = useState({ prompts: 0, focused: 0, distracted: 0 });

  const { toast } = useToast();
  const timerId = useRef<NodeJS.Timeout | null>(null);

  // Use refs to hold the latest state and functions to avoid stale closures in intervals
  const intervalRef = useRef(intervalMinutes);
  useEffect(() => { intervalRef.current = intervalMinutes }, [intervalMinutes]);

  const showNotificationRef = useRef(() => {});
  const focusResponseHandlerRef = useRef((type: 'focused' | 'distracted' | 'closed') => {});

  const handleFocusResponse = useCallback((type: 'focused' | 'distracted' | 'closed') => {
      if (type === 'focused') {
        setStats(s => ({ ...s, focused: s.focused + 1 }));
        toast({ title: "Great job!", description: "Focus session logged." });
      } else if (type === 'distracted') {
        setStats(s => ({ ...s, distracted: s.distracted + 1 }));
        toast({ title: "It's okay!", description: "Distraction logged. You can get back on track!" });
      }
      // No need to handle 'closed' as the timer loop is now independent
  }, [toast]);

  // Assign the latest handler to the ref
  useEffect(() => {
    focusResponseHandlerRef.current = handleFocusResponse;
  }, [handleFocusResponse]);

  // Effect for Service Worker registration and message handling
  useEffect(() => {
    if (!('serviceWorker' in navigator && 'Notification' in window)) {
        toast({ title: 'Unsupported', description: 'Service Worker or Notifications not supported in this browser.', variant: 'destructive'});
        return;
    }

    // This function is now outside the effect's async callback
    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        toast({ title: 'Service Worker Failed', description: 'Could not register the service worker.', variant: 'destructive'});
      }
    };

    // Call the registration function
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

    // The cleanup function is now in the main body of the effect
    return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [toast]);

  // Effect for creating the notification
  const showNotification = useCallback(() => {
    if (notificationPermission !== 'granted' || !navigator.serviceWorker.ready) {
      return;
    }
    
    // We send a message to the service worker to show the notification
    navigator.serviceWorker.ready.then(registration => {
      // The new service worker doesn't need to be pushed to, it listens for messages
      registration.active?.postMessage({
        type: 'show-notification',
        options: {
          title: 'Focus Check!',
          body: 'Are you still on task?',
          silent: isSilent,
        }
      });
      setStats(s => ({ ...s, prompts: s.prompts + 1 }));
    });
  }, [notificationPermission, isSilent]);
  
  // Assign the latest showNotification function to its ref
  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, [showNotification]);


  // Main timer loop effect
  useEffect(() => {
    // Clear any existing timer when isTimerRunning changes
    if (timerId.current) {
        clearInterval(timerId.current);
        timerId.current = null;
    }

    if (isTimerRunning) {
      const initialTime = intervalRef.current * 60;
      setTimeLeft(initialTime);

      // Start a new timer
      timerId.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            showNotificationRef.current();
            // Reset timer for the next interval
            return intervalRef.current * 60;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      setTimeLeft(0);
    }
  
    // Cleanup function to clear the interval when the component unmounts or isTimerRunning becomes false
    return () => {
      if (timerId.current) {
        clearInterval(timerId.current);
        timerId.current = null;
      }
    };
  }, [isTimerRunning]); // This effect ONLY re-runs when isTimerRunning changes


  const handleRequestPermission = useCallback(() => {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then(permission => {
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast({ title: 'Success!', description: 'You will now receive focus notifications.' });
      } else if (permission === 'denied') {
        toast({ title: 'Permission Denied', description: 'You must enable notifications in browser settings.', variant: 'destructive' });
      }
    });
  }, [toast]);

  const handleStartStopTimer = () => {
    if (notificationPermission !== 'granted') {
      handleRequestPermission();
      return;
    }
    setIsTimerRunning(prev => !prev);
  };
  
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
      </Card>
    </>
  );
}
