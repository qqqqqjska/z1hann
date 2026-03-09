const DEFAULT_THOUGHT_PET_SIZE = 88;
const MIN_THOUGHT_PET_SIZE = 52;
const MAX_THOUGHT_PET_SIZE = 140;
const DEFAULT_THOUGHT_PET_POSITION = { xRatio: 0.86, yRatio: 0.72 };
const THOUGHT_PET_DRAG_THRESHOLD = 6;
const DEFAULT_THOUGHT_PET_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" fill="none">
  <ellipse cx="82" cy="142" rx="36" ry="10" fill="rgba(0,0,0,0.15)"/>
  <path d="M32 56c0-18 14-32 32-32h34c18 0 32 14 32 32v44c0 22-18 40-40 40H70c-22 0-40-18-40-40V56z" fill="#fff5df" stroke="#2a2a2a" stroke-width="4"/>
  <path d="M54 28l12 18-20 2 8-20zM108 28l-8 20-20-2 12-18z" fill="#fff5df" stroke="#2a2a2a" stroke-width="4" stroke-linejoin="round"/>
  <circle cx="65" cy="76" r="6" fill="#2a2a2a"/>
  <circle cx="95" cy="76" r="6" fill="#2a2a2a"/>
  <path d="M73 92c3 4 11 4 14 0" stroke="#2a2a2a" stroke-width="4" stroke-linecap="round"/>
  <circle cx="54" cy="92" r="6" fill="#ffb7b7" fill-opacity="0.65"/>
  <circle cx="106" cy="92" r="6" fill="#ffb7b7" fill-opacity="0.65"/>
</svg>
`)}`;

window.DEFAULT_THOUGHT_PET_IMAGE = window.DEFAULT_THOUGHT_PET_IMAGE || DEFAULT_THOUGHT_PET_IMAGE;
window.DEFAULT_THOUGHT_PET_SIZE = DEFAULT_THOUGHT_PET_SIZE;
window.MIN_THOUGHT_PET_SIZE = MIN_THOUGHT_PET_SIZE;
window.MAX_THOUGHT_PET_SIZE = MAX_THOUGHT_PET_SIZE;

const thoughtPetPointerState = {
    active: false,
    moved: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0
};

function clamp01(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.min(1, number));
}

function clampThoughtPetSize(rawSize) {
    const size = Number(rawSize);
    if (!Number.isFinite(size)) return DEFAULT_THOUGHT_PET_SIZE;
    return Math.max(MIN_THOUGHT_PET_SIZE, Math.min(MAX_THOUGHT_PET_SIZE, Math.round(size)));
}

function normalizeThoughtPetPosition(position) {
    if (!position || typeof position !== 'object') {
        return { ...DEFAULT_THOUGHT_PET_POSITION };
    }
    const x = Number(position.xRatio);
    const y = Number(position.yRatio);
    return {
        xRatio: Number.isFinite(x) ? clamp01(x) : DEFAULT_THOUGHT_PET_POSITION.xRatio,
        yRatio: Number.isFinite(y) ? clamp01(y) : DEFAULT_THOUGHT_PET_POSITION.yRatio
    };
}

function getThoughtDisplayMode(contact) {
    if (!contact) return 'title';
    return contact.thoughtDisplayMode === 'desktop-pet' ? 'desktop-pet' : 'title';
}

function getThoughtContact(contactId = window.iphoneSimState.currentChatContactId) {
    if (!contactId) return null;
    return (window.iphoneSimState.contacts || []).find(c => c.id === contactId) || null;
}

function hideThoughtOverlays() {
    const titleBubble = document.getElementById('thought-bubble');
    const petBubble = document.getElementById('thought-pet-bubble');
    if (titleBubble) titleBubble.classList.add('hidden');
    if (petBubble) petBubble.classList.add('hidden');
}

window.hideThoughtOverlays = hideThoughtOverlays;

function getThoughtPetBounds(chatScreen, petSize) {
    const safePadding = 10;
    const headerHeight = chatScreen.querySelector('.chat-header')?.offsetHeight || 0;
    const inputHeight = chatScreen.querySelector('.chat-input-area')?.offsetHeight || 0;

    const minLeft = safePadding;
    const maxLeft = Math.max(minLeft, chatScreen.clientWidth - petSize - safePadding);
    const minTop = headerHeight + safePadding;
    const maxTop = Math.max(minTop, chatScreen.clientHeight - inputHeight - petSize - safePadding);

    return { minLeft, maxLeft, minTop, maxTop };
}

function getThoughtPetRatioFromPixels(left, top, bounds) {
    const xDenom = Math.max(1, bounds.maxLeft - bounds.minLeft);
    const yDenom = Math.max(1, bounds.maxTop - bounds.minTop);
    return {
        xRatio: clamp01((left - bounds.minLeft) / xDenom),
        yRatio: clamp01((top - bounds.minTop) / yDenom)
    };
}

function updateThoughtPetBubblePosition() {
    const chatScreen = document.getElementById('chat-screen');
    const pet = document.getElementById('thought-pet');
    const bubble = document.getElementById('thought-pet-bubble');
    if (!chatScreen || !pet || !bubble || pet.classList.contains('hidden') || bubble.classList.contains('hidden')) return;

    const chatRect = chatScreen.getBoundingClientRect();
    const petRect = pet.getBoundingClientRect();
    const anchorX = petRect.left - chatRect.left + petRect.width / 2;

    const bubbleWidth = bubble.offsetWidth || 200;
    const maxArrowOffset = Math.max(0, bubbleWidth / 2 - 18);
    const minCenter = bubbleWidth / 2 + 8;
    const maxCenter = chatScreen.clientWidth - bubbleWidth / 2 - 8;
    const clampedCenter = Math.max(minCenter, Math.min(maxCenter, anchorX));
    const bubbleLeftRelativeToPet = clampedCenter - (petRect.left - chatRect.left);
    const arrowOffset = Math.max(-maxArrowOffset, Math.min(maxArrowOffset, anchorX - clampedCenter));

    bubble.style.left = `${bubbleLeftRelativeToPet}px`;
    bubble.style.setProperty('--pet-bubble-arrow-offset', `${arrowOffset}px`);
}

function onThoughtPetPointerMove(e) {
    if (!thoughtPetPointerState.active) return;
    if (thoughtPetPointerState.pointerId !== null && e.pointerId !== undefined && e.pointerId !== thoughtPetPointerState.pointerId) return;

    const chatScreen = document.getElementById('chat-screen');
    const pet = document.getElementById('thought-pet');
    const contact = getThoughtContact();
    if (!chatScreen || !pet || !contact) return;

    const dx = e.clientX - thoughtPetPointerState.startX;
    const dy = e.clientY - thoughtPetPointerState.startY;
    const movedDistance = Math.max(Math.abs(dx), Math.abs(dy));

    if (!thoughtPetPointerState.moved && movedDistance > THOUGHT_PET_DRAG_THRESHOLD) {
        thoughtPetPointerState.moved = true;
        pet.classList.add('dragging');
    }

    if (!thoughtPetPointerState.moved) return;

    const petSize = clampThoughtPetSize(contact.thoughtPetSize || pet.offsetWidth || DEFAULT_THOUGHT_PET_SIZE);
    const bounds = getThoughtPetBounds(chatScreen, petSize);
    const left = Math.max(bounds.minLeft, Math.min(bounds.maxLeft, thoughtPetPointerState.startLeft + dx));
    const top = Math.max(bounds.minTop, Math.min(bounds.maxTop, thoughtPetPointerState.startTop + dy));

    pet.style.left = `${left}px`;
    pet.style.top = `${top}px`;
    contact.thoughtPetPosition = getThoughtPetRatioFromPixels(left, top, bounds);
    updateThoughtPetBubblePosition();
}

function onThoughtPetPointerUp(e) {
    if (!thoughtPetPointerState.active) return;
    if (thoughtPetPointerState.pointerId !== null && e.pointerId !== undefined && e.pointerId !== thoughtPetPointerState.pointerId) return;

    document.removeEventListener('pointermove', onThoughtPetPointerMove);
    document.removeEventListener('pointerup', onThoughtPetPointerUp);
    document.removeEventListener('pointercancel', onThoughtPetPointerUp);

    const pet = document.getElementById('thought-pet');
    if (pet) pet.classList.remove('dragging');

    const wasMoved = thoughtPetPointerState.moved;
    thoughtPetPointerState.active = false;
    thoughtPetPointerState.moved = false;
    thoughtPetPointerState.pointerId = null;

    if (wasMoved) {
        const chatScreen = document.getElementById('chat-screen');
        const contact = getThoughtContact();
        if (chatScreen && pet && contact) {
            const petSize = clampThoughtPetSize(contact.thoughtPetSize || pet.offsetWidth || DEFAULT_THOUGHT_PET_SIZE);
            const bounds = getThoughtPetBounds(chatScreen, petSize);
            const left = parseFloat(pet.style.left || '0');
            const top = parseFloat(pet.style.top || '0');
            contact.thoughtPetPosition = getThoughtPetRatioFromPixels(left, top, bounds);
            saveConfig();
        }
        return;
    }

    toggleThoughtBubble();
}

function ensureThoughtPetInteractionBound() {
    const pet = document.getElementById('thought-pet');
    if (!pet || pet.dataset.boundThoughtPet === '1') return;

    pet.dataset.boundThoughtPet = '1';
    pet.addEventListener('pointerdown', (e) => {
        if (pet.classList.contains('hidden')) return;
        if (e.button !== undefined && e.button !== 0) return;

        e.preventDefault();
        const left = parseFloat(pet.style.left || `${pet.offsetLeft || 0}`);
        const top = parseFloat(pet.style.top || `${pet.offsetTop || 0}`);

        thoughtPetPointerState.active = true;
        thoughtPetPointerState.moved = false;
        thoughtPetPointerState.pointerId = e.pointerId ?? null;
        thoughtPetPointerState.startX = e.clientX;
        thoughtPetPointerState.startY = e.clientY;
        thoughtPetPointerState.startLeft = Number.isFinite(left) ? left : 0;
        thoughtPetPointerState.startTop = Number.isFinite(top) ? top : 0;

        if (pet.setPointerCapture && e.pointerId !== undefined) {
            try { pet.setPointerCapture(e.pointerId); } catch (err) {}
        }

        document.addEventListener('pointermove', onThoughtPetPointerMove);
        document.addEventListener('pointerup', onThoughtPetPointerUp);
        document.addEventListener('pointercancel', onThoughtPetPointerUp);
    });
}

