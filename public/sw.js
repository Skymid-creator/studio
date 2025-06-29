
self.addEventListener('install', (event) => {
  // Ensures the new service worker activates immediately
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  // Takes control of all open pages
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  const action = event.action || 'clicked'; // 'clicked' if body is clicked

  // Close the notification
  event.notification.close();

  // Send the action to all open client windows
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus the first available client, which brings the app to the front
        if (clientList.length > 0) {
          clientList[0].focus();
        }

        // Post message to all clients
        clientList.forEach((client) => {
          client.postMessage({
            type: 'notification-action',
            action: action,
          });
        });
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  // Fired when the notification is dismissed by the user (not clicked)
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'notification-action',
            action: 'dismissed', // Let the app know it was closed
          });
        });
      })
  );
});
