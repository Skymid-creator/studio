
'use strict';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const options = {
      body: 'Were you focused or did you get distracted?',
      actions: [
        { action: 'focused', title: 'I was focused' },
        { action: 'distracted', title: 'I got distracted' },
      ],
      tag: 'focus-prompt',
      renotify: true,
    };
    event.waitUntil(self.registration.showNotification('Focus Check', options));
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const action = event.action || 'closed';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        const client = clientList[0];
        client.postMessage({ type: 'notification-action', action });
        return client.focus();
      }
    })
  );
});

self.addEventListener('notificationclose', event => {
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) {
                clientList[0].postMessage({ type: 'notification-action', action: 'closed' });
            }
        })
    );
});