function renderThoughtEntryUI(contactId = window.iphoneSimState.currentChatContactId) {
    const chatScreen = document.getElementById('chat-screen');
    const pet = document.getElementById('thought-pet');
    const petImage = document.getElementById('thought-pet-image');
    const petBubble = document.getElementById('thought-pet-bubble');
    const titleBubble = document.getElementById('thought-bubble');
    if (!chatScreen || !pet || !petImage || !petBubble) return;

    ensureThoughtPetInteractionBound();

    const contact = getThoughtContact(contactId);
    const chatVisible = !chatScreen.classList.contains('hidden');
    const enablePet = !!(
        contact &&
        contact.showThought &&
        getThoughtDisplayMode(contact) === 'desktop-pet' &&
        chatVisible &&
        window.iphoneSimState.currentChatContactId === contact.id
    );

    if (!enablePet) {
        pet.classList.add('hidden');
        petBubble.classList.add('hidden');
        return;
    }

    if (titleBubble) titleBubble.classList.add('hidden');

    const petSize = clampThoughtPetSize(contact.thoughtPetSize);
    const petPosition = normalizeThoughtPetPosition(contact.thoughtPetPosition);
    contact.thoughtPetSize = petSize;
    contact.thoughtPetPosition = petPosition;

    pet.style.width = `${petSize}px`;
    pet.style.height = `${petSize}px`;
    petImage.src = contact.thoughtPetImage || window.DEFAULT_THOUGHT_PET_IMAGE || DEFAULT_THOUGHT_PET_IMAGE;

    const bounds = getThoughtPetBounds(chatScreen, petSize);
    const xSpace = Math.max(0, bounds.maxLeft - bounds.minLeft);
    const ySpace = Math.max(0, bounds.maxTop - bounds.minTop);
    const left = bounds.minLeft + xSpace * petPosition.xRatio;
    const top = bounds.minTop + ySpace * petPosition.yRatio;

    pet.style.left = `${Math.round(left)}px`;
    pet.style.top = `${Math.round(top)}px`;
    pet.classList.remove('hidden');

    updateThoughtPetBubblePosition();
}

window.renderThoughtEntryUI = renderThoughtEntryUI;

function renderChatHistory(contactId, preserveScroll = false) {
    const messages = window.iphoneSimState.chatHistory[contactId] || [];
    const container = document.getElementById('chat-messages');
    if (typeof window.applyChatDisplayPreferences === 'function') {
        window.applyChatDisplayPreferences(contactId);
    }

    // Check if limit changed or contact changed
    const settingLimit = window.iphoneSimState.chatLoadingLimit !== undefined ? window.iphoneSimState.chatLoadingLimit : 20;
    
    if (contactId !== lastChatContactId) {
        // Reset limit if contact changed
        currentChatRenderLimit = settingLimit;
        lastChatContactId = contactId;
    } else if (!preserveScroll) {
        // Reset limit if not a "load more" action (e.g. entering chat)
        currentChatRenderLimit = settingLimit;
    }
    
    // Calculate start index
    let startIndex = 0;
    let hasMore = false;
    
    if (settingLimit > 0) {
        if (currentChatRenderLimit === 0) currentChatRenderLimit = settingLimit;
        if (messages.length > currentChatRenderLimit) {
            startIndex = messages.length - currentChatRenderLimit;
            hasMore = true;
        }
    }

    const messagesRendered = messages.slice(startIndex);

    // Save scroll position
    let oldScrollHeight = 0;
    if (preserveScroll) {
        oldScrollHeight = container.scrollHeight;
    }

    container.innerHTML = '';
    
    // Add "Load More" button if needed
    if (hasMore) {
        const loadBtn = document.createElement('div');
        loadBtn.className = 'load-more-msg';
        loadBtn.textContent = '加载更多消息';
        loadBtn.style.textAlign = 'center';
        loadBtn.style.padding = '10px';
        loadBtn.style.color = '#007AFF';
        loadBtn.style.fontSize = '14px';
        loadBtn.style.cursor = 'pointer';
        
        loadBtn.onclick = () => {
            currentChatRenderLimit += (settingLimit || 20);
            renderChatHistory(contactId, true);
        };
        container.appendChild(loadBtn);
    }
    
    let needSave = false;
    messagesRendered.forEach(msg => {
        if (!msg.id) {
            msg.id = Date.now() + Math.random().toString(36).substr(2, 9);
            needSave = true;
        }
        if (!msg.time) {
            const idTimestamp = parseInt(msg.id.toString().substring(0, 13));
            if (!isNaN(idTimestamp) && idTimestamp > 1600000000000 && idTimestamp < 3000000000000) {
                msg.time = idTimestamp;
            } else {
                msg.time = Date.now();
            }
            needSave = true;
        }
    });
    if (needSave) saveConfig();

    messagesRendered.forEach(msg => {
        if (shouldHideChatSyncMsg(msg) || (typeof msg.content === 'string' && msg.content.startsWith('(用户发布了 iCity 日记:'))) {
            return;
        }
        appendMessageToUI(msg.content, msg.role === 'user', msg.type || 'text', msg.description, msg.replyTo, msg.id, msg.time, true);
    });
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    let latestThought = null;
    if (contact && contact.showThought) {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'assistant' && messages[i].thought) {
                latestThought = messages[i].thought;
                break;
            }
        }
    }
    updateThoughtBubble(latestThought);
    renderThoughtEntryUI(contactId);
    
    if (preserveScroll) {
        container.scrollTop = container.scrollHeight - oldScrollHeight;
    } else {
        scrollToBottom();
    }
    updateMultiSelectUI();
    applyChatMultiSelectClass();
}

function toggleThoughtBubble() {
    const contact = getThoughtContact();
    if (!contact || !contact.showThought) return;

    const mode = getThoughtDisplayMode(contact);
    const titleBubble = document.getElementById('thought-bubble');
    const titleContent = document.getElementById('thought-content-text');
    const petBubble = document.getElementById('thought-pet-bubble');
    const petContent = document.getElementById('thought-pet-content-text');

    if (mode === 'desktop-pet') {
        if (!petBubble || !petContent || !petContent.textContent.trim()) return;
        if (titleBubble) titleBubble.classList.add('hidden');
        petBubble.classList.toggle('hidden');
        if (!petBubble.classList.contains('hidden')) {
            updateThoughtPetBubblePosition();
        }
        return;
    }

    if (!titleBubble || !titleContent || !titleContent.textContent.trim()) return;
    if (petBubble) petBubble.classList.add('hidden');
    titleBubble.classList.toggle('hidden');
}

function updateThoughtBubble(text) {
    const titleContent = document.getElementById('thought-content-text');
    const petContent = document.getElementById('thought-pet-content-text');

    if (text) {
        if (titleContent) titleContent.textContent = text;
        if (petContent) petContent.textContent = text;
        updateThoughtPetBubblePosition();
    } else {
        if (titleContent) titleContent.textContent = '';
        if (petContent) petContent.textContent = '';
        hideThoughtOverlays();
    }
}

window.parseStartForumLivePayload = function(rawPayload) {
    const payload = (rawPayload || '').trim();
    if (!payload) return { title: '直播', actionDesc: '', initialComments: [], bgUrl: null, viewers: '' };

    if ((payload.startsWith('{') && payload.endsWith('}')) || (payload.startsWith('[') && payload.endsWith(']'))) {
        try {
            const parsed = JSON.parse(payload);
            return {
                title: (parsed.title || parsed.live_title || '直播').trim(),
                actionDesc: (parsed.action_desc || parsed.actionDesc || '').trim(),
                initialComments: Array.isArray(parsed.initial_comments) ? parsed.initial_comments : [],
                bgUrl: (parsed.bg_url || parsed.bgUrl || '').trim() || null,
                viewers: (parsed.viewers || parsed.viewer_count || '').toString().trim()
            };
        } catch (e) {
            console.warn('parseStartForumLivePayload JSON parse failed:', e);
        }
    }

    const parts = payload.split('|').map(s => s.trim()).filter(Boolean);
    const title = parts[0] || '直播';
    let actionDesc = '';
    let initialComments = [];
    let bgUrl = null;
    let viewers = '';

    for (let i = 1; i < parts.length; i++) {
        const p = parts[i];
        if (/^https?:\/\//i.test(p)) {
            bgUrl = p;
            continue;
        }
        if (/^\d+(?:\.\d+)?\s*[wkWK]?$/i.test(p)) {
            viewers = p;
            continue;
        }
        if ((p.startsWith('[') && p.endsWith(']')) || (p.startsWith('{') && p.endsWith('}'))) {
            try {
                const jsonVal = JSON.parse(p);
                if (Array.isArray(jsonVal)) {
                    initialComments = jsonVal;
                    continue;
                }
            } catch (e) {}
        }
        if (!actionDesc) actionDesc = p;
    }

    return { title, actionDesc, initialComments, bgUrl, viewers };
};

function sendMessage(text, isUser, type = 'text', description = null, targetContactId = null) {
    const contactId = targetContactId || window.iphoneSimState.currentChatContactId;
    if (!contactId) return null;
    
    if (!window.iphoneSimState.chatHistory[contactId]) {
        window.iphoneSimState.chatHistory[contactId] = [];
    }
    
    const msg = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        time: Date.now(),
        role: isUser ? 'user' : 'assistant',
        content: text,
        type: type,
        replyTo: (window.iphoneSimState.replyingToMsg && (!targetContactId || targetContactId === window.iphoneSimState.currentChatContactId)) ? {
            name: window.iphoneSimState.replyingToMsg.name,
            content: window.iphoneSimState.replyingToMsg.type === 'text' ? window.iphoneSimState.replyingToMsg.content : `[${window.iphoneSimState.replyingToMsg.type === 'sticker' ? '表情包' : '图片'}]`
        } : null
    };

    if (description) {
        msg.description = description;
    }
    
    window.iphoneSimState.chatHistory[contactId].push(msg);
    if (!isUser && type === 'music_listen_invite' && typeof window.openMusicListenInvitePrompt === 'function') {
        try {
            const inviteData = typeof text === 'string' ? JSON.parse(text) : (text || {});
            const status = String(inviteData.status || 'pending');
            const direction = String(inviteData.direction || 'incoming');
            if (status === 'pending' && direction === 'incoming') {
                setTimeout(() => {
                    try {
                        window.openMusicListenInvitePrompt(inviteData);
                    } catch (popupError) {
                        console.warn('[music-v2][invite-debug][chat]', 'prompt-open-failed', popupError);
                    }
                }, 40);
            }
        } catch (inviteParseError) {
            console.warn('[music-v2][invite-debug][chat]', 'invite-parse-failed', inviteParseError);
        }
    }
    
    // process manual ACTION commands embedded in user message
    if (isUser && text && text.includes('ACTION:')) {
        // start live if requested
        const liveMatch = text.match(/ACTION:\s*START_FORUM_LIVE:\s*(.*?)(?:\n|$)/);
        if (liveMatch && liveMatch[1] !== undefined) {
            const parsedLive = window.parseStartForumLivePayload ? window.parseStartForumLivePayload(liveMatch[1]) : null;
            const liveTitle = parsedLive?.title || (liveMatch[1] || '').trim();
            const liveActionDesc = parsedLive?.actionDesc || '';
            const liveBgUrl = parsedLive?.bgUrl || null;
            const liveInitialComments = parsedLive?.initialComments || [];
            const liveViewers = parsedLive?.viewers || '';
            if (window.createForumLiveStream) window.createForumLiveStream(contactId, liveTitle, liveActionDesc, liveBgUrl, liveInitialComments, liveViewers);
        }
        // post forum content
        const postMatch = text.match(/ACTION:\s*POST_FORUM:\s*(.*?)(?:\n|$)/);
        if (postMatch && postMatch[1] !== undefined) {
            const content = postMatch[1].trim();
            if (content && window.addForumPost) window.addForumPost(contactId, content, []);
        }
    }
    
    if (window.iphoneSimState.replyingToMsg && (!targetContactId || targetContactId === window.iphoneSimState.currentChatContactId)) cancelQuote();
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (contact) {
        if (contact.autoItineraryEnabled) {
            if (typeof contact.messagesSinceLastItinerary !== 'number') {
                contact.messagesSinceLastItinerary = 0;
            }
            contact.messagesSinceLastItinerary++;
            
            if (contact.messagesSinceLastItinerary >= (contact.autoItineraryInterval || 10)) {
                if (window.generateNewItinerary) {
                    window.generateNewItinerary(contact);
                    contact.messagesSinceLastItinerary = 0;
                }
            }
        } else {
            contact.messagesSinceLastItinerary = 0;
        }
    }

    saveConfig();

    if (window.syncToFloatingChat && window.isScreenSharing) {
        window.syncToFloatingChat({ content: text, type: type, role: isUser ? 'user' : 'assistant' }, contactId);
        if (typeof window.loadFloatingChatHistory === 'function') {
            window.loadFloatingChatHistory();
        }
    }
    
    // Only update UI if we are in the chat with this contact
    if (window.iphoneSimState.currentChatContactId === contactId) {
        appendMessageToUI(text, isUser, type, description, msg.replyTo, msg.id, msg.time);
        scrollToBottom();
    }

    if (window.renderContactList) window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');

    if (window.checkAndSummarize) window.checkAndSummarize(contactId);
    
    return msg;
}

