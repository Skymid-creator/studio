'use strict';

/**
 * Service Worker for FocusPrompt
 *
 * This worker handles the display and interaction of notifications.
 * It's responsible for:
 * 1. Showing the notification when prompted by the main application.
 * 2. Listening for clicks on the notification or its action buttons.
 * 3. Communicating the user's action back to the main application.
 * 4. Taking control of the page immediately on activation.
 */

// On install, activate immediately.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// On activation, take control of all clients.
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for clicks on the notification.
self.addEventListener('notificationclick', (event) => {
  const action = event.action; // e.g., 'focused', 'distracted', or '' for body click

  // Close the notification pop-up.
  event.notification.close();

  // Send the action to all open client windows.
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If the app isn't open, there's nothing to do.
      if (clientList.length === 0) {
        return;
      }
      
      // Focus the app window.
      // If multiple windows are open, focus the one that was last active.
      let clientToFocus = clientList[0];
      for (const client of clientList) {
        if (client.focused) {
          clientToFocus = client;
        }
      }
      clientToFocus.focus();
      
      // Post message to all clients so stats can be updated.
      for (const client of clientList) {
        client.postMessage({
          type: 'notification-action',
          action: action,
        });
      }
    })
  );
});

// Listen for when the user dismisses the notification without clicking an action.
self.addEventListener('notificationclose', (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        // Let the app know the prompt was ignored.
        for (const client of clientList) {
            client.postMessage({ type: 'notification-closed' });
        }
      }
    })
  );
});
