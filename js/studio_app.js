(function () {
    const STUDIO_CHAT_DEMO_META = {
        title: '\u6797\u4e88',
        status: '',
        otherAvatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=LinYu&backgroundColor=f5d0fe',
        selfAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=StudioUser&backgroundColor=ddd6fe'
    };

    const STUDIO_CHAT_DEMO_MESSAGES = [
        {
            id: 'studio-msg-1',
            role: 'assistant',
            type: 'text',
            time: '2026-04-10T19:40:00+08:00',
            content: '\u6211\u5148\u628a\u5de5\u4f5c\u5ba4\u804a\u5929\u9875\u7684\u6574\u4f53\u6c14\u8d28\u5b9a\u4e0b\u6765\u3002'
        },
        {
            id: 'studio-msg-3',
            role: 'assistant',
            type: 'text',
            time: '2026-04-10T19:42:00+08:00',
            content: '\u6211\u60f3\u628a\u8fd9\u4e2a\u9875\u9762\u505a\u5f97\u50cf\u4e00\u4e2a\u5df2\u7ecf\u88ab\u8ba4\u771f\u4f7f\u7528\u8fc7\u7684\u804a\u5929\u7a97\u53e3\uff0c\n\u8fd9\u6837\u7528\u6237\u4e00\u8fdb\u6765\u5c31\u80fd\u611f\u89c9\u5230\u5185\u5bb9\u662f\u5b8c\u6574\u7684\uff0c\u800c\u4e0d\u662f\u53ea\u6709\u4e00\u4e2a\u7a7a\u58f3\u5b50\u3002'
        },
        {
            id: 'studio-msg-1b',
            role: 'assistant',
            type: 'text',
            time: '2026-04-10T19:43:00+08:00',
            content: '\u6211\u518d\u8865\u4e00\u6761\uff0c\u5148\u628a\u6c14\u6ce1\u7684\u7ec6\u8282\u4e0e\u4fe1\u606f\u8282\u594f\u987a\u4e00\u904d\u3002'
        },
        {
            id: 'studio-msg-2',
            role: 'user',
            type: 'text',
            time: '2026-04-10T19:45:00+08:00',
            content: '\u597d\uff0c\u6211\u8fd9\u8fb9\u5148\u628a\u56fe\u6807\u548c\u5165\u53e3\u786e\u8ba4\u597d\u3002'
        },
        {
            id: 'studio-msg-4',
            role: 'user',
            type: 'text',
            time: '2026-04-10T19:46:00+08:00',
            content: '\u53ef\u4ee5\uff0c\u6211\u4e5f\u5e0c\u671b\u5b83\u4e0d\u662f\u5355\u7eaf\u7684\u5c55\u793a\u9875\u3002\n\u54ea\u6015\u6682\u65f6\u4e0d\u63a5\u5165\u771f\u5b9e\u529f\u80fd\uff0c\u4e5f\u8981\u5148\u628a\u4fe1\u606f\u5bc6\u5ea6\u3001\u6362\u884c\u8282\u594f\u548c\u6d88\u606f\u5c42\u6b21\u90fd\u94fa\u51fa\u6765\u3002'
        },
        {
            id: 'studio-msg-2b',
            role: 'user',
            type: 'text',
            time: '2026-04-10T19:47:00+08:00',
            content: '\u90a3\u5c31\u5f88\u597d\uff0c\u8fd9\u6837\u4e00\u8fdb\u6765\u5c31\u80fd\u770b\u5230\u53cc\u65b9\u8fde\u7eed\u51e0\u6761\u7684\u5bf9\u8bdd\u8282\u594f\u3002'
        },
        {
            id: 'studio-msg-5',
            role: 'assistant',
            type: 'voice',
            time: '2026-04-10T19:56:00+08:00',
            content: {
                duration: 9,
                text: '\u6211\u521a\u628a\u8bed\u97f3\u6c14\u6ce1\u7684\u6bd4\u4f8b\u4e5f\u987a\u4e86\u4e00\u4e0b\u3002'
            }
        },
        {
            id: 'studio-msg-6',
            role: 'user',
            type: 'voice',
            time: '2026-04-10T19:57:00+08:00',
            content: {
                duration: 6,
                text: '\u6536\u5230\uff0c\u8fd9\u6837\u6574\u4f53\u8282\u594f\u4f1a\u81ea\u7136\u5f88\u591a\u3002'
            }
        },
        {
            id: 'studio-msg-7',
            role: 'assistant',
            type: 'transfer',
            time: '2026-04-10T20:04:00+08:00',
            content: {
                amount: '88.00',
                remark: '\u5de5\u4f5c\u5ba4\u7075\u611f\u57fa\u91d1',
                status: 'pending'
            }
        },
        {
            id: 'studio-msg-8',
            role: 'user',
            type: 'transfer',
            time: '2026-04-10T20:05:00+08:00',
            content: {
                amount: '36.50',
                remark: '\u53c2\u8003\u56fe\u7d20\u6750\u8865\u8d34',
                status: 'pending'
            }
        },
        {
            id: 'studio-msg-9',
            role: 'assistant',
            type: 'delivery_share',
            time: '2026-04-10T20:11:00+08:00',
            content: {
                total: '42.00',
                remark: '\u5c11\u51b0\u9752\u63d0\u6c14\u6ce1\u6c34',
                items: [
                    { title: '\u7099\u70e4\u9e21\u817f\u996d' },
                    { title: '\u9752\u63d0\u6c14\u6ce1\u6c34' }
                ]
            }
        },
        {
            id: 'studio-msg-10',
            role: 'user',
            type: 'delivery_share',
            time: '2026-04-10T20:12:00+08:00',
            content: {
                total: '29.00',
                remark: '\u5df2\u5e2e\u4f60\u5907\u6ce8\u5c11\u8fa3',
                items: [
                    { title: '\u756a\u8304\u80a5\u725b\u7c73\u7ebf' }
                ]
            }
        },
        {
            id: 'studio-msg-11',
            role: 'assistant',
            type: 'gift_card',
            time: '2026-04-10T20:19:00+08:00',
            content: {
                title: '\u767d\u5c71\u8336\u9999\u85b0\u793c\u76d2',
                paymentAmount: '168.00',
                recipientName: '\u4f60',
                paymentMethodLabel: '\u5fae\u4fe1\u652f\u4ed8'
            }
        },
        {
            id: 'studio-msg-12',
            role: 'user',
            type: 'gift_card',
            time: '2026-04-10T20:20:00+08:00',
            content: {
                title: '\u4e91\u6735\u62b1\u6795\u5c0f\u793c\u76d2',
                paymentAmount: '99.00',
                recipientName: '\u6797\u4e88',
                paymentMethodLabel: '\u5fae\u4fe1\u652f\u4ed8'
            }
        },
        {
            id: 'studio-msg-13',
            role: 'assistant',
            type: 'text',
            time: '2026-04-10T20:27:00+08:00',
            content: '\u6211\u5df2\u7ecf\u628a\u5f15\u7528\u6d88\u606f\u4e5f\u653e\u8fdb\u53bb\u4e86\uff0c\u65b9\u4fbf\u4f60\u76f4\u63a5\u5bf9\u7167\u3002',
            replyTo: {
                name: '\u4f60',
                type: 'text',
                content: '\u597d\uff0c\u6211\u8fd9\u8fb9\u5148\u628a\u56fe\u6807\u548c\u5165\u53e3\u786e\u8ba4\u597d\u3002'
            }
        },
        {
            id: 'studio-msg-14',
            role: 'user',
            type: 'text',
            time: '2026-04-10T20:28:00+08:00',
            content: '\u6536\u5230\uff0c\u90a3\u6211\u5c31\u6309\u8fd9\u4e2a\u7248\u672c\u7ee7\u7eed\u5f80\u4e0b\u770b\u3002',
            replyTo: {
                name: '\u6797\u4e88',
                type: 'text',
                content: '\u6211\u5148\u628a\u5de5\u4f5c\u5ba4\u804a\u5929\u9875\u7684\u6574\u4f53\u6c14\u8d28\u5b9a\u4e0b\u6765\u3002'
            }
        }
    ];

    const STUDIO_CHAT_SEQUENCE_META = buildStudioSequenceMeta(STUDIO_CHAT_DEMO_MESSAGES);
    const STUDIO_CHAT_AVATAR_SEQUENCE_META = buildStudioAvatarSequenceMeta(STUDIO_CHAT_DEMO_MESSAGES);

    let currentStudioVoiceMsgId = null;
    let currentStudioVoiceIcon = null;
    let currentStudioVoiceTimer = null;

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[character];
        });
    }

    function formatTextHtml(value) {
        return escapeHtml(value == null ? '' : value).replace(/\r?\n/g, '<br>');
    }

    function normalizePayload(content) {
        if (content && typeof content === 'object') return content;
        if (typeof content === 'string') {
            try {
                return JSON.parse(content);
            } catch (error) {
                return { text: content };
            }
        }
        return {};
    }

    function formatDuration(durationValue) {
        const totalSeconds = Math.max(1, parseInt(durationValue || 1, 10));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return minutes + ':' + String(seconds).padStart(2, '0');
    }

    function formatClockLabel(timeValue) {
        const date = new Date(timeValue);
        if (Number.isNaN(date.getTime())) return '';
        return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
    }

    function resetStudioVoiceState() {
        if (currentStudioVoiceTimer) {
            clearTimeout(currentStudioVoiceTimer);
            currentStudioVoiceTimer = null;
        }
        if (currentStudioVoiceIcon) {
            currentStudioVoiceIcon.className = currentStudioVoiceIcon.dataset.idleClass || 'ri-play-fill';
            currentStudioVoiceIcon = null;
        }
        currentStudioVoiceMsgId = null;
    }

    function buildReplyMarkup(replyTo) {
        if (!replyTo) return '';

        let previewText = String(replyTo.content || '').trim();
        if (replyTo.type === 'image' || replyTo.type === 'virtual_image') previewText = '[\u56fe\u7247]';
        else if (replyTo.type === 'sticker') previewText = '[\u8868\u60c5\u5305]';
        else if (replyTo.type === 'voice') previewText = '[\u8bed\u97f3]';
        else if (replyTo.type === 'transfer') previewText = '[\u8f6c\u8d26]';
        else if (replyTo.type === 'gift_card') previewText = '[\u793c\u7269]';
        else if (replyTo.type === 'delivery_share') previewText = '[\u5916\u5356]';

        return '<div class="quote-container">\u56de\u590d ' + escapeHtml(replyTo.name || '\u5bf9\u65b9') + ': ' + escapeHtml(previewText) + '</div>';
    }

    function buildVoiceMarkup(message) {
        const voiceData = normalizePayload(message.content);
        const duration = formatDuration(voiceData.duration);
        const transcript = voiceData.text ? formatTextHtml(voiceData.text) : '[\u8bed\u97f3]';
        const uid = 'studio-v-' + Math.random().toString(36).substr(2, 9);

        return '<div class="voice-bar-top" onclick="window.playStudioVoiceMsg(\'' + message.id + '\', \'' + uid + '\', event)"><div class="voice-icon-box"><i class="ri-play-fill" data-idle-class="ri-play-fill" data-playing-class="ri-play-fill voice-playing-anim"></i></div><div class="voice-bars" aria-hidden="true"><div class="voice-bar" style="height: 30%;"></div><div class="voice-bar" style="height: 60%;"></div><div class="voice-bar" style="height: 100%;"></div><div class="voice-bar" style="height: 80%;"></div><div class="voice-bar" style="height: 40%;"></div><div class="voice-bar" style="height: 60%;"></div><div class="voice-bar" style="height: 90%;"></div><div class="voice-bar" style="height: 50%;"></div><div class="voice-bar" style="height: 30%;"></div></div><span class="voice-dur-text voice-time">' + escapeHtml(duration) + '</span></div><div id="' + uid + '" class="voice-text-bottom transcription hidden" onclick="this.classList.add(\'hidden\'); event.stopPropagation();">' + transcript + '</div>';
    }

    function buildTransferMarkup(content, isUser) {
        const transferData = normalizePayload(content);
        const amount = Number(transferData.amount || 0).toFixed(2);
        const remark = String(transferData.remark || '\u8f6c\u8d26').trim() || '\u8f6c\u8d26';
        const status = transferData.status || 'pending';

        let statusText = '';
        let statusTag = isUser ? 'Sent' : 'Transfer';
        let iconClass = 'fas fa-exchange-alt';
        let cardClass = '';

        if (status === 'accepted') {
            statusText = '\u5df2\u6536\u6b3e';
            statusTag = 'Received';
            iconClass = 'fas fa-check';
            cardClass = 'accepted';
        } else if (status === 'returned') {
            statusText = '\u5df2\u9000\u8fd8';
            statusTag = 'Returned';
            iconClass = 'fas fa-undo';
            cardClass = 'returned';
        }

        const subtitle = remark + (statusText ? ' · ' + statusText : '');

        return '' +
            '<div class="transfer-card glass-card ' + cardClass + '" onclick="event.stopPropagation();">' +
                '<div class="card-watermark">TRX</div>' +
                '<div class="card-top">' +
                    '<div class="card-icon-box"><i class="' + iconClass + '"></i></div>' +
                    '<div class="card-tag">' + statusTag + '</div>' +
                '</div>' +
                '<div class="card-value">¥' + escapeHtml(amount) + '</div>' +
                '<div class="card-label">' + escapeHtml(subtitle) + '</div>' +
            '</div>';
    }

    function buildDeliveryMarkup(content) {
        const deliveryData = normalizePayload(content);
        const items = Array.isArray(deliveryData.items) ? deliveryData.items : [];
        const itemCount = items.length;
        const firstItem = itemCount > 0 ? items[0] : { title: '\u7f8e\u98df\u5916\u5356' };
        const total = Number(deliveryData.total || 0).toFixed(2);
        const subtitleParts = ['¥' + total];

        if (itemCount > 0) subtitleParts.push(itemCount + '\u4ef6');
        subtitleParts.push('\u914d\u9001\u4e2d');
        if (deliveryData.remark) subtitleParts.push(String(deliveryData.remark));

        return '' +
            '<div class="delivery-share-card glass-card" onclick="event.stopPropagation();">' +
                '<div class="card-watermark">FOOD</div>' +
                '<div class="card-top">' +
                    '<div class="card-icon-box"><i class="fas fa-utensils"></i></div>' +
                    '<div class="card-tag">On the way</div>' +
                '</div>' +
                '<div class="card-value">' + escapeHtml(firstItem.title || '\u7f8e\u98df\u5916\u5356') + '</div>' +
                '<div class="card-label">' + escapeHtml(subtitleParts.join(' · ')) + '</div>' +
            '</div>';
    }

    function buildGiftMarkup(content) {
        const giftData = normalizePayload(content);
        const paymentAmount = giftData.paymentAmount || giftData.price || '0.00';
        const recipientName = giftData.recipientName || '';
        const paymentMethodLabel = giftData.paymentMethodLabel || '';
        const title = giftData.title || '\u793c\u7269';
        const subtitleParts = ['¥' + paymentAmount];

        if (recipientName) subtitleParts.push('\u7ed9 ' + recipientName);
        if (paymentMethodLabel) subtitleParts.push(paymentMethodLabel);

        return '' +
            '<div class="gift-card glass-card" onclick="event.stopPropagation();">' +
                '<div class="card-watermark">GIFT</div>' +
                '<div class="card-top">' +
                    '<div class="card-icon-box"><i class="fas fa-gift"></i></div>' +
                    '<div class="card-tag">Unbox</div>' +
                '</div>' +
                '<div class="card-value">' + escapeHtml(title) + '</div>' +
                '<div class="card-label">' + escapeHtml(subtitleParts.join(' · ')) + '</div>' +
            '</div>';
    }

    function buildMessageContentMarkup(message) {
        if (message.type === 'voice') return buildVoiceMarkup(message);
        if (message.type === 'transfer') return buildTransferMarkup(message.content, message.role === 'user');
        if (message.type === 'delivery_share') return buildDeliveryMarkup(message.content);
        if (message.type === 'gift_card') return buildGiftMarkup(message.content);
        return formatTextHtml(message.content || '');
    }

    function getMessageExtraClass(message) {
        if (message.type === 'voice') return 'voice-msg';
        if (message.type === 'transfer') return 'no-bubble transfer-msg';
        if (message.type === 'delivery_share') return 'no-bubble delivery-share-msg';
        if (message.type === 'gift_card') return 'no-bubble gift-card-msg';
        return '';
    }

    function buildStudioBubbleDecoMarkup(message) {
        const previewGroup = getStudioPreviewGroup(message);
        if (previewGroup !== 'ordinary' && previewGroup !== 'voice') return '';

        return '<span class="studio-bubble-deco deco-1" aria-hidden="true"></span><span class="studio-bubble-deco deco-2" aria-hidden="true"></span>';
    }

    function getStudioPreviewGroup(message) {
        if (message.type === 'voice') return 'voice';
        if (message.type === 'text') return 'ordinary';
        return 'card';
    }

    function buildStudioSequenceMeta(messages) {
        const meta = {};
        let currentKey = '';
        let currentRun = [];

        function flushRun() {
            const total = currentRun.length;
            if (!total) return;

            currentRun.forEach(function (message, index) {
                let slot = 'single';
                if (total >= 3) slot = index === 0 ? 'first' : (index === total - 1 ? 'last' : 'middle');
                else if (total === 2) slot = index === 0 ? 'first' : 'last';

                meta[message.id] = {
                    slot: slot,
                    index: index + 1,
                    count: total
                };
            });

            currentRun = [];
            currentKey = '';
        }

        messages.forEach(function (message) {
            const previewGroup = getStudioPreviewGroup(message);
            const roleKey = message.role === 'user' ? 'user' : 'other';
            const nextKey = previewGroup === 'card' ? '' : (previewGroup + ':' + roleKey);

            if (!nextKey) {
                flushRun();
                return;
            }

            if (currentKey && currentKey !== nextKey) flushRun();
            if (!currentKey) currentKey = nextKey;
            currentRun.push(message);
        });

        flushRun();

        return meta;
    }

    function buildStudioAvatarSequenceMeta(messages) {
        const meta = {};
        let currentRole = '';
        let currentRun = [];

        function flushRun() {
            const total = currentRun.length;
            if (!total) return;

            currentRun.forEach(function (message, index) {
                let slot = 'single';
                if (total >= 3) slot = index === 0 ? 'first' : (index === total - 1 ? 'last' : 'middle');
                else if (total === 2) slot = index === 0 ? 'first' : 'last';

                meta[message.id] = {
                    slot: slot,
                    index: index + 1,
                    count: total
                };
            });

            currentRun = [];
            currentRole = '';
        }

        messages.forEach(function (message) {
            const roleKey = message.role === 'user' ? 'user' : ((message.role === 'other' || message.role === 'assistant') ? 'other' : '');
            if (!roleKey) {
                flushRun();
                return;
            }
            if (currentRole && currentRole !== roleKey) flushRun();
            if (!currentRole) currentRole = roleKey;
            currentRun.push(message);
        });

        flushRun();

        return meta;
    }


    function shouldShowTimestamp(previousTime, currentTime, index) {
        if (!currentTime) return index === 0;
        if (index === 0 || !previousTime) return true;
        return (new Date(currentTime).getTime() - new Date(previousTime).getTime()) > 5 * 60 * 1000;
    }

    function buildMessageRowMarkup(message) {
        const isUser = message.role === 'user';
        const avatar = isUser ? STUDIO_CHAT_DEMO_META.selfAvatar : STUDIO_CHAT_DEMO_META.otherAvatar;
        const extraClass = getMessageExtraClass(message);
        const contentHtml = buildMessageContentMarkup(message);
        const decoHtml = buildStudioBubbleDecoMarkup(message);
        const replyHtml = buildReplyMarkup(message.replyTo);
        const timeLabel = formatClockLabel(message.time);
        const timeHtml = '<div class="msg-time">' + escapeHtml(timeLabel) + '</div>';
        const roleKey = isUser ? 'user' : 'other';
        const previewGroup = getStudioPreviewGroup(message);
        const sequenceMeta = STUDIO_CHAT_SEQUENCE_META[message.id] || { slot: 'single', index: 1, count: 1 };
        const avatarSequenceMeta = STUDIO_CHAT_AVATAR_SEQUENCE_META[message.id] || { slot: 'single', index: 1, count: 1 };
        const hasReply = message.replyTo ? 'true' : 'false';

        return '' +
            '<div class="chat-message ' + roleKey + ' has-tail" data-msg-id="' + escapeHtml(message.id) + '" data-role="' + roleKey + '" data-kind="' + escapeHtml(message.type || 'text') + '" data-preview-group="' + escapeHtml(previewGroup) + '" data-has-reply="' + hasReply + '" data-series-slot="' + escapeHtml(sequenceMeta.slot) + '" data-series-index="' + escapeHtml(sequenceMeta.index) + '" data-series-count="' + escapeHtml(sequenceMeta.count) + '" data-avatar-series-slot="' + escapeHtml(avatarSequenceMeta.slot) + '" data-avatar-series-index="' + escapeHtml(avatarSequenceMeta.index) + '" data-avatar-series-count="' + escapeHtml(avatarSequenceMeta.count) + '">' +
                '<span class="chat-avatar chat-avatar-shell" data-role="' + roleKey + '"><img src="' + escapeHtml(avatar) + '" class="chat-avatar-img" alt=""><span class="chat-avatar-frame" aria-hidden="true"></span></span>' +
                '<div class="msg-wrapper">' +
                    '<div class="message-content ' + extraClass + '" data-role="' + roleKey + '" data-kind="' + escapeHtml(message.type || 'text') + '">' + contentHtml + decoHtml + '<span class="bubble-inline-time" aria-hidden="true">' + escapeHtml(timeLabel) + '</span>' + '</div>' +
                    replyHtml +
                '</div>' +
                timeHtml +
            '</div>';
    }

    function renderStudioChatDemo() {
        const container = document.getElementById('studio-chat-messages');
        const titleEl = document.getElementById('studio-chat-title');
        const statusEl = document.getElementById('studio-chat-status');
        const topbarAvatarMain = document.getElementById('studio-chat-topbar-avatar-main');
        const topbarAvatarRight = document.getElementById('studio-chat-topbar-avatar-right');

        if (!container || !titleEl || !statusEl) return;

        resetStudioVoiceState();
        titleEl.textContent = STUDIO_CHAT_DEMO_META.title;
        statusEl.textContent = STUDIO_CHAT_DEMO_META.status;
        statusEl.dataset.defaultText = String(STUDIO_CHAT_DEMO_META.status || '').trim() || '5G Online';
        statusEl.classList.toggle('hidden', !STUDIO_CHAT_DEMO_META.status);
        [topbarAvatarMain, topbarAvatarRight].forEach(function (button) {
            if (!button) return;
            button.dataset.avatarUrl = STUDIO_CHAT_DEMO_META.otherAvatar;
            if (!button.innerHTML) button.innerHTML = '<i class="ri-user-line"></i>';
        });
        container.innerHTML = '';

        let previousTime = null;
        STUDIO_CHAT_DEMO_MESSAGES.forEach(function (message, index) {
            if (shouldShowTimestamp(previousTime, message.time, index)) {
                const stamp = document.createElement('div');
                stamp.className = 'chat-time-stamp';
                stamp.innerHTML = '<span>' + escapeHtml(formatClockLabel(message.time)) + '</span>';
                container.appendChild(stamp);
            }

            const wrapper = document.createElement('div');
            wrapper.innerHTML = buildMessageRowMarkup(message);
            container.appendChild(wrapper.firstElementChild);
            previousTime = message.time;
        });

        requestAnimationFrame(function () {
            container.scrollTop = container.scrollHeight;
            if (typeof window.applyStudioToolbarPreview === 'function') {
                window.applyStudioToolbarPreview();
            }
        });
    }

    function bindStudioApp() {
        const closeBtn = document.getElementById('close-studio-app');
        const studioApp = document.getElementById('studio-app');
        if (closeBtn && studioApp && !closeBtn.dataset.studioBound) {
            closeBtn.dataset.studioBound = 'true';
            closeBtn.addEventListener('click', function () {
                resetStudioVoiceState();
                studioApp.classList.add('hidden');
            });
        }
    }

    window.playStudioVoiceMsg = function (msgId, textElId, event) {
        if (event) event.stopPropagation();

        const button = event && event.currentTarget ? event.currentTarget : null;
        const icon = button ? button.querySelector('i') : null;
        const textEl = document.getElementById(textElId);

        if (textEl) textEl.classList.remove('hidden');

        resetStudioVoiceState();

        if (!icon) return;

        icon.className = icon.dataset.playingClass || 'ri-play-fill voice-playing-anim';
        currentStudioVoiceMsgId = msgId;
        currentStudioVoiceIcon = icon;
        currentStudioVoiceTimer = setTimeout(function () {
            if (currentStudioVoiceMsgId === msgId && currentStudioVoiceIcon === icon) {
                icon.className = icon.dataset.idleClass || 'ri-play-fill';
                currentStudioVoiceMsgId = null;
                currentStudioVoiceIcon = null;
                currentStudioVoiceTimer = null;
            }
        }, 1200);
    };

    function initStudioApp() {
        bindStudioApp();
        renderStudioChatDemo();
    }

    window.renderStudioChatDemo = renderStudioChatDemo;
    window.initStudioApp = initStudioApp;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStudioApp);
    } else {
        initStudioApp();
    }
})();

