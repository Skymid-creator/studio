
'use strict';

// The service worker file.

// On install, skip waiting and immediately activate.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// On activate, claim all clients.
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for notification clicks.
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;

  // Close the notification
  notification.close();

  const promise = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    // Find a client to send the message to.
    let client = null;
    for (const c of clients) {
      if (c.url.endsWith('/') && 'focus' in c) {
        client = c;
        break;
      }
    }
    if (!client) return;

    // Send the action to the client.
    if (action === 'focused' || action === 'distracted') {
      client.postMessage({
        type: 'notification-action',
        action: action,
      });
    }

    // Focus the client.
    return client.focus();
  });

  event.waitUntil(promise);
});

// Listen for notification close events (user dismisses it).
self.addEventListener('notificationclose', (event) => {
    const promise = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        if (clients && clients.length > 0) {
            // Send a message to the client that the notification was closed
             clients[0].postMessage({
                type: 'notification-action',
                action: 'closed',
            });
        }
    });
    event.waitUntil(promise);
});
