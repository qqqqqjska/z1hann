self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

function isLikelyNotificationImageUrl(value) {
    const text = String(value || '').trim();
    if (!text || !/^https?:\/\//i.test(text)) return false;
    if (/\.(?:png|jpe?g|gif|webp|bmp|svg|avif)(?:[?#].*)?$/i.test(text)) return true;
    return /(postimg\.cc|postimg\.org|placehold\.co|imgur\.com|image\.bdstatic\.com|qpic\.cn|alicdn\.com)/i.test(text);
}

function isLikelyAnimatedNotificationImage(value) {
    const text = String(value || '').trim();
    if (!text) return false;
    return /\.(?:gif)(?:[?#].*)?$/i.test(text) || /(?:[?&](?:format|type)=gif\b)/i.test(text);
}

function buildNotificationPreviewText(data, payload) {
    const message = (payload && payload.message) || (data && data.message) || {};
    const type = String(message.type || payload.type || data.type || '').trim().toLowerCase();
    const content = String(message.content || data.body || payload.body || '').trim();
    const description = String(message.description || payload.description || '').trim();

    if (type === 'sticker') return '[动画表情]';
    if (type === 'voice') return '[语音]';
    if (type === 'image' || type === 'virtual_image') {
        return isLikelyAnimatedNotificationImage(content) ? '[动画表情]' : '[图片]';
    }
    if (isLikelyAnimatedNotificationImage(content) || isLikelyAnimatedNotificationImage(description)) {
        return '[动画表情]';
    }
    if (isLikelyNotificationImageUrl(content)) {
        return '[图片]';
    }
    return content || '你收到了一条联系人主动消息';
}

self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (err) {
        data = {
            title: '新消息',
            body: event.data ? event.data.text() : '你收到了一条新消息'
        };
    }

    const payload = data.data || data || {};
    const title = data.contactName || payload.contactName || data.title || '新消息';
    const contactAvatar = data.icon || payload.icon || data.avatarUrl || payload.avatarUrl || data.contactAvatar || payload.contactAvatar || 'https://placehold.co/192x192/png?text=Chat';
    const badge = data.badge || payload.badge || contactAvatar || 'https://placehold.co/72x72/png?text=Chat';
    const options = {
        body: data.body || '你收到了一条联系人主动消息',
        icon: contactAvatar,
        badge,
        body: buildNotificationPreviewText(data, payload),
        icon: contactAvatar,
        tag: data.tag || `contact-${data.contactId || payload.contactId || 'general'}`,
        renotify: true,
        data: payload
    };

    event.waitUntil((async () => {
        const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of allClients) {
            try {
                client.postMessage({ type: 'offline-push-sync', payload });
            } catch (err) {}
        }
        await self.registration.showNotification(title, options);
    })());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const payload = event.notification.data || {};
    const targetUrl = payload.url || `./?contactId=${encodeURIComponent(payload.contactId || '')}&openChat=1`;
    event.waitUntil((async () => {
        const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of allClients) {
            if ('focus' in client) {
                await client.focus();
                try {
                    client.postMessage({ type: 'offline-push-open-chat', payload });
                } catch (err) {}
                return;
            }
        }
        if (self.clients.openWindow) {
            await self.clients.openWindow(targetUrl);
        }
    })());
});
