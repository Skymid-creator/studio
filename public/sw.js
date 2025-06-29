// This is the service worker script, which executes in a separate background thread.

// Wait for the service worker to be installed and activated.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Handle the 'message' event from the main page
self.addEventListener('message', event => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification('Focus Check', {
      body: 'Are you staying on task?',
      actions: [
        { action: 'focused', title: 'I was focused' },
        { action: 'distracted', title: 'I got distracted' },
      ],
    });
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  const action = event.action || 'closed';
  event.notification.close();

  // Find the client window and send a message
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // If a client window is open, focus it and send a message
      if (clientList.length > 0) {
        const client = clientList[0];
        client.postMessage({ type: 'notification-action', action });
        return client.focus();
      }
      // If no client is open, open a new one
      return self.clients.openWindow('/');
    })
  );
});
