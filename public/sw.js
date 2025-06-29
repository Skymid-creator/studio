self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  const action = event.action;

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const client = clientList.find(c => c.visibilityState === 'visible') || clientList[0];
      
      if (client) {
        client.postMessage({ type: 'notification-action', action });
        client.focus();
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const client = clientList.find(c => c.visibilityState === 'visible') || clientList[0];
      if (client) {
        client.postMessage({ type: 'notification-action', action: 'closed' });
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { options } = event.data;
    event.waitUntil(
      self.registration.showNotification('FocusPrompt', options)
    );
  }
});
