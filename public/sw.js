
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'show-notification') {
    const { options } = event.data;
    const notificationOptions = {
      body: 'Are you still focused on your task?',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      actions: [
        { action: 'focused', title: '👍 Yes, I was focused' },
        { action: 'distracted', title: '👎 No, I got distracted' },
      ],
      tag: 'focus-prompt-notification', // Prevents duplicate notifications
      renotify: true, // Notifies user even if a previous notification with same tag was shown
      requireInteraction: true, // Keeps notification open until user interacts
      silent: options.silent || false,
    };

    event.waitUntil(
      self.registration.showNotification('Focus Check', notificationOptions)
    );
  }
});

async function sendMessageToClient(client, message) {
    if (!client) return;
    client.postMessage(message);
}

async function handleAction(action) {
    const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
    });
    
    // Find the most recently focused client to send the message to
    const visibleClients = clients.filter(c => c.visibilityState === 'visible');
    const targetClient = visibleClients.length > 0 ? visibleClients[0] : clients[0];

    if (targetClient) {
        sendMessageToClient(targetClient, { type: 'notification-action', action });
    }
}

self.addEventListener('notificationclick', (event) => {
  const action = event.action || 'closed';
  event.notification.close();
  event.waitUntil(handleAction(action));
});

self.addEventListener('notificationclose', (event) => {
    event.waitUntil(handleAction('closed'));
});
