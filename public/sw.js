self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'show-notification') {
    const options = event.data.options || {};
    self.registration.showNotification('Focus Check', {
      body: 'Are you still focused on your task?',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      tag: 'focus-prompt-notification',
      requireInteraction: true,
      silent: options.silent || false,
      actions: [
        { action: 'focused', title: '👍 I was focused' },
        { action: 'distracted', title: '👎 I got distracted' },
      ],
    });
  }
});

// Handles clicks on the notification action buttons OR the notification body
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // If user clicks body, event.action is '', which we treat as 'closed'
  const action = event.action || 'closed'; 

  // Always message the client to update its state
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    if (clientList.length > 0) {
      clientList[0].postMessage({
        type: 'notification-action',
        action: action,
      });
    }
  });
});

// Handles the user dismissing the notification (e.g., clicking the 'X')
self.addEventListener('notificationclose', (event) => {
  // Always message the client to update its state
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    if (clientList.length > 0) {
      clientList[0].postMessage({
        type: 'notification-action',
        action: 'closed', // This is always the action on 'notificationclose'
      });
    }
  });
});
