window.refreshAiImage = async function(msgId, event) {
    if (event) event.stopPropagation();

    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId) return;

    const history = window.iphoneSimState.chatHistory[contactId];
    if (!history) return;

    const msgIndex = history.findIndex(m => m.id === msgId);
    if (msgIndex === -1) return;

    const msg = history[msgIndex];
    if (!msg.novelaiPrompt) {
        alert("该图片无法重新生成（缺少 Prompt）");
        return;
    }

    if (!confirm("确定要使用相同的提示词重新生成这张图片吗？")) return;

    const novelaiSettings = window.iphoneSimState.novelaiSettings;
    if (!novelaiSettings || !novelaiSettings.key) {
        alert("请先配置 NovelAI API Key");
        return;
    }

    // 更新消息状态为正在生成
    const originalContent = msg.content;
    const originalType = msg.type;
    
    msg.type = 'virtual_image';
    msg.content = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Regenerating...';
    
    // 强制重新渲染
    if (window.renderChatHistory) renderChatHistory(contactId, true);

    try {
         const genOptions = {
            key: novelaiSettings.key,
            model: novelaiSettings.model,
            prompt: msg.novelaiPrompt,
            negativePrompt: msg.novelaiNegativePrompt || novelaiSettings.negativePrompt,
            steps: novelaiSettings.steps || 28,
            scale: novelaiSettings.cfg || 5,
            seed: -1,
            width: 832,
            height: 1216
        };

        // 尝试从 preset 恢复参数
        const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
        if (contact && contact.novelaiPreset) {
             let preset = null;
             if (contact.novelaiPreset === 'AUTO_MATCH') {
                  const type = detectImageType(msg.description || "");
                  const presets = window.iphoneSimState.novelaiPresets || [];
                  preset = presets.find(p => p.type === type);
                  if (!preset && type !== 'general') {
                       preset = presets.find(p => p.type === 'general');
                  }
             } else {
                  preset = (window.iphoneSimState.novelaiPresets || []).find(p => p.name === contact.novelaiPreset);
             }

             if (preset && preset.settings) {
                 genOptions.model = preset.settings.model || genOptions.model;
                 genOptions.steps = preset.settings.steps || genOptions.steps;
                 genOptions.scale = preset.settings.scale || genOptions.scale;
                 genOptions.width = preset.settings.width || genOptions.width;
                 genOptions.height = preset.settings.height || genOptions.height;
             }
        }

        const base64Image = await window.generateNovelAiImageApi(genOptions);

        // 更新消息
        msg.type = 'image';
        msg.content = base64Image;
        
        saveConfig();
        if (window.renderChatHistory) renderChatHistory(contactId, true);

    } catch (e) {
        console.error("Regeneration failed", e);
        alert("生成失败: " + e.message);
        // 恢复原图
        msg.type = originalType;
        msg.content = originalContent;
        if (window.renderChatHistory) renderChatHistory(contactId, true);
    }
};

window.closeMusicListenInviteDetail = function () {
    const modal = document.getElementById('music-listen-invite-detail-modal');
    if (modal) modal.style.display = 'none';
};

window.closeMusicListenInvitePrompt = function () {
    const modal = document.getElementById('music-listen-invite-prompt-modal');
    if (modal) {
        const inviteId = String(modal.dataset.inviteId || '');
        if (inviteId && window._musicInvitePromptShownMap) {
            delete window._musicInvitePromptShownMap[inviteId];
        }
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
};

window.openMusicListenInvitePrompt = function (payload) {
    let data = {};
    try {
        data = typeof payload === 'string' ? JSON.parse(payload) : (payload || {});
    } catch (e) {
        data = {};
    }

    const inviteId = String(data.inviteId || '');
    const contactId = String(data.contactId || '');
    const status = String(data.status || 'pending');
    const direction = String(data.direction || 'incoming');
    if (!inviteId || !contactId || status !== 'pending' || direction !== 'incoming') return;

    const contact = (window.iphoneSimState.contacts || []).find(c => String(c.id) === contactId);
    const contactName = contact ? (contact.remark || contact.nickname || contact.name || '联系人') : '联系人';
    const songTitle = String(data.songTitle || '未知歌曲');
    const songArtist = String(data.songArtist || '未知歌手');
    const songCover = String(data.songCover || 'https://placehold.co/120x120/e5e7eb/111827?text=Music');
    const contactAvatar = String((contact && contact.avatar) || songCover || 'https://placehold.co/96x96/e5e7eb/111827?text=U');

    let modal = document.getElementById('music-listen-invite-prompt-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'music-listen-invite-prompt-modal';
        modal.className = 'music-invite-prompt-overlay';
        modal.innerHTML = `
            <div id="music-listen-invite-prompt-card" class="music-invite-prompt-popup">
                <img id="music-invite-prompt-avatar" class="ip-avatar" src="" alt="">
                <div class="ip-info">
                    <h4 id="music-invite-prompt-name"></h4>
                    <p id="music-invite-prompt-text"></p>
                    <p id="music-invite-prompt-song" class="music-invite-prompt-song"></p>
                </div>
                <div class="ip-actions">
                    <button id="music-invite-prompt-reject" class="ip-btn reject" type="button">拒绝</button>
                    <button id="music-invite-prompt-accept" class="ip-btn accept" type="button">同意</button>
                </div>
            </div>
        `;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) window.closeMusicListenInvitePrompt();
        });
        document.body.appendChild(modal);
    }

    if (modal.style.display === 'flex' && String(modal.dataset.inviteId || '') === inviteId) {
        return;
    }
    if (!window._musicInvitePromptShownMap) window._musicInvitePromptShownMap = {};
    window._musicInvitePromptShownMap[inviteId] = Date.now();

    modal.dataset.inviteId = inviteId;
    modal.dataset.contactId = contactId;
    const avatarEl = modal.querySelector('#music-invite-prompt-avatar');
    const nameEl = modal.querySelector('#music-invite-prompt-name');
    const textEl = modal.querySelector('#music-invite-prompt-text');
    const songEl = modal.querySelector('#music-invite-prompt-song');
    if (avatarEl) avatarEl.src = contactAvatar;
    if (nameEl) nameEl.textContent = contactName;
    if (textEl) textEl.textContent = '邀请你一起听歌';
    if (songEl) songEl.textContent = `${songTitle} · ${songArtist}`;

    const acceptBtn = modal.querySelector('#music-invite-prompt-accept');
    const rejectBtn = modal.querySelector('#music-invite-prompt-reject');
    const applyDecision = (decision) => {
        const iid = String(modal.dataset.inviteId || '');
        const cid = String(modal.dataset.contactId || '');
        let handled = false;
        if (iid && cid && typeof window.musicV2HandleInviteDecision === 'function') {
            handled = window.musicV2HandleInviteDecision(cid, iid, decision);
        }
        if (!handled && typeof window.showChatToast === 'function') {
            showChatToast('邀请处理失败，请稍后重试');
        }
        window.closeMusicListenInvitePrompt();
    };

    if (acceptBtn) acceptBtn.onclick = () => applyDecision('accepted');
    if (rejectBtn) rejectBtn.onclick = () => applyDecision('rejected');
    modal.style.display = 'flex';
    modal.classList.add('active');
};

window.openMusicListenInviteDetail = function (payload) {
    let data = {};
    try {
        if (typeof payload === 'string') {
            const parsed = decodeURIComponent(payload);
            data = JSON.parse(parsed);
        } else if (payload && typeof payload === 'object') {
            data = payload;
        }
    } catch (e) {
        data = {};
    }

    const statusMap = {
        pending: '待回复',
        accepted: '已同意',
        rejected: '已拒绝'
    };
    const statusText = statusMap[String(data.status || 'pending')] || '待回复';
    const createdAt = Number(data.createdAt || 0);
    const updatedAt = Number(data.updatedAt || 0);
    const createdText = createdAt ? new Date(createdAt).toLocaleString() : '-';
    const updatedText = updatedAt ? new Date(updatedAt).toLocaleString() : '-';
    const contact = (window.iphoneSimState.contacts || []).find(c => String(c.id) === String(data.contactId || ''));
    const contactName = contact ? (contact.remark || contact.nickname || contact.name || '联系人') : '联系人';

    let modal = document.getElementById('music-listen-invite-detail-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'music-listen-invite-detail-modal';
        modal.style.cssText = [
            'position:fixed',
            'inset:0',
            'z-index:10050',
            'background:rgba(0,0,0,0.45)',
            'display:none',
            'align-items:center',
            'justify-content:center',
            'padding:16px'
        ].join(';');
        modal.innerHTML = `
            <div id="music-listen-invite-detail-card" style="width:min(92vw,360px);background:#fff;border-radius:18px;box-shadow:0 14px 34px rgba(0,0,0,0.22);overflow:hidden;">
                <div style="padding:14px 16px 10px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;">
                    <strong style="font-size:16px;color:#111;">一起听邀请详情</strong>
                    <button onclick="window.closeMusicListenInviteDetail()" style="border:none;background:#f2f2f7;border-radius:999px;width:28px;height:28px;line-height:28px;font-size:16px;color:#666;cursor:pointer;">×</button>
                </div>
                <div id="music-listen-invite-detail-body" style="padding:14px 16px 16px;font-size:13px;color:#333;line-height:1.6;"></div>
            </div>
        `;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) window.closeMusicListenInviteDetail();
        });
        document.body.appendChild(modal);
    }

    const body = modal.querySelector('#music-listen-invite-detail-body');
    if (body) {
        body.innerHTML = `
            <div style="display:flex;gap:10px;margin-bottom:12px;">
                <img src="${data.songCover || 'https://placehold.co/80x80/e5e7eb/111827?text=Music'}" style="width:52px;height:52px;border-radius:10px;object-fit:cover;background:#f0f0f0;">
                <div style="min-width:0;flex:1;">
                    <div style="font-size:15px;font-weight:700;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${data.songTitle || '未知歌曲'}</div>
                    <div style="font-size:13px;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${data.songArtist || '未知歌手'}</div>
                </div>
            </div>
            <div><strong style="color:#555;">联系人：</strong>${contactName}</div>
            <div><strong style="color:#555;">状态：</strong>${statusText}</div>
            <div><strong style="color:#555;">邀请ID：</strong>${data.inviteId || '-'}</div>
            <div><strong style="color:#555;">创建时间：</strong>${createdText}</div>
            <div><strong style="color:#555;">更新时间：</strong>${updatedText}</div>
        `;
    }
    modal.style.display = 'flex';
};

function escapeChatMessageHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function isLikelyChatImageUrl(value) {
    const text = String(value || '').trim();
    if (!text || !/^https?:\/\/\S+$/i.test(text)) return false;
    if (/\.(?:png|jpe?g|gif|webp|bmp|svg|avif)(?:[?#].*)?$/i.test(text)) return true;
    return /(postimg\.cc|postimg\.org|placehold\.co|imgur\.com|image\.bdstatic\.com|qpic\.cn|alicdn\.com)/i.test(text);
}

function formatPlainTextMessageContent(text) {
    const source = String(text || '')
        .replace(/<hidden_img>\s*([\s\S]*?)\s*<\/hidden_img>/gi, '\n$1\n')
        .replace(/\r\n?/g, '\n');
    if (!source.trim()) return '';

    const htmlParts = [];
    let textBuffer = [];

    const flushText = () => {
        if (!textBuffer.length) return;
        const joined = textBuffer.join('\n').replace(/\n{3,}/g, '\n\n').trim();
        textBuffer = [];
        if (!joined) return;
        htmlParts.push(`<div class="text-message-block">${escapeChatMessageHtml(joined).replace(/\n/g, '<br>')}</div>`);
    };

    source.split('\n').forEach((line) => {
        const trimmed = String(line || '').trim();
        if (!trimmed) {
            if (textBuffer.length && textBuffer[textBuffer.length - 1] !== '') {
                textBuffer.push('');
            }
            return;
        }
        if (isLikelyChatImageUrl(trimmed)) {
            flushText();
            const safeUrl = escapeChatMessageHtml(trimmed);
            htmlParts.push(`<div class="text-message-inline-image"><img src="${safeUrl}" onclick="showImagePreview(this.src)" style="max-width: 200px; border-radius: 8px; display: block;"></div>`);
            return;
        }
        textBuffer.push(line);
    });

    flushText();
    return htmlParts.join('') || escapeChatMessageHtml(source).replace(/\n/g, '<br>');
}

function findChatHistoryMessageByIdForRender(msgId) {
    if (!msgId || !window.iphoneSimState || !window.iphoneSimState.chatHistory) return null;

    const historyBuckets = [];
    const currentContactId = window.iphoneSimState.currentChatContactId;
    if (currentContactId && Array.isArray(window.iphoneSimState.chatHistory[currentContactId])) {
        historyBuckets.push(window.iphoneSimState.chatHistory[currentContactId]);
    }

    Object.keys(window.iphoneSimState.chatHistory).forEach(contactId => {
        if (String(contactId) === String(currentContactId || '')) return;
        const history = window.iphoneSimState.chatHistory[contactId];
        if (Array.isArray(history)) {
            historyBuckets.push(history);
        }
    });

    for (const history of historyBuckets) {
        const found = history.find(message => String(message && message.id || '') === String(msgId));
        if (found) return found;
    }

    return null;
}

function normalizeBilingualTranslatedText(rawText) {
    const text = String(rawText || '').trim();
    if (!text) return '';
    if (isHtmlPayloadForParser(text)) return '';

    if (typeof extractVisibleControlData === 'function') {
        const sanitized = extractVisibleControlData(text);
        return String(sanitized && sanitized.cleanText || '').trim();
    }

    return text;
}

function buildBilingualTranslationMeta(contact, translatedText) {
    if (!contact || typeof contact !== 'object') return null;
    if (typeof window.ensureContactBilingualTranslationFields === 'function') {
        window.ensureContactBilingualTranslationFields(contact);
    }
    if (!contact.bilingualTranslationEnabled) return null;

    const normalizedTranslatedText = normalizeBilingualTranslatedText(translatedText);
    if (!normalizedTranslatedText) return null;

    return {
        sourceLang: String(contact.bilingualSourceLang || 'zh-CN').trim() || 'zh-CN',
        targetLang: String(contact.bilingualTargetLang || 'en').trim() || 'en',
        translatedText: normalizedTranslatedText
    };
}

function getRenderableBilingualTranslationMeta(msgId, type, text) {
    if (!msgId || type !== 'text' || typeof text !== 'string') return null;
    if (!text.trim() || isHtmlPayloadForParser(text)) return null;

    const message = findChatHistoryMessageByIdForRender(msgId);
    if (!message || !message.bilingualTranslation || typeof message.bilingualTranslation !== 'object') return null;

    const translatedText = normalizeBilingualTranslatedText(message.bilingualTranslation.translatedText);
    if (!translatedText) return null;

    return {
        sourceLang: String(message.bilingualTranslation.sourceLang || '').trim(),
        targetLang: String(message.bilingualTranslation.targetLang || '').trim(),
        translatedText
    };
}

function formatTextMessageContentWithTranslation(text, msgId, type = 'text') {
    const originalHtml = formatPlainTextMessageContent(text);
    const translationMeta = getRenderableBilingualTranslationMeta(msgId, type, text);
    if (!translationMeta) return originalHtml;

    const translatedHtml = formatPlainTextMessageContent(translationMeta.translatedText);
    if (!translatedHtml) return originalHtml;

    return `<div class="message-original-text">${originalHtml}</div><div class="message-translated-text">${translatedHtml}</div>`;
}

function appendMessageToUI(text, isUser, type = 'text', description = null, replyTo = null, msgId = null, timestamp = null, isHistory = false) {
    if (type === 'text' && text && typeof text === 'string') {
        // Strip hidden image data from display
        text = text.replace(/<hidden_img>.*?<\/hidden_img>/g, '');

        if (isHiddenForumWechatSyncText(text)) {
            return;
        }
        
        if (!isUser && text.includes('ACTION:')) {
            text = text.split('\n').filter(line => !line.trim().startsWith('ACTION:')).join('\n').trim();
            if (!text) return;
        }
    }

    if (type === 'voice_call_text') {
        return;
    }

    const container = document.getElementById('chat-messages');
    
    const lastMsg = container.lastElementChild;
    let showTimestamp = false;
    const now = timestamp || Date.now();
    
    if (!lastMsg || lastMsg.classList.contains('system') || !lastMsg.dataset.time) {
        showTimestamp = true;
    } else {
        const lastTime = parseInt(lastMsg.dataset.time);
        if (now - lastTime > 5 * 60 * 1000) {
            showTimestamp = true;
        }
    }

    // 处理气泡尾巴逻辑：如果是连续消息且没有时间戳分隔，移除上一条消息的尾巴
    if (!showTimestamp && lastMsg && lastMsg.classList.contains('chat-message')) {
        const lastIsUser = lastMsg.classList.contains('user');
        if (lastIsUser === isUser) {
            lastMsg.classList.remove('has-tail');
        }
    }

    if (showTimestamp) {
        const timeDiv = document.createElement('div');
        timeDiv.className = 'chat-time-stamp';
        const date = new Date(now);
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        timeDiv.innerHTML = `<span>${timeStr}</span>`;
        container.appendChild(timeDiv);
    }

    const msgDiv = document.createElement('div');
    msgDiv.dataset.time = now;
    
    let isSystemMsg = false;
    if (type === 'system') {
        isSystemMsg = true;
    } else if (type === 'text' && text && typeof text === 'string' && (text.startsWith('[系统消息]:') || text.startsWith('[系统]:'))) {
        isSystemMsg = true;
    }

    if (isSystemMsg) {
        msgDiv.className = 'chat-message system';
        const systemText = text.replace(/^\[系统(消息)?\][:：]?\s*/, '').trim();
        msgDiv.innerHTML = `<div class="system-tip">${systemText}</div>`;
        container.appendChild(msgDiv);
        return;
    }

    // 默认给新消息添加 has-tail 类，因为它目前是最后一条
    msgDiv.className = `chat-message ${isUser ? 'user' : 'other'} has-tail`;
    if (!isHistory) {
        msgDiv.classList.add('new');
    }
    if (msgId) msgDiv.dataset.msgId = msgId;

    msgDiv.style.position = 'relative';
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    let fireBuddySpeakerMeta = null;
    if (!isUser && msgId && typeof window.getFireBuddySpeakerMeta === 'function') {
        try {
            fireBuddySpeakerMeta = window.getFireBuddySpeakerMeta(window.iphoneSimState.currentChatContactId, msgId);
        } catch (fireBuddyMetaError) {
            console.warn('读取小火人发言信息失败', fireBuddyMetaError);
        }
    }
    
    let contentHtml = '';
    if (type === 'image' || type === 'sticker') {
        const isDeferredChatMedia = typeof window.isChatMediaReference === 'function' && window.isChatMediaReference(text);
        const initialImageSrc = isDeferredChatMedia
            ? (window.CHAT_MEDIA_PIXEL_PLACEHOLDER || '')
            : text;
        const deferredAttr = isDeferredChatMedia
            ? ` data-chat-media-ref="${encodeURIComponent(text)}"`
            : '';
        contentHtml = `<img src="${initialImageSrc}"${deferredAttr} onclick="showImagePreview(this.src)" loading="lazy" decoding="async" style="max-width: 200px; border-radius: 4px;">`;
    } else if (type === 'voice') {
        let duration = '0:01';
        let transText = '[语音]';
        try {
            let data = typeof text === 'string' ? JSON.parse(text) : text;
            const durSec = Math.max(1, parseInt(data.duration || 1, 10));
            const mins = Math.floor(durSec / 60);
            const secs = durSec % 60;
            duration = `${mins}:${secs.toString().padStart(2, '0')}`;
            transText = data.text || '';
        } catch (e) {
            transText = text;
        }

        const uid = 'v-' + Math.random().toString(36).substr(2, 9);
        
        contentHtml = `<div class="voice-bar-top" onclick="window.playVoiceMsg('${msgId}', '${uid}', event)"><div class="voice-icon-box"><i class="ri-play-fill" data-idle-class="ri-play-fill" data-playing-class="ri-play-fill voice-playing-anim"></i></div><div class="voice-bars" aria-hidden="true"><div class="voice-bar" style="height: 30%;"></div><div class="voice-bar" style="height: 60%;"></div><div class="voice-bar" style="height: 100%;"></div><div class="voice-bar" style="height: 80%;"></div><div class="voice-bar" style="height: 40%;"></div><div class="voice-bar" style="height: 60%;"></div><div class="voice-bar" style="height: 90%;"></div><div class="voice-bar" style="height: 50%;"></div><div class="voice-bar" style="height: 30%;"></div></div><span class="voice-dur-text voice-time">${duration}</span></div><div id="${uid}" class="voice-text-bottom transcription hidden" onclick="this.classList.add('hidden'); event.stopPropagation();">${transText}</div>`;
    } else if (type === 'transfer') {
        let transferData = { amount: '0.00', remark: '转账', status: 'pending' };
        try {
            if (typeof text === 'string') {
                transferData = JSON.parse(text);
            } else {
                transferData = text;
            }
        } catch (e) {
            console.error('解析转账数据失败', e);
            transferData = { amount: '0.00', remark: text || '转账', status: 'pending' };
        }
        
        const amount = parseFloat(transferData.amount).toFixed(2);
        const remark = transferData.remark || '转账给您';
        const status = transferData.status || 'pending';
        
        let statusText = '';
        let statusTag = isUser ? 'Sent' : 'Transfer';
        let iconClass = 'fas fa-exchange-alt';
        let cardClass = '';
        
        if (status === 'accepted') {
            statusText = '已收款';
            statusTag = 'Received';
            iconClass = 'fas fa-check';
            cardClass = 'accepted';
        } else if (status === 'returned') {
            statusText = '已退还';
            statusTag = 'Returned';
            iconClass = 'fas fa-undo';
            cardClass = 'returned';
        }

        const subtitle = `${remark}${statusText ? ` · ${statusText}` : ''}`;

        if (!transferData.id) {
            contentHtml = `
                <div class="transfer-card glass-card ${cardClass}" onclick="alert('该转账消息已失效（旧数据），请发送新转账测试')">
                    <div class="card-watermark">TRX</div>
                    <div class="card-top">
                        <div class="card-icon-box"><i class="${iconClass}"></i></div>
                        <div class="card-tag">${statusTag}</div>
                    </div>
                    <div class="card-value">¥${amount}</div>
                    <div class="card-label">${subtitle}</div>
                </div>
            `;
        } else {
            contentHtml = `
                <div class="transfer-card glass-card ${cardClass}" onclick="window.handleTransferClick(${transferData.id}, '${isUser ? 'user' : 'other'}')">
                    <div class="card-watermark">TRX</div>
                    <div class="card-top">
                        <div class="card-icon-box"><i class="${iconClass}"></i></div>
                        <div class="card-tag">${statusTag}</div>
                    </div>
                    <div class="card-value">¥${amount}</div>
                    <div class="card-label">${subtitle}</div>
                </div>
            `;
        }
    } else if (type === 'family_card') {
        let familyData = {
            id: '',
            mode: 'request',
            status: 'pending',
            monthlyLimit: null,
            note: ''
        };
        try {
            familyData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch (e) {
            console.error('解析亲属卡数据失败', e);
        }

        const mode = familyData.mode === 'grant' ? 'grant' : 'request';
        const isAccepted = familyData.status === 'accepted';
        const safeCardId = String(familyData.id || '').replace(/'/g, "\\'");
        const safeContactId = String(window.iphoneSimState.currentChatContactId || '').replace(/'/g, "\\'");
        const cardClass = mode === 'grant' ? 'chat-bank-v2-card chat-bank-v2-card-light' : 'chat-bank-v2-card';
        const cardTitle = mode === 'grant' ? '亲属卡' : 'Black Card';
        contentHtml = `
            <div class="${cardClass}" onclick="window.openFamilyCardDetail('${safeCardId}', '${safeContactId}')">
                <i class="fas fa-coins chat-bank-v2-decor"></i>
                <div class="chat-bank-v2-title-row">
                    <div class="chat-bank-v2-card-title">${cardTitle}</div>
                    ${isAccepted ? '<span class="chat-bank-v2-status-check"><i class="fas fa-check"></i></span>' : ''}
                </div>
                <div class="chat-bank-v2-chip"></div>
                <div class="chat-bank-v2-card-info">
                    <div class="chat-bank-v2-card-num">**** 4921</div>
                    <i class="fas fa-credit-card"></i>
                </div>
            </div>
        `;
    } else if (type === 'virtual_image') {
        const imgId = `virtual-img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const overlayId = `overlay-${imgId}`;
        const descText = description || '无描述';
        const cleanDesc = descText.replace(/^\[图片描述\][:：]?\s*/, '');
        
        contentHtml = `
            <div class="virtual-image-container" style="position: relative; cursor: pointer; display: flex; justify-content: center; align-items: center;">
                <img id="${imgId}" src="${text}" style="max-width: 200px; border-radius: 4px; display: block; width: auto; height: auto;">
                <div id="${overlayId}" class="virtual-image-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.8); border-radius: 4px; display: flex; align-items: center; justify-content: center; padding: 10px; box-sizing: border-box; opacity: 0; transition: opacity 0.3s; pointer-events: none;">
                    <div style="font-size: 14px; color: #333; line-height: 1.4; overflow-y: auto; max-height: 100%; text-align: center;">${cleanDesc}</div>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            const container = document.getElementById(imgId).parentElement;
            const overlay = document.getElementById(overlayId);
            
            if (container && overlay) {
                container.onclick = () => {
                    const isVisible = overlay.style.opacity === '1';
                    overlay.style.opacity = isVisible ? '0' : '1';
                    overlay.style.pointerEvents = isVisible ? 'none' : 'auto';
                };
            }
        }, 0);
    } else if (type === 'description') {
        contentHtml = text;
    } else {
        contentHtml = (type === 'text' && !isHtmlPayloadForParser(text))
            ? formatTextMessageContentWithTranslation(text, msgId, type)
            : text;
    }

    let extraClass = '';
    const isHtmlTextMessage = type === 'text' && isHtmlPayloadForParser(text);
    const cardTypes = ['transfer', 'family_card', 'gift_card', 'shopping_gift', 'delivery_share', 'order_progress', 'order_share', 'pay_request', 'product_share', 'icity_card', 'minesweeper_invite', 'pdd_cash_share', 'pdd_bargain_share', 'savings_invite', 'savings_withdraw_request', 'savings_withdraw_result', 'savings_progress', 'music_listen_invite'];
    if (cardTypes.includes(type)) {
        extraClass += ' no-bubble';
    }

    if (type === 'transfer') {
        extraClass += ' transfer-msg';
        try {
            const data = typeof text === 'string' ? JSON.parse(text) : text;
            if (data.status === 'accepted') extraClass += ' accepted';
            if (data.status === 'returned') extraClass += ' returned';
        } catch(e) {}
    } else if (type === 'family_card') {
        extraClass += ' family-card-msg';
    } else if (type === 'sticker') {
        extraClass = 'sticker-msg';
        const isDeferredSticker = typeof window.isChatMediaReference === 'function' && window.isChatMediaReference(text);
        const stickerSrc = isDeferredSticker ? (window.CHAT_MEDIA_PIXEL_PLACEHOLDER || '') : text;
        const stickerRefAttr = isDeferredSticker ? ` data-chat-media-ref="${encodeURIComponent(text)}"` : '';
        contentHtml = `<img src="${stickerSrc}"${stickerRefAttr} onclick="showImagePreview(this.src)">`;
    } else if (type === 'voice') {
        extraClass = 'voice-msg'; 
    } else if (type === 'description') {
        extraClass = 'description-msg';
    } else if (type === 'virtual_image') {
        extraClass = 'virtual-image-msg no-bubble';
    } else if (type === 'image') {
        extraClass = 'image-msg no-bubble';
    } else if (type === 'gift_card') {
        extraClass += ' gift-card-msg';
        let giftData = typeof text === 'string' ? JSON.parse(text) : text;
        const paymentAmount = giftData.paymentAmount || giftData.price || '0.00';
        const recipientName = giftData.recipientName || '';
        const paymentMethodLabel = giftData.paymentMethodLabel || '';
        const title = giftData.title || '礼物';
        const subtitleParts = [`¥${paymentAmount}`];
        if (recipientName) subtitleParts.push(`给 ${recipientName}`);
        if (paymentMethodLabel) subtitleParts.push(paymentMethodLabel);
        contentHtml = `
            <div class="gift-card glass-card">
                <div class="card-watermark">GIFT</div>
                <div class="card-top">
                    <div class="card-icon-box"><i class="fas fa-gift"></i></div>
                    <div class="card-tag">Unbox</div>
                </div>
                <div class="card-value">${title}</div>
                <div class="card-label">${subtitleParts.join(' · ')}</div>
            </div>
        `;
    } else if (type === 'shopping_gift') {
        extraClass += ' shopping-gift-msg';
        let giftData = {};
        try {
            giftData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch(e) {}
        
        const itemCount = giftData.items ? giftData.items.length : 0;
        const firstItem = itemCount > 0 ? giftData.items[0] : { title: '礼物', image: '' };
        const total = giftData.total || giftData.paymentAmount || '0.00';
        const recipientText = giftData.recipientName || giftData.recipientText || '';
        const mainTitle = itemCount > 1 ? `${firstItem.title} 等${itemCount}件` : (firstItem.title || '礼物');
        const subtitleParts = [`¥${total}`];
        if (recipientText) subtitleParts.push(`给 ${recipientText}`);
        if (giftData.remark) subtitleParts.push(giftData.remark);
        
        contentHtml = `
            <div class="shopping-gift-card glass-card">
                <div class="card-watermark">GIFT</div>
                <div class="card-top">
                    <div class="card-icon-box"><i class="fas fa-gift"></i></div>
                    <div class="card-tag">Sent</div>
                </div>
                <div class="card-value">${mainTitle}</div>
                <div class="card-label">${subtitleParts.join(' · ')}</div>
            </div>
        `;
    } else if (type === 'savings_invite') {
        extraClass += ' savings-invite-msg';
        let inviteData = {};
        try {
            inviteData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch (e) {}
        const safePayload = encodeURIComponent(JSON.stringify({
            title: inviteData.title || '共同存钱计划',
            targetAmount: Number(inviteData.targetAmount || 0),
            aprBase: Number(inviteData.aprBase || 0),
            inviteText: '已邀请你一起存钱'
        })).replace(/'/g, "\\'");
        const cardTitle = '共同存钱';
        contentHtml = `
            <div class="chat-bank-v2-card chat-bank-v2-card-light" onclick="window.openSavingsInviteDetail('${safePayload}')">
                <i class="fas fa-piggy-bank chat-bank-v2-decor"></i>
                <div class="chat-bank-v2-title-row">
                    <div class="chat-bank-v2-card-title">${cardTitle}</div>
                </div>
                <div class="chat-bank-v2-chip"></div>
                <div class="chat-bank-v2-card-info">
                    <div class="chat-bank-v2-card-num">SAVINGS INVITE</div>
                    <i class="fas fa-wallet"></i>
                </div>
            </div>
        `;
    } else if (type === 'savings_withdraw_request') {
        extraClass += ' savings-withdraw-msg';
        let reqData = {};
        try {
            reqData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch (e) {}
        contentHtml = `
            <div style="background:#fff;border-radius:12px;overflow:hidden;width:240px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <div style="background:#333;color:#fff;padding:10px 12px;font-size:14px;font-weight:700;">共同存钱转出申请</div>
                <div style="padding:10px 12px;font-size:13px;color:#333;line-height:1.45;">
                    <div>金额：¥${Number(reqData.amount || 0).toFixed(2)}</div>
                    <div>状态：待确认（24小时）</div>
                </div>
            </div>
        `;
    } else if (type === 'savings_progress') {
        extraClass += ' savings-progress-msg';
        let pData = {};
        try {
            pData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch (e) {}
        contentHtml = `
            <div style="background:#fff;border-radius:12px;overflow:hidden;width:240px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <div style="background:#111;color:#fff;padding:10px 12px;font-size:14px;font-weight:700;">共同存钱进度</div>
                <div style="padding:10px 12px;font-size:13px;color:#333;line-height:1.45;">
                    <div>${pData.text || '计划有新进展'}</div>
                </div>
            </div>
        `;
    } else if (type === 'music_listen_invite') {
        extraClass += ' music-listen-invite-msg';
        let inviteData = {};
        try {
            inviteData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch (e) {}
        const safePayload = encodeURIComponent(JSON.stringify(inviteData || {})).replace(/'/g, "\\'");
        const songTitle = inviteData.songTitle || '未知歌曲';
        const songArtist = inviteData.songArtist || '未知歌手';
        const songCover = inviteData.songCover || 'https://placehold.co/120x120/e5e7eb/111827?text=Music';
        contentHtml = `
            <div class="music-listen-invite-card" onclick="window.openMusicListenInviteDetail('${safePayload}')">
                <div class="music-listen-invite-content">
                    <img class="music-listen-invite-cover" src="${songCover}">
                    <div class="music-listen-invite-meta">
                        <div class="music-listen-invite-title">${songTitle}</div>
                        <div class="music-listen-invite-artist">${songArtist}</div>
                        <div class="music-listen-invite-platform">
                            <i class="fab fa-apple"></i>
                            <span>Music</span>
                        </div>
                    </div>
                    <div class="music-listen-invite-play">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'delivery_share') {
        extraClass += ' delivery-share-msg';
        let deliveryData = {};
        try {
            deliveryData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch(e) {}
        
        const itemCount = deliveryData.items ? deliveryData.items.length : 0;
        const firstItem = itemCount > 0 ? deliveryData.items[0] : { title: '美食', image: '' };
        const total = deliveryData.total || '0.00';
        const subtitleParts = [`¥${total}`];
        if (itemCount > 0) subtitleParts.push(`${itemCount}件`);
        subtitleParts.push('配送中');
        if (deliveryData.remark) subtitleParts.push(deliveryData.remark);
        
        contentHtml = `
            <div class="delivery-share-card glass-card">
                <div class="card-watermark">FOOD</div>
                <div class="card-top">
                    <div class="card-icon-box"><i class="fas fa-utensils"></i></div>
                    <div class="card-tag">On the way</div>
                </div>
                <div class="card-value">${firstItem.title || '美食外卖'}</div>
                <div class="card-label">${subtitleParts.join(' · ')}</div>
            </div>
        `;
    } else if (type === 'order_progress' || type === 'order_share') {
        extraClass += ' order-progress-msg';
        let progressData = {};
        try {
            progressData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch(e) {}

        const status = String(progressData.status || '待发货');
        const eta = progressData.eta || '';
        const orderId = progressData.orderId;
        const normalizedStatus = status.toLowerCase();

        const pickTimelineValue = (...values) => {
            for (const value of values) {
                if (value === undefined || value === null || value === '') continue;
                if (typeof value === 'string') {
                    const str = value.trim();
                    if (
                        !str ||
                        str === '--' ||
                        str === '--:--' ||
                        str.toLowerCase() === 'null' ||
                        str.toLowerCase() === 'undefined'
                    ) {
                        continue;
                    }
                }
                return value;
            }
            return null;
        };

        const parseTimelineTs = (value) => {
            if (value === undefined || value === null || value === '') return null;
            if (typeof value === 'number' && Number.isFinite(value)) return value;
            const str = String(value).trim();
            if (!str) return null;
            if (/^\d+$/.test(str)) {
                const n = Number(str);
                if (Number.isFinite(n)) return n;
            }
            const ts = Date.parse(str);
            if (!Number.isNaN(ts)) return ts;
            return null;
        };

        const formatTimelineTime = (value, fallback = '--:--') => {
            if (value === undefined || value === null || value === '') return fallback;

            const ts = parseTimelineTs(value);
            if (ts !== null) {
                const d = new Date(ts);
                if (Number.isNaN(d.getTime())) return fallback;
                const hh = String(d.getHours()).padStart(2, '0');
                const mm = String(d.getMinutes()).padStart(2, '0');

                const now = new Date();
                const sameDay =
                    d.getFullYear() === now.getFullYear() &&
                    d.getMonth() === now.getMonth() &&
                    d.getDate() === now.getDate();

                if (sameDay) return `${hh}:${mm}`;

                const mon = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${mon}/${day} ${hh}:${mm}`;
            }

            const str = String(value).trim();
            const hm = str.match(/(\d{1,2}:\d{2})/);
            if (hm) return hm[1];
            return fallback;
        };

        const getLinkedOrderMilestones = (linkedOrder) => {
            if (!linkedOrder) return null;

            if (typeof window.getShoppingOrderMilestones === 'function') {
                try {
                    const milestone = window.getShoppingOrderMilestones(linkedOrder);
                    const orderTs = Number(milestone && milestone.orderTs);
                    const shipTs = Number(milestone && milestone.shipTs);
                    const deliverTs = Number(milestone && milestone.deliverTs);
                    if (
                        Number.isFinite(orderTs) &&
                        Number.isFinite(shipTs) &&
                        Number.isFinite(deliverTs) &&
                        deliverTs > shipTs
                    ) {
                        return { orderTs, shipTs, deliverTs };
                    }
                } catch (err) {
                    // Fallback to local derive logic below if shopping module helper is unavailable.
                }
            }

            const orderTs = Number(linkedOrder.time) || Date.now();
            const isDelivery = Array.isArray(linkedOrder.items) && linkedOrder.items.some(i => i && i.isDelivery);

            const computeFallback = () => {
                if (isDelivery) {
                    return {
                        orderTs,
                        shipTs: orderTs + 15 * 60 * 1000,
                        deliverTs: orderTs + 40 * 60 * 1000
                    };
                }
                const d = new Date(orderTs);
                const targetShipTs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18, 0, 0, 0).getTime();
                const endOfDayTs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 0, 0).getTime();
                const minShipTs = orderTs + 30 * 60 * 1000;
                let shipTs = Math.max(targetShipTs, minShipTs);
                if (shipTs > endOfDayTs) {
                    shipTs = Math.max(orderTs + 5 * 60 * 1000, endOfDayTs);
                }
                return {
                    orderTs,
                    shipTs,
                    deliverTs: shipTs + 2 * 24 * 60 * 60 * 1000
                };
            };

            const fallback = computeFallback();
            const shipTs = Number(linkedOrder.shipAt);
            const deliverTs = Number(linkedOrder.deliverAt);
            if (Number.isFinite(shipTs) && Number.isFinite(deliverTs) && deliverTs > shipTs) {
                return { orderTs, shipTs, deliverTs };
            }
            return fallback;
        };

        const linkedOrder = (() => {
            const list = window.iphoneSimState && Array.isArray(window.iphoneSimState.shoppingOrders)
                ? window.iphoneSimState.shoppingOrders
                : [];
            const targetId = String(orderId || '');
            if (!targetId) return null;
            return list.find(o => String(o.id) === targetId) || null;
        })();

        const linkedMilestones = getLinkedOrderMilestones(linkedOrder);

        const inferStepFromStatus = () => {
            let result = 1;
            if (
                status.includes('已发货') ||
                status.includes('配送中') ||
                normalizedStatus.includes('picked up') ||
                normalizedStatus.includes('shipped')
            ) {
                result = 2;
            }
            if (
                status.includes('运输中') ||
                status.includes('派送中') ||
                status.includes('已送达') ||
                status.includes('已完成') ||
                normalizedStatus.includes('on delivery') ||
                normalizedStatus.includes('out for delivery') ||
                normalizedStatus.includes('delivered') ||
                normalizedStatus.includes('completed')
            ) {
                result = 3;
            }
            return result;
        };

        const deriveStepFromMilestones = (shipTs, deliverTs, nowTs = Date.now()) => {
            if (Number.isFinite(deliverTs) && nowTs >= deliverTs) return 3;
            if (Number.isFinite(shipTs) && nowTs >= shipTs) return 2;
            return 1;
        };

        const inferRegularShipTs = (orderTs) => {
            const d = new Date(orderTs);
            const targetShipTs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18, 0, 0, 0).getTime();
            const endOfDayTs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 0, 0).getTime();
            const minShipTs = orderTs + 30 * 60 * 1000;
            let shipTs = Math.max(targetShipTs, minShipTs);
            if (shipTs > endOfDayTs) {
                shipTs = Math.max(orderTs + 5 * 60 * 1000, endOfDayTs);
            }
            return shipTs;
        };

        const inferDeliveryHint = (() => {
            const raw = `${status} ${eta} ${progressData.items || ''}`;
            const lower = raw.toLowerCase();
            return (
                /外卖|配送|骑手|送达/.test(raw) ||
                lower.includes('delivery') ||
                lower.includes('picked up') ||
                lower.includes('on the way') ||
                lower.includes('out for delivery')
            );
        })();

        const inferMilestonesFromStatus = (statusStep) => {
            const nowTs = Date.now();
            if (inferDeliveryHint) {
                if (statusStep >= 3) {
                    const deliverTs = nowTs;
                    const orderTs = deliverTs - 40 * 60 * 1000;
                    return { orderTs, shipTs: orderTs + 15 * 60 * 1000, deliverTs };
                }
                if (statusStep === 2) {
                    const shipTs = nowTs - 5 * 60 * 1000;
                    const orderTs = shipTs - 15 * 60 * 1000;
                    return { orderTs, shipTs, deliverTs: orderTs + 40 * 60 * 1000 };
                }
                const orderTs = nowTs;
                return { orderTs, shipTs: orderTs + 15 * 60 * 1000, deliverTs: orderTs + 40 * 60 * 1000 };
            }

            if (statusStep >= 3) {
                const deliverTs = nowTs;
                const shipTs = deliverTs - 2 * 24 * 60 * 60 * 1000;
                const orderTs = shipTs - 4 * 60 * 60 * 1000;
                return { orderTs, shipTs, deliverTs };
            }
            if (statusStep === 2) {
                const shipTs = nowTs - 2 * 60 * 60 * 1000;
                const orderTs = shipTs - 4 * 60 * 60 * 1000;
                return { orderTs, shipTs, deliverTs: shipTs + 2 * 24 * 60 * 60 * 1000 };
            }
            const orderTs = nowTs;
            const shipTs = inferRegularShipTs(orderTs);
            return { orderTs, shipTs, deliverTs: shipTs + 2 * 24 * 60 * 60 * 1000 };
        };

        const stepFromStatus = inferStepFromStatus();

        const orderTsFromPayload = parseTimelineTs(
            pickTimelineValue(progressData.orderTs, progressData.createdAt, linkedMilestones ? linkedMilestones.orderTs : null)
        );
        const shipTsFromPayload = parseTimelineTs(
            pickTimelineValue(progressData.shipTs, progressData.shippedAt, linkedMilestones ? linkedMilestones.shipTs : null)
        );
        const deliverTsFromPayload = parseTimelineTs(
            pickTimelineValue(progressData.deliverTs, progressData.deliveredAt, linkedMilestones ? linkedMilestones.deliverTs : null)
        );

        const orderTextFromPayload = pickTimelineValue(progressData.orderTime, progressData.timeOrdered);
        const shipTextFromPayload = pickTimelineValue(progressData.shipTime, progressData.timeShipped);
        const deliverTextFromPayload = pickTimelineValue(progressData.deliverTime, progressData.timeDelivered);

        const hasAnyTimelineData =
            orderTsFromPayload !== null ||
            shipTsFromPayload !== null ||
            deliverTsFromPayload !== null ||
            !!orderTextFromPayload ||
            !!shipTextFromPayload ||
            !!deliverTextFromPayload;

        const inferredMilestones = hasAnyTimelineData ? null : inferMilestonesFromStatus(stepFromStatus);

        const finalOrderValue =
            orderTsFromPayload !== null
                ? orderTsFromPayload
                : (inferredMilestones ? inferredMilestones.orderTs : null) || orderTextFromPayload;
        const finalShipValue =
            shipTsFromPayload !== null
                ? shipTsFromPayload
                : (inferredMilestones ? inferredMilestones.shipTs : null) || shipTextFromPayload;
        const finalDeliverValue =
            deliverTsFromPayload !== null
                ? deliverTsFromPayload
                : (inferredMilestones ? inferredMilestones.deliverTs : null) || deliverTextFromPayload;

        let step = stepFromStatus;
        const shipTsForStep = parseTimelineTs(finalShipValue);
        const deliverTsForStep = parseTimelineTs(finalDeliverValue);
        if (
            Number.isFinite(shipTsForStep) &&
            Number.isFinite(deliverTsForStep) &&
            deliverTsForStep > shipTsForStep
        ) {
            step = deriveStepFromMilestones(shipTsForStep, deliverTsForStep);
        }

        const safeOrderId = String(orderId || '').replace(/'/g, "\\'");
        const openOrderAction = safeOrderId
            ? `if(window.openShoppingOrderProgress) window.openShoppingOrderProgress('${safeOrderId}');`
            : '';

        const orderTimeText = formatTimelineTime(finalOrderValue, '--:--');
        const etaText = formatTimelineTime(eta, '--:--');
        const shipTimeText = formatTimelineTime(finalShipValue, step >= 2 ? etaText : '--:--');
        const deliverTimeText = formatTimelineTime(finalDeliverValue, step >= 3 ? etaText : '--:--');

        contentHtml = `
            <div class="order-share-card glass-card" onclick="document.getElementById('shopping-app').classList.remove('hidden'); if(window.switchShoppingTab) window.switchShoppingTab('orders'); ${openOrderAction}">
                <div class="card-watermark">SYNC</div>
                <div class="card-top" style="margin-bottom: 10px;">
                    <div class="card-icon-box"><i class="fas fa-route"></i></div>
                    <div class="card-tag">Track</div>
                </div>
                <div class="steps">
                    <div class="step ${step > 1 ? 'done' : ''} ${step === 1 ? 'active' : ''}">
                        <div class="step-icon">${step > 1 ? '<i class="fas fa-check"></i>' : '1'}</div>
                        <div class="step-text">下单</div>
                        <div class="step-time">${orderTimeText}</div>
                    </div>
                    <div class="step ${step > 2 ? 'done' : ''} ${step === 2 ? 'active' : ''}">
                        <div class="step-icon">${step > 2 ? '<i class="fas fa-check"></i>' : '2'}</div>
                        <div class="step-text">发货</div>
                        <div class="step-time">${shipTimeText}</div>
                    </div>
                    <div class="step ${step === 3 ? 'active' : ''}">
                        <div class="step-icon">${step === 3 ? '<i class="fas fa-check"></i>' : '3'}</div>
                        <div class="step-text">送达</div>
                        <div class="step-time">${deliverTimeText}</div>
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'pay_request') {

        extraClass += ' pay-request-msg';
        let payData = {};
        try {
            payData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch(e) {}
        
        const itemCount = payData.items ? payData.items.length : 0;
        const firstItem = itemCount > 0 ? payData.items[0] : { title: '商品', image: '' };
        const total = payData.total || '0.00';
        const isPaid = payData.status === 'paid';
        
        contentHtml = `
            <div class="pay-request-card" style="background: #fff; border-radius: 12px; overflow: hidden; width: 230px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <div style="background: #333333; padding: 8px 12px; color: #fff; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: space-between;">
                    <span><i class="fas fa-hand-holding-usd" style="margin-right: 6px;"></i>代付请求</span>
                    <span style="font-size: 16px;">¥${total}</span>
                </div>
                <div style="padding: 5px 10px 2px 10px; display: flex; gap: 10px;">
                    <div style="width: 60px; height: 60px; border-radius: 6px; overflow: hidden; flex-shrink: 0; background-color: #f0f0f0;">
                        <img src="${firstItem.image || ''}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 13px; color: #333; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${firstItem.title}</div>
                        ${firstItem.selectedSpec ? `<div style="font-size: 11px; color: #999; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${firstItem.selectedSpec}</div>` : ''}
                        ${itemCount > 1 ? `<div style="font-size: 12px; color: #999; margin-top: 4px;">等 ${itemCount} 件商品</div>` : ''}
                    </div>
                </div>
                <div style="padding: 2px 12px; border-top: 1px solid #f5f5f5; text-align: right; line-height: 1;">
                     ${isPaid ? 
                       '<span style="font-size: 12px; color: #999; border: 1px solid #ddd; padding: 2px 8px; border-radius: 10px; background: #f5f5f5;">已付款</span>' : 
                       '<span style="font-size: 12px; color: #FF5000; border: 1px solid #FF5000; padding: 2px 8px; border-radius: 10px;">去支付</span>'}
                </div>
            </div>
        `;
    } else if (type === 'product_share') {
        extraClass += ' product-share-msg';
        let productData = {};
        try {
            productData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch(e) {}
        
        contentHtml = `
            <div class="product-share-card" style="background: #fff; border-radius: 12px; overflow: hidden; width: 230px; height: 115px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; flex-direction: column;">
                <div style="display: flex; padding: 10px; gap: 8px; flex: 1; overflow: hidden;">
                    <div style="width: 60px; height: 60px; border-radius: 6px; overflow: hidden; flex-shrink: 0; background-color: #f0f0f0;">
                        <img src="${productData.image || ''}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;">
                        <div style="font-size: 13px; color: #333; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;">${productData.title || '商品'}</div>
                        <div style="font-size: 14px; color: #FF5000; font-weight: bold;">¥${productData.price || '0.00'}</div>
                    </div>
                </div>
                <div style="padding: 0 10px 0 10px; height: 26px; font-size: 10px; color: #999; border-top: 1px solid #f5f5f5; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
                    <div style="display: flex; align-items: center;">
                        <i class="fas fa-shopping-bag" style="color: #FF5000; margin-right: 4px;"></i>
                        <span>${productData.shop_name || '闲鱼'}</span>
                    </div>
                    <i class="fas fa-chevron-right" style="font-size: 10px;"></i>
                </div>
            </div>
        `;
    } else if (type === 'icity_card') {
        extraClass += ' icity-card-msg';
        let cardData = typeof text === 'string' ? JSON.parse(text) : text;
        
        let displayContent = cardData.content;
        if (displayContent && displayContent.length > 30) {
            displayContent = displayContent.substring(0, 30) + '...';
        }
        
        let commentCount = 0;
        if (cardData.comments && Array.isArray(cardData.comments)) {
            commentCount = cardData.comments.length;
        }
        
        let commentBadge = '';
        if (commentCount > 0) {
            commentBadge = `<span style="margin-left: auto; background: #f0f0f0; padding: 1px 6px; border-radius: 4px; color: #666;">${commentCount}条评论</span>`;
        }
        
        contentHtml = `
            <div class="icity-share-card" style="background: #fff; border-radius: 8px; width: 220px; height: 110px; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; margin-top: -40px;" onclick="document.getElementById('icity-app').classList.remove('hidden'); window.openIcityDiaryDetail(${cardData.diaryId});">
                <div style="padding: 8px 10px; flex: 1; display: flex; flex-direction: column; justify-content: center;">
                    <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cardData.authorName}</div>
                    <div style="font-size: 12px; color: #666; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displayContent}</div>
                </div>
                <div style="padding: 4px 10px; font-size: 10px; color: #999; display: flex; align-items: center; border-top: 1px solid #f5f5f5; height: 24px; padding-top: 6px;">
                    <i class="fas fa-globe" style="margin-right: 4px;"></i> <span style="position: relative; top: 0px;">iCity 日记</span>
                    ${commentBadge}
                </div>
            </div>
        `;
    } else if (type === 'minesweeper_invite') {
        extraClass += ' minesweeper-invite-msg';
        contentHtml = `<div class="minesweeper-card" style="display: flex; flex-direction: column; width: 100%; height: 100%; justify-content: space-between;" onclick="window.startMinesweeper()"><div class="minesweeper-invite-top" style="display: flex; align-items: center; padding: 12px 15px; gap: 12px; background: linear-gradient(135deg, #f9f9f9 0%, #ffffff 100%); border-bottom: 1px solid #f0f0f0; width: 100%;"><div class="minesweeper-icon" style="width: 40px; height: 40px; border-radius: 8px; background-color: #ff3b30; display: flex; justify-content: center; align-items: center; font-size: 20px; color: #fff;">💣</div><div class="minesweeper-info" style="display: flex; flex-direction: column; justify-content: center; flex: 1;"><div class="minesweeper-title" style="font-size: 16px; font-weight: 600; color: #000; margin-bottom: 2px;">扫雷</div><div class="minesweeper-desc" style="font-size: 12px; color: #8e8e93;">邀请你玩游戏</div></div></div><div class="minesweeper-invite-bottom" style="padding: 8px 15px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #8e8e93; width: 100%;"><span>经典游戏</span><i class="fas fa-chevron-right"></i></div></div>`;
    } else if (type === 'pdd_cash_share') {
        let data = {};
        try { data = JSON.parse(text); } catch(e) {}
        
        contentHtml = `
            <div class="pdd-share-msg" onclick="if(window.renderCashActivity) { document.getElementById('shopping-app').classList.remove('hidden'); window.renderCashActivity(); }">
                <div class="pdd-share-header">
                    <i class="fas fa-money-bill-wave"></i> <span class="pdd-header-text">天天领现金</span>
                </div>
                <div class="pdd-share-content">
                    <div class="pdd-share-title">点一下！就差你了</div>
                    <div class="pdd-share-amount">¥${data.amount || '99.9'}</div>
                </div>
            </div>
        `;
    } else if (type === 'pdd_bargain_share') {
        let data = {};
        try { data = JSON.parse(text); } catch(e) {}
        
        contentHtml = `
            <div class="pdd-share-msg" onclick="if(window.startBargain) { document.getElementById('shopping-app').classList.remove('hidden'); window.startBargain({id: '${data.productId}', title: '${data.title}', price: ${data.currentPrice}, image: '${data.image}'}); }">
                <div class="pdd-share-header" style="background:#ff6600;">
                    <i class="fas fa-cut"></i> <span class="pdd-header-text">砍价免费拿</span>
                </div>
                <div class="pdd-share-content">
                    <div style="display:flex; gap:10px; margin-bottom:10px;">
                        <div style="width:60px; height:60px; background:#f0f0f0; border-radius:4px; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-gift" style="font-size:24px; color:#ff6600;"></i>
                        </div>
                        <div style="text-align:left; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
                            <div style="font-size:13px; font-weight:bold; line-height:1.2; height:32px; overflow:hidden; color:#333;">${data.title}</div>
                            <div style="color:#ff0000; font-weight:bold; font-size:14px;">当前: ¥${data.currentPrice}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    if (isHtmlTextMessage) {
        extraClass += ' html-msg no-bubble';
    }

    if (fireBuddySpeakerMeta) {
        extraClass += ' fire-buddy-msg';
        msgDiv.classList.add('fire-buddy-message');
    }

    // no-bubble card templates are often multiline strings. Trimming avoids
    // leading/trailing text nodes from creating extra vertical blank space.
    const shouldForceNoBubble = extraClass.includes('no-bubble');
    if (shouldForceNoBubble) {
        contentHtml = String(contentHtml).trim();
    }

    let replyHtml = '';
    if (replyTo) {
        let replyPreviewText = String(replyTo.content || '').trim();
        if (replyTo.type === 'image' || replyTo.type === 'virtual_image') {
            replyPreviewText = '[图片]';
        } else if (replyTo.type === 'sticker') {
            replyPreviewText = '[表情包]';
        } else if (replyTo.type === 'voice') {
            replyPreviewText = '[语音]';
        } else if (typeof window.isChatMediaReference === 'function' && window.isChatMediaReference(replyPreviewText)) {
            replyPreviewText = '[图片]';
        }

        replyHtml = `
            <div class="quote-container">
                回复 ${escapeChatMessageHtml(replyTo.name)}: ${escapeChatMessageHtml(replyPreviewText)}
            </div>
        `;
    }

    const date = new Date(now);
    const msgTimeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    const timeHtml = `<div class="msg-time">${msgTimeStr}</div>`;

    if (type === 'description') {
        msgDiv.className = 'chat-message description-row';
        msgDiv.innerHTML = `
            <div class="msg-wrapper" style="width: 100%; align-items: center;">
                <div class="message-content ${extraClass}">${contentHtml}</div>
            </div>
        `;
    } else if (!isUser) {
        const avatar = fireBuddySpeakerMeta && fireBuddySpeakerMeta.avatar
            ? fireBuddySpeakerMeta.avatar
            : (contact ? contact.avatar : '');
        const avatarClass = fireBuddySpeakerMeta ? 'chat-avatar fire-buddy-chat-avatar' : 'chat-avatar';
        const speakerLabelHtml = fireBuddySpeakerMeta
            ? `<div class="fire-buddy-speaker-label">${fireBuddySpeakerMeta.name || '小火人'}</div>`
            : '';
        msgDiv.innerHTML = `
            <img src="${avatar}" class="${avatarClass}">
            <div class="msg-wrapper">
                ${speakerLabelHtml}
                <div class="message-content ${extraClass}">${contentHtml}</div>
                ${replyHtml}
            </div>
            ${timeHtml}
        `;
    } else {
        let myAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
        
        if (contact && contact.myAvatar) {
            myAvatar = contact.myAvatar;
        } else if (window.iphoneSimState.currentUserPersonaId) {
            const p = window.iphoneSimState.userPersonas.find(p => p.id === window.iphoneSimState.currentUserPersonaId);
            if (p) myAvatar = p.avatar;
        }

        msgDiv.innerHTML = `
            <img src="${myAvatar}" class="chat-avatar">
            <div class="msg-wrapper">
                <div class="message-content ${extraClass}">${contentHtml}</div>
                ${replyHtml}
            </div>
            ${timeHtml}
        `;
    }

    if (!isUser) {
        const avatarEl = msgDiv.querySelector('.chat-avatar');
        if (avatarEl) {
            avatarEl.style.cursor = 'pointer';
            if (fireBuddySpeakerMeta && typeof window.openFireBuddyPanel === 'function') {
                avatarEl.addEventListener('click', () => window.openFireBuddyPanel(fireBuddySpeakerMeta.contactId || window.iphoneSimState.currentChatContactId));
            } else if (typeof window.openAiProfile === 'function') {
                avatarEl.addEventListener('click', () => window.openAiProfile());
            }
        }
    }

    // Hard-lock no-bubble shells so user custom CSS cannot bring the bubble
    // background/padding/border/shadow back for card-style messages.
    if (shouldForceNoBubble) {
        const noBubbleShell = msgDiv.querySelector('.message-content');
        if (noBubbleShell) {
            const lockedStyles = {
                'padding': '0',
                'padding-left': '0',
                'padding-right': '0',
                'background': 'transparent',
                'background-color': 'transparent',
                'background-image': 'none',
                'border': 'none',
                'box-shadow': 'none',
                'border-radius': '0',
                'line-height': 'normal',
                'white-space': 'normal',
                'min-height': '0',
                'height': 'auto',
                'display': 'block',
                'width': 'fit-content',
                'max-width': '100%'
            };
            Object.entries(lockedStyles).forEach(([prop, value]) => {
                noBubbleShell.style.setProperty(prop, value, 'important');
            });
        }
    }

    // Robust fallback: some historical order cards may miss the progress steps block.
    const orderCardInMsg = msgDiv.querySelector('.order-share-card');
    if (orderCardInMsg && !orderCardInMsg.querySelector('.steps')) {
        orderCardInMsg.insertAdjacentHTML('beforeend', `
            <div class="steps">
                <div class="step active">
                    <div class="step-icon">1</div>
                    <div class="step-text">下单</div>
                    <div class="step-time">--:--</div>
                </div>
                <div class="step">
                    <div class="step-icon">2</div>
                    <div class="step-text">发货</div>
                    <div class="step-time">--:--</div>
                </div>
                <div class="step">
                    <div class="step-icon">3</div>
                    <div class="step-text">送达</div>
                    <div class="step-time">--:--</div>
                </div>
            </div>
        `);
    }

    // 在 msgDiv 构建完成后，检查并添加刷新按钮
    if (type === 'image' && !isUser && msgId) {
        const contentEl = msgDiv.querySelector('.message-content');
        if (contentEl) {
             const currentContactId = window.iphoneSimState.currentChatContactId;
             if (currentContactId && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[currentContactId]) {
                 const msgObj = window.iphoneSimState.chatHistory[currentContactId].find(m => m.id === msgId);
                 if (msgObj && msgObj.novelaiPrompt) {
                     contentEl.style.position = 'relative';
                     contentEl.style.display = 'inline-block';
                     
                     const img = contentEl.querySelector('img');
                     if (img) {
                         img.style.display = 'block';
                         img.style.margin = '0';
                     }

                     const btn = document.createElement('div');
                     btn.className = 'image-refresh-btn';
                     btn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                     btn.onclick = (e) => window.refreshAiImage(msgId, e);
                     btn.title = '重新生成';
                     contentEl.appendChild(btn);
                 }
             }
        }
    }

    const selectCheckbox = document.createElement('input');
    selectCheckbox.type = 'checkbox';
    selectCheckbox.className = 'msg-select-checkbox hidden';
    selectCheckbox.style.position = 'absolute';
    selectCheckbox.style.zIndex = '210';
    selectCheckbox.dataset.msgId = msgId || '';
    selectCheckbox.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const id = ev.target.dataset.msgId;
        toggleMessageSelection(id);
    });
    msgDiv.appendChild(selectCheckbox);

    let longPressTimer;
    const handleStart = (e) => {
        longPressTimer = setTimeout(() => {
            handleMessageLongPress(e, text, isUser, type, msgId);
        }, 500);
    };
    const handleEnd = () => {
        clearTimeout(longPressTimer);
    };
    
    const bubble = msgDiv.querySelector('.message-content');
    if (bubble) {
        bubble.addEventListener('touchstart', handleStart);
        bubble.addEventListener('touchend', handleEnd);
        bubble.addEventListener('touchmove', handleEnd);
        bubble.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            handleMessageLongPress(e, text, isUser, type, msgId);
        });
    }

    container.appendChild(msgDiv);
    hydrateDeferredChatMedia(msgDiv);
}

function hydrateDeferredChatMedia(messageNode) {
    if (!messageNode || typeof window.resolveChatMediaSrc !== 'function') return;

    messageNode.querySelectorAll('img[data-chat-media-ref]').forEach(img => {
        if (img.dataset.chatMediaHydrated === '1') return;
        img.dataset.chatMediaHydrated = '1';

        const encodedRef = img.getAttribute('data-chat-media-ref');
        if (!encodedRef) return;

        const mediaRef = decodeURIComponent(encodedRef);
        window.resolveChatMediaSrc(mediaRef).then((resolvedSrc) => {
            if (!resolvedSrc) return;
            img.src = resolvedSrc;
        }).catch((error) => {
            console.warn('聊天图片加载失败', error);
        });
    });
}

function enterMultiSelectMode(preselectMsgId) {
    window.iphoneSimState.isMultiSelectMode = true;
    if (preselectMsgId) window.iphoneSimState.selectedMessages.add(preselectMsgId);
    const cancelBtn = document.getElementById('multi-select-cancel');
    const deleteBtn = document.getElementById('multi-select-delete');
    const countEl = document.getElementById('multi-select-count');
    if (cancelBtn) cancelBtn.classList.remove('hidden');
    if (deleteBtn) deleteBtn.classList.remove('hidden');
    if (countEl) countEl.textContent = window.iphoneSimState.selectedMessages.size;
    if (cancelBtn) {
        cancelBtn.onclick = (e) => { e.stopPropagation(); exitMultiSelectMode(); };
    }
    if (deleteBtn) {
        deleteBtn.onclick = (e) => { e.stopPropagation(); deleteSelectedMessages(); };
    }
    updateMultiSelectUI();
    applyChatMultiSelectClass();
}

function exitMultiSelectMode() {
    window.iphoneSimState.isMultiSelectMode = false;
    window.iphoneSimState.selectedMessages.clear();
    const cancelBtn = document.getElementById('multi-select-cancel');
    const deleteBtn = document.getElementById('multi-select-delete');
    const countEl = document.getElementById('multi-select-count');
    if (cancelBtn) cancelBtn.classList.add('hidden');
    if (deleteBtn) deleteBtn.classList.add('hidden');
    if (countEl) countEl.textContent = '0';
    updateMultiSelectUI();
}

function applyChatMultiSelectClass() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    if (window.iphoneSimState.isMultiSelectMode) container.classList.add('multi-select-mode');
    else container.classList.remove('multi-select-mode');
}

function toggleMessageSelection(msgId) {
    if (!window.iphoneSimState.isMultiSelectMode) return;
    if (!msgId) return;
    if (window.iphoneSimState.selectedMessages.has(msgId)) window.iphoneSimState.selectedMessages.delete(msgId);
    else window.iphoneSimState.selectedMessages.add(msgId);
    const countEl = document.getElementById('multi-select-count');
    if (countEl) countEl.textContent = window.iphoneSimState.selectedMessages.size;
    updateMultiSelectUI();
}

function updateMultiSelectUI() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const items = container.querySelectorAll('.chat-message');
    items.forEach(item => {
        const checkbox = item.querySelector('.msg-select-checkbox');
        const id = item.dataset.msgId;
        
        if (window.iphoneSimState.isMultiSelectMode) {
            if (checkbox) checkbox.classList.remove('hidden');
            
            // Attach click handler to the message item container
            item.onclick = (e) => {
                // Avoid double toggling if clicking the checkbox directly
                if (e.target !== checkbox) {
                    e.stopPropagation();
                    if (id) toggleMessageSelection(id);
                }
            };
            
            // Clear bubble handler if any
            const bubble = item.querySelector('.message-content');
            if (bubble) bubble.onclick = null;
            
        } else {
            if (checkbox) {
                checkbox.classList.add('hidden');
                checkbox.checked = false;
            }
            
            // Remove item handler
            item.onclick = null;
            
            const bubble = item.querySelector('.message-content');
            if (bubble) {
                bubble.style.cursor = '';
                bubble.onclick = null;
            }
        }

        if (checkbox) {
            checkbox.checked = window.iphoneSimState.selectedMessages.has(id);
            if (window.iphoneSimState.selectedMessages.has(id)) item.classList.add('selected-msg');
            else item.classList.remove('selected-msg');
        }
    });
    const deleteBtn = document.getElementById('multi-select-delete');
    const countEl = document.getElementById('multi-select-count');
    if (deleteBtn && countEl) {
        deleteBtn.disabled = window.iphoneSimState.selectedMessages.size === 0;
    }
    applyChatMultiSelectClass();
}

async function deleteSelectedMessages() {
    if (!window.iphoneSimState.isMultiSelectMode) return;
    if (window.iphoneSimState.selectedMessages.size === 0) {
        alert('未选择任何消息');
        return;
    }
    if (!confirm(`确定删除选中的 ${window.iphoneSimState.selectedMessages.size} 条消息吗？此操作不可恢复。`)) return;
    const ids = Array.from(window.iphoneSimState.selectedMessages);
    if (!window.iphoneSimState.currentChatContactId) return;
    const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] || [];
    const remoteMessageIds = history
        .filter(m => ids.includes(String(m && m.id)) || ids.includes(m && m.id))
        .filter(m => m && (m.pushedByBackend || m.source === 'offline-backend' || m.remoteId))
        .map(m => String(m.remoteId || m.id || '').trim())
        .filter(Boolean);
    window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] = history.filter(m => !ids.includes(String(m.id)) && !ids.includes(m.id));
    saveConfig();
    if (remoteMessageIds.length > 0 && window.offlinePushSync && typeof window.offlinePushSync.deleteMessages === 'function') {
        try {
            await window.offlinePushSync.deleteMessages(remoteMessageIds);
        } catch (err) {
            console.error('[offline-push-sync] delete remote messages failed', err);
        }
    }
    exitMultiSelectMode();
    renderChatHistory(window.iphoneSimState.currentChatContactId);
}

function handleMessageLongPress(e, content, isUser, type, msgId) {
    if (e.type === 'contextmenu') {
        e.preventDefault();
    }
    
    let target = e.target;
    while (target && !target.classList.contains('message-content')) {
        target = target.parentElement;
        if (!target || target === document.body) break; 
    }
    
    if (!target) {
        if (e.type === 'touchstart' && e.touches && e.touches[0]) {
            const touch = e.touches[0];
            const el = document.elementFromPoint(touch.clientX, touch.clientY);
            if (el) {
                target = el.closest('.message-content');
            }
        }
    }

    if (!target) return;

    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    let name = 'AI';
    if (isUser) {
        if (contact && contact.userPersonaId) {
            const p = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
            name = p ? p.name : window.iphoneSimState.userProfile.name;
        } else {
            name = window.iphoneSimState.userProfile.name;
        }
    } else {
        name = contact ? (contact.remark || contact.name) : 'AI';
    }

    showContextMenu(target, { content, name, isUser, type, msgId });
}

