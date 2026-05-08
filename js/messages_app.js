(function () {
    const state = {
        activeThreadId: null,
        initialized: false,
        typingThreads: {},
        replyingToMsg: null,
        isMultiSelectMode: false,
        selectedMessages: new Set(),
        currentEditingMsgId: null,
        longPressTimer: null,
        menuCloseHandler: null,
        quickActionsCloseHandler: null
    };

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getContact(contactId) {
        const contacts = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts
            : [];
        return contacts.find(contact => String(contact.id) === String(contactId)) || null;
    }

    function getAllHistory(contactId) {
        if (!window.iphoneSimState || !window.iphoneSimState.chatHistory) return [];
        const history = window.iphoneSimState.chatHistory[contactId];
        return Array.isArray(history) ? history : [];
    }

    function getThreadName(contact) {
        return (contact && (contact.remark || contact.nickname || contact.name)) || '联系人';
    }

    function getUserName(contact) {
        if (contact && contact.userPersonaId && Array.isArray(window.iphoneSimState && window.iphoneSimState.userPersonas)) {
            const persona = window.iphoneSimState.userPersonas.find(item => String(item.id) === String(contact.userPersonaId));
            if (persona && persona.name) {
                return persona.name;
            }
        }
        const profile = window.iphoneSimState && window.iphoneSimState.userProfile;
        return (profile && profile.name) || '我';
    }

    function getMessageSpeakerName(message, contact) {
        if (message && message.role === 'user') {
            return getUserName(contact);
        }
        return getThreadName(contact);
    }

    function getMessagesChannelHistory(contactId) {
        return getAllHistory(contactId).filter(message => {
            if (!message) return false;
            if (typeof window.isChatMessageInChannel === 'function' && !window.isChatMessageInChannel(message, 'messages-app')) {
                return false;
            }
            if (typeof window.shouldHideChatSyncMsg === 'function' && window.shouldHideChatSyncMsg(message)) {
                return false;
            }
            return true;
        });
    }

    function formatThreadTime(timestamp) {
        if (typeof window.formatContactListTimeLabel === 'function') {
            return window.formatContactListTimeLabel(timestamp);
        }

        const time = Number(timestamp);
        if (!Number.isFinite(time) || time <= 0) return '';

        const date = new Date(time);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    function formatMessagePreview(message) {
        if (!message) return '[消息]';
        if (typeof window.formatLastMsgPreview === 'function') {
            return window.formatLastMsgPreview(message) || '[消息]';
        }
        return String(message.content || '[消息]');
    }

    function formatBubbleText(message) {
        if (!message) return '[消息]';

        if (message.type === 'text' || message.type === 'description' || message.type === 'html') {
            const content = String(message.content || '').trim();
            return content || '[消息]';
        }

        if (message.type === 'image' || message.type === 'virtual_image') {
            return String(message.description || '').trim() || '[图片]';
        }

        if (message.type === 'sticker') {
            return String(message.description || '').trim() || '[表情]';
        }

        if (message.type === 'voice') {
            return '[语音]';
        }

        return formatMessagePreview(message);
    }

    function formatReplyPreviewText(replyTo) {
        if (!replyTo) return '[消息]';

        if (replyTo.type === 'image' || replyTo.type === 'virtual_image') {
            return '[图片]';
        }
        if (replyTo.type === 'sticker') {
            return '[表情]';
        }
        if (replyTo.type === 'voice') {
            return '[语音]';
        }
        if (typeof window.isChatMediaReference === 'function' && window.isChatMediaReference(replyTo.content)) {
            return '[图片]';
        }

        const content = String(replyTo.content || replyTo.description || '').trim();
        return content || '[消息]';
    }

    function isRenderableMediaMessage(message) {
        if (!message) return false;
        return message.type === 'image' || message.type === 'virtual_image' || message.type === 'sticker';
    }

    function buildMediaBubbleMarkup(message) {
        if (!message || !isRenderableMediaMessage(message)) return '';

        const rawSrc = typeof message.content === 'string' ? message.content.trim() : '';
        if (!rawSrc) {
            return `<div class="messages-bubble-text">${escapeHtml(formatBubbleText(message)).replace(/\n/g, '<br>')}</div>`;
        }

        const isDeferredChatMedia = typeof window.isChatMediaReference === 'function' && window.isChatMediaReference(rawSrc);
        const initialImageSrc = isDeferredChatMedia
            ? (window.CHAT_MEDIA_PIXEL_PLACEHOLDER || '')
            : rawSrc;
        const deferredAttr = isDeferredChatMedia
            ? ` data-chat-media-ref="${encodeURIComponent(rawSrc)}"`
            : '';
        const mediaKindClass = message.type === 'sticker' ? 'is-sticker' : 'is-image';
        const altText = message.type === 'sticker'
            ? (String(message.description || '').trim() || '表情包')
            : (String(message.description || '').trim() || '图片');

        return `
            <div class="messages-bubble-media-shell ${mediaKindClass}">
                <img class="messages-bubble-media ${mediaKindClass}" src="${escapeHtml(initialImageSrc)}"${deferredAttr} alt="${escapeHtml(altText)}" loading="lazy" decoding="async" onclick="showImagePreview(this.src)">
            </div>
        `;
    }

    function hydrateDeferredMessagesMedia(container) {
        if (!container || typeof window.resolveChatMediaSrc !== 'function') return;

        container.querySelectorAll('img[data-chat-media-ref]').forEach(img => {
            if (img.dataset.chatMediaHydrated === '1') return;
            img.dataset.chatMediaHydrated = '1';

            const encodedRef = img.getAttribute('data-chat-media-ref');
            if (!encodedRef) return;

            const mediaRef = decodeURIComponent(encodedRef);
            window.resolveChatMediaSrc(mediaRef).then((resolvedSrc) => {
                if (!resolvedSrc) return;
                img.src = resolvedSrc;
            }).catch((error) => {
                console.warn('信息应用图片加载失败', error);
            });
        });
    }

    function buildThread(contactId) {
        const contact = getContact(contactId);
        if (!contact) return null;

        const messages = getMessagesChannelHistory(contactId);
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        const unreadCount = messages.filter(message => (
            message.role === 'assistant' && message.readInMessagesApp !== true
        )).length;

        return {
            id: String(contact.id),
            contactId: contact.id,
            name: getThreadName(contact),
            avatar: String(contact.avatar || '').trim(),
            messages,
            lastMessage,
            preview: formatMessagePreview(lastMessage),
            time: formatThreadTime(lastMessage && lastMessage.time),
            unreadCount,
            unread: unreadCount > 0
        };
    }

    function getThread(threadId) {
        if (threadId == null) return null;
        return buildThread(threadId);
    }

    function getAllThreads() {
        const contacts = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts
            : [];

        return contacts
            .map(contact => buildThread(contact.id))
            .filter(thread => thread && thread.messages.length > 0)
            .sort((threadA, threadB) => {
                const timeA = Number(threadA.lastMessage && threadA.lastMessage.time) || 0;
                const timeB = Number(threadB.lastMessage && threadB.lastMessage.time) || 0;
                return timeB - timeA;
            });
    }

    function ensureActiveReplyFields(contact) {
        if (!contact || typeof contact !== 'object') return contact;
        contact.activeReplyEnabled = !!contact.activeReplyEnabled;
        const interval = Number(contact.activeReplyInterval);
        contact.activeReplyInterval = Number.isFinite(interval) && interval >= 5 ? interval : 60;
        if (!Number.isFinite(Number(contact.activeReplyStartTime))) {
            contact.activeReplyStartTime = null;
        }
        return contact;
    }

    function getManageableThreads() {
        const allThreads = getAllThreads();
        const blockedThreads = allThreads.filter(thread => {
            const contact = getContact(thread.contactId);
            return contact && contact.wechatBlockedByUser === true;
        });
        return blockedThreads.length > 0 ? blockedThreads : allThreads;
    }

    function syncMessagesActiveReplyIntervalState() {
        const enabledInput = document.getElementById('messages-active-reply-enabled');
        const intervalGroup = document.getElementById('messages-active-reply-interval-group');
        const intervalInput = document.getElementById('messages-active-reply-interval');
        if (!enabledInput || !intervalGroup || !intervalInput) return;

        const enabled = !!enabledInput.checked;
        intervalGroup.style.opacity = enabled ? '1' : '0.55';
        intervalInput.disabled = !enabled;
    }

    function loadMessagesActiveReplyContactSettings(contactId) {
        const enabledInput = document.getElementById('messages-active-reply-enabled');
        const intervalInput = document.getElementById('messages-active-reply-interval');
        const saveBtn = document.getElementById('save-messages-active-reply-settings');
        const contact = getContact(contactId);
        if (!enabledInput || !intervalInput) return;

        if (!contact) {
            enabledInput.checked = false;
            enabledInput.disabled = true;
            intervalInput.value = 60;
            intervalInput.disabled = true;
            if (saveBtn) saveBtn.disabled = true;
            syncMessagesActiveReplyIntervalState();
            return;
        }

        ensureActiveReplyFields(contact);
        enabledInput.disabled = false;
        enabledInput.checked = !!contact.activeReplyEnabled;
        intervalInput.value = contact.activeReplyInterval || 60;
        if (saveBtn) saveBtn.disabled = false;
        syncMessagesActiveReplyIntervalState();
    }

    function populateMessagesActiveReplyContacts(preferredContactId = null) {
        const select = document.getElementById('messages-active-reply-contact');
        if (!select) return null;

        const threads = getManageableThreads();
        select.innerHTML = '';

        if (threads.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '暂无可设置联系人';
            select.appendChild(option);
            select.disabled = true;
            loadMessagesActiveReplyContactSettings(null);
            return null;
        }

        select.disabled = false;
        threads.forEach(thread => {
            const option = document.createElement('option');
            option.value = String(thread.contactId);
            option.textContent = thread.name;
            select.appendChild(option);
        });

        const preferredId = preferredContactId != null ? String(preferredContactId) : '';
        const matched = threads.find(thread => String(thread.contactId) === preferredId);
        const selectedId = matched ? String(matched.contactId) : String(threads[0].contactId);
        select.value = selectedId;
        loadMessagesActiveReplyContactSettings(selectedId);
        return selectedId;
    }

    function openMessagesActiveReplyModal() {
        const modal = document.getElementById('messages-active-reply-modal');
        if (!modal) return;
        populateMessagesActiveReplyContacts(state.activeThreadId);
        syncMessagesActiveReplyIntervalState();
        modal.classList.remove('hidden');
    }

    function closeMessagesActiveReplyModal() {
        const modal = document.getElementById('messages-active-reply-modal');
        if (modal) modal.classList.add('hidden');
    }

    function saveMessagesActiveReplySettings() {
        const contactSelect = document.getElementById('messages-active-reply-contact');
        const enabledInput = document.getElementById('messages-active-reply-enabled');
        const intervalInput = document.getElementById('messages-active-reply-interval');
        if (!contactSelect || !enabledInput || !intervalInput || !contactSelect.value) return false;

        const contact = getContact(contactSelect.value);
        if (!contact) return false;

        ensureActiveReplyFields(contact);
        const enabled = !!enabledInput.checked;
        const rawInterval = Number(intervalInput.value);
        const interval = Number.isFinite(rawInterval) && rawInterval >= 5 ? Math.round(rawInterval) : 60;

        contact.activeReplyEnabled = enabled;
        contact.activeReplyInterval = interval;
        contact.activeReplyStartTime = enabled ? Date.now() : null;

        if (typeof saveConfig === 'function') {
            saveConfig();
        }
        closeMessagesActiveReplyModal();

        if (typeof window.showChatToast === 'function') {
            window.showChatToast(enabled ? '已开启信息中的主动发消息' : '已关闭信息中的主动发消息', 2200);
        }

        return true;
    }
    function applyAvatarFill(element, avatarUrl, fallbackLabel) {
        if (!element) return;

        element.classList.remove('has-image');
        element.style.backgroundImage = '';
        element.textContent = fallbackLabel || '';

        if (!avatarUrl) return;

        element.classList.add('has-image');
        element.style.backgroundImage = `url("${String(avatarUrl).replace(/\"/g, '\\\"')}")`;
        element.textContent = '';
    }

    function enhanceThreadListAvatars(listEl) {
        listEl.querySelectorAll('[data-avatar-url]').forEach(avatarEl => {
            const rawAvatar = avatarEl.getAttribute('data-avatar-url');
            if (!rawAvatar) return;
            applyAvatarFill(avatarEl, rawAvatar, '');
        });
    }

    function setListHeaderProgress(progress) {
        const app = document.getElementById('messages-app');
        if (!app) return;

        const clamped = Math.max(0, Math.min(1, Number(progress) || 0));
        app.style.setProperty('--messages-list-header-progress', clamped.toFixed(3));
        app.classList.toggle('list-header-compact', clamped >= 0.72);
    }

    function syncListHeaderProgress() {
        const listEl = document.getElementById('messages-thread-list');
        const progress = listEl ? Math.min((listEl.scrollTop || 0) / 76, 1) : 0;
        setListHeaderProgress(progress);
    }

    function renderThreadList(filterText = '') {
        const listEl = document.getElementById('messages-thread-list');
        if (!listEl) return;

        const keyword = String(filterText || '').trim().toLowerCase();
        const threads = getAllThreads();
        const visibleThreads = keyword
            ? threads.filter(thread => `${thread.name} ${thread.preview}`.toLowerCase().includes(keyword))
            : threads;

        if (visibleThreads.length === 0) {
            listEl.innerHTML = '<div class="messages-empty-state">暂无消息</div>';
            syncListHeaderProgress();
            return;
        }

        listEl.innerHTML = visibleThreads.map(thread => {
            const unreadClass = thread.unread ? ' is-unread' : '';
            const avatarMarkup = thread.avatar
                ? `<div class="messages-avatar" data-avatar-url="${escapeHtml(thread.avatar)}"></div>`
                : `<div class="messages-avatar">${escapeHtml(thread.name.slice(0, 1))}</div>`;

            return `
                <button class="messages-thread-item${unreadClass}" type="button" data-thread-id="${thread.id}">
                    <div class="messages-unread-dot"></div>
                    ${avatarMarkup}
                    <div class="messages-thread-main">
                        <div class="messages-thread-top">
                            <div class="messages-thread-name">${escapeHtml(thread.name)}</div>
                            <div class="messages-thread-meta-right">
                                <div class="messages-thread-time">${escapeHtml(thread.time || '')}</div>
                                <i class="fas fa-chevron-right messages-thread-chevron"></i>
                            </div>
                        </div>
                        <div class="messages-thread-preview">${escapeHtml(thread.preview || '[消息]')}</div>
                    </div>
                </button>
            `;
        }).join('');

        enhanceThreadListAvatars(listEl);
        syncListHeaderProgress();
    }

    function resolveReplyTargetRoleClass(message) {
        if (!message || !message.replyTo || !message.replyTo.targetMsgId) return '';
        const targetMessage = findMessageInActiveThread(message.replyTo.targetMsgId);
        if (!targetMessage) return '';
        return targetMessage.role === 'user' ? 'sent' : 'received';
    }

    function buildReplySourceBubbleMarkup(message, roleClass) {
        if (!message || !message.replyTo) return '';
        const targetRoleClass = roleClass === 'sent' ? 'received' : 'sent';
        return `
            <div class="messages-reply-source ${targetRoleClass}" aria-hidden="true">
                <div class="messages-reply-source-text">${escapeHtml(formatReplyPreviewText(message.replyTo)).replace(/\n/g, '<br>')}</div>
            </div>
        `;
    }

    function buildReplyThreadMarkup(message, roleClass) {
        if (!message || !message.replyTo) return '';
        const targetRoleClass = roleClass;
        return `<div class="messages-reply-thread from-${targetRoleClass} to-${roleClass}" aria-hidden="true"></div>`;
    }

    function buildBubbleMarkup(messages) {
        return messages.map((message, index) => {
            const messageId = message && message.id != null ? String(message.id) : `messages-${index}`;
            const roleClass = message.role === 'user' ? 'sent' : 'received';
            const nextMessage = messages[index + 1] || null;
            const nextRoleClass = nextMessage
                ? (nextMessage.role === 'user' ? 'sent' : 'received')
                : null;
            const isTail = nextRoleClass !== roleClass;
            const bubbleClasses = `messages-bubble ${roleClass}${isTail ? ' tail' : ''}`;
            const hasReply = !!message.replyTo;
            const replySourceMarkup = hasReply ? buildReplySourceBubbleMarkup(message, roleClass) : '';
            const replyThreadMarkup = hasReply ? buildReplyThreadMarkup(message, roleClass) : '';
            const rowClasses = `messages-bubble-row ${roleClass}${isTail ? ' margin-bottom' : ''}${hasReply ? ' is-inline-reply' : ''}`;
            const selectedClass = state.selectedMessages.has(messageId) ? ' selected' : '';
            const isMediaMessage = isRenderableMediaMessage(message);
            const bubbleExtraClasses = isMediaMessage
                ? ` is-media ${message.type === 'sticker' ? 'is-sticker' : 'is-image'}`
                : '';
            const bubbleContentMarkup = isMediaMessage
                ? buildMediaBubbleMarkup(message)
                : `<div class="messages-bubble-text">${escapeHtml(formatBubbleText(message)).replace(/\n/g, '<br>')}</div>`;

            return `
                <div class="${rowClasses}${selectedClass}" data-msg-id="${escapeHtml(messageId)}" data-role="${roleClass}">
                    <input type="checkbox" class="messages-msg-select-checkbox" tabindex="-1" aria-hidden="true"${state.selectedMessages.has(messageId) ? ' checked' : ''}>
                    ${replySourceMarkup}
                    ${replyThreadMarkup}
                    <div class="${bubbleClasses}${bubbleExtraClasses}" data-msg-id="${escapeHtml(messageId)}">
                        ${bubbleContentMarkup}
                    </div>
                </div>
            `;
        }).join('');
    }

    function setThreadTyping(threadId, isTyping) {
        if (threadId == null) return;
        const key = String(threadId);
        if (isTyping) {
            state.typingThreads[key] = Date.now();
            return;
        }
        delete state.typingThreads[key];
    }

    function isThreadTyping(threadId, thread = null) {
        if (threadId == null) return false;
        const key = String(threadId);
        const startedAt = Number(state.typingThreads[key]) || 0;
        if (!startedAt) return false;

        const currentThread = thread || getThread(threadId);
        const lastMessage = currentThread && currentThread.lastMessage ? currentThread.lastMessage : null;
        if (lastMessage && lastMessage.role === 'assistant' && Number(lastMessage.time) >= startedAt) {
            delete state.typingThreads[key];
            return false;
        }

        return true;
    }

    function buildTypingBubbleMarkup() {
        return `
            <div class="messages-bubble-row received margin-bottom messages-typing-row">
                <div class="messages-bubble received tail messages-typing-bubble" aria-label="对方正在输入">
                    <span class="messages-typing-dot"></span>
                    <span class="messages-typing-dot"></span>
                    <span class="messages-typing-dot"></span>
                </div>
            </div>
        `;
    }

    function findMessageInActiveThread(msgId) {
        if (!state.activeThreadId || !msgId) return null;
        return getAllHistory(state.activeThreadId).find(message => String(message && message.id) === String(msgId)) || null;
    }

    function buildReplyPayloadFromMessage(message, contact) {
        if (!message) return null;
        return {
            content: formatReplyPreviewText(message),
            name: getMessageSpeakerName(message, contact),
            targetMsgId: message.id ? String(message.id) : '',
            targetTimestamp: Number(message.time) || null,
            type: message.type || 'text'
        };
    }

    function closeContextMenu() {
        const oldMenu = document.querySelector('.messages-context-menu');
        if (oldMenu) oldMenu.remove();
        if (state.menuCloseHandler) {
            document.removeEventListener('click', state.menuCloseHandler, true);
            document.removeEventListener('touchstart', state.menuCloseHandler, true);
            state.menuCloseHandler = null;
        }
    }

    function ensureQuickActionsMenu() {
        const chatView = document.querySelector('#messages-app .messages-chat-view');
        if (!chatView) return null;

        let menu = document.getElementById('messages-quick-actions-menu');
        if (menu) return menu;

        menu = document.createElement('div');
        menu.id = 'messages-quick-actions-menu';
        menu.className = 'messages-quick-actions-menu';
        menu.setAttribute('aria-hidden', 'true');
        menu.innerHTML = `
            <button type="button" class="messages-quick-action-btn" data-action="regenerate" aria-label="重回">
                <i class="ri-rewind-mini-line" aria-hidden="true"></i>
                <span>重回</span>
            </button>
            <button type="button" class="messages-quick-action-btn" data-action="continue" aria-label="让TA发消息">
                <i class="ri-chat-1-line" aria-hidden="true"></i>
                <span>让TA发消息</span>
            </button>
        `;

        menu.querySelector('[data-action="regenerate"]')?.addEventListener('click', async (event) => {
            event.stopPropagation();
            closeQuickActionsMenu();
            await handleMessagesRegenerateReply();
        });

        menu.querySelector('[data-action="continue"]')?.addEventListener('click', async (event) => {
            event.stopPropagation();
            closeQuickActionsMenu();
            await triggerThreadAiReply('用户没有回复。请继续当前的对话，或者开启一个新的话题。你可以假设已经过了一段时间。');
        });

        chatView.appendChild(menu);
        return menu;
    }

    function closeQuickActionsMenu() {
        const menu = document.getElementById('messages-quick-actions-menu');
        const plusBtn = document.getElementById('messages-plus-btn');
        if (menu) {
            menu.classList.remove('is-open');
            menu.setAttribute('aria-hidden', 'true');
        }
        if (plusBtn) {
            plusBtn.classList.remove('is-active');
            plusBtn.setAttribute('aria-expanded', 'false');
        }
        if (state.quickActionsCloseHandler) {
            document.removeEventListener('click', state.quickActionsCloseHandler, true);
            document.removeEventListener('touchstart', state.quickActionsCloseHandler, true);
            state.quickActionsCloseHandler = null;
        }
    }

    function openQuickActionsMenu(anchorBtn) {
        const menu = ensureQuickActionsMenu();
        if (!menu) return false;

        closeContextMenu();

        menu.classList.add('is-open');
        menu.setAttribute('aria-hidden', 'false');
        if (anchorBtn) {
            anchorBtn.classList.add('is-active');
            anchorBtn.setAttribute('aria-expanded', 'true');
        }

        state.quickActionsCloseHandler = (event) => {
            const target = event.target;
            if (menu.contains(target) || (anchorBtn && anchorBtn.contains(target))) return;
            closeQuickActionsMenu();
        };

        requestAnimationFrame(() => {
            if (!state.quickActionsCloseHandler) return;
            document.addEventListener('click', state.quickActionsCloseHandler, true);
            document.addEventListener('touchstart', state.quickActionsCloseHandler, true);
        });

        return true;
    }

    function toggleQuickActionsMenu(anchorBtn) {
        const menu = ensureQuickActionsMenu();
        if (!menu) return false;
        if (menu.classList.contains('is-open')) {
            closeQuickActionsMenu();
            return false;
        }
        return openQuickActionsMenu(anchorBtn);
    }
    function startReplyToMessage(msgId) {
        const message = findMessageInActiveThread(msgId);
        if (!message) return;
        const contact = getContact(state.activeThreadId);
        state.replyingToMsg = buildReplyPayloadFromMessage(message, contact);
        closeContextMenu();
        exitMultiSelectMode();
        syncReplyBar();

        const composeInput = document.getElementById('messages-compose-input');
        if (composeInput) composeInput.focus();
    }

    function cancelReply() {
        state.replyingToMsg = null;
        syncReplyBar();
    }

    function syncReplyBar() {
        const bar = document.getElementById('messages-reply-bar');
        const nameEl = document.getElementById('messages-reply-name');
        const textEl = document.getElementById('messages-reply-text');
        if (!bar || !nameEl || !textEl) return;

        if (!state.replyingToMsg || !state.activeThreadId) {
            bar.classList.add('hidden');
            nameEl.textContent = '';
            textEl.textContent = '';
            return;
        }

        nameEl.textContent = state.replyingToMsg.name || '';
        textEl.textContent = formatReplyPreviewText(state.replyingToMsg);
        bar.classList.remove('hidden');
    }

    function enterMultiSelectMode(preselectMsgId = null) {
        state.isMultiSelectMode = true;
        if (preselectMsgId) {
            state.selectedMessages.add(String(preselectMsgId));
        }
        cancelReply();
        closeContextMenu();
        syncMultiSelectUI();
    }

    function exitMultiSelectMode() {
        state.isMultiSelectMode = false;
        state.selectedMessages.clear();
        syncMultiSelectUI();
    }

    function toggleMessageSelection(msgId) {
        if (!state.isMultiSelectMode || !msgId) return;
        const key = String(msgId);
        if (state.selectedMessages.has(key)) {
            state.selectedMessages.delete(key);
        } else {
            state.selectedMessages.add(key);
        }
        syncMultiSelectUI();
    }

    function syncMultiSelectUI() {
        const chatView = document.querySelector('#messages-app .messages-chat-view');
        const cancelBtn = document.getElementById('messages-multi-select-cancel');
        const deleteBtn = document.getElementById('messages-multi-select-delete');
        const countEl = document.getElementById('messages-multi-select-count');
        const rows = document.querySelectorAll('#messages-chat-scroll .messages-bubble-row[data-msg-id]');

        if (chatView) {
            chatView.classList.toggle('multi-select-mode', state.isMultiSelectMode);
        }
        if (cancelBtn) {
            cancelBtn.classList.toggle('hidden', !state.isMultiSelectMode);
        }
        if (deleteBtn) {
            deleteBtn.classList.toggle('hidden', !state.isMultiSelectMode);
            deleteBtn.disabled = state.selectedMessages.size === 0;
        }
        if (countEl) {
            countEl.textContent = String(state.selectedMessages.size);
        }

        rows.forEach(row => {
            const msgId = String(row.dataset.msgId || '');
            const selected = state.isMultiSelectMode && state.selectedMessages.has(msgId);
            row.classList.toggle('selected', selected);
            const checkbox = row.querySelector('.messages-msg-select-checkbox');
            if (checkbox) {
                checkbox.checked = selected;
            }
        });
    }

    async function deleteSelectedMessages() {
        if (!state.isMultiSelectMode) return;
        if (state.selectedMessages.size === 0) {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('未选择任何消息', 2000);
            }
            return;
        }

        if (!confirm(`确定删除选中的 ${state.selectedMessages.size} 条消息吗？此操作不可恢复。`)) {
            return;
        }

        const contactId = state.activeThreadId;
        if (!contactId || !window.iphoneSimState || !window.iphoneSimState.chatHistory) return;

        const ids = new Set(Array.from(state.selectedMessages).map(String));
        const history = getAllHistory(contactId);
        const remoteMessageIds = history
            .filter(message => ids.has(String(message && message.id)))
            .filter(message => message && (message.pushedByBackend || message.source === 'offline-backend' || message.remoteId))
            .map(message => String(message.remoteId || message.id || '').trim())
            .filter(Boolean);

        window.iphoneSimState.chatHistory[contactId] = history.filter(message => !ids.has(String(message && message.id)));

        if (typeof saveConfig === 'function') {
            saveConfig();
        }

        if (remoteMessageIds.length > 0 && window.offlinePushSync && typeof window.offlinePushSync.deleteMessages === 'function') {
            try {
                await window.offlinePushSync.deleteMessages(remoteMessageIds);
            } catch (error) {
                console.error('[messages-app] delete remote messages failed', error);
            }
        }

        exitMultiSelectMode();
        if (state.currentEditingMsgId && ids.has(String(state.currentEditingMsgId))) {
            closeEditMessageModal();
        }
        refresh(contactId);
    }

    function openEditMessageModal(msgId) {
        const modal = document.getElementById('messages-edit-msg-modal');
        const textarea = document.getElementById('messages-edit-msg-content');
        const message = findMessageInActiveThread(msgId);
        if (!modal || !textarea || !message) return;

        state.currentEditingMsgId = String(msgId);
        textarea.value = typeof message.content === 'string'
            ? message.content
            : JSON.stringify(message.content || '', null, 2);
        modal.classList.remove('hidden');
        closeContextMenu();
    }

    function closeEditMessageModal() {
        const modal = document.getElementById('messages-edit-msg-modal');
        if (modal) modal.classList.add('hidden');
        state.currentEditingMsgId = null;
    }

    function saveEditedMessage() {
        if (!state.currentEditingMsgId || !state.activeThreadId) return false;

        const textarea = document.getElementById('messages-edit-msg-content');
        const message = findMessageInActiveThread(state.currentEditingMsgId);
        if (!textarea || !message) {
            closeEditMessageModal();
            return false;
        }

        const newContent = String(textarea.value || '').trim();
        if (!newContent) {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('消息内容不能为空', 2000);
            }
            return false;
        }

        if (!['text', 'description', 'html'].includes(String(message.type || 'text'))) {
            const ok = confirm('这是一条非文本消息，直接编辑内容可能会影响显示，确定继续吗？');
            if (!ok) return false;
        }

        message.content = newContent;
        if (message.bilingualTranslation) {
            delete message.bilingualTranslation;
        }

        if (typeof saveConfig === 'function') {
            saveConfig();
        }

        closeEditMessageModal();
        refresh(state.activeThreadId);
        return true;
    }

    function showContextMenu(targetEl, msgData) {
        closeContextMenu();

        const menu = document.createElement('div');
        menu.className = 'context-menu messages-context-menu';
        menu.innerHTML = `
            <div class="context-menu-item" data-action="quote">引用</div>
            <div class="context-menu-item" data-action="edit">编辑</div>
            <div class="context-menu-item" data-action="multi">多选</div>
        `;

        menu.style.visibility = 'hidden';
        document.body.appendChild(menu);

        const menuRect = menu.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const gap = 10;
        const edgePadding = 8;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        const viewportLeft = scrollX + edgePadding;
        const viewportRight = scrollX + window.innerWidth - edgePadding;
        const viewportTop = scrollY + edgePadding;
        const viewportBottom = scrollY + window.innerHeight - edgePadding;

        let left;
        if (msgData.isUser) {
            left = targetRect.left - menuRect.width - gap + scrollX;
            if (left < viewportLeft) {
                left = targetRect.right + gap + scrollX;
            }
        } else {
            left = targetRect.right + gap + scrollX;
            if (left + menuRect.width > viewportRight) {
                left = targetRect.left - menuRect.width - gap + scrollX;
            }
        }

        let top = targetRect.top + ((targetRect.height - menuRect.height) / 2) + scrollY;
        if (left < viewportLeft) left = viewportLeft;
        if (left + menuRect.width > viewportRight) left = viewportRight - menuRect.width;
        if (top < viewportTop) top = viewportTop;
        if (top + menuRect.height > viewportBottom) top = viewportBottom - menuRect.height;

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
        menu.style.visibility = 'visible';

        menu.querySelector('[data-action="quote"]').onclick = () => {
            startReplyToMessage(msgData.msgId);
        };

        menu.querySelector('[data-action="edit"]').onclick = () => {
            openEditMessageModal(msgData.msgId);
        };

        menu.querySelector('[data-action="multi"]').onclick = () => {
            enterMultiSelectMode(msgData.msgId);
        };

        state.menuCloseHandler = event => {
            if (!menu.contains(event.target)) {
                closeContextMenu();
            }
        };

        setTimeout(() => {
            if (!state.menuCloseHandler) return;
            document.addEventListener('click', state.menuCloseHandler, true);
            document.addEventListener('touchstart', state.menuCloseHandler, true);
        }, 0);
    }

    function clearLongPressTimer() {
        if (state.longPressTimer) {
            clearTimeout(state.longPressTimer);
            state.longPressTimer = null;
        }
    }

    function openContextMenuForBubble(bubble) {
        if (!bubble || state.isMultiSelectMode) return;
        const msgId = bubble.dataset.msgId;
        if (!msgId) return;

        const message = findMessageInActiveThread(msgId);
        if (!message) return;

        const contact = getContact(state.activeThreadId);
        showContextMenu(bubble, {
            msgId: String(msgId),
            content: formatBubbleText(message),
            name: getMessageSpeakerName(message, contact),
            isUser: message.role === 'user',
            type: message.type || 'text',
            timestamp: Number(message.time) || null
        });
    }

    function renderChat(threadId) {
        const avatarEl = document.getElementById('messages-chat-avatar');
        const nameEl = document.getElementById('messages-chat-name');
        const listEl = document.getElementById('messages-chat-scroll');
        const app = document.getElementById('messages-app');
        if (!avatarEl || !nameEl || !listEl) return;

        const thread = threadId != null ? getThread(threadId) : null;
        const contact = thread ? getContact(thread.contactId) : getContact(threadId);

        if (app && app.classList.contains('chat-open') && thread && typeof window.markMessagesAppThreadRead === 'function') {
            if (window.markMessagesAppThreadRead(thread.contactId)) {
                renderThreadList(document.getElementById('messages-search-input')?.value || '');
            }
        }

        if (!contact) {
            nameEl.textContent = '';
            avatarEl.className = 'messages-chat-avatar';
            avatarEl.style.backgroundImage = '';
            avatarEl.textContent = '';
            listEl.innerHTML = '<div class="messages-empty-state messages-empty-state-chat">还没有任何消息</div>';
            listEl.scrollTop = 0;
            syncMultiSelectUI();
            syncReplyBar();
            return;
        }

        const threadName = getThreadName(contact);
        nameEl.textContent = threadName;
        avatarEl.className = 'messages-chat-avatar';
        applyAvatarFill(avatarEl, contact.avatar, threadName.slice(0, 1));

        const messages = thread ? thread.messages : [];
        const typing = isThreadTyping(contact.id, thread);
        if (messages.length === 0 && !typing) {
            listEl.innerHTML = '<div class="messages-empty-state messages-empty-state-chat">还没有任何消息</div>';
            listEl.scrollTop = 0;
            syncMultiSelectUI();
            syncReplyBar();
            return;
        }

        listEl.innerHTML = `
            <div class="messages-timestamp">今天</div>
            ${buildBubbleMarkup(messages)}
            ${typing ? buildTypingBubbleMarkup() : ''}
        `;
        hydrateDeferredMessagesMedia(listEl);
        syncMultiSelectUI();
        syncReplyBar();
        listEl.scrollTop = listEl.scrollHeight;
    }

    function syncInputActionState() {
        const actionBtn = document.getElementById('messages-mic-btn');
        if (!actionBtn) return;

        actionBtn.setAttribute('aria-label', '生成回复');
        actionBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>';
    }

    async function triggerThreadAiReply(instruction = null) {
        if (state.isMultiSelectMode) {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('请先退出多选', 1800);
            }
            return false;
        }

        closeContextMenu();
        closeQuickActionsMenu();

        const threadId = state.activeThreadId;
        if (!threadId) {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('当前没有可继续的信息对话', 2200);
            }
            return false;
        }

        if (typeof window.generateAiReply !== 'function') {
            return false;
        }

        setThreadTyping(threadId, true);
        renderChat(threadId);

        try {
            const result = await window.generateAiReply(instruction, threadId, {
                triggerSource: 'manual',
                deliveryChannel: 'messages-app'
            });
            return result;
        } catch (error) {
            console.error('messages-app trigger reply failed', error);
            return false;
        } finally {
            setThreadTyping(threadId, false);
            renderThreadList(document.getElementById('messages-search-input')?.value || '');
            renderChat(threadId);
        }
    }

    async function handleMessagesRegenerateReply() {
        const threadId = state.activeThreadId;
        if (!threadId) return false;

        const history = window.iphoneSimState && window.iphoneSimState.chatHistory
            ? window.iphoneSimState.chatHistory[threadId]
            : null;
        if (!Array.isArray(history) || history.length === 0) {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('没有聊天记录，无法重回', 2200);
            }
            return false;
        }

        let hasDeleted = false;
        while (history.length > 0) {
            const lastMsg = history[history.length - 1];
            const isMessagesAppChannel = typeof window.isChatMessageInChannel === 'function'
                ? window.isChatMessageInChannel(lastMsg, 'messages-app')
                : (lastMsg && lastMsg.channel === 'messages-app');

            if (lastMsg && lastMsg.role === 'assistant' && isMessagesAppChannel) {
                history.pop();
                hasDeleted = true;
                continue;
            }
            break;
        }

        if (hasDeleted) {
            if (typeof saveConfig === 'function') saveConfig();
            renderThreadList(document.getElementById('messages-search-input')?.value || '');
            renderChat(threadId);
        }

        return await triggerThreadAiReply('请基于当前协议重新生成上一轮回复：保持人设、自然聊天感和正确 JSON 格式；如果已开启显示心声，仍需先输出 thought_state；避免重复上一版的不自然表达。');
    }

    async function sendCurrentMessage() {
        if (state.isMultiSelectMode) {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('请先退出多选', 1800);
            }
            return;
        }

        const input = document.getElementById('messages-compose-input');
        const threadId = state.activeThreadId;
        if (!input || !threadId) return;

        const text = String(input.value || '').trim();
        if (!text) return;

        const replyTo = state.replyingToMsg ? { ...state.replyingToMsg } : null;
        const sentMessage = typeof window.sendMessage === 'function'
            ? window.sendMessage(text, true, 'text', null, threadId, {
                channel: 'messages-app',
                bypassWechatBlock: true,
                ignoreReplyingState: true,
                readInMessagesApp: true,
                replyTo
            })
            : null;
        if (!sentMessage) return;

        input.value = '';
        cancelReply();
        syncInputActionState();
        renderThreadList(document.getElementById('messages-search-input')?.value || '');
        renderChat(threadId);
    }

    function openThread(threadId) {
        if (threadId == null) return;
        state.activeThreadId = String(threadId);
        closeContextMenu();
        closeQuickActionsMenu();
        closeEditMessageModal();
        exitMultiSelectMode();
        cancelReply();

        if (typeof window.markMessagesAppThreadRead === 'function') {
            window.markMessagesAppThreadRead(state.activeThreadId);
        }

        renderThreadList(document.getElementById('messages-search-input')?.value || '');
        renderChat(state.activeThreadId);

        const app = document.getElementById('messages-app');
        if (app) app.classList.add('chat-open');
    }

    function closeThread() {
        closeContextMenu();
        closeQuickActionsMenu();
        closeEditMessageModal();
        exitMultiSelectMode();
        cancelReply();

        const app = document.getElementById('messages-app');
        if (app) app.classList.remove('chat-open');
    }

    function closeApp() {
        closeContextMenu();
        closeQuickActionsMenu();
        closeEditMessageModal();
        closeMessagesActiveReplyModal();
        exitMultiSelectMode();
        cancelReply();

        const app = document.getElementById('messages-app');
        if (app) {
            app.classList.add('hidden');
            app.classList.remove('chat-open');
        }

        const searchInput = document.getElementById('messages-search-input');
        if (searchInput) searchInput.value = '';

        renderThreadList('');
        renderChat(state.activeThreadId);
        syncInputActionState();
        setListHeaderProgress(0);
    }

    function openApp(contactId = null) {
        const app = document.getElementById('messages-app');
        if (!app) return;

        const searchInput = document.getElementById('messages-search-input');
        if (searchInput) searchInput.value = '';

        renderThreadList('');
        app.classList.remove('hidden');

        if (contactId != null) {
            openThread(contactId);
        } else if (state.activeThreadId) {
            renderChat(state.activeThreadId);
        } else {
            app.classList.remove('chat-open');
            renderChat(null);
        }

        syncInputActionState();
        requestAnimationFrame(syncListHeaderProgress);
    }

    function openThreadByContact(contactId) {
        openApp(contactId);
    }

    function refresh(contactId = null) {
        const app = document.getElementById('messages-app');
        const searchValue = document.getElementById('messages-search-input')?.value || '';
        renderThreadList(searchValue);

        if (contactId != null && String(state.activeThreadId || '') === String(contactId) && app && app.classList.contains('chat-open')) {
            renderChat(state.activeThreadId);
            return;
        }

        if (state.activeThreadId) {
            renderChat(state.activeThreadId);
        } else {
            renderChat(null);
        }

        syncInputActionState();
        requestAnimationFrame(syncListHeaderProgress);
    }

    function initMessagesApp() {
        if (state.initialized) return;

        const app = document.getElementById('messages-app');
        if (!app) return;

        state.initialized = true;

        renderThreadList('');
        renderChat(state.activeThreadId);
        syncInputActionState();

        const closeBtn = document.getElementById('close-messages-app');
        const titleBackBtn = document.getElementById('messages-home-back');
        const compactBackBtn = document.getElementById('messages-compact-back');
        const backBtn = document.getElementById('messages-chat-back');
        const searchInput = document.getElementById('messages-search-input');
        const threadList = document.getElementById('messages-thread-list');
        const chatScroll = document.getElementById('messages-chat-scroll');
        const settingsBtn = document.getElementById('messages-settings-btn');
        const plusBtn = document.getElementById('messages-plus-btn');
        const composeBtn = document.getElementById('messages-compose-btn');
        const actionBtn = document.getElementById('messages-mic-btn');
        const composeInput = document.getElementById('messages-compose-input');
        const replyCloseBtn = document.getElementById('messages-close-reply-bar');
        const multiCancelBtn = document.getElementById('messages-multi-select-cancel');
        const multiDeleteBtn = document.getElementById('messages-multi-select-delete');
        const editModal = document.getElementById('messages-edit-msg-modal');
        const closeEditModalBtn = document.getElementById('close-messages-edit-msg');
        const saveEditBtn = document.getElementById('save-messages-edit-msg-btn');
        const activeReplyModal = document.getElementById('messages-active-reply-modal');
        const closeActiveReplyModalBtn = document.getElementById('close-messages-active-reply-modal');
        const activeReplyContactSelect = document.getElementById('messages-active-reply-contact');
        const activeReplyEnabledInput = document.getElementById('messages-active-reply-enabled');
        const saveActiveReplyBtn = document.getElementById('save-messages-active-reply-settings');

        if (closeBtn) closeBtn.addEventListener('click', closeApp);
        if (titleBackBtn) titleBackBtn.addEventListener('click', closeApp);
        if (compactBackBtn) compactBackBtn.addEventListener('click', closeApp);
        if (backBtn) backBtn.addEventListener('click', closeThread);
        if (replyCloseBtn) replyCloseBtn.addEventListener('click', cancelReply);
        if (multiCancelBtn) multiCancelBtn.addEventListener('click', exitMultiSelectMode);
        if (multiDeleteBtn) multiDeleteBtn.addEventListener('click', deleteSelectedMessages);
        if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditMessageModal);
        if (saveEditBtn) saveEditBtn.addEventListener('click', saveEditedMessage);

        if (editModal) {
            editModal.addEventListener('click', event => {
                if (event.target === editModal) {
                    closeEditMessageModal();
                }
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', event => {
                renderThreadList(event.target.value);
            });
        }

        if (threadList) {
            threadList.addEventListener('scroll', syncListHeaderProgress, { passive: true });
            threadList.addEventListener('click', event => {
                const item = event.target.closest('[data-thread-id]');
                if (!item) return;
                openThread(item.dataset.threadId);
            });
        }

        syncListHeaderProgress();

        if (chatScroll) {
            chatScroll.addEventListener('click', event => {
                if (!state.isMultiSelectMode) return;
                const row = event.target.closest('.messages-bubble-row[data-msg-id]');
                if (!row) return;
                event.preventDefault();
                toggleMessageSelection(row.dataset.msgId);
            });

            chatScroll.addEventListener('touchstart', event => {
                if (state.isMultiSelectMode) return;
                const bubble = event.target.closest('.messages-bubble[data-msg-id]');
                if (!bubble) return;
                clearLongPressTimer();
                state.longPressTimer = setTimeout(() => {
                    state.longPressTimer = null;
                    openContextMenuForBubble(bubble);
                }, 500);
            }, { passive: true });

            ['touchend', 'touchcancel', 'touchmove'].forEach(eventName => {
                chatScroll.addEventListener(eventName, clearLongPressTimer, { passive: true });
            });

            chatScroll.addEventListener('contextmenu', event => {
                const bubble = event.target.closest('.messages-bubble[data-msg-id]');
                if (!bubble || state.isMultiSelectMode) return;
                event.preventDefault();
                clearLongPressTimer();
                openContextMenuForBubble(bubble);
            });
        }

        if (settingsBtn) {
            settingsBtn.addEventListener('click', openMessagesActiveReplyModal);
        }

        if (closeActiveReplyModalBtn) {
            closeActiveReplyModalBtn.addEventListener('click', closeMessagesActiveReplyModal);
        }

        if (activeReplyModal) {
            activeReplyModal.addEventListener('click', event => {
                if (event.target === activeReplyModal) {
                    closeMessagesActiveReplyModal();
                }
            });
        }

        if (activeReplyContactSelect) {
            activeReplyContactSelect.addEventListener('change', event => {
                loadMessagesActiveReplyContactSettings(event.target.value);
            });
        }

        if (activeReplyEnabledInput) {
            activeReplyEnabledInput.addEventListener('change', syncMessagesActiveReplyIntervalState);
        }

        if (saveActiveReplyBtn) {
            saveActiveReplyBtn.addEventListener('click', saveMessagesActiveReplySettings);
        }

        if (composeBtn) {
            composeBtn.disabled = true;
            composeBtn.setAttribute('aria-disabled', 'true');
            composeBtn.setAttribute('tabindex', '-1');
        }

        if (plusBtn) {
            plusBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!state.activeThreadId) {
                    if (typeof window.showChatToast === 'function') {
                        window.showChatToast('请先打开一个信息对话', 1800);
                    }
                    return;
                }
                toggleQuickActionsMenu(plusBtn);
            });
        }

        if (actionBtn) {
            actionBtn.addEventListener('click', async () => {
                const currentValue = composeInput ? String(composeInput.value || '').trim() : '';
                if (currentValue) {
                    await sendCurrentMessage();
                    return;
                }

                await triggerThreadAiReply();
            });
        }

        if (composeInput) {
            composeInput.addEventListener('input', syncInputActionState);
            composeInput.addEventListener('keydown', event => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                sendCurrentMessage();
            });
        }

        window.MessagesApp = {
            open: openApp,
            openThread,
            openThreadByContact,
            closeThread,
            closeApp,
            refresh
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMessagesApp);
    } else {
        initMessagesApp();
    }
})();






