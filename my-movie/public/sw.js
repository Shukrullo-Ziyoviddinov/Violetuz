self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || 'VioletPlay';
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (windows.some((client) => client.visibilityState === 'visible')) return;
    await self.registration.showNotification(title, {
      body: data.body || '',
      icon: data.icon || '/img/newlogo.jpg',
      tag: data.tag || 'violet-subscriber',
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    if (windows.length) return windows[0].focus();
    return self.clients.openWindow('/');
  }));
});