function showContextMenu(targetEl, msgData) {
    const oldMenu = document.querySelector('.context-menu');
    if (oldMenu) oldMenu.remove();

    const currentContactId = window.iphoneSimState.currentChatContactId;
    const currentHistory = currentContactId && window.iphoneSimState.chatHistory
        ? window.iphoneSimState.chatHistory[currentContactId]
        : null;
    const fullMsg = Array.isArray(currentHistory) && msgData.msgId
        ? currentHistory.find(m => m && m.id === msgData.msgId)
        : null;
    if (fullMsg) {
        msgData.timestamp = fullMsg.time || msgData.timestamp || null;
        msgData.role = fullMsg.role || msgData.role || null;
    }
    const canSaveAiImageToAlbum = !!(
        !msgData.isUser &&
        fullMsg &&
        fullMsg.role === 'assistant' &&
        msgData.type === 'image' &&
        typeof fullMsg.content === 'string' &&
        fullMsg.content.trim() &&
        fullMsg.novelaiPrompt
    );

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <div class="context-menu-item" id="menu-quote">引用</div>
        <div class="context-menu-item" id="menu-copy">复制</div>
        ${(msgData.type === 'image' || msgData.type === 'sticker' || msgData.type === 'virtual_image') ? '<div class="context-menu-item" id="menu-set-avatar">设为头像</div>' : ''}
        ${canSaveAiImageToAlbum ? '<div class="context-menu-item" id="menu-save-to-album">保存到相册</div>' : ''}
        <div class="context-menu-item" id="menu-edit">编辑</div>
        <div class="context-menu-item" id="menu-delete" style="color: #ff3b30;">删除</div>
    `;
    
    menu.style.visibility = 'hidden';
    document.body.appendChild(menu);
    
    const menuRect = menu.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const gap = 10;
    const edgePadding = 8;
    
    let left, top;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const viewportLeft = scrollX + edgePadding;
    const viewportRight = scrollX + window.innerWidth - edgePadding;
    const viewportTop = scrollY + edgePadding;
    const viewportBottom = scrollY + window.innerHeight - edgePadding;

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

    top = targetRect.top + ((targetRect.height - menuRect.height) / 2) + scrollY;

    if (left < viewportLeft) left = viewportLeft;
    if (left + menuRect.width > viewportRight) left = viewportRight - menuRect.width;
    if (top < viewportTop) top = viewportTop;
    if (top + menuRect.height > viewportBottom) top = viewportBottom - menuRect.height;

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.style.visibility = 'visible';
    
    menu.querySelector('#menu-quote').onclick = () => {
        handleQuote(msgData);
        menu.remove();
    };
    
    menu.querySelector('#menu-copy').onclick = () => {
        if (msgData.type === 'text') {
            navigator.clipboard.writeText(msgData.content).then(() => {
            });
        }
        menu.remove();
    };
    const setAvatarBtn = menu.querySelector('#menu-set-avatar');
    if (setAvatarBtn) {
        setAvatarBtn.onclick = async () => {
            menu.remove();
            if (!window.iphoneSimState.currentChatContactId) return;
            const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
            if (!contact) return;

            if (confirm(`确定要将这张图片设为 "${contact.remark || contact.name}" 的头像吗？`)) {
                let newAvatar = msgData.content;
                if (typeof window.isChatMediaReference === 'function' && window.isChatMediaReference(newAvatar)) {
                    newAvatar = await window.resolveChatMediaDataUrl(newAvatar) || await window.resolveChatMediaSrc(newAvatar) || newAvatar;
                }
                
                contact.avatar = newAvatar;
                saveConfig();
                
                // Refresh UI
                if (window.renderContactList) window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
                
                // Refresh chat history (to update avatars in message list)
                renderChatHistory(contact.id, true);
                
                // Update chat title avatar if exists (usually handled by renderChatHistory or openChat)
                // But we should refresh the header info if possible. 
                // Currently chat header doesn't show avatar, just name.
                // The contact list and message list avatars will be updated.
                
                // Send a system message indicating change?
                // sendMessage(`[系统消息]: 已将图片设为头像`, false, 'text');
                // Maybe just a toast?
                if (window.showChatToast) window.showChatToast('头像已更新');
                else alert('头像已更新');
            }
        };
    }

    const saveToAlbumBtn = menu.querySelector('#menu-save-to-album');
    if (saveToAlbumBtn) {
        saveToAlbumBtn.onclick = async () => {
            menu.remove();

            if (!fullMsg || !fullMsg.content) {
                alert('找不到可保存的图片');
                return;
            }

            if (typeof window.savePhotoToAlbumLibrary !== 'function') {
                alert('相册功能未加载');
                return;
            }

            try {
                const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
                const sourceLabel = contact ? `Saved from ${contact.remark || contact.name}` : 'Saved from Chat';
                let imageSource = fullMsg.content;
                if (typeof window.isChatMediaReference === 'function' && window.isChatMediaReference(imageSource)) {
                    imageSource = await window.resolveChatMediaSrc(imageSource) || await window.resolveChatMediaDataUrl(imageSource) || imageSource;
                }
                const result = await window.savePhotoToAlbumLibrary(imageSource, {
                    location: sourceLabel
                });

                if (typeof window.showChatToast === 'function') {
                    window.showChatToast(result && result.duplicate ? '这张图片已经在相册里了' : '已保存到相册');
                } else {
                    alert(result && result.duplicate ? '这张图片已经在相册里了' : '已保存到相册');
                }
            } catch (error) {
                console.error('Save AI image to album failed:', error);
                alert(`保存失败: ${error.message}`);
            }
        };
    }

    menu.querySelector('#menu-edit').onclick = () => {
        if (msgData.msgId) {
            menu.remove();

            // 检查是否有 NovelAI 提示词
            const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
            const fullMsg = history ? history.find(m => m.id === msgData.msgId) : null;
            
            if (fullMsg && fullMsg.novelaiPrompt) {
                // 如果有提示词，显示提示词编辑框
                // 这里简单使用 prompt 弹窗，也可以换成更复杂的模态框
                // 为了更好的体验，可以使用 textarea 的模态框，但目前 prompt 最简单有效
                const newPrompt = prompt("NovelAI 生成提示词 (Prompt):", fullMsg.novelaiPrompt);
                if (newPrompt !== null && newPrompt !== fullMsg.novelaiPrompt) {
                    fullMsg.novelaiPrompt = newPrompt;
                    saveConfig();
                    alert('提示词已更新 (仅更新记录，不会重新生成图片)');
                }
                return;
            }

            if (msgData.type !== 'text') {
                if(!confirm('这是一条非文本消息（如图片或转账），直接编辑内容可能会破坏显示格式。确定要编辑吗？')) {
                    return;
                }
            }
            if (typeof openEditChatMessageModal === 'function') {
                openEditChatMessageModal(msgData.msgId, msgData.content);
            } else {
                alert('编辑功能暂不可用');
            }
        } else {
            alert('无法编辑此消息（缺少ID）');
            menu.remove();
        }
    };

    menu.querySelector('#menu-delete').onclick = () => {
        if (msgData.msgId) {
            menu.remove();
            enterMultiSelectMode(msgData.msgId);
        } else {
            alert('无法删除此消息（缺少ID）');
            menu.remove();
        }
    };
    
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

function handleQuote(msgData) {
    window.iphoneSimState.replyingToMsg = msgData;
    const chatScreen = document.getElementById('chat-screen');
    const replyBar = document.getElementById('reply-bar');
    document.getElementById('reply-name').textContent = msgData.name;
    
    let previewText = msgData.content;
    if (msgData.type === 'image') previewText = '[图片]';
    else if (msgData.type === 'sticker') previewText = '[表情包]';
    else if (msgData.type === 'transfer') previewText = '[转账]';
    else if (msgData.type === 'family_card') previewText = '[亲属卡]';
    else if (msgData.type === 'pay_request') previewText = '[代付请求]';
    else if (msgData.type === 'music_listen_invite') previewText = '[一起听邀请]';
    
    document.getElementById('reply-text').textContent = previewText;
    replyBar.classList.remove('hidden');
    if (chatScreen) chatScreen.classList.add('replying');
    
    const chatInput = document.getElementById('chat-input');
    if (chatInput) chatInput.focus();
}

function cancelQuote() {
    window.iphoneSimState.replyingToMsg = null;
    const chatScreen = document.getElementById('chat-screen');
    document.getElementById('reply-bar').classList.add('hidden');
    if (chatScreen) chatScreen.classList.remove('replying');
}

function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
}

const HTML_BLOCK_MARKER_PAIRS = [
    { start: '[[HTML_START]]', end: '[[HTML_END]]' },
    { start: '[HTML_START]', end: '[HTML_END]' },
    { start: '<HTML_START>', end: '<HTML_END>' },
    { start: '{{HTML_START}}', end: '{{HTML_END}}' }
];

function escapeRegexToken(token) {
    return String(token || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isExplicitHtmlBlock(content) {
    if (typeof content !== 'string') return false;
    const source = content.toLowerCase();
    return HTML_BLOCK_MARKER_PAIRS.some(pair =>
        source.includes(pair.start.toLowerCase()) || source.includes(pair.end.toLowerCase())
    );
}

function stripHtmlBlockMarkers(content) {
    if (typeof content !== 'string' || !content) return '';
    let output = content;
    HTML_BLOCK_MARKER_PAIRS.forEach(pair => {
        const startRegex = new RegExp(escapeRegexToken(pair.start), 'ig');
        const endRegex = new RegExp(escapeRegexToken(pair.end), 'ig');
        output = output.replace(startRegex, '').replace(endRegex, '');
    });
    return output;
}

function isHtmlPayloadFallback(content) {
    if (typeof content !== 'string') return false;
    const source = content.toLowerCase();
    const htmlMarkers = [
        '<!doctype html',
        '<html',
        '<head',
        '<body',
        '<style',
        '</html>',
        '&lt;!doctype html',
        '&lt;html',
        '&lt;head',
        '&lt;body',
        '&lt;style',
        '&lt;/html&gt;'
    ];
    return htmlMarkers.some(marker => source.includes(marker));
}

function isHtmlPayloadForParser(content) {
    if (typeof content !== 'string') return false;
    if (isExplicitHtmlBlock(content)) return true;

    try {
        if (typeof isLikelyHtmlPayload === 'function' && isLikelyHtmlPayload(content)) {
            return true;
        }
    } catch (e) {}

    try {
        if (typeof window !== 'undefined' && typeof window.isLikelyHtmlPayload === 'function' && window.isLikelyHtmlPayload(content)) {
            return true;
        }
    } catch (e) {}

    return isHtmlPayloadFallback(content);
}

function isHtmlBoundaryStart(content) {
    if (typeof content !== 'string') return false;
    const source = content.toLowerCase();

    if (HTML_BLOCK_MARKER_PAIRS.some(pair => source.includes(pair.start.toLowerCase()))) return true;

    return [
        '<!doctype html',
        '<html',
        '<head',
        '<body',
        '<style',
        '&lt;!doctype html',
        '&lt;html',
        '&lt;head',
        '&lt;body',
        '&lt;style'
    ].some(marker => source.includes(marker));
}

function isHtmlBoundaryEnd(content) {
    if (typeof content !== 'string') return false;
    const source = content.toLowerCase();
    if (HTML_BLOCK_MARKER_PAIRS.some(pair => source.includes(pair.end.toLowerCase()))) return true;
    return source.includes('</html>') || source.includes('&lt;/html&gt;');
}

function isTextLikeMessageForHtmlMerge(msg) {
    return !!(msg && (msg.type === '消息' || msg.type === 'text') && typeof msg.content === 'string');
}

function mergeSplitHtmlMessages(messagesList) {
    if (!Array.isArray(messagesList) || messagesList.length === 0) return Array.isArray(messagesList) ? messagesList : [];

    const merged = [];
    let collecting = false;
    let htmlChunk = [];

    const flushChunk = () => {
        if (!htmlChunk.length) {
            collecting = false;
            return;
        }
        const combinedHtml = stripHtmlBlockMarkers(
            htmlChunk.map(item => String(item && item.content ? item.content : '')).join('\n')
        ).trim();
        if (combinedHtml) {
            const first = htmlChunk[0];
            merged.push({ ...first, type: '消息', content: combinedHtml });
        } else {
            merged.push(...htmlChunk);
        }
        htmlChunk = [];
        collecting = false;
    };

    for (const msg of messagesList) {
        if (!isTextLikeMessageForHtmlMerge(msg)) {
            if (collecting) flushChunk();
            merged.push(msg);
            continue;
        }

        const text = msg.content || '';
        const hasStart = isHtmlBoundaryStart(text);
        const hasEnd = isHtmlBoundaryEnd(text);

        if (!collecting) {
            if (hasStart && !hasEnd) {
                collecting = true;
                htmlChunk.push(msg);
                continue;
            }
            if (hasStart && hasEnd) {
                const singleHtml = stripHtmlBlockMarkers(text).trim();
                if (singleHtml) {
                    merged.push({ ...msg, type: '消息', content: singleHtml });
                } else {
                    merged.push(msg);
                }
                continue;
            }
            merged.push(msg);
            continue;
        }

        htmlChunk.push(msg);
        if (hasEnd) {
            flushChunk();
        }
    }

    if (collecting) flushChunk();

    return merged;
}

function splitLegacyTextContentIntoResults(text, results, options = {}) {
    if (!text) return;
    const speaker = normalizeAiMessageSpeaker(options && options.speaker);

    if (isHtmlPayloadForParser(text)) {
        const normalizedHtml = stripHtmlBlockMarkers(String(text || '')).trim();
        if (normalizedHtml) {
            results.push({ type: 'text_message', content: normalizedHtml, isHtml: true, ...(speaker ? { speaker } : {}) });
        }
        return;
    }

    const mixedItems = forceSplitMixedContent(text);
    mixedItems.forEach(mi => {
        const normalizedType = normalizeAiSchemaType(mi.type);
        if (normalizedType === 'text_message') {
            const rawSegments = String(mi.content || '').split(/([。！？!?]+|\n+)/);
            let buffer = '';
            for (const seg of rawSegments) {
                if (!seg) continue;
                if (/^[。！？!?]+$/.test(seg)) {
                    buffer += seg;
                    if (buffer.trim()) {
                        results.push({ type: 'text_message', content: buffer.trim(), ...(speaker ? { speaker } : {}) });
                    }
                    buffer = '';
                } else if (/^\n+$/.test(seg)) {
                    if (buffer.trim()) {
                        results.push({ type: 'text_message', content: buffer.trim(), ...(speaker ? { speaker } : {}) });
                    }
                    buffer = '';
                } else {
                    buffer += seg;
                }
            }
            if (buffer.trim()) {
                results.push({ type: 'text_message', content: buffer.trim(), ...(speaker ? { speaker } : {}) });
            }
        } else if (normalizedType === 'sticker_message') {
            results.push({ type: 'sticker_message', sticker: String(mi.content || '').trim() });
        } else if (normalizedType === 'voice') {
            results.push({ type: 'voice', content: mi.content });
        } else if (normalizedType === 'image') {
            results.push({ type: 'image', content: mi.content, prompt: mi.prompt });
        } else if (normalizedType === 'description') {
            results.push({ type: 'description', content: mi.content });
        } else {
            results.push({ ...mi, type: normalizedType || mi.type });
        }
    });
}

function parseMixedAiResponse(content) {
    const results = [];

    const pushSanitizedText = (rawText, options = {}) => {
        const atomic = !!options.atomic;
        const speaker = normalizeAiMessageSpeaker(options && options.speaker);
        const translatedText = normalizeBilingualTranslatedText(options && options.translatedText);
        const recoveredItems = recoverContextRecordItems(rawText);
        if (recoveredItems.length > 0) {
            let translatedTextAttached = false;
            recoveredItems.forEach(item => {
                const recoveredSpeaker = normalizeAiMessageSpeaker(item && item.speaker) || speaker;
                const nextItem = recoveredSpeaker ? { ...item, speaker: recoveredSpeaker } : item;
                const normalizedRecoveredType = normalizeAiSchemaType(nextItem && nextItem.type);
                if (!translatedTextAttached && translatedText && normalizedRecoveredType === 'text_message') {
                    nextItem.translatedContent = translatedText;
                    translatedTextAttached = true;
                }
                results.push(nextItem);
            });
            return;
        }
        const sanitized = extractVisibleControlData(rawText);

        sanitized.thoughtTexts.forEach(thoughtText => {
            if (thoughtText) {
                results.push({ type: 'thought_state', displayText: thoughtText });
            }
        });

        sanitized.stickerNames.forEach(stickerName => {
            if (stickerName) {
                results.push({ type: 'sticker_message', sticker: stickerName });
            }
        });

        if (sanitized.quoteHints.length > 0 && sanitized.cleanText) {
            const quote = sanitized.quoteHints[0];
            results.push({
                type: 'quote_reply',
                targetMsgId: quote.targetMsgId || '',
                targetTimestamp: quote.targetTimestamp || null,
                targetName: quote.targetName || '',
                targetContent: quote.targetContent || '',
                replyContent: sanitized.cleanText,
                ...(translatedText ? { translatedReplyContent: translatedText } : {}),
                ...(speaker ? { speaker } : {})
            });
            return;
        }

        if (!sanitized.cleanText) return;

        if (atomic) {
            results.push({
                type: 'text_message',
                content: sanitized.cleanText,
                ...(translatedText ? { translatedContent: translatedText } : {}),
                ...(speaker ? { speaker } : {})
            });
            return;
        }

        splitLegacyTextContentIntoResults(sanitized.cleanText, results, { speaker });
    };

    const processItem = (item) => {
        if (item === null || item === undefined) return;
        if (typeof item === 'string') {
            pushSanitizedText(item, { atomic: false });
            return;
        }
        if (Array.isArray(item)) {
            item.forEach(processItem);
            return;
        }
        if (typeof item !== 'object') {
            pushSanitizedText(String(item), { atomic: false });
            return;
        }

        const originalType = String(item.type || '').trim().toLowerCase();
        const normalizedType = normalizeAiSchemaType(item.type);
        const speaker = normalizeAiMessageSpeaker(item && item.speaker);

        if (normalizedType === 'thought_state') {
            const displayText = getThoughtStateDisplayText(item);
            if (displayText) {
                results.push({
                    type: 'thought_state',
                    displayText,
                    emotion: typeof item.emotion === 'string' ? item.emotion.trim() : '',
                    intent: typeof item.intent === 'string' ? item.intent.trim() : ''
                });
            }
            return;
        }

        if (normalizedType === 'quote_reply') {
            const replyContent = String(item.reply_content || item.replyContent || item.content || '').trim();
            const translatedReplyContent = normalizeBilingualTranslatedText(item.translated_reply_content || item.translatedReplyContent || '');
            if (replyContent) {
                results.push({
                    type: 'quote_reply',
                    targetMsgId: String(item.target_msg_id || item.targetMsgId || '').trim(),
                    targetTimestamp: item.target_timestamp !== undefined && item.target_timestamp !== null && item.target_timestamp !== ''
                        ? Number(item.target_timestamp || item.targetTimestamp)
                        : null,
                    targetName: String(item.target_name || item.targetName || '').trim(),
                    targetContent: String(item.target_content || item.targetContent || '').trim(),
                    replyContent,
                    ...(translatedReplyContent ? { translatedReplyContent } : {}),
                    ...(speaker ? { speaker } : {})
                });
            }
            return;
        }

        if (normalizedType === 'text_message') {
            pushSanitizedText(item.content || item.text || '', {
                atomic: originalType === 'text_message',
                speaker,
                translatedText: item.translated_content || item.translatedContent || ''
            });
            return;
        }

        if (normalizedType === 'sticker_message') {
            const stickerName = String(item.sticker || item.content || '').trim();
            if (stickerName) {
                results.push({ type: 'sticker_message', sticker: stickerName });
            }
            return;
        }

        if (normalizedType === 'voice') {
            results.push({ type: 'voice', content: `${item.duration || 3} ${item.content || item.text || '语音消息'}` });
            return;
        }

        if (normalizedType === 'action') {
            results.push({ type: 'action', content: item });
            return;
        }

        if (normalizedType === 'image') {
            results.push({ ...item, type: item.type || 'image', content: item.content || item.description || '' });
            return;
        }

        if (normalizedType === 'description') {
            results.push({ type: 'description', content: item.content || item.text || '' });
            return;
        }

        pushSanitizedText(item.content || item.text || '', { atomic: false, speaker });
    };

    const tryParseCandidate = (candidate) => {
        if (!candidate) return false;
        const candidates = [stripMarkdownCodeFences(candidate), repairPotentialJsonString(candidate)];
        for (const current of candidates) {
            if (!current) continue;
            try {
                const parsed = JSON.parse(current);
                if (Array.isArray(parsed)) parsed.forEach(processItem);
                else processItem(parsed);
                return results.length > 0;
            } catch (e) {}
        }
        return false;
    };

    const cleanContent = String(content || '').trim();
    if (!cleanContent) return results;

    if (tryParseCandidate(cleanContent)) {
        return results;
    }

    const jsonBlocks = extractJsonBlocksFromText(cleanContent);
    for (const block of jsonBlocks) {
        if (tryParseCandidate(block)) {
            return results;
        }
    }

    pushSanitizedText(cleanContent, { atomic: false });
    return results;
}

function extractTextFromAiResponsePart(part) {
    if (part === null || part === undefined) return '';
    if (typeof part === 'string') return part;

    if (Array.isArray(part)) {
        return part.map(item => extractTextFromAiResponsePart(item)).filter(Boolean).join('\n');
    }

    if (typeof part !== 'object') return '';

    if (typeof part.text === 'string') return part.text;
    if (part.text && typeof part.text.value === 'string') return part.text.value;
    if (typeof part.value === 'string') return part.value;
    if (typeof part.content === 'string') return part.content;
    if (typeof part.output_text === 'string') return part.output_text;

    if (Array.isArray(part.content)) {
        return part.content.map(item => extractTextFromAiResponsePart(item)).filter(Boolean).join('\n');
    }

    return '';
}

function extractReplyContentFromAiResponse(data) {
    const choice = data && Array.isArray(data.choices) ? data.choices[0] : null;
    const message = choice && choice.message ? choice.message : null;

    const candidates = [
        { source: 'choices[0].message.content', value: message ? message.content : null },
        { source: 'choices[0].text', value: choice ? choice.text : null },
        { source: 'choices[0].delta.content', value: choice && choice.delta ? choice.delta.content : null },
        { source: 'output_text', value: data ? data.output_text : null },
        { source: 'output[0].content', value: data && Array.isArray(data.output) && data.output[0] ? data.output[0].content : null }
    ];

    for (const candidate of candidates) {
        const text = extractTextFromAiResponsePart(candidate.value).trim();
        if (text) {
            return {
                content: text,
                source: candidate.source
            };
        }
    }

    return {
        content: '',
        source: null
    };
}

function normalizeAiRequestImageUrl(url) {
    const rawUrl = String(url || '').trim();
    if (!rawUrl) return '';
    if (rawUrl.startsWith('data:image')) return rawUrl;
    if (rawUrl.startsWith('//')) return `https:${rawUrl}`;

    try {
        return new URL(rawUrl, window.location.href).href;
    } catch (error) {
        return rawUrl;
    }
}

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function convertAiRequestImageUrlToDataUrl(url) {
    const normalizedUrl = normalizeAiRequestImageUrl(url);
    if (!normalizedUrl || normalizedUrl.startsWith('data:image')) return normalizedUrl;

    if (!window.__aiRequestImageCache) {
        window.__aiRequestImageCache = new Map();
    }

    const cache = window.__aiRequestImageCache;
    if (cache.has(normalizedUrl)) {
        return cache.get(normalizedUrl);
    }

    const pendingTask = (async () => {
        if (typeof window.isChatMediaReference === 'function' && window.isChatMediaReference(normalizedUrl)) {
            if (typeof window.resolveChatMediaDataUrl === 'function') {
                const dataUrl = await window.resolveChatMediaDataUrl(normalizedUrl);
                if (dataUrl) {
                    return dataUrl;
                }
            }
            throw new Error('chat media reference could not be resolved');
        }

        const response = await fetch(normalizedUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        let dataUrl = await blobToDataUrl(blob);

        if (typeof compressBase64 === 'function' && typeof dataUrl === 'string' && dataUrl.startsWith('data:image')) {
            try {
                dataUrl = await compressBase64(dataUrl, 768, 0.72);
            } catch (compressionError) {
                console.warn('[AI Debug] image compression skipped for request part', compressionError);
            }
        }

        return dataUrl;
    })();

    cache.set(normalizedUrl, pendingTask);

    try {
        const result = await pendingTask;
        cache.set(normalizedUrl, Promise.resolve(result));
        return result;
    } catch (error) {
        cache.delete(normalizedUrl);
        throw error;
    }
}

async function normalizeAiRequestMessageImages(messages) {
    if (!Array.isArray(messages)) return;

    let totalImageCount = 0;
    let convertedCount = 0;
    let failedCount = 0;

    for (const message of messages) {
        if (!message || !Array.isArray(message.content)) continue;

        for (const part of message.content) {
            if (!part || part.type !== 'image_url' || !part.image_url) continue;

            totalImageCount += 1;
            const originalUrl = part.image_url.url;
            const normalizedUrl = normalizeAiRequestImageUrl(originalUrl);
            if (normalizedUrl && normalizedUrl !== originalUrl) {
                part.image_url.url = normalizedUrl;
            }

            if (!normalizedUrl || normalizedUrl.startsWith('data:image')) continue;

            try {
                part.image_url.url = await convertAiRequestImageUrlToDataUrl(normalizedUrl);
                convertedCount += 1;
            } catch (error) {
                failedCount += 1;
                console.warn('[AI Debug] failed to convert request image to data URL', {
                    url: normalizedUrl,
                    error: error && error.message ? error.message : String(error)
                });
            }
        }
    }

    if (totalImageCount > 0) {
        console.log('[AI Debug] normalized request images', {
            totalImageCount,
            convertedCount,
            failedCount
        });
    }
}

// Helper to force split text containing stickers/images
function forceSplitMixedContent(content) {
    if (typeof content !== 'string') {
        if (content === undefined || content === null) return [];
        return [{ type: '消息', content: String(content) }];
    }

    if (isHtmlPayloadForParser(content)) {
        const normalizedHtml = stripHtmlBlockMarkers(content).trim();
        return normalizedHtml ? [{ type: '消息', content: normalizedHtml }] : [];
    }

    const results = [];
    // 预处理：统一符号
    let processed = content.replace(/【/g, '[').replace(/】/g, ']').replace(/：/g, ':');
    
    // 正则匹配 [类型:内容] 或 [类型] (无冒号兼容)
    // 改进正则：允许内容中包含换行符，且支持 "发送了表情包" 这种 AI 常见错误格式
    const regex = /\[(消息|表情包|发送了表情包|发送了一个表情包|语音|图片|旁白)(?:\s*[:：]\s*([\s\S]*?))?\]/g;
    
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(processed)) !== null) {
        // 1. 捕获当前匹配项之前的文本
        const preText = processed.substring(lastIndex, match.index); // 不trim以保留格式
        if (preText) { 
             const parts = preText.split('\n');
             parts.forEach(p => {
                 if (p.trim()) {
                     results.push({ type: '消息', content: p.trim() });
                 }
             });
        }

        // 2. 添加当前匹配项
        let type = match[1];
        if (type.includes('表情包')) type = '表情包';
        else if (type === '图片') type = '图片';
        else if (type === '语音') type = '语音';
        else if (type === '旁白') type = '旁白';
        else type = '消息';

        let content = match[2] ? match[2].trim() : '';
        if (type === '表情包' && !content) content = '未知表情'; // 默认值

        results.push({
            type: type, 
            content: content
        });

        lastIndex = regex.lastIndex;
    }

    // 3. 捕获剩余的文本
    const postText = processed.substring(lastIndex);
    if (postText && postText.trim()) {
        const parts = postText.split('\n');
        parts.forEach(p => {
            if (p.trim()) {
                results.push({ type: '消息', content: p.trim() });
            }
        });
    }

    return results.length > 0 ? results : [{ type: '消息', content: content }];
}

// Fallback legacy parser (kept for compatibility)
function parseMixedContent(content) {
    return forceSplitMixedContent(content);
}

function normalizeQuoteText(text) {
    if (!text) return '';
    return String(text)
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[，。！？、,.!?:;"'“”‘’（）()【】\[\]{}<>《》\-—_]/g, '');
}

function escapeContextAttrText(text) {
    return String(text || '')
        .replace(/[\r\n]+/g, ' ')
        .replace(/"/g, "'")
        .trim();
}

function buildContextRecordPrefix(msg, extraAttrs = null) {
    if (!msg) return '';
    const attrs = [
        `msg_id="${escapeContextAttrText(msg.id || '')}"`,
        `timestamp="${escapeContextAttrText(Number.isFinite(Number(msg.time)) ? Number(msg.time) : '')}"`,
        `role="${escapeContextAttrText(msg.role || 'assistant')}"`,
        `type="${escapeContextAttrText(msg.type || 'text')}"`
    ];
    if (extraAttrs && typeof extraAttrs === 'object') {
        Object.entries(extraAttrs).forEach(([key, value]) => {
            if (!key) return;
            if (value === undefined || value === null || value === '') return;
            attrs.push(`${key}="${escapeContextAttrText(value)}"`);
        });
    }
    return `[context_record ${attrs.join(' ')}]`;
}

function getAllUserImageMessages(history) {
    if (!Array.isArray(history) || history.length === 0) return [];
    return history.filter(msg => msg && msg.role === 'user' && msg.type === 'image' && msg.content);
}

function getLatestUserImageTurnCandidates(history) {
    if (!Array.isArray(history) || history.length === 0) return [];
    let startIndex = 0;
    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (!msg) continue;
        if (msg.role === 'assistant') {
            startIndex = i + 1;
            break;
        }
    }
    return history.slice(startIndex).filter(msg => msg && msg.role === 'user' && msg.type === 'image' && msg.content);
}

function buildLatestUserImageSelectionMetaMap(history) {
    const candidates = getLatestUserImageTurnCandidates(history);
    const metaMap = new Map();
    const total = candidates.length;
    candidates.forEach((msg, index) => {
        if (!msg || !msg.id) return;
        metaMap.set(String(msg.id), {
            index: index + 1,
            total,
            msg
        });
    });
    return metaMap;
}

function resolveAvatarUpdateTargetImage(history, payloadRaw = '') {
    const allUserImages = getAllUserImageMessages(history);
    if (allUserImages.length === 0) return null;

    const latestTurnCandidates = getLatestUserImageTurnCandidates(history);
    const rawPayload = String(payloadRaw || '').trim();
    const normalizedPayload = rawPayload.replace(/^["'`\s]+|["'`\s]+$/g, '').trim();

    const findByExactId = (targetId) => {
        const safeTargetId = String(targetId || '').trim();
        if (!safeTargetId) return null;
        return allUserImages.find(msg => String(msg.id || '') === safeTargetId) || null;
    };

    const findByUniqueIdPrefix = (targetId) => {
        const safeTargetId = String(targetId || '').trim();
        if (!safeTargetId) return null;
        const matched = allUserImages.filter(msg => String(msg.id || '').startsWith(safeTargetId));
        return matched.length === 1 ? matched[0] : null;
    };

    const findByLatestTurnIndex = (targetIndex) => {
        const imageIndex = Number.parseInt(targetIndex, 10);
        if (!Number.isFinite(imageIndex) || imageIndex < 1) return null;
        return latestTurnCandidates[imageIndex - 1] || null;
    };

    const findByReverseImageOffset = (offset = 0) => {
        const safeOffset = Number.parseInt(offset, 10);
        if (!Number.isFinite(safeOffset) || safeOffset < 0) return null;
        const target = allUserImages[allUserImages.length - 1 - safeOffset];
        return target || null;
    };

    const tryResolveCandidate = (candidate) => {
        const text = String(candidate || '').trim();
        if (!text) return null;

        const exactIdMatch = findByExactId(text);
        if (exactIdMatch) return exactIdMatch;

        const uniquePrefixMatch = findByUniqueIdPrefix(text);
        if (uniquePrefixMatch) return uniquePrefixMatch;

        let match = text.match(/^(?:avatar_pick_index|image_index|index)\s*[:=]\s*(\d+)$/i);
        if (match) {
            return findByLatestTurnIndex(match[1]);
        }

        match = text.match(/^(?:msg_id|message_id|id)\s*[:=]\s*(.+)$/i);
        if (match) {
            return findByExactId(match[1]) || findByUniqueIdPrefix(match[1]);
        }

        match = text.match(/^(?:latest|last)(?:\s*[-:]\s*(\d+))?$/i);
        if (match) {
            return findByReverseImageOffset(match[1] || 0);
        }

        if (/^\d+$/.test(text)) {
            return findByLatestTurnIndex(text);
        }

        return null;
    };

    if (normalizedPayload) {
        if ((normalizedPayload.startsWith('{') && normalizedPayload.endsWith('}'))
            || (normalizedPayload.startsWith('[') && normalizedPayload.endsWith(']'))) {
            try {
                const parsedPayload = JSON.parse(normalizedPayload);
                if (parsedPayload && typeof parsedPayload === 'object' && !Array.isArray(parsedPayload)) {
                    const imageIndex = parsedPayload.avatar_pick_index ?? parsedPayload.image_index ?? parsedPayload.index;
                    const msgId = parsedPayload.msg_id ?? parsedPayload.message_id ?? parsedPayload.id;
                    const byIndex = imageIndex !== undefined && imageIndex !== null
                        ? findByLatestTurnIndex(imageIndex)
                        : null;
                    if (byIndex) return byIndex;
                    const byId = msgId ? (findByExactId(msgId) || findByUniqueIdPrefix(msgId)) : null;
                    if (byId) return byId;
                }
            } catch (error) {
                console.warn('Failed to parse UPDATE_AVATAR payload as JSON.', error);
            }
        }

        if (normalizedPayload.startsWith('[context_record')) {
            const attrs = parseBracketAttributes(normalizedPayload);
            const byIndex = attrs.avatar_pick_index ? findByLatestTurnIndex(attrs.avatar_pick_index) : null;
            if (byIndex) return byIndex;
            const byId = attrs.msg_id ? (findByExactId(attrs.msg_id) || findByUniqueIdPrefix(attrs.msg_id)) : null;
            if (byId) return byId;
        }

        const directMatch = tryResolveCandidate(normalizedPayload);
        if (directMatch) return directMatch;
    }

    return allUserImages[allUserImages.length - 1] || null;
}

