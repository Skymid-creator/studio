self.addEventListener('message', event => {
  if (event.data && event.data.type === 'show-notification') {
    const { options } = event.data;
    self.registration.showNotification(options.title, {
      body: options.body,
      icon: '/icons/icon-192x192.png',
      actions: [
        { action: 'focused', title: 'Yes, I was focusing!' },
        { action: 'distracted', title: 'No, I got distracted.' }
      ],
      tag: 'focus-prompt-notification',
      renotify: true, // This makes it re-alert the user
      silent: options.silent,
      requireInteraction: true // This keeps it on screen
    });
  }
});


self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    const action = event.action;

    if (action === 'focused' || action === 'distracted') {
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
            if (clients && clients.length) {
                clients[0].postMessage({ type: 'notification-action', action: action });
                clients[0].focus();
            }
        });
    } else {
        // This handles clicks on the notification body itself or closing it
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
            if (clients && clients.length) {
                clients[0].postMessage({ type: 'notification-action', action: 'closed' });
                clients[0].focus();
            }
        });
    }
});

self.addEventListener('notificationclose', function(event) {
    // This event is fired when the user dismisses the notification
    // without clicking an action button (e.g., by clicking the 'x').
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        if (clients && clients.length) {
            clients[0].postMessage({ type: 'notification-action', action: 'closed' });
        }
    });
});
