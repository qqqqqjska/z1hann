(function () {
    'use strict';

    const STORAGE_KEY = 'mood_flora_state_v1';
    const MAX_LOGS = 30;
    const DEFAULT_SCORE = 70;
    const STATE_ORDER = ['withered', 'withering', 'healthy', 'blooming'];
    const STATE_CLASS_KEYS = ['blooming', 'healthy', 'withering', 'withered'];
    const PARTICLE_MAP = {
        blooming: [
            { left: '30%', delay: '0s', label: '✨' },
            { left: '62%', delay: '1s', label: '🌸' }
        ],
        healthy: [
            { left: '20%', delay: '0s', label: '✨' },
            { left: '70%', delay: '1.5s', label: '🌿' },
            { left: '45%', delay: '0.8s', label: '🌱' }
        ],
        withering: [],
        withered: []
    };
    const POSITIVE_LEXICON = [
        { label: '哈哈', keyword: '哈哈' },
        { label: '开心', keyword: '开心' },
        { label: '喜欢', keyword: '喜欢' },
        { label: '爱', keyword: '爱' },
        { label: '不错', keyword: '不错' },
        { label: '好耶', keyword: '好耶' },
        { label: '期待', keyword: '期待' },
        { label: '舒服', keyword: '舒服' },
        { label: '想你', keyword: '想你' },
        { label: '可爱', keyword: '可爱' },
        { label: '好喜欢', keyword: '好喜欢' },
        { label: '安心', keyword: '安心' },
        { label: '治愈', keyword: '治愈' },
        { label: '笑得停不下来', regex: /(哈){2,}|(呵){2,}|(嘿){2,}|233+/i }
    ];
    const NEGATIVE_LEXICON = [
        { label: '滚', keyword: '滚' },
        { label: '无语', keyword: '无语' },
        { label: '难过', keyword: '难过' },
        { label: '讨厌', keyword: '讨厌' },
        { label: '生气', keyword: '生气' },
        { label: '烦', keyword: '烦' },
        { label: '别烦', keyword: '别烦' },
        { label: '不想理', keyword: '不想理' },
        { label: '累死', keyword: '累死' },
        { label: '崩溃', keyword: '崩溃' },
        { label: '烦死了', keyword: '烦死了' },
        { label: '气死了', keyword: '气死了' },
        { label: '糟透了', keyword: '糟透了' },
        { label: '负面语气', regex: /气死|烦死|烦透|受够|不开心|好累|累惨|破防|无了|想哭/i }
    ];

    const runtime = {
        data: null,
        initialized: false,
        picker: null,
        pickerBackdrop: null,
        pickerPanel: null,
        pickerList: null,
        pickerClose: null,
        contactButton: null
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function createEmptyStore() {
        return {
            activeContactId: null,
            lastAnalyzedContactId: null,
            contacts: {}
        };
    }

    function createDefaultContactSnapshot(contactId) {
        return {
            contactId: contactId || null,
            score: DEFAULT_SCORE,
            state: 'healthy',
            logs: []
        };
    }

    function clampScore(score) {
        const numeric = Number.isFinite(score) ? score : DEFAULT_SCORE;
        return Math.max(0, Math.min(100, Math.round(numeric)));
    }

    function mapScoreToState(score) {
        if (score > 90) return 'blooming';
        if (score >= 50) return 'healthy';
        if (score >= 20) return 'withering';
        return 'withered';
    }

    function sanitizeLog(rawLog) {
        if (!rawLog || typeof rawLog !== 'object') return null;
        const tone = rawLog.tone === 'negative' ? 'negative' : 'positive';
        const text = typeof rawLog.text === 'string' ? rawLog.text.trim() : '';
        if (!text) return null;

        return {
            id: typeof rawLog.id === 'string' ? rawLog.id : `flora-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            tone,
            kind: typeof rawLog.kind === 'string' ? rawLog.kind : 'event',
            text,
            createdAt: Number.isFinite(rawLog.createdAt) ? rawLog.createdAt : Date.now()
        };
    }

    function sanitizeContactSnapshot(contactId, rawContact) {
        const source = rawContact && typeof rawContact === 'object' ? rawContact : {};
        const score = clampScore(source.score);
        const state = STATE_CLASS_KEYS.includes(source.state) ? source.state : mapScoreToState(score);
        const logs = Array.isArray(source.logs)
            ? source.logs.map(sanitizeLog).filter(Boolean).slice(0, MAX_LOGS)
            : [];

        return {
            contactId,
            score,
            state,
            logs
        };
    }

    function readStore() {
        const empty = createEmptyStore();
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return empty;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return empty;

            const nextStore = {
                activeContactId: parsed.activeContactId ? String(parsed.activeContactId) : null,
                lastAnalyzedContactId: parsed.lastAnalyzedContactId ? String(parsed.lastAnalyzedContactId) : null,
                contacts: {}
            };

            if (parsed.contacts && typeof parsed.contacts === 'object') {
                Object.keys(parsed.contacts).forEach((contactId) => {
                    nextStore.contacts[contactId] = sanitizeContactSnapshot(contactId, parsed.contacts[contactId]);
                });
            }

            return nextStore;
        } catch (error) {
            console.warn('[MoodFlora] read-store-failed', error);
            return empty;
        }
    }

    function writeStore() {
        ensureStore();
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(runtime.data));
        } catch (error) {
            console.warn('[MoodFlora] write-store-failed', error);
        }
    }

    function ensureStore() {
        if (!runtime.data) {
            runtime.data = readStore();
        }
        return runtime.data;
    }

    function getContacts() {
        if (!window.iphoneSimState || !Array.isArray(window.iphoneSimState.contacts)) {
            return [];
        }
        return window.iphoneSimState.contacts.filter((contact) => contact && contact.id);
    }

    function findContact(contactId) {
        if (!contactId) return null;
        return getContacts().find((contact) => String(contact.id) === String(contactId)) || null;
    }

    function isKnownContactId(contactId) {
        if (!contactId) return false;
        const contacts = getContacts();
        if (!contacts.length) {
            return true;
        }
        return contacts.some((contact) => String(contact.id) === String(contactId));
    }

    function resolveDefaultContactId() {
        const store = ensureStore();
        const contacts = getContacts();
        const candidates = [
            store.activeContactId,
            window.iphoneSimState && window.iphoneSimState.currentChatContactId,
            store.lastAnalyzedContactId,
            contacts.length ? contacts[0].id : null,
            Object.keys(store.contacts)[0] || null,
            '__default__'
        ];

        for (let index = 0; index < candidates.length; index += 1) {
            const candidate = candidates[index] ? String(candidates[index]) : null;
            if (!candidate) continue;
            if (candidate === '__default__') return candidate;
            if (isKnownContactId(candidate)) return candidate;
        }

        return '__default__';
    }

    function ensureContactData(contactId) {
        const store = ensureStore();
        const resolvedContactId = contactId ? String(contactId) : resolveDefaultContactId();
        if (!store.contacts[resolvedContactId]) {
            store.contacts[resolvedContactId] = createDefaultContactSnapshot(resolvedContactId);
        } else {
            store.contacts[resolvedContactId] = sanitizeContactSnapshot(resolvedContactId, store.contacts[resolvedContactId]);
        }
        return store.contacts[resolvedContactId];
    }

    function ensureActiveContactId() {
        const store = ensureStore();
        const nextContactId = resolveDefaultContactId();
        if (store.activeContactId !== nextContactId) {
            store.activeContactId = nextContactId;
            writeStore();
        }
        ensureContactData(nextContactId);
        return nextContactId;
    }

    function getActiveContactId() {
        const store = ensureStore();
        if (store.activeContactId && isKnownContactId(store.activeContactId)) {
            ensureContactData(store.activeContactId);
            return store.activeContactId;
        }
        return ensureActiveContactId();
    }

    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getContactDisplayName(contactId) {
        const contact = findContact(contactId);
        if (!contact) return 'TA';
        return contact.remark || contact.name || 'TA';
    }

    function getContactAvatar(contactId) {
        const contact = findContact(contactId);
        return contact && contact.avatar ? contact.avatar : '';
    }

    function getContactInitial(contactId) {
        const name = getContactDisplayName(contactId).trim();
        return name ? name.slice(0, 1).toUpperCase() : 'TA';
    }

    function getHeaderContactTrigger() {
        return document.getElementById('garden-contact-picker-btn') || document.querySelector('#garden-app .garden-app-title-avatar');
    }

    function getRelativeTimeLabel(timestamp) {
        if (!Number.isFinite(timestamp)) return '刚刚';
        const diff = Math.max(0, Date.now() - timestamp);
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}小时前`;
        if (hours < 48) return '昨天';
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}天前`;
        const date = new Date(timestamp);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}-${day}`;
    }

    function removeStateClasses(el, prefix) {
        if (!el) return;
        STATE_CLASS_KEYS.forEach((stateKey) => {
            el.classList.remove(`${prefix}${stateKey}`);
        });
    }

    function renderParticles(target, stateKey, variant) {
        if (!target) return;
        const particles = PARTICLE_MAP[stateKey] || [];
        if (!particles.length) {
            target.innerHTML = '';
            target.style.opacity = '0';
            return;
        }

        target.innerHTML = particles.map((particle) => {
            const particleClass = variant === 'garden' ? 'garden-flora-particle' : 'particle';
            return `<div class="${particleClass}" style="left: ${particle.left}; animation-delay: ${particle.delay};">${particle.label}</div>`;
        }).join('');
        target.style.opacity = '1';
    }

    function renderLogs(logs, variant) {
        const items = Array.isArray(logs) ? logs : [];
        if (!items.length) {
            if (variant === 'garden') {
                return '<div class="garden-flora-msg"><div class="garden-flora-msg-time">刚刚</div><div class="garden-flora-msg-bubble">还没有捕捉到明显情绪波动，继续和 TA 聊聊天吧。</div></div>';
            }
            return '<div class="flora-msg"><div class="msg-time">刚刚</div><div class="msg-bubble">还没有捕捉到明显情绪波动，继续和 TA 聊聊天吧。</div></div>';
        }

        return items.map((log) => {
            const toneClass = log.tone === 'negative'
                ? (variant === 'garden' ? 'is-negative' : 'negative')
                : (variant === 'garden' ? 'is-positive' : 'positive');
            const wrapperClass = variant === 'garden' ? 'garden-flora-msg' : 'flora-msg';
            const timeClass = variant === 'garden' ? 'garden-flora-msg-time' : 'msg-time';
            const bubbleClass = variant === 'garden' ? 'garden-flora-msg-bubble' : 'msg-bubble';
            return `<div class="${wrapperClass}"><div class="${timeClass}">${escapeHtml(getRelativeTimeLabel(log.createdAt))}</div><div class="${bubbleClass} ${toneClass}">${escapeHtml(log.text)}</div></div>`;
        }).join('');
    }

    function syncReadonlyButtons(stateKey) {
        const staticButtons = Array.from(document.querySelectorAll('.toggle-btn'));
        staticButtons.forEach((button) => {
            const buttonState = button.dataset.state || button.dataset.floraState || '';
            button.disabled = true;
            button.setAttribute('aria-disabled', 'true');
            button.classList.toggle('active', buttonState === stateKey);
        });

        const gardenButtons = Array.from(document.querySelectorAll('#garden-flora-screen .garden-flora-toggle-btn'));
        gardenButtons.forEach((button) => {
            const buttonState = button.dataset.floraState || button.dataset.state || '';
            button.disabled = true;
            button.setAttribute('aria-disabled', 'true');
            button.classList.toggle('is-active', buttonState === stateKey);
        });
    }

    function renderStaticView(snapshot) {
        const plant = document.getElementById('art-plant-element');
        if (plant) {
            removeStateClasses(plant, 'state-');
            plant.classList.add(`state-${snapshot.state}`);
        }

        const container = document.getElementById('flora-app-container');
        if (container) {
            removeStateClasses(container, 'bg-');
            container.classList.add(`bg-${snapshot.state}`);
            container.setAttribute('data-contact-id', snapshot.contactId || '');
        }

        renderParticles(document.getElementById('flora-particles'), snapshot.state, 'static');

        const logContent = document.getElementById('dynamic-log-content');
        if (logContent) {
            logContent.innerHTML = renderLogs(snapshot.logs, 'static');
        }
    }

    function renderGardenView(snapshot) {
        const plant = document.getElementById('garden-flora-art-plant');
        if (plant) {
            removeStateClasses(plant, 'garden-flora-state-');
            plant.classList.add(`garden-flora-state-${snapshot.state}`);
        }

        const container = document.getElementById('garden-flora-app');
        if (container) {
            removeStateClasses(container, 'garden-flora-bg-');
            container.classList.add(`garden-flora-bg-${snapshot.state}`);
            container.setAttribute('data-contact-id', snapshot.contactId || '');
        }

        renderParticles(document.getElementById('garden-flora-particles'), snapshot.state, 'garden');

        const logContent = document.getElementById('garden-flora-log-content');
        if (logContent) {
            logContent.innerHTML = renderLogs(snapshot.logs, 'garden');
        }
    }

    function renderContactButton(contactId) {
        const button = getHeaderContactTrigger();
        if (!button) return;

        runtime.contactButton = button;
        if (button.tagName === 'BUTTON') {
            button.setAttribute('type', 'button');
        } else {
            button.setAttribute('role', 'button');
            button.setAttribute('tabindex', '0');
        }
        button.setAttribute('aria-haspopup', 'dialog');
        button.setAttribute('aria-expanded', runtime.picker && runtime.picker.classList.contains('is-open') ? 'true' : 'false');

        const avatar = getContactAvatar(contactId);
        const displayName = getContactDisplayName(contactId);
        if (avatar) {
            button.innerHTML = `<img src="${escapeHtml(avatar)}" alt="${escapeHtml(displayName)}">`;
        } else {
            button.innerHTML = `<span class="garden-app-title-avatar-fallback">${escapeHtml(getContactInitial(contactId))}</span>`;
        }
        button.title = `${displayName}`;
    }

    function buildContactPickerItem(contact, activeContactId) {
        const displayName = contact.remark || contact.name || '未命名联系人';
        const subLabel = contact.name && contact.remark && contact.remark !== contact.name ? contact.name : '当前聊天角色';
        const avatarHtml = contact.avatar
            ? `<img src="${escapeHtml(contact.avatar)}" alt="${escapeHtml(displayName)}">`
            : `<span class="garden-contact-sheet-avatar-fallback">${escapeHtml((displayName || 'TA').slice(0, 1).toUpperCase())}</span>`;

        return `<button class="garden-contact-sheet-item${String(contact.id) === String(activeContactId) ? ' is-active' : ''}" type="button" data-contact-id="${escapeHtml(contact.id)}"><span class="garden-contact-sheet-avatar">${avatarHtml}</span><span class="garden-contact-sheet-meta"><span class="garden-contact-sheet-name">${escapeHtml(displayName)}</span><span class="garden-contact-sheet-sub">${escapeHtml(subLabel)}</span></span><span class="garden-contact-sheet-check">✓</span></button>`;
    }

    function renderContactPicker() {
        if (!runtime.pickerList) return;
        const contacts = getContacts();
        const activeContactId = getActiveContactId();
        if (!contacts.length) {
            runtime.pickerList.innerHTML = '<div class="garden-contact-sheet-empty">还没有可切换的联系人</div>';
            return;
        }
        runtime.pickerList.innerHTML = contacts.map((contact) => buildContactPickerItem(contact, activeContactId)).join('');
    }

    function closeContactPicker() {
        if (!runtime.picker) return;
        runtime.picker.classList.remove('is-open');
        if (runtime.contactButton) {
            runtime.contactButton.setAttribute('aria-expanded', 'false');
        }
        window.setTimeout(() => {
            if (runtime.picker && !runtime.picker.classList.contains('is-open')) {
                runtime.picker.hidden = true;
            }
        }, 220);
    }

    function openContactPicker() {
        ensurePickerShell();
        if (!runtime.picker) return;
        renderContactPicker();
        runtime.picker.hidden = false;
        window.requestAnimationFrame(() => {
            if (!runtime.picker) return;
            runtime.picker.classList.add('is-open');
            if (runtime.contactButton) {
                runtime.contactButton.setAttribute('aria-expanded', 'true');
            }
        });
    }

    function ensurePickerShell() {
        const gardenApp = document.getElementById('garden-app');
        if (!gardenApp) return;

        renderContactButton(getActiveContactId());

        if (!runtime.contactButton || !runtime.contactButton.dataset.moodFloraBound) {
            const button = getHeaderContactTrigger();
            if (button) {
                runtime.contactButton = button;
                button.dataset.moodFloraBound = 'true';
                button.addEventListener('click', () => {
                    if (runtime.picker && runtime.picker.classList.contains('is-open')) {
                        closeContactPicker();
                    } else {
                        openContactPicker();
                    }
                });
                button.addEventListener('keydown', (event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    if (runtime.picker && runtime.picker.classList.contains('is-open')) {
                        closeContactPicker();
                    } else {
                        openContactPicker();
                    }
                });
            }
        }

        if (runtime.picker) return;

        const picker = document.createElement('div');
        picker.className = 'garden-contact-sheet';
        picker.hidden = true;
        picker.innerHTML = '<div class="garden-contact-sheet-backdrop"></div><div class="garden-contact-sheet-panel" role="dialog" aria-modal="true" aria-label="切换联系人"><div class="garden-contact-sheet-handle"></div><div class="garden-contact-sheet-head"><div class="garden-contact-sheet-title">切换联系人</div><button class="garden-contact-sheet-close" type="button" aria-label="关闭">×</button></div><div class="garden-contact-sheet-list"></div></div>';
        gardenApp.appendChild(picker);

        runtime.picker = picker;
        runtime.pickerBackdrop = picker.querySelector('.garden-contact-sheet-backdrop');
        runtime.pickerPanel = picker.querySelector('.garden-contact-sheet-panel');
        runtime.pickerList = picker.querySelector('.garden-contact-sheet-list');
        runtime.pickerClose = picker.querySelector('.garden-contact-sheet-close');

        if (runtime.pickerBackdrop) {
            runtime.pickerBackdrop.addEventListener('click', closeContactPicker);
        }
        if (runtime.pickerClose) {
            runtime.pickerClose.addEventListener('click', closeContactPicker);
        }
        if (runtime.pickerList) {
            runtime.pickerList.addEventListener('click', (event) => {
                const item = event.target.closest('[data-contact-id]');
                if (!item) return;
                setActiveContact(item.dataset.contactId);
                closeContactPicker();
            });
        }
    }

    function buildContactPickerItem(contact, activeContactId) {
        const displayName = contact.remark || contact.name || '未命名联系人';
        const subLabel = contact.name && contact.remark && contact.remark !== contact.name ? contact.name : '当前聊天角色';
        const avatarHtml = contact.avatar
            ? `<img src="${escapeHtml(contact.avatar)}" alt="${escapeHtml(displayName)}">`
            : `<span class="garden-contact-sheet-avatar-fallback">${escapeHtml((displayName || 'TA').slice(0, 1).toUpperCase())}</span>`;

        return `
            <div class="garden-contact-sheet-row">
                <button class="garden-contact-sheet-item${String(contact.id) === String(activeContactId) ? ' is-active' : ''}" type="button" data-contact-id="${escapeHtml(contact.id)}">
                    <span class="garden-contact-sheet-avatar">${avatarHtml}</span>
                    <span class="garden-contact-sheet-meta">
                        <span class="garden-contact-sheet-name">${escapeHtml(displayName)}</span>
                        <span class="garden-contact-sheet-sub">${escapeHtml(subLabel)}</span>
                    </span>
                    <span class="garden-contact-sheet-check">✓</span>
                </button>
                <button class="garden-contact-sheet-settings-btn" type="button" data-contact-settings-id="${escapeHtml(contact.id)}" aria-label="设置${escapeHtml(displayName)}的形象" onclick="event.stopPropagation(); if(window.GardenApp && window.GardenApp.openContactFigureSettings){ window.GardenApp.openContactFigureSettings(this.dataset.contactSettingsId); }">
                    <i class="fas fa-gear"></i>
                </button>
            </div>
        `;
    }

    function renderCurrentSnapshot() {
        const snapshot = getSnapshot(getActiveContactId());
        renderStaticView(snapshot);
        renderGardenView(snapshot);
        syncReadonlyButtons(snapshot.state);
        renderContactButton(snapshot.contactId);
        renderContactPicker();
        return snapshot;
    }

    function persistLogs(contactSnapshot, newLogs) {
        if (!Array.isArray(newLogs) || !newLogs.length) return;
        contactSnapshot.logs = newLogs.concat(contactSnapshot.logs || []).slice(0, MAX_LOGS);
    }

    function buildLog(tone, kind, text) {
        return {
            id: `flora-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            tone,
            kind,
            text,
            createdAt: Date.now()
        };
    }

    function compareStateLevel(prevState, nextState) {
        return STATE_ORDER.indexOf(nextState) - STATE_ORDER.indexOf(prevState);
    }

    function buildStateTransitionLog(prevState, nextState) {
        if (prevState === nextState) return null;
        if (nextState === 'blooming') {
            return buildLog('positive', 'transition', '植物重新开花了，说明 TA 最近的情绪特别明亮。');
        }
        if (nextState === 'healthy') {
            if (compareStateLevel(prevState, nextState) > 0) {
                return buildLog('positive', 'transition', '植物重新恢复生机了，继续保持温柔互动吧。');
            }
            return buildLog('negative', 'transition', '植物从盛开回到平稳状态了，记得继续陪伴 TA。');
        }
        if (nextState === 'withering') {
            return buildLog('negative', 'transition', '植物开始缺水了，快去哄哄 TA 吧。');
        }
        return buildLog('negative', 'transition', '植物已经枯萎了，快去微信里哄哄 TA 让它重新开花吧。');
    }

    function normalizeForMatch(text) {
        return String(text || '').trim().toLowerCase();
    }

    function collectMatches(text, lexicon) {
        const source = normalizeForMatch(text);
        if (!source) return [];
        const hits = [];

        lexicon.forEach((entry) => {
            if (!entry) return;
            let matched = false;
            if (entry.keyword) {
                matched = source.includes(String(entry.keyword).toLowerCase());
            } else if (entry.regex instanceof RegExp) {
                entry.regex.lastIndex = 0;
                matched = entry.regex.test(source);
            }
            if (matched) {
                hits.push(entry.label);
            }
        });

        return Array.from(new Set(hits));
    }

    function looksLikeJsonPayload(text) {
        const source = String(text || '').trim();
        if (!source) return false;
        if (!/^[\[{]/.test(source)) return false;
        try {
            JSON.parse(source);
            return true;
        } catch (error) {
            return false;
        }
    }

    function shouldSkipAnalysis(text, isAi, options) {
        if (isAi !== true) return true;
        if (options && options.type && options.type !== 'text') return true;
        if (typeof text !== 'string') return true;

        const source = text.trim();
        if (!source) return true;
        if (/^\[系统消息\]/.test(source)) return true;
        if (/^\[(转账|红包|礼物|游戏|语音|视频|位置|音乐|亲属卡|收藏|分享)/.test(source)) return true;
        if (/^ACTION:/i.test(source)) return true;
        if (looksLikeJsonPayload(source)) return true;
        return false;
    }

    function getSnapshot(contactId) {
        const resolvedContactId = contactId ? String(contactId) : getActiveContactId();
        const snapshot = sanitizeContactSnapshot(resolvedContactId, ensureContactData(resolvedContactId));
        return clone(snapshot);
    }

    function dispatchStateChange(detail) {
        window.dispatchEvent(new CustomEvent('moodflora:statechange', {
            detail
        }));
    }

    function dispatchContactChange(detail) {
        window.dispatchEvent(new CustomEvent('moodflora:contactchange', {
            detail
        }));
    }

    function analyzeChat(text, isAi, options = {}) {
        ensureStore();

        const explicitContactId = options && options.contactId ? String(options.contactId) : null;
        const contactId = explicitContactId || getActiveContactId();
        const snapshot = ensureContactData(contactId);

        if (shouldSkipAnalysis(text, isAi, options)) {
            return getSnapshot(contactId);
        }

        const positiveHits = collectMatches(text, POSITIVE_LEXICON);
        const negativeHits = collectMatches(text, NEGATIVE_LEXICON);

        runtime.data.lastAnalyzedContactId = contactId;

        if (!positiveHits.length && !negativeHits.length) {
            writeStore();
            return getSnapshot(contactId);
        }

        const prevScore = snapshot.score;
        const prevState = snapshot.state;
        const delta = positiveHits.length * 5 - negativeHits.length * 10;
        const nextScore = clampScore(prevScore + delta);
        const nextState = mapScoreToState(nextScore);

        snapshot.score = nextScore;
        snapshot.state = nextState;

        const newLogs = [];
        const transitionLog = buildStateTransitionLog(prevState, nextState);
        if (transitionLog) {
            newLogs.push(transitionLog);
        }
        if (positiveHits.length) {
            newLogs.push(buildLog('positive', 'emotion', `TA 刚才说了「${positiveHits.join('、')}」，植物吸收了快乐养分！`));
        }
        if (negativeHits.length) {
            newLogs.push(buildLog('negative', 'emotion', `捕捉到了「${negativeHits.join('、')}」这样的负面情绪，植物开始有点打蔫了，快去哄哄 TA 吧！`));
        }

        persistLogs(snapshot, newLogs);
        runtime.data.contacts[contactId] = sanitizeContactSnapshot(contactId, snapshot);
        writeStore();

        const activeContactId = getActiveContactId();
        if (String(activeContactId) === String(contactId)) {
            renderCurrentSnapshot();
        }

        dispatchStateChange({
            contactId,
            activeContactId,
            score: nextScore,
            prevScore,
            delta,
            state: nextState,
            prevState,
            snapshot: getSnapshot(contactId),
            hits: {
                positive: positiveHits,
                negative: negativeHits
            }
        });

        return getSnapshot(contactId);
    }

    function setActiveContact(contactId) {
        ensureStore();
        const nextContactId = contactId ? String(contactId) : resolveDefaultContactId();
        ensureContactData(nextContactId);
        runtime.data.activeContactId = nextContactId;
        writeStore();

        const snapshot = renderCurrentSnapshot();
        dispatchContactChange({
            contactId: nextContactId,
            activeContactId: nextContactId,
            snapshot
        });

        return snapshot;
    }

    function init() {
        ensureStore();
        ensureActiveContactId();
        ensurePickerShell();
        const snapshot = renderCurrentSnapshot();
        runtime.initialized = true;
        return snapshot;
    }

    window.FloraEngine = {
        init,
        analyzeChat,
        setActiveContact,
        getSnapshot
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