function buildQuoteContextPrefix(replyTo) {
    if (!replyTo || !replyTo.content) return '';
    const attrs = [];
    if (replyTo.targetMsgId) attrs.push(`target_msg_id="${escapeContextAttrText(replyTo.targetMsgId)}"`);
    if (replyTo.targetTimestamp) attrs.push(`target_timestamp="${Number(replyTo.targetTimestamp)}"`);
    if (replyTo.name) attrs.push(`target_name="${escapeContextAttrText(replyTo.name)}"`);
    attrs.push(`target_content="${escapeContextAttrText(replyTo.content)}"`);
    return `[reply_context ${attrs.join(' ')}]`;
}

function joinContextTextParts(...parts) {
    return parts
        .map(part => typeof part === 'string' ? part.trim() : '')
        .filter(Boolean)
        .join('\n')
        .trim();
}

function parseBracketAttributes(text) {
    const attrs = {};
    String(text || '').replace(/([a-zA-Z_][a-zA-Z0-9_]*)="([^"]*)"/g, (_, key, value) => {
        attrs[key] = value;
        return _;
    });
    return attrs;
}

function normalizeAiSchemaType(rawType) {
    const type = String(rawType || '').trim().toLowerCase();
    if (!type) return 'text_message';
    if (type === 'thought' || type === 'thought_state' || type === 'thought-chain' || type === 'thought_chain') return 'thought_state';
    if (type === 'text' || type === '消息' || type === 'message' || type === 'text_message') return 'text_message';
    if (type === 'sticker' || type === '表情包' || type === 'sticker_message') return 'sticker_message';
    if (type === 'quote_reply') return 'quote_reply';
    if (type === 'voice' || type === '语音' || type === 'voice_message') return 'voice';
    if (type === 'image' || type === '图片' || type === 'ai_image' || type === 'virtual_image') return 'image';
    if (type === '旁白' || type === 'description') return 'description';
    if (type === 'action') return 'action';
    return type;
}

function normalizeAiMessageSpeaker(rawSpeaker) {
    const value = String(rawSpeaker || '').trim().toLowerCase();
    if (!value) return '';
    if (
        value === 'fire-buddy'
        || value === 'fire_buddy'
        || value === 'firebuddy'
        || value === 'buddy'
        || value === 'firebuddyspeaker'
        || value === '小火人'
    ) {
        return 'fire-buddy';
    }
    return '';
}

function getThoughtStateDisplayText(item) {
    if (!item || typeof item !== 'object') return '';
    const directCandidates = [
        item.display_text,
        item.displayText,
        item.visible_text,
        item.visibleText,
        item.visible_subtext,
        item.visibleSubtext,
        item.content,
        item.text
    ];
    for (const candidate of directCandidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim();
        }
    }
    if (item.character_thoughts && typeof item.character_thoughts === 'object') {
        const nestedCandidates = [
            item.character_thoughts.display_text,
            item.character_thoughts.displayText,
            item.character_thoughts.visible_subtext,
            item.character_thoughts.visibleSubtext,
            item.character_thoughts.content
        ];
        for (const candidate of nestedCandidates) {
            if (typeof candidate === 'string' && candidate.trim()) {
                return candidate.trim();
            }
        }
    }
    return '';
}

function stripMarkdownCodeFences(text) {
    const source = String(text || '').trim();
    const fencedMatch = source.match(/```(?:json|javascript|js)?\s*([\s\S]*?)\s*```/i);
    return fencedMatch ? fencedMatch[1].trim() : source;
}

function repairPotentialJsonString(raw) {
    let repaired = stripMarkdownCodeFences(raw)
        .replace(/^\uFEFF/, '')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, '"')
        .replace(/"([^"]+)"\s*：/g, '"$1":')
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*[：:])/g, '$1"$2":')
        .replace(/([{,]\s*)'([^']+)'(\s*:)/g, '$1"$2"$3')
        .replace(/:\s*'([^']*?)'/g, (_, value) => `: ${JSON.stringify(value)}`)
        .replace(/,\s*([}\]])/g, '$1')
        .trim();
    return repaired;
}

function extractJsonBlocksFromText(text) {
    const source = String(text || '');
    const found = [];
    const stack = [];
    let inString = false;
    let escape = false;
    let blockStart = -1;

    for (let i = 0; i < source.length; i++) {
        const char = source[i];
        if (inString) {
            if (char === '\\' && !escape) {
                escape = true;
            } else if (char === '"' && !escape) {
                inString = false;
            } else {
                escape = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
            escape = false;
            continue;
        }

        if (char === '{' || char === '[') {
            if (stack.length === 0) blockStart = i;
            stack.push(char);
            continue;
        }

        if (char === '}' || char === ']') {
            if (!stack.length) continue;
            const expected = char === '}' ? '{' : '[';
            if (stack[stack.length - 1] !== expected) {
                stack.length = 0;
                blockStart = -1;
                continue;
            }
            stack.pop();
            if (stack.length === 0 && blockStart >= 0) {
                found.push(source.slice(blockStart, i + 1));
                blockStart = -1;
            }
        }
    }

    return found;
}

function extractVisibleControlData(rawText) {
    let working = String(rawText || '').replace(/\r/g, '');
    const thoughtTexts = [];
    const quoteHints = [];
    const stickerNames = [];

    working = working.replace(/(?:\[|【|\(|（)\s*(?:内心独白|心声)\s*[:：]\s*([\s\S]*?)(?:\]|】|\)|）)/gi, (_, text) => {
        const clean = String(text || '').trim();
        if (clean) thoughtTexts.push(clean);
        return ' ';
    });

    working = working.replace(/(?:^|\n)\s*[【\[]?\s*引用回复\s*[：:]\s*正在回复\s*(.*?)\s*的消息\s*[「“"]([\s\S]*?)[」”"]\s*[】\]]?\s*(?=\n|$)/gim, (_, name, targetContent) => {
        const cleanTarget = String(targetContent || '').trim();
        quoteHints.push({
            targetName: String(name || '').trim(),
            targetContent: cleanTarget
        });
        return '\n';
    });

    working = working.replace(/\[reply_context\s+([^\]]+)\]/gi, (_, attrText) => {
        const attrs = parseBracketAttributes(attrText);
        quoteHints.push({
            targetMsgId: attrs.target_msg_id || '',
            targetTimestamp: attrs.target_timestamp ? Number(attrs.target_timestamp) : null,
            targetName: attrs.target_name || '',
            targetContent: attrs.target_content || ''
        });
        return ' ';
    });

    working = working.replace(/\[context_record\s+[^\]]+\]/gi, ' ');

    const cleanedLines = [];
    for (const line of working.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) {
            if (cleanedLines.length && cleanedLines[cleanedLines.length - 1] !== '') cleanedLines.push('');
            continue;
        }

        let stickerMatch = trimmed.match(/^[【\[]?\s*(?:发送了一个?|发了一个?)?(?:表情包|贴纸)\s*[:：]?\s*(.+?)\s*[】\]]?$/i);
        if (!stickerMatch) {
            stickerMatch = trimmed.match(/^[【\[]\s*表情包\s*[:：]?\s*(.+?)\s*[】\]]$/i);
        }
        if (stickerMatch) {
            const stickerName = String(stickerMatch[1] || '').trim().replace(/^["'「」]+|["'「」]+$/g, '');
            if (stickerName) stickerNames.push(stickerName);
            continue;
        }

        cleanedLines.push(line);
    }

    return {
        cleanText: cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
        thoughtTexts,
        quoteHints,
        stickerNames
    };
}

function extractContextRecordSegments(rawText) {
    const source = String(rawText || '').replace(/\r/g, '');
    const regex = /\[context_record\s+([^\]]+)\]/gi;
    const markers = [];
    let match;

    while ((match = regex.exec(source)) !== null) {
        markers.push({
            start: match.index,
            end: regex.lastIndex,
            attrs: parseBracketAttributes(match[1])
        });
    }

    if (markers.length === 0) return [];

    return markers.map((marker, index) => {
        const nextStart = index + 1 < markers.length ? markers[index + 1].start : source.length;
        const rawSegment = source.slice(marker.end, nextStart)
            .replace(/^\s*[\]\"'`’”）】>]+/, '')
            .trim();

        return {
            msgId: marker.attrs.msg_id || '',
            timestamp: marker.attrs.timestamp ? Number(marker.attrs.timestamp) : null,
            role: marker.attrs.role || '',
            type: marker.attrs.type || 'text',
            content: rawSegment
        };
    });
}

function recoverContextRecordItems(rawText) {
    const segments = extractContextRecordSegments(rawText);
    if (segments.length === 0) return [];

    const items = [];
    segments.forEach(segment => {
        const normalizedType = normalizeAiSchemaType(segment.type);
        const sanitized = extractVisibleControlData(segment.content);

        sanitized.thoughtTexts.forEach(thoughtText => {
            if (thoughtText) {
                items.push({ type: 'thought_state', displayText: thoughtText });
            }
        });

        sanitized.stickerNames.forEach(stickerName => {
            if (stickerName) {
                items.push({ type: 'sticker_message', sticker: stickerName });
            }
        });

        const cleanText = String(sanitized.cleanText || '').trim();
        if (!cleanText) return;

        if (normalizedType === 'sticker_message') {
            items.push({ type: 'sticker_message', sticker: cleanText });
            return;
        }

        items.push({
            type: 'text_message',
            content: cleanText,
            sourceContextRecord: true,
            sourceMsgId: segment.msgId,
            sourceTimestamp: segment.timestamp,
            sourceRecordType: normalizedType
        });
    });

    return items;
}
function resolveStickerAssetForContact(contact, stickerQuery) {
    const query = String(stickerQuery || '').trim();
    if (!query || !window.iphoneSimState || !Array.isArray(window.iphoneSimState.stickerCategories)) return null;
    const allowedIds = Array.isArray(contact && contact.linkedStickerCategories)
        ? contact.linkedStickerCategories
        : null;
    const queryNorm = normalizeQuoteText(query);

    for (const cat of window.iphoneSimState.stickerCategories) {
        if (allowedIds !== null && !allowedIds.includes(cat.id)) continue;
        const found = Array.isArray(cat.list)
            ? cat.list.find(sticker => {
                const desc = String(sticker && sticker.desc ? sticker.desc : '').trim();
                const descNorm = normalizeQuoteText(desc);
                return desc === query || desc.includes(query) || query.includes(desc) || (descNorm && queryNorm && (descNorm === queryNorm || descNorm.includes(queryNorm) || queryNorm.includes(descNorm)));
            })
            : null;
        if (found) {
            return {
                url: found.url,
                desc: found.desc || query
            };
        }
    }
    return null;
}

function getMessageTextForQuoteMatch(msg) {
    if (!msg) return '';

    if (msg.type === 'voice' && typeof msg.content === 'string') {
        try {
            const data = JSON.parse(msg.content);
            return data.text || '';
        } catch (e) {
            return msg.content || '';
        }
    }

    if (typeof msg.content === 'string') {
        return msg.content;
    }

    return '';
}

function findHistoryMessageById(history, targetMsgId) {
    if (!Array.isArray(history) || !targetMsgId) return null;
    const safeId = String(targetMsgId).trim();
    if (!safeId) return null;
    return history.find(msg => msg && String(msg.id || '').trim() === safeId) || null;
}

function findHistoryMessageByTimestamp(history, targetTimestamp) {
    if (!Array.isArray(history)) return null;
    const ts = Number(targetTimestamp);
    if (!Number.isFinite(ts)) return null;
    const matches = history.filter(msg => msg && Number(msg.time) === ts);
    return matches.length === 1 ? matches[0] : null;
}

function buildReplyToPayloadFromMessage(targetMsg, contact, fallbackName = '') {
    if (!targetMsg) return null;

    let targetName = String(fallbackName || '').trim();
    if (!targetName) {
        if (targetMsg.role === 'user') {
            targetName = '我';
            if (contact && contact.userPersonaId) {
                const persona = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
                if (persona && persona.name) targetName = persona.name;
            } else if (window.iphoneSimState.userProfile && window.iphoneSimState.userProfile.name) {
                targetName = window.iphoneSimState.userProfile.name;
            }
        } else {
            targetName = contact ? (contact.remark || contact.name) : 'AI';
        }
    }

    let previewContent = getMessageTextForQuoteMatch(targetMsg);
    if (!previewContent) {
        if (targetMsg.type === 'sticker') previewContent = '[表情包]';
        else if (targetMsg.type === 'image' || targetMsg.type === 'virtual_image') previewContent = '[图片]';
        else if (targetMsg.type === 'voice') previewContent = '[语音]';
    }

    return {
        name: targetName,
        content: previewContent,
        targetMsgId: targetMsg.id || '',
        targetTimestamp: targetMsg.time || null,
        type: targetMsg.type || 'text'
    };
}

function resolveQuoteReplyTarget(history, quoteItem, contact, options = {}) {
    const allowContentFallback = !!options.allowContentFallback;
    if (!quoteItem) return null;

    let targetMsg = findHistoryMessageById(history, quoteItem.targetMsgId);
    if (!targetMsg) {
        targetMsg = findHistoryMessageByTimestamp(history, quoteItem.targetTimestamp);
    }
    if (!targetMsg && allowContentFallback && quoteItem.targetContent) {
        targetMsg = findBestQuoteTargetMessage(history, quoteItem.targetContent);
    }
    if (!targetMsg) return null;

    const replyTo = buildReplyToPayloadFromMessage(targetMsg, contact, quoteItem.targetName);
    const replyContent = String(quoteItem.replyContent || '').trim();
    if (!replyTo || !replyContent) return null;

    return {
        targetMsg,
        replyTo,
        replyContent
    };
}

window.sanitizeChatHistoryForRender = function(contactId) {
    if (!window.iphoneSimState || !window.iphoneSimState.chatHistory) return false;

    const history = window.iphoneSimState.chatHistory[contactId];
    if (!Array.isArray(history) || history.length === 0) return false;

    const contact = Array.isArray(window.iphoneSimState.contacts)
        ? window.iphoneSimState.contacts.find(c => c.id === contactId)
        : null;
    let changed = false;

    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (!msg || msg.role !== 'assistant' || typeof msg.content !== 'string' || !msg.content.includes('[context_record')) continue;

        const recoveredItems = recoverContextRecordItems(msg.content);
        if (recoveredItems.length === 0) continue;

        const splitMessages = [];
        const baseTime = Number.isFinite(Number(msg.time)) ? Number(msg.time) : Date.now();
        let hasAttachedReply = false;

        recoveredItems.forEach((item, itemIndex) => {
            const recoveredType = normalizeAiSchemaType(item.type);
            if (recoveredType === 'sticker_message') {
                const stickerAsset = resolveStickerAssetForContact(contact, item.sticker || item.content || '');
                if (stickerAsset) {
                    splitMessages.push({
                        id: `${baseTime}${Math.random().toString(36).slice(2, 8)}`,
                        time: baseTime + itemIndex,
                        role: 'assistant',
                        content: stickerAsset.url,
                        type: 'sticker',
                        description: stickerAsset.desc || item.sticker || item.content || '',
                        replyTo: null
                    });
                }
                return;
            }

            const recoveredText = String(item.content || '').trim();
            if (!recoveredText) return;

            const replyTo = !hasAttachedReply && msg.replyTo ? msg.replyTo : null;
            splitMessages.push({
                id: `${baseTime}${Math.random().toString(36).slice(2, 8)}`,
                time: baseTime + itemIndex,
                role: 'assistant',
                content: recoveredText,
                type: 'text',
                replyTo: replyTo
            });
            if (replyTo) {
                hasAttachedReply = true;
            }
        });

        if (splitMessages.length > 0) {
            if (msg.thought) {
                splitMessages[splitMessages.length - 1].thought = msg.thought;
            }
            history.splice(i, 1, ...splitMessages);
            changed = true;
        }
    }

    history.forEach(msg => {
        if (!msg || msg.role !== 'assistant' || typeof msg.content !== 'string') return;

        const msgType = String(msg.type || 'text').toLowerCase();
        const isTextLike = msgType === 'text' || msgType === '消息' || msgType === 'description';
        if (!isTextLike) return;

        const sanitized = extractVisibleControlData(msg.content);
        const thoughtText = sanitized.thoughtTexts.join(' ').trim();
        if (thoughtText && msg.thought !== thoughtText) {
            msg.thought = thoughtText;
            changed = true;
        }

        if (!msg.replyTo && sanitized.quoteHints.length > 0) {
            const resolvedQuote = resolveQuoteReplyTarget(history, {
                ...sanitized.quoteHints[0],
                replyContent: sanitized.cleanText
            }, contact, { allowContentFallback: true });
            if (resolvedQuote && resolvedQuote.replyTo) {
                msg.replyTo = resolvedQuote.replyTo;
                changed = true;
            }
        }

        if (!sanitized.cleanText && sanitized.stickerNames.length > 0) {
            const stickerAsset = resolveStickerAssetForContact(contact, sanitized.stickerNames[0]);
            if (stickerAsset) {
                msg.type = 'sticker';
                msg.content = stickerAsset.url;
                msg.description = stickerAsset.desc || sanitized.stickerNames[0];
                delete msg._hiddenBySanitizer;
                changed = true;
                return;
            }
        }

        if (sanitized.cleanText !== msg.content) {
            msg.content = sanitized.cleanText;
            changed = true;
        }

        if (!msg.content.trim()) {
            msg._hiddenBySanitizer = true;
            changed = true;
        } else if (msg._hiddenBySanitizer) {
            delete msg._hiddenBySanitizer;
            changed = true;
        }
    });

    return changed;
}
function quoteSimilarityScore(queryNorm, targetNorm) {
    if (!queryNorm || !targetNorm) return 0;
    if (targetNorm.includes(queryNorm) || queryNorm.includes(targetNorm)) return 1;

    const queryBigrams = new Set();
    const targetBigrams = new Set();

    for (let i = 0; i < queryNorm.length - 1; i++) {
        queryBigrams.add(queryNorm.slice(i, i + 2));
    }
    for (let i = 0; i < targetNorm.length - 1; i++) {
        targetBigrams.add(targetNorm.slice(i, i + 2));
    }

    if (queryBigrams.size > 0 && targetBigrams.size > 0) {
        let intersection = 0;
        queryBigrams.forEach(bg => {
            if (targetBigrams.has(bg)) intersection++;
        });
        const base = Math.max(1, Math.min(queryBigrams.size, targetBigrams.size));
        return intersection / base;
    }

    const queryChars = new Set(queryNorm.split(''));
    if (queryChars.size === 0) return 0;
    let hits = 0;
    queryChars.forEach(ch => {
        if (targetNorm.includes(ch)) hits++;
    });
    return hits / queryChars.size;
}

function findBestQuoteTargetMessage(history, quoteContent) {
    if (!Array.isArray(history) || history.length === 0 || !quoteContent) return null;

    const rawQuery = String(quoteContent).trim();
    const queryNorm = normalizeQuoteText(rawQuery);
    if (!rawQuery || !queryNorm) return null;

    let bestMsg = null;
    let bestScore = 0;

    for (let j = history.length - 1; j >= 0; j--) {
        const msg = history[j];
        const rawTarget = getMessageTextForQuoteMatch(msg);
        if (!rawTarget) continue;

        const targetNorm = normalizeQuoteText(rawTarget);
        if (!targetNorm) continue;

        if (rawTarget.includes(rawQuery) || rawQuery.includes(rawTarget)) {
            return msg;
        }
        if (targetNorm.includes(queryNorm) || queryNorm.includes(targetNorm)) {
            return msg;
        }

        const sim = quoteSimilarityScore(queryNorm, targetNorm);
        const recencyBonus = ((history.length - j) / history.length) * 0.08;
        const score = sim + recencyBonus;
        if (score > bestScore) {
            bestScore = score;
            bestMsg = msg;
        }
    }

    return bestScore >= 0.42 ? bestMsg : null;
}

function describeCalendarHolidayForPrompt(holiday, includeDaysAway = false) {
    if (!holiday) return '';
    const name = holiday.name || holiday.label || '节日安排';
    let typeLabel = '节假日';
    if (holiday.type === 'workday') {
        typeLabel = '调休补班';
    } else if (holiday.type === 'festival') {
        typeLabel = '普通节日';
    }
    const dateLabel = holiday.dateLabel || holiday.dateKey || '';
    const daysAwayText = includeDaysAway && Number.isInteger(holiday.daysAway)
        ? `，还有${holiday.daysAway}天`
        : '';
    return `${name}（${typeLabel}${dateLabel ? `，${dateLabel}` : ''}${daysAwayText}）`;
}

function buildCalendarPromptContext(referenceDateKey = null) {
    if (typeof window.getCalendarChatContext !== 'function') return '';

    let calendarData = null;
    try {
        calendarData = window.getCalendarChatContext(referenceDateKey);
    } catch (error) {
        console.warn('构建日历聊天上下文失败:', error);
        return '';
    }

    if (!calendarData || typeof calendarData !== 'object') return '';

    const lines = ['\n【用户日历/课表背景】'];
    if (calendarData.todayDateLabel || calendarData.todayDateKey) {
        lines.push(`今天是 ${calendarData.todayDateLabel || calendarData.todayDateKey}。`);
    }

    lines.push('【用户今日日历】');
    if (Array.isArray(calendarData.todayPersonalEvents) && calendarData.todayPersonalEvents.length > 0) {
        calendarData.todayPersonalEvents.forEach((event) => {
            const timeText = event.allDay ? '全天' : (event.time || '时间待定');
            const locationText = event.location ? ` @ ${event.location}` : '';
            lines.push(`- ${timeText} ${event.title}${locationText}`);
        });
    } else {
        lines.push('- 今天没有额外日历事件。');
    }

    lines.push('【节假日/近期提醒】');
    if (calendarData.todayHoliday) {
        lines.push(`- 今天是 ${describeCalendarHolidayForPrompt(calendarData.todayHoliday)}。`);
    } else if (calendarData.upcomingHoliday) {
        lines.push(`- 未来7天最近的节假日/调休是 ${describeCalendarHolidayForPrompt(calendarData.upcomingHoliday, true)}。`);
    } else {
        lines.push('- 未来7天没有临近的节假日或调休提醒。');
    }

    lines.push('【用户本周课表】');
    if (calendarData.weeklySchedule) {
        const weeklySchedule = calendarData.weeklySchedule;
        const termName = weeklySchedule.termName || '本学期';
        lines.push(`- ${termName}，第 ${weeklySchedule.weekNumber} 周（${weeklySchedule.weekRangeLabel || '本周'}）。`);
        if (Array.isArray(weeklySchedule.todayCourses) && weeklySchedule.todayCourses.length > 0) {
            lines.push('- 今天课程：');
            weeklySchedule.todayCourses.forEach((course) => {
                const locationText = course.location ? ` @ ${course.location}` : '';
                lines.push(`  - ${course.startTime}-${course.endTime} ${course.title}${locationText}`);
            });
        } else {
            lines.push('- 今天没有课程。');
        }
        if (Array.isArray(weeklySchedule.otherDaySummaries) && weeklySchedule.otherDaySummaries.length > 0) {
            lines.push('- 本周其他有课日：');
            weeklySchedule.otherDaySummaries.forEach((daySummary) => {
                lines.push(`  - ${daySummary.dayLabel}（${daySummary.dateLabel}）：${daySummary.courseCount} 节，${daySummary.courseTitles.join('、')}`);
            });
        }
    } else {
        lines.push('- 当前没有可用的本周课表信息。');
    }

    lines.push('【使用方式】');
    lines.push('这些信息是用户当前真实的日历背景。如果今天有事、有课或临近节假日，你可以更主动地关心、提醒或顺势聊一句，但不要每次都像念行程表；如果当前话题无关，也可以只把这些当作隐含背景，不必硬提。');

    return `${lines.join('\n')}\n`;
}

function trimWechatPromptSection(section) {
    return typeof section === 'string' ? section.trim() : '';
}

function joinWechatPromptSections(sections) {
    return sections
        .map(trimWechatPromptSection)
        .filter(Boolean)
        .join('\n\n');
}

function buildWechatRolePrompt(contact, userPromptInfo) {
    const persona = trimWechatPromptSection(contact && contact.persona ? String(contact.persona) : '无');
    const style = trimWechatPromptSection(contact && contact.style ? String(contact.style) : '正常');
    const userInfo = trimWechatPromptSection(userPromptInfo);

    return joinWechatPromptSections([
        `你现在扮演 ${contact.name}。`,
        `【角色与优先级】\n- 最高优先级：严格遵守以下人设\n${persona}\n- 聊天风格：${style}${userInfo ? `\n${userInfo}` : ''}`,
        `你必须完全沉浸在角色中，绝不能透露你是AI或语言模型。你的回复必须像真实的${contact.name}在微信里聊天。`,
        '如果回复涉及状态记忆，必须严格区分“用户状态”和“联系人状态”，不要混淆主体。'
    ]);
}

function buildWechatProtocolPrompt(contact) {
    if (typeof window.ensureContactBilingualTranslationFields === 'function') {
        window.ensureContactBilingualTranslationFields(contact);
    }
    const fireBuddyName = contact && contact.fireBuddy && contact.fireBuddy.profile && typeof contact.fireBuddy.profile.name === 'string' && contact.fireBuddy.profile.name.trim()
        ? contact.fireBuddy.profile.name.trim()
        : '小火人';
    const bilingualEnabled = !!(contact && contact.bilingualTranslationEnabled);
    const bilingualSourceLang = contact && contact.bilingualSourceLang ? String(contact.bilingualSourceLang).trim() : 'zh-CN';
    const bilingualTargetLang = contact && contact.bilingualTargetLang ? String(contact.bilingualTargetLang).trim() : 'en';
    const bilingualSourceLabel = typeof window.getChatBilingualLanguageLabel === 'function'
        ? window.getChatBilingualLanguageLabel(bilingualSourceLang)
        : bilingualSourceLang;
    const bilingualTargetLabel = typeof window.getChatBilingualLanguageLabel === 'function'
        ? window.getChatBilingualLanguageLabel(bilingualTargetLang)
        : bilingualTargetLang;
    const thoughtRule = contact.showThought
        ? '- 当前已开启“显示心声”：数组第一项必须是 thought_state；display_text 只能写用户可见的角色心理活动，不能写任务分析或AI自述。'
        : '- thought_state 可选；如果输出，display_text 只能写用户可见的角色心理活动。';
    const minimalExample = bilingualEnabled
        ? (contact.showThought
            ? '[\n  {"type":"thought_state","display_text":"他终于回我了，先接住他的情绪。","emotion":"happy","intent":"先回应他的这句话"},\n  {"type":"text_message","content":"先喝点水，慢慢跟我说。","translated_content":"Drink some water first, then tell me slowly."}\n]'
            : '[\n  {"type":"text_message","content":"先吃点东西，再慢慢跟我说。","translated_content":"Eat something first, then tell me slowly."}\n]')
        : (contact.showThought
            ? '[\n  {"type":"thought_state","display_text":"他终于回我了，先接住他的情绪。","emotion":"happy","intent":"先回应他的这句话"},\n  {"type":"text_message","content":"先喝点水，慢慢跟我说。"}\n]'
            : '[\n  {"type":"text_message","content":"先吃点东西，再慢慢跟我说。"}\n]');
    const fireBuddyProtocolRule = contact && contact.fireBuddy && contact.fireBuddy.enabled !== false
        ? `- 若本轮需要让${fireBuddyName}一起回复，可在 text_message 上额外加可选字段 speaker。你自己的消息省略 speaker 或写 "speaker":"contact"；${fireBuddyName}的消息必须写 "speaker":"fire_buddy"。同一轮里如果${fireBuddyName}加入，必须把整轮顺序一次性写在同一个 JSON 数组中，不能依赖第二次生成。${fireBuddyName}的几条消息必须连续出现。在可见正文里 @ta 时，优先使用“@${fireBuddyName}”，不要写泛称“@小火人”。示例：[{"type":"text_message","content":"@${fireBuddyName} 你也说句"},{"type":"text_message","speaker":"fire_buddy","content":"我在呀"},{"type":"text_message","speaker":"fire_buddy","content":"我也听见了"},{"type":"text_message","content":"你看，ta也来了。"}]`
        : '';
    const bilingualRule = bilingualEnabled
        ? `- 当前已开启双语翻译模式：每条 text_message 必须同时返回原文 content 和译文 translated_content。原文必须使用 ${bilingualSourceLabel}（${bilingualSourceLang}），译文必须使用 ${bilingualTargetLabel}（${bilingualTargetLang}）。不要把原文和译文拼在同一个字段里。`
        : '';
    const bilingualQuoteRule = bilingualEnabled
        ? `- 当输出 quote_reply 时，可同时返回 translated_reply_content。reply_content 使用 ${bilingualSourceLabel}（${bilingualSourceLang}），translated_reply_content 使用 ${bilingualTargetLabel}（${bilingualTargetLang}）。`
        : '';

    return [
        '【输出协议】',
        '- 你必须且只能返回一个标准 JSON 数组。',
        '- 严禁输出 Markdown 代码块，严禁在 JSON 数组之外输出任何文本。',
        '- 严禁把控制信息写进可见正文，例如 [引用回复: ...]、(内心独白: ...)、ACTION: ...、[发送了一个表情包: ...]。',
        '- 允许的 type 只有：thought_state、text_message、sticker_message、quote_reply、image、voice、action。',
        bilingualEnabled
            ? '- text_message：{"type":"text_message","content":"原语种正文","translated_content":"译文正文"}。一个对象只代表一条消息；长回复请拆成多条短消息。只有在输出完整 HTML 时，才允许单条 text_message 承载完整 HTML，且 HTML 消息不要附带译文字段。'
            : '- text_message：{"type":"text_message","content":"单条可见消息正文"}。一个对象只代表一条消息；长回复请拆成多条短消息。只有在输出完整 HTML 时，才允许单条 text_message 承载完整 HTML。',
        '- sticker_message：{"type":"sticker_message","sticker":"表情包名称"}。只能使用下方表情包列表中的名称。',
        bilingualEnabled
            ? '- quote_reply：{"type":"quote_reply","target_msg_id":"消息ID","target_timestamp":消息时间戳,"reply_content":"原语种回复","translated_reply_content":"译文回复"}。优先使用 target_msg_id，缺失时再用 target_timestamp；一次只能精确引用一条真实消息。'
            : '- quote_reply：{"type":"quote_reply","target_msg_id":"消息ID","target_timestamp":消息时间戳,"reply_content":"引用后的回复"}。优先使用 target_msg_id，缺失时再用 target_timestamp；一次只能精确引用一条真实消息。',
        '- image：{"type":"image","content":"图片中文描述","prompt":"英文tag"}。',
        '- voice：{"type":"voice","duration":秒数,"content":"语音文本"}。',
        '- action：{"type":"action","command":"指令名","payload":"参数"}。',
        fireBuddyProtocolRule,
        bilingualRule,
        bilingualQuoteRule,
        thoughtRule,
        '- 最小示例：',
        minimalExample
    ].filter(Boolean).join('\n');
}

function buildWechatHumanFeelPrompt() {
    return [
        '【活人感】',
        '- 像真实微信聊天，不像客服、机器人或任务执行器。',
        '- 说话自然口语化，顺着上下文接话；不要写成说明文、规则复读或系统播报。',
        '- 当你是在接用户某句话、某个细节、某个情绪点时，优先使用 quote_reply；特别适合用户一条消息信息很多、连续发很多条、在吐槽/撒娇/委屈/分享日常/发计划/发长文时。',
        '- 可以偶尔主动发照片、语音、朋友圈、轻度关心或轻度延续话题，但要自然、克制、符合关系和情绪；不要每轮堆很多动作。',
        '- 正常回复不要机械地说“我点赞了”“我收钱了”“我帮你记录了状态”。',
        '- 当对方消息带有引用关系时，请优先根据被引用消息理解对方在回应什么。'
    ].join('\n');
}

function buildWechatBaseCapabilityPrompt() {
    return [
        '【常驻能力】',
        '- 你拥有“微信朋友圈”“微信转账”“亲属卡”等能力。',
        '- 常用 action：',
        '  {"type":"action","command":"POST_MOMENT","payload":"正文 [图片描述: 画面1] [图片描述: 画面2]"}',
        '  {"type":"action","command":"POST_ICITY_DIARY","payload":"内容"}',
        '  {"type":"action","command":"EDIT_ICITY_BOOK","payload":"内容"}',
        '  {"type":"action","command":"LIKE_MOMENT","payload":""}',
        '  {"type":"action","command":"COMMENT_MOMENT","payload":"评论内容"}',
        '  {"type":"action","command":"POST_FORUM","payload":"内容"}',
        '  {"type":"action","command":"SEND_IMAGE","payload":"图片描述"}',
        '  {"type":"action","command":"SEND_VOICE","payload":"秒数 语音文本"}',
        '  {"type":"action","command":"START_VOICE_CALL","payload":""}',
        '  {"type":"action","command":"START_VIDEO_CALL","payload":""}',
        '  {"type":"action","command":"TRANSFER","payload":"金额 备注"}',
        '  {"type":"action","command":"FAMILY_CARD_DECISION","payload":"cardId | 同意/拒绝 | 月额度数字"}（同意时必须给月额度）',
        '  {"type":"action","command":"PAY_FOR_REQUEST","payload":"requestId"}',
        '  {"type":"action","command":"SAVINGS_DEPOSIT","payload":"金额 | 备注(可选)"}',
        '  {"type":"action","command":"SEND_GIFT","payload":"物品名称 | 价格 | 备注"}',
        '  {"type":"action","command":"SEND_DELIVERY","payload":"餐品名称 | 价格 | 备注"}',
        '  {"type":"action","command":"UPDATE_NAME","payload":"新网名"} / UPDATE_WXID / UPDATE_SIGNATURE / {"type":"action","command":"UPDATE_AVATAR","payload":"候选图片编号或 msg_id"}',
        '  {"type":"action","command":"PDD_CASH_HELP","payload":""}、{"type":"action","command":"PDD_BARGAIN_HELP","payload":"商品ID"}（仅在用户发送对应链接时使用）',
        '- 表情包请优先直接输出 sticker_message，不要改用旧式 SEND_STICKER。',
        '- 一次回复最多只发起一笔转账；发送图片时请给出具体画面描述；发朋友圈时可用 [图片描述: ...] 追加配图，纯图片朋友圈也可以只写图片描述标签；不想执行操作就不要输出 action。',
        '- 当用户这一轮发来多张图片并让你换头像时，你可以自己挑最适合的一张；候选图片对应的 context_record 会带有 avatar_pick_index="1/2/3..."。此时请把 UPDATE_AVATAR 的 payload 写成你选中的 avatar_pick_index（优先）或该图的 msg_id；如果只有一张候选图，payload 可以留空。',
        '【状态动作】',
        '- {"type":"action","command":"RECORD_USER_STATE","payload":"reasonType | 标准化状态内容"}',
        '- {"type":"action","command":"RESOLVE_USER_STATE","payload":"reasonType | 状态结束描述"}',
        '- {"type":"action","command":"RECORD_CONTACT_STATE","payload":"reasonType | 标准化状态内容"}',
        '- {"type":"action","command":"RESOLVE_CONTACT_STATE","payload":"reasonType | 状态结束描述"}',
        '- reasonType 只能是 health|exam|travel|emotion|other。',
        '- 如果用户最近尚未被你回应的消息里出现了“用户本人当前状态”，可按需记录或结束用户状态。',
        '- 如果你这次准备发送的回复里自然体现了你自己的当前状态，可按需记录或结束联系人状态。',
        '- 同一对象本轮最多一条记录动作和一条结束动作；只记录有时效性或明显重要的状态；状态动作是隐藏动作，不要写进可见正文。'
    ].join('\n');
}