let familyCardComposeState = null;

function createFamilyCardPayload(mode, targetId, options = {}) {
    const now = Date.now();
    const safeMode = mode === 'grant' ? 'grant' : 'request';
    const note = typeof options.note === 'string' ? options.note.trim() : '';
    const limitRaw = options.monthlyLimit;
    const monthlyLimit = safeMode === 'grant' && limitRaw !== null && limitRaw !== undefined && limitRaw !== ''
        ? Number(limitRaw)
        : null;
    return {
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        mode: safeMode,
        fromContactId: 'me',
        toContactId: targetId,
        status: 'pending',
        monthlyLimit: Number.isFinite(monthlyLimit) ? monthlyLimit : null,
        note: note || (safeMode === 'request' ? '可以给我开通亲属卡吗？' : '我想给你开通亲属卡'),
        createdAt: now,
        updatedAt: now
    };
}

function findFamilyCardById(contactId, cardId) {
    const history = window.iphoneSimState.chatHistory[contactId] || [];
    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (msg.type !== 'family_card') continue;
        try {
            const data = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
            if (String(data.id) === String(cardId)) {
                return { msg, data, index: i };
            }
        } catch (e) {
            console.error('解析亲属卡消息失败', e);
        }
    }
    return null;
}

function updateFamilyCardStatus(contactId, cardId, updates = {}) {
    const found = findFamilyCardById(contactId, cardId);
    if (!found) return null;

    const next = {
        ...found.data,
        status: updates.status || found.data.status || 'pending',
        monthlyLimit: updates.monthlyLimit === undefined ? found.data.monthlyLimit : updates.monthlyLimit,
        updatedAt: Date.now()
    };
    found.msg.content = JSON.stringify(next);
    saveConfig();

    if (window.iphoneSimState.currentChatContactId === contactId && window.renderChatHistory) {
        renderChatHistory(contactId, true);
    }
    if (window.renderContactList) {
        window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
    }
    if (window.refreshBankAppFamilyCards) {
        window.refreshBankAppFamilyCards();
    }
    return next;
}

function formatFamilyCardTime(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '-';
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function findLatestPendingFamilyCard(contactId) {
    const history = window.iphoneSimState.chatHistory[contactId] || [];
    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (msg.type !== 'family_card' || msg.role !== 'user') continue;
        try {
            const data = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
            if ((data.status || 'pending') === 'pending') {
                return { msg, data, index: i };
            }
        } catch (e) {}
    }
    return null;
}

function parseFamilyCardDecisionFromPayload(payload, fallbackCardId = null) {
    const raw = String(payload || '').trim();
    if (!raw) return null;
    let parts = raw.split(/\s*[|｜]\s*/).map(s => s.trim());
    if (parts.length < 2) {
        const m = raw.match(/^(\S+)\s+(同意|拒绝|accept|reject|agree|decline)\s*(\d{2,6})?/i);
        if (m) {
            parts = [m[1], m[2], m[3] || ''];
        }
    }
    const parsed = {
        cardId: parts[0] || fallbackCardId,
        status: null,
        monthlyLimit: null
    };
    const decisionRaw = (parts[1] || '').toLowerCase();
    const rejectWords = ['拒绝', '不同意', '拒', 'no', 'reject', 'decline'];
    const acceptWords = ['同意', '接受', '通过', '可以', 'agree', 'accept', 'yes', 'ok'];
    if (rejectWords.some(w => decisionRaw.includes(w))) parsed.status = 'rejected';
    if (!parsed.status && acceptWords.some(w => decisionRaw.includes(w))) parsed.status = 'accepted';

    const numberMatch = (parts[2] || '').match(/(\d{2,6})/);
    if (numberMatch) {
        parsed.monthlyLimit = parseInt(numberMatch[1], 10);
    }
    if (parsed.status === 'accepted' && (!parsed.monthlyLimit || Number.isNaN(parsed.monthlyLimit))) {
        const min = 500;
        const max = 5000;
        const step = 100;
        const n = Math.floor(Math.random() * ((max - min) / step + 1));
        parsed.monthlyLimit = min + n * step;
    }
    if (!parsed.status || !parsed.cardId) return null;
    return parsed;
}

function deriveFamilyDecisionFromMessages(messagesList = []) {
    const texts = messagesList
        .filter(m => m && (m.type === 'text' || m.type === '消息') && typeof m.content === 'string')
        .map(m => m.content)
        .join('\n');

    const t = texts.toLowerCase();
    const hasReject = ['不同意', '拒绝', '先不办', '不太方便', '暂时不', 'reject', 'decline'].some(k => t.includes(k));
    const hasAccept = ['同意', '可以', '给你开', '开通', '没问题', 'agree', 'accept'].some(k => t.includes(k));
    const limitMatch = texts.match(/(\d{3,5})\s*(元|rmb|人民币)?/i);
    const limit = limitMatch ? parseInt(limitMatch[1], 10) : null;

    if (hasReject) {
        return { status: 'rejected', monthlyLimit: null, fromText: true, hadLimit: false };
    }
    if (hasAccept) {
        return { status: 'accepted', monthlyLimit: limit, fromText: true, hadLimit: !!limit };
    }

    const randomAccept = Math.random() < 0.7;
    if (!randomAccept) return { status: 'rejected', monthlyLimit: null, fromText: false, hadLimit: false };

    const min = 500;
    const max = 5000;
    const step = 100;
    const n = Math.floor(Math.random() * ((max - min) / step + 1));
    return { status: 'accepted', monthlyLimit: min + n * step, fromText: false, hadLimit: true };
}

window.openFamilyCardTypeModal = function() {
    const modal = document.getElementById('family-card-type-modal');
    if (!modal) return;
    if (!modal.dataset.boundMaskClose) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
        modal.dataset.boundMaskClose = '1';
    }
    modal.classList.remove('hidden');
};

