// sw.js - Service Worker untuk Notifikasi Push VIP Files

const CACHE_NAME = 'vip-files-v1';
const NOTIFICATION_ICON = 'https://i.ibb.co.com/4wHZpnFB/IMG-20260610-WA0000.jpg';

// Install Service Worker
self.addEventListener('install', function(event) {
    console.log('[Service Worker] Installing...');
    self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', function(event) {
    console.log('[Service Worker] Activating...');
    event.waitUntil(clients.claim());
});

// Event listener untuk notifikasi push dari Firebase/Admin
self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push received:', event);
    
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'VIP Files', body: event.data.text() };
        }
    }
    
    const title = data.title || '🔔 VIP Files';
    const options = {
        body: data.body || 'Ada notifikasi baru dari VIP Files',
        icon: data.icon || NOTIFICATION_ICON,
        badge: data.badge || NOTIFICATION_ICON,
        vibrate: [200, 100, 200],
        silent: false,
        requireInteraction: true,
        tag: data.tag || 'vip_notification',
        data: {
            url: data.url || '/',
            timestamp: Date.now()
        },
        actions: [
            {
                action: 'open',
                title: '🔍 Lihat'
            },
            {
                action: 'close',
                title: '❌ Tutup'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Event listener ketika user mengklik notifikasi
self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification click:', event);
    
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            // Cek apakah sudah ada tab yang terbuka
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                const clientUrl = new URL(client.url);
                const targetUrl = new URL(urlToOpen, self.location.href);
                
                if (clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
                    return client.focus();
                }
            }
            // Jika belum ada, buka tab baru
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Event listener untuk notification close
self.addEventListener('notificationclose', function(event) {
    console.log('[Service Worker] Notification closed:', event);
});

// Fetch event untuk caching (opsional)
self.addEventListener('fetch', function(event) {
    // Biarkan default, tidak perlu cache kompleks
    event.respondWith(fetch(event.request));
});

// Fungsi untuk mengirim notifikasi dari dalam service worker
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const title = event.data.title || 'VIP Files';
        const options = {
            body: event.data.body || 'Pesan baru',
            icon: event.data.icon || NOTIFICATION_ICON,
            badge: event.data.badge || NOTIFICATION_ICON,
            vibrate: [200, 100, 200],
            requireInteraction: true,
            data: {
                url: event.data.url || '/'
            }
        };
        self.registration.showNotification(title, options);
    }
});