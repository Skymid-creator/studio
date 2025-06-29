self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'show-notification') {
    const { options } = event.data;
    const title = "Focus Check!";
    const body = "Are you still on task?";
    const notificationOptions = {
      body: body,
      icon: '/logo.png',
      badge: '/logo.png',
      actions: [
        { action: 'focused', title: '✅ I was focused' },
        { action: 'distracted', title: '❌ I got distracted' },
      ],
      silent: options.silent || false,
      requireInteraction: true,
      tag: 'focus-prompt-notification'
    };

    event.waitUntil(
      self.registration.showNotification(title, notificationOptions)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;

  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    if (clientList.length > 0) {
      const client = clientList[0];
      client.postMessage({
        type: 'notification-action',
        action: action || 'closed'
      });
      client.focus();
    }
  });
});

self.addEventListener('notificationclose', (event) => {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
            const client = clientList[0];
            client.postMessage({
                type: 'notification-action',
                action: 'closed'
            });
        }
    });
});
