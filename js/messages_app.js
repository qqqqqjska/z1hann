(function () {
    const smsAvatarUrl = 'https://i.postimg.cc/NMVGVf9y/quality-restoration-20260405214201270.png';

    const messagesThreads = [
        {
            id: 'sms-1',
            name: '+86 130 0255 1045',
            listName: '+86 130 0255 1045',
            time: '17:38',
            preview: '\u60A8\u7684\u7269\u54C1\u5DF2\u9001\u81F3\u5357\u5BA1\u83AB\u6101\u6821\u533A\u5317\u5739\u8DEF77\u53F7\u56F4\u5899\uFF08\u65B0\u5C4F\uFF09\uFF0C\u7BB1\u95E8\u53F7\uFF1A91\uFF0C\u53D6\u4EF6\u7801\uFF1A3683\uFF0C\u8BF7\u2026',
            badge: '\u4E3B\u53F7',
            unread: false,
            listAvatarClass: 'sms-avatar',
            listAvatarLabel: '',
            chatAvatarClass: 'sms-avatar',
            chatAvatarLabel: '',
            dayLabel: 'Today 17:38',
            status: '',
            messages: [
                { role: 'received', text: '\u60A8\u7684\u7269\u54C1\u5DF2\u9001\u81F3\u5357\u5BA1\u83AB\u6101\u6821\u533A\u5317\u5739\u8DEF77\u53F7\u56F4\u5899\uFF08\u65B0\u5C4F\uFF09\uFF0C\u7BB1\u95E8\u53F7\uFF1A91\uFF0C\u53D6\u4EF6\u7801\uFF1A3683\u3002', marginBottom: true, tail: true }
            ]
        },
        {
            id: 'sms-2',
            name: '1068453481424743',
            listName: '1068453481424743',
            time: '\u661F\u671F\u4E94',
            preview: '[\u534E\u4F4F\u4F1A] \u65B0\u5BA2\u793C\u5305\u6743\u76CA\u5373\u5C06\u5931\u6548\uFF0C\u8D76\u7D27\u767B\u5F55\u534E\u4F4F\u4F1AAPP\u6FC0\u6D3B\u4F7F\u7528\u5427\uFF0C\u70B9\u51FB s.huazhu.com/x/\u2026',
            badge: '\u4E3B\u53F7',
            unread: true,
            listAvatarClass: 'sms-avatar',
            listAvatarLabel: '',
            chatAvatarClass: 'sms-avatar',
            chatAvatarLabel: '',
            dayLabel: '\u661F\u671F\u4E94',
            status: '',
            messages: [
                { role: 'received', text: '[\u534E\u4F4F\u4F1A] \u65B0\u5BA2\u793C\u5305\u6743\u76CA\u5373\u5C06\u5931\u6548\uFF0C\u8D76\u7D27\u767B\u5F55\u534E\u4F4F\u4F1AAPP\u6FC0\u6D3B\u4F7F\u7528\u5427\u3002', marginBottom: true, tail: true }
            ]
        },
        {
            id: 'sms-3',
            name: '106933819400098782',
            listName: '106933819400098782',
            time: '\u661F\u671F\u4E94',
            preview: '[\u671D\u5915\u5149\u5E74] \u5E86\u795D\u300C\u4E16\u754C\u300D\u4E00\u5468\u5E743000\u6C34\u667670\u8FDE\u514D\u8D39\u5F97\uFF0C\u5151\u6362\u7801\uFF1A\u4E16\u754C\u8E0F\u9752\uFF0C\u70B9\u51FB\u988610\u8FDE\u2026',
            badge: '\u526F\u53F7',
            unread: true,
            listAvatarClass: 'sms-avatar',
            listAvatarLabel: '',
            chatAvatarClass: 'sms-avatar',
            chatAvatarLabel: '',
            dayLabel: '\u661F\u671F\u4E94',
            status: '',
            messages: [
                { role: 'received', text: '[\u671D\u5915\u5149\u5E74] \u5E86\u795D\u300C\u4E16\u754C\u300D\u4E00\u5468\u5E743000\u6C34\u667670\u8FDE\u514D\u8D39\u5F97\u3002', marginBottom: true, tail: true }
            ]
        },
        {
            id: 'sms-4',
            name: '10000',
            listName: '10000',
            time: '\u661F\u671F\u4E94',
            preview: '\u6D59\u6C5F\u7684\u8349\u6839\u4E16\u754C\u676F\u2014\u5434\u8D8A\u676F4\u67086\u65E5\u5C06\u5F00\u6253\u300211\u652F\u57CE\u5E02\u8349\u6839\u7403\u961F\u7ADE\u9A70\u7EFF\u8335\uFF01\u5927\u5BB6\u90FD\u6765\u4E3A\u70ED\u7231\u2026',
            badge: '\u4E3B\u53F7',
            unread: true,
            listAvatarClass: 'sms-avatar',
            listAvatarLabel: '',
            chatAvatarClass: 'sms-avatar',
            chatAvatarLabel: '',
            dayLabel: '\u661F\u671F\u4E94',
            status: '',
            messages: [
                { role: 'received', text: '\u6D59\u6C5F\u7684\u8349\u6839\u4E16\u754C\u676F\u2014\u5434\u8D8A\u676F4\u67086\u65E5\u5C06\u5F00\u6253\u3002', marginBottom: true, tail: true }
            ]
        },
        {
            id: 'sms-5',
            name: '1068230328393',
            listName: '1068230328393',
            time: '\u661F\u671F\u4E94',
            preview: '[\u83DC\u9E1F\u9A7F\u7AD9] \u60A8\u67091\u4E2A\u5305\u88F9\u5DF2\u5230\u5357\u4EAC\u5BA1\u8BA1\u5927\u5B66\u83AB\u6101\u6E56\u6821\u533A\u83DC\u9E1F\u9A7F\u7AD9\uFF0C\u8BF7\u51ED5-1-5003\u53D6\u4EF6',
            badge: '\u4E3B\u53F7',
            unread: true,
            listAvatarClass: 'sms-avatar',
            listAvatarLabel: '',
            chatAvatarClass: 'sms-avatar',
            chatAvatarLabel: '',
            dayLabel: '\u661F\u671F\u4E94',
            status: '',
            messages: [
                { role: 'received', text: '[\u83DC\u9E1F\u9A7F\u7AD9] \u60A8\u67091\u4E2A\u5305\u88F9\u5DF2\u5230\u5357\u4EAC\u5BA1\u8BA1\u5927\u5B66\u83AB\u6101\u6E56\u6821\u533A\u83DC\u9E1F\u9A7F\u7AD9\u3002', marginBottom: true, tail: true }
            ]
        }
    ];

    const state = {
        activeThreadId: 'sms-1'
    };

    messagesThreads.forEach((thread) => {
        if (thread.listAvatarClass === 'sms-avatar') {
            thread.listAvatarImage = smsAvatarUrl;
            thread.chatAvatarImage = smsAvatarUrl;
        }
    });

    function getThread(threadId) {
        return messagesThreads.find((thread) => thread.id === threadId) || messagesThreads[0];
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
