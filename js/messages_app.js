(function () {
    const smsAvatarUrl = 'https://i.postimg.cc/NMVGVf9y/quality-restoration-20260405214201270.png';

    const messagesThreads = [];

    const state = {
        activeThreadId: null
    };

    messagesThreads.forEach((thread) => {
        if (thread.listAvatarClass === 'sms-avatar') {
            thread.listAvatarImage = smsAvatarUrl;
            thread.chatAvatarImage = smsAvatarUrl;
        }
    });

    function getThread(threadId) {
        return messagesThreads.find((thread) => thread.id === threadId) || null;
    }

    function buildListAvatarMarkup(thread) {
        const classes = ['messages-avatar'];
        if (thread.listAvatarClass) classes.push(thread.listAvatarClass);
        if (thread.listAvatarImage) classes.push('has-image');
        const style = thread.listAvatarImage ? ` style="background-image:url('${thread.listAvatarImage}')"` : '';
        const label = thread.listAvatarImage ? '' : (thread.listAvatarLabel || thread.name.slice(0, 1));
        return `<div class="${classes.join(' ')}"${style}>${label}</div>`;
    }

    function renderThreadList(filterText) {
        const listEl = document.getElementById('messages-thread-list');
        if (!listEl) return;

        const keyword = String(filterText || '').trim().toLowerCase();
        const visibleThreads = keyword
            ? messagesThreads.filter((thread) => `${thread.listName || thread.name} ${thread.preview}`.toLowerCase().includes(keyword))
            : messagesThreads;

        if (visibleThreads.length === 0) {
            listEl.innerHTML = '<div class="messages-empty-state">暂无消息</div>';
            return;
        }

        listEl.innerHTML = visibleThreads.map((thread) => {
            const unreadClass = thread.unread ? ' is-unread' : '';
            return `
                <button class="messages-thread-item${unreadClass}" type="button" data-thread-id="${thread.id}">
                    <div class="messages-unread-dot"></div>
                    ${buildListAvatarMarkup(thread)}
                    <div class="messages-thread-main">
                        <div class="messages-thread-top">
                            <div class="messages-thread-name">${thread.listName || thread.name}</div>
                            <div class="messages-thread-meta-right">
                                <div class="messages-thread-time">${thread.time}</div>
                                <i class="fas fa-chevron-right messages-thread-chevron"></i>
                            </div>
                        </div>
                        <div class="messages-thread-preview"><span class="messages-thread-badge">${thread.badge || ''}</span>${thread.preview}</div>
                    </div>
                </button>
            `;
        }).join('');
    }

    function renderChat(threadId) {
        const thread = getThread(threadId);
        const avatarEl = document.getElementById('messages-chat-avatar');
        const nameEl = document.getElementById('messages-chat-name');
        const listEl = document.getElementById('messages-chat-scroll');

        if (!avatarEl || !nameEl || !listEl) return;

        if (!thread) {
            nameEl.textContent = '';
            avatarEl.className = 'messages-chat-avatar';
            avatarEl.style.backgroundImage = '';
            avatarEl.textContent = '';
            listEl.innerHTML = '<div class="messages-empty-state messages-empty-state-chat">还没有任何消息</div>';
            listEl.scrollTop = 0;
            return;
        }

        nameEl.textContent = thread.name;
        avatarEl.className = 'messages-chat-avatar';
        if (thread.chatAvatarImage) avatarEl.classList.add('has-image');
        avatarEl.style.backgroundImage = thread.chatAvatarImage ? `url('${thread.chatAvatarImage}')` : '';
        avatarEl.textContent = thread.chatAvatarImage ? '' : (thread.chatAvatarLabel || thread.listAvatarLabel || thread.name.slice(0, 1));

        if (thread.chatAvatarClass) {
            avatarEl.classList.add(thread.chatAvatarClass);
        }

        listEl.innerHTML = `
            <div class="messages-timestamp">${thread.dayLabel || 'Today'}</div>
            ${thread.messages.map((message) => {
                const rowClasses = ['messages-bubble-row', message.role];
                if (message.marginBottom) rowClasses.push('margin-bottom');
                return `
                    <div class="${rowClasses.join(' ')}">
                        <div class="messages-bubble ${message.role}${message.tail ? ' tail' : ''}">${message.text}</div>
                    </div>
                `;
            }).join('')}
            ${thread.status ? `<div class="messages-status-text">${thread.status}</div>` : ''}
        `;

        listEl.scrollTop = 0;
    }

    function openThread(threadId) {
        state.activeThreadId = threadId;
        const thread = getThread(threadId);
        if (thread) thread.unread = false;

        const searchValue = document.getElementById('messages-search-input')?.value || '';
        renderThreadList(searchValue);
        renderChat(threadId);

        const app = document.getElementById('messages-app');
        if (app) app.classList.add('chat-open');
    }

    function closeThread() {
        const app = document.getElementById('messages-app');
        if (app) app.classList.remove('chat-open');
    }

    function closeApp() {
        const app = document.getElementById('messages-app');
        if (app) {
            app.classList.add('hidden');
            app.classList.remove('chat-open');
        }

        const searchEl = document.getElementById('messages-search-input');
        if (searchEl) searchEl.value = '';
        renderThreadList('');
        renderChat(state.activeThreadId);
    }

    function initMessagesApp() {
        const app = document.getElementById('messages-app');
        if (!app) return;

        renderThreadList('');
        renderChat(state.activeThreadId);

        const closeBtn = document.getElementById('close-messages-app');
        const titleBackBtn = document.getElementById('messages-home-back');
        const backBtn = document.getElementById('messages-chat-back');
        const searchInput = document.getElementById('messages-search-input');
        const threadList = document.getElementById('messages-thread-list');
        const plusBtn = document.getElementById('messages-plus-btn');
        const composeBtn = document.getElementById('messages-compose-btn');
        const micBtn = document.getElementById('messages-mic-btn');
        const composeInput = document.getElementById('messages-compose-input');

        if (closeBtn) closeBtn.addEventListener('click', closeApp);
        if (titleBackBtn) titleBackBtn.addEventListener('click', closeApp);
        if (backBtn) backBtn.addEventListener('click', closeThread);

        if (searchInput) {
            searchInput.addEventListener('input', (event) => {
                renderThreadList(event.target.value);
            });
        }

        if (threadList) {
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

        window.MessagesApp = {
            openThread,
            closeThread,
            closeApp
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMessagesApp);
    } else {
        initMessagesApp();
    }
})();