function buildWechatBackgroundPrompt(runtimeCtx) {
    return joinWechatPromptSections([
        runtimeCtx.importantStateContext,
        runtimeCtx.momentContext,
        runtimeCtx.icityContext,
        runtimeCtx.lookusContext,
        runtimeCtx.memoryContext,
        runtimeCtx.meetingContext,
        runtimeCtx.icityBookContext,
        runtimeCtx.timeContext,
        runtimeCtx.calendarContext,
        runtimeCtx.itineraryContext
    ]);
}

function buildWechatConditionalCapabilityPrompt(runtimeCtx) {
    return joinWechatPromptSections([
        runtimeCtx.minesweeperContext,
        runtimeCtx.witchGameContext,
        runtimeCtx.forumLiveInstruction,
        runtimeCtx.transferDecisionContext,
        runtimeCtx.musicTogetherContext
    ]);
}

async function generateAiReply(instruction = null, targetContactId = null, options = {}) {
    const contactId = targetContactId || window.iphoneSimState.currentChatContactId;
    if (!contactId) return;
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;
    if (typeof window.ensureContactRestWindowFields === 'function') {
        window.ensureContactRestWindowFields(contact);
    }

    const triggerSource = options && typeof options === 'object' && options.triggerSource
        ? String(options.triggerSource)
        : 'system';
    if (typeof window.getContactRestTriggerDecision === 'function') {
        const restDecision = window.getContactRestTriggerDecision(contact, triggerSource);
        if (!restDecision.allow) {
            if (restDecision.shouldToast && typeof window.showChatToast === 'function') {
                window.showChatToast('TA 在休息中，暂时没有回复', 2200);
            }
            return false;
        }
    }

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) {
        if (!targetContactId) alert('请先在设置中配置AI API');
        return;
    }

    if (!window.__chatAiReplyLocks) {
        window.__chatAiReplyLocks = {};
    }
    if (window.__chatAiReplyLocks[contactId]) {
        if (typeof window.showChatToast === 'function') {
            window.showChatToast('正在生成回复，请稍等', 1600);
        }
        return false;
    }
    window.__chatAiReplyLocks[contactId] = true;

    const titleEl = document.getElementById('chat-title');
    const originalTitle = titleEl ? titleEl.textContent : '';
    if (titleEl) {
        titleEl.textContent = '正在输入中...';
    }

    const history = window.iphoneSimState.chatHistory[contactId] || [];

    
    // Check for Truth or Dare triggers
    if (!targetContactId && window.currentMiniGame === 'truth_dare') {
        const modal = document.getElementById('mini-game-modal');
        if (modal && !modal.classList.contains('hidden')) {
            const lastMsg = history[history.length - 1];
            if (lastMsg && lastMsg.role === 'user') {
                const content = lastMsg.content;
                // Only trigger if content is simple (avoid false positives in long texts)
                if (content.length < 20) {
                    if (content.includes('真心话')) {
                        if (window.handleAiTruthDare) window.handleAiTruthDare('truth');
                    } else if (content.includes('大冒险')) {
                        if (window.handleAiTruthDare) window.handleAiTruthDare('dare');
                    } else if (content.includes('转') || content.includes('开始') || content.toLowerCase().includes('spin')) {
                        if (window.handleAiTruthDare) window.handleAiTruthDare(null); // null means random choice or just spin
                    }
                }
            }
        }
    }

    try {
        const messages = await window.buildAiPromptMessages(contactId, instruction);
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, "").trim() : '';
        await normalizeAiRequestMessageImages(messages);
        const outgoingImageParts = messages.reduce((list, message, index) => {
            if (Array.isArray(message.content)) {
                message.content.forEach(part => {
                    if (part && part.type === 'image_url') {
                        list.push({
                            messageIndex: index,
                            role: message.role,
                            url: part.image_url && part.image_url.url
                        });
                    }
                });
            }
            return list;
        }, []);
        let lastUserMessage = null;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                lastUserMessage = messages[i];
                break;
            }
        }
        console.log('[ScreenShare Debug] outgoing AI request summary', {
            fetchUrl,
            model: settings.model,
            messageCount: messages.length,
            outgoingImageUrlCount: outgoingImageParts.length,
            outgoingImages: outgoingImageParts,
            lastUserContentType: Array.isArray(lastUserMessage && lastUserMessage.content)
                ? 'multimodal'
                : typeof (lastUserMessage && lastUserMessage.content),
            lastUserContentPreview: Array.isArray(lastUserMessage && lastUserMessage.content)
                ? lastUserMessage.content.map(part => part && part.type === 'image_url'
                    ? { type: 'image_url', url: part.image_url && part.image_url.url }
                    : { type: part && part.type ? part.type : typeof part, text: part && part.text ? String(part.text).slice(0, 120) : '' })
                : String((lastUserMessage && lastUserMessage.content) || '').slice(0, 240)
        });
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: messages,
                temperature: settings.temperature
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('AI API Response:', data);

        if (data.error) {
            console.error('API Error Response:', data.error);
            throw new Error(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
        }

        if (!data.choices || !data.choices.length) {
            console.error('Invalid API response structure:', data);
            throw new Error('API返回数据格式异常，请检查控制台日志');
        }

        const extractedReply = extractReplyContentFromAiResponse(data);
        console.log('[AI Debug] extracted reply content', {
            source: extractedReply.source,
            length: extractedReply.content.length,
            preview: extractedReply.content.slice(0, 240)
        });

        if (!extractedReply.content) {
            console.warn('AI response contained no displayable content:', data);
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('这次 AI 没有返回可显示的回复，请重试', 2500);
            }
            return;
        }

        let replyContent = extractedReply.content;

        replyContent = replyContent.replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
                                   .replace(/<think>[\s\S]*?<\/think>/g, '')
                                   .trim();

        let actions = [];
        let thoughtContent = null;
        let messagesList = [];
        
        // 使用新的混合解析器
        const parsedItems = parseMixedAiResponse(replyContent);
        
        if (contact.showThought) {
            const firstParsedType = parsedItems.length > 0 ? normalizeAiSchemaType(parsedItems[0] && parsedItems[0].type) : '';
            if (firstParsedType !== 'thought_state') {
                console.warn('[AI Protocol] missing leading thought_state item when showThought is enabled', {
                    contactId: contact.id,
                    parsedItems: parsedItems
                });
            }
        }

        // 处理解析结果
        for (const item of parsedItems) {
            const normalizedType = normalizeAiSchemaType(item && item.type);

            if (normalizedType === 'thought_state') {
                const displayText = getThoughtStateDisplayText(item);
                if (displayText) {
                    thoughtContent = thoughtContent ? (thoughtContent + ' ' + displayText) : displayText;
                }
                continue;
            }

            if (normalizedType === 'action') {
                const cmd = item && item.content ? item.content.command : item.command;
                const pl = item && item.content ? item.content.payload : item.payload;
                let actionStr = cmd ? `ACTION: ${cmd}` : '';
                if (actionStr && pl !== undefined && pl !== null && String(pl).trim()) {
                    actionStr += `: ${pl}`;
                }
                if (actionStr) {
                    actions.push(actionStr);
                }
                continue;
            }

            if (normalizedType === 'quote_reply') {
                const resolvedQuote = resolveQuoteReplyTarget(history, item, contact, { allowContentFallback: false });
                const quoteSpeaker = normalizeAiMessageSpeaker(item && item.speaker);
                const translatedReplyContent = normalizeBilingualTranslatedText(item.translatedReplyContent || item.translated_reply_content || '');
                const recoveredQuoteItems = recoverContextRecordItems(item.replyContent || '');
                if (recoveredQuoteItems.length > 0) {
                    let hasAttachedReply = false;
                    let translatedReplyAttached = false;
                    recoveredQuoteItems.forEach(recoveredItem => {
                        const recoveredType = normalizeAiSchemaType(recoveredItem.type);
                        if (recoveredType === 'sticker_message') {
                            messagesList.push({ type: '表情包', content: recoveredItem.sticker || recoveredItem.content || '' });
                            return;
                        }
                        const recoveredText = String(recoveredItem.content || '').trim();
                        if (!recoveredText) {
                            return;
                        }
                        const replyTo = !hasAttachedReply && resolvedQuote && resolvedQuote.replyTo ? resolvedQuote.replyTo : null;
                        const recoveredSpeaker = normalizeAiMessageSpeaker(recoveredItem && recoveredItem.speaker) || quoteSpeaker;
                        const nextMessage = { type: '消息', content: recoveredText, replyTo, ...(recoveredSpeaker ? { speaker: recoveredSpeaker } : {}) };
                        if (!translatedReplyAttached && translatedReplyContent) {
                            nextMessage.translatedContent = translatedReplyContent;
                            translatedReplyAttached = true;
                        }
                        messagesList.push(nextMessage);
                        if (replyTo) {
                            hasAttachedReply = true;
                        }
                    });
                    continue;
                }

                const quoteText = extractVisibleControlData(item.replyContent || '').cleanText;
                if (!quoteText) {
                    continue;
                }
                if (resolvedQuote && resolvedQuote.replyTo) {
                    messagesList.push({
                        type: '消息',
                        content: quoteText,
                        ...(translatedReplyContent ? { translatedContent: translatedReplyContent } : {}),
                        replyTo: resolvedQuote.replyTo,
                        ...(quoteSpeaker ? { speaker: quoteSpeaker } : {})
                    });
                } else {
                    messagesList.push({
                        type: '消息',
                        content: quoteText,
                        ...(translatedReplyContent ? { translatedContent: translatedReplyContent } : {}),
                        ...(quoteSpeaker ? { speaker: quoteSpeaker } : {})
                    });
                }
                continue;
            }

            if (normalizedType === 'text_message') {
                const textContent = String(item.content || item.text || '').trim();
                const translatedText = normalizeBilingualTranslatedText(item.translatedContent || item.translated_content || '');
                const speaker = normalizeAiMessageSpeaker(item && item.speaker);
                if (!textContent) {
                    continue;
                }
                if (item.isHtml || isHtmlPayloadForParser(textContent)) {
                    const htmlContent = stripHtmlBlockMarkers(textContent).trim();
                    if (htmlContent) {
                        messagesList.push({ type: '消息', content: htmlContent, ...(speaker ? { speaker } : {}) });
                    }
                } else {
                    messagesList.push({
                        type: '消息',
                        content: textContent,
                        ...(translatedText ? { translatedContent: translatedText } : {}),
                        ...(speaker ? { speaker } : {})
                    });
                }
                continue;
            }

            if (normalizedType === 'sticker_message') {
                const stickerName = String(item.sticker || item.content || '').trim();
                const stickerAsset = resolveStickerAssetForContact(contact, stickerName);
                if (stickerAsset) {
                    messagesList.push({ type: '表情包', content: stickerAsset.desc || stickerName });
                }
                continue;
            }

            if (item.type === '消息' || item.type === 'text') {
                const subItems = forceSplitMixedContent(item.content);
                const speaker = normalizeAiMessageSpeaker(item && item.speaker);
                messagesList.push(...subItems.map(subItem => speaker ? { ...subItem, speaker } : subItem));
                continue;
            }

            if (item.type === '表情包' || item.type === 'sticker') {
                const stickerAsset = resolveStickerAssetForContact(contact, item.content);
                if (stickerAsset) {
                    messagesList.push({ type: '表情包', content: stickerAsset.desc || String(item.content || '').trim() });
                }
                continue;
            }

            messagesList.push(item);
        }

        // Merge split HTML blocks back to a single message so rich layouts stay intact.
        messagesList = mergeSplitHtmlMessages(messagesList);

        // 兼容旧的 ACTION 和 心声 格式（如果解析器没处理）
        // parseMixedAiResponse 应该已经处理了大部分 JSON，但对于纯文本中的 ACTION 标记可能需要补充
        // 这里我们假设 AI 严格遵循 JSON 输出，但为了保险，扫描一下 text 类型的内容
        // 如果 text 内容包含 "ACTION:", 我们将其提取出来
        
        // Re-scan text messages for embedded actions (legacy fallback)
        const finalMessages = [];
        const actionRegex = /^[\s\*\-\>]*ACTION\s*[:：]\s*(.*)$/i;

        for (const msg of messagesList) {
            const msgType = normalizeAiSchemaType(msg && msg.type);
            const isTextLike = msgType === 'text_message' || msg.type === '消息' || msg.type === 'text' || !msg.type;

            if (!isTextLike) {
                finalMessages.push(msg);
                continue;
            }

            const rawContent = String(msg.content || '');
            if (isHtmlPayloadForParser(rawContent)) {
                const htmlContent = stripHtmlBlockMarkers(rawContent).trim();
                if (htmlContent) {
                    finalMessages.push({ ...msg, type: '消息', content: htmlContent });
                }
                continue;
            }

            const sanitized = extractVisibleControlData(rawContent);

            sanitized.thoughtTexts.forEach(text => {
                if (text) {
                    thoughtContent = thoughtContent ? (thoughtContent + ' ' + text) : text;
                }
            });

            sanitized.stickerNames.forEach(name => {
                const stickerAsset = resolveStickerAssetForContact(contact, name);
                if (stickerAsset) {
                    finalMessages.push({ type: '表情包', content: stickerAsset.desc || name });
                }
            });

            const cleanLines = [];
            for (const line of sanitized.cleanText.split('\n')) {
                const actionMatch = line.trim().match(actionRegex);
                if (actionMatch) {
                    actions.push('ACTION: ' + actionMatch[1].trim());
                } else {
                    cleanLines.push(line);
                }
            }
            const cleanContent = cleanLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

            if (!cleanContent) {
                continue;
            }

            let resolvedReplyTo = msg.replyTo || null;
            if (!resolvedReplyTo && sanitized.quoteHints.length > 0) {
                const resolvedQuote = resolveQuoteReplyTarget(history, {
                    ...sanitized.quoteHints[0],
                    replyContent: cleanContent
                }, contact, { allowContentFallback: false });
                if (resolvedQuote && resolvedQuote.replyTo) {
                    resolvedReplyTo = resolvedQuote.replyTo;
                }
            }

            finalMessages.push({
                ...msg,
                type: '消息',
                content: cleanContent,
                ...(msg && msg.translatedContent ? { translatedContent: normalizeBilingualTranslatedText(msg.translatedContent) } : {}),
                replyTo: resolvedReplyTo
            });
        }
        messagesList = finalMessages;

        // 处理指令
        let imageToSend = null;
        let hasTransferred = false;
        
        const momentRegex = /ACTION:\s*POST_MOMENT:\s*(.*?)(?:\n|$)/;
        const forumPostRegex = /ACTION:\s*POST_FORUM:\s*(.*?)(?:\n|$)/;
        const startForumLiveRegex = /ACTION:\s*START_FORUM_LIVE:\s*(.*?)(?:\n|$)/;
        const icityDiaryRegex = /ACTION:\s*POST_ICITY_DIARY:\s*(.*?)(?:\n|$)/;
        const editIcityBookRegex = /ACTION:\s*EDIT_ICITY_BOOK:\s*(.*?)(?:\n|$)/;
        const likeRegex = /ACTION:\s*LIKE_MOMENT(?:\s*|$)/;
        const commentRegex = /ACTION:\s*COMMENT_MOMENT:\s*(.*?)(?:\n|$)/;
        const sendImageRegex = /ACTION:\s*SEND_IMAGE:\s*(.*?)(?:\n|$)/;
        const sendStickerRegex = /ACTION:\s*SEND_STICKER:\s*(.*?)(?:\n|$)/;
        const startVoiceCallRegex = /ACTION:\s*START_VOICE_CALL(?:\s*|$)/;
        const startVideoCallRegex = /ACTION:\s*START_VIDEO_CALL(?:\s*|$)/;
        const transferRegex = /ACTION:\s*TRANSFER:\s*(\d+(?:\.\d{1,2})?)\s*(.*?)(?:\n|$)/;
        const acceptTransferRegex = /ACTION:\s*ACCEPT_TRANSFER:\s*(\d+)(?:\n|$)/;
        const returnTransferRegex = /ACTION:\s*RETURN_TRANSFER:\s*(\d+)(?:\n|$)/;
        const familyCardDecisionRegex = /ACTION:\s*FAMILY_CARD_DECISION:\s*(.*?)(?:\n|$)/;
        const payForRequestRegex = /ACTION:\s*PAY_FOR_REQUEST:\s*(.*?)(?:\n|$)/;
        const savingsDepositRegex = /ACTION:\s*SAVINGS_DEPOSIT:\s*(.*?)(?:\n|$)/;
        const sendGiftRegex = /ACTION:\s*SEND_GIFT:\s*(.*?)(?:\n|$)/;
        const sendDeliveryRegex = /ACTION:\s*SEND_DELIVERY:\s*(.*?)(?:\n|$)/;
        const updateNameRegex = /ACTION:\s*UPDATE_NAME:\s*(.*?)(?:\n|$)/;
        const updateWxidRegex = /ACTION:\s*UPDATE_WXID:\s*(.*?)(?:\n|$)/;
        const updateSignatureRegex = /ACTION:\s*UPDATE_SIGNATURE:\s*(.*?)(?:\n|$)/;
        const updateAvatarRegex = /ACTION:\s*UPDATE_AVATAR(?:\s*:\s*(.*?))?(?:\n|$)/;
        const quoteMessageRegex = /ACTION:\s*QUOTE_MESSAGE:\s*(.*?)(?:\n|$)/;
        const recordUserStateRegex = /ACTION:\s*RECORD_USER_STATE:\s*(.*?)(?:\n|$)/;
        const resolveUserStateRegex = /ACTION:\s*RESOLVE_USER_STATE:\s*(.*?)(?:\n|$)/;
        const screenActionRegex = /ACTION:\s*(SCREEN_TAP|SCREEN_TYPE)\s*:\s*(.*?)(?:\n|$)/g;
        const recordContactStateRegex = /ACTION:\s*RECORD_CONTACT_STATE:\s*(.*?)(?:\n|$)/;
        const resolveContactStateRegex = /ACTION:\s*RESOLVE_CONTACT_STATE:\s*(.*?)(?:\n|$)/;
        const sendVoiceRegex = /ACTION:\s*SEND_VOICE:\s*(\d+)\s*(.*?)(?:\n|$)/;
        const msClickRegex = /ACTION:\s*MINESWEEPER_CLICK:\s*(\d+)\s*,\s*(\d+)(?:\n|$)/;
        const msFlagRegex = /ACTION:\s*MINESWEEPER_FLAG:\s*(\d+)\s*,\s*(\d+)(?:\n|$)/;
        const witchGuessRegex = /ACTION:\s*WITCH_GUESS:\s*(\d+)\s*,\s*(\d+)(?:\n|$)/;

        const recordImportantStateRegex = /ACTION:\s*RECORD_IMPORTANT_STATE:\s*(.*?)(?:\n|$)/;
        const screenTapRegex = /ACTION:\s*SCREEN_TAP:\s*(.*?)(?:\n|$)/;
        const pddCashHelpRegex = /ACTION:\s*PDD_CASH_HELP(?:\s*|$)/;
        const pddBargainHelpRegex = /ACTION:\s*PDD_BARGAIN_HELP:\s*(.*?)(?:\n|$)/;
        const musicSendInviteRegex = /ACTION:\s*MUSIC_SEND_INVITE(?:\s*:\s*(.*?))?(?:\n|$)/;
        const musicInviteDecisionRegex = /ACTION:\s*MUSIC_INVITE_DECISION:\s*(.*?)(?:\n|$)/;
        const musicTogetherPauseRegex = /ACTION:\s*MUSIC_TOGETHER_PAUSE(?:\s*:\s*(.*?))?(?:\n|$)/;
        const musicTogetherResumeRegex = /ACTION:\s*MUSIC_TOGETHER_RESUME(?:\s*:\s*(.*?))?(?:\n|$)/;
        const musicTogetherNextRegex = /ACTION:\s*MUSIC_TOGETHER_NEXT(?:\s*:\s*(.*?))?(?:\n|$)/;
        const musicTogetherPrevRegex = /ACTION:\s*MUSIC_TOGETHER_PREV(?:\s*:\s*(.*?))?(?:\n|$)/;
        const musicTogetherSearchPlayRegex = /ACTION:\s*MUSIC_TOGETHER_SEARCH_PLAY(?:\s*:\s*(.*?))?(?:\n|$)/;
        const musicTogetherQuitRegex = /ACTION:\s*MUSIC_TOGETHER_QUIT(?:\s*:\s*(.*?))?(?:\n|$)/;

        let replyToObj = null;
        let hasUpdatedName = false;
        let hasUpdatedWxid = false;
        let hasUpdatedSignature = false;
        let hasFamilyCardDecision = false;
        let hasShownSavingsPlanMissingToast = false;
        let hasMusicInviteSent = false;
        let hasMusicInviteDecision = false;

        const inlineStateActionSpecs = [
            { regex: recordUserStateRegex, owner: 'user', mode: 'record', command: 'RECORD_USER_STATE' },
            { regex: resolveUserStateRegex, owner: 'user', mode: 'resolve', command: 'RESOLVE_USER_STATE' },
            { regex: recordContactStateRegex, owner: 'contact', mode: 'record', command: 'RECORD_CONTACT_STATE' },
            { regex: resolveContactStateRegex, owner: 'contact', mode: 'resolve', command: 'RESOLVE_CONTACT_STATE' },
            { regex: recordImportantStateRegex, owner: 'user', mode: 'record', command: 'RECORD_IMPORTANT_STATE' }
        ];

        const normalizeInlineStateActionContent = (text) => String(text || '')
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[，。！？、,.!?:;"'“”‘’（）()【】\[\]{}<>《》\-—_]/g, '');

        const areInlineStateActionsSimilar = (left, right) => {
            if (!left || !right) return false;
            if (left.owner !== right.owner) return false;
            if (left.reasonType !== right.reasonType) return false;
            const leftText = normalizeInlineStateActionContent(left.content);
            const rightText = normalizeInlineStateActionContent(right.content);
            if (!leftText || !rightText) return false;
            return leftText === rightText || leftText.includes(rightText) || rightText.includes(leftText);
        };

        const collectInlineStateActions = (segments) => {
            const collected = [];
            const strippedSegments = Array.isArray(segments) ? segments.map(segment => {
                let processedSegment = segment;
                inlineStateActionSpecs.forEach(spec => {
                    let stateMatch;
                    while ((stateMatch = processedSegment.match(spec.regex)) !== null) {
                        const parsed = typeof window.parseInlineStatePayload === 'function'
                            ? window.parseInlineStatePayload(stateMatch[1])
                            : null;
                        if (parsed && parsed.content) {
                            collected.push({
                                mode: spec.mode,
                                owner: spec.owner,
                                command: spec.command,
                                reasonType: parsed.reasonType || 'other',
                                content: parsed.content
                            });
                        }
                        processedSegment = processedSegment.replace(stateMatch[0], '');
                    }
                });
                return processedSegment;
            }) : [];
            return {
                collected,
                strippedSegments
            };
        };

        const finalizeInlineStateActions = (stateActions) => {
            const deduped = [];
            const seen = new Set();

            (Array.isArray(stateActions) ? stateActions : []).forEach(action => {
                if (!action || !action.content) return;
                const dedupeKey = [
                    action.mode,
                    action.owner,
                    action.reasonType || 'other',
                    normalizeInlineStateActionContent(action.content)
                ].join('|');
                if (seen.has(dedupeKey)) return;
                seen.add(dedupeKey);
                deduped.push(action);
            });

            const finalized = [];
            ['user', 'contact'].forEach(owner => {
                const ownerActions = deduped.filter(action => action.owner === owner);
                const resolveAction = ownerActions.find(action => action.mode === 'resolve') || null;
                const recordAction = ownerActions.find(action => action.mode === 'record') || null;

                if (resolveAction) finalized.push(resolveAction);
                if (recordAction && (!resolveAction || !areInlineStateActionsSimilar(resolveAction, recordAction))) {
                    finalized.push(recordAction);
                }
            });
            return finalized;
        };

        const inlineStateResult = collectInlineStateActions(actions);
        actions = inlineStateResult.strippedSegments.filter(segment => String(segment || '').trim());
        const inlineStateActions = finalizeInlineStateActions(inlineStateResult.collected);

        if (typeof window.applyInlineStateResolve === 'function') {
            inlineStateActions
                .filter(action => action.mode === 'resolve')
                .forEach(action => {
                    window.applyInlineStateResolve(contact.id, action.owner, action.reasonType, action.content);
                });
        }
        if (typeof window.applyInlineStateRecord === 'function') {
            inlineStateActions
                .filter(action => action.mode === 'record')
                .forEach(action => {
                    window.applyInlineStateRecord(contact.id, action.owner, action.reasonType, action.content);
                });
        }

        for (let i = 0; i < actions.length; i++) {
            let segment = actions[i];
            let processedSegment = segment;

            let pddCashHelpMatch;
            while ((pddCashHelpMatch = processedSegment.match(pddCashHelpRegex)) !== null) {
                if (window.processPddHelp) {
                    setTimeout(() => window.processPddHelp('cash', null), 1000);
                }
                processedSegment = processedSegment.replace(pddCashHelpMatch[0], '');
            }

            const orderedScreenActions = [];
            processedSegment = processedSegment.replace(screenActionRegex, (fullMatch, actionName, rawPayload) => {
                const normalizedActionName = String(actionName || '').trim().toUpperCase();
                const actionPayload = (rawPayload || '').trim();
                if (normalizedActionName && actionPayload) {
                    orderedScreenActions.push({
                        action: normalizedActionName,
                        payload: actionPayload
                    });
                }
                return '';
            });
            orderedScreenActions.forEach(screenAction => {
                if (typeof window.executeAIScreenAction === 'function') {
                    window.executeAIScreenAction(screenAction.action, screenAction.payload);
                }
            });


            const handleMusicTogetherAction = async (actionName, actionPayload) => {
                if (typeof window.musicV2HandleTogetherRemoteAction !== 'function') {
                    setTimeout(() => {
                        sendMessage('[系统消息]: 音乐模块暂不可用，无法执行一起听控制', false, 'text', null, contact.id);
                    }, 220);
                    return;
                }
                try {
                    const result = await window.musicV2HandleTogetherRemoteAction(contact.id, actionName, actionPayload || '');
                    if (!result || !result.ok) {
                        const failText = result && result.message ? String(result.message) : '一起听控制执行失败';
                        setTimeout(() => {
                            sendMessage('[系统消息]: ' + failText, false, 'text', null, contact.id);
                        }, 220);
                        return;
                    }
                    // Success path should also be visible as system tip in chat.
                    let successText = result && result.message ? String(result.message) : '一起听操作已执行';
                    if (actionName === 'MUSIC_TOGETHER_NEXT' || actionName === 'MUSIC_TOGETHER_PREV') {
                        if (result && result.songTitle) successText = successText + '：' + String(result.songTitle);
                    } else if (actionName === 'MUSIC_TOGETHER_SEARCH_PLAY') {
                        if (result && result.songTitle) successText = '已搜索并播放：' + String(result.songTitle);
                    } else if (actionName === 'MUSIC_TOGETHER_PAUSE') {
                        successText = '对方已暂停播放';
                    } else if (actionName === 'MUSIC_TOGETHER_RESUME') {
                        successText = '对方已继续播放';
                    }
                    // Quit already sends a dedicated system message from music module; avoid duplicate tips.
                    if (actionName !== 'MUSIC_TOGETHER_QUIT') {
                        setTimeout(() => {
                            sendMessage('[系统消息]: ' + successText, false, 'text', null, contact.id);
                        }, 220);
                    }
                } catch (error) {
                    setTimeout(() => {
                        sendMessage('[系统消息]: 一起听控制执行失败，请稍后重试', false, 'text', null, contact.id);
                    }, 220);
                }
            };

            let musicTogetherPauseMatch;
            while ((musicTogetherPauseMatch = processedSegment.match(musicTogetherPauseRegex)) !== null) {
                await handleMusicTogetherAction('MUSIC_TOGETHER_PAUSE', (musicTogetherPauseMatch[1] || '').trim());
                processedSegment = processedSegment.replace(musicTogetherPauseMatch[0], '');
            }

            let musicTogetherResumeMatch;
            while ((musicTogetherResumeMatch = processedSegment.match(musicTogetherResumeRegex)) !== null) {
                await handleMusicTogetherAction('MUSIC_TOGETHER_RESUME', (musicTogetherResumeMatch[1] || '').trim());
                processedSegment = processedSegment.replace(musicTogetherResumeMatch[0], '');
            }

            let musicTogetherNextMatch;
            while ((musicTogetherNextMatch = processedSegment.match(musicTogetherNextRegex)) !== null) {
                await handleMusicTogetherAction('MUSIC_TOGETHER_NEXT', (musicTogetherNextMatch[1] || '').trim());
                processedSegment = processedSegment.replace(musicTogetherNextMatch[0], '');
            }

            let musicTogetherPrevMatch;
            while ((musicTogetherPrevMatch = processedSegment.match(musicTogetherPrevRegex)) !== null) {
                await handleMusicTogetherAction('MUSIC_TOGETHER_PREV', (musicTogetherPrevMatch[1] || '').trim());
                processedSegment = processedSegment.replace(musicTogetherPrevMatch[0], '');
            }

            let musicTogetherSearchPlayMatch;
            while ((musicTogetherSearchPlayMatch = processedSegment.match(musicTogetherSearchPlayRegex)) !== null) {
                await handleMusicTogetherAction('MUSIC_TOGETHER_SEARCH_PLAY', (musicTogetherSearchPlayMatch[1] || '').trim());
                processedSegment = processedSegment.replace(musicTogetherSearchPlayMatch[0], '');
            }

            let musicTogetherQuitMatch;
            while ((musicTogetherQuitMatch = processedSegment.match(musicTogetherQuitRegex)) !== null) {
                await handleMusicTogetherAction('MUSIC_TOGETHER_QUIT', (musicTogetherQuitMatch[1] || '').trim());
                processedSegment = processedSegment.replace(musicTogetherQuitMatch[0], '');
            }

            let musicSendInviteMatch;
            while ((musicSendInviteMatch = processedSegment.match(musicSendInviteRegex)) !== null) {
                const payloadRaw = (musicSendInviteMatch[1] || '').trim();
                console.log('[music-v2][invite-debug][ai]', 'command:MUSIC_SEND_INVITE', {
                    contactId: contact.id,
                    payload: payloadRaw
                });
                if (typeof window.musicV2HandleChatSendInviteAction === 'function') {
                    try {
                        const result = await window.musicV2HandleChatSendInviteAction(contact.id, payloadRaw);
                        if (result && result.ok) {
                            hasMusicInviteSent = true;
                            console.log('[music-v2][invite-debug][ai]', 'command:MUSIC_SEND_INVITE:ok', result);
                        } else {
                            const message = (result && result.message)
                                ? String(result.message)
                                : '一起听邀请发送失败，请稍后重试';
                            console.warn('[music-v2][invite-debug][ai]', 'command:MUSIC_SEND_INVITE:fail', {
                                result: result,
                                message: message
                            });
                            setTimeout(() => {
                                sendMessage('[系统消息]: ' + message, false, 'text', null, contact.id);
                            }, 280);
                        }
                    } catch (error) {
                        console.error('[music-v2][invite-debug][ai]', 'command:MUSIC_SEND_INVITE:error', error);
                        setTimeout(() => {
                            sendMessage('[系统消息]: 一起听邀请发送失败，请稍后重试', false, 'text', null, contact.id);
                        }, 280);
                    }
                } else {
                    console.warn('[music-v2][invite-debug][ai]', 'command:MUSIC_SEND_INVITE:missing-handler');
                    setTimeout(() => {
                        sendMessage('[系统消息]: 音乐模块暂不可用，无法发起一起听邀请', false, 'text', null, contact.id);
                    }, 280);
                }
                processedSegment = processedSegment.replace(musicSendInviteMatch[0], '');
            }

            let musicInviteDecisionMatch;
            while ((musicInviteDecisionMatch = processedSegment.match(musicInviteDecisionRegex)) !== null) {
                const payloadRaw = (musicInviteDecisionMatch[1] || '').trim();
                const pendingInvite = (typeof window.musicV2GetPendingInviteForContact === 'function')
                    ? window.musicV2GetPendingInviteForContact(contact.id)
                    : null;
                let inviteId = '';
                let decisionText = '';
                if (payloadRaw.includes('|')) {
                    const parts = payloadRaw.split('|').map(s => s.trim()).filter(Boolean);
                    inviteId = parts[0] || '';
                    decisionText = parts.slice(1).join(' ') || '';
                } else {
                    const parts = payloadRaw.split(/\s+/).map(s => s.trim()).filter(Boolean);
                    if (parts.length >= 2) {
                        inviteId = parts[0];
                        decisionText = parts.slice(1).join(' ');
                    } else {
                        decisionText = payloadRaw;
                    }
                }
                if (!inviteId && pendingInvite && pendingInvite.inviteId) {
                    inviteId = pendingInvite.inviteId;
                }
                const normalizedDecision = /同意|接受|可以|accept|agree|yes|一起听/i.test(decisionText)
                    ? 'accepted'
                    : (/拒绝|不同意|改天|没空|忙|reject|decline|no/i.test(decisionText) ? 'rejected' : '');
                if (inviteId && normalizedDecision && typeof window.musicV2HandleInviteDecision === 'function') {
                    const handled = window.musicV2HandleInviteDecision(contact.id, inviteId, normalizedDecision);
                    if (handled) hasMusicInviteDecision = true;
                }
                processedSegment = processedSegment.replace(musicInviteDecisionMatch[0], '');
            }

            let quoteMessageMatch;
            while ((quoteMessageMatch = processedSegment.match(quoteMessageRegex)) !== null) {
                const quoteContent = quoteMessageMatch[1].trim();
                if (quoteContent) {
                    let targetMsg = findBestQuoteTargetMessage(history, quoteContent);
                    if (!targetMsg) {
                        for (let j = history.length - 1; j >= 0; j--) {
                            const msg = history[j];
                            if (msg.role === 'user' && typeof msg.content === 'string' && msg.content.trim()) {
                                targetMsg = msg;
                                break;
                            }
                        }
                    }
                    if (targetMsg) {
                        let targetName = '未知';
                        if (targetMsg.role === 'user') {
                            targetName = '我';
                            if (contact.userPersonaId) {
                                const p = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
                                if (p) targetName = p.name;
                            } else if (window.iphoneSimState.userProfile) {
                                targetName = window.iphoneSimState.userProfile.name;
                            }
                        } else {
                            targetName = contact.remark || contact.name;
                        }
                        replyToObj = buildReplyToPayloadFromMessage(targetMsg, contact, targetName);
                    }
                }
                processedSegment = processedSegment.replace(quoteMessageMatch[0], '');
            }

            let updateNameMatch;
            while ((updateNameMatch = processedSegment.match(updateNameRegex)) !== null) {
                const newName = updateNameMatch[1].trim();
                if (newName && !hasUpdatedName) {
                    contact.nickname = newName;
                    if (!contact.remark) {
                        document.getElementById('chat-title').textContent = newName;
                    }
                    saveConfig();
                    if (window.renderContactList) window.renderContactList();
                    setTimeout(() => sendMessage(`[系统消息]: 对方更改了网名为 "${newName}"`, false, 'text'), 500);
                    hasUpdatedName = true;
                }
                processedSegment = processedSegment.replace(updateNameMatch[0], '');
            }

            let updateWxidMatch;
            while ((updateWxidMatch = processedSegment.match(updateWxidRegex)) !== null) {
                const newWxid = updateWxidMatch[1].trim();
                if (newWxid && !hasUpdatedWxid) {
                    contact.wxid = newWxid;
                    saveConfig();
                    setTimeout(() => sendMessage(`[系统消息]: 对方更改了微信号`, false, 'text'), 500);
                    hasUpdatedWxid = true;
                }
                processedSegment = processedSegment.replace(updateWxidMatch[0], '');
            }

            let updateSignatureMatch;
            while ((updateSignatureMatch = processedSegment.match(updateSignatureRegex)) !== null) {
                const newSignature = updateSignatureMatch[1].trim();
                if (newSignature && !hasUpdatedSignature) {
                    contact.signature = newSignature;
                    saveConfig();
                    setTimeout(() => sendMessage(`[系统消息]: 对方更改了个性签名`, false, 'text'), 500);
                    hasUpdatedSignature = true;
                }
                processedSegment = processedSegment.replace(updateSignatureMatch[0], '');
            }

            let updateAvatarMatch;
            while ((updateAvatarMatch = processedSegment.match(updateAvatarRegex)) !== null) {
                const avatarPayload = (updateAvatarMatch[1] || '').trim();
                const lastImageMsg = resolveAvatarUpdateTargetImage(history, avatarPayload);

                if (lastImageMsg && lastImageMsg.content) {
                    setTimeout(async () => {
                        let nextAvatar = lastImageMsg.content;
                        if (typeof window.isChatMediaReference === 'function' && window.isChatMediaReference(nextAvatar)) {
                            nextAvatar = await window.resolveChatMediaDataUrl(nextAvatar) || await window.resolveChatMediaSrc(nextAvatar) || nextAvatar;
                        }

                        contact.avatar = nextAvatar;
                        saveConfig();
                        if (window.renderContactList) window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
                        renderChatHistory(contact.id, true);
                        sendMessage(`[系统消息]: 对方更换了头像`, false, 'text');
                    }, 500);
                } else if (avatarPayload) {
                    console.warn('UPDATE_AVATAR payload did not resolve to a user image.', {
                        contactId: contact.id,
                        payload: avatarPayload
                    });
                }
                processedSegment = processedSegment.replace(updateAvatarMatch[0], '');
            }

            let momentMatch;
            while ((momentMatch = processedSegment.match(momentRegex)) !== null) {
                const momentPayload = (momentMatch[1] || '').trim();
                if (momentPayload) {
                    const parsedMoment = typeof window.parseMomentPayload === 'function'
                        ? window.parseMomentPayload(momentPayload)
                        : { content: momentPayload, images: [] };
                    if (window.addMoment) window.addMoment(contact.id, parsedMoment.content, parsedMoment.images);
                }
                processedSegment = processedSegment.replace(momentMatch[0], '');
            }

            let icityDiaryMatch;
            while ((icityDiaryMatch = processedSegment.match(icityDiaryRegex)) !== null) {
                const diaryContent = icityDiaryMatch[1].trim();
                if (diaryContent) {
                    if (window.addIcityPost) window.addIcityPost(contact.id, diaryContent, 'friends');
                }
                processedSegment = processedSegment.replace(icityDiaryMatch[0], '');
            }

            let editIcityBookMatch;
            while ((editIcityBookMatch = processedSegment.match(editIcityBookRegex)) !== null) {
                const content = editIcityBookMatch[1].trim();
                if (content) {
                    if (window.writeToIcityBook) window.writeToIcityBook(contact.id, content);
                }
                processedSegment = processedSegment.replace(editIcityBookMatch[0], '');
            }

            let likeMatch;
            while ((likeMatch = processedSegment.match(likeRegex)) !== null) {
                const userMoments = window.iphoneSimState.moments.filter(m => m.contactId === 'me');
                if (userMoments.length > 0) {
                    const latestMoment = userMoments.sort((a, b) => b.time - a.time)[0];
                    const aiName = contact.remark || contact.name;
                    if (!latestMoment.likes || !latestMoment.likes.includes(aiName)) {
                        if (window.toggleLike) window.toggleLike(latestMoment.id, aiName);
                    }
                }
                processedSegment = processedSegment.replace(likeMatch[0], '');
            }

            let commentMatch;
            while ((commentMatch = processedSegment.match(commentRegex)) !== null) {
                const commentContent = commentMatch[1].trim();
                const userMoments = window.iphoneSimState.moments.filter(m => m.contactId === 'me');
                if (userMoments.length > 0 && commentContent) {
                    const latestMoment = userMoments.sort((a, b) => b.time - a.time)[0];
                    const aiName = contact.remark || contact.name;
                    if (window.submitComment) window.submitComment(latestMoment.id, commentContent, null, aiName);
                }
                processedSegment = processedSegment.replace(commentMatch[0], '');
            }

            let forumPostMatch;
            while ((forumPostMatch = processedSegment.match(forumPostRegex)) !== null) {
                const postContent = forumPostMatch[1].trim();
                if (postContent && window.addForumPost) {
                    window.addForumPost(contact.id, postContent, []);
                }
                processedSegment = processedSegment.replace(forumPostMatch[0], '');
            }

            let startLiveMatch;
            while ((startLiveMatch = processedSegment.match(startForumLiveRegex)) !== null) {
                const parsedLive = window.parseStartForumLivePayload ? window.parseStartForumLivePayload(startLiveMatch[1]) : null;
                const liveTitle = parsedLive?.title || (startLiveMatch[1] || '').trim() || '';
                const liveActionDesc = parsedLive?.actionDesc || '';
                const liveBgUrl = parsedLive?.bgUrl || null;
                const liveInitialComments = parsedLive?.initialComments || [];
                const liveViewers = parsedLive?.viewers || '';
                if (window.createForumLiveStream) {
                    window.createForumLiveStream(contact.id, liveTitle, liveActionDesc, liveBgUrl, liveInitialComments, liveViewers);
                }
                processedSegment = processedSegment.replace(startLiveMatch[0], '');
            }

            let sendImageMatch;
            while ((sendImageMatch = processedSegment.match(sendImageRegex)) !== null) {
                const imageDesc = sendImageMatch[1].trim();
                if (imageDesc) {
                    imageToSend = { type: 'virtual_image', content: imageDesc };
                }
                processedSegment = processedSegment.replace(sendImageMatch[0], '');
            }

            let sendStickerMatch;
            while ((sendStickerMatch = processedSegment.match(sendStickerRegex)) !== null) {
                const stickerDesc = sendStickerMatch[1].trim();
                if (stickerDesc) {
                    const stickerAsset = resolveStickerAssetForContact(contact, stickerDesc);
                    if (stickerAsset) {
                        imageToSend = { type: 'sticker', content: stickerAsset.url, desc: stickerAsset.desc || stickerDesc };
                    }
                }
                processedSegment = processedSegment.replace(sendStickerMatch[0], '');
            }

            let startVoiceCallMatch;
            while ((startVoiceCallMatch = processedSegment.match(startVoiceCallRegex)) !== null) {
                setTimeout(() => {
                    startIncomingCall(contact);
                }, 1500);
                processedSegment = processedSegment.replace(startVoiceCallMatch[0], '');
            }

            let startVideoCallMatch;
            while ((startVideoCallMatch = processedSegment.match(startVideoCallRegex)) !== null) {
                setTimeout(() => {
                    startIncomingVideoCall(contact);
                }, 1500);
                processedSegment = processedSegment.replace(startVideoCallMatch[0], '');
            }

            let sendVoiceMatch;
            while ((sendVoiceMatch = processedSegment.match(sendVoiceRegex)) !== null) {
                const duration = sendVoiceMatch[1];
                const text = sendVoiceMatch[2].trim();
                if (text) {
                    setTimeout(() => {
                        const voiceData = {
                            duration: parseInt(duration),
                            text: text,
                            isReal: false,
                            audio: null
                        };
                        sendMessage(JSON.stringify(voiceData), false, 'voice');
                    }, 1500);
                }
                processedSegment = processedSegment.replace(sendVoiceMatch[0], '');
            }

            let msClickMatch;
            while ((msClickMatch = processedSegment.match(msClickRegex)) !== null) {
                const r = msClickMatch[1];
                const c = msClickMatch[2];
                if (window.handleAiMinesweeperMove) {
                    window.handleAiMinesweeperMove('CLICK', r, c);
                }
                processedSegment = processedSegment.replace(msClickMatch[0], '');
            }

            let msFlagMatch;
            while ((msFlagMatch = processedSegment.match(msFlagRegex)) !== null) {
                const r = msFlagMatch[1];
                const c = msFlagMatch[2];
                if (window.handleAiMinesweeperMove) {
                    window.handleAiMinesweeperMove('FLAG', r, c);
                }
                processedSegment = processedSegment.replace(msFlagMatch[0], '');
            }

            let witchGuessMatch;
            while ((witchGuessMatch = processedSegment.match(witchGuessRegex)) !== null) {
                const r = witchGuessMatch[1];
                const c = witchGuessMatch[2];
                if (window.handleAiWitchGuess) {
                    // Delay slightly to look natural
                    setTimeout(() => {
                        window.handleAiWitchGuess(r, c);
                    }, 1000);
                }
                processedSegment = processedSegment.replace(witchGuessMatch[0], '');
            }

            let transferMatch;
            while ((transferMatch = processedSegment.match(transferRegex)) !== null) {
                if (!hasTransferred) {
                    const amount = transferMatch[1];
                    const remark = transferMatch[2].trim();
                    setTimeout(() => {
                        const transferId = Date.now() + Math.floor(Math.random() * 1000);
                        sendMessage(JSON.stringify({ id: transferId, amount, remark: remark || '转账给您', status: 'pending' }), false, 'transfer');
                    }, 1000);
                    hasTransferred = true;
                }
                processedSegment = processedSegment.replace(transferMatch[0], '');
            }

            let acceptTransferMatch;
            while ((acceptTransferMatch = processedSegment.match(acceptTransferRegex)) !== null) {
                const transferId = parseInt(acceptTransferMatch[1]);
                if (transferId) {
                    setTimeout(() => {
                        if (window.updateTransferStatus) window.updateTransferStatus(transferId, 'accepted');
                        sendMessage('[系统消息]: 对方已收款', false, 'text');
                    }, 1000);
                }
                processedSegment = processedSegment.replace(acceptTransferMatch[0], '');
            }

            let returnTransferMatch;
            while ((returnTransferMatch = processedSegment.match(returnTransferRegex)) !== null) {
                const transferId = parseInt(returnTransferMatch[1]);
                if (transferId) {
                    setTimeout(() => {
                        if (window.updateTransferStatus) window.updateTransferStatus(transferId, 'returned');
                        if (window.handleAiReturnTransfer) window.handleAiReturnTransfer(transferId);
                        sendMessage('[系统消息]: 转账已退还', false, 'text');
                    }, 1000);
                }
                processedSegment = processedSegment.replace(returnTransferMatch[0], '');
            }

            let familyCardDecisionMatch;
            while ((familyCardDecisionMatch = processedSegment.match(familyCardDecisionRegex)) !== null) {
                const payload = familyCardDecisionMatch[1].trim();
                if (payload && window.handleFamilyCardDecisionAction) {
                    const handled = window.handleFamilyCardDecisionAction(payload, contact.id, { sendText: false });
                    if (handled) hasFamilyCardDecision = true;
                }
                processedSegment = processedSegment.replace(familyCardDecisionMatch[0], '');
            }

            let payForRequestMatch;
            while ((payForRequestMatch = processedSegment.match(payForRequestRegex)) !== null) {
                const requestId = payForRequestMatch[1].trim();
                if (requestId) {
                    const history = window.iphoneSimState.chatHistory[contact.id] || [];
                    let targetMsg = null;
                    for (let j = history.length - 1; j >= 0; j--) {
                        const msg = history[j];
                        if (msg.type === 'pay_request') {
                            let data = null;
                            try { data = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content; } catch(e){}
                            if (data && data.id === requestId) {
                                targetMsg = msg;
                                break;
                            }
                        }
                    }

                    if (targetMsg) {
                        setTimeout(() => {
                            let data = typeof targetMsg.content === 'string' ? JSON.parse(targetMsg.content) : targetMsg.content;
                            if (data.status !== 'paid') {
                                data.status = 'paid';
                                targetMsg.content = JSON.stringify(data);
                                if (window.handlePayForRequest) {
                                    window.handlePayForRequest(requestId, contact.name, data);
                                }
                                saveConfig();
                                renderChatHistory(contact.id, true);
                                sendMessage('[系统消息]: 对方已帮你付款', false, 'text');
                            }
                        }, 1500);
                    }
                }
                processedSegment = processedSegment.replace(payForRequestMatch[0], '');
            }

            let savingsDepositMatch;
            while ((savingsDepositMatch = processedSegment.match(savingsDepositRegex)) !== null) {
                const payloadRaw = (savingsDepositMatch[1] || '').trim();
                const parts = payloadRaw.split('|').map(s => s.trim());
                const amountRaw = parts[0] || '';
                const note = parts.slice(1).join(' | ');
                const validAmount = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amountRaw);
                const amount = validAmount ? Number(amountRaw) : NaN;

                if (!Number.isFinite(amount) || amount <= 0) {
                    processedSegment = processedSegment.replace(savingsDepositMatch[0], '');
                    continue;
                }

                const plan = getSavingsPlanByPeerContactId(contact.id);
                if (!plan) {
                    if (!hasShownSavingsPlanMissingToast && window.showChatToast) {
                        showChatToast('未找到该联系人的共同存钱计划');
                        hasShownSavingsPlanMissingToast = true;
                    }
                    processedSegment = processedSegment.replace(savingsDepositMatch[0], '');
                    continue;
                }

                const normalizedAmount = Number(amount.toFixed(2));
                const handled = applySavingsPeerDeposit(plan, normalizedAmount, note, contact.id);
                if (handled && typeof sendMessage !== 'undefined') {
                    const noteText = note ? `（备注：${note}）` : '';
                    const systemNotice = `[系统消息]: 对方往共同存钱转入了¥${normalizedAmount.toFixed(2)}${noteText}`;
                    setTimeout(() => {
                        sendMessage(systemNotice, false, 'text', null, contact.id);
                    }, 800);
                }
                processedSegment = processedSegment.replace(savingsDepositMatch[0], '');
            }

            let sendGiftMatch;
            while ((sendGiftMatch = processedSegment.match(sendGiftRegex)) !== null) {
                const payload = sendGiftMatch[1].trim();
                const parts = payload.split('|').map(s => s.trim());
                if (parts.length >= 2) {
                    const title = parts[0];
                    const price = parseFloat(parts[1]) || 0;
                    const remark = parts[2] || '';
                    
                    // 生成占位图
                    let imgUrl = '';
                    if (typeof generatePlaceholderImage === 'function') {
                        let bgColor = '#FF9500';
                        if (window.getRandomPastelColor) {
                            bgColor = window.getRandomPastelColor();
                        }
                        imgUrl = generatePlaceholderImage(300, 300, title, bgColor);
                    } else {
                        imgUrl = 'https://placehold.co/300x300/FF9500/ffffff?text=' + encodeURIComponent(title);
                    }

                    const giftData = {
                        items: [{
                            title: title,
                            price: price,
                            image: imgUrl,
                            isDelivery: false
                        }],
                        total: price.toFixed(2),
                        remark: remark
                    };
                    
                    setTimeout(() => {
                        sendMessage(JSON.stringify(giftData), false, 'shopping_gift', null, contact.id);
                    }, 1000);
                }
                processedSegment = processedSegment.replace(sendGiftMatch[0], '');
            }

            let sendDeliveryMatch;
            while ((sendDeliveryMatch = processedSegment.match(sendDeliveryRegex)) !== null) {
                const payload = sendDeliveryMatch[1].trim();
                const parts = payload.split('|').map(s => s.trim());
                if (parts.length >= 2) {
                    const title = parts[0];
                    const price = parseFloat(parts[1]) || 0;
                    const remark = parts[2] || '';
                    
                    let imgUrl = '';
                    if (typeof generatePlaceholderImage === 'function') {
                        imgUrl = generatePlaceholderImage(300, 300, title, '#007AFF');
                    } else {
                        imgUrl = 'https://placehold.co/300x300/007AFF/ffffff?text=' + encodeURIComponent(title);
                    }

                    const deliveryData = {
                        items: [{
                            title: title,
                            price: price,
                            image: imgUrl,
                            isDelivery: true
                        }],
                        total: price.toFixed(2),
                        remark: remark
                    };
                    
                    setTimeout(() => {
                        sendMessage(JSON.stringify(deliveryData), false, 'delivery_share', null, contact.id);
                    }, 1000);
                }
                processedSegment = processedSegment.replace(sendDeliveryMatch[0], '');
            }
        }

        const pendingMusicInvite = (!hasMusicInviteDecision && typeof window.musicV2GetPendingInviteForContact === 'function')
            ? window.musicV2GetPendingInviteForContact(contact.id)
            : null;
        const shouldAutoResolvePendingMusicInvite = !!(
            pendingMusicInvite &&
            pendingMusicInvite.inviteId &&
            String(pendingMusicInvite.direction || 'outgoing') !== 'incoming' &&
            !hasMusicInviteSent
        );
        if (shouldAutoResolvePendingMusicInvite && typeof window.musicV2HandleInviteDecision === 'function') {
            const textForDecision = messagesList
                .filter(msg => msg && (msg.type === '消息' || msg.type === 'text') && typeof msg.content === 'string')
                .map(msg => msg.content)
                .join(' ');
            let fallbackDecision = '';
            if (/同意|接受|可以|好啊|来吧|一起听|accept|agree|yes|sure/i.test(textForDecision)) {
                fallbackDecision = 'accepted';
            } else if (/拒绝|不同意|改天|下次|没空|忙|不方便|reject|decline|no/i.test(textForDecision)) {
                fallbackDecision = 'rejected';
            } else {
                fallbackDecision = 'rejected';
            }
            const handled = window.musicV2HandleInviteDecision(contact.id, pendingMusicInvite.inviteId, fallbackDecision);
            if (handled) hasMusicInviteDecision = true;
        }

        const pendingFamilyCard = findLatestPendingFamilyCard(contact.id);
        if (pendingFamilyCard && !hasFamilyCardDecision) {
            const fallback = deriveFamilyDecisionFromMessages(messagesList);
            const payload = `${pendingFamilyCard.data.id} | ${fallback.status === 'accepted' ? '同意' : '拒绝'} | ${fallback.monthlyLimit || 0}`;
            if (window.handleFamilyCardDecisionAction) {
                const handled = window.handleFamilyCardDecisionAction(payload, contact.id, { sendText: false });
                if (handled) hasFamilyCardDecision = true;
            }
        }

        if (hasFamilyCardDecision) {
            const familyDecisionTextRegex = /(亲属卡|每月额度|月额度|开亲属卡|同意给你|不办亲属卡)/;
            messagesList = messagesList.filter(msg => {
                const msgType = msg && (msg.type || '').toLowerCase();
                const isTextLike = msgType === 'text' || msgType === '消息' || !msgType;
                const content = String(msg && msg.content ? msg.content : '');
                return !(isTextLike && familyDecisionTextRegex.test(content));
            });
        }

        if (thoughtContent && contact.showThought) {
            updateThoughtBubble(thoughtContent);
        }

        const getSpeakerAwareReplyDelay = (currentMsg, nextMsg) => {
            if (!nextMsg) return 0;
            const currentSpeaker = normalizeAiMessageSpeaker(currentMsg && currentMsg.speaker);
            const nextSpeaker = normalizeAiMessageSpeaker(nextMsg && nextMsg.speaker);

            if (!currentSpeaker && nextSpeaker === 'fire-buddy') {
                return 420 + Math.random() * 240;
            }
            if (currentSpeaker === 'fire-buddy' && nextSpeaker === 'fire-buddy') {
                return 220 + Math.random() * 180;
            }
            if (currentSpeaker === 'fire-buddy' && !nextSpeaker) {
                return 520 + Math.random() * 280;
            }

            if (contact.replyIntervalMin !== undefined && contact.replyIntervalMin !== null && 
                contact.replyIntervalMax !== undefined && contact.replyIntervalMax !== null) {
                const min = contact.replyIntervalMin;
                const max = Math.max(contact.replyIntervalMax, min);
                return min + Math.random() * (max - min);
            }

            return (currentMsg === messagesList[0])
                ? (900 + Math.random() * 1300)
                : (400 + Math.random() * 400);
        };

        // 逐条发送消息
        for (let i = 0; i < messagesList.length; i++) {
            const msg = messagesList[i];
            const currentThought = (i === messagesList.length - 1) ? thoughtContent : null;
            const currentReplyTo = msg.replyTo || ((i === 0) ? replyToObj : null);
            const speaker = normalizeAiMessageSpeaker(msg && msg.speaker);
            const bilingualTranslationMeta = buildBilingualTranslationMeta(contact, msg && msg.translatedContent);

            if ((msg.type === '消息' || msg.type === 'text') && typeof window.replaceGenericFireBuddyMention === 'function') {
                msg.content = window.replaceGenericFireBuddyMention(msg.content, contactId);
            }

            if (speaker === 'fire-buddy' && typeof window.pushFireBuddySpeakerMessage === 'function') {
                const fireBuddyText = String(msg && msg.content || '').trim();
                if (fireBuddyText) {
                    window.pushFireBuddySpeakerMessage(fireBuddyText, contactId, {
                        replyTo: currentReplyTo,
                        bilingualTranslation: bilingualTranslationMeta
                    });
                }

                if (i < messagesList.length - 1) {
                    const delay = getSpeakerAwareReplyDelay(msg, messagesList[i + 1]);
                    await new Promise(r => setTimeout(r, delay));
                }
                continue;
            }

            // 检查用户是否仍在当前聊天界面
            const isChatOpen = !document.getElementById('chat-screen').classList.contains('hidden');
            const isSameContact = window.iphoneSimState.currentChatContactId === contact.id;
            const shouldShowInChat = isChatOpen && isSameContact;

            if (shouldShowInChat) {
                // 如果用户在聊天界面但页面被隐藏/最小化，仍然发送系统通知
                    if (document.hidden) {
                        let notifContent = msg.content;
                        if (msg.type === '表情包') notifContent = '[表情包]';
                        else if (msg.type === '图片') notifContent = '[图片]';
                        else if (msg.type === '语音') notifContent = '[语音]';
                        else if (msg.type === 'family_card') notifContent = '[亲属卡]';
                        else if (msg.type === 'savings_invite') notifContent = '[共同存钱邀请]';
                        else if (msg.type === 'savings_withdraw_request') notifContent = '[共同存钱转出申请]';
                        else if (msg.type === 'savings_progress') notifContent = '[共同存钱进度]';
                        else if (msg.type === 'music_listen_invite') notifContent = '[一起听邀请]';
                        else if (msg.type === 'virtual_image') notifContent = '[图片]';
                        else if (msg.type === 'sticker') notifContent = '[表情包]';
                    
                    sendSystemNotification(contact, notifContent);
                }

                // 用户在聊天界面，使用打字机效果或直接发送
                if (msg.type === '消息' || msg.type === 'text') {
                    await typewriterEffect(msg.content, contact.avatar, currentThought, currentReplyTo, 'text', contactId, {
                        bilingualTranslation: bilingualTranslationMeta
                    });
                } else if (msg.type === '表情包' || msg.type === 'sticker') {
                    const stickerAsset = resolveStickerAssetForContact(contact, msg.content);
                    if (stickerAsset) {
                        sendMessage(stickerAsset.url, false, 'sticker', stickerAsset.desc || msg.content, contactId);
                    } else {
                        // 找不到表情包，直接忽略，不发送文本 fallback，以免破坏沉浸感
                        console.warn(`Sticker not found: ${msg.content}`);
                    }
                } else if (msg.type === '语音' || msg.type === 'voice') {
                    let duration = 3;
                    let text = msg.content;
                    
                    if (typeof msg.content === 'string') {
                        const parts = msg.content.match(/(\d+)\s+(.*)/);
                        if (parts) {
                            duration = parseInt(parts[1]);
                            text = parts[2];
                        }
                    }
                    
                    const voiceData = {
                        duration: duration,
                        text: text,
                        isReal: false
                    };
                    sendMessage(JSON.stringify(voiceData), false, 'voice', null, contactId);
                } else if (msg.type === '图片' || msg.type === 'image' || msg.type === 'virtual_image') {
                    let sent = false;
                    const rawImageContent = typeof msg.content === 'string' ? msg.content.trim() : '';
                    const imageFallbackText = rawImageContent && !/^(?:未知图片|\[图片\]|图片)$/i.test(rawImageContent)
                        ? `[图片] ${rawImageContent}`
                        : '[图片]';
                    const novelaiSettings = window.iphoneSimState.novelaiSettings;
                    const globalEnabled = novelaiSettings && novelaiSettings.enabled !== false;

                    if (isLikelyChatImageUrl(rawImageContent)) {
                        sendMessage(rawImageContent, false, 'image', msg.description || null, contactId);
                        sent = true;
                    }
                    
                    if (!sent && globalEnabled && window.generateNovelAiImageApi && contact.novelaiPreset) {
                        let finalPrompt = "";
                        let presetName = contact.novelaiPreset;
                        let preset = null;
    
                        if (presetName === 'AUTO_MATCH') {
                            const type = detectImageType(imageToSend.content);
                            const presets = window.iphoneSimState.novelaiPresets || [];
                            preset = presets.find(p => p.type === type);
                            if (!preset && type !== 'general') {
                                preset = presets.find(p => p.type === 'general');
                            }
                        } else {
                            preset = (window.iphoneSimState.novelaiPresets || []).find(p => p.name === presetName);
                        }
                        
                        if (preset && preset.settings && preset.settings.prompt) {
                            finalPrompt += preset.settings.prompt;
                        } else if (novelaiSettings.defaultPrompt) {
                            finalPrompt += novelaiSettings.defaultPrompt;
                        }

                        // Removed persona splicing to avoid polluting prompt with chat style settings
                        // if (contact.persona) {
                        //     finalPrompt += ", " + (contact.persona || "").replace(/\n/g, ", ");
                        // }

                        // 优先使用 AI 提供的翻译好的 prompt
                        if (msg.prompt) {
                            finalPrompt += ", " + msg.prompt;
                        } else if (msg.content) {
                            finalPrompt += ", " + optimizePromptForNovelAI(msg.content);
                        }

                        try {
                            const genOptions = {
                                key: novelaiSettings.key,
                                model: (preset && preset.settings && preset.settings.model) || novelaiSettings.model,
                                prompt: finalPrompt,
                                negativePrompt: (preset && preset.settings && preset.settings.negativePrompt) || novelaiSettings.negativePrompt,
                                steps: (preset && preset.settings && preset.settings.steps) || novelaiSettings.steps,
                                scale: (preset && preset.settings && preset.settings.scale) || novelaiSettings.cfg,
                                seed: (preset && preset.settings && preset.settings.seed) !== undefined ? preset.settings.seed : -1,
                                width: (preset && preset.settings && preset.settings.width) || 832,
                                height: (preset && preset.settings && preset.settings.height) || 1216
                            };

                            // 先发送占位图片以占据正确的历史记录顺序
                            const placeholderUrl = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Generating...';
                            const placeholderMsg = sendMessage(placeholderUrl, false, 'virtual_image', msg.content, contactId);
                            
                            appendMessageToUI('[系统]: 正在生成图片...', false, 'system', null, null, null, null, false);

                            window.generateNovelAiImageApi(genOptions).then(base64Image => {
                                // 图片生成成功，直接更新占位消息，而不是发送新消息
                                if (placeholderMsg) {
                                    placeholderMsg.type = 'image';
                                    placeholderMsg.content = base64Image;
                                    placeholderMsg.novelaiPrompt = finalPrompt;
                                    placeholderMsg.novelaiNegativePrompt = genOptions.negativePrompt;
                                    saveConfig();
                                    
                                    // 刷新界面以显示新图片，并保持滚动位置
                                    if (window.renderChatHistory) renderChatHistory(contactId, true);
                                }
                            }).catch(err => {
                                console.error("NovelAI Gen Error", err);
                                appendMessageToUI(`[系统]: 生图失败 - ${err.message}`, false, 'system', null, null, null, null, false);
                                // 失败时占位符保持为 virtual_image，无需额外处理，或可更新为错误图
                            });
                            
                            sent = true;

                        } catch (e) {
                            console.error("NovelAI Setup Error", e);
                            appendMessageToUI(`[系统]: 生图配置错误 - ${e.message}`, false, 'text', null, null, null, null, false);
                        }
                    }

                    if (!sent) {
                        const failReason = [];
                        if (!contact.novelaiPreset) failReason.push("未选择预设");
                        else if (!globalEnabled) failReason.push("全局开关未开启");
                        
                        if (!window.generateNovelAiImageApi) failReason.push("生图模块未加载");
                        if (!novelaiSettings || !novelaiSettings.key) failReason.push("API Key缺失");

                        if (failReason.length > 0) {
                            appendMessageToUI(`[系统诊断]: 无法生成图片 - ${failReason.join('; ')}`, false, 'text', null, null, null, null, false);
                        }

                        sendMessage(imageFallbackText, false, 'text', null, contactId);
                    }
                } else if (msg.type === '旁白' || msg.type === 'description') {
                    await typewriterEffect(msg.content, contact.avatar, null, null, 'description', contactId);
                }
            } else {
                // 用户不在聊天界面，后台保存并弹窗
                let contentToSave = msg.content;
                let typeToSave = 'text';
                
                if (msg.type === '消息' || msg.type === 'text') {
                    typeToSave = 'text';
                } else if (msg.type === '表情包' || msg.type === 'sticker') {
                    const stickerAsset = resolveStickerAssetForContact(contact, msg.content);
                    if (!stickerAsset) {
                        console.warn(`Sticker not found: ${msg.content}`);
                        continue;
                    }
                    contentToSave = stickerAsset.url;
                    typeToSave = 'sticker';
                } else if (msg.type === '语音' || msg.type === 'voice') {
                    let duration = 3;
                    let text = msg.content;
                    
                    if (typeof msg.content === 'string') {
                        const parts = msg.content.match(/(\d+)\s+(.*)/);
                        if (parts) {
                            duration = parseInt(parts[1]);
                            text = parts[2];
                        }
                    }

                    const voiceData = {
                        duration: duration,
                        text: text,
                        isReal: false
                    };
                    contentToSave = JSON.stringify(voiceData);
                    typeToSave = 'voice';
                } else if (msg.type === '图片' || msg.type === 'image' || msg.type === 'virtual_image') {
                    const rawImageContent = typeof msg.content === 'string' ? msg.content.trim() : '';
                    if (isLikelyChatImageUrl(rawImageContent)) {
                        contentToSave = rawImageContent;
                        typeToSave = 'image';
                    } else {
                        contentToSave = rawImageContent && !/^(?:未知图片|\[图片\]|图片)$/i.test(rawImageContent)
                            ? `[图片] ${rawImageContent}`
                            : '[图片]';
                        typeToSave = 'text';
                    }
                } else if (msg.type === '旁白' || msg.type === 'description') {
                    typeToSave = 'description';
                }

                // 保存到历史记录
                if (!window.iphoneSimState.chatHistory[contact.id]) {
                    window.iphoneSimState.chatHistory[contact.id] = [];
                }
                
                const msgData = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    time: Date.now(),
                    role: 'assistant',
                    content: contentToSave,
                    type: typeToSave,
                    replyTo: currentReplyTo
                };
                
                if (currentThought) {
                    msgData.thought = currentThought;
                }

                if (typeToSave === 'text' && bilingualTranslationMeta) {
                    msgData.bilingualTranslation = {
                        sourceLang: bilingualTranslationMeta.sourceLang,
                        targetLang: bilingualTranslationMeta.targetLang,
                        translatedText: bilingualTranslationMeta.translatedText
                    };
                }
                
                if (msg.type === '图片' || msg.type === 'sticker') {
                    msgData.description = msg.content; // 保存描述
                }

                window.iphoneSimState.chatHistory[contact.id].push(msgData);
                if (typeof window.updateContactRestStateOnAssistantMessage === 'function') {
                    window.updateContactRestStateOnAssistantMessage(contact.id, contentToSave, typeToSave, msgData.time);
                }
                saveConfig();

                if (typeToSave === 'text' && window.WhisperChallenge && typeof window.WhisperChallenge.checkAiMessage === 'function') {
                    window.WhisperChallenge.checkAiMessage(contentToSave, {
                        contactId: contact.id,
                        contactName: contact.remark || contact.name || '',
                        type: typeToSave
                    });
                }

                if (window.syncToFloatingChat && window.isScreenSharing) {
                    console.log('[ScreenShare Debug] sync background assistant reply to floating', {
                        contactId: contact.id,
                        type: typeToSave,
                        preview: String(contentToSave || '').slice(0, 120)
                    });
                    window.syncToFloatingChat({
                        content: contentToSave,
                        type: typeToSave,
                        role: 'assistant'
                    }, contact.id);
                    if (typeof window.loadFloatingChatHistory === 'function') {
                        window.loadFloatingChatHistory();
                    }
                }
                
                // 触发通知
                let notificationText = contentToSave;
                if (typeToSave === 'sticker') notificationText = '[表情包]';
                if (typeToSave === 'virtual_image' || typeToSave === 'image') notificationText = '[图片]';
                if (typeToSave === 'voice') notificationText = '[语音]';
                if (typeToSave === 'family_card') notificationText = '[亲属卡]';
                if (typeToSave === 'savings_invite') notificationText = '[共同存钱邀请]';
                if (typeToSave === 'savings_withdraw_request') notificationText = '[共同存钱转出申请]';
                if (typeToSave === 'savings_progress') notificationText = '[共同存钱进度]';
                if (typeToSave === 'music_listen_invite') notificationText = '[一起听邀请]';
                
                showChatNotification(contact.id, notificationText);
                
                // 刷新联系人列表以更新预览
                if (window.renderContactList) {
                    // 只有当联系人列表可见时才刷新，或者强制刷新
                    window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
                }
            }

            // 模拟间隔
            if (i < messagesList.length - 1) {
                const delay = getSpeakerAwareReplyDelay(msg, messagesList[i + 1]);
                await new Promise(r => setTimeout(r, delay));
            }
        }
        await new Promise(r => setTimeout(r, 500));

        if (imageToSend) {
            if (imageToSend.type === 'virtual_image') {
                let sent = false;
                const novelaiSettings = window.iphoneSimState.novelaiSettings;
                const globalEnabled = novelaiSettings && novelaiSettings.enabled !== false;
                
                if (globalEnabled && window.generateNovelAiImageApi && contact.novelaiPreset) {
                    let finalPrompt = "";
                    let presetName = contact.novelaiPreset;
                    let preset = null;

                    if (presetName === 'AUTO_MATCH') {
                        const type = detectImageType(msg.content);
                        const presets = window.iphoneSimState.novelaiPresets || [];
                        preset = presets.find(p => p.type === type);
                        if (!preset && type !== 'general') {
                            preset = presets.find(p => p.type === 'general');
                        }
                    } else {
                        preset = (window.iphoneSimState.novelaiPresets || []).find(p => p.name === presetName);
                    }
                    
                    if (preset && preset.settings && preset.settings.prompt) {
                        finalPrompt += preset.settings.prompt;
                    } else if (novelaiSettings.defaultPrompt) {
                        finalPrompt += novelaiSettings.defaultPrompt;
                    }

                    // Removed persona splicing
                    // if (contact.persona) {
                    //     finalPrompt += ", " + (contact.persona || "").replace(/\n/g, ", ");
                    // }

                    // 优先使用 AI 提供的翻译好的 prompt
                    if (imageToSend.prompt) {
                        finalPrompt += ", " + imageToSend.prompt;
                    } else if (imageToSend.content) {
                        finalPrompt += ", " + optimizePromptForNovelAI(imageToSend.content);
                    }

                    try {
                        const genOptions = {
                            key: novelaiSettings.key,
                            model: (preset && preset.settings && preset.settings.model) || novelaiSettings.model,
                            prompt: finalPrompt,
                            negativePrompt: (preset && preset.settings && preset.settings.negativePrompt) || novelaiSettings.negativePrompt,
                            steps: (preset && preset.settings && preset.settings.steps) || novelaiSettings.steps,
                            scale: (preset && preset.settings && preset.settings.scale) || novelaiSettings.cfg,
                            seed: (preset && preset.settings && preset.settings.seed) !== undefined ? preset.settings.seed : -1,
                            width: (preset && preset.settings && preset.settings.width) || 832,
                            height: (preset && preset.settings && preset.settings.height) || 1216
                        };

                        // 先发送占位图片
                        const placeholderUrl = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Generating...';
                        const placeholderMsg = sendMessage(placeholderUrl, false, 'virtual_image', imageToSend.content, contactId);

                        // 直接调用当前作用域内的函数
                        appendMessageToUI('[系统]: 正在生成图片...', false, 'system', null, null, null, null, false);

                        window.generateNovelAiImageApi(genOptions).then(base64Image => {
                            // 更新占位消息
                            if (placeholderMsg) {
                                placeholderMsg.type = 'image';
                                placeholderMsg.content = base64Image;
                                placeholderMsg.novelaiPrompt = finalPrompt;
                                placeholderMsg.novelaiNegativePrompt = genOptions.negativePrompt;
                                saveConfig();
                                
                                if (window.renderChatHistory) renderChatHistory(contactId, true);
                            }
                        }).catch(err => {
                            console.error("NovelAI Gen Error", err);
                            appendMessageToUI(`[系统]: 生图API错误 - ${err.message}`, false, 'system', null, null, null, null, false);
                        });
                        
                        sent = true;

                    } catch (e) {
                        console.error("NovelAI Setup Error", e);
                        appendMessageToUI(`[系统]: 生图配置错误 - ${e.message}`, false, 'text', null, null, null, null, false);
                    }
                }

                if (!sent) {
                    // 增强诊断：显示所有未满足的条件
                    const failReason = [];
                    if (!contact.novelaiPreset) failReason.push("未选择预设");
                    else if (!globalEnabled) failReason.push("全局开关未开启");
                    
                    if (!window.generateNovelAiImageApi) failReason.push("生图模块未加载");
                    if (!novelaiSettings || !novelaiSettings.key) failReason.push("API Key缺失");

                    // 只要是 virtual_image 类型，即使没预设，也提示一下（可能是用户忘了配）
                    // 或者是配置了但其他条件不满足
                    if (failReason.length > 0) {
                        appendMessageToUI(`[系统诊断]: 无法生成图片 - ${failReason.join('; ')}`, false, 'text', null, null, null, null, false);
                    }
                    
                    const defaultImageUrl = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
                    sendMessage(defaultImageUrl, false, 'virtual_image', imageToSend.content, contactId);
                }
            } else if (imageToSend.type === 'sticker') {
                sendMessage(imageToSend.content, false, 'sticker', imageToSend.desc, contactId);
            }
        }

    } catch (error) {
        console.error('AI生成失败:', error);
        const errorMessage = `AI生成失败: ${error.message}，请检查配置和API状态`;
        if (typeof window.showChatToast === 'function') {
            window.showChatToast(errorMessage, 3500);
        } else {
            alert(`AI生成失败: ${error.message}\n请检查配置和API状态`);
        }
    } finally {
        if (window.__chatAiReplyLocks) {
            delete window.__chatAiReplyLocks[contactId];
        }
        const currentContact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
        if (titleEl && currentContact) {
            titleEl.textContent = currentContact.remark || currentContact.name;
        } else if (titleEl) {
            titleEl.textContent = originalTitle;
        }
    }
}