window.openFamilyCardContactPicker = function(mode) {
    const safeMode = mode === 'grant' ? 'grant' : 'request';
    const familyTypeModal = document.getElementById('family-card-type-modal');
    if (familyTypeModal) familyTypeModal.classList.add('hidden');

    const modal = document.getElementById('contact-picker-modal');
    const list = document.getElementById('contact-picker-list');
    const sendBtn = document.getElementById('contact-picker-send-btn');
    const closeBtn = document.getElementById('close-contact-picker');
    if (!modal || !list || !sendBtn) return;

    const header = modal.querySelector('.modal-header h3');
    if (header) header.textContent = safeMode === 'request' ? '选择要索要亲属卡的联系人' : '选择要给予亲属卡的联系人';

    list.innerHTML = '';
    (window.iphoneSimState.contacts || []).forEach(c => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div class="list-content" style="display:flex;align-items:center;justify-content:flex-start;">
                <img src="${c.avatar}" style="width:38px;height:38px;border-radius:50%;margin-right:12px;object-fit:cover;flex-shrink:0;">
                <span style="font-size:15px;">${c.remark || c.nickname || c.name}</span>
            </div>
            <input type="checkbox" name="family-card-target" value="${c.id}" style="width:20px;height:20px;">
        `;
        item.addEventListener('click', (e) => {
            const target = item.querySelector('input[name="family-card-target"]');
            if (!target) return;
            if (e.target !== target) target.checked = !target.checked;
            if (target.checked) {
                list.querySelectorAll('input[name="family-card-target"]').forEach(cb => {
                    if (cb !== target) cb.checked = false;
                });
            }
        });
        list.appendChild(item);
    });

    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    newSendBtn.textContent = '下一步';
    newSendBtn.onclick = () => {
        const selected = list.querySelector('input[name="family-card-target"]:checked');
        if (!selected) {
            alert('请选择一个联系人');
            return;
        }
        const targetId = /^\d+$/.test(selected.value) ? parseInt(selected.value, 10) : selected.value;
        modal.classList.add('hidden');
        window.openFamilyCardComposeModal(safeMode, targetId);
    };

    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.onclick = () => modal.classList.add('hidden');
    }

    modal.classList.remove('hidden');
};

window.openFamilyCardComposeModal = function(mode, contactId) {
    const safeMode = mode === 'grant' ? 'grant' : 'request';
    familyCardComposeState = { mode: safeMode, contactId };

    const modal = document.getElementById('family-card-compose-modal');
    const titleEl = document.getElementById('family-compose-title');
    const noteEl = document.getElementById('family-compose-note');
    const limitGroup = document.getElementById('family-compose-limit-group');
    const limitEl = document.getElementById('family-compose-limit');
    const hintEl = document.getElementById('family-compose-hint');
    const sendBtn = document.getElementById('family-compose-send-btn');
    if (!modal || !titleEl || !noteEl || !limitGroup || !limitEl || !hintEl || !sendBtn) return;

    titleEl.textContent = safeMode === 'request' ? '索要亲属卡' : '给予亲属卡';
    noteEl.value = '';
    limitEl.value = '';
    if (safeMode === 'grant') {
        limitGroup.classList.remove('hidden');
        hintEl.textContent = '请填写每月额度后发送，由对方决定是否接受。';
    } else {
        limitGroup.classList.add('hidden');
        hintEl.textContent = '可填写备注后发送，由对方决定是否接受。';
    }

    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    newSendBtn.textContent = safeMode === 'request' ? '发送索要' : '发送给予';
    newSendBtn.onclick = () => window.confirmSendFamilyCard();

    if (!modal.dataset.boundMaskClose) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
        modal.dataset.boundMaskClose = '1';
    }
    modal.classList.remove('hidden');
};

window.closeFamilyCardComposeModal = function() {
    const modal = document.getElementById('family-card-compose-modal');
    if (modal) modal.classList.add('hidden');
    familyCardComposeState = null;
};

window.confirmSendFamilyCard = function() {
    if (!familyCardComposeState) return;
    const { mode, contactId } = familyCardComposeState;
    const noteEl = document.getElementById('family-compose-note');
    const limitEl = document.getElementById('family-compose-limit');
    const note = noteEl ? noteEl.value.trim() : '';
    const limitValue = limitEl ? limitEl.value.trim() : '';

    let monthlyLimit = null;
    if (mode === 'grant') {
        if (!limitValue || isNaN(limitValue) || Number(limitValue) <= 0) {
            alert('请填写有效的每月额度');
            return;
        }
        monthlyLimit = Number(limitValue);
    }

    window.sendFamilyCardToContact(mode, contactId, { note, monthlyLimit });
    window.closeFamilyCardComposeModal();
};

window.sendFamilyCardToContact = function(mode, contactId, options = {}) {
    const safeMode = mode === 'grant' ? 'grant' : 'request';
    const payload = createFamilyCardPayload(safeMode, contactId, options);
    sendMessage(JSON.stringify(payload), true, 'family_card', null, contactId);
    showChatToast(safeMode === 'request' ? '已发送亲属卡索要' : '已发送亲属卡给予');
};

window.openFamilyCardDetail = function(cardId, contactId) {
    const safeContactId = contactId || window.iphoneSimState.currentChatContactId;
    if (!safeContactId || !cardId) return;
    const found = findFamilyCardById(safeContactId, cardId);
    if (!found) return;

    const data = found.data;
    const typeText = data.mode === 'grant' ? '亲属卡给予' : '亲属卡申请';
    const statusMap = { pending: '待处理', accepted: '已同意', rejected: '已拒绝' };
    const statusText = statusMap[data.status] || '待处理';
    const limitText = data.monthlyLimit ? `¥${parseFloat(data.monthlyLimit).toFixed(0)} / 月` : '待设置';
    const noteText = data.note || '-';

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    setText('family-detail-type', typeText);
    setText('family-detail-status', statusText);
    setText('family-detail-limit', limitText);
    setText('family-detail-time', formatFamilyCardTime(data.createdAt));
    setText('family-detail-note', noteText);

    const modal = document.getElementById('family-card-detail-modal');
    if (modal) {
        if (!modal.dataset.boundMaskClose) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
            modal.dataset.boundMaskClose = '1';
        }
        modal.classList.remove('hidden');
    }
};

window.closeFamilyCardDetail = function() {
    const modal = document.getElementById('family-card-detail-modal');
    if (modal) modal.classList.add('hidden');
};

window.openSavingsInviteDetail = function(payload) {
    let inviteData = payload;
    if (typeof payload === 'string') {
        try {
            inviteData = JSON.parse(decodeURIComponent(payload));
        } catch (e) {
            inviteData = {};
        }
    }
    if (!inviteData || typeof inviteData !== 'object') inviteData = {};

    const title = inviteData.title || '共同存钱计划';
    const targetAmount = Number(inviteData.targetAmount || 0).toFixed(2);
    const apr = Number(inviteData.aprBase || 0).toFixed(2);
    const inviteText = inviteData.inviteText || '已邀请你一起存钱';

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    setText('savings-invite-detail-title', '共同存钱邀请');
    setText('savings-invite-detail-plan', title);
    setText('savings-invite-detail-target', `¥${targetAmount}`);
    setText('savings-invite-detail-apr', `${apr}%`);
    setText('savings-invite-detail-text', inviteText);

    const modal = document.getElementById('savings-invite-detail-modal');
    if (modal) {
        if (!modal.dataset.boundMaskClose) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
            modal.dataset.boundMaskClose = '1';
        }
        modal.classList.remove('hidden');
    }
};

window.closeSavingsInviteDetail = function() {
    const modal = document.getElementById('savings-invite-detail-modal');
    if (modal) modal.classList.add('hidden');
};

let bankFamilyCardEntries = [];
let currentBankFamilyCardKey = null;
let bankFundingResolve = null;
let bankFundingReject = null;
let savingsAmountModalMode = 'deposit';

function ensureBankSavingsState() {
    if (!window.iphoneSimState) window.iphoneSimState = {};
    if (!window.iphoneSimState.bankSavings || typeof window.iphoneSimState.bankSavings !== 'object') {
        window.iphoneSimState.bankSavings = {};
    }
    const savings = window.iphoneSimState.bankSavings;
    if (!Array.isArray(savings.plans)) savings.plans = [];
    if (!savings.challengeSettings || typeof savings.challengeSettings !== 'object') {
        savings.challengeSettings = { enabled: true, level: 'normal' };
    }
    if (!['easy', 'normal', 'hard'].includes(savings.challengeSettings.level)) {
        savings.challengeSettings.level = 'normal';
    }
    if (!Object.prototype.hasOwnProperty.call(savings.challengeSettings, 'enabled')) {
        savings.challengeSettings.enabled = true;
    }
    if (typeof savings.activePlanId === 'undefined') savings.activePlanId = null;

    savings.plans.forEach((plan) => {
        if (!plan || typeof plan !== 'object') return;
        if (!plan.id) plan.id = `savings_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        if (!plan.status) plan.status = 'active';
        plan.targetAmount = Number(plan.targetAmount) || 50000;
        plan.balance = Number(plan.balance) || 0;
        plan.interestAccrued = Number(plan.interestAccrued) || 0;
        plan.aprBase = Number(plan.aprBase) || 2.4;
        plan.aprBonus = Number(plan.aprBonus) || 0.3;
        if (!Array.isArray(plan.activities)) plan.activities = [];
        if (!Array.isArray(plan.withdrawRequests)) plan.withdrawRequests = [];
        if (!plan.lastAccrueAt) plan.lastAccrueAt = Date.now();
        if (!plan.updatedAt) plan.updatedAt = Date.now();
    });

    if (!savings.activePlanId && savings.plans.length) {
        const active = savings.plans.find((p) => p.status === 'active') || savings.plans[0];
        savings.activePlanId = active ? active.id : null;
    }
    return savings;
}

