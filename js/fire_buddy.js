(function () {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const GRAY_TIMEOUT_MS = 48 * 60 * 60 * 1000;
    const INVITE_STREAK_DAYS = 3;
    const WARM_STREAK_DAYS = 2;
    const FIRE_BUDDY_STAGE_TEXT = {
        locked: '未解锁',
        invitable: '可邀请',
        bound: '已绑定',
        gray: '已休眠'
    };

    const FIRE_BUDDY_MANUAL_MODES = ['locked', 'warming', 'invitable', 'invited', 'bound', 'gray', 'wake-ready'];
    const DEFAULT_FIRE_BUDDY_DISPLAY_MODE = 'topbar';
    const DEFAULT_FIRE_BUDDY_PET_SIZE = 92;
    const MIN_FIRE_BUDDY_PET_SIZE = 56;
    const MAX_FIRE_BUDDY_PET_SIZE = 150;
    const DEFAULT_FIRE_BUDDY_PET_POSITION = { xRatio: 0.82, yRatio: 0.72 };
    const FIRE_BUDDY_PET_DRAG_THRESHOLD = 6;
    const DEFAULT_FIRE_BUDDY_PET_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180" fill="none">
  <ellipse cx="92" cy="156" rx="34" ry="11" fill="rgba(0,0,0,0.14)"/>
  <path d="M90 24c10 16 30 26 30 52 0 14-6 26-16 35 14-2 31 8 31 29 0 22-18 40-43 40-26 0-47-18-47-42 0-17 11-30 24-36-8-8-13-19-13-31 0-21 14-34 34-47z" fill="#ff8a38"/>
  <path d="M95 42c6 10 17 18 17 33 0 10-5 18-12 24 11-1 24 6 24 22 0 17-14 31-34 31-20 0-36-14-36-33 0-13 8-23 18-28-6-6-10-13-10-22 0-14 9-23 33-40z" fill="#ffb347"/>
  <path d="M92 61c4 7 11 12 11 23 0 8-4 15-10 20 8-1 17 5 17 15 0 12-9 21-21 21-13 0-23-9-23-22 0-9 5-16 12-20-4-4-6-9-6-15 0-11 8-18 20-22z" fill="#fff2c6"/>
  <circle cx="82" cy="112" r="5" fill="#3a2416"/>
  <circle cx="102" cy="112" r="5" fill="#3a2416"/>
  <path d="M84 126c4 5 10 5 14 0" stroke="#3a2416" stroke-width="4" stroke-linecap="round"/>
  <circle cx="72" cy="124" r="5" fill="#ff8f8f" fill-opacity="0.55"/>
  <circle cx="112" cy="124" r="5" fill="#ff8f8f" fill-opacity="0.55"/>
</svg>
`)}`;

    window.DEFAULT_FIRE_BUDDY_PET_IMAGE = window.DEFAULT_FIRE_BUDDY_PET_IMAGE || DEFAULT_FIRE_BUDDY_PET_IMAGE;

    const fireBuddyPetPointerState = {
        active: false,
        moved: false,
        pointerId: null,
        startX: 0,
        startY: 0,
        startLeft: 0,
        startTop: 0
    };

    function getState() {
        if (!window.iphoneSimState || typeof window.iphoneSimState !== 'object') {
            window.iphoneSimState = {};
        }
        if (!Array.isArray(window.iphoneSimState.contacts)) {
            window.iphoneSimState.contacts = [];
        }
        if (!window.iphoneSimState.chatHistory || typeof window.iphoneSimState.chatHistory !== 'object') {
            window.iphoneSimState.chatHistory = {};
        }
        return window.iphoneSimState;
    }

    function cloneList(value) {
        return Array.isArray(value) ? value.slice() : [];
    }

    function clamp01(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return 0;
        return Math.max(0, Math.min(1, number));
    }

    function clampFireBuddyPetSize(rawSize) {
        const size = Number(rawSize);
        if (!Number.isFinite(size)) return DEFAULT_FIRE_BUDDY_PET_SIZE;
        return Math.max(MIN_FIRE_BUDDY_PET_SIZE, Math.min(MAX_FIRE_BUDDY_PET_SIZE, Math.round(size)));
    }

    function normalizeFireBuddyPetPosition(position) {
        if (!position || typeof position !== 'object') {
            return { ...DEFAULT_FIRE_BUDDY_PET_POSITION };
        }
        const x = Number(position.xRatio);
        const y = Number(position.yRatio);
        return {
            xRatio: Number.isFinite(x) ? clamp01(x) : DEFAULT_FIRE_BUDDY_PET_POSITION.xRatio,
            yRatio: Number.isFinite(y) ? clamp01(y) : DEFAULT_FIRE_BUDDY_PET_POSITION.yRatio
        };
    }

    function getFireBuddyDisplayMode(contact) {
        const fireBuddy = ensureFireBuddy(contact);
        if (!fireBuddy) return DEFAULT_FIRE_BUDDY_DISPLAY_MODE;
        return fireBuddy.ui.displayMode === 'desktop-pet' ? 'desktop-pet' : DEFAULT_FIRE_BUDDY_DISPLAY_MODE;
    }

    function ensureFireBuddy(contact) {
        if (!contact || typeof contact !== 'object') return null;

        const existing = contact.fireBuddy && typeof contact.fireBuddy === 'object' ? contact.fireBuddy : {};
        const manualUnlock = existing.manualUnlock && typeof existing.manualUnlock === 'object'
            ? existing.manualUnlock
            : {};
        const spark = existing.spark && typeof existing.spark === 'object' ? existing.spark : {};
        const stats = existing.stats && typeof existing.stats === 'object' ? existing.stats : {};
        const ui = existing.ui && typeof existing.ui === 'object' ? existing.ui : {};
        const profile = existing.profile && typeof existing.profile === 'object' ? existing.profile : {};

        contact.fireBuddy = {
            enabled: typeof existing.enabled === 'boolean' ? existing.enabled : true,
            status: typeof existing.status === 'string' ? existing.status : 'locked',
            lastDerivedStatus: typeof existing.lastDerivedStatus === 'string' ? existing.lastDerivedStatus : 'locked',
            boundAt: Number.isFinite(existing.boundAt) ? existing.boundAt : null,
            invitedAt: Number.isFinite(existing.invitedAt) ? existing.invitedAt : null,
            grayAt: Number.isFinite(existing.grayAt) ? existing.grayAt : null,
            awakenedAt: Number.isFinite(existing.awakenedAt) ? existing.awakenedAt : null,
            lastStatusChangedAt: Number.isFinite(existing.lastStatusChangedAt) ? existing.lastStatusChangedAt : null,
            manualUnlock: {
                enabled: !!manualUnlock.enabled,
                mode: FIRE_BUDDY_MANUAL_MODES.includes(manualUnlock.mode) ? manualUnlock.mode : 'locked'
            },
            spark: {
                activeDays: cloneList(spark.activeDays),
                unlockReadyAt: Number.isFinite(spark.unlockReadyAt) ? spark.unlockReadyAt : null
            },
            stats: {
                firstMessageAt: Number.isFinite(stats.firstMessageAt) ? stats.firstMessageAt : null,
                lastMessageAt: Number.isFinite(stats.lastMessageAt) ? stats.lastMessageAt : null,
                messageCount: Number.isFinite(stats.messageCount) ? stats.messageCount : 0,
                effectiveDays: Number.isFinite(stats.effectiveDays) ? stats.effectiveDays : 0,
                currentStreak: Number.isFinite(stats.currentStreak) ? stats.currentStreak : 0,
                longestStreak: Number.isFinite(stats.longestStreak) ? stats.longestStreak : 0,
                warmProgress: Number.isFinite(stats.warmProgress) ? stats.warmProgress : 0
            },
            profile: {
                name: typeof profile.name === 'string' ? profile.name : '',
                persona: typeof profile.persona === 'string' ? profile.persona : ''
            },
            ui: {
                lastPanelTab: typeof ui.lastPanelTab === 'string' ? ui.lastPanelTab : 'home',
                displayMode: ui.displayMode === 'desktop-pet' ? 'desktop-pet' : DEFAULT_FIRE_BUDDY_DISPLAY_MODE,
                topbarIconVisible: ui.topbarIconVisible !== false,
                petImage: typeof ui.petImage === 'string' ? ui.petImage : '',
                petSize: clampFireBuddyPetSize(ui.petSize),
                petPosition: normalizeFireBuddyPetPosition(ui.petPosition),
                invitableCardShownAt: Number.isFinite(ui.invitableCardShownAt) ? ui.invitableCardShownAt : null
            }
        };

        return contact.fireBuddy;
    }

    function ensureAllFireBuddyRoots() {
        const state = getState();
        let changed = false;
        state.contacts.forEach(contact => {
            if (!contact || typeof contact !== 'object') return;
            if (!contact.fireBuddy || typeof contact.fireBuddy !== 'object') {
                changed = true;
            }
            ensureFireBuddy(contact);
        });
        if (changed && typeof window.saveConfig === 'function') {
            window.saveConfig();
        }
    }

    function getContactById(contactId) {
        const state = getState();
        return state.contacts.find(contact => String(contact.id) === String(contactId)) || null;
    }

    function getFireBuddyDisplayName(contact) {
        const fireBuddy = ensureFireBuddy(contact);
        const customName = fireBuddy && fireBuddy.profile && typeof fireBuddy.profile.name === 'string'
            ? fireBuddy.profile.name.trim()
            : '';
        return customName || '小火人';
    }

    function isFireBuddyEnabled(contact) {
        const fireBuddy = ensureFireBuddy(contact);
        return !!(fireBuddy && fireBuddy.enabled !== false);
    }

    function escapeFireBuddyRegExp(value) {
        return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function getFireBuddyMentionToken(contact) {
        return `@${getFireBuddyDisplayName(contact)}`;
    }

    function getFireBuddyPersonaHint(contact, buddyName) {
        const fireBuddy = ensureFireBuddy(contact);
        const personaText = String(fireBuddy && fireBuddy.profile && fireBuddy.profile.persona || '').trim();
        if (!personaText) return '';
        const resolvedName = String(buddyName || getFireBuddyDisplayName(contact) || '小火人').trim();
        return `${resolvedName}的人设补充：${personaText}。`;
    }

    function replaceGenericFireBuddyMention(text, contactId) {
        const contact = getContactById(contactId || getState().currentChatContactId);
        const source = String(text || '');
        if (!contact || !source || !isFireBuddyEnabled(contact)) return source;
        const displayName = getFireBuddyDisplayName(contact);
        if (!displayName || displayName === '小火人') return source;
        return source.replace(/([@＠])小火人/g, (_, prefix) => `${prefix}${displayName}`);
    }

    function detectFireBuddyMentionState(text, contact) {
        if (!contact || !isFireBuddyEnabled(contact) || typeof text !== 'string' || !text) return null;
        const mentionToken = getFireBuddyMentionToken(contact);
        if (!text.includes(mentionToken)) return null;
        const cleanText = text.replace(new RegExp(escapeFireBuddyRegExp(mentionToken), 'g'), '').replace(/\s{2,}/g, ' ').trim();
        return {
            token: mentionToken,
            name: getFireBuddyDisplayName(contact),
            cleanText
        };
    }

    function markFireBuddyMentionOnOutgoingMsg(msg, text, contactId, type, isUser) {
        const contact = getContactById(contactId || getState().currentChatContactId);
        if (!msg || !contact || !isUser || type !== 'text' || !isFireBuddyEnabled(contact)) return msg;
        const mentionState = detectFireBuddyMentionState(text, contact);
        if (!mentionState) return msg;
        msg.fireBuddyMentioned = true;
        msg.fireBuddyMentionConsumed = false;
        msg.fireBuddyMentionName = mentionState.name;
        msg.fireBuddyTriggerSource = 'user';
        msg.fireBuddyTriggerSpeakerName = (getState().userProfile && getState().userProfile.name) || '用户';
        return msg;
    }

    function markFireBuddyMentionOnAssistantMessage(msg, contactId) {
        const contact = getContactById(contactId || getState().currentChatContactId);
        if (!msg || !contact || msg.role !== 'assistant' || String(msg.type || 'text') !== 'text' || !isFireBuddyEnabled(contact)) return msg;
        const mentionState = detectFireBuddyMentionState(msg.content, contact);
        if (!mentionState) return msg;
        msg.fireBuddyMentioned = true;
        msg.fireBuddyMentionConsumed = false;
        msg.fireBuddyMentionName = mentionState.name;
        msg.fireBuddyTriggerSource = 'contact';
        msg.fireBuddyTriggerSpeakerName = contact.remark || contact.nickname || contact.name || '联系人';
        return msg;
    }

    function formatFireBuddyMentionForContact(msg, contactId) {
        const contact = getContactById(contactId || getState().currentChatContactId);
        if (!msg || !contact || !msg.fireBuddyMentioned || !isFireBuddyEnabled(contact)) {
            return typeof msg === 'object' ? msg.content : '';
        }

        const mentionName = String(msg.fireBuddyMentionName || getFireBuddyDisplayName(contact) || '小火人').trim();
        const mentionState = detectFireBuddyMentionState(msg.content, contact);
        const cleanText = mentionState && mentionState.cleanText
            ? mentionState.cleanText
            : String(msg.content || '').replace(new RegExp(escapeFireBuddyRegExp(`@${mentionName}`), 'g'), '').replace(/\s{2,}/g, ' ').trim();
        const loreText = [
            `${mentionName}是你和用户连续续火花后才会激活的第三方AI角色，由AI扮演，并不是你本人；如果后续不继续续火花，${mentionName}会熄灭、变灰，像“死掉”一样进入休眠。`,
            getFireBuddyPersonaHint(contact, mentionName)
        ].filter(Boolean).join(' ');

        if (!cleanText) {
            return `[用户刚刚 @了${mentionName}。补充设定：${loreText} 这句话主要是对${mentionName}说的，不是直接对你说。若本轮需要让${mentionName}正式出声，必须在同一个 JSON 数组里直接输出几条 {"type":"text_message","speaker":"fire_buddy","content":"..."}，并让这些${mentionName}消息连续出现；你自己的话继续用普通 text_message。]`;
        }

        return `[用户刚刚 @了${mentionName}，主要是在对${mentionName}说：“${cleanText}”。补充设定：${loreText} 这句话不是直接对你说。若本轮需要让${mentionName}正式出声，必须在同一个 JSON 数组里直接输出几条连续的 {"type":"text_message","speaker":"fire_buddy","content":"..."}；你自己的回复则继续用普通 text_message，不能直接冒充${mentionName}。]`;
    }

    function formatFireBuddySpeakerForContact(msg, contactId) {
        const contact = getContactById(contactId || getState().currentChatContactId);
        if (!msg || !contact || msg.speaker !== 'fire-buddy' || !isFireBuddyEnabled(contact)) {
            return typeof msg === 'object' ? msg.content : '';
        }

        const speakerName = String(msg.fireBuddySpeakerName || getFireBuddyDisplayName(contact) || '小火人').trim();
        const content = String(msg.content || '').trim();
        const loreText = [
            `${speakerName}是你和用户连续续火花后才激活的第三方AI角色，由AI扮演，不是你本人；如果后续没有继续续火花，${speakerName}会熄灭、变灰，像“死掉”一样休眠。`,
            getFireBuddyPersonaHint(contact, speakerName)
        ].filter(Boolean).join(' ');
        if (!content) {
            return `[聊天里的另一位发言人 ${speakerName} 刚刚插话了。补充设定：${loreText} 这不是你说的。你接下来可以顺势对ta的插话做一点轻微反应或吐槽。]`;
        }

        return `[聊天里的另一位发言人 ${speakerName} 刚刚连发消息：“${content}”。补充设定：${loreText} 这不是你说的。你下一条回复可以自然地对${speakerName}的发言做一点反应、吐槽或接话，但不要冒充${speakerName}。]`;
    }

    function buildFireBuddyContactSystemPrompt(contactId) {
        const contact = getContactById(contactId || getState().currentChatContactId);
        if (!contact || !isFireBuddyEnabled(contact)) return '';

        const metrics = getHistoryMetrics(contact.id);
        const status = getDerivedFireBuddyStatus(contact, metrics);
        const buddyName = getFireBuddyDisplayName(contact);
        const stageLabel = getFireBuddyStageLabel(status);
        const personaHint = getFireBuddyPersonaHint(contact, buddyName);

        let statusHint = `${buddyName}当前状态为“${stageLabel}”。`;
        if (status === 'bound') {
            statusHint = `${buddyName}当前已经被成功激活并绑定。`;
        } else if (status === 'gray') {
            statusHint = `${buddyName}之前已经因为没有继续续火花而熄灭、变灰，像“死掉”一样进入休眠。`;
        } else if (status === 'wake-ready') {
            statusHint = `${buddyName}之前曾因没有续火花而熄灭休眠，但现在因为最近重新有互动，已经进入可唤醒阶段。`;
        } else if (status === 'invited') {
            statusHint = `${buddyName}已经进入邀请后的待绑定阶段。`;
        } else if (status === 'invitable') {
            statusHint = `${buddyName}已经因为你和用户连续续火花达到条件，进入可邀请激活阶段。`;
        } else if (status === 'warming' || status === 'locked') {
            statusHint = `${buddyName}还在靠你和用户继续续火花慢慢酝酿，尚未完全激活。`;
        }

        let mentionHint = `现在不要主动 @${buddyName} 让ta正式加入对话。`;
        if (status === 'bound' || status === 'wake-ready' || status === 'gray') {
            mentionHint = `如果这一轮聊天气氛合适，你可以直接在本轮 JSON 数组中安排 ${buddyName} 加入。做法是：你自己的消息继续用普通 text_message；凡是要由${buddyName}说的话，必须写成 {"type":"text_message","speaker":"fire_buddy","content":"..."}。如果你决定 @${buddyName}，请在同一轮数组里一次性给出完整顺序，例如“你先 @ta → ${buddyName}连续回复几条 → 你再接一句”。在可见正文里提到ta时，优先使用“@${buddyName}”，不要写成泛称“@小火人”。不要依赖第二次 API，也不要每一轮都强行 @ta。`;
        }

        return `${buddyName}是一个独立的第三方AI角色，由AI扮演，不是你本人，也不是普通联系人。它只有在你和用户连续聊天、持续续火花后才会被激活或绑定；如果之后长时间不继续续火花，它会熄灭、变灰，像“死掉”一样进入休眠。${statusHint}${personaHint}${mentionHint} 当${buddyName}发言时，你要把ta当作聊天里的另一个角色来看待，可以自然回应、调侃、吐槽、吃味或接话，但不要把ta说的话当成你自己说的，也不要冒充ta。`;
    }

    function getPendingFireBuddyMentionMessage(contactId) {
        const history = Array.isArray(getState().chatHistory[contactId]) ? getState().chatHistory[contactId] : [];
        for (let index = history.length - 1; index >= 0; index -= 1) {
            const msg = history[index];
            if (!msg || msg.role !== 'user') continue;
            if (msg.fireBuddyMentioned && !msg.fireBuddyMentionConsumed) {
                return msg;
            }
            break;
        }
        return null;
    }

    function pad2(value) {
        return String(value).padStart(2, '0');
    }

    function toDayKey(timestamp) {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    }

    function dayKeyToIndex(dayKey) {
        const parts = String(dayKey).split('-').map(part => parseInt(part, 10));
        if (parts.length !== 3 || parts.some(num => !Number.isFinite(num))) return null;
        return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / DAY_MS);
    }

    function getLiveStreak(dayKeys) {
        if (!Array.isArray(dayKeys) || dayKeys.length === 0) return 0;
        const indices = dayKeys.map(dayKeyToIndex).filter(Number.isFinite).sort((a, b) => a - b);
        if (!indices.length) return 0;

        const todayIndex = Math.floor(Date.UTC(
            new Date().getFullYear(),
            new Date().getMonth(),
            new Date().getDate()
        ) / DAY_MS);
        const lastIndex = indices[indices.length - 1];
        if (todayIndex - lastIndex > 1) {
            return 0;
        }

        let streak = 1;
        for (let i = indices.length - 1; i > 0; i -= 1) {
            if (indices[i] - indices[i - 1] === 1) {
                streak += 1;
            } else {
                break;
            }
        }
        return streak;
    }

    function getLongestStreak(dayKeys) {
        if (!Array.isArray(dayKeys) || dayKeys.length === 0) return 0;
        const indices = dayKeys.map(dayKeyToIndex).filter(Number.isFinite).sort((a, b) => a - b);
        if (!indices.length) return 0;

        let longest = 1;
        let current = 1;
        for (let i = 1; i < indices.length; i += 1) {
            if (indices[i] - indices[i - 1] === 1) {
                current += 1;
            } else {
                longest = Math.max(longest, current);
                current = 1;
            }
        }
        return Math.max(longest, current);
    }

    function getHistoryMetrics(contactId) {
        const state = getState();
        const history = Array.isArray(state.chatHistory[contactId]) ? state.chatHistory[contactId] : [];
        const effectiveDayMap = new Map();
        let firstMessageAt = null;
        let lastMessageAt = null;
        let messageCount = 0;

        history.forEach(msg => {
            if (!msg || !Number.isFinite(Number(msg.time))) return;
            if (typeof window.shouldHideChatSyncMsg === 'function' && window.shouldHideChatSyncMsg(msg)) return;
            if (msg.speaker === 'fire-buddy') return;
            const messageTime = Number(msg.time);
            messageCount += 1;
            if (firstMessageAt === null || messageTime < firstMessageAt) firstMessageAt = messageTime;
            if (lastMessageAt === null || messageTime > lastMessageAt) lastMessageAt = messageTime;

            const key = toDayKey(messageTime);
            const dayInfo = effectiveDayMap.get(key) || { user: false, assistant: false };
            if (msg.role === 'user') {
                dayInfo.user = true;
            } else {
                dayInfo.assistant = true;
            }
            effectiveDayMap.set(key, dayInfo);
        });

        const activeDays = Array.from(effectiveDayMap.entries())
            .filter(([, dayInfo]) => dayInfo.user && dayInfo.assistant)
            .map(([dayKey]) => dayKey)
            .sort();

        return {
            firstMessageAt,
            lastMessageAt,
            messageCount,
            activeDays,
            effectiveDays: activeDays.length,
            currentStreak: getLiveStreak(activeDays),
            longestStreak: getLongestStreak(activeDays)
        };
    }

    function getDerivedFireBuddyStatus(contact, metrics) {
        const fireBuddy = ensureFireBuddy(contact);
        const manualMode = fireBuddy.manualUnlock.enabled ? fireBuddy.manualUnlock.mode : null;
        let status = 'locked';

        if (manualMode) {
            status = manualMode;
        } else if (fireBuddy.boundAt) {
            status = 'bound';
        } else if (metrics.currentStreak >= INVITE_STREAK_DAYS) {
            status = 'invitable';
        }

        if ((status === 'bound') && metrics.lastMessageAt && (Date.now() - metrics.lastMessageAt) > GRAY_TIMEOUT_MS) {
            status = 'gray';
        }

        return status;
    }

    function formatDateLabel(timestamp) {
        if (!Number.isFinite(timestamp)) return '--';
        const date = new Date(timestamp);
        return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;
    }

    function buildProgressTip(status, metrics) {
        if (status === 'gray') {
            return '超过 48 小时未互动，小火人暂时变灰了。继续聊天即可在下一阶段接上“唤醒”流程。';
        }
        if (status === 'bound') {
            return '你们已经完成第一阶段绑定。下一阶段会继续补上成长值、任务和纪念页的完整玩法。';
        }
        if (status === 'invitable') {
            return '已满足连续 3 个有效互动日。现在可以发起邀请解锁小火人。';
        }
        if (metrics.currentStreak >= WARM_STREAK_DAYS) {
            return `当前已连续互动 ${metrics.currentStreak} 天，再坚持 ${Math.max(0, INVITE_STREAK_DAYS - metrics.currentStreak)} 天就能解锁邀请入口。`;
        }
        return `连续 ${INVITE_STREAK_DAYS} 个有效互动日后可发起邀请。有效互动日要求当天双方都发过私聊消息。`;
    }

    function buildSettingsSummary(contact, metrics, status) {
        const fireBuddy = ensureFireBuddy(contact);
        const parts = [];
        if (fireBuddy.manualUnlock.enabled) {
            parts.push(`调试覆盖：${FIRE_BUDDY_STAGE_TEXT[fireBuddy.manualUnlock.mode] || '未解锁'}`);
        } else {
            parts.push(`当前状态：${FIRE_BUDDY_STAGE_TEXT[status] || '未解锁'}`);
        }
        parts.push(`连续 ${metrics.currentStreak} 天`);
        parts.push(`有效互动 ${metrics.effectiveDays} 天`);
        return parts.join(' · ');
    }

    function refreshFireBuddyState(contactId, reason) {
        const contact = contactId ? getContactById(contactId) : getContactById(getState().currentChatContactId);
        if (!contact) return null;

        const fireBuddy = ensureFireBuddy(contact);
        const metrics = getHistoryMetrics(contact.id);
        const status = getDerivedFireBuddyStatus(contact, metrics);

        fireBuddy.status = status;
        fireBuddy.lastDerivedStatus = status;
        fireBuddy.spark.activeDays = metrics.activeDays;
        fireBuddy.spark.unlockReadyAt = metrics.currentStreak >= INVITE_STREAK_DAYS ? Date.now() : null;
        fireBuddy.stats.firstMessageAt = metrics.firstMessageAt;
        fireBuddy.stats.lastMessageAt = metrics.lastMessageAt;
        fireBuddy.stats.messageCount = metrics.messageCount;
        fireBuddy.stats.effectiveDays = metrics.effectiveDays;
        fireBuddy.stats.currentStreak = metrics.currentStreak;
        fireBuddy.stats.longestStreak = metrics.longestStreak;
        fireBuddy.stats.warmProgress = Math.min(metrics.currentStreak, INVITE_STREAK_DAYS);

        const currentChatContactId = String(getState().currentChatContactId || '');
        const currentAiProfileContactId = String(getState().currentAiProfileContactId || '');
        const panel = document.getElementById('fire-buddy-panel');
        const panelContactId = panel ? String(panel.dataset.contactId || '') : '';

        if (String(contact.id) === currentChatContactId) {
            renderFireBuddyHeader(contact, metrics, status);
            renderFireBuddyPet(contact, metrics, status);
        }
        if (panel && !panel.classList.contains('hidden') && String(contact.id) === panelContactId) {
            renderFireBuddyPanel(contact, metrics, status, reason);
        }
        if (String(contact.id) === currentChatContactId || String(contact.id) === currentAiProfileContactId) {
            updateFireBuddySettingsSummary(contact, metrics, status);
        }

        return { contact, metrics, status };
    }

    function updateFireBuddySettingsSummary(contact, metrics, status) {
        const summaryEl = document.getElementById('chat-setting-fire-buddy-summary');
        if (!summaryEl || !contact) return;
        summaryEl.textContent = buildSettingsSummary(contact, metrics, status);
    }

    function renderFireBuddyHeader(contact, metrics, status) {
        const entryBtn = document.getElementById('fire-buddy-entry');
        if (!entryBtn || !contact) return;

        const shouldShow = (status === 'invitable' || status === 'bound' || status === 'gray') && getFireBuddyDisplayMode(contact) !== 'desktop-pet';
        entryBtn.classList.toggle('hidden', !shouldShow);
        entryBtn.classList.toggle('is-gray', status === 'gray');
        entryBtn.title = status === 'gray'
            ? '小火人已休眠'
            : status === 'bound'
                ? '打开小火人'
                : '小火人可邀请';

        const iconEl = entryBtn.querySelector('.fire-buddy-entry-icon');
        if (iconEl) {
            if (status === 'gray') {
                iconEl.textContent = '🩶';
            } else if (status === 'bound') {
                iconEl.textContent = '🔥';
            } else {
                iconEl.textContent = '✨';
            }
        }

        entryBtn.dataset.contactId = contact.id;
        entryBtn.dataset.status = status;
        entryBtn.dataset.streak = String(metrics.currentStreak || 0);
    }

    function hideFireBuddyPet() {
        const pet = document.getElementById('fire-buddy-pet');
        if (!pet) return;
        pet.classList.add('hidden');
        pet.classList.remove('dragging', 'is-gray');
    }

    function getFireBuddyPetBounds(chatScreen, petSize) {
        const safePadding = 10;
        const headerHeight = chatScreen.querySelector('.chat-header')?.offsetHeight || 0;
        const inputHeight = chatScreen.querySelector('.chat-input-area')?.offsetHeight || 0;

        const minLeft = safePadding;
        const maxLeft = Math.max(minLeft, chatScreen.clientWidth - petSize - safePadding);
        const minTop = headerHeight + safePadding;
        const maxTop = Math.max(minTop, chatScreen.clientHeight - inputHeight - petSize - safePadding);

        return { minLeft, maxLeft, minTop, maxTop };
    }

    function getFireBuddyPetRatioFromPixels(left, top, bounds) {
        const xDenom = Math.max(1, bounds.maxLeft - bounds.minLeft);
        const yDenom = Math.max(1, bounds.maxTop - bounds.minTop);
        return {
            xRatio: clamp01((left - bounds.minLeft) / xDenom),
            yRatio: clamp01((top - bounds.minTop) / yDenom)
        };
    }

    function onFireBuddyPetPointerMove(e) {
        if (!fireBuddyPetPointerState.active) return;
        if (fireBuddyPetPointerState.pointerId !== null && e.pointerId !== undefined && e.pointerId !== fireBuddyPetPointerState.pointerId) return;

        const chatScreen = document.getElementById('chat-screen');
        const pet = document.getElementById('fire-buddy-pet');
        const contact = getContactById(getState().currentChatContactId);
        if (!chatScreen || !pet || !contact) return;

        const dx = e.clientX - fireBuddyPetPointerState.startX;
        const dy = e.clientY - fireBuddyPetPointerState.startY;
        const movedDistance = Math.hypot(dx, dy);

        if (!fireBuddyPetPointerState.moved && movedDistance > FIRE_BUDDY_PET_DRAG_THRESHOLD) {
            fireBuddyPetPointerState.moved = true;
            pet.classList.add('dragging');
        }

        if (!fireBuddyPetPointerState.moved) return;

        const fireBuddy = ensureFireBuddy(contact);
        const petSize = clampFireBuddyPetSize(fireBuddy.ui.petSize || pet.offsetWidth || DEFAULT_FIRE_BUDDY_PET_SIZE);
        const bounds = getFireBuddyPetBounds(chatScreen, petSize);
        const left = Math.max(bounds.minLeft, Math.min(bounds.maxLeft, fireBuddyPetPointerState.startLeft + dx));
        const top = Math.max(bounds.minTop, Math.min(bounds.maxTop, fireBuddyPetPointerState.startTop + dy));

        pet.style.left = `${Math.round(left)}px`;
        pet.style.top = `${Math.round(top)}px`;
        fireBuddy.ui.petPosition = getFireBuddyPetRatioFromPixels(left, top, bounds);
    }

    function onFireBuddyPetPointerUp(e) {
        if (!fireBuddyPetPointerState.active) return;
        if (fireBuddyPetPointerState.pointerId !== null && e.pointerId !== undefined && e.pointerId !== fireBuddyPetPointerState.pointerId) return;

        document.removeEventListener('pointermove', onFireBuddyPetPointerMove);
        document.removeEventListener('pointerup', onFireBuddyPetPointerUp);
        document.removeEventListener('pointercancel', onFireBuddyPetPointerUp);

        const pet = document.getElementById('fire-buddy-pet');
        if (pet) pet.classList.remove('dragging');

        const wasMoved = fireBuddyPetPointerState.moved;
        fireBuddyPetPointerState.active = false;
        fireBuddyPetPointerState.moved = false;
        fireBuddyPetPointerState.pointerId = null;

        if (wasMoved) {
            if (typeof window.saveConfig === 'function') {
                window.saveConfig();
            }
            return;
        }

        if (pet) {
            openFireBuddyPanel(pet.dataset.contactId || getState().currentChatContactId);
        }
    }

    function ensureFireBuddyPetInteractionBound() {
        const pet = document.getElementById('fire-buddy-pet');
        if (!pet || pet.dataset.boundFireBuddyPet === '1') return;

        pet.dataset.boundFireBuddyPet = '1';
        pet.addEventListener('pointerdown', (e) => {
            if (pet.classList.contains('hidden')) return;
            if (e.button !== undefined && e.button !== 0) return;

            e.preventDefault();
            const left = parseFloat(pet.style.left || `${pet.offsetLeft || 0}`);
            const top = parseFloat(pet.style.top || `${pet.offsetTop || 0}`);

            fireBuddyPetPointerState.active = true;
            fireBuddyPetPointerState.moved = false;
            fireBuddyPetPointerState.pointerId = e.pointerId ?? null;
            fireBuddyPetPointerState.startX = e.clientX;
            fireBuddyPetPointerState.startY = e.clientY;
            fireBuddyPetPointerState.startLeft = Number.isFinite(left) ? left : 0;
            fireBuddyPetPointerState.startTop = Number.isFinite(top) ? top : 0;

            if (pet.setPointerCapture && e.pointerId !== undefined) {
                try { pet.setPointerCapture(e.pointerId); } catch (err) {}
            }

            document.addEventListener('pointermove', onFireBuddyPetPointerMove);
            document.addEventListener('pointerup', onFireBuddyPetPointerUp);
            document.addEventListener('pointercancel', onFireBuddyPetPointerUp);
        });
    }

    function renderFireBuddyPet(contact, metrics, status) {
        const chatScreen = document.getElementById('chat-screen');
        const pet = document.getElementById('fire-buddy-pet');
        const petImage = document.getElementById('fire-buddy-pet-image');
        const petBadge = document.getElementById('fire-buddy-pet-badge');
        if (!chatScreen || !pet || !petImage) return;

        ensureFireBuddyPetInteractionBound();

        const chatVisible = !chatScreen.classList.contains('hidden');
        const shouldShow = !!(
            contact &&
            (status === 'invitable' || status === 'bound' || status === 'gray') &&
            getFireBuddyDisplayMode(contact) === 'desktop-pet' &&
            chatVisible &&
            String(getState().currentChatContactId || '') === String(contact.id)
        );

        if (!shouldShow) {
            hideFireBuddyPet();
            return;
        }

        const fireBuddy = ensureFireBuddy(contact);
        const petSize = clampFireBuddyPetSize(fireBuddy.ui.petSize);
        const petPosition = normalizeFireBuddyPetPosition(fireBuddy.ui.petPosition);
        fireBuddy.ui.petSize = petSize;
        fireBuddy.ui.petPosition = petPosition;

        pet.style.width = `${petSize}px`;
        pet.style.height = `${petSize}px`;
        petImage.src = fireBuddy.ui.petImage || window.DEFAULT_FIRE_BUDDY_PET_IMAGE || DEFAULT_FIRE_BUDDY_PET_IMAGE;

        const bounds = getFireBuddyPetBounds(chatScreen, petSize);
        const xSpace = Math.max(0, bounds.maxLeft - bounds.minLeft);
        const ySpace = Math.max(0, bounds.maxTop - bounds.minTop);
        const left = bounds.minLeft + xSpace * petPosition.xRatio;
        const top = bounds.minTop + ySpace * petPosition.yRatio;

        pet.style.left = `${Math.round(left)}px`;
        pet.style.top = `${Math.round(top)}px`;
        pet.dataset.contactId = contact.id;
        pet.dataset.status = status;
        pet.classList.toggle('is-gray', status === 'gray');
        pet.classList.remove('hidden');

        if (petBadge) {
            petBadge.textContent = status === 'gray' ? '💤' : status === 'bound' ? '🔥' : '✨';
        }
    }

    function renderFireBuddyPanel(contact, metrics, status) {
        const avatarEl = document.getElementById('fire-buddy-stage-avatar');
        const stageLabelEl = document.getElementById('fire-buddy-stage-label');
        const statusTextEl = document.getElementById('fire-buddy-status-text');
        const effectiveDaysEl = document.getElementById('fire-buddy-effective-days');
        const currentStreakEl = document.getElementById('fire-buddy-current-streak');
        const longestStreakEl = document.getElementById('fire-buddy-longest-streak');
        const messageCountEl = document.getElementById('fire-buddy-message-count');
        const progressTipEl = document.getElementById('fire-buddy-progress-tip');
        const actionBtn = document.getElementById('fire-buddy-panel-action');

        if (!contact || !avatarEl || !stageLabelEl || !statusTextEl || !effectiveDaysEl || !currentStreakEl || !longestStreakEl || !messageCountEl || !progressTipEl || !actionBtn) {
            return;
        }

        avatarEl.classList.toggle('is-gray', status === 'gray');
        avatarEl.textContent = status === 'gray' ? '🩶' : status === 'bound' ? '🔥' : '✨';
        stageLabelEl.textContent = FIRE_BUDDY_STAGE_TEXT[status] || '未解锁';

        const name = contact.remark || contact.nickname || contact.name || '联系人';
        if (status === 'bound') {
            statusTextEl.textContent = `${name} 已完成第一阶段绑定。`;
        } else if (status === 'gray') {
            statusTextEl.textContent = `${name} 的小火人暂时休眠中。`;
        } else if (status === 'invitable') {
            statusTextEl.textContent = `${name} 已满足邀请条件。`;
        } else {
            statusTextEl.textContent = '继续聊天点亮火花。';
        }

        effectiveDaysEl.textContent = `${metrics.effectiveDays || 0} 天`;
        currentStreakEl.textContent = `${metrics.currentStreak || 0} 天`;
        longestStreakEl.textContent = `${metrics.longestStreak || 0} 天`;
        messageCountEl.textContent = `${metrics.messageCount || 0} 条`;
        progressTipEl.textContent = buildProgressTip(status, metrics);

        actionBtn.classList.toggle('hidden', !(status === 'invitable' || status === 'bound' || status === 'gray'));
        if (status === 'invitable') {
            actionBtn.textContent = '绑定';
            actionBtn.disabled = false;
        } else if (status === 'gray') {
            actionBtn.textContent = '已休眠';
            actionBtn.disabled = true;
        } else {
            actionBtn.textContent = '已绑定';
            actionBtn.disabled = true;
        }
    }

    function openFireBuddyPanel(contactId) {
        const targetContactId = contactId || getState().currentChatContactId;
        const targetContact = getContactById(targetContactId);
        if (!targetContact || !isFireBuddyEnabled(targetContact)) return;
        const result = refreshFireBuddyState(targetContactId, 'open-panel');
        if (!result) return;
        hideFireBuddyUnlockCard();
        const panel = document.getElementById('fire-buddy-panel');
        if (panel) {
            panel.dataset.contactId = result.contact.id;
            panel.classList.remove('hidden');
            renderFireBuddyPanel(result.contact, result.metrics, result.status, 'open-panel');
        }
    }

    function closeFireBuddyPanel() {
        const panel = document.getElementById('fire-buddy-panel');
        if (panel) panel.classList.add('hidden');
        const currentContactId = getState().currentChatContactId;
        if (currentContactId) {
            window.setTimeout(() => refreshFireBuddyState(currentContactId, 'close-panel'), 0);
        }
    }

    function bindFireBuddyCurrentContact() {
        const contactId = getState().currentChatContactId;
        const contact = getContactById(contactId);
        if (!contact) return;
        const fireBuddy = ensureFireBuddy(contact);
        fireBuddy.boundAt = fireBuddy.boundAt || Date.now();
        fireBuddy.invitedAt = Date.now();
        fireBuddy.manualUnlock.enabled = false;
        fireBuddy.manualUnlock.mode = 'locked';
        if (typeof window.saveConfig === 'function') {
            window.saveConfig();
        }
        refreshFireBuddyState(contact.id, 'bind');
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(getState().currentContactGroup || 'all');
        }
    }

    function getFilteredContacts(filterGroup) {
        const state = getState();
        let contacts = state.contacts.slice();
        if (filterGroup && filterGroup !== 'all') {
            contacts = contacts.filter(contact => contact.group === filterGroup);
        }

        contacts.sort((left, right) => {
            if (left.isPinned && !right.isPinned) return -1;
            if (!left.isPinned && right.isPinned) return 1;

            const getLastTime = (contact) => {
                const history = Array.isArray(state.chatHistory[contact.id]) ? state.chatHistory[contact.id] : [];
                for (let i = history.length - 1; i >= 0; i -= 1) {
                    const msg = history[i];
                    if (typeof window.shouldHideChatSyncMsg === 'function' && window.shouldHideChatSyncMsg(msg)) continue;
                    return Number(msg && msg.time) || 0;
                }
                return 0;
            };

            return getLastTime(right) - getLastTime(left);
        });

        return contacts;
    }

    function decorateContactList(filterGroup) {
        const list = document.getElementById('contact-list');
        if (!list) return;

        const visibleContacts = getFilteredContacts(filterGroup || getState().currentContactGroup || 'all');
        const items = Array.from(list.querySelectorAll('.contact-item'));
        items.forEach((item, index) => {
            const contact = visibleContacts[index];
            if (!contact) return;

            const existingBadge = item.querySelector('.fire-buddy-contact-badge');
            if (existingBadge) existingBadge.remove();

            const metrics = getHistoryMetrics(contact.id);
            const status = getDerivedFireBuddyStatus(contact, metrics);
            const shouldShow = status === 'invitable' || status === 'bound' || status === 'gray';
            if (!shouldShow) return;

            const headerRowEl = item.querySelector('.contact-header-row');
            if (!headerRowEl) return;
            const badgeEl = document.createElement('div');
            badgeEl.className = `fire-buddy-contact-badge${status === 'gray' ? ' is-gray' : ''}`;
            badgeEl.textContent = status === 'gray' ? '灰' : status === 'bound' ? '火' : `${Math.max(metrics.currentStreak || 0, INVITE_STREAK_DAYS)}+`;
            headerRowEl.insertBefore(badgeEl, headerRowEl.querySelector('.contact-time'));
        });
    }

    function getFireBuddySettingsContact() {
        return getContactById(getState().currentChatContactId || getState().currentAiProfileContactId);
    }

    function syncFireBuddyPetPanelVisibility() {
        const enabledEl = document.getElementById('chat-setting-fire-buddy-enabled');
        const displayModeEl = document.getElementById('chat-setting-fire-buddy-display-mode');
        const petPanel = document.getElementById('chat-setting-fire-buddy-pet-panel');
        const topbarIconRow = document.getElementById('chat-setting-fire-buddy-topbar-icon-row');
        if (!displayModeEl || !petPanel) return;
        const isEnabled = !enabledEl || enabledEl.checked;
        petPanel.style.display = isEnabled && displayModeEl.value === 'desktop-pet' ? '' : 'none';
        if (topbarIconRow) {
            topbarIconRow.style.display = isEnabled && displayModeEl.value !== 'desktop-pet' ? '' : 'none';
        }
    }

    function syncFireBuddySettingsAvailability() {
        const enabledEl = document.getElementById('chat-setting-fire-buddy-enabled');
        const manualEnabledEl = document.getElementById('chat-setting-fire-buddy-manual-enabled');
        const manualModeEl = document.getElementById('chat-setting-fire-buddy-mode');
        const displayModeEl = document.getElementById('chat-setting-fire-buddy-display-mode');
        const topbarIconVisibleEl = document.getElementById('chat-setting-fire-buddy-topbar-icon-visible');
        const petImageInput = document.getElementById('chat-setting-fire-buddy-pet-image');
        const petSizeSlider = document.getElementById('chat-setting-fire-buddy-pet-size');
        const profileItems = [manualEnabledEl, manualModeEl, displayModeEl, topbarIconVisibleEl, petImageInput, petSizeSlider].filter(Boolean);
        const isEnabled = !enabledEl || enabledEl.checked;

        profileItems.forEach((el) => {
            el.disabled = !isEnabled;
        });

        if (manualModeEl && manualEnabledEl) {
            manualModeEl.disabled = !isEnabled || !manualEnabledEl.checked;
        }

        syncFireBuddyPetPanelVisibility();
    }

    function syncFireBuddyComposeTrigger(contactId) {
        const triggerEl = document.getElementById('chat-more-fire-buddy-btn');
        const resolvedContact = getContactById(contactId || getState().currentChatContactId);
        const shouldShow = !!(triggerEl && resolvedContact && isFireBuddyEnabled(resolvedContact));
        if (!triggerEl) return;
        triggerEl.style.display = shouldShow ? '' : 'none';
    }

    function syncFireBuddyPetPreviewSize() {
        const petSizeSlider = document.getElementById('chat-setting-fire-buddy-pet-size');
        const petSizeValue = document.getElementById('chat-setting-fire-buddy-pet-size-value');
        const petPreview = document.getElementById('chat-setting-fire-buddy-pet-preview');
        const rawSize = petSizeSlider ? parseInt(petSizeSlider.value, 10) : DEFAULT_FIRE_BUDDY_PET_SIZE;
        const size = clampFireBuddyPetSize(rawSize);
        if (petSizeValue) petSizeValue.textContent = `${size}px`;
        if (petPreview) {
            const previewSize = Math.max(44, Math.min(76, Math.round(size * 0.64)));
            petPreview.style.width = `${previewSize}px`;
            petPreview.style.height = `${previewSize}px`;
        }
    }

    function loadFireBuddyPetImage(file) {
        return new Promise((resolve) => {
            if (!file) {
                resolve('');
                return;
            }

            const compressor = typeof window.compressImagePreserveAlpha === 'function'
                ? window.compressImagePreserveAlpha
                : (typeof compressImagePreserveAlpha === 'function' ? compressImagePreserveAlpha : null);

            if (compressor) {
                compressor(file, 512, 0.85).then(resolve).catch((err) => {
                    console.error('桌宠图片压缩失败', err);
                    resolve('');
                });
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => resolve(event && event.target ? event.target.result : '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
        });
    }

    function hydrateFireBuddySettings() {
        const contact = getFireBuddySettingsContact();
        if (!contact) return;

        const fireBuddy = ensureFireBuddy(contact);
        const enabledEl = document.getElementById('chat-setting-fire-buddy-enabled');
        const manualEnabledEl = document.getElementById('chat-setting-fire-buddy-manual-enabled');
        const manualModeEl = document.getElementById('chat-setting-fire-buddy-mode');
        const displayModeEl = document.getElementById('chat-setting-fire-buddy-display-mode');
        const topbarIconVisibleEl = document.getElementById('chat-setting-fire-buddy-topbar-icon-visible');
        const petImageInput = document.getElementById('chat-setting-fire-buddy-pet-image');
        const petPreview = document.getElementById('chat-setting-fire-buddy-pet-preview');
        const petSizeSlider = document.getElementById('chat-setting-fire-buddy-pet-size');

        if (enabledEl) enabledEl.checked = fireBuddy.enabled !== false;
        if (manualEnabledEl) manualEnabledEl.checked = !!fireBuddy.manualUnlock.enabled;
        if (manualModeEl) {
            manualModeEl.value = fireBuddy.manualUnlock.mode || 'locked';
            manualModeEl.disabled = !fireBuddy.manualUnlock.enabled;
        }
        if (displayModeEl) displayModeEl.value = getFireBuddyDisplayMode(contact);
        if (topbarIconVisibleEl) topbarIconVisibleEl.checked = fireBuddy.ui.topbarIconVisible !== false;
        if (petImageInput) petImageInput.value = '';
        if (petSizeSlider) petSizeSlider.value = String(clampFireBuddyPetSize(fireBuddy.ui.petSize));
        if (petPreview) {
            petPreview.src = fireBuddy.ui.petImage || window.DEFAULT_FIRE_BUDDY_PET_IMAGE || DEFAULT_FIRE_BUDDY_PET_IMAGE;
        }

        syncFireBuddySettingsAvailability();
        syncFireBuddyPetPreviewSize();

        const result = refreshFireBuddyState(contact.id, 'hydrate-settings');
        if (result) {
            updateFireBuddySettingsSummary(contact, result.metrics, result.status);
        }
    }

    function persistFireBuddySettings() {
        const contact = getFireBuddySettingsContact();
        if (!contact) return;

        const fireBuddy = ensureFireBuddy(contact);
        const enabledEl = document.getElementById('chat-setting-fire-buddy-enabled');
        const manualEnabledEl = document.getElementById('chat-setting-fire-buddy-manual-enabled');
        const manualModeEl = document.getElementById('chat-setting-fire-buddy-mode');
        const displayModeEl = document.getElementById('chat-setting-fire-buddy-display-mode');
        const topbarIconVisibleEl = document.getElementById('chat-setting-fire-buddy-topbar-icon-visible');
        const petImageInput = document.getElementById('chat-setting-fire-buddy-pet-image');
        const petSizeSlider = document.getElementById('chat-setting-fire-buddy-pet-size');

        fireBuddy.enabled = !enabledEl || !!enabledEl.checked;

        if (manualEnabledEl && manualModeEl) {
            fireBuddy.manualUnlock.enabled = !!manualEnabledEl.checked;
            fireBuddy.manualUnlock.mode = FIRE_BUDDY_MANUAL_MODES.includes(manualModeEl.value)
                ? manualModeEl.value
                : (fireBuddy.manualUnlock.mode || 'locked');
        }

        fireBuddy.ui.displayMode = displayModeEl && displayModeEl.value === 'desktop-pet' ? 'desktop-pet' : DEFAULT_FIRE_BUDDY_DISPLAY_MODE;
        fireBuddy.ui.topbarIconVisible = !topbarIconVisibleEl || !!topbarIconVisibleEl.checked;
        fireBuddy.ui.petSize = clampFireBuddyPetSize(petSizeSlider ? petSizeSlider.value : fireBuddy.ui.petSize);
        fireBuddy.ui.petPosition = normalizeFireBuddyPetPosition(fireBuddy.ui.petPosition);

        const finalizePersist = () => {
            if (typeof window.saveConfig === 'function') {
                window.saveConfig();
            }

            refreshFireBuddyState(contact.id, 'persist-settings');
            if (typeof window.renderContactList === 'function') {
                window.renderContactList(getState().currentContactGroup || 'all');
            }
        };

        const file = petImageInput && petImageInput.files ? petImageInput.files[0] : null;
        if (!file) {
            finalizePersist();
            return;
        }

        loadFireBuddyPetImage(file).then((base64) => {
            if (base64) {
                fireBuddy.ui.petImage = base64;
            }
            finalizePersist();
        });
    }

    function bindSettingsEvents() {
        const enabledEl = document.getElementById('chat-setting-fire-buddy-enabled');
        const manualEnabledEl = document.getElementById('chat-setting-fire-buddy-manual-enabled');
        const manualModeEl = document.getElementById('chat-setting-fire-buddy-mode');
        const displayModeEl = document.getElementById('chat-setting-fire-buddy-display-mode');
        const topbarIconVisibleEl = document.getElementById('chat-setting-fire-buddy-topbar-icon-visible');
        const petImageInput = document.getElementById('chat-setting-fire-buddy-pet-image');
        const petPreview = document.getElementById('chat-setting-fire-buddy-pet-preview');
        const petSizeSlider = document.getElementById('chat-setting-fire-buddy-pet-size');
        const chatSettingsBtn = document.getElementById('chat-settings-btn');
        const aiProfileMoreBtn = document.getElementById('ai-profile-more');
        const saveBtn = document.getElementById('save-chat-settings-btn');
        const settingsScreen = document.getElementById('chat-settings-screen');

        if (enabledEl) {
            enabledEl.addEventListener('change', () => {
                syncFireBuddySettingsAvailability();
            });
        }

        if (manualEnabledEl && manualModeEl) {
            manualEnabledEl.addEventListener('change', () => {
                syncFireBuddySettingsAvailability();
            });
        }

        if (displayModeEl) {
            displayModeEl.addEventListener('change', () => {
                syncFireBuddyPetPanelVisibility();
            });
        }

        if (topbarIconVisibleEl) {
            topbarIconVisibleEl.addEventListener('change', () => {
                const contact = getFireBuddySettingsContact();
                if (!contact) return;
                const fireBuddy = ensureFireBuddy(contact);
                fireBuddy.ui.topbarIconVisible = !!topbarIconVisibleEl.checked;
                refreshFireBuddyState(contact.id, 'settings-topbar-icon-toggle');
            });
        }

        if (petSizeSlider) {
            petSizeSlider.addEventListener('input', () => {
                syncFireBuddyPetPreviewSize();
            });
        }

        if (petImageInput) {
            petImageInput.addEventListener('change', (e) => {
                const file = e.target && e.target.files ? e.target.files[0] : null;
                if (!file) {
                    const contact = getFireBuddySettingsContact();
                    const fireBuddy = ensureFireBuddy(contact);
                    if (petPreview && fireBuddy) {
                        petPreview.src = fireBuddy.ui.petImage || window.DEFAULT_FIRE_BUDDY_PET_IMAGE || DEFAULT_FIRE_BUDDY_PET_IMAGE;
                    }
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    if (petPreview) {
                        petPreview.src = event && event.target ? event.target.result : '';
                    }
                };
                reader.readAsDataURL(file);
            });
        }

        const delayedHydrate = () => {
            window.setTimeout(hydrateFireBuddySettings, 0);
        };

        if (chatSettingsBtn) chatSettingsBtn.addEventListener('click', delayedHydrate);
        if (aiProfileMoreBtn) aiProfileMoreBtn.addEventListener('click', delayedHydrate);
        if (saveBtn) saveBtn.addEventListener('click', () => window.setTimeout(persistFireBuddySettings, 0));

        if (settingsScreen && typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(() => {
                if (!settingsScreen.classList.contains('hidden')) {
                    hydrateFireBuddySettings();
                }
            });
            observer.observe(settingsScreen, { attributes: true, attributeFilter: ['class'] });
        }

        syncFireBuddySettingsAvailability();
        syncFireBuddyPetPreviewSize();
    }

    function patchRuntimeHooks() {
        if (window.__fireBuddyHooksPatched) return;
        window.__fireBuddyHooksPatched = true;

        if (typeof window.openChat === 'function') {
            const originalOpenChat = window.openChat;
            window.openChat = function patchedOpenChat(contactId) {
                const result = originalOpenChat.apply(this, arguments);
                window.setTimeout(() => refreshFireBuddyState(contactId, 'open-chat'), 0);
                return result;
            };
        }

        if (typeof window.renderContactList === 'function') {
            const originalRenderContactList = window.renderContactList;
            window.renderContactList = function patchedRenderContactList(filterGroup) {
                const result = originalRenderContactList.apply(this, arguments);
                window.setTimeout(() => decorateContactList(filterGroup || getState().currentContactGroup || 'all'), 0);
                return result;
            };
        }

        if (typeof window.sendMessage === 'function') {
            const originalSendMessage = window.sendMessage;
            window.sendMessage = function patchedSendMessage() {
                const result = originalSendMessage.apply(this, arguments);
                const contactId = arguments[4] || getState().currentChatContactId;
                const text = arguments[0];
                const isUser = !!arguments[1];
                const type = arguments[2] || 'text';
                if (result) {
                    markFireBuddyMentionOnOutgoingMsg(result, text, contactId, type, isUser);
                }
                window.setTimeout(() => refreshFireBuddyState(contactId, 'send-message'), 0);
                window.setTimeout(() => hideFireBuddyMentionMenu(), 0);
                return result;
            };
        }

        if (typeof window.generateAiReply === 'function') {
            const originalGenerateAiReply = window.generateAiReply;
            window.generateAiReply = async function patchedGenerateAiReply() {
                return originalGenerateAiReply.apply(this, arguments);
            };
        }

        if (typeof window.typewriterEffect === 'function') {
            const originalTypewriterEffect = window.typewriterEffect;
            window.typewriterEffect = function patchedTypewriterEffect() {
                const result = originalTypewriterEffect.apply(this, arguments);
                const contactId = arguments[5] || getState().currentChatContactId;
                window.setTimeout(() => refreshFireBuddyState(contactId, 'assistant-message'), 0);
                return result;
            };
        }

        if (typeof window.shouldExcludeFromAiContext === 'function') {
            const originalShouldExcludeFromAiContext = window.shouldExcludeFromAiContext;
            window.shouldExcludeFromAiContext = function patchedShouldExcludeFromAiContext(msg) {
                if (msg && msg.speaker === 'fire-buddy') {
                    return false;
                }
                return originalShouldExcludeFromAiContext.apply(this, arguments);
            };
        }
    }

    function isFireBuddyVisibleStatus(status) {
        return ['invitable', 'invited', 'bound', 'gray', 'wake-ready'].includes(status);
    }

    function getFireBuddyStageLabel(status) {
        const labels = {
            locked: '\u672a\u89e3\u9501',
            warming: '\u5347\u6e29\u4e2d',
            invitable: '\u53ef\u9080\u8bf7',
            invited: '\u5df2\u9080\u8bf7',
            bound: '\u5df2\u7ed1\u5b9a',
            gray: '\u5df2\u53d8\u7070',
            'wake-ready': '\u53ef\u5524\u9192'
        };
        return labels[status] || labels.locked;
    }

    function getFireBuddyLastActiveDayLabel(metrics) {
        const dayKey = Array.isArray(metrics.activeDays) && metrics.activeDays.length
            ? metrics.activeDays[metrics.activeDays.length - 1]
            : '';
        return dayKey ? dayKey.replace(/-/g, '/') : '--';
    }

    function formatStatusTimestamp(timestamp) {
        if (!Number.isFinite(timestamp)) return '--';
        const date = new Date(timestamp);
        return `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
    }

    function hideFireBuddyUnlockCard() {
        const card = document.getElementById('fire-buddy-unlock-card');
        if (!card) return;
        card.classList.add('hidden');
        card.dataset.contactId = '';
    }

    function showFireBuddyUnlockCard(contact) {
        const card = document.getElementById('fire-buddy-unlock-card');
        const titleEl = document.getElementById('fire-buddy-unlock-card-title');
        const textEl = document.getElementById('fire-buddy-unlock-card-text');
        if (!card || !contact) return;

        const name = contact.remark || contact.nickname || contact.name || '对方';
        if (titleEl) titleEl.textContent = '可以解锁小火人了';
        if (textEl) textEl.textContent = `你和 ${name} 已连续互发 ${INVITE_STREAK_DAYS} 天消息，点击进入小火人页面`;
        card.dataset.contactId = contact.id;
        card.classList.remove('hidden');
    }

    function syncFireBuddyUnlockCard(contact, status) {
        const chatScreen = document.getElementById('chat-screen');
        const card = document.getElementById('fire-buddy-unlock-card');
        if (!card || !contact || !chatScreen || chatScreen.classList.contains('hidden')) {
            hideFireBuddyUnlockCard();
            return;
        }

        if (!isFireBuddyEnabled(contact)) {
            hideFireBuddyUnlockCard();
            return;
        }

        const isCurrentChat = String(getState().currentChatContactId || '') === String(contact.id);
        if (!isCurrentChat || status !== 'invitable') {
            hideFireBuddyUnlockCard();
            return;
        }

        const fireBuddy = ensureFireBuddy(contact);
        const lastShownAt = Number(fireBuddy.ui.invitableCardShownAt) || 0;
        const lastStatusChangedAt = Number(fireBuddy.lastStatusChangedAt) || 0;
        const shouldAutoShow = !lastShownAt || lastShownAt < lastStatusChangedAt;

        showFireBuddyUnlockCard(contact);
        if (shouldAutoShow) {
            fireBuddy.ui.invitableCardShownAt = Date.now();
            if (typeof window.saveConfig === 'function') {
                window.saveConfig();
            }
        }
    }

    function getFireBuddyActionConfig(status) {
        if (status === 'invitable') {
            return { hidden: false, disabled: false, label: '\u53d1\u8d77\u9080\u8bf7' };
        }
        if (status === 'invited') {
            return { hidden: false, disabled: false, label: '\u786e\u8ba4\u7ed1\u5b9a' };
        }
        if (status === 'wake-ready') {
            return { hidden: false, disabled: false, label: '\u5524\u9192\u5c0f\u706b\u4eba' };
        }
        if (status === 'bound') {
            return { hidden: false, disabled: true, label: '\u5df2\u7ed1\u5b9a' };
        }
        if (status === 'gray') {
            return { hidden: false, disabled: true, label: '\u7b49\u5f85\u5524\u9192' };
        }
        return { hidden: true, disabled: true, label: '' };
    }

    function buildStatusHeadline(contact, status) {
        const name = contact.remark || contact.nickname || contact.name || '\u5bf9\u65b9';
        const buddyName = getFireBuddyDisplayName(contact);
        const headlineMap = {
            locked: `${name}\u7684${buddyName}\u8fd8\u5728\u917f\u9020\u706b\u82b1`,
            warming: `${name}\u7684${buddyName}\u6b63\u5728\u5347\u6e29`,
            invitable: `${name}\u7684${buddyName}\u5df2\u53ef\u4ee5\u53d1\u8d77\u9080\u8bf7`,
            invited: `\u5df2\u5411 ${name} \u53d1\u51fa\u9080\u8bf7`,
            bound: `\u4f60\u4eec\u5df2\u7ecf\u5b8c\u6210${buddyName}\u7ed1\u5b9a`,
            gray: `${name}\u7684${buddyName}\u56e0\u4e3a\u51b7\u5374\u800c\u53d8\u7070`,
            'wake-ready': `${name}\u7684${buddyName}\u5df2\u7ecf\u53ef\u4ee5\u5524\u9192`
        };
        return headlineMap[status] || headlineMap.locked;
    }

    function buildStatusDetail(contact, metrics, status) {
        const fireBuddy = ensureFireBuddy(contact);
        if (status === 'invited') {
            return `\u9080\u8bf7\u65f6\u95f4\uff1a${formatStatusTimestamp(fireBuddy.invitedAt)} \u00b7 \u70b9\u51fb\u53f3\u4e0a\u89d2\u6309\u94ae\u786e\u8ba4\u7ed1\u5b9a`;
        }
        if (status === 'bound') {
            return `\u7ed1\u5b9a\u65f6\u95f4\uff1a${formatStatusTimestamp(fireBuddy.boundAt)} \u00b7 \u6700\u8fd1\u6709\u6548\u4e92\u52a8\uff1a${getFireBuddyLastActiveDayLabel(metrics)}`;
        }
        if (status === 'gray') {
            return `\u53d8\u7070\u65f6\u95f4\uff1a${formatStatusTimestamp(fireBuddy.grayAt)} \u00b7 \u9700\u8981\u5148\u6062\u590d\u65b0\u7684\u6709\u6548\u4e92\u52a8`;
        }
        if (status === 'wake-ready') {
            return `\u6700\u8fd1\u6709\u6548\u4e92\u52a8\uff1a${getFireBuddyLastActiveDayLabel(metrics)} \u00b7 \u5df2\u6ee1\u8db3\u5524\u9192\u6761\u4ef6`;
        }
        if (status === 'invitable') {
            return `\u5df2\u8fde\u7eed ${metrics.currentStreak} \u5929\u6709\u6548\u4e92\u52a8\uff0c\u53ef\u4ee5\u6b63\u5f0f\u53d1\u51fa\u9080\u8bf7`;
        }
        if (status === 'warming') {
            return `\u5f53\u524d\u8fde\u7eed ${metrics.currentStreak} / ${INVITE_STREAK_DAYS} \u5929\uff0c\u518d\u575a\u6301 ${Math.max(0, INVITE_STREAK_DAYS - metrics.currentStreak)} \u5929`;
        }
        return `\u5f53\u524d\u8fde\u7eed ${metrics.currentStreak} / ${INVITE_STREAK_DAYS} \u5929\uff0c\u8fd8\u9700\u7ee7\u7eed\u804a\u5929\u70b9\u4eae\u706b\u82b1`;
    }

    function getFireBuddyHeaderIcon(status) {
        if (status === 'bound') return '🔥';
        if (status === 'invited') return '💌';
        if (status === 'gray' || status === 'wake-ready') return '💤';
        return '✨';
    }

    function getFireBuddyContactBadge(status) {
        const badgeMap = {
            invitable: '\u9080',
            invited: '\u5f85',
            bound: '\u706b',
            gray: '\u7070',
            'wake-ready': '\u9192'
        };
        return badgeMap[status] || '\u706b';
    }

    function getDerivedFireBuddyStatus(contact, metrics) {
        const fireBuddy = ensureFireBuddy(contact);
        const manualMode = fireBuddy.manualUnlock.enabled ? fireBuddy.manualUnlock.mode : null;
        if (manualMode) {
            return FIRE_BUDDY_MANUAL_MODES.includes(manualMode) ? manualMode : 'locked';
        }

        if (fireBuddy.boundAt) {
            const isStale = !metrics.lastMessageAt || (Date.now() - metrics.lastMessageAt) > GRAY_TIMEOUT_MS;
            const hasGrayRecord = Number.isFinite(fireBuddy.grayAt);
            const canWake = hasGrayRecord
                && Number.isFinite(metrics.lastMessageAt)
                && metrics.lastMessageAt > fireBuddy.grayAt
                && metrics.currentStreak > 0;

            if (hasGrayRecord) {
                return canWake ? 'wake-ready' : 'gray';
            }

            return isStale ? 'gray' : 'bound';
        }

        if (fireBuddy.invitedAt) return 'invited';
        if (metrics.currentStreak >= INVITE_STREAK_DAYS) return 'invitable';
        if (metrics.currentStreak >= WARM_STREAK_DAYS) return 'warming';
        return 'locked';
    }

    function buildProgressTip(status, metrics) {
        if (status === 'gray') {
            return '\u8d85\u8fc7 48 \u5c0f\u65f6\u672a\u4e92\u52a8\uff0c\u5c0f\u706b\u4eba\u4f1a\u53d8\u7070\u3002\u5148\u6062\u590d\u65b0\u7684\u6709\u6548\u4e92\u52a8\uff0c\u624d\u80fd\u8fdb\u5165\u5524\u9192\u6d41\u7a0b\u3002';
        }
        if (status === 'wake-ready') {
            return '\u5df2\u7ecf\u6062\u590d\u4e86\u65b0\u7684\u6709\u6548\u4e92\u52a8\uff0c\u73b0\u5728\u53ef\u4ee5\u624b\u52a8\u5524\u9192\u5c0f\u706b\u4eba\u3002';
        }
        if (status === 'bound') {
            return '\u5c0f\u706b\u4eba\u5df2\u7ecf\u7ed1\u5b9a\uff0c\u4fdd\u6301\u4e92\u52a8\u5c31\u80fd\u8ba9\u706b\u82b1\u4e00\u76f4\u4eae\u7740\u3002';
        }
        if (status === 'invited') {
            return '\u9080\u8bf7\u5df2\u53d1\u51fa\uff0c\u4e0b\u4e00\u6b65\u662f\u786e\u8ba4\u7ed1\u5b9a\uff0c\u5c06\u5173\u7cfb\u6b63\u5f0f\u70b9\u4eae\u3002';
        }
        if (status === 'invitable') {
            return '\u4f60\u4eec\u5df2\u7ecf\u8fbe\u5230\u9080\u8bf7\u6761\u4ef6\uff0c\u53ef\u4ee5\u5f00\u59cb\u7b2c\u4e8c\u9636\u6bb5\u7684\u9080\u8bf7\u7ed1\u5b9a\u6d41\u7a0b\u3002';
        }
        if (status === 'warming') {
            return `\u5f53\u524d\u5df2\u7ecf\u8fdb\u5165\u5347\u6e29\u9636\u6bb5\uff0c\u518d\u7ee7\u7eed ${Math.max(0, INVITE_STREAK_DAYS - metrics.currentStreak)} \u5929\u6709\u6548\u4e92\u52a8\u5c31\u80fd\u53d1\u51fa\u9080\u8bf7\u3002`;
        }
        return `\u8fde\u7eed ${INVITE_STREAK_DAYS} \u4e2a\u6709\u6548\u4e92\u52a8\u65e5\u540e\u53ef\u53d1\u8d77\u9080\u8bf7\u3002\u6709\u6548\u4e92\u52a8\u65e5\u9700\u8981\u5f53\u5929\u53cc\u65b9\u90fd\u53d1\u8fc7\u79c1\u804a\u6d88\u606f\u3002`;
    }

    function buildSettingsSummary(contact, metrics, status) {
        const fireBuddy = ensureFireBuddy(contact);
        if (!isFireBuddyEnabled(contact)) {
            return '小火人功能已关闭';
        }
        const parts = [];
        if (fireBuddy.manualUnlock.enabled) {
            parts.push(`\u8c03\u8bd5\u8986\u76d6\uff1a${getFireBuddyStageLabel(fireBuddy.manualUnlock.mode)}`);
        } else {
            parts.push(`\u5f53\u524d\u72b6\u6001\uff1a${getFireBuddyStageLabel(status)}`);
        }
        parts.push(`\u8fde\u7eed ${metrics.currentStreak} \u5929`);
        parts.push(`\u6709\u6548\u4e92\u52a8 ${metrics.effectiveDays} \u5929`);
        return parts.join(' · ');
    }

    function refreshFireBuddyState(contactId, reason) {
        const contact = contactId ? getContactById(contactId) : getContactById(getState().currentChatContactId);
        if (!contact) return null;

        const fireBuddy = ensureFireBuddy(contact);
        const metrics = getHistoryMetrics(contact.id);
        const previousStatus = fireBuddy.status || 'locked';
        const status = getDerivedFireBuddyStatus(contact, metrics);

        if (!fireBuddy.manualUnlock.enabled) {
            if (status === 'gray' && !Number.isFinite(fireBuddy.grayAt)) {
                fireBuddy.grayAt = Date.now();
            }
            if ((status === 'locked' || status === 'warming' || status === 'invitable' || status === 'invited') && !fireBuddy.boundAt) {
                fireBuddy.grayAt = null;
            }
        }

        fireBuddy.status = status;
        fireBuddy.lastDerivedStatus = status;
        if (previousStatus !== status) {
            fireBuddy.lastStatusChangedAt = Date.now();
        }

        fireBuddy.spark.activeDays = metrics.activeDays;
        fireBuddy.spark.unlockReadyAt = metrics.currentStreak >= INVITE_STREAK_DAYS ? Date.now() : null;
        fireBuddy.stats.firstMessageAt = metrics.firstMessageAt;
        fireBuddy.stats.lastMessageAt = metrics.lastMessageAt;
        fireBuddy.stats.messageCount = metrics.messageCount;
        fireBuddy.stats.effectiveDays = metrics.effectiveDays;
        fireBuddy.stats.currentStreak = metrics.currentStreak;
        fireBuddy.stats.longestStreak = metrics.longestStreak;
        fireBuddy.stats.warmProgress = Math.min(metrics.currentStreak, INVITE_STREAK_DAYS);

        const currentChatContactId = String(getState().currentChatContactId || '');
        const currentAiProfileContactId = String(getState().currentAiProfileContactId || '');
        const panel = document.getElementById('fire-buddy-panel');
        const panelContactId = panel ? String(panel.dataset.contactId || '') : '';
        const enabled = isFireBuddyEnabled(contact);

        if (String(contact.id) === currentChatContactId) {
            syncFireBuddyComposeTrigger(contact.id);
            if (enabled) {
                renderFireBuddyHeader(contact, metrics, status);
                renderFireBuddyPet(contact, metrics, status);
                syncFireBuddyUnlockCard(contact, status);
                syncFireBuddyComposer(contact.id);
            } else {
                renderFireBuddyHeader(contact, metrics, 'locked');
                hideFireBuddyPet();
                hideFireBuddyUnlockCard();
                closeFireBuddyComposer();
            }
        }
        if (!enabled && panel && !panel.classList.contains('hidden') && String(contact.id) === panelContactId) {
            panel.classList.add('hidden');
        } else if (panel && !panel.classList.contains('hidden') && String(contact.id) === panelContactId) {
            renderFireBuddyPanel(contact, metrics, status, reason);
        }
        if (String(contact.id) === currentChatContactId || String(contact.id) === currentAiProfileContactId) {
            updateFireBuddySettingsSummary(contact, metrics, status);
        }

        return { contact, metrics, status };
    }

    function renderFireBuddyHeader(contact, metrics, status) {
        const entryBtn = document.getElementById('fire-buddy-entry');
        if (!entryBtn || !contact) return;

        const fireBuddy = ensureFireBuddy(contact);

        if (!isFireBuddyEnabled(contact)) {
            entryBtn.classList.add('hidden');
            return;
        }

        const shouldShow = isFireBuddyVisibleStatus(status)
            && getFireBuddyDisplayMode(contact) !== 'desktop-pet'
            && fireBuddy.ui.topbarIconVisible !== false;
        const isGray = status === 'gray' || status === 'wake-ready';
        entryBtn.classList.toggle('hidden', !shouldShow);
        entryBtn.classList.toggle('is-gray', isGray);
        entryBtn.title = getFireBuddyStageLabel(status);

        const iconEl = entryBtn.querySelector('.fire-buddy-entry-icon');
        if (iconEl) {
            iconEl.dataset.status = status;
            iconEl.setAttribute('aria-label', getFireBuddyStageLabel(status));
        }

        entryBtn.dataset.contactId = contact.id;
        entryBtn.dataset.status = status;
        entryBtn.dataset.streak = String(metrics.currentStreak || 0);
    }

    function renderFireBuddyPet(contact, metrics, status) {
        const chatScreen = document.getElementById('chat-screen');
        const pet = document.getElementById('fire-buddy-pet');
        const petImage = document.getElementById('fire-buddy-pet-image');
        if (!chatScreen || !pet || !petImage) return;

        if (!isFireBuddyEnabled(contact)) {
            hideFireBuddyPet();
            return;
        }

        ensureFireBuddyPetInteractionBound();

        const chatVisible = !chatScreen.classList.contains('hidden');
        const shouldShow = !!(
            contact
            && isFireBuddyVisibleStatus(status)
            && getFireBuddyDisplayMode(contact) === 'desktop-pet'
            && chatVisible
            && String(getState().currentChatContactId || '') === String(contact.id)
        );

        if (!shouldShow) {
            hideFireBuddyPet();
            return;
        }

        const fireBuddy = ensureFireBuddy(contact);
        const petSize = clampFireBuddyPetSize(fireBuddy.ui.petSize);
        const petPosition = normalizeFireBuddyPetPosition(fireBuddy.ui.petPosition);
        fireBuddy.ui.petSize = petSize;
        fireBuddy.ui.petPosition = petPosition;

        pet.style.width = `${petSize}px`;
        pet.style.height = `${petSize}px`;
        petImage.src = fireBuddy.ui.petImage || window.DEFAULT_FIRE_BUDDY_PET_IMAGE || DEFAULT_FIRE_BUDDY_PET_IMAGE;

        const bounds = getFireBuddyPetBounds(chatScreen, petSize);
        const xSpace = Math.max(0, bounds.maxLeft - bounds.minLeft);
        const ySpace = Math.max(0, bounds.maxTop - bounds.minTop);
        const left = bounds.minLeft + xSpace * petPosition.xRatio;
        const top = bounds.minTop + ySpace * petPosition.yRatio;

        pet.style.left = `${Math.round(left)}px`;
        pet.style.top = `${Math.round(top)}px`;
        pet.dataset.contactId = contact.id;
        pet.dataset.status = status;
        pet.classList.toggle('is-gray', status === 'gray' || status === 'wake-ready');
        pet.classList.remove('hidden');
    }

    function getFireBuddyV2StageMeta(status) {
        const stageMap = {
            locked: { icon: '—', label: '等待点亮' },
            warming: { icon: '✧', label: '升温中' },
            invitable: { icon: '✧', label: '可邀请' },
            invited: { icon: '✧', label: '等待绑定' },
            bound: { icon: '✦', label: '活跃羁绊' },
            gray: { icon: '∙', label: '休眠中' },
            'wake-ready': { icon: '✦', label: '等待唤醒' }
        };
        return stageMap[status] || stageMap.locked;
    }

    function getFireBuddyV2StatusMarkup(status) {
        const statusMap = {
            locked: '羁绊尚未建立。当前仍在 <strong>积蓄火花</strong>。继续保持稳定互动，等它真正被点亮。',
            warming: '羁绊正在 <strong>升温</strong>。再多一些连续有效互动，就能靠近邀请阶段。',
            invitable: '火花已经足够明亮。当前已进入 <strong>可邀请</strong> 状态，可以决定是否发起绑定。',
            invited: '邀请已经发出。当前处于 <strong>等待绑定</strong> 状态，只差最后一步就能建立羁绊。',
            bound: '羁绊已建立。当前互动处于 <strong>活跃</strong> 状态。继续保持日常沟通，以免星火熄灭进入休眠。',
            gray: '羁绊暂时进入 <strong>休眠</strong>。恢复新的有效互动后，才能再次把星火点亮。',
            'wake-ready': '新的互动已经恢复。当前处于 <strong>可唤醒</strong> 状态，再推进一步就能让它重新苏醒。'
        };
        return statusMap[status] || statusMap.locked;
    }

    function formatFireBuddyV2DayStat(value) {
        return `${Math.max(0, Number(value) || 0)}<span>d</span>`;
    }

    function renderFireBuddyPanel(contact, metrics, status) {
        const avatarEl = document.getElementById('fire-buddy-stage-avatar');
        const stageLabelTextEl = document.getElementById('fire-buddy-stage-label-text');
        const panelSubtitleEl = document.getElementById('fire-buddy-panel-subtitle');
        const panelTitleEl = document.getElementById('fire-buddy-panel-title');
        const statusTextEl = document.getElementById('fire-buddy-status-text');
        const panelDetailEl = document.getElementById('fire-buddy-panel-detail');
        const currentStreakEl = document.getElementById('fire-buddy-current-streak');
        const longestStreakEl = document.getElementById('fire-buddy-longest-streak');
        const nameInputEl = document.getElementById('fire-buddy-name-input');
        const personaInputEl = document.getElementById('fire-buddy-persona-input');
        const actionBtn = document.getElementById('fire-buddy-panel-action');
        const actionBtnLabel = actionBtn ? (actionBtn.querySelector('span') || actionBtn) : null;

        if (!contact || !avatarEl || !stageLabelTextEl || !statusTextEl || !currentStreakEl || !longestStreakEl || !nameInputEl || !personaInputEl) {
            return;
        }

        const fireBuddy = ensureFireBuddy(contact);
        const stageMeta = getFireBuddyV2StageMeta(status);
        const actionConfig = getFireBuddyActionConfig(status);

        if (panelSubtitleEl) panelSubtitleEl.textContent = `Status / ${getFireBuddyStageLabel(status)}`;
        if (panelTitleEl) panelTitleEl.textContent = 'Spark.';
        avatarEl.textContent = stageMeta.icon;
        stageLabelTextEl.textContent = stageMeta.label;
        statusTextEl.innerHTML = getFireBuddyV2StatusMarkup(status);
        if (panelDetailEl) panelDetailEl.textContent = buildStatusDetail(contact, metrics, status);
        currentStreakEl.innerHTML = formatFireBuddyV2DayStat(metrics.currentStreak);
        longestStreakEl.innerHTML = formatFireBuddyV2DayStat(metrics.longestStreak);
        nameInputEl.value = fireBuddy.profile.name || '';
        personaInputEl.value = fireBuddy.profile.persona || '';
        if (actionBtn) {
            actionBtn.classList.toggle('hidden', !!actionConfig.hidden);
            actionBtn.disabled = !!actionConfig.disabled;
            actionBtn.dataset.status = status;
        }
        if (actionBtnLabel) {
            actionBtnLabel.textContent = actionConfig.label || '';
        }
    }

    function decorateContactList(filterGroup) {
        const list = document.getElementById('contact-list');
        if (!list) return;

        const visibleContacts = getFilteredContacts(filterGroup || getState().currentContactGroup || 'all');
        const items = Array.from(list.querySelectorAll('.contact-item'));
        items.forEach((item, index) => {
            const contact = visibleContacts[index];
            if (!contact) return;

            const existingBadge = item.querySelector('.fire-buddy-contact-badge');
            if (existingBadge) existingBadge.remove();

            if (!isFireBuddyEnabled(contact)) return;

            const metrics = getHistoryMetrics(contact.id);
            const status = getDerivedFireBuddyStatus(contact, metrics);
            if (!isFireBuddyVisibleStatus(status)) return;

            const headerRowEl = item.querySelector('.contact-header-row');
            if (!headerRowEl) return;
            const badgeEl = document.createElement('div');
            badgeEl.className = `fire-buddy-contact-badge${status === 'gray' || status === 'wake-ready' ? ' is-gray' : ''}`;
            badgeEl.textContent = getFireBuddyContactBadge(status);
            headerRowEl.insertBefore(badgeEl, headerRowEl.querySelector('.contact-time'));
        });
    }

    function bindFireBuddyCurrentContact() {
        const panel = document.getElementById('fire-buddy-panel');
        const contactId = (panel && panel.dataset.contactId) || getState().currentChatContactId;
        const contact = getContactById(contactId);
        if (!contact) return;
        if (!isFireBuddyEnabled(contact)) return;

        const fireBuddy = ensureFireBuddy(contact);
        const result = refreshFireBuddyState(contact.id, 'panel-action');
        if (!result) return;

        if (result.status === 'invitable') {
            fireBuddy.invitedAt = Date.now();
        } else if (result.status === 'invited') {
            fireBuddy.boundAt = Date.now();
            fireBuddy.grayAt = null;
        } else if (result.status === 'wake-ready') {
            fireBuddy.grayAt = null;
            fireBuddy.awakenedAt = Date.now();
        } else {
            return;
        }

        fireBuddy.manualUnlock.enabled = false;
        fireBuddy.manualUnlock.mode = 'locked';

        if (typeof window.saveConfig === 'function') {
            window.saveConfig();
        }
        refreshFireBuddyState(contact.id, 'panel-action-commit');
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(getState().currentContactGroup || 'all');
        }
    }

    function saveFireBuddyProfileFromPanel() {
        const panel = document.getElementById('fire-buddy-panel');
        const nameInput = document.getElementById('fire-buddy-name-input');
        const personaInput = document.getElementById('fire-buddy-persona-input');
        const saveBtn = document.getElementById('fire-buddy-profile-save');
        const saveBtnLabel = saveBtn ? (saveBtn.querySelector('span') || saveBtn) : null;
        const contactId = panel ? (panel.dataset.contactId || getState().currentChatContactId) : getState().currentChatContactId;
        const contact = getContactById(contactId);
        if (!contact || !nameInput || !personaInput) return;

        const fireBuddy = ensureFireBuddy(contact);
        fireBuddy.profile.name = String(nameInput.value || '').trim().slice(0, 24);
        fireBuddy.profile.persona = String(personaInput.value || '').trim();

        if (typeof window.saveConfig === 'function') {
            window.saveConfig();
        }

        const result = refreshFireBuddyState(contact.id, 'save-profile');
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(getState().currentContactGroup || 'all');
        }
        if (String(getState().currentChatContactId || '') === String(contact.id) && typeof window.renderChatHistory === 'function') {
            window.renderChatHistory(contact.id, true);
        }
        syncFireBuddyComposer(contact.id);

        if (saveBtn && saveBtnLabel) {
            const originalText = saveBtn.dataset.defaultLabel || saveBtnLabel.textContent || 'Apply Changes';
            saveBtn.dataset.defaultLabel = originalText;
            saveBtnLabel.textContent = 'Saved ✓';
            window.setTimeout(() => {
                saveBtnLabel.textContent = saveBtn.dataset.defaultLabel || 'Apply Changes';
            }, 1500);
        }

        return result;
    }

    function getFireBuddySpeakerProfile(contactId) {
        const contact = getContactById(contactId || getState().currentChatContactId);
        if (!contact) return null;
        const fireBuddy = ensureFireBuddy(contact);
        return {
            contactId: contact.id,
            name: getFireBuddyDisplayName(contact),
            persona: fireBuddy.profile.persona || '',
            avatar: fireBuddy.ui.petImage || window.DEFAULT_FIRE_BUDDY_PET_IMAGE || DEFAULT_FIRE_BUDDY_PET_IMAGE
        };
    }

    function getFireBuddySpeakerMeta(contactId, msgId) {
        const resolvedContactId = contactId || getState().currentChatContactId;
        if (!resolvedContactId || !msgId) return null;
        const history = Array.isArray(getState().chatHistory[resolvedContactId]) ? getState().chatHistory[resolvedContactId] : [];
        const targetMsg = history.find(msg => String(msg && msg.id) === String(msgId));
        if (!targetMsg || targetMsg.speaker !== 'fire-buddy') return null;
        return getFireBuddySpeakerProfile(resolvedContactId);
    }

    function syncFireBuddyComposer(contactId) {
        const bar = document.getElementById('fire-buddy-compose-bar');
        const avatar = document.getElementById('fire-buddy-compose-avatar');
        const input = document.getElementById('fire-buddy-compose-input');
        const sendBtn = document.getElementById('fire-buddy-compose-send');
        if (!bar || !avatar || !input || !sendBtn) return null;

        const profile = getFireBuddySpeakerProfile(contactId);
        const contact = getContactById(contactId || getState().currentChatContactId);
        if (!profile || !contact || !isFireBuddyEnabled(contact)) {
            bar.classList.add('hidden');
            return null;
        }

        avatar.src = profile.avatar;
        avatar.alt = `${profile.name}头像`;
        input.placeholder = `输入${profile.name}想说的话...`;
        bar.dataset.contactId = String(profile.contactId);
        sendBtn.dataset.contactId = String(profile.contactId);
        return profile;
    }

    function closeFireBuddyComposer(options = {}) {
        const bar = document.getElementById('fire-buddy-compose-bar');
        const input = document.getElementById('fire-buddy-compose-input');
        if (!bar) return;
        bar.classList.add('hidden');
        if (input && options.clear !== false) {
            input.value = '';
        }
    }

    function openFireBuddyComposer(contactId) {
        const profile = syncFireBuddyComposer(contactId);
        const bar = document.getElementById('fire-buddy-compose-bar');
        const input = document.getElementById('fire-buddy-compose-input');
        const chatMorePanel = document.getElementById('chat-more-panel');
        const chatInputArea = document.querySelector('.chat-input-area');
        const contact = getContactById(contactId || getState().currentChatContactId);
        if (!profile || !bar || !input || !contact || !isFireBuddyEnabled(contact)) return;

        if (chatMorePanel) {
            chatMorePanel.classList.remove('slide-in');
        }
        if (chatInputArea) {
            chatInputArea.classList.remove('push-up-more');
        }

        bar.classList.remove('hidden');
        window.setTimeout(() => input.focus(), 0);
    }

    function hideFireBuddyMentionMenu() {
        const menu = document.getElementById('fire-buddy-mention-menu');
        if (!menu) return;
        menu.classList.add('hidden');
        delete menu.dataset.rangeStart;
        delete menu.dataset.rangeEnd;
        delete menu.dataset.contactId;
    }

    function syncFireBuddyMentionMenu() {
        const menu = document.getElementById('fire-buddy-mention-menu');
        const option = document.getElementById('fire-buddy-mention-option');
        const avatarEl = document.getElementById('fire-buddy-mention-avatar');
        const nameEl = document.getElementById('fire-buddy-mention-name');
        const input = document.getElementById('chat-input');
        const contact = getContactById(getState().currentChatContactId);
        if (!menu || !option || !avatarEl || !nameEl || !input || !contact || !isFireBuddyEnabled(contact)) {
            hideFireBuddyMentionMenu();
            return null;
        }

        const profile = getFireBuddySpeakerProfile(contact.id);
        const cursorPos = Number.isFinite(input.selectionStart) ? input.selectionStart : String(input.value || '').length;
        const beforeCursor = String(input.value || '').slice(0, cursorPos);
        const match = /(^|\s)@([^\s@]*)$/.exec(beforeCursor);
        if (!match || !profile) {
            hideFireBuddyMentionMenu();
            return null;
        }

        const query = String(match[2] || '').trim().toLowerCase();
        const displayName = String(profile.name || '').trim();
        if (query && !displayName.toLowerCase().includes(query)) {
            hideFireBuddyMentionMenu();
            return null;
        }

        const leading = match[1] || '';
        const start = beforeCursor.length - match[0].length + leading.length;
        const end = beforeCursor.length;
        avatarEl.src = profile.avatar;
        nameEl.textContent = profile.name;
        menu.dataset.rangeStart = String(start);
        menu.dataset.rangeEnd = String(end);
        menu.dataset.contactId = String(contact.id);
        option.dataset.contactId = String(contact.id);
        menu.classList.remove('hidden');
        return { start, end, profile };
    }

    function applyFireBuddyMentionSelection(contactId) {
        const menu = document.getElementById('fire-buddy-mention-menu');
        const input = document.getElementById('chat-input');
        const contact = getContactById(contactId || (menu && menu.dataset.contactId) || getState().currentChatContactId);
        if (!menu || !input || !contact || !isFireBuddyEnabled(contact)) {
            hideFireBuddyMentionMenu();
            return;
        }

        const profile = getFireBuddySpeakerProfile(contact.id);
        const rangeStart = Number(menu.dataset.rangeStart || 0);
        const rangeEnd = Number(menu.dataset.rangeEnd || 0);
        const insertText = `${getFireBuddyMentionToken(contact)} `;
        const rawValue = String(input.value || '');
        input.value = `${rawValue.slice(0, rangeStart)}${insertText}${rawValue.slice(rangeEnd)}`;
        const nextCursor = rangeStart + insertText.length;
        input.focus();
        if (typeof input.setSelectionRange === 'function') {
            input.setSelectionRange(nextCursor, nextCursor);
        }
        hideFireBuddyMentionMenu();
        return profile;
    }

    function splitFireBuddyReplyBurst(text) {
        return String(text || '')
            .split(/(?<=[。！？!?…~])\s*|\n+/)
            .map(part => String(part || '').trim())
            .filter(Boolean);
    }

    function buildFireBuddyFallbackReplies(triggerText, profile) {
        const cleanText = String(triggerText || '').trim();
        const topic = cleanText || '这句';
        return [
            '我先冒个泡。',
            `${topic ? '这句我也想接一下。' : '我也想插一句。'}`,
            `${profile && profile.name ? `${profile.name} 在旁边听着呢。` : '我在旁边听着呢。'}`
        ];
    }

    function normalizeFireBuddyReplyTexts(messages, triggerText, profile) {
        let replyTexts = Array.isArray(messages)
            ? messages.flatMap(item => splitFireBuddyReplyBurst(item))
            : [];

        if (replyTexts.length < 3) {
            const combined = replyTexts.join(' ');
            replyTexts = splitFireBuddyReplyBurst(combined);
        }

        if (replyTexts.length < 3) {
            const fallbackTexts = buildFireBuddyFallbackReplies(triggerText, profile);
            fallbackTexts.forEach(text => {
                if (!replyTexts.includes(text)) {
                    replyTexts.push(text);
                }
            });
        }

        if (replyTexts.length < 3) {
            replyTexts.push('我还在。');
        }

        return replyTexts.slice(0, Math.max(3, Math.min(replyTexts.length, 5)));
    }

    function collectFireBuddyReplyTexts(parsedItems) {
        const items = Array.isArray(parsedItems) ? parsedItems : [];
        const replyTexts = [];
        items.forEach(item => {
            const normalizedType = typeof window.normalizeAiSchemaType === 'function'
                ? window.normalizeAiSchemaType(item && item.type)
                : String(item && item.type || '').toLowerCase();

            if (normalizedType === 'text_message') {
                const text = String(item && (item.content || item.text) || '').trim();
                if (text) replyTexts.push(text);
                return;
            }

            if (normalizedType === 'quote_reply') {
                const replyContent = String(item && (item.replyContent || item.content) || '').trim();
                if (replyContent) replyTexts.push(replyContent);
            }
        });
        return replyTexts;
    }

    function buildFireBuddyBurstInstruction(contact, triggerMsg, profile) {
        const fireBuddy = ensureFireBuddy(contact);
        const mentionState = detectFireBuddyMentionState(triggerMsg && triggerMsg.content, contact);
        const cleanText = mentionState && mentionState.cleanText ? mentionState.cleanText : String(triggerMsg && triggerMsg.content || '').trim();
        const personaText = String(fireBuddy.profile.persona || '').trim();
        const triggerSource = String(triggerMsg && triggerMsg.fireBuddyTriggerSource || ((triggerMsg && triggerMsg.role) === 'assistant' ? 'contact' : 'user')).trim();
        const triggerSpeakerName = String(triggerMsg && triggerMsg.fireBuddyTriggerSpeakerName || (triggerSource === 'contact' ? (contact.remark || contact.nickname || contact.name || '联系人') : '用户')).trim();
        const triggerLead = triggerSource === 'contact'
            ? `${triggerSpeakerName}刚刚 @ 了你，希望你回应ta。`
            : '用户刚刚 @ 了你，希望你加入当前对话。';
        const triggerTargetHint = triggerSource === 'contact'
            ? `请优先接${triggerSpeakerName}刚刚对你说的话，也可以顺带让用户看见你们在互动。`
            : '请优先接用户刚刚对你说的话。';
        return [
            `你现在不是 ${contact.name} 本人，你是这个聊天里的独立角色“${profile.name}”。`,
            personaText ? `你的人设：${personaText}` : '你的人设：像一团会说话的小火苗，敏感、会接话、陪伴感强。',
            `你和 ${contact.name} 是两个不同发言人，绝不能冒充 ${contact.name}，也不要替 ${contact.name} 做主回复。`,
            triggerLead,
            cleanText ? `请围绕这句接话：${cleanText}` : '请围绕用户刚刚的话自然接话。',
            triggerTargetHint,
            '本轮必须只输出 3 到 5 条 text_message。',
            '每条都要短，像微信里连续发出的几条小气泡。',
            '不要输出 thought_state、action、voice、image、sticker、description。'
        ].join('\n');
    }

    async function requestFireBuddyReplyBurst(contactId, triggerMsg) {
        const contact = getContactById(contactId);
        const profile = getFireBuddySpeakerProfile(contactId);
        if (!contact || !profile || !isFireBuddyEnabled(contact)) return [];

        const settings = window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.url
            ? window.iphoneSimState.aiSettings
            : window.iphoneSimState.aiSettings2;
        if (!settings || !settings.url || !settings.key) return [];

        const instruction = buildFireBuddyBurstInstruction(contact, triggerMsg, profile);
        const fireBuddyPersona = [
            `你是聊天里的独立角色“${profile.name}”，不是 ${contact.name} 本人。`,
            profile.persona ? `你的人设：${profile.persona}` : '你的人设：会观察气氛、会接梗、会连续发几句短消息。',
            `你会在用户或 ${contact.name} @ 你时，以独立身份加入 ${contact.name} 和用户的聊天。`
        ].join('\n');

        const promptMessages = typeof window.buildAiPromptMessages === 'function'
            ? await window.buildAiPromptMessages(contactId, instruction, {
                contactOverride: {
                    name: profile.name,
                    persona: fireBuddyPersona,
                    style: '灵动、口语、短句、会连发',
                    showThought: false
                }
            })
            : [];

        if (!Array.isArray(promptMessages) || promptMessages.length === 0) {
            return normalizeFireBuddyReplyTexts([], triggerMsg && triggerMsg.content, profile);
        }

        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? `${fetchUrl}chat/completions` : `${fetchUrl}/chat/completions`;
        }

        if (typeof window.normalizeAiRequestMessageImages === 'function') {
            await window.normalizeAiRequestMessageImages(promptMessages);
        }

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${String(settings.key || '').replace(/[^\x00-\x7F]/g, '').trim()}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: promptMessages,
                temperature: settings.temperature
            })
        });

        if (!response.ok) {
            throw new Error(`FireBuddy API Error: ${response.status}`);
        }

        const data = await response.json();
        const extractedReply = typeof window.extractReplyContentFromAiResponse === 'function'
            ? window.extractReplyContentFromAiResponse(data)
            : { content: '' };
        const replyContent = String(extractedReply && extractedReply.content || '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .trim();
        const parsedItems = typeof window.parseMixedAiResponse === 'function'
            ? window.parseMixedAiResponse(replyContent)
            : [];
        const replyTexts = collectFireBuddyReplyTexts(parsedItems);
        return normalizeFireBuddyReplyTexts(replyTexts, triggerMsg && triggerMsg.content, profile);
    }

    function pushFireBuddySpeakerMessage(text, contactId, options = {}) {
        const content = String(text || '').trim();
        if (!contactId || !content) return null;

        if (!Array.isArray(getState().chatHistory[contactId])) {
            getState().chatHistory[contactId] = [];
        }

        const msg = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            time: Date.now(),
            role: 'assistant',
            speaker: 'fire-buddy',
            content,
            type: options.type || 'text',
            replyTo: options.replyTo || null
        };

        getState().chatHistory[contactId].push(msg);
        if (typeof window.saveConfig === 'function') {
            window.saveConfig();
        }

        if (String(getState().currentChatContactId || '') === String(contactId)) {
            if (typeof window.appendMessageToUI === 'function') {
                window.appendMessageToUI(msg.content, false, msg.type, null, msg.replyTo, msg.id, msg.time);
            } else if (typeof window.renderChatHistory === 'function') {
                window.renderChatHistory(contactId, true);
            }
            if (typeof window.scrollToBottom === 'function') {
                window.scrollToBottom();
            }
        }

        if (typeof window.renderContactList === 'function') {
            window.renderContactList(getState().currentContactGroup || 'all');
        }

        return msg;
    }

    async function sendFireBuddyBurstMessages(contactId, replyTexts) {
        const safeTexts = Array.isArray(replyTexts) ? replyTexts.filter(Boolean) : [];
        for (let index = 0; index < safeTexts.length; index += 1) {
            pushFireBuddySpeakerMessage(safeTexts[index], contactId);
            await new Promise(resolve => window.setTimeout(resolve, index === safeTexts.length - 1 ? 30 : 120));
        }
    }

    async function generateFireBuddyMentionReplies(contactId, triggerMsg) {
        const contact = getContactById(contactId);
        if (!contact || !triggerMsg || !isFireBuddyEnabled(contact)) return false;
        if (triggerMsg.fireBuddyMentionConsumed) return false;

        const runtimeKey = `${contactId}:${triggerMsg.id || ''}`;
        window.__fireBuddyReplyRuntime = window.__fireBuddyReplyRuntime || {};
        if (window.__fireBuddyReplyRuntime[runtimeKey]) return false;
        window.__fireBuddyReplyRuntime[runtimeKey] = true;

        try {
            const replyTexts = await requestFireBuddyReplyBurst(contactId, triggerMsg);
            if (!replyTexts.length) return false;
            await sendFireBuddyBurstMessages(contactId, replyTexts);
            triggerMsg.fireBuddyMentionConsumed = true;
            if (typeof window.saveConfig === 'function') {
                window.saveConfig();
            }
            return true;
        } catch (error) {
            console.error('小火人生成回复失败', error);
            return false;
        } finally {
            delete window.__fireBuddyReplyRuntime[runtimeKey];
        }
    }

    async function runPendingFireBuddyReplyBurst(contactId) {
        const pendingTriggerMsg = contactId ? getPendingFireBuddyMentionMessage(contactId) : null;
        if (!pendingTriggerMsg) return false;
        return generateFireBuddyMentionReplies(contactId, pendingTriggerMsg);
    }

    async function runFireBuddyReplyBurstForAssistantMessage(contactId, triggerMsg) {
        if (!contactId || !triggerMsg) return false;
        markFireBuddyMentionOnAssistantMessage(triggerMsg, contactId);
        if (!triggerMsg.fireBuddyMentioned) return false;
        return generateFireBuddyMentionReplies(contactId, triggerMsg);
    }

    function sendFireBuddyManualMessage() {
        const input = document.getElementById('fire-buddy-compose-input');
        const bar = document.getElementById('fire-buddy-compose-bar');
        const contactId = (bar && bar.dataset.contactId) || getState().currentChatContactId;
        const text = input ? input.value.trim() : '';
        if (!contactId || !text) return null;
        const msg = pushFireBuddySpeakerMessage(text, contactId);
        if (typeof window.refreshFireBuddyState === 'function') {
            window.refreshFireBuddyState(contactId, 'manual-fire-buddy-message');
        }

        if (input) {
            input.value = '';
            input.focus();
        }
        return msg;
    }

    function bindMentionEvents() {
        if (window.__fireBuddyMentionBound) return;
        window.__fireBuddyMentionBound = true;

        const chatInput = document.getElementById('chat-input');
        const mentionOption = document.getElementById('fire-buddy-mention-option');
        if (chatInput) {
            ['input', 'click', 'focus', 'keyup'].forEach(eventName => {
                chatInput.addEventListener(eventName, () => {
                    syncFireBuddyMentionMenu();
                });
            });
        }

        if (mentionOption) {
            mentionOption.addEventListener('mousedown', (event) => {
                event.preventDefault();
                applyFireBuddyMentionSelection(mentionOption.dataset.contactId || getState().currentChatContactId);
            });
        }

        document.addEventListener('click', (event) => {
            const menu = document.getElementById('fire-buddy-mention-menu');
            const input = document.getElementById('chat-input');
            if (!menu || menu.classList.contains('hidden')) return;
            if ((input && input.contains(event.target)) || menu.contains(event.target)) return;
            hideFireBuddyMentionMenu();
        });
    }

    function isFireBuddyVisibleStatus(status) {
        return ['bound', 'gray', 'wake-ready'].includes(status);
    }

    function getFireBuddyStageLabel(status) {
        const labels = {
            locked: '\u672a\u89e3\u9501',
            warming: '\u5347\u6e29\u4e2d',
            invitable: '\u81ea\u52a8\u7ed1\u5b9a',
            invited: '\u81ea\u52a8\u7ed1\u5b9a\u4e2d',
            bound: '\u5df2\u7ed1\u5b9a',
            gray: '\u5df2\u53d8\u7070',
            'wake-ready': '\u53ef\u5524\u9192'
        };
        return labels[status] || labels.locked;
    }

    function showFireBuddyUnlockCard(contact) {
        const card = document.getElementById('fire-buddy-unlock-card');
        const titleEl = document.getElementById('fire-buddy-unlock-card-title');
        const textEl = document.getElementById('fire-buddy-unlock-card-text');
        if (!card || !contact) return;

        const name = contact.remark || contact.nickname || contact.name || '\u5bf9\u65b9';
        if (titleEl) titleEl.textContent = '\u5df2\u81ea\u52a8\u7ed1\u5b9a\u5c0f\u706b\u4eba';
        if (textEl) {
            textEl.textContent = `\u4f60\u548c ${name} \u5df2\u6ee1\u8db3\u8fde\u7eed ${INVITE_STREAK_DAYS} \u5929\u6709\u6548\u4e92\u52a8\u6761\u4ef6\uff0c\u7cfb\u7edf\u5df2\u81ea\u52a8\u5b8c\u6210\u7ed1\u5b9a\u3002`;
        }
        card.dataset.contactId = contact.id;
        card.classList.remove('hidden');
    }

    function syncFireBuddyUnlockCard(contact, status) {
        const chatScreen = document.getElementById('chat-screen');
        const card = document.getElementById('fire-buddy-unlock-card');
        if (!card || !contact || !chatScreen || chatScreen.classList.contains('hidden')) {
            hideFireBuddyUnlockCard();
            return;
        }

        if (!isFireBuddyEnabled(contact)) {
            hideFireBuddyUnlockCard();
            return;
        }

        const isCurrentChat = String(getState().currentChatContactId || '') === String(contact.id);
        if (!isCurrentChat || status !== 'bound') {
            hideFireBuddyUnlockCard();
            return;
        }

        const fireBuddy = ensureFireBuddy(contact);
        const lastShownAt = Number(fireBuddy.ui.invitableCardShownAt) || 0;
        const autoBoundAt = Number(fireBuddy.boundAt) || 0;
        const shouldAutoShow = !!autoBoundAt && (!lastShownAt || lastShownAt < autoBoundAt);

        if (!shouldAutoShow) {
            hideFireBuddyUnlockCard();
            return;
        }

        showFireBuddyUnlockCard(contact);
        fireBuddy.ui.invitableCardShownAt = Date.now();
        if (typeof window.saveConfig === 'function') {
            window.saveConfig();
        }
    }

    function getFireBuddyActionConfig(status) {
        if (status === 'wake-ready') {
            return { hidden: false, disabled: false, label: '\u5524\u9192\u5c0f\u706b\u4eba' };
        }
        if (status === 'bound') {
            return { hidden: false, disabled: true, label: '\u5df2\u7ed1\u5b9a' };
        }
        if (status === 'gray') {
            return { hidden: false, disabled: true, label: '\u7b49\u5f85\u5524\u9192' };
        }
        return { hidden: true, disabled: true, label: '' };
    }

    function buildStatusHeadline(contact, status) {
        const name = contact.remark || contact.nickname || contact.name || '\u5bf9\u65b9';
        const buddyName = getFireBuddyDisplayName(contact);
        const headlineMap = {
            locked: `${name}\u7684${buddyName}\u8fd8\u5728\u917f\u9020\u706b\u82b1`,
            warming: `${name}\u7684${buddyName}\u6b63\u5728\u5347\u6e29`,
            invitable: `${name}\u7684${buddyName}\u5df2\u6ee1\u8db3\u81ea\u52a8\u7ed1\u5b9a\u6761\u4ef6`,
            invited: `${name}\u7684${buddyName}\u6b63\u5728\u540c\u6b65\u81ea\u52a8\u7ed1\u5b9a`,
            bound: `\u4f60\u4eec\u5df2\u7ecf\u5b8c\u6210${buddyName}\u81ea\u52a8\u7ed1\u5b9a`,
            gray: `${name}\u7684${buddyName}\u56e0\u4e3a\u51b7\u5374\u800c\u53d8\u7070`,
            'wake-ready': `${name}\u7684${buddyName}\u5df2\u7ecf\u53ef\u4ee5\u5524\u9192`
        };
        return headlineMap[status] || headlineMap.locked;
    }

    function buildStatusDetail(contact, metrics, status) {
        const fireBuddy = ensureFireBuddy(contact);
        if (status === 'bound' || status === 'invitable' || status === 'invited') {
            const boundAt = Number.isFinite(fireBuddy.boundAt) ? fireBuddy.boundAt : fireBuddy.invitedAt;
            return `\u7ed1\u5b9a\u65f6\u95f4\uff1a${formatStatusTimestamp(boundAt)} \u00b7 \u6700\u8fd1\u6709\u6548\u4e92\u52a8\uff1a${getFireBuddyLastActiveDayLabel(metrics)}`;
        }
        if (status === 'gray') {
            return `\u53d8\u7070\u65f6\u95f4\uff1a${formatStatusTimestamp(fireBuddy.grayAt)} \u00b7 \u9700\u8981\u5148\u6062\u590d\u65b0\u7684\u6709\u6548\u4e92\u52a8`;
        }
        if (status === 'wake-ready') {
            return `\u6700\u8fd1\u6709\u6548\u4e92\u52a8\uff1a${getFireBuddyLastActiveDayLabel(metrics)} \u00b7 \u5df2\u6ee1\u8db3\u5524\u9192\u6761\u4ef6`;
        }
        if (status === 'warming') {
            return `\u5f53\u524d\u8fde\u7eed ${metrics.currentStreak} / ${INVITE_STREAK_DAYS} \u5929\uff0c\u518d\u575a\u6301 ${Math.max(0, INVITE_STREAK_DAYS - metrics.currentStreak)} \u5929\u5c31\u4f1a\u81ea\u52a8\u7ed1\u5b9a`;
        }
        return `\u5f53\u524d\u8fde\u7eed ${metrics.currentStreak} / ${INVITE_STREAK_DAYS} \u5929\uff0c\u8fd8\u9700\u7ee7\u7eed\u804a\u5929\u70b9\u4eae\u706b\u82b1\u5e76\u89e3\u9501\u81ea\u52a8\u7ed1\u5b9a`;
    }

    function getFireBuddyHeaderIcon(status) {
        if (status === 'gray') return '\ud83d\udca4';
        if (status === 'wake-ready') return '\u2728';
        if (status === 'bound' || status === 'invitable' || status === 'invited') return '\ud83d\udd25';
        return '\u2728';
    }

    function getFireBuddyContactBadge(status) {
        const badgeMap = {
            invitable: '\u706b',
            invited: '\u706b',
            bound: '\u706b',
            gray: '\u7070',
            'wake-ready': '\u9192'
        };
        return badgeMap[status] || '\u706b';
    }

    function autoBindFireBuddyIfReady(contact, metrics) {
        if (!contact || !isFireBuddyEnabled(contact)) return false;

        const fireBuddy = ensureFireBuddy(contact);
        if (fireBuddy.manualUnlock.enabled || Number.isFinite(fireBuddy.boundAt)) {
            return false;
        }

        const shouldAutoBind = Number.isFinite(fireBuddy.invitedAt) || metrics.currentStreak >= INVITE_STREAK_DAYS;
        if (!shouldAutoBind) {
            return false;
        }

        fireBuddy.boundAt = Number.isFinite(fireBuddy.invitedAt) ? fireBuddy.invitedAt : Date.now();
        fireBuddy.invitedAt = null;
        fireBuddy.grayAt = null;
        fireBuddy.awakenedAt = null;

        if (typeof window.saveConfig === 'function') {
            window.saveConfig();
        }

        return true;
    }

    function getDerivedFireBuddyStatus(contact, metrics) {
        const fireBuddy = ensureFireBuddy(contact);
        const manualMode = fireBuddy.manualUnlock.enabled ? fireBuddy.manualUnlock.mode : null;
        if (manualMode) {
            return FIRE_BUDDY_MANUAL_MODES.includes(manualMode) ? manualMode : 'locked';
        }

        autoBindFireBuddyIfReady(contact, metrics);

        if (fireBuddy.boundAt) {
            const isStale = !metrics.lastMessageAt || (Date.now() - metrics.lastMessageAt) > GRAY_TIMEOUT_MS;
            const hasGrayRecord = Number.isFinite(fireBuddy.grayAt);
            const canWake = hasGrayRecord
                && Number.isFinite(metrics.lastMessageAt)
                && metrics.lastMessageAt > fireBuddy.grayAt
                && metrics.currentStreak > 0;

            if (hasGrayRecord) {
                return canWake ? 'wake-ready' : 'gray';
            }

            return isStale ? 'gray' : 'bound';
        }

        if (metrics.currentStreak >= WARM_STREAK_DAYS) return 'warming';
        return 'locked';
    }

    function buildProgressTip(status, metrics) {
        if (status === 'gray') {
            return '\u8d85\u8fc7 48 \u5c0f\u65f6\u672a\u4e92\u52a8\uff0c\u5c0f\u706b\u4eba\u4f1a\u53d8\u7070\u3002\u5148\u6062\u590d\u65b0\u7684\u6709\u6548\u4e92\u52a8\uff0c\u624d\u80fd\u8fdb\u5165\u5524\u9192\u6d41\u7a0b\u3002';
        }
        if (status === 'wake-ready') {
            return '\u5df2\u7ecf\u6062\u590d\u4e86\u65b0\u7684\u6709\u6548\u4e92\u52a8\uff0c\u73b0\u5728\u53ef\u4ee5\u624b\u52a8\u5524\u9192\u5c0f\u706b\u4eba\u3002';
        }
        if (status === 'bound') {
            return '\u5c0f\u706b\u4eba\u5df2\u81ea\u52a8\u7ed1\u5b9a\uff0c\u4fdd\u6301\u4e92\u52a8\u5c31\u80fd\u8ba9\u706b\u82b1\u4e00\u76f4\u4eae\u7740\u3002';
        }
        if (status === 'warming') {
            return `\u5f53\u524d\u5df2\u7ecf\u8fdb\u5165\u5347\u6e29\u9636\u6bb5\uff0c\u518d\u7ee7\u7eed ${Math.max(0, INVITE_STREAK_DAYS - metrics.currentStreak)} \u5929\u6709\u6548\u4e92\u52a8\u5c31\u4f1a\u81ea\u52a8\u7ed1\u5b9a\u3002`;
        }
        return `\u8fde\u7eed ${INVITE_STREAK_DAYS} \u4e2a\u6709\u6548\u4e92\u52a8\u65e5\u540e\u4f1a\u81ea\u52a8\u7ed1\u5b9a\u3002\u6709\u6548\u4e92\u52a8\u65e5\u9700\u8981\u5f53\u5929\u53cc\u65b9\u90fd\u53d1\u8fc7\u79c1\u804a\u6d88\u606f\u3002`;
    }

    function getFireBuddyV2StageMeta(status) {
        const stageMap = {
            locked: { icon: '\u2726', label: '\u7b49\u5f85\u70b9\u4eae' },
            warming: { icon: '\u2726', label: '\u5347\u6e29\u4e2d' },
            invitable: { icon: '\u2728', label: '\u81ea\u52a8\u7ed1\u5b9a' },
            invited: { icon: '\u2728', label: '\u81ea\u52a8\u7ed1\u5b9a' },
            bound: { icon: '\u2728', label: '\u6d3b\u8dc3\u7fb1\u7eca' },
            gray: { icon: '\u25cb', label: '\u4f11\u7720\u4e2d' },
            'wake-ready': { icon: '\u2728', label: '\u7b49\u5f85\u5524\u9192' }
        };
        return stageMap[status] || stageMap.locked;
    }

    function getFireBuddyV2StatusMarkup(status) {
        const statusMap = {
            locked: '\u7fb1\u7eca\u5c1a\u672a\u5efa\u7acb\u3002\u5f53\u524d\u4ecd\u5728 <strong>\u79ef\u84c4\u706b\u82b1</strong>\u3002\u7ee7\u7eed\u4fdd\u6301\u7a33\u5b9a\u4e92\u52a8\uff0c\u7b49\u5b83\u771f\u6b63\u88ab\u70b9\u4eae\u3002',
            warming: '\u7fb1\u7eca\u6b63\u5728 <strong>\u5347\u6e29</strong>\u3002\u518d\u591a\u4e00\u4e9b\u8fde\u7eed\u6709\u6548\u4e92\u52a8\uff0c\u5c31\u4f1a\u81ea\u52a8\u5b8c\u6210\u7ed1\u5b9a\u3002',
            invitable: '\u6761\u4ef6\u5df2\u8fbe\u6210\uff0c\u7cfb\u7edf\u4f1a\u76f4\u63a5 <strong>\u81ea\u52a8\u7ed1\u5b9a</strong> \u5c0f\u706b\u4eba\u3002',
            invited: '\u65e7\u7684\u9080\u8bf7\u72b6\u6001\u5df2\u5408\u5e76\u4e3a <strong>\u81ea\u52a8\u7ed1\u5b9a</strong> \u6d41\u7a0b\u3002',
            bound: '\u7fb1\u7eca\u5df2\u81ea\u52a8\u5efa\u7acb\u3002\u5f53\u524d\u4e92\u52a8\u5904\u4e8e <strong>\u6d3b\u8dc3</strong> \u72b6\u6001\uff0c\u7ee7\u7eed\u4fdd\u6301\u65e5\u5e38\u6c9f\u901a\u5373\u53ef\u3002',
            gray: '\u7fb1\u7eca\u6682\u65f6\u8fdb\u5165 <strong>\u4f11\u7720</strong>\u3002\u6062\u590d\u65b0\u7684\u6709\u6548\u4e92\u52a8\u540e\uff0c\u624d\u80fd\u518d\u6b21\u628a\u661f\u706b\u70b9\u4eae\u3002',
            'wake-ready': '\u65b0\u7684\u4e92\u52a8\u5df2\u7ecf\u6062\u590d\u3002\u5f53\u524d\u5904\u4e8e <strong>\u53ef\u5524\u9192</strong> \u72b6\u6001\uff0c\u518d\u63a8\u8fdb\u4e00\u6b65\u5c31\u80fd\u8ba9\u5b83\u91cd\u65b0\u82cf\u9192\u3002'
        };
        return statusMap[status] || statusMap.locked;
    }

    function bindFireBuddyCurrentContact() {
        const panel = document.getElementById('fire-buddy-panel');
        const contactId = (panel && panel.dataset.contactId) || getState().currentChatContactId;
        const contact = getContactById(contactId);
        if (!contact || !isFireBuddyEnabled(contact)) return;

        const fireBuddy = ensureFireBuddy(contact);
        const result = refreshFireBuddyState(contact.id, 'panel-action');
        if (!result || result.status !== 'wake-ready') return;

        fireBuddy.grayAt = null;
        fireBuddy.awakenedAt = Date.now();
        fireBuddy.manualUnlock.enabled = false;
        fireBuddy.manualUnlock.mode = 'locked';

        if (typeof window.saveConfig === 'function') {
            window.saveConfig();
        }
        refreshFireBuddyState(contact.id, 'panel-action-commit');
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(getState().currentContactGroup || 'all');
        }
    }

    function bindPanelEvents() {
        const entryBtn = document.getElementById('fire-buddy-entry');
        const closeBtn = document.getElementById('close-fire-buddy-panel');
        const unlockCard = document.getElementById('fire-buddy-unlock-card');
        const actionBtn = document.getElementById('fire-buddy-panel-action');
        const profileSaveBtn = document.getElementById('fire-buddy-profile-save');
        const moreBtn = document.getElementById('chat-more-fire-buddy-btn');
        const composeCloseBtn = document.getElementById('fire-buddy-compose-close');
        const composeSendBtn = document.getElementById('fire-buddy-compose-send');
        const composeInput = document.getElementById('fire-buddy-compose-input');
        if (entryBtn) {
            entryBtn.addEventListener('click', () => openFireBuddyPanel(entryBtn.dataset.contactId || getState().currentChatContactId));
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', closeFireBuddyPanel);
        }
        if (unlockCard) {
            unlockCard.addEventListener('click', () => openFireBuddyPanel(unlockCard.dataset.contactId || getState().currentChatContactId));
        }
        if (actionBtn) {
            actionBtn.addEventListener('click', bindFireBuddyCurrentContact);
        }
        if (profileSaveBtn) {
            profileSaveBtn.addEventListener('click', saveFireBuddyProfileFromPanel);
        }
        if (moreBtn) {
            moreBtn.addEventListener('click', () => openFireBuddyComposer(getState().currentChatContactId));
        }
        if (composeCloseBtn) {
            composeCloseBtn.addEventListener('click', () => closeFireBuddyComposer());
        }
        if (composeSendBtn) {
            composeSendBtn.addEventListener('click', sendFireBuddyManualMessage);
        }
        if (composeInput) {
            composeInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    sendFireBuddyManualMessage();
                }
            });
        }
    }

    function bindLifecycleEvents() {
        if (window.__fireBuddyLifecycleBound) return;
        window.__fireBuddyLifecycleBound = true;

        const backBtn = document.getElementById('back-to-contacts');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                hideFireBuddyPet();
                hideFireBuddyUnlockCard();
                closeFireBuddyComposer();
                hideFireBuddyMentionMenu();
            });
        }

        const chatScreen = document.getElementById('chat-screen');
        if (chatScreen && typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(() => {
                if (chatScreen.classList.contains('hidden')) {
                    hideFireBuddyPet();
                    hideFireBuddyUnlockCard();
                    closeFireBuddyComposer();
                    hideFireBuddyMentionMenu();
                    return;
                }

                const currentContactId = getState().currentChatContactId;
                if (currentContactId) {
                    refreshFireBuddyState(currentContactId, 'chat-screen-visibility');
                }
            });
            observer.observe(chatScreen, { attributes: true, attributeFilter: ['class'] });
        }

        window.addEventListener('resize', () => {
            const currentContactId = getState().currentChatContactId;
            if (currentContactId) {
                refreshFireBuddyState(currentContactId, 'resize');
            } else {
                hideFireBuddyPet();
                hideFireBuddyUnlockCard();
            }
        });
    }

    function initFireBuddy() {
        ensureAllFireBuddyRoots();
        patchRuntimeHooks();
        bindPanelEvents();
        bindMentionEvents();
        bindLifecycleEvents();
        bindSettingsEvents();
        decorateContactList(getState().currentContactGroup || 'all');

        const currentContactId = getState().currentChatContactId;
        if (currentContactId) {
            refreshFireBuddyState(currentContactId, 'init');
        } else {
            hideFireBuddyPet();
            hideFireBuddyUnlockCard();
            closeFireBuddyComposer();
            syncFireBuddyComposeTrigger(null);
        }
        
    }

    window.openFireBuddyPanel = openFireBuddyPanel;
    window.refreshFireBuddyState = refreshFireBuddyState;
    window.hideFireBuddyPet = hideFireBuddyPet;
    window.getFireBuddySpeakerMeta = getFireBuddySpeakerMeta;
    window.pushFireBuddySpeakerMessage = pushFireBuddySpeakerMessage;
    window.replaceGenericFireBuddyMention = replaceGenericFireBuddyMention;
    window.openFireBuddyComposer = openFireBuddyComposer;
    window.sendFireBuddyManualMessage = sendFireBuddyManualMessage;
    window.markFireBuddyMentionOnOutgoingMsg = markFireBuddyMentionOnOutgoingMsg;
    window.formatFireBuddyMentionForContact = formatFireBuddyMentionForContact;
    window.formatFireBuddySpeakerForContact = formatFireBuddySpeakerForContact;
    window.buildFireBuddyContactSystemPrompt = buildFireBuddyContactSystemPrompt;
    window.runPendingFireBuddyReplyBurst = runPendingFireBuddyReplyBurst;
    window.runFireBuddyReplyBurstForAssistantMessage = runFireBuddyReplyBurstForAssistantMessage;
    window.handleFireBuddyAction = function handleFireBuddyAction(action) {
        if (action === 'bind') {
            bindFireBuddyCurrentContact();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFireBuddy);
    } else {
        initFireBuddy();
    }
})();
