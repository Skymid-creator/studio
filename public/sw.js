self.addEventListener('notificationclick', function(event) {
  const clickedNotification = event.notification;
  clickedNotification.close();

  const action = event.action;

  // Attempt to focus the client window.
  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then(function(clientList) {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );

  if (action) {
    // Send a message to the client.
    self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(function(clientList) {
      for (const client of clientList) {
        client.postMessage({
          type: 'notification-action',
          action: action
        });
      }
    });
  }
});

self.addEventListener('notificationclose', function(event) {
  self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
    clientList.forEach(client => {
      client.postMessage({ type: 'notification-closed' });
    });
  });
});