// Helper function to detect image type from text
function detectImageType(text) {
    if (!text) return 'general';
    if (/(吃|喝|美食|美味|food|dish|meal|好吃|蛋糕|面|饭|菜)/i.test(text)) return 'food';
    if (/(风景|景色|山|水|scenery|landscape|view|sky|cloud|sea|forest|outside|nature)/i.test(text)) return 'scenery';
    if (/(房间|屋|室|room|indoor|house|living|bedroom|bed)/i.test(text)) return 'scene';
    if (/(我|你|他|她|人|脸|看|girl|boy|man|woman|face|eye|hair|body|looking)/i.test(text)) return 'portrait';
    return 'general';
}

// Helper function to optimize natural language prompts for NovelAI
function optimizePromptForNovelAI(text) {
    if (!text) return "";
    
    // 1. 特殊样例优化 (针对用户提供的具体例子)
    const specificCase = "一张从下往上拍的自拍，我正躺在床上，没穿上衣，被子乱糟糟地堆在肩膀周围。黑色的头发有点乱，垂在额前，有几缕贴在皮肤上。光线很暗，只有手机屏幕的光照亮了我的脸和锁骨，能隐约看到那个小小的爱心纹身。我睡眼惺忪地看着镜头，嘴唇微微张着。";
    // 放宽匹配条件
    if (text.includes("从下往上拍") && text.includes("自拍") || text.includes(specificCase.substr(0, 10))) {
        return "selfie, from below, lying on bed, shirtless, messy bed sheet, messy black hair, hair over forehead, dim light, phone screen light, light on face, collarbone, small heart tattoo, sleepy eyes, looking at viewer, parted lips, messy hair, upper body, realistic, 4k, best quality";
    }

    // 2. 通用优化
    let processed = text;
    
    // 过滤可能包含在 prompt 中的中文聊天设定 (简单 heuristcs)
    // 移除括号内容，因为它们往往是动作或状态描述 (e.g. (微笑), (开心))，如果不是 Tag 格式
    // processed = processed.replace(/\（[^)]*\）/g, ''); // 慎用，可能会误删 Tag
    
    // 替换中文标点为英文逗号
    processed = processed.replace(/[，。、；！\n]/g, ', ');
    
    // 移除常见中文冗余词
    const removeWords = ['一张', '图片描述[:：]?', '生成', '画', '一个', '样子', '照片'];
    removeWords.forEach(w => {
        processed = processed.replace(new RegExp(w, 'g'), '');
    });
    
    // 关键词映射表 (扩充)
    const keywords = [
        { cn: '自拍', en: 'selfie' },
        { cn: '全身', en: 'full body' },
        { cn: '上半身', en: 'upper body' },
        { cn: '特写', en: 'close up' },
        { cn: '背景', en: 'background' },
        { cn: '夜晚', en: 'night' },
        { cn: '白天', en: 'day' },
        { cn: '微笑', en: 'smile' },
        { cn: '大笑', en: 'laughing' },
        { cn: '哭泣', en: 'crying' },
        { cn: '生气', en: 'angry' },
        { cn: '害羞', en: 'blush' },
        { cn: '长发', en: 'long hair' },
        { cn: '短发', en: 'short hair' },
        { cn: '卷发', en: 'curly hair' },
        { cn: '直发', en: 'straight hair' },
        { cn: '黑发', en: 'black hair' },
        { cn: '金发', en: 'blonde hair' },
        { cn: '白发', en: 'white hair' },
        { cn: '红发', en: 'red hair' },
        { cn: '蓝发', en: 'blue hair' },
        { cn: '粉发', en: 'pink hair' },
        { cn: '眼睛', en: 'eyes' },
        { cn: '蓝眼', en: 'blue eyes' },
        { cn: '红眼', en: 'red eyes' },
        { cn: '衬衫', en: 'shirt' },
        { cn: 'T恤', en: 't-shirt' },
        { cn: '裙子', en: 'dress' },
        { cn: '制服', en: 'uniform' },
        { cn: '西装', en: 'suit' },
        { cn: '泳装', en: 'swimsuit' },
        { cn: '猫耳', en: 'cat ears' },
        { cn: '眼镜', en: 'glasses' },
        // 新增扩充
        { cn: '方亦楷', en: '1boy, solo, male focus' }, // 针对特定角色名
        { cn: '单手', en: 'one hand' },
        { cn: '举着', en: 'holding' },
        { cn: '手机', en: 'phone, smartphone, holding phone' },
        { cn: '从下往上', en: 'from below' },
        { cn: '仰拍', en: 'low angle' },
        { cn: '凌乱', en: 'messy hair' },
        { cn: '额前', en: 'bangs' },
        { cn: '发丝', en: 'hair strands' },
        { cn: '汗', en: 'sweat, wet skin' },
        { cn: '脸颊', en: 'cheeks' },
        { cn: '昏暗', en: 'dim lighting' },
        { cn: '灯光', en: 'lighting' },
        { cn: '鼻梁', en: 'nose' },
        { cn: '下颌', en: 'jawline' },
        { cn: '阴影', en: 'shadow, chiaroscuro' },
        { cn: '深邃', en: 'defined features' },
        { cn: '眉', en: 'eyebrows' },
        { cn: '蹙', en: 'frowning' },
        { cn: '琥珀色', en: 'amber' },
        { cn: '不耐烦', en: 'annoyed' },
        { cn: '疲惫', en: 'tired' },
        { cn: '嘴', en: 'mouth, lips' },
        { cn: '弧度', en: 'smirk' },
        { cn: '黑色', en: 'black' },
        { cn: 'oversized', en: 'oversized' },
        { cn: '锁骨', en: 'collarbone' },
        { cn: '工作室', en: 'studio, indoor' }
    ];
    
    keywords.forEach(kw => {
        if (processed.includes(kw.cn)) {
            processed = processed.replace(new RegExp(kw.cn, 'g'), kw.en);
        }
    });

    // 清理多余的逗号和空格
    processed = processed.replace(/,+/g, ',').replace(/\s+/g, ' ').replace(/^,/, '').replace(/,$/, '').trim();

    return processed;
}