function getSavingsDayKey(ts = Date.now()) {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getSavingsContactName(contactId) {
    const contact = (window.iphoneSimState.contacts || []).find((c) => c.id === contactId);
    if (!contact) return `联系人${contactId}`;
    return contact.remark || contact.nickname || contact.name || `联系人${contactId}`;
}

function getActiveSavingsPlan() {
    const savings = ensureBankSavingsState();
    const byId = savings.plans.find((p) => p.id === savings.activePlanId);
    if (byId) return byId;
    const fallback = savings.plans.find((p) => p.status === 'active') || savings.plans[0] || null;
    if (fallback) savings.activePlanId = fallback.id;
    return fallback;
}

function getSavingsPlanByPeerContactId(contactId) {
    const targetId = Number(contactId);
    if (!Number.isFinite(targetId)) return null;
    const savings = ensureBankSavingsState();
    const matchedPlans = savings.plans.filter((p) => Number(p.peerContactId) === targetId && (p.status === 'active' || p.status === 'completed'));
    if (!matchedPlans.length) return null;
    const plan = matchedPlans.find((p) => p.status === 'active') || matchedPlans[0];
    if (plan) savings.activePlanId = plan.id;
    return plan || null;
}

function getSavingsChallengeTarget(level) {
    if (level === 'easy') return 100;
    if (level === 'hard') return 1000;
    return 500;
}

function appendSavingsActivity(plan, activity) {
    if (!plan || !activity) return;
    if (!Array.isArray(plan.activities)) plan.activities = [];
    const record = {
        id: activity.id || `s_act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: activity.type || 'system',
        actor: activity.actor || 'system',
        amount: Number(activity.amount) || 0,
        note: activity.note || '',
        time: Number(activity.time) || Date.now()
    };
    plan.activities.unshift(record);
    if (plan.activities.length > 100) plan.activities = plan.activities.slice(0, 100);
    plan.updatedAt = Date.now();
}

function refreshSavingsChallenges(plan) {
    if (!plan) return;
    const savings = ensureBankSavingsState();
    const cfg = savings.challengeSettings || { enabled: true, level: 'normal' };
    if (!cfg.enabled) {
        plan.challenge = {
            dayKey: getSavingsDayKey(),
            enabled: false,
            title: '挑战已关闭',
            target: 0,
            progress: 0,
            completed: false
        };
        return;
    }

    const dayKey = getSavingsDayKey();
    if (plan.challenge && plan.challenge.dayKey === dayKey) return;

    const target = getSavingsChallengeTarget(cfg.level);
    plan.challenge = {
        dayKey,
        enabled: true,
        title: `今日存入达标 ¥${target.toFixed(2)}`,
        target,
        progress: 0,
        completed: false,
        completedAt: null
    };
}

function updateSavingsChallengeOnDeposit(plan, amount) {
    if (!plan || !plan.challenge || !plan.challenge.enabled || plan.challenge.completed) return;
    plan.challenge.progress = Number(plan.challenge.progress || 0) + Number(amount || 0);
    if (plan.challenge.progress >= Number(plan.challenge.target || 0)) {
        plan.challenge.completed = true;
        plan.challenge.completedAt = Date.now();
        plan.activeBonusUntil = Date.now() + 24 * 3600 * 1000;
        appendSavingsActivity(plan, {
            type: 'challenge',
            actor: 'system',
            amount: 0,
            note: '今日挑战完成，已获得临时加息'
        });
    }
}

function expireSavingsWithdrawRequests(plan) {
    if (!plan || !Array.isArray(plan.withdrawRequests)) return;
    const now = Date.now();
    plan.withdrawRequests.forEach((req) => {
        if (req.status === 'pending' && Number(req.expireAt || 0) <= now) {
            req.status = 'expired';
            req.handledAt = now;
            appendSavingsActivity(plan, {
                type: 'withdraw_expired',
                actor: 'system',
                amount: Number(req.amount) || 0,
                note: '转出申请超时关闭'
            });
        }
    });
}

function accrueSavingsInterest(plan) {
    if (!plan || plan.status !== 'active') return;
    const now = Date.now();
    const last = Number(plan.lastAccrueAt || 0);
    if (!last) {
        plan.lastAccrueAt = now;
        return;
    }

    const lastDate = new Date(last);
    const nowDate = new Date(now);
    const lastStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
    const nowStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
    const days = Math.floor((nowStart - lastStart) / (24 * 3600 * 1000));
    if (days <= 0) return;

    let totalInterest = 0;
    for (let i = 0; i < days; i++) {
        const baseApr = Number(plan.aprBase || 0);
        const bonusApr = Number(plan.activeBonusUntil && plan.activeBonusUntil > now ? plan.aprBonus || 0 : 0);
        const daily = (Number(plan.balance) || 0) * ((baseApr + bonusApr) / 100) / 365;
        totalInterest += daily;
    }
    totalInterest = Number(totalInterest.toFixed(2));
    if (totalInterest > 0) {
        plan.balance = Number((Number(plan.balance || 0) + totalInterest).toFixed(2));
        plan.interestAccrued = Number((Number(plan.interestAccrued || 0) + totalInterest).toFixed(2));
        appendSavingsActivity(plan, {
            type: 'interest',
            actor: 'system',
            amount: totalInterest,
            note: `利息入账（${days}天）`
        });
    }
    plan.lastAccrueAt = now;
}

function getSavingsActivityIcon(type) {
    if (type === 'deposit') {
        return '<svg viewBox="0 0 24 24"><path d="M12 4v16"></path><path d="M6 10l6-6 6 6"></path></svg>';
    }
    if (type === 'withdraw_request') {
        return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle><path d="M12 8v5l3 2"></path></svg>';
    }
    if (type === 'withdraw_approved') {
        return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M8 12l2.5 2.5L16 9"></path></svg>';
    }
    if (type === 'withdraw_rejected' || type === 'withdraw_expired') {
        return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M9 9l6 6M15 9l-6 6"></path></svg>';
    }
    if (type === 'interest') {
        return '<svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"></path></svg>';
    }
    if (type === 'challenge') {
        return '<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.2L20 9l-4 3.9.9 5.6L12 16l-4.9 2.5.9-5.6L4 9l5.4-.8z"></path></svg>';
    }
    return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle></svg>';
}

function renderSavingsActivityList(plan) {
    const listEl = document.getElementById('bank-savings-activity-list');
    if (!listEl) return;
    if (!plan || !Array.isArray(plan.activities) || !plan.activities.length) {
        listEl.innerHTML = '<div class="ssv1-empty">暂无共同存钱记录</div>';
        return;
    }
    listEl.innerHTML = plan.activities.slice(0, 20).map((act) => {
        const d = new Date(Number(act.time) || Date.now());
        const subtitle = `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · ${act.note || ''}`;
        const sign = Number(act.amount) >= 0 ? '+' : '-';
        const absAmount = Math.abs(Number(act.amount) || 0).toFixed(2);
        const amountText = Number(act.amount) ? `${sign}¥${absAmount}` : '--';
        const titleMap = {
            deposit: '转入',
            withdraw_request: '转出申请',
            withdraw_approved: '转出通过',
            withdraw_rejected: '转出拒绝',
            withdraw_expired: '转出超时',
            interest: '利息入账',
            challenge: '挑战奖励'
        };
        return `
            <div class="ssv1-list-item">
                <div class="ssv1-item-left">
                    <div class="ssv1-item-icon">${getSavingsActivityIcon(act.type)}</div>
                    <div class="ssv1-item-details">
                        <div class="ssv1-item-title">${titleMap[act.type] || '记录'}</div>
                        <div class="ssv1-item-subtitle">${subtitle}</div>
                    </div>
                </div>
                <div class="ssv1-item-amount">${amountText}</div>
            </div>
        `;
    }).join('');
}

function renderBankSavingsView() {
    const amountEl = document.getElementById('bank-savings-amount');
    const goalEl = document.getElementById('bank-savings-goal');
    const aprEl = document.getElementById('bank-savings-apr');
    const progressEl = document.getElementById('bank-savings-progress');
    const switchBtn = document.getElementById('bank-savings-switch-btn');
    const challengeEl = document.getElementById('bank-savings-challenge');
    const depositBtn = document.getElementById('bank-savings-deposit-btn');
    const withdrawBtn = document.getElementById('bank-savings-withdraw-btn');

    const plan = getActiveSavingsPlan();
    if (!plan) {
        if (amountEl) amountEl.textContent = '¥0.00';
        if (goalEl) goalEl.textContent = '目标：¥0.00';
        if (aprEl) aprEl.textContent = '0.00% APY';
        if (progressEl) progressEl.style.width = '0%';
        if (switchBtn) switchBtn.textContent = '我 / 未选择';
        if (challengeEl) challengeEl.textContent = '今日挑战：未开启';
        if (depositBtn) depositBtn.disabled = true;
        if (withdrawBtn) withdrawBtn.disabled = true;
        renderSavingsActivityList(null);
        return;
    }

    refreshSavingsChallenges(plan);
    expireSavingsWithdrawRequests(plan);
    accrueSavingsInterest(plan);

    if (switchBtn) switchBtn.textContent = `我 / ${plan.peerName || getSavingsContactName(plan.peerContactId)}`;
    if (amountEl) amountEl.textContent = `¥${Number(plan.balance || 0).toFixed(2)}`;
    if (goalEl) goalEl.textContent = `目标：¥${Number(plan.targetAmount || 0).toFixed(2)}`;
    const bonusOn = Number(plan.activeBonusUntil || 0) > Date.now();
    const aprText = `${Number(plan.aprBase || 0).toFixed(2)}%${bonusOn ? ` + ${Number(plan.aprBonus || 0).toFixed(2)}%` : ''} APY`;
    if (aprEl) aprEl.textContent = aprText;
    const pct = plan.targetAmount > 0 ? Math.min(100, (Number(plan.balance || 0) / Number(plan.targetAmount || 1)) * 100) : 0;
    if (progressEl) progressEl.style.width = `${pct.toFixed(1)}%`;
    if (challengeEl) {
        if (plan.challenge && plan.challenge.enabled) {
            const c = plan.challenge;
            const progress = Number(c.progress || 0).toFixed(2);
            const target = Number(c.target || 0).toFixed(2);
            challengeEl.textContent = c.completed ? `今日挑战：已完成 (${c.title})` : `今日挑战：${c.title} (${progress}/${target})`;
        } else {
            challengeEl.textContent = '今日挑战：已关闭';
        }
    }
    if (depositBtn) depositBtn.disabled = false;
    if (withdrawBtn) withdrawBtn.disabled = false;
    renderSavingsActivityList(plan);
}

window.openSavingsMoreMenu = function() {
    const modal = document.getElementById('bank-savings-more-modal');
    if (modal) modal.classList.remove('hidden');
};

window.openSavingsInvitePicker = function() {
    const modal = document.getElementById('contact-picker-modal');
    const list = document.getElementById('contact-picker-list');
    const sendBtn = document.getElementById('contact-picker-send-btn');
    const closeBtn = document.getElementById('close-contact-picker');
    if (!modal || !list || !sendBtn || !closeBtn) return;

    const header = modal.querySelector('.modal-header h3');
    if (header) header.textContent = '邀请一起存钱';

    const contacts = Array.isArray(window.iphoneSimState.contacts) ? window.iphoneSimState.contacts : [];
    list.innerHTML = contacts.map((c) => `
        <div class="list-item" style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:16px;">${c.remark || c.nickname || c.name}</span>
            <input type="checkbox" name="savings-target" value="${c.id}" style="width:20px;height:20px;">
        </div>
    `).join('');

    list.querySelectorAll('.list-item').forEach((item) => {
        const input = item.querySelector('input[name="savings-target"]');
        item.addEventListener('click', (e) => {
            if (e.target !== input) input.checked = !input.checked;
            list.querySelectorAll('input[name="savings-target"]').forEach((cb) => {
                if (cb !== input) cb.checked = false;
            });
        });
    });

    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    newSendBtn.textContent = '发送邀请';
    newSendBtn.onclick = () => {
        const selected = list.querySelector('input[name="savings-target"]:checked');
        if (!selected) {
            alert('请选择联系人');
            return;
        }
        const contactId = parseInt(selected.value, 10);
        if (!Number.isFinite(contactId)) return;
        const savings = ensureBankSavingsState();
        let plan = savings.plans.find((p) => p.peerContactId === contactId && (p.status === 'active' || p.status === 'completed'));
        if (!plan) {
            const peerName = getSavingsContactName(contactId);
            plan = {
                id: `s_plan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                peerContactId: contactId,
                peerName,
                status: 'active',
                title: `${peerName}共同存钱`,
                targetAmount: 50000,
                aprBase: 2.4,
                aprBonus: 0.3,
                balance: 0,
                interestAccrued: 0,
                createdAt: Date.now(),
                acceptedAt: Date.now(),
                updatedAt: Date.now(),
                lastAccrueAt: Date.now(),
                activities: [],
                withdrawRequests: []
            };
            appendSavingsActivity(plan, {
                type: 'system',
                actor: 'system',
                amount: 0,
                note: '共同存钱计划已创建'
            });
            savings.plans.push(plan);
        }
        savings.activePlanId = plan.id;
        if (typeof sendMessage !== 'undefined') {
            const payload = {
                planId: plan.id,
                title: plan.title,
                targetAmount: plan.targetAmount,
                aprBase: plan.aprBase,
                fromName: '我'
            };
            sendMessage(JSON.stringify(payload), true, 'savings_invite', null, contactId);
        }
        saveConfig();
        modal.classList.add('hidden');
        const moreModal = document.getElementById('bank-savings-more-modal');
        if (moreModal) moreModal.classList.add('hidden');
        renderBankSavingsView();
        alert('邀请已发送');
    };

    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.onclick = () => modal.classList.add('hidden');
    modal.classList.remove('hidden');
};

window.openSavingsSwitchModal = function() {
    const modal = document.getElementById('bank-savings-switch-modal');
    const list = document.getElementById('bank-savings-switch-list');
    if (!modal || !list) return;
    const savings = ensureBankSavingsState();
    const plans = savings.plans.filter((p) => p.status === 'active' || p.status === 'completed');
    if (!plans.length) {
        list.innerHTML = '<div style="text-align:center;color:#8e8e93;padding:8px 0;">暂无可切换联系人</div>';
    } else {
        list.innerHTML = plans.map((p) => `
            <button class="bank-family-option" type="button" onclick="window.switchSavingsPlanByContact(${p.peerContactId})">
                <div>
                    <div class="bank-family-option-title">${p.peerName || getSavingsContactName(p.peerContactId)}</div>
                    <div class="bank-family-option-desc">余额 ¥${Number(p.balance || 0).toFixed(2)} / 目标 ¥${Number(p.targetAmount || 0).toFixed(0)}</div>
                </div>
                <i class="fas fa-chevron-right" style="color:#999;"></i>
            </button>
        `).join('');
    }
    modal.classList.remove('hidden');
};

window.switchSavingsPlanByContact = function(contactId) {
    const savings = ensureBankSavingsState();
    const plan = savings.plans.find((p) => p.peerContactId === Number(contactId) && (p.status === 'active' || p.status === 'completed'));
    if (!plan) {
        alert('未找到该联系人的共同存钱计划');
        return;
    }
    savings.activePlanId = plan.id;
    saveConfig();
    const modal = document.getElementById('bank-savings-switch-modal');
    if (modal) modal.classList.add('hidden');
    renderBankSavingsView();
};

window.openSavingsAmountModal = function(mode) {
    const plan = getActiveSavingsPlan();
    if (!plan) {
        alert('请先邀请联系人建立共同存钱计划');
        return;
    }
    savingsAmountModalMode = mode === 'withdraw' ? 'withdraw' : 'deposit';
    const modal = document.getElementById('bank-savings-amount-modal');
    const title = document.getElementById('bank-savings-amount-title');
    const input = document.getElementById('bank-savings-amount-input');
    if (title) title.textContent = savingsAmountModalMode === 'deposit' ? '手动输入转入金额' : '手动输入转出金额';
    if (input) input.value = '';
    if (modal) modal.classList.remove('hidden');
};

