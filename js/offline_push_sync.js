(function() {
    const DEFAULT_STATE = {
        enabled: false,
        apiBaseUrl: '',
        vapidPublicKey: '',
        userId: 'default-user',
        deviceId: '',
        lastSyncAt: 0,
        deletedRemoteMessageIds: [],
        disableLocalActiveReplyScheduler: false,
        pushPermission: 'default'
    };
    const AUTO_SYNC_INTERVAL_MS = 12000;
    let syncInFlightPromise = null;

    function getState() {
        if (!window.iphoneSimState) window.iphoneSimState = {};
        if (!window.iphoneSimState.offlinePushSync || typeof window.iphoneSimState.offlinePushSync !== 'object') {
            window.iphoneSimState.offlinePushSync = Object.assign({}, DEFAULT_STATE);
        } else {
            window.iphoneSimState.offlinePushSync = Object.assign({}, DEFAULT_STATE, window.iphoneSimState.offlinePushSync);
        }
        if (!window.iphoneSimState.offlinePushSync.deviceId) {
            window.iphoneSimState.offlinePushSync.deviceId = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        }
        return window.iphoneSimState.offlinePushSync;
    }

    function saveState() {
        if (typeof window.saveConfig === 'function') {
            try { window.saveConfig(); } catch (err) { console.error(err); }
        }
    }

    function base64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
        return outputArray;
    }

    async function apiFetch(path, init) {
        const state = getState();
        if (!state.apiBaseUrl) throw new Error('offline push apiBaseUrl is not configured');
        const response = await fetch(`${state.apiBaseUrl.replace(/\/$/, '')}${path}`, Object.assign({
            headers: {
                'Content-Type': 'application/json'
            }
        }, init || {}));
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`API ${response.status}: ${text || response.statusText}`);
        }
        const contentType = response.headers.get('content-type') || '';
        return contentType.includes('application/json') ? response.json() : response.text();
    }

    function getContactById(contactId) {
        const contacts = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts
            : [];
        return contacts.find(item => String(item && item.id) === String(contactId)) || null;
    }

    function isLikelyImageUrl(value) {
        const text = String(value || '').trim();
        if (!text || !/^https?:\/\//i.test(text)) return false;
        if (/\.(?:png|jpe?g|gif|webp|bmp|svg|avif)(?:[?#].*)?$/i.test(text)) return true;
        return /(postimg\.cc|placehold\.co|imgur\.com|image\.bdstatic\.com|qpic\.cn|alicdn\.com)/i.test(text);
    }

    function sanitizeRemoteDescription(value) {
        const text = String(value || '').trim();
        if (!text) return null;
        if (text.length > 600) return null;
        if (/【输出协议】|你必须且只能返回|活人感|常驻能力|最高优先级|如果你只想发一句普通消息/i.test(text)) {
            return null;
        }
        return text;
    }

    function normalizeRemoteType(value) {
        const rawType = String(value || 'text').trim().toLowerCase();
        if (!rawType) return 'text';
        if (rawType === 'text_message' || rawType === 'quote_reply' || rawType === 'html') return 'text';
        if (rawType === 'image_message' || rawType === 'photo') return 'image';
        if (rawType === 'virtual_image_message') return 'virtual_image';
        if (rawType === 'sticker_message') return 'sticker';
        return rawType;
    }

    function sanitizeRemoteContent(value) {
        return String(value || '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .trim();
    }

    function isGenericUnknownImageText(value) {
        const text = String(value || '').trim().toLowerCase();
        if (!text) return true;
        return text === '未知图片'
            || text === '图片'
            || text === '[图片]'
            || text === 'unknown image'
            || text === 'image';
    }

    function buildRemoteImageFallbackText(value) {
        const text = String(value || '').trim();
        if (!text || isGenericUnknownImageText(text)) return '[图片]';
        return `[图片] ${text}`;
    }

    function isInlineDataImage(value) {
        return /^data:image\//i.test(String(value || '').trim());
    }

    function sanitizeOfflineContextText(value, maxLength = 12000) {
        const text = sanitizeRemoteContent(value);
        if (!text || isInlineDataImage(text)) return '';
        return trimOfflineContextText(text, maxLength);
    }

    function sanitizeOfflineContextDescriptor(value, maxLength = 1200) {
        return sanitizeOfflineContextText(value, maxLength).replace(/\s+/g, ' ').trim();
    }

    function buildOfflineContextImageText(message) {
        const description = sanitizeOfflineContextDescriptor(message && message.description, 1200);
        if (description && !isGenericUnknownImageText(description)) {
            return buildRemoteImageFallbackText(description);
        }

        const novelaiPrompt = sanitizeOfflineContextDescriptor(message && message.novelaiPrompt, 1200);
        if (novelaiPrompt && !isGenericUnknownImageText(novelaiPrompt)) {
            return buildRemoteImageFallbackText(novelaiPrompt);
        }

        return buildRemoteImageFallbackText('');
    }

    function serializeMessageForOfflineContext(message) {
        const rawType = String(message && message.type ? message.type : 'text').trim().toLowerCase();
        const rawContent = message && message.content ? message.content : '';
        const description = sanitizeOfflineContextDescriptor(message && message.description, 1200);
        const novelaiPrompt = sanitizeOfflineContextDescriptor(message && message.novelaiPrompt, 1200);
        const hasInlineImage = isInlineDataImage(rawContent);
        const isImageLike = rawType === 'image' || rawType === 'virtual_image' || hasInlineImage;

        const serialized = {
            id: message && message.id ? message.id : null,
            role: message && (message.role || (message.isUser ? 'user' : 'assistant')) || 'assistant',
            type: isImageLike ? (rawType === 'virtual_image' ? 'virtual_image' : 'image') : (rawType || 'text'),
            time: Number(message && message.time ? message.time : Date.now())
        };

        if (description) serialized.description = description;
        if (novelaiPrompt) serialized.novelaiPrompt = novelaiPrompt;

        if (isImageLike) {
            serialized.content = buildOfflineContextImageText(message);
            return serialized;
        }

        serialized.content = sanitizeOfflineContextText(rawContent, 12000);
        return serialized;
    }

    function normalizeRemoteMessage(remote) {
        const contactId = getRemoteContactId(remote);
        const contact = getContactById(contactId);
        const rawType = normalizeRemoteType(remote && remote.type);
        const rawContent = sanitizeRemoteContent(remote && remote.content);
        const safeDescription = sanitizeRemoteDescription(remote && remote.description);
        const source = String(remote && remote.source || '').trim().toLowerCase();
        const stickerResolver = typeof window.resolveStickerAssetForContact === 'function'
            ? window.resolveStickerAssetForContact
            : null;
        const fallbackImageUrl = (window.iphoneSimState && window.iphoneSimState.defaultVirtualImageUrl)
            || 'https://placehold.co/600x400/png?text=Photo';

        const resolveStickerMessage = (query) => {
            const stickerQuery = String(query || '').replace(/^\[表情包\]\s*/i, '').trim();
            if (!stickerQuery) return null;
            const stickerAsset = stickerResolver ? stickerResolver(contact, stickerQuery) : null;
            if (stickerAsset && stickerAsset.url) {
                return {
                    type: 'sticker',
                    content: stickerAsset.url,
                    description: stickerAsset.desc || stickerQuery
                };
            }
            return null;
        };

        if (rawType === 'sticker' || rawType === 'sticker_message') {
            if (/^https?:\/\//i.test(rawContent)) {
                return {
                    type: 'sticker',
                    content: rawContent,
                    description: safeDescription
                };
            }
            const normalizedSticker = resolveStickerMessage(safeDescription || rawContent);
            if (normalizedSticker) return normalizedSticker;
            return {
                type: 'text',
                content: rawContent.startsWith('[表情包]') ? rawContent : `[表情包] ${rawContent}`,
                description: null
            };
        }

        if (rawType === 'image' || rawType === 'virtual_image') {
            const matchedFallbackPlaceholder = rawContent
                && rawContent === fallbackImageUrl
                && isGenericUnknownImageText(safeDescription || rawContent);
            if (isLikelyImageUrl(rawContent)) {
                if (matchedFallbackPlaceholder) {
                    return {
                        type: 'text',
                        content: buildRemoteImageFallbackText(safeDescription || rawContent),
                        description: null
                    };
                }
                return {
                    type: rawType === 'virtual_image' ? 'virtual_image' : 'image',
                    content: rawContent,
                    description: safeDescription
                };
            }
            return {
                type: 'text',
                content: buildRemoteImageFallbackText(safeDescription || rawContent),
                description: null
            };
        }

        if (rawType === 'text') {
            const stickerMatch = rawContent.match(/^\[表情包\]\s*(.+)$/i);
            if (stickerMatch) {
                const normalizedSticker = resolveStickerMessage(stickerMatch[1]);
                if (normalizedSticker) return normalizedSticker;
            }
            if (isLikelyImageUrl(rawContent)) {
                return {
                    type: 'image',
                    content: rawContent,
                    description: null
                };
            }
        }

        return {
            type: rawType || 'text',
            content: rawContent,
            description: safeDescription
        };
    }

    function buildLocalMessageFromRemote(remote) {
        const normalized = normalizeRemoteMessage(remote);
        return {
            id: remote.id || (`remote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
            time: remote.time || Date.now(),
            role: remote.role || 'assistant',
            content: normalized.content || '',
            type: normalized.type || 'text',
            description: normalized.description || null,
            source: 'offline-backend',
            remoteId: remote.id || null,
            pushedByBackend: true,
            read: !!remote.read
        };
    }

    function getRemoteContactId(remote) {
        if (!remote || typeof remote !== 'object') return '';
        const rawContactId = remote.contactId !== undefined && remote.contactId !== null && remote.contactId !== ''
            ? remote.contactId
            : remote.contact_id;
        return rawContactId === undefined || rawContactId === null || rawContactId === ''
            ? ''
            : String(rawContactId);
    }

    function resolveLocalContactId(contactId) {
        if (contactId === undefined || contactId === null || contactId === '') return contactId;
        const contacts = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts
            : [];
        const matched = contacts.find(item => String(item && item.id) === String(contactId));
        return matched ? matched.id : contactId;
    }

    function hasRemoteMessage(contactId, remoteId) {
        if (!remoteId) return false;
        const state = getState();
        if (Array.isArray(state.deletedRemoteMessageIds) && state.deletedRemoteMessageIds.includes(String(remoteId))) {
            return true;
        }
        const history = (window.iphoneSimState && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[contactId]) || [];
        return history.some(item => item && (item.remoteId === remoteId || item.id === remoteId));
    }

    function rememberDeletedRemoteMessageIds(messageIds) {
        const ids = Array.isArray(messageIds)
            ? messageIds.map((item) => String(item || '').trim()).filter(Boolean)
            : [];
        if (!ids.length) return;
        const state = getState();
        const existing = Array.isArray(state.deletedRemoteMessageIds) ? state.deletedRemoteMessageIds.map((item) => String(item || '')) : [];
        const merged = Array.from(new Set(existing.concat(ids)));
        state.deletedRemoteMessageIds = merged.slice(-5000);
        saveState();
    }

    function repairExistingOfflineMessages() {
        if (!window.iphoneSimState || !window.iphoneSimState.chatHistory || typeof window.iphoneSimState.chatHistory !== 'object') {
            return 0;
        }
        let changed = 0;
        Object.keys(window.iphoneSimState.chatHistory).forEach((contactId) => {
            const history = window.iphoneSimState.chatHistory[contactId];
            if (!Array.isArray(history)) return;
            history.forEach((message) => {
                if (!message || typeof message !== 'object') return;
                const isOfflineMessage = message.source === 'offline-backend' || message.pushedByBackend || message.remoteId;
                const fallbackImageUrl = String((window.iphoneSimState && window.iphoneSimState.defaultVirtualImageUrl) || '').trim();
                const currentContent = String(message.content || '').trim();
                const isSuspiciousFallbackImage = (message.type === 'image' || message.type === 'virtual_image')
                    && !!fallbackImageUrl
                    && currentContent === fallbackImageUrl
                    && isGenericUnknownImageText(message.description || currentContent);
                if (!isOfflineMessage && !isSuspiciousFallbackImage) return;
                const normalized = normalizeRemoteMessage({
                    id: message.remoteId || message.id,
                    contactId,
                    role: message.role,
                    content: message.content,
                    type: message.type,
                    description: message.description,
                    source: message.source,
                    read: message.read
                });
                const nextDescription = normalized.description || null;
                if (message.content !== normalized.content || message.type !== normalized.type || (message.description || null) !== nextDescription) {
                    message.content = normalized.content;
                    message.type = normalized.type;
                    message.description = nextDescription;
                    changed += 1;
                }
            });
        });
        if (changed > 0) {
            saveState();
            if (window.iphoneSimState.currentChatContactId && typeof window.renderChatHistory === 'function') {
                try { window.renderChatHistory(window.iphoneSimState.currentChatContactId, true); } catch (err) { console.error(err); }
            }
        }
        return changed;
    }

    function injectRemoteMessages(messages) {
        if (!Array.isArray(messages) || !window.iphoneSimState) return 0;
        let added = 0;
        const touchedContactIds = new Set();
        window.iphoneSimState.chatHistory = window.iphoneSimState.chatHistory || {};
        messages.forEach((remote) => {
            const contactId = getRemoteContactId(remote);
            if (!contactId) return;
            if (!window.iphoneSimState.chatHistory[contactId]) {
                window.iphoneSimState.chatHistory[contactId] = [];
            }
            if (hasRemoteMessage(contactId, remote.id)) return;
            const localMessage = buildLocalMessageFromRemote(remote);
            window.iphoneSimState.chatHistory[contactId].push(localMessage);
            touchedContactIds.add(contactId);
            added += 1;
        });
        if (added > 0) {
            try {
                touchedContactIds.forEach((contactId) => {
                    const history = window.iphoneSimState.chatHistory[contactId];
                    if (!Array.isArray(history)) return;
                    history.sort((left, right) => {
                        const timeDiff = Number(left && left.time || 0) - Number(right && right.time || 0);
                        if (timeDiff !== 0) return timeDiff;
                        return String(left && left.id || '').localeCompare(String(right && right.id || ''));
                    });
                    if (typeof window.persistChatHistory === 'function') {
                        window.persistChatHistory(contactId);
                    }
                });
                if (typeof window.renderContactList === 'function') {
                    window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
                }
                if (window.iphoneSimState.currentChatContactId && typeof window.renderChatHistory === 'function') {
                    window.renderChatHistory(window.iphoneSimState.currentChatContactId, true);
                }
                saveState();
            } catch (err) {
                console.error('[offline-push-sync] inject render failed', err);
            }
        }
        return added;
    }

    function extractRemoteMessagesFromPushPayload(payload) {
        const items = [];
        const pushMessage = (messageLike) => {
            if (!messageLike || typeof messageLike !== 'object') return;
            const contactId = getRemoteContactId(messageLike) || getRemoteContactId(payload);
            if (!contactId) return;
            const messageId = messageLike.id || messageLike.messageId || payload.messageId || '';
            items.push(Object.assign({}, messageLike, {
                id: messageId,
                contactId,
                contact_id: contactId,
                source: messageLike.source || 'offline-backend'
            }));
        };

        if (Array.isArray(payload && payload.messages)) {
            payload.messages.forEach(pushMessage);
        }
        if (payload && payload.message) {
            pushMessage(payload.message);
        }
        return items;
    }

    function schedulePushTriggeredSync() {
        [0, 800, 2200].forEach((delay) => {
            window.setTimeout(() => {
                syncMessages().catch(err => console.error('[offline-push-sync] push follow-up sync failed', err));
            }, delay);
        });
    }

    async function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return null;
        const registration = await navigator.serviceWorker.register('service-worker.js', { scope: './' });
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(async (item) => {
                const scriptUrl = String(
                    (item.active && item.active.scriptURL)
                    || (item.waiting && item.waiting.scriptURL)
                    || (item.installing && item.installing.scriptURL)
                    || ''
                );
                if (scriptUrl.includes('/js/service-worker.js')) {
                    await item.unregister();
                }
            }));
        } catch (err) {
            console.error('[offline-push-sync] cleanup legacy service worker failed', err);
        }
        return registration;
    }

    async function subscribePush() {
        const state = getState();
        if (!state.enabled || !state.apiBaseUrl || !state.vapidPublicKey) return null;
        if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return null;

        const permission = await Notification.requestPermission();
        state.pushPermission = permission;
        saveState();
        if (permission !== 'granted') return null;

        const registration = await registerServiceWorker();
        if (!registration) return null;

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: base64ToUint8Array(state.vapidPublicKey)
            });
        }

        await apiFetch('/api/push/subscribe', {
            method: 'POST',
            body: JSON.stringify({
                userId: state.userId,
                deviceId: state.deviceId,
                subscription,
                userAgent: navigator.userAgent
            })
        });
        return subscription;
    }

    async function syncMessages() {
        if (syncInFlightPromise) {
            return syncInFlightPromise;
        }
        const state = getState();
        if (!state.enabled || !state.apiBaseUrl) return { added: 0, skipped: true };
        syncInFlightPromise = (async () => {
            const payload = await apiFetch('/api/messages/sync', {
                method: 'POST',
                body: JSON.stringify({
                    userId: state.userId,
                    deviceId: state.deviceId,
                    since: state.lastSyncAt || 0
                })
            });
            const messages = (payload && payload.messages) || [];
            const added = injectRemoteMessages(messages);
            state.lastSyncAt = Number((payload && payload.serverTime) || Date.now()) || Date.now();
            saveState();
            return { added, skipped: false };
        })();
        try {
            return await syncInFlightPromise;
        } finally {
            syncInFlightPromise = null;
        }
    }

    async function deleteMessages(messageIds) {
        const ids = Array.isArray(messageIds)
            ? messageIds.map((item) => String(item || '').trim()).filter(Boolean)
            : [];
        if (!ids.length) return { ok: true, deleted: 0, skipped: true };
        rememberDeletedRemoteMessageIds(ids);
        const state = getState();
        if (!state.enabled || !state.apiBaseUrl) {
            return { ok: true, deleted: ids.length, skipped: true };
        }
        const payload = await apiFetch('/api/messages/delete', {
            method: 'POST',
            body: JSON.stringify({
                userId: state.userId,
                messageIds: ids
            })
        });
        return payload || { ok: true, deleted: ids.length };
    }

    function startAutoSyncLoop() {
        if (window.__offlinePushAutoSyncTimer) return;
        window.__offlinePushAutoSyncTimer = window.setInterval(() => {
            const state = getState();
            if (!state.enabled || !state.apiBaseUrl) return;
            if (document.hidden) return;
            syncMessages().catch(err => console.error('[offline-push-sync] auto sync failed', err));
        }, AUTO_SYNC_INTERVAL_MS);
    }

    async function syncActiveReplyConfig() {
        const state = getState();
        if (!state.enabled || !state.apiBaseUrl || !window.iphoneSimState || !Array.isArray(window.iphoneSimState.contacts)) return;
        const payload = await apiFetch(`/api/contacts/active-reply-config?userId=${encodeURIComponent(state.userId)}`, {
            method: 'GET'
        });
        const contacts = Array.isArray(payload && payload.contacts) ? payload.contacts : [];
        const byId = new Map(contacts
            .map(item => [getRemoteContactId(item), item])
            .filter(([contactId]) => !!contactId));
        let changed = false;
        (window.iphoneSimState.contacts || []).forEach((contact) => {
            if (typeof window.ensureContactRestWindowFields === 'function') {
                window.ensureContactRestWindowFields(contact);
            }
            const remote = byId.get(String(contact.id));
            if (!remote) return;
            const nextEnabled = !!(remote.activeReplyEnabled !== undefined ? remote.activeReplyEnabled : remote.active_reply_enabled);
            const nextIntervalSec = Number(remote.activeReplyIntervalSec !== undefined ? remote.activeReplyIntervalSec : remote.active_reply_interval_sec || 60);
            const nextInterval = Math.max(1, nextIntervalSec);
            const nextStartTime = Number(remote.activeReplyStartTime !== undefined ? remote.activeReplyStartTime : remote.active_reply_start_time || 0);
            const nextTriggeredMsgId = remote.lastTriggeredMsgId !== undefined ? remote.lastTriggeredMsgId : remote.last_triggered_msg_id;
            const hasRestWindowEnabled = remote.restWindowEnabled !== undefined || remote.rest_window_enabled !== undefined;
            const hasRestWindowStart = remote.restWindowStart !== undefined || remote.rest_window_start !== undefined;
            const hasRestWindowEnd = remote.restWindowEnd !== undefined || remote.rest_window_end !== undefined;
            const hasRestWindowAwakenedAt = remote.restWindowAwakenedAt !== undefined || remote.rest_window_awakened_at !== undefined;
            const nextRestWindowEnabled = !!(remote.restWindowEnabled !== undefined ? remote.restWindowEnabled : remote.rest_window_enabled);
            const nextRestWindowStart = remote.restWindowStart !== undefined ? String(remote.restWindowStart || '') : String(remote.rest_window_start || '');
            const nextRestWindowEnd = remote.restWindowEnd !== undefined ? String(remote.restWindowEnd || '') : String(remote.rest_window_end || '');
            const nextRestWindowAwakenedAtRaw = remote.restWindowAwakenedAt !== undefined ? remote.restWindowAwakenedAt : remote.rest_window_awakened_at;
            const nextRestWindowAwakenedAt = nextRestWindowAwakenedAtRaw === null || nextRestWindowAwakenedAtRaw === undefined || nextRestWindowAwakenedAtRaw === ''
                ? null
                : Number(nextRestWindowAwakenedAtRaw);
            if (contact.activeReplyEnabled !== nextEnabled) {
                contact.activeReplyEnabled = nextEnabled;
                changed = true;
            }
            if (Number(contact.activeReplyInterval || 0) !== nextInterval) {
                contact.activeReplyInterval = nextInterval;
                changed = true;
            }
            if (nextStartTime && contact.activeReplyStartTime !== nextStartTime) {
                contact.activeReplyStartTime = nextStartTime;
                changed = true;
            }
            if (nextTriggeredMsgId && contact.lastActiveReplyTriggeredMsgId !== nextTriggeredMsgId) {
                contact.lastActiveReplyTriggeredMsgId = nextTriggeredMsgId;
                changed = true;
            }
            if (hasRestWindowEnabled && contact.restWindowEnabled !== nextRestWindowEnabled) {
                contact.restWindowEnabled = nextRestWindowEnabled;
                changed = true;
            }
            if (hasRestWindowStart && (contact.restWindowStart || '') !== nextRestWindowStart) {
                contact.restWindowStart = nextRestWindowStart;
                changed = true;
            }
            if (hasRestWindowEnd && (contact.restWindowEnd || '') !== nextRestWindowEnd) {
                contact.restWindowEnd = nextRestWindowEnd;
                changed = true;
            }
            if (hasRestWindowAwakenedAt && (contact.restWindowAwakenedAt ?? null) !== (Number.isFinite(nextRestWindowAwakenedAt) ? nextRestWindowAwakenedAt : null)) {
                contact.restWindowAwakenedAt = Number.isFinite(nextRestWindowAwakenedAt) ? nextRestWindowAwakenedAt : null;
                changed = true;
            }
        });
        if (changed) saveState();
    }

    async function uploadContactConfig(contact, options = {}) {
        const state = getState();
        if (!state.enabled || !state.apiBaseUrl || !contact) return;
        if (typeof window.ensureContactRestWindowFields === 'function') {
            window.ensureContactRestWindowFields(contact);
        }
        try {
            await apiFetch('/api/contacts', {
                method: 'POST',
                keepalive: !!options.keepalive,
                body: JSON.stringify({
                    userId: state.userId,
                    contactId: contact.id,
                    name: contact.remark || contact.nickname || contact.name || '',
                    avatarUrl: contact.avatar || '',
                    personaPrompt: contact.persona || '',
                    timezoneOffsetMinutes: -new Date().getTimezoneOffset(),
                    contextLimit: Number(contact.contextLimit || 0),
                    activeReplyEnabled: !!contact.activeReplyEnabled,
                    activeReplyInterval: Number(contact.activeReplyInterval || 1),
                    activeReplyStartTime: Number(contact.activeReplyStartTime || 0),
                    lastActiveReplyTriggeredMsgId: contact.lastActiveReplyTriggeredMsgId || null,
                    restWindowEnabled: !!contact.restWindowEnabled,
                    restWindowStart: contact.restWindowStart || '',
                    restWindowEnd: contact.restWindowEnd || '',
                    restWindowAwakenedAt: Number(contact.restWindowAwakenedAt || 0) || null
                })
            });
        } catch (err) {
            console.error('[offline-push-sync] uploadContactConfig failed', err);
        }
    }

    async function uploadAiProfile() {
        const state = getState();
        if (!state.enabled || !state.apiBaseUrl || !window.iphoneSimState) return;
        const primary = window.iphoneSimState.aiSettings || {};
        const secondary = window.iphoneSimState.aiSettings2 || {};
        const settings = primary.url ? primary : secondary;
        if (!settings || !settings.url || !settings.key || !settings.model) return;
        try {
            await apiFetch('/api/ai-profile', {
                method: 'POST',
                body: JSON.stringify({
                    userId: state.userId,
                    apiUrl: settings.url || '',
                    apiKey: settings.key || '',
                    model: settings.model || '',
                    temperature: Number(settings.temperature || 0.7)
                })
            });
        } catch (err) {
            console.error('[offline-push-sync] uploadAiProfile failed', err);
        }
    }

    async function uploadChatContext(contactId) {
        const state = getState();
        if (!state.enabled || !state.apiBaseUrl || !contactId) return;
        const contact = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts.find(item => String(item.id) === String(contactId))
            : null;
        const contextLimit = contact && Number(contact.contextLimit) > 0 ? Number(contact.contextLimit) : 50;
        const history = ((((window.iphoneSimState || {}).chatHistory || {})[contactId]) || []).slice(-contextLimit);
        const serializedHistory = history.map(serializeMessageForOfflineContext);
        try {
            await apiFetch('/api/chat-context', {
                method: 'POST',
                body: JSON.stringify({
                    userId: state.userId,
                    contactId,
                    contextLimit,
                    messages: serializedHistory
                })
            });
        } catch (err) {
            console.error('[offline-push-sync] uploadChatContext failed', err);
        }
    }

    function trimOfflineContextText(value, maxLength = 120000) {
        const text = String(value || '');
        if (text.length <= maxLength) return text;
        return text.slice(-maxLength);
    }

    async function uploadPromptContext(contactId) {
        const state = getState();
        if (!state.enabled || !state.apiBaseUrl || !contactId || !window.iphoneSimState) return;
        const contact = Array.isArray(window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts.find(item => String(item.id) === String(contactId))
            : null;
        if (!contact) return;

        const history = ((((window.iphoneSimState || {}).chatHistory || {})[contactId]) || []);
        const lightweightHistory = history.map(serializeMessageForOfflineContext);

        let worldbookContext = '';
        if (window.iphoneSimState.worldbook && window.iphoneSimState.worldbook.length > 0 && contact.linkedWbCategories) {
            const activeEntries = window.iphoneSimState.worldbook.filter(entry => entry.enabled && contact.linkedWbCategories.includes(entry.categoryId));
            if (activeEntries.length > 0) {
                worldbookContext = activeEntries.map(entry => entry.content).join('\n');
            }
        }

        let memoryContext = '';
        try {
            if (typeof window.buildMemoryContextByPolicy === 'function') {
                memoryContext = window.buildMemoryContextByPolicy(contact, lightweightHistory, 'chat-text') || '';
            }
        } catch (err) {
            console.error('[offline-push-sync] buildMemoryContextByPolicy failed', err);
        }

        let timeContext = '';
        try {
            if (typeof window.buildRealtimeTimeContext === 'function') {
                timeContext = window.buildRealtimeTimeContext(contact.id) || '';
            }
        } catch (err) {
            console.error('[offline-push-sync] buildRealtimeTimeContext failed', err);
        }

        let calendarContext = '';
        try {
            if (contact.calendarAwareEnabled !== false && typeof window.buildCalendarPromptContext === 'function') {
                calendarContext = window.buildCalendarPromptContext() || '';
            }
        } catch (err) {
            console.error('[offline-push-sync] buildCalendarPromptContext failed', err);
        }

        let itineraryContext = '';
        try {
            if (typeof window.getCurrentItineraryInfo === 'function') {
                itineraryContext = await window.getCurrentItineraryInfo(contact.id) || '';
            }
        } catch (err) {
            console.error('[offline-push-sync] getCurrentItineraryInfo failed', err);
        }

        let lookusContext = '';
        try {
            if (contact.lookusData) {
                const data = contact.lookusData;
                const lastUpdate = data.lastUpdateTime ? new Date(data.lastUpdateTime).toLocaleTimeString() : '未知';
                let appUsage = '';
                if (Array.isArray(data.appList) && data.appList.length > 0) {
                    appUsage = '\n- 最近使用的APP: ' + data.appList.map(app => `${app.name}(${app.time})`).join(', ');
                }
                lookusContext = `【LookUs 状态 (用户可见)】\n用户可以通过 "LookUs" 应用实时查看你的以下状态 (更新于 ${lastUpdate}):\n- 距离: ${data.distance || '未知'} km\n- 电量: ${data.battery || '未知'}\n- 网络: ${data.network || '未知'}\n- 手机型号: ${data.device || '未知'}\n- 屏幕使用时间: ${data.screenTimeH || 0}小时${data.screenTimeM || 0}分\n- 解锁次数: ${data.unlockCount || 0}\n- 最近解锁: ${data.lastUnlock || '未知'}\n- 停留地点数: ${data.stops || 0}${appUsage}\n⚠️ 你知道用户能看到这些信息。如果用户问起你的位置、电量或你在干什么，请结合这些信息回答。`;
                if (Array.isArray(data.reportLog) && data.reportLog.length > 0) {
                    const userEvents = data.reportLog.filter(item => item.isUserEvent).slice(0, 5);
                    if (userEvents.length > 0) {
                        lookusContext += `\n\n【用户的手机状态通知】\n你同样可以通过 LookUs 看到用户(对方)的手机状态变化：\n`;
                        userEvents.forEach(event => {
                            lookusContext += `- ${event.time}: ${String(event.text || '').replace('📱 ', '')}\n`;
                        });
                        lookusContext += `\n⚠️ 你可以自然地在聊天中提及或关心这些状态，但不要每次都提，要自然。`;
                    }
                }
            }
        } catch (err) {
            console.error('[offline-push-sync] build LookUs context failed', err);
        }

        let meetingContext = '';
        try {
            const meetings = window.iphoneSimState.meetings && window.iphoneSimState.meetings[contact.id];
            if (Array.isArray(meetings) && meetings.length > 0) {
                const syncedMeetings = meetings.filter(item => item && item.syncWithChat === true);
                const lastMeeting = syncedMeetings.length > 0 ? syncedMeetings[syncedMeetings.length - 1] : null;
                if (lastMeeting && Array.isArray(lastMeeting.content) && lastMeeting.content.length > 0) {
                    const meetingTime = new Date(lastMeeting.time || Date.now());
                    const meetingTimeStr = `${meetingTime.getMonth() + 1}月${meetingTime.getDate()}日`;
                    const recentContent = lastMeeting.content.slice(-5).map(item => `${item.role === 'user' ? '用户' : (contact.name || '联系人')}: ${item.text || ''}`).join('\n');
                    meetingContext = `【线下见面记忆】\n你们最近一次见面是在 ${meetingTimeStr} (${lastMeeting.title || '线下见面'})。\n当时发生的剧情片段：\n${recentContent}\n(请知晓你们已经见过面，并根据剧情发展进行聊天)`;
                }
            }
        } catch (err) {
            console.error('[offline-push-sync] build meeting context failed', err);
        }

        const importantStateContext = '';

        let frontendSystemPrompt = "";
        try {
            if (typeof window.buildAiPromptMessages === "function") {
                const promptMessages = await window.buildAiPromptMessages(contactId, null);
                const systemMessage = Array.isArray(promptMessages)
                    ? promptMessages.find(message => message && message.role === "system" && typeof message.content === "string" && message.content.trim())
                    : null;
                frontendSystemPrompt = systemMessage ? String(systemMessage.content || "") : "";
            }
        } catch (err) {
            console.error('[offline-push-sync] build frontend system prompt failed', err);
        }

        try {
            await apiFetch('/api/prompt-context', {
                method: 'POST',
                body: JSON.stringify({
                    userId: state.userId,
                    contactId,
                    worldbookContext: trimOfflineContextText(worldbookContext, 160000),
                    memoryContext: trimOfflineContextText(memoryContext, 160000),
                    importantStateContext: trimOfflineContextText(importantStateContext, 40000),
                    lookusContext: trimOfflineContextText(lookusContext, 80000),
                    meetingContext: trimOfflineContextText(meetingContext, 120000),
                    timeContext: trimOfflineContextText(timeContext, 20000),
                    calendarContext: trimOfflineContextText(calendarContext, 40000),
                    itineraryContext: trimOfflineContextText(itineraryContext, 40000),
                    frontendSystemPrompt: trimOfflineContextText(frontendSystemPrompt, 180000)
                })
            });
        } catch (err) {
            console.error('[offline-push-sync] uploadPromptContext failed', err);
        }
    }

    async function uploadChatSnapshot(contactId, options = {}) {
        const state = getState();
        if (!state.enabled || !state.apiBaseUrl || !contactId) return;
        const history = (((window.iphoneSimState || {}).chatHistory || {})[contactId]) || [];
        const lastMessage = history.length ? history[history.length - 1] : null;
        if (!lastMessage) return;
        const serializedLastMessage = serializeMessageForOfflineContext(lastMessage);
        try {
            await apiFetch('/api/messages/snapshot', {
                method: 'POST',
                keepalive: !!options.keepalive,
                body: JSON.stringify({
                    userId: state.userId,
                    contactId,
                    lastMessage: serializedLastMessage
                })
            });
            if (options.skipContext) return;
            await uploadChatContext(contactId);
            await uploadPromptContext(contactId);
        } catch (err) {
            console.error('[offline-push-sync] uploadChatSnapshot failed', err);
        }
    }

    function patchSaveConfig() {
        if (window.__offlinePushSavePatched || typeof window.saveConfig !== 'function') return;
        const originalSaveConfig = window.saveConfig;
        window.saveConfig = function() {
            const result = originalSaveConfig.apply(this, arguments);
            try {
                const state = getState();
                if (state.enabled && Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)) {
                    uploadAiProfile();
                    (window.iphoneSimState.contacts || []).forEach((contact) => {
                        uploadContactConfig(contact);
                    });
                    const currentId = window.iphoneSimState.currentChatContactId;
                    if (currentId) uploadChatSnapshot(currentId);
                }
            } catch (err) {
                console.error('[offline-push-sync] save patch failed', err);
            }
            return result;
        };
        window.__offlinePushSavePatched = true;
    }

    function setupVisibilitySync() {
        if (window.__offlinePushVisibilitySyncSetup) return;
        window.__offlinePushVisibilitySyncSetup = true;
        const flushStateToBackend = async () => {
            try {
                const state = getState();
                if (!state.enabled || !state.apiBaseUrl || !window.iphoneSimState) return;
                if (typeof window.flushChatPersistence === 'function') {
                    await window.flushChatPersistence();
                }
                const currentId = window.iphoneSimState.currentChatContactId;
                if (currentId) {
                    const currentContact = typeof getContactById === 'function' ? getContactById(currentId) : null;
                    if (currentContact) {
                        uploadContactConfig(currentContact, { keepalive: true });
                    }
                    uploadChatSnapshot(currentId, { keepalive: true, skipContext: true });
                    return;
                }
                if (Array.isArray(window.iphoneSimState.contacts)) {
                    const activeContact = (window.iphoneSimState.contacts || []).find(contact => contact && contact.activeReplyEnabled);
                    if (activeContact) {
                        uploadContactConfig(activeContact, { keepalive: true });
                    }
                }
            } catch (err) {
                console.error('[offline-push-sync] flushStateToBackend failed', err);
            }
        };
        const scheduleForegroundCatchUpSync = () => {
            [0, 600, 1800, 3600].forEach((delay) => {
                window.setTimeout(() => {
                    syncMessages().catch(err => console.error('[offline-push-sync] foreground sync failed', err));
                }, delay);
            });
        };
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                flushStateToBackend().catch(err => console.error('[offline-push-sync] hidden flush failed', err));
            } else {
                scheduleForegroundCatchUpSync();
            }
        });
        window.addEventListener('pagehide', () => {
            flushStateToBackend().catch(err => console.error('[offline-push-sync] pagehide flush failed', err));
        });
        window.addEventListener('focus', () => {
            scheduleForegroundCatchUpSync();
        });
        window.addEventListener('pageshow', scheduleForegroundCatchUpSync);
        window.addEventListener('online', scheduleForegroundCatchUpSync);
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', async (event) => {
                const data = event && event.data;
                if (!data) return;
                const payload = data.payload || {};
                if (data.type === 'offline-push-sync') {
                    try {
                        const pushedMessages = extractRemoteMessagesFromPushPayload(payload);
                        if (pushedMessages.length) {
                            injectRemoteMessages(pushedMessages);
                        }
                    } catch (err) {
                        console.error('[offline-push-sync] inject push payload failed', err);
                    }
                    schedulePushTriggeredSync();
                    return;
                }
                if (data.type !== 'offline-push-open-chat') return;
                try {
                    const pushedMessages = extractRemoteMessagesFromPushPayload(payload);
                    if (pushedMessages.length) {
                        injectRemoteMessages(pushedMessages);
                    }
                } catch (err) {
                    console.error('[offline-push-sync] inject push payload before open failed', err);
                }
                try {
                    await syncMessages();
                } catch (err) {
                    console.error(err);
                }
                if (payload.contactId && typeof window.openChat === 'function') {
                    try { window.openChat(resolveLocalContactId(payload.contactId)); } catch (err) { console.error(err); }
                }
            });
        }
    }

    async function initOfflinePushSync() {
        const state = getState();
        patchSaveConfig();
        setupVisibilitySync();
        repairExistingOfflineMessages();
        try {
            const url = new URL(window.location.href);
            const contactId = url.searchParams.get('contactId');
            const shouldOpenChat = url.searchParams.get('openChat') === '1';
            if (contactId && shouldOpenChat && typeof window.openChat === 'function') {
                setTimeout(() => {
                    try { window.openChat(resolveLocalContactId(contactId)); } catch (err) { console.error(err); }
                }, 300);
            }
        } catch (err) {
            console.error('[offline-push-sync] parse launch params failed', err);
        }
        if (!state.enabled) return;
        try {
            await registerServiceWorker();
        } catch (err) {
            console.error('[offline-push-sync] registerServiceWorker failed', err);
        }
        try {
            if (state.vapidPublicKey && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                await subscribePush();
            }
        } catch (err) {
            console.error('[offline-push-sync] restore push subscription failed', err);
        }
        try {
            await uploadAiProfile();
        } catch (err) {
            console.error('[offline-push-sync] initial uploadAiProfile failed', err);
        }
        try {
            const contacts = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
                ? (window.iphoneSimState.contacts || [])
                : [];
            if (contacts.length) {
                for (const contact of contacts) {
                    if (!contact) continue;
                    await uploadContactConfig(contact);
                }
            }
            const currentId = window.iphoneSimState && window.iphoneSimState.currentChatContactId;
            if (currentId) {
                await uploadChatSnapshot(currentId, { skipContext: true });
            } else if (contacts.length) {
                for (const contact of contacts) {
                    if (!contact || !contact.activeReplyEnabled) continue;
                    const history = (((window.iphoneSimState || {}).chatHistory || {})[contact.id]) || [];
                    if (!history.length) continue;
                    await uploadChatSnapshot(contact.id, { skipContext: true });
                }
            }
        } catch (err) {
            console.error('[offline-push-sync] initial upload state failed', err);
        }
        try {
            await syncActiveReplyConfig();
        } catch (err) {
            console.error('[offline-push-sync] syncActiveReplyConfig failed', err);
        }
        try {
            await syncMessages();
        } catch (err) {
            console.error('[offline-push-sync] initial sync failed', err);
        }
        startAutoSyncLoop();
    }

    async function enableWithConfig(config) {
        const state = getState();
        if (config && typeof config === 'object') {
            Object.assign(state, config);
        }
        state.enabled = true;
        saveState();
        await initOfflinePushSync();
        return subscribePush();
    }

    window.offlinePushSync = {
        getState,
        init: initOfflinePushSync,
        enableWithConfig,
        subscribePush,
        syncMessages,
        deleteMessages,
        syncActiveReplyConfig,
        uploadContactConfig,
        uploadChatSnapshot
    };

    if (window.appInitFunctions) {
        window.appInitFunctions.push(initOfflinePushSync);
    }
})();
