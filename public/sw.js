
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients && clients.length) {
        // Find the first visible client
        const visibleClient = clients.find(c => c.visibilityState === 'visible');
        const targetClient = visibleClient || clients[0];

        // Post the message
        targetClient.postMessage({
            type: 'notification-action',
            action: action || 'clicked', // 'clicked' if no button action
        });
        
        // Focus the client
        return targetClient.focus();
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        if (clients && clients.length) {
            const visibleClient = clients.find(c => c.visibilityState === 'visible');
            const targetClient = visibleClient || clients[0];
            targetClient.postMessage({ type: 'notification-closed' });
        }
      })
    );
});
