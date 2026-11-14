self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || 'VioletPlay';
  const logo = '/img/newlogo.jpg';
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: data.icon || logo,
    image: data.image || undefined,
    badge: data.badge || logo,
    tag: data.tag || 'violet-subscriber',
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    if (windows.length) return windows[0].focus();
    return self.clients.openWindow('/');
  }));
});
