import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Abundance Flow', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Abundance Flow';
  const options = {
    body: data.body || 'Your daily abundance has arrived.',
    icon: '/abundance-app/manta.png',
    badge: '/abundance-app/manta.png',
    tag: 'abundance-daily',
    silent: true,
    data: { url: data.url || '/abundance-app/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/abundance-app/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/abundance-app/') && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
