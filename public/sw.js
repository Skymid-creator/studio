// This file is intentionally left in the public directory.
// Service workers must be served from the root of the scope they control.

// On install, activate immediately.
self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

// On activate, take control of all clients.
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Listen for messages from the client (the web page).
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'show-notification') {
        const { options } = event.data;
        // Display the notification.
        self.registration.showNotification('Are you focusing?', {
            body: 'Click an option to log your status.',
            icon: '/logo.png',
            actions: [
                { action: 'focused', title: 'Yes, I was focusing!' },
                { action: 'distracted', title: 'No, I got distracted.' }
            ],
            tag: 'focus-prompt-notification', // A unique tag prevents duplicate notifications.
            renotify: true, // Vibrate/make sound for new notifications that replace old ones.
            requireInteraction: true, // Prevent the OS from auto-closing the notification.
            silent: options.silent // Option to disable sound/vibration.
        });
    }
});

// Handle clicks on the notification.
self.addEventListener('notificationclick', (event) => {
    
    // Only close the notification and send a message if an ACTION BUTTON was clicked.
    // Clicks on the notification body itself are ignored by this logic,
    // allowing the OS to handle it (e.g., by focusing the app window).
    if (event.action) {
        event.notification.close();

        // Send the action back to all open client windows.
        self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clients) => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'notification-action',
                    action: event.action
                });
            });
        });
    }
});

// Handle when the user dismisses the notification via the OS (e.g., clicking the 'X').
self.addEventListener('notificationclose', (event) => {
    // Send a 'closed' message back to the app so it knows the user dismissed it.
    self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((clients) => {
        clients.forEach(client => {
            client.postMessage({
                type: 'notification-action',
                action: 'closed'
            });
        });
    });
});
