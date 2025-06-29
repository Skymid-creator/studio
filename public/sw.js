
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const isSilent = event.data.silent;
    const options = {
      body: 'Are you focusing?',
      tag: 'focus-prompt',
      renotify: true,
      silent: isSilent,
      icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTYgOGE2IDYgMCAwIDEgMTIgMGMwIDcgMyA5IDMgOUgzczMtMi0zLTkiLz48cGF0aCBkPSJNMTAuMyAyMWEyIDIgMCAwIDAgMy40IDAiLz48L3N2Zz4=',
      actions: [
        { action: 'focused', title: 'I was focused' },
        { action: 'distracted', title: 'I got distracted' },
      ],
    };
    event.waitUntil(self.registration.showNotification('FocusPrompt', options));
  }
});

self.addEventListener('notificationclick', (event) => {
  const action = event.action;

  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients && clients.length) {
        // Send message to all clients
        clients.forEach(client => {
          if (action === 'focused' || action === 'distracted') {
            client.postMessage({ type: 'notification-action', action });
          }
          if (client.focus) {
            client.focus();
          }
        });
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            if (clients && clients.length) {
                clients.forEach(client => {
                    client.postMessage({ type: 'notification-action', action: 'closed' });
                });
            }
        })
    );
});
