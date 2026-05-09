// 通话记录功能模块（按 call_history_v1.html 视觉还原，全屏版）

function formatCallHistoryTime(timestamp) {
    const date = new Date(Number(timestamp || 0));
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const sameYear = date.getFullYear() === now.getFullYear();
    const sameMonth = sameYear && date.getMonth() === now.getMonth();
    const sameDate = sameMonth && date.getDate() === now.getDate();
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    if (sameDate) return `${hh}:${mm}`;
    return `${date.getMonth() + 1}/${date.getDate()} ${hh}:${mm}`;
}

function extractCallDurationLabel(summaryText) {
    const text = String(summaryText || '').trim();
    if (!text) return '';
    const matched = text.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
    if (!matched) return '';
    const duration = matched[1];
    const parts = duration.split(':').map(part => Number.parseInt(part, 10) || 0);
    if (parts.length === 2) {
        const mins = parts[0];
        const secs = parts[1];
        return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    const hours = parts[0];
    const mins = parts[1];
    const secs = parts[2];
    const totalMins = hours * 60 + mins;
    return `${totalMins}m ${secs.toString().padStart(2, '0')}s`;
}

function sanitizeVideoDialogueText(text) {
    const rawText = String(text || '');
    return rawText
        .replace(/{{DESC}}[\s\S]*?{{\/DESC}}/gi, '')
        .replace(/{{DIALOGUE}}/gi, '')
        .replace(/{{\/DIALOGUE}}/gi, '')
        .trim();
}

function parseCallMessagePayload(content) {
    const payload = {
        dialogue: String(content || ''),
        desc: '',
        audio: null
    };
    try {
        const data = typeof content === 'string' ? JSON.parse(content) : content;
        if (data && typeof data === 'object') {
            if (typeof data.text === 'string') payload.dialogue = data.text;
            if (typeof data.description === 'string') payload.desc = data.description;
            if (data.audio) payload.audio = data.audio;
        }
    } catch (e) {}
    return payload;
}

function getCurrentCallHistoryContactName() {
    const contact = getCurrentCallHistoryContact();
    return contact ? String(contact.remark || contact.name || 'Unknown') : 'Unknown';
}

function getCurrentCallHistoryContact() {
    const state = window.iphoneSimState;
    if (!state) return null;
    const contactId = state.currentChatContactId;
    const contacts = Array.isArray(state.contacts) ? state.contacts : [];
    if (!contactId) return null;
    return contacts.find(item => String(item.id) === String(contactId)) || null;
}

function resolveCallDetailBackground(session) {
    const contact = getCurrentCallHistoryContact();
    if (!contact) return '';
    if (session && session.type === 'video') {
        return String(contact.videoCallBgImage || contact.chatBg || '').trim();
    }
    return String(contact.voiceCallBg || contact.chatBg || '').trim();
}

function applyCallDetailBackground(session, container) {
    if (!container) return;
    const bgValue = resolveCallDetailBackground(session);
    if (bgValue) {
        container.style.backgroundImage = `url(${bgValue})`;
        container.style.backgroundSize = 'cover';
        container.style.backgroundPosition = 'center';
        container.style.backgroundRepeat = 'no-repeat';
        return;
    }
    container.style.backgroundImage = '';
    container.style.backgroundSize = '';
    container.style.backgroundPosition = '';
    container.style.backgroundRepeat = '';
}

function buildCallSessionsForCurrentContact() {
    const contactId = window.iphoneSimState && window.iphoneSimState.currentChatContactId;
    if (!contactId) return [];
    const history = Array.isArray(window.iphoneSimState.chatHistory[contactId])
        ? window.iphoneSimState.chatHistory[contactId]
        : [];

    const sessions = [];
    let currentSession = null;
    const sessionGapMs = 5 * 60 * 1000;

    history.forEach((msg) => {
        if (!msg) return;
        const isCallContent = msg.type === 'voice_call_text';
        const contentText = String(msg.content || '');
        const isCallEnd = msg.type === 'text'
            && (contentText.includes('通话时长：') || contentText.includes('视频通话时长：'));

        if (isCallContent) {
            if (!currentSession || (Number(msg.time || 0) - Number(currentSession.endTime || 0) > sessionGapMs)) {
                if (currentSession) sessions.push(currentSession);
                currentSession = {
                    id: String(msg.id || Date.now()),
                    startTime: Number(msg.time || Date.now()),
                    endTime: Number(msg.time || Date.now()),
                    type: 'voice',
                    messages: [msg],
                    summary: ''
                };
            } else {
                currentSession.messages.push(msg);
                currentSession.endTime = Number(msg.time || currentSession.endTime || Date.now());
            }

            const payload = parseCallMessagePayload(msg.content);
            if (String(payload.desc || '').trim() || /{{DESC}}|{{DIALOGUE}}/i.test(contentText)) {
                currentSession.type = 'video';
            }
            return;
        }

        if (isCallEnd && currentSession && (Number(msg.time || 0) - Number(currentSession.endTime || 0) < sessionGapMs)) {
            currentSession.endTime = Number(msg.time || currentSession.endTime || Date.now());
            currentSession.summary = contentText;
            if (contentText.includes('视频通话')) {
                currentSession.type = 'video';
            }
            sessions.push(currentSession);
            currentSession = null;
        }
    });

    if (currentSession) sessions.push(currentSession);
    return sessions.reverse();
}

function openCallHistoryScreen() {
    const screen = document.getElementById('call-history-screen');
    if (!screen) return;
    const modal = document.getElementById('video-call-modal');
    if (modal) modal.classList.add('hidden');
    screen.classList.remove('hidden');
    renderCallHistoryList();
}

function renderCallHistoryList() {
    const list = document.getElementById('call-history-list');
    const emptyState = document.getElementById('call-history-empty');
    if (!list) return;

    list.innerHTML = '';
    const sessions = buildCallSessionsForCurrentContact();
    if (!sessions.length) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    if (emptyState) emptyState.classList.add('hidden');

    sessions.forEach((session) => {
        const item = document.createElement('div');
        item.className = 'call-history-v1-list-card';
        const contactName = getCurrentCallHistoryContactName();
        const typeTag = session.type === 'video' ? 'VIDEO' : 'AUDIO';
        const durationText = extractCallDurationLabel(session.summary) || '--';
        const timeText = formatCallHistoryTime(session.startTime);
        const iconMarkup = session.type === 'video'
            ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>'
            : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';

        item.innerHTML = `
            <div class="call-history-v1-icon">
                ${iconMarkup}
            </div>
            <div class="call-history-v1-info">
                <div class="call-history-v1-name-row">
                    <div class="call-history-v1-name">${contactName}</div>
                    <div class="call-history-v1-time">${timeText}</div>
                </div>
                <div class="call-history-v1-desc-row">
                    <span class="call-history-v1-tag ${session.type === 'video' ? 'video' : 'audio'}">${typeTag}</span>
                    <span class="call-history-v1-dur">${durationText}</span>
                </div>
            </div>
        `;

        item.onclick = () => openCallDetailScreen(session);
        list.appendChild(item);
    });
}

function renderCallDetailMessage(session, msg, index) {
    const payload = parseCallMessagePayload(msg.content);
    const isUser = msg.role === 'user';
    let dialogueText = sanitizeVideoDialogueText(payload.dialogue || '');
    let descText = String(payload.desc || '').trim();

    if (session.type === 'video') {
        const raw = String(msg.content || '');
        const descMatch = raw.match(/{{DESC}}([\s\S]*?){{\/DESC}}/i);
        const dialogueMatch = raw.match(/{{DIALOGUE}}([\s\S]*?){{\/DIALOGUE}}/i);
        if (descMatch && !descText) descText = descMatch[1].trim();
        if (dialogueMatch) dialogueText = dialogueMatch[1].trim();
    }

    const row = document.createElement('div');
    row.className = `call-history-v1-msg ${isUser ? 'me' : 'other'}`;
    row.style.animationDelay = `${Math.min(index, 6) * 0.08}s`;

    let inner = '';
    if (descText) {
        inner += `
            <div class="call-history-v1-visual-desc">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:2px;">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>${descText}</span>
            </div>
        `;
    }
    if (dialogueText) {
        inner += `<div class="call-history-v1-bubble">${dialogueText}</div>`;
    }

    row.innerHTML = inner || '<div class="call-history-v1-bubble">[空消息]</div>';
    return row;
}

function openCallDetailScreen(session) {
    const screen = document.getElementById('call-detail-screen');
    const content = document.getElementById('call-detail-content');
    const title = document.getElementById('call-detail-title');
    const type = document.getElementById('call-detail-type');
    if (!screen || !content || !title || !type) return;

    title.textContent = getCurrentCallHistoryContactName();
    type.textContent = session.type === 'video' ? 'VIDEO CALL' : 'AUDIO CALL';
    content.innerHTML = '';
    applyCallDetailBackground(session, content);

    const startMeta = document.createElement('div');
    startMeta.className = 'call-history-v1-meta';
    startMeta.textContent = session.type === 'video'
        ? '--- CONNECTION ESTABLISHED ---'
        : '--- AUDIO STREAM CONNECTED ---';
    content.appendChild(startMeta);

    session.messages.forEach((msg, idx) => {
        if (!msg || msg.type !== 'voice_call_text') return;
        content.appendChild(renderCallDetailMessage(session, msg, idx));
    });

    const endMeta = document.createElement('div');
    endMeta.className = 'call-history-v1-meta';
    endMeta.textContent = `--- CALL ENDED ${extractCallDurationLabel(session.summary) || '--'} ---`;
    content.appendChild(endMeta);

    screen.classList.remove('hidden');
}

window.playHistoryAudio = function(url, btn) {
    if (window.currentHistoryAudio) {
        window.currentHistoryAudio.pause();
        if (window.currentHistoryBtn) {
            window.currentHistoryBtn.style.color = '';
        }
    }
    const audio = new Audio(url);
    window.currentHistoryAudio = audio;
    window.currentHistoryBtn = btn;
    if (btn) btn.style.color = '#007AFF';
    audio.onended = () => {
        if (btn) btn.style.color = '';
        window.currentHistoryAudio = null;
    };
    audio.play().catch(() => {
        if (btn) btn.style.color = '';
        alert('播放失败');
    });
};

function setupCallHistoryListeners() {
    const viewHistoryBtn = document.getElementById('view-call-history-btn');
    const closeHistoryBtn = document.getElementById('close-call-history');
    const closeDetailBtn = document.getElementById('close-call-detail');

    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', openCallHistoryScreen);
    }

    if (closeHistoryBtn) {
        closeHistoryBtn.addEventListener('click', () => {
            const screen = document.getElementById('call-history-screen');
            if (screen) screen.classList.add('hidden');
        });
    }

    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', () => {
            const screen = document.getElementById('call-detail-screen');
            if (screen) screen.classList.add('hidden');
        });
    }
}

if (window.appInitFunctions) {
    window.appInitFunctions.push(setupCallHistoryListeners);
} else {
    window.appInitFunctions = [setupCallHistoryListeners];
}