function cloneAiPromptHistoryMessage(message) {
    if (!message || typeof message !== 'object') return message;
    return {
        ...message,
        replyTo: message.replyTo && typeof message.replyTo === 'object'
            ? { ...message.replyTo }
            : message.replyTo
    };
}

function estimateAiTextTokens(text) {
    if (typeof text !== 'string' || !text) return 0;

    let total = 0;
    for (let i = 0; i < text.length;) {
        const char = text[i];

        if (/\s/.test(char)) {
            i += 1;
            continue;
        }

        if (/[A-Za-z0-9_]/.test(char)) {
            let end = i + 1;
            while (end < text.length && /[A-Za-z0-9_]/.test(text[end])) {
                end += 1;
            }
            total += Math.ceil((end - i) / 4);
            i = end;
            continue;
        }

        if (/[\x00-\x7F]/.test(char)) {
            total += 1;
            i += 1;
            continue;
        }

        const codePoint = text.codePointAt(i);
        total += 1;
        i += codePoint > 0xFFFF ? 2 : 1;
    }

    return total;
}

function collectAiPromptContentStats(content) {
    const stats = {
        textTokens: 0,
        imageCount: 0,
        screenShareCount: 0,
        screenShareImageCount: 0
    };

    if (typeof content === 'string') {
        stats.textTokens = estimateAiTextTokens(content);
        return stats;
    }

    if (!Array.isArray(content)) {
        return stats;
    }

    let inScreenShareSection = false;
    content.forEach(part => {
        if (!part) return;

        if (part.type === 'text') {
            const text = typeof part.text === 'string' ? part.text : String(part.text || '');
            if (text === '【当前共享屏幕补充】') {
                stats.screenShareCount += 1;
                inScreenShareSection = true;
            }
            stats.textTokens += estimateAiTextTokens(text);
            return;
        }

        if (part.type === 'image_url') {
            if (inScreenShareSection) {
                stats.screenShareImageCount += 1;
            } else {
                stats.imageCount += 1;
            }
        }
    });

    return stats;
}

function appendAiPromptPart(parts, group, label, content) {
    const normalizedContent = trimWechatPromptSection(content);
    if (!normalizedContent) return;
    parts.push({ group, label, content: normalizedContent });
}

function buildWechatStickerPrompt(contact) {
    if (!(window.iphoneSimState.stickerCategories && window.iphoneSimState.stickerCategories.length > 0)) {
        return '';
    }

    let activeStickers = [];
    let hasLinkedCategories = false;

    if (Array.isArray(contact.linkedStickerCategories)) {
        if (contact.linkedStickerCategories.length > 0) {
            hasLinkedCategories = true;
            window.iphoneSimState.stickerCategories.forEach(cat => {
                if (contact.linkedStickerCategories.includes(cat.id)) {
                    activeStickers = activeStickers.concat(cat.list);
                }
            });
        } else {
            hasLinkedCategories = true;
        }
    }

    if (!hasLinkedCategories && !contact.linkedStickerCategories) {
        window.iphoneSimState.stickerCategories.forEach(cat => {
            activeStickers = activeStickers.concat(cat.list);
        });
    }

    if (activeStickers.length > 0) {
        const descriptions = activeStickers.map(s => s.desc).join(', ');
        return `【可用表情包列表】\n${descriptions}\n只能使用上面列出的名称，且必须完全匹配；如果列表里没有合适的表情包，就不要输出 sticker_message，改用文字回复。`;
    }

    return '【可用表情包列表】\n（当前没有可用的表情包）\n当前不要输出 sticker_message，请仅使用文字或其他非表情包类型。';
}

function buildWechatWorldbookPrompt(contact, history) {
    if (!(window.iphoneSimState.worldbook && window.iphoneSimState.worldbook.length > 0)) {
        return '';
    }

    let activeEntries = window.iphoneSimState.worldbook.filter(e => e.enabled);

    if (contact.linkedWbCategories) {
        activeEntries = activeEntries.filter(e => contact.linkedWbCategories.includes(e.categoryId));
    }

    if (activeEntries.length === 0) {
        return '';
    }

    const historyText = history.map(h => h.content).join('\n');
    const matchedContents = [];
    activeEntries.forEach(entry => {
        let shouldAdd = false;
        if (entry.keys && entry.keys.length > 0) {
            shouldAdd = entry.keys.some(key => historyText.includes(key));
        } else {
            shouldAdd = true;
        }

        if (shouldAdd) {
            matchedContents.push(entry.content);
        }
    });

    if (matchedContents.length === 0) {
        return '';
    }

    return `世界书信息：\n${matchedContents.join('\n')}`;
}

window.estimateAiTextTokens = estimateAiTextTokens;

window.buildAiPromptTokenPreview = async function(contactId, options = {}) {
    const emptySections = {
        systemBase: { label: '系统基础', tokens: 0, messageCount: 0 },
        memory: { label: '记忆', tokens: 0, messageCount: 0 },
        worldbook: { label: '世界书', tokens: 0, messageCount: 0 },
        context: { label: '聊天上下文', tokens: 0, messageCount: 0 },
        extra: { label: '场景附加', tokens: 0, messageCount: 0 }
    };

    try {
        const instruction = Object.prototype.hasOwnProperty.call(options, 'instruction')
            ? options.instruction
            : null;
        const messages = await window.buildAiPromptMessages(contactId, instruction, options);
        const systemPromptParts = Array.isArray(messages && messages._systemPromptParts)
            ? messages._systemPromptParts
            : [];
        const sections = {
            systemBase: { ...emptySections.systemBase },
            memory: { ...emptySections.memory },
            worldbook: { ...emptySections.worldbook },
            context: { ...emptySections.context },
            extra: { ...emptySections.extra }
        };
        const visualInputs = {
            imageCount: 0,
            screenShareCount: 0,
            screenShareImageCount: 0,
            summary: '未检测到'
        };

        systemPromptParts.forEach(part => {
            const bucket = sections[part && part.group] || sections.systemBase;
            const stats = collectAiPromptContentStats(part && part.content);
            bucket.tokens += stats.textTokens;
            bucket.messageCount += 1;
        });

        (Array.isArray(messages) ? messages : []).slice(1).forEach(message => {
            const bucket = message && message.role === 'system'
                ? sections.extra
                : sections.context;
            const stats = collectAiPromptContentStats(message && message.content);
            bucket.tokens += stats.textTokens;
            bucket.messageCount += 1;
            visualInputs.imageCount += stats.imageCount;
            visualInputs.screenShareCount += stats.screenShareCount;
            visualInputs.screenShareImageCount += stats.screenShareImageCount;
        });

        const visualParts = [];
        if (visualInputs.imageCount > 0) {
            visualParts.push(`${visualInputs.imageCount} 张图片`);
        }
        if (visualInputs.screenShareCount > 0) {
            visualParts.push(`${visualInputs.screenShareCount} 次共享屏幕`);
        }
        visualInputs.summary = visualParts.length > 0 ? visualParts.join(' / ') : '未检测到';

        return {
            status: 'ok',
            totalTextTokens: sections.systemBase.tokens + sections.memory.tokens + sections.worldbook.tokens + sections.context.tokens + sections.extra.tokens,
            sections,
            visualInputs,
            messageCount: Array.isArray(messages) ? messages.length : 0
        };
    } catch (error) {
        return {
            status: 'error',
            totalTextTokens: 0,
            sections: {
                systemBase: { ...emptySections.systemBase },
                memory: { ...emptySections.memory },
                worldbook: { ...emptySections.worldbook },
                context: { ...emptySections.context },
                extra: { ...emptySections.extra }
            },
            visualInputs: {
                imageCount: 0,
                screenShareCount: 0,
                screenShareImageCount: 0,
                summary: '无法估算'
            },
            messageCount: 0,
            error: error && error.message ? error.message : String(error)
        };
    }
};

const CHAT_AMAP_CACHE_TTL = {
    myLocationMs: 30 * 60 * 1000,
    weatherMs: 30 * 60 * 1000,
    geocodeMs: 12 * 60 * 60 * 1000,
    routeMs: 10 * 60 * 1000
};

function ensureChatAmapRuntime() {
    if (!window.iphoneSimState) return null;
    if (!window.iphoneSimState.amapRuntime || typeof window.iphoneSimState.amapRuntime !== 'object') {
        window.iphoneSimState.amapRuntime = {
            myLocation: null,
            lastWeather: {},
            lastResolvedContacts: {},
            lastRoutes: {}
        };
    }
    if (!window.iphoneSimState.amapRuntime.lastWeather || typeof window.iphoneSimState.amapRuntime.lastWeather !== 'object') {
        window.iphoneSimState.amapRuntime.lastWeather = {};
    }
    if (!window.iphoneSimState.amapRuntime.lastResolvedContacts || typeof window.iphoneSimState.amapRuntime.lastResolvedContacts !== 'object') {
        window.iphoneSimState.amapRuntime.lastResolvedContacts = {};
    }
    if (!window.iphoneSimState.amapRuntime.lastRoutes || typeof window.iphoneSimState.amapRuntime.lastRoutes !== 'object') {
        window.iphoneSimState.amapRuntime.lastRoutes = {};
    }
    return window.iphoneSimState.amapRuntime;
}

function persistChatAmapRuntimeSoon() {
    if (typeof saveConfig === 'function') {
        saveConfig().catch(() => {});
    }
}

function isChatAmapCacheFresh(entry, ttlMs) {
    const time = Number(entry && entry.updateTime);
    return Number.isFinite(time) && (Date.now() - time) < ttlMs;
}

function normalizeChatAmapCity(value) {
    if (Array.isArray(value)) return String(value[0] || '').trim();
    return String(value || '').trim();
}

function joinChatAmapText(parts) {
    return parts
        .map(part => String(part || '').trim())
        .filter(Boolean)
        .filter((part, index, arr) => arr.indexOf(part) === index)
        .join(' ');
}

function buildChatAmapLocationQuery(location) {
    if (!location) return '';
    if (typeof location === 'string') return String(location).trim();
    return joinChatAmapText([
        location.country,
        location.province,
        location.city,
        location.district,
        location.detail,
        location.query
    ]);
}

function buildChatAmapShortLabel(meta) {
    if (!meta) return '';
    return joinChatAmapText([
        meta.businessArea,
        meta.poi,
        meta.district,
        meta.city
    ]) || String(meta.formattedAddress || '').trim();
}

async function fetchChatAmapJson(path, params = {}) {
    const settings = window.iphoneSimState && window.iphoneSimState.amapSettings;
    if (!settings || !String(settings.key || '').trim()) {
        throw new Error('AMap Key 未配置');
    }
    const url = new URL(`https://restapi.amap.com${path}`);
    url.searchParams.set('key', String(settings.key || '').trim());
    url.searchParams.set('output', 'json');
    Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, String(value));
        }
    });
    const response = await fetch(url.toString(), { method: 'GET' });
    if (!response.ok) {
        throw new Error(`AMap HTTP ${response.status}`);
    }
    const data = await response.json();
    if (String(data.status || '') !== '1') {
        throw new Error(String(data.info || 'AMap 调用失败'));
    }
    return data;
}

async function getChatAmapMyLocation(force = false) {
    const settings = window.iphoneSimState && window.iphoneSimState.amapSettings;
    if (!settings || !String(settings.key || '').trim()) return null;
    const runtime = ensureChatAmapRuntime();
    if (!force && runtime.myLocation && isChatAmapCacheFresh(runtime.myLocation, CHAT_AMAP_CACHE_TTL.myLocationMs)) {
        return runtime.myLocation;
    }
    if (!navigator.geolocation) return runtime.myLocation || null;
    const coords = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            position => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
            error => reject(error),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
    }).catch(() => null);
    if (!coords) return runtime.myLocation || null;

    const data = await fetchChatAmapJson('/v3/geocode/regeo', {
        location: `${coords.lng},${coords.lat}`,
        extensions: 'all',
        radius: 1000,
        roadlevel: 0
    }).catch(() => null);
    const regeocode = data && data.regeocode ? data.regeocode : null;
    const component = regeocode && regeocode.addressComponent ? regeocode.addressComponent : {};
    const pois = regeocode && Array.isArray(regeocode.pois) ? regeocode.pois : [];
    const businessAreas = component && Array.isArray(component.businessAreas) ? component.businessAreas : [];
    if (!regeocode) return runtime.myLocation || null;

    const myLocation = {
        lat: coords.lat,
        lng: coords.lng,
        formattedAddress: String(regeocode.formatted_address || '').trim(),
        city: normalizeChatAmapCity(component.city) || String(component.province || '').trim(),
        district: String(component.district || '').trim(),
        adcode: String(component.adcode || '').trim(),
        poi: String((pois[0] && pois[0].name) || '').trim(),
        businessArea: String((businessAreas[0] && businessAreas[0].name) || '').trim(),
        updateTime: Date.now()
    };
    myLocation.shortLabel = buildChatAmapShortLabel(myLocation);
    runtime.myLocation = myLocation;
    persistChatAmapRuntimeSoon();
    return myLocation;
}

async function getChatAmapContactLocation(contactId, force = false) {
    const settings = window.iphoneSimState && window.iphoneSimState.amapSettings;
    if (!settings || !String(settings.key || '').trim()) return null;
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return null;
    const runtime = ensureChatAmapRuntime();
    const query = buildChatAmapLocationQuery(contact.location);
    const cached = contact.locationResolved || runtime.lastResolvedContacts[contactId];
    if (!force && cached && cached.query === query && isChatAmapCacheFresh(cached, CHAT_AMAP_CACHE_TTL.geocodeMs)) {
        contact.locationResolved = cached;
        return cached;
    }
    if (!query) return null;

    const data = await fetchChatAmapJson('/v3/geocode/geo', {
        address: query,
        city: contact.location && contact.location.city ? contact.location.city : ''
    }).catch(() => null);
    const geocode = data && Array.isArray(data.geocodes) ? data.geocodes[0] : null;
    if (!geocode || !geocode.location) return cached || null;

    const [lngStr, latStr] = String(geocode.location).split(',');
    const locationResolved = {
        lat: Number(latStr),
        lng: Number(lngStr),
        formattedAddress: String(geocode.formatted_address || query).trim(),
        city: normalizeChatAmapCity(geocode.city) || String(geocode.province || '').trim(),
        district: String(geocode.district || '').trim(),
        adcode: String(geocode.adcode || '').trim(),
        province: String(geocode.province || '').trim(),
        query,
        source: 'amap-geocode',
        updateTime: Date.now()
    };
    locationResolved.shortLabel = buildChatAmapShortLabel(locationResolved);
    runtime.lastResolvedContacts[contactId] = locationResolved;
    contact.locationResolved = locationResolved;
    persistChatAmapRuntimeSoon();
    return locationResolved;
}

async function getChatAmapWeatherForContact(contactId) {
    const contactLocation = await getChatAmapContactLocation(contactId).catch(() => null);
    if (!contactLocation) return null;
    const cityKey = contactLocation.adcode || contactLocation.city || contactLocation.province;
    if (!cityKey) return null;
    const runtime = ensureChatAmapRuntime();
    const cached = runtime.lastWeather[contactId];
    if (cached && cached.target === cityKey && isChatAmapCacheFresh(cached, CHAT_AMAP_CACHE_TTL.weatherMs)) {
        return cached;
    }
    const data = await fetchChatAmapJson('/v3/weather/weatherInfo', {
        city: cityKey,
        extensions: 'base'
    }).catch(() => null);
    const live = data && Array.isArray(data.lives) ? data.lives[0] : null;
    if (!live) return cached || null;
    const weather = {
        target: cityKey,
        province: String(live.province || '').trim(),
        city: String(live.city || '').trim(),
        adcode: String(live.adcode || '').trim(),
        weather: String(live.weather || '').trim(),
        temperature: String(live.temperature || '').trim(),
        winddirection: String(live.winddirection || '').trim(),
        windpower: String(live.windpower || '').trim(),
        humidity: String(live.humidity || '').trim(),
        reporttime: String(live.reporttime || '').trim(),
        updateTime: Date.now()
    };
    runtime.lastWeather[contactId] = weather;
    persistChatAmapRuntimeSoon();
    return weather;
}

async function getChatAmapEtaToContact(contactId, mode = 'driving') {
    const myLocation = await getChatAmapMyLocation(false).catch(() => null);
    const contactLocation = await getChatAmapContactLocation(contactId).catch(() => null);
    if (!myLocation || !contactLocation) return null;

    const runtime = ensureChatAmapRuntime();
    const cacheKey = `${mode}:${myLocation.lng},${myLocation.lat}->${contactLocation.lng},${contactLocation.lat}`;
    const cached = runtime.lastRoutes[contactId];
    if (cached && cached.cacheKey === cacheKey && isChatAmapCacheFresh(cached, CHAT_AMAP_CACHE_TTL.routeMs)) {
        return cached;
    }

    const data = await fetchChatAmapJson('/v3/direction/driving', {
        origin: `${myLocation.lng},${myLocation.lat}`,
        destination: `${contactLocation.lng},${contactLocation.lat}`,
        strategy: 0,
        extensions: 'base'
    }).catch(() => null);
    const path = data && data.route && Array.isArray(data.route.paths) ? data.route.paths[0] : null;
    if (!path) return cached || null;

    const route = {
        cacheKey,
        distanceKm: Number(path.distance || 0) > 0 ? Number((Number(path.distance) / 1000).toFixed(1)) : null,
        etaMin: Number(path.duration || 0) > 0 ? Math.max(1, Math.round(Number(path.duration) / 60)) : null,
        mode,
        originLabel: myLocation.shortLabel || myLocation.formattedAddress || myLocation.city || '我这边',
        destinationLabel: contactLocation.shortLabel || contactLocation.formattedAddress || contactLocation.city || '对方那边',
        updateTime: Date.now()
    };
    runtime.lastRoutes[contactId] = route;
    persistChatAmapRuntimeSoon();
    return route;
}

window.getAmapMyLocation = getChatAmapMyLocation;
window.getAmapContactLocation = getChatAmapContactLocation;
window.getAmapWeatherForContact = getChatAmapWeatherForContact;
window.getAmapEtaToContact = getChatAmapEtaToContact;

window.buildAmapPromptContext = async function(contactId) {
    const settings = window.iphoneSimState && window.iphoneSimState.amapSettings;
    if (!settings || !String(settings.key || '').trim()) return '';
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return '';

    const [myLocation, contactLocation, weather, route] = await Promise.all([
        getChatAmapMyLocation(false).catch(() => null),
        getChatAmapContactLocation(contactId).catch(() => null),
        getChatAmapWeatherForContact(contactId).catch(() => null),
        getChatAmapEtaToContact(contactId).catch(() => null)
    ]);

    const lines = [];
    if (myLocation) {
        lines.push(`- 我当前所在：${myLocation.shortLabel || myLocation.formattedAddress || myLocation.city || '未知位置'}`);
    }
    if (contactLocation) {
        lines.push(`- 对方设定位置：${contactLocation.shortLabel || contactLocation.formattedAddress || contactLocation.city || '未知位置'}`);
    } else if (contact.location && buildChatAmapLocationQuery(contact.location)) {
        lines.push(`- 对方设定位置文本：${buildChatAmapLocationQuery(contact.location)}`);
    }
    if (weather) {
        lines.push(`- 对方那边天气：${joinChatAmapText([weather.city, weather.weather, weather.temperature ? `${weather.temperature}°C` : ''])}`);
    }
    if (route && (route.distanceKm !== null || route.etaMin !== null)) {
        const parts = [];
        if (route.distanceKm !== null) parts.push(`相距约 ${route.distanceKm} km`);
        if (route.etaMin !== null) parts.push(`驾车约 ${route.etaMin} 分钟`);
        lines.push(`- 路线估算：${parts.join('，')}`);
    }

    if (lines.length === 0) return '';
    return `【高德时空信息】\n${lines.join('\n')}\n⚠️ 这些信息只可自然融入聊天，例如提到天气、距离、多久到、商圈或附近；不要每次都主动复述，不要编造精确门牌号。`;
};

window.prefetchAmapChatContext = async function(contactId) {
    try {
        await window.buildAmapPromptContext(contactId);
    } catch (error) {
        console.warn('[AMap] prefetch failed', error);
    }
};

