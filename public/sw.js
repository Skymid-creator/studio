self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'show-notification') {
        const options = {
            body: 'Just checking in to see if you are on task.',
            icon: '/icon-192x192.png',
            badge: '/icon-96x96.png',
            vibrate: [200, 100, 200],
            actions: [
                { action: 'focused', title: '✅ Yes, I am!' },
                { action: 'distracted', title: '❌ Got distracted' }
            ],
            tag: 'focus-prompt-notification',
            renotify: true,
            silent: event.data.options.silent || false
        };

        event.waitUntil(
            self.registration.showNotification("Are you focusing?", options)
        );
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const action = event.action;

    if (action === 'focused' || action === 'distracted') {
        // Find the client that opened the notification and focus it.
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            if (clients && clients.length > 0) {
                 // Focus the first client.
                if (clients[0].focus) {
                    clients[0].focus();
                }
                // Post message to all clients.
                clients.forEach(client => {
                     client.postMessage({ type: 'notification-action', action: action });
                });
            }
        });
    }
});

self.addEventListener('notificationclose', (event) => {
    // Let the client know the notification was dismissed without action
     self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        if (clients && clients.length > 0) {
             clients.forEach(client => {
                client.postMessage({ type: 'notification-action', action: 'closed' });
            });
        }
    });
});
