// Immediately take control of the page, even if there's an old service worker running.
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Become the active service worker for all clients.
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle clicks on notification buttons.
self.addEventListener('notificationclick', (event) => {
  // Close the notification once a button is clicked.
  event.notification.close();

  // Send a message to the app to update the stats.
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    if (clients && clients.length) {
      clients.forEach(client => {
        // Post a message with the action ('focused' or 'distracted').
        client.postMessage({ type: 'notification-action', action: event.action });
      });
    }
  });
}, false);

// Handle the user dismissing the notification without clicking a button.
self.addEventListener('notificationclose', () => {
  // Send a message to the app to re-enable the UI buttons.
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    if (clients && clients.length) {
      clients.forEach(client => {
        client.postMessage({ type: 'notification-closed' });
      });
    }
  });
}, false);
