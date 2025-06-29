
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'show-notification') {
    const { options } = event.data;
    const title = 'Focus Check';
    const notificationOptions = {
      body: 'Are you still focused on your task?',
      tag: 'focus-prompt-notification', // Prevents duplicate notifications
      renotify: true,
      requireInteraction: true, // Keeps notification until user interacts
      silent: options.silent || false,
      actions: [
        { action: 'focused', title: '✅ Yes, I was focused' },
        { action: 'distracted', title: '❌ No, I got distracted' },
      ],
    };

    const promise = self.registration.showNotification(title, notificationOptions);
    event.waitUntil(promise);
  }
});

const handleAction = async (event, action) => {
  // For 'notificationclose' event, there is no notification to close, it's already gone.
  if (event.notification) {
    event.notification.close();
  }

  const clientsList = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  if (clientsList.length > 0) {
    // Only post message if we have a client to talk to
    clientsList[0].postMessage({ type: 'notification-action', action });
    // Attempt to focus the client
    if (clientsList[0].focus) {
      return clientsList[0].focus();
    }
  }
};


self.addEventListener('notificationclick', (event) => {
  // event.action is the id from the actions array.
  // If the user clicks the notification body and not a button, action is an empty string.
  const action = event.action || 'closed';
  event.waitUntil(handleAction(event, action));
});

self.addEventListener('notificationclose', (event) => {
  // This event fires when the user dismisses the notification via the 'X' or swiping it away.
  // We want to inform the app so it can reset its state.
  event.waitUntil(handleAction(event, 'closed'));
});
