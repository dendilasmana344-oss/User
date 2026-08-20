// ============================================================
// SERVICE WORKER - NOTIFIKASI PUSH
// ============================================================

self.addEventListener('install', function(event) {
    console.log('📦 Service Worker installing...');
    event.waitUntil(
        self.skipWaiting()
    );
});

self.addEventListener('activate', function(event) {
    console.log('✅ Service Worker activated!');
    event.waitUntil(
        self.clients.claim()
    );
});

self.addEventListener('push', function(event) {
    console.log('📨 Push received:', event);
    
    const data = event.data ? event.data.json() : {};
    const title = data.title || '🔔 VIP Files Update';
    const options = {
        body: data.message || 'Ada pengumuman baru dari VIP Files',
        icon: 'https://i.ibb.co.com/4wHZpnFB/IMG-20260610-WA0000.jpg',
        badge: 'https://i.ibb.co.com/4wHZpnFB/IMG-20260610-WA0000.jpg',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: {
            url: data.url || '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    console.log('🔔 Notification clicked:', event);
    
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then(function(clientList) {
            // Cek apakah ada window yang sudah terbuka
            for (let client of clientList) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Jika tidak ada, buka baru
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

// ============================================================
// KIRIM NOTIFIKASI DARI SERVICE WORKER
// ============================================================
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'NOTIFICATION') {
        self.registration.showNotification(
            event.data.title || '🔔 VIP Files Update',
            {
                body: event.data.message || 'Ada pengumuman baru',
                icon: 'https://i.ibb.co.com/4wHZpnFB/IMG-20260610-WA0000.jpg',
                vibrate: [200, 100, 200],
                requireInteraction: true
            }
        );
    }
});

console.log('✅ Service Worker ready!');