window.closeSavingsAmountModal = function() {
    const modal = document.getElementById('bank-savings-amount-modal');
    if (modal) modal.classList.add('hidden');
};

function applySavingsDeposit(plan, amount) {
    const bank = ensureBankAppState();
    const val = Number(amount);
    if (!Number.isFinite(val) || val <= 0) {
        alert('请输入有效金额');
        return false;
    }
    if (Number(bank.cashBalance || 0) < val) {
        alert('银行余额不足');
        return false;
    }
    bank.cashBalance = Number((Number(bank.cashBalance || 0) - val).toFixed(2));
    appendBankTransaction({
        type: 'expense',
        amount: val,
        title: '共同存钱转入',
        sourceApp: 'shared_savings',
        sourceType: 'cash',
        sourceKey: 'cash',
        sourceLabel: '共同存钱',
        balanceAfterCash: Number(bank.cashBalance || 0)
    });
    plan.balance = Number((Number(plan.balance || 0) + val).toFixed(2));
    appendSavingsActivity(plan, {
        type: 'deposit',
        actor: 'me',
        amount: val,
        note: '我发起转入'
    });
    updateSavingsChallengeOnDeposit(plan, val);
    saveConfig();
    renderBankBalance();
    return true;
}

function applySavingsPeerDeposit(plan, amount, note, peerContactId) {
    const val = Number(Number(amount).toFixed(2));
    if (!Number.isFinite(val) || val <= 0) return false;
    if (!plan || typeof plan !== 'object') return false;

    plan.balance = Number((Number(plan.balance || 0) + val).toFixed(2));
    appendSavingsActivity(plan, {
        type: 'deposit',
        actor: 'peer',
        amount: val,
        note: note || 'TA发起转入'
    });
    updateSavingsChallengeOnDeposit(plan, val);
    if (Number.isFinite(Number(peerContactId))) {
        plan.peerContactId = Number(peerContactId);
    }
    saveConfig();
    if (typeof renderBankSavingsView === 'function') {
        renderBankSavingsView();
    }
    return true;
}

function createSavingsWithdrawRequest(plan, amount) {
    const val = Number(amount);
    if (!Number.isFinite(val) || val <= 0) {
        alert('请输入有效金额');
        return false;
    }
    if (Number(plan.balance || 0) < val) {
        alert('共同存钱余额不足');
        return false;
    }
    const req = {
        id: `s_req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        amount: val,
        status: 'pending',
        requestBy: 'me',
        createdAt: Date.now(),
        expireAt: Date.now() + 24 * 3600 * 1000,
        handledAt: null
    };
    if (!Array.isArray(plan.withdrawRequests)) plan.withdrawRequests = [];
    plan.withdrawRequests.unshift(req);
    appendSavingsActivity(plan, {
        type: 'withdraw_request',
        actor: 'me',
        amount: val,
        note: '待对方确认（24小时超时）'
    });
    if (typeof sendMessage !== 'undefined' && Number.isFinite(Number(plan.peerContactId))) {
        sendMessage(JSON.stringify({
            requestId: req.id,
            planId: plan.id,
            amount: val
        }), true, 'savings_withdraw_request', null, plan.peerContactId);
    }
    saveConfig();
    return true;
}

window.submitSavingsAmount = function() {
    const input = document.getElementById('bank-savings-amount-input');
    const plan = getActiveSavingsPlan();
    if (!input || !plan) return;
    const amount = Number(input.value);
    if (!Number.isFinite(amount) || amount <= 0) {
        alert('请输入有效金额');
        return;
    }
    const normalized = Number(amount.toFixed(2));
    const ok = savingsAmountModalMode === 'withdraw'
        ? createSavingsWithdrawRequest(plan, normalized)
        : applySavingsDeposit(plan, normalized);
    if (!ok) return;
    window.closeSavingsAmountModal();
    renderBankSavingsView();
};

window.openSavingsChallengeSettings = function() {
    const savings = ensureBankSavingsState();
    const modal = document.getElementById('bank-savings-challenge-modal');
    const enabledEl = document.getElementById('bank-savings-challenge-enabled');
    const levelEl = document.getElementById('bank-savings-challenge-level');
    if (enabledEl) enabledEl.checked = savings.challengeSettings.enabled !== false;
    if (levelEl) levelEl.value = savings.challengeSettings.level || 'normal';
    if (modal) modal.classList.remove('hidden');
};

window.saveSavingsChallengeSettings = function() {
    const savings = ensureBankSavingsState();
    const enabledEl = document.getElementById('bank-savings-challenge-enabled');
    const levelEl = document.getElementById('bank-savings-challenge-level');
    savings.challengeSettings.enabled = !!(enabledEl && enabledEl.checked);
    savings.challengeSettings.level = levelEl ? levelEl.value : 'normal';
    if (!['easy', 'normal', 'hard'].includes(savings.challengeSettings.level)) {
        savings.challengeSettings.level = 'normal';
    }
    const plan = getActiveSavingsPlan();
    if (plan) refreshSavingsChallenges(plan);
    saveConfig();
    const modal = document.getElementById('bank-savings-challenge-modal');
    if (modal) modal.classList.add('hidden');
    renderBankSavingsView();
};

function getMonthKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

function ensureBankAppState() {
    if (!window.iphoneSimState) window.iphoneSimState = {};
    if (!window.iphoneSimState.bankApp || typeof window.iphoneSimState.bankApp !== 'object') {
        window.iphoneSimState.bankApp = {};
    }
    const bank = window.iphoneSimState.bankApp;

    const legacyBalance = Number.isFinite(Number(bank.balance)) ? Number(bank.balance) : null;
    const legacyTotalBalance = Number.isFinite(Number(bank.totalBalance)) ? Number(bank.totalBalance) : null;
    const newCash = Number.isFinite(Number(bank.cashBalance)) ? Number(bank.cashBalance) : null;
    if (newCash === null) {
        bank.cashBalance = legacyBalance !== null ? legacyBalance : (legacyTotalBalance !== null ? legacyTotalBalance : 0);
    } else {
        bank.cashBalance = newCash;
    }

    if (!Array.isArray(bank.transactions)) bank.transactions = [];
    if (!bank.familyCardUsage || typeof bank.familyCardUsage !== 'object') bank.familyCardUsage = {};

    const oldUnbound = Array.isArray(bank.unboundFamilyCardIds) ? bank.unboundFamilyCardIds : [];
    const currentUnbound = Array.isArray(bank.unboundFamilyCards) ? bank.unboundFamilyCards : [];
    bank.unboundFamilyCards = Array.from(new Set([...oldUnbound, ...currentUnbound].map(String)));
    if (!bank.familyCardUsageMonthKey) bank.familyCardUsageMonthKey = getMonthKey();

    return bank;
}

function appendBankTransaction(tx) {
    const bank = ensureBankAppState();
    const record = {
        id: tx.id || `bank_tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: tx.type || 'system',
        amount: Number(tx.amount) || 0,
        title: tx.title || '银行流水',
        sourceApp: tx.sourceApp || 'system',
        sourceType: tx.sourceType,
        sourceKey: tx.sourceKey,
        sourceLabel: tx.sourceLabel,
        time: Number(tx.time) || Date.now(),
        balanceAfterCash: Number.isFinite(Number(tx.balanceAfterCash)) ? Number(tx.balanceAfterCash) : Number(bank.cashBalance) || 0,
        note: tx.note || ''
    };
    bank.transactions.unshift(record);
    if (bank.transactions.length > 100) bank.transactions = bank.transactions.slice(0, 100);
    return record;
}

function ensureFamilyQuotaMonthReset(forceSave = false) {
    const bank = ensureBankAppState();
    const nowKey = getMonthKey();
    const prevKey = bank.familyCardUsageMonthKey || '';
    if (prevKey !== nowKey) {
        bank.familyCardUsage = {};
        bank.familyCardUsageMonthKey = nowKey;
        appendBankTransaction({
            type: 'system',
            amount: 0,
            title: '亲属卡月额度重置',
            sourceApp: 'system',
            note: `month ${prevKey || '-'} -> ${nowKey}`
        });
        saveConfig();
        return true;
    }
    if (forceSave) saveConfig();
    return false;
}

function getReceivedFamilyCardsForBank() {
    const result = [];
    const bankState = ensureBankAppState();
    const hiddenSet = new Set((bankState.unboundFamilyCards || []).map(String));
    const contacts = Array.isArray(window.iphoneSimState.contacts) ? window.iphoneSimState.contacts : [];
    const historyMap = window.iphoneSimState.chatHistory || {};

    const inferFlow = (msg, data, contactName) => {
        const mode = data && data.mode === 'grant' ? 'grant' : 'request';
        const role = msg && msg.role === 'other' ? 'other' : 'user';
        if (mode === 'request') {
            if (role === 'user') return { isReceived: true, flowText: `${contactName} -> 我` };
            return { isReceived: false, flowText: `我 -> ${contactName}` };
        }
        if (role === 'user') return { isReceived: false, flowText: `我 -> ${contactName}` };
        return { isReceived: true, flowText: `${contactName} -> 我` };
    };

    contacts.forEach((contact) => {
        const contactId = contact.id;
        const history = Array.isArray(historyMap[contactId]) ? historyMap[contactId] : [];
        history.forEach((msg) => {
            if (!msg || msg.type !== 'family_card') return;
            let data = null;
            try {
                data = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
            } catch (e) {
                return;
            }
            if (!data || data.status !== 'accepted') return;
            const contactName = contact.name || `联系人${contactId}`;
            const flowInfo = inferFlow(msg, data, contactName);
            if (!flowInfo.isReceived) return;
            const cardId = String(data.id || '');
            if (!cardId) return;
            const entryKey = `${contactId}:${cardId}`;
            if (hiddenSet.has(entryKey)) return;
            const totalLimit = Number(data.monthlyLimit) || 0;
            const used = Number(bankState.familyCardUsage[entryKey]) || 0;
            const remaining = Math.max(totalLimit - used, 0);
            result.push({
                key: entryKey,
                contactId,
                contactName,
                cardId,
                totalLimit,
                used,
                remaining,
                flowText: flowInfo.flowText,
                createdAt: data.createdAt || msg.time || Date.now()
            });
        });
    });

    result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return result;
}

function getBankSpendableSummary() {
    const bank = ensureBankAppState();
    const familyEntries = getReceivedFamilyCardsForBank();
    const totalFamilyRemaining = familyEntries.reduce((sum, e) => sum + (Number(e.remaining) || 0), 0);
    const cashBalance = Number(bank.cashBalance) || 0;
    const totalSpendable = cashBalance + totalFamilyRemaining;
    return {
        cashBalance,
        totalFamilyRemaining,
        totalSpendable,
        familyEntries
    };
}

function applyBankDebit(amount, source) {
    const bank = ensureBankAppState();
    const debit = Number(amount);
    if (!Number.isFinite(debit) || debit <= 0) return { ok: false, message: '金额无效' };
    if (!source || !source.type) return { ok: false, message: '请选择资金来源' };

    if (source.type === 'cash') {
        if ((Number(bank.cashBalance) || 0) < debit) return { ok: false, message: '银行余额不足' };
        bank.cashBalance = Number((Number(bank.cashBalance) - debit).toFixed(2));
    } else if (source.type === 'family_card') {
        const key = String(source.key || '');
        if (!key) return { ok: false, message: '亲属卡来源无效' };
        const summary = getBankSpendableSummary();
        const entry = summary.familyEntries.find((e) => e.key === key);
        if (!entry) return { ok: false, message: '亲属卡不可用' };
        if ((Number(entry.remaining) || 0) < debit) return { ok: false, message: '亲属卡额度不足' };
        bank.familyCardUsage[key] = Number(((Number(bank.familyCardUsage[key]) || 0) + debit).toFixed(2));
    } else {
        return { ok: false, message: '未知资金来源' };
    }

    return { ok: true };
}

function applyBankCredit(amount, title, meta = {}) {
    const bank = ensureBankAppState();
    const credit = Number(amount);
    if (!Number.isFinite(credit) || credit <= 0) return { ok: false, message: '金额无效' };
    bank.cashBalance = Number((Number(bank.cashBalance) + credit).toFixed(2));
    appendBankTransaction({
        type: 'income',
        amount: credit,
        title: title || '入账',
        sourceApp: meta.sourceApp || 'bank',
        sourceType: meta.sourceType,
        sourceKey: meta.sourceKey,
        sourceLabel: meta.sourceLabel,
        note: meta.note
    });
    return { ok: true };
}

function closeBankFundingSourceModalInternal(isCancel) {
    const modal = document.getElementById('bank-funding-source-modal');
    if (modal) modal.classList.add('hidden');
    if (isCancel && typeof bankFundingReject === 'function') {
        bankFundingReject(new Error('cancelled'));
    }
    bankFundingResolve = null;
    bankFundingReject = null;
}

window.closeBankFundingSourceModal = function() {
    closeBankFundingSourceModalInternal(true);
};

function ensureBankFundingModalMounted() {
    const modal = document.getElementById('bank-funding-source-modal');
    if (!modal) return null;
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    if (!modal.dataset.boundMaskClose) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeBankFundingSourceModalInternal(true);
        });
        modal.dataset.boundMaskClose = '1';
    }
    return modal;
}

window.confirmBankFundingSource = function(type, encodedKey) {
    if (!bankFundingResolve) return;
    if (type === 'cash') {
        bankFundingResolve({ type: 'cash', key: 'cash', label: '银行余额' });
        closeBankFundingSourceModalInternal(false);
        return;
    }
    const key = decodeURIComponent(String(encodedKey || ''));
    const summary = getBankSpendableSummary();
    const entry = summary.familyEntries.find((e) => e.key === key);
    if (!entry) {
        alert('亲属卡不可用');
        return;
    }
    bankFundingResolve({ type: 'family_card', key, label: `亲属卡 ${entry.contactName}` });
    closeBankFundingSourceModalInternal(false);
};

function selectBankFundingSource(options = {}) {
    return new Promise((resolve, reject) => {
        const amount = Number(options.amount);
        const onlyFamilyCard = options.onlyFamilyCard === true;
        ensureFamilyQuotaMonthReset(false);
        const modal = ensureBankFundingModalMounted();
        const listEl = document.getElementById('bank-funding-source-list');
        if (!modal || !listEl) {
            reject(new Error('funding source modal missing'));
            return;
        }
        const summary = getBankSpendableSummary();
        const rows = [];
        if (!onlyFamilyCard) {
            rows.push({
                type: 'cash',
                key: 'cash',
                title: '银行余额',
                desc: `可用 ¥${summary.cashBalance.toFixed(2)}`,
                disabled: Number.isFinite(amount) && amount > 0 ? summary.cashBalance < amount : false
            });
        }
        summary.familyEntries.forEach((entry) => {
            rows.push({
                type: 'family_card',
                key: entry.key,
                title: `亲属卡 ${entry.contactName}`,
                desc: `剩余额度 ¥${Number(entry.remaining).toFixed(2)}`,
                disabled: Number.isFinite(amount) && amount > 0 ? Number(entry.remaining) < amount : false
            });
        });
        listEl.innerHTML = rows.map((row) => {
            const encodedKey = encodeURIComponent(row.key);
            return `
                <button class="bank-family-option" ${row.disabled ? 'disabled' : ''} onclick="window.confirmBankFundingSource('${row.type}', '${encodedKey}')">
                    <div class="bank-family-option-title">${row.title}</div>
                    <div class="bank-family-option-desc">${row.desc}${row.disabled ? '（不足）' : ''}</div>
                </button>
            `;
        }).join('');
        if (!rows.length) {
            listEl.innerHTML = '<div style="padding:12px 8px;color:#8e8e93;text-align:center;">暂无可用资金来源</div>';
        }
        bankFundingResolve = resolve;
        bankFundingReject = reject;
        modal.classList.remove('hidden');
    });
}

window.pushFamilyCardSpendHiddenNotice = function(params = {}) {
    try {
        const sourceKey = String(params.sourceKey || '');
        if (!sourceKey.includes(':')) return false;
        const ownerId = parseInt(sourceKey.split(':')[0], 10);
        if (!Number.isFinite(ownerId)) return false;
        if (!window.iphoneSimState.chatHistory) window.iphoneSimState.chatHistory = {};
        if (!Array.isArray(window.iphoneSimState.chatHistory[ownerId])) {
            window.iphoneSimState.chatHistory[ownerId] = [];
        }
        const amount = Number(params.amount || 0);
        const payload = {
            type: 'family_card_spend_notice_hidden',
            amount: Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0,
            itemSummary: params.itemSummary || '',
            scene: params.scene || '',
            sourceLabel: params.sourceLabel || '',
            time: Date.now()
        };
        window.iphoneSimState.chatHistory[ownerId].push({
            id: Date.now() + Math.random(),
            role: 'user',
            type: 'family_card_spend_notice_hidden',
            content: JSON.stringify(payload),
            time: Date.now()
        });
        return true;
    } catch (e) {
        console.warn('pushFamilyCardSpendHiddenNotice failed', e);
        return false;
    }
};

function calcBankDisplayTotal() {
    const summary = getBankSpendableSummary();
    return Number((summary.cashBalance + summary.totalFamilyRemaining).toFixed(2));
}

function formatBankAmountParts(amount) {
    const n = Number(amount);
    const safe = Number.isFinite(n) ? n : 0;
    const fixed = safe.toFixed(2);
    const [intPartRaw, decPart] = fixed.split('.');
    const intPart = intPartRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return {
        intPart,
        decPart
    };
}

function renderBankBalance() {
    const el = document.getElementById('bank-v2-balance-amount');
    if (!el) return;
    const parts = formatBankAmountParts(calcBankDisplayTotal());
    el.innerHTML = `<span style="color:#8e8e93;font-weight:400;">¥</span>${parts.intPart}<span style="color:#8e8e93;font-weight:400;">.${parts.decPart}</span>`;
}

function buildFamilyCardEntriesForBank() {
    return getReceivedFamilyCardsForBank();
}

function renderBankFamilyCards() {
    const cardsEl = document.getElementById('bank-v2-cards');
    if (!cardsEl) return;
    if (!cardsEl.dataset.baseHtml) {
        cardsEl.dataset.baseHtml = cardsEl.innerHTML;
    }

    bankFamilyCardEntries = buildFamilyCardEntriesForBank();
    const extraHtml = bankFamilyCardEntries.map((entry) => {
        const keyAttr = encodeURIComponent(entry.key);
        const tailDigits = `${String(entry.contactId)}${entry.cardId}`.replace(/\D/g, '').slice(-4).padStart(4, '0');
        return `
            <div class="bank-v2-card light bank-v2-family-card" onclick="window.openBankFamilyDetailModal('${keyAttr}')">
                <div class="bank-v2-card-title">
                    Family Card
                    <span class="bank-v2-family-badge">亲属卡</span>
                </div>
                <div class="bank-v2-chip"></div>
                <div class="bank-v2-card-info">
                    <div class="bank-v2-card-num">**** ${tailDigits}</div>
                    <i class="fas fa-credit-card"></i>
                </div>
            </div>
        `;
    }).join('');

    cardsEl.innerHTML = cardsEl.dataset.baseHtml + extraHtml;
}

window.openBankFamilyDetailModal = function(encodedKey) {
    const key = decodeURIComponent(String(encodedKey || ''));
    const entry = bankFamilyCardEntries.find((item) => item.key === key);
    if (!entry) return;
    currentBankFamilyCardKey = key;

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    setText('bank-family-detail-flow', entry.flowText || `${entry.contactName} -> 我`);
    setText('bank-family-detail-limit', `¥${entry.totalLimit.toFixed(0)} / 月`);
    setText('bank-family-detail-remaining', `¥${entry.remaining.toFixed(0)} / 月`);

    const modal = document.getElementById('bank-family-detail-modal');
    if (!modal) return;
    if (!modal.dataset.boundMaskClose) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
        modal.dataset.boundMaskClose = '1';
    }
    modal.classList.remove('hidden');
};

window.closeBankFamilyDetailModal = function() {
    const modal = document.getElementById('bank-family-detail-modal');
    if (modal) modal.classList.add('hidden');
    currentBankFamilyCardKey = null;
};

window.openBankOwnCardDetailModal = function() {
    const bank = ensureBankAppState();
    const cash = Number(bank.cashBalance || 0);
    const cashEl = document.getElementById('bank-own-card-cash');
    if (cashEl) cashEl.textContent = `¥${cash.toFixed(2)}`;

    const modal = document.getElementById('bank-own-card-detail-modal');
    if (!modal) return;
    if (!modal.dataset.boundMaskClose) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
        modal.dataset.boundMaskClose = '1';
    }
    modal.classList.remove('hidden');
};

window.closeBankOwnCardDetailModal = function() {
    const modal = document.getElementById('bank-own-card-detail-modal');
    if (modal) modal.classList.add('hidden');
};

window.unbindBankFamilyCard = function() {
    if (!currentBankFamilyCardKey) return;
    const bankState = ensureBankAppState();
    if (!bankState.unboundFamilyCards.includes(currentBankFamilyCardKey)) {
        bankState.unboundFamilyCards.push(currentBankFamilyCardKey);
        saveConfig();
    }
    window.closeBankFamilyDetailModal();
    window.refreshBankAppFamilyCards();
};

window.refreshBankAppFamilyCards = function() {
    renderBankFamilyCards();
    renderBankBalance();
    if (window.renderBankStatementView) window.renderBankStatementView();
};

window.renderBankStatementView = function() {
    const listEl = document.getElementById('bank-statement-list');
    if (!listEl) return;
    const bank = ensureBankAppState();
    const txs = Array.isArray(bank.transactions) ? bank.transactions : [];
    if (!txs.length) {
        listEl.innerHTML = '<div style="text-align:center;color:#8e8e93;padding:16px 0;">暂无流水</div>';
        return;
    }
    listEl.innerHTML = txs.map((tx) => {
        const amount = Number(tx.amount) || 0;
        const sign = tx.type === 'expense' ? '-' : (tx.type === 'income' ? '+' : '');
        const cls = tx.type === 'expense' ? '#ff3b30' : (tx.type === 'income' ? '#34c759' : '#8e8e93');
        const dt = new Date(Number(tx.time) || Date.now());
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        const hh = String(dt.getHours()).padStart(2, '0');
        const mi = String(dt.getMinutes()).padStart(2, '0');
        const src = tx.sourceLabel ? ` · ${tx.sourceLabel}` : '';
        const cashText = `现金余额 ¥${(Number(tx.balanceAfterCash) || 0).toFixed(2)}`;
        return `
            <div class="bank-v2-contact" style="align-items:flex-start;">
                <div class="bank-v2-contact-meta">
                    <div class="bank-v2-contact-name">${tx.title || '银行流水'}</div>
                    <div class="bank-v2-contact-sub">${mm}-${dd} ${hh}:${mi}${src} · ${cashText}</div>
                </div>
                <div style="font-weight:700;color:${cls};">${sign}¥${amount.toFixed(2)}</div>
            </div>
        `;
    }).join('');
};

function setBankNavTab(tab) {
    const tabOrder = { home: 0, savings: 1, history: 2 };
    const moveBankNavIndicator = (targetTab, immediate = false) => {
        const nav = document.querySelector('#bank-app .bank-v2-bottom-nav');
        const indicator = document.getElementById('bank-nav-indicator');
        const target = document.getElementById(`bank-nav-${targetTab}`);
        if (!nav || !indicator || !target) return;

        const navRect = nav.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        if (!navRect.width || !targetRect.width) {
            setTimeout(() => moveBankNavIndicator(targetTab, true), 0);
            return;
        }
        const x = targetRect.left - navRect.left;
        if (immediate) {
            const prevTransition = indicator.style.transition;
            indicator.style.transition = 'none';
            indicator.style.transform = `translate(${x}px, -50%)`;
            indicator.style.opacity = '1';
            indicator.offsetHeight;
            indicator.style.transition = prevTransition || 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)';
            return;
        }
        indicator.style.transform = `translate(${x}px, -50%)`;
        indicator.style.opacity = '1';
    };
    const playBankViewEnter = (view, direction) => {
        if (!view) return;
        const cls = direction === 'left' ? 'bank-view-enter-left' : 'bank-view-enter-right';
        view.classList.remove('bank-view-enter-left', 'bank-view-enter-right');
        view.offsetHeight;
        view.classList.add(cls);
        setTimeout(() => view.classList.remove('bank-view-enter-left', 'bank-view-enter-right'), 240);
    };

    const homeBtn = document.getElementById('bank-nav-home');
    const savingsBtn = document.getElementById('bank-nav-savings');
    const historyBtn = document.getElementById('bank-nav-history');
    const mainView = document.querySelector('#bank-app > .bank-v2-scroll');
    const savingsView = document.getElementById('bank-savings-view');
    const statementView = document.getElementById('bank-statement-view');
    const prevTab = window.__bankCurrentNavTab || 'home';
    const views = { home: mainView, savings: savingsView, history: statementView };

    if (homeBtn) homeBtn.classList.toggle('active', tab === 'home');
    if (savingsBtn) savingsBtn.classList.toggle('active', tab === 'savings');
    if (historyBtn) historyBtn.classList.toggle('active', tab === 'history');
    moveBankNavIndicator(tab, !window.__bankCurrentNavTab);

    Object.keys(views).forEach((key) => {
        const view = views[key];
        if (!view) return;
        view.classList.toggle('hidden', key !== tab);
    });

    if (tab !== prevTab && views[tab]) {
        const direction = (tabOrder[tab] || 0) >= (tabOrder[prevTab] || 0) ? 'right' : 'left';
        playBankViewEnter(views[tab], direction);
    }

    if (tab === 'savings') renderBankSavingsView();
    if (tab === 'history' && window.renderBankStatementView) window.renderBankStatementView();
    window.__bankCurrentNavTab = tab;
}

window.initBankAppView = function() {
    const bankState = ensureBankAppState();
    ensureFamilyQuotaMonthReset(false);
    if (!Number.isFinite(Number(bankState.cashBalance)) || Number(bankState.cashBalance) < 10000) {
        const min = 10000;
        const max = 99999;
        bankState.cashBalance = Math.floor(Math.random() * (max - min + 1)) + min + Math.random();
        appendBankTransaction({
            type: 'system',
            amount: 0,
            title: '银行初始化余额',
            sourceApp: 'bank'
        });
        saveConfig();
    }
    renderBankBalance();
    renderBankFamilyCards();
    if (window.renderBankStatementView) window.renderBankStatementView();
    setBankNavTab('home');
    if (!window.__bankNavIndicatorResizeBound) {
        window.addEventListener('resize', () => {
            setTimeout(() => setBankNavTab(window.__bankCurrentNavTab || 'home'), 0);
        });
        window.__bankNavIndicatorResizeBound = true;
    }

    const unbindBtn = document.getElementById('bank-family-unbind-btn');
    if (unbindBtn && !unbindBtn.dataset.boundClick) {
        unbindBtn.addEventListener('click', () => window.unbindBankFamilyCard());
        unbindBtn.dataset.boundClick = '1';
    }

    const homeBtn = document.getElementById('bank-nav-home');
    if (homeBtn && !homeBtn.dataset.boundClick) {
        homeBtn.addEventListener('click', () => setBankNavTab('home'));
        homeBtn.dataset.boundClick = '1';
    }
    const historyBtn = document.getElementById('bank-nav-history');
    if (historyBtn && !historyBtn.dataset.boundClick) {
        historyBtn.addEventListener('click', () => setBankNavTab('history'));
        historyBtn.dataset.boundClick = '1';
    }
    const savingsBtn = document.getElementById('bank-nav-savings');
    if (savingsBtn && !savingsBtn.dataset.boundClick) {
        savingsBtn.addEventListener('click', () => setBankNavTab('savings'));
        savingsBtn.dataset.boundClick = '1';
    }

    const savingsMoreBtn = document.getElementById('bank-savings-more-btn');
    if (savingsMoreBtn && !savingsMoreBtn.dataset.boundClick) {
        savingsMoreBtn.addEventListener('click', () => window.openSavingsMoreMenu());
        savingsMoreBtn.dataset.boundClick = '1';
    }
    const savingsInviteBtn = document.getElementById('bank-savings-invite-btn');
    if (savingsInviteBtn && !savingsInviteBtn.dataset.boundClick) {
        savingsInviteBtn.addEventListener('click', () => window.openSavingsInvitePicker());
        savingsInviteBtn.dataset.boundClick = '1';
    }
    const savingsChallengeBtn = document.getElementById('bank-savings-challenge-btn');
    if (savingsChallengeBtn && !savingsChallengeBtn.dataset.boundClick) {
        savingsChallengeBtn.addEventListener('click', () => {
            const moreModal = document.getElementById('bank-savings-more-modal');
            if (moreModal) moreModal.classList.add('hidden');
            window.openSavingsChallengeSettings();
        });
        savingsChallengeBtn.dataset.boundClick = '1';
    }
    const switchBtn = document.getElementById('bank-savings-switch-btn');
    if (switchBtn && !switchBtn.dataset.boundClick) {
        switchBtn.addEventListener('click', () => window.openSavingsSwitchModal());
        switchBtn.dataset.boundClick = '1';
    }
    const depositBtn = document.getElementById('bank-savings-deposit-btn');
    if (depositBtn && !depositBtn.dataset.boundClick) {
        depositBtn.addEventListener('click', () => window.openSavingsAmountModal('deposit'));
        depositBtn.dataset.boundClick = '1';
    }
    const withdrawBtn = document.getElementById('bank-savings-withdraw-btn');
    if (withdrawBtn && !withdrawBtn.dataset.boundClick) {
        withdrawBtn.addEventListener('click', () => window.openSavingsAmountModal('withdraw'));
        withdrawBtn.dataset.boundClick = '1';
    }
    const amountConfirmBtn = document.getElementById('bank-savings-amount-confirm-btn');
    if (amountConfirmBtn && !amountConfirmBtn.dataset.boundClick) {
        amountConfirmBtn.addEventListener('click', () => window.submitSavingsAmount());
        amountConfirmBtn.dataset.boundClick = '1';
    }
    const challengeSaveBtn = document.getElementById('bank-savings-challenge-save-btn');
    if (challengeSaveBtn && !challengeSaveBtn.dataset.boundClick) {
        challengeSaveBtn.addEventListener('click', () => window.saveSavingsChallengeSettings());
        challengeSaveBtn.dataset.boundClick = '1';
    }

    const fundingModal = document.getElementById('bank-funding-source-modal');
    if (fundingModal) ensureBankFundingModalMounted();
    ensureBankSavingsState();
    renderBankSavingsView();
};

window.ensureBankAppState = ensureBankAppState;
window.ensureFamilyQuotaMonthReset = ensureFamilyQuotaMonthReset;
window.getReceivedFamilyCardsForBank = getReceivedFamilyCardsForBank;
window.getBankSpendableSummary = getBankSpendableSummary;
window.selectBankFundingSource = selectBankFundingSource;
window.applyBankDebit = applyBankDebit;
window.applyBankCredit = applyBankCredit;
window.appendBankTransaction = appendBankTransaction;
window.ensureBankSavingsState = ensureBankSavingsState;
window.renderBankSavingsView = renderBankSavingsView;

window.handleFamilyCardDecisionAction = function(payload, contactId, options = {}) {
    const pending = findLatestPendingFamilyCard(contactId);
    const parsed = parseFamilyCardDecisionFromPayload(payload, pending ? pending.data.id : null);
    if (!parsed) return false;

    const rawPayload = String(payload || '');
    const hasExplicitLimit = /(\d{2,6})/.test(rawPayload);
    const existing = findFamilyCardById(contactId, parsed.cardId);
    let resolvedLimit = null;
    if (parsed.status === 'accepted') {
        resolvedLimit = parsed.monthlyLimit;
        if ((!hasExplicitLimit || !resolvedLimit || Number.isNaN(Number(resolvedLimit))) &&
            existing && existing.data.mode === 'grant' && existing.data.monthlyLimit) {
            resolvedLimit = Number(existing.data.monthlyLimit);
        }
    }

    const updated = updateFamilyCardStatus(contactId, parsed.cardId, {
        status: parsed.status,
        monthlyLimit: parsed.status === 'accepted' ? resolvedLimit : null
    });
    if (!updated) return false;

    const shouldSendText = options.sendText === true;
    if (shouldSendText) {
        if (parsed.status === 'accepted') {
            sendMessage(`同意给你开亲属卡，每月额度 ¥${updated.monthlyLimit}。`, false, 'text', null, contactId);
        } else {
            sendMessage('这次我先不办亲属卡。', false, 'text', null, contactId);
        }
    }
    return true;
};

window.createFamilyCardPayload = createFamilyCardPayload;
window.findFamilyCardById = findFamilyCardById;
window.updateFamilyCardStatus = updateFamilyCardStatus;


