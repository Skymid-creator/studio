
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'show-notification') {
    const { silent } = event.data.options;
    self.registration.showNotification('Are you focusing?', {
      body: 'Stay on task!',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: silent ? [] : [200, 100, 200],
      silent: silent,
      requireInteraction: true,
      tag: 'focus-prompt-notification',
      renotify: true,
      actions: [
        { action: 'focused', title: 'Yes, I am!' },
        { action: 'distracted', title: 'Got distracted' },
      ],
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action || 'closed'; 
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    if (clients && clients.length) {
      clients[0].postMessage({ type: 'notification-action', action: action });
    }
  });
});

self.addEventListener('notificationclose', (event) => {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        if (clients && clients.length) {
            clients[0].postMessage({ type: 'notification-action', action: 'closed' });
        }
    });
});
