
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  let action = event.action || 'closed';

  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
    for (const client of clientList) {
      client.postMessage({
        type: 'notification-action',
        action: action
      });
    }
    if (clientList.length > 0) {
        clientList[0].focus();
    }
  });
});

self.addEventListener('notificationclose', function(event) {
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
    for (const client of clientList) {
      client.postMessage({
        type: 'notification-action',
        action: 'closed'
      });
    }
  });
});
