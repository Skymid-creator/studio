self.addEventListener('notificationclick', event => {
  event.notification.close();

  const action = event.action;
  
  if (action === 'focused' || action === 'distracted') {
    // Send a message to the client(s)
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      if (clients && clients.length) {
        clients.forEach(client => {
          client.postMessage({
            type: 'notification-action',
            action: action,
          });
        });
      }
    });
  } else {
    // If no action, or a different action, just focus the client
     self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      if (clients && clients.length) {
        clients[0].focus();
      }
    });
  }
});

self.addEventListener('notificationclose', event => {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      if (clients && clients.length) {
        clients.forEach(client => {
          client.postMessage({
            type: 'notification-closed',
          });
        });
      }
    });
});
