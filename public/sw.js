self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { options } = event.data;
    event.waitUntil(self.registration.showNotification('FocusPrompt', options));
  }
});

const postActionToClient = (client, action) => {
  client.postMessage({ type: 'notification-action', action });
};

self.addEventListener('notificationclick', (event) => {
  const { action } = event; // 'focused', 'distracted', or '' if body is clicked
  event.notification.close();

  const actionToPost = (action === 'focused' || action === 'distracted') ? action : 'closed';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.visibilityState === 'visible') {
          postActionToClient(client, actionToPost);
          return client.focus();
        }
      }
      if (clientList.length > 0) {
        postActionToClient(clientList[0], actionToPost);
        return clientList[0].focus();
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.visibilityState === 'visible') {
          postActionToClient(client, 'closed');
          return;
        }
      }
      if (clientList.length > 0) {
         postActionToClient(clientList[0], 'closed');
      }
    })
  );
});
