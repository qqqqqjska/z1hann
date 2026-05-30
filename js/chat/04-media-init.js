function typewriterEffect(text, avatarUrl, thought = null, replyTo = null, type = 'text', targetContactId = null, options = {}) {
    return new Promise(resolve => {
        const contactId = targetContactId || window.iphoneSimState.currentChatContactId;
        if (!contactId) {
            resolve(null);
            return;
        }

        const contact = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts.find(item => String(item.id) === String(contactId)) || null
            : null;
        const deliveryChannel = typeof window.getResolvedDeliveryChannel === 'function'
            ? window.getResolvedDeliveryChannel(contact, options && options.channel)
            : 'wechat';

        if (!window.iphoneSimState.chatHistory[contactId]) {
            window.iphoneSimState.chatHistory[contactId] = [];
        }
        
        const msgData = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            time: Date.now(),
            role: 'assistant',
            content: text,
            type: type,
            channel: deliveryChannel,
            replyTo: replyTo
        };

        if (deliveryChannel === 'messages-app') {
            msgData.readInMessagesApp = false;
        }
        
        if (thought) {
            msgData.thought = thought;
        }
        if (type === 'text' && options && options.bilingualTranslation && typeof options.bilingualTranslation === 'object') {
            const translatedText = String(options.bilingualTranslation.translatedText || '').trim();
            if (translatedText) {
                msgData.bilingualTranslation = {
                    sourceLang: String(options.bilingualTranslation.sourceLang || '').trim(),
                    targetLang: String(options.bilingualTranslation.targetLang || '').trim(),
                    translatedText
                };
            }
        }
        window.iphoneSimState.chatHistory[contactId].push(msgData);
        if (type === 'text' && window.FloraEngine && typeof window.FloraEngine.analyzeChat === 'function') {
            window.FloraEngine.analyzeChat(text, true, { contactId, type });
        }
        
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
            if (typeof window.updateContactRestStateOnAssistantMessage === 'function') {
                window.updateContactRestStateOnAssistantMessage(contactId, text, type, msgData.time);
            }
        }

        saveConfig();

        if (type === 'text' && window.WhisperChallenge && typeof window.WhisperChallenge.checkAiMessage === 'function') {
            window.WhisperChallenge.checkAiMessage(text, {
                contactId,
                contactName: contact ? (contact.remark || contact.name || '') : '',
                type
            });
        }

        if (window.syncToFloatingChat && window.isScreenSharing) {
            console.log('[ScreenShare Debug] sync assistant reply to floating', {
                contactId,
                type,
                preview: String(text || '').slice(0, 120)
            });
            window.syncToFloatingChat({ content: text, type: type, role: 'assistant' }, contactId);
            if (typeof window.loadFloatingChatHistory === 'function') {
                window.loadFloatingChatHistory();
            }
        }
        
        if (deliveryChannel === 'wechat' && window.iphoneSimState.currentChatContactId === contactId) {
            appendMessageToUI(text, false, type, null, replyTo, msgData.id, msgData.time);
            scrollToBottom();
        }

        if (window.renderContactList) window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        if (deliveryChannel === 'messages-app' && window.MessagesApp && typeof window.MessagesApp.refresh === 'function') {
            window.MessagesApp.refresh(contactId);
        }
        
        if (window.checkAndSummarize) window.checkAndSummarize(contactId);

        resolve(msgData);
    });
}

function handleRegenerateReply() {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
    if (!history || history.length === 0) {
        alert('没有聊天记录，无法重回');
        return;
    }

    document.getElementById('chat-more-panel').classList.add('hidden');

    let hasDeleted = false;
    while (history.length > 0) {
        const lastMsg = history[history.length - 1];
        if (lastMsg.role === 'assistant') {
            history.pop();
            hasDeleted = true;
        } else {
            break;
        }
    }

    if (hasDeleted) {
        saveConfig();
        renderChatHistory(window.iphoneSimState.currentChatContactId);
    }
    
    generateAiReply('请基于当前协议重新生成上一轮回复：保持人设、自然聊天感和正确 JSON 格式；如果已开启显示心声，仍需先输出 thought_state；避免重复上一版的不自然表达。');
}

const CHAT_FOOD_ASSIST_TTL_MS = 10 * 60 * 1000;
const CHAT_ROUTE_ASSIST_TTL_MS = 10 * 60 * 1000;
const CHAT_WEB_LINK_CONTEXT_TTL_MS = 10 * 60 * 1000;
const CHAT_WEB_LINK_CONTEXT_WAIT_TIMEOUT_MS = 1800;
const CHAT_WEB_LINK_CONTEXT_MAX_URLS_PER_MESSAGE = 2;
const CHAT_WEB_LINK_CONTEXT_FAILURE_NOTICE_TTL_MS = 20 * 1000;
const CHAT_NAVIGATION_MODE_META = {
    driving: { key: 'driving', label: '驾车' },
    transit: { key: 'transit', label: '公交地铁' },
    walking: { key: 'walking', label: '步行' },
    bicycling: { key: 'bicycling', label: '骑行' }
};
const CHAT_OOTD_DEFAULT_SUBTITLE = 'SYS.LOG: MONOCHROME FIT';
const CHAT_OOTD_BARCODE_DEFAULT_TEXT = 'CLICK BARCODE TO SCAN FOR DETAILS';
const CHAT_OOTD_BARCODE_SCANNING_TEXT = 'SCANNING...';
const CHAT_OOTD_BARCODE_SUCCESS_TEXT = 'SCANNED SUCCESSFULLY [200 OK]';
const CHAT_OOTD_SECRET_GRID_AWAITING_HTML = `
    <div class="v3-grid-item chat-ootd-awaiting-item">
        <div class="v3-label">STATUS</div>
        <div class="v3-value chat-ootd-awaiting-value">[ AWAITING SCAN ]</div>
    </div>
`;
const CHAT_OOTD_MODAL_TRANSITION_MS = 340;
const CHAT_LOOT_MODAL_TRANSITION_MS = 340;
const CHAT_VLOG_MODAL_TRANSITION_MS = 340;
const CHAT_LOOT_DEFAULT_DESC = '根据联系人当前人设生成今日随身物品中...';
const CHAT_OOTD_V5_DRAG_LIMIT_X = 160;
const CHAT_OOTD_V5_DRAG_LIMIT_Y = 240;
const CHAT_OOTD_V5_FLIPPED_BASE_Y = -40;
const CHAT_OOTD_V5_FLIPPED_SCALE = 1.05;
let currentEditingVoiceCallMsgId = null;
let chatOotdGenerateRequestSeq = 0;
let chatLootGenerateRequestSeq = 0;
let chatVlogGenerateRequestSeq = 0;
const CHAT_STICKER_SUGGESTION_LIMIT = 24;
const AI_PROFILE_HIGHLIGHT_KEYS = ['vlog', 'ootd', 'cafe', 'moment'];
const AI_PROFILE_CUSTOMIZE_TRANSITION_MS = 360;
let aiProfileCustomizeDraft = null;
let aiProfileCustomizeHideTimer = null;
let chatOotdModalHideTimer = null;
let chatLootModalHideTimer = null;
let chatVlogModalHideTimer = null;
let chatLootV1DetailHideTimer = null;
let chatLootV2DetailHideTimer = null;
const chatOotdV5DragState = {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
    offsetX: 0,
    offsetY: 0
};

function getCurrentVoiceCallMessageStore() {
    const contactId = window.iphoneSimState && window.iphoneSimState.currentChatContactId;
    if (!contactId || !window.iphoneSimState || !window.iphoneSimState.chatHistory) return [];
    const history = window.iphoneSimState.chatHistory[contactId];
    if (!Array.isArray(history)) return [];
    return history.filter(msg => msg && msg.type === 'voice_call_text');
}

function getCurrentVoiceCallSessionMeta() {
    const contactId = window.iphoneSimState && window.iphoneSimState.currentChatContactId;
    if (!contactId || !window.iphoneSimState || !window.iphoneSimState.chatHistory) {
        return { contactId: null, history: [], startIndex: 0, activeCall: false };
    }
    const history = Array.isArray(window.iphoneSimState.chatHistory[contactId])
        ? window.iphoneSimState.chatHistory[contactId]
        : [];
    const rawStart = Number(voiceCallStartIndex || 0);
    const startIndex = Number.isFinite(rawStart) ? Math.max(0, Math.min(history.length, rawStart)) : 0;
    const voiceScreen = document.getElementById('voice-call-screen');
    const videoScreen = document.getElementById('video-call-screen');
    const activeCall = !!(
        (voiceScreen && !voiceScreen.classList.contains('hidden'))
        || (videoScreen && !videoScreen.classList.contains('hidden'))
    );
    return { contactId, history, startIndex, activeCall };
}

function getCurrentVoiceCallSessionMessageStore() {
    const session = getCurrentVoiceCallSessionMeta();
    if (!session.history.length) return [];
    return session.history
        .slice(session.startIndex)
        .filter(msg => msg && msg.type === 'voice_call_text');
}

function isVoiceCallMessageInCurrentSession(messageId) {
    if (!messageId) return false;
    const session = getCurrentVoiceCallSessionMeta();
    if (!session.history.length) return false;
    const index = session.history.findIndex(msg => String(msg && msg.id) === String(messageId));
    if (index < 0) return false;
    if (session.activeCall && index < session.startIndex) return false;
    const targetMsg = session.history[index];
    return !!(targetMsg && targetMsg.type === 'voice_call_text');
}

function normalizeVoiceCallTranslatedText(rawText) {
    const text = String(rawText || '').trim();
    if (!text) return '';
    if (typeof normalizeBilingualTranslatedText === 'function') {
        try {
            const normalized = normalizeBilingualTranslatedText(text);
            return String(normalized || '').trim();
        } catch (e) {}
    }
    return text;
}

function normalizeVoiceCallBilingualTranslationMeta(meta) {
    if (!meta || typeof meta !== 'object') return null;
    const translatedText = normalizeVoiceCallTranslatedText(meta.translatedText);
    if (!translatedText) return null;
    return {
        sourceLang: String(meta.sourceLang || '').trim(),
        targetLang: String(meta.targetLang || '').trim(),
        translatedText
    };
}

function getVoiceCallBilingualConfig(contact) {
    if (!contact || typeof contact !== 'object') return null;
    if (typeof window.ensureContactBilingualTranslationFields === 'function') {
        window.ensureContactBilingualTranslationFields(contact);
    }
    if (!contact.bilingualTranslationEnabled) return null;
    const sourceLang = String(contact.bilingualSourceLang || 'zh-CN').trim() || 'zh-CN';
    const targetLang = String(contact.bilingualTargetLang || 'en').trim() || 'en';
    return {
        sourceLang,
        targetLang,
        sourceLabel: typeof window.getChatBilingualLanguageLabel === 'function'
            ? window.getChatBilingualLanguageLabel(sourceLang)
            : sourceLang,
        targetLabel: typeof window.getChatBilingualLanguageLabel === 'function'
            ? window.getChatBilingualLanguageLabel(targetLang)
            : targetLang
    };
}

async function requestVoiceCallBilingualTranslation(text, contact, settingsOverride = null) {
    const sourceText = String(text || '').trim();
    if (!sourceText) return null;
    const bilingualConfig = getVoiceCallBilingualConfig(contact);
    if (!bilingualConfig) return null;
    if (bilingualConfig.sourceLang === bilingualConfig.targetLang) return null;

    const settings = settingsOverride || (
        window.iphoneSimState && window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.url
            ? window.iphoneSimState.aiSettings
            : (window.iphoneSimState ? window.iphoneSimState.aiSettings2 : null)
    );
    if (!settings || !settings.url || !settings.key || !settings.model) return null;

    let fetchUrl = settings.url;
    if (!fetchUrl.endsWith('/chat/completions')) {
        fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
    }

    const systemPrompt = [
        '你是一个高精度翻译助手。',
        `请把用户给你的内容从 ${bilingualConfig.sourceLabel}（${bilingualConfig.sourceLang}）翻译为 ${bilingualConfig.targetLabel}（${bilingualConfig.targetLang}）。`,
        '只输出译文纯文本，不要解释，不要加引号，不要输出任何额外内容。'
    ].join('\n');

    try {
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.key}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: sourceText }
                ],
                temperature: 0.1
            })
        });
        if (!response.ok) return null;
        const data = await response.json();
        const rawTranslatedText = data
            && data.choices
            && data.choices[0]
            && data.choices[0].message
            && typeof data.choices[0].message.content === 'string'
            ? data.choices[0].message.content
            : '';
        const translatedText = normalizeVoiceCallTranslatedText(rawTranslatedText)
            .replace(/^["'`]+/, '')
            .replace(/["'`]+$/, '')
            .trim();
        if (!translatedText) return null;
        return {
            sourceLang: bilingualConfig.sourceLang,
            targetLang: bilingualConfig.targetLang,
            translatedText
        };
    } catch (error) {
        console.warn('voice call bilingual translation failed:', error);
        return null;
    }
}

async function requestVoiceCallBilingualPair(text, contact, settingsOverride = null) {
    const sourceText = String(text || '').trim();
    if (!sourceText) return null;
    const bilingualConfig = getVoiceCallBilingualConfig(contact);
    if (!bilingualConfig) return null;
    if (bilingualConfig.sourceLang === bilingualConfig.targetLang) return null;

    const settings = settingsOverride || (
        window.iphoneSimState && window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.url
            ? window.iphoneSimState.aiSettings
            : (window.iphoneSimState ? window.iphoneSimState.aiSettings2 : null)
    );
    if (!settings || !settings.url || !settings.key || !settings.model) return null;

    let fetchUrl = settings.url;
    if (!fetchUrl.endsWith('/chat/completions')) {
        fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
    }

    const systemPrompt = [
        '你是一个精确翻译与语种规范化助手。',
        `目标原语言（source）是 ${bilingualConfig.sourceLabel}（${bilingualConfig.sourceLang}）。`,
        `目标翻译语言（target）是 ${bilingualConfig.targetLabel}（${bilingualConfig.targetLang}）。`,
        '你会收到一段对话文本，这段文本可能是 source，也可能是 target，或混合。',
        '请输出一个 JSON 对象，字段固定为：{"source_text":"...","target_text":"..."}。',
        '- source_text 必须是完整 source 语言文本。',
        '- target_text 必须是对应完整 target 语言文本。',
        '- 若输入本来就是 source，则 source_text 可等于输入并补全语病，target_text 为译文。',
        '- 若输入本来是 target，则 target_text 可等于输入并补全语病，source_text 为反向译文。',
        '- 只输出 JSON，不要输出任何额外文字，不要 markdown。'
    ].join('\n');

    try {
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.key}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: sourceText }
                ],
                temperature: 0.1
            })
        });
        if (!response.ok) return null;
        const data = await response.json();
        const rawText = data
            && data.choices
            && data.choices[0]
            && data.choices[0].message
            && typeof data.choices[0].message.content === 'string'
            ? data.choices[0].message.content
            : '';
        if (!rawText) return null;
        const jsonText = String(rawText)
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();
        const startIndex = jsonText.indexOf('{');
        const endIndex = jsonText.lastIndexOf('}');
        const safeJson = startIndex !== -1 && endIndex > startIndex
            ? jsonText.slice(startIndex, endIndex + 1)
            : jsonText;
        const parsed = JSON.parse(safeJson);
        const sourceNormalized = normalizeVoiceCallTranslatedText(parsed && parsed.source_text)
            .replace(/^["'`]+/, '')
            .replace(/["'`]+$/, '')
            .trim();
        const targetNormalized = normalizeVoiceCallTranslatedText(parsed && parsed.target_text)
            .replace(/^["'`]+/, '')
            .replace(/["'`]+$/, '')
            .trim();
        if (!sourceNormalized || !targetNormalized) return null;
        return {
            sourceText: sourceNormalized,
            targetText: targetNormalized,
            sourceLang: bilingualConfig.sourceLang,
            targetLang: bilingualConfig.targetLang
        };
    } catch (error) {
        console.warn('voice call bilingual pair failed:', error);
        return null;
    }
}

function parseVoiceCallAssistantPayload(msg) {
    if (!msg || msg.role !== 'assistant') return null;
    try {
        const payload = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
        if (!payload || typeof payload !== 'object') return null;
        return payload;
    } catch (e) {
        return null;
    }
}

function buildVoiceCallDisplayDataFromMessage(msg) {
    if (!msg) {
        return {
            text: '',
            description: '',
            bilingualTranslation: null
        };
    }
    if (msg.role === 'assistant') {
        const payload = parseVoiceCallAssistantPayload(msg);
        if (payload) {
            return {
                text: typeof payload.text === 'string' ? payload.text : '',
                description: typeof payload.description === 'string' ? payload.description : '',
                bilingualTranslation: normalizeVoiceCallBilingualTranslationMeta(payload.bilingualTranslation)
            };
        }
    }
    return {
        text: String(msg.content || ''),
        description: '',
        bilingualTranslation: null
    };
}

function buildVoiceCallDisplayTextFromMessage(msg) {
    return buildVoiceCallDisplayDataFromMessage(msg).text;
}

function isVoiceCallMicEnabled() {
    const voiceScreen = document.getElementById('voice-call-screen');
    const videoScreen = document.getElementById('video-call-screen');
    const voiceActive = voiceScreen && !voiceScreen.classList.contains('hidden');
    const videoActive = videoScreen && !videoScreen.classList.contains('hidden');

    if (videoActive) {
        const videoMicBtn = document.getElementById('video-call-mic-btn');
        return !!(videoMicBtn && videoMicBtn.classList.contains('active'));
    }
    if (voiceActive) {
        const voiceMicBtn = document.getElementById('voice-call-mic-btn');
        return !!(voiceMicBtn && voiceMicBtn.classList.contains('active'));
    }
    return false;
}

function handleVoiceCallRegenerateReply() {
    if (!window.iphoneSimState || !window.iphoneSimState.currentChatContactId) return;
    const session = getCurrentVoiceCallSessionMeta();
    if (!session.history.length) {
        if (window.showChatToast) window.showChatToast('没有可重回的通话消息');
        return;
    }
    if (session.activeCall && session.history.length <= session.startIndex) {
        if (window.showChatToast) window.showChatToast('当前通话还没有可重回内容');
        return;
    }

    let removedAny = false;
    while (session.history.length > 0) {
        if (session.activeCall && session.history.length <= session.startIndex) break;
        const last = session.history[session.history.length - 1];
        if (!(last && last.type === 'voice_call_text')) break;
        if (last.role === 'assistant') {
            session.history.pop();
            removedAny = true;
        } else {
            break;
        }
    }

    if (!removedAny) {
        if (window.showChatToast) window.showChatToast('没有可重回的 AI 通话回复');
        return;
    }

    saveConfig();
    refreshActiveCallMessageView();

    isProcessingResponse = false;
    generateVoiceCallAiReply();
}

function openEditVoiceCallMessageModal(messageId) {
    if (!messageId || !window.iphoneSimState || !window.iphoneSimState.currentChatContactId) return;
    const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
    if (!Array.isArray(history)) return;
    const targetMsg = history.find(msg => String(msg && msg.id) === String(messageId));
    if (!targetMsg || targetMsg.type !== 'voice_call_text') return;
    if (!isVoiceCallMessageInCurrentSession(messageId)) {
        if (window.showChatToast) window.showChatToast('仅可编辑本次通话消息');
        return;
    }

    const textarea = document.getElementById('edit-chat-msg-content');
    const typeInput = document.getElementById('edit-chat-msg-type');
    const modal = document.getElementById('edit-chat-msg-modal');
    const typeSwitch = document.getElementById('edit-chat-msg-type-switch');
    const addInsertedBtn = document.getElementById('add-inserted-chat-msg-btn');
    const insertedList = document.getElementById('inserted-chat-msg-list');
    if (!textarea || !modal) return;

    currentEditingVoiceCallMsgId = String(messageId);
    currentEditingChatMsgId = null;
    textarea.value = buildVoiceCallDisplayTextFromMessage(targetMsg);
    if (typeInput) typeInput.value = 'text';
    if (insertedList) insertedList.innerHTML = '';
    if (typeSwitch) typeSwitch.style.display = 'none';
    if (addInsertedBtn) addInsertedBtn.style.display = 'none';
    if (insertedList) insertedList.style.display = 'none';

    modal.querySelectorAll('.edit-chat-msg-type-btn').forEach(btn => {
        if (btn.closest('.edit-chat-msg-insert-item')) return;
        btn.classList.toggle('active', btn.dataset.msgType === 'text');
    });
    modal.classList.remove('hidden');
}

function refreshActiveCallMessageView() {
    const voiceContainer = document.getElementById('voice-call-content');
    const videoContainer = document.getElementById('video-call-content');
    const voiceScreen = document.getElementById('voice-call-screen');
    const videoScreen = document.getElementById('video-call-screen');
    const voiceVisible = !!(voiceScreen && !voiceScreen.classList.contains('hidden'));
    const videoVisible = !!(videoScreen && !videoScreen.classList.contains('hidden'));

    if (!voiceVisible && !videoVisible) return;
    if (voiceVisible && voiceContainer) voiceContainer.innerHTML = '';
    if (videoVisible && videoContainer) videoContainer.innerHTML = '';

    getCurrentVoiceCallSessionMessageStore().forEach(msg => {
        const displayData = buildVoiceCallDisplayDataFromMessage(msg);
        const role = msg.role === 'assistant' ? 'ai' : 'user';
        if (videoVisible && role === 'ai' && displayData.description) {
            addVoiceCallMessage(displayData.description, 'description');
        }
        if (!displayData.text) return;
        addVoiceCallMessage(displayData.text, role, msg.id, {
            bilingualTranslation: role === 'ai' ? displayData.bilingualTranslation : null
        });
    });
}

function showVoiceCallMessageMenu(targetEl, messageId) {
    if (!isVoiceCallMessageInCurrentSession(messageId)) {
        if (window.showChatToast) window.showChatToast('仅可操作本次通话消息');
        return;
    }
    const oldMenu = document.querySelector('.context-menu');
    if (oldMenu) oldMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <div class="context-menu-item" id="menu-edit">编辑</div>
        <div class="context-menu-item" id="menu-delete" style="color: #ff3b30;">删除</div>
    `;

    menu.style.visibility = 'hidden';
    document.body.appendChild(menu);

    const menuRect = menu.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const edgePadding = 8;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let left = targetRect.left + ((targetRect.width - menuRect.width) / 2) + scrollX;
    let top = targetRect.top - menuRect.height - 10 + scrollY;
    const minLeft = scrollX + edgePadding;
    const maxLeft = scrollX + window.innerWidth - menuRect.width - edgePadding;
    const minTop = scrollY + edgePadding;
    const maxTop = scrollY + window.innerHeight - menuRect.height - edgePadding;
    left = Math.max(minLeft, Math.min(maxLeft, left));
    top = Math.max(minTop, Math.min(maxTop, top));

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.style.visibility = 'visible';

    const closeMenu = (event) => {
        if (!menu.contains(event.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };

    menu.querySelector('#menu-edit').onclick = () => {
        menu.remove();
        openEditVoiceCallMessageModal(messageId);
    };

    menu.querySelector('#menu-delete').onclick = () => {
        menu.remove();
        if (!window.iphoneSimState || !window.iphoneSimState.currentChatContactId) return;
        if (!isVoiceCallMessageInCurrentSession(messageId)) {
            if (window.showChatToast) window.showChatToast('仅可删除本次通话消息');
            return;
        }
        const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
        if (!Array.isArray(history)) return;
        const idx = history.findIndex(msg => String(msg && msg.id) === String(messageId));
        if (idx < 0) return;
        history.splice(idx, 1);
        saveConfig();
        refreshActiveCallMessageView();
    };

    setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

function bindVoiceCallMessageLongPress(msgDiv, messageId) {
    if (!msgDiv || !messageId) return;
    let pressTimer = null;
    let touchMoved = false;

    const clearPressTimer = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    };

    const openMenuAtPoint = (clientX, clientY) => {
        if (!isVoiceCallMessageInCurrentSession(messageId)) return;
        const el = document.elementFromPoint(clientX, clientY) || msgDiv;
        msgDiv.dataset.preventTranslateToggle = '1';
        showVoiceCallMessageMenu(el.closest('.voice-call-msg') || msgDiv, messageId);
    };

    msgDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (!isVoiceCallMessageInCurrentSession(messageId)) return;
        msgDiv.dataset.preventTranslateToggle = '1';
        showVoiceCallMessageMenu(msgDiv, messageId);
    });

    msgDiv.addEventListener('touchstart', (e) => {
        touchMoved = false;
        const touch = e.touches && e.touches[0];
        if (!touch) return;
        clearPressTimer();
        pressTimer = setTimeout(() => {
            openMenuAtPoint(touch.clientX, touch.clientY);
        }, 460);
    }, { passive: true });

    msgDiv.addEventListener('touchmove', () => {
        touchMoved = true;
        clearPressTimer();
    }, { passive: true });

    msgDiv.addEventListener('touchend', () => {
        if (!touchMoved) clearPressTimer();
    }, { passive: true });

    msgDiv.addEventListener('touchcancel', clearPressTimer, { passive: true });
}

function escapeChatOotdHtml(text) {
    return String(text == null ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getChatOotdDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getChatOotdTitleDate(date = new Date()) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}.${day}`;
}

function normalizeChatOotdStyleKey(styleKey) {
    return String(styleKey || '').trim().toLowerCase() === 'v5' ? 'v5' : 'v3';
}

function getChatOotdStyleForContact(contact) {
    return normalizeChatOotdStyleKey(contact && contact.ootdCardStyle);
}

function normalizeChatLootStyleKey(styleKey) {
    return String(styleKey || '').trim().toLowerCase() === 'v2' ? 'v2' : 'v1';
}

function getChatLootStyleForContact(contact) {
    return normalizeChatLootStyleKey(contact && contact.lootCardStyle);
}

function normalizeChatVlogStyleKey(styleKey) {
    return String(styleKey || '').trim().toLowerCase() === 'v2' ? 'v2' : 'v1';
}

function getChatVlogStyleForContact(contact) {
    return normalizeChatVlogStyleKey(contact && contact.vlogCardStyle);
}

function normalizeChatOotdText(value, fallback = '', maxLen = 240) {
    const normalized = String(value == null ? '' : value)
        .replace(/\s+/g, ' ')
        .trim();
    if (!normalized) return fallback;
    return normalized.slice(0, Math.max(1, maxLen));
}

function formatChatOotdScore(scoreValue) {
    const rawText = String(scoreValue == null ? '' : scoreValue).trim();
    const matchedNumber = rawText.match(/(\d+(?:\.\d+)?)/);
    const parsed = matchedNumber ? Number.parseFloat(matchedNumber[1]) : Number.parseFloat(rawText);
    if (Number.isFinite(parsed)) {
        const normalized = Math.max(0, Math.min(10, parsed));
        const fixed = Number.isInteger(normalized) ? normalized.toString() : normalized.toFixed(1);
        return `${fixed} / 10`;
    }
    return '8.5 / 10';
}

function getChatOotdContactDisplayName(contact) {
    if (!contact || typeof contact !== 'object') return 'TA';
    return normalizeChatOotdText(contact.remark || contact.nickname || contact.name, 'TA', 28);
}

function normalizeChatOotdWeather(weather, contact) {
    const rawTemperature = normalizeChatOotdText(weather && weather.temperature, '', 12);
    const parsedTemperature = Number.parseFloat(rawTemperature);
    const city = normalizeChatOotdText(weather && weather.city, '', 24);
    const province = normalizeChatOotdText(weather && weather.province, '', 24);
    const rawWeatherText = normalizeChatOotdText(weather && weather.weather, '', 24);
    const weatherText = /^[a-z\s-]+$/i.test(rawWeatherText) ? rawWeatherText.toUpperCase() : rawWeatherText;
    const locationFromContact = normalizeChatOotdText(
        contact && contact.location && contact.location.query,
        '',
        48
    );
    const locationText = city || locationFromContact || province || '未知位置';
    const promptTemperature = Number.isFinite(parsedTemperature) ? `${parsedTemperature}°C` : '未知温度';
    const cardTemperature = Number.isFinite(parsedTemperature) ? `${Math.round(parsedTemperature)}°C` : '--°C';

    return {
        city,
        province,
        weatherText: weatherText || 'UNKNOWN',
        locationText,
        promptTemperature,
        cardTemperature,
        reportTime: normalizeChatOotdText(weather && weather.reporttime, '', 40)
    };
}

function extractChatOotdJsonString(rawContent) {
    let text = String(rawContent == null ? '' : rawContent)
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
    if (!text) return '';
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        text = text.slice(firstBrace, lastBrace + 1);
    }
    return text;
}

function parseChatOotdJson(rawContent) {
    const jsonText = extractChatOotdJsonString(rawContent);
    if (!jsonText) return null;
    try {
        return JSON.parse(jsonText);
    } catch (error) {
        console.warn('[OOTD] JSON parse failed', error);
        return null;
    }
}

function buildChatOotdFallbackPayload(contact, weatherMeta) {
    const contactName = getChatOotdContactDisplayName(contact);
    const weatherLabel = weatherMeta && weatherMeta.weatherText ? weatherMeta.weatherText : '当前天气';
    const tempLabel = weatherMeta && weatherMeta.promptTemperature ? weatherMeta.promptTemperature : '未知温度';
    return {
        subtitle: CHAT_OOTD_DEFAULT_SUBTITLE,
        description: `根据${contactName}当地${tempLabel}与${weatherLabel}，搭配了兼顾舒适和质感的日常穿搭，适合今天出门通勤或轻度活动。`,
        items: {
            top: 'Lightweight Knit Top',
            bottom: 'Straight Fit Trousers',
            shoes: 'Classic Low-top Sneakers',
            accessories: 'Minimal Silver Necklace'
        },
        satisfaction: '8.5 / 10',
        review: '整体上身轻盈，行动方便，风格也比较耐看，今天这套我会继续穿。'
    };
}

function normalizeChatOotdPayload(rawPayload, contact, weatherMeta) {
    const fallbackPayload = buildChatOotdFallbackPayload(contact, weatherMeta);
    const payload = rawPayload && typeof rawPayload === 'object' ? rawPayload : {};
    const itemMap = payload.items && typeof payload.items === 'object' ? payload.items : {};
    const normalized = {
        subtitle: normalizeChatOotdText(
            payload.subtitle || payload.subTitle || payload.title_en || payload.title,
            fallbackPayload.subtitle,
            64
        ),
        description: normalizeChatOotdText(
            payload.description || payload.outfitDescription || payload.desc || payload.summary,
            fallbackPayload.description,
            320
        ),
        items: {
            top: normalizeChatOotdText(
                itemMap.top || itemMap.upper || itemMap.up || payload.top || payload.upper || payload['上身'],
                fallbackPayload.items.top,
                72
            ),
            bottom: normalizeChatOotdText(
                itemMap.bottom || itemMap.lower || itemMap.down || payload.bottom || payload.lower || payload['下身'],
                fallbackPayload.items.bottom,
                72
            ),
            shoes: normalizeChatOotdText(
                itemMap.shoes || itemMap.footwear || payload.shoes || payload.footwear || payload['鞋子'],
                fallbackPayload.items.shoes,
                72
            ),
            accessories: normalizeChatOotdText(
                itemMap.accessories || itemMap.accessory || payload.accessories || payload.accessory || payload['配饰'],
                fallbackPayload.items.accessories,
                72
            )
        },
        satisfaction: formatChatOotdScore(
            payload.satisfaction || payload.rating || payload.score || payload['满意度']
        ),
        review: normalizeChatOotdText(
            payload.review || payload.selfReview || payload.comment || payload.feedback || payload['评价'],
            fallbackPayload.review,
            320
        )
    };
    return normalized;
}

function buildChatOotdSecretGridHtml(items) {
    const top = escapeChatOotdHtml((items && items.top) || '');
    const bottom = escapeChatOotdHtml((items && items.bottom) || '');
    const shoes = escapeChatOotdHtml((items && items.shoes) || '');
    const accessories = escapeChatOotdHtml((items && items.accessories) || '');
    return `
        <div class="v3-grid-item v3-fade-in" style="padding: 8px; animation-delay: 0.1s;">
            <div class="v3-label">TOP</div>
            <div class="v3-value">${top}</div>
        </div>
        <div class="v3-grid-item v3-fade-in" style="padding: 8px; animation-delay: 0.2s;">
            <div class="v3-label">BOTTOM</div>
            <div class="v3-value">${bottom}</div>
        </div>
        <div class="v3-grid-item v3-fade-in" style="padding: 8px; animation-delay: 0.3s;">
            <div class="v3-label">FOOTWEAR</div>
            <div class="v3-value">${shoes}</div>
        </div>
        <div class="v3-grid-item v3-fade-in" style="padding: 8px; background: #18181b; animation-delay: 0.4s;">
            <div class="v3-label" style="color: #a1a1aa;">ACCESSORIES</div>
            <div class="v3-value" style="color: #fff;">${accessories}</div>
        </div>
    `;
}

function clampChatOotdV5Drag(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
}

function applyChatOotdV5DraggedTransform(bottom) {
    if (!bottom) return;
    const x = chatOotdV5DragState.offsetX;
    const y = CHAT_OOTD_V5_FLIPPED_BASE_Y + chatOotdV5DragState.offsetY;
    bottom.style.transform = `translate(${x}px, ${y}px) rotateY(0deg) scale(${CHAT_OOTD_V5_FLIPPED_SCALE})`;
}

function resetChatOotdV5DragState(fullReset = false) {
    const bottom = document.getElementById('chat-ootd-v5-bottom');
    if (bottom) {
        bottom.classList.remove('dragging');
        if (
            chatOotdV5DragState.pointerId != null
            && typeof bottom.releasePointerCapture === 'function'
            && bottom.hasPointerCapture(chatOotdV5DragState.pointerId)
        ) {
            try {
                bottom.releasePointerCapture(chatOotdV5DragState.pointerId);
            } catch (error) {
                // Ignore pointer capture release errors
            }
        }
    }
    chatOotdV5DragState.active = false;
    chatOotdV5DragState.pointerId = null;
    chatOotdV5DragState.startX = 0;
    chatOotdV5DragState.startY = 0;
    chatOotdV5DragState.startOffsetX = 0;
    chatOotdV5DragState.startOffsetY = 0;
    if (fullReset) {
        chatOotdV5DragState.offsetX = 0;
        chatOotdV5DragState.offsetY = 0;
    }
}

function startChatOotdV5Drag(event) {
    const bottom = document.getElementById('chat-ootd-v5-bottom');
    const loadingEl = document.getElementById('chat-ootd-loading');
    if (!bottom || !bottom.classList.contains('flipped')) return;
    if (loadingEl && !loadingEl.classList.contains('hidden')) return;
    if (typeof event.button === 'number' && event.button !== 0) return;

    chatOotdV5DragState.active = true;
    chatOotdV5DragState.pointerId = event.pointerId != null ? event.pointerId : null;
    chatOotdV5DragState.startX = Number(event.clientX || 0);
    chatOotdV5DragState.startY = Number(event.clientY || 0);
    chatOotdV5DragState.startOffsetX = chatOotdV5DragState.offsetX;
    chatOotdV5DragState.startOffsetY = chatOotdV5DragState.offsetY;
    bottom.classList.add('dragging');
    bottom.style.transition = 'none';

    if (chatOotdV5DragState.pointerId != null && typeof bottom.setPointerCapture === 'function') {
        try {
            bottom.setPointerCapture(chatOotdV5DragState.pointerId);
        } catch (error) {
            // Ignore pointer capture errors
        }
    }
    event.preventDefault();
}

function moveChatOotdV5Drag(event) {
    if (!chatOotdV5DragState.active) return;
    if (chatOotdV5DragState.pointerId != null && event.pointerId != null && event.pointerId !== chatOotdV5DragState.pointerId) {
        return;
    }
    const bottom = document.getElementById('chat-ootd-v5-bottom');
    if (!bottom || !bottom.classList.contains('flipped')) {
        resetChatOotdV5DragState(false);
        return;
    }

    const dx = Number(event.clientX || 0) - chatOotdV5DragState.startX;
    const dy = Number(event.clientY || 0) - chatOotdV5DragState.startY;
    chatOotdV5DragState.offsetX = clampChatOotdV5Drag(
        chatOotdV5DragState.startOffsetX + dx,
        -CHAT_OOTD_V5_DRAG_LIMIT_X,
        CHAT_OOTD_V5_DRAG_LIMIT_X
    );
    chatOotdV5DragState.offsetY = clampChatOotdV5Drag(
        chatOotdV5DragState.startOffsetY + dy,
        -CHAT_OOTD_V5_DRAG_LIMIT_Y,
        CHAT_OOTD_V5_DRAG_LIMIT_Y
    );
    applyChatOotdV5DraggedTransform(bottom);
    event.preventDefault();
}

function endChatOotdV5Drag(event) {
    if (!chatOotdV5DragState.active) return;
    if (chatOotdV5DragState.pointerId != null && event.pointerId != null && event.pointerId !== chatOotdV5DragState.pointerId) {
        return;
    }
    const bottom = document.getElementById('chat-ootd-v5-bottom');
    if (bottom) {
        bottom.classList.remove('dragging');
        if (
            chatOotdV5DragState.pointerId != null
            && typeof bottom.releasePointerCapture === 'function'
            && bottom.hasPointerCapture(chatOotdV5DragState.pointerId)
        ) {
            try {
                bottom.releasePointerCapture(chatOotdV5DragState.pointerId);
            } catch (error) {
                // Ignore pointer capture release errors
            }
        }
        if (bottom.classList.contains('flipped')) {
            bottom.style.transition = 'transform 0.16s ease-out';
            applyChatOotdV5DraggedTransform(bottom);
            setTimeout(() => {
                if (!chatOotdV5DragState.active && bottom.classList.contains('flipped')) {
                    bottom.style.transition = '';
                }
            }, 180);
        }
    }
    chatOotdV5DragState.active = false;
    chatOotdV5DragState.pointerId = null;
}

function resetChatOotdV5InteractiveState() {
    const card = document.getElementById('chat-ootd-card');
    const tearLine = document.getElementById('chat-ootd-v5-tear-line');
    const bottom = document.getElementById('chat-ootd-v5-bottom');
    const front = document.getElementById('chat-ootd-v5-front');
    const back = document.getElementById('chat-ootd-v5-back');
    resetChatOotdV5DragState(true);
    if (card) {
        card.style.position = '';
        card.style.top = '';
        card.style.left = '';
        card.style.width = '';
        card.style.margin = '';
        card.style.marginTop = '';
        card.style.alignSelf = '';
    }
    if (tearLine) {
        tearLine.style.opacity = '1';
    }
    if (bottom) {
        bottom.classList.remove('torn', 'flipping', 'flipped');
        bottom.style.transition = '';
        bottom.style.transform = '';
        bottom.style.cursor = '';
    }
    if (front) {
        front.style.display = 'block';
    }
    if (back) {
        back.style.display = 'none';
    }
}

function applyChatOotdStyle(styleKey) {
    const normalized = normalizeChatOotdStyleKey(styleKey);
    const cardEl = document.getElementById('chat-ootd-card');
    const viewV3 = document.getElementById('chat-ootd-view-v3');
    const viewV5 = document.getElementById('chat-ootd-view-v5');
    if (cardEl) {
        cardEl.classList.toggle('chat-ootd-card-v5', normalized === 'v5');
        cardEl.classList.toggle('v3', normalized === 'v3');
    }
    if (viewV3) {
        viewV3.classList.toggle('hidden', normalized !== 'v3');
    }
    if (viewV5) {
        viewV5.classList.toggle('hidden', normalized !== 'v5');
    }
    resetChatOotdV5InteractiveState();
}

function resetChatOotdInteractiveState() {
    const fingerprintBox = document.getElementById('chat-ootd-fingerprint-box');
    const fingerprintIdle = document.getElementById('chat-ootd-fingerprint-idle');
    const fingerprintResult = document.getElementById('chat-ootd-fingerprint-result');
    const fingerprintIcon = document.getElementById('chat-ootd-fp-icon');
    const fingerprintText = document.getElementById('chat-ootd-fp-text');
    const barcodeScanner = document.getElementById('chat-ootd-barcode-scanner');
    const barcodeText = document.getElementById('chat-ootd-barcode-text');
    const secretGrid = document.getElementById('chat-ootd-secret-grid');

    if (fingerprintBox) {
        fingerprintBox.classList.remove('scanned');
        fingerprintBox.style.pointerEvents = 'auto';
    }
    if (fingerprintIdle) {
        fingerprintIdle.style.display = 'flex';
    }
    if (fingerprintResult) {
        fingerprintResult.style.display = 'none';
        fingerprintResult.style.opacity = '0';
    }
    if (fingerprintIcon) {
        fingerprintIcon.style.color = '#3f3f46';
        fingerprintIcon.style.transform = 'scale(1)';
    }
    if (fingerprintText) {
        fingerprintText.textContent = 'AUTH REQ';
        fingerprintText.style.color = '#a1a1aa';
    }
    if (barcodeScanner) {
        barcodeScanner.classList.remove('scanning');
        barcodeScanner.style.display = 'block';
    }
    if (barcodeText) {
        barcodeText.style.display = 'block';
        barcodeText.textContent = CHAT_OOTD_BARCODE_DEFAULT_TEXT;
        barcodeText.style.color = '';
    }
    if (secretGrid) {
        secretGrid.classList.remove('scanned');
        secretGrid.innerHTML = CHAT_OOTD_SECRET_GRID_AWAITING_HTML;
    }
    resetChatOotdV5InteractiveState();
}

function setChatOotdLoading(loading, loadingText = 'GENERATING OOTD...') {
    const loadingEl = document.getElementById('chat-ootd-loading');
    const cardEl = document.getElementById('chat-ootd-card');
    const refreshBtn = document.getElementById('chat-ootd-refresh-btn');
    if (loadingEl) {
        loadingEl.textContent = loadingText;
        loadingEl.classList.toggle('hidden', !loading);
    }
    if (cardEl) {
        cardEl.classList.toggle('is-loading', !!loading);
    }
    if (refreshBtn) {
        refreshBtn.disabled = !!loading;
    }
}

function renderChatOotdResult(contact, weatherMeta, ootdPayload) {
    const titleEl = document.getElementById('chat-ootd-title');
    const subtitleEl = document.getElementById('chat-ootd-subtitle');
    const weatherValueEl = document.getElementById('chat-ootd-weather-value');
    const ratingEl = document.getElementById('chat-ootd-rating');
    const reviewEl = document.getElementById('chat-ootd-review');
    const descEl = document.getElementById('chat-ootd-description');
    const secretGrid = document.getElementById('chat-ootd-secret-grid');
    const v5TempEl = document.getElementById('chat-ootd-v5-temp');
    const v5BarcodeEl = document.getElementById('chat-ootd-v5-barcode');
    const v5TitleEl = document.getElementById('chat-ootd-v5-title');
    const v5RatingEl = document.getElementById('chat-ootd-v5-rating');
    const v5TextEl = document.getElementById('chat-ootd-v5-text');
    const v5ItemTopEl = document.getElementById('chat-ootd-v5-item-top');
    const v5ItemBottomEl = document.getElementById('chat-ootd-v5-item-bottom');
    const v5ItemShoesEl = document.getElementById('chat-ootd-v5-item-shoes');
    const v5ItemAccessoriesEl = document.getElementById('chat-ootd-v5-item-accessories');
    const v5ReviewEl = document.getElementById('chat-ootd-v5-review');

    const today = new Date();
    const mdCode = `${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const fallbackPayload = buildChatOotdFallbackPayload(contact, weatherMeta);
    const items = ootdPayload && ootdPayload.items ? ootdPayload.items : fallbackPayload.items;
    const scoreText = normalizeChatOotdText(
        ootdPayload && ootdPayload.satisfaction,
        '8.5 / 10',
        24
    );

    if (titleEl) {
        titleEl.textContent = `OOTD // ${getChatOotdTitleDate(today)}`;
    }
    if (subtitleEl) {
        subtitleEl.textContent = normalizeChatOotdText(
            ootdPayload && ootdPayload.subtitle,
            CHAT_OOTD_DEFAULT_SUBTITLE,
            64
        );
    }
    if (weatherValueEl) {
        const weatherLine = escapeChatOotdHtml((weatherMeta && weatherMeta.cardTemperature) || '--°C');
        const weatherText = escapeChatOotdHtml((weatherMeta && weatherMeta.weatherText) || 'UNKNOWN');
        weatherValueEl.innerHTML = `${weatherLine}<br><span class="chat-ootd-weather-text">${weatherText}</span>`;
    }
    if (ratingEl) {
        ratingEl.textContent = scoreText;
    }
    if (reviewEl) {
        reviewEl.textContent = normalizeChatOotdText(
            ootdPayload && ootdPayload.review,
            fallbackPayload.review,
            320
        );
    }
    if (descEl) {
        descEl.textContent = normalizeChatOotdText(
            ootdPayload && ootdPayload.description,
            fallbackPayload.description,
            320
        );
    }
    if (secretGrid) {
        secretGrid.dataset.top = normalizeChatOotdText(items.top, '', 72);
        secretGrid.dataset.bottom = normalizeChatOotdText(items.bottom, '', 72);
        secretGrid.dataset.shoes = normalizeChatOotdText(items.shoes, '', 72);
        secretGrid.dataset.accessories = normalizeChatOotdText(items.accessories, '', 72);
    }
    if (v5TempEl) {
        v5TempEl.textContent = normalizeChatOotdText(
            weatherMeta && weatherMeta.cardTemperature,
            '--°C',
            16
        );
    }
    if (v5BarcodeEl) {
        v5BarcodeEl.textContent = `*TAG-${mdCode}*`;
    }
    if (v5TitleEl) {
        v5TitleEl.textContent = normalizeChatOotdText(
            `${getChatOotdContactDisplayName(contact)} Fit`,
            'Today Tag',
            36
        );
    }
    if (v5RatingEl) {
        v5RatingEl.textContent = `★ ${scoreText}`;
    }
    if (v5TextEl) {
        v5TextEl.textContent = normalizeChatOotdText(
            ootdPayload && ootdPayload.description,
            fallbackPayload.description,
            320
        );
    }
    if (v5ItemTopEl) {
        v5ItemTopEl.textContent = normalizeChatOotdText(items.top, '-', 72);
    }
    if (v5ItemBottomEl) {
        v5ItemBottomEl.textContent = normalizeChatOotdText(items.bottom, '-', 72);
    }
    if (v5ItemShoesEl) {
        v5ItemShoesEl.textContent = normalizeChatOotdText(items.shoes, '-', 72);
    }
    if (v5ItemAccessoriesEl) {
        v5ItemAccessoriesEl.textContent = normalizeChatOotdText(items.accessories, '-', 72);
    }
    if (v5ReviewEl) {
        v5ReviewEl.textContent = normalizeChatOotdText(
            ootdPayload && ootdPayload.review,
            fallbackPayload.review,
            320
        );
    }

    resetChatOotdInteractiveState();
}

function openChatOotdModalUi() {
    const modal = document.getElementById('chat-ootd-modal');
    if (!modal) return;
    if (chatOotdModalHideTimer) {
        clearTimeout(chatOotdModalHideTimer);
        chatOotdModalHideTimer = null;
    }
    modal.classList.remove('chat-ootd-open');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
        modal.classList.add('chat-ootd-open');
    });
}

function closeChatOotdModalUi() {
    const modal = document.getElementById('chat-ootd-modal');
    if (!modal) return;
    if (chatOotdModalHideTimer) {
        clearTimeout(chatOotdModalHideTimer);
        chatOotdModalHideTimer = null;
    }
    modal.classList.remove('chat-ootd-open');
    modal.setAttribute('aria-hidden', 'true');
    setChatOotdLoading(false);
    chatOotdModalHideTimer = setTimeout(() => {
        if (!modal.classList.contains('chat-ootd-open')) {
            modal.classList.add('hidden');
        }
        chatOotdModalHideTimer = null;
    }, CHAT_OOTD_MODAL_TRANSITION_MS);
}

function getChatVlogUserMeta(contact) {
    let userName = '我';
    if (contact && contact.userPersonaId) {
        const persona = Array.isArray(window.iphoneSimState && window.iphoneSimState.userPersonas)
            ? window.iphoneSimState.userPersonas.find(item => item.id === contact.userPersonaId)
            : null;
        if (persona && persona.name) userName = String(persona.name).trim();
    } else if (window.iphoneSimState && window.iphoneSimState.userProfile && window.iphoneSimState.userProfile.name) {
        userName = String(window.iphoneSimState.userProfile.name).trim();
    }

    const aliasSet = new Set([
        '我', '用户', '自己', '本人', '你', 'me', 'myself', 'self', 'user', 'you'
    ]);
    const addAlias = (value) => {
        const text = String(value || '').trim();
        if (!text) return;
        const normalized = text.replace(/^@+/, '').toLowerCase();
        if (!normalized) return;
        aliasSet.add(normalized);
        aliasSet.add(text.toLowerCase());
    };
    addAlias(userName);
    if (window.iphoneSimState && window.iphoneSimState.userProfile && window.iphoneSimState.userProfile.name) {
        addAlias(window.iphoneSimState.userProfile.name);
    }
    return {
        userName: normalizeChatOotdText(userName, '我', 42),
        aliasSet
    };
}

function getChatVlogTargetKey(value) {
    return String(value == null ? '' : value)
        .trim()
        .replace(/^@+/, '')
        .replace(/\s+/g, '')
        .toLowerCase();
}

function isChatVlogForbiddenTarget(target, forbiddenAliasSet) {
    const key = getChatVlogTargetKey(target);
    if (!key) return true;
    if (!forbiddenAliasSet || !(forbiddenAliasSet instanceof Set)) {
        return false;
    }
    return forbiddenAliasSet.has(key) || forbiddenAliasSet.has(`@${key}`);
}

function normalizeChatVlogTarget(value, fallback = '') {
    const text = normalizeChatOotdText(value, fallback, 24).replace(/^@+/, '');
    return text;
}

function normalizeChatVlogTimeLabel(value, fallback = '08:30') {
    const text = normalizeChatOotdText(value, '', 20).toUpperCase();
    if (!text) return fallback;
    const match = text.match(/(\d{1,2})\s*[:：]\s*(\d{2})(?:\s*(AM|PM))?/i);
    if (!match) return fallback;
    let hour = Number.parseInt(match[1], 10);
    const minute = Number.parseInt(match[2], 10);
    const ampm = String(match[3] || '').toUpperCase();
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return fallback;
    if (minute < 0 || minute > 59) return fallback;
    if (ampm === 'AM' || ampm === 'PM') {
        hour = Math.max(1, Math.min(12, hour));
        if (ampm === 'AM') {
            if (hour === 12) hour = 0;
        } else if (hour !== 12) {
            hour += 12;
        }
    } else {
        if (hour < 0 || hour > 23) return fallback;
    }
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function getChatVlogMinutes(timeLabel = '00:00') {
    const match = String(timeLabel || '').match(/^(\d{2}):(\d{2})$/);
    if (!match) return 0;
    const hour = Number.parseInt(match[1], 10);
    const minute = Number.parseInt(match[2], 10);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
    return (hour * 60) + minute;
}

function formatChatVlogTimeForV1(time24 = '00:00') {
    const match = String(time24 || '').match(/^(\d{2}):(\d{2})$/);
    if (!match) return '00:00 AM';
    const hour = Number.parseInt(match[1], 10);
    const minute = Number.parseInt(match[2], 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
}

function getChatVlogMonthLabel(date = new Date()) {
    const labels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const index = Number(date.getMonth());
    if (!Number.isFinite(index) || index < 0 || index > 11) return 'MONTH';
    return labels[index];
}

function getChatVlogWeatherIcon(weatherText, styleKey = 'v1') {
    const text = String(weatherText || '').toLowerCase();
    if (/雨|rain|shower|storm|thunder/.test(text)) return 'ri-rainy-line';
    if (/雪|snow|sleet|hail/.test(text)) return 'ri-snowy-line';
    if (/晴|clear|sun/.test(text)) return styleKey === 'v2' ? 'ri-sun-line' : 'ri-sun-cloudy-line';
    if (/云|阴|overcast|cloud|fog|haze|mist/.test(text)) return styleKey === 'v2' ? 'ri-moon-cloudy-line' : 'ri-cloudy-line';
    return styleKey === 'v2' ? 'ri-moon-cloudy-line' : 'ri-sun-cloudy-line';
}

function parseChatVlogJson(rawContent) {
    const jsonText = extractChatOotdJsonString(rawContent);
    if (!jsonText) return null;
    try {
        return JSON.parse(jsonText);
    } catch (error) {
        console.warn('[VLOG] parse json failed', error);
        return null;
    }
}

function buildChatVlogFallbackPayload(contact, weatherMeta, userMeta) {
    const displayName = getChatOotdContactDisplayName(contact);
    const userName = normalizeChatOotdText(userMeta && userMeta.userName, '我', 42);
    const weatherText = normalizeChatOotdText(weatherMeta && weatherMeta.weatherText, 'UNKNOWN', 24);
    return {
        titleEn: 'One Day',
        titleZh: '日常记录',
        footerLeft: '// LOG_ENTRY_01',
        footerRight: 'END OF DAY',
        summary: `${displayName} 今日对外沟通记录（排除对${userName}的对话）`,
        entries: [
            { time: '08:30', to: '妈妈', content: `今天${weatherText}，我出门前会把雨伞带上。` },
            { time: '10:40', to: '同事阿澄', content: '下午会议我会提前十分钟到，资料我已经整理好了。' },
            { time: '13:10', to: '咖啡店店员', content: '帮我来一杯冰美式，少冰，谢谢。' },
            { time: '15:35', to: '快递员', content: '我现在在公司前台，你到了直接联系我就行。' },
            { time: '18:20', to: '健身教练', content: '我今晚会晚到半小时，训练计划照旧。' },
            { time: '21:45', to: '朋友林木', content: '今天行程很满，周末我们再约见面聊。' }
        ]
    };
}

function normalizeChatVlogEntry(item, index, forbiddenAliasSet) {
    const source = item && typeof item === 'object' ? item : {};
    const fallbackTimes = ['08:30', '10:40', '13:10', '15:35', '18:20', '21:45', '23:10'];
    const fallbackTime = fallbackTimes[index % fallbackTimes.length];
    const time = normalizeChatVlogTimeLabel(
        source.time || source.timeLabel || source.at || source['时间'],
        fallbackTime
    );
    const target = normalizeChatVlogTarget(
        source.to || source.toPerson || source.target || source.person || source['对象'] || source['对谁说'],
        ''
    );
    if (!target || isChatVlogForbiddenTarget(target, forbiddenAliasSet)) return null;
    const content = normalizeChatOotdText(
        source.content || source.text || source.line || source.quote || source['内容'],
        '',
        220
    );
    if (!content) return null;
    return { time, to: target, content };
}

function normalizeChatVlogPayload(rawPayload, contact, weatherMeta, userMeta) {
    const fallbackPayload = buildChatVlogFallbackPayload(contact, weatherMeta, userMeta);
    const payload = rawPayload && typeof rawPayload === 'object' ? rawPayload : {};
    const sourceEntries = Array.isArray(payload.entries)
        ? payload.entries
        : (Array.isArray(payload.timeline)
            ? payload.timeline
            : (Array.isArray(payload.logs)
                ? payload.logs
                : (Array.isArray(payload.dialogues) ? payload.dialogues : [])));
    const forbiddenAliasSet = userMeta && userMeta.aliasSet instanceof Set
        ? userMeta.aliasSet
        : new Set();
    const normalizedEntries = sourceEntries
        .slice(0, 14)
        .map((item, index) => normalizeChatVlogEntry(item, index, forbiddenAliasSet))
        .filter(Boolean);

    let entries = normalizedEntries;
    if (entries.length < 4) {
        const fallbackEntries = fallbackPayload.entries
            .map((item, index) => normalizeChatVlogEntry(item, index, forbiddenAliasSet))
            .filter(Boolean);
        entries = [...entries, ...fallbackEntries].slice(0, 10);
    }

    entries = entries
        .sort((a, b) => getChatVlogMinutes(a.time) - getChatVlogMinutes(b.time))
        .slice(0, 10);

    return {
        titleEn: normalizeChatOotdText(
            payload.titleEn || payload.title_en || payload.title || payload.headline || payload['标题英文'],
            fallbackPayload.titleEn,
            42
        ),
        titleZh: normalizeChatOotdText(
            payload.titleZh || payload.title_zh || payload.title_cn || payload['标题中文'],
            fallbackPayload.titleZh,
            28
        ),
        footerLeft: normalizeChatOotdText(
            payload.footerLeft || payload.footer_left || payload.logCode || payload['底部左侧'],
            fallbackPayload.footerLeft,
            40
        ),
        footerRight: normalizeChatOotdText(
            payload.footerRight || payload.footer_right || payload.status || payload['底部右侧'],
            fallbackPayload.footerRight,
            44
        ),
        entries
    };
}

function buildChatVlogV1TimelineHtml(entries = []) {
    return entries.map((entry) => `
        <div class="chat-vlog-v1-item">
            <div class="chat-vlog-v1-time">${escapeChatOotdHtml(formatChatVlogTimeForV1(entry.time))} <span class="chat-vlog-v1-to">@${escapeChatOotdHtml(entry.to)}</span></div>
            <div class="chat-vlog-v1-content">${escapeChatOotdHtml(entry.content)}</div>
        </div>
    `).join('');
}

function buildChatVlogV2TimelineHtml(entries = []) {
    return entries.map((entry) => `
        <div class="chat-vlog-v2-item">
            <div class="chat-vlog-v2-time">${escapeChatOotdHtml(entry.time)}<span class="chat-vlog-v2-to">@${escapeChatOotdHtml(entry.to)}</span></div>
            <div class="chat-vlog-v2-content">${escapeChatOotdHtml(entry.content)}</div>
        </div>
    `).join('');
}

function applyChatVlogStyle(styleKey) {
    const normalized = normalizeChatVlogStyleKey(styleKey);
    const modal = document.getElementById('chat-vlog-modal');
    const card = document.getElementById('chat-vlog-card');
    const viewV1 = document.getElementById('chat-vlog-view-v1');
    const viewV2 = document.getElementById('chat-vlog-view-v2');
    if (modal) {
        modal.classList.toggle('chat-vlog-theme-v1', normalized === 'v1');
        modal.classList.toggle('chat-vlog-theme-v2', normalized === 'v2');
    }
    if (card) {
        card.classList.toggle('chat-vlog-card-v1', normalized === 'v1');
        card.classList.toggle('chat-vlog-card-v2', normalized === 'v2');
    }
    if (viewV1) viewV1.classList.toggle('hidden', normalized !== 'v1');
    if (viewV2) viewV2.classList.toggle('hidden', normalized !== 'v2');
}

function setChatVlogLoading(loading, loadingText = 'GENERATING VLOG...') {
    const loadingEl = document.getElementById('chat-vlog-loading');
    const card = document.getElementById('chat-vlog-card');
    if (loadingEl) {
        loadingEl.textContent = loadingText;
        loadingEl.classList.toggle('hidden', !loading);
    }
    if (card) {
        card.classList.toggle('is-loading', !!loading);
    }
}

function renderChatVlogResult(contact, weatherMeta, vlogPayload) {
    const userMeta = getChatVlogUserMeta(contact);
    const payload = normalizeChatVlogPayload(vlogPayload, contact, weatherMeta, userMeta);
    const now = new Date();
    const weatherTemp = normalizeChatOotdText(weatherMeta && weatherMeta.cardTemperature, '--°C', 16);
    const weatherText = normalizeChatOotdText(weatherMeta && weatherMeta.weatherText, 'UNKNOWN', 24);

    const v1Icon = document.getElementById('chat-vlog-v1-weather-icon');
    const v1Temp = document.getElementById('chat-vlog-v1-weather-temp');
    const v1Text = document.getElementById('chat-vlog-v1-weather-text');
    const v1TitleEn = document.getElementById('chat-vlog-v1-title-en');
    const v1TitleZh = document.getElementById('chat-vlog-v1-title-zh');
    const v1Timeline = document.getElementById('chat-vlog-v1-timeline');
    const v1FooterLeft = document.getElementById('chat-vlog-v1-footer-left');
    const v1FooterRight = document.getElementById('chat-vlog-v1-footer-right');

    if (v1Icon) v1Icon.className = getChatVlogWeatherIcon(weatherText, 'v1');
    if (v1Temp) v1Temp.textContent = weatherTemp;
    if (v1Text) v1Text.textContent = weatherText;
    if (v1TitleEn) v1TitleEn.textContent = payload.titleEn;
    if (v1TitleZh) v1TitleZh.textContent = payload.titleZh;
    if (v1Timeline) v1Timeline.innerHTML = buildChatVlogV1TimelineHtml(payload.entries);
    if (v1FooterLeft) v1FooterLeft.textContent = payload.footerLeft;
    if (v1FooterRight) v1FooterRight.textContent = payload.footerRight;

    const v2DateNum = document.getElementById('chat-vlog-v2-date-num');
    const v2DateMonth = document.getElementById('chat-vlog-v2-date-month');
    const v2Icon = document.getElementById('chat-vlog-v2-weather-icon');
    const v2Temp = document.getElementById('chat-vlog-v2-weather-temp');
    const v2Text = document.getElementById('chat-vlog-v2-weather-text');
    const v2Title = document.getElementById('chat-vlog-title-v2');
    const v2Timeline = document.getElementById('chat-vlog-v2-timeline');
    const v2FooterLeft = document.getElementById('chat-vlog-v2-footer-left');
    const v2FooterRight = document.getElementById('chat-vlog-v2-footer-right');

    if (v2DateNum) v2DateNum.textContent = String(now.getDate()).padStart(2, '0');
    if (v2DateMonth) v2DateMonth.textContent = getChatVlogMonthLabel(now);
    if (v2Icon) v2Icon.className = getChatVlogWeatherIcon(weatherText, 'v2');
    if (v2Temp) v2Temp.textContent = weatherTemp;
    if (v2Text) v2Text.textContent = weatherText;
    if (v2Title) v2Title.textContent = payload.titleZh || 'DAILY RECORD';
    if (v2Timeline) v2Timeline.innerHTML = buildChatVlogV2TimelineHtml(payload.entries);
    if (v2FooterLeft) v2FooterLeft.textContent = payload.footerLeft || 'SYS.LOG // 002';
    if (v2FooterRight) {
        const baseText = payload.footerRight || 'STATUS: RECORDED';
        v2FooterRight.textContent = baseText;
        v2FooterRight.dataset.base = baseText;
        v2FooterRight.style.color = '';
    }
}

function pulseChatVlogV2FooterStatus() {
    const footer = document.getElementById('chat-vlog-v2-footer-right');
    if (!footer) return;
    const baseText = String(footer.dataset.base || footer.textContent || 'STATUS: RECORDED');
    footer.textContent = 'STATUS: INTERACTED';
    footer.style.color = '#fff';
    if (window.__chatVlogStatusTimer) {
        clearTimeout(window.__chatVlogStatusTimer);
    }
    window.__chatVlogStatusTimer = setTimeout(() => {
        footer.textContent = baseText;
        footer.style.color = '';
    }, 1000);
}

function openChatVlogModalUi() {
    const modal = document.getElementById('chat-vlog-modal');
    if (!modal) return;
    if (chatVlogModalHideTimer) {
        clearTimeout(chatVlogModalHideTimer);
        chatVlogModalHideTimer = null;
    }
    modal.classList.remove('chat-vlog-open');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
        modal.classList.add('chat-vlog-open');
    });
}

function closeChatVlogModalUi() {
    const modal = document.getElementById('chat-vlog-modal');
    if (!modal) return;
    if (chatVlogModalHideTimer) {
        clearTimeout(chatVlogModalHideTimer);
        chatVlogModalHideTimer = null;
    }
    modal.classList.remove('chat-vlog-open');
    modal.setAttribute('aria-hidden', 'true');
    setChatVlogLoading(false);
    chatVlogModalHideTimer = setTimeout(() => {
        if (!modal.classList.contains('chat-vlog-open')) {
            modal.classList.add('hidden');
        }
        chatVlogModalHideTimer = null;
    }, CHAT_VLOG_MODAL_TRANSITION_MS);
}

function getChatVlogCachedEntry(contact, dateKey = getChatOotdDateKey(new Date())) {
    if (!contact || typeof contact !== 'object') return null;
    const entry = contact.todayVlogTimeline;
    if (!entry || typeof entry !== 'object') return null;
    if (String(entry.dateKey || '') !== String(dateKey || '')) return null;
    if (!entry.payload || typeof entry.payload !== 'object') return null;
    return entry;
}

function getAiProfileResolvedUserPersonaContext(contact) {
    const state = window.iphoneSimState || {};
    const personas = Array.isArray(state.userPersonas) ? state.userPersonas : [];
    const profile = state.userProfile && typeof state.userProfile === 'object' ? state.userProfile : {};
    let persona = null;
    if (contact && contact.userPersonaId) {
        persona = personas.find(item => String(item && item.id) === String(contact.userPersonaId)) || null;
    }
    if (!persona && state.currentUserPersonaId) {
        persona = personas.find(item => String(item && item.id) === String(state.currentUserPersonaId)) || null;
    }
    const displayName = normalizeChatOotdText(
        (persona && persona.name) || profile.name || '用户',
        '用户',
        48
    );
    const personaPrompt = normalizeChatOotdText(
        (contact && contact.userPersonaPromptOverride) || (persona && persona.aiPrompt) || '',
        '',
        1800
    );
    return {
        name: displayName,
        prompt: personaPrompt
    };
}

function buildAiProfileWorldbookContext(contact) {
    const state = window.iphoneSimState || {};
    const worldbook = Array.isArray(state.worldbook) ? state.worldbook : [];
    if (!worldbook.length) return '';
    let activeEntries = worldbook.filter(entry => entry && entry.enabled);
    if (contact && Array.isArray(contact.linkedWbCategories)) {
        if (contact.linkedWbCategories.length > 0) {
            activeEntries = activeEntries.filter(entry => contact.linkedWbCategories.includes(entry.categoryId));
        } else {
            activeEntries = [];
        }
    }
    const lines = activeEntries
        .map(entry => normalizeChatOotdText(entry && entry.content, '', 1500))
        .filter(Boolean)
        .slice(0, 8);
    if (!lines.length) return '';
    return lines.join('\n');
}

function buildAiProfileRecentChatContext(contact, limit = 14) {
    const state = window.iphoneSimState || {};
    const chatHistoryMap = state.chatHistory && typeof state.chatHistory === 'object' ? state.chatHistory : {};
    if (!contact || !Object.prototype.hasOwnProperty.call(chatHistoryMap, contact.id)) return '';
    const history = Array.isArray(chatHistoryMap[contact.id]) ? chatHistoryMap[contact.id] : [];
    if (!history.length) return '';
    const filtered = history
        .filter(msg => msg && msg.type === 'text' && String(msg.content || '').trim())
        .slice(-Math.max(1, limit));
    if (!filtered.length) return '';
    const userName = getAiProfileResolvedUserPersonaContext(contact).name || '用户';
    const contactName = getChatOotdContactDisplayName(contact);
    const lines = filtered.map(msg => {
        const roleName = msg.role === 'user' ? userName : contactName;
        const content = normalizeChatOotdText(String(msg.content || ''), '', 220);
        if (!content) return '';
        return `${roleName}: ${content}`;
    }).filter(Boolean);
    return lines.join('\n');
}

function buildAiProfileGenerationExtraPrompt(contact) {
    const userPersona = getAiProfileResolvedUserPersonaContext(contact);
    const worldbookContext = buildAiProfileWorldbookContext(contact);
    const recentChatContext = buildAiProfileRecentChatContext(contact, 14);
    const parts = [];
    parts.push(`用户网名：${userPersona.name || '用户'}`);
    if (userPersona.prompt) {
        parts.push(`用户人设：\n${userPersona.prompt}`);
    }
    if (worldbookContext) {
        parts.push(`绑定世界书：\n${worldbookContext}`);
    } else {
        parts.push('绑定世界书：无');
    }
    if (recentChatContext) {
        parts.push(`最近聊天记录（用户与该联系人）：\n${recentChatContext}`);
    } else {
        parts.push('最近聊天记录（用户与该联系人）：无');
    }
    parts.push('请把以上上下文用于风格、称呼、细节一致性，不要与其冲突。');
    return parts.join('\n\n');
}

async function requestChatVlogPayloadFromApi(contact, weatherMeta, userMeta) {
    const state = window.iphoneSimState || {};
    const settings = state.aiSettings2 && state.aiSettings2.url ? state.aiSettings2 : state.aiSettings;
    if (!settings || !settings.url || !settings.key) {
        throw new Error('AI API 未配置');
    }

    let fetchUrl = String(settings.url || '').trim();
    if (!fetchUrl.endsWith('/chat/completions')) {
        fetchUrl = fetchUrl.endsWith('/') ? `${fetchUrl}chat/completions` : `${fetchUrl}/chat/completions`;
    }
    const cleanKey = String(settings.key || '').replace(/[^\x00-\x7F]/g, '').trim();
    const contactName = getChatOotdContactDisplayName(contact);
    const personaText = normalizeChatOotdText(contact && contact.persona, '无', 1200);
    const extraContext = buildAiProfileGenerationExtraPrompt(contact);
    const today = new Date();
    const dateLabel = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const forbiddenNames = Array.from((userMeta && userMeta.aliasSet) || []).slice(0, 12).join(' / ');

    const systemPrompt = [
        '你是“联系人单日对话回放”生成助手。',
        '请只生成“该联系人今天对其他人说过的话”。',
        '绝对禁止生成该联系人对用户本人说的话。',
        `用户本人别名（严格禁止作为 to 对象）：${forbiddenNames || '我 / 用户 / me / myself'}`,
        '严禁输出 Markdown，严禁输出解释。',
        '只输出一个 JSON 对象，格式必须是：',
        '{"titleEn":"One Day","titleZh":"日常记录","footerLeft":"// LOG_ENTRY_01","footerRight":"END OF DAY","entries":[{"time":"08:30","to":"妈妈","content":"一句联系人说的话"}]}',
        '要求：',
        '- entries 返回 6~10 条，按时间从早到晚。',
        '- time 必须是 24 小时 HH:MM。',
        '- to 必须是“非用户本人”的人名或称呼，不得为我/用户/me/you 等。',
        '- content 必须是联系人对该对象说的话，长度 10~80 字。',
        '- 不要生成对话来回，只保留联系人单句发言。',
        '- 用日常口语风格，避免夸张。'
    ].join('\n');

    const userPrompt = [
        `联系人：${contactName}`,
        `联系人设：${personaText}`,
        `日期：${dateLabel}`,
        `天气：${weatherMeta.locationText}，${weatherMeta.weatherText}，${weatherMeta.promptTemperature}`,
        extraContext,
        '请生成 JSON。'
    ].join('\n');

    const callApi = async (useJsonFormat) => {
        const requestBody = {
            model: settings.model || 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.78
        };
        if (useJsonFormat) {
            requestBody.response_format = { type: 'json_object' };
        }
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        const choice = data && Array.isArray(data.choices) ? data.choices[0] : null;
        let content = choice && choice.message ? choice.message.content : '';
        if (Array.isArray(content)) {
            content = content.map((part) => {
                if (typeof part === 'string') return part;
                if (part && typeof part.text === 'string') return part.text;
                return '';
            }).join('\n');
        }
        return String(content || '').trim();
    };

    let rawContent = '';
    try {
        rawContent = await callApi(true);
    } catch (firstError) {
        console.warn('[VLOG] first attempt failed, retrying without json_object', firstError);
        rawContent = await callApi(false);
    }
    return normalizeChatVlogPayload(parseChatVlogJson(rawContent), contact, weatherMeta, userMeta);
}

async function openChatVlogModal(contactId = null, options = {}) {
    const resolvedContactId = contactId
        || (window.iphoneSimState && window.iphoneSimState.currentAiProfileContactId)
        || (window.iphoneSimState && window.iphoneSimState.currentChatContactId);
    if (!resolvedContactId || !window.iphoneSimState || !Array.isArray(window.iphoneSimState.contacts)) {
        return;
    }
    const contact = window.iphoneSimState.contacts.find(item => String(item.id) === String(resolvedContactId));
    if (!contact) return;
    const vlogStyle = getChatVlogStyleForContact(contact);
    const forceRefresh = !!(options && options.forceRefresh);
    const dateKey = getChatOotdDateKey(new Date());
    const userMeta = getChatVlogUserMeta(contact);

    const requestSeq = ++chatVlogGenerateRequestSeq;
    applyChatVlogStyle(vlogStyle);
    openChatVlogModalUi();

    const initialWeatherMeta = normalizeChatOotdWeather(null, contact);
    renderChatVlogResult(contact, initialWeatherMeta, buildChatVlogFallbackPayload(contact, initialWeatherMeta, userMeta));

    const cachedEntry = forceRefresh ? null : getChatVlogCachedEntry(contact, dateKey);
    if (cachedEntry) {
        const cachedWeatherMeta = normalizeChatOotdWeatherFromCache(contact, cachedEntry);
        const cachedPayload = normalizeChatVlogPayload(cachedEntry.payload, contact, cachedWeatherMeta, userMeta);
        renderChatVlogResult(contact, cachedWeatherMeta, cachedPayload);
        setChatVlogLoading(false);
        if (typeof window.showChatToast === 'function') {
            window.showChatToast('今日 VLOG 已缓存', 1500);
        }
        return;
    }

    setChatVlogLoading(true, forceRefresh ? 'REFRESHING VLOG...' : 'GENERATING VLOG...');

    let weather = null;
    try {
        if (typeof window.getAmapWeatherForContact === 'function') {
            weather = await window.getAmapWeatherForContact(contact.id);
        }
    } catch (error) {
        console.warn('[VLOG] weather fetch failed', error);
    }
    if (!weather) {
        const runtimeWeather = window.iphoneSimState
            && window.iphoneSimState.amapRuntime
            && window.iphoneSimState.amapRuntime.lastWeather
            ? window.iphoneSimState.amapRuntime.lastWeather[contact.id]
            : null;
        if (runtimeWeather) weather = runtimeWeather;
    }
    if (requestSeq !== chatVlogGenerateRequestSeq) return;

    const weatherMeta = normalizeChatOotdWeather(weather, contact);
    let vlogPayload = null;
    try {
        vlogPayload = await requestChatVlogPayloadFromApi(contact, weatherMeta, userMeta);
    } catch (error) {
        console.error('[VLOG] payload generation failed', error);
        if (typeof window.showChatToast === 'function') {
            window.showChatToast(`VLOG 生成失败，已使用默认结果：${error && error.message ? error.message : '未知错误'}`, 2600);
        }
        vlogPayload = buildChatVlogFallbackPayload(contact, weatherMeta, userMeta);
    }
    if (requestSeq !== chatVlogGenerateRequestSeq) return;

    renderChatVlogResult(contact, weatherMeta, vlogPayload);
    setChatVlogLoading(false);

    const normalizedForCache = normalizeChatVlogPayload(vlogPayload, contact, weatherMeta, userMeta);
    contact.todayVlogTimeline = {
        dateKey,
        weather: {
            locationText: weatherMeta.locationText,
            weatherText: weatherMeta.weatherText,
            cardTemperature: weatherMeta.cardTemperature,
            promptTemperature: weatherMeta.promptTemperature,
            reportTime: weatherMeta.reportTime
        },
        payload: {
            titleEn: normalizedForCache.titleEn,
            titleZh: normalizedForCache.titleZh,
            footerLeft: normalizedForCache.footerLeft,
            footerRight: normalizedForCache.footerRight,
            entries: Array.isArray(normalizedForCache.entries)
                ? normalizedForCache.entries.map(item => ({ ...item }))
                : []
        },
        source: forceRefresh ? 'manual_refresh' : 'auto_generate',
        updatedAt: Date.now()
    };
    if (typeof saveConfig === 'function') {
        saveConfig();
    }
}

window.openChatVlogModal = openChatVlogModal;

function parseChatLootJson(rawContent) {
    const jsonText = extractChatOotdJsonString(rawContent);
    if (!jsonText) return null;
    try {
        return JSON.parse(jsonText);
    } catch (error) {
        console.warn('[Loot] parse json failed', error);
        return null;
    }
}

function normalizeChatLootBadgeText(value, fallback, maxLen = 24) {
    const normalized = normalizeChatOotdText(value, fallback, maxLen);
    if (/^[a-z0-9./\s-]+$/i.test(normalized)) {
        return normalized.toUpperCase();
    }
    return normalized;
}

function normalizeChatLootItem(item, index = 0) {
    const source = item && typeof item === 'object' ? item : {};
    const fallbackName = `随身物品 ${index + 1}`;
    return {
        name: normalizeChatOotdText(
            source.name || source.itemName || source.title || source['名称'],
            fallbackName,
            42
        ),
        description: normalizeChatOotdText(
            source.description || source.desc || source.detail || source['描述'],
            '暂无描述',
            280
        ),
        use: normalizeChatOotdText(
            source.use || source.usage || source.purpose || source['用处'] || source['用途'],
            '日常备用',
            140
        ),
        type: normalizeChatLootBadgeText(
            source.type || source.category || source['类型'],
            'UTILITY',
            24
        ),
        value: normalizeChatLootBadgeText(
            source.value || source.rarity || source.grade || source['价值'],
            'MED',
            24
        ),
        weight: normalizeChatLootBadgeText(
            source.weight || source.mass || source['重量'],
            '0.30 KG',
            24
        )
    };
}

function buildChatLootFallbackPayload(contact) {
    const contactName = getChatOotdContactDisplayName(contact);
    return {
        summary: `${contactName} 今天携带了几样和当前状态匹配的物品，偏向实用、轻便与高频使用。`,
        items: [
            normalizeChatLootItem({ name: '随行卡包', description: '内含门禁与交通卡，方便快速通行。', use: '出入与支付', type: 'ACCESS', value: 'MED', weight: '0.12 KG' }, 0),
            normalizeChatLootItem({ name: '便携保温杯', description: '轻量材质，能保持饮品温度并减少一次性杯使用。', use: '补水与咖啡', type: 'SUPPLY', value: 'LOW', weight: '0.28 KG' }, 1),
            normalizeChatLootItem({ name: '降噪耳机', description: '通勤与工作时提升专注，过滤环境噪声。', use: '听歌与专注', type: 'GEAR', value: 'HIGH', weight: '0.20 KG' }, 2),
            normalizeChatLootItem({ name: '迷你急救包', description: '包含创可贴与基础消毒用品，应对小型突发情况。', use: '应急处理', type: 'MEDICAL', value: 'MED', weight: '0.15 KG' }, 3)
        ]
    };
}

function normalizeChatLootPayload(payload, contact) {
    const fallbackPayload = buildChatLootFallbackPayload(contact);
    const source = payload && typeof payload === 'object' ? payload : {};
    const sourceItems = Array.isArray(source.items)
        ? source.items
        : (Array.isArray(source.lootItems)
            ? source.lootItems
            : (Array.isArray(source.inventory)
                ? source.inventory
                : (Array.isArray(source['物品']) ? source['物品'] : [])));
    const normalizedItems = sourceItems
        .slice(0, 8)
        .map((item, index) => normalizeChatLootItem(item, index))
        .filter(item => item && item.name);
    return {
        summary: normalizeChatOotdText(
            source.summary || source.overview || source['概述'],
            fallbackPayload.summary,
            220
        ),
        items: normalizedItems.length > 0 ? normalizedItems : fallbackPayload.items
    };
}

function buildChatLootV1ItemsHtml(items = []) {
    return items.map((item, index) => {
        const encodedItem = encodeURIComponent(JSON.stringify(item));
        const itemId = String(index + 1).padStart(3, '0');
        const typeLabel = normalizeChatLootBadgeText(item.type, 'UTILITY', 24);
        return `
            <article class="chat-loot-v1-item" data-item="${encodedItem}" data-scanned="0" data-scanning="0">
                <div class="chat-loot-v1-scan-overlay">
                    <div class="chat-loot-v1-scan-icon"></div>
                    <div class="chat-loot-v1-scan-text">TAP TO SCAN</div>
                </div>
                <div class="chat-loot-v1-revealed">
                    <div class="chat-loot-v1-item-id">OBJ-${escapeChatOotdHtml(itemId)}</div>
                    <div class="chat-loot-v1-item-name">${escapeChatOotdHtml(item.name)}</div>
                    <div class="chat-loot-v1-item-en">${escapeChatOotdHtml(typeLabel)}</div>
                    <div class="chat-loot-v1-item-icon"></div>
                </div>
            </article>
        `;
    }).join('');
}

function buildChatLootV2ItemsHtml(items = []) {
    return items.map((item, index) => {
        const encodedItem = encodeURIComponent(JSON.stringify(item));
        const typeLabel = normalizeChatLootBadgeText(item.type, 'ITEM', 24);
        return `
            <article class="chat-loot-v2-item" data-item="${encodedItem}" data-scanned="0" data-scanning="0">
                <div class="chat-loot-v2-scan-overlay">
                    <div class="chat-loot-v2-scan-icon"></div>
                    <div class="chat-loot-v2-scan-text">TAP TO SCAN</div>
                </div>
                <div class="chat-loot-v2-revealed">
                    <div class="chat-loot-v2-item-icon">${escapeChatOotdHtml(String(index + 1))}</div>
                    <div class="chat-loot-v2-item-info">
                        <div class="chat-loot-v2-item-title">${escapeChatOotdHtml(item.name)}</div>
                        <div class="chat-loot-v2-item-sub">${escapeChatOotdHtml(typeLabel)}</div>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

function parseChatLootV1ItemFromCard(cardEl) {
    if (!cardEl || !cardEl.dataset) return null;
    const encoded = String(cardEl.dataset.item || '');
    if (!encoded) return null;
    try {
        const parsed = JSON.parse(decodeURIComponent(encoded));
        return normalizeChatLootItem(parsed, 0);
    } catch (error) {
        console.warn('[Loot] parse v1 card item failed', error);
        return null;
    }
}

function fillChatLootV1Detail(item) {
    const titleEn = document.getElementById('chat-loot-v1-detail-title-en');
    const titleZh = document.getElementById('chat-loot-v1-detail-title-zh');
    const desc = document.getElementById('chat-loot-v1-detail-desc');
    const use = document.getElementById('chat-loot-v1-detail-use');
    const type = document.getElementById('chat-loot-v1-detail-type');
    const weight = document.getElementById('chat-loot-v1-detail-weight');
    const value = document.getElementById('chat-loot-v1-detail-value');

    const safeItem = normalizeChatLootItem(item, 0);
    if (titleEn) titleEn.textContent = normalizeChatLootBadgeText(safeItem.type, 'ITEM', 32);
    if (titleZh) titleZh.textContent = safeItem.name;
    if (desc) desc.textContent = safeItem.description;
    if (use) use.innerHTML = `<b>用途</b>${escapeChatOotdHtml(safeItem.use)}`;
    if (type) type.textContent = safeItem.type;
    if (weight) weight.textContent = safeItem.weight;
    if (value) value.textContent = safeItem.value;

    const actionBtn = document.getElementById('chat-loot-v1-detail-action');
    if (actionBtn) {
        actionBtn.textContent = 'TAKE ITEM +';
        actionBtn.style.background = '';
        actionBtn.style.color = '';
        actionBtn.style.fontWeight = '';
    }
}

function openChatLootV1Detail(item) {
    const detailModal = document.getElementById('chat-loot-v1-detail-modal');
    if (!detailModal) return;
    fillChatLootV1Detail(item);
    if (chatLootV1DetailHideTimer) {
        clearTimeout(chatLootV1DetailHideTimer);
        chatLootV1DetailHideTimer = null;
    }
    detailModal.classList.remove('hidden');
    detailModal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
        detailModal.classList.add('active');
    });
}

function closeChatLootV1Detail(immediate = false) {
    const detailModal = document.getElementById('chat-loot-v1-detail-modal');
    if (!detailModal) return;
    if (chatLootV1DetailHideTimer) {
        clearTimeout(chatLootV1DetailHideTimer);
        chatLootV1DetailHideTimer = null;
    }
    detailModal.classList.remove('active');
    detailModal.setAttribute('aria-hidden', 'true');
    if (immediate) {
        detailModal.classList.add('hidden');
        return;
    }
    chatLootV1DetailHideTimer = setTimeout(() => {
        if (!detailModal.classList.contains('active')) {
            detailModal.classList.add('hidden');
        }
        chatLootV1DetailHideTimer = null;
    }, 280);
}

function bindChatLootV1Interactions() {
    const grid = document.getElementById('chat-loot-v1-items');
    if (!grid) return;
    if (grid.dataset.bound !== '1') {
        grid.dataset.bound = '1';
        grid.addEventListener('click', (event) => {
            const card = event.target.closest('.chat-loot-v1-item');
            if (!card || !grid.contains(card)) return;
            const item = parseChatLootV1ItemFromCard(card);
            if (!item) return;

            const isScanned = card.dataset.scanned === '1';
            const isScanning = card.dataset.scanning === '1';
            if (isScanned) {
                openChatLootV1Detail(item);
                return;
            }
            if (isScanning) return;

            card.dataset.scanning = '1';
            const scanOverlay = card.querySelector('.chat-loot-v1-scan-overlay');
            const scanText = card.querySelector('.chat-loot-v1-scan-text');
            const scanIcon = card.querySelector('.chat-loot-v1-scan-icon');
            const revealed = card.querySelector('.chat-loot-v1-revealed');

            if (scanText) scanText.classList.add('hidden');
            if (scanIcon) scanIcon.classList.add('scanning');

            setTimeout(() => {
                if (!document.body.contains(card)) return;
                if (scanOverlay) scanOverlay.classList.add('is-hidden');
                setTimeout(() => {
                    if (!document.body.contains(card)) return;
                    if (scanOverlay) scanOverlay.style.display = 'none';
                    if (revealed) revealed.classList.add('revealed');
                    card.dataset.scanning = '0';
                    card.dataset.scanned = '1';
                    setTimeout(() => {
                        if (document.body.contains(card)) {
                            openChatLootV1Detail(item);
                        }
                    }, 220);
                }, 300);
            }, 1800);
        });
    }

    const detailModal = document.getElementById('chat-loot-v1-detail-modal');
    const detailCloseBtn = document.getElementById('chat-loot-v1-detail-close');
    const detailActionBtn = document.getElementById('chat-loot-v1-detail-action');
    if (detailModal && detailModal.dataset.bound !== '1') {
        detailModal.dataset.bound = '1';
        detailModal.addEventListener('click', (event) => {
            if (event.target === detailModal) {
                closeChatLootV1Detail(false);
            }
        });
    }
    if (detailCloseBtn && detailCloseBtn.dataset.bound !== '1') {
        detailCloseBtn.dataset.bound = '1';
        detailCloseBtn.addEventListener('click', () => {
            closeChatLootV1Detail(false);
        });
    }
    if (detailActionBtn && detailActionBtn.dataset.bound !== '1') {
        detailActionBtn.dataset.bound = '1';
        detailActionBtn.addEventListener('click', () => {
            detailActionBtn.textContent = 'OBTAINED ✓';
            detailActionBtn.style.background = '#f0f0f0';
            detailActionBtn.style.color = '#0d0d0f';
            detailActionBtn.style.fontWeight = '700';
            setTimeout(() => {
                closeChatLootV1Detail(false);
            }, 600);
        });
    }
    if (!window.__chatLootV1EscapeBound) {
        window.__chatLootV1EscapeBound = true;
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeChatLootV1Detail(false);
            }
        });
    }
}

function parseChatLootV2ItemFromCard(cardEl) {
    if (!cardEl || !cardEl.dataset) return null;
    const encoded = String(cardEl.dataset.item || '');
    if (!encoded) return null;
    try {
        const parsed = JSON.parse(decodeURIComponent(encoded));
        return normalizeChatLootItem(parsed, 0);
    } catch (error) {
        console.warn('[Loot] parse v2 card item failed', error);
        return null;
    }
}

function fillChatLootV2Detail(item) {
    const titleEn = document.getElementById('chat-loot-v2-detail-title-en');
    const titleZh = document.getElementById('chat-loot-v2-detail-title-zh');
    const desc = document.getElementById('chat-loot-v2-detail-desc');
    const type = document.getElementById('chat-loot-v2-detail-type');
    const weight = document.getElementById('chat-loot-v2-detail-weight');
    const value = document.getElementById('chat-loot-v2-detail-value');

    const safeItem = normalizeChatLootItem(item, 0);
    if (titleEn) titleEn.textContent = normalizeChatLootBadgeText(safeItem.type, 'ITEM ID', 24);
    if (titleZh) titleZh.textContent = safeItem.name;
    if (desc) desc.textContent = safeItem.description;
    if (type) type.textContent = safeItem.type;
    if (weight) weight.textContent = safeItem.weight;
    if (value) value.textContent = safeItem.value;

    const actionBtn = document.getElementById('chat-loot-v2-detail-action');
    if (actionBtn) {
        actionBtn.textContent = 'EQUIP ITEM';
        actionBtn.style.background = '';
        actionBtn.style.color = '';
        actionBtn.style.fontWeight = '';
    }
}

function openChatLootV2Detail(item) {
    const detailModal = document.getElementById('chat-loot-v2-detail-modal');
    if (!detailModal) return;
    fillChatLootV2Detail(item);
    if (chatLootV2DetailHideTimer) {
        clearTimeout(chatLootV2DetailHideTimer);
        chatLootV2DetailHideTimer = null;
    }
    detailModal.classList.remove('hidden');
    detailModal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
        detailModal.classList.add('active');
    });
}

function closeChatLootV2Detail(immediate = false) {
    const detailModal = document.getElementById('chat-loot-v2-detail-modal');
    if (!detailModal) return;
    if (chatLootV2DetailHideTimer) {
        clearTimeout(chatLootV2DetailHideTimer);
        chatLootV2DetailHideTimer = null;
    }
    detailModal.classList.remove('active');
    detailModal.setAttribute('aria-hidden', 'true');
    if (immediate) {
        detailModal.classList.add('hidden');
        return;
    }
    chatLootV2DetailHideTimer = setTimeout(() => {
        if (!detailModal.classList.contains('active')) {
            detailModal.classList.add('hidden');
        }
        chatLootV2DetailHideTimer = null;
    }, 280);
}

function bindChatLootV2Interactions() {
    const grid = document.getElementById('chat-loot-v2-items');
    if (!grid) return;
    if (grid.dataset.bound !== '1') {
        grid.dataset.bound = '1';
        grid.addEventListener('click', (event) => {
            const card = event.target.closest('.chat-loot-v2-item');
            if (!card || !grid.contains(card)) return;
            const item = parseChatLootV2ItemFromCard(card);
            if (!item) return;

            const isScanned = card.dataset.scanned === '1';
            const isScanning = card.dataset.scanning === '1';
            if (isScanned) {
                openChatLootV2Detail(item);
                return;
            }
            if (isScanning) return;

            card.dataset.scanning = '1';
            const scanOverlay = card.querySelector('.chat-loot-v2-scan-overlay');
            const scanText = card.querySelector('.chat-loot-v2-scan-text');
            const scanIcon = card.querySelector('.chat-loot-v2-scan-icon');
            const revealed = card.querySelector('.chat-loot-v2-revealed');

            if (scanText) scanText.classList.add('hidden');
            if (scanIcon) scanIcon.classList.add('scanning');

            setTimeout(() => {
                if (!document.body.contains(card)) return;
                if (scanOverlay) scanOverlay.classList.add('is-hidden');
                setTimeout(() => {
                    if (!document.body.contains(card)) return;
                    if (scanOverlay) scanOverlay.style.display = 'none';
                    if (revealed) revealed.classList.add('revealed');
                    card.dataset.scanning = '0';
                    card.dataset.scanned = '1';
                    setTimeout(() => {
                        if (document.body.contains(card)) {
                            openChatLootV2Detail(item);
                        }
                    }, 150);
                }, 300);
            }, 1800);
        });
    }

    const detailModal = document.getElementById('chat-loot-v2-detail-modal');
    const detailCloseBtn = document.getElementById('chat-loot-v2-detail-close');
    const detailActionBtn = document.getElementById('chat-loot-v2-detail-action');
    if (detailModal && detailModal.dataset.bound !== '1') {
        detailModal.dataset.bound = '1';
        detailModal.addEventListener('click', (event) => {
            if (event.target === detailModal) {
                closeChatLootV2Detail(false);
            }
        });
    }
    if (detailCloseBtn && detailCloseBtn.dataset.bound !== '1') {
        detailCloseBtn.dataset.bound = '1';
        detailCloseBtn.addEventListener('click', () => {
            closeChatLootV2Detail(false);
        });
    }
    if (detailActionBtn && detailActionBtn.dataset.bound !== '1') {
        detailActionBtn.dataset.bound = '1';
        detailActionBtn.addEventListener('click', () => {
            detailActionBtn.textContent = 'EQUIPPED ✓';
            detailActionBtn.style.background = '#111';
            detailActionBtn.style.color = '#fff';
            detailActionBtn.style.fontWeight = '700';
            setTimeout(() => {
                closeChatLootV2Detail(false);
            }, 600);
        });
    }
    if (!window.__chatLootV2EscapeBound) {
        window.__chatLootV2EscapeBound = true;
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeChatLootV2Detail(false);
            }
        });
    }
}

function applyChatLootStyle(styleKey) {
    const normalized = normalizeChatLootStyleKey(styleKey);
    const modal = document.getElementById('chat-loot-modal');
    const card = document.getElementById('chat-loot-card');
    const viewV1 = document.getElementById('chat-loot-view-v1');
    const viewV2 = document.getElementById('chat-loot-view-v2');
    const refreshBtn = document.getElementById('chat-loot-refresh-btn');
    if (modal) {
        modal.classList.toggle('chat-loot-theme-v1', normalized === 'v1');
        modal.classList.toggle('chat-loot-theme-v2', normalized === 'v2');
    }
    if (card) {
        card.classList.toggle('chat-loot-card-v1', normalized === 'v1');
        card.classList.toggle('chat-loot-card-v2', normalized === 'v2');
    }
    if (viewV1) {
        viewV1.classList.toggle('hidden', normalized !== 'v1');
    }
    if (viewV2) {
        viewV2.classList.toggle('hidden', normalized !== 'v2');
    }
    if (refreshBtn) {
        refreshBtn.classList.remove('hidden');
    }
}

function setChatLootLoading(loading, loadingText = 'GENERATING LOOT...') {
    const loadingEl = document.getElementById('chat-loot-loading');
    const card = document.getElementById('chat-loot-card');
    const refreshBtn = document.getElementById('chat-loot-refresh-btn');
    if (loadingEl) {
        loadingEl.textContent = loadingText;
        loadingEl.classList.toggle('hidden', !loading);
    }
    if (card) {
        card.classList.toggle('is-loading', !!loading);
    }
    if (refreshBtn) {
        refreshBtn.disabled = !!loading;
    }
}

function renderChatLootResult(contact, lootPayload) {
    const payload = normalizeChatLootPayload(lootPayload, contact);
    const titleV1En = document.getElementById('chat-loot-title-v1-en');
    const titleV1 = document.getElementById('chat-loot-title-v1');
    const descV1 = document.getElementById('chat-loot-v1-desc');
    const itemsV1 = document.getElementById('chat-loot-v1-items');
    const titleV2En = document.getElementById('chat-loot-title-v2-en');
    const titleV2 = document.getElementById('chat-loot-title-v2');
    const descV2 = document.getElementById('chat-loot-v2-desc');
    const itemsV2 = document.getElementById('chat-loot-v2-items');

    if (titleV1En) titleV1En.textContent = 'LOOT POPUP V1';
    if (titleV1) titleV1.textContent = 'SECURE CONTAINER_01';
    if (descV1) descV1.textContent = 'STATUS: ONLINE';
    if (itemsV1) itemsV1.innerHTML = buildChatLootV1ItemsHtml(payload.items);
    bindChatLootV1Interactions();
    closeChatLootV1Detail(true);

    if (titleV2En) titleV2En.textContent = 'LOOT POPUP V2';
    if (titleV2) titleV2.textContent = 'SYSTEM SCANNER';
    if (descV2) descV2.textContent = 'AWAITING INPUT';
    if (itemsV2) itemsV2.innerHTML = buildChatLootV2ItemsHtml(payload.items);
    bindChatLootV2Interactions();
    closeChatLootV2Detail(true);
}

function openChatLootModalUi() {
    const modal = document.getElementById('chat-loot-modal');
    if (!modal) return;
    if (chatLootModalHideTimer) {
        clearTimeout(chatLootModalHideTimer);
        chatLootModalHideTimer = null;
    }
    modal.classList.remove('chat-loot-open');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
        modal.classList.add('chat-loot-open');
    });
}

function closeChatLootModalUi() {
    const modal = document.getElementById('chat-loot-modal');
    if (!modal) return;
    closeChatLootV1Detail(true);
    closeChatLootV2Detail(true);
    if (chatLootModalHideTimer) {
        clearTimeout(chatLootModalHideTimer);
        chatLootModalHideTimer = null;
    }
    modal.classList.remove('chat-loot-open');
    modal.setAttribute('aria-hidden', 'true');
    setChatLootLoading(false);
    chatLootModalHideTimer = setTimeout(() => {
        if (!modal.classList.contains('chat-loot-open')) {
            modal.classList.add('hidden');
        }
        chatLootModalHideTimer = null;
    }, CHAT_LOOT_MODAL_TRANSITION_MS);
}

function getChatLootCachedEntry(contact, dateKey = getChatOotdDateKey(new Date())) {
    if (!contact || typeof contact !== 'object') return null;
    const entry = contact.todayCarryLoot;
    if (!entry || typeof entry !== 'object') return null;
    if (String(entry.dateKey || '') !== String(dateKey || '')) return null;
    if (!entry.payload || typeof entry.payload !== 'object') return null;
    return entry;
}

async function requestChatLootPayloadFromApi(contact) {
    const state = window.iphoneSimState || {};
    const settings = state.aiSettings2 && state.aiSettings2.url ? state.aiSettings2 : state.aiSettings;
    if (!settings || !settings.url || !settings.key) {
        throw new Error('AI API 未配置');
    }

    let fetchUrl = String(settings.url || '').trim();
    if (!fetchUrl.endsWith('/chat/completions')) {
        fetchUrl = fetchUrl.endsWith('/') ? `${fetchUrl}chat/completions` : `${fetchUrl}/chat/completions`;
    }
    const cleanKey = String(settings.key || '').replace(/[^\x00-\x7F]/g, '').trim();
    const contactName = getChatOotdContactDisplayName(contact);
    const personaText = normalizeChatOotdText(contact && contact.persona, '无', 1200);
    const extraContext = buildAiProfileGenerationExtraPrompt(contact);
    const now = new Date();
    const dateLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const systemPrompt = [
        '你是联系人随身物品生成助手。',
        '请生成该联系人“今日随身物品”清单。',
        '严禁输出 Markdown，严禁输出解释。',
        '只输出一个 JSON 对象，格式必须是：',
        '{"summary":"一句总览","items":[{"name":"物品名称","description":"描述","use":"用处","type":"类型","value":"价值","weight":"重量"}]}',
        '要求：',
        '- items 返回 4~6 个对象。',
        '- 每个对象六个字段都必须非空。',
        '- description 15~80 字，use 6~40 字。',
        '- value 用简短等级或描述（如 HIGH / MED / LOW）。',
        '- weight 用可读格式（如 0.35 KG）。'
    ].join('\n');

    const userPrompt = [
        `联系人：${contactName}`,
        `人设：${personaText}`,
        `日期：${dateLabel}`,
        extraContext,
        '请生成这位联系人今天会携带的随身物品 JSON。'
    ].join('\n');

    const callApi = async (useJsonFormat) => {
        const requestBody = {
            model: settings.model || 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.75
        };
        if (useJsonFormat) {
            requestBody.response_format = { type: 'json_object' };
        }
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        const choice = data && Array.isArray(data.choices) ? data.choices[0] : null;
        let content = choice && choice.message ? choice.message.content : '';
        if (Array.isArray(content)) {
            content = content.map((part) => {
                if (typeof part === 'string') return part;
                if (part && typeof part.text === 'string') return part.text;
                return '';
            }).join('\n');
        }
        return String(content || '').trim();
    };

    let rawContent = '';
    try {
        rawContent = await callApi(true);
    } catch (firstError) {
        console.warn('[Loot] first attempt failed, retrying without json_object', firstError);
        rawContent = await callApi(false);
    }
    return normalizeChatLootPayload(parseChatLootJson(rawContent), contact);
}

async function openChatLootModal(contactId = null, options = {}) {
    const resolvedContactId = contactId
        || (window.iphoneSimState && window.iphoneSimState.currentAiProfileContactId)
        || (window.iphoneSimState && window.iphoneSimState.currentChatContactId);
    if (!resolvedContactId || !window.iphoneSimState || !Array.isArray(window.iphoneSimState.contacts)) {
        return;
    }
    const contact = window.iphoneSimState.contacts.find(item => String(item.id) === String(resolvedContactId));
    if (!contact) return;
    const lootStyle = getChatLootStyleForContact(contact);
    const forceRefresh = !!(options && options.forceRefresh);
    const dateKey = getChatOotdDateKey(new Date());

    const requestSeq = ++chatLootGenerateRequestSeq;
    applyChatLootStyle(lootStyle);
    openChatLootModalUi();

    const fallbackPayload = buildChatLootFallbackPayload(contact);
    renderChatLootResult(contact, fallbackPayload);

    const cachedEntry = forceRefresh ? null : getChatLootCachedEntry(contact, dateKey);
    if (cachedEntry) {
        const cachedPayload = normalizeChatLootPayload(cachedEntry.payload, contact);
        renderChatLootResult(contact, cachedPayload);
        setChatLootLoading(false);
        if (typeof window.showChatToast === 'function') {
            window.showChatToast('今日随身物品已缓存，点击左上刷新可重新生成', 1800);
        }
        return;
    }

    setChatLootLoading(true, forceRefresh ? 'REFRESHING LOOT...' : 'GENERATING LOOT...');
    let lootPayload = null;
    try {
        lootPayload = await requestChatLootPayloadFromApi(contact);
    } catch (error) {
        console.error('[Loot] payload generation failed', error);
        if (typeof window.showChatToast === 'function') {
            window.showChatToast(`随身物品生成失败，已使用默认结果：${error && error.message ? error.message : '未知错误'}`, 2800);
        }
        lootPayload = fallbackPayload;
    }
    if (requestSeq !== chatLootGenerateRequestSeq) return;

    renderChatLootResult(contact, lootPayload);
    setChatLootLoading(false);

    contact.todayCarryLoot = {
        dateKey,
        payload: {
            summary: lootPayload.summary,
            items: Array.isArray(lootPayload.items) ? lootPayload.items.map(item => ({ ...item })) : []
        },
        source: forceRefresh ? 'manual_refresh' : 'auto_generate',
        updatedAt: Date.now()
    };
    if (typeof saveConfig === 'function') {
        saveConfig();
    }
}

window.openChatLootModal = openChatLootModal;

async function requestChatOotdPayloadFromApi(contact, weatherMeta) {
    const state = window.iphoneSimState || {};
    const settings = state.aiSettings2 && state.aiSettings2.url ? state.aiSettings2 : state.aiSettings;
    if (!settings || !settings.url || !settings.key) {
        throw new Error('AI API 未配置');
    }

    let fetchUrl = String(settings.url || '').trim();
    if (!fetchUrl.endsWith('/chat/completions')) {
        fetchUrl = fetchUrl.endsWith('/') ? `${fetchUrl}chat/completions` : `${fetchUrl}/chat/completions`;
    }
    const cleanKey = String(settings.key || '').replace(/[^\x00-\x7F]/g, '').trim();
    const contactName = getChatOotdContactDisplayName(contact);
    const personaText = normalizeChatOotdText(contact && contact.persona, '无', 1200);
    const extraContext = buildAiProfileGenerationExtraPrompt(contact);
    const weatherLine = `天气：${weatherMeta.locationText}，${weatherMeta.weatherText}，${weatherMeta.promptTemperature}`;
    const reportLine = weatherMeta.reportTime ? `天气报告时间：${weatherMeta.reportTime}` : '';
    const systemPrompt = [
        '你是一个联系人 OOTD 生成助手。',
        '你必须根据给定天气和温度生成当天穿搭。',
        '严禁输出 Markdown，严禁输出解释。',
        '只输出一个 JSON 对象，字段格式必须是：',
        '{"description":"穿搭描述","items":{"top":"上身单品","bottom":"下身单品","shoes":"鞋子","accessories":"配饰"},"satisfaction":"8.8 / 10","review":"联系人自我评价","subtitle":"SYS.LOG: MONOCHROME FIT"}',
        '要求：',
        '- description 35~120 字，描述整体风格和适用场景。',
        '- items 四个字段都必须非空、简短具体。',
        '- satisfaction 必须是 0-10 的评分格式（例如 8.8 / 10）。',
        '- review 20~100 字，语气像联系人自己的评价。',
        '- subtitle 可选，若输出请保持英文短句风格。'
    ].join('\n');
    const userPrompt = [
        `联系人：${contactName}`,
        `人设：${personaText}`,
        weatherLine,
        reportLine,
        extraContext,
        '请生成今天这位联系人的 OOTD JSON。'
    ].filter(Boolean).join('\n');

    const callApi = async (useJsonFormat) => {
        const requestBody = {
            model: settings.model || 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7
        };
        if (useJsonFormat) {
            requestBody.response_format = { type: 'json_object' };
        }
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        const choice = data && Array.isArray(data.choices) ? data.choices[0] : null;
        let content = choice && choice.message ? choice.message.content : '';
        if (Array.isArray(content)) {
            content = content.map((part) => {
                if (typeof part === 'string') return part;
                if (part && typeof part.text === 'string') return part.text;
                return '';
            }).join('\n');
        }
        return String(content || '').trim();
    };

    let rawContent = '';
    try {
        rawContent = await callApi(true);
    } catch (firstError) {
        console.warn('[OOTD] first attempt failed, retrying without json_object', firstError);
        rawContent = await callApi(false);
    }

    const parsed = parseChatOotdJson(rawContent);
    return normalizeChatOotdPayload(parsed, contact, weatherMeta);
}

function getChatOotdCachedEntry(contact, dateKey = getChatOotdDateKey(new Date())) {
    if (!contact || typeof contact !== 'object') return null;
    const entry = contact.todayOotd;
    if (!entry || typeof entry !== 'object') return null;
    if (String(entry.dateKey || '') !== String(dateKey || '')) return null;
    if (!entry.payload || typeof entry.payload !== 'object') return null;
    return entry;
}

function normalizeChatOotdWeatherFromCache(contact, cachedEntry) {
    const fallback = normalizeChatOotdWeather(null, contact);
    const cachedWeather = cachedEntry && cachedEntry.weather && typeof cachedEntry.weather === 'object'
        ? cachedEntry.weather
        : null;
    if (!cachedWeather) return fallback;
    return {
        ...fallback,
        locationText: normalizeChatOotdText(cachedWeather.locationText, fallback.locationText, 48),
        weatherText: normalizeChatOotdText(cachedWeather.weatherText, fallback.weatherText, 24),
        cardTemperature: normalizeChatOotdText(cachedWeather.cardTemperature, fallback.cardTemperature, 16),
        promptTemperature: normalizeChatOotdText(cachedWeather.promptTemperature, fallback.promptTemperature, 24),
        reportTime: normalizeChatOotdText(cachedWeather.reportTime, fallback.reportTime || '', 40)
    };
}

async function openChatOotdModal(contactId = null, options = {}) {
    const resolvedContactId = contactId
        || (window.iphoneSimState && window.iphoneSimState.currentAiProfileContactId)
        || (window.iphoneSimState && window.iphoneSimState.currentChatContactId);
    if (!resolvedContactId || !window.iphoneSimState || !Array.isArray(window.iphoneSimState.contacts)) {
        return;
    }
    const contact = window.iphoneSimState.contacts.find(item => String(item.id) === String(resolvedContactId));
    if (!contact) return;
    const ootdStyle = getChatOotdStyleForContact(contact);
    const forceRefresh = !!(options && options.forceRefresh);
    const dateKey = getChatOotdDateKey(new Date());

    const requestSeq = ++chatOotdGenerateRequestSeq;
    openChatOotdModalUi();
    applyChatOotdStyle(ootdStyle);

    const cachedEntry = forceRefresh ? null : getChatOotdCachedEntry(contact, dateKey);
    if (cachedEntry) {
        const cachedWeatherMeta = normalizeChatOotdWeatherFromCache(contact, cachedEntry);
        const cachedPayload = normalizeChatOotdPayload(cachedEntry.payload, contact, cachedWeatherMeta);
        renderChatOotdResult(contact, cachedWeatherMeta, cachedPayload);
        setChatOotdLoading(false);
        if (typeof window.showChatToast === 'function') {
            window.showChatToast('今日 OOTD 已缓存，点击左上刷新可重新生成', 1800);
        }
        return;
    }

    setChatOotdLoading(true, forceRefresh ? 'REFRESHING OOTD...' : 'GENERATING OOTD...');

    const initialWeatherMeta = normalizeChatOotdWeather(null, contact);
    renderChatOotdResult(contact, initialWeatherMeta, buildChatOotdFallbackPayload(contact, initialWeatherMeta));

    let weather = null;
    try {
        if (typeof window.getAmapWeatherForContact === 'function') {
            weather = await window.getAmapWeatherForContact(contact.id);
        }
    } catch (error) {
        console.warn('[OOTD] weather fetch failed', error);
    }
    if (!weather) {
        const runtimeWeather = window.iphoneSimState
            && window.iphoneSimState.amapRuntime
            && window.iphoneSimState.amapRuntime.lastWeather
            ? window.iphoneSimState.amapRuntime.lastWeather[contact.id]
            : null;
        if (runtimeWeather) {
            weather = runtimeWeather;
        }
    }
    if (requestSeq !== chatOotdGenerateRequestSeq) return;

    const weatherMeta = normalizeChatOotdWeather(weather, contact);
    let ootdPayload = null;
    try {
        ootdPayload = await requestChatOotdPayloadFromApi(contact, weatherMeta);
    } catch (error) {
        console.error('[OOTD] payload generation failed', error);
        if (typeof window.showChatToast === 'function') {
            window.showChatToast(`OOTD 生成失败，已使用默认结果：${error && error.message ? error.message : '未知错误'}`, 2800);
        }
        ootdPayload = normalizeChatOotdPayload(null, contact, weatherMeta);
    }
    if (requestSeq !== chatOotdGenerateRequestSeq) return;

    renderChatOotdResult(contact, weatherMeta, ootdPayload);
    setChatOotdLoading(false);

    contact.todayOotd = {
        dateKey,
        weather: {
            locationText: weatherMeta.locationText,
            weatherText: weatherMeta.weatherText,
            cardTemperature: weatherMeta.cardTemperature,
            promptTemperature: weatherMeta.promptTemperature,
            reportTime: weatherMeta.reportTime
        },
        payload: {
            subtitle: ootdPayload.subtitle,
            description: ootdPayload.description,
            items: { ...ootdPayload.items },
            satisfaction: ootdPayload.satisfaction,
            review: ootdPayload.review
        },
        source: forceRefresh ? 'manual_refresh' : 'auto_generate',
        updatedAt: Date.now()
    };
    if (typeof saveConfig === 'function') {
        saveConfig();
    }
}

function scanChatOotdFingerprint() {
    const box = document.getElementById('chat-ootd-fingerprint-box');
    const idle = document.getElementById('chat-ootd-fingerprint-idle');
    const icon = document.getElementById('chat-ootd-fp-icon');
    const text = document.getElementById('chat-ootd-fp-text');
    const result = document.getElementById('chat-ootd-fingerprint-result');
    const loadingEl = document.getElementById('chat-ootd-loading');
    if (!box || !idle || !icon || !text || !result || (loadingEl && !loadingEl.classList.contains('hidden'))) return;
    if (box.classList.contains('scanned')) return;

    box.style.pointerEvents = 'none';
    icon.style.color = '#10b981';
    text.textContent = 'VERIFYING...';
    text.style.color = '#10b981';
    icon.style.transform = 'scale(1.1)';

    setTimeout(() => {
        icon.style.transform = 'scale(1)';
    }, 200);

    setTimeout(() => {
        idle.style.display = 'none';
        result.style.display = 'block';
        result.style.opacity = '0';
        void result.offsetWidth;
        result.style.transition = 'opacity 0.4s';
        result.style.opacity = '1';
        box.classList.add('scanned');
        box.style.pointerEvents = 'auto';
    }, 800);
}

function scanChatOotdBarcode() {
    const wrapper = document.getElementById('chat-ootd-barcode-scanner');
    const text = document.getElementById('chat-ootd-barcode-text');
    const grid = document.getElementById('chat-ootd-secret-grid');
    const loadingEl = document.getElementById('chat-ootd-loading');
    if (!wrapper || !text || !grid || (loadingEl && !loadingEl.classList.contains('hidden'))) return;
    if (wrapper.classList.contains('scanning') || grid.classList.contains('scanned')) return;

    wrapper.classList.add('scanning');
    text.textContent = CHAT_OOTD_BARCODE_SCANNING_TEXT;
    text.style.color = '#ef4444';

    setTimeout(() => {
        wrapper.classList.remove('scanning');
        text.textContent = CHAT_OOTD_BARCODE_SUCCESS_TEXT;
        text.style.color = '#10b981';

        setTimeout(() => {
            const items = {
                top: normalizeChatOotdText(grid.dataset.top, 'Lightweight Knit Top', 72),
                bottom: normalizeChatOotdText(grid.dataset.bottom, 'Straight Fit Trousers', 72),
                shoes: normalizeChatOotdText(grid.dataset.shoes, 'Classic Low-top Sneakers', 72),
                accessories: normalizeChatOotdText(grid.dataset.accessories, 'Minimal Silver Necklace', 72)
            };
            wrapper.style.display = 'none';
            text.style.display = 'none';
            grid.classList.add('scanned');
            grid.innerHTML = buildChatOotdSecretGridHtml(items);
        }, 800);
    }, 1000);
}

function tearChatOotdV5Tag() {
    const card = document.getElementById('chat-ootd-card');
    const tearLine = document.getElementById('chat-ootd-v5-tear-line');
    const bottom = document.getElementById('chat-ootd-v5-bottom');
    const loadingEl = document.getElementById('chat-ootd-loading');
    if (!tearLine || !bottom || (loadingEl && !loadingEl.classList.contains('hidden'))) return;
    if (bottom.classList.contains('torn')) return;

    if (card && !card.style.marginTop) {
        card.style.marginTop = `${card.offsetTop - 20}px`;
        card.style.alignSelf = 'flex-start';
    }

    bottom.classList.add('torn');
    tearLine.style.opacity = '0';
}

function flipChatOotdV5Tag() {
    const bottom = document.getElementById('chat-ootd-v5-bottom');
    const front = document.getElementById('chat-ootd-v5-front');
    const back = document.getElementById('chat-ootd-v5-back');
    const loadingEl = document.getElementById('chat-ootd-loading');
    if (!bottom || !front || !back || (loadingEl && !loadingEl.classList.contains('hidden'))) return;
    if (!bottom.classList.contains('torn') || bottom.classList.contains('flipping') || bottom.classList.contains('flipped')) {
        return;
    }

    bottom.classList.add('flipping');
    chatOotdV5DragState.offsetX = 0;
    chatOotdV5DragState.offsetY = 0;
    bottom.style.transition = 'transform 0.4s ease-in, padding 0.4s ease-in';
    bottom.style.transform = 'translateY(10px) rotateY(90deg) scale(1.05)';

    setTimeout(() => {
        front.style.display = 'none';
        back.style.display = 'block';
        bottom.style.transition = 'none';
        bottom.style.transform = 'translateY(10px) rotateY(-90deg) scale(1.05)';
        void bottom.offsetWidth;
        bottom.style.transition = 'transform 0.5s ease-out, padding 0.5s ease-out';
        applyChatOotdV5DraggedTransform(bottom);
        bottom.classList.remove('flipping');
        bottom.classList.add('flipped');
        bottom.style.cursor = 'grab';
    }, 400);
}

window.openChatOotdModal = openChatOotdModal;

function normalizeAiProfileHighlightImageDraft(rawValue) {
    const source = rawValue && typeof rawValue === 'object' ? rawValue : {};
    return {
        vlog: normalizeChatOotdText(source.vlog, '', 500000),
        ootd: normalizeChatOotdText(source.ootd, '', 500000),
        cafe: normalizeChatOotdText(source.cafe, '', 500000),
        // Backward-compatible fallback: old key `art` -> new key `moment`.
        moment: normalizeChatOotdText(source.moment || source.art, '', 500000)
    };
}

function getContactById(contactId) {
    if (!contactId || !window.iphoneSimState || !Array.isArray(window.iphoneSimState.contacts)) return null;
    return window.iphoneSimState.contacts.find(item => String(item.id) === String(contactId)) || null;
}

function getActiveAiProfileContactForCustomize() {
    const contactId = window.iphoneSimState
        ? (window.iphoneSimState.currentAiProfileContactId || window.iphoneSimState.currentChatContactId)
        : null;
    return getContactById(contactId);
}

function updateAiProfileCustomizePreviewByKey(key) {
    const previewEl = document.getElementById(`ai-profile-icon-preview-${key}`);
    if (!previewEl || !aiProfileCustomizeDraft || !aiProfileCustomizeDraft.images) return;
    const imageSrc = normalizeChatOotdText(aiProfileCustomizeDraft.images[key], '', 500000);
    previewEl.textContent = key.toUpperCase();
    if (imageSrc) {
        previewEl.style.backgroundImage = `url(${imageSrc})`;
        previewEl.classList.add('has-image');
        previewEl.textContent = '';
    } else {
        previewEl.style.backgroundImage = '';
        previewEl.classList.remove('has-image');
    }
}

function syncAiProfileCustomizeStyleUi(styleKey) {
    const normalized = normalizeChatOotdStyleKey(styleKey);
    const selectorBg = document.getElementById('ai-profile-ootd-selector-bg');
    if (selectorBg) {
        selectorBg.style.transform = normalized === 'v3' ? 'translateX(100%)' : 'translateX(0)';
    }
    const options = document.querySelectorAll('#ai-profile-customize-modal .ai-profile-ootd-style-option');
    options.forEach((option) => {
        const input = option.querySelector('input[name="ai-profile-ootd-style"]');
        const isActive = !!(input && normalizeChatOotdStyleKey(input.value) === normalized);
        option.classList.toggle('active', isActive);
    });
}

function syncAiProfileCustomizeLootStyleUi(styleKey) {
    const normalized = normalizeChatLootStyleKey(styleKey);
    const selectorBg = document.getElementById('ai-profile-loot-selector-bg');
    if (selectorBg) {
        selectorBg.style.transform = normalized === 'v2' ? 'translateX(100%)' : 'translateX(0)';
    }
    const options = document.querySelectorAll('#ai-profile-customize-modal .ai-profile-loot-style-option');
    options.forEach((option) => {
        const input = option.querySelector('input[name="ai-profile-loot-style"]');
        const isActive = !!(input && normalizeChatLootStyleKey(input.value) === normalized);
        option.classList.toggle('active', isActive);
    });
}

function syncAiProfileCustomizeVlogStyleUi(styleKey) {
    const normalized = normalizeChatVlogStyleKey(styleKey);
    const selectorBg = document.getElementById('ai-profile-vlog-selector-bg');
    if (selectorBg) {
        selectorBg.style.transform = normalized === 'v2' ? 'translateX(100%)' : 'translateX(0)';
    }
    const options = document.querySelectorAll('#ai-profile-customize-modal .ai-profile-vlog-style-option');
    options.forEach((option) => {
        const input = option.querySelector('input[name="ai-profile-vlog-style"]');
        const isActive = !!(input && normalizeChatVlogStyleKey(input.value) === normalized);
        option.classList.toggle('active', isActive);
    });
}

function updateAiProfileCustomizeAllPreviews() {
    AI_PROFILE_HIGHLIGHT_KEYS.forEach((key) => {
        updateAiProfileCustomizePreviewByKey(key);
    });
    const ootdStyleKey = normalizeChatOotdStyleKey(aiProfileCustomizeDraft && aiProfileCustomizeDraft.style);
    const ootdCheckedInput = document.querySelector(`#ai-profile-customize-modal input[name="ai-profile-ootd-style"][value="${ootdStyleKey}"]`);
    if (ootdCheckedInput) ootdCheckedInput.checked = true;
    syncAiProfileCustomizeStyleUi(ootdStyleKey);

    const lootStyleKey = normalizeChatLootStyleKey(aiProfileCustomizeDraft && aiProfileCustomizeDraft.lootStyle);
    const lootCheckedInput = document.querySelector(`#ai-profile-customize-modal input[name="ai-profile-loot-style"][value="${lootStyleKey}"]`);
    if (lootCheckedInput) lootCheckedInput.checked = true;
    syncAiProfileCustomizeLootStyleUi(lootStyleKey);

    const vlogStyleKey = normalizeChatVlogStyleKey(aiProfileCustomizeDraft && aiProfileCustomizeDraft.vlogStyle);
    const vlogCheckedInput = document.querySelector(`#ai-profile-customize-modal input[name="ai-profile-vlog-style"][value="${vlogStyleKey}"]`);
    if (vlogCheckedInput) vlogCheckedInput.checked = true;
    syncAiProfileCustomizeVlogStyleUi(vlogStyleKey);
}

function closeAiProfileCustomizeModal() {
    const modal = document.getElementById('ai-profile-customize-modal');
    if (!modal) {
        aiProfileCustomizeDraft = null;
        return;
    }
    if (aiProfileCustomizeHideTimer) {
        clearTimeout(aiProfileCustomizeHideTimer);
        aiProfileCustomizeHideTimer = null;
    }
    if (modal.classList.contains('hidden')) {
        aiProfileCustomizeDraft = null;
        return;
    }
    modal.classList.remove('ai-profile-customize-open');
    aiProfileCustomizeHideTimer = setTimeout(() => {
        if (!modal.classList.contains('ai-profile-customize-open')) {
            modal.classList.add('hidden');
            aiProfileCustomizeDraft = null;
        }
        aiProfileCustomizeHideTimer = null;
    }, AI_PROFILE_CUSTOMIZE_TRANSITION_MS);
}

function openAiProfileCustomizeModal() {
    const modal = document.getElementById('ai-profile-customize-modal');
    const contact = getActiveAiProfileContactForCustomize();
    if (!modal || !contact) return;
    if (aiProfileCustomizeHideTimer) {
        clearTimeout(aiProfileCustomizeHideTimer);
        aiProfileCustomizeHideTimer = null;
    }
    aiProfileCustomizeDraft = {
        contactId: contact.id,
        style: getChatOotdStyleForContact(contact),
        lootStyle: getChatLootStyleForContact(contact),
        vlogStyle: getChatVlogStyleForContact(contact),
        images: normalizeAiProfileHighlightImageDraft(contact.profileHighlightImages)
    };
    updateAiProfileCustomizeAllPreviews();
    modal.classList.remove('ai-profile-customize-open');
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        modal.classList.add('ai-profile-customize-open');
    });
}

function bindAiProfileCustomizeUploadActions() {
    const modal = document.getElementById('ai-profile-customize-modal');
    if (!modal || modal.dataset.bound === '1') return;
    modal.dataset.bound = '1';

    modal.addEventListener('click', async (event) => {
        const previewEl = event.target.closest('.ai-profile-icon-preview');
        if (previewEl) {
            event.preventDefault();
            const card = previewEl.closest('.ai-profile-icon-card');
            const key = card ? String(card.dataset.key || '').trim().toLowerCase() : '';
            if (!AI_PROFILE_HIGHLIGHT_KEYS.includes(key)) return;
            const input = document.getElementById(`ai-profile-icon-input-${key}`);
            if (input) input.click();
            return;
        }

        const uploadBtn = event.target.closest('.ai-profile-icon-btn.upload');
        if (uploadBtn) {
            event.preventDefault();
            const key = String(uploadBtn.dataset.key || '').trim().toLowerCase();
            if (!AI_PROFILE_HIGHLIGHT_KEYS.includes(key)) return;
            const input = document.getElementById(`ai-profile-icon-input-${key}`);
            if (input) input.click();
            return;
        }

        const clearBtn = event.target.closest('.ai-profile-icon-btn.clear');
        if (clearBtn) {
            event.preventDefault();
            const key = String(clearBtn.dataset.key || '').trim().toLowerCase();
            if (!AI_PROFILE_HIGHLIGHT_KEYS.includes(key) || !aiProfileCustomizeDraft) return;
            aiProfileCustomizeDraft.images[key] = '';
            updateAiProfileCustomizePreviewByKey(key);
            return;
        }

        if (event.target === modal) {
            closeAiProfileCustomizeModal();
        }
    });

    AI_PROFILE_HIGHLIGHT_KEYS.forEach((key) => {
        const input = document.getElementById(`ai-profile-icon-input-${key}`);
        if (!input) return;
        input.addEventListener('change', async () => {
            const file = input.files && input.files[0] ? input.files[0] : null;
            if (!file || !aiProfileCustomizeDraft) {
                input.value = '';
                return;
            }
            try {
                const base64 = await compressImage(file, 420, 0.82);
                aiProfileCustomizeDraft.images[key] = String(base64 || '');
                updateAiProfileCustomizePreviewByKey(key);
            } catch (error) {
                console.error('[AI Profile Customize] icon upload failed', error);
                if (typeof window.showChatToast === 'function') {
                    window.showChatToast('图片处理失败，请重试', 1800);
                }
            } finally {
                input.value = '';
            }
        });
    });

    const styleInputs = modal.querySelectorAll('input[name="ai-profile-ootd-style"]');
    styleInputs.forEach((input) => {
        input.addEventListener('change', () => {
            if (!aiProfileCustomizeDraft || !input.checked) return;
            aiProfileCustomizeDraft.style = normalizeChatOotdStyleKey(input.value);
            syncAiProfileCustomizeStyleUi(aiProfileCustomizeDraft.style);
        });
    });

    const lootStyleInputs = modal.querySelectorAll('input[name="ai-profile-loot-style"]');
    lootStyleInputs.forEach((input) => {
        input.addEventListener('change', () => {
            if (!aiProfileCustomizeDraft || !input.checked) return;
            aiProfileCustomizeDraft.lootStyle = normalizeChatLootStyleKey(input.value);
            syncAiProfileCustomizeLootStyleUi(aiProfileCustomizeDraft.lootStyle);
        });
    });

    const vlogStyleInputs = modal.querySelectorAll('input[name="ai-profile-vlog-style"]');
    vlogStyleInputs.forEach((input) => {
        input.addEventListener('change', () => {
            if (!aiProfileCustomizeDraft || !input.checked) return;
            aiProfileCustomizeDraft.vlogStyle = normalizeChatVlogStyleKey(input.value);
            syncAiProfileCustomizeVlogStyleUi(aiProfileCustomizeDraft.vlogStyle);
        });
    });
}

function saveAiProfileCustomizeDraft() {
    if (!aiProfileCustomizeDraft) return;
    const contact = getContactById(aiProfileCustomizeDraft.contactId);
    if (!contact) {
        closeAiProfileCustomizeModal();
        return;
    }
    contact.profileHighlightImages = normalizeAiProfileHighlightImageDraft(aiProfileCustomizeDraft.images);
    contact.ootdCardStyle = normalizeChatOotdStyleKey(aiProfileCustomizeDraft.style);
    contact.lootCardStyle = normalizeChatLootStyleKey(aiProfileCustomizeDraft.lootStyle);
    contact.vlogCardStyle = normalizeChatVlogStyleKey(aiProfileCustomizeDraft.vlogStyle);
    if (typeof saveConfig === 'function') saveConfig();
    if (typeof renderAiProfile === 'function') renderAiProfile(contact);
    const ootdModal = document.getElementById('chat-ootd-modal');
    if (ootdModal && !ootdModal.classList.contains('hidden')) {
        openChatOotdModal(contact.id, { forceRefresh: false });
    }
    const lootModal = document.getElementById('chat-loot-modal');
    if (lootModal && !lootModal.classList.contains('hidden')) {
        openChatLootModal(contact.id, { forceRefresh: false });
    }
    const vlogModal = document.getElementById('chat-vlog-modal');
    if (vlogModal && !vlogModal.classList.contains('hidden')) {
        openChatVlogModal(contact.id, { forceRefresh: false });
    }
    closeAiProfileCustomizeModal();
    if (typeof window.showChatToast === 'function') {
        window.showChatToast('资料卡展示设置已保存', 1600);
    }
}

function getChatNavigationModeMeta(modeKey) {
    const normalizedKey = String(modeKey || 'driving').trim().toLowerCase();
    return CHAT_NAVIGATION_MODE_META[normalizedKey] || CHAT_NAVIGATION_MODE_META.driving;
}

function ensureChatFoodAssistStore() {
    if (!window.__chatFoodAssistStateStore || typeof window.__chatFoodAssistStateStore !== 'object') {
        window.__chatFoodAssistStateStore = {};
    }
    return window.__chatFoodAssistStateStore;
}

function setChatFoodAssistState(contactId, nextState) {
    if (!contactId) return;
    const store = ensureChatFoodAssistStore();
    store[contactId] = {
        ...nextState,
        updatedAt: Date.now()
    };
}

function getChatFoodAssistState(contactId) {
    if (!contactId) return null;
    const store = ensureChatFoodAssistStore();
    const entry = store[contactId];
    if (!entry) return null;
    if ((Date.now() - Number(entry.updatedAt || 0)) > CHAT_FOOD_ASSIST_TTL_MS) {
        delete store[contactId];
        return null;
    }
    return entry;
}

function clearChatFoodAssistState(contactId) {
    if (!contactId) return;
    const store = ensureChatFoodAssistStore();
    delete store[contactId];
}

function ensureChatRouteAssistStore() {
    if (!window.__chatRouteAssistStateStore || typeof window.__chatRouteAssistStateStore !== 'object') {
        window.__chatRouteAssistStateStore = {};
    }
    return window.__chatRouteAssistStateStore;
}

function setChatRouteAssistState(contactId, nextState) {
    if (!contactId) return;
    const store = ensureChatRouteAssistStore();
    store[contactId] = {
        ...nextState,
        updatedAt: Date.now()
    };
}

function getChatRouteAssistState(contactId) {
    if (!contactId) return null;
    const store = ensureChatRouteAssistStore();
    const entry = store[contactId];
    if (!entry) return null;
    if ((Date.now() - Number(entry.updatedAt || 0)) > CHAT_ROUTE_ASSIST_TTL_MS) {
        delete store[contactId];
        return null;
    }
    return entry;
}

function clearChatRouteAssistState(contactId) {
    if (!contactId) return;
    const store = ensureChatRouteAssistStore();
    delete store[contactId];
}

function ensureChatWebLinkContextStore() {
    if (!window.__chatWebLinkContextStore || typeof window.__chatWebLinkContextStore !== 'object') {
        window.__chatWebLinkContextStore = {
            entries: {},
            failureNotices: {}
        };
    }
    if (!window.__chatWebLinkContextStore.entries || typeof window.__chatWebLinkContextStore.entries !== 'object') {
        window.__chatWebLinkContextStore.entries = {};
    }
    if (!window.__chatWebLinkContextStore.failureNotices || typeof window.__chatWebLinkContextStore.failureNotices !== 'object') {
        window.__chatWebLinkContextStore.failureNotices = {};
    }
    return window.__chatWebLinkContextStore;
}

function cleanupChatWebLinkFailureNoticeStore() {
    const store = ensureChatWebLinkContextStore();
    const now = Date.now();
    Object.keys(store.failureNotices).forEach((key) => {
        if ((now - Number(store.failureNotices[key] || 0)) > CHAT_WEB_LINK_CONTEXT_FAILURE_NOTICE_TTL_MS * 3) {
            delete store.failureNotices[key];
        }
    });
}

function getChatWebLinkContextEntry(contactId) {
    if (!contactId) return null;
    const store = ensureChatWebLinkContextStore();
    const entry = store.entries[contactId];
    if (!entry) return null;
    if (!entry.promise && (Date.now() - Number(entry.updatedAt || 0)) > CHAT_WEB_LINK_CONTEXT_TTL_MS) {
        delete store.entries[contactId];
        return null;
    }
    return entry;
}

function setChatWebLinkContextEntry(contactId, patch = {}) {
    if (!contactId) return null;
    const store = ensureChatWebLinkContextStore();
    const prev = store.entries[contactId] || {};
    const next = {
        ...prev,
        ...patch,
        updatedAt: Date.now()
    };
    store.entries[contactId] = next;
    return next;
}

function extractUrlsFromChatText(text, maxUrls = CHAT_WEB_LINK_CONTEXT_MAX_URLS_PER_MESSAGE) {
    const source = String(text || '');
    if (!source) return [];
    const limit = Number.isFinite(Number(maxUrls)) ? Math.max(1, Number(maxUrls)) : CHAT_WEB_LINK_CONTEXT_MAX_URLS_PER_MESSAGE;
    const urlRegex = /\b((?:https?:\/\/|www\.)[^\s<>"'`，。！？、（）()【】\[\]{}]+)/ig;
    const results = [];
    const seen = new Set();
    let match = null;

    while ((match = urlRegex.exec(source)) && results.length < limit) {
        let candidate = String(match[1] || '').trim();
        if (!candidate) continue;
        candidate = candidate.replace(/[)\]}>】）》"'“”‘’.,!?;:，。！？；：、]+$/g, '');
        if (!candidate) continue;
        if (/^www\./i.test(candidate)) {
            candidate = `https://${candidate}`;
        }

        let normalized = '';
        try {
            const urlObj = new URL(candidate);
            if (!/^https?:$/i.test(urlObj.protocol)) {
                continue;
            }
            urlObj.hash = '';
            normalized = urlObj.toString();
        } catch (error) {
            continue;
        }

        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        results.push(normalized);
    }

    return results;
}

function resolveChatWebLinkContextApiBaseUrl() {
    let apiBaseUrl = '';
    if (window.offlinePushSync && typeof window.offlinePushSync.getState === 'function') {
        const syncState = window.offlinePushSync.getState();
        apiBaseUrl = String(syncState && syncState.apiBaseUrl || '').trim();
        if (apiBaseUrl) return apiBaseUrl.replace(/\/$/, '');
    }

    if (window.iphoneSimState && window.iphoneSimState.offlinePushSync) {
        apiBaseUrl = String(window.iphoneSimState.offlinePushSync.apiBaseUrl || '').trim();
        if (apiBaseUrl) return apiBaseUrl.replace(/\/$/, '');
    }

    try {
        const raw = localStorage.getItem('offlinePushSyncSettings');
        const parsed = raw ? JSON.parse(raw) : null;
        apiBaseUrl = String(parsed && parsed.apiBaseUrl || '').trim();
        if (apiBaseUrl) return apiBaseUrl.replace(/\/$/, '');
    } catch (error) {}

    return '';
}

function isLikelyDirectAiCompletionEndpoint(url) {
    const value = String(url || '').trim().toLowerCase();
    if (!value) return false;
    return /\/chat\/completions\/?$/.test(value) || /\/v\d+\/chat\/completions\/?$/.test(value);
}

function getChatWebLinkContextUserId() {
    if (window.offlinePushSync && typeof window.offlinePushSync.getState === 'function') {
        const syncState = window.offlinePushSync.getState();
        const userId = String(syncState && syncState.userId || '').trim();
        if (userId) return userId;
    }
    if (window.iphoneSimState && window.iphoneSimState.offlinePushSync) {
        const userId = String(window.iphoneSimState.offlinePushSync.userId || '').trim();
        if (userId) return userId;
    }
    return 'default-user';
}

function sanitizeWebLinkContextText(value, maxLength = 900) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, Math.max(1, maxLength - 1))}…`;
}

function formatWebLinkContextPayload(successResults = []) {
    const lines = [
        '【网页链接缓存】',
        '以下是用户最近发送网页链接的内容摘要。仅在相关追问时引用，不要编造网页中没有的信息。'
    ];

    successResults.slice(0, CHAT_WEB_LINK_CONTEXT_MAX_URLS_PER_MESSAGE).forEach((item, index) => {
        const linkUrl = sanitizeWebLinkContextText(item && (item.finalUrl || item.url || ''), 400);
        const title = sanitizeWebLinkContextText(item && item.title, 160);
        const summary = sanitizeWebLinkContextText(item && item.summary, 420);
        lines.push(`- 链接${index + 1}：${linkUrl || '未知链接'}`);
        if (title) {
            lines.push(`  标题：${title}`);
        }
        if (summary) {
            lines.push(`  摘要：${summary}`);
        }
    });

    return lines.join('\n');
}

function upsertHiddenWebLinkContextMessage(contactId, contextText, options = {}) {
    if (!contactId || !window.iphoneSimState || !window.iphoneSimState.chatHistory) return null;
    const text = String(contextText || '').trim();
    if (!window.iphoneSimState.chatHistory[contactId]) {
        window.iphoneSimState.chatHistory[contactId] = [];
    }

    const history = window.iphoneSimState.chatHistory[contactId];
    const nextHistory = history.filter(msg => !(msg && msg.type === 'web_link_context_hidden'));
    window.iphoneSimState.chatHistory[contactId] = nextHistory;

    if (!text) {
        if (typeof saveConfig === 'function') saveConfig();
        return null;
    }

    const hiddenMsg = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        time: Date.now(),
        role: 'system',
        type: 'web_link_context_hidden',
        hiddenFromUi: true,
        includeInAiContext: true,
        content: text,
        metaType: 'web_link_context',
        meta: {
            source: 'webpage_context',
            signature: String(options.signature || ''),
            urls: Array.isArray(options.urls) ? options.urls.map(item => String(item || '').trim()).filter(Boolean) : []
        }
    };

    window.iphoneSimState.chatHistory[contactId].push(hiddenMsg);
    if (typeof saveConfig === 'function') saveConfig();
    return hiddenMsg;
}

function formatWebLinkContextErrorSummary(errorResults = []) {
    if (!Array.isArray(errorResults) || !errorResults.length) {
        return '读取网页内容失败，请稍后重试，或把关键段落直接发给我。';
    }
    const first = errorResults[0] || {};
    const detail = String(first.errorMessage || first.errorCode || '未知错误').trim() || '未知错误';
    if (errorResults.length === 1) {
        return `读取链接失败：${detail}。你可以重试，或直接粘贴网页关键段落。`;
    }
    return `有 ${errorResults.length} 个链接读取失败（例如：${detail}）。你可以重试，或直接粘贴网页关键段落。`;
}

function buildWebLinkContextFailureMessageFromError(error) {
    const rawMessage = String(error && error.message || '').trim();
    if (!rawMessage) {
        return '读取链接失败：未知错误。你可以重试，或直接粘贴网页关键段落。';
    }

    if (/failed to fetch|networkerror|load failed/i.test(rawMessage)) {
        return '读取链接失败：无法连接到离线后端（可能是地址错误、服务未启动，或被 CORS 拦截）。你可以先检查“离线消息”里的后端地址。';
    }

    if (/cors/i.test(rawMessage)) {
        return '读取链接失败：后端跨域配置异常（CORS）。请确认后端允许当前页面来源访问。';
    }

    return `读取链接失败：${rawMessage}。你可以重试，或直接粘贴网页关键段落。`;
}

function maybeSendWebLinkContextFailureNotice(contactId, noticeText, signature = '') {
    if (!contactId || !noticeText) return null;
    const store = ensureChatWebLinkContextStore();
    cleanupChatWebLinkFailureNoticeStore();

    const key = `${String(contactId)}::${String(signature || '')}::${String(noticeText)}`;
    const now = Date.now();
    if ((now - Number(store.failureNotices[key] || 0)) < CHAT_WEB_LINK_CONTEXT_FAILURE_NOTICE_TTL_MS) {
        return null;
    }
    store.failureNotices[key] = now;

    if (typeof sendMessage === 'function') {
        return sendMessage(`[系统消息]: ${noticeText}`, false, 'text', null, contactId, { showNotification: false });
    }
    return null;
}

async function requestWebLinkContextFromBackend(apiBaseUrl, payload) {
    const response = await fetch(`${apiBaseUrl}/api/webpage-context`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}${text ? `: ${text}` : ''}`);
    }

    return response.json().catch(() => ({}));
}

window.maybePrefetchWebLinkContext = async function(options = {}) {
    const contactId = String(options && options.contactId || (window.iphoneSimState && window.iphoneSimState.currentChatContactId) || '').trim();
    if (!contactId) {
        return { ok: false, skipped: 'missing_contact_id' };
    }

    const text = String(options && options.text || '').trim();
    const urls = extractUrlsFromChatText(text, CHAT_WEB_LINK_CONTEXT_MAX_URLS_PER_MESSAGE);
    if (!urls.length) {
        return { ok: false, skipped: 'no_url_detected' };
    }

    const signature = urls.join('||');
    const cachedEntry = getChatWebLinkContextEntry(contactId);
    if (cachedEntry && cachedEntry.signature === signature) {
        if (cachedEntry.promise) {
            return cachedEntry.promise;
        }
        if (cachedEntry.lastResult) {
            return cachedEntry.lastResult;
        }
    }

    const apiBaseUrl = resolveChatWebLinkContextApiBaseUrl();
    if (!apiBaseUrl) {
        upsertHiddenWebLinkContextMessage(contactId, '', { signature });
        maybeSendWebLinkContextFailureNotice(contactId, '未配置离线后端地址，暂时无法读取链接内容。你可以先粘贴网页关键段落。', signature);
        return { ok: false, skipped: 'missing_api_base_url' };
    }
    if (isLikelyDirectAiCompletionEndpoint(apiBaseUrl)) {
        upsertHiddenWebLinkContextMessage(contactId, '', { signature });
        maybeSendWebLinkContextFailureNotice(
            contactId,
            '离线消息后端地址配置错误：当前像是模型的 /chat/completions 地址。请改成你自己的离线后端根地址（例如 Railway 服务域名）。',
            signature
        );
        return { ok: false, skipped: 'invalid_backend_base_url' };
    }

    const payload = {
        userId: getChatWebLinkContextUserId(),
        contactId,
        urls
    };

    let settledResult = { ok: false, results: [] };
    const fetchPromise = (async () => {
        try {
            const data = await requestWebLinkContextFromBackend(apiBaseUrl, payload);
            const results = Array.isArray(data && data.results) ? data.results : [];
            const successResults = results.filter(item => item && item.status === 'ok' && (item.title || item.summary));
            const errorResults = results.filter(item => !item || item.status !== 'ok');

            if (successResults.length > 0) {
                const contextPayload = formatWebLinkContextPayload(successResults);
                upsertHiddenWebLinkContextMessage(contactId, contextPayload, {
                    signature,
                    urls: successResults.map(item => item.finalUrl || item.url || '').filter(Boolean)
                });
            } else {
                upsertHiddenWebLinkContextMessage(contactId, '', { signature });
            }

            if (errorResults.length > 0) {
                maybeSendWebLinkContextFailureNotice(contactId, formatWebLinkContextErrorSummary(errorResults), signature);
            } else if (!successResults.length) {
                maybeSendWebLinkContextFailureNotice(contactId, '链接读取失败，未提取到可用网页内容。你可以重试，或直接粘贴网页关键段落。', signature);
            }

            settledResult = {
                ok: successResults.length > 0,
                results,
                successCount: successResults.length,
                errorCount: errorResults.length
            };
            return settledResult;
        } catch (error) {
            upsertHiddenWebLinkContextMessage(contactId, '', { signature });
            maybeSendWebLinkContextFailureNotice(
                contactId,
                buildWebLinkContextFailureMessageFromError(error),
                signature
            );
            settledResult = {
                ok: false,
                error: error && error.message ? String(error.message) : 'unknown_error',
                results: []
            };
            return settledResult;
        } finally {
            setChatWebLinkContextEntry(contactId, {
                signature,
                promise: null,
                completedAt: Date.now(),
                lastResult: settledResult
            });
        }
    })();

    setChatWebLinkContextEntry(contactId, {
        signature,
        promise: fetchPromise,
        startedAt: Date.now()
    });

    return fetchPromise;
};

window.waitForWebLinkContextPrefetch = async function(contactId, timeoutMs = CHAT_WEB_LINK_CONTEXT_WAIT_TIMEOUT_MS) {
    const id = String(contactId || '').trim();
    if (!id) return false;
    const entry = getChatWebLinkContextEntry(id);
    if (!entry || !entry.promise) return false;

    const safeTimeoutMs = Number.isFinite(Number(timeoutMs))
        ? Math.max(150, Math.min(5000, Number(timeoutMs)))
        : CHAT_WEB_LINK_CONTEXT_WAIT_TIMEOUT_MS;

    try {
        await Promise.race([
            entry.promise,
            new Promise(resolve => setTimeout(resolve, safeTimeoutMs))
        ]);
    } catch (error) {
        console.warn('[WebLinkContext] wait failed', error);
    }

    return true;
}

function normalizeChatNavigationMode(text) {
    const raw = String(text || '').trim();
    if (/(公交|地铁|巴士|公车|公共交通|metro|bus|subway)/i.test(raw)) {
        return { key: 'transit', label: '公交地铁' };
    }
    if (/(步行|走路|徒步|walking|walk)/i.test(raw)) {
        return { key: 'walking', label: '步行' };
    }
    if (/(骑行|骑车|单车|自行车|电瓶车|电动车|bike|bicycle|cycling|ride)/i.test(raw)) {
        return { key: 'bicycling', label: '骑行' };
    }
    return { key: 'driving', label: '驾车' };
}

function extractChatNavigationIntent(text) {
    const raw = String(text || '').trim();
    const mode = normalizeChatNavigationMode(raw);
    if (!raw) {
        return { rawText: '', destination: '', modeKey: mode.key, modeLabel: mode.label };
    }

    const modePhrasePattern = /(坐地铁|地铁|公交|公车|巴士|公共交通|驾车|开车|打车|自驾|骑行|骑车|步行|走路|徒步|bike|bicycle|cycling|ride|walking|walk|transit|bus|metro|subway)/ig;
    const fillerPattern = /(帮我|请|麻烦|想|我要|我想|给我|规划|导航|查一下|看一下|路线|怎么去|怎么走|多久到|多长时间到|需要多久|大概|一下|一下子|从这里|从这儿|从我这里|从当前位置|从我这|出发|前往|到达)/ig;
    const extractPatterns = [
        /(?:去|到|前往|导航去|导航到|目的地(?:是|到)?)(.+?)(?=(?:坐地铁|地铁|公交|驾车|开车|打车|骑行|骑车|步行|走路|怎么去|怎么走|路线|多久到|多长时间到|$))/i,
        /(.+?)(?=(?:坐地铁|地铁|公交|驾车|开车|打车|骑行|骑车|步行|走路|怎么去|怎么走|路线|多久到|多长时间到|$))/i
    ];

    let destination = '';
    extractPatterns.some(pattern => {
        const matched = raw.match(pattern);
        if (!matched || !matched[1]) return false;
        destination = String(matched[1] || '').trim();
        return !!destination;
    });

    if (!destination) {
        const candidates = raw
            .split(/[，,。.!！?？\n]/)
            .map(part => String(part || '').trim())
            .filter(Boolean)
            .map(part => part.replace(modePhrasePattern, ' ').replace(fillerPattern, ' ').replace(/^(去|到|前往)+/g, ' ').trim())
            .filter(Boolean)
            .sort((left, right) => right.length - left.length);
        destination = candidates[0] || '';
    }

    destination = destination
        .replace(modePhrasePattern, ' ')
        .replace(fillerPattern, ' ')
        .replace(/^(去|到|前往)+/g, ' ')
        .replace(/[，,。.!！?？]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return {
        rawText: raw,
        destination,
        modeKey: mode.key,
        modeLabel: mode.label
    };
}

function upsertHiddenFoodContextMessage(contactId, contextText, options = {}) {
    if (!contactId || !window.iphoneSimState || !window.iphoneSimState.chatHistory) return null;
    const text = String(contextText || '').trim();
    if (!window.iphoneSimState.chatHistory[contactId]) {
        window.iphoneSimState.chatHistory[contactId] = [];
    }

    const history = window.iphoneSimState.chatHistory[contactId];
    const nextHistory = history.filter(msg => !(msg && msg.type === 'food_context_hidden'));
    window.iphoneSimState.chatHistory[contactId] = nextHistory;

    if (!text) {
        if (typeof saveConfig === 'function') saveConfig();
        return null;
    }

    const payload = [
        '【附近餐饮缓存】',
        '这是最近一次附近餐饮搜索结果，供后续聊天继续参考。若用户继续追问“还有别的吗”“哪个更近”“便宜点”“不要辣”等，请优先基于这份列表回答。',
        text
    ].join('\n');

    const hiddenMsg = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        time: Date.now(),
        role: 'system',
        type: 'food_context_hidden',
        hiddenFromUi: true,
        includeInAiContext: true,
        content: payload,
        metaType: 'food_context',
        meta: {
            ready: options.ready === true,
            source: 'nearby_food_search',
            items: Array.isArray(options.items) ? options.items.map(item => ({
                id: String((item && item.id) || '').trim(),
                name: String((item && item.name) || '').trim(),
                coverImage: String((item && item.coverImage) || '').trim(),
                distanceText: String((item && item.distanceText) || '').trim(),
                rating: String((item && item.rating) || '').trim(),
                cost: String((item && item.cost) || '').trim()
            })) : []
        }
    };

    window.iphoneSimState.chatHistory[contactId].push(hiddenMsg);
    if (typeof saveConfig === 'function') saveConfig();
    console.log('[Food Debug] hidden food context message stored', {
        contactId,
        ready: hiddenMsg.meta.ready,
        preview: payload.slice(0, 300)
    });
    return hiddenMsg;
}

function normalizeFoodImageMatchText(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[\s\-—_·•()（）\[\]【】,.，。!！?？:：;；'"“”‘’/\\]/g, '');
}

function pickRecommendedFoodImageItems(searchResult, assistantText) {
    const items = searchResult && Array.isArray(searchResult.items) ? searchResult.items : [];
    if (!items.length) return [];

    const rawText = String(assistantText || '').trim();
    if (!rawText) return [];
    const normalizedReply = normalizeFoodImageMatchText(rawText);

    return items
        .map((item, index) => {
            const name = String((item && item.name) || '').trim();
            const coverImage = String((item && item.coverImage) || '').trim();
            if (!name || !coverImage) return null;

            const normalizedName = normalizeFoodImageMatchText(name);
            let score = 0;
            if (rawText.includes(name)) score += 100;
            if (normalizedName && normalizedReply.includes(normalizedName)) score += 80;
            if (item.distanceMeters && Number.isFinite(Number(item.distanceMeters))) {
                score += Math.max(0, 20 - Math.min(20, Math.round(Number(item.distanceMeters) / 300)));
            }
            return score > 0 ? { item, index, score } : null;
        })
        .filter(Boolean)
        .sort((left, right) => {
            if (right.score !== left.score) return right.score - left.score;
            return left.index - right.index;
        })
        .slice(0, 2)
        .map(entry => entry.item);
}

function sendRecommendedFoodImages(contactId, searchResult, replyStartedAt) {
    if (!contactId || !searchResult || !Array.isArray(searchResult.items) || !searchResult.items.length) {
        return [];
    }
    const history = window.iphoneSimState && window.iphoneSimState.chatHistory
        ? (window.iphoneSimState.chatHistory[contactId] || [])
        : [];
    const recentAssistantText = history
        .filter(msg => msg && msg.role === 'assistant' && Number(msg.time || 0) >= Number(replyStartedAt || 0))
        .map(msg => String(msg.content || '').trim())
        .filter(Boolean)
        .join('\n');

    const matchedItems = pickRecommendedFoodImageItems(searchResult, recentAssistantText);
    matchedItems.forEach(item => {
        const meta = [item.distanceText, item.rating ? `评分 ${item.rating}` : '', item.cost ? `人均 ${item.cost}` : '']
            .filter(Boolean)
            .join(' · ');
        sendMessage(item.coverImage, false, 'image', meta ? `${item.name} · ${meta}` : item.name, contactId);
    });

    console.log('[Food Debug] recommended food images sent', {
        contactId,
        matchedCount: matchedItems.length,
        matchedItems: matchedItems.map(item => ({ name: item.name, coverImage: item.coverImage }))
    });
    return matchedItems;
}

function upsertHiddenRouteContextMessage(contactId, contextText, routeResult = null) {
    if (!contactId || !window.iphoneSimState || !window.iphoneSimState.chatHistory) return null;
    const text = String(contextText || '').trim();
    if (!window.iphoneSimState.chatHistory[contactId]) {
        window.iphoneSimState.chatHistory[contactId] = [];
    }

    const history = window.iphoneSimState.chatHistory[contactId];
    const nextHistory = history.filter(msg => !(msg && msg.type === 'route_context_hidden'));
    window.iphoneSimState.chatHistory[contactId] = nextHistory;

    if (!text) {
        if (typeof saveConfig === 'function') saveConfig();
        return null;
    }

    const payload = [
        '【导航路线缓存】',
        '这是最近一次路线规划结果，仅在用户继续讨论导航、路线、多久到、怎么走、哪种方式更合适时引用。',
        text
    ].join('\n');

    const hiddenMsg = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        time: Date.now(),
        role: 'system',
        type: 'route_context_hidden',
        hiddenFromUi: true,
        includeInAiContext: true,
        content: payload,
        metaType: 'route_context',
        meta: routeResult ? {
            destinationLabel: String(routeResult.destinationLabel || routeResult.destinationQuery || '').trim(),
            mode: String(routeResult.mode || '').trim(),
            modeLabel: String(routeResult.modeLabel || '').trim(),
            etaMin: Number(routeResult.etaMin || 0) || null,
            distanceKm: Number(routeResult.distanceKm || 0) || null
        } : null
    };

    window.iphoneSimState.chatHistory[contactId].push(hiddenMsg);
    if (typeof saveConfig === 'function') saveConfig();
    console.log('[Route Debug] hidden route context message stored', {
        contactId,
        preview: payload.slice(0, 300)
    });
    return hiddenMsg;
}

async function handleChatNavigationAssistEntry(chatInput) {
    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId) return;

    clearChatFoodAssistState(contactId);
    setChatRouteAssistState(contactId, {
        promptText: '请告诉我目的地和出行方式，例如：去南京南站，地铁。',
        awaitingInput: true
    });

    sendMessage('我正在邀请你帮我规划路线', true, 'route_invite', '请输入目的地和出行方式后为你生成路线建议');
    if (chatInput) {
        chatInput.focus();
    }
    if (typeof window.showChatToast === 'function') {
        window.showChatToast('请输入目的地和出行方式，例如：去南京南站，地铁', 2600);
    }
}

async function submitChatNavigationAssistRequest(destination, modeKey) {
    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId) {
        return false;
    }

    const destinationText = String(destination || '').trim();
    if (!destinationText) {
        return false;
    }

    const modeMeta = getChatNavigationModeMeta(modeKey);
    const promptText = `去${destinationText}，${modeMeta.label}`;

    clearChatFoodAssistState(contactId);
    setChatRouteAssistState(contactId, {
        promptText,
        destination: destinationText,
        modeKey: modeMeta.key,
        modeLabel: modeMeta.label,
        awaitingInput: false,
        fromModal: true
    });

    sendMessage('我正在邀请你帮我规划路线', true, 'route_invite', `目的地：${destinationText} · ${modeMeta.label}`);
    if (typeof window.showChatToast === 'function') {
        window.showChatToast('正在整理路线并生成建议', 2200);
    }

    await tryRunChatNavigationAssistReply(null);
    return true;
}

async function tryRunChatNavigationAssistReply(chatInput) {
    const contactId = window.iphoneSimState.currentChatContactId;
    const routeState = getChatRouteAssistState(contactId);
    if (!contactId || !routeState) {
        return false;
    }

    const typedText = chatInput ? String(chatInput.value || '').trim() : '';
    if (typedText) {
        const sentMsg = sendMessage(typedText, true);
        if (!sentMsg) {
            return true;
        }
        if (chatInput) {
            chatInput.value = '';
        }
    }

    const history = window.iphoneSimState.chatHistory[contactId] || [];
    const latestUserText = [...history]
        .reverse()
        .find(msg => msg
            && msg.role === 'user'
            && (msg.type === 'text' || msg.type === '消息')
            && !msg.hiddenFromUi
            && Number(msg.time || 0) >= Number(routeState.updatedAt || 0));
    const visibleQuestion = typedText || String((latestUserText && latestUserText.content) || routeState.promptText || '').trim();
    const intent = extractChatNavigationIntent(visibleQuestion);

    if (!visibleQuestion || !intent.destination) {
        await generateAiReply('用户刚点了导航功能，但还没说清楚目的地。请用当前语气简短追问目的地和出行方式，例如步行、地铁、骑行或驾车。', null, {
            triggerSource: 'manual'
        });
        return true;
    }

    console.log('[Route Debug] navigation assist reply starting', {
        contactId,
        visibleQuestion,
        intent
    });

    let routeResult = null;
    let contextText = '';
    try {
        if (typeof window.planAmapRouteToDestination !== 'function' || typeof window.buildAmapNavigationPromptContext !== 'function') {
            throw new Error('导航路线功能未加载');
        }
        routeResult = await window.planAmapRouteToDestination(intent.destination, intent.modeKey);
        contextText = window.buildAmapNavigationPromptContext(routeResult, visibleQuestion);
        upsertHiddenRouteContextMessage(contactId, contextText, routeResult);
        setChatRouteAssistState(contactId, {
            queryText: visibleQuestion,
            intent,
            routeResult,
            contextText,
            ready: true
        });
        if (typeof window.showChatToast === 'function') {
            window.showChatToast('已整理路线，正在请 TA 帮你规划', 2200);
        }
    } catch (error) {
        console.error('[Route Debug] route planning failed', error);
        contextText = [
            '【导航路线缓存】',
            `- 暂未成功获取路线数据：${error && error.message ? error.message : '未知错误'}`,
            '- 若用户继续问路线，请先追问更具体的目的地或更明确的出行方式，不要假装已经拿到了路线。'
        ].join('\n');
        upsertHiddenRouteContextMessage(contactId, contextText, null);
        setChatRouteAssistState(contactId, {
            queryText: visibleQuestion,
            intent,
            contextText,
            ready: false,
            error: error && error.message ? error.message : '未知错误'
        });
        if (typeof window.showChatToast === 'function') {
            window.showChatToast(`路线规划失败：${error && error.message ? error.message : '未知错误'}`, 3200);
        }
    }

    const instruction = routeResult
        ? `用户想去“${routeResult.destinationLabel || intent.destination}”，偏好${routeResult.modeLabel || intent.modeLabel}。请结合已经拿到的路线缓存，用当前人设自然地给出 1 段好懂的路线规划建议，可以补充多久能到、怎么走、是否值得换别的方式。用户问题：${visibleQuestion}`
        : `用户想让你帮忙规划路线，但这次还没拿到可用的路线数据。请不要假装已经查到路线；先追问更具体的目的地或出行方式，再给一个保守的临时建议。用户问题：${visibleQuestion}`;

    if (routeResult) {
        clearChatRouteAssistState(contactId);
    }
    await generateAiReply(instruction, null, {
        triggerSource: 'manual'
    });
    console.log('[Route Debug] navigation assist reply finished', { contactId });
    return true;
}

async function handleChatFoodAssistEntry(chatInput) {
    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId) return;

    clearChatRouteAssistState(contactId);

    const promptText = '帮我挑选今晚吃什么，优先结合附近的外卖和餐厅。';
    console.log('[Food Debug] food assist entry clicked', {
        contactId,
        promptText,
        currentChatTitle: document.getElementById('chat-title') ? document.getElementById('chat-title').textContent : ''
    });
    sendMessage('我正在邀请你帮我挑选晚饭', true, 'food_invite', '将结合附近餐厅与外卖给你建议');

    if (typeof window.showChatToast === 'function') {
        window.showChatToast('正在查找附近餐饮...', 1600);
    }

    try {
        if (typeof window.searchAmapNearbyFood !== 'function' || typeof window.buildNearbyFoodPromptContext !== 'function') {
            throw new Error('附近餐饮功能未加载');
        }

        const searchResult = await window.searchAmapNearbyFood(promptText, {
            limit: 8,
            radius: 3000
        });
        const contextText = window.buildNearbyFoodPromptContext(searchResult, promptText);

        console.log('[Food Debug] nearby food search succeeded before AI reply', {
            contactId,
            itemCount: Array.isArray(searchResult.items) ? searchResult.items.length : 0,
            items: searchResult.items || []
        });

        setChatFoodAssistState(contactId, {
            promptText,
            contextText,
            searchResult,
            ready: true
        });
        upsertHiddenFoodContextMessage(contactId, contextText, {
            ready: true,
            items: searchResult.items || []
        });

        if (typeof window.showChatToast === 'function') {
            window.showChatToast('已整理附近餐厅，正在请 TA 帮你挑晚饭', 2200);
        }
    } catch (error) {
        console.error('Nearby food search failed:', error);
        console.log('[Food Debug] nearby food search failed before AI reply', {
            contactId,
            error: error && error.message ? error.message : String(error)
        });
        const fallbackContextText = [
            '【附近餐饮候选】',
            `- 暂未成功获取附近餐饮数据：${error && error.message ? error.message : '未知错误'}`,
            '- 若用户问今天吃什么，请先追问口味、预算或就餐场景，不要假装已经查到了附近店铺。'
        ].join('\n');

        setChatFoodAssistState(contactId, {
            promptText,
            contextText: fallbackContextText,
            ready: false,
            error: error && error.message ? error.message : '未知错误'
        });
        upsertHiddenFoodContextMessage(contactId, fallbackContextText, { ready: false });

        if (typeof window.showChatToast === 'function') {
            window.showChatToast(`附近搜索失败，先让 TA 追问你口味：${error && error.message ? error.message : '未知错误'}`, 3200);
        }
    }

    await tryRunChatFoodAssistReply(null);
}

async function tryRunChatFoodAssistReply(chatInput) {
    const contactId = window.iphoneSimState.currentChatContactId;
    const foodState = getChatFoodAssistState(contactId);
    if (!contactId || !foodState) {
        console.log('[Food Debug] food assist reply skipped', {
            contactId,
            hasFoodState: !!foodState
        });
        return false;
    }

    const typedText = chatInput ? String(chatInput.value || '').trim() : '';
    if (typedText) {
        const sentMsg = sendMessage(typedText, true);
        if (!sentMsg) {
            return true;
        }
        if (chatInput) {
            chatInput.value = '';
        }
    }

    const visibleQuestion = typedText || foodState.promptText || '我今天吃什么比较好？';
    const instruction = foodState.ready
        ? `用户正在问“今天吃什么”。如果聊天里刚出现一条用户消息，请直接接住那条消息；请结合附加的附近餐饮候选，用当前人设和语气帮用户推荐 1~3 个更合适的选择，并简要说明理由。用户问题：${visibleQuestion}`
        : `用户正在问“今天吃什么”。这次没有拿到附近餐饮数据，请不要假装已经查到附近店铺；先追问口味、预算或就餐场景，再给出临时建议。用户问题：${visibleQuestion}`;

    console.log('[Food Debug] food assist reply starting', {
        contactId,
        ready: !!foodState.ready,
        visibleQuestion,
        itemCount: foodState.searchResult && Array.isArray(foodState.searchResult.items)
            ? foodState.searchResult.items.length
            : 0,
        contextPreview: String(foodState.contextText || '').slice(0, 500)
    });

    clearChatFoodAssistState(contactId);
    const replyStartedAt = Date.now();
    await generateAiReply(instruction, null, {
        triggerSource: 'manual'
    });
    if (foodState.ready && foodState.searchResult) {
        sendRecommendedFoodImages(contactId, foodState.searchResult, replyStartedAt);
    }
    console.log('[Food Debug] food assist reply finished', { contactId });
    return true;
}

async function triggerCurrentChatAiReply(chatInput = null, options = {}) {
    const triggerSource = options && typeof options === 'object' && options.triggerSource
        ? String(options.triggerSource)
        : 'manual';
    const currentContactId = window.iphoneSimState && window.iphoneSimState.currentChatContactId;
    if (currentContactId && typeof window.waitForWebLinkContextPrefetch === 'function') {
        try {
            await window.waitForWebLinkContextPrefetch(currentContactId, CHAT_WEB_LINK_CONTEXT_WAIT_TIMEOUT_MS);
        } catch (error) {
            console.warn('[WebLinkContext] wait before AI reply failed', error);
        }
    }
    const handledByRouteAssist = await tryRunChatNavigationAssistReply(chatInput);
    if (handledByRouteAssist) {
        return true;
    }

    const handledByFoodAssist = await tryRunChatFoodAssistReply(chatInput);
    if (handledByFoodAssist) {
        return true;
    }

    return await generateAiReply(null, null, { triggerSource });
}

async function checkRestWindowUpcomingNotices() {
    if (window.__restWindowUpcomingNoticeRunning) {
        return;
    }
    window.__restWindowUpcomingNoticeRunning = true;

    try {
        if (!window.iphoneSimState || !Array.isArray(window.iphoneSimState.contacts)) return;
        const now = Date.now();

        for (const contact of window.iphoneSimState.contacts) {
            if (typeof window.ensureContactRestWindowFields === 'function') {
                window.ensureContactRestWindowFields(contact);
            }
            if (!contact || !contact.restWindowEnabled) continue;

            const currentStatus = typeof window.getContactRestWindowStatus === 'function'
                ? window.getContactRestWindowStatus(contact, now)
                : null;
            if (currentStatus && currentStatus.inRestWindow) continue;

            const nextRest = typeof window.getContactNextRestWindowInfo === 'function'
                ? window.getContactNextRestWindowInfo(contact, now)
                : null;
            if (!nextRest || !nextRest.enabled || !nextRest.withinNoticeWindow || !nextRest.nextStartTimeMs) {
                continue;
            }

            if (Number(contact.restWindowUpcomingNoticeForStartMs) === Number(nextRest.nextStartTimeMs)) {
                continue;
            }

            const noticeSent = await generateAiReply(
                '现在距离你的休息时段开始只剩十分钟左右。请你主动发一条简短自然的文本消息，告诉对方你准备睡了/先休息，不要写成系统通知，不要突然展开大话题。',
                contact.id,
                { triggerSource: 'system' }
            );

            if (noticeSent) {
                contact.restWindowUpcomingNoticeForStartMs = nextRest.nextStartTimeMs;
                saveConfig();
            }
        }
    } finally {
        window.__restWindowUpcomingNoticeRunning = false;
    }
}

function handleTransfer() {
    const amountStr = document.getElementById('transfer-amount').value.trim();
    const remark = document.getElementById('transfer-remark').value.trim();

    if (!amountStr || isNaN(amountStr) || parseFloat(amountStr) <= 0) {
        alert('请输入有效的金额');
        return;
    }
    
    const amount = parseFloat(amountStr);

    if (!window.iphoneSimState.wallet) window.iphoneSimState.wallet = { balance: 0.00, transactions: [] };
    if (window.iphoneSimState.wallet.balance < amount) {
        alert('余额不足，请先充值');
        return;
    }

    window.iphoneSimState.wallet.balance -= amount;
    window.iphoneSimState.wallet.transactions.unshift({
        id: Date.now(),
        type: 'expense',
        amount: amount,
        title: '转账支出',
        time: Date.now(),
        relatedId: null
    });

    const transferId = Date.now() + Math.floor(Math.random() * 1000);
    
    window.iphoneSimState.wallet.transactions[0].relatedId = transferId;
    
    const transferData = {
        id: transferId,
        amount: amount.toFixed(2),
        remark: remark || '转账给您',
        status: 'pending'
    };

    sendMessage(JSON.stringify(transferData), true, 'transfer');
    document.getElementById('transfer-modal').classList.add('hidden');
    saveConfig();
}

function handleChatCamera() {
    const description = prompt('请输入图片描述：');
    if (description) {
        const defaultImageUrl = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
        sendMessage(defaultImageUrl, true, 'virtual_image', description);
        
        document.getElementById('chat-more-panel').classList.add('hidden');
    }
}

function handleChatPhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const fallbackToInlinePayload = async () => {
        let payload = '';
        if (typeof window.buildInlineChatImagePayload === 'function') {
            payload = await window.buildInlineChatImagePayload(file, 1280, 0.72);
        } else {
            payload = await compressImage(file, 1280, 0.72);
        }

        if (payload && typeof window.persistInlineChatImagePayload === 'function') {
            payload = await window.persistInlineChatImagePayload(payload, {
                type: file.type || 'image/jpeg',
                name: file.name || ''
            });
        }

        sendMessage(payload, true, 'image', null, null, {
            fileName: file.name || ''
        });
    };

    Promise.resolve()
        .then(async () => {
            if (typeof window.shouldPreferInlineChatImageStorage === 'function' && window.shouldPreferInlineChatImageStorage(file)) {
                return fallbackToInlinePayload();
            }

            if (typeof window.compressImageToBlob !== 'function' || typeof window.saveChatMediaBlob !== 'function') {
                return fallbackToInlinePayload();
            }

            const blob = await window.compressImageToBlob(file, 1280, 0.72);
            const mediaRef = await window.saveChatMediaBlob(blob, {
                type: blob.type || file.type || 'image/jpeg',
                name: file.name || ''
            });
            sendMessage(mediaRef, true, 'image', null, null, {
                fileName: file.name || ''
            });
            return null;
        })
        .catch(() => fallbackToInlinePayload())
        .then(() => {
            document.getElementById('chat-more-panel').classList.add('hidden');
        })
        .catch(err => {
            console.error('图片压缩失败', err);
        });
    e.target.value = '';
}

// --- AI 设置相关 ---

function setupAiListeners(isSecondary) {
    const suffix = isSecondary ? '-2' : '';
    const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
    
    const aiApiUrl = document.getElementById(`ai-api-url${suffix}`);
    if (aiApiUrl) aiApiUrl.addEventListener('change', (e) => {
        window.iphoneSimState[settingsKey].url = e.target.value;
        saveConfig();
    });

    const aiApiKey = document.getElementById(`ai-api-key${suffix}`);
    if (aiApiKey) aiApiKey.addEventListener('change', (e) => {
        window.iphoneSimState[settingsKey].key = e.target.value;
        saveConfig();
    });

    const fetchModelsBtn = document.getElementById(`fetch-models${suffix}`);
    if (fetchModelsBtn) fetchModelsBtn.addEventListener('click', () => handleFetchModels(isSecondary));

    const aiModelSelect = document.getElementById(`ai-model-select${suffix}`);
    if (aiModelSelect) aiModelSelect.addEventListener('change', (e) => {
        window.iphoneSimState[settingsKey].model = e.target.value;
        saveConfig();
    });

    const aiTemperature = document.getElementById(`ai-temperature${suffix}`);
    if (aiTemperature) aiTemperature.addEventListener('input', (e) => {
        window.iphoneSimState[settingsKey].temperature = parseFloat(e.target.value);
        document.getElementById(`ai-temp-value${suffix}`).textContent = window.iphoneSimState[settingsKey].temperature;
        saveConfig();
    });

    const saveAiPresetBtn = document.getElementById(`save-ai-preset${suffix}`);
    if (saveAiPresetBtn) saveAiPresetBtn.addEventListener('click', () => handleSaveAiPreset(isSecondary));

    const deleteAiPresetBtn = document.getElementById(`delete-ai-preset${suffix}`);
    if (deleteAiPresetBtn) deleteAiPresetBtn.addEventListener('click', () => handleDeleteAiPreset(isSecondary));

    const aiPresetSelect = document.getElementById(`ai-preset-select${suffix}`);
    if (aiPresetSelect) aiPresetSelect.addEventListener('change', (e) => handleApplyAiPreset(e, isSecondary));
}

function setupWhisperListeners() {
    const urlInput = document.getElementById('whisper-api-url');
    const keyInput = document.getElementById('whisper-api-key');
    const modelInput = document.getElementById('whisper-model');
    const modeSelect = document.getElementById('whisper-connection-mode');
    const fetchModelsBtn = document.getElementById('fetch-whisper-models');
    const modelSelect = document.getElementById('whisper-model-select');

    if (modeSelect && window.iphoneSimState.whisperSettings.url) {
        if (window.iphoneSimState.whisperSettings.url.includes('siliconflow.cn')) {
            modeSelect.value = 'siliconflow';
        } else {
            modeSelect.value = 'custom';
        }
    }

    if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
            const mode = e.target.value;
            if (mode === 'siliconflow') {
                const siliconflowUrl = 'https://api.siliconflow.cn/v1';
                urlInput.value = siliconflowUrl;
                window.iphoneSimState.whisperSettings.url = siliconflowUrl;
                // 自动推荐 SiliconFlow 的免费模型
                if (modelInput && (modelInput.value === 'whisper-1' || !modelInput.value)) {
                    const recommendModel = 'FunAudioLLM/SenseVoiceSmall';
                    modelInput.value = recommendModel;
                    window.iphoneSimState.whisperSettings.model = recommendModel;
                    if (window.showChatToast) {
                        window.showChatToast(`已自动切换为 SiliconFlow 免费模型: ${recommendModel}`);
                    } else {
                        alert(`已自动切换为 SiliconFlow 免费模型: ${recommendModel}`);
                    }
                }
            } else {
                if (urlInput.value.includes('siliconflow.cn')) {
                    urlInput.value = '';
                    window.iphoneSimState.whisperSettings.url = '';
                }
            }
            saveConfig();
        });
    }

    if (urlInput) {
        urlInput.value = window.iphoneSimState.whisperSettings.url || '';
        urlInput.addEventListener('change', (e) => {
            window.iphoneSimState.whisperSettings.url = e.target.value;
            if (modeSelect) {
                if (e.target.value.includes('siliconflow.cn')) {
                    modeSelect.value = 'siliconflow';
                } else {
                    modeSelect.value = 'custom';
                }
            }
            saveConfig();
        });
    }

    if (keyInput) {
        keyInput.value = window.iphoneSimState.whisperSettings.key || '';
        keyInput.addEventListener('change', (e) => {
            window.iphoneSimState.whisperSettings.key = e.target.value;
            saveConfig();
        });
    }

    if (modelInput) {
        modelInput.value = window.iphoneSimState.whisperSettings.model || 'whisper-1';
        modelInput.addEventListener('change', (e) => {
            window.iphoneSimState.whisperSettings.model = e.target.value;
            saveConfig();
        });
    }

    if (fetchModelsBtn) {
        fetchModelsBtn.addEventListener('click', handleFetchWhisperModels);
    }

    if (modelSelect) {
        modelSelect.addEventListener('change', (e) => {
            const selectedModel = e.target.value;
            if (selectedModel) {
                modelInput.value = selectedModel;
                window.iphoneSimState.whisperSettings.model = selectedModel;
                saveConfig();
            }
        });
    }
}

function setupMinimaxListeners() {
    const groupIdInput = document.getElementById('minimax-group-id');
    const apiKeyInput = document.getElementById('minimax-api-key');
    const modelInput = document.getElementById('minimax-model');
    const modelSelect = document.getElementById('minimax-model-select');

    if (groupIdInput) {
        groupIdInput.value = window.iphoneSimState.minimaxSettings.groupId || '';
        groupIdInput.addEventListener('change', (e) => {
            window.iphoneSimState.minimaxSettings.groupId = e.target.value;
            saveConfig();
        });
    }

    if (apiKeyInput) {
        apiKeyInput.value = window.iphoneSimState.minimaxSettings.key || '';
        apiKeyInput.addEventListener('change', (e) => {
            window.iphoneSimState.minimaxSettings.key = e.target.value;
            saveConfig();
        });
    }

    if (modelInput) {
        modelInput.value = window.iphoneSimState.minimaxSettings.model || 'speech-01-turbo';
        modelInput.addEventListener('change', (e) => {
            window.iphoneSimState.minimaxSettings.model = e.target.value;
            if (modelSelect) {
                modelSelect.value = e.target.value;
            }
            saveConfig();
        });
    }

    if (modelSelect) {
        if (window.iphoneSimState.minimaxSettings.model) {
            modelSelect.value = window.iphoneSimState.minimaxSettings.model;
        }
        
        modelSelect.addEventListener('change', (e) => {
            const selectedModel = e.target.value;
            if (selectedModel) {
                if (modelInput) modelInput.value = selectedModel;
                window.iphoneSimState.minimaxSettings.model = selectedModel;
                saveConfig();
            }
        });
    }
}

function createVoiceDebugTraceId(prefix = 'voice') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function summarizeVoiceAudioValue(audioValue) {
    const raw = String(audioValue || '').trim();
    if (!raw) return { kind: 'empty', length: 0 };
    if (raw.startsWith('data:audio/')) {
        return { kind: 'data_url', length: raw.length, preview: raw.slice(0, 42) + '...' };
    }
    if (/^https?:\/\//i.test(raw)) {
        return { kind: 'http_url', length: raw.length, preview: raw.slice(0, 120) };
    }
    return { kind: 'raw', length: raw.length, preview: raw.slice(0, 42) + '...' };
}

function voiceDebugLog(traceId, stage, detail) {
    if (detail === undefined) {
        console.log(`[VoiceDebug][${traceId}] ${stage}`);
        return;
    }
    console.log(`[VoiceDebug][${traceId}] ${stage}`, detail);
}

function voiceDebugError(traceId, stage, error) {
    console.error(`[VoiceDebug][${traceId}] ${stage}`, error);
}

async function generateMinimaxTTS(text, voiceId, options = {}) {
    const settings = window.iphoneSimState.minimaxSettings;
    const requestOptions = options && typeof options === 'object' ? options : {};
    const requestModel = String(requestOptions.model || settings.model || 'speech-01-turbo').trim() || 'speech-01-turbo';
    const suppressAlert = !!requestOptions.suppressAlert;
    const debugTraceId = String(requestOptions.debugTraceId || createVoiceDebugTraceId('tts')).trim();
    const requestBody = {
        model: requestModel,
        text: text,
        stream: false,
        voice_setting: {
            voice_id: voiceId || 'male-qn-qingse',
            speed: 1.0,
            vol: 1.0,
            pitch: 0
        }
    };

    if (requestOptions.voice_setting && typeof requestOptions.voice_setting === 'object' && !Array.isArray(requestOptions.voice_setting)) {
        requestBody.voice_setting = {
            ...requestBody.voice_setting,
            ...requestOptions.voice_setting
        };
    }
    if (requestOptions.audio_setting && typeof requestOptions.audio_setting === 'object' && !Array.isArray(requestOptions.audio_setting)) {
        requestBody.audio_setting = { ...requestOptions.audio_setting };
    }
    if (requestOptions.voice_modify && typeof requestOptions.voice_modify === 'object' && !Array.isArray(requestOptions.voice_modify)) {
        requestBody.voice_modify = { ...requestOptions.voice_modify };
    }
    if (requestOptions.pronunciation_dict && typeof requestOptions.pronunciation_dict === 'object' && !Array.isArray(requestOptions.pronunciation_dict)) {
        requestBody.pronunciation_dict = { ...requestOptions.pronunciation_dict };
    }
    if (typeof requestOptions.language_boost === 'string' && requestOptions.language_boost.trim()) {
        requestBody.language_boost = requestOptions.language_boost.trim();
    }
    
    voiceDebugLog(debugTraceId, 'TTS:prepare', {
        url: settings.url,
        hasKey: !!settings.key,
        groupId: settings.groupId,
        model: requestModel,
        textLength: String(text || '').length,
        voiceId: voiceId,
        options: {
            hasVoiceModify: !!requestBody.voice_modify,
            hasAudioSetting: !!requestBody.audio_setting,
            suppressAlert
        }
    });

    if (!settings.key) {
        if (!suppressAlert) {
            alert('Minimax API Key 未配置');
        }
        return null;
    }
    
    let url = settings.url;
    if (settings.groupId) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}GroupId=${settings.groupId}`;
    } else {
        console.warn('Minimax GroupID is empty. Request might fail.');
    }

    try {
        voiceDebugLog(debugTraceId, 'TTS:request:start', { url });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        voiceDebugLog(debugTraceId, 'TTS:request:response', { status: response.status, ok: response.ok });
        if (!response.ok) {
            const errText = await response.text();
            voiceDebugError(debugTraceId, `TTS:http_error:${response.status}`, errText);
            if (!suppressAlert) {
                alert(`语音生成失败 (HTTP ${response.status}): ${errText}`);
            }
            return null;
        }

        const data = await response.json();
        voiceDebugLog(debugTraceId, 'TTS:response:json', {
            hasDataAudio: !!(data && data.data && data.data.audio),
            hasBase64: !!(data && data.base64),
            hasAudio: !!(data && data.audio),
            baseResp: data && data.base_resp ? data.base_resp : null
        });

        if (data.base_resp && data.base_resp.status_code !== 0) {
            voiceDebugError(debugTraceId, 'TTS:api_error', data.base_resp);
            if (!suppressAlert) {
                alert(`语音生成API错误: ${data.base_resp.status_msg} (Code: ${data.base_resp.status_code})`);
            }
            return null;
        }
        
        if (data.data && data.data.audio) {
            const hexAudio = data.data.audio;
            const match = hexAudio.match(/.{1,2}/g);
            if (!match) {
                 console.error('Invalid hex audio data');
                 return null;
            }
            const bytes = new Uint8Array(match.map(byte => parseInt(byte, 16)));
            
            const blob = new Blob([bytes], { type: 'audio/mp3' });
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    voiceDebugLog(debugTraceId, 'TTS:result:data_url_from_hex', summarizeVoiceAudioValue(reader.result));
                    resolve(reader.result);
                };
                reader.readAsDataURL(blob);
            });
        } else if (data.base64) {
            const result = `data:audio/mp3;base64,${data.base64}`;
            voiceDebugLog(debugTraceId, 'TTS:result:data_url_from_base64', summarizeVoiceAudioValue(result));
            return result;
        } else if (data.audio) {
            const result = `data:audio/mp3;base64,${data.audio}`;
            voiceDebugLog(debugTraceId, 'TTS:result:data_url_from_audio_field', summarizeVoiceAudioValue(result));
            return result;
        } else {
            voiceDebugError(debugTraceId, 'TTS:response:unknown_format', JSON.stringify(data));
            if (!suppressAlert) {
                alert('语音生成失败：未知的响应格式，请检查控制台日志');
            }
            return null;
        }

    } catch (error) {
        voiceDebugError(debugTraceId, 'TTS:exception', error);
        if (!suppressAlert) {
            alert(`语音生成异常: ${error.message}`);
        }
        return null;
    }
}

function normalizeMinimaxAudioPayloadToDataUrl(rawAudio, preferMime = 'audio/mp3') {
    const source = String(rawAudio || '').trim();
    if (!source) return null;
    if (source.startsWith('data:audio/')) return source;
    if (source.startsWith('http://') || source.startsWith('https://')) return source;
    if (/^[0-9a-f]+$/i.test(source) && source.length % 2 === 0) {
        const match = source.match(/.{1,2}/g);
        if (!match) return null;
        const bytes = new Uint8Array(match.map(byte => parseInt(byte, 16)));
        const blob = new Blob([bytes], { type: preferMime });
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }
    if (/^[A-Za-z0-9+/=]+$/.test(source)) {
        return `data:${preferMime};base64,${source}`;
    }
    return null;
}

function extractMinimaxMusicAudioCandidate(payload) {
    if (!payload || typeof payload !== 'object') return '';
    const probes = [
        payload.audio,
        payload.audio_hex,
        payload.audio_base64,
        payload.audio_url,
        payload.music_url,
        payload.url,
        payload.file_url,
        payload.output,
        payload.output_audio
    ];
    for (const item of probes) {
        const candidate = String(item || '').trim();
        if (candidate) return candidate;
    }
    return '';
}

function buildMinimaxMusicGenerationUrl() {
    const settings = window.iphoneSimState.minimaxSettings || {};
    let base = String(settings.url || '').trim();
    if (!base) {
        base = 'https://api.minimax.chat/v1/t2a_v2';
    }
    if (base.indexOf('/v1/music_generation') >= 0) {
        return base;
    }
    if (base.indexOf('/v1/t2a_v2') >= 0) {
        base = base.replace('/v1/t2a_v2', '/v1/music_generation');
    } else if (base.indexOf('/v1/') >= 0) {
        base = base.replace(/\/v1\/[^/?#]+/, '/v1/music_generation');
    } else {
        base = base.replace(/\/+$/, '') + '/v1/music_generation';
    }
    return base;
}

function buildMinimaxLyricsGenerationUrl() {
    const settings = window.iphoneSimState.minimaxSettings || {};
    let base = String(settings.url || '').trim();
    if (!base) {
        base = 'https://api.minimax.io/v1/lyrics_generation';
    }
    if (base.indexOf('/v1/lyrics_generation') >= 0) {
        return base;
    }
    if (base.indexOf('/v1/t2a_v2') >= 0) {
        base = base.replace('/v1/t2a_v2', '/v1/lyrics_generation');
    } else if (base.indexOf('/v1/music_generation') >= 0) {
        base = base.replace('/v1/music_generation', '/v1/lyrics_generation');
    } else if (base.indexOf('/v1/') >= 0) {
        base = base.replace(/\/v1\/[^/?#]+/, '/v1/lyrics_generation');
    } else {
        base = base.replace(/\/+$/, '') + '/v1/lyrics_generation';
    }
    return base;
}

function extractMinimaxLyricsCandidate(payload) {
    if (!payload || typeof payload !== 'object') return '';
    const probes = [
        payload.lyrics,
        payload.song_lyrics,
        payload.output_lyrics,
        payload.content,
        payload.text
    ];
    for (const item of probes) {
        if (typeof item === 'string' && item.trim()) return item.trim();
        if (Array.isArray(item) && item.length) {
            const joined = item.map(line => String(line || '').trim()).filter(Boolean).join('\n');
            if (joined) return joined;
        }
    }
    return '';
}

function normalizeMinimaxLyricsText(rawLyrics, maxLength = 3500) {
    const text = String(rawLyrics || '').replace(/\r/g, '\n').trim();
    if (!text) return '';
    const limit = Math.max(1, Math.floor(Number(maxLength) || 3500));
    return text.slice(0, limit);
}

async function generateMinimaxLyrics(msgData = {}, options = {}) {
    const settings = window.iphoneSimState.minimaxSettings || {};
    const suppressAlert = !!(options && options.suppressAlert);
    const debugTraceId = String(options && options.debugTraceId || createVoiceDebugTraceId('lyrics')).trim();
    const key = String(settings.key || '').trim();
    const mode = String(msgData.mode || 'write_full_song').trim() || 'write_full_song';
    const prompt = String(msgData.prompt || '').trim();
    const inputLyrics = String(msgData.lyrics || '').trim();

    voiceDebugLog(debugTraceId, 'LYRICS:prepare', {
        hasKey: !!key,
        mode,
        promptLength: prompt.length,
        inputLyricsLength: inputLyrics.length
    });

    if (!key) {
        if (!suppressAlert) alert('Minimax API Key 未配置');
        return null;
    }

    let url = buildMinimaxLyricsGenerationUrl();
    if (settings.groupId) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}GroupId=${settings.groupId}`;
    }

    const payload = {
        mode: mode === 'edit' ? 'edit' : 'write_full_song',
        prompt: prompt
    };
    if (payload.mode === 'edit' && inputLyrics) payload.lyrics = inputLyrics;

    try {
        voiceDebugLog(debugTraceId, 'LYRICS:request:start', { url, payloadSummary: { mode: payload.mode, promptLength: String(payload.prompt || '').length, hasLyrics: !!payload.lyrics } });
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        voiceDebugLog(debugTraceId, 'LYRICS:request:response', { status: response.status, ok: response.ok });
        if (!response.ok) {
            const errText = await response.text();
            voiceDebugError(debugTraceId, `LYRICS:http_error:${response.status}`, errText);
            if (!suppressAlert) {
                alert(`歌词生成失败 (HTTP ${response.status}): ${errText}`);
            }
            return null;
        }

        const data = await response.json();
        const baseResp = data && data.base_resp ? data.base_resp : null;
        if (baseResp && Number(baseResp.status_code) !== 0) {
            voiceDebugError(debugTraceId, 'LYRICS:api_error', baseResp);
            if (!suppressAlert) {
                alert(`歌词生成API错误: ${baseResp.status_msg || 'unknown'} (Code: ${baseResp.status_code})`);
            }
            return null;
        }

        const lyrics = normalizeMinimaxLyricsText(
            extractMinimaxLyricsCandidate(data) || extractMinimaxLyricsCandidate(data && data.data ? data.data : null),
            3500
        );
        const songTitle = String((data && data.song_title) || (data && data.data && data.data.song_title) || '').trim();
        const styleTags = String((data && data.style_tags) || (data && data.data && data.data.style_tags) || '').trim();
        voiceDebugLog(debugTraceId, 'LYRICS:result', {
            lyricsLength: lyrics.length,
            songTitleLength: songTitle.length,
            styleTagsLength: styleTags.length
        });
        if (!lyrics) return null;
        return {
            lyrics,
            songTitle,
            styleTags,
            raw: data
        };
    } catch (error) {
        voiceDebugError(debugTraceId, 'LYRICS:exception', error);
        if (!suppressAlert) {
            alert(`歌词生成异常: ${error.message}`);
        }
        return null;
    }
}

function extractSongIdFromMusicLink(url) {
    const raw = String(url || '').trim();
    if (!raw) return { provider: '', id: '' };
    const lower = raw.toLowerCase();
    if (lower.includes('music.163.com')) {
        let id = '';
        let matched = raw.match(/[?&]id=(\d+)/i);
        if (matched) id = String(matched[1] || '');
        if (!id) {
            matched = raw.match(/song\/(\d+)/i);
            if (matched) id = String(matched[1] || '');
        }
        if (id) return { provider: 'netease', id };
    }
    if (/(y\.qq\.com|qqmusic|c\.y\.qq\.com)/i.test(lower)) {
        let id = '';
        let matched = raw.match(/[?&]songmid=([A-Za-z0-9]+)/i);
        if (matched) id = String(matched[1] || '');
        if (!id) {
            matched = raw.match(/song\/([A-Za-z0-9]+)\.html/i);
            if (matched) id = String(matched[1] || '');
        }
        if (id) return { provider: 'qqmusic', id };
    }
    return { provider: '', id: '' };
}

async function resolveMusicLinkToAudioUrl(rawUrl) {
    const source = String(rawUrl || '').trim();
    if (!source) return '';
    if (/\.(mp3|wav|flac|m4a|aac|ogg|opus)(?:\?|#|$)/i.test(source)) {
        return source;
    }

    if (typeof window.musicV2ResolveSharedSongLink === 'function') {
        try {
            const resolved = await window.musicV2ResolveSharedSongLink(source);
            const resolvedAudio = String(resolved && resolved.audioUrl || '').trim();
            if (resolvedAudio) return resolvedAudio;
        } catch (error) {}
    }

    const parsed = extractSongIdFromMusicLink(source);
    if (!parsed.provider || !parsed.id) return '';

    const candidates = [];
    if (parsed.provider === 'netease') {
        candidates.push(`https://ncm.nekogan.com/song/url/v1?id=${encodeURIComponent(parsed.id)}&level=standard`);
        candidates.push(`https://music.163.com/song/media/outer/url?id=${encodeURIComponent(parsed.id)}.mp3`);
    } else if (parsed.provider === 'qqmusic') {
        candidates.push(`https://api.ygking.top/qqmusic/song?songmid=${encodeURIComponent(parsed.id)}`);
        candidates.push(`https://api.ygking.top/qqmusic/url?songmid=${encodeURIComponent(parsed.id)}`);
    }

    for (const endpoint of candidates) {
        try {
            const resp = await fetch(endpoint, { method: 'GET' });
            if (!resp.ok) continue;
            const contentType = String(resp.headers.get('content-type') || '').toLowerCase();
            if (contentType.includes('audio/')) {
                return endpoint;
            }
            const text = await resp.text();
            if (!text) continue;
            let data = null;
            try {
                data = JSON.parse(text);
            } catch (error) {}
            if (data && typeof data === 'object') {
                const probes = [
                    data.url,
                    data.data && data.data.url,
                    Array.isArray(data.data) && data.data[0] ? data.data[0].url : '',
                    data.song && data.song.url,
                    data.result && data.result.url,
                    data.play_url,
                    data.playUrl
                ];
                for (const probe of probes) {
                    const candidate = String(probe || '').trim();
                    if (/^https?:\/\//i.test(candidate)) {
                        return candidate;
                    }
                }
            }
            const matched = text.match(/https?:\/\/[^\s"'\\]+?\.(?:mp3|m4a|aac|wav|flac|ogg|opus)(?:\?[^\s"'\\]*)?/i);
            if (matched) {
                return String(matched[0] || '').trim();
            }
        } catch (error) {}
    }

    return '';
}

async function generateMinimaxMusicCover(msgData = {}, options = {}) {
    const settings = window.iphoneSimState.minimaxSettings || {};
    const suppressAlert = !!(options && options.suppressAlert);
    const debugTraceId = String(options && options.debugTraceId || createVoiceDebugTraceId('cover')).trim();
    const key = String(settings.key || '').trim();
    voiceDebugLog(debugTraceId, 'COVER:prepare', {
        hasKey: !!key,
        model: String(msgData && msgData.musicOptions && msgData.musicOptions.model || 'music-cover-free'),
        hasCoverAudioUrl: !!String(msgData.coverAudioUrl || '').trim(),
        hasCoverAudioBase64: !!String(msgData.coverAudioBase64 || '').trim(),
        hasCoverFeatureId: !!String(msgData.coverFeatureId || '').trim()
    });
    if (!key) {
        if (!suppressAlert) alert('Minimax API Key 未配置');
        return null;
    }

    const originalAudioUrl = String(msgData.coverAudioUrl || '').trim();
    const audioUrl = originalAudioUrl ? (await resolveMusicLinkToAudioUrl(originalAudioUrl) || originalAudioUrl) : '';
    const audioBase64 = String(msgData.coverAudioBase64 || '').trim();
    const featureId = String(msgData.coverFeatureId || '').trim();
    voiceDebugLog(debugTraceId, 'COVER:input:resolved', {
        originalAudioUrl,
        resolvedAudioUrl: audioUrl,
        hasAudioBase64: !!audioBase64,
        hasFeatureId: !!featureId
    });
    if (!audioUrl && !audioBase64 && !featureId) {
        voiceDebugLog(debugTraceId, 'COVER:skip:no_audio_reference');
        return null;
    }

    let url = buildMinimaxMusicGenerationUrl();
    if (settings.groupId) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}GroupId=${settings.groupId}`;
    }

    const musicOptions = (msgData.musicOptions && typeof msgData.musicOptions === 'object' && !Array.isArray(msgData.musicOptions))
        ? msgData.musicOptions
        : {};
    const payload = {
        model: String(musicOptions.model || 'music-cover-free'),
        generation_mode: 'cover',
        output_format: String(musicOptions.output_format || 'hex'),
        prompt: String(msgData.coverPrompt || msgData.melodyHint || 'Keep original melody and rhythm, natural expressive vocal cover')
    };
    if (audioUrl) payload.audio_url = audioUrl;
    if (audioBase64) payload.audio_base64 = audioBase64;
    if (featureId) payload.refer_voice = featureId;

    try {
        voiceDebugLog(debugTraceId, 'COVER:request:start', { url, payloadSummary: { model: payload.model, output_format: payload.output_format, generation_mode: payload.generation_mode, hasAudioUrl: !!payload.audio_url, hasAudioBase64: !!payload.audio_base64, hasReferVoice: !!payload.refer_voice } });
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        voiceDebugLog(debugTraceId, 'COVER:request:response', { status: response.status, ok: response.ok });
        if (!response.ok) {
            const errText = await response.text();
            voiceDebugError(debugTraceId, `COVER:http_error:${response.status}`, errText);
            if (!suppressAlert) {
                alert(`唱歌生成失败 (HTTP ${response.status}): ${errText}`);
            }
            return null;
        }

        const data = await response.json();
        voiceDebugLog(debugTraceId, 'COVER:response:json', {
            hasTopAudioCandidate: !!extractMinimaxMusicAudioCandidate(data),
            hasNestedAudioCandidate: !!extractMinimaxMusicAudioCandidate(data && data.data ? data.data : null),
            taskId: String((data && (data.task_id || data.taskId)) || (data && data.data && (data.data.task_id || data.data.taskId)) || '').trim()
        });
        const immediateCandidate = extractMinimaxMusicAudioCandidate(data)
            || extractMinimaxMusicAudioCandidate(data && data.data ? data.data : null);
        if (immediateCandidate) {
            const normalized = await normalizeMinimaxAudioPayloadToDataUrl(immediateCandidate, 'audio/mp3');
            voiceDebugLog(debugTraceId, 'COVER:result:immediate', summarizeVoiceAudioValue(normalized));
            return normalized;
        }

        const taskId = String((data && (data.task_id || data.taskId)) || (data && data.data && (data.data.task_id || data.data.taskId)) || '').trim();
        if (taskId) {
            const pollUrl = `${buildMinimaxMusicGenerationUrl().replace(/\?.*$/, '')}/${encodeURIComponent(taskId)}${settings.groupId ? `?GroupId=${encodeURIComponent(settings.groupId)}` : ''}`;
            voiceDebugLog(debugTraceId, 'COVER:poll:start', { pollUrl, maxAttempts: 12 });
            for (let attempt = 0; attempt < 12; attempt++) {
                await new Promise(r => setTimeout(r, 1500));
                const pollResp = await fetch(pollUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${key}`
                    }
                });
                voiceDebugLog(debugTraceId, 'COVER:poll:response', { attempt: attempt + 1, status: pollResp.status, ok: pollResp.ok });
                if (!pollResp.ok) continue;
                const pollData = await pollResp.json();
                const candidate = extractMinimaxMusicAudioCandidate(pollData)
                    || extractMinimaxMusicAudioCandidate(pollData && pollData.data ? pollData.data : null);
                if (candidate) {
                    const normalized = await normalizeMinimaxAudioPayloadToDataUrl(candidate, 'audio/mp3');
                    voiceDebugLog(debugTraceId, 'COVER:result:polled', summarizeVoiceAudioValue(normalized));
                    return normalized;
                }
                const statusText = String((pollData && (pollData.status || pollData.state))
                    || (pollData && pollData.data && (pollData.data.status || pollData.data.state))
                    || '').toLowerCase();
                voiceDebugLog(debugTraceId, 'COVER:poll:status', { attempt: attempt + 1, statusText });
                if (statusText && (statusText.includes('failed') || statusText.includes('error') || statusText.includes('cancel'))) {
                    break;
                }
            }
        }

        voiceDebugLog(debugTraceId, 'COVER:result:none');
        if (!suppressAlert) {
            alert('唱歌生成失败：未获取到可播放音频');
        }
        return null;
    } catch (error) {
        voiceDebugError(debugTraceId, 'COVER:exception', error);
        if (!suppressAlert) {
            alert(`唱歌生成异常: ${error.message}`);
        }
        return null;
    }
}

async function generateMinimaxOriginalMusic(msgData = {}, options = {}) {
    const settings = window.iphoneSimState.minimaxSettings || {};
    const suppressAlert = !!(options && options.suppressAlert);
    const debugTraceId = String(options && options.debugTraceId || createVoiceDebugTraceId('orig')).trim();
    const key = String(settings.key || '').trim();
    const musicOptions = (msgData.musicOptions && typeof msgData.musicOptions === 'object' && !Array.isArray(msgData.musicOptions))
        ? msgData.musicOptions
        : {};
    const prompt = String(msgData.prompt || msgData.composePrompt || '').trim();
    const lyrics = normalizeMinimaxLyricsText(msgData.lyrics, 3500);
    const isInstrumental = !!msgData.isInstrumental;
    const preferredVoiceId = String(
        musicOptions.voice_id
        || msgData.voice_id
        || musicOptions.contact_voice_id
        || msgData.contact_voice_id
        || msgData.contactVoiceId
        || ''
    ).trim();

    voiceDebugLog(debugTraceId, 'ORIG:prepare', {
        hasKey: !!key,
        model: String(musicOptions.model || msgData.model || 'music-2.6-free'),
        promptLength: prompt.length,
        lyricsLength: lyrics.length,
        isInstrumental,
        hasPreferredVoiceId: !!preferredVoiceId
    });

    if (!key) {
        if (!suppressAlert) alert('Minimax API Key 未配置');
        return null;
    }

    let url = buildMinimaxMusicGenerationUrl();
    if (settings.groupId) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}GroupId=${settings.groupId}`;
    }

    const payload = {
        model: String(musicOptions.model || msgData.model || 'music-2.6-free'),
        output_format: String(musicOptions.output_format || 'hex'),
        prompt: prompt || 'Pop ballad, emotional, 95 BPM, modern arrangement, clear vocals',
        is_instrumental: isInstrumental
    };
    if (musicOptions.audio_setting && typeof musicOptions.audio_setting === 'object' && !Array.isArray(musicOptions.audio_setting)) {
        payload.audio_setting = { ...musicOptions.audio_setting };
    }
    if (isInstrumental) {
        payload.lyrics = '';
    } else if (lyrics) {
        payload.lyrics = lyrics;
    } else {
        payload.lyrics = '';
        payload.lyrics_optimizer = true;
    }
    const requestAttempts = [];
    if (preferredVoiceId) {
        requestAttempts.push({
            name: 'with_voice_id',
            payload: Object.assign({}, payload, { voice_id: preferredVoiceId })
        });
    }
    requestAttempts.push({
        name: 'base',
        payload: payload
    });

    try {
        for (let reqIdx = 0; reqIdx < requestAttempts.length; reqIdx++) {
            const request = requestAttempts[reqIdx];
            const isLastAttempt = reqIdx === requestAttempts.length - 1;
            voiceDebugLog(debugTraceId, 'ORIG:request:start', {
                attempt: request.name,
                url,
                payloadSummary: {
                    model: request.payload.model,
                    output_format: request.payload.output_format,
                    promptLength: String(request.payload.prompt || '').length,
                    lyricsLength: String(request.payload.lyrics || '').length,
                    lyrics_optimizer: !!request.payload.lyrics_optimizer,
                    is_instrumental: !!request.payload.is_instrumental,
                    hasVoiceId: !!String(request.payload.voice_id || '').trim()
                }
            });
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request.payload)
            });
            voiceDebugLog(debugTraceId, 'ORIG:request:response', {
                attempt: request.name,
                status: response.status,
                ok: response.ok
            });
            if (!response.ok) {
                const errText = await response.text();
                voiceDebugError(debugTraceId, `ORIG:http_error:${response.status}:${request.name}`, errText);
                if (!isLastAttempt) {
                    voiceDebugLog(debugTraceId, 'ORIG:request:fallback_next_attempt', {
                        fromAttempt: request.name
                    });
                    continue;
                }
                if (!suppressAlert) {
                    alert(`原创生成失败 (HTTP ${response.status}): ${errText}`);
                }
                return null;
            }

            const data = await response.json();
            const baseResp = data && data.base_resp ? data.base_resp : null;
            if (baseResp && Number(baseResp.status_code) !== 0) {
                voiceDebugError(debugTraceId, 'ORIG:api_error', {
                    attempt: request.name,
                    baseResp
                });
                if (!isLastAttempt) {
                    voiceDebugLog(debugTraceId, 'ORIG:api_error:fallback_next_attempt', {
                        fromAttempt: request.name
                    });
                    continue;
                }
                if (!suppressAlert) {
                    alert(`原创生成API错误: ${baseResp.status_msg || 'unknown'} (Code: ${baseResp.status_code})`);
                }
                return null;
            }

            voiceDebugLog(debugTraceId, 'ORIG:response:json', {
                attempt: request.name,
                hasTopAudioCandidate: !!extractMinimaxMusicAudioCandidate(data),
                hasNestedAudioCandidate: !!extractMinimaxMusicAudioCandidate(data && data.data ? data.data : null),
                taskId: String((data && (data.task_id || data.taskId)) || (data && data.data && (data.data.task_id || data.data.taskId)) || '').trim()
            });
            const immediateCandidate = extractMinimaxMusicAudioCandidate(data)
                || extractMinimaxMusicAudioCandidate(data && data.data ? data.data : null);
            if (immediateCandidate) {
                const normalized = await normalizeMinimaxAudioPayloadToDataUrl(immediateCandidate, 'audio/mp3');
                voiceDebugLog(debugTraceId, 'ORIG:result:immediate', summarizeVoiceAudioValue(normalized));
                return normalized;
            }

            const taskId = String((data && (data.task_id || data.taskId)) || (data && data.data && (data.data.task_id || data.data.taskId)) || '').trim();
            if (taskId) {
                const pollUrl = `${buildMinimaxMusicGenerationUrl().replace(/\?.*$/, '')}/${encodeURIComponent(taskId)}${settings.groupId ? `?GroupId=${encodeURIComponent(settings.groupId)}` : ''}`;
                voiceDebugLog(debugTraceId, 'ORIG:poll:start', {
                    attempt: request.name,
                    pollUrl,
                    maxAttempts: 12
                });
                for (let attempt = 0; attempt < 12; attempt++) {
                    await new Promise(r => setTimeout(r, 1500));
                    const pollResp = await fetch(pollUrl, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${key}`
                        }
                    });
                    voiceDebugLog(debugTraceId, 'ORIG:poll:response', {
                        attempt: attempt + 1,
                        requestAttempt: request.name,
                        status: pollResp.status,
                        ok: pollResp.ok
                    });
                    if (!pollResp.ok) continue;
                    const pollData = await pollResp.json();
                    const candidate = extractMinimaxMusicAudioCandidate(pollData)
                        || extractMinimaxMusicAudioCandidate(pollData && pollData.data ? pollData.data : null);
                    if (candidate) {
                        const normalized = await normalizeMinimaxAudioPayloadToDataUrl(candidate, 'audio/mp3');
                        voiceDebugLog(debugTraceId, 'ORIG:result:polled', summarizeVoiceAudioValue(normalized));
                        return normalized;
                    }
                    const statusText = String((pollData && (pollData.status || pollData.state))
                        || (pollData && pollData.data && (pollData.data.status || pollData.data.state))
                        || '').toLowerCase();
                    voiceDebugLog(debugTraceId, 'ORIG:poll:status', {
                        attempt: attempt + 1,
                        requestAttempt: request.name,
                        statusText
                    });
                    if (statusText && (statusText.includes('failed') || statusText.includes('error') || statusText.includes('cancel'))) {
                        break;
                    }
                }
            }

            if (!isLastAttempt) {
                voiceDebugLog(debugTraceId, 'ORIG:result:none_try_next_attempt', {
                    fromAttempt: request.name
                });
                continue;
            }
        }

        voiceDebugLog(debugTraceId, 'ORIG:result:none');
        if (!suppressAlert) {
            alert('原创生成失败：未获取到可播放音频');
        }
        return null;
    } catch (error) {
        voiceDebugError(debugTraceId, 'ORIG:exception', error);
        if (!suppressAlert) {
            alert(`原创生成异常: ${error.message}`);
        }
        return null;
    }
}

window.musicV2GenerateMinimaxTTS = generateMinimaxTTS;
window.musicV2GenerateMinimaxMusicCover = generateMinimaxMusicCover;
window.musicV2GenerateMinimaxLyrics = generateMinimaxLyrics;
window.musicV2GenerateMinimaxOriginalMusic = generateMinimaxOriginalMusic;

async function handleFetchWhisperModels() {
    const url = window.iphoneSimState.whisperSettings.url;
    const key = window.iphoneSimState.whisperSettings.key;
    const btn = document.getElementById('fetch-whisper-models');
    const select = document.getElementById('whisper-model-select');

    if (!url) {
        alert('请先输入API地址');
        return;
    }

    const originalText = btn.textContent;
    btn.textContent = '拉取中...';
    btn.disabled = true;

    try {
        let fetchUrl = url;
        if (fetchUrl.endsWith('/')) {
            fetchUrl = fetchUrl.slice(0, -1);
        }
        
        if (!fetchUrl.endsWith('/models')) {
            if (fetchUrl.endsWith('/v1')) {
                fetchUrl += '/models';
            } else {
                fetchUrl += '/models';
            }
        }

        const headers = {};
        if (key) {
            headers['Authorization'] = `Bearer ${key}`;
        }

        const response = await fetch(fetchUrl, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const models = data.data || data.models || [];

        select.innerHTML = '<option value="">请选择模型</option>';
        
        if (models.length === 0) {
            alert('未获取到模型列表');
            return;
        }

        models.forEach(model => {
            const id = model.id || model;
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id;
            select.appendChild(option);
        });

        select.classList.remove('hidden');
        alert(`成功获取 ${models.length} 个模型`);

    } catch (error) {
        console.error('获取Whisper模型失败:', error);
        alert('获取模型失败，请检查API地址和密钥是否正确，或跨域设置。');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function handleFetchModels(isSecondary = false) {
    const suffix = isSecondary ? '-2' : '';
    const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
    
    const url = window.iphoneSimState[settingsKey].url;
    const key = window.iphoneSimState[settingsKey].key;

    if (!url) {
        alert('请先输入API地址');
        return;
    }

    const btn = document.getElementById(`fetch-models${suffix}`);
    const originalText = btn.textContent;
    btn.textContent = '拉取中...';
    btn.disabled = true;

    try {
        let fetchUrl = url;
        if (!fetchUrl.endsWith('/models')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'models' : fetchUrl + '/models';
        }

        const headers = {};
        if (key) {
            // 清理 Key，移除可能包含的非 ASCII 字符（如中文）
            const cleanKey = key.replace(/[^\x00-\x7F]/g, "").trim();
            headers['Authorization'] = `Bearer ${cleanKey}`;
        }

        const response = await fetch(fetchUrl, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const models = data.data || data.models || [];

        const select = document.getElementById(`ai-model-select${suffix}`);
        select.innerHTML = '<option value="">请选择模型</option>';
        
        models.forEach(model => {
            const id = model.id || model;
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id;
            select.appendChild(option);
        });

        alert(`成功获取 ${models.length} 个模型`);
        
        if (window.iphoneSimState[settingsKey].model) {
            select.value = window.iphoneSimState[settingsKey].model;
        }

    } catch (error) {
        console.error('获取模型失败:', error);
        alert('获取模型失败，请检查API地址和密钥是否正确，或跨域设置。');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function handleSaveAiPreset(isSecondary = false) {
    const suffix = isSecondary ? '-2' : '';
    const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
    const presetsKey = isSecondary ? 'aiPresets2' : 'aiPresets';
    
    const name = prompt('请输入AI配置预设名称：');
    if (!name) return;

    const preset = {
        name: name,
        settings: { ...window.iphoneSimState[settingsKey] }
    };

    window.iphoneSimState[presetsKey].push(preset);
    saveConfig();
    renderAiPresets(isSecondary);
    document.getElementById(`ai-preset-select${suffix}`).value = name;
    alert('AI预设已保存');
}

function handleDeleteAiPreset(isSecondary = false) {
    const suffix = isSecondary ? '-2' : '';
    const presetsKey = isSecondary ? 'aiPresets2' : 'aiPresets';
    
    const select = document.getElementById(`ai-preset-select${suffix}`);
    const name = select.value;
    if (!name) return;

    if (confirm(`确定要删除预设 "${name}" 吗？`)) {
        window.iphoneSimState[presetsKey] = window.iphoneSimState[presetsKey].filter(p => p.name !== name);
        saveConfig();
        renderAiPresets(isSecondary);
    }
}

function handleApplyAiPreset(e, isSecondary = false) {
    const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
    const presetsKey = isSecondary ? 'aiPresets2' : 'aiPresets';
    
    const name = e.target.value;
    if (!name) return;

    const preset = window.iphoneSimState[presetsKey].find(p => p.name === name);
    if (preset) {
        window.iphoneSimState[settingsKey] = { ...preset.settings };
        updateAiUi(isSecondary);
        saveConfig();
    }
}

function renderAiPresets(isSecondary = false) {
    const suffix = isSecondary ? '-2' : '';
    const presetsKey = isSecondary ? 'aiPresets2' : 'aiPresets';
    
    const select = document.getElementById(`ai-preset-select${suffix}`);
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">-- 选择预设 --</option>';

    if (window.iphoneSimState[presetsKey]) {
        window.iphoneSimState[presetsKey].forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.name;
            option.textContent = preset.name;
            select.appendChild(option);
        });
    }

    if (currentValue && window.iphoneSimState[presetsKey].some(p => p.name === currentValue)) {
        select.value = currentValue;
    }
}

function updateAiUi(isSecondary = false) {
    const suffix = isSecondary ? '-2' : '';
    const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
    
    const urlInput = document.getElementById(`ai-api-url${suffix}`);
    const keyInput = document.getElementById(`ai-api-key${suffix}`);
    const modelSelect = document.getElementById(`ai-model-select${suffix}`);
    const tempInput = document.getElementById(`ai-temperature${suffix}`);
    const tempValue = document.getElementById(`ai-temp-value${suffix}`);

    if (urlInput) urlInput.value = window.iphoneSimState[settingsKey].url || '';
    if (keyInput) keyInput.value = window.iphoneSimState[settingsKey].key || '';
    if (tempInput) tempInput.value = window.iphoneSimState[settingsKey].temperature || 0.7;
    if (tempValue) tempValue.textContent = window.iphoneSimState[settingsKey].temperature || 0.7;
    
    if (modelSelect && window.iphoneSimState[settingsKey].model) {
        if (!modelSelect.querySelector(`option[value="${window.iphoneSimState[settingsKey].model}"]`)) {
            const option = document.createElement('option');
            option.value = window.iphoneSimState[settingsKey].model;
            option.textContent = window.iphoneSimState[settingsKey].model;
            modelSelect.appendChild(option);
        }
        modelSelect.value = window.iphoneSimState[settingsKey].model;
    }
}

window.updateWhisperUi = function() {
    const urlInput = document.getElementById('whisper-api-url');
    const keyInput = document.getElementById('whisper-api-key');
    const modelInput = document.getElementById('whisper-model');
    const modeSelect = document.getElementById('whisper-connection-mode');
    const modelSelect = document.getElementById('whisper-model-select');

    if (urlInput) urlInput.value = window.iphoneSimState.whisperSettings.url || '';
    if (keyInput) keyInput.value = window.iphoneSimState.whisperSettings.key || '';
    if (modelInput) modelInput.value = window.iphoneSimState.whisperSettings.model || 'whisper-1';

    if (modeSelect && window.iphoneSimState.whisperSettings.url) {
        if (window.iphoneSimState.whisperSettings.url.includes('siliconflow.cn')) {
            modeSelect.value = 'siliconflow';
        } else {
            modeSelect.value = 'custom';
        }
    }

    if (modelSelect && window.iphoneSimState.whisperSettings.model) {
        modelSelect.value = window.iphoneSimState.whisperSettings.model;
    }
};

window.updateMinimaxUi = function() {
    const groupIdInput = document.getElementById('minimax-group-id');
    const apiKeyInput = document.getElementById('minimax-api-key');
    const modelInput = document.getElementById('minimax-model');
    const modelSelect = document.getElementById('minimax-model-select');

    if (groupIdInput) groupIdInput.value = window.iphoneSimState.minimaxSettings.groupId || '';
    if (apiKeyInput) apiKeyInput.value = window.iphoneSimState.minimaxSettings.key || '';
    if (modelInput) modelInput.value = window.iphoneSimState.minimaxSettings.model || 'speech-01-turbo';
    
    if (modelSelect && window.iphoneSimState.minimaxSettings.model) {
        modelSelect.value = window.iphoneSimState.minimaxSettings.model;
    }
};

// --- 语音功能 ---

function handleSendFakeVoice() {
    const text = document.getElementById('voice-fake-text').value.trim();
    const duration = document.getElementById('voice-fake-duration').value;

    if (!text) {
        alert('请输入语音内容文本');
        return;
    }

    const voiceData = {
        duration: parseInt(duration),
        text: text,
        isReal: false
    };

    sendMessage(JSON.stringify(voiceData), true, 'voice');
    document.getElementById('voice-input-modal').classList.add('hidden');
}

async function toggleVoiceRecording() {
    const micBtn = document.getElementById('voice-mic-btn');
    const statusText = document.getElementById('voice-recording-status');
    const resultDiv = document.getElementById('voice-real-result');
    const sendBtn = document.getElementById('send-real-voice-btn');
    
    if (!window.iphoneSimState.whisperSettings.url || !window.iphoneSimState.whisperSettings.key) {
        alert('请先在设置中配置 Whisper API');
        return;
    }

    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000  // 降低采样率以减小文件大小
                }
            });
            
            // 使用SiliconFlow支持的音频格式：wav/mp3/pcm/opus/webm
            let options = {};
            let fileExt = 'webm';
            let mimeType = 'audio/webm';
            
            // 优先使用webm格式（最广泛支持）
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options = { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 64000 };
                fileExt = 'webm';
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/webm', audioBitsPerSecond: 64000 };
                fileExt = 'webm';
                mimeType = 'audio/webm';
            } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                options = { mimeType: 'audio/ogg;codecs=opus', audioBitsPerSecond: 64000 };
                fileExt = 'ogg';
                mimeType = 'audio/ogg;codecs=opus';
            }
            
            try {
                mediaRecorder = new MediaRecorder(stream, options);
                console.log('Using audio format:', mediaRecorder.mimeType);
            } catch (e) {
                console.warn('MediaRecorder options not supported, using default', e);
                mediaRecorder = new MediaRecorder(stream);
            }
            
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const actualMimeType = mediaRecorder.mimeType || mimeType;
                const audioBlob = new Blob(audioChunks, { type: actualMimeType });
                
                // 根据实际mime类型确定文件扩展名
                let actualExt = 'webm';
                if (actualMimeType.includes('mp4')) {
                    actualExt = 'm4a';
                } else if (actualMimeType.includes('webm')) {
                    actualExt = 'webm';
                }
                
                const audioFile = new File([audioBlob], `recording.${actualExt}`, { type: actualMimeType });
                
                const duration = Math.ceil((Date.now() - recordingStartTime) / 1000);
                recordedDuration = duration > 60 ? 60 : duration;

                // 只在需要时才转换为base64（减少内存占用）
                recordedAudio = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(audioBlob);
                });
                console.log('Audio processed, format:', actualMimeType, 'size:', audioBlob.size);

                micBtn.classList.remove('recording');
                statusText.textContent = '正在转文字...';
                statusText.style.color = '#007AFF';
                
                try {
                    const formData = new FormData();
                    formData.append('file', audioFile);
                    formData.append('model', window.iphoneSimState.whisperSettings.model || 'whisper-1');
                    formData.append('language', 'zh');  // 指定中文以提高准确率

                    let fetchUrl = window.iphoneSimState.whisperSettings.url;
                    // 移除尾部斜杠，规范化处理
                    if (fetchUrl.endsWith('/')) {
                        fetchUrl = fetchUrl.slice(0, -1);
                    }
                    
                    // 智能追加路径
                    if (!fetchUrl.endsWith('/audio/transcriptions')) {
                        fetchUrl = fetchUrl + '/audio/transcriptions';
                    }

                    const cleanKey = window.iphoneSimState.whisperSettings.key ? window.iphoneSimState.whisperSettings.key.trim() : '';

                    const response = await fetch(fetchUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${cleanKey}`
                        },
                        body: formData
                    });

                    if (!response.ok) {
                        if (response.status === 403) {
                            throw new Error(`API Error: 403 (权限不足或模型名称错误。SiliconFlow 请尝试使用 'FunAudioLLM/SenseVoiceSmall')`);
                        }
                        const errorText = await response.text();
                        throw new Error(`API Error: ${response.status} - ${errorText}`);
                    }

                    const data = await response.json();
                    let text = data.text || '';
                    
                    // 过滤emoji和特殊字符
                    text = text.replace(/[\u{1F600}-\u{1F64F}]/gu, '') // 表情符号
                               .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // 符号和象形文字
                               .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // 交通和地图符号
                               .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // 旗帜
                               .replace(/[\u{2600}-\u{26FF}]/gu, '')   // 杂项符号
                               .replace(/[\u{2700}-\u{27BF}]/gu, '')   // 装饰符号
                               .trim();
                    
                    recordedText = text;
                    
                    if (!recordedText) {
                        resultDiv.textContent = '未识别到内容，请重试';
                        statusText.textContent = '识别失败';
                        statusText.style.color = '#FF9500';
                    } else {
                        resultDiv.textContent = recordedText;
                        statusText.textContent = '录音结束';
                        statusText.style.color = '#888';
                        sendBtn.disabled = false;
                    }

                } catch (error) {
                    console.error('Whisper API Error:', error);
                    let errorMsg = error.message;
                    if (errorMsg === 'Failed to fetch' || errorMsg.includes('NetworkError')) {
                        errorMsg = '网络连接失败\n\n可能原因：\n1. CORS跨域问题（服务器配置错误）\n2. 网络超时\n3. API地址错误\n\n⚠️ 如果是SiliconFlow的CORS错误，这是服务器端配置问题，请联系API提供商修复';
                    } else if (errorMsg.includes('load failed')) {
                        errorMsg = '加载失败 (请检查网络连接和API配置)';
                    }
                    resultDiv.textContent = '转文字失败: ' + errorMsg;
                    resultDiv.style.whiteSpace = 'pre-wrap'; // 支持换行显示
                    statusText.textContent = '出错';
                    statusText.style.color = '#FF3B30';
                }
                
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            isRecording = true;
            recordingStartTime = Date.now();
            
            micBtn.classList.add('recording');
            statusText.textContent = '正在录音... (点击停止)';
            statusText.style.color = '#FF3B30';
            resultDiv.textContent = '';
            sendBtn.disabled = true;
            recordedText = '';

        } catch (err) {
            console.error('无法访问麦克风:', err);
            alert('无法访问麦克风，请检查权限。错误: ' + err.message);
        }

    } else {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            isRecording = false;
        }
    }
}

function handleSendRealVoice() {
    if (!recordedText) recordedText = '[语音]';

    const voiceData = {
        duration: recordedDuration || 1,
        text: recordedText,
        isReal: true,
        audio: recordedAudio
    };

    sendMessage(JSON.stringify(voiceData), true, 'voice');
    document.getElementById('voice-input-modal').classList.add('hidden');
}

function startOutgoingCall() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    // 尝试解锁音频上下文
    try {
        if (!globalVoicePlayer) {
            globalVoicePlayer = new Audio();
        }
        globalVoicePlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAgAAAAEA';
        globalVoicePlayer.play().catch(e => console.log('Outgoing call audio unlock failed:', e));
    } catch(e) {
        console.error('Audio unlock error', e);
    }

    const screen = document.getElementById('voice-call-screen');
    const avatar = document.getElementById('voice-call-avatar');
    const name = document.getElementById('voice-call-name');
    const bg = document.getElementById('voice-call-bg');
    const statusEl = document.getElementById('voice-call-status');
    const timeEl = document.getElementById('voice-call-time');
    
    avatar.src = contact.avatar;
    name.textContent = contact.remark || contact.name;
    statusEl.textContent = '等待对方接听...';
    timeEl.textContent = '正在呼叫'; 
    
    if (contact.voiceCallBg) {
        bg.style.backgroundImage = `url(${contact.voiceCallBg})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.add('hidden');
    
    document.getElementById('voice-call-content').classList.add('hidden');
    document.querySelector('.voice-call-input-area').classList.add('hidden');
    
    document.getElementById('voice-call-actions-active').classList.add('hidden');
    document.getElementById('voice-call-actions-incoming').classList.add('hidden');
    
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (outgoingActions) outgoingActions.classList.remove('hidden');

    screen.classList.remove('hidden');

    const cancelBtn = document.getElementById('voice-call-cancel-btn');
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.onclick = () => {
            closeVoiceCallScreen('user_cancel');
        };
    }

    makeAiCallDecision(contact);
}

async function makeAiCallDecision(contact) {
    const waitTime = 2000 + Math.random() * 3000;
    const startTime = Date.now();

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    let shouldAccept = true;

    if (settings.url && settings.key) {
        try {
            const history = window.iphoneSimState.chatHistory[contact.id] || [];
            const recentHistory = history.slice(-10).map(m => {
                let content = m.content;
                if (m.type === 'image') content = '[图片]';
                else if (m.type === 'sticker') content = '[表情包]';
                return `${m.role === 'user' ? '用户' : '你'}: ${content}`;
            }).join('\n');
            
            const systemPrompt = `你现在扮演 ${contact.name}。
【核心指令】
你必须严格遵守以下人设（优先级最高，高于一切其他指令）：
${contact.persona || '无'}

用户正在向你发起语音通话请求。
请根据你们最近的聊天记录和你的当前状态，决定是否接听。
最近聊天记录：
${recentHistory}

请只回复一个单词：
- 如果接听，回复 "ACCEPT"
- 如果拒绝，回复 "REJECT"`;

            let fetchUrl = settings.url;
            if (!fetchUrl.endsWith('/chat/completions')) {
                fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
            }

        const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, "").trim() : '';
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify({
                    model: settings.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: 'ACTION: INCOMING_VOICE_CALL' }
                    ],
                    temperature: 0.1
                })
            });

            if (response.ok) {
                const data = await response.json();
                const reply = data.choices[0].message.content.trim().toUpperCase();
                console.log('AI Call Decision:', reply);
                if (reply.includes('REJECT')) {
                    shouldAccept = false;
                }
            }
        } catch (e) {
            console.error('AI Call Decision API Error:', e);
        }
    }

    const elapsed = Date.now() - startTime;
    if (elapsed < waitTime) {
        await new Promise(r => setTimeout(r, waitTime - elapsed));
    }

    const screen = document.getElementById('voice-call-screen');
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (screen.classList.contains('hidden') || (outgoingActions && outgoingActions.classList.contains('hidden'))) {
        return;
    }

    if (shouldAccept) {
        openVoiceCallScreen();
    } else {
        const statusEl = document.getElementById('voice-call-status');
        if (statusEl) statusEl.textContent = '对方已拒绝';
        
        setTimeout(() => {
            closeVoiceCallScreen('ai_reject');
        }, 1500);
    }
}

function openVoiceCallScreen() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    if (!window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId]) {
        window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] = [];
    }
    voiceCallStartIndex = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId].length;
    currentVoiceCallStartTime = Date.now();

    const screen = document.getElementById('voice-call-screen');
    const avatar = document.getElementById('voice-call-avatar');
    const name = document.getElementById('voice-call-name');
    const bg = document.getElementById('voice-call-bg');
    const timeEl = document.getElementById('voice-call-time');
    const contentContainer = document.getElementById('voice-call-content');

    avatar.src = contact.avatar;
    name.textContent = contact.remark || contact.name;
    
    if (contact.voiceCallBg) {
        bg.style.backgroundImage = `url(${contact.voiceCallBg})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    voiceCallSeconds = 0;
    timeEl.textContent = '00:00';
    contentContainer.innerHTML = '';
    document.getElementById('voice-call-status').textContent = '正在通话中...';
    
    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.remove('hidden');
    
    document.getElementById('voice-call-content').classList.remove('hidden');
    document.querySelector('.voice-call-input-area').classList.remove('hidden');
    
    document.getElementById('voice-call-actions-active').classList.remove('hidden');
    document.getElementById('voice-call-actions-incoming').classList.add('hidden');
    
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (outgoingActions) outgoingActions.classList.add('hidden');

    screen.classList.remove('hidden');

    if (!globalVoicePlayer) {
        globalVoicePlayer = new Audio();
    }
    globalVoicePlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAgAAAAEA';
    globalVoicePlayer.play().catch(e => console.log('Audio unlock failed (harmless if not on mobile):', e));

    if (voiceCallTimer) clearInterval(voiceCallTimer);
    
    const updateTime = () => {
        const mins = Math.floor(voiceCallSeconds / 60).toString().padStart(2, '0');
        const secs = (voiceCallSeconds % 60).toString().padStart(2, '0');
        const timeStr = `${mins}:${secs}`;
        
        if (timeEl) timeEl.textContent = timeStr;
        
        const floatTimeEl = document.getElementById('float-call-time');
        if (floatTimeEl) floatTimeEl.textContent = timeStr;
    };
    
    updateTime();

    voiceCallTimer = setInterval(() => {
        voiceCallSeconds++;
        updateTime();
    }, 1000);

    // 初始化通话页面按钮
    initVoiceCallButtons();
}

// 初始化通话页面按钮事件
function initVoiceCallButtons() {
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const bg = document.getElementById('voice-call-bg');
    const bgInput = document.getElementById('voice-call-bg-input');
    const newBg = bg.cloneNode(true);
    bg.parentNode.replaceChild(newBg, bg);
    newBg.onclick = () => bgInput.click();
    
    const newBgInput = bgInput.cloneNode(true);
    bgInput.parentNode.replaceChild(newBgInput, bgInput);
    newBgInput.onchange = (e) => handleVoiceCallBgUpload(e, contact);

    const hangupBtn = document.getElementById('voice-call-hangup-btn');
    const minimizeBtn = document.getElementById('voice-call-minimize-btn');
    const addBtn = document.getElementById('voice-call-add-btn');

    const newHangupBtn = hangupBtn.cloneNode(true);
    hangupBtn.parentNode.replaceChild(newHangupBtn, hangupBtn);
    newHangupBtn.onclick = () => closeVoiceCallScreen('user');

    const newMinimizeBtn = minimizeBtn.cloneNode(true);
    minimizeBtn.parentNode.replaceChild(newMinimizeBtn, minimizeBtn);
    newMinimizeBtn.onclick = minimizeVoiceCallScreen;

    const newAddBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newAddBtn, addBtn);
    newAddBtn.onclick = () => alert('添加成员功能开发中...');
    
    const floatWindow = document.getElementById('voice-call-float');
    if (floatWindow) {
        makeVoiceCallDraggable(floatWindow, restoreVoiceCallScreen);
    }

    const micBtn = document.getElementById('voice-call-mic-btn');
    const newMicBtn = micBtn.cloneNode(true);
    micBtn.parentNode.replaceChild(newMicBtn, micBtn);
    
    // 默认关闭麦克风
    newMicBtn.classList.remove('active');
    newMicBtn.nextElementSibling.textContent = '麦克风已关';
    stopVoiceCallVAD();

    newMicBtn.onclick = () => {
        newMicBtn.classList.toggle('active');
        const span = newMicBtn.nextElementSibling;
        const isActive = newMicBtn.classList.contains('active');
        span.textContent = isActive ? '麦克风已开' : '麦克风已关';

        if (isActive) {
            startVoiceCallVAD();
        } else {
            stopVoiceCallVAD();
        }
    };

    const speakerBtn = document.getElementById('voice-call-speaker-btn');
    const newSpeakerBtn = speakerBtn.cloneNode(true);
    speakerBtn.parentNode.replaceChild(newSpeakerBtn, speakerBtn);
    newSpeakerBtn.onclick = () => {
        newSpeakerBtn.classList.toggle('active');
        const span = newSpeakerBtn.nextElementSibling;
        span.textContent = newSpeakerBtn.classList.contains('active') ? '扬声器已开' : '扬声器已关';
    };

    const sendBtn = document.getElementById('voice-call-send-btn');
    const input = document.getElementById('voice-call-input');
    
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    
    const handleSend = () => {
        const text = input.value.trim();
        const micEnabled = isVoiceCallMicEnabled();

        if (text) {
            input.value = '';
            const sentMsg = sendMessage(text, true, 'voice_call_text');
            addVoiceCallMessage(text, 'user', sentMsg && sentMsg.id ? sentMsg.id : null);
            if (!micEnabled) {
                return;
            }
            isProcessingResponse = true;
            generateVoiceCallAiReply();
            return;
        }

        if (!micEnabled) {
            if (isProcessingResponse || isAiSpeaking) return;
            isProcessingResponse = true;
            generateVoiceCallAiReply();
        }
    };

    newSendBtn.onclick = handleSend;
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const text = input.value.trim();
            if (!text) return;
            if (!isVoiceCallMicEnabled()) {
                const sentMsg = sendMessage(text, true, 'voice_call_text');
                addVoiceCallMessage(text, 'user', sentMsg && sentMsg.id ? sentMsg.id : null);
                input.value = '';
                return;
            }
            handleSend();
        }
    };

    const regenerateBtn = document.getElementById('voice-call-regenerate-btn');
    if (regenerateBtn) {
        const newRegenerateBtn = regenerateBtn.cloneNode(true);
        regenerateBtn.parentNode.replaceChild(newRegenerateBtn, regenerateBtn);
        newRegenerateBtn.onclick = handleVoiceCallRegenerateReply;
    }
}

function closeVoiceCallScreen(hangupType = 'user') {
    const screen = document.getElementById('voice-call-screen');
    const floatWindow = document.getElementById('voice-call-float');
    
    screen.classList.add('hidden');
    if (floatWindow) floatWindow.classList.add('hidden');
    
    if (voiceCallTimer) clearInterval(voiceCallTimer);
    voiceCallTimer = null;

    isProcessingResponse = false; // 重置状态
    stopVoiceCallVAD();

    const actionsIncoming = document.getElementById('voice-call-actions-incoming');
    if (actionsIncoming && !actionsIncoming.classList.contains('hidden')) {
        sendMessage('通话已被拒绝', false, 'call_rejected');
        setTimeout(() => {
            generateAiReply();
        }, 1000);
        return;
    }

    const actionsOutgoing = document.getElementById('voice-call-actions-outgoing');
    if (actionsOutgoing && !actionsOutgoing.classList.contains('hidden')) {
        if (hangupType === 'user_cancel') {
            sendMessage('已取消通话', true, 'text');
        } else if (hangupType === 'ai_reject') {
            sendMessage('对方拒绝了通话', false, 'text');
        }
        return;
    }

    const duration = Math.ceil((Date.now() - currentVoiceCallStartTime) / 1000);
    const mins = Math.floor(duration / 60).toString().padStart(2, '0');
    const secs = (duration % 60).toString().padStart(2, '0');
    const timeStr = `${mins}:${secs}`;

    const isUserHangup = hangupType === 'user';
    sendMessage(`通话时长：${timeStr}`, isUserHangup, 'text');

    summarizeVoiceCall(window.iphoneSimState.currentChatContactId, voiceCallStartIndex);
}

function startIncomingCall(contact) {
    if (!contact) return;
    
    window.iphoneSimState.currentChatContactId = contact.id;

    const screen = document.getElementById('voice-call-screen');
    const avatar = document.getElementById('voice-call-avatar');
    const name = document.getElementById('voice-call-name');
    const bg = document.getElementById('voice-call-bg');
    const statusEl = document.getElementById('voice-call-status');
    
    avatar.src = contact.avatar;
    name.textContent = contact.remark || contact.name;
    statusEl.textContent = '邀请你进行语音通话...';
    
    if (contact.voiceCallBg) {
        bg.style.backgroundImage = `url(${contact.voiceCallBg})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.add('hidden');
    
    document.getElementById('voice-call-content').classList.add('hidden');
    document.querySelector('.voice-call-input-area').classList.add('hidden');
    
    document.getElementById('voice-call-actions-active').classList.add('hidden');
    document.getElementById('voice-call-actions-incoming').classList.remove('hidden');
    
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (outgoingActions) outgoingActions.classList.add('hidden');

    // 重新绑定按钮事件为语音通话
    const acceptBtn = document.getElementById('voice-call-accept-btn');
    const rejectBtn = document.getElementById('voice-call-reject-btn');
    
    // 克隆以移除旧的事件监听器
    const newAcceptBtn = acceptBtn.cloneNode(true);
    acceptBtn.parentNode.replaceChild(newAcceptBtn, acceptBtn);
    newAcceptBtn.onclick = acceptIncomingCall;

    const newRejectBtn = rejectBtn.cloneNode(true);
    rejectBtn.parentNode.replaceChild(newRejectBtn, rejectBtn);
    newRejectBtn.onclick = rejectIncomingCall;
    
    screen.classList.remove('hidden');
}

function startIncomingVideoCall(contact) {
    if (!contact) return;
    
    window.iphoneSimState.currentChatContactId = contact.id;

    const screen = document.getElementById('voice-call-screen');
    const avatar = document.getElementById('voice-call-avatar');
    const name = document.getElementById('voice-call-name');
    const bg = document.getElementById('voice-call-bg');
    const statusEl = document.getElementById('voice-call-status');
    
    avatar.src = contact.avatar;
    name.textContent = contact.remark || contact.name;
    statusEl.textContent = '邀请你进行视频通话...';
    
    // 优先使用视频通话背景
    if (contact.videoCallBgImage) {
        bg.style.backgroundImage = `url(${contact.videoCallBgImage})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.add('hidden');
    
    document.getElementById('voice-call-content').classList.add('hidden');
    document.querySelector('.voice-call-input-area').classList.add('hidden');
    
    document.getElementById('voice-call-actions-active').classList.add('hidden');
    document.getElementById('voice-call-actions-incoming').classList.remove('hidden');
    
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (outgoingActions) outgoingActions.classList.add('hidden');

    // 重新绑定按钮事件为视频通话
    const acceptBtn = document.getElementById('voice-call-accept-btn');
    const rejectBtn = document.getElementById('voice-call-reject-btn');
    
    const newAcceptBtn = acceptBtn.cloneNode(true);
    acceptBtn.parentNode.replaceChild(newAcceptBtn, acceptBtn);
    newAcceptBtn.onclick = acceptIncomingVideoCall;

    const newRejectBtn = rejectBtn.cloneNode(true);
    rejectBtn.parentNode.replaceChild(newRejectBtn, rejectBtn);
    newRejectBtn.onclick = rejectIncomingVideoCall;
    
    screen.classList.remove('hidden');
}

window.acceptIncomingVideoCall = function() {
    // 关闭呼叫界面
    document.getElementById('voice-call-screen').classList.add('hidden');
    // 开启视频通话界面
    startVideoCall();
};

window.rejectIncomingVideoCall = function() {
    document.getElementById('voice-call-screen').classList.add('hidden');
    sendMessage('已拒绝视频通话', true, 'text');
};

window.acceptIncomingCall = function() {
    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.remove('hidden');

    document.getElementById('voice-call-content').classList.remove('hidden');
    document.querySelector('.voice-call-input-area').classList.remove('hidden');
    
    document.getElementById('voice-call-actions-active').classList.remove('hidden');
    document.getElementById('voice-call-actions-incoming').classList.add('hidden');
    
    document.getElementById('voice-call-status').textContent = '正在通话中...';
    
    // 解锁音频上下文（移动端需要用户交互才能播放音频）
    if (!globalVoicePlayer) {
        globalVoicePlayer = new Audio();
    }
    // 播放一段极短的静音音频来解锁音频上下文
    globalVoicePlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAgAAAAEA';
    globalVoicePlayer.play().then(() => {
        console.log('Audio context unlocked successfully on accept call');
    }).catch(e => {
        console.log('Audio unlock attempt (may fail on some browsers):', e);
    });
    
    if (!window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId]) {
        window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] = [];
    }
    voiceCallStartIndex = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId].length;
    currentVoiceCallStartTime = Date.now();
    
    voiceCallSeconds = 0;
    document.getElementById('voice-call-time').textContent = '00:00';
    
    if (voiceCallTimer) clearInterval(voiceCallTimer);
    voiceCallTimer = setInterval(() => {
        voiceCallSeconds++;
        const mins = Math.floor(voiceCallSeconds / 60).toString().padStart(2, '0');
        const secs = (voiceCallSeconds % 60).toString().padStart(2, '0');
        const timeStr = `${mins}:${secs}`;
        document.getElementById('voice-call-time').textContent = timeStr;
        const floatTimeEl = document.getElementById('float-call-time');
        if (floatTimeEl) floatTimeEl.textContent = timeStr;
    }, 1000);
    
    // 初始化通话页面按钮
    initVoiceCallButtons();
    
    const micBtn = document.getElementById('voice-call-mic-btn');
    if (micBtn && micBtn.classList.contains('active')) {
        startVoiceCallVAD();
    }
};

window.rejectIncomingCall = function() {
    closeVoiceCallScreen('user');
};

async function summarizeVoiceCall(contactId, startIndex) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;

    const settings = window.iphoneSimState.aiSettings2.url ? window.iphoneSimState.aiSettings2 : window.iphoneSimState.aiSettings;
    if (!settings.url || !settings.key) return;

    const history = window.iphoneSimState.chatHistory[contactId] || [];
    const callMessages = history.slice(startIndex);

    let userName = '用户';
    if (contact.userPersonaId) {
        const p = Array.isArray(window.iphoneSimState.userPersonas)
            ? window.iphoneSimState.userPersonas.find(item => item.id === contact.userPersonaId)
            : null;
        if (p && p.name) userName = p.name;
    } else if (window.iphoneSimState.userProfile && window.iphoneSimState.userProfile.name) {
        userName = window.iphoneSimState.userProfile.name;
    }

    const actorNames = typeof resolveSummaryActorNames === 'function'
        ? resolveSummaryActorNames(contact, userName)
        : { userLabel: userName || '用户', contactLabel: contact.name || '联系人' };
    userName = actorNames.userLabel;
    const contactLabel = actorNames.contactLabel;

    const callTextMessages = callMessages
        .filter(m => m && m.type === 'voice_call_text')
        .map(m => {
            let text = String(m.content || '');
            try {
                const data = JSON.parse(text);
                if (typeof data.text === 'string') text = data.text;
            } catch (e) {}
            return {
                role: m.role,
                time: m.time,
                content: String(text || '').trim()
            };
        })
        .filter(m => m.content);

    const callContent = callTextMessages
        .map(m => `${m.role === 'user' ? userName : contactLabel}: ${m.content}`)
        .join('\n');

    if (!callContent) return;

    const totalMessageCount = callMessages.length;
    const lengthRange = typeof getSummaryLengthRangeByCount === 'function'
        ? getSummaryLengthRangeByCount(totalMessageCount, 'call')
        : { count: Math.max(1, totalMessageCount), target: 120, min: 90, max: 260 };
    console.log('[summary-length-call]', {
        count: lengthRange.count,
        target: lengthRange.target,
        min: lengthRange.min,
        max: lengthRange.max,
        source: 'call_summary'
    });

    showNotification('正在总结通话...');

    let summary = '';
    let structuredPayload = null;
    try {
        if (typeof window.generateChannelNaturalSummary !== 'function') {
            throw new Error('summary helper unavailable');
        }
        const generated = await window.generateChannelNaturalSummary(contact, callTextMessages, {
            channel: 'call',
            source: 'call_summary',
            rangeLabel: '语音通话',
            detailModeHint: '当前是通话总结，重点写通话中的确认点、未决点与下一次确认时点。',
            summaryPromptMode: 'manual',
            rangeLabel: '语音通话',
            detailModeHint: '',
            totalMessageCount,
            sourceMessageCount: totalMessageCount,
            rangeOverride: Object.assign({}, lengthRange, { maxTokens: 900 }),
            settings
        });
        summary = String(generated && generated.summary || '').trim();
        if (!summary) throw new Error('empty summary');
    } catch (error) {
        console.error('通话总结失败:', error);
        const rawRecord = callTextMessages
            .slice(0, 14)
            .map(msg => `${msg.role === 'user' ? userName : contactLabel}: ${msg.content}`)
            .join('；');
        summary = rawRecord ? `【通话原始记录】${rawRecord}` : '';
        if (!summary) {
            showNotification('总结出错', 2000, 'error');
            return;
        }
        showNotification('AI总结失败，已使用原始记录兜底', 2000, 'warning');
    }

    if (summary && summary !== '无' && summary !== '无。') {
        const summaryTitle = typeof buildMemoryDisplayTitle === 'function'
            ? buildMemoryDisplayTitle({
                title: '',
                content: summary,
                structuredSummary: structuredPayload,
                memoryTags: ['short_term']
            })
            : '';
        const memoryContent = `【通话回忆】${summary}`;
        if (typeof window.createMemoryCandidate === 'function') {
            const created = window.createMemoryCandidate(contact.id, {
                title: summaryTitle,
                content: memoryContent,
                suggestedTags: ['short_term'],
                source: 'call_summary',
                confidence: 0.8,
                range: '语音通话',
                reason: '语音通话总结'
            });
            saveConfig();
            if (created && created.status === 'pending') {
                showNotification('通话总结已加入待确认', 2000, 'success');
            } else if (created) {
                showNotification('通话总结完成', 2000, 'success');
            } else {
                showNotification('手动模式：未自动写入记忆', 2200);
            }
        } else {
            window.iphoneSimState.memories.push({
                id: Date.now(),
                contactId: contact.id,
                content: memoryContent,
                time: Date.now(),
                range: '语音通话'
            });
            saveConfig();
            showNotification('通话总结完成', 2000, 'success');
        }
        console.log('通话总结完成:', summary);
    }

    return;

    if (false) {
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const systemPrompt = typeof buildStructuredSummaryPrompt === 'function'
        ? buildStructuredSummaryPrompt({
            channel: 'call',
            userLabel: userName,
            contactLabel,
            range: lengthRange,
            dateStr,
            timeStr,
            totalMessageCount,
            detailModeHint: '当前是通话总结，请输出时间线提要：优先具体事件链、当前状态与下一步，并尽量摘录原话短句。'
        })
        : `你是一个通话记录总结助手。请返回严格JSON，包含 context/timeline_events/current_state/next_actions/time_points/quote_snippets。`;

    try {
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.key}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: callContent }
                ],
                temperature: 0.35,
                max_tokens: 520
            })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        let rawSummary = typeof extractChatResponseText === 'function'
            ? extractChatResponseText(data)
            : '';
        if (!rawSummary && data && Array.isArray(data.choices) && data.choices[0] && data.choices[0].message) {
            rawSummary = String(data.choices[0].message.content || '').trim();
        }
        if (!rawSummary) {
            const apiErrorMsg = typeof extractApiErrorMessage === 'function'
                ? extractApiErrorMessage(data)
                : '';
            if (apiErrorMsg) throw new Error(`通话总结接口异常: ${apiErrorMsg}`);
            throw new Error('通话总结接口返回为空或格式不兼容');
        }

        let structuredPayload = null;
        let summary = rawSummary;
        if (typeof buildNarrativeSummaryFromStructuredResponse === 'function') {
            const structured = buildNarrativeSummaryFromStructuredResponse(
                rawSummary,
                contact,
                callTextMessages,
                lengthRange,
                userName,
                {
                    channel: 'call',
                    rangeLabel: '语音通话',
                    totalMessageCount,
                    dateStr,
                    timeStr,
                    detailModeHint: '当前是通话总结，请输出时间线提要：优先具体事件链、当前状态与下一步，并尽量摘录原话短句。'
                }
            );
            structuredPayload = structured.payload;
            summary = structured.paragraph || rawSummary;
        }

        if (typeof ensureDetailedSummaryText === 'function') {
            summary = ensureDetailedSummaryText(summary, contact, callTextMessages, lengthRange, userName, {
                channel: 'call',
                rangeLabel: '语音通话',
                totalMessageCount,
                structuredPayload
            });
        }
        summary = String(summary || '').trim();
        
        if (summary && summary !== '无' && summary !== '无。') {
            const summaryTitle = typeof buildMemoryDisplayTitle === 'function'
                ? buildMemoryDisplayTitle({
                    title: '',
                    content: summary,
                    structuredSummary: structuredPayload,
                    memoryTags: ['short_term']
                })
                : '';
            const memoryContent = `【通话回忆】 ${summary}`;
            if (typeof window.createMemoryCandidate === 'function') {
                const created = window.createMemoryCandidate(contact.id, {
                    title: summaryTitle,
                    content: memoryContent,
                    suggestedTags: ['short_term'],
                    source: 'call_summary',
                    confidence: 0.8,
                    range: '语音通话',
                    reason: '语音通话总结'
                });
                saveConfig();
                if (created && created.status === 'pending') {
                    showNotification('通话总结已加入待确认', 2000, 'success');
                } else if (created) {
                    showNotification('通话总结完成', 2000, 'success');
                } else {
                    showNotification('手动模式：未自动写入记忆', 2200);
                }
            } else {
                window.iphoneSimState.memories.push({
                    id: Date.now(),
                    contactId: contact.id,
                    content: memoryContent,
                    time: Date.now(),
                    range: '语音通话'
                });
                saveConfig();
                showNotification('通话总结完成', 2000, 'success');
            }
            console.log('通话总结完成:', summary);
        }

    } catch (error) {
        console.error('通话总结失败:', error);
        showNotification('总结出错', 2000, 'error');
    }
    }
}

function minimizeVoiceCallScreen() {
    const screen = document.getElementById('voice-call-screen');
    const floatWindow = document.getElementById('voice-call-float');
    
    screen.classList.add('hidden');
    if (floatWindow) floatWindow.classList.remove('hidden');
}

function restoreVoiceCallScreen() {
    const screen = document.getElementById('voice-call-screen');
    const floatWindow = document.getElementById('voice-call-float');
    
    screen.classList.remove('hidden');
    if (floatWindow) floatWindow.classList.add('hidden');
}

function makeVoiceCallDraggable(element, onClickCallback) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false;
    
    element.addEventListener('mousedown', dragMouseDown);
    element.addEventListener('touchstart', dragMouseDown, { passive: false });
    
    element.onclick = null;

    function dragMouseDown(e) {
        e = e || window.event;
        isDragging = false;

        if (e.type === 'touchstart') {
            pos3 = e.touches[0].clientX;
            pos4 = e.touches[0].clientY;
            
            document.addEventListener('touchend', closeDragElement, { passive: false });
            document.addEventListener('touchmove', elementDrag, { passive: false });
        } else {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
    }

    function elementDrag(e) {
        e = e || window.event;
        
        if (e.cancelable) {
            e.preventDefault();
        }
        
        isDragging = true;
        
        let clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;
        
        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;
        
        const maxX = window.innerWidth - element.offsetWidth;
        const maxY = window.innerHeight - element.offsetHeight;
        
        if (newTop < 0) newTop = 0;
        if (newTop > maxY) newTop = maxY;
        if (newLeft < 0) newLeft = 0;
        if (newLeft > maxX) newLeft = maxX;

        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";
        element.style.right = "auto";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        
        document.removeEventListener('touchend', closeDragElement);
        document.removeEventListener('touchmove', elementDrag);
        
        if (!isDragging && onClickCallback) {
            onClickCallback();
        }
    }
}

function handleVoiceCallBgUpload(e, contact) {
    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 800, 0.7).then(base64 => {
        contact.voiceCallBg = base64;
        document.getElementById('voice-call-bg').style.backgroundImage = `url(${base64})`;
        saveConfig();
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
    e.target.value = '';
}

function handleVideoCallBgUpload(e) {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 800, 0.7).then(base64 => {
        contact.videoCallBgImage = base64;
        saveConfig();
        alert('视频通话背景已更新');
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
    e.target.value = '';
}

function handleVideoSnapshot() {
    const videoEl = document.getElementById('video-local-stream');
    if (!videoCallLocalStream || !videoEl || videoEl.paused || videoEl.ended) {
        alert('请先开启摄像头');
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // 绘制视频帧
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    
    // 暂存截图，不发送也不显示
    pendingVideoSnapshot = base64;
    
    // 提示用户
    if (window.showChatToast) {
        window.showChatToast('画面已截取，将随下条消息发送');
    } else {
        // Fallback toast implementation
        const toast = document.createElement('div');
        toast.className = 'chat-toast';
        toast.textContent = '画面已截取，将随下条消息发送';
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.remove('hidden'), 10);
        setTimeout(() => {
            toast.classList.add('hidden');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

function startOutgoingVideoCall() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    // 尝试解锁音频上下文
    try {
        if (!globalVoicePlayer) {
            globalVoicePlayer = new Audio();
        }
        globalVoicePlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAgAAAAEA';
        globalVoicePlayer.play().catch(e => console.log('Outgoing video call audio unlock failed:', e));
    } catch(e) {
        console.error('Audio unlock error', e);
    }

    // 复用 voice-call-screen 作为呼叫界面
    const screen = document.getElementById('voice-call-screen');
    const avatar = document.getElementById('voice-call-avatar');
    const name = document.getElementById('voice-call-name');
    const bg = document.getElementById('voice-call-bg');
    const statusEl = document.getElementById('voice-call-status');
    const timeEl = document.getElementById('voice-call-time');
    
    avatar.src = contact.avatar;
    name.textContent = contact.remark || contact.name;
    statusEl.textContent = '等待对方接受视频通话...';
    timeEl.textContent = '正在呼叫'; 
    
    // 使用视频通话的背景设置，如果没有则回退到聊天背景
    if (contact.videoCallBgImage) {
        bg.style.backgroundImage = `url(${contact.videoCallBgImage})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    // 隐藏不必要的元素
    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.add('hidden');
    
    document.getElementById('voice-call-content').classList.add('hidden');
    document.querySelector('.voice-call-input-area').classList.add('hidden');
    
    document.getElementById('voice-call-actions-active').classList.add('hidden');
    document.getElementById('voice-call-actions-incoming').classList.add('hidden');
    
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (outgoingActions) outgoingActions.classList.remove('hidden');

    screen.classList.remove('hidden');

    // 绑定取消按钮
    const cancelBtn = document.getElementById('voice-call-cancel-btn');
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.onclick = () => {
            closeVoiceCallScreen('user_cancel');
        };
    }

    makeAiVideoCallDecision(contact);
}

async function makeAiVideoCallDecision(contact) {
    const waitTime = 2000 + Math.random() * 3000;
    const startTime = Date.now();

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    let shouldAccept = true;

    if (settings.url && settings.key) {
        try {
            const history = window.iphoneSimState.chatHistory[contact.id] || [];
            const recentHistory = history.slice(-10).map(m => {
                let content = m.content;
                if (m.type === 'image') content = '[图片]';
                else if (m.type === 'sticker') content = '[表情包]';
                return `${m.role === 'user' ? '用户' : '你'}: ${content}`;
            }).join('\n');
            
            const systemPrompt = `你现在扮演 ${contact.name}。
【核心指令】
你必须严格遵守以下人设（优先级最高，高于一切其他指令）：
${contact.persona || '无'}

用户正在向你发起【视频通话】请求。
请根据你们最近的聊天记录和你的当前状态，决定是否接听。
最近聊天记录：
${recentHistory}

请只回复一个单词：
- 如果接听，回复 "ACCEPT"
- 如果拒绝，回复 "REJECT"`;

            let fetchUrl = settings.url;
            if (!fetchUrl.endsWith('/chat/completions')) {
                fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
            }

            const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, "").trim() : '';
            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cleanKey}`
                },
                body: JSON.stringify({
                    model: settings.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: 'ACTION: INCOMING_VIDEO_CALL' }
                    ],
                    temperature: 0.1
                })
            });

            if (response.ok) {
                const data = await response.json();
                const reply = data.choices[0].message.content.trim().toUpperCase();
                console.log('AI Video Call Decision:', reply);
                if (reply.includes('REJECT')) {
                    shouldAccept = false;
                }
            }
        } catch (e) {
            console.error('AI Video Call Decision API Error:', e);
        }
    }

    const elapsed = Date.now() - startTime;
    if (elapsed < waitTime) {
        await new Promise(r => setTimeout(r, waitTime - elapsed));
    }

    // 检查呼叫界面是否还开着
    const screen = document.getElementById('voice-call-screen');
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    // 必须确保当前显示的是 outgoing actions，说明还在呼叫中
    if (screen.classList.contains('hidden') || (outgoingActions && outgoingActions.classList.contains('hidden'))) {
        return;
    }

    if (shouldAccept) {
        // 关闭呼叫界面（voice-call-screen）
        screen.classList.add('hidden');
        // 开启视频通话界面
        startVideoCall();
    } else {
        const statusEl = document.getElementById('voice-call-status');
        if (statusEl) statusEl.textContent = '对方已拒绝';
        
        setTimeout(() => {
            closeVoiceCallScreen('ai_reject');
        }, 1500);
    }
}

function startVideoCall() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    if (!window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId]) {
        window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] = [];
    }
    voiceCallStartIndex = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId].length;

    const screen = document.getElementById('video-call-screen');
    const bg = document.getElementById('video-call-bg');
    
    if (contact.videoCallBgImage) {
        bg.style.backgroundImage = `url(${contact.videoCallBgImage})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    // 绑定按钮事件
    const micBtn = document.getElementById('video-call-mic-btn');
    
    // 默认关闭麦克风
    micBtn.classList.remove('active');
    micBtn.nextElementSibling.textContent = '麦克风已关';
    stopVoiceCallVAD();

    micBtn.onclick = () => {
        micBtn.classList.toggle('active');
        const span = micBtn.nextElementSibling;
        const isActive = micBtn.classList.contains('active');
        span.textContent = isActive ? '麦克风已开' : '麦克风已关';

        if (isActive) {
            startVoiceCallVAD();
        } else {
            stopVoiceCallVAD();
        }
    };

    const cameraBtn = document.getElementById('video-call-camera-btn');
    cameraBtn.onclick = toggleVideoCamera;
    // 重置摄像头按钮状态
    cameraBtn.classList.remove('active');
    cameraBtn.nextElementSibling.textContent = '摄像头已关';
    document.getElementById('video-local-preview').classList.add('hidden');

    const hangupBtn = document.getElementById('video-call-hangup-btn');
    hangupBtn.onclick = closeVideoCallScreen;

    const speakerBtn = document.getElementById('video-call-speaker-btn');
    speakerBtn.onclick = () => {
        speakerBtn.classList.toggle('active');
        const span = speakerBtn.nextElementSibling;
        span.textContent = speakerBtn.classList.contains('active') ? '扬声器已开' : '扬声器已关';
    };

    // 最小化按钮
    const minimizeBtn = document.getElementById('video-call-minimize-btn');
    if (minimizeBtn) {
        minimizeBtn.onclick = minimizeVideoCallScreen;
    }

    // 截图按钮
    const snapshotBtn = document.getElementById('video-call-snapshot-btn');
    if (snapshotBtn) {
        const newSnapshotBtn = snapshotBtn.cloneNode(true);
        snapshotBtn.parentNode.replaceChild(newSnapshotBtn, snapshotBtn);
        newSnapshotBtn.onclick = handleVideoSnapshot;
    }

    // 自动截图设置按钮 (右上角加号)
    const addBtn = document.getElementById('video-call-add-btn');
    if (addBtn) {
        const newAddBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newAddBtn, addBtn);
        newAddBtn.onclick = () => {
            const interval = contact.autoSnapshotInterval || 0;
            document.getElementById('auto-snapshot-interval').value = interval === 0 ? '' : interval;
            document.getElementById('auto-snapshot-modal').classList.remove('hidden');
        };
    }

    // 发送消息
    const sendBtn = document.getElementById('video-call-send-btn');
    const input = document.getElementById('video-call-input');
    
    const handleSend = () => {
        const text = input.value.trim();
        const micEnabled = isVoiceCallMicEnabled();

        if (text) {
            input.value = '';
            const sentMsg = sendMessage(text, true, 'voice_call_text');
            addVoiceCallMessage(text, 'user', sentMsg && sentMsg.id ? sentMsg.id : null); // 复用 addVoiceCallMessage，它会自动判断容器
            if (!micEnabled) {
                return;
            }
            isProcessingResponse = true;
            generateVoiceCallAiReply();
            return;
        }

        if (!micEnabled) {
            if (isProcessingResponse || isAiSpeaking) return;
            isProcessingResponse = true;
            generateVoiceCallAiReply();
        }
    };

    if (sendBtn) {
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        newSendBtn.onclick = handleSend;
    }
    
    if (input) {
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const text = input.value.trim();
                if (!text) return;
                if (!isVoiceCallMicEnabled()) {
                    const sentMsg = sendMessage(text, true, 'voice_call_text');
                    addVoiceCallMessage(text, 'user', sentMsg && sentMsg.id ? sentMsg.id : null);
                    input.value = '';
                    return;
                }
                handleSend();
            }
        };
    }

    const regenerateBtn = document.getElementById('video-call-regenerate-btn');
    if (regenerateBtn) {
        const newRegenerateBtn = regenerateBtn.cloneNode(true);
        regenerateBtn.parentNode.replaceChild(newRegenerateBtn, regenerateBtn);
        newRegenerateBtn.onclick = handleVoiceCallRegenerateReply;
    }

    // 清空内容区域
    const contentContainer = document.getElementById('video-call-content');
    if (contentContainer) contentContainer.innerHTML = '';

    screen.classList.remove('hidden');
    currentVideoCallStartTime = Date.now();

    // 尝试解锁音频上下文
    try {
        if (!globalVoicePlayer) {
            globalVoicePlayer = new Audio();
        }
        // 播放极短的静音
        globalVoicePlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAgAAAAEA';
        globalVoicePlayer.play().then(() => {
            console.log('Video call audio context unlocked');
        }).catch(e => {
            console.log('Video call audio unlock failed (user interaction needed):', e);
        });
    } catch(e) {
        console.error('Video call audio setup error', e);
    }

    // 计时器
    if (videoCallTimer) clearInterval(videoCallTimer);
    videoCallSeconds = 0;
    const timeEl = document.getElementById('video-call-time');
    if (timeEl) timeEl.textContent = '00:00';

    videoCallTimer = setInterval(() => {
        videoCallSeconds++;
        const mins = Math.floor(videoCallSeconds / 60).toString().padStart(2, '0');
        const secs = (videoCallSeconds % 60).toString().padStart(2, '0');
        const timeStr = `${mins}:${secs}`;
        if (timeEl) timeEl.textContent = timeStr;
    }, 1000);

    // 启动自动截图
    startAutoSnapshot(contact);
}

function minimizeVideoCallScreen() {
    const screen = document.getElementById('video-call-screen');
    const floatWindow = document.getElementById('voice-call-float');
    
    screen.classList.add('hidden');
    if (floatWindow) {
        floatWindow.classList.remove('hidden');
        makeVoiceCallDraggable(floatWindow, restoreVideoCallScreen);
    }
}

function restoreVideoCallScreen() {
    const screen = document.getElementById('video-call-screen');
    const floatWindow = document.getElementById('voice-call-float');
    
    screen.classList.remove('hidden');
    if (floatWindow) floatWindow.classList.add('hidden');
}

async function toggleVideoCamera() {
    const cameraBtn = document.getElementById('video-call-camera-btn');
    const preview = document.getElementById('video-local-preview');
    const videoEl = document.getElementById('video-local-stream');
    const span = cameraBtn.nextElementSibling;

    if (videoCallLocalStream) {
        // 关闭摄像头
        videoCallLocalStream.getTracks().forEach(track => track.stop());
        videoCallLocalStream = null;
        videoEl.srcObject = null;
        preview.classList.add('hidden');
        cameraBtn.classList.remove('active');
        span.textContent = '摄像头已关';
    } else {
        // 开启摄像头
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            videoCallLocalStream = stream;
            videoEl.srcObject = stream;
            preview.classList.remove('hidden');
            cameraBtn.classList.add('active');
            span.textContent = '摄像头已开';
        } catch (err) {
            console.error('无法访问摄像头:', err);
            alert('无法访问摄像头，请检查权限');
        }
    }
}

function closeVideoCallScreen() {
    const screen = document.getElementById('video-call-screen');
    const floatWindow = document.getElementById('voice-call-float');

    screen.classList.add('hidden');
    if (floatWindow) floatWindow.classList.add('hidden');

    if (videoCallTimer) {
        clearInterval(videoCallTimer);
        videoCallTimer = null;
    }

    if (autoSnapshotTimer) {
        clearInterval(autoSnapshotTimer);
        autoSnapshotTimer = null;
    }

    if (videoCallLocalStream) {
        videoCallLocalStream.getTracks().forEach(track => track.stop());
        videoCallLocalStream = null;
        document.getElementById('video-local-stream').srcObject = null;
    }

    isProcessingResponse = false; // 重置状态
    stopVoiceCallVAD(); // 确保关闭麦克风和VAD

    const duration = Math.ceil((Date.now() - currentVideoCallStartTime) / 1000);
    const mins = Math.floor(duration / 60).toString().padStart(2, '0');
    const secs = (duration % 60).toString().padStart(2, '0');
    const timeStr = `${mins}:${secs}`;

    sendMessage(`视频通话时长：${timeStr}`, true, 'text');

    summarizeVoiceCall(window.iphoneSimState.currentChatContactId, voiceCallStartIndex);
}

function startAutoSnapshot(contact) {
    if (autoSnapshotTimer) {
        clearInterval(autoSnapshotTimer);
        autoSnapshotTimer = null;
    }

    const interval = contact.autoSnapshotInterval || 0;
    if (interval < 5) return; // 最小间隔5秒

    console.log(`启动自动截图，间隔 ${interval} 秒`);

    autoSnapshotTimer = setInterval(() => {
        const videoEl = document.getElementById('video-local-stream');
        if (!videoCallLocalStream || !videoEl || videoEl.paused || videoEl.ended) {
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.6); // 稍微降低质量以加快传输

        // 暂存截图，不立即发送
        pendingVideoSnapshot = base64;
        console.log('自动截图已暂存，等待用户发送消息');

    }, interval * 1000);
}

function handleSaveAutoSnapshotSettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const intervalInput = document.getElementById('auto-snapshot-interval');
    let interval = parseInt(intervalInput.value);
    
    if (isNaN(interval) || interval < 0) interval = 0;
    if (interval > 0 && interval < 5) {
        alert('间隔不能小于5秒');
        return;
    }

    contact.autoSnapshotInterval = interval;
    saveConfig();
    
    document.getElementById('auto-snapshot-modal').classList.add('hidden');
    
    // 如果当前正在视频通话，立即应用新设置
    const videoScreen = document.getElementById('video-call-screen');
    if (videoScreen && !videoScreen.classList.contains('hidden')) {
        startAutoSnapshot(contact);
    }
    
    if (window.showChatToast) {
        window.showChatToast(interval > 0 ? `已开启自动截图 (每${interval}秒)` : '已关闭自动截图');
    }
}

function addVoiceCallMessage(text, role, messageId = null, options = {}) {
    const safeText = String(text || '');
    const translationMeta = role === 'ai'
        ? normalizeVoiceCallBilingualTranslationMeta(options && options.bilingualTranslation)
        : null;

    const appendMessageNode = (container, isVideoCall = false) => {
        if (!container) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `voice-call-msg ${role}`;

        if (role === 'description') {
            msgDiv.textContent = safeText;
        } else if (isVideoCall && safeText.trim().startsWith('<img')) {
            msgDiv.innerHTML = safeText;
        } else {
            msgDiv.textContent = safeText;
        }

        const canToggleTranslation = role === 'ai'
            && !!translationMeta
            && role !== 'description'
            && !safeText.trim().startsWith('<img');

        if (canToggleTranslation) {
            const translatedDiv = document.createElement('div');
            translatedDiv.className = 'voice-call-translated-msg hidden';
            translatedDiv.textContent = translationMeta.translatedText;
            msgDiv.appendChild(translatedDiv);
            msgDiv.classList.add('voice-call-msg-with-translation');

            msgDiv.addEventListener('click', (event) => {
                if (event && event.defaultPrevented) return;
                if (msgDiv.dataset.preventTranslateToggle === '1') {
                    msgDiv.dataset.preventTranslateToggle = '';
                    return;
                }
                translatedDiv.classList.toggle('hidden');
                msgDiv.classList.toggle('translation-open', !translatedDiv.classList.contains('hidden'));
            });
        }

        if (messageId) {
            msgDiv.dataset.msgId = String(messageId);
            bindVoiceCallMessageLongPress(msgDiv, messageId);
        }

        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    };

    const voiceContainer = document.getElementById('voice-call-content');
    if (voiceContainer && !document.getElementById('voice-call-screen').classList.contains('hidden')) {
        appendMessageNode(voiceContainer, false);
    }

    const videoContainer = document.getElementById('video-call-content');
    if (videoContainer && !document.getElementById('video-call-screen').classList.contains('hidden')) {
        appendMessageNode(videoContainer, true);
    }
}

function playVoiceCallAudio(audioData) {
    if (!audioData) {
        console.error('playVoiceCallAudio: No audio data provided');
        return;
    }
    
    // 验证音频数据格式
    if (!audioData.startsWith('data:audio/')) {
        console.error('playVoiceCallAudio: Invalid audio data format:', audioData.substring(0, 50));
        return;
    }
    
    console.log('playVoiceCallAudio: Starting playback, audio data length:', audioData.length);
    
    if (!globalVoicePlayer) {
        globalVoicePlayer = new Audio();
        console.log('playVoiceCallAudio: Created new Audio instance');
    }
    
    isAiSpeaking = true;
    console.log('AI started speaking, VAD paused');

    let statusEl = document.getElementById('voice-call-status');
    const videoScreen = document.getElementById('video-call-screen');
    if (videoScreen && !videoScreen.classList.contains('hidden')) {
        statusEl = document.getElementById('video-call-status');
    }

    if (statusEl) statusEl.textContent = '对方正在说话...';

    // 停止之前的播放
    try {
        globalVoicePlayer.pause();
        globalVoicePlayer.currentTime = 0;
    } catch (e) {
        console.log('playVoiceCallAudio: Error stopping previous audio:', e);
    }

    // 设置音频源
    globalVoicePlayer.src = audioData;
    
    // 监听加载完成事件
    globalVoicePlayer.onloadeddata = () => {
        console.log('playVoiceCallAudio: Audio loaded, duration:', globalVoicePlayer.duration);
    };
    
    globalVoicePlayer.onended = () => {
        isAiSpeaking = false;
        isProcessingResponse = false;
        console.log('AI stopped speaking, VAD resumed');
        if (statusEl) statusEl.textContent = '正在聆听...';
    };
    
    globalVoicePlayer.onerror = (e) => {
        console.error('playVoiceCallAudio: Audio error:', e, 'Error code:', globalVoicePlayer.error?.code, 'Message:', globalVoicePlayer.error?.message);
        isAiSpeaking = false;
        isProcessingResponse = false;
        if (statusEl) statusEl.textContent = '音频播放失败';
        
        // 显示友好提示
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile && window.showChatToast) {
            window.showChatToast('TTS音频播放失败，请检查音频格式设置');
        }
    };

    // 预加载音频
    globalVoicePlayer.load();
    
    // 尝试播放
    const playPromise = globalVoicePlayer.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('playVoiceCallAudio: Playback started successfully');
        }).catch(e => {
            console.error('playVoiceCallAudio: Auto play failed:', e.name, e.message);
            isAiSpeaking = false;
            isProcessingResponse = false;
            
            if (statusEl) {
                if (e.name === 'NotAllowedError') {
                    statusEl.textContent = '需要用户交互才能播放';
                } else if (e.name === 'NotSupportedError') {
                    statusEl.textContent = '音频格式不支持';
                } else {
                    statusEl.textContent = '播放失败';
                }
            }
            
            // 移动端提示
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile && window.showChatToast) {
                window.showChatToast('TTS播放失败: ' + e.message);
            }
        });
    }
}

async function generateVoiceCallAiReply() {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;
    const callBilingualConfig = getVoiceCallBilingualConfig(contact);

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    
    // 动态获取状态元素
    let statusEl = document.getElementById('voice-call-status');
    const videoScreen = document.getElementById('video-call-screen');
    if (videoScreen && !videoScreen.classList.contains('hidden')) {
        statusEl = document.getElementById('video-call-status');
    }

    if (!settings.url || !settings.key) {
        if (statusEl) statusEl.textContent = 'API未配置';
        return;
    }

    if (statusEl) statusEl.textContent = '对方正在思考...';

    const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] || [];
    
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

    let memoryContext = '';
    if (typeof window.buildMemoryContextByPolicy === 'function') {
        memoryContext = window.buildMemoryContextByPolicy(contact, history, 'voice-call');
    } else if (contact.memorySendLimit && contact.memorySendLimit > 0) {
        const contactMemories = window.iphoneSimState.memories.filter(m => m.contactId === contact.id);
        if (contactMemories.length > 0) {
            const recentMemories = contactMemories.sort((a, b) => b.time - a.time).slice(0, contact.memorySendLimit);
            recentMemories.reverse();
            memoryContext += '\n【重要记忆】\n';
            recentMemories.forEach(m => {
                memoryContext += `- ${m.content}\n`;
            });
        }
    }

    let worldbookContext = '';
    if (window.iphoneSimState.worldbook && window.iphoneSimState.worldbook.length > 0) {
        let activeEntries = window.iphoneSimState.worldbook.filter(e => e.enabled);
        if (typeof window.ensureContactCallWorldbookFields === 'function') {
            window.ensureContactCallWorldbookFields(contact);
        }
        if (Array.isArray(contact.callLinkedWbCategories)) {
            if (contact.callLinkedWbCategories.length > 0) {
                activeEntries = activeEntries.filter(e => contact.callLinkedWbCategories.includes(e.categoryId));
            } else {
                activeEntries = [];
            }
        }
        if (activeEntries.length > 0) {
            worldbookContext += '\n\n世界书信息：\n';
            activeEntries.forEach(entry => {
                let shouldAdd = false;
                if (entry.keys && entry.keys.length > 0) {
                    const historyText = history.map(h => h.content).join('\n');
                    const match = entry.keys.some(key => historyText.includes(key));
                    if (match) shouldAdd = true;
                } else {
                    shouldAdd = true;
                }
                if (shouldAdd) {
                    worldbookContext += `${entry.content}\n`;
                }
            });
        }
    }

    let limit = contact.contextLimit && contact.contextLimit > 0 ? contact.contextLimit : 20;
    let contextMessages = history.filter(h => !shouldExcludeFromAiContext(h)).slice(-limit);

    let systemPrompt = '';
    
    // 判断是否在视频通话中 (通过界面可见性判断，而不是摄像头流)
    // videoScreen 已经在函数开头声明过
    const isVideoCall = videoScreen && !videoScreen.classList.contains('hidden');

    if (isVideoCall) {
        systemPrompt = `你现在扮演 ${contact.name}，正在与用户进行【视频通话】。
【核心指令】
你必须严格遵守以下人设（优先级最高，高于一切其他指令）：
${contact.persona || '无'}

${userPromptInfo}
${memoryContext}
${worldbookContext}

【重要规则】
1. 你们正在进行视频通话。
2. 用户可能会发送图片，这些图片是用户方的实时视频画面截图，代表你通过视频通话"看到"的用户当前的画面。请将这些图片理解为你正在视频通话中看到的实时场景，而不是用户发送的静态照片。
3. 请严格遵守以下格式，同时输出一个描述部分和一个对话部分：
{{DESC}}在这里写下你的动作、表情或环境描述（必须是中文）。{{/DESC}}
{{DIALOGUE}}在这里写下你以第一人称说的话。{{/DIALOGUE}}
4. 语气要自然、流畅。
5. 如果你想挂断电话，请在回复的最后另起一行输出：ACTION: HANGUP_CALL
6. **严禁**输出 "BAKA"、"baka" 等词汇。
7. {{DESC}} 部分只能使用中文，不要混入其他语言。
8. {{DIALOGUE}} 部分必须使用 ${callBilingualConfig ? `${callBilingualConfig.sourceLabel}（${callBilingualConfig.sourceLang}）` : '当前对话语言'}。

请回复对方。`;
    } else {
        systemPrompt = `你现在扮演 ${contact.name}，正在与用户进行【语音通话】。
【核心指令】
你必须严格遵守以下人设（优先级最高，高于一切其他指令）：
${contact.persona || '无'}

${userPromptInfo}
${memoryContext}
${worldbookContext}

【重要规则】
1. 你们正在打电话，请使用自然的口语交流。
2. **绝对不要**包含任何动作描写（如 *点头*、*叹气*、*笑了* 等）。
3. **绝对不要**包含剧本格式（如 "我："、"用户："）。
4. 回复必须是**一整段**话，不要分段，不要分条。
5. 语气要自然、流畅，像真实的人在打电话。
6. 不要输出任何指令（如 ACTION: ...），除非你想挂断电话。
7. 如果你想挂断电话，请在回复的最后另起一行输出：ACTION: HANGUP_CALL
8. 仅仅输出你要说的话（和可能的挂断指令）。
9. **严禁**输出 "BAKA"、"baka" 等词汇。
10. 回复内容必须使用 ${callBilingualConfig ? `${callBilingualConfig.sourceLabel}（${callBilingualConfig.sourceLang}）` : '当前对话语言'}。

请回复对方。`;
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        ...contextMessages.map(h => {
            let content = h.content;
            try {
                const data = JSON.parse(content);
                if (data.text) content = data.text;
            } catch(e) {}

            if (h.type === 'image') content = '[图片]';
            else if (h.type === 'sticker') content = '[表情包]';
            else if (h.type === 'voice') content = '[语音]';
            
            return { role: h.role, content: content };
        })
    ];

    // 检查是否有暂存的截图，如果有则附加到最后一条用户消息中
    if (pendingVideoSnapshot) {
        let lastUserMsgIndex = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                lastUserMsgIndex = i;
                break;
            }
        }

        if (lastUserMsgIndex !== -1) {
            const originalContent = messages[lastUserMsgIndex].content;
            messages[lastUserMsgIndex].content = [
                { type: "text", text: originalContent },
                { type: "image_url", image_url: { url: pendingVideoSnapshot } }
            ];
        } else {
            // 如果没有用户消息（极少见），追加一条
            messages.push({
                role: 'user',
                content: [
                    { type: "text", text: "（这是你通过视频通话看到的用户当前的画面）" },
                    { type: "image_url", image_url: { url: pendingVideoSnapshot } }
                ]
            });
        }
        // 清空暂存
        pendingVideoSnapshot = null;
    }

    try {
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.key}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: messages,
                temperature: settings.temperature
            })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        console.log('Voice Call AI API Response:', data);

        if (data.error) {
            console.error('Voice Call API Error Response:', data.error);
            throw new Error(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
        }

        if (!data.choices || !data.choices.length || !data.choices[0].message) {
            console.error('Invalid Voice Call API response structure:', data);
            throw new Error('API返回数据格式异常');
        }

        let replyContent = data.choices[0].message.content.trim();

        replyContent = replyContent.replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
                                   .replace(/<think>[\s\S]*?<\/think>/g, '')
                                   .trim();

        // 同样应用增强的正则匹配来清理 ACTION (虽然视频通话 Prompt 较少用 ACTION，但为了统一)
        let lines = replyContent.split('\n');
        let cleanLines = [];
        let actions = [];
        
        const actionRegex = /^[\s\*\-\>]*ACTION\s*[:：]\s*(.*)$/i;

                for (let line of lines) {
                    let trimmedLine = line.trim();
                    // if (!trimmedLine) continue; // 优化：保留空行以维持段落格式

                    let actionMatch = trimmedLine.match(actionRegex);
            if (actionMatch) {
                actions.push('ACTION: ' + actionMatch[1].trim());
            } else {
                cleanLines.push(line);
            }
        }
        
        replyContent = cleanLines.join('\n').trim();

        let desc = '';
        let dialogue = replyContent;
        let shouldHangup = false;
        
        // 检查提取出的 actions 中是否有挂断指令
        if (actions.some(a => a.includes('HANGUP_CALL'))) {
            shouldHangup = true;
        }

        if (isVideoCall) {
            const descMatch = replyContent.match(/{{DESC}}([\s\S]*?){{\/DESC}}/i);
            const dialogueMatch = replyContent.match(/{{DIALOGUE}}([\s\S]*?){{\/DIALOGUE}}/i);
            
            if (descMatch) {
                desc = descMatch[1].trim();
            }
            
            if (dialogueMatch) {
                dialogue = dialogueMatch[1].trim();
            } else {
                // 如果没有匹配到完整的 DIALOGUE 块，移除所有 DESC 部分，并清理可能存在的 DIALOGUE 标签
                dialogue = replyContent.replace(/{{DESC}}[\s\S]*?{{\/DESC}}/gi, '')
                                       .replace(/{{DESC}}/gi, '') // 清理可能残留的开始标签
                                       .replace(/{{\/DESC}}/gi, '') // 清理可能残留的结束标签
                                       .replace(/{{DIALOGUE}}/gi, '')
                                       .replace(/{{\/DIALOGUE}}/gi, '')
                                       .trim();
            }
        }

        // 兼容旧的行内检查（以防万一）
        if (dialogue.includes('ACTION: HANGUP_CALL')) {
            shouldHangup = true;
            dialogue = dialogue.replace('ACTION: HANGUP_CALL', '').trim();
        }

        // 防止空回复
        if (!desc && !dialogue) {
            console.log('AI generated empty response for video call, skipping message');
            isProcessingResponse = false;
            if (statusEl) statusEl.textContent = '通话中';
            return;
        }

        // 显示描述部分
        if (desc) {
            addVoiceCallMessage(desc, 'description');
        }

        // 处理对话部分
        let audioData = null;
        let bilingualTranslationMeta = null;
        let normalizedDialogueText = dialogue;
        let isSpeakerOn = false;
        
        if (isVideoCall) {
            const videoSpeakerBtn = document.getElementById('video-call-speaker-btn');
            if (videoSpeakerBtn && videoSpeakerBtn.classList.contains('active')) isSpeakerOn = true;
        } else {
            const speakerBtn = document.getElementById('voice-call-speaker-btn');
            if (speakerBtn && speakerBtn.classList.contains('active')) isSpeakerOn = true;
        }

        if (dialogue) {
            const bilingualPair = await requestVoiceCallBilingualPair(dialogue, contact, settings);
            if (bilingualPair) {
                normalizedDialogueText = bilingualPair.sourceText;
                bilingualTranslationMeta = {
                    sourceLang: bilingualPair.sourceLang,
                    targetLang: bilingualPair.targetLang,
                    translatedText: bilingualPair.targetText
                };
            } else {
                bilingualTranslationMeta = await requestVoiceCallBilingualTranslation(dialogue, contact, settings);
            }
        }

        if (isSpeakerOn && normalizedDialogueText) {
            audioData = await generateMinimaxTTS(normalizedDialogueText, contact.ttsVoiceId);
        }

        if (audioData) {
            playVoiceCallAudio(audioData);
        } else {
            // 如果没有音频（未开启扬声器或生成失败），立即恢复VAD
            isProcessingResponse = false;
            if (statusEl) statusEl.textContent = '正在聆听...';
        }

        const msgPayload = {
            text: normalizedDialogueText,
            description: desc,
            audio: audioData,
            bilingualTranslation: bilingualTranslationMeta
        };
        
        const aiMsg = sendMessage(JSON.stringify(msgPayload), false, 'voice_call_text');
        addVoiceCallMessage(normalizedDialogueText, 'ai', aiMsg && aiMsg.id ? aiMsg.id : null, {
            bilingualTranslation: bilingualTranslationMeta
        });

        if (shouldHangup) {
            const delay = audioData ? (normalizedDialogueText.length * 300 + 1000) : 2000;
            
            setTimeout(() => {
                closeVoiceCallScreen('ai');
            }, delay); 
        }

    } catch (error) {
        console.error('语音通话AI生成失败:', error);
        addVoiceCallMessage(`[生成失败: ${error.message}]`, 'ai');
        if (statusEl) statusEl.textContent = '生成失败';
        // 在控制台输出更多细节以便调试
        if (window.showChatToast) window.showChatToast(`语音通话AI错误: ${error.message}`);
        isProcessingResponse = false; // 发生错误，恢复VAD
    } finally {
        // 移除这里的状态重置，交由 playVoiceCallAudio 或上面的逻辑控制
    }
}

async function startVoiceCallVAD() {
    if (voiceCallIsRecording) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000  // 降低采样率
            }
        });
        voiceCallStream = stream;
        voiceCallAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 根据设备类型调整增益
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const gainNode = voiceCallAudioContext.createGain();
        gainNode.gain.value = isMobile ? 3.0 : 5.0; // 移动端降低增益避免失真

        voiceCallAnalyser = voiceCallAudioContext.createAnalyser();
        voiceCallMicrophone = voiceCallAudioContext.createMediaStreamSource(stream);
        voiceCallScriptProcessor = voiceCallAudioContext.createScriptProcessor(4096, 1, 1);

        voiceCallAnalyser.fftSize = 512;
        voiceCallAnalyser.smoothingTimeConstant = 0.8;  // 增加平滑度
        
        // 连接链路: Mic -> Gain -> Analyser -> Processor -> Destination
        voiceCallMicrophone.connect(gainNode);
        gainNode.connect(voiceCallAnalyser);
        voiceCallAnalyser.connect(voiceCallScriptProcessor);
        voiceCallScriptProcessor.connect(voiceCallAudioContext.destination);

        // 使用SiliconFlow支持的音频格式：wav/mp3/pcm/opus/webm
        let options = {};
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options = { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 64000 };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm', audioBitsPerSecond: 64000 };
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
            options = { mimeType: 'audio/ogg;codecs=opus', audioBitsPerSecond: 64000 };
        }
        
        try {
            voiceCallMediaRecorder = new MediaRecorder(stream, options);
            console.log('VAD using audio format:', voiceCallMediaRecorder.mimeType);
        } catch (e) {
            console.warn('MediaRecorder options not supported, falling back to default', e);
            voiceCallMediaRecorder = new MediaRecorder(stream);
        }
        
        voiceCallChunks = [];

        voiceCallMediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                voiceCallChunks.push(e.data);
            }
        };

        voiceCallMediaRecorder.onstop = async () => {
            if (voiceCallChunks.length > 0) {
                // 确保 Blob 类型与录制时一致
                const mimeType = voiceCallMediaRecorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(voiceCallChunks, { type: mimeType });
                await processVoiceCallAudio(audioBlob);
                voiceCallChunks = [];
            }
        };

        voiceCallIsSpeaking = false;
        voiceCallSilenceStart = Date.now();
        voiceCallIsRecording = true;

        // 根据设备类型调整阈值
        const VAD_THRESHOLD = isMobile ? 15 : 10;
        const SILENCE_DURATION = isMobile ? 1800 : 1500;  // 移动端延长静音判定时间

        voiceCallScriptProcessor.onaudioprocess = (event) => {
            const array = new Uint8Array(voiceCallAnalyser.frequencyBinCount);
            voiceCallAnalyser.getByteFrequencyData(array);
            let values = 0;
            const length = array.length;
            for (let i = 0; i < length; i++) {
                values += array[i];
            }
            let average = values / length;

            // 如果AI正在说话，或者正在处理回复，暂停VAD检测
            if (isAiSpeaking || isProcessingResponse) {
                average = 0;
            }

            let statusEl = document.getElementById('voice-call-status');
            const videoScreen = document.getElementById('video-call-screen');
            if (videoScreen && !videoScreen.classList.contains('hidden')) {
                statusEl = document.getElementById('video-call-status');
            }
            
            if (average > VAD_THRESHOLD) {
                if (!voiceCallIsSpeaking) {
                    console.log('VAD: Speaking started');
                    voiceCallIsSpeaking = true;
                    if (voiceCallMediaRecorder.state === 'inactive') {
                        voiceCallMediaRecorder.start();
                        if (statusEl) statusEl.textContent = '正在聆听...';
                    }
                }
                voiceCallSilenceStart = Date.now();
            } else {
                if (voiceCallIsSpeaking) {
                    const silenceDuration = Date.now() - voiceCallSilenceStart;
                    if (silenceDuration > SILENCE_DURATION) {
                        console.log('VAD: Speaking ended');
                        voiceCallIsSpeaking = false;
                        if (voiceCallMediaRecorder.state === 'recording') {
                            voiceCallMediaRecorder.stop();
                            if (statusEl) statusEl.textContent = '正在处理...';
                        }
                    }
                }
            }
        };

        console.log('Voice Call VAD started');

    } catch (error) {
        console.error('Failed to start VAD:', error);
        alert('无法启动语音检测，请检查麦克风权限');
        stopVoiceCallVAD();
    }
}

function stopVoiceCallVAD() {
    if (!voiceCallIsRecording) return;

    if (voiceCallMediaRecorder && voiceCallMediaRecorder.state !== 'inactive') {
        voiceCallMediaRecorder.stop();
    }
    
    if (voiceCallStream) {
        voiceCallStream.getTracks().forEach(track => track.stop());
        voiceCallStream = null;
    }
    
    if (voiceCallMicrophone) voiceCallMicrophone.disconnect();
    if (voiceCallAnalyser) voiceCallAnalyser.disconnect();
    if (voiceCallScriptProcessor) {
        voiceCallScriptProcessor.disconnect();
        voiceCallScriptProcessor.onaudioprocess = null;
    }
    if (voiceCallAudioContext) voiceCallAudioContext.close();

    voiceCallIsRecording = false;
    voiceCallIsSpeaking = false;
    voiceCallChunks = [];
    
    const micBtn = document.getElementById('voice-call-mic-btn');
    if (micBtn) {
        micBtn.classList.remove('active');
        const span = micBtn.nextElementSibling;
        if (span) span.textContent = '麦克风已关';
    }

    const videoMicBtn = document.getElementById('video-call-mic-btn');
    if (videoMicBtn) {
        videoMicBtn.classList.remove('active');
        const span = videoMicBtn.nextElementSibling;
        if (span) span.textContent = '麦克风已关';
    }
    
    let statusEl = document.getElementById('voice-call-status');
    const videoScreen = document.getElementById('video-call-screen');
    if (videoScreen && !videoScreen.classList.contains('hidden')) {
        statusEl = document.getElementById('video-call-status');
    }
    if (statusEl) statusEl.textContent = '通话中';

    console.log('Voice Call VAD stopped');
}

async function processVoiceCallAudio(audioBlob) {
    if (!window.iphoneSimState.whisperSettings.url || !window.iphoneSimState.whisperSettings.key) {
        console.warn('Whisper API not configured');
        return;
    }

    let statusEl = document.getElementById('voice-call-status');
    const videoScreen = document.getElementById('video-call-screen');
    if (videoScreen && !videoScreen.classList.contains('hidden')) {
        statusEl = document.getElementById('video-call-status');
    }
    if (statusEl) statusEl.textContent = '正在转文字...';
    
    let hasRecognizedText = false;

    try {
        // 使用正确的文件扩展名和类型（SiliconFlow支持：wav/mp3/pcm/opus/webm）
        let ext = 'webm';
        if (audioBlob.type.includes('ogg')) {
            ext = 'ogg';
        } else if (audioBlob.type.includes('wav')) {
            ext = 'wav';
        } else if (audioBlob.type.includes('mp3')) {
            ext = 'mp3';
        } else {
            ext = 'webm';
        }
        const audioFile = new File([audioBlob], `voice_call.${ext}`, { type: audioBlob.type });
        
        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('model', window.iphoneSimState.whisperSettings.model || 'whisper-1');
        formData.append('language', 'zh');  // 指定中文以提高准确率

        let fetchUrl = window.iphoneSimState.whisperSettings.url;
        if (fetchUrl.endsWith('/')) {
            fetchUrl = fetchUrl.slice(0, -1);
        }
        if (!fetchUrl.endsWith('/audio/transcriptions')) {
            fetchUrl = fetchUrl + '/audio/transcriptions';
        }

        const cleanKey = window.iphoneSimState.whisperSettings.key ? window.iphoneSimState.whisperSettings.key.trim() : '';

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cleanKey}`
            },
            body: formData
        });

        if (!response.ok) {
            if (response.status === 403) {
                console.error('Voice Call STT 403: 模型名称可能错误，请检查设置');
            }
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        let text = data.text ? data.text.trim() : '';
        
        // 过滤emoji和特殊字符
        if (text) {
            text = text.replace(/[\u{1F600}-\u{1F64F}]/gu, '') // 表情符号
                       .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // 符号和象形文字
                       .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // 交通和地图符号
                       .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // 旗帜
                       .replace(/[\u{2600}-\u{26FF}]/gu, '')   // 杂项符号
                       .replace(/[\u{2700}-\u{27BF}]/gu, '')   // 装饰符号
                       .trim();
        }

        if (text) {
            console.log('VAD Recognized:', text);
            const sentMsg = sendMessage(text, true, 'voice_call_text');
            addVoiceCallMessage(text, 'user', sentMsg && sentMsg.id ? sentMsg.id : null);
            hasRecognizedText = true;
            
            // 识别成功，进入处理状态，暂停VAD
            isProcessingResponse = true;
            if (statusEl) statusEl.textContent = '对方正在思考...';
            
            generateVoiceCallAiReply();
        } else {
            console.log('VAD: No text recognized or filtered out');
        }

    } catch (error) {
        console.error('Voice Call STT Error:', error);
        // 移动端可能出现网络错误，不要弹窗打断通话
        if (statusEl) statusEl.textContent = '识别失败，继续聆听...';
    } finally {
        // 只有在没有识别出文本且没有进入处理状态时，才恢复"正在聆听"
        if (statusEl && !hasRecognizedText && !isProcessingResponse) statusEl.textContent = '正在聆听...';
    }
}

window.playVoiceMsg = async function(msgId, textElId, event) {
    if (event) event.stopPropagation();
    const debugTraceId = createVoiceDebugTraceId(`play_${msgId}`);
    voiceDebugLog(debugTraceId, 'PLAY:click', {
        msgId,
        textElId,
        contactId: String(window.iphoneSimState.currentChatContactId || ''),
        hasCurrentVoiceAudio: !!currentVoiceAudio,
        currentVoiceMsgId: currentVoiceMsgId
    });

    const btn = event.currentTarget;
    const icon = btn.querySelector('i');
    const getIdleIconClass = () => {
        if (!icon) return 'ri-play-fill';
        return icon.dataset.idleClass || 'ri-play-fill';
    };
    const getPlayingIconClass = () => {
        if (!icon) return 'ri-play-fill voice-playing-anim';
        return icon.dataset.playingClass || 'ri-play-fill voice-playing-anim';
    };

    if (currentVoiceMsgId === msgId && currentVoiceAudio && !currentVoiceAudio.paused) {
        voiceDebugLog(debugTraceId, 'PLAY:skip:already_playing');
        return;
    }

    if (icon && icon.classList.contains('fa-spinner')) {
        voiceDebugLog(debugTraceId, 'PLAY:skip:icon_loading');
        return;
    }

    if (currentVoiceAudio) {
        currentVoiceAudio.pause();
        currentVoiceAudio = null;
        currentVoiceMsgId = null;
        if (currentVoiceIcon) {
            const idleCls = currentVoiceIcon.dataset.idleClass || 'ri-play-fill';
            currentVoiceIcon.className = idleCls;
            currentVoiceIcon = null;
        }
    }
    
    const textEl = document.getElementById(textElId);
    if (textEl) textEl.classList.remove('hidden');

    let targetMsg = null;
    if (window.iphoneSimState.currentChatContactId && window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId]) {
        targetMsg = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId].find(m => m.id == msgId);
    }

    if (!targetMsg) {
        voiceDebugError(debugTraceId, 'PLAY:error:message_not_found', { msgId });
        return;
    }

    let msgData = null;
    try {
        msgData = typeof targetMsg.content === 'string' ? JSON.parse(targetMsg.content) : targetMsg.content;
    } catch (e) {
        voiceDebugError(debugTraceId, 'PLAY:error:parse_message_content', e);
        return;
    }
    voiceDebugLog(debugTraceId, 'PLAY:message:parsed', {
        type: String(targetMsg.type || ''),
        mode: String(msgData && msgData.mode || ''),
        isReal: !!(msgData && msgData.isReal),
        hasAudio: !!(msgData && msgData.audio),
        audioSummary: summarizeVoiceAudioValue(msgData && msgData.audio),
        textLength: String(msgData && (msgData.text || msgData.ttsText) || '').length
    });

    if (!msgData.audio && !msgData.isReal) {
        const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
        if (!contact || !contact.ttsEnabled) {
            voiceDebugLog(debugTraceId, 'PLAY:blocked:tts_disabled_or_contact_missing', {
                hasContact: !!contact,
                ttsEnabled: !!(contact && contact.ttsEnabled)
            });
            alert('无法播放：未启用TTS或联系人不存在');
            return;
        }

        if (icon) {
            icon.className = 'fas fa-spinner fa-spin';
        }

        try {
            const ttsSourceText = String(msgData.ttsText || msgData.text || '').trim();
            const singOptions = (msgData.ttsOptions && typeof msgData.ttsOptions === 'object' && !Array.isArray(msgData.ttsOptions))
                ? msgData.ttsOptions
                : {};
            const shouldUseSingMode = String(msgData.mode || '').toLowerCase() === 'sing';
            const shouldUseSingCoverMode = String(msgData.mode || '').toLowerCase() === 'sing_cover';
            const shouldUseSingStyleMode = shouldUseSingMode || shouldUseSingCoverMode;
            voiceDebugLog(debugTraceId, 'PLAY:generate:start', {
                shouldUseSingMode,
                shouldUseSingCoverMode,
                shouldUseSingStyleMode,
                hasTtsText: !!ttsSourceText,
                singOptionsKeys: Object.keys(singOptions || {})
            });
            let audioData = null;
            if (shouldUseSingCoverMode) {
                voiceDebugLog(debugTraceId, 'PLAY:generate:cover:attempt');
                audioData = await generateMinimaxMusicCover(msgData, { suppressAlert: true, debugTraceId });
                voiceDebugLog(debugTraceId, 'PLAY:generate:cover:result', summarizeVoiceAudioValue(audioData));
            }
            if (!audioData) {
                const plainSingTtsOptions = shouldUseSingCoverMode
                    ? {
                        suppressAlert: true,
                        debugTraceId,
                        model: singOptions.model,
                        voice_setting: (singOptions.voice_setting && typeof singOptions.voice_setting === 'object')
                            ? { ...singOptions.voice_setting }
                            : undefined,
                        audio_setting: (singOptions.audio_setting && typeof singOptions.audio_setting === 'object')
                            ? { ...singOptions.audio_setting }
                            : undefined
                    }
                    : null;
                voiceDebugLog(debugTraceId, 'PLAY:generate:tts:attempt', {
                    textLength: String(shouldUseSingStyleMode ? (ttsSourceText || String(msgData.text || '').trim()) : String(msgData.text || '').trim()).length,
                    usePlainSingOptions: !!shouldUseSingCoverMode
                });
                audioData = await generateMinimaxTTS(
                    shouldUseSingStyleMode ? (ttsSourceText || String(msgData.text || '').trim()) : String(msgData.text || '').trim(),
                    contact.ttsVoiceId,
                    shouldUseSingStyleMode
                        ? (shouldUseSingCoverMode ? plainSingTtsOptions : { ...singOptions, suppressAlert: true, debugTraceId })
                        : { suppressAlert: true, debugTraceId }
                );
                voiceDebugLog(debugTraceId, 'PLAY:generate:tts:result', summarizeVoiceAudioValue(audioData));
            }
            if (!audioData && shouldUseSingStyleMode) {
                voiceDebugLog(debugTraceId, 'PLAY:generate:tts:fallback_attempt', {
                    textLength: String(msgData.text || ttsSourceText || '').trim().length
                });
                audioData = await generateMinimaxTTS(String(msgData.text || ttsSourceText || '').trim(), contact.ttsVoiceId, { suppressAlert: true, debugTraceId });
                voiceDebugLog(debugTraceId, 'PLAY:generate:tts:fallback_result', summarizeVoiceAudioValue(audioData));
            }
            if (audioData) {
                msgData.audio = audioData;
                targetMsg.content = JSON.stringify(msgData);
                saveConfig();
                voiceDebugLog(debugTraceId, 'PLAY:generate:success_saved', summarizeVoiceAudioValue(audioData));
            } else {
                voiceDebugLog(debugTraceId, 'PLAY:generate:failed');
                alert('语音生成失败，请检查API配置');
                if (icon) icon.className = getIdleIconClass();
                return;
            }
        } catch (e) {
            voiceDebugError(debugTraceId, 'PLAY:error:tts_generation', e);
            alert('语音生成出错');
            if (icon) icon.className = getIdleIconClass();
            return;
        }
    }

    if (msgData.audio) {
        // 验证音频数据格式
        const isDataAudio = typeof msgData.audio === 'string' && msgData.audio.startsWith('data:audio/');
        const isHttpAudio = typeof msgData.audio === 'string' && /^https?:\/\//i.test(msgData.audio);
        voiceDebugLog(debugTraceId, 'PLAY:audio:validate', {
            isDataAudio,
            isHttpAudio,
            summary: summarizeVoiceAudioValue(msgData.audio)
        });
        if (!isDataAudio && !isHttpAudio) {
            voiceDebugError(debugTraceId, 'PLAY:error:invalid_audio_data', summarizeVoiceAudioValue(msgData.audio));
            if (icon) icon.className = getIdleIconClass();
            alert('音频格式错误，请重新录制');
            return;
        }
        
        try {
            const audio = new Audio();
            currentVoiceAudio = audio;
            currentVoiceMsgId = msgId;
            
            if (icon) {
                icon.className = getPlayingIconClass();
                currentVoiceIcon = icon;
            }
            
            audio.onended = () => {
                voiceDebugLog(debugTraceId, 'PLAY:audio:onended', { msgId });
                if (icon) {
                    icon.className = getIdleIconClass();
                }
                if (currentVoiceMsgId === msgId) {
                    currentVoiceAudio = null;
                    currentVoiceMsgId = null;
                    currentVoiceIcon = null;
                }
            };
            
            audio.onerror = (e) => {
                voiceDebugError(debugTraceId, 'PLAY:audio:onerror', {
                    error: e,
                    srcLength: msgData.audio ? msgData.audio.length : 0,
                    srcSummary: summarizeVoiceAudioValue(msgData.audio)
                });
                if (icon) icon.className = getIdleIconClass();
                
                // 更友好的错误提示
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                if (isMobile) {
                    // 移动端可能是格式不支持
                    if (window.showChatToast) {
                        window.showChatToast('音频格式不支持，请在设置中切换录音格式');
                    } else {
                        alert('音频格式不支持，建议使用mp4格式');
                    }
                } else {
                    alert('播放失败：音频数据可能已损坏');
                }
                
                if (currentVoiceMsgId === msgId) {
                    currentVoiceAudio = null;
                    currentVoiceMsgId = null;
                    currentVoiceIcon = null;
                }
            };

            audio.onloadedmetadata = () => {
                voiceDebugLog(debugTraceId, 'PLAY:audio:onloadedmetadata', {
                    duration: Number.isFinite(audio.duration) ? audio.duration : null,
                    readyState: audio.readyState
                });
            };
            audio.oncanplay = () => {
                voiceDebugLog(debugTraceId, 'PLAY:audio:oncanplay', {
                    readyState: audio.readyState,
                    networkState: audio.networkState
                });
            };
            audio.onplaying = () => {
                voiceDebugLog(debugTraceId, 'PLAY:audio:onplaying', {
                    currentTime: audio.currentTime,
                    paused: audio.paused
                });
            };
            
            // 设置音频源并播放
            audio.src = msgData.audio;
            audio.load(); // 预加载
            voiceDebugLog(debugTraceId, 'PLAY:audio:load_called');
            
            audio.play().catch(err => {
                voiceDebugError(debugTraceId, 'PLAY:audio:play_rejected', err);
                if (icon) icon.className = getIdleIconClass();
                
                // 更详细的错误信息
                let errorMsg = '播放失败';
                if (err.name === 'NotAllowedError') {
                    errorMsg = '需要用户交互才能播放音频';
                } else if (err.name === 'NotSupportedError') {
                    errorMsg = '音频格式不支持';
                } else {
                    errorMsg = '播放错误: ' + err.message;
                }
                
                if (window.showChatToast) {
                    window.showChatToast(errorMsg);
                } else {
                    alert(errorMsg);
                }
                
                if (currentVoiceMsgId === msgId) {
                    currentVoiceAudio = null;
                    currentVoiceMsgId = null;
                    currentVoiceIcon = null;
                }
            });
        } catch (err) {
            voiceDebugError(debugTraceId, 'PLAY:error:audio_creation', err);
            if (icon) icon.className = getIdleIconClass();
            alert('音频初始化失败');
        }
    } else {
        voiceDebugLog(debugTraceId, 'PLAY:audio:empty_after_generation');
        if (icon) icon.className = getIdleIconClass();
        alert('该消息没有音频数据。');
    }
};

window.openEditChatMessageModal = function(msgId, currentContent) {
    currentEditingChatMsgId = msgId;
    currentEditingVoiceCallMsgId = null;
    const textarea = document.getElementById('edit-chat-msg-content');
    const typeInput = document.getElementById('edit-chat-msg-type');
    const modal = document.getElementById('edit-chat-msg-modal');
    const typeSwitch = document.getElementById('edit-chat-msg-type-switch');
    const addInsertedBtn = document.getElementById('add-inserted-chat-msg-btn');
    const insertedList = document.getElementById('inserted-chat-msg-list');
    const selectedType = resolveEditChatMessageType(msgId);
    textarea.value = resolveEditChatMessageTextValue(msgId, currentContent);
    if (typeInput) typeInput.value = selectedType;
    if (insertedList) insertedList.innerHTML = '';
    if (typeSwitch) typeSwitch.style.display = '';
    if (addInsertedBtn) addInsertedBtn.style.display = '';
    if (insertedList) insertedList.style.display = '';
    if (modal) {
        modal.querySelectorAll('.edit-chat-msg-type-btn').forEach(btn => {
            if (btn.closest('.edit-chat-msg-insert-item')) return;
            btn.classList.toggle('active', btn.dataset.msgType === selectedType);
        });
    }
    document.getElementById('edit-chat-msg-modal').classList.remove('hidden');
};

function resolveEditChatMessageType(msgId) {
    if (!msgId || !window.iphoneSimState || !window.iphoneSimState.currentChatContactId) return 'text';
    const messages = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
    if (!Array.isArray(messages)) return 'text';
    const targetMsg = messages.find(m => String(m && m.id) === String(msgId));
    if (!targetMsg) return 'text';
    const rawType = String(targetMsg.type || 'text').trim().toLowerCase();
    if (rawType === 'virtual_image' || rawType === 'image') return 'image';
    if (rawType === 'voice') return 'voice';
    if (rawType === 'sticker') return 'sticker';
    return 'text';
}

function resolveEditChatMessageTextValue(msgId, fallbackContent) {
    if (!msgId || !window.iphoneSimState || !window.iphoneSimState.currentChatContactId) {
        return String(fallbackContent || '');
    }
    const messages = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
    if (!Array.isArray(messages)) return String(fallbackContent || '');
    const targetMsg = messages.find(m => String(m && m.id) === String(msgId));
    if (!targetMsg) return String(fallbackContent || '');

    const msgType = String(targetMsg.type || '').toLowerCase();
    if (msgType === 'voice') {
        try {
            const voiceData = typeof targetMsg.content === 'string' ? JSON.parse(targetMsg.content) : targetMsg.content;
            return String((voiceData && voiceData.text) || fallbackContent || '').trim();
        } catch (e) {
            return String(fallbackContent || '').trim();
        }
    }
    if (msgType === 'image' || msgType === 'virtual_image' || msgType === 'sticker') {
        const preferred = String(targetMsg.description || fallbackContent || '').trim();
        if (preferred) return preferred;
    }
    return String(fallbackContent || '').trim();
}

function buildEditedChatMessagePayload(nextType, newContent, oldMessage) {
    const safeType = ['text', 'voice', 'image', 'sticker'].includes(nextType) ? nextType : 'text';
    const trimmedContent = String(newContent || '').trim();
    const previousMessage = oldMessage && typeof oldMessage === 'object' ? oldMessage : {};

    if (safeType === 'voice') {
        let previousVoiceData = {};
        if (String(previousMessage.type || '').toLowerCase() === 'voice') {
            try {
                previousVoiceData = typeof previousMessage.content === 'string'
                    ? JSON.parse(previousMessage.content)
                    : (previousMessage.content || {});
            } catch (e) {
                previousVoiceData = {};
            }
        }
        return {
            type: 'voice',
            content: JSON.stringify({
                duration: Number(previousVoiceData.duration || 3),
                text: trimmedContent,
                isReal: !!previousVoiceData.isReal,
                audio: previousVoiceData.audio || null
            }),
            description: null
        };
    }

    if (safeType === 'image') {
        const oldType = String(previousMessage.type || '').toLowerCase();
        const keepOriginalRealImage = oldType === 'image' && typeof previousMessage.content === 'string' && !!previousMessage.content.trim();
        return {
            type: keepOriginalRealImage ? 'image' : 'virtual_image',
            content: keepOriginalRealImage
                ? previousMessage.content
                : (window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo'),
            description: trimmedContent
        };
    }

    if (safeType === 'sticker') {
        let stickerUrl = null;
        if (window.iphoneSimState && Array.isArray(window.iphoneSimState.stickerCategories)) {
            for (const cat of window.iphoneSimState.stickerCategories) {
                if (!cat || !Array.isArray(cat.list)) continue;
                const found = cat.list.find(s => {
                    const desc = String((s && s.desc) || '').trim();
                    return desc && (desc === trimmedContent || desc.includes(trimmedContent) || trimmedContent.includes(desc));
                });
                if (found && found.url) {
                    stickerUrl = found.url;
                    break;
                }
            }
        }

        if (stickerUrl) {
            return {
                type: 'sticker',
                content: stickerUrl,
                description: trimmedContent
            };
        }

        return {
            type: 'text',
            content: `[表情包: ${trimmedContent}]`,
            description: null
        };
    }

    return {
        type: 'text',
        content: trimmedContent,
        description: null
    };
}

function createInsertedChatMessageItem(defaultContent = '', defaultType = 'text') {
    const wrapper = document.createElement('div');
    wrapper.className = 'edit-chat-msg-insert-item';
    wrapper.innerHTML = `
        <div class="edit-chat-msg-insert-head">
            <span class="edit-chat-msg-insert-title">插入消息</span>
            <button type="button" class="edit-chat-msg-insert-remove" title="移除">×</button>
        </div>
        <textarea class="edit-chat-msg-insert-content" placeholder="输入插入的消息内容..."></textarea>
        <input type="hidden" class="edit-chat-msg-insert-type" value="text">
        <div class="edit-chat-msg-type-switch" aria-label="插入消息类型切换">
            <button type="button" class="edit-chat-msg-type-btn active" data-msg-type="text">文本</button>
            <button type="button" class="edit-chat-msg-type-btn" data-msg-type="voice">语音</button>
            <button type="button" class="edit-chat-msg-type-btn" data-msg-type="image">图片</button>
            <button type="button" class="edit-chat-msg-type-btn" data-msg-type="sticker">表情包</button>
        </div>
    `;

    const textArea = wrapper.querySelector('.edit-chat-msg-insert-content');
    const typeInput = wrapper.querySelector('.edit-chat-msg-insert-type');
    const typeButtons = Array.from(wrapper.querySelectorAll('.edit-chat-msg-type-btn'));
    const removeBtn = wrapper.querySelector('.edit-chat-msg-insert-remove');
    const normalizedType = ['text', 'voice', 'image', 'sticker'].includes(defaultType) ? defaultType : 'text';

    if (textArea) textArea.value = String(defaultContent || '');
    if (typeInput) typeInput.value = normalizedType;
    typeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.msgType === normalizedType);
        btn.addEventListener('click', () => {
            const msgType = String(btn.dataset.msgType || 'text').trim();
            if (typeInput) typeInput.value = msgType || 'text';
            typeButtons.forEach(item => item.classList.toggle('active', item === btn));
        });
    });
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            wrapper.remove();
        });
    }
    return wrapper;
}

function collectInsertedChatMessages() {
    const list = document.getElementById('inserted-chat-msg-list');
    if (!list) return [];
    const items = Array.from(list.querySelectorAll('.edit-chat-msg-insert-item'));
    const insertedMessages = [];
    items.forEach(item => {
        const contentEl = item.querySelector('.edit-chat-msg-insert-content');
        const typeEl = item.querySelector('.edit-chat-msg-insert-type');
        const content = String(contentEl ? contentEl.value : '').trim();
        if (!content) return;
        insertedMessages.push({
            type: String(typeEl ? typeEl.value : 'text').trim() || 'text',
            content
        });
    });
    return insertedMessages;
}

window.openEditBlockModal = function(jsonContent) {
    const list = document.getElementById('edit-block-list');
    list.innerHTML = '';
    
    let items = [];
    try {
        items = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    } catch(e) {
        console.error(e);
        items = [];
    }
    
    items.forEach((item, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'edit-block-item';
        wrapper.style.marginBottom = '10px';
        
        const label = document.createElement('div');
        label.textContent = `消息 ${index + 1}`;
        label.style.fontSize = '12px';
        label.style.color = '#888';
        label.style.marginBottom = '4px';
        
        const textarea = document.createElement('textarea');
        textarea.className = 'block-item-json';
        textarea.style.width = '100%';
        textarea.style.height = '100px';
        textarea.style.fontFamily = 'monospace';
        textarea.style.fontSize = '12px';
        textarea.style.border = '1px solid #ddd';
        textarea.style.borderRadius = '8px';
        textarea.style.padding = '8px';
        textarea.style.resize = 'vertical';
        textarea.value = JSON.stringify(item, null, 2);
        
        const toolbar = document.createElement('div');
        toolbar.className = 'edit-block-toolbar';
        toolbar.style.display = 'flex';
        toolbar.style.gap = '8px';
        toolbar.style.marginTop = '5px';
        toolbar.style.flexWrap = 'wrap';

        const types = [
            { label: '文本', template: {"type": "text", "content": "消息内容"} },
            { label: '图片', template: {"type": "image", "content": "图片描述", "novelaiPrompt": "", "novelaiNegativePrompt": ""} },
            { label: '转账', template: {"type": "action", "command": "TRANSFER", "payload": "88.88 备注"} },
            { label: '表情包', template: {"type": "sticker", "content": "表情包名称"} },
            { label: '语音', template: {"type": "voice", "duration": 5, "content": "语音文本"} }
        ];

        types.forEach(t => {
            const btn = document.createElement('button');
            btn.textContent = t.label;
            btn.style.padding = '4px 8px';
            btn.style.fontSize = '12px';
            btn.style.border = '1px solid #ddd';
            btn.style.borderRadius = '4px';
            btn.style.background = '#f5f5f5';
            btn.style.cursor = 'pointer';
            
            btn.onclick = () => {
                textarea.value = JSON.stringify(t.template, null, 2);
            };
            toolbar.appendChild(btn);
        });
        
        wrapper.appendChild(label);
        wrapper.appendChild(textarea);
        wrapper.appendChild(toolbar);
        list.appendChild(wrapper);
    });
    
    document.getElementById('edit-block-modal').classList.remove('hidden');
};

function handleSaveEditBlock() {
    const list = document.getElementById('edit-block-list');
    const textareas = list.querySelectorAll('.block-item-json');
    const newItems = [];
    
    try {
        textareas.forEach(ta => {
            const item = JSON.parse(ta.value);
            newItems.push(item);
        });
    } catch(e) {
        alert('JSON格式错误，请检查');
        return;
    }
    
    if (newItems.length === 0) {
        if (!confirm('没有消息内容，确定要清空该轮回复吗？')) return;
    }
    
    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId) return;
    
    const history = window.iphoneSimState.chatHistory[contactId];
    
    // Find indices of last AI block
    let indices = [];
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'assistant') {
            indices.unshift(i);
        } else {
            break;
        }
    }
    
    if (indices.length > 0) {
        history.splice(indices[0], indices.length);
    }
    
    // Reconstruct new messages
    let pendingThought = null;
    const newHistoryItems = [];
    
    for (const item of newItems) {
        if (item.type === 'thought') {
            pendingThought = item.content;
            continue;
        }
        
        let contentToSave = item.content;
        let typeToSave = 'text';
        let description = null;
        
        if (item.type === 'text' || item.type === '消息') {
            typeToSave = 'text';
        } else if (item.type === 'sticker' || item.type === '表情包') {
            let stickerUrl = null;
            if (window.iphoneSimState.stickerCategories) {
                for (const cat of window.iphoneSimState.stickerCategories) {
                    const found = cat.list.find(s => s.desc === item.content || s.desc.includes(item.content));
                    if (found) {
                        stickerUrl = found.url;
                        break;
                    }
                }
            }
            if (stickerUrl) {
                contentToSave = stickerUrl;
                typeToSave = 'sticker';
                description = item.content;
            } else {
                contentToSave = `[表情包: ${item.content}]`;
                typeToSave = 'text';
            }
        } else if (item.type === 'image' || item.type === 'virtual_image') {
            contentToSave = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
            typeToSave = 'virtual_image';
            description = item.content;
        } else if (item.type === 'voice') {
            const voiceData = {
                duration: item.duration || 3,
                text: item.content || '语音',
                isReal: false
            };
            contentToSave = JSON.stringify(voiceData);
            typeToSave = 'voice';
        } else if (item.type === 'action') {
            if (item.command === 'TRANSFER') {
                const parts = (item.payload || '').split(' ');
                const amount = parts[0] || '0';
                const remark = parts.slice(1).join(' ') || '转账';
                contentToSave = JSON.stringify({
                    id: Date.now(),
                    amount: amount,
                    remark: remark,
                    status: 'pending'
                });
                typeToSave = 'transfer';
            } else {
                continue;
            }
        }
        
        const msg = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            time: Date.now(),
            role: 'assistant',
            content: contentToSave,
            type: typeToSave
        };
        
        if (item.novelaiPrompt) msg.novelaiPrompt = item.novelaiPrompt;
        if (item.novelaiNegativePrompt) msg.novelaiNegativePrompt = item.novelaiNegativePrompt;
        
        if (description) msg.description = description;
        if (pendingThought) {
            msg.thought = pendingThought;
            pendingThought = null;
        }
        
        newHistoryItems.push(msg);
    }
    
    if (pendingThought && newHistoryItems.length > 0) {
        if (newHistoryItems[newHistoryItems.length - 1].thought) {
            newHistoryItems[newHistoryItems.length - 1].thought += '\n' + pendingThought;
        } else {
            newHistoryItems[newHistoryItems.length - 1].thought = pendingThought;
        }
    }
    
    history.push(...newHistoryItems);
    
    saveConfig();
    renderChatHistory(contactId);
    document.getElementById('edit-block-modal').classList.add('hidden');
}

function handleSaveEditedChatMessage() {
    if (currentEditingVoiceCallMsgId && window.iphoneSimState && window.iphoneSimState.currentChatContactId) {
        if (!isVoiceCallMessageInCurrentSession(currentEditingVoiceCallMsgId)) {
            if (window.showChatToast) window.showChatToast('仅可编辑本次通话消息');
            document.getElementById('edit-chat-msg-modal').classList.add('hidden');
            currentEditingVoiceCallMsgId = null;
            currentEditingChatMsgId = null;
            return;
        }
        const newContentForCall = document.getElementById('edit-chat-msg-content').value.trim();
        if (!newContentForCall) {
            alert('消息内容不能为空');
            return;
        }
        const messagesForCall = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
        const callMsgIndex = Array.isArray(messagesForCall)
            ? messagesForCall.findIndex(m => String(m && m.id) === String(currentEditingVoiceCallMsgId))
            : -1;
        if (callMsgIndex === -1) {
            alert('找不到原消息，可能已被删除');
            document.getElementById('edit-chat-msg-modal').classList.add('hidden');
            currentEditingVoiceCallMsgId = null;
            return;
        }

        const targetMsg = messagesForCall[callMsgIndex];
        if (targetMsg.role === 'assistant') {
            let payload = {};
            try {
                payload = typeof targetMsg.content === 'string' ? JSON.parse(targetMsg.content) : (targetMsg.content || {});
            } catch (e) {
                payload = {};
            }
            payload.text = newContentForCall;
            payload.bilingualTranslation = null;
            targetMsg.content = JSON.stringify(payload);
        } else {
            targetMsg.content = newContentForCall;
        }

        saveConfig();
        refreshActiveCallMessageView();
        document.getElementById('edit-chat-msg-modal').classList.add('hidden');
        const typeSwitch = document.getElementById('edit-chat-msg-type-switch');
        const addInsertedBtn = document.getElementById('add-inserted-chat-msg-btn');
        const insertedList = document.getElementById('inserted-chat-msg-list');
        if (typeSwitch) typeSwitch.style.display = '';
        if (addInsertedBtn) addInsertedBtn.style.display = '';
        if (insertedList) insertedList.style.display = '';
        if (insertedList) insertedList.innerHTML = '';
        currentEditingVoiceCallMsgId = null;
        currentEditingChatMsgId = null;
        return;
    }

    if (!currentEditingChatMsgId || !window.iphoneSimState.currentChatContactId) return;

    const newContent = document.getElementById('edit-chat-msg-content').value.trim();
    if (!newContent) {
        alert('消息内容不能为空');
        return;
    }

    if (currentEditingChatMsgId === 'LAST_AI_BLOCK') {
        try {
            const newItems = JSON.parse(newContent);
            if (!Array.isArray(newItems)) {
                alert('必须是JSON数组格式');
                return;
            }
            
            const contactId = window.iphoneSimState.currentChatContactId;
            const history = window.iphoneSimState.chatHistory[contactId];
            
            let indices = [];
            for (let i = history.length - 1; i >= 0; i--) {
                if (history[i].role === 'assistant') {
                    indices.unshift(i);
                } else {
                    break;
                }
            }
            
            if (indices.length > 0) {
                history.splice(indices[0], indices.length);
            }
            
            let pendingThought = null;
            const newHistoryItems = [];
            
            for (const item of newItems) {
                if (item.type === 'thought') {
                    pendingThought = item.content;
                    continue;
                }
                
                let contentToSave = item.content;
                let typeToSave = 'text';
                let description = null;
                
                if (item.type === 'text' || item.type === '消息') {
                    typeToSave = 'text';
                } else if (item.type === 'sticker' || item.type === '表情包') {
                    let stickerUrl = null;
                    if (window.iphoneSimState.stickerCategories) {
                        for (const cat of window.iphoneSimState.stickerCategories) {
                            const found = cat.list.find(s => s.desc === item.content || s.desc.includes(item.content));
                            if (found) {
                                stickerUrl = found.url;
                                break;
                            }
                        }
                    }
                    if (stickerUrl) {
                        contentToSave = stickerUrl;
                        typeToSave = 'sticker';
                        description = item.content;
                    } else {
                        contentToSave = `[表情包: ${item.content}]`;
                        typeToSave = 'text';
                    }
                } else if (item.type === 'image' || item.type === 'virtual_image') {
                    contentToSave = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
                    typeToSave = 'virtual_image';
                    description = item.content;
                } else if (item.type === 'voice') {
                    const voiceData = {
                        duration: item.duration || 3,
                        text: item.content || '语音',
                        isReal: false
                    };
                    contentToSave = JSON.stringify(voiceData);
                    typeToSave = 'voice';
                } else if (item.type === 'action') {
                    if (item.command === 'TRANSFER') {
                        const parts = (item.payload || '').split(' ');
                        const amount = parts[0] || '0';
                        const remark = parts.slice(1).join(' ') || '转账';
                        contentToSave = JSON.stringify({
                            id: Date.now(),
                            amount: amount,
                            remark: remark,
                            status: 'pending'
                        });
                        typeToSave = 'transfer';
                    } else {
                        continue;
                    }
                }
                
                const msg = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    time: Date.now(),
                    role: 'assistant',
                    content: contentToSave,
                    type: typeToSave
                };
                
                if (description) msg.description = description;
                if (pendingThought) {
                    msg.thought = pendingThought;
                    pendingThought = null;
                }
                
                newHistoryItems.push(msg);
            }
            
            if (pendingThought && newHistoryItems.length > 0) {
                if (newHistoryItems[newHistoryItems.length - 1].thought) {
                    newHistoryItems[newHistoryItems.length - 1].thought += '\n' + pendingThought;
                } else {
                    newHistoryItems[newHistoryItems.length - 1].thought = pendingThought;
                }
            }
            
            history.push(...newHistoryItems);
            
            saveConfig();
            renderChatHistory(contactId);
            document.getElementById('edit-chat-msg-modal').classList.add('hidden');
            const typeSwitch = document.getElementById('edit-chat-msg-type-switch');
            const addInsertedBtn = document.getElementById('add-inserted-chat-msg-btn');
            const insertedList = document.getElementById('inserted-chat-msg-list');
            if (typeSwitch) typeSwitch.style.display = '';
            if (addInsertedBtn) addInsertedBtn.style.display = '';
            if (insertedList) insertedList.style.display = '';
            currentEditingChatMsgId = null;
            
        } catch (e) {
            console.error(e);
            alert('JSON解析失败，请检查格式');
        }
        return;
    }

    const messages = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
    const msgIndex = messages.findIndex(m => m.id == currentEditingChatMsgId);

    if (msgIndex !== -1) {
        const selectedTypeInput = document.getElementById('edit-chat-msg-type');
        const selectedType = selectedTypeInput ? selectedTypeInput.value : 'text';
        const payload = buildEditedChatMessagePayload(selectedType, newContent, messages[msgIndex]);
        const insertedItems = collectInsertedChatMessages();
        const originalMessage = messages[msgIndex];
        messages[msgIndex].type = payload.type;
        messages[msgIndex].content = payload.content;
        if (payload.description) {
            messages[msgIndex].description = payload.description;
        } else {
            delete messages[msgIndex].description;
        }
        if (messages[msgIndex].bilingualTranslation) {
            delete messages[msgIndex].bilingualTranslation;
        }
        if (insertedItems.length > 0) {
            const insertedMessages = insertedItems.map(item => {
                const insertedPayload = buildEditedChatMessagePayload(item.type, item.content, originalMessage);
                const message = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    time: Date.now(),
                    role: originalMessage && originalMessage.role ? originalMessage.role : 'assistant',
                    type: insertedPayload.type,
                    content: insertedPayload.content
                };
                if (insertedPayload.description) {
                    message.description = insertedPayload.description;
                }
                return message;
            });
            messages.splice(msgIndex + 1, 0, ...insertedMessages);
        }
        saveConfig();
        renderChatHistory(window.iphoneSimState.currentChatContactId);
        
        document.getElementById('edit-chat-msg-modal').classList.add('hidden');
        const typeSwitch = document.getElementById('edit-chat-msg-type-switch');
        const addInsertedBtn = document.getElementById('add-inserted-chat-msg-btn');
        const insertedList = document.getElementById('inserted-chat-msg-list');
        if (typeSwitch) typeSwitch.style.display = '';
        if (addInsertedBtn) addInsertedBtn.style.display = '';
        if (insertedList) insertedList.style.display = '';
        if (insertedList) insertedList.innerHTML = '';
        currentEditingChatMsgId = null;
    } else {
        alert('找不到原消息，可能已被删除');
        document.getElementById('edit-chat-msg-modal').classList.add('hidden');
        const typeSwitch = document.getElementById('edit-chat-msg-type-switch');
        const addInsertedBtn = document.getElementById('add-inserted-chat-msg-btn');
        const insertedList = document.getElementById('inserted-chat-msg-list');
        if (typeSwitch) typeSwitch.style.display = '';
        if (addInsertedBtn) addInsertedBtn.style.display = '';
        if (insertedList) insertedList.style.display = '';
    }
}

// 初始化监听器
function openWechatMomentsTab() {
    const momentsTab = document.querySelector('#wechat-app .wechat-tab-item[data-tab="moments"]');
    if (momentsTab) {
        momentsTab.click();
        return;
    }
    if (window.switchTab) {
        window.switchTab('moments');
    }
}

function getCurrentChatContactForStickerSuggestion() {
    const state = window.iphoneSimState;
    if (!state || !Array.isArray(state.contacts)) return null;
    const contactId = state.currentChatContactId;
    if (!contactId) return null;
    return state.contacts.find(item => String(item.id) === String(contactId)) || null;
}

function isStickerSuggestionEnabledForContact(contact) {
    if (!contact) return false;
    if (typeof window.ensureContactStickerSuggestionFields === 'function') {
        try {
            window.ensureContactStickerSuggestionFields(contact);
        } catch (e) {}
    }
    return contact.stickerSuggestionEnabled !== false;
}

function getStickerSuggestionPoolForContact(contact) {
    if (!window.iphoneSimState || !Array.isArray(window.iphoneSimState.stickerCategories)) return [];
    const categories = window.iphoneSimState.stickerCategories;
    const pool = [];
    categories.forEach((cat) => {
        if (!cat || !Array.isArray(cat.list)) return;
        cat.list.forEach((sticker) => {
            if (!sticker || !sticker.url) return;
            pool.push({
                url: String(sticker.url),
                desc: String(sticker.desc || '').trim()
            });
        });
    });
    return pool;
}

function scoreStickerSuggestion(descLower, queryLower, queryNoSpace) {
    if (!descLower || !queryLower) return -1;
    if (descLower === queryLower) return 1200;
    if (descLower.startsWith(queryLower)) return 1000 - Math.min(descLower.length, 120);
    if (descLower.includes(queryLower)) return 800 - Math.min(descLower.indexOf(queryLower), 120);
    if (queryNoSpace && descLower.includes(queryNoSpace)) return 700;
    const parts = queryLower.split(/\s+/).filter(Boolean);
    if (!parts.length) return -1;
    let matchCount = 0;
    parts.forEach((part) => {
        if (part && descLower.includes(part)) matchCount += 1;
    });
    if (!matchCount) return -1;
    return 500 + matchCount * 20;
}

function getStickerSuggestionMatches(contact, rawQuery, limit = CHAT_STICKER_SUGGESTION_LIMIT) {
    const query = String(rawQuery || '').trim();
    if (!query) return [];
    const pool = getStickerSuggestionPoolForContact(contact);
    if (!pool.length) return [];

    const queryLower = query.toLowerCase();
    const queryNoSpace = queryLower.replace(/\s+/g, '');
    const dedupe = new Set();
    const candidates = [];

    pool.forEach((item, index) => {
        const desc = String(item.desc || '').trim();
        if (!desc) return;
        const key = `${item.url}::${desc}`;
        if (dedupe.has(key)) return;
        dedupe.add(key);
        const descLower = desc.toLowerCase();
        const score = scoreStickerSuggestion(descLower, queryLower, queryNoSpace);
        if (score < 0) return;
        candidates.push({
            url: item.url,
            desc,
            score,
            index
        });
    });

    candidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.index - b.index;
    });

    return candidates.slice(0, Math.max(1, Number(limit) || CHAT_STICKER_SUGGESTION_LIMIT));
}

function hideChatStickerSuggestionBar() {
    const bar = document.getElementById('chat-sticker-suggestion-bar');
    const list = document.getElementById('chat-sticker-suggestion-list');
    if (list) list.innerHTML = '';
    if (bar) bar.classList.add('hidden');
}

function sendStickerFromSuggestion(sticker) {
    if (!sticker || !sticker.url || typeof window.sendMessage !== 'function') return;
    window.sendMessage(sticker.url, true, 'sticker', sticker.desc || '');
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.value = '';
        chatInput.focus();
    }
}

function renderChatStickerSuggestionBar(contact, rawQuery) {
    const bar = document.getElementById('chat-sticker-suggestion-bar');
    const list = document.getElementById('chat-sticker-suggestion-list');
    if (!bar || !list) return;
    if (!contact || !isStickerSuggestionEnabledForContact(contact)) {
        hideChatStickerSuggestionBar();
        return;
    }

    const matches = getStickerSuggestionMatches(contact, rawQuery, CHAT_STICKER_SUGGESTION_LIMIT);
    if (!matches.length) {
        hideChatStickerSuggestionBar();
        return;
    }

    list.innerHTML = '';
    matches.forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chat-sticker-suggestion-item';
        button.setAttribute('title', item.desc || '表情包');
        button.setAttribute('aria-label', item.desc || '发送表情包');
        button.innerHTML = `
            <img src="${item.url}" alt="${item.desc || 'sticker'}" loading="lazy">
            <span class="chat-sticker-suggestion-desc">${item.desc || '表情包'}</span>
        `;
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            sendStickerFromSuggestion(item);
            hideChatStickerSuggestionBar();
        });
        list.appendChild(button);
    });
    bar.classList.remove('hidden');
}

function refreshChatStickerSuggestionBarForCurrentInput() {
    const chatInput = document.getElementById('chat-input');
    if (!chatInput) return;
    const chatScreen = document.getElementById('chat-screen');
    if (!chatScreen || chatScreen.classList.contains('hidden')) {
        hideChatStickerSuggestionBar();
        return;
    }
    const contact = getCurrentChatContactForStickerSuggestion();
    if (!contact || !isStickerSuggestionEnabledForContact(contact)) {
        hideChatStickerSuggestionBar();
        return;
    }
    renderChatStickerSuggestionBar(contact, chatInput.value || '');
}

window.refreshChatStickerSuggestionBarForCurrentInput = refreshChatStickerSuggestionBarForCurrentInput;

function setupChatListeners() {
    // 仅选择主微信应用的底栏 Tab
    const wechatTabs = document.querySelectorAll('#wechat-app .wechat-tab-item');
    
    wechatTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const currentActiveTab = document.querySelector('#wechat-app .wechat-tab-item.active');
            if (currentActiveTab === tab) return;

            const currentContent = document.querySelector('#wechat-app .wechat-tab-content.active');
            const tabName = tab.dataset.tab;
            const nextContent = document.getElementById(`wechat-tab-${tabName}`);
            const header = document.querySelector('#wechat-app .wechat-header');

            wechatTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (currentContent) {
                currentContent.classList.add('fade-out');
                if (header) header.classList.add('fade-out');
                
                setTimeout(() => {
                    currentContent.classList.remove('active');
                    currentContent.classList.remove('fade-out');
                    
                    if (nextContent) {
                        nextContent.style.opacity = '0';
                        nextContent.classList.add('active');
                        void nextContent.offsetWidth;
                        nextContent.style.opacity = '1'; 
                    }
                    
                    updateWechatHeader(tabName);
                    if (header) header.classList.remove('fade-out');

                }, 150);
            } else {
                if (nextContent) {
                    nextContent.style.opacity = '0';
                    nextContent.classList.add('active');
                    void nextContent.offsetWidth;
                    nextContent.style.opacity = '1';
                }
                updateWechatHeader(tabName);
            }
        });
    });

    updateWechatHeader('contacts');

    const addContactModal = document.getElementById('add-contact-modal');
    const addContactEntryModal = document.getElementById('add-contact-entry-modal');
    const closeAddContactBtn = document.getElementById('close-add-contact');
    const closeAddContactEntryBtn = document.getElementById('close-add-contact-entry');
    const saveContactBtn = document.getElementById('save-contact-btn');
    const chooseAddContactManualBtn = document.getElementById('choose-add-contact-manual');
    const chooseAddContactImportBtn = document.getElementById('choose-add-contact-import');
    const contactImportFileInput = document.getElementById('contact-import-file-input');

    const contactAvatarPreview = document.getElementById('contact-avatar-preview');
    const contactAvatarUpload = document.getElementById('contact-avatar-upload');
    
    if (contactAvatarPreview && contactAvatarUpload) {
        contactAvatarPreview.addEventListener('click', () => contactAvatarUpload.click());
        
        contactAvatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    contactAvatarPreview.innerHTML = `<img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (closeAddContactBtn) closeAddContactBtn.addEventListener('click', () => addContactModal.classList.add('hidden'));
    if (closeAddContactEntryBtn) closeAddContactEntryBtn.addEventListener('click', () => {
        if (typeof window.closeAddContactModeChooser === 'function') {
            window.closeAddContactModeChooser();
        } else if (addContactEntryModal) {
            addContactEntryModal.classList.add('hidden');
        }
    });
    if (saveContactBtn) saveContactBtn.addEventListener('click', handleSaveContact);
    if (chooseAddContactManualBtn) chooseAddContactManualBtn.addEventListener('click', () => {
        if (typeof window.openManualAddContactModal === 'function') {
            window.openManualAddContactModal();
        } else if (addContactModal) {
            addContactModal.classList.remove('hidden');
        }
    });
    if (chooseAddContactImportBtn) chooseAddContactImportBtn.addEventListener('click', () => {
        if (typeof window.triggerImportContactFilePicker === 'function') {
            window.triggerImportContactFilePicker();
        } else if (contactImportFileInput) {
            contactImportFileInput.click();
        }
    });
    if (contactImportFileInput) contactImportFileInput.addEventListener('change', handleImportContactFileSelection);

    const backToContactsBtn = document.getElementById('back-to-contacts');
    if (backToContactsBtn) backToContactsBtn.addEventListener('click', () => {
        document.getElementById('chat-screen').classList.add('hidden');
        if (typeof window.hideThoughtOverlays === 'function') {
            window.hideThoughtOverlays();
        }
        const pet = document.getElementById('thought-pet');
        if (pet) pet.classList.add('hidden');
        window.iphoneSimState.currentAiProfileContactId = null;
        window.iphoneSimState.currentChatContactId = null;
    });

    const chatSettingsBtn = document.getElementById('chat-settings-btn');
    const chatSettingsScreen = document.getElementById('chat-settings-screen');
    const closeChatSettingsBtn = document.getElementById('close-chat-settings');
    const saveChatSettingsBtn = document.getElementById('save-chat-settings-btn');
    const triggerAiMomentBtn = document.getElementById('trigger-ai-moment-btn');
    
    const chatSettingGroupTrigger = document.getElementById('chat-setting-group-trigger');
    const groupSelectModal = document.getElementById('group-select-modal');
    const closeGroupSelectBtn = document.getElementById('close-group-select');
    const createGroupBtn = document.getElementById('create-group-btn');

    if (chatSettingGroupTrigger) chatSettingGroupTrigger.addEventListener('click', openGroupSelect);
    if (closeGroupSelectBtn) closeGroupSelectBtn.addEventListener('click', () => groupSelectModal.classList.add('hidden'));
    if (createGroupBtn) createGroupBtn.addEventListener('click', handleCreateGroup);

    const chatSettingBgInput = document.getElementById('chat-setting-bg');
    if (chatSettingBgInput) chatSettingBgInput.addEventListener('change', handleChatWallpaperUpload);

    const aiSettingBgInput = document.getElementById('chat-setting-ai-bg-input');
    const aiSettingBgContainer = document.getElementById('ai-setting-bg-container');
    if (aiSettingBgContainer && aiSettingBgInput) {
        aiSettingBgContainer.addEventListener('click', () => aiSettingBgInput.click());
        aiSettingBgInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    aiSettingBgContainer.style.backgroundImage = `url(${event.target.result})`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const userSettingBgInput = document.getElementById('chat-setting-user-bg-input');
    const userSettingBgContainer = document.getElementById('user-setting-bg-container');
    if (userSettingBgContainer && userSettingBgInput) {
        userSettingBgContainer.addEventListener('click', () => userSettingBgInput.click());
        userSettingBgInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    userSettingBgContainer.style.backgroundImage = `url(${event.target.result})`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const chatSettingAvatarInput = document.getElementById('chat-setting-avatar');
    if (chatSettingAvatarInput) {
        chatSettingAvatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('chat-setting-avatar-preview').src = event.target.result;
                    if (window.syncChatSettingsEditorialHeader) {
                        window.syncChatSettingsEditorialHeader();
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    const novelaiReferenceImageInput = document.getElementById('chat-setting-novelai-reference-image');
    const novelaiReferencePreview = document.getElementById('chat-setting-novelai-reference-preview');
    const novelaiReferencePlaceholder = document.getElementById('chat-setting-novelai-reference-placeholder');
    const novelaiReferenceCount = document.getElementById('chat-setting-novelai-reference-count');
    const novelaiReferenceClearBtn = document.getElementById('chat-setting-novelai-reference-clear');

    const thoughtStyleSelect = document.getElementById('chat-setting-thought-style');
    const thoughtPetPanel = document.getElementById('chat-setting-thought-pet-panel');
    const thoughtPetImageInput = document.getElementById('chat-setting-thought-pet-image');
    const thoughtPetPreview = document.getElementById('chat-setting-thought-pet-preview');
    const thoughtPetSizeSlider = document.getElementById('chat-setting-thought-pet-size');
    const thoughtPetSizeValue = document.getElementById('chat-setting-thought-pet-size-value');
    const restWindowEnabledInput = document.getElementById('chat-setting-rest-window-enabled');
    const bilingualTranslationEnabledInput = document.getElementById('chat-setting-bilingual-translation-enabled');
    const bilingualSourceLangSelect = document.getElementById('chat-setting-bilingual-source-lang');
    const bilingualTargetLangSelect = document.getElementById('chat-setting-bilingual-target-lang');
    const appearancePresetInput = document.getElementById('chat-setting-appearance-preset');
    const topbarAvatarVisibleInput = document.getElementById('chat-setting-topbar-avatar-visible');
    const topbarAvatarPositionSelect = document.getElementById('chat-setting-topbar-avatar-position');
    const topbarStatusVisibleInput = document.getElementById('chat-setting-topbar-status-visible');
    const topbarStatusSourceSelect = document.getElementById('chat-setting-topbar-status-source');
    const topbarStatusTextInput = document.getElementById('chat-setting-topbar-status-text');

    const syncThoughtPetPreviewSize = () => {
        const rawSize = thoughtPetSizeSlider ? parseInt(thoughtPetSizeSlider.value, 10) : 88;
        const size = Number.isFinite(rawSize) ? Math.max(52, Math.min(140, rawSize)) : 88;
        if (thoughtPetSizeValue) thoughtPetSizeValue.textContent = `${size}px`;
        if (thoughtPetPreview) {
            const previewSize = Math.max(44, Math.min(76, Math.round(size * 0.64)));
            thoughtPetPreview.style.width = `${previewSize}px`;
            thoughtPetPreview.style.height = `${previewSize}px`;
        }
    };

    const syncThoughtPetPanelVisibility = () => {
        if (!thoughtPetPanel || !thoughtStyleSelect) return;
        thoughtPetPanel.style.display = thoughtStyleSelect.value === 'desktop-pet' ? '' : 'none';
    };

    if (thoughtStyleSelect) {
        thoughtStyleSelect.addEventListener('change', () => {
            syncThoughtPetPanelVisibility();
        });
    }

    if (thoughtPetSizeSlider) {
        thoughtPetSizeSlider.addEventListener('input', () => {
            syncThoughtPetPreviewSize();
        });
    }

    if (thoughtPetImageInput) {
        thoughtPetImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) {
                if (thoughtPetPreview && !thoughtPetPreview.src) {
                    thoughtPetPreview.src = window.DEFAULT_THOUGHT_PET_IMAGE || '';
                }
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                if (thoughtPetPreview) thoughtPetPreview.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    if (restWindowEnabledInput && typeof window.syncRestWindowSettingsVisibility === 'function') {
        restWindowEnabledInput.addEventListener('change', () => {
            window.syncRestWindowSettingsVisibility();
        });
    }
    const markChatSettingsDirty = () => {
        if (typeof window.setChatSettingsFloatingSaveState === 'function') {
            window.setChatSettingsFloatingSaveState(false);
        }
    };
    if (novelaiReferenceImageInput) {
        novelaiReferenceImageInput.addEventListener('change', (e) => {
            const files = e.target.files ? Array.from(e.target.files) : [];
            const file = files[0] || null;
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                if (novelaiReferencePreview) {
                    novelaiReferencePreview.src = event.target.result;
                    novelaiReferencePreview.style.display = 'block';
                }
                if (novelaiReferencePlaceholder) {
                    novelaiReferencePlaceholder.style.display = 'none';
                }
                if (novelaiReferenceClearBtn) {
                    novelaiReferenceClearBtn.dataset.cleared = '0';
                    novelaiReferenceClearBtn.style.display = 'inline-flex';
                }
                if (novelaiReferenceCount) {
                    novelaiReferenceCount.textContent = files.length > 4
                        ? `已选择 ${files.length} 张（将使用前4张）`
                        : (files.length > 0 ? `已选择 ${files.length} 张` : '未选择');
                }
                markChatSettingsDirty();
            };
            reader.readAsDataURL(file);
        });
    }
    if (novelaiReferenceClearBtn) {
        novelaiReferenceClearBtn.addEventListener('click', () => {
            if (novelaiReferenceImageInput) {
                novelaiReferenceImageInput.value = '';
            }
            if (novelaiReferencePreview) {
                novelaiReferencePreview.src = '';
                novelaiReferencePreview.style.display = 'none';
            }
            if (novelaiReferencePlaceholder) {
                novelaiReferencePlaceholder.style.display = 'block';
            }
            if (novelaiReferenceCount) {
                novelaiReferenceCount.textContent = '未选择';
            }
            novelaiReferenceClearBtn.dataset.cleared = '1';
            novelaiReferenceClearBtn.style.display = 'none';
            markChatSettingsDirty();
        });
    }
    if (bilingualTranslationEnabledInput) {
        bilingualTranslationEnabledInput.addEventListener('change', () => {
            if (typeof window.syncBilingualTranslationSettingsVisibility === 'function') {
                window.syncBilingualTranslationSettingsVisibility();
            }
            markChatSettingsDirty();
        });
    }
    if (bilingualSourceLangSelect) {
        bilingualSourceLangSelect.addEventListener('change', () => {
            markChatSettingsDirty();
        });
    }
    if (bilingualTargetLangSelect) {
        bilingualTargetLangSelect.addEventListener('change', () => {
            markChatSettingsDirty();
        });
    }
    if (appearancePresetInput) {
        appearancePresetInput.addEventListener('change', () => {
            if (typeof window.syncChatAppearancePresetDeleteButton === 'function') {
                window.syncChatAppearancePresetDeleteButton();
            }
            markChatSettingsDirty();
        });
    }
    if (topbarAvatarVisibleInput) {
        topbarAvatarVisibleInput.addEventListener('change', () => {
            if (typeof window.syncChatTopbarAvatarSettingsVisibility === 'function') {
                window.syncChatTopbarAvatarSettingsVisibility();
            }
            markChatSettingsDirty();
        });
    }
    if (topbarAvatarPositionSelect) {
        topbarAvatarPositionSelect.addEventListener('change', () => {
            if (typeof window.syncChatTopbarAvatarSettingsVisibility === 'function') {
                window.syncChatTopbarAvatarSettingsVisibility();
            }
            markChatSettingsDirty();
        });
    }
    if (topbarStatusVisibleInput) {
        topbarStatusVisibleInput.addEventListener('change', () => {
            if (typeof window.syncChatTopbarAvatarSettingsVisibility === 'function') {
                window.syncChatTopbarAvatarSettingsVisibility();
            }
            markChatSettingsDirty();
        });
    }
    if (topbarStatusSourceSelect) {
        topbarStatusSourceSelect.addEventListener('change', () => {
            if (typeof window.syncChatTopbarAvatarSettingsVisibility === 'function') {
                window.syncChatTopbarAvatarSettingsVisibility();
            }
            markChatSettingsDirty();
        });
    }
    if (topbarStatusTextInput) {
        topbarStatusTextInput.addEventListener('input', () => {
            markChatSettingsDirty();
        });
    }
    syncThoughtPetPanelVisibility();
    syncThoughtPetPreviewSize();
    if (typeof window.syncBilingualTranslationSettingsVisibility === 'function') {
        window.syncBilingualTranslationSettingsVisibility();
    }
    if (typeof window.syncChatTopbarAvatarSettingsVisibility === 'function') {
        window.syncChatTopbarAvatarSettingsVisibility();
    }
    if (thoughtPetPreview && !thoughtPetPreview.src) {
        thoughtPetPreview.src = window.DEFAULT_THOUGHT_PET_IMAGE || '';
    }

    const chatSettingVideoBgInput = document.getElementById('chat-setting-video-bg');
    if (chatSettingVideoBgInput) {
        chatSettingVideoBgInput.addEventListener('change', handleVideoCallBgUpload);
    }
    
    const resetChatBgBtn = document.getElementById('reset-chat-bg');
    if (resetChatBgBtn) {
        resetChatBgBtn.addEventListener('click', () => {
            window.iphoneSimState.tempSelectedChatBg = '';
            renderChatWallpaperGallery();
        if (typeof previewSelectedChatWallpaper === 'function') previewSelectedChatWallpaper();
        });
    }

    const chatSettingsScreenEl = document.getElementById('chat-settings-screen');
    const chatSettingTabs = chatSettingsScreenEl
        ? chatSettingsScreenEl.querySelectorAll('.chat-settings-nav .nav-item[data-tab]')
        : [];
    const chatSettingIndicator = chatSettingsScreenEl
        ? chatSettingsScreenEl.querySelector('.chat-settings-nav .nav-indicator')
        : null;
    
    chatSettingTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            if (tab.classList.contains('active')) return;

            const currentContent = chatSettingsScreenEl
                ? chatSettingsScreenEl.querySelector('.chat-setting-tab-content.active')
                : null;
            const tabName = tab.dataset.tab;
            const nextContent = chatSettingsScreenEl
                ? chatSettingsScreenEl.querySelector(`#chat-setting-tab-${tabName}`)
                : null;

            chatSettingTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            if (chatSettingIndicator && typeof window.syncChatSettingsNavIndicator === 'function') {
                window.syncChatSettingsNavIndicator(tab);
            }

            if (currentContent) {
                currentContent.classList.add('fade-out');
                setTimeout(() => {
                    currentContent.classList.remove('active');
                    currentContent.classList.remove('fade-out');
                    
                    if (nextContent) {
                        nextContent.style.opacity = '0';
                        nextContent.classList.add('active');
                        void nextContent.offsetWidth;
                        nextContent.style.opacity = '1';
                    }
                }, 150);
            } else {
                if (nextContent) {
                    nextContent.style.opacity = '0';
                    nextContent.classList.add('active');
                    void nextContent.offsetWidth;
                    nextContent.style.opacity = '1';
                }
            }
        });
    });

    const chatTitle = document.getElementById('chat-title');
    const chatTopbarAvatarMain = document.getElementById('chat-topbar-avatar-main');
    const chatTopbarAvatarRight = document.getElementById('chat-topbar-avatar-right');
    if (chatTitle) {
        chatTitle.addEventListener('click', (e) => {
            e.stopPropagation();
            const contactId = window.iphoneSimState.currentChatContactId;
            const contact = (window.iphoneSimState.contacts || []).find(c => c.id === contactId);
            const mode = contact && contact.thoughtDisplayMode === 'desktop-pet' ? 'desktop-pet' : 'title';
            if (mode === 'title') {
                toggleThoughtBubble();
            }
        });
    }
    
    document.addEventListener('click', (e) => {
        const titleBubble = document.getElementById('thought-bubble');
        const pet = document.getElementById('thought-pet');
        const petBubble = document.getElementById('thought-pet-bubble');
        const inTitle = chatTitle && (e.target === chatTitle || chatTitle.contains(e.target));
        const inTitleBubble = titleBubble && titleBubble.contains(e.target);
        const inPet = pet && pet.contains(e.target);
        const inPetBubble = petBubble && petBubble.contains(e.target);

        if (!inTitle && !inTitleBubble && !inPet && !inPetBubble) {
            if (typeof window.hideThoughtOverlays === 'function') {
                window.hideThoughtOverlays();
            } else if (titleBubble) {
                titleBubble.classList.add('hidden');
            }
        }
    });

    if (!window.__thoughtPetResizeBound) {
        window.__thoughtPetResizeBound = true;
        window.addEventListener('resize', () => {
            if (typeof window.renderThoughtEntryUI === 'function') {
                window.renderThoughtEntryUI(window.iphoneSimState.currentChatContactId);
            }
        });
    }

    const aiProfileScreen = document.getElementById('ai-profile-screen');
    const closeAiProfileBtn = document.getElementById('close-ai-profile');
    const aiProfileRegenerateBtn = document.getElementById('ai-profile-regenerate-trigger');
    const aiProfileMoreBtn = document.getElementById('ai-profile-more');
    const aiProfileMenuTrigger = document.getElementById('ai-profile-menu-trigger');
    const aiProfileSendMsgBtn = document.getElementById('ai-profile-send-msg');
    const aiProfileChatShortcutBtn = document.getElementById('ai-profile-chat-shortcut');
    const aiProfileBgInput = document.getElementById('ai-profile-bg-input');
    const aiProfileBg = document.getElementById('ai-profile-bg');
    const aiRelationItem = document.getElementById('ai-relation-item');

    const currentAiProfileSendMsgBtn = document.getElementById('ai-profile-send-msg');
    if (currentAiProfileSendMsgBtn) {
        const newBtn = currentAiProfileSendMsgBtn.cloneNode(true);
        currentAiProfileSendMsgBtn.parentNode.replaceChild(newBtn, currentAiProfileSendMsgBtn);
        
        newBtn.addEventListener('click', () => {
            const contactId = window.iphoneSimState.currentAiProfileContactId || window.iphoneSimState.currentChatContactId;
            openMeetingsScreen(contactId);
        });
    }

    const relationSelectModal = document.getElementById('relation-select-modal');
    const closeRelationSelectBtn = document.getElementById('close-relation-select');
    const aiProfileCustomizeModal = document.getElementById('ai-profile-customize-modal');
    const closeAiProfileCustomizeBtn = document.getElementById('close-ai-profile-customize');
    const aiProfileCustomizeCancelBtn = document.getElementById('ai-profile-customize-cancel');
    const aiProfileCustomizeSaveBtn = document.getElementById('ai-profile-customize-save');
    const aiVlogEntry = document.getElementById('ai-vlog-entry');
    const aiOotdEntry = document.getElementById('ai-ootd-entry');
    const aiLootEntry = document.getElementById('ai-loot-entry');
    const aiMomentsEntry = document.getElementById('ai-moments-entry');
    const aiMomentsPreview = document.getElementById('ai-moments-preview');
    const chatVlogModal = document.getElementById('chat-vlog-modal');
    const chatVlogCard = document.getElementById('chat-vlog-card');
    const closeChatVlogBtn = document.getElementById('close-chat-vlog');
    const chatVlogRefreshBtn = document.getElementById('chat-vlog-refresh-btn');
    const chatOotdModal = document.getElementById('chat-ootd-modal');
    const chatOotdCard = document.getElementById('chat-ootd-card');
    const closeChatOotdBtn = document.getElementById('close-chat-ootd');
    const chatOotdRefreshBtn = document.getElementById('chat-ootd-refresh-btn');
    const chatLootModal = document.getElementById('chat-loot-modal');
    const chatLootCard = document.getElementById('chat-loot-card');
    const closeChatLootBtn = document.getElementById('close-chat-loot');
    const chatLootRefreshBtn = document.getElementById('chat-loot-refresh-btn');
    const chatOotdFingerprintBox = document.getElementById('chat-ootd-fingerprint-box');
    const chatOotdBarcodeScanner = document.getElementById('chat-ootd-barcode-scanner');
    const chatOotdV5TearLine = document.getElementById('chat-ootd-v5-tear-line');
    const chatOotdV5Bottom = document.getElementById('chat-ootd-v5-bottom');

    if (closeAiProfileBtn) {
        closeAiProfileBtn.addEventListener('click', () => {
            aiProfileScreen.classList.add('hidden');
            window.iphoneSimState.currentAiProfileContactId = null;
        });
    }
    if (aiProfileChatShortcutBtn) {
        aiProfileChatShortcutBtn.addEventListener('click', () => {
            aiProfileScreen.classList.add('hidden');
            window.iphoneSimState.currentAiProfileContactId = null;
        });
    }
    if (aiProfileMoreBtn) aiProfileMoreBtn.addEventListener('click', openAiProfileCustomizeModal);
    if (aiProfileRegenerateBtn) {
        aiProfileRegenerateBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const contactId = window.iphoneSimState
                ? (window.iphoneSimState.currentAiProfileContactId || window.iphoneSimState.currentChatContactId)
                : null;
            if (typeof window.regenerateAiProfileCard === 'function') {
                await window.regenerateAiProfileCard(contactId);
            }
        });
    }
    if (aiProfileMenuTrigger) {
        aiProfileMenuTrigger.addEventListener('click', (event) => {
            event.preventDefault();
            openAiProfileCustomizeModal();
        });
    }


    if (aiProfileBg) aiProfileBg.addEventListener('click', () => aiProfileBgInput.click());
    if (aiProfileBgInput) aiProfileBgInput.addEventListener('change', handleAiProfileBgUpload);
    
    if (aiRelationItem) aiRelationItem.addEventListener('click', openRelationSelect);
    if (closeRelationSelectBtn) closeRelationSelectBtn.addEventListener('click', () => {
        window.__relationSelectContext = null;
        relationSelectModal.classList.add('hidden');
    });
    bindAiProfileCustomizeUploadActions();
    if (closeAiProfileCustomizeBtn) {
        closeAiProfileCustomizeBtn.addEventListener('click', closeAiProfileCustomizeModal);
    }
    if (aiProfileCustomizeCancelBtn) {
        aiProfileCustomizeCancelBtn.addEventListener('click', closeAiProfileCustomizeModal);
    }
    if (aiProfileCustomizeSaveBtn) {
        aiProfileCustomizeSaveBtn.addEventListener('click', saveAiProfileCustomizeDraft);
    }
    if (aiProfileCustomizeModal) {
        aiProfileCustomizeModal.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeAiProfileCustomizeModal();
            }
        });
    }
    
    const openAiMomentsFromProfile = (event = null) => {
        if (event) event.preventDefault();
        if (typeof window.openAiMoments === 'function') {
            window.openAiMoments();
        }
    };

    if (aiMomentsEntry) {
        aiMomentsEntry.addEventListener('click', openAiMomentsFromProfile);
        aiMomentsEntry.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                openAiMomentsFromProfile(event);
            }
        });
    }
    if (aiMomentsPreview) {
        aiMomentsPreview.addEventListener('click', (event) => {
            event.stopPropagation();
            openAiMomentsFromProfile(event);
        });
    }

    const openAiVlogFromProfile = async (event = null) => {
        if (event) event.preventDefault();
        const contactId = window.iphoneSimState
            ? (window.iphoneSimState.currentAiProfileContactId || window.iphoneSimState.currentChatContactId)
            : null;
        await openChatVlogModal(contactId);
    };

    if (aiVlogEntry) {
        aiVlogEntry.addEventListener('click', openAiVlogFromProfile);
        aiVlogEntry.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                openAiVlogFromProfile(event);
            }
        });
    }

    const openAiOotdFromProfile = async (event = null) => {
        if (event) event.preventDefault();
        const contactId = window.iphoneSimState
            ? (window.iphoneSimState.currentAiProfileContactId || window.iphoneSimState.currentChatContactId)
            : null;
        await openChatOotdModal(contactId);
    };

    if (aiOotdEntry) {
        aiOotdEntry.addEventListener('click', openAiOotdFromProfile);
        aiOotdEntry.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                openAiOotdFromProfile(event);
            }
        });
    }

    const openAiLootFromProfile = async (event = null) => {
        if (event) event.preventDefault();
        const contactId = window.iphoneSimState
            ? (window.iphoneSimState.currentAiProfileContactId || window.iphoneSimState.currentChatContactId)
            : null;
        await openChatLootModal(contactId);
    };

    if (aiLootEntry) {
        aiLootEntry.addEventListener('click', openAiLootFromProfile);
        aiLootEntry.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                openAiLootFromProfile(event);
            }
        });
    }

    if (closeChatVlogBtn) {
        closeChatVlogBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            closeChatVlogModalUi();
        });
    }
    if (chatVlogRefreshBtn) {
        chatVlogRefreshBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const contactId = window.iphoneSimState
                ? (window.iphoneSimState.currentAiProfileContactId || window.iphoneSimState.currentChatContactId)
                : null;
            await openChatVlogModal(contactId, { forceRefresh: true });
        });
    }
    if (chatVlogModal) {
        chatVlogModal.addEventListener('click', (event) => {
            if (event.target === chatVlogModal) {
                closeChatVlogModalUi();
            }
        });
    }
    if (chatVlogCard) {
        chatVlogCard.addEventListener('click', (event) => {
            event.stopPropagation();
            if (chatVlogCard.classList.contains('chat-vlog-card-v2') && !chatVlogCard.classList.contains('is-loading')) {
                pulseChatVlogV2FooterStatus();
            }
        });
    }

    if (closeChatOotdBtn) {
        closeChatOotdBtn.addEventListener('click', (event) => {
            event.preventDefault();
            closeChatOotdModalUi();
        });
    }
    if (chatOotdRefreshBtn) {
        chatOotdRefreshBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const contactId = window.iphoneSimState
                ? (window.iphoneSimState.currentAiProfileContactId || window.iphoneSimState.currentChatContactId)
                : null;
            await openChatOotdModal(contactId, { forceRefresh: true });
        });
    }
    if (chatOotdModal) {
        chatOotdModal.addEventListener('click', (event) => {
            if (event.target === chatOotdModal) {
                closeChatOotdModalUi();
            }
        });
    }
    if (chatOotdCard) {
        chatOotdCard.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }
    if (closeChatLootBtn) {
        closeChatLootBtn.addEventListener('click', (event) => {
            event.preventDefault();
            closeChatLootModalUi();
        });
    }
    if (chatLootRefreshBtn) {
        chatLootRefreshBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const contactId = window.iphoneSimState
                ? (window.iphoneSimState.currentAiProfileContactId || window.iphoneSimState.currentChatContactId)
                : null;
            await openChatLootModal(contactId, { forceRefresh: true });
        });
    }
    if (chatLootModal) {
        chatLootModal.addEventListener('click', (event) => {
            if (event.target === chatLootModal) {
                closeChatLootModalUi();
            }
        });
    }
    if (chatLootCard) {
        chatLootCard.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }
    if (chatOotdFingerprintBox) {
        chatOotdFingerprintBox.addEventListener('click', scanChatOotdFingerprint);
        chatOotdFingerprintBox.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                scanChatOotdFingerprint();
            }
        });
    }
    if (chatOotdBarcodeScanner) {
        chatOotdBarcodeScanner.addEventListener('click', scanChatOotdBarcode);
        chatOotdBarcodeScanner.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                scanChatOotdBarcode();
            }
        });
    }
    if (chatOotdV5TearLine) {
        chatOotdV5TearLine.addEventListener('click', (event) => {
            event.preventDefault();
            tearChatOotdV5Tag();
        });
        chatOotdV5TearLine.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                tearChatOotdV5Tag();
            }
        });
    }
    if (chatOotdV5Bottom) {
        chatOotdV5Bottom.addEventListener('click', (event) => {
            event.preventDefault();
            flipChatOotdV5Tag();
        });
        chatOotdV5Bottom.addEventListener('pointerdown', (event) => {
            startChatOotdV5Drag(event);
        });
        chatOotdV5Bottom.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                flipChatOotdV5Tag();
            }
        });
    }
    if (!window.__chatOotdV5DragPointerBound) {
        window.__chatOotdV5DragPointerBound = true;
        document.addEventListener('pointermove', moveChatOotdV5Drag, { passive: false });
        document.addEventListener('pointerup', endChatOotdV5Drag);
        document.addEventListener('pointercancel', endChatOotdV5Drag);
    }

    if (chatSettingsBtn) chatSettingsBtn.addEventListener('click', openChatSettings);
    if (closeChatSettingsBtn) closeChatSettingsBtn.addEventListener('click', () => { chatSettingsScreen.classList.add('hidden'); if (window.setChatSettingsFloatingSaveVisible) window.setChatSettingsFloatingSaveVisible(false); });
    if (saveChatSettingsBtn) saveChatSettingsBtn.addEventListener('click', handleSaveChatSettings);
    if (triggerAiMomentBtn) triggerAiMomentBtn.addEventListener('click', () => generateAiMoment(false));

    const clearChatHistoryBtn = document.getElementById('clear-chat-history-btn');
    if (clearChatHistoryBtn) clearChatHistoryBtn.addEventListener('click', handleClearChatHistory);

    const toggleWechatBlockBtn = document.getElementById('toggle-wechat-block-btn');
    if (toggleWechatBlockBtn) toggleWechatBlockBtn.addEventListener('click', handleToggleWechatBlockStatus);

    const wechatBlockConfirmModal = document.getElementById('wechat-block-confirm-modal');
    const closeWechatBlockConfirmBtn = document.getElementById('close-wechat-block-confirm');
    const cancelWechatBlockConfirmBtn = document.getElementById('cancel-wechat-block-confirm');
    const confirmWechatBlockConfirmBtn = document.getElementById('confirm-wechat-block-confirm');
    if (closeWechatBlockConfirmBtn && window.closeWechatBlockConfirmModal) {
        closeWechatBlockConfirmBtn.addEventListener('click', window.closeWechatBlockConfirmModal);
    }
    if (cancelWechatBlockConfirmBtn && window.closeWechatBlockConfirmModal) {
        cancelWechatBlockConfirmBtn.addEventListener('click', window.closeWechatBlockConfirmModal);
    }
    if (confirmWechatBlockConfirmBtn && window.confirmWechatBlockFromSettings) {
        confirmWechatBlockConfirmBtn.addEventListener('click', window.confirmWechatBlockFromSettings);
    }
    if (wechatBlockConfirmModal && window.closeWechatBlockConfirmModal) {
        wechatBlockConfirmModal.addEventListener('click', (event) => {
            if (event.target === wechatBlockConfirmModal) {
                window.closeWechatBlockConfirmModal();
            }
        });
    }

    const wechatUnblockBtn = document.getElementById('wechat-unblock-btn');
    if (wechatUnblockBtn) wechatUnblockBtn.addEventListener('click', handleWechatUnblockFromChat);

    const exportCharBtn = document.getElementById('export-character-btn');
    if (exportCharBtn) exportCharBtn.addEventListener('click', handleExportCharacterData);

    const importCharInput = document.getElementById('import-character-input');
    if (importCharInput) importCharInput.addEventListener('change', handleImportCharacterData);

    const chatInput = document.getElementById('chat-input');
    const triggerAiReplyBtn = document.getElementById('trigger-ai-reply-btn');

    if (chatInput) {
        chatInput.addEventListener('input', () => {
            const contact = getCurrentChatContactForStickerSuggestion();
            if (!contact || !isStickerSuggestionEnabledForContact(contact)) {
                hideChatStickerSuggestionBar();
                return;
            }
            renderChatStickerSuggestionBar(contact, chatInput.value || '');
        });

        chatInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const text = chatInput.value.trim();
                if (text) {
                    const sentMsg = sendMessage(text, true);
                    if (sentMsg) {
                        const currentContactId = window.iphoneSimState.currentChatContactId;
                        const currentContact = (window.iphoneSimState.contacts || []).find(c => c.id === currentContactId);
                        chatInput.value = '';
                        if (getChatRouteAssistState(currentContactId) && typeof window.showChatToast === 'function') {
                            window.showChatToast('已发送，点右侧 AI 按钮规划路线', 2200);
                        } else if (getChatFoodAssistState(currentContactId) && typeof window.showChatToast === 'function') {
                            window.showChatToast('已发送，点右侧 AI 按钮获取推荐', 2200);
                        }

                        if (
                            currentContact
                            && typeof window.getContactRestWindowStatus === 'function'
                            && window.getContactRestWindowStatus(currentContact).inRestWindow
                        ) {
                            await triggerCurrentChatAiReply(null, { triggerSource: 'manual' });
                        }
                    }
                }
                hideChatStickerSuggestionBar();
            }
        });
    }
    if (chatTopbarAvatarMain) {
        chatTopbarAvatarMain.addEventListener('click', (e) => {
            e.stopPropagation();
            const contactId = window.iphoneSimState.currentChatContactId;
            if (contactId && typeof window.openAiProfile === 'function') {
                window.openAiProfile(contactId);
            }
        });
    }
    if (chatTopbarAvatarRight) {
        chatTopbarAvatarRight.addEventListener('click', (e) => {
            e.stopPropagation();
            openChatSettings();
        });
    }

    if (triggerAiReplyBtn) {
        triggerAiReplyBtn.addEventListener('click', async () => {
            hideChatStickerSuggestionBar();
            await triggerCurrentChatAiReply(chatInput, { triggerSource: 'manual' });
        });
    }

    const chatMoreBtn = document.getElementById('chat-more-btn');
    const chatMorePanel = document.getElementById('chat-more-panel');
    const stickerBtn = document.getElementById('sticker-btn');
    const stickerPanel = document.getElementById('sticker-panel');
    const chatInputArea = document.querySelector('.chat-input-area');
    const chatStickerSuggestionBar = document.getElementById('chat-sticker-suggestion-bar');
    
    // 分页相关元素
    const chatMorePages = document.getElementById('chat-more-pages');
    const chatMoreIndicators = document.querySelectorAll('.chat-more-dot');
    const GROUP_ONLY_MORE_ITEM_IDS = ['chat-more-red-packet-btn', 'chat-more-group-poll-btn', 'chat-more-group-relay-btn', 'chat-more-group-meeting-btn'];
    const DIRECT_ONLY_MORE_ITEM_IDS = [
        'chat-more-fire-buddy-btn',
        'chat-more-food-btn',
        'chat-more-nav-btn',
        'chat-more-screen-share-btn',
        'chat-more-location-btn'
    ];

    function refreshChatMoreFeatureVisibility() {
        const contactId = window.iphoneSimState.currentChatContactId;
        const currentContact = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts.find(item => String(item.id) === String(contactId)) || null
            : null;
        const isGroupChat = !!(currentContact && typeof window.isGroupChatContact === 'function' && window.isGroupChatContact(currentContact));

        GROUP_ONLY_MORE_ITEM_IDS.forEach((itemId) => {
            const itemEl = document.getElementById(itemId);
            if (!itemEl) return;
            itemEl.style.display = isGroupChat ? '' : 'none';
        });
        DIRECT_ONLY_MORE_ITEM_IDS.forEach((itemId) => {
            const itemEl = document.getElementById(itemId);
            if (!itemEl) return;
            itemEl.style.display = isGroupChat ? 'none' : '';
        });
    }

    window.refreshChatMoreFeatureVisibility = refreshChatMoreFeatureVisibility;
    refreshChatMoreFeatureVisibility();

    if (chatMorePages) {
        chatMorePages.addEventListener('scroll', () => {
            const pageIndex = Math.round(chatMorePages.scrollLeft / chatMorePages.clientWidth);
            chatMoreIndicators.forEach((dot, index) => {
                if (index === pageIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        });
    }
    
    function closeAllPanels() {
        if (chatMorePanel) chatMorePanel.classList.remove('slide-in');
        if (stickerPanel) stickerPanel.classList.remove('slide-in');
        if (chatInputArea) {
            chatInputArea.classList.remove('push-up');
            chatInputArea.classList.remove('push-up-more');
        }
        if (chatStickerSuggestionBar && (!chatInput || !chatInput.matches(':focus'))) {
            hideChatStickerSuggestionBar();
        }
    }

    if (chatMoreBtn && chatMorePanel) {
        chatMoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            refreshChatMoreFeatureVisibility();
            
            if (chatMorePanel.classList.contains('slide-in')) {
                closeAllPanels();
            } else {
                if (stickerPanel) stickerPanel.classList.remove('slide-in');
                chatMorePanel.classList.add('slide-in');
                // 重置到第一页
                if (chatMorePages) chatMorePages.scrollLeft = 0;
                
                if (chatInputArea) {
                    chatInputArea.classList.remove('push-up');
                    chatInputArea.classList.add('push-up-more');
                }
                scrollToBottom();
            }
        });

        chatMorePanel.querySelectorAll('.more-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // 让TA发消息
                if (item.id === 'chat-more-continue-btn') {
                    e.stopPropagation();
                    closeAllPanels();
                    generateAiReply("用户没有回复。请继续当前的对话，或者开启一个新的话题。你可以假设已经过了一段时间。", null, { triggerSource: 'manual' });
                    return;
                }

                // 如果是第二页的新按钮，也需要处理
                if (item.id === 'chat-more-games-btn') {
                    // 已在 js/games.js 中处理，这里只需关闭面板
                    closeAllPanels();
                    return;
                }

                if (item.id === 'chat-more-edit-msg-btn') {
                    e.stopPropagation();
                    closeAllPanels();
                    
                    if (!window.iphoneSimState.currentChatContactId) return;
                    
                    const jsonContent = getLastAiBlockJson(window.iphoneSimState.currentChatContactId);
                    
                    if (jsonContent) {
                        openEditBlockModal(jsonContent);
                    } else {
                        alert('没有找到AI发送的消息');
                    }
                    return;
                }

                if (item.id === 'chat-more-food-btn') {
                    e.stopPropagation();
                    closeAllPanels();
                    handleChatFoodAssistEntry(chatInput);
                    return;
                }
                if (item.id === 'chat-more-nav-btn') {
                    e.stopPropagation();
                    closeAllPanels();
                    openChatNavigationModal();
                    return;
                }
                if (item.id === 'chat-more-group-poll-btn') {
                    e.stopPropagation();
                    closeAllPanels();
                    openGroupPollComposer();
                    return;
                }
                if (item.id === 'chat-more-group-relay-btn') {
                    e.stopPropagation();
                    closeAllPanels();
                    openGroupRelayComposer();
                    return;
                }
                if (item.id === 'chat-more-group-meeting-btn') {
                    e.stopPropagation();
                    closeAllPanels();
                    const contactId = window.iphoneSimState && window.iphoneSimState.currentChatContactId;
                    if (contactId && typeof openMeetingsScreen === 'function') {
                        openMeetingsScreen(contactId);
                    }
                    return;
                }

                if (item.id === 'chat-more-photo-btn' || item.id === 'chat-more-camera-btn' || item.id === 'chat-more-transfer-btn' || item.id === 'chat-more-red-packet-btn' || item.id === 'chat-more-group-poll-btn' || item.id === 'chat-more-group-relay-btn' || item.id === 'chat-more-group-meeting-btn' || item.id === 'chat-more-memory-btn' || item.id === 'chat-more-location-btn' || item.id === 'chat-more-regenerate-btn' || item.id === 'chat-more-voice-btn' || item.id === 'chat-more-video-call-btn' || item.id === 'chat-more-screen-share-btn' || item.id === 'chat-more-fire-buddy-btn' || item.id === 'chat-more-food-btn' || item.id === 'chat-more-nav-btn') return;
                
                e.stopPropagation();
                const label = item.querySelector('.more-label').textContent;
                alert(`功能 "${label}" 开发中...`);
                closeAllPanels();
            });
        });
    }

    const chatMoreVoiceBtn = document.getElementById('chat-more-voice-btn');
    const voiceInputModal = document.getElementById('voice-input-modal');
    const closeVoiceInputBtn = document.getElementById('close-voice-input');
    
    if (chatMoreVoiceBtn) {
        chatMoreVoiceBtn.addEventListener('click', () => {
            document.getElementById('chat-more-panel').classList.add('hidden');
            const fakeText = document.getElementById('voice-fake-text');
            const realRes = document.getElementById('voice-real-result');
            const sendRealBtn = document.getElementById('send-real-voice-btn');
            
            if (fakeText) fakeText.value = '';
            if (realRes) realRes.textContent = '';
            if (sendRealBtn) sendRealBtn.disabled = true;
            
            if (typeof window.switchVoiceTab === 'function') {
                window.switchVoiceTab('fake');
            }
            
            voiceInputModal.classList.remove('hidden');
        });
    }

    if (closeVoiceInputBtn) {
        closeVoiceInputBtn.addEventListener('click', () => {
            voiceInputModal.classList.add('hidden');
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                isRecording = false;
                const micBtn = document.getElementById('voice-mic-btn');
                if (micBtn) micBtn.classList.remove('recording');
                const statusText = document.getElementById('voice-recording-status');
                if (statusText) {
                    statusText.textContent = '点击麦克风开始录音';
                    statusText.style.color = '#888';
                }
            }
        });
    }

    const sendFakeVoiceBtn = document.getElementById('send-fake-voice-btn');
    const voiceFakeDuration = document.getElementById('voice-fake-duration');
    
    if (voiceFakeDuration) {
        voiceFakeDuration.addEventListener('input', (e) => {
            const valSpan = document.getElementById('voice-fake-duration-val');
            if (valSpan) valSpan.textContent = e.target.value;
        });
    }

    if (sendFakeVoiceBtn) {
        const newBtn = sendFakeVoiceBtn.cloneNode(true);
        sendFakeVoiceBtn.parentNode.replaceChild(newBtn, sendFakeVoiceBtn);
        
        newBtn.addEventListener('click', handleSendFakeVoice);
    }

    const voiceMicBtn = document.getElementById('voice-mic-btn');
    const sendRealVoiceBtn = document.getElementById('send-real-voice-btn');

    if (voiceMicBtn) {
        const newMicBtn = voiceMicBtn.cloneNode(true);
        voiceMicBtn.parentNode.replaceChild(newMicBtn, voiceMicBtn);
        
        newMicBtn.addEventListener('click', toggleVoiceRecording);
    }

    if (sendRealVoiceBtn) {
        const newSendRealBtn = sendRealVoiceBtn.cloneNode(true);
        sendRealVoiceBtn.parentNode.replaceChild(newSendRealBtn, sendRealVoiceBtn);

        newSendRealBtn.addEventListener('click', handleSendRealVoice);
    }

    window.switchVoiceTab = function(mode) {
        const fakeTab = document.getElementById('tab-voice-fake');
        const realTab = document.getElementById('tab-voice-real');
        const fakeMode = document.getElementById('voice-mode-fake');
        const realMode = document.getElementById('voice-mode-real');
        const indicator = document.getElementById('voice-nav-indicator');

        if (mode === 'fake') {
            if(fakeTab) fakeTab.classList.add('active');
            if(realTab) realTab.classList.remove('active');
            if(fakeMode) fakeMode.classList.remove('hidden');
            if(realMode) realMode.classList.add('hidden');
            if(indicator) indicator.style.transform = 'translateX(0)';
        } else {
            if(fakeTab) fakeTab.classList.remove('active');
            if(realTab) realTab.classList.add('active');
            if(fakeMode) fakeMode.classList.add('hidden');
            if(realMode) realMode.classList.remove('hidden');
            if(indicator) indicator.style.transform = 'translateX(100%)';
        }
    };

    document.addEventListener('click', (e) => {
        const chatInputArea = document.querySelector('.chat-input-area');
        
        if (chatMorePanel && chatMorePanel.classList.contains('slide-in') && 
            !chatMorePanel.contains(e.target) && 
            !chatMoreBtn.contains(e.target)) {
            chatMorePanel.classList.remove('slide-in');
            if (chatInputArea) chatInputArea.classList.remove('push-up-more');
        }
        
        const currentStickerBtn = document.getElementById('sticker-btn');
        if (stickerPanel && stickerPanel.classList.contains('slide-in') && 
            !stickerPanel.contains(e.target) && 
            (currentStickerBtn ? !currentStickerBtn.contains(e.target) : true)) {
            stickerPanel.classList.remove('slide-in');
            if (chatInputArea) chatInputArea.classList.remove('push-up');
        }
    });

    if (chatInput) {
        chatInput.addEventListener('focus', () => {
            const chatInputArea = document.querySelector('.chat-input-area');
            if (chatMorePanel) chatMorePanel.classList.remove('slide-in');
            if (stickerPanel) stickerPanel.classList.remove('slide-in');
            if (chatInputArea) {
                chatInputArea.classList.remove('push-up');
                chatInputArea.classList.remove('push-up-more');
            }
            refreshChatStickerSuggestionBarForCurrentInput();
        });
        chatInput.addEventListener('blur', () => {
            setTimeout(() => {
                const active = document.activeElement;
                if (active && active.closest && active.closest('#chat-sticker-suggestion-bar')) return;
                hideChatStickerSuggestionBar();
            }, 120);
        });
    }

    setupAiListeners(false);
    setupAiListeners(true);
    setupWhisperListeners();
    setupMinimaxListeners();

    const chatMorePhotoBtn = document.getElementById('chat-more-photo-btn');
    const chatPhotoInput = document.getElementById('chat-photo-input');
    
    if (chatMorePhotoBtn && chatPhotoInput) {
        chatMorePhotoBtn.addEventListener('click', () => chatPhotoInput.click());
        chatPhotoInput.addEventListener('change', handleChatPhotoUpload);
    }

    const chatMoreCameraBtn = document.getElementById('chat-more-camera-btn');
    if (chatMoreCameraBtn) {
        chatMoreCameraBtn.addEventListener('click', handleChatCamera);
    }

    const chatMoreVideoCallBtn = document.getElementById('chat-more-video-call-btn');
    const videoCallModal = document.getElementById('video-call-modal');
    const startVoiceCallBtn = document.getElementById('start-voice-call-btn');
    const startVideoCallBtn = document.getElementById('start-video-call-btn');
    const cancelVideoCallBtn = document.getElementById('cancel-video-call-btn');

    if (chatMoreVideoCallBtn) {
        chatMoreVideoCallBtn.addEventListener('click', () => {
            document.getElementById('chat-more-panel').classList.add('hidden');
            videoCallModal.classList.remove('hidden');
        });
    }

    if (cancelVideoCallBtn) {
        cancelVideoCallBtn.addEventListener('click', () => {
            videoCallModal.classList.add('hidden');
        });
    }

    if (startVoiceCallBtn) {
        startVoiceCallBtn.addEventListener('click', () => {
            videoCallModal.classList.add('hidden');
            startOutgoingCall();
        });
    }

    if (startVideoCallBtn) {
        startVideoCallBtn.addEventListener('click', () => {
            videoCallModal.classList.add('hidden');
            startOutgoingVideoCall();
        });
    }

    const voiceCallAcceptBtn = document.getElementById('voice-call-accept-btn');
    const voiceCallRejectBtn = document.getElementById('voice-call-reject-btn');

    if (voiceCallAcceptBtn) {
        const newBtn = voiceCallAcceptBtn.cloneNode(true);
        voiceCallAcceptBtn.parentNode.replaceChild(newBtn, voiceCallAcceptBtn);
        newBtn.addEventListener('click', acceptIncomingCall);
    }

    if (voiceCallRejectBtn) {
        const newBtn = voiceCallRejectBtn.cloneNode(true);
        voiceCallRejectBtn.parentNode.replaceChild(newBtn, voiceCallRejectBtn);
        newBtn.addEventListener('click', rejectIncomingCall);
    }

    const chatMoreMemoryBtn = document.getElementById('chat-more-memory-btn');
    if (chatMoreMemoryBtn) {
        chatMoreMemoryBtn.addEventListener('click', () => {
            if (window.openMemoryApp) window.openMemoryApp();
            document.getElementById('chat-more-panel').classList.add('hidden');
        });
    }

    const chatMoreLocationBtn = document.getElementById('chat-more-location-btn');
    if (chatMoreLocationBtn) {
        chatMoreLocationBtn.addEventListener('click', () => {
            if (window.openLocationApp) window.openLocationApp();
        });
    }

    const chatMoreTransferBtn = document.getElementById('chat-more-transfer-btn');
    const transferModal = document.getElementById('transfer-modal');
    const closeTransferBtn = document.getElementById('close-transfer-modal');
    const doTransferBtn = document.getElementById('do-transfer-btn');

    if (chatMoreTransferBtn) {
        chatMoreTransferBtn.addEventListener('click', () => {
            document.getElementById('transfer-amount').value = '';
            document.getElementById('transfer-remark').value = '';
            transferModal.classList.remove('hidden');
            document.getElementById('chat-more-panel').classList.add('hidden');
        });
    }

    if (closeTransferBtn) {
        closeTransferBtn.addEventListener('click', () => transferModal.classList.add('hidden'));
    }

    if (doTransferBtn) {
        doTransferBtn.addEventListener('click', handleTransfer);
    }

    const chatMoreRedPacketBtn = document.getElementById('chat-more-red-packet-btn');
    const groupRedPacketModal = document.getElementById('group-red-packet-modal');
    const closeGroupRedPacketBtn = document.getElementById('close-group-red-packet-modal');
    const doGroupRedPacketBtn = document.getElementById('do-group-red-packet-btn');
    const groupRedPacketModeSelect = document.getElementById('group-red-packet-mode');
    const groupRedPacketAmountInput = document.getElementById('group-red-packet-amount');
    const groupRedPacketRemarkInput = document.getElementById('group-red-packet-remark');
    const groupRedPacketTargetedGroup = document.getElementById('group-red-packet-targeted-group');
    const groupRedPacketRandomGroup = document.getElementById('group-red-packet-random-group');
    const groupRedPacketCountInput = document.getElementById('group-red-packet-random-count');
    const groupRedPacketSelectMembersBtn = document.getElementById('group-red-packet-select-members-btn');
    const groupRedPacketSelectedMembers = document.getElementById('group-red-packet-selected-members');

    const groupRedPacketState = {
        selectedTargetIds: []
    };

    function getCurrentGroupContactForRedPacket() {
        const contactId = window.iphoneSimState.currentChatContactId;
        if (!contactId || !Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)) return null;
        const contact = window.iphoneSimState.contacts.find(item => String(item.id) === String(contactId));
        if (!contact) return null;
        return (typeof window.isGroupChatContact === 'function' && window.isGroupChatContact(contact)) ? contact : null;
    }

    async function openGroupPollComposer() {
        const group = getCurrentGroupContactForRedPacket();
        if (!group) {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('仅群聊支持发起投票', 2000);
            }
            return;
        }
        if (typeof window.createGroupPoll !== 'function') {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('投票功能暂不可用', 2000);
            }
            return;
        }
        if (typeof window.openGroupActionEditorModal !== 'function') {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('弹窗组件未就绪，请刷新重试', 2000);
            }
            return;
        }

        const normalizePollOptions = (values) => {
            const source = Array.isArray(values) ? values : [];
            const deduped = [];
            const seen = new Set();
            source.forEach((option) => {
                const normalizedOption = String(option || '').replace(/\s+/g, ' ').trim();
                if (!normalizedOption) return;
                const key = normalizedOption.toLowerCase();
                if (seen.has(key)) return;
                seen.add(key);
                deduped.push(normalizedOption);
            });
            return deduped;
        };
        const parsePollOptionsFromRaw = (rawValue) => normalizePollOptions(
            String(rawValue || '')
                .split(/\n|[,，|｜]/g)
        );
        const pollComposerState = {
            readUiOptions: null,
            lastValidatedOptions: []
        };

        const modalResult = await window.openGroupActionEditorModal({
            kicker: 'GROUP POLL',
            title: '发起投票',
            subtitle: '请输入主题和选项',
            confirmText: '创建投票',
            cancelText: '取消',
            fields: [
                {
                    id: 'title',
                    type: 'text',
                    label: '投票主题',
                    placeholder: '例如：今晚吃什么',
                    maxLength: 64
                },
                {
                    id: 'options',
                    type: 'text',
                    label: '投票选项',
                    value: '',
                    hidden: true
                }
            ],
            onRendered: ({ fields }) => {
                if (!fields) return;
                const hiddenOptionsInput = fields.querySelector('[data-group-action-field="options"]');
                if (!hiddenOptionsInput) return;

                const builderWrap = document.createElement('div');
                builderWrap.className = 'group-poll-options-builder';
                const header = document.createElement('div');
                header.className = 'group-poll-options-header';
                header.textContent = '投票选项（点击按钮新增）';

                const list = document.createElement('div');
                list.className = 'group-poll-options-list';

                const addBtn = document.createElement('button');
                addBtn.type = 'button';
                addBtn.className = 'group-poll-option-add-btn';
                addBtn.textContent = '+ 新增选项';

                const hint = document.createElement('div');
                hint.className = 'group-poll-options-hint';
                hint.textContent = '至少保留 2 个选项，支持随时修改顺序编号。';

                builderWrap.appendChild(header);
                builderWrap.appendChild(list);
                builderWrap.appendChild(addBtn);
                builderWrap.appendChild(hint);
                fields.appendChild(builderWrap);

                const rowItems = [];
                const normalizeRowValue = (value) => String(value || '').replace(/\s+/g, ' ').trim();
                const readRowOptions = () => normalizePollOptions(
                    rowItems.map(item => normalizeRowValue(item.input && item.input.value))
                );
                pollComposerState.readUiOptions = readRowOptions;
                const updateHiddenValue = () => {
                    hiddenOptionsInput.value = readRowOptions().join('\n');
                };
                const updateRowsMeta = () => {
                    rowItems.forEach((item, index) => {
                        if (item.indexNode) item.indexNode.textContent = String(index + 1);
                        const disableRemove = rowItems.length <= 2;
                        if (item.removeBtn) {
                            item.removeBtn.disabled = disableRemove;
                            item.removeBtn.classList.toggle('is-disabled', disableRemove);
                        }
                    });
                };
                const addOptionRow = (initialValue = '', shouldFocus = false) => {
                    const row = document.createElement('div');
                    row.className = 'group-poll-option-row';

                    const indexNode = document.createElement('div');
                    indexNode.className = 'group-poll-option-index';

                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'group-action-editor-input group-poll-option-input';
                    input.placeholder = '输入选项内容';
                    input.maxLength = 40;
                    input.value = String(initialValue || '');

                    const removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.className = 'group-poll-option-remove-btn';
                    removeBtn.textContent = '删除';

                    row.appendChild(indexNode);
                    row.appendChild(input);
                    row.appendChild(removeBtn);
                    list.appendChild(row);

                    const rowItem = { row, indexNode, input, removeBtn };
                    rowItems.push(rowItem);

                    input.addEventListener('input', updateHiddenValue);
                    input.addEventListener('keydown', (event) => {
                        if (event.key !== 'Enter') return;
                        event.preventDefault();
                        event.stopPropagation();
                        addOptionRow('', true);
                    });
                    removeBtn.addEventListener('click', () => {
                        if (rowItems.length <= 2) return;
                        const idx = rowItems.indexOf(rowItem);
                        if (idx < 0) return;
                        rowItems.splice(idx, 1);
                        if (row.parentNode) row.parentNode.removeChild(row);
                        updateRowsMeta();
                        updateHiddenValue();
                    });

                    updateRowsMeta();
                    updateHiddenValue();
                    if (shouldFocus) {
                        setTimeout(() => input.focus(), 30);
                    }
                };

                addBtn.addEventListener('click', () => addOptionRow('', true));
                const initialOptions = parsePollOptionsFromRaw(hiddenOptionsInput.value || '');
                const bootOptions = initialOptions.length > 0 ? initialOptions : ['', ''];
                bootOptions.forEach((optionValue) => addOptionRow(optionValue, false));
                while (rowItems.length < 2) {
                    addOptionRow('', false);
                }
            },
            validate: (values) => {
                const title = String(values.title || '').replace(/\s+/g, ' ').trim();
                const options = typeof pollComposerState.readUiOptions === 'function'
                    ? pollComposerState.readUiOptions()
                    : parsePollOptionsFromRaw(values.options || '');
                pollComposerState.lastValidatedOptions = options;
                if (!title) return { ok: false, message: '请先输入投票主题' };
                if (options.length < 2) return { ok: false, message: '请至少输入2个选项' };
                return { ok: true };
            }
        });
        if (!modalResult || !modalResult.confirmed) return;

        const title = String(modalResult.values.title || '').replace(/\s+/g, ' ').trim();
        const options = Array.isArray(pollComposerState.lastValidatedOptions) && pollComposerState.lastValidatedOptions.length > 0
            ? pollComposerState.lastValidatedOptions
            : parsePollOptionsFromRaw(modalResult.values.options || '');

        const result = window.createGroupPoll(group, 'me', { title, options }, { showNotice: true });
        if (!result || !result.ok) {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('投票创建失败，请检查输入', 2200);
            }
        }
    }

    async function openGroupRelayComposer() {
        const group = getCurrentGroupContactForRedPacket();
        if (!group) {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('仅群聊支持发起接龙', 2000);
            }
            return;
        }
        if (typeof window.createGroupRelay !== 'function') {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('接龙功能暂不可用', 2000);
            }
            return;
        }
        if (typeof window.openGroupActionEditorModal !== 'function') {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('弹窗组件未就绪，请刷新重试', 2000);
            }
            return;
        }

        const modalResult = await window.openGroupActionEditorModal({
            kicker: 'GROUP RELAY',
            title: '发起接龙',
            subtitle: '可选填写第一条内容，成员可继续接龙',
            confirmText: '创建接龙',
            cancelText: '取消',
            fields: [
                {
                    id: 'title',
                    type: 'text',
                    label: '接龙主题',
                    placeholder: '例如：团建活动报名',
                    maxLength: 64
                },
                {
                    id: 'entry',
                    type: 'textarea',
                    label: '第一条内容（可留空）',
                    placeholder: '例如：1. 小明',
                    rows: 4,
                    maxLength: 90
                }
            ],
            validate: (values) => {
                const title = String(values.title || '').replace(/\s+/g, ' ').trim();
                if (!title) return { ok: false, message: '请先输入接龙主题' };
                return { ok: true };
            }
        });
        if (!modalResult || !modalResult.confirmed) return;

        const title = String(modalResult.values.title || '').replace(/\s+/g, ' ').trim();
        const entry = String(modalResult.values.entry || '').replace(/\s+/g, ' ').trim();

        const result = window.createGroupRelay(group, 'me', { title, entry }, { showNotice: true });
        if (!result || !result.ok) {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('接龙创建失败，请重试', 2200);
            }
        }
    }

    function renderGroupRedPacketSelectedMembers() {
        if (!groupRedPacketSelectedMembers) return;
        const group = getCurrentGroupContactForRedPacket();
        if (!group || !Array.isArray(groupRedPacketState.selectedTargetIds) || groupRedPacketState.selectedTargetIds.length === 0) {
            groupRedPacketSelectedMembers.innerHTML = '<div class="list-item center-content" style="color:#8e8e93;">未选择成员</div>';
            return;
        }
        const members = typeof window.getGroupMemberContacts === 'function'
            ? window.getGroupMemberContacts(group)
            : [];
        const selected = members.filter(member => groupRedPacketState.selectedTargetIds.some(id => String(id) === String(member.id)));
        if (selected.length === 0) {
            groupRedPacketSelectedMembers.innerHTML = '<div class="list-item center-content" style="color:#8e8e93;">未选择成员</div>';
            return;
        }
        groupRedPacketSelectedMembers.innerHTML = selected.map(member => `
            <div class="list-item" style="display:flex;align-items:center;gap:10px;">
                <img src="${String(member.avatar || '')}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;">
                <div style="min-width:0;flex:1;">
                    <div style="font-size:14px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${String(member.remark || member.nickname || member.name || '群成员')}</div>
                </div>
            </div>
        `).join('');
    }

    function syncGroupRedPacketModeUi() {
        const mode = String(groupRedPacketModeSelect && groupRedPacketModeSelect.value || 'targeted');
        if (groupRedPacketTargetedGroup) {
            groupRedPacketTargetedGroup.classList.toggle('hidden', mode !== 'targeted');
        }
        if (groupRedPacketRandomGroup) {
            groupRedPacketRandomGroup.classList.toggle('hidden', mode !== 'random');
        }
    }

    function closeGroupRedPacketModal() {
        if (groupRedPacketModal) groupRedPacketModal.classList.add('hidden');
    }

    function openGroupRedPacketModal() {
        const group = getCurrentGroupContactForRedPacket();
        if (!group) {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('仅群聊支持发红包', 2000);
            }
            return;
        }
        groupRedPacketState.selectedTargetIds = [];
        if (groupRedPacketModeSelect) groupRedPacketModeSelect.value = 'targeted';
        if (groupRedPacketAmountInput) groupRedPacketAmountInput.value = '';
        if (groupRedPacketRemarkInput) groupRedPacketRemarkInput.value = '';
        if (groupRedPacketCountInput) {
            const groupMembers = typeof window.getGroupMemberContacts === 'function'
                ? window.getGroupMemberContacts(group)
                : [];
            groupRedPacketCountInput.value = Math.max(1, Math.min(3, groupMembers.length || 1));
        }
        syncGroupRedPacketModeUi();
        renderGroupRedPacketSelectedMembers();
        if (groupRedPacketModal) groupRedPacketModal.classList.remove('hidden');
        if (groupRedPacketAmountInput) {
            setTimeout(() => groupRedPacketAmountInput.focus(), 20);
        }
    }

    function openGroupRedPacketMemberPicker() {
        const group = getCurrentGroupContactForRedPacket();
        if (!group) return;
        if (typeof window.openGroupContactMultiPicker !== 'function') {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('成员选择器暂不可用', 1800);
            }
            return;
        }
        const contacts = typeof window.getGroupMemberContacts === 'function'
            ? window.getGroupMemberContacts(group)
            : [];
        window.openGroupContactMultiPicker({
            title: '选择指定成员',
            confirmText: '确认成员',
            contacts,
            initialSelectedIds: groupRedPacketState.selectedTargetIds,
            onConfirm: (ids) => {
                groupRedPacketState.selectedTargetIds = (Array.isArray(ids) ? ids : [])
                    .map(item => String(item || '').trim())
                    .filter(Boolean);
                const pickerModal = document.getElementById('contact-picker-modal');
                if (pickerModal) pickerModal.classList.add('hidden');
                renderGroupRedPacketSelectedMembers();
            }
        });
    }

    function handleSendGroupRedPacket() {
        const group = getCurrentGroupContactForRedPacket();
        if (!group || typeof window.createGroupRedPacket !== 'function') return;

        const mode = String(groupRedPacketModeSelect && groupRedPacketModeSelect.value || 'targeted');
        const amount = Number(groupRedPacketAmountInput && groupRedPacketAmountInput.value || 0);
        const remark = String(groupRedPacketRemarkInput && groupRedPacketRemarkInput.value || '').trim();
        const packetCount = Number(groupRedPacketCountInput && groupRedPacketCountInput.value || 0);
        const payload = mode === 'targeted'
            ? {
                mode: 'targeted',
                amount,
                target_member_ids: groupRedPacketState.selectedTargetIds,
                remark
            }
            : {
                mode: 'random',
                amount,
                count: packetCount,
                remark
            };
        const result = window.createGroupRedPacket(group, 'me', payload, {
            showNotice: false,
            allowWalletDebit: true
        });
        if (!result || !result.ok) {
            const reason = String(result && result.reason || '');
            if (reason === 'insufficient_balance') {
                alert('余额不足，请先充值');
            } else if (reason === 'empty_target_members') {
                if (typeof window.showChatToast === 'function') {
                    window.showChatToast('请至少选择 1 位指定成员', 2200);
                }
            } else if (reason === 'amount_too_small') {
                if (typeof window.showChatToast === 'function') {
                    window.showChatToast('金额太小，请提高红包金额', 2200);
                }
            } else {
                if (typeof window.showChatToast === 'function') {
                    window.showChatToast('红包发送失败，请检查输入', 2200);
                }
            }
            return;
        }
        closeGroupRedPacketModal();
    }

    if (chatMoreRedPacketBtn) {
        chatMoreRedPacketBtn.addEventListener('click', () => {
            document.getElementById('chat-more-panel').classList.add('hidden');
            openGroupRedPacketModal();
        });
    }
    if (closeGroupRedPacketBtn) {
        closeGroupRedPacketBtn.addEventListener('click', closeGroupRedPacketModal);
    }
    if (groupRedPacketModal) {
        groupRedPacketModal.addEventListener('click', (event) => {
            if (event.target === groupRedPacketModal) closeGroupRedPacketModal();
        });
    }
    if (groupRedPacketModeSelect) {
        groupRedPacketModeSelect.addEventListener('change', syncGroupRedPacketModeUi);
    }
    if (groupRedPacketSelectMembersBtn) {
        groupRedPacketSelectMembersBtn.addEventListener('click', openGroupRedPacketMemberPicker);
    }
    if (doGroupRedPacketBtn) {
        doGroupRedPacketBtn.addEventListener('click', handleSendGroupRedPacket);
    }

    const chatNavModal = document.getElementById('chat-nav-modal');
    const closeChatNavModalBtn = document.getElementById('close-chat-nav-modal');
    const confirmChatNavBtn = document.getElementById('confirm-chat-nav-btn');
    const chatNavDestinationInput = document.getElementById('chat-nav-destination');
    const chatNavModeGroup = document.getElementById('chat-nav-mode-group');

    function setActiveChatNavMode(modeKey) {
        if (!chatNavModeGroup) return;
        const nextMode = getChatNavigationModeMeta(modeKey).key;
        chatNavModeGroup.querySelectorAll('.chat-nav-mode-chip').forEach(chip => {
            const chipMode = chip && chip.dataset ? String(chip.dataset.mode || '').trim() : '';
            chip.classList.toggle('active', chipMode === nextMode);
        });
    }

    function getActiveChatNavMode() {
        if (!chatNavModeGroup) return 'driving';
        const activeChip = chatNavModeGroup.querySelector('.chat-nav-mode-chip.active');
        const activeMode = activeChip && activeChip.dataset ? String(activeChip.dataset.mode || '').trim() : '';
        return getChatNavigationModeMeta(activeMode || 'driving').key;
    }

    function closeChatNavigationModal() {
        if (!chatNavModal) return;
        chatNavModal.classList.add('hidden');
    }

    function openChatNavigationModal() {
        if (!chatNavModal) return;
        if (chatNavDestinationInput) {
            chatNavDestinationInput.value = '';
        }
        setActiveChatNavMode('driving');
        chatNavModal.classList.remove('hidden');
        window.setTimeout(() => {
            if (chatNavDestinationInput) {
                chatNavDestinationInput.focus();
            }
        }, 20);
    }

    async function submitChatNavigationModal() {
        const destinationText = chatNavDestinationInput ? String(chatNavDestinationInput.value || '').trim() : '';
        if (!destinationText) {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast('请先输入目的地', 2200);
            }
            if (chatNavDestinationInput) {
                chatNavDestinationInput.focus();
            }
            return;
        }

        closeChatNavigationModal();
        const submitted = await submitChatNavigationAssistRequest(destinationText, getActiveChatNavMode());
        if (!submitted && typeof window.showChatToast === 'function') {
            window.showChatToast('当前没有可发送的聊天窗口', 2200);
        }
    }

    if (chatNavModeGroup) {
        chatNavModeGroup.querySelectorAll('.chat-nav-mode-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const modeKey = chip && chip.dataset ? chip.dataset.mode : 'driving';
                setActiveChatNavMode(modeKey);
            });
        });
    }

    if (chatNavDestinationInput) {
        chatNavDestinationInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitChatNavigationModal();
            }
        });
    }

    if (closeChatNavModalBtn) {
        closeChatNavModalBtn.addEventListener('click', closeChatNavigationModal);
    }

    if (confirmChatNavBtn) {
        confirmChatNavBtn.addEventListener('click', submitChatNavigationModal);
    }

    if (chatNavModal) {
        chatNavModal.addEventListener('click', (e) => {
            if (e.target === chatNavModal) {
                closeChatNavigationModal();
            }
        });
    }
    const closeReplyBarBtn = document.getElementById('close-reply-bar');
    if (closeReplyBarBtn) {
        closeReplyBarBtn.addEventListener('click', cancelQuote);
    }

    const chatMoreRegenerateBtn = document.getElementById('chat-more-regenerate-btn');
    if (chatMoreRegenerateBtn) {
        chatMoreRegenerateBtn.addEventListener('click', handleRegenerateReply);
    }

    const multiSelectCancelBtn = document.getElementById('multi-select-cancel');
    const multiSelectDeleteBtn = document.getElementById('multi-select-delete');
    
    if (multiSelectCancelBtn) multiSelectCancelBtn.addEventListener('click', exitMultiSelectMode);
    if (multiSelectDeleteBtn) multiSelectDeleteBtn.addEventListener('click', deleteSelectedMessages);

    const editChatMsgModal = document.getElementById('edit-chat-msg-modal');
    const closeEditChatMsgBtn = document.getElementById('close-edit-chat-msg');
    const saveEditChatMsgBtn = document.getElementById('save-edit-chat-msg-btn');
    const addInsertedChatMsgBtn = document.getElementById('add-inserted-chat-msg-btn');
    const insertedChatMsgList = document.getElementById('inserted-chat-msg-list');
    const editChatMsgTypeInput = document.getElementById('edit-chat-msg-type');
    const editChatMsgTypeButtons = editChatMsgModal
        ? Array.from(editChatMsgModal.querySelectorAll('.edit-chat-msg-type-btn'))
        : [];

    const contactsTitleBtn = document.getElementById('contacts-title-btn');
    if (contactsTitleBtn) {
        contactsTitleBtn.addEventListener('click', window.openNewFriendsScreen);
    }

    if (closeEditChatMsgBtn) {
        closeEditChatMsgBtn.addEventListener('click', () => {
            editChatMsgModal.classList.add('hidden');
            currentEditingChatMsgId = null;
            currentEditingVoiceCallMsgId = null;
            const typeSwitch = document.getElementById('edit-chat-msg-type-switch');
            const addInsertedBtn = document.getElementById('add-inserted-chat-msg-btn');
            if (typeSwitch) typeSwitch.style.display = '';
            if (addInsertedBtn) addInsertedBtn.style.display = '';
            if (insertedChatMsgList) insertedChatMsgList.style.display = '';
            if (insertedChatMsgList) insertedChatMsgList.innerHTML = '';
        });
    }

    if (saveEditChatMsgBtn) {
        saveEditChatMsgBtn.addEventListener('click', handleSaveEditedChatMessage);
    }

    if (editChatMsgTypeButtons.length > 0) {
        editChatMsgTypeButtons.forEach(btn => {
            if (btn.closest('.edit-chat-msg-insert-item')) return;
            btn.addEventListener('click', () => {
                const msgType = String(btn.dataset.msgType || 'text').trim();
                if (editChatMsgTypeInput) editChatMsgTypeInput.value = msgType || 'text';
                editChatMsgTypeButtons.forEach(item => {
                    if (item.closest('.edit-chat-msg-insert-item')) return;
                    item.classList.toggle('active', item === btn);
                });
            });
        });
    }

    if (addInsertedChatMsgBtn && insertedChatMsgList) {
        addInsertedChatMsgBtn.addEventListener('click', () => {
            const item = createInsertedChatMessageItem('', 'text');
            insertedChatMsgList.appendChild(item);
            const textarea = item.querySelector('.edit-chat-msg-insert-content');
            if (textarea) textarea.focus();
        });
    }

    const closeAutoSnapshotBtn = document.getElementById('close-auto-snapshot');
    const saveAutoSnapshotBtn = document.getElementById('save-auto-snapshot-btn');

    if (closeAutoSnapshotBtn) {
        closeAutoSnapshotBtn.addEventListener('click', () => {
            document.getElementById('auto-snapshot-modal').classList.add('hidden');
        });
    }

    if (saveAutoSnapshotBtn) {
        saveAutoSnapshotBtn.addEventListener('click', handleSaveAutoSnapshotSettings);
    }

    const closeEditBlockBtn = document.getElementById('close-edit-block');
    const saveEditBlockBtn = document.getElementById('save-edit-block-btn');

    if (closeEditBlockBtn) {
        closeEditBlockBtn.addEventListener('click', () => {
            document.getElementById('edit-block-modal').classList.add('hidden');
        });
    }

    if (saveEditBlockBtn) {
        saveEditBlockBtn.addEventListener('click', handleSaveEditBlock);
    }

    // 系统通知设置
    const sysNotifToggle = document.getElementById('system-notification-toggle');
    if (sysNotifToggle) {
        sysNotifToggle.checked = window.iphoneSimState.enableSystemNotifications || false;
        
        sysNotifToggle.addEventListener('change', async (e) => {
            if (e.target.checked) {
                if (!("Notification" in window)) {
                    alert("此浏览器不支持系统通知");
                    e.target.checked = false;
                    return;
                }

                if (Notification.permission === "granted") {
                    window.iphoneSimState.enableSystemNotifications = true;
                    saveConfig();
                    if (window.offlinePushSync && typeof window.offlinePushSync.subscribePush === 'function') {
                        window.offlinePushSync.subscribePush().catch(err => console.error('[offline-push-sync]', err));
                    }
                    new Notification("通知已开启", { body: "你现在可以接收后台消息通知了" });
                } else if (Notification.permission !== "denied") {
                    const permission = await Notification.requestPermission();
                    if (permission === "granted") {
                        window.iphoneSimState.enableSystemNotifications = true;
                        saveConfig();
                        new Notification("通知已开启", { body: "你现在可以接收后台消息通知了" });
                    } else {
                        e.target.checked = false;
                        alert("需要通知权限才能开启此功能");
                    }
                } else {
                    e.target.checked = false;
                    alert("通知权限已被拒绝，请在浏览器设置中手动开启");
                }
            } else {
                window.iphoneSimState.enableSystemNotifications = false;
                saveConfig();
            }
        });
    }

    // 后台音频混音设置
    const bgAudioToggle = document.getElementById('background-audio-toggle');
    if (bgAudioToggle) {
        bgAudioToggle.checked = window.iphoneSimState.enableBackgroundAudio || false;
        
        bgAudioToggle.addEventListener('change', (e) => {
            window.iphoneSimState.enableBackgroundAudio = e.target.checked;
            saveConfig();
            
            if (window.updateAudioSession) {
                window.updateAudioSession();
            }
            
            if (e.target.checked) {
                // 尝试请求播放静音音频以激活会话（如果是用户交互触发）
                // 这在某些浏览器上可能有助于立即生效
                if (window.iphoneSimState.music && window.iphoneSimState.music.playing) {
                    // 如果正在播放，不需要做什么，updateAudioSession 会处理 Session 类型
                }
            }
        });
    }
}

function updateWechatHeader(tab) {
    const header = document.querySelector('#wechat-app .wechat-header');
    if (!header) return;

    const title = header.querySelector('.wechat-title');
    const left = header.querySelector('.header-left');
    const right = header.querySelector('.header-right');
    const body = document.getElementById('wechat-body');

    header.className = 'wechat-header';
    header.style.display = '';
    header.style.backgroundColor = '';
    if (body) body.classList.remove('full-screen');
    
    if (left) left.innerHTML = '';
    if (right) right.innerHTML = '';

    const closeApp = () => {
        document.getElementById('wechat-app').classList.add('hidden');
    };

    if (tab === 'wechat') {
        if (title) title.textContent = '微信';
        
        if (left) {
            const closeBtn = document.createElement('div');
            closeBtn.className = 'header-btn-text';
            closeBtn.textContent = '关闭';
            closeBtn.onclick = closeApp;
            left.appendChild(closeBtn);
        }

        if (right) {
            const addBtn = document.createElement('div');
            addBtn.className = 'wechat-icon-btn';
            addBtn.innerHTML = '<i class="fas fa-plus-circle"></i>';
            addBtn.onclick = () => {
                if (typeof window.openAddContactModeChooser === 'function') {
                    window.openAddContactModeChooser();
                } else {
                    document.getElementById('add-contact-modal').classList.remove('hidden');
                }
            };
            right.appendChild(addBtn);
        }

    } else if (tab === 'contacts') {
        header.style.display = 'none';
        
        const addBtnCustom = document.getElementById('add-contact-btn-custom');
        if (addBtnCustom) {
            const newBtn = addBtnCustom.cloneNode(true);
            addBtnCustom.parentNode.replaceChild(newBtn, addBtnCustom);
            newBtn.addEventListener('click', () => {
                if (typeof window.openAddContactModeChooser === 'function') {
                    window.openAddContactModeChooser();
                } else {
                    document.getElementById('add-contact-modal').classList.remove('hidden');
                }
            });
        }

        const backBtnCustom = document.getElementById('contacts-back-btn');
        if (backBtnCustom) {
            const newBackBtn = backBtnCustom.cloneNode(true);
            backBtnCustom.parentNode.replaceChild(newBackBtn, backBtnCustom);
            newBackBtn.addEventListener('click', closeApp);
        }

    } else if (tab === 'addressbook') {
        header.style.display = 'none';
        
        const addBtnAddressBook = document.getElementById('add-contact-btn-addressbook');
        if (addBtnAddressBook) {
            const newBtn = addBtnAddressBook.cloneNode(true);
            addBtnAddressBook.parentNode.replaceChild(newBtn, addBtnAddressBook);
            newBtn.addEventListener('click', () => document.getElementById('add-contact-modal').classList.remove('hidden'));
        }
        
        if (typeof window.renderAddressBook === 'function') {
            window.renderAddressBook();
        } else {
            console.error('renderAddressBook not found');
        }

    } else if (tab === 'moments') {
        if (title) title.textContent = ''; 
        header.classList.add('transparent');
        if (body) body.classList.add('full-screen');

        if (left) {
            const backBtn = document.createElement('div');
            backBtn.className = 'wechat-icon-btn';
            backBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            const goBack = () => {
                const contactsTab = document.querySelector('#wechat-app .wechat-tab-item[data-tab="contacts"]');
                if (contactsTab) contactsTab.click();
            };
            backBtn.onclick = goBack;
            backBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                goBack();
            }, { passive: false });
            left.appendChild(backBtn);
        }

        if (right) {
            const cameraBtn = document.createElement('div');
            cameraBtn.className = 'wechat-icon-btn';
            cameraBtn.style.marginRight = '10px';
            cameraBtn.innerHTML = '<i class="fas fa-camera"></i>';
            const doPost = () => {
                if (window.openPostMoment) window.openPostMoment(false);
            };
            cameraBtn.onclick = doPost;
            cameraBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                doPost();
            }, { passive: false });
            right.appendChild(cameraBtn);
        }

    } else if (tab === 'me') {
        header.style.display = 'none';
        if (body) body.classList.add('full-screen');
    }
}

function renderGroupList() {
    const list = document.getElementById('group-list');
    if (!list) return;
    list.innerHTML = '';

    const noGroupItem = document.createElement('div');
    noGroupItem.className = 'list-item center-content';
    noGroupItem.textContent = '未分组';
    if (!window.iphoneSimState.tempSelectedGroup) {
        noGroupItem.style.color = '#007AFF';
        noGroupItem.style.fontWeight = 'bold';
    }
    noGroupItem.onclick = () => handleSelectGroup('');
    list.appendChild(noGroupItem);

    if (window.iphoneSimState.contactGroups && window.iphoneSimState.contactGroups.length > 0) {
        window.iphoneSimState.contactGroups.forEach(group => {
            const item = document.createElement('div');
            item.className = 'list-item';
            
            const content = document.createElement('div');
            content.className = 'list-content';
            content.style.justifyContent = 'center';
            content.textContent = group;
            
            if (window.iphoneSimState.tempSelectedGroup === group) {
                content.style.color = '#007AFF';
                content.style.fontWeight = 'bold';
            }

            const deleteBtn = document.createElement('i');
            deleteBtn.className = 'fas fa-trash';
            deleteBtn.style.color = '#FF3B30';
            deleteBtn.style.marginLeft = '10px';
            deleteBtn.style.fontSize = '14px';
            deleteBtn.style.padding = '5px';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                handleDeleteGroup(group);
            };

            item.style.justifyContent = 'space-between';
            item.innerHTML = '';
            
            const leftSpacer = document.createElement('div');
            leftSpacer.style.width = '24px';
            item.appendChild(leftSpacer);

            item.appendChild(content);
            item.appendChild(deleteBtn);

            item.onclick = () => handleSelectGroup(group);
            list.appendChild(item);
        });
    }
}

function openGroupSelect() {
    renderGroupList();
    document.getElementById('group-select-modal').classList.remove('hidden');
}

function handleCreateGroup() {
    const name = prompt('请输入新分组名称：');
    if (!name) return;
    
    if (window.iphoneSimState.contactGroups.includes(name)) {
        alert('分组已存在');
        return;
    }
    
    window.iphoneSimState.contactGroups.push(name);
    saveConfig();
    renderGroupList();
}

function handleDeleteGroup(groupName) {
    if (confirm(`确定要删除分组 "${groupName}" 吗？`)) {
        window.iphoneSimState.contactGroups = window.iphoneSimState.contactGroups.filter(g => g !== groupName);
        
        if (window.iphoneSimState.tempSelectedGroup === groupName) {
            window.iphoneSimState.tempSelectedGroup = '';
            document.getElementById('chat-setting-group-value').textContent = '未分组';
        }
        
        window.iphoneSimState.contacts.forEach(c => {
            if (c.group === groupName) {
                c.group = '';
            }
        });
        
        saveConfig();
        renderGroupList();
    }
}

function handleSelectGroup(groupName) {
    window.iphoneSimState.tempSelectedGroup = groupName;
    document.getElementById('chat-setting-group-value').textContent = groupName || '未分组';
    document.getElementById('group-select-modal').classList.add('hidden');
}

function getLinkedIcityBooksContext(contactId) {
    if (!window.iphoneSimState.icityBooks || window.iphoneSimState.icityBooks.length === 0) return '';
    
    const linkedBooks = window.iphoneSimState.icityBooks.filter(b => 
        b.linkedContactIds && b.linkedContactIds.includes(contactId)
    );
    
    if (linkedBooks.length === 0) return '';
    
    let context = '\n【共读的书籍/手账】\n你们正在共同编辑以下书籍，你可以看到用户写的内容以及你之前的批注：\n';
    
    linkedBooks.forEach(book => {
        context += `\n《${book.name}》:\n`;
        if (!book.pages || book.pages.length === 0) {
            context += "(空白)\n";
            return;
        }
        
        book.pages.forEach((page, index) => {
            let content = page.content || '';
            // Temporary DOM element for parsing
            const div = document.createElement('div');
            div.innerHTML = content;
            
            // Process Ruby (Comments)
            div.querySelectorAll('ruby').forEach(el => {
                let text = '';
                if (el.childNodes.length > 0 && el.childNodes[0].nodeType === 3) {
                    text = el.childNodes[0].textContent;
                } else {
                    text = el.textContent.replace(el.querySelector('rt')?.textContent || '', '');
                }
                const rt = el.querySelector('rt');
                const annotation = rt ? rt.textContent : '';
                const replaceText = `${text} (你的批注: ${annotation})`;
                el.replaceWith(document.createTextNode(replaceText));
            });
            
            // Process Strikethrough
            div.querySelectorAll('s').forEach(el => {
                const text = el.textContent;
                const replaceText = `${text} (已划掉)`;
                el.replaceWith(document.createTextNode(replaceText));
            });
            
            // Process Highlight
            div.querySelectorAll('.highlight-marker').forEach(el => {
                const text = el.textContent;
                const replaceText = `${text} (高亮)`;
                el.replaceWith(document.createTextNode(replaceText));
            });
            
            // Process Handwritten (AI added text)
            div.querySelectorAll('.handwritten-text').forEach(el => {
                const text = el.textContent;
                const replaceText = `(你的手写: ${text})`;
                el.replaceWith(document.createTextNode(replaceText));
            });
            
            // Process Stickers
            div.querySelectorAll('img.icity-sticker').forEach(el => {
                const src = el.src;
                let name = '未知贴纸';
                if (window.iphoneSimState.stickerCategories) {
                    for (const cat of window.iphoneSimState.stickerCategories) {
                        const found = cat.list.find(s => src.includes(s.url) || s.url === src);
                        if (found) {
                            name = found.desc;
                            break;
                        }
                    }
                }
                const replaceText = `[贴纸: ${name}]`;
                el.replaceWith(document.createTextNode(replaceText));
            });
            
            // Process other images
            div.querySelectorAll('img').forEach(el => {
                 el.replaceWith(document.createTextNode('[图片]'));
            });

            const textContent = div.textContent.trim();
            if (textContent) {
                context += `第 ${index + 1} 页: ${textContent}\n`;
            }
        });
    });
    
    return context;
}

function formatElapsedZh(ms) {
    const safeMs = Math.max(0, Number(ms) || 0);
    const totalMinutes = Math.floor(safeMs / 60000);
    if (totalMinutes < 1) return '不到1分钟';
    if (totalMinutes < 60) return `${totalMinutes}分钟`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours < 24) return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}天${remHours}小时` : `${days}天`;
}

const ACTIVE_REPLY_RUNTIME_STORAGE_KEY = 'wechatActiveReplyRuntimeStateV1';
const ACTIVE_REPLY_INITIAL_DELAY_MS = 30000;
const ACTIVE_REPLY_INTERVAL_MS = 60000;
const ACTIVE_REPLY_WATCHDOG_INTERVAL_MS = 20000;
const ACTIVE_REPLY_SCHEDULER_STALE_MS = (ACTIVE_REPLY_INTERVAL_MS * 2) + 15000;
const ACTIVE_REPLY_SHORT_COOLDOWN_MS = 30000;
const ACTIVE_REPLY_CONTINUE_PROBABILITY = 0.7;
const ACTIVE_REPLY_FOREGROUND_SYNC_WAIT_MS = 4200;

function normalizeActiveReplyRuntimeState(raw) {
    const normalized = { contacts: {} };
    if (!raw || typeof raw !== 'object') return normalized;

    const source = raw.contacts && typeof raw.contacts === 'object' ? raw.contacts : raw;
    Object.keys(source).forEach((contactId) => {
        const entry = source[contactId];
        if (!entry || typeof entry !== 'object') return;
        normalized.contacts[String(contactId)] = {
            lastCheckAt: Number(entry.lastCheckAt) || 0,
            lastTriggeredAt: Number(entry.lastTriggeredAt) || 0,
            lastTriggeredAnchorId: entry.lastTriggeredAnchorId ? String(entry.lastTriggeredAnchorId) : '',
            schedulerHeartbeatAt: Number(entry.schedulerHeartbeatAt) || 0,
            lastBackgroundedAt: Number(entry.lastBackgroundedAt) || 0
        };
    });

    return normalized;
}

function readActiveReplyRuntimeState() {
    try {
        const raw = localStorage.getItem(ACTIVE_REPLY_RUNTIME_STORAGE_KEY);
        return raw ? normalizeActiveReplyRuntimeState(JSON.parse(raw)) : { contacts: {} };
    } catch (err) {
        console.warn('[ActiveReply] 读取运行态失败', err);
        return { contacts: {} };
    }
}

function writeActiveReplyRuntimeState(state) {
    try {
        localStorage.setItem(ACTIVE_REPLY_RUNTIME_STORAGE_KEY, JSON.stringify(normalizeActiveReplyRuntimeState(state)));
    } catch (err) {
        console.warn('[ActiveReply] 保存运行态失败', err);
    }
}

function getActiveReplyRuntimeEntry(state, contactId) {
    const runtimeState = state && typeof state === 'object' ? state : { contacts: {} };
    if (!runtimeState.contacts || typeof runtimeState.contacts !== 'object') {
        runtimeState.contacts = {};
    }
    const key = String(contactId);
    if (!runtimeState.contacts[key] || typeof runtimeState.contacts[key] !== 'object') {
        runtimeState.contacts[key] = {
            lastCheckAt: 0,
            lastTriggeredAt: 0,
            lastTriggeredAnchorId: '',
            schedulerHeartbeatAt: 0,
            lastBackgroundedAt: 0
        };
    }
    return runtimeState.contacts[key];
}

function updateActiveReplyRuntimeEntry(state, contactId, patch = {}) {
    const entry = getActiveReplyRuntimeEntry(state, contactId);
    if (Object.prototype.hasOwnProperty.call(patch, 'lastCheckAt')) {
        entry.lastCheckAt = Number(patch.lastCheckAt) || 0;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'lastTriggeredAt')) {
        entry.lastTriggeredAt = Number(patch.lastTriggeredAt) || 0;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'lastTriggeredAnchorId')) {
        entry.lastTriggeredAnchorId = patch.lastTriggeredAnchorId ? String(patch.lastTriggeredAnchorId) : '';
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'schedulerHeartbeatAt')) {
        entry.schedulerHeartbeatAt = Number(patch.schedulerHeartbeatAt) || 0;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'lastBackgroundedAt')) {
        entry.lastBackgroundedAt = Number(patch.lastBackgroundedAt) || 0;
    }
    return entry;
}

function pruneActiveReplyRuntimeState(state) {
    if (!state || typeof state !== 'object' || !state.contacts || typeof state.contacts !== 'object') return state;
    const activeContactIds = new Set(
        ((window.iphoneSimState && Array.isArray(window.iphoneSimState.contacts)) ? window.iphoneSimState.contacts : [])
            .filter(contact => contact && contact.id !== undefined && contact.activeReplyEnabled)
            .map(contact => String(contact.id))
    );
    Object.keys(state.contacts).forEach((contactId) => {
        if (!activeContactIds.has(String(contactId))) {
            delete state.contacts[contactId];
        }
    });
    return state;
}

function touchActiveReplyHeartbeat(state, now = Date.now()) {
    const contacts = (window.iphoneSimState && Array.isArray(window.iphoneSimState.contacts)) ? window.iphoneSimState.contacts : [];
    contacts.forEach((contact) => {
        if (!contact || !contact.activeReplyEnabled || contact.id === undefined) return;
        updateActiveReplyRuntimeEntry(state, contact.id, { schedulerHeartbeatAt: now });
    });
}

function markActiveReplyBackgrounded(now = Date.now()) {
    const runtimeState = readActiveReplyRuntimeState();
    const contacts = (window.iphoneSimState && Array.isArray(window.iphoneSimState.contacts)) ? window.iphoneSimState.contacts : [];
    contacts.forEach((contact) => {
        if (!contact || !contact.activeReplyEnabled || contact.id === undefined) return;
        updateActiveReplyRuntimeEntry(runtimeState, contact.id, {
            lastBackgroundedAt: now,
            schedulerHeartbeatAt: now
        });
    });
    pruneActiveReplyRuntimeState(runtimeState);
    writeActiveReplyRuntimeState(runtimeState);
}

function isActiveReplySchedulerDisabled() {
    if (window.offlinePushSync && typeof window.offlinePushSync.getState === 'function') {
        const syncState = window.offlinePushSync.getState();
        if (syncState && syncState.enabled && syncState.disableLocalActiveReplyScheduler) {
            return true;
        }
    }
    return false;
}

function hasVisibleRealtimeCall() {
    const voiceScreen = document.getElementById('voice-call-screen');
    if (voiceScreen && !voiceScreen.classList.contains('hidden')) return true;

    const videoScreen = document.getElementById('video-call-screen');
    if (videoScreen && !videoScreen.classList.contains('hidden')) return true;

    const videoModal = document.getElementById('video-call-modal');
    if (videoModal && !videoModal.classList.contains('hidden')) return true;

    return false;
}

function isMeetingStoryModeActiveForContact(contactId) {
    if (contactId === undefined || contactId === null) return false;
    const meetingDetailScreen = document.getElementById('meeting-detail-screen');
    if (!meetingDetailScreen || meetingDetailScreen.classList.contains('hidden')) {
        return false;
    }

    const state = window.iphoneSimState || {};
    const currentContactId = state.currentChatContactId;
    if (String(currentContactId) !== String(contactId)) {
        return false;
    }

    const currentContact = Array.isArray(state.contacts)
        ? state.contacts.find(item => item && String(item.id) === String(currentContactId)) || null
        : null;
    if (currentContact && typeof window.isGroupChatContact === 'function' && window.isGroupChatContact(currentContact)) {
        return false;
    }

    return true;
}

function hasAnyChatReplyGenerationInProgress() {
    const locks = window.__chatAiReplyLocks;
    return !!(locks && typeof locks === 'object' && Object.keys(locks).length > 0);
}

function isWechatSingleChatContact(contact) {
    if (!contact) return false;
    const channel = typeof window.getResolvedDeliveryChannel === 'function'
        ? window.getResolvedDeliveryChannel(contact)
        : 'wechat';
    return channel === 'wechat';
}

function getActiveReplyPreviewText(message) {
    if (!message) return '';
    const type = String(message.type || 'text').trim().toLowerCase();
    if (type === 'sticker') return '[表情包]';
    if (type === 'voice') return '[语音]';
    if (type === 'image' || type === 'virtual_image') return '[图片]';
    if (type === 'description') return String(message.content || '[旁白]').trim() || '[旁白]';
    const text = String(message.content || '').replace(/\s+/g, ' ').trim();
    return text || '[空消息]';
}

function buildActiveReplyRecentFlow(realMessages = []) {
    const items = realMessages.slice(-6).map((message) => {
        const speaker = message.role === 'user' ? '用户' : '你';
        return `- ${speaker}：${getActiveReplyPreviewText(message).slice(0, 42)}`;
    }).filter(Boolean);
    if (!items.length) return '';
    return `\n最近对话流（只作衔接参考）：\n${items.join('\n')}`;
}

function buildRecentActiveReplySummary(history = []) {
    const items = history
        .filter(message => message && message.role === 'assistant' && (message.isActiveReply || String(message.triggerSource || '') === 'active'))
        .slice(-3)
        .map(message => `- ${getActiveReplyPreviewText(message).slice(0, 40)}`)
        .filter(Boolean);
    if (!items.length) return '';
    return `\n避免和你最近主动发过的内容过于相似：\n${items.join('\n')}`;
}

function collectActiveReplyContext(contact, now = Date.now()) {
    if (!contact || contact.id === undefined) return null;
    const history = (((window.iphoneSimState || {}).chatHistory || {})[contact.id]) || [];
    const realMessages = history.filter(isRealConversationMsg);
    if (!realMessages.length) return null;

    const lastMessage = realMessages[realMessages.length - 1] || null;
    if (!lastMessage) return null;

    const reversed = [...realMessages].reverse();
    const lastUserMessage = reversed.find(message => message.role === 'user') || null;
    const lastAssistantMessage = reversed.find(message => message.role === 'assistant') || null;
    const intervalSeconds = Math.max(5, Number(contact.activeReplyInterval) || 60);
    const intervalMs = intervalSeconds * 1000;
    const anchorTime = Number(lastMessage.time) || 0;

    return {
        contact,
        history,
        realMessages,
        lastMessage,
        lastUserMessage,
        lastAssistantMessage,
        intervalMs,
        intervalSeconds,
        anchorTime,
        branch: lastMessage.role === 'user' ? 'reply-user' : 'continue-chat',
        silenceMs: anchorTime > 0 ? Math.max(0, now - anchorTime) : 0
    };
}

function shouldTriggerActiveReply(contact, context, runtimeEntry, now = Date.now()) {
    if (!contact || !context || !runtimeEntry) {
        return { allow: false, reason: 'missing-context' };
    }

    if (!contact.activeReplyEnabled) {
        return { allow: false, reason: 'disabled' };
    }

    if (!isWechatSingleChatContact(contact)) {
        return { allow: false, reason: 'non-wechat' };
    }

    if (isMeetingStoryModeActiveForContact(contact.id)) {
        return { allow: false, reason: 'meeting-story-active' };
    }

    if (typeof window.ensureContactRestWindowFields === 'function') {
        window.ensureContactRestWindowFields(contact);
    }

    if (typeof window.getContactRestTriggerDecision === 'function') {
        const restDecision = window.getContactRestTriggerDecision(contact, 'active', now);
        if (restDecision && !restDecision.allow) {
            return { allow: false, reason: restDecision.reason || 'rest-window' };
        }
    }

    const anchorId = context.lastMessage && context.lastMessage.id ? String(context.lastMessage.id) : '';
    if (!anchorId) {
        return { allow: false, reason: 'missing-anchor' };
    }

    const activeReplyStartTime = Number(contact.activeReplyStartTime) || 0;
    if (activeReplyStartTime && Number(context.anchorTime) <= activeReplyStartTime) {
        return { allow: false, reason: 'before-enabled' };
    }

    if (String(runtimeEntry.lastTriggeredAnchorId || '') === anchorId) {
        return { allow: false, reason: 'runtime-anchor-dup' };
    }

    if (String(contact.lastActiveReplyTriggeredMsgId || '') === anchorId) {
        return { allow: false, reason: 'contact-anchor-dup' };
    }

    if (!context.anchorTime || context.silenceMs < context.intervalMs) {
        return { allow: false, reason: 'interval-not-reached' };
    }

    if (context.lastAssistantMessage) {
        const lastAssistantAt = Number(context.lastAssistantMessage.time) || 0;
        if (lastAssistantAt && now - lastAssistantAt < ACTIVE_REPLY_SHORT_COOLDOWN_MS) {
            return { allow: false, reason: 'assistant-short-cooldown' };
        }
    }

    if (window.__chatAiReplyLocks && window.__chatAiReplyLocks[contact.id]) {
        return { allow: false, reason: 'contact-generating' };
    }

    if (hasAnyChatReplyGenerationInProgress()) {
        return { allow: false, reason: 'global-generating' };
    }

    if (hasVisibleRealtimeCall()) {
        return { allow: false, reason: 'call-active' };
    }

    if (context.branch === 'continue-chat') {
        const roll = Math.random();
        if (roll > ACTIVE_REPLY_CONTINUE_PROBABILITY) {
            return { allow: false, reason: 'probability-miss', probabilityRoll: roll };
        }
        return { allow: true, reason: 'continue-chat', probabilityRoll: roll };
    }

    return { allow: true, reason: 'reply-user' };
}

function buildActiveReplyInstruction(contact, context, decision, now = Date.now()) {
    const elapsedText = formatElapsedZh(context && context.silenceMs ? context.silenceMs : 0);
    const flowSummary = buildActiveReplyRecentFlow(context && context.realMessages ? context.realMessages : []);
    const activeSummary = buildRecentActiveReplySummary(context && context.history ? context.history : []);
    const currentTimeContext = typeof buildRealtimeTimeContext === 'function'
        ? buildRealtimeTimeContext(contact.id)
        : '';

    if (context.branch === 'reply-user') {
        return `（系统提示：主动发消息模式触发。距离用户上一条真实消息已过去 ${elapsedText}。请自然接住对方刚才的话，可以轻描淡写解释回复稍晚，也可以直接顺着话题继续。优先延续当前语境，不要突然跳到很远的新话题，不要写成系统通知，不要像任务播报。${flowSummary}${activeSummary}${currentTimeContext ? `\n${currentTimeContext}` : ''}）`;
    }

    return `（系统提示：主动发消息模式触发。距离你上一条真实消息已过去 ${elapsedText}，用户一直没有继续。请像真人隔了一阵又想起什么：可以补一句、分享你当下的状态/见闻，或自然换一个轻话题，但必须和最近聊天、当前时间或你正在做的事有自然衔接。不要突然抛出完全无关的大话题，不要写成系统通知，也不要重复你最近主动发过的表达。${flowSummary}${activeSummary}${currentTimeContext ? `\n${currentTimeContext}` : ''}）`;
}

async function triggerSingleActiveReply(contact, runtimeState, options = {}) {
    const now = Date.now();
    const runtimeEntry = updateActiveReplyRuntimeEntry(runtimeState, contact.id, {
        lastCheckAt: now,
        schedulerHeartbeatAt: now
    });
    const context = collectActiveReplyContext(contact, now);
    if (!context) {
        return false;
    }

    const decision = shouldTriggerActiveReply(contact, context, runtimeEntry, now);
    if (!decision.allow) {
        return false;
    }

    const activeInstruction = buildActiveReplyInstruction(contact, context, decision, now);
    const triggered = await generateAiReply(activeInstruction, contact.id, {
        triggerSource: 'active'
    });

    if (!triggered) {
        return false;
    }

    const triggerAt = Date.now();
    updateActiveReplyRuntimeEntry(runtimeState, contact.id, {
        lastCheckAt: triggerAt,
        lastTriggeredAt: triggerAt,
        lastTriggeredAnchorId: context.lastMessage && context.lastMessage.id ? String(context.lastMessage.id) : '',
        schedulerHeartbeatAt: triggerAt
    });
    contact.lastActiveReplyTriggeredMsgId = context.lastMessage && context.lastMessage.id ? context.lastMessage.id : null;
    saveConfig();
    return true;
}

function isRealConversationMsg(msg) {
    if (!msg) return false;
    if (msg.role !== 'user' && msg.role !== 'assistant') return false;
    if (msg.type === 'system_event' || msg.type === 'live_sync_hidden' || msg.type === 'voice_call_text') return false;
    if (typeof msg.content !== 'string') return false;
    if (msg.type === 'text') {
        if (isHiddenForumWechatSyncText(msg.content)) return false;
        if (msg.content.startsWith('[系统消息]:') || msg.content.startsWith('[系统]:') || msg.content.startsWith('[系统错误]:') || msg.content.startsWith('[系统诊断]:')) return false;
    }
    return true;
}

function getChatPromptTimestampMs(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        if (Number.isFinite(parsed)) return parsed;
        const numeric = Number(value);
        if (Number.isFinite(numeric)) return numeric;
    }
    if (value instanceof Date) {
        const time = value.getTime();
        return Number.isFinite(time) ? time : 0;
    }
    return 0;
}

function getRealtimeMealWindowLabel(date = new Date()) {
    const hour = date.getHours();
    if (hour >= 5 && hour < 9) return '早餐时段';
    if (hour >= 11 && hour < 13) return '午餐时段';
    if (hour >= 17 && hour < 20) return '晚餐时段';
    if (hour >= 21 || hour < 1) return '夜宵/深夜时段';
    return '非典型饭点';
}

function getRealtimeDayPhaseMeta(date = new Date()) {
    const hour = date.getHours();
    const mealLabel = getRealtimeMealWindowLabel(date);
    if (hour >= 5 && hour < 8) {
        return {
            label: '清晨',
            allowedGreetings: '早安、早上好',
            bannedGreetings: '晚安、晚上好、午安',
            toneHint: `适合刚醒来、准备出门、轻一点的清晨语气；当前是${mealLabel}`
        };
    }
    if (hour >= 8 && hour < 11) {
        return {
            label: '上午',
            allowedGreetings: '早上好、上午好',
            bannedGreetings: '晚安、晚上好',
            toneHint: `适合白天刚展开的节奏，别写成深夜氛围；当前是${mealLabel}`
        };
    }
    if (hour >= 11 && hour < 13) {
        return {
            label: '中午',
            allowedGreetings: '中午好、午安',
            bannedGreetings: '早安、晚安、晚上好',
            toneHint: `允许聊午饭、午休、正午状态；当前是${mealLabel}`
        };
    }
    if (hour >= 13 && hour < 17) {
        return {
            label: '下午',
            allowedGreetings: '下午好',
            bannedGreetings: '早安、晚安、晚上好',
            toneHint: `适合下午的工作/学习/出行节奏；当前是${mealLabel}`
        };
    }
    if (hour >= 17 && hour < 19) {
        return {
            label: '傍晚',
            allowedGreetings: '傍晚好、晚上好',
            bannedGreetings: '早安、午安',
            toneHint: `适合一天快收尾、准备吃晚饭或刚忙完的状态；当前是${mealLabel}`
        };
    }
    if (hour >= 19 && hour < 22) {
        return {
            label: '晚上',
            allowedGreetings: '晚上好',
            bannedGreetings: '早安、上午好、下午好',
            toneHint: `适合夜聊、放松、晚间陪伴感；当前是${mealLabel}`
        };
    }
    if (hour >= 22 || hour < 1) {
        return {
            label: '深夜',
            allowedGreetings: '可以不特意问候，直接自然接话',
            bannedGreetings: '早安、上午好、下午好；也不要模板化催睡',
            toneHint: `适合偏安静、偏私密、轻一点的深夜语气；当前是${mealLabel}`
        };
    }
    return {
        label: '凌晨',
        allowedGreetings: '可以直接接话，不必强行打招呼',
        bannedGreetings: '早安、上午好、下午好、晚上好；也不要模板化催睡',
        toneHint: `适合熬夜、失眠、还醒着的凌晨语气，但不要把时间写错；当前是${mealLabel}`
    };
}

function buildRealtimeHolidaySummary(date = new Date()) {
    if (!window.getCalendarChatContext || typeof window.getCalendarChatContext !== 'function') {
        return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    try {
        const calendarData = window.getCalendarChatContext(dateKey);
        if (!calendarData || typeof calendarData !== 'object') return '';

        const formatHoliday = (holiday, includeDaysAway = false) => {
            if (!holiday) return '';
            const name = holiday.name || holiday.label || '节日安排';
            const typeLabel = holiday.type === 'workday'
                ? '调休补班'
                : (holiday.type === 'festival' ? '普通节日' : '节假日');
            const daysAwayText = includeDaysAway && Number.isInteger(holiday.daysAway)
                ? `，还有${holiday.daysAway}天`
                : '';
            return `${name}（${typeLabel}${daysAwayText}）`;
        };

        if (calendarData.todayHoliday) {
            return `今天是${formatHoliday(calendarData.todayHoliday)}`;
        }
        if (calendarData.upcomingHoliday && Number.isInteger(calendarData.upcomingHoliday.daysAway) && calendarData.upcomingHoliday.daysAway <= 1) {
            const prefix = calendarData.upcomingHoliday.daysAway === 0 ? '今天是' : '明天是';
            return `${prefix}${formatHoliday(calendarData.upcomingHoliday, false)}`;
        }
    } catch (error) {
        return '';
    }

    return '';
}

function buildRealtimeConversationGapGuidance(latestMsg, nowMs = Date.now()) {
    if (!latestMsg) {
        return '首次对话：请把它当作刚开始建立印象的聊天，不要假装你们已经聊到一半。';
    }

    const latestAt = getChatPromptTimestampMs(latestMsg.time);
    if (!latestAt) {
        return '时间戳缺失：优先按自然聊天处理，不要编造具体过去了多久。';
    }

    const gapMs = Math.max(0, nowMs - latestAt);
    const gapText = formatElapsedZh(gapMs);

    if (gapMs < 5 * 60000) {
        return '这是刚接上的一轮对话，可以自然顺着当前话题往下说，不必硬提时间。';
    }
    if (gapMs < 30 * 60000) {
        return `距上一条消息约${gapText}，间隔不长，可继续当前语境，不必刻意解释晚回复。`;
    }
    if (gapMs < 6 * 3600000) {
        return `距上一条消息约${gapText}，可以轻微体现时间感（如“刚忙完”“刚看到”），但不要太刻意。`;
    }
    if (gapMs < 24 * 3600000) {
        return latestMsg.role === 'user'
            ? `用户上一条消息已过去${gapText}。回复时可以自然承认不是秒回，但不要把场景写成还停留在上一秒。`
            : `你上一条消息已过去${gapText}。这不是无缝衔接的一口气聊天，可自然补一句、续一句或换个轻话题。`;
    }
    if (gapMs < 72 * 3600000) {
        return `已经隔了${gapText}。请承认这是一段断档后的继续，不要假装上一幕还在即时发生。`;
    }
    return `已经过去${gapText}。必须明显承认久未联系的时间感，可自然重开话题，但不要写成无缝接上一句。`;
}

function buildRealtimeFinishedActivityReminder(realMessages = [], nowMs = Date.now()) {
    if (!Array.isArray(realMessages) || realMessages.length === 0) return '';

    const recentBlock = [];
    for (let i = realMessages.length - 1; i >= 0 && recentBlock.length < 15; i--) {
        const message = realMessages[i];
        if (!message) continue;

        if (recentBlock.length > 0) {
            const newerTime = getChatPromptTimestampMs(recentBlock[recentBlock.length - 1].time);
            const currentTime = getChatPromptTimestampMs(message.time);
            if (newerTime && currentTime && (newerTime - currentTime > 30 * 60000)) {
                break;
            }
        }
        recentBlock.push(message);
    }

    const recentUserMessages = recentBlock.filter(message => message && message.role === 'user');
    if (!recentUserMessages.length) return '';

    const lastUserMessage = recentUserMessages[0] || null;
    const lastUserAt = lastUserMessage ? getChatPromptTimestampMs(lastUserMessage.time) : 0;
    if (!lastUserAt) return '';

    const gapMs = Math.max(0, nowMs - lastUserAt);
    const recentUserText = recentUserMessages
        .map(message => getActiveReplyPreviewText(message))
        .filter(Boolean)
        .join(' ');
    if (!recentUserText) return '';

    const activityPatterns = [
        { patterns: [/开会|會議|会议|meeting|去开会|去開會|要开会|要開會/i], label: '开会', durationMin: 120 },
        { patterns: [/上课|上課|去学校|去學校|class|lecture/i], label: '上课', durationMin: 180 },
        { patterns: [/考试|考試|exam|test|测验|測驗/i], label: '考试', durationMin: 120 },
        { patterns: [/吃饭|吃飯|吃个饭|吃個飯|去吃|用餐|午餐|晚餐|早餐|dinner|lunch|breakfast/i], label: '吃饭', durationMin: 60 },
        { patterns: [/洗澡|冲澡|沖澡|泡澡|shower|bath/i], label: '洗澡', durationMin: 30 },
        { patterns: [/睡觉|睡覺|去睡|先睡|晚安|goodnight|sleep/i], label: '睡觉', durationMin: 420 },
        { patterns: [/出门|出門|出去|外出|go out/i], label: '出门', durationMin: 120 },
        { patterns: [/运动|運動|健身|跑步|gym|workout|exercise/i], label: '运动', durationMin: 90 },
        { patterns: [/加班|overtime|work late/i], label: '加班', durationMin: 180 },
        { patterns: [/看医生|看醫生|看牙|去医院|去醫院|doctor|hospital/i], label: '看医生', durationMin: 120 },
        { patterns: [/逛街|购物|購物|shopping/i], label: '逛街', durationMin: 120 },
        { patterns: [/搭车|搭車|坐车|坐車|通勤|commute|搭地铁|搭地鐵|搭捷运|搭捷運/i], label: '通勤', durationMin: 60 },
        { patterns: [/面试|面試|interview/i], label: '面试', durationMin: 90 },
        { patterns: [/打工|兼职|兼職|part.?time/i], label: '打工', durationMin: 240 },
        { patterns: [/上班|去公司|work/i], label: '上班', durationMin: 480 }
    ];

    const matchedLabels = activityPatterns
        .filter(item => gapMs >= item.durationMin * 1.5 * 60000 && item.patterns.some(pattern => pattern.test(recentUserText)))
        .map(item => item.label);

    if (!matchedLabels.length) return '';

    const uniqueLabels = [...new Set(matchedLabels)].slice(0, 3);
    const gapText = formatElapsedZh(gapMs);
    return `用户最近提到过：${uniqueLabels.join('、')}。按现在的时间看，距离那时已经过去约${gapText}，这些事情大概率早就结束了。不要再问“还在${uniqueLabels[0]}吗”这种把旧事当成仍在进行中的话；如果要跟进，请改成过去时，例如“你那会儿${uniqueLabels[0]}还顺利吗？”`;
}

function buildRealtimeTimeContext(contactId) {
    const nowMs = Date.now();
    const now = new Date(nowMs);
    const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
    const nowStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdayMap[now.getDay()]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const history = window.iphoneSimState.chatHistory[contactId] || [];
    const visibleMsgs = history.filter(isRealConversationMsg);
    const lastUserMsg = [...visibleMsgs].reverse().find(m => m.role === 'user') || null;
    const lastAssistantMsg = [...visibleMsgs].reverse().find(m => m.role === 'assistant') || null;
    const latestMsg = visibleMsgs.length > 0 ? visibleMsgs[visibleMsgs.length - 1] : null;

    const userGap = lastUserMsg ? formatElapsedZh(nowMs - (lastUserMsg.time || nowMs)) : '暂无';
    const aiGap = lastAssistantMsg ? formatElapsedZh(nowMs - (lastAssistantMsg.time || nowMs)) : '暂无';

    let roundState = '当前暂无完整互动记录';
    if (latestMsg) {
        const latestGap = formatElapsedZh(nowMs - (latestMsg.time || nowMs));
        if (latestMsg.role === 'user') {
            roundState = `用户刚发来消息，尚未收到你的新回复，已过去 ${latestGap}`;
        } else {
            roundState = `你刚回复完用户，用户暂未继续，已过去 ${latestGap}`;
        }
    }

    return `\n【当前真实时间】\n现在是：${nowStr}\n时区：${timezone}\n\n【时间间隔感知】\n- 距离用户上一条消息：${userGap}\n- 距离你上一条消息：${aiGap}\n- 当前互动状态：${roundState}\n\n⚠️ 重要提示：\n- 你必须严格以以上时间信息判断“现在”和“间隔”，不要自行编造时间。\n- 若间隔较长，请自然体现时间感（例如“刚忙完”“久等了”），但避免每句都提时间。\n`;
}

function getLastAiBlockJson(contactId) {
    const history = window.iphoneSimState.chatHistory[contactId];
    if (!history || history.length === 0) return null;

    let indices = [];
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'assistant') {
            indices.unshift(i);
        } else {
            break;
        }
    }

    if (indices.length === 0) return null;

    let jsonOutput = [];
    
    for (let i = 0; i < indices.length; i++) {
        const msg = history[indices[i]];
        
        if (msg.thought) {
            jsonOutput.push({ type: "thought", content: msg.thought });
        }

        if (msg.type === 'text') {
            jsonOutput.push({ type: "text", content: msg.content });
        } else if (msg.type === 'sticker') {
            jsonOutput.push({ type: "sticker", content: msg.description || msg.content });
        } else if (msg.type === 'image' || msg.type === 'virtual_image') {
            const rawImageContent = String(msg.content || '').trim();
            const fallbackVirtualImageUrl = String((window.iphoneSimState && window.iphoneSimState.defaultVirtualImageUrl) || '').trim();
            const isStoredLocalImage = typeof window.isChatMediaReference === 'function' && window.isChatMediaReference(rawImageContent);
            const useRawImageUrl = msg.type === 'image'
                && /^https?:\/\//i.test(rawImageContent)
                && !isStoredLocalImage
                && (!fallbackVirtualImageUrl || rawImageContent !== fallbackVirtualImageUrl);
            const normalizedImageContent = useRawImageUrl
                ? rawImageContent
                : (msg.description || (isStoredLocalImage ? '[图片]' : rawImageContent) || '[图片]');
            const item = { type: "image", content: normalizedImageContent };
            if (msg.novelaiPrompt) item.novelaiPrompt = msg.novelaiPrompt;
            if (msg.novelaiNegativePrompt) item.novelaiNegativePrompt = msg.novelaiNegativePrompt;
            jsonOutput.push(item);
        } else if (msg.type === 'voice') {
            let content = "语音";
            let duration = 3;
            try {
                const data = JSON.parse(msg.content);
                content = data.text;
                duration = data.duration;
            } catch(e) {}
            jsonOutput.push({ type: "voice", duration: duration, content: content });
        } else if (msg.type === 'description') {
             jsonOutput.push({ type: "text", content: msg.content }); 
        } else if (msg.type === 'transfer') {
             try {
                 const data = JSON.parse(msg.content);
                 jsonOutput.push({ type: "action", command: "TRANSFER", payload: `${data.amount} ${data.remark}` });
             } catch(e) {}
        }
    }

    return JSON.stringify(jsonOutput, null, 2);
}

async function checkActiveReplies(options = {}) {
    if (window.offlinePushSync && window.offlinePushSync.getState) {
        const syncState = window.offlinePushSync.getState();
        if (syncState && syncState.enabled && syncState.disableLocalActiveReplyScheduler) {
            return false;
        }
    }
    if (!window.iphoneSimState || !window.iphoneSimState.contacts) return false;

    const now = Date.now();

    window.iphoneSimState.contacts.forEach(contact => {
        if (!contact.activeReplyEnabled) return;
        if (isMeetingStoryModeActiveForContact(contact.id)) return;
        if (typeof window.ensureContactRestWindowFields === 'function') {
            window.ensureContactRestWindowFields(contact);
        }

        const history = window.iphoneSimState.chatHistory[contact.id];
        if (!history || history.length === 0) return;

        if (typeof window.getContactRestTriggerDecision === 'function') {
            const restDecision = window.getContactRestTriggerDecision(contact, 'active', now);
            if (!restDecision.allow) return;
        }

        const lastMsg = history[history.length - 1];
        const intervalMs = (contact.activeReplyInterval || 60) * 1000;

        if (contact.activeReplyStartTime && lastMsg.time <= contact.activeReplyStartTime) {
            return;
        }

        if (contact.lastActiveReplyTriggeredMsgId === lastMsg.id) return;

        if (now - lastMsg.time > intervalMs) {
            console.log(`[ActiveReply] Triggering for ${contact.name}`);

            contact.lastActiveReplyTriggeredMsgId = lastMsg.id;
            saveConfig();

            let activeInstruction = '';
            const timeDiff = now - lastMsg.time;
            const minutesPassed = Math.floor(timeDiff / 60000);

            if (lastMsg.role === 'user') {
                activeInstruction = `（系统提示：主动发消息模式触发。距离用户上一条消息已过去 ${minutesPassed} 分钟。请在不打断人设的前提下自然接住对方刚才的话；可以轻描淡写解释回复稍晚，也可以直接顺着话题继续。）`;
            } else {
                activeInstruction = `（系统提示：主动发消息模式触发。距离你上一条消息已过去 ${minutesPassed} 分钟，用户一直没有回复。请像真人间隔一阵后自然续聊：可以补一句、换一个轻话题，或分享当下状态/见闻；不要写成系统通知或任务播报。）`;
            }

            generateAiReply(activeInstruction, contact.id, { triggerSource: 'active' });
        }
    });

    return true;
}

function clearActiveReplySchedulerTimers() {
    const state = window.__activeReplyScheduler;
    if (!state) return;
    if (state.initialTimeoutId) {
        clearTimeout(state.initialTimeoutId);
        state.initialTimeoutId = null;
    }
    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
    if (state.watchdogId) {
        clearInterval(state.watchdogId);
        state.watchdogId = null;
    }
}

function startActiveReplyScheduler(force = false) {
    if (!window.__activeReplyScheduler) {
        window.__activeReplyScheduler = {};
    }

    const state = window.__activeReplyScheduler;
    const now = Date.now();
    const isStale = !state.lastTickAt || (now - Number(state.lastTickAt) > ACTIVE_REPLY_SCHEDULER_STALE_MS);
    if (!force && state.intervalId && state.watchdogId && !isStale) {
        return state;
    }

    clearActiveReplySchedulerTimers();
    state.initialTimeoutId = window.setTimeout(() => {
        checkActiveReplies({ source: 'initial' }).catch(err => console.error('[ActiveReply] initial check failed', err));
    }, ACTIVE_REPLY_INITIAL_DELAY_MS);
    state.intervalId = window.setInterval(() => {
        checkActiveReplies({ source: 'interval' }).catch(err => console.error('[ActiveReply] interval check failed', err));
    }, ACTIVE_REPLY_INTERVAL_MS);
    state.watchdogId = window.setInterval(() => {
        const scheduler = window.__activeReplyScheduler || {};
        if (scheduler.running) return;
        const stale = !scheduler.lastTickAt || (Date.now() - Number(scheduler.lastTickAt) > ACTIVE_REPLY_SCHEDULER_STALE_MS);
        if (stale) {
            console.warn('[ActiveReply] scheduler heartbeat stale, rebuilding timers');
            startActiveReplyScheduler(true);
        }
    }, ACTIVE_REPLY_WATCHDOG_INTERVAL_MS);

    return state;
}

function getActiveReplyForegroundRecoveryDelay() {
    if (window.offlinePushSync && typeof window.offlinePushSync.getState === 'function') {
        const syncState = window.offlinePushSync.getState();
        if (syncState && syncState.enabled) {
            return ACTIVE_REPLY_FOREGROUND_SYNC_WAIT_MS;
        }
    }
    return 120;
}

function scheduleActiveReplyForegroundCatchUp(reason = 'foreground', delayMs = null) {
    if (!window.__activeReplyScheduler) {
        window.__activeReplyScheduler = {};
    }
    const state = window.__activeReplyScheduler;
    if (state.foregroundTimerId) {
        clearTimeout(state.foregroundTimerId);
        state.foregroundTimerId = null;
    }
    const waitMs = Number.isFinite(Number(delayMs)) ? Number(delayMs) : getActiveReplyForegroundRecoveryDelay();
    state.foregroundTimerId = window.setTimeout(async () => {
        state.foregroundTimerId = null;
        startActiveReplyScheduler();

        if (window.offlinePushSync && typeof window.offlinePushSync.getState === 'function') {
            const syncState = window.offlinePushSync.getState();
            if (syncState && syncState.enabled && typeof window.offlinePushSync.syncMessages === 'function') {
                try {
                    await window.offlinePushSync.syncMessages();
                } catch (err) {
                    console.error('[ActiveReply] foreground syncMessages failed', err);
                }
            }
        }

        try {
            await checkActiveReplies({ source: reason, catchUp: true });
        } catch (err) {
            console.error('[ActiveReply] foreground catch-up failed', err);
        }
    }, Math.max(0, waitMs));
}

function setupActiveReplyKeepalive() {
    if (window.__activeReplyKeepaliveSetup) {
        startActiveReplyScheduler();
        return;
    }
    window.__activeReplyKeepaliveSetup = true;
    startActiveReplyScheduler();

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            markActiveReplyBackgrounded();
            return;
        }
        startActiveReplyScheduler();
        scheduleActiveReplyForegroundCatchUp('visibility-visible');
    });

    window.addEventListener('pagehide', () => {
        markActiveReplyBackgrounded();
    });

    window.addEventListener('pageshow', () => {
        startActiveReplyScheduler();
        scheduleActiveReplyForegroundCatchUp('pageshow');
    });

    window.addEventListener('focus', () => {
        startActiveReplyScheduler();
        scheduleActiveReplyForegroundCatchUp('focus', getActiveReplyForegroundRecoveryDelay() + 400);
    });

    window.addEventListener('online', () => {
        startActiveReplyScheduler();
        scheduleActiveReplyForegroundCatchUp('online', getActiveReplyForegroundRecoveryDelay() + 800);
    });
}

window.updateSystemSettingsUi = function() {
    const sysNotifToggle = document.getElementById('system-notification-toggle');
    if (sysNotifToggle) {
        sysNotifToggle.checked = window.iphoneSimState.enableSystemNotifications || false;
    }
    
    const bgAudioToggle = document.getElementById('background-audio-toggle');
    if (bgAudioToggle) {
        bgAudioToggle.checked = window.iphoneSimState.enableBackgroundAudio || false;
    }
};

// helper: generate simple forum post content based on recent chat
window.generateForumPostContent = async function(contactId) {
    const history = window.iphoneSimState.chatHistory[contactId] || [];
    let content = '自动发帖';
    if (history.length > 0) {
        const last = history[history.length-1];
        content += '：'+ (last.content || '').substring(0, 50);
    }
    return content;
};

// scheduler for auto-posting
window.startForumAutoPostScheduler = function() {
    setInterval(async () => {
        if (!window.forumState) return; // forum module not initialized yet
        const contacts = window.iphoneSimState.contacts || [];
        if (!contacts.length) return;
        contacts.forEach(async c => {
            const profiles = (window.forumState && window.forumState.settings && window.forumState.settings.contactProfiles) ? window.forumState.settings.contactProfiles : {};
            const prof = profiles[c.id] || {};
            if (prof.syncWechat && prof.autoPostEnabled && prof.autoPostInterval > 0) {
                const now = Date.now();
                if (!prof._lastAutoPost) prof._lastAutoPost = 0;
                if (now - prof._lastAutoPost >= prof.autoPostInterval * 60000) {
                    prof._lastAutoPost = now;
                    profiles[c.id] = prof;
                    if (window.forumState && window.forumState.settings) {
                        window.forumState.settings.contactProfiles = profiles;
                        localStorage.setItem('forum_settings', JSON.stringify(window.forumState.settings));
                    }
                    let caption = await window.generateForumPostContent(c.id);
                    if (window.addForumPost) window.addForumPost(c.id, caption, []);
                }
            }
        });
    }, 60000);
};

// 注册初始化函数
if (window.appInitFunctions) {
    window.appInitFunctions.push(setupChatListeners);
    window.appInitFunctions.push(() => {
        setInterval(checkActiveReplies, 5000);
    });
    window.appInitFunctions.push(() => {
        checkRestWindowUpcomingNotices();
        setInterval(checkRestWindowUpcomingNotices, 60000);
    });
    window.appInitFunctions.push(() => {
        if (window.startForumAutoPostScheduler) window.startForumAutoPostScheduler();
    });
}

