// This forces the service worker to activate immediately.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  // This claims control over all clients (tabs) of the app.
  event.waitUntil(self.clients.claim());
});

// This is the main listener for clicks on the notification buttons.
self.addEventListener('notificationclick', (event) => {
  // The 'action' is the ID we gave to the button ('focused' or 'distracted').
  const action = event.action;

  // We must close the notification manually.
  event.notification.close();

  // Find all the open windows/tabs for our app.
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Find the first visible client.
      const client = clientList.find(c => c.visibilityState === 'visible');

      if (client) {
        // If we found a client, send it a message with the action that was clicked.
        client.postMessage({
          type: 'notification-action',
          action: action || 'closed', // Send 'closed' if they dismissed without a button.
        });
        // Bring the tab into focus.
        return client.focus();
      }
    })
  );
});