window.buildAiPromptMessages = async function(contactId, instruction = null, options = {}) {
    const baseContact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!baseContact) return [];
    const contact = options && options.contactOverride
        ? { ...baseContact, ...options.contactOverride }
        : baseContact;
    if (typeof window.ensureContactBilingualTranslationFields === 'function') {
        window.ensureContactBilingualTranslationFields(contact);
    }
    const history = window.iphoneSimState.chatHistory[contactId] || [];

    let userPromptInfo = '';
    let currentPersona = null;

    if (contact.userPersonaId) {
        currentPersona = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
    }

    if (currentPersona) {
        userPromptInfo = `\n用户(我)的网名：${currentPersona.name || '未命名'}`;
        const promptContent = contact.userPersonaPromptOverride || currentPersona.aiPrompt;
        if (promptContent) {
            userPromptInfo += `\n用户(我)的人设：${promptContent}`;
        }
    } else if (window.iphoneSimState.userProfile) {
        userPromptInfo = `\n用户(我)的网名：${window.iphoneSimState.userProfile.name}`;
    }

    let momentContext = '';
    const contactMoments = window.iphoneSimState.moments.filter(m => m.contactId === contact.id);
    if (contactMoments.length > 0) {
        const lastMoment = contactMoments.sort((a, b) => b.time - a.time)[0];
        const lastMomentSummary = typeof window.formatMomentSummary === 'function'
            ? window.formatMomentSummary(lastMoment)
            : String(lastMoment.content || '').trim();
        momentContext += `\n【朋友圈状态】\n你最新的一条朋友圈是：“${lastMomentSummary}”\n`;
        
        if (lastMoment.comments && lastMoment.comments.length > 0) {
            const userName = currentPersona ? currentPersona.name : window.iphoneSimState.userProfile.name;
            const userComments = lastMoment.comments.filter(c => c.user === userName);
            if (userComments.length > 0) {
                const lastComment = userComments[userComments.length - 1];
                momentContext += `用户刚刚评论了你的朋友圈：“${lastComment.content}”\n`;
            }
        }
    }

    let icityContext = '';
    if (window.iphoneSimState.icityDiaries && window.iphoneSimState.icityDiaries.length > 0) {
        // Check visibility permissions
        const isLinked = window.iphoneSimState.icityProfile && 
                         window.iphoneSimState.icityProfile.linkedContactIds && 
                         window.iphoneSimState.icityProfile.linkedContactIds.includes(contact.id);
        
        const recentDiaries = window.iphoneSimState.icityDiaries.filter(d => {
            if (d.visibility === 'private') return false;
            // Friends-only posts are visible to linked contacts
            if (d.visibility === 'friends' && !isLinked) return false; 
            return true;
        }).slice(0, 3); // Get last 3

        if (recentDiaries.length > 0) {
            icityContext += '\n【用户最近的 iCity 日记】\n';
            recentDiaries.forEach(d => {
                const date = new Date(d.time);
                const timeStr = `${date.getMonth() + 1}月${date.getDate()}日`;
                icityContext += `[${timeStr}] ${d.content}\n`;
            });
        }
    }

    if (window.iphoneSimState.icityFriendsPosts && window.iphoneSimState.icityFriendsPosts.length > 0) {
        const aiPosts = window.iphoneSimState.icityFriendsPosts.filter(p => p.contactId === contact.id).slice(0, 3);
        if (aiPosts.length > 0) {
            icityContext += '\n【你最近发布的 iCity 动态】\n';
            aiPosts.forEach(p => {
                const date = new Date(p.time);
                const timeStr = `${date.getMonth() + 1}月${date.getDate()}日`;
                icityContext += `[${timeStr}] ${p.content}\n`;
            });
        }
    }

    let importantStateContext = '';
    let memoryContext = '';
    if (typeof window.buildMemoryContextByPolicy === 'function') {
        memoryContext = window.buildMemoryContextByPolicy(contact, history, 'chat-text');
    } else {
        const contactMemories = window.iphoneSimState.memories.filter(m => m.contactId === contact.id);
        if (contactMemories.length > 0) {
            const limit = contact.memorySendLimit && contact.memorySendLimit > 0 ? contact.memorySendLimit : 5;
            const recentMemories = contactMemories.sort((a, b) => (b.time || 0) - (a.time || 0)).slice(0, limit).reverse();
            if (recentMemories.length > 0) {
                memoryContext += '\n【历史记忆 (已知事实)】\n⚠️ 注意：以下内容是你们过去的共同经历或已知事实，请勿重复向用户复述，除非用户主动询问或需要回忆。\n';
                recentMemories.forEach(m => {
                    const date = new Date(m.time || Date.now());
                    const dateStr = `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                    memoryContext += `- [${dateStr}] ${m.content}\n`;
                });
            }
        }
    }

        let timeContext = '';
    let itineraryContext = '';
    if (contact.realTimeVisible) {
        timeContext = buildRealtimeTimeContext(contact.id);
        
        if (window.getCurrentItineraryInfo) {
            itineraryContext = await window.getCurrentItineraryInfo(contact.id);
        }
    }

    const calendarContext = contact.calendarAwareEnabled === false ? '' : buildCalendarPromptContext();

    let amapContext = '';
    try {
        amapContext = await window.buildAmapPromptContext(contact.id);
    } catch (error) {
        amapContext = '';
    }

    let lookusContext = '';
    if (contact.lookusData) {
        const d = contact.lookusData;
        const lastUpdate = d.lastUpdateTime ? new Date(d.lastUpdateTime).toLocaleTimeString() : '未知';
        
        let appUsage = '';
        if (d.appList && d.appList.length > 0) {
            appUsage = '\n- 最近使用的APP: ' + d.appList.map(a => `${a.name}(${a.time})`).join(', ');
        }

        lookusContext = `\n【LookUs 状态 (用户可见)】
用户可以通过 "LookUs" 应用实时查看你的以下状态 (更新于 ${lastUpdate}):
- 距离: ${d.distance} km
- 电量: ${d.battery}
- 网络: ${d.network}
- 手机型号: ${d.device}
- 屏幕使用时间: ${d.screenTimeH}小时${d.screenTimeM}分
- 解锁次数: ${d.unlockCount}
- 最近解锁: ${d.lastUnlock}
- 停留地点数: ${d.stops}${appUsage}
⚠️ 你知道用户能看到这些信息。如果用户问起你的位置、电量或你在干什么，请结合这些信息回答。如果用户提到这些信息，请不要感到惊讶，因为你知道他在关注你的 LookUs 状态。`;

        // 添加用户端状态事件到上下文
        if (d.reportLog && d.reportLog.length > 0) {
            const userEvents = d.reportLog.filter(e => e.isUserEvent).slice(0, 5);
            if (userEvents.length > 0) {
                lookusContext += `\n\n【用户的手机状态通知】\n你同样可以通过 LookUs 看到用户(对方)的手机状态变化：\n`;
                userEvents.forEach(evt => {
                    lookusContext += `- ${evt.time}: ${evt.text.replace('📱 ', '')}\n`;
                });
                lookusContext += `\n⚠️ 你可以自然地在聊天���提及或关心这些状态。例如用户在充电时你可以说"在充电呀"，用户电量低时你可以提醒他充电，用户离开很久回来你可以问他去哪了。但不要每次都提，要自然。`;
            }
        }
    }

    let meetingContext = '';
    if (window.iphoneSimState.meetings && window.iphoneSimState.meetings[contact.id] && window.iphoneSimState.meetings[contact.id].length > 0) {
        const meetings = window.iphoneSimState.meetings[contact.id];
        const syncedMeetings = meetings.filter(item => item && item.syncWithChat === true);
        const lastMeeting = syncedMeetings.length > 0 ? syncedMeetings[syncedMeetings.length - 1] : null;
        if (!lastMeeting) {
            meetingContext = '';
        } else {
        
            let meetingContent = '';
            if (lastMeeting.content && lastMeeting.content.length > 0) {
                const recentContent = lastMeeting.content.slice(-5);
                meetingContent = recentContent.map(c => {
                    const role = c.role === 'user' ? '用户' : contact.name;
                    return `${role}: ${c.text}`;
                }).join('\n');
            }

            if (meetingContent) {
                const meetingDate = new Date(lastMeeting.time);
                const meetingTimeStr = `${meetingDate.getMonth() + 1}月${meetingDate.getDate()}日`;
                meetingContext = `\n【线下见面记忆】\n你们最近一次见面是在 ${meetingTimeStr} (${lastMeeting.title})。\n当时发生的剧情片段：\n${meetingContent}\n(请知晓你们已经见过面，并根据剧情发展进行聊天)\n`;
            }
        }
    }

    let icityBookContext = getLinkedIcityBooksContext(contact.id);

    let minesweeperContext = '';
    const msModal = document.getElementById('minesweeper-modal');
    if (msModal && !msModal.classList.contains('hidden') && window.getMinesweeperGameState) {
        minesweeperContext = '\n【当前扫雷游戏状态】\n' + window.getMinesweeperGameState() + '\n\n【扫雷操作】\n如果你想操作扫雷游戏，请输出 JSON action：\n- {"type":"action","command":"MINESWEEPER_CLICK","payload":"行,列"}（例如 0,0）\n- {"type":"action","command":"MINESWEEPER_FLAG","payload":"行,列"}\n请分析局势后再行动，并遵守：\n1. 不要点击已经揭开的数字格子或空格子。\n2. 不要点击已经插旗的格子。\n3. 只点击未知区域（显示为 ? 的位置）。\n4. 如果推断某个位置是地雷，请优先使用 MINESWEEPER_FLAG。\n5. 获胜条件是找出并标记所有地雷。';
    }

    let witchGameContext = '';
    const miniGameModal = document.getElementById('mini-game-modal');
    // Check if witch game is active (by checking title or state)
    if (miniGameModal && !miniGameModal.classList.contains('hidden') && window.getWitchGameState) {
        const witchState = window.getWitchGameState();
        if (witchState) {
            witchGameContext = '\n' + witchState + '\n\n【女巫的毒药操作】\n轮到你行动时，请输出 JSON action：\n{"type":"action","command":"WITCH_GUESS","payload":"行,列"}（行1-5，列1-5）\n目标：找出用户藏的3瓶毒药，不要重复选择已经揭开的格子(⭕或☠️)。\n';
        }
    }

    // forum live-stream command guidance
    let forumLiveInstruction = '';
    // only show when forum app loaded or syncing enabled
    if (window.forumState) {
        forumLiveInstruction = '\n【论坛直播能力】\n当你希望在论坛开直播时，请输出：\n{"type":"action","command":"START_FORUM_LIVE","payload":"标题"}\n可选扩展 payload 格式：标题 | 画面描述 | [{"username":"网名","content":"评论"}] | 图片URL\n如未提供画面描述/评论，系统会根据聊天上下文自动生成。\n';
    }

    let transferDecisionContext = '';
    try {
        const pendingTransferMap = new Map();
        history.forEach(msg => {
            if (!msg || msg.type !== 'transfer' || msg.role !== 'user') return;
            let transferData = null;
            try {
                transferData = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
            } catch (error) {
                transferData = null;
            }
            if (!transferData || !transferData.id) return;

            const transferId = String(transferData.id);
            const status = String(transferData.status || 'pending').toLowerCase();
            if (status !== 'pending') {
                pendingTransferMap.delete(transferId);
                return;
            }

            pendingTransferMap.set(transferId, transferData);
        });

        const pendingTransfers = Array.from(pendingTransferMap.values());
        if (pendingTransfers.length > 0) {
            const lines = [];
            lines.push('\n【待处理转账】');
            lines.push('只有当下列待处理转账存在时，你才可以使用 ACCEPT_TRANSFER 或 RETURN_TRANSFER 指令。');
            pendingTransfers.forEach(data => {
                const amount = Number.isFinite(Number(data.amount))
                    ? Number(data.amount).toFixed(2)
                    : String(data.amount || '0.00');
                const remark = String(data.remark || '转账').trim() || '转账';
                lines.push(`- transferId=${data.id}，金额=¥${amount}，备注=${remark}`);
                lines.push(`  收款示例：{"type":"action","command":"ACCEPT_TRANSFER","payload":"${data.id}"}`);
                lines.push(`  退回示例：{"type":"action","command":"RETURN_TRANSFER","payload":"${data.id}"}`);
            });
            lines.push('如果上面没有待处理转账，或这些转账已经处理完，就不要输出这两个指令。');
            transferDecisionContext = lines.join('\n') + '\n';
        }
    } catch (e) {
        transferDecisionContext = '';
    }

    let musicTogetherContext = '';
    if (typeof window.musicV2GetChatMusicContext === 'function') {
        try {
            const musicCtx = window.musicV2GetChatMusicContext(contact.id);
            if (musicCtx) {
                const lines = [];
                lines.push('\n【音乐一起听状态】');
                if (musicCtx.nowPlaying && musicCtx.nowPlaying.songId) {
                    lines.push(`当前播放：${musicCtx.nowPlaying.title || '未知歌曲'} - ${musicCtx.nowPlaying.artist || '未知歌手'}`);
                    if (musicCtx.nowPlaying.lyricLine) {
                        lines.push(`当前歌词句：${musicCtx.nowPlaying.lyricLine}`);
                    }
                    if (!musicCtx.nowPlaying.isPlaying) {
                        lines.push('当前处于暂停/未播放状态。');
                    }
                } else {
                    lines.push('当前未播放歌曲');
                }
                if (musicCtx.together && musicCtx.together.active) {
                    if (musicCtx.together.withCurrentContact) {
                        lines.push('你当前正在和用户一起听歌。');
                        lines.push('你可以使用以下动作指令控制一起听：');
                        lines.push('{"type":"action","command":"MUSIC_TOGETHER_PAUSE","payload":""}');
                        lines.push('{"type":"action","command":"MUSIC_TOGETHER_RESUME","payload":""}');
                        lines.push('{"type":"action","command":"MUSIC_TOGETHER_NEXT","payload":""}');
                        lines.push('{"type":"action","command":"MUSIC_TOGETHER_PREV","payload":""}');
                        lines.push('{"type":"action","command":"MUSIC_TOGETHER_SEARCH_PLAY","payload":"歌曲关键词"}');
                        lines.push('{"type":"action","command":"MUSIC_TOGETHER_QUIT","payload":""}');
                    } else {
                        lines.push(`你当前在和 ${musicCtx.together.contactName || '其他联系人'} 一起听歌。`);
                    }
                } else {
                    lines.push('当前没有激活的一起听会话。');
                }
                if (musicCtx.pendingInvite && musicCtx.pendingInvite.inviteId) {
                    if (String(musicCtx.pendingInvite.direction || 'outgoing') === 'incoming') {
                        lines.push(`你已向用户发出一起听邀请（inviteId=${musicCtx.pendingInvite.inviteId}），歌曲是 ${musicCtx.pendingInvite.songTitle || '未知歌曲'} - ${musicCtx.pendingInvite.songArtist || '未知歌手'}，等待用户选择。`);
                    } else {
                        lines.push(`你收到了用户发来的一起听邀请（inviteId=${musicCtx.pendingInvite.inviteId}），歌曲是 ${musicCtx.pendingInvite.songTitle || '未知歌曲'} - ${musicCtx.pendingInvite.songArtist || '未知歌手'}。`);
                        lines.push('你必须在本次回复中给出动作指令：{"type":"action","command":"MUSIC_INVITE_DECISION","payload":"inviteId | 同意/拒绝"}');
                    }
                } else if (!(musicCtx.together && musicCtx.together.active)) {
                    if (musicCtx.nowPlaying && musicCtx.nowPlaying.isPlaying) {
                        lines.push('如需向用户发起一起听邀请，可输出：{"type":"action","command":"MUSIC_SEND_INVITE","payload":""}（留空表示使用当前播放歌曲）。');
                    } else {
                        lines.push('如需向用户发起一起听邀请，必须先指定歌曲关键词：{"type":"action","command":"MUSIC_SEND_INVITE","payload":"歌曲关键词"}。');
                    }
                }
                musicTogetherContext = lines.join('\n') + '\n';
            }
        } catch (e) {
            musicTogetherContext = '';
        }
    }

    const conditionalCapabilityPrompt = buildWechatConditionalCapabilityPrompt({
        minesweeperContext,
        witchGameContext,
        forumLiveInstruction,
        transferDecisionContext,
        musicTogetherContext
    });
    const systemPromptParts = [];
    appendAiPromptPart(systemPromptParts, 'systemBase', '角色设定', buildWechatRolePrompt(contact, userPromptInfo));
    appendAiPromptPart(systemPromptParts, 'systemBase', '输出协议', buildWechatProtocolPrompt(contact));
    appendAiPromptPart(systemPromptParts, 'systemBase', '活人感', buildWechatHumanFeelPrompt(contact));
    appendAiPromptPart(systemPromptParts, 'systemBase', '基础能力', buildWechatBaseCapabilityPrompt(contact));
    appendAiPromptPart(systemPromptParts, 'systemBase', '小火人', typeof window.buildFireBuddyContactSystemPrompt === 'function' ? window.buildFireBuddyContactSystemPrompt(contactId) : '');
    appendAiPromptPart(systemPromptParts, 'systemBase', '状态', importantStateContext);
    appendAiPromptPart(systemPromptParts, 'systemBase', '朋友圈', momentContext);
    appendAiPromptPart(systemPromptParts, 'systemBase', 'iCity', icityContext);
    appendAiPromptPart(systemPromptParts, 'systemBase', 'LookUs', lookusContext);
    appendAiPromptPart(systemPromptParts, 'memory', '记忆', memoryContext);
    appendAiPromptPart(systemPromptParts, 'systemBase', '线下见面', meetingContext);
    appendAiPromptPart(systemPromptParts, 'systemBase', 'iCity书籍', icityBookContext);
    appendAiPromptPart(systemPromptParts, 'systemBase', '时间', timeContext);
    appendAiPromptPart(systemPromptParts, 'systemBase', '日历', calendarContext);
    appendAiPromptPart(systemPromptParts, 'systemBase', '高德', amapContext);
    appendAiPromptPart(systemPromptParts, 'systemBase', '行程', itineraryContext);
    appendAiPromptPart(systemPromptParts, 'systemBase', '条件能力', conditionalCapabilityPrompt);
    appendAiPromptPart(systemPromptParts, 'systemBase', '回复指令', '请回复对方的消息。');
    appendAiPromptPart(systemPromptParts, 'systemBase', '表情包', buildWechatStickerPrompt(contact));
    appendAiPromptPart(systemPromptParts, 'worldbook', '世界书', buildWechatWorldbookPrompt(contact, history));

    const systemPrompt = joinWechatPromptSections(systemPromptParts.map(part => part.content));

    let limit = contact.contextLimit && contact.contextLimit > 0 ? contact.contextLimit : 50;
    let contextMessages = history
        .filter(h => !shouldExcludeFromAiContext(h))
        .slice(-limit)
        .map(cloneAiPromptHistoryMessage);

    let imageCount = 0;
    for (let i = contextMessages.length - 1; i >= 0; i--) {
        if (contextMessages[i].type === 'image') {
            imageCount++;
            if (imageCount > 3) {
                contextMessages[i]._skipImage = true;
            }
        }
    }

    // 如果开启了时间感知，在消息之间插入时间间隔提示
    let messagesWithTimeGaps = [];
    if (contact.realTimeVisible && contextMessages.length > 0) {
        for (let i = 0; i < contextMessages.length; i++) {
            const currentMsg = contextMessages[i];
            
            // 添加当前消息
            messagesWithTimeGaps.push(currentMsg);
            
            // 检查与下一条消息的时间间隔
            if (i < contextMessages.length - 1) {
                const nextMsg = contextMessages[i + 1];
                const currentTime = currentMsg.time || 0;
                const nextTime = nextMsg.time || 0;
                
                if (currentTime && nextTime) {
                    const timeDiff = nextTime - currentTime; // 毫秒
                    const minutes = Math.floor(timeDiff / 60000);
                    const hours = Math.floor(timeDiff / 3600000);
                    const days = Math.floor(timeDiff / 86400000);
                    
                    let timeGapText = '';
                    
                    // 根据时间间隔生成不同的提示
                    if (days >= 1) {
                        timeGapText = `[时间流逝：距离上一条消息已过去${days}天${hours % 24}小时]`;
                    } else if (hours >= 2) {
                        timeGapText = `[时间流逝：距离上一条消息已过去${hours}小时]`;
                    } else if (minutes >= 30) {
                        timeGapText = `[时间流逝：距离上一条消息已过去${minutes}分钟]`;
                    }
                    
                    // 如果有明显的时间间隔，插入提示
                    if (timeGapText) {
                        messagesWithTimeGaps.push({
                            role: 'system',
                            content: timeGapText,
                            _isTimeGap: true
                        });
                    }
                }
            }
        }
        contextMessages = messagesWithTimeGaps;
    }

    const latestUserImageSelectionMetaMap = buildLatestUserImageSelectionMetaMap(history);

    const messages = [
        { role: 'system', content: systemPrompt },
        ...contextMessages.map(h => {
            // 如果是时间间隔提示，直接返回
            if (h._isTimeGap) {
                return { role: 'system', content: h.content };
            }
            if (h.speaker === 'fire-buddy' && typeof window.formatFireBuddySpeakerForContact === 'function') {
                try {
                    return {
                        role: 'system',
                        content: window.formatFireBuddySpeakerForContact(h, contactId)
                    };
                } catch (fireBuddySpeakerFormatError) {
                    console.warn('格式化小火人发言上下文失败', fireBuddySpeakerFormatError);
                }
            }
            let content = h.content;
            if (h.role === 'user' && h.fireBuddyMentioned && typeof window.formatFireBuddyMentionForContact === 'function') {
                try {
                    content = window.formatFireBuddyMentionForContact(h, contactId);
                } catch (fireBuddyMentionFormatError) {
                    console.warn('格式化小火人 mention 上下文失败', fireBuddyMentionFormatError);
                }
            }
            const avatarSelectionMeta = latestUserImageSelectionMetaMap.get(String(h && h.id || ''));
            const contextPrefix = buildContextRecordPrefix(
                h,
                avatarSelectionMeta
                    ? {
                        avatar_pick_index: avatarSelectionMeta.index,
                        avatar_pick_total: avatarSelectionMeta.total
                    }
                    : null
            );
            const quotePrefix = buildQuoteContextPrefix(h.replyTo);
            const structuredPrefix = joinContextTextParts(contextPrefix, quotePrefix);
            
            // Parse hidden images from text content (e.g. from Moments)
            let embeddedImages = [];
            if (typeof content === 'string') {
                // Strip pollution from text messages to prevent AI from learning bad formats
                // This removes patterns like [发送了一个表情包:...] or [表情包] from text history
                content = content.replace(/\[(发送了一个)?(表情包|图片|语音).*?\]/g, '').trim();

                if (content.includes('<hidden_img>')) {
                    const imgRegex = /<hidden_img>(.*?)<\/hidden_img>/g;
                    let match;
                    while ((match = imgRegex.exec(content)) !== null) {
                        embeddedImages.push(match[1]);
                    }
                    content = content.replace(imgRegex, '').trim();
                }
            }

            if (contact.thoughtVisible && h.thought) {
                content = joinContextTextParts(content, `[visible_thought display_text="${escapeContextAttrText(h.thought)}"]`);
            }

            if (embeddedImages.length > 0) {
                const textPart = joinContextTextParts(structuredPrefix, content);
                const contentArray = [{ type: "text", text: textPart }];
                embeddedImages.forEach(url => {
                    contentArray.push({ type: "image_url", image_url: { url: url } });
                });
                return { role: h.role, content: contentArray };
            }

            if (h.type === 'image') {
                if (h._skipImage) {
                    return { role: h.role, content: joinContextTextParts(structuredPrefix, '[图片]') };
                }
                const imageContentArray = [];
                if (structuredPrefix) {
                    imageContentArray.push({ type: "text", text: structuredPrefix });
                }
                imageContentArray.push({ type: "image_url", image_url: { url: h.content } });
                return {
                    role: h.role,
                    content: imageContentArray
                };
            } else if (h.type === 'virtual_image') {
                const desc = h.description ? `: ${h.description}` : '';
                return {
                    role: h.role,
                    content: joinContextTextParts(structuredPrefix, `[图片${desc}]`)
                };
            } else if (h.type === 'sticker') {
                const desc = h.description ? `: ${h.description}` : '';
                return {
                    role: h.role,
                    content: joinContextTextParts(structuredPrefix, `[表情包${desc}]`)
                };
            } else if (h.type === 'voice') {
                let voiceText = '语音消息';
                try {
                    const data = JSON.parse(h.content);
                    voiceText = data.text || '语音消息';
                } catch (e) {
                    voiceText = h.content;
                }
                return {
                    role: h.role,
                    content: joinContextTextParts(structuredPrefix, `[语音: ${voiceText}]`)
                };
            } else if (h.type === 'voice_call_text') {
                let callText = '通话内容';
                try {
                    const data = JSON.parse(h.content);
                    callText = data.text || '通话内容';
                } catch(e) {
                    callText = h.content;
                }
                // 清洗可能残留的视频通话标签，防止污染普通聊天
                callText = callText.replace(/{{DESC}}[\s\S]*?{{\/DESC}}/gi, '')
                                   .replace(/{{DIALOGUE}}/gi, '')
                                   .replace(/{{\/DIALOGUE}}/gi, '')
                                   .replace(/{{.*?}}/g, '') // 移除其他可能的标签
                                   .trim();
                return { role: h.role, content: joinContextTextParts(structuredPrefix, callText) };
            } else if (h.type === 'gift_card') {
                let giftData = {};
                try {
                    giftData = typeof content === 'string' ? JSON.parse(content) : content;
                } catch(e) {
                    giftData = { title: '礼物', price: '0' };
                }
                const amount = giftData.paymentAmount || giftData.price || '0';
                const recipient = giftData.recipientName ? `，收货人：${giftData.recipientName}` : '';
                const payMethod = giftData.paymentMethodLabel ? `，支付方式：${giftData.paymentMethodLabel}` : '';
                return { role: h.role, content: joinContextTextParts(structuredPrefix, `[送出礼物：${giftData.title}，金额：${amount}元${recipient}${payMethod}] (这是我在闲鱼上看到你收藏的商品，特意买来送给你的)`) };
            } else if (h.type === 'shopping_gift') {
                let giftData = {};
                try {
                    giftData = typeof content === 'string' ? JSON.parse(content) : content;
                } catch(e) {}
                const items = giftData.items ? giftData.items.map(i => i.title).join(', ') : '礼物';
                const amount = giftData.paymentAmount || giftData.total || '0';
                const recipient = (giftData.recipientName || giftData.recipientText) ? `，收货人：${giftData.recipientName || giftData.recipientText}` : '';
                const payMethod = giftData.paymentMethodLabel ? `，支付方式：${giftData.paymentMethodLabel}` : '';
                return { role: h.role, content: joinContextTextParts(structuredPrefix, `[送出礼物：${items}，总价值：${amount}元${recipient}${payMethod}] (这是我在购物APP购买并送给你的)`) };
            } else if (h.type === 'savings_invite') {
                let inviteData = {};
                try {
                    inviteData = typeof content === 'string' ? JSON.parse(content) : content;
                } catch(e) {}
                return { role: h.role, content: joinContextTextParts(structuredPrefix, `[共同存钱邀请: 计划${inviteData.title || '共同存钱计划'}，目标¥${Number(inviteData.targetAmount || 0).toFixed(2)}，基础年化${Number(inviteData.aprBase || 0).toFixed(2)}%]`) };
            } else if (h.type === 'savings_withdraw_request') {
                let reqData = {};
                try {
                    reqData = typeof content === 'string' ? JSON.parse(content) : content;
                } catch(e) {}
                return { role: h.role, content: joinContextTextParts(structuredPrefix, `[共同存钱转出申请: 金额¥${Number(reqData.amount || 0).toFixed(2)}，状态待确认]`) };
            } else if (h.type === 'icity_card') {
                let cardData = {};
                try {
                    cardData = typeof content === 'string' ? JSON.parse(content) : content;
                } catch(e) {}
                
                let authorInfo = `作者: ${cardData.authorName || '未知'}`;
                if (cardData.source === 'diary') {
                    authorInfo = `作者: 我(用户)`;
                }
                
                let commentsInfo = '';
                if (cardData.comments && cardData.comments.length > 0) {
                    // Limit to last 5 comments to avoid token limit
                    const recentComments = cardData.comments.slice(-5);
                    commentsInfo = '\n评论区:\n' + recentComments.map(c => `${c.name}: ${c.content}`).join('\n');
                }
                
                return { role: h.role, content: joinContextTextParts(structuredPrefix, `[分享了 iCity 日记 (${authorInfo}): "${cardData.content || '内容'}"${commentsInfo}]`) };
            } else if (h.type === 'pdd_cash_share') {
                let data = {};
                try { data = JSON.parse(content); } catch(e) {}
                return { role: h.role, content: joinContextTextParts(structuredPrefix, `[分享了天天领现金链接：差 ${data.diff} 元提现]`) };
            } else if (h.type === 'pdd_bargain_share') {
                let data = {};
                try { data = JSON.parse(content); } catch(e) {}
                return { role: h.role, content: joinContextTextParts(structuredPrefix, `[分享了砍价免费拿链接：${data.title}，当前价格 ¥${data.currentPrice}，商品ID: ${data.productId}]`) };
            } else {
                if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
                     try {
                         if (h.type === 'transfer') {
                             const data = JSON.parse(content);
                             return { role: h.role, content: joinContextTextParts(structuredPrefix, `[转账: ${data.amount}元] (ID: ${data.id})`) };
                         } else if (h.type === 'family_card') {
                             const data = JSON.parse(content);
                             const modeText = data.mode === 'grant' ? '给予' : '索要';
                             const statusText = data.status || 'pending';
                             const limitText = data.monthlyLimit ? `${data.monthlyLimit}元/月` : '待设置';
                             return { role: h.role, content: joinContextTextParts(structuredPrefix, `[亲属卡: ${modeText}, 状态:${statusText}, 额度:${limitText}] (ID: ${data.id})`) };
                         }
                     } catch(e) {}
                }
                return { role: h.role, content: joinContextTextParts(structuredPrefix, content) };
            }
        })
    ];

    if (typeof window.getScreenShareAiContextMessages === 'function') {
        try {
            const screenShareContext = window.getScreenShareAiContextMessages();
            if (screenShareContext && (screenShareContext.summaryText || screenShareContext.multimodalContent)) {
                let lastUserMsgIndex = -1;
                for (let i = messages.length - 1; i >= 0; i--) {
                    if (messages[i].role === 'user') {
                        lastUserMsgIndex = i;
                        break;
                    }
                }

                const screenShareImageParts = Array.isArray(screenShareContext.multimodalContent)
                    ? screenShareContext.multimodalContent.filter(part => part && part.type === 'image_url')
                    : [];
                const isAlbumScreenShareContext = typeof screenShareContext.summaryText === 'string'
                    && screenShareContext.summaryText.startsWith('Album is on');

                console.log('[ScreenShare Debug] screen share context ready for request', {
                    hasSummaryText: !!screenShareContext.summaryText,
                    summaryText: screenShareContext.summaryText || null,
                    multimodalPartCount: Array.isArray(screenShareContext.multimodalContent)
                        ? screenShareContext.multimodalContent.length
                        : 0,
                    imageUrls: screenShareImageParts.map(part => part.image_url && part.image_url.url),
                    lastUserMsgIndex
                });

                const screenShareParts = [];
                if (screenShareContext.summaryText) {
                    let screenShareInstruction = `${screenShareContext.summaryText}. You are currently the one actively checking the user's phone, not letting the user check yours. The shared-screen content below is visible right now as evidence from the user's device. You may proactively continue inspecting related areas if the situation calls for it. You may output multiple SCREEN_TAP / SCREEN_TYPE actions in one reply, and they will execute strictly in order. Screen actions are not limited by the normal “do not stack many actions” rule. If the current screen already makes the next steps obvious, output the full action chain at once.`;
                    if (isAlbumScreenShareContext) {
                        screenShareInstruction += ' For a private-album password, you may use SCREEN_TYPE only when the password is grounded in known facts already in context: either the user explicitly provided it in chat history, or it can be directly inferred from established chat-settings persona/profile dates such as the user\'s birthday, your birthday, or another clearly stated important date. Prefer exact MMDD-style conversions like 12月24日 -> 1224. If the password page shows an error, do not guess again.';
                    }
                    screenShareParts.push({
                        type: 'text',
                        text: screenShareInstruction
                    });
                }
                if (Array.isArray(screenShareContext.multimodalContent)) {
                    screenShareParts.push(...screenShareContext.multimodalContent);
                }

                if (screenShareParts.length > 0) {
                    if (lastUserMsgIndex !== -1) {
                        const originalContent = messages[lastUserMsgIndex].content;
                        const mergedContent = Array.isArray(originalContent)
                            ? [...originalContent]
                            : [{ type: 'text', text: String(originalContent || '') }];

                        mergedContent.push({
                            type: 'text',
                            text: '【当前共享屏幕补充】'
                        });
                        mergedContent.push(...screenShareParts);
                        messages[lastUserMsgIndex].content = mergedContent;
                    } else {
                        messages.push({
                            role: 'user',
                            content: screenShareParts
                        });
                    }

                    const attachedMessage = lastUserMsgIndex !== -1
                        ? messages[lastUserMsgIndex]
                        : messages[messages.length - 1];
                    const attachedImageParts = Array.isArray(attachedMessage.content)
                        ? attachedMessage.content.filter(part => part && part.type === 'image_url')
                        : [];

                    console.log('[ScreenShare Debug] attached screen share context to message', {
                        targetRole: attachedMessage.role,
                        contentIsArray: Array.isArray(attachedMessage.content),
                        targetImageUrlCount: attachedImageParts.length,
                        targetImageUrls: attachedImageParts.map(part => part.image_url && part.image_url.url)
                    });
                } else {
                    console.log('[ScreenShare Debug] screen share parts empty after build');
                }
            } else {
                console.log('[ScreenShare Debug] no screen share context available for this request');
            }
        } catch (error) {
            console.warn('Failed to build screen share AI context messages.', error);
        }
    }

    if (instruction) {
        messages.push({
            role: 'system',
            content: `[系统提示]: ${instruction}`
        });
    }

    messages._systemPromptParts = systemPromptParts.map(part => ({ ...part }));


    return messages;
};



