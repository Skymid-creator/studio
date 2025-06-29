
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;

  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    if (clients && clients.length) {
      clients.forEach(client => {
        client.postMessage({
          type: 'notification-action',
          action: action
        });
      })
    }
  });
});

self.addEventListener('notificationclose', (event) => {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        if (clients && clients.length) {
          clients.forEach(client => {
            client.postMessage({
                type: 'notification-closed'
            });
          });
        }
    });
});
