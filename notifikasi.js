// ============================================================
// NOTIFICATION PERMISSION - USER
// ============================================================

let notifPermissionGranted = false;
let notifPermissionShown = false;

// Cek apakah izin notifikasi sudah diberikan atau ditolak
function checkNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            notifPermissionGranted = true;
            return true;
        } else if (Notification.permission === 'denied') {
            notifPermissionGranted = false;
            return false;
        } else {
            // Belum ditanya (default)
            notifPermissionShown = false;
            return null;
        }
    }
    return null;
}

// Tampilkan popup minta izin notifikasi
function showNotificationPermissionPopup() {
    // Cek apakah sudah pernah ditampilkan hari ini
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('notif_permission_last_shown');
    const denied = localStorage.getItem('notif_permission_denied');
    
    // Jika sudah ditolak, jangan tampilkan lagi
    if (denied === 'true') {
        console.log('⚠️ Izin notifikasi sudah ditolak sebelumnya');
        return;
    }
    
    // Jika sudah ditampilkan hari ini, skip
    if (lastShown === today) {
        console.log('⏳ Popup izin notifikasi sudah ditampilkan hari ini');
        return;
    }
    
    // Cek status izin saat ini
    const status = checkNotificationPermission();
    if (status === true) {
        console.log('✅ Izin notifikasi sudah diberikan');
        return;
    } else if (status === false) {
        console.log('❌ Izin notifikasi sudah ditolak');
        return;
    }
    
    // Tampilkan popup
    const overlay = document.createElement('div');
    overlay.className = 'notif-permission-overlay active';
    overlay.id = 'notifPermissionOverlay';
    
    overlay.innerHTML = `
        <div class="notif-permission-content">
            <div class="notif-permission-icon">
                <i class="fas fa-bell"></i>
            </div>
            <div class="notif-permission-title">🔔 IZINKAN NOTIFIKASI</div>
            <div class="notif-permission-desc">
                Aktifkan notifikasi untuk mendapatkan <span class="highlight">pengumuman penting</span>, 
                <span class="highlight">update terbaru</span>, dan <span class="highlight">pesan dari admin</span> 
                secara langsung di perangkat Anda.
                <br><br>
                <span style="color:#888; font-size:13px;">
                    <i class="fas fa-info-circle"></i> Notifikasi akan muncul seperti pesan WhatsApp di bilah atas HP Anda.
                </span>
            </div>
            <div class="notif-permission-actions">
                <button class="notif-permission-btn notif-permission-btn-allow" id="notifAllowBtn">
                    <i class="fas fa-check"></i> Izinkan
                </button>
                <button class="notif-permission-btn notif-permission-btn-deny" id="notifDenyBtn">
                    <i class="fas fa-times"></i> Nanti
                </button>
            </div>
            <div class="notif-permission-footer">
                <i class="fas fa-shield-alt"></i> Aman &amp; Terpercaya • Anda dapat mengubah kapan saja di pengaturan browser
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    // Tombol Izinkan
    document.getElementById('notifAllowBtn').addEventListener('click', function() {
        requestNotificationPermission();
    });
    
    // Tombol Nanti
    document.getElementById('notifDenyBtn').addEventListener('click', function() {
        localStorage.setItem('notif_permission_last_shown', new Date().toDateString());
        closeNotificationPermissionPopup();
        showNeonToast('⏳ Anda dapat mengaktifkan notifikasi nanti di pengaturan browser.');
    });
    
    // Klik di luar untuk menutup
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            localStorage.setItem('notif_permission_last_shown', new Date().toDateString());
            closeNotificationPermissionPopup();
        }
    });
    
    notifPermissionShown = true;
    console.log('📢 Popup izin notifikasi ditampilkan');
}

// Minta izin notifikasi ke browser
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showNeonToast('❌ Browser Anda tidak mendukung notifikasi.');
        closeNotificationPermissionPopup();
        return;
    }
    
    if (Notification.permission === 'granted') {
        notifPermissionGranted = true;
        closeNotificationPermissionPopup();
        showNeonToast('✅ Izin notifikasi sudah diberikan!');
        return;
    }
    
    if (Notification.permission === 'denied') {
        localStorage.setItem('notif_permission_denied', 'true');
        closeNotificationPermissionPopup();
        showNeonToast('❌ Izin notifikasi ditolak. Aktifkan di pengaturan browser.');
        return;
    }
    
    // Minta izin
    Notification.requestPermission().then(function(permission) {
        if (permission === 'granted') {
            notifPermissionGranted = true;
            localStorage.setItem('notif_permission_denied', 'false');
            localStorage.setItem('notif_permission_last_shown', new Date().toDateString());
            closeNotificationPermissionPopup();
            showNeonToast('✅ Izin notifikasi berhasil! Anda akan menerima update penting.');
            console.log('✅ Notifikasi diizinkan!');
            
            // Kirim notifikasi uji coba
            sendTestNotification();
            
            // Daftarkan Service Worker
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) {
                        console.log('✅ Service Worker terdaftar');
                    })
                    .catch(function(err) {
                        console.log('❌ Service Worker gagal:', err);
                    });
            }
            
        } else {
            localStorage.setItem('notif_permission_denied', 'true');
            closeNotificationPermissionPopup();
            showNeonToast('❌ Izin notifikasi ditolak.');
            console.log('❌ Notifikasi ditolak');
        }
    }).catch(function(err) {
        console.error('Error request notification:', err);
        closeNotificationPermissionPopup();
    });
}

// Tutup popup izin notifikasi
function closeNotificationPermissionPopup() {
    const overlay = document.getElementById('notifPermissionOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(function() {
            if (overlay.parentElement) {
                overlay.parentElement.removeChild(overlay);
            }
            document.body.style.overflow = '';
        }, 400);
    }
}

// Kirim notifikasi uji coba
function sendTestNotification() {
    if (!notifPermissionGranted && !('Notification' in window)) return;
    
    try {
        const iconUrl = 'https://i.ibb.co.com/4wHZpnFB/IMG-20260610-WA0000.jpg';
        const notification = new Notification('🔔 Notifikasi Aktif!', {
            body: 'Selamat! Anda akan menerima pengumuman penting dari VIP Files.',
            icon: iconUrl,
            badge: iconUrl,
            vibrate: [200, 100, 200],
            requireInteraction: true,
            silent: false
        });
        
        notification.onclick = function() {
            window.focus();
            notification.close();
        };
        
        setTimeout(function() {
            notification.close();
        }, 6000);
        
    } catch(e) {
        console.log('Test notification error:', e);
    }
}

// Kirim notifikasi dari website (panggil saat ada event)
function sendWebsiteNotification(title, message, tag = null) {
    if (!notifPermissionGranted && !('Notification' in window)) {
        console.log('❌ Notifikasi tidak diizinkan');
        return;
    }
    
    try {
        const options = {
            body: message,
            icon: 'https://i.ibb.co.com/4wHZpnFB/IMG-20260610-WA0000.jpg',
            badge: 'https://i.ibb.co.com/4wHZpnFB/IMG-20260610-WA0000.jpg',
            vibrate: [200, 100, 200],
            requireInteraction: true,
            silent: false
        };
        
        if (tag) options.tag = tag;
        
        const notification = new Notification(title, options);
        
        notification.onclick = function() {
            window.focus();
            notification.close();
        };
        
        setTimeout(function() {
            if (notification.close) {
                notification.close();
            }
        }, 8000);
        
        console.log(`📢 Notifikasi dikirim: ${title}`);
        
    } catch(e) {
        console.log('Send notification error:', e);
    }
}

// ============================================================
// AUTO INIT - TAMPILKAN POPUP SAAT HALAMAN DIBUKA
// ============================================================
function initNotificationPermission() {
    // Tunggu 3 detik setelah halaman selesai load
    setTimeout(function() {
        // Cek jika user sudah login atau belum
        const isLoggedIn = !!document.getElementById('uidDisplay')?.textContent?.includes('UID:');
        
        // Jika belum login, tampilkan popup guest
        if (!isLoggedIn) {
            showGuestNotificationPopup();
        } else {
            showNotificationPermissionPopup();
        }
    }, 3000);
}

// Popup untuk guest (belum login)
function showGuestNotificationPopup() {
    if (localStorage.getItem('notif_guest_shown') === 'true') return;
    
    const overlay = document.createElement('div');
    overlay.className = 'notif-permission-overlay active';
    overlay.id = 'notifGuestOverlay';
    
    overlay.innerHTML = `
        <div class="notif-permission-content">
            <div class="notif-permission-icon" style="color:#ffd700;">
                <i class="fas fa-bell"></i>
            </div>
            <div class="notif-permission-title" style="color:#ffd700;">🔔 NOTIFIKASI PENTING</div>
            <div class="notif-permission-desc">
                Dapatkan <span class="highlight">pengumuman terbaru</span>, 
                <span class="highlight">promo eksklusif</span>, dan <span class="highlight">update penting</span> 
                dari VIP Files langsung di perangkat Anda!
                <br><br>
                <span style="color:#888; font-size:13px;">
                    <i class="fas fa-info-circle"></i> Notifikasi akan muncul seperti aplikasi lain di bilah atas HP Anda.
                </span>
            </div>
            <div class="notif-permission-actions">
                <button class="notif-permission-btn notif-permission-btn-allow" id="guestNotifAllow">
                    <i class="fas fa-check"></i> Aktifkan Notifikasi
                </button>
                <button class="notif-permission-btn notif-permission-btn-deny" id="guestNotifDeny">
                    <i class="fas fa-times"></i> Lewati
                </button>
            </div>
            <div class="notif-permission-footer">
                <i class="fas fa-shield-alt"></i> Aman &amp; Terpercaya • Tidak ada spam
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    document.getElementById('guestNotifAllow').addEventListener('click', function() {
        localStorage.setItem('notif_guest_shown', 'true');
        closeGuestNotificationPopup();
        showNotificationPermissionPopup();
    });
    
    document.getElementById('guestNotifDeny').addEventListener('click', function() {
        localStorage.setItem('notif_guest_shown', 'true');
        closeGuestNotificationPopup();
    });
    
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            localStorage.setItem('notif_guest_shown', 'true');
            closeGuestNotificationPopup();
        }
    });
}

