self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'show-notification') {
    const options = event.data.options || {};
    showFocusNotification(options.silent);
  }
});

function showFocusNotification(silent = false) {
  const notificationOptions = {
    body: 'How is your focus? Let us know.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    actions: [
      { action: 'focused', title: 'I was focused' },
      { action: 'distracted', title: 'I got distracted' },
    ],
    tag: 'focus-prompt-notification',
    requireInteraction: true,
    silent: silent
  };

  self.registration.showNotification('Focus Check', notificationOptions)
    .catch(err => console.error('Notification error:', err));
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;

  if (action === 'focused' || action === 'distracted') {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients && clients.length) {
        clients[0].postMessage({ type: 'notification-action', action: action });
        clients[0].focus();
      }
    });
  }
});

self.addEventListener('notificationclose', (event) => {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients && clients.length > 0) {
        clients[0].postMessage({ type: 'notification-action', action: 'closed' });
      }
    });
});
