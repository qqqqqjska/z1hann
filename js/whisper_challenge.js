(function () {
    const STORAGE_KEYS = {
        active: 'whisper_challenge_active',
        history: 'whisper_challenge_history',
        progress: 'whisper_challenge_progress',
        preference: 'whisper_challenge_preference'
    };

    const STATUS = {
        idle: 'idle',
        inProgress: 'in_progress',
        success: 'success',
        failedForbidden: 'failed_forbidden',
        failedTimeout: 'failed_timeout'
    };

    const LEVELS = [
        { id: 1, title: '试探边界', targetWord: '笨蛋', forbiddenWords: ['傻', '蠢'], durationSeconds: 600, difficulty: '新手', missionText: '在接下来的对话中，诱导 TA 主动说出 {targetWord}。' },
        { id: 2, title: '轻微吐槽', targetWord: '幼稚', forbiddenWords: ['小孩', '孩子气'], durationSeconds: 540, difficulty: '新手', missionText: '让 TA 自己评价出 {targetWord}，但你不能把判断直接喂给 TA。' },
        { id: 3, title: '情绪回弹', targetWord: '生气', forbiddenWords: ['怒', '气死'], durationSeconds: 540, difficulty: '进阶', missionText: '把话题引向情绪表达，让 TA 主动说出 {targetWord}。' },
        { id: 4, title: '自我否认', targetWord: '无聊', forbiddenWords: ['没意思', '无趣'], durationSeconds: 480, difficulty: '进阶', missionText: '让 TA 对某件事做出评价，并主动说出 {targetWord}。' },
        { id: 5, title: '关系试探', targetWord: '想你', forbiddenWords: ['思念', '惦记'], durationSeconds: 480, difficulty: '进阶', missionText: '在不直接表达思念的前提下，引导 TA 说出 {targetWord}。' },
        { id: 6, title: '偏爱验证', targetWord: '吃醋', forbiddenWords: ['嫉妒', '酸'], durationSeconds: 420, difficulty: '困难', missionText: '让 TA 因为你的描述而主动承认自己会 {targetWord}。' },
        { id: 7, title: '失控瞬间', targetWord: '紧张', forbiddenWords: ['慌', '不安'], durationSeconds: 420, difficulty: '困难', missionText: '通过制造一点悬念，诱导 TA 自己说出 {targetWord}。' },
        { id: 8, title: '边界感', targetWord: '暧昧', forbiddenWords: ['喜欢', '恋爱'], durationSeconds: 360, difficulty: '困难', missionText: '让 TA 描述你们之间的状态，并主动说出 {targetWord}。' },
        { id: 9, title: '误会制造', targetWord: '误会', forbiddenWords: ['搞错', '理解错'], durationSeconds: 360, difficulty: '专家', missionText: '把话题引到沟通偏差，让 TA 主动提到 {targetWord}。' },
        { id: 10, title: '占有欲', targetWord: '在乎', forbiddenWords: ['重要', '关心'], durationSeconds: 360, difficulty: '专家', missionText: '让 TA 对你的去向或互动做出反应，并说出 {targetWord}。' },
        { id: 11, title: '防线击破', targetWord: '委屈', forbiddenWords: ['难过', '伤心'], durationSeconds: 300, difficulty: '大师', missionText: '围绕误读与期待落差，诱导 TA 自己说出 {targetWord}。' },
        { id: 12, title: '最终回响', targetWord: '离不开', forbiddenWords: ['依赖', '需要你'], durationSeconds: 300, difficulty: '大师', missionText: '在不直给情绪结论的前提下，让 TA 主动说出 {targetWord}。' }
    ];

    const state = {
        initialized: false,
        status: STATUS.idle,
        currentLevelIndex: 0,
        activeChallenge: null,
        history: [],
        progress: { unlockedLevelCount: 1 },
        preference: { selectedContactId: null },
        returnTarget: 'home',
        timerId: null,
        dom: {}
    };

    function safeParse(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            console.warn('[WhisperChallenge] parse failed:', key, error);
            return fallback;
        }
    }

    function safeSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn('[WhisperChallenge] save failed:', key, error);
        }
    }

    function safeRemove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('[WhisperChallenge] remove failed:', key, error);
        }
    }

    function clone(value, fallback) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (error) {
            return fallback;
        }
    }

    function escapeHtml(text) {
        return String(text == null ? '' : text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeText(text) {
        return String(text == null ? '' : text).trim().toLowerCase();
    }

    function formatClock(ms) {
        const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function formatDateTime(timestamp) {
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return '--.--.-- --:--';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}.${month}.${day} ${hours}:${minutes}`;
    }

    function getContacts() {
        if (!window.iphoneSimState || !Array.isArray(window.iphoneSimState.contacts)) return [];
        return window.iphoneSimState.contacts
            .filter(contact => contact && contact.id)
            .map(contact => ({
                id: contact.id,
                name: contact.remark || contact.nickname || contact.name || `联系人 ${contact.id}`
            }));
    }

    function resolveContactName(contactId) {
        if (!contactId || !window.iphoneSimState || !Array.isArray(window.iphoneSimState.contacts)) return '';
        const contact = window.iphoneSimState.contacts.find(item => item.id === contactId);
        return contact ? (contact.remark || contact.nickname || contact.name || '') : '';
    }

    function getSelectedContactId() {
        return state.preference.selectedContactId || null;
    }

    function getSelectedContact() {
        const selectedId = getSelectedContactId();
        if (!selectedId) return null;
        return getContacts().find(contact => contact.id === selectedId) || null;
    }

    function getCurrentLevel() {
        return LEVELS[Math.max(0, Math.min(state.currentLevelIndex, LEVELS.length - 1))];
    }

    function getUnlockedLevelCount() {
        const count = Number(state.progress.unlockedLevelCount) || 1;
        return Math.max(1, Math.min(LEVELS.length, count));
    }

    function getRemainingMs() {
        if (state.status !== STATUS.inProgress || !state.activeChallenge) return 0;
        return Math.max(0, state.activeChallenge.deadlineAt - Date.now());
    }

    function persistProgress() {
        safeSet(STORAGE_KEYS.progress, state.progress);
    }

    function persistHistory() {
        safeSet(STORAGE_KEYS.history, state.history);
    }

    function persistPreference() {
        safeSet(STORAGE_KEYS.preference, state.preference);
    }

    function persistActiveChallenge() {
        if (state.activeChallenge && state.status === STATUS.inProgress) {
            safeSet(STORAGE_KEYS.active, state.activeChallenge);
        } else {
            safeRemove(STORAGE_KEYS.active);
        }
    }

    function ensureSelectedContact() {
        const contacts = getContacts();
        if (contacts.length === 0) {
            state.preference.selectedContactId = null;
            persistPreference();
            return null;
        }

        const current = getSelectedContactId();
        if (current && contacts.some(contact => contact.id === current)) {
            return current;
        }

        const fallbackId = (window.iphoneSimState && window.iphoneSimState.currentChatContactId) || contacts[0].id;
        state.preference.selectedContactId = fallbackId;
        persistPreference();
        return fallbackId;
    }

    function setSelectedContact(contactId) {
        const contacts = getContacts();
        if (!contacts.some(contact => contact.id === contactId)) return;
        state.preference.selectedContactId = contactId;
        persistPreference();
        render();
    }

    function cacheDom() {
        state.dom.root = document.getElementById('whisper-challenge-app');
        state.dom.backBtn = document.getElementById('whisper-challenge-back');
        state.dom.restartBtn = document.getElementById('whisper-challenge-restart');
        state.dom.missionCode = document.getElementById('whisper-challenge-mission-code');
        state.dom.statusPill = document.getElementById('whisper-challenge-status-pill');
        state.dom.missionTitle = document.getElementById('whisper-challenge-mission-title');
        state.dom.missionText = document.getElementById('whisper-challenge-mission-text');
        state.dom.targetWord = document.getElementById('whisper-challenge-target-word');
        state.dom.difficulty = document.getElementById('whisper-challenge-difficulty');
        state.dom.level = document.getElementById('whisper-challenge-level');
        state.dom.contactName = document.getElementById('whisper-challenge-contact-name');
        state.dom.contactSelect = document.getElementById('whisper-challenge-contact-select');
        state.dom.contactHelp = document.getElementById('whisper-challenge-contact-help');
        state.dom.forbiddenList = document.getElementById('whisper-challenge-forbidden-list');
        state.dom.statusText = document.getElementById('whisper-challenge-status-text');
        state.dom.countdownText = document.getElementById('whisper-challenge-countdown-text');
        state.dom.progressBar = document.getElementById('whisper-challenge-progress-bar');
        state.dom.startBtn = document.getElementById('whisper-challenge-start-btn');
        state.dom.goBtn = document.getElementById('whisper-challenge-go-btn');
        state.dom.historyList = document.getElementById('whisper-challenge-history-list');
        state.dom.historyEmpty = document.getElementById('whisper-challenge-history-empty');
    }

    function normalizeReturnTarget(target) {
        if (target === 'garden-activities' || target === 'garden-home') {
            return target;
        }
        return 'home';
    }

    function syncBackButtonContext() {
        if (!state.dom.backBtn) return;
        const label = state.returnTarget === 'garden-activities'
            ? '返回活动列表'
            : (state.returnTarget === 'garden-home' ? '返回家园' : '返回主屏幕');
        state.dom.backBtn.setAttribute('aria-label', label);
        state.dom.backBtn.setAttribute('title', label);
    }

    function handleBackNavigation() {
        const returnTarget = normalizeReturnTarget(state.returnTarget);
        closeApp();

        if (returnTarget === 'garden-activities' && window.GardenApp && typeof window.GardenApp.openActivitiesView === 'function') {
            window.GardenApp.openActivitiesView();
            return;
        }

        if (returnTarget === 'garden-home' && window.GardenApp && typeof window.GardenApp.openApp === 'function') {
            window.GardenApp.openApp();
        }
    }

    function bindEvents() {
        if (state.dom.backBtn) state.dom.backBtn.addEventListener('click', handleBackNavigation);

        if (state.dom.restartBtn) {
            state.dom.restartBtn.addEventListener('click', function () {
                const shouldRestart = state.status !== STATUS.inProgress || window.confirm('确定要重新开始当前挑战吗？');
                if (shouldRestart) startChallenge(state.currentLevelIndex);
            });
        }

        if (state.dom.startBtn) {
            state.dom.startBtn.addEventListener('click', function () {
                startChallenge(state.currentLevelIndex);
            });
        }

        if (state.dom.goBtn) state.dom.goBtn.addEventListener('click', goToWechat);

        if (state.dom.contactSelect) {
            state.dom.contactSelect.addEventListener('change', function () {
                if (state.status === STATUS.inProgress) return;
                setSelectedContact(this.value || null);
            });
        }
    }

    function syncStateFromStorage() {
        state.progress = safeParse(STORAGE_KEYS.progress, { unlockedLevelCount: 1 }) || { unlockedLevelCount: 1 };
        state.history = safeParse(STORAGE_KEYS.history, []) || [];
        state.preference = safeParse(STORAGE_KEYS.preference, { selectedContactId: null }) || { selectedContactId: null };
        state.currentLevelIndex = Math.max(0, Math.min(getUnlockedLevelCount() - 1, LEVELS.length - 1));
        state.status = STATUS.idle;
        state.activeChallenge = null;

        const active = safeParse(STORAGE_KEYS.active, null);
        if (active && Number.isFinite(active.levelIndex) && active.status === STATUS.inProgress) {
            state.currentLevelIndex = Math.max(0, Math.min(active.levelIndex, LEVELS.length - 1));
            state.activeChallenge = {
                status: STATUS.inProgress,
                levelIndex: state.currentLevelIndex,
                levelId: active.levelId || LEVELS[state.currentLevelIndex].id,
                startedAt: Number(active.startedAt) || Date.now(),
                deadlineAt: Number(active.deadlineAt) || Date.now(),
                contactId: active.contactId || null,
                contactName: active.contactName || ''
            };
            state.status = STATUS.inProgress;
            if (state.activeChallenge.contactId) {
                state.preference.selectedContactId = state.activeChallenge.contactId;
            }
        }

        ensureSelectedContact();
    }

    function clearTimer() {
        if (state.timerId) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
    }

    function updateTimerUI(remainingMs) {
        const totalMs = Math.max(1000, Number(getCurrentLevel().durationSeconds) * 1000);
        const progress = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
        if (state.dom.countdownText) state.dom.countdownText.textContent = formatClock(remainingMs);
        if (state.dom.progressBar) state.dom.progressBar.style.width = `${progress}%`;
    }

    function tick() {
        if (state.status !== STATUS.inProgress || !state.activeChallenge) return;
        const remainingMs = getRemainingMs();
        if (remainingMs <= 0) {
            finishChallenge(STATUS.failedTimeout, { reason: '超时未完成，任务自动失效。' });
            return;
        }
        updateTimerUI(remainingMs);
    }

    function startTimer() {
        clearTimer();
        state.timerId = setInterval(tick, 1000);
    }

    function buildMissionHtml(level) {
        const highlighted = `<span class="whisper-ui-highlight">“${escapeHtml(level.targetWord)}”</span>`;
        return escapeHtml(level.missionText).replace(/\{targetWord\}/g, highlighted);
    }

    function renderContactSelector() {
        if (!state.dom.contactSelect) return;
        const contacts = getContacts();
        const selectedId = ensureSelectedContact();
        const lockedId = state.status === STATUS.inProgress && state.activeChallenge ? state.activeChallenge.contactId : null;
        const effectiveId = lockedId || selectedId;
        const selectedContact = contacts.find(contact => contact.id === effectiveId) || null;

        state.dom.contactSelect.innerHTML = contacts.length > 0
            ? contacts.map(contact => `<option value="${escapeHtml(contact.id)}" ${contact.id === effectiveId ? 'selected' : ''}>${escapeHtml(contact.name)}</option>`).join('')
            : '<option value="">暂无联系人</option>';

        state.dom.contactSelect.disabled = contacts.length === 0 || !!lockedId;

        if (state.dom.contactName) {
            state.dom.contactName.textContent = selectedContact ? selectedContact.name : '未指定';
        }

        if (state.dom.contactHelp) {
            if (contacts.length === 0) {
                state.dom.contactHelp.textContent = '当前没有可用联系人，无法开始挑战。';
            } else if (lockedId) {
                state.dom.contactHelp.textContent = '挑战进行中，执行对象已锁定。结束后才可切换联系人。';
            } else {
                state.dom.contactHelp.textContent = '请选择你要去诱导的联系人，任务判定只会监听这个对象。';
            }
        }
    }

    function getStatusPresentation() {
        const unlocked = getUnlockedLevelCount();
        const level = getCurrentLevel();
        const selectedContact = getSelectedContact();
        const hasSelectedContact = !!selectedContact;

        if (state.status === STATUS.inProgress) {
            return {
                pillText: '进行中',
                pillClass: 'is-active',
                note: hasSelectedContact
                    ? `当前只监听 ${selectedContact.name} 的聊天。诱导 TA 主动说出目标词，但你的发言绝不能带上禁忌词。`
                    : '请先指定联系人，再开始挑战。',
                startLabel: '重新开始本关',
                goDisabled: !hasSelectedContact
            };
        }

        if (state.status === STATUS.success) {
            const hasMore = state.currentLevelIndex < LEVELS.length - 1;
            return {
                pillText: '挑战成功',
                pillClass: 'is-success',
                note: hasMore ? '任务完成，下一关已经解锁。' : '任务完成，已经到达当前题库末尾。',
                startLabel: hasMore ? '开始下一关' : '再次挑战',
                goDisabled: !hasSelectedContact
            };
        }

        if (state.status === STATUS.failedForbidden) {
            return {
                pillText: '禁忌触发',
                pillClass: 'is-fail',
                note: '你亲口说出了禁忌词，本轮作废。调整措辞后再试一次。',
                startLabel: '重试本关',
                goDisabled: !hasSelectedContact
            };
        }

        if (state.status === STATUS.failedTimeout) {
            return {
                pillText: '超时失败',
                pillClass: 'is-fail',
                note: '倒计时已经结束，任务自动判定失败。',
                startLabel: '重试本关',
                goDisabled: !hasSelectedContact
            };
        }

        return {
            pillText: '未开始',
            pillClass: 'is-idle',
            note: hasSelectedContact
                ? `已解锁 ${unlocked} / ${LEVELS.length} 关。当前执行对象：${selectedContact.name}。`
                : `已解锁 ${unlocked} / ${LEVELS.length} 关。请先指定联系人，再点击开始挑战。`,
            startLabel: `开始第 ${level.id} 关`,
            goDisabled: !hasSelectedContact
        };
    }

    function renderHistory() {
        if (!state.dom.historyList || !state.dom.historyEmpty) return;

        if (!Array.isArray(state.history) || state.history.length === 0) {
            state.dom.historyList.innerHTML = '';
            state.dom.historyEmpty.classList.remove('hidden');
            return;
        }

        state.dom.historyEmpty.classList.add('hidden');
        state.dom.historyList.innerHTML = state.history
            .slice()
            .sort((left, right) => (right.endedAt || 0) - (left.endedAt || 0))
            .map(item => {
                const isSuccess = item.status === STATUS.success || item.result === 'success';
                const iconClass = isSuccess ? 'is-success' : 'is-fail';
                const icon = isSuccess ? 'ph-fill ph-check-circle' : 'ph-fill ph-prohibit';
                const elapsed = Number.isFinite(item.elapsedSeconds) ? `${item.elapsedSeconds}s` : '--';
                return `
                    <div class="whisper-ui-history-card">
                        <div class="whisper-ui-history-icon ${iconClass}"><i class="${icon}"></i></div>
                        <div class="whisper-ui-history-info">
                            <div class="whisper-ui-history-target">目标词：${escapeHtml(item.targetWord || '-')}</div>
                            <div class="whisper-ui-history-reason">${escapeHtml(item.reason || '未记录原因')}${item.contactName ? ` · ${escapeHtml(item.contactName)}` : ''}</div>
                            <div class="whisper-ui-history-time">${escapeHtml(formatDateTime(item.endedAt))} · 用时 ${escapeHtml(elapsed)}</div>
                        </div>
                    </div>
                `;
            })
            .join('');
    }

    function render() {
        const level = getCurrentLevel();
        const presentation = getStatusPresentation();
        const hasContacts = getContacts().length > 0;

        syncBackButtonContext();

        if (state.dom.missionCode) state.dom.missionCode.textContent = `MISSION ${String(level.id).padStart(3, '0')}`;
        if (state.dom.statusPill) {
            state.dom.statusPill.className = `whisper-ui-status-pill ${presentation.pillClass}`;
            state.dom.statusPill.textContent = presentation.pillText;
        }
        if (state.dom.missionTitle) state.dom.missionTitle.textContent = `关卡 ${level.id} · ${level.title}`;
        if (state.dom.missionText) state.dom.missionText.innerHTML = buildMissionHtml(level);
        if (state.dom.targetWord) state.dom.targetWord.textContent = `“${level.targetWord}”`;
        if (state.dom.difficulty) state.dom.difficulty.textContent = level.difficulty;
        if (state.dom.level) state.dom.level.textContent = `${level.id} / ${LEVELS.length}`;
        if (state.dom.forbiddenList) {
            state.dom.forbiddenList.innerHTML = level.forbiddenWords.map(word => `<span class="whisper-ui-chip">${escapeHtml(word)}</span>`).join('');
        }
        if (state.dom.statusText) state.dom.statusText.textContent = presentation.note;

        renderContactSelector();

        if (state.dom.startBtn) {
            state.dom.startBtn.innerHTML = `<i class="${state.status === STATUS.success ? 'ph-fill ph-arrow-right' : 'ph-fill ph-target'}"></i><span>${escapeHtml(presentation.startLabel)}</span>`;
            state.dom.startBtn.disabled = !hasContacts || !ensureSelectedContact();
        }

        if (state.dom.goBtn) state.dom.goBtn.disabled = presentation.goDisabled;

        if (state.status === STATUS.inProgress && state.activeChallenge) {
            updateTimerUI(getRemainingMs());
        } else {
            if (state.dom.countdownText) state.dom.countdownText.textContent = formatClock(level.durationSeconds * 1000);
            if (state.dom.progressBar) state.dom.progressBar.style.width = '100%';
        }

        renderHistory();
    }

    function showFeedback(message, type) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, 2400, type || 'info');
            return;
        }
        if (typeof window.showChatToast === 'function') {
            window.showChatToast(message, 2400);
            return;
        }
        alert(message);
    }

    function launchConfetti() {
        const host = document.getElementById('screen-container') || document.body;
        const overlay = document.createElement('div');
        overlay.className = 'whisper-ui-confetti-overlay';
        const colors = ['#D5EAE3', '#F8F4E9', '#FDD3D5', '#775C55'];

        for (let index = 0; index < 28; index += 1) {
            const piece = document.createElement('div');
            piece.className = 'ms-confetti';
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.top = `${-20 - Math.random() * 60}px`;
            piece.style.width = `${6 + Math.random() * 6}px`;
            piece.style.height = `${6 + Math.random() * 10}px`;
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDuration = `${1.2 + Math.random() * 1.8}s`;
            piece.style.animationDelay = `${Math.random() * 0.4}s`;
            overlay.appendChild(piece);
        }

        host.appendChild(overlay);
        setTimeout(function () {
            overlay.remove();
        }, 2600);
    }

    function pushHistory(entry) {
        state.history.unshift(entry);
        if (state.history.length > 50) state.history = state.history.slice(0, 50);
        persistHistory();
    }

    function finishChallenge(resultStatus, options) {
        const config = options || {};
        const active = state.activeChallenge || { levelIndex: state.currentLevelIndex, startedAt: Date.now(), contactId: getSelectedContactId() };
        const levelIndex = Math.max(0, Math.min(active.levelIndex, LEVELS.length - 1));
        const level = LEVELS[levelIndex];
        const endedAt = Date.now();
        const startedAt = Number(active.startedAt) || endedAt;
        const elapsedSeconds = Math.max(0, Math.round((endedAt - startedAt) / 1000));
        const contactId = config.contactId || active.contactId || getSelectedContactId() || null;
        const contactName = resolveContactName(contactId) || active.contactName || '';

        clearTimer();
        state.activeChallenge = null;
        state.status = resultStatus;

        if (resultStatus === STATUS.success) {
            state.progress.unlockedLevelCount = Math.max(getUnlockedLevelCount(), Math.min(LEVELS.length, levelIndex + 2));
            state.currentLevelIndex = Math.min(levelIndex + 1, LEVELS.length - 1);
        } else {
            state.currentLevelIndex = levelIndex;
        }

        persistProgress();
        persistActiveChallenge();

        const reasonText = config.reason || (resultStatus === STATUS.success ? `挑战成功：TA 说出了「${level.targetWord}」` : '挑战失败');
        pushHistory({
            id: `${endedAt}-${Math.random().toString(36).slice(2, 8)}`,
            levelId: level.id,
            targetWord: level.targetWord,
            forbiddenWords: clone(level.forbiddenWords, []),
            startedAt,
            endedAt,
            result: resultStatus === STATUS.success ? 'success' : 'failure',
            status: resultStatus,
            reason: reasonText,
            contactId,
            contactName,
            elapsedSeconds
        });

        render();

        if (config.notify !== false) {
            showFeedback(reasonText, resultStatus === STATUS.success ? 'success' : 'error');
        }
        if (resultStatus === STATUS.success && config.confetti !== false) {
            launchConfetti();
        }
    }

    function startChallenge(levelIndex) {
        init();
        const selectedContactId = ensureSelectedContact();
        if (!selectedContactId) {
            showFeedback('请先指定一个联系人', 'error');
            return getState();
        }

        const unlockedMaxIndex = getUnlockedLevelCount() - 1;
        const nextIndex = Number.isFinite(levelIndex) ? levelIndex : state.currentLevelIndex;
        const safeIndex = Math.max(0, Math.min(nextIndex, unlockedMaxIndex, LEVELS.length - 1));
        const level = LEVELS[safeIndex];
        const now = Date.now();

        clearTimer();
        state.currentLevelIndex = safeIndex;
        state.status = STATUS.inProgress;
        state.activeChallenge = {
            status: STATUS.inProgress,
            levelIndex: safeIndex,
            levelId: level.id,
            startedAt: now,
            deadlineAt: now + level.durationSeconds * 1000,
            contactId: selectedContactId,
            contactName: resolveContactName(selectedContactId) || ''
        };

        persistActiveChallenge();
        render();
        updateTimerUI(getRemainingMs());
        startTimer();
        showFeedback(`挑战开始：对 ${state.activeChallenge.contactName || '该联系人'} 诱导说出「${level.targetWord}」`, 'info');
        return getState();
    }

    function openApp(options = {}) {
        init();
        state.returnTarget = normalizeReturnTarget(options && options.returnTarget);
        syncBackButtonContext();
        if (state.dom.root) state.dom.root.classList.remove('hidden');
        render();
    }

    function closeApp() {
        if (state.dom.root) state.dom.root.classList.add('hidden');
        state.returnTarget = 'home';
        syncBackButtonContext();
    }

    function goToWechat() {
        const targetContactId = (state.status === STATUS.inProgress && state.activeChallenge && state.activeChallenge.contactId)
            || ensureSelectedContact();

        closeApp();

        if (typeof window.handleAppClick === 'function') {
            window.handleAppClick('wechat-app', '微信');
        } else {
            const wechat = document.getElementById('wechat-app');
            if (wechat) wechat.classList.remove('hidden');
        }

        if (targetContactId && typeof window.openChat === 'function') {
            requestAnimationFrame(function () {
                window.openChat(targetContactId);
            });
        }
    }

    function checkTimeoutBeforeEvaluation() {
        if (state.status === STATUS.inProgress && getRemainingMs() <= 0) {
            finishChallenge(STATUS.failedTimeout, { reason: '超时未完成，任务自动失效。' });
            return true;
        }
        return false;
    }

    function shouldIgnoreByContact(meta) {
        if (!state.activeChallenge || !state.activeChallenge.contactId) return false;
        return !!(meta && meta.contactId && meta.contactId !== state.activeChallenge.contactId);
    }

    function checkUserMessage(text, meta) {
        init();

        if (state.status !== STATUS.inProgress || !state.activeChallenge) {
            return { allowed: true, status: state.status };
        }

        if (shouldIgnoreByContact(meta)) {
            return { allowed: true, status: state.status, ignored: true };
        }

        if (checkTimeoutBeforeEvaluation()) {
            return { allowed: false, status: STATUS.failedTimeout, reason: '超时未完成，任务自动失效。' };
        }

        const level = LEVELS[state.activeChallenge.levelIndex];
        const normalized = normalizeText(text);
        const hitWord = level.forbiddenWords.find(word => normalized.includes(normalizeText(word)));
        if (!hitWord) {
            return { allowed: true, status: state.status };
        }

        finishChallenge(STATUS.failedForbidden, {
            contactId: (meta && meta.contactId) || state.activeChallenge.contactId,
            reason: `挑战失败：你触发了禁忌词「${hitWord}」`,
            confetti: false
        });

        return { allowed: false, status: STATUS.failedForbidden, hitWord, reason: `挑战失败：你触发了禁忌词「${hitWord}」` };
    }

    function isTextLikeJson(text) {
        const raw = String(text || '').trim();
        if (!raw) return false;
        if (!((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']')))) return false;
        try {
            JSON.parse(raw);
            return true;
        } catch (error) {
            return false;
        }
    }

    function isEligibleAiText(text, meta) {
        const raw = String(text == null ? '' : text).trim();
        if (!raw) return false;
        if (meta && meta.type && meta.type !== 'text') return false;
        if (isTextLikeJson(raw)) return false;
        if (/^https?:\/\//i.test(raw)) return false;
        if (/^\[\s*系统/.test(raw) || /^\[\s*system/i.test(raw)) return false;
        if (/^ACTION:/i.test(raw)) return false;
        return true;
    }

    function checkAiMessage(text, meta) {
        init();

        if (state.status !== STATUS.inProgress || !state.activeChallenge) {
            return { matched: false, status: state.status };
        }

        if (shouldIgnoreByContact(meta)) {
            return { matched: false, status: state.status, ignored: true };
        }

        if (checkTimeoutBeforeEvaluation()) {
            return { matched: false, status: STATUS.failedTimeout, reason: '超时未完成，任务自动失效。' };
        }

        if (!isEligibleAiText(text, meta)) {
            return { matched: false, status: state.status };
        }

        const level = LEVELS[state.activeChallenge.levelIndex];
        const normalized = normalizeText(text);
        if (!normalizeText(level.targetWord) || !normalized.includes(normalizeText(level.targetWord))) {
            return { matched: false, status: state.status };
        }

        finishChallenge(STATUS.success, {
            contactId: (meta && meta.contactId) || state.activeChallenge.contactId,
            reason: `挑战成功：TA 说出了「${level.targetWord}」`,
            confetti: true
        });

        return { matched: true, status: STATUS.success, hitWord: level.targetWord, reason: `挑战成功：TA 说出了「${level.targetWord}」` };
    }

    function getState() {
        return {
            status: state.status,
            currentLevelIndex: state.currentLevelIndex,
            currentLevel: clone(getCurrentLevel(), null),
            deadlineAt: state.activeChallenge ? state.activeChallenge.deadlineAt : null,
            remainingMs: getRemainingMs(),
            history: clone(state.history, []),
            unlockedLevelCount: getUnlockedLevelCount(),
            selectedContactId: getSelectedContactId(),
            selectedContact: clone(getSelectedContact(), null)
        };
    }

    function init() {
        if (state.initialized) return window.WhisperChallenge;

        cacheDom();
        bindEvents();
        syncStateFromStorage();
        state.initialized = true;

        if (state.status === STATUS.inProgress && state.activeChallenge) {
            if (getRemainingMs() <= 0) {
                finishChallenge(STATUS.failedTimeout, {
                    reason: '超时未完成，任务自动失效。',
                    notify: false,
                    confetti: false,
                    contactId: state.activeChallenge.contactId
                });
            } else {
                startTimer();
            }
        }

        render();
        return window.WhisperChallenge;
    }

    window.WhisperChallenge = {
        init,
        openApp,
        closeApp,
        startChallenge,
        goToWechat,
        checkUserMessage,
        checkAiMessage,
        getState,
        render
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();