function closeGuestNotificationPopup() {
    const overlay = document.getElementById('notifGuestOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(function() {
            if (overlay.parentElement) {
                overlay.parentElement.removeChild(overlay);
            }
            document.body.style.overflow = '';
        }, 400);
    }
}

// ============================================================
// CEK SERVICE WORKER REGISTRATION
// ============================================================
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('✅ Service Worker berhasil terdaftar');
                console.log('📍 Scope:', registration.scope);
                
                // Cek apakah ada SW yang sudah terdaftar
                if (registration.active) {
                    console.log('✅ Service Worker sudah aktif');
                }
            })
            .catch(function(err) {
                console.log('❌ Service Worker gagal:', err);
            });
    }
}

// ============================================================
// INISIALISASI SAAT DOKUMEN SIAP
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Cek izin notifikasi
    checkNotificationPermission();
    
    // Daftarkan Service Worker
    registerServiceWorker();
    
    // Tampilkan popup setelah beberapa detik
    setTimeout(function() {
        // Jika belum ditampilkan, tampilkan
        if (!notifPermissionShown) {
            showNotificationPermissionPopup();
        }
    }, 5000);
});

console.log('🔔 Script notifikasi siap!');
console.log('📌 Untuk memicu manual: showNotificationPermissionPopup()');
console.log('📌 Kirim notifikasi: sendWebsiteNotification("Title", "Message")');