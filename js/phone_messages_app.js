(function () {
    const smsAvatarUrl = 'https://i.postimg.cc/NMVGVf9y/quality-restoration-20260405214201270.png';
    const NORMAL_MESSAGE_KEYS = [
        'verification_codes',
        'delivery_notifications',
        'food_delivery_notifications',
        'unknown_numbers',
        'carrier_messages',
        'bank_alerts'
    ];

    const FALLBACK_MESSAGES_DATA = {
        verification_codes: [
            {
                sender: '1069453810010',
                remark: '',
                time: '2026-04-05 22:11',
                content: '\u3010\u54d4\u54e9\u54d4\u54e9\u3011\u60a8\u7684\u9a8c\u8bc1\u7801\u662f 718302\uff0c5 \u5206\u949f\u5185\u6709\u6548\uff0c\u8bf7\u52ff\u6cc4\u9732\u3002',
                unread: true,
                source_type: '\u9a8c\u8bc1\u7801',
                related_to_user: true,
                hidden_tension: '\u6df1\u591c\u9a8c\u8bc1\u7801\u672c\u8eab\u5c31\u5f88\u5bb9\u6613\u8ba9\u4eba\u591a\u60f3\u3002',
                owner_reply: '',
                owner_reply_time: ''
            }
        ],
        delivery_notifications: [
            {
                sender: '\u83dc\u9e1f',
                remark: '',
                time: '2026-04-05 16:20',
                content: '\u3010\u83dc\u9e1f\u3011\u60a8\u7684\u5feb\u9012\u5df2\u7531\u4e2d\u901a\u5feb\u9012\u4ee3\u4e3a\u7b7e\u6536\uff0c\u611f\u8c22\u60a8\u4f7f\u7528\u83dc\u9e1f\u670d\u52a1\u3002',
                unread: false,
                source_type: '\u5feb\u9012',
                related_to_user: true,
                hidden_tension: '\u4ee3\u7b7e\u6536\u8fd9\u79cd\u72b6\u6001\u4f1a\u7559\u4e0b\u5f88\u660e\u663e\u7684\u751f\u6d3b\u75d5\u8ff9\u3002',
                owner_reply: '',
                owner_reply_time: ''
            }
        ],
        food_delivery_notifications: [
            {
                sender: '134****8899',
                remark: '',
                time: '2026-04-05 18:45',
                content: '\u4f60\u597d\u9910\u5230\u4e86\uff0c\u653e\u95e8\u53e3\u4e86',
                unread: false,
                source_type: '\u5916\u5356',
                related_to_user: false,
                hidden_tension: '\u7b80\u77ed\u77ed\u4fe1\u6bd4\u5e73\u53f0\u6a21\u677f\u66f4\u50cf\u73b0\u5b9e\u91cc\u4f1a\u7559\u4e0b\u7684\u788e\u7247\u3002',
                owner_reply: '\u597d\uff0c\u8c22\u8c22\uff0c\u6211\u4e00\u4f1a\u513f\u53d6\u3002',
                owner_reply_time: '2026-04-05 18:46'
            }
        ],
        unknown_numbers: [
            {
                sender: '185****1102',
                remark: '',
                time: '2026-04-05 20:15',
                content: '\u5c0f\u65b9\u54e5\uff0c\u6211\u662f\u4e0a\u6b21Livehouse\u7684\u8c03\u97f3\u5e08\u5c0f\u674e\uff0c\u9e23\u54e5\u8ba9\u6211\u8ddf\u60a8\u7ea6\u4e0b\u5468\u4e09\u7684\u6392\u7ec3\u65f6\u95f4\u3002',
                unread: false,
                source_type: '\u964c\u751f\u53f7\u7801',
                related_to_user: true,
                hidden_tension: '\u53f7\u7801\u548c\u5185\u5bb9\u90fd\u6b63\u5e38\uff0c\u4f46\u4f1a\u8ba9\u4eba\u60f3\u77e5\u9053\u201c\u9e23\u54e5\u201d\u662f\u8c01\u3002',
                owner_reply: '\u4e0b\u5468\u4e09\u665a\u4e0a\u53ef\u4ee5\uff0c\u4f60\u5148\u628a\u65f6\u95f4\u5b9a\u4e0b\u6765\u53d1\u6211\u3002',
                owner_reply_time: '2026-04-05 20:18'
            }
        ],
        carrier_messages: [
            {
                sender: '10086',
                remark: '',
                time: '2026-04-05 17:00',
                content: '\u3010\u4e2d\u56fd\u79fb\u52a8\u3011\u60a8\u672c\u6708\u56fd\u5185\u901a\u7528\u6d41\u91cf\u5df2\u4f7f\u7528 8.92GB\uff0c\u611f\u8c22\u4f7f\u7528\u3002',
                unread: false,
                source_type: '\u8fd0\u8425\u5546',
                related_to_user: false,
                hidden_tension: '\u8fd0\u8425\u5546\u77ed\u4fe1\u4e3b\u8981\u8d1f\u8d23\u628a\u7cfb\u7edf\u611f\u538b\u5b9e\u3002',
                owner_reply: '',
                owner_reply_time: ''
            }
        ],
        bank_alerts: [
            {
                sender: '95533',
                remark: '',
                time: '2026-04-05 19:00',
                content: '\u60a8\u5c3e\u53f71024\u7684\u50a8\u84c4\u5361\u8d26\u62374\u67085\u65e519:00\u7f8e\u56e2\u5916\u5356\u652f\u51fa38.00\u5143\uff0c\u6d3b\u671f\u4f59\u989d15,884.21\u5143\u3002',
                unread: false,
                source_type: '\u94f6\u884c',
                related_to_user: true,
                hidden_tension: '\u5c0f\u989d\u6d88\u8d39\u63d0\u9192\u8868\u9762\u6b63\u5e38\uff0c\u4f46\u548c\u5916\u5356\u901a\u77e5\u53e0\u8d77\u6765\u5f88\u50cf\u5f53\u5929\u7684\u5b8c\u6574\u75d5\u8ff9\u3002',
                owner_reply: '',
                owner_reply_time: ''
            }
        ],
        deleted_threads: [
            {
                sender: '186****4471',
                remark: '\u5c0f\u72d7',
                last_time: '2026-04-05 22:42',
                last_preview: '\u6211\u8fd8\u6ca1\u5403\u9971',
                unread_count: 1,
                deleted_at: '2026-04-05 22:43',
                related_to_user: true,
                hidden_tension: '\u5220\u5f97\u592a\u8fd1\uff0c\u4f1a\u8ba9\u4eba\u60f3\u70b9\u8fdb\u53bb\u770b\u3002',
                owner_reply: '\u90a3\u4f60\u5148\u53bb\u5403\uff0c\u522b\u7b49\u6211\u4e86\u3002',
                owner_reply_time: '2026-04-05 22:43'
            },
            {
                sender: '139****1208',
                remark: '\u8c22\u9e23',
                last_time: '2026-04-05 22:40',
                last_preview: '\u884c\uff0c\u90a3\u4f60\u5148\u5fd9\u4f60\u7684\u3002',
                unread_count: 0,
                deleted_at: '2026-04-05 22:41',
                related_to_user: true,
                hidden_tension: '\u5185\u5bb9\u770b\u4f3c\u666e\u901a\uff0c\u4f46\u548c\u5220\u9664\u52a8\u4f5c\u653e\u5728\u4e00\u8d77\u5c31\u4f1a\u663e\u5f97\u5fae\u5999\u3002',
                owner_reply: '',
                owner_reply_time: ''
            }
        ],
        generated_at: '2026-04-05 22:45:00'
    };

    const state = {
        currentContactId: null,
        activeThreadId: null,
        searchTerm: '',
        messagesData: null,
        items: [],
        threads: []
    };

    function getPhoneContentStore(contactId) {
        const appState = window.iphoneSimState || {};
        if (!appState.phoneContent) appState.phoneContent = {};
        if (contactId && !appState.phoneContent[contactId]) appState.phoneContent[contactId] = {};
        return contactId ? appState.phoneContent[contactId] : {};
    }

    function normalizeMessagesData(raw, contactId = null) {
        const contact = contactId && window.iphoneSimState && Array.isArray(window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts.find((item) => item.id === contactId) || null
            : null;
        if (typeof window.normalizePhoneMessagesAiPayload === 'function') {
            return window.normalizePhoneMessagesAiPayload(raw, '', contact);
        }
        return raw && typeof raw === 'object' ? raw : FALLBACK_MESSAGES_DATA;
    }

    function getMessagesDataForContact(contactId) {
        const store = getPhoneContentStore(contactId);
        return normalizeMessagesData(store.messagesData || FALLBACK_MESSAGES_DATA, contactId);
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function toTimestamp(value) {
        const text = String(value || '').trim();
        if (!text) return 0;

        const direct = Date.parse(text.replace(' ', 'T'));
        if (Number.isFinite(direct)) return direct;

        const slashParsed = Date.parse(text.replace(/-/g, '/'));
        if (Number.isFinite(slashParsed)) return slashParsed;

        return 0;
    }

    function padNumber(value) {
        return String(value).padStart(2, '0');
    }

    function formatListTime(value) {
        const timestamp = toTimestamp(value);
        if (!timestamp) return String(value || '');

        const date = new Date(timestamp);
        const now = new Date();
        const sameDay = date.getFullYear() === now.getFullYear()
            && date.getMonth() === now.getMonth()
            && date.getDate() === now.getDate();

        if (sameDay) return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
        if (date.getFullYear() === now.getFullYear()) return `${date.getMonth() + 1}\u6708${date.getDate()}\u65e5`;
        return `${date.getFullYear()}/${padNumber(date.getMonth() + 1)}/${padNumber(date.getDate())}`;
    }

    function formatChatDayLabel(value) {
        const timestamp = toTimestamp(value);
        if (!timestamp) return 'Today';

        const date = new Date(timestamp);
        const now = new Date();
        const sameDay = date.getFullYear() === now.getFullYear()
            && date.getMonth() === now.getMonth()
            && date.getDate() === now.getDate();
        const timeText = `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;

        return sameDay ? `Today ${timeText}` : `${date.getMonth() + 1}\u6708${date.getDate()}\u65e5 ${timeText}`;
    }

    function makeStableId(prefix, parts) {
        const base = parts
            .map((part) => String(part || '').trim().toLowerCase())
            .join('-')
            .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-')
            .replace(/^-+|-+$/g, '');
        return `${prefix}-${base || 'item'}`;
    }

    function getLineBadge(sender) {
        const normalized = String(sender || '').trim();
        if (!normalized) return '\u4e3b\u53f7';

        const isMaskedMobile = /^1\d{2}\*{2,}\d{2,4}$/.test(normalized);
        const isFullMobile = /^1[3-9]\d{9}$/.test(normalized);
        return (isMaskedMobile || isFullMobile) ? '\u526f\u53f7' : '\u4e3b\u53f7';
    }

    function buildAvatarMarkup(extraClass = '') {
        const classes = ['messages-avatar', 'sms-avatar', 'has-image'];
        if (extraClass) classes.push(extraClass);
        return `<div class="${classes.join(' ')}" style="background-image:url('${smsAvatarUrl}')"></div>`;
    }

    function pushEntryMessages(thread, entry, entryIndex, key) {
        const baseTime = toTimestamp(entry.time);
        const baseId = `${thread.id}-msg-${key}-${entryIndex}`;

        thread.messages.push({
            id: `${baseId}-recv`,
            role: 'received',
            time: String(entry.time || '').trim(),
            text: String(entry.content || '').trim(),
            unread: !!entry.unread,
            sortTime: baseTime,
            sortOrder: 0
        });

        if (String(entry.owner_reply || '').trim()) {
            const replyTimeText = String(entry.owner_reply_time || '').trim() || String(entry.time || '').trim();
            const replyTime = toTimestamp(replyTimeText) || (baseTime ? baseTime + 60000 : 1);
            thread.messages.push({
                id: `${baseId}-sent`,
                role: 'sent',
                time: replyTimeText,
                text: String(entry.owner_reply || '').trim(),
                unread: false,
                sortTime: replyTime,
                sortOrder: 1
            });
        }
    }

    function sortMessages(messages) {
        return messages.slice().sort((a, b) => {
            if (a.sortTime !== b.sortTime) return a.sortTime - b.sortTime;
            return (a.sortOrder || 0) - (b.sortOrder || 0);
        });
    }

    function buildConversationItems(messagesData) {
        const groupedThreads = new Map();

        NORMAL_MESSAGE_KEYS.forEach((key) => {
            const entries = Array.isArray(messagesData[key]) ? messagesData[key] : [];
            entries.forEach((entry, index) => {
                const sender = String(entry.sender || '').trim();
                const remark = String(entry.remark || '').trim();
                const content = String(entry.content || '').trim();
                if (!sender || !content) return;

                const groupKey = `${sender}__${remark}`;
                if (!groupedThreads.has(groupKey)) {
                    groupedThreads.set(groupKey, {
                        id: makeStableId('phone-thread', [sender, remark]),
                        kind: 'thread',
                        sender,
                        remark,
                        displayName: remark || sender,
                        searchText: `${sender} ${remark}`,
                        messages: []
                    });
                }

                pushEntryMessages(groupedThreads.get(groupKey), entry, index, key);
            });
        });

        const threads = Array.from(groupedThreads.values()).map((thread) => {
            const sortedMessages = sortMessages(thread.messages);
            const latestMessage = sortedMessages[sortedMessages.length - 1] || {};
            const firstMessage = sortedMessages[0] || latestMessage;
            const previewText = latestMessage.role === 'sent'
                ? `\u4f60\uff1a${latestMessage.text || ''}`
                : (latestMessage.text || '');
            const preview = thread.remark && thread.remark !== thread.sender && latestMessage.role !== 'sent'
                ? `${thread.sender} \u00b7 ${previewText}`
                : previewText;

            return {
                ...thread,
                messages: sortedMessages,
                preview,
                unread: sortedMessages.some((message) => message.unread),
                badge: getLineBadge(thread.sender),
                timeLabel: formatListTime(latestMessage.time),
                dayLabel: formatChatDayLabel(firstMessage.time || latestMessage.time),
                sortTime: latestMessage.sortTime || 0,
                searchText: `${thread.searchText} ${preview}`.trim()
            };
        });

        const deletedThreads = (Array.isArray(messagesData.deleted_threads) ? messagesData.deleted_threads : []).map((entry, index) => {
            const sender = String(entry.sender || '').trim();
            const remark = String(entry.remark || '').trim();
            const preview = String(entry.last_preview || '').trim();
            const sortSource = entry.deleted_at || entry.last_time || '';
            const unreadCount = Number(entry.unread_count || 0) || 0;
            const id = makeStableId('phone-deleted', [sender, remark, index]);
            const messages = [];

            if (preview) {
                messages.push({
                    id: `${id}-recv`,
                    role: 'received',
                    time: String(entry.last_time || entry.deleted_at || '').trim(),
                    text: preview,
                    unread: unreadCount > 0,
                    sortTime: toTimestamp(entry.last_time || entry.deleted_at || ''),
                    sortOrder: 0
                });
            }

            if (String(entry.owner_reply || '').trim()) {
                const replyTimeText = String(entry.owner_reply_time || '').trim() || String(entry.last_time || entry.deleted_at || '').trim();
                messages.push({
                    id: `${id}-sent`,
                    role: 'sent',
                    time: replyTimeText,
                    text: String(entry.owner_reply || '').trim(),
                    unread: false,
                    sortTime: toTimestamp(replyTimeText) || (toTimestamp(entry.last_time || entry.deleted_at || '') + 60000),
                    sortOrder: 1
                });
            }

            const sortedMessages = sortMessages(messages);
            const latestMessage = sortedMessages[sortedMessages.length - 1] || {};
            const previewText = latestMessage.role === 'sent'
                ? `\u4f60\uff1a${latestMessage.text || ''}`
                : (latestMessage.text || preview);

            return {
                id,
                kind: 'deleted',
                sender,
                remark,
                displayName: remark || sender,
                preview: previewText,
                unread: unreadCount > 0,
                unreadCount,
                badge: getLineBadge(sender),
                timeLabel: formatListTime(sortSource),
                dayLabel: formatChatDayLabel(entry.last_time || entry.deleted_at || sortSource),
                sortTime: toTimestamp(sortSource),
                statusText: '\u5df2\u5220\u9664\u4f1a\u8bdd',
                messages: sortedMessages,
                searchText: `${sender} ${remark} ${previewText}`.trim()
            };
        });

        const allThreads = [...threads, ...deletedThreads].sort((a, b) => b.sortTime - a.sortTime);
        return { threads: allThreads, items: allThreads };
    }

    function getThread(threadId) {
        return state.threads.find((thread) => thread.id === threadId) || null;
    }

    function syncMessagesState(contactId) {
        if (contactId != null) state.currentContactId = contactId;

        state.messagesData = getMessagesDataForContact(state.currentContactId);
        const built = buildConversationItems(state.messagesData);
        state.threads = built.threads;
        state.items = built.items;

        if (!state.activeThreadId || !getThread(state.activeThreadId)) {
            state.activeThreadId = state.threads[0] ? state.threads[0].id : null;
        }
    }

    function buildThreadItemMarkup(item) {
        const unreadClass = item.unread ? ' is-unread' : '';
        const deletedClass = item.kind === 'deleted' ? ' messages-thread-item-deleted' : '';
        const mainClass = item.kind === 'deleted' ? ' messages-thread-main-deleted' : '';
        const nameClass = item.kind === 'deleted' ? ' messages-thread-name-deleted' : '';
        const timeClass = item.kind === 'deleted' ? ' messages-thread-time-deleted' : '';
        const previewClass = item.kind === 'deleted' ? ' messages-thread-preview-deleted' : '';

        return `
            <button class="messages-thread-item${deletedClass}${unreadClass}" type="button" data-item-kind="${item.kind}" data-thread-id="${item.id}">
                <div class="messages-unread-dot"></div>
                ${buildAvatarMarkup(item.kind === 'deleted' ? 'messages-avatar-deleted' : '')}
                <div class="messages-thread-main${mainClass}">
                    <div class="messages-thread-top">
                        <div class="messages-thread-name-wrap">
                            <div class="messages-thread-name${nameClass}">${escapeHtml(item.displayName)}</div>
                            ${item.kind === 'deleted' ? '<span class="messages-deleted-tag">\u5df2\u5220\u9664</span>' : ''}
                        </div>
                        <div class="messages-thread-meta-right">
                            <div class="messages-thread-time${timeClass}">${escapeHtml(item.timeLabel)}</div>
                            ${item.kind === 'deleted' && item.unreadCount > 0
                                ? `<span class="messages-deleted-count">${item.unreadCount}</span>`
                                : '<i class="fas fa-chevron-right messages-thread-chevron"></i>'}
                        </div>
                    </div>
                    <div class="messages-thread-preview${previewClass}">${item.badge ? `<span class="messages-thread-badge">${escapeHtml(item.badge)}</span>` : ''}${escapeHtml(item.preview)}</div>
                </div>
            </button>
        `;
    }

    function setListHeaderProgress(progress) {
        const app = document.getElementById('phone-messages');
        if (!app) return;

        const clamped = Math.max(0, Math.min(1, Number(progress) || 0));
        app.style.setProperty('--phone-messages-header-progress', clamped.toFixed(3));
        app.classList.toggle('list-header-compact', clamped >= 0.72);
    }

    function syncListHeaderProgress() {
        const listEl = document.getElementById('phone-messages-thread-list');
        const progress = listEl ? Math.min((listEl.scrollTop || 0) / 76, 1) : 0;
        setListHeaderProgress(progress);
    }

    function renderThreadList(filterText) {
        const listEl = document.getElementById('phone-messages-thread-list');
        if (!listEl) return;

        if (typeof filterText === 'string') state.searchTerm = filterText;

        const keyword = String(state.searchTerm || '').trim().toLowerCase();
        const visibleItems = keyword
            ? state.items.filter((item) => item.searchText.toLowerCase().includes(keyword))
            : state.items;

        if (!visibleItems.length) {
            listEl.innerHTML = '<div class="messages-empty-state">\u6682\u65e0\u77ed\u4fe1\u5185\u5bb9</div>';
            syncListHeaderProgress();
            return;
        }

        listEl.innerHTML = visibleItems.map(buildThreadItemMarkup).join('');
        syncListHeaderProgress();
    }

    function shouldShowTail(messages, index) {
        const current = messages[index];
        const next = messages[index + 1];
        if (!current) return false;
        return !next || next.role !== current.role;
    }

    function renderChat(threadId) {
        const thread = getThread(threadId);
        const avatarEl = document.getElementById('phone-messages-chat-avatar');
        const nameEl = document.getElementById('phone-messages-chat-name');
        const listEl = document.getElementById('phone-messages-chat-scroll');
        const app = document.getElementById('phone-messages');

        if (!avatarEl || !nameEl || !listEl || !app) return;

        if (!thread) {
            nameEl.textContent = '';
            avatarEl.className = 'messages-chat-avatar has-image';
            avatarEl.style.backgroundImage = `url('${smsAvatarUrl}')`;
            listEl.innerHTML = '<div class="messages-empty-state messages-empty-state-chat">\u6682\u65e0\u53ef\u67e5\u770b\u7684\u77ed\u4fe1\u5185\u5bb9</div>';
            app.classList.remove('chat-open');
            return;
        }

        nameEl.textContent = thread.displayName;
        avatarEl.className = 'messages-chat-avatar has-image';
        avatarEl.style.backgroundImage = `url('${smsAvatarUrl}')`;
        avatarEl.textContent = '';

        listEl.innerHTML = `
            <div class="messages-timestamp">${escapeHtml(thread.dayLabel || 'Today')}</div>
            ${thread.messages.map((message, index) => `
                <div class="messages-bubble-row ${message.role} margin-bottom">
                    <div class="messages-bubble ${message.role}${shouldShowTail(thread.messages, index) ? ' tail' : ''}">${escapeHtml(message.text)}</div>
                </div>
            `).join('')}
            ${thread.statusText ? `<div class="messages-status-text">${escapeHtml(thread.statusText)}</div>` : ''}
        `;

        listEl.scrollTop = 0;
    }

    function openThread(threadId) {
        const thread = getThread(threadId);
        if (!thread) return;

        state.activeThreadId = threadId;

        if (Array.isArray(thread.messages)) {
            thread.messages.forEach((message) => {
                message.unread = false;
            });
        }

        thread.unread = false;
        if (thread.kind === 'deleted') thread.unreadCount = 0;

        renderThreadList();
        renderChat(threadId);

        const app = document.getElementById('phone-messages');
        if (app) app.classList.add('chat-open');
    }

    function closeThread() {
        const app = document.getElementById('phone-messages');
        if (app) app.classList.remove('chat-open');
    }

    function closeApp() {
        const app = document.getElementById('phone-messages');
        if (app) {
            app.classList.add('hidden');
            app.classList.remove('chat-open');
        }

        state.searchTerm = '';
        const searchEl = document.getElementById('phone-messages-search-input');
        if (searchEl) searchEl.value = '';

        syncMessagesState(state.currentContactId);
        renderThreadList('');
        renderChat(state.activeThreadId);
        setListHeaderProgress(0);
    }

    function openApp(contactId) {
        if (contactId != null) state.currentContactId = contactId;
        state.searchTerm = '';

        const searchEl = document.getElementById('phone-messages-search-input');
        if (searchEl) searchEl.value = '';

        syncMessagesState(state.currentContactId);
        renderThreadList('');
        renderChat(state.activeThreadId);

        const app = document.getElementById('phone-messages');
        if (!app) return;
        app.classList.remove('hidden');
        app.classList.remove('chat-open');
        requestAnimationFrame(syncListHeaderProgress);
    }

    function refresh(contactId) {
        const app = document.getElementById('phone-messages');
        const wasChatOpen = !!(app && app.classList.contains('chat-open'));

        syncMessagesState(contactId != null ? contactId : state.currentContactId);
        renderThreadList();
        renderChat(state.activeThreadId);

        if (app) {
            if (wasChatOpen && state.activeThreadId) app.classList.add('chat-open');
            else if (!state.activeThreadId) app.classList.remove('chat-open');
        }

        requestAnimationFrame(syncListHeaderProgress);
    }

    function initPhoneMessagesApp() {
        const app = document.getElementById('phone-messages');
        if (!app) return;

        syncMessagesState(state.currentContactId);
        renderThreadList('');
        renderChat(state.activeThreadId);

        const titleBackBtn = document.getElementById('phone-messages-home-back');
        const compactBackBtn = document.getElementById('phone-messages-compact-back');
        const backBtn = document.getElementById('phone-messages-chat-back');
        const searchInput = document.getElementById('phone-messages-search-input');
        const threadList = document.getElementById('phone-messages-thread-list');
        const generateBtn = document.getElementById('phone-messages-generate-btn');
        const plusBtn = document.getElementById('phone-messages-plus-btn');
        const composeBtn = document.getElementById('phone-messages-compose-btn');
        const micBtn = document.getElementById('phone-messages-mic-btn');
        const composeInput = document.getElementById('phone-messages-compose-input');

        if (titleBackBtn) titleBackBtn.addEventListener('click', closeApp);
        if (compactBackBtn) compactBackBtn.addEventListener('click', closeApp);
        if (backBtn) backBtn.addEventListener('click', closeThread);

        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                if (typeof handlePhoneAppGenerate === 'function') handlePhoneAppGenerate('messages');
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (event) => {
                renderThreadList(event.target.value);
            });
        }

        if (threadList) {
            threadList.addEventListener('scroll', syncListHeaderProgress, { passive: true });
            threadList.addEventListener('click', (event) => {
                const item = event.target.closest('[data-thread-id]');
                if (!item) return;
                openThread(item.dataset.threadId);
            });
        }

        [plusBtn, composeBtn, micBtn].forEach((btn) => {
            if (!btn) return;
            btn.addEventListener('click', () => {
                if (composeInput) composeInput.focus();
            });
        });

        syncListHeaderProgress();

        window.PhoneMessagesApp = {
            open: openApp,
            close: closeApp,
            openThread,
            closeThread,
            refresh
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPhoneMessagesApp);
    } else {
        initPhoneMessagesApp();
    }
})();
