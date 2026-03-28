(function () {
    const ORACLE_CARDS = [
        { name: '月井', icon: '☾', code: 'I', keywords: '沉静 · 倾听 · 潜流', text: '当你愿意慢下来，答案会像井中的月光一样自己浮现。' },
        { name: '星盐', icon: '✦', code: 'II', keywords: '净化 · 轻盈 · 边界', text: '卸下不属于你的重量，留下真正能照亮你的微光。' },
        { name: '夜航', icon: '⟡', code: 'III', keywords: '方向 · 胆识 · 远行', text: '不必看清整片海，只要先认出下一颗属于你的导航星。' },
        { name: '霜火', icon: '✶', code: 'IV', keywords: '克制 · 热望 · 平衡', text: '真正持久的热情，并不是燃尽，而是在冷夜里仍能发光。' },
        { name: '隐庭', icon: '☽', code: 'V', keywords: '保护 · 内在 · 修复', text: '把注意力收回自己身上，安静会成为最柔软的屏障。' },
        { name: '晨砂', icon: '✷', code: 'VI', keywords: '苏醒 · 新页 · 轻启', text: '新的机会不总是轰然抵达，它常常只是轻轻落在掌心。' },
        { name: '雾潮', icon: '❋', code: 'VII', keywords: '直觉 · 迷雾 · 试探', text: '如果现实还没有轮廓，就先相信你内心最先亮起的那部分。' },
        { name: '金羽', icon: '✧', code: 'VIII', keywords: '消息 · 流动 · 回应', text: '你正在等待的回应已经在路上，只是它会换一种姿态靠近。' },
        { name: '天穹', icon: '✹', code: 'IX', keywords: '扩张 · 远景 · 允诺', text: '把目光抬高一点，真正适合你的舞台从来不止眼前这一格。' },
        { name: '镜海', icon: '✺', code: 'X', keywords: '映照 · 诚实 · 自省', text: '你需要的不是更多答案，而是看见自己没有回避的那道光。' },
        { name: '黯冠', icon: '✢', code: 'XI', keywords: '权衡 · 责任 · 节制', text: '真正的掌控感来自内里的稳定，而不是外界的一时顺从。' },
        { name: '银梯', icon: '⟢', code: 'XII', keywords: '跃迁 · 信念 · 过渡', text: '你正走在看不见终点的阶梯上，但每一步都在抬高你的视野。' },
        { name: '祷风', icon: '✵', code: 'XIII', keywords: '传递 · 愿望 · 感应', text: '有些愿望已经被世界听见，只是它需要更合适的时间回声。' },
        { name: '曜砂', icon: '✴', code: 'XIV', keywords: '聚焦 · 锻造 · 决心', text: '把分散的心意重新收拢，真正重要的事会显出它该有的轮廓。' },
        { name: '夜铃', icon: '❂', code: 'XV', keywords: '提醒 · 契机 · 觉察', text: '某个看似微小的信号正在敲响，它在提示你不要错过当下。' },
        { name: '星渠', icon: '✼', code: 'XVI', keywords: '连接 · 汇聚 · 通达', text: '你与答案之间并不遥远，只差一次愿意伸手的主动靠近。' },
        { name: '黎辉', icon: '✷', code: 'XVII', keywords: '希望 · 回暖 · 延展', text: '那些曾经迟迟不动的事情，正在迎来缓慢但确定的松动。' },
        { name: '终月', icon: '☼', code: 'XVIII', keywords: '轮回 · 完结 · 新生', text: '当一个阶段真正收束，新的一轮光也会在你看不见的地方升起。' }
    ];

    let selectedDeckId = null;
    let editingReplyState = null;
    let addingReplyState = null;
    const drawSession = {
        mode: 'choose',
        selectedPresetId: '',
        cards: [],
        cardsSignature: '',
        selectedIndex: null,
        selectedCardName: '',
        locked: false,
        rotationOffset: 0,
        pointerId: null,
        startX: 0,
        startOffset: 0,
        dragging: false,
        moved: false,
        pressedCardIndex: null,
        captureActive: false,
        suppressClickUntil: 0,
        snapTimer: null,
        resultReady: false,
        detailOpen: false,
        dealTimer: null,
        collectTimer: null
    };

    const cardLookup = new Map();
    ORACLE_CARDS.forEach((card, index) => {
        [card.name, card.code, String(index + 1)].forEach((key) => {
            cardLookup.set(normalizeCardKey(key), card);
        });
    });

    function normalizeCardKey(value) {
        return String(value || '').trim().toLowerCase();
    }

    function findCard(value) {
        return cardLookup.get(normalizeCardKey(value)) || null;
    }

    function cloneData(value) {
        return JSON.parse(JSON.stringify(value || {}));
    }

    function shortenText(text, maxLength) {
        const value = String(text || '').trim();
        if (value.length <= maxLength) return value;
        return value.slice(0, Math.max(1, maxLength - 1)) + '…';
    }

    function normalizeReplyItem(item) {
        if (typeof item === 'string') {
            const content = item.trim();
            if (!content) return null;
            return {
                label: shortenText(content, 14),
                content
            };
        }

        if (item && typeof item === 'object') {
            const content = String(item.content || item.text || item.message || item.reply || '').trim();
            if (!content) return null;
            const label = String(item.label || item.title || '').trim() || shortenText(content, 14);
            return { label, content };
        }

        return null;
    }

    function normalizeSingleReplyValue(value) {
        if (Array.isArray(value)) {
            for (const item of value) {
                const reply = normalizeReplyItem(item);
                if (reply) return reply;
            }
            return null;
        }

        if (value && typeof value === 'object') {
            if (Array.isArray(value.replies)) return normalizeSingleReplyValue(value.replies);
            if (Array.isArray(value.quickReplies)) return normalizeSingleReplyValue(value.quickReplies);
        }

        return normalizeReplyItem(value);
    }

    function normalizeMappings(rawData) {
        const mappings = {};

        if (Array.isArray(rawData)) {
            rawData.forEach((entry, index) => {
                if (!entry || typeof entry !== 'object') return;
                const card = findCard(entry.card || entry.name || entry.code || entry.id || String(index + 1));
                if (!card) return;

                const sourceValue = Array.isArray(entry.replies)
                    ? entry.replies
                    : Array.isArray(entry.quickReplies)
                        ? entry.quickReplies
                        : (entry.content || entry.reply || entry.text || null);

                const reply = normalizeSingleReplyValue(sourceValue);
                if (reply) mappings[card.name] = reply;
            });
            return mappings;
        }

        if (!rawData || typeof rawData !== 'object') {
            throw new Error('导入内容必须是 JSON 对象或数组');
        }

        const source = rawData.cards && typeof rawData.cards === 'object' && !Array.isArray(rawData.cards)
            ? rawData.cards
            : rawData;

        Object.entries(source).forEach(([key, value]) => {
            const card = findCard(key);
            if (!card) return;
            const reply = normalizeSingleReplyValue(value);
            if (reply) mappings[card.name] = reply;
        });

        return mappings;
    }

    function safeNormalizeMappings(rawData) {
        try {
            return normalizeMappings(rawData || {});
        } catch (error) {
            return {};
        }
    }

    function normalizePresetItem(item, index) {
        if (!item || typeof item !== 'object') return null;
        const mappings = safeNormalizeMappings(item.mappings || item.cards || item.data || {});
        return {
            id: String(item.id || `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`),
            name: String(item.name || item.title || `牌组 ${index + 1}`).trim() || `牌组 ${index + 1}`,
            mappings,
            createdAt: Number(item.createdAt) || Date.now()
        };
    }

    function ensureOracleConfig() {
        if (!window.iphoneSimState || typeof window.iphoneSimState !== 'object') {
            return { mappings: {}, lastDrawCard: '', presets: [], activeDeckId: '' };
        }

        if (!window.iphoneSimState.oracleQuickReplyConfig || typeof window.iphoneSimState.oracleQuickReplyConfig !== 'object') {
            window.iphoneSimState.oracleQuickReplyConfig = {
                mappings: {},
                lastDrawCard: '',
                presets: [],
                activeDeckId: ''
            };
        }

        const config = window.iphoneSimState.oracleQuickReplyConfig;
        config.mappings = safeNormalizeMappings(config.mappings);
        config.lastDrawCard = typeof config.lastDrawCard === 'string' ? config.lastDrawCard : '';
        config.presets = Array.isArray(config.presets)
            ? config.presets.map(normalizePresetItem).filter(Boolean)
            : [];
        config.activeDeckId = typeof config.activeDeckId === 'string' ? config.activeDeckId : '';
        if (config.activeDeckId && !config.presets.some((preset) => preset.id === config.activeDeckId)) {
            config.activeDeckId = '';
        }
        return config;
    }

    function persistOracleConfig() {
        if (typeof window.saveConfig === 'function') {
            window.saveConfig();
        }
    }

    function toast(message, duration) {
        if (typeof window.showChatToast === 'function') {
            window.showChatToast(message, duration || 2200);
        }
    }

    function getPresetById(presetId, config) {
        const source = config || ensureOracleConfig();
        return (source.presets || []).find((preset) => preset.id === presetId) || null;
    }

    function getReplyForCard(mappings, cardName) {
        const source = mappings || ensureOracleConfig().mappings;
        const reply = source && source[cardName];
        if (!reply || typeof reply !== 'object') return null;
        if (typeof reply.content !== 'string' || !reply.content.trim()) return null;
        return reply;
    }

    function countConfiguredCards(mappings) {
        const source = mappings || ensureOracleConfig().mappings;
        return ORACLE_CARDS.filter((card) => !!getReplyForCard(source, card.name)).length;
    }

    function getConfiguredCards(mappings) {
        const source = mappings || ensureOracleConfig().mappings;
        return ORACLE_CARDS.filter((card) => !!getReplyForCard(source, card.name));
    }

    function getUnconfiguredCards(mappings) {
        const source = mappings || ensureOracleConfig().mappings;
        return ORACLE_CARDS.filter((card) => !getReplyForCard(source, card.name));
    }

    function getSelectedDeckContext() {
        const config = ensureOracleConfig();

        if (selectedDeckId && selectedDeckId !== '__current__') {
            const selectedPreset = getPresetById(selectedDeckId, config);
            if (selectedPreset) {
                return {
                    id: selectedPreset.id,
                    name: selectedPreset.name,
                    mappings: selectedPreset.mappings,
                    isPreset: true,
                    preset: selectedPreset
                };
            }
        }

        if (config.activeDeckId) {
            const activePreset = getPresetById(config.activeDeckId, config);
            if (activePreset) {
                selectedDeckId = activePreset.id;
                return {
                    id: activePreset.id,
                    name: activePreset.name,
                    mappings: activePreset.mappings,
                    isPreset: true,
                    preset: activePreset
                };
            }
        }

        if (config.presets.length) {
            selectedDeckId = config.presets[0].id;
            return {
                id: config.presets[0].id,
                name: config.presets[0].name,
                mappings: config.presets[0].mappings,
                isPreset: true,
                preset: config.presets[0]
            };
        }

        selectedDeckId = '__current__';
        return {
            id: '__current__',
            name: '当前配置',
            mappings: config.mappings,
            isPreset: false,
            preset: null
        };
    }

    function setSelectedDeck(presetId) {
        selectedDeckId = presetId || null;
        renderManagePage();
    }

    function setView(view) {
        document.querySelectorAll('[data-oracle-view]').forEach((node) => {
            node.classList.toggle('hidden', node.getAttribute('data-oracle-view') !== view);
        });

        if (view === 'home') renderHomeSummary();
        if (view === 'manage') renderManagePage();
        if (view === 'draw') renderDrawPage();
    }

    function renderHomeSummary() {
        const summary = document.getElementById('chat-oracle-home-summary');
        if (!summary) return;

        const config = ensureOracleConfig();
        const cardCount = countConfiguredCards(config.mappings);
        const deckCount = config.presets.length;

        if (!cardCount) {
            summary.textContent = deckCount
                ? `当前还没有应用牌组，已保存 ${deckCount} 个牌组。`
                : '当前还没有导入快捷回复，请先进入管理页导入牌组。';
            return;
        }

        summary.textContent = `当前已配置 ${cardCount} 张牌，每张牌 1 条快捷回复，另有 ${deckCount} 个牌组可用。`;
    }

    function updatePresetStatus(message) {
        const status = document.getElementById('chat-oracle-preset-status');
        if (!status) return;
        status.textContent = message || '点击牌组可切换下方显示内容，应用后才会切换当前生效牌组';
    }

    function updateImportStatus(message) {
        const status = document.getElementById('chat-oracle-import-status');
        if (!status) return;
        status.textContent = message || '每张牌只保留 1 条回复；如果牌组名称重复，会覆盖同名牌组。';
    }

    function sendQuickReply(content, cardName) {
        if (!window.iphoneSimState || !window.iphoneSimState.currentChatContactId) {
            toast('请先进入一个聊天窗口');
            return;
        }

        if (typeof window.sendMessage !== 'function') {
            toast('发送能力未就绪，请刷新页面后再试', 2400);
            return;
        }

        const result = window.sendMessage(content, true, 'text');
        if (!result) {
            toast('这条快捷回复未能发送');
            return;
        }

        closeInlineDraw();
        closeOracleModal();
        toast(`已发送「${cardName}」快捷回复`, 1800);
    }

    function shuffleList(items) {
        const copy = [...(items || [])];
        for (let index = copy.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
        }
        return copy;
    }

    function getDrawAvailablePresets(config) {
        const source = config || ensureOracleConfig();
        return (source.presets || []).filter((preset) => countConfiguredCards(preset.mappings) > 0);
    }

    function getDrawSelectedPreset(config) {
        const source = config || ensureOracleConfig();
        if (!drawSession.selectedPresetId) return null;
        return getPresetById(drawSession.selectedPresetId, source);
    }

    function getDrawDeckSignature(cards) {
        return (cards || []).map((card) => card.name).join('|');
    }

    function drawStepPixels() {
        const zone = document.getElementById('chat-oracle-fan-zone');
        const width = zone ? zone.clientWidth : window.innerWidth;
        return width <= 400 ? 52 : 68;
    }

    function drawAngleStep() {
        const zone = document.getElementById('chat-oracle-fan-zone');
        const width = zone ? zone.clientWidth : window.innerWidth;
        return width <= 400 ? 0.34 : 0.28;
    }

    function wrapDistance(value, total) {
        return ((((value + total / 2) % total) + total) % total) - total / 2;
    }

    function snapDrawOffset(value) {
        return Math.round(value);
    }

    function debounceDrawSnap() {
        clearTimeout(drawSession.snapTimer);
        drawSession.snapTimer = setTimeout(() => {
            if (drawSession.selectedIndex !== null || drawSession.dragging) return;
            drawSession.rotationOffset = snapDrawOffset(drawSession.rotationOffset);
            layoutDrawFan();
        }, 140);
    }

    function renderDrawResultPlaceholder() {
        const title = document.getElementById('chat-oracle-draw-detail-title');
        const keywords = document.getElementById('chat-oracle-draw-detail-keywords');
        const replyLabel = document.getElementById('chat-oracle-draw-detail-reply-label');
        const reply = document.getElementById('chat-oracle-draw-detail-reply');
        const sendBtn = document.getElementById('chat-oracle-draw-send-btn');

        if (!title || !keywords || !replyLabel || !reply || !sendBtn) return;

        title.textContent = '请选择一张牌';
        keywords.textContent = '';
        replyLabel.textContent = '';
        reply.textContent = '';
        sendBtn.disabled = true;
    }

    function renderDrawResult(card, reply) {
        const title = document.getElementById('chat-oracle-draw-detail-title');
        const keywords = document.getElementById('chat-oracle-draw-detail-keywords');
        const replyLabel = document.getElementById('chat-oracle-draw-detail-reply-label');
        const replyText = document.getElementById('chat-oracle-draw-detail-reply');
        const sendBtn = document.getElementById('chat-oracle-draw-send-btn');

        if (!title || !keywords || !replyLabel || !replyText || !sendBtn) return;

        if (!card || !reply) {
            renderDrawResultPlaceholder();
            return;
        }

        title.textContent = `${card.code} · ${card.name}`;
        keywords.textContent = card.keywords;
        replyLabel.textContent = reply.label || '快捷回复';
        replyText.textContent = reply.content;
        sendBtn.disabled = false;
    }

    function isInlineDrawOpen() {
        const overlay = document.getElementById('chat-oracle-inline-draw');
        return !!(overlay && !overlay.classList.contains('hidden'));
    }

    function openInlineDraw() {
        const overlay = document.getElementById('chat-oracle-inline-draw');
        const screen = document.getElementById('chat-screen');
        closeDrawDetail();
        if (overlay) overlay.classList.remove('hidden');
        if (screen) screen.classList.add('chat-oracle-inline-open');
    }

    function closeDrawDetail() {
        const overlay = document.getElementById('chat-oracle-inline-draw');
        const detail = document.getElementById('chat-oracle-draw-detail');
        if (detail) detail.classList.add('hidden');
        if (overlay) overlay.classList.remove('is-detail-open');
        drawSession.detailOpen = false;
    }

    function finishCloseInlineDraw() {
        const overlay = document.getElementById('chat-oracle-inline-draw');
        const screen = document.getElementById('chat-screen');
        const fan = document.getElementById('chat-oracle-fan');

        clearTimeout(drawSession.dealTimer);
        clearTimeout(drawSession.collectTimer);
        closeDrawDetail();

        if (fan) {
            fan.classList.remove('is-dealing', 'is-collecting');
            fan.querySelectorAll('.chat-oracle-fan-card').forEach((cardNode) => {
                cardNode.classList.remove('is-deal-enter', 'is-collect-leave');
                cardNode.style.transitionDelay = '';
            });
        }

        if (overlay) overlay.classList.add('hidden');
        if (screen) screen.classList.remove('chat-oracle-inline-open');
        drawSession.locked = false;
        drawSession.mode = 'choose';
    }

    function startCollectAnimation(onComplete) {
        clearTimeout(drawSession.dealTimer);
        clearTimeout(drawSession.collectTimer);

        const fan = document.getElementById('chat-oracle-fan');
        const cards = fan ? [...fan.querySelectorAll('.chat-oracle-fan-card')] : [];

        if (!fan || !cards.length) {
            if (typeof onComplete === 'function') onComplete();
            return;
        }

        drawSession.locked = true;
        fan.classList.remove('is-dealing');
        fan.classList.add('is-collecting');

        cards.forEach((cardNode, index) => {
            const reverseIndex = cards.length - 1 - index;
            cardNode.classList.remove('is-deal-enter');
            cardNode.style.transitionDelay = `${reverseIndex * 34}ms`;
        });

        requestAnimationFrame(() => {
            cards.forEach((cardNode) => {
                cardNode.classList.add('is-collect-leave');
            });
        });

        const totalDuration = 520 + Math.max(0, cards.length - 1) * 34;
        drawSession.collectTimer = setTimeout(() => {
            if (typeof onComplete === 'function') onComplete();
        }, totalDuration);
    }

    function closeInlineDraw(options) {
        const settings = options || {};
        const overlay = document.getElementById('chat-oracle-inline-draw');
        const shouldAnimate = !!settings.animateCollect
            && !!(overlay && !overlay.classList.contains('hidden'))
            && drawSession.mode === 'fan';

        if (!shouldAnimate) {
            finishCloseInlineDraw();
            return;
        }

        closeDrawDetail();
        startCollectAnimation(() => {
            finishCloseInlineDraw();
        });
    }

    function openDrawDetail() {
        const preset = getDrawSelectedPreset();
        const card = findCard(drawSession.selectedCardName);
        const reply = preset && card ? getReplyForCard(preset.mappings, card.name) : null;
        const overlay = document.getElementById('chat-oracle-inline-draw');
        const detail = document.getElementById('chat-oracle-draw-detail');

        if (!detail || !card || !reply) return;

        renderDrawResult(card, reply);
        if (overlay) overlay.classList.add('is-detail-open');
        detail.classList.remove('hidden');
        drawSession.detailOpen = true;
    }

    function createDrawCardNode(card, index) {
        const button = document.createElement('button');
        button.className = 'chat-oracle-fan-card';
        button.type = 'button';
        button.setAttribute('aria-label', `抽取 ${card.name}`);
        button.dataset.index = String(index);
        button.style.setProperty('--deal-order', String(index));
        button.innerHTML = `
            <div class="chat-oracle-fan-card-shell">
                <div class="chat-oracle-fan-card-inner">
                    <div class="chat-oracle-fan-card-face chat-oracle-fan-card-back">
                        <div class="chat-oracle-fan-back-pattern">
                            <div class="chat-oracle-fan-back-mini">✦</div>
                            <div class="chat-oracle-fan-sigil">
                                <div class="chat-oracle-fan-sigil-mark">☾</div>
                            </div>
                            <div class="chat-oracle-fan-back-divider"></div>
                        </div>
                        <div class="chat-oracle-fan-back-title">ORACLE</div>
                    </div>
                    <div class="chat-oracle-fan-card-face chat-oracle-fan-card-front">
                        <div class="chat-oracle-fan-front-top"><span>${card.code}</span><span>Oracle</span></div>
                        <div class="chat-oracle-fan-front-center">
                            <div class="chat-oracle-fan-front-icon">${card.icon}</div>
                            <div class="chat-oracle-fan-front-title">${card.name}</div>
                            <div class="chat-oracle-fan-front-keyword">${card.keywords}</div>
                            <div class="chat-oracle-fan-front-text">${card.text}</div>
                        </div>
                        <div class="chat-oracle-fan-front-bottom"><span>Luna</span><span>Reveal</span></div>
                    </div>
                </div>
            </div>
        `;

        button.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            if (drawSession.selectedIndex === index && drawSession.resultReady && !drawSession.detailOpen) {
                openDrawDetail();
                return;
            }
            if (drawSession.selectedIndex === null) {
                pickDrawCard(index);
            }
        });

        button.addEventListener('click', (event) => {
            if (Date.now() < drawSession.suppressClickUntil) return;
            if (drawSession.selectedIndex === index && drawSession.resultReady && !drawSession.detailOpen) {
                event.preventDefault();
                openDrawDetail();
            }
        });

        return button;
    }

    function layoutDrawFan() {
        const fan = document.getElementById('chat-oracle-fan');
        if (!fan) return;

        const cards = [...fan.querySelectorAll('.chat-oracle-fan-card')];
        const total = cards.length;
        if (!total) return;

        const width = fan.clientWidth || window.innerWidth;
        const mobile = width <= 420;
        const radiusX = Math.min(width * (mobile ? 0.39 : 0.43), mobile ? 210 : 290);
        const arcHeight = mobile ? 44 : 56;
        const rearDrop = mobile ? 10 : 14;

        cards.forEach((cardNode, index) => {
            if (drawSession.selectedIndex !== null) {
                return;
            }

            const relativeIndex = wrapDistance(index - drawSession.rotationOffset, total);
            const angle = relativeIndex * drawAngleStep();
            const depth = Math.cos(angle);
            const side = Math.sin(angle);
            const frontDepth = Math.max(depth, 0);
            const backDepth = Math.max(-depth, 0);
            const x = side * radiusX;
            const y = Math.pow(Math.abs(side), 1.55) * arcHeight + backDepth * rearDrop;
            const rotate = side * (mobile ? 22 : 18);
            const scale = 0.8 + frontDepth * 0.22 - backDepth * 0.06;
            const opacity = 1;
            const blur = backDepth > 0.45 ? 0.35 : 0;
            const z = 120 + Math.round(frontDepth * 220) + Math.round((1 - Math.abs(side)) * 40) - Math.round(backDepth * 32);

            cardNode.style.setProperty('--x', `${x}px`);
            cardNode.style.setProperty('--y', `${y}px`);
            cardNode.style.setProperty('--r', `${rotate}deg`);
            cardNode.style.setProperty('--scale', scale.toFixed(3));
            cardNode.style.setProperty('--opacity', opacity.toFixed(3));
            cardNode.style.setProperty('--blur', `${blur}px`);
            cardNode.style.setProperty('--z', z);

            cardNode.classList.toggle('is-back-row', backDepth > 0.62);
            cardNode.classList.toggle('is-front', Math.abs(relativeIndex) < 0.85);
        });
    }

    function resetDrawDeck(cards) {
        clearTimeout(drawSession.snapTimer);
        clearTimeout(drawSession.dealTimer);
        drawSession.cards = shuffleList(cards || []);
        drawSession.cardsSignature = getDrawDeckSignature(cards || []);
        drawSession.selectedIndex = null;
        drawSession.selectedCardName = '';
        drawSession.locked = false;
        drawSession.rotationOffset = drawSession.cards.length ? Math.floor(Math.random() * drawSession.cards.length) : 0;
        drawSession.pointerId = null;
        drawSession.startX = 0;
        drawSession.startOffset = 0;
        drawSession.dragging = false;
        drawSession.moved = false;
        drawSession.pressedCardIndex = null;
        drawSession.captureActive = false;
        drawSession.suppressClickUntil = 0;
        drawSession.resultReady = false;
        drawSession.detailOpen = false;

        const fan = document.getElementById('chat-oracle-fan');
        if (!fan) return;

        fan.innerHTML = '';
        fan.classList.remove('has-selection', 'is-dragging');
        drawSession.cards.forEach((card, index) => {
            fan.appendChild(createDrawCardNode(card, index));
        });

        renderDrawResultPlaceholder();
        closeDrawDetail();
        layoutDrawFan();
        startDealAnimation();
    }

    function startDealAnimation() {
        clearTimeout(drawSession.dealTimer);

        const fan = document.getElementById('chat-oracle-fan');
        if (!fan) return;

        const cards = [...fan.querySelectorAll('.chat-oracle-fan-card')];
        if (!cards.length) return;

        drawSession.locked = true;
        fan.classList.add('is-dealing');

        cards.forEach((cardNode, index) => {
            cardNode.classList.add('is-deal-enter');
            cardNode.style.transitionDelay = `${index * 42}ms`;
        });

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                cards.forEach((cardNode) => {
                    cardNode.classList.remove('is-deal-enter');
                });
            });
        });

        const totalDuration = 720 + Math.max(0, cards.length - 1) * 42;
        drawSession.dealTimer = setTimeout(() => {
            fan.classList.remove('is-dealing');
            cards.forEach((cardNode) => {
                cardNode.style.transitionDelay = '';
            });
            drawSession.locked = false;
            drawSession.suppressClickUntil = Date.now() + 120;
        }, totalDuration);
    }

    function pickDrawCard(index) {
        const fan = document.getElementById('chat-oracle-fan');
        if (!fan || drawSession.locked || drawSession.selectedIndex !== null) return;

        const cards = [...fan.querySelectorAll('.chat-oracle-fan-card')];
        const selectedCard = cards[index];
        const chosenCard = drawSession.cards[index];
        const preset = getDrawSelectedPreset();
        const reply = chosenCard && preset ? getReplyForCard(preset.mappings, chosenCard.name) : null;

        if (!selectedCard || !chosenCard || !reply) return;

        drawSession.selectedIndex = index;
        drawSession.selectedCardName = chosenCard.name;
        drawSession.locked = true;
        drawSession.resultReady = false;
        drawSession.detailOpen = false;
        fan.classList.add('has-selection');

        cards.forEach((cardNode, cardIndex) => {
            cardNode.classList.remove('is-front', 'is-back-row');
            if (cardIndex === index) {
                cardNode.classList.add('is-picked');
                cardNode.setAttribute('aria-pressed', 'true');
            } else {
                cardNode.classList.add('is-muted');
                cardNode.setAttribute('aria-pressed', 'false');
            }
        });

        setTimeout(() => {
            selectedCard.classList.add('is-flipped');
            drawSession.resultReady = true;
            renderDrawResult(chosenCard, reply);
        }, 520);

        setTimeout(() => {
            drawSession.locked = false;
        }, 1200);
    }

    function handleDrawSend() {
        const preset = getDrawSelectedPreset();
        const cardName = drawSession.selectedCardName;
        const reply = preset && cardName ? getReplyForCard(preset.mappings, cardName) : null;

        if (!preset || !cardName || !reply) {
            toast('请先翻开一张牌');
            return;
        }

        sendQuickReply(reply.content, cardName);
    }

    function handleDrawReset() {
        closeDrawDetail();
        const preset = getDrawSelectedPreset();
        if (!preset) {
            drawSession.mode = 'choose';
            renderDrawPage();
            return;
        }

        const configuredCards = getConfiguredCards(preset.mappings);
        if (!configuredCards.length) {
            drawSession.mode = 'choose';
            renderDrawPage();
            return;
        }

        resetDrawDeck(configuredCards);
        renderDrawPage();
    }

    function handleDrawBack() {
        if (drawSession.detailOpen) {
            closeDrawDetail();
            return;
        }

        if (drawSession.mode === 'fan') {
            drawSession.mode = 'choose';
            renderDrawPage();
            return;
        }

        closeInlineDraw();
    }

    function createDrawDeckItem(preset, isSelected) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = `chat-oracle-preset-item chat-oracle-draw-deck-item${isSelected ? ' is-selected' : ''}`;

        const top = document.createElement('div');
        top.className = 'chat-oracle-preset-top';

        const main = document.createElement('div');
        main.className = 'chat-oracle-draw-deck-main';

        const name = document.createElement('div');
        name.className = 'chat-oracle-preset-name';
        name.textContent = preset.name;

        const count = document.createElement('div');
        count.className = 'chat-oracle-draw-deck-count';
        count.textContent = `${countConfiguredCards(preset.mappings)} 张可抽取`;

        const arrow = document.createElement('div');
        arrow.className = 'chat-oracle-draw-deck-arrow';
        arrow.innerHTML = '<i class="fas fa-chevron-right"></i>';

        main.appendChild(name);
        main.appendChild(count);
        top.appendChild(main);
        top.appendChild(arrow);
        item.appendChild(top);
        item.addEventListener('click', () => startDrawWithDeck(preset.id));
        return item;
    }

    function renderDrawDeckList() {
        const list = document.getElementById('chat-oracle-draw-deck-list');
        if (!list) return;

        const config = ensureOracleConfig();
        const presets = getDrawAvailablePresets(config);
        list.innerHTML = '';

        presets.forEach((preset) => {
            const isSelected = (drawSession.selectedPresetId && drawSession.selectedPresetId === preset.id)
                || (!drawSession.selectedPresetId && config.activeDeckId === preset.id);
            list.appendChild(createDrawDeckItem(preset, isSelected));
        });
    }

    function renderDrawPage() {
        const selectState = document.getElementById('chat-oracle-draw-select-state');
        const fanState = document.getElementById('chat-oracle-draw-fan-state');
        const emptyState = document.getElementById('chat-oracle-draw-empty-state');
        const currentDeck = document.getElementById('chat-oracle-draw-current-deck');
        const inlineDraw = document.getElementById('chat-oracle-inline-draw');
        const config = ensureOracleConfig();
        const availablePresets = getDrawAvailablePresets(config);

        if (!selectState || !fanState || !emptyState || !currentDeck) return;

        if (inlineDraw) inlineDraw.classList.remove('is-fan-mode');
        renderDrawDeckList();

        if (!availablePresets.length) {
            drawSession.mode = 'choose';
            selectState.classList.remove('hidden');
            fanState.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        if (drawSession.mode !== 'fan') {
            selectState.classList.remove('hidden');
            fanState.classList.add('hidden');
            return;
        }

        const preset = getDrawSelectedPreset(config);
        if (!preset) {
            drawSession.mode = 'choose';
            selectState.classList.remove('hidden');
            fanState.classList.add('hidden');
            return;
        }

        const configuredCards = getConfiguredCards(preset.mappings);
        if (!configuredCards.length) {
            drawSession.mode = 'choose';
            selectState.classList.remove('hidden');
            fanState.classList.add('hidden');
            return;
        }

        selectState.classList.add('hidden');
        fanState.classList.remove('hidden');
        if (inlineDraw) inlineDraw.classList.add('is-fan-mode');
        currentDeck.textContent = `牌组 · ${preset.name}`;

        const nextSignature = getDrawDeckSignature(configuredCards);
        const fan = document.getElementById('chat-oracle-fan');
        const shouldReset = !fan
            || !fan.children.length
            || drawSession.cardsSignature !== nextSignature
            || drawSession.cards.length !== configuredCards.length;

        if (shouldReset) {
            resetDrawDeck(configuredCards);
            return;
        }

        layoutDrawFan();
        if (drawSession.selectedCardName) {
            const card = findCard(drawSession.selectedCardName);
            const reply = getReplyForCard(preset.mappings, drawSession.selectedCardName);
            renderDrawResult(card, reply);
            return;
        }

        renderDrawResultPlaceholder();
    }
    function onDrawFanPointerDown(event) {
        if (drawSession.locked) return;
        if (drawSession.selectedIndex !== null) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;

        const cardNode = event.target.closest('.chat-oracle-fan-card');
        drawSession.pointerId = event.pointerId;
        drawSession.startX = event.clientX;
        drawSession.startOffset = drawSession.rotationOffset;
        drawSession.dragging = true;
        drawSession.moved = false;
        drawSession.captureActive = false;
        drawSession.pressedCardIndex = cardNode ? Number(cardNode.dataset.index) : null;
    }

    function onDrawFanPointerMove(event) {
        const fan = document.getElementById('chat-oracle-fan');
        if (!fan || !drawSession.dragging || event.pointerId !== drawSession.pointerId || drawSession.selectedIndex !== null) return;

        const deltaX = event.clientX - drawSession.startX;
        if (Math.abs(deltaX) > 6 && !drawSession.moved) {
            drawSession.moved = true;
            drawSession.captureActive = true;
            fan.classList.add('is-dragging');
            fan.setPointerCapture(event.pointerId);
        }

        if (!drawSession.moved) return;

        drawSession.rotationOffset = drawSession.startOffset - deltaX / drawStepPixels();
        layoutDrawFan();
    }

    function endDrawFanDrag(event) {
        const fan = document.getElementById('chat-oracle-fan');
        if (!fan || !drawSession.dragging) return;
        if (event && drawSession.pointerId !== null && event.pointerId !== drawSession.pointerId) return;

        const moved = drawSession.moved;
        const pressedCardIndex = drawSession.pressedCardIndex;

        drawSession.dragging = false;
        drawSession.pointerId = null;
        drawSession.moved = false;
        drawSession.pressedCardIndex = null;
        drawSession.captureActive = false;
        fan.classList.remove('is-dragging');

        if (moved) {
            drawSession.suppressClickUntil = Date.now() + 220;
            drawSession.rotationOffset = snapDrawOffset(drawSession.rotationOffset);
            layoutDrawFan();
            return;
        }

        if (pressedCardIndex !== null && Date.now() >= drawSession.suppressClickUntil) {
            pickDrawCard(pressedCardIndex);
        }
    }

    function onDrawFanWheel(event) {
        if (drawSession.locked) return;
        if (drawSession.selectedIndex !== null) return;

        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (Math.abs(delta) < 1) return;

        event.preventDefault();
        drawSession.rotationOffset += delta / drawStepPixels() * 0.32;
        layoutDrawFan();
        debounceDrawSnap();
    }

    function startDrawWithDeck(presetId) {
        const activated = activatePreset(presetId);
        if (!activated) {
            toast('未找到这个牌组');
            return;
        }

        const configuredCards = getConfiguredCards(activated.preset.mappings);
        if (!configuredCards.length) {
            toast('这个牌组里还没有可抽取的快捷回复');
            drawSession.mode = 'choose';
            renderDrawPage();
            return;
        }

        drawSession.mode = 'fan';
        drawSession.selectedPresetId = activated.preset.id;
        renderHomeSummary();
        renderManagePage();
        resetDrawDeck(configuredCards);
        renderDrawPage();
    }

    function renderPresetList() {
        const list = document.getElementById('chat-oracle-presets-list');
        if (!list) return;

        const config = ensureOracleConfig();
        const selectedContext = getSelectedDeckContext();
        list.innerHTML = '';

        if (!config.presets.length) {
            const empty = document.createElement('div');
            empty.className = 'chat-oracle-empty';
            empty.textContent = '还没有保存任何牌组。';
            list.appendChild(empty);
            return;
        }

        config.presets.forEach((preset) => {
            const item = document.createElement('div');
            item.className = `chat-oracle-preset-item${selectedContext.isPreset && selectedContext.id === preset.id ? ' is-selected' : ''}`;
            item.addEventListener('click', () => setSelectedDeck(preset.id));

            const top = document.createElement('div');
            top.className = 'chat-oracle-preset-top';

            const copy = document.createElement('div');
            const name = document.createElement('div');
            name.className = 'chat-oracle-preset-name';
            name.textContent = preset.name;

            const meta = document.createElement('div');
            meta.className = 'chat-oracle-preset-meta';
            meta.textContent = `${countConfiguredCards(preset.mappings)} 张牌 · 每张牌 1 条回复`;

            const actions = document.createElement('div');
            actions.className = 'chat-oracle-inline-actions';

            const applyBtn = document.createElement('button');
            applyBtn.type = 'button';
            applyBtn.className = 'chat-oracle-small-btn';
            applyBtn.textContent = config.activeDeckId === preset.id ? '已应用' : '应用';
            applyBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                applyPreset(preset.id);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'chat-oracle-small-btn';
            deleteBtn.textContent = '删除';
            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                deletePreset(preset.id);
            });

            copy.appendChild(name);
            copy.appendChild(meta);
            actions.appendChild(applyBtn);
            actions.appendChild(deleteBtn);
            top.appendChild(copy);
            top.appendChild(actions);
            item.appendChild(top);
            list.appendChild(item);
        });
    }
    function renderExistingList() {
        const list = document.getElementById('chat-oracle-existing-list');
        const title = document.getElementById('chat-oracle-existing-title');
        if (!list) return;

        const selectedContext = getSelectedDeckContext();
        const mappings = selectedContext.mappings;
        list.innerHTML = '';

        if (title) {
            title.textContent = selectedContext.isPreset
                ? `牌组内快捷回复 · ${selectedContext.name}`
                : '当前配置内快捷回复';
        }

        const configuredCards = getConfiguredCards(mappings);
        if (!configuredCards.length) {
            const empty = document.createElement('div');
            empty.className = 'chat-oracle-empty';
            empty.textContent = selectedContext.isPreset ? '这个牌组里还没有快捷回复。' : '当前还没有导入任何快捷回复。';
            list.appendChild(empty);
            return;
        }

        configuredCards.forEach((card) => {
            const reply = getReplyForCard(mappings, card.name);
            if (!reply) return;

            const group = document.createElement('div');
            group.className = 'chat-oracle-card-group';

            const head = document.createElement('div');
            head.className = 'chat-oracle-card-group-head';

            const copy = document.createElement('div');
            const name = document.createElement('div');
            name.className = 'chat-oracle-card-group-name';
            name.textContent = `${card.code} · ${card.name}`;

            const meta = document.createElement('div');
            meta.className = 'chat-oracle-card-group-meta';
            meta.textContent = '当前这张牌仅保留 1 条快捷回复';

            const stack = document.createElement('div');
            stack.className = 'chat-oracle-replies-stack';

            const row = document.createElement('div');
            row.className = 'chat-oracle-reply-row is-editable';
            row.tabIndex = 0;
            row.setAttribute('role', 'button');
            row.setAttribute('aria-label', `编辑「${card.name}」快捷回复`);
            row.addEventListener('click', () => openEditReplyModal(card.name));
            row.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openEditReplyModal(card.name);
                }
            });

            const replyCopy = document.createElement('div');
            replyCopy.className = 'chat-oracle-reply-copy';

            const label = document.createElement('div');
            label.className = 'chat-oracle-reply-label';
            label.textContent = reply.label || '快捷回复';

            const text = document.createElement('div');
            text.className = 'chat-oracle-reply-text';
            text.textContent = reply.content;

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'chat-oracle-small-btn';
            removeBtn.textContent = '删除';
            removeBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                deleteCardMapping(card.name);
            });

            replyCopy.appendChild(label);
            replyCopy.appendChild(text);
            row.appendChild(replyCopy);
            row.appendChild(removeBtn);
            stack.appendChild(row);
            copy.appendChild(name);
            copy.appendChild(meta);
            head.appendChild(copy);
            group.appendChild(head);
            group.appendChild(stack);
            list.appendChild(group);
        });
    }

    function renderManagePage() {
        renderPresetList();
        renderExistingList();
        updatePresetStatus();
    }

    function saveOrUpdatePreset(name, mappings) {
        const config = ensureOracleConfig();
        const existingIndex = config.presets.findIndex((preset) => preset.name === name);
        const nextPreset = {
            id: existingIndex >= 0 ? config.presets[existingIndex].id : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name,
            mappings: cloneData(mappings),
            createdAt: existingIndex >= 0 ? config.presets[existingIndex].createdAt : Date.now()
        };

        if (existingIndex >= 0) {
            config.presets.splice(existingIndex, 1, nextPreset);
        } else {
            config.presets.unshift(nextPreset);
        }

        return nextPreset;
    }

    function activatePreset(presetId) {
        const config = ensureOracleConfig();
        const preset = getPresetById(presetId, config);
        if (!preset) return null;

        config.mappings = cloneData(preset.mappings);
        config.activeDeckId = preset.id;
        config.lastDrawCard = '';
        selectedDeckId = preset.id;
        persistOracleConfig();
        return { config, preset };
    }

    function applyPreset(presetId, options) {
        const resolved = activatePreset(presetId);
        if (!resolved) {
            toast('未找到这个牌组');
            return null;
        }

        renderHomeSummary();
        renderManagePage();
        renderDrawPage();

        if (!options || !options.silent) {
            updatePresetStatus(`已应用牌组「${resolved.preset.name}」`);
            toast(`已应用牌组「${resolved.preset.name}」`);
        }

        return resolved.preset;
    }

    function deletePreset(presetId) {
        const config = ensureOracleConfig();
        const preset = getPresetById(presetId, config);
        if (!preset) return;

        config.presets = config.presets.filter((item) => item.id !== presetId);
        if (config.activeDeckId === presetId) {
            config.activeDeckId = '';
        }
        if (selectedDeckId === presetId) {
            selectedDeckId = null;
        }
        persistOracleConfig();
        renderHomeSummary();
        renderManagePage();
        renderDrawPage();
        updatePresetStatus(`已删除牌组「${preset.name}」`);
        toast(`已删除牌组「${preset.name}」`);
    }

    function deleteCardMapping(cardName) {
        const config = ensureOracleConfig();
        const selectedContext = getSelectedDeckContext();

        if (selectedContext.isPreset && selectedContext.preset) {
            if (!selectedContext.preset.mappings[cardName]) return;
            delete selectedContext.preset.mappings[cardName];

            const remainingCount = countConfiguredCards(selectedContext.preset.mappings);
            if (remainingCount === 0) {
                if (config.activeDeckId === selectedContext.preset.id) {
                    config.mappings = {};
                    config.lastDrawCard = '';
                }
                persistOracleConfig();
                renderHomeSummary();
                renderManagePage();
                renderDrawPage();
                toast(`已删除「${cardName}」的快捷回复，这个牌组现在是空的`);
                return;
            }

            if (config.activeDeckId === selectedContext.preset.id) {
                config.mappings = cloneData(selectedContext.preset.mappings);
                if (!getReplyForCard(config.mappings, config.lastDrawCard)) {
                    config.lastDrawCard = '';
                }
            }
        } else {
            if (!config.mappings[cardName]) return;
            delete config.mappings[cardName];
            if (config.lastDrawCard === cardName) {
                config.lastDrawCard = '';
            }
        }

        persistOracleConfig();
        renderHomeSummary();
        renderManagePage();
        renderDrawPage();
        toast(`已删除「${cardName}」的快捷回复`);
    }

    function clearCurrentMappings() {
        const config = ensureOracleConfig();
        config.mappings = {};
        config.lastDrawCard = '';
        config.activeDeckId = '';
        persistOracleConfig();
        renderHomeSummary();
        renderManagePage();
        renderDrawPage();
        toast('已清空当前快捷回复配置');
    }
    function closeChatMorePanel() {
        const panel = document.getElementById('chat-more-panel');
        const inputArea = document.querySelector('.chat-input-area');
        if (panel) panel.classList.remove('slide-in');
        if (inputArea) {
            inputArea.classList.remove('push-up');
            inputArea.classList.remove('push-up-more');
        }
    }

    function syncNestedModalLock() {
        const sheet = document.querySelector('#chat-oracle-modal .chat-oracle-sheet');
        const importModal = document.getElementById('chat-oracle-import-modal');
        const editModal = document.getElementById('chat-oracle-edit-modal');
        const createDeckModal = document.getElementById('chat-oracle-create-deck-modal');
        const addReplyModal = document.getElementById('chat-oracle-add-reply-modal');
        const hasOpenSubmodal = !!(
            (importModal && !importModal.classList.contains('hidden')) ||
            (editModal && !editModal.classList.contains('hidden')) ||
            (createDeckModal && !createDeckModal.classList.contains('hidden')) ||
            (addReplyModal && !addReplyModal.classList.contains('hidden'))
        );

        if (sheet) {
            sheet.classList.toggle('has-submodal', hasOpenSubmodal);
        }
    }

    function resetImportForm() {
        const nameInput = document.getElementById('chat-oracle-import-name');
        const textarea = document.getElementById('chat-oracle-import-textarea');
        const fileInput = document.getElementById('chat-oracle-file-input');
        if (nameInput) nameInput.value = '';
        if (textarea) textarea.value = '';
        if (fileInput) fileInput.value = '';
        updateImportStatus();
    }

    function openImportModal() {
        resetImportForm();
        const modal = document.getElementById('chat-oracle-import-modal');
        if (modal) modal.classList.remove('hidden');
        syncNestedModalLock();
    }

    function closeImportModal() {
        const modal = document.getElementById('chat-oracle-import-modal');
        if (modal) modal.classList.add('hidden');
        syncNestedModalLock();
    }

    function updateCreateDeckStatus(message) {
        const status = document.getElementById('chat-oracle-create-deck-status');
        if (!status) return;
        status.textContent = message || '新建后会自动在牌组列表中选中，你可以继续手动添加快捷回复。';
    }

    function resetCreateDeckForm() {
        const nameInput = document.getElementById('chat-oracle-create-deck-name');
        if (nameInput) nameInput.value = '';
        updateCreateDeckStatus();
    }

    function openCreateDeckModal() {
        resetCreateDeckForm();
        const modal = document.getElementById('chat-oracle-create-deck-modal');
        if (modal) modal.classList.remove('hidden');
        syncNestedModalLock();
    }

    function closeCreateDeckModal() {
        const modal = document.getElementById('chat-oracle-create-deck-modal');
        if (modal) modal.classList.add('hidden');
        syncNestedModalLock();
    }

    function createPreset(name) {
        const config = ensureOracleConfig();
        const nextPreset = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name,
            mappings: {},
            createdAt: Date.now()
        };
        config.presets.unshift(nextPreset);
        return nextPreset;
    }

    function saveCreatedDeck() {
        const nameInput = document.getElementById('chat-oracle-create-deck-name');
        const presetName = String(nameInput && nameInput.value || '').trim();

        if (!presetName) {
            toast('请先填写牌组名称');
            return;
        }

        const config = ensureOracleConfig();
        if (config.presets.some((preset) => preset.name === presetName)) {
            toast('已经有同名牌组了，请换一个名称');
            return;
        }

        const preset = createPreset(presetName);
        selectedDeckId = preset.id;
        persistOracleConfig();
        closeCreateDeckModal();
        renderHomeSummary();
        renderManagePage();
        renderDrawPage();
        updatePresetStatus(`已新建牌组「${preset.name}」`);
        toast(`已新建牌组「${preset.name}」`);
    }

    function updateAddReplyStatus(message) {
        const status = document.getElementById('chat-oracle-add-reply-status');
        if (!status) return;
        status.textContent = message || '每张牌只能保留 1 条快捷回复；已存在的牌可以直接在列表中点击编辑。';
    }

    function resetAddReplyForm() {
        addingReplyState = null;

        const title = document.getElementById('chat-oracle-add-reply-title');
        const cardSelect = document.getElementById('chat-oracle-add-reply-card');
        const labelInput = document.getElementById('chat-oracle-add-reply-label');
        const contentInput = document.getElementById('chat-oracle-add-reply-content');

        if (title) title.textContent = '新增快捷回复';
        if (cardSelect) cardSelect.innerHTML = '';
        if (labelInput) labelInput.value = '';
        if (contentInput) contentInput.value = '';
        updateAddReplyStatus();
    }

    function openAddReplyModal() {
        const selectedContext = getSelectedDeckContext();
        if (!selectedContext.isPreset || !selectedContext.preset) {
            toast('请先新建或选择一个牌组');
            return;
        }

        const availableCards = getUnconfiguredCards(selectedContext.preset.mappings);
        if (!availableCards.length) {
            toast('这个牌组里的 18 张牌都已经配置好了');
            return;
        }

        resetAddReplyForm();
        addingReplyState = {
            presetId: selectedContext.preset.id,
            presetName: selectedContext.preset.name
        };

        const modal = document.getElementById('chat-oracle-add-reply-modal');
        const title = document.getElementById('chat-oracle-add-reply-title');
        const cardSelect = document.getElementById('chat-oracle-add-reply-card');

        if (title) title.textContent = `新增快捷回复 · ${selectedContext.preset.name}`;
        if (cardSelect) {
            availableCards.forEach((card) => {
                const option = document.createElement('option');
                option.value = card.name;
                option.textContent = `${card.code} · ${card.name} · ${card.keywords}`;
                cardSelect.appendChild(option);
            });
        }

        if (modal) modal.classList.remove('hidden');
        syncNestedModalLock();

        const contentInput = document.getElementById('chat-oracle-add-reply-content');
        if (contentInput) contentInput.focus();
    }

    function closeAddReplyModal() {
        const modal = document.getElementById('chat-oracle-add-reply-modal');
        if (modal) modal.classList.add('hidden');
        syncNestedModalLock();
        resetAddReplyForm();
    }

    function saveAddedReply() {
        if (!addingReplyState || !addingReplyState.presetId) {
            closeAddReplyModal();
            return;
        }

        const cardSelect = document.getElementById('chat-oracle-add-reply-card');
        const labelInput = document.getElementById('chat-oracle-add-reply-label');
        const contentInput = document.getElementById('chat-oracle-add-reply-content');
        const cardName = String(cardSelect && cardSelect.value || '').trim();
        const nextReply = normalizeReplyItem({
            label: String(labelInput && labelInput.value || '').trim(),
            content: String(contentInput && contentInput.value || '').trim()
        });

        if (!cardName) {
            toast('请先选择一张牌');
            return;
        }

        if (!nextReply) {
            toast('快捷回复内容不能为空');
            return;
        }

        const config = ensureOracleConfig();
        const preset = getPresetById(addingReplyState.presetId, config);
        if (!preset) {
            toast('未找到这个牌组');
            closeAddReplyModal();
            return;
        }

        preset.mappings[cardName] = nextReply;
        if (config.activeDeckId === preset.id) {
            config.mappings = cloneData(preset.mappings);
        }

        persistOracleConfig();
        closeAddReplyModal();
        renderHomeSummary();
        renderManagePage();
        renderDrawPage();
        toast(`已为「${cardName}」添加快捷回复`);
    }

    function resetEditForm() {
        editingReplyState = null;

        const title = document.getElementById('chat-oracle-edit-title');
        const labelInput = document.getElementById('chat-oracle-edit-label');
        const contentInput = document.getElementById('chat-oracle-edit-content');

        if (title) title.textContent = '编辑快捷回复';
        if (labelInput) labelInput.value = '';
        if (contentInput) contentInput.value = '';
    }

    function openEditReplyModal(cardName) {
        const selectedContext = getSelectedDeckContext();
        const card = findCard(cardName);
        const reply = getReplyForCard(selectedContext.mappings, cardName);
        const modal = document.getElementById('chat-oracle-edit-modal');
        const title = document.getElementById('chat-oracle-edit-title');
        const labelInput = document.getElementById('chat-oracle-edit-label');
        const contentInput = document.getElementById('chat-oracle-edit-content');

        if (!card || !reply || !modal) {
            toast('未找到这条快捷回复');
            return;
        }

        editingReplyState = {
            cardName: card.name,
            presetId: selectedContext.isPreset ? selectedContext.id : '',
            isPreset: !!selectedContext.isPreset
        };

        if (title) title.textContent = `编辑「${card.name}」快捷回复`;
        if (labelInput) labelInput.value = reply.label || '';
        if (contentInput) contentInput.value = reply.content || '';

        modal.classList.remove('hidden');
        syncNestedModalLock();

        if (contentInput) {
            contentInput.focus();
            const end = contentInput.value.length;
            contentInput.setSelectionRange(end, end);
        }
    }

    function closeEditReplyModal() {
        const modal = document.getElementById('chat-oracle-edit-modal');
        if (modal) modal.classList.add('hidden');
        syncNestedModalLock();
        resetEditForm();
    }

    function saveEditedReply() {
        if (!editingReplyState || !editingReplyState.cardName) {
            closeEditReplyModal();
            return;
        }

        const labelInput = document.getElementById('chat-oracle-edit-label');
        const contentInput = document.getElementById('chat-oracle-edit-content');
        const nextReply = normalizeReplyItem({
            label: String(labelInput && labelInput.value || '').trim(),
            content: String(contentInput && contentInput.value || '').trim()
        });

        if (!nextReply) {
            toast('快捷回复内容不能为空');
            return;
        }

        const editedCardName = editingReplyState.cardName;
        const config = ensureOracleConfig();

        if (editingReplyState.presetId) {
            const preset = getPresetById(editingReplyState.presetId, config);
            if (!preset) {
                toast('未找到这个牌组');
                closeEditReplyModal();
                return;
            }

            preset.mappings[editedCardName] = nextReply;

            if (config.activeDeckId === preset.id) {
                config.mappings = cloneData(preset.mappings);
            }
        } else {
            config.mappings[editedCardName] = nextReply;
        }

        persistOracleConfig();
        closeEditReplyModal();
        renderHomeSummary();
        renderManagePage();
        renderDrawPage();
        toast(`已更新「${editedCardName}」的快捷回复`);
    }

    function handleFileImport(event) {
        const input = event.target;
        const file = input && input.files ? input.files[0] : null;
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const textarea = document.getElementById('chat-oracle-import-textarea');
            if (textarea) textarea.value = String(reader.result || '');
            updateImportStatus('文件内容已载入，请填写牌组名称后点击“导入并保存牌组”。');
            input.value = '';
        };
        reader.onerror = () => {
            toast('读取文件失败，请重试');
            input.value = '';
        };
        reader.readAsText(file);
    }

    function importDeckAndSavePreset() {
        const nameInput = document.getElementById('chat-oracle-import-name');
        const textarea = document.getElementById('chat-oracle-import-textarea');
        const presetName = String(nameInput && nameInput.value || '').trim();
        const raw = String(textarea && textarea.value || '').trim();

        if (!presetName) {
            toast('请先填写牌组名称');
            return;
        }

        if (!raw) {
            toast('请先粘贴或导入 JSON 内容');
            return;
        }

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (error) {
            toast('JSON 格式有误，请检查逗号和引号', 2600);
            return;
        }

        let mappings;
        try {
            mappings = normalizeMappings(parsed);
        } catch (error) {
            toast(error.message || '导入失败，请检查格式', 2600);
            return;
        }

        if (!Object.keys(mappings).length) {
            toast('未识别到有效牌名，请检查 JSON 键名', 2600);
            return;
        }

        const config = ensureOracleConfig();
        config.mappings = mappings;
        config.lastDrawCard = '';
        const savedPreset = saveOrUpdatePreset(presetName, mappings);
        config.activeDeckId = savedPreset.id;
        selectedDeckId = savedPreset.id;
        persistOracleConfig();

        closeImportModal();
        renderHomeSummary();
        renderManagePage();
        renderDrawPage();
        updatePresetStatus(`已导入牌组「${presetName}」，并保存到牌组列表`);
        toast(`已导入牌组「${presetName}」并保存`, 2400);
    }

    function openOracleModal() {
        closeInlineDraw();
        closeChatMorePanel();
        ensureOracleConfig();
        closeImportModal();
        closeCreateDeckModal();
        closeAddReplyModal();
        closeEditReplyModal();
        renderHomeSummary();
        setView('home');
        const modal = document.getElementById('chat-oracle-modal');
        if (modal) modal.classList.remove('hidden');
        syncNestedModalLock();
    }

    function closeOracleModal() {
        closeImportModal();
        closeCreateDeckModal();
        closeAddReplyModal();
        closeEditReplyModal();
        const modal = document.getElementById('chat-oracle-modal');
        if (modal) modal.classList.add('hidden');
        syncNestedModalLock();
    }

    function openManageView() {
        if (isInlineDrawOpen()) {
            closeInlineDraw();
        }

        const modal = document.getElementById('chat-oracle-modal');
        if (!modal || modal.classList.contains('hidden')) {
            openOracleModal();
        }

        setView('manage');
    }

    function openDrawView() {
        const config = ensureOracleConfig();
        drawSession.mode = 'choose';
        drawSession.selectedPresetId = config.activeDeckId || drawSession.selectedPresetId || '';
        closeOracleModal();
        openInlineDraw();
        renderDrawPage();
    }

    function bindEvents() {
        const oracleBtn = document.getElementById('chat-more-oracle-btn');
        const backdrop = document.getElementById('chat-oracle-backdrop');
        const openManageBtn = document.getElementById('chat-oracle-open-manage-btn');
        const openDrawBtn = document.getElementById('chat-oracle-open-draw-btn');
        const openImportBtn = document.getElementById('chat-oracle-open-import-modal-btn');
        const openCreateDeckBtn = document.getElementById('chat-oracle-open-create-deck-modal-btn');
        const openAddReplyBtn = document.getElementById('chat-oracle-open-add-reply-modal-btn');
        const importBackdrop = document.getElementById('chat-oracle-import-modal-backdrop');
        const importCloseBtn = document.getElementById('chat-oracle-import-modal-close');
        const importCancelBtn = document.getElementById('chat-oracle-cancel-import-btn');
        const importFileBtn = document.getElementById('chat-oracle-import-file-btn');
        const importFileInput = document.getElementById('chat-oracle-file-input');
        const confirmImportBtn = document.getElementById('chat-oracle-confirm-import-btn');
        const createDeckBackdrop = document.getElementById('chat-oracle-create-deck-modal-backdrop');
        const createDeckCloseBtn = document.getElementById('chat-oracle-create-deck-modal-close');
        const createDeckCancelBtn = document.getElementById('chat-oracle-cancel-create-deck-btn');
        const createDeckSaveBtn = document.getElementById('chat-oracle-save-create-deck-btn');
        const addReplyBackdrop = document.getElementById('chat-oracle-add-reply-modal-backdrop');
        const addReplyCloseBtn = document.getElementById('chat-oracle-add-reply-modal-close');
        const addReplyCancelBtn = document.getElementById('chat-oracle-cancel-add-reply-btn');
        const addReplySaveBtn = document.getElementById('chat-oracle-save-add-reply-btn');
        const editBackdrop = document.getElementById('chat-oracle-edit-modal-backdrop');
        const editCloseBtn = document.getElementById('chat-oracle-edit-modal-close');
        const editCancelBtn = document.getElementById('chat-oracle-cancel-edit-btn');
        const saveEditBtn = document.getElementById('chat-oracle-save-edit-btn');
        const drawBackBtn = document.getElementById('chat-oracle-draw-back-btn');
        const inlineCloseBtn = document.getElementById('chat-oracle-inline-close-btn');
        const drawCurrentDeckBtn = document.getElementById('chat-oracle-draw-current-deck');
        const drawOpenManageBtn = document.getElementById('chat-oracle-draw-open-manage-btn');
        const drawDetailBackdrop = document.getElementById('chat-oracle-draw-detail-backdrop');
        const drawDetailCloseBtn = document.getElementById('chat-oracle-draw-detail-close');
        const drawSendBtn = document.getElementById('chat-oracle-draw-send-btn');
        const drawResetBtn = document.getElementById('chat-oracle-draw-reset-btn');
        const drawFan = document.getElementById('chat-oracle-fan');
        const drawFanZone = document.getElementById('chat-oracle-fan-zone');
        const clearBtn = document.getElementById('chat-oracle-clear-btn');

        if (oracleBtn && oracleBtn.dataset.oracleBound !== '1') {
            oracleBtn.dataset.oracleBound = '1';
            oracleBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                openOracleModal();
            }, true);
        }

        if (backdrop && backdrop.dataset.oracleBound !== '1') {
            backdrop.dataset.oracleBound = '1';
            backdrop.addEventListener('click', closeOracleModal);
        }

        document.querySelectorAll('[data-oracle-close="true"]').forEach((button) => {
            if (button.dataset.oracleBound === '1') return;
            button.dataset.oracleBound = '1';
            button.addEventListener('click', closeOracleModal);
        });

        document.querySelectorAll('[data-oracle-back]').forEach((button) => {
            if (button.dataset.oracleBound === '1') return;
            button.dataset.oracleBound = '1';
            button.addEventListener('click', () => setView(button.getAttribute('data-oracle-back') || 'home'));
        });

        if (openManageBtn && openManageBtn.dataset.oracleBound !== '1') {
            openManageBtn.dataset.oracleBound = '1';
            openManageBtn.addEventListener('click', openManageView);
        }

        if (openDrawBtn && openDrawBtn.dataset.oracleBound !== '1') {
            openDrawBtn.dataset.oracleBound = '1';
            openDrawBtn.addEventListener('click', openDrawView);
        }

        if (openImportBtn && openImportBtn.dataset.oracleBound !== '1') {
            openImportBtn.dataset.oracleBound = '1';
            openImportBtn.addEventListener('click', openImportModal);
        }

        if (openCreateDeckBtn && openCreateDeckBtn.dataset.oracleBound !== '1') {
            openCreateDeckBtn.dataset.oracleBound = '1';
            openCreateDeckBtn.addEventListener('click', openCreateDeckModal);
        }

        if (openAddReplyBtn && openAddReplyBtn.dataset.oracleBound !== '1') {
            openAddReplyBtn.dataset.oracleBound = '1';
            openAddReplyBtn.addEventListener('click', openAddReplyModal);
        }

        if (importBackdrop && importBackdrop.dataset.oracleBound !== '1') {
            importBackdrop.dataset.oracleBound = '1';
            importBackdrop.addEventListener('click', closeImportModal);
        }

        if (importCloseBtn && importCloseBtn.dataset.oracleBound !== '1') {
            importCloseBtn.dataset.oracleBound = '1';
            importCloseBtn.addEventListener('click', closeImportModal);
        }

        if (importCancelBtn && importCancelBtn.dataset.oracleBound !== '1') {
            importCancelBtn.dataset.oracleBound = '1';
            importCancelBtn.addEventListener('click', closeImportModal);
        }

        if (importFileBtn && importFileInput && importFileBtn.dataset.oracleBound !== '1') {
            importFileBtn.dataset.oracleBound = '1';
            importFileBtn.addEventListener('click', () => importFileInput.click());
        }

        if (importFileInput && importFileInput.dataset.oracleBound !== '1') {
            importFileInput.dataset.oracleBound = '1';
            importFileInput.addEventListener('change', handleFileImport);
        }

        if (confirmImportBtn && confirmImportBtn.dataset.oracleBound !== '1') {
            confirmImportBtn.dataset.oracleBound = '1';
            confirmImportBtn.addEventListener('click', importDeckAndSavePreset);
        }

        if (createDeckBackdrop && createDeckBackdrop.dataset.oracleBound !== '1') {
            createDeckBackdrop.dataset.oracleBound = '1';
            createDeckBackdrop.addEventListener('click', closeCreateDeckModal);
        }

        if (createDeckCloseBtn && createDeckCloseBtn.dataset.oracleBound !== '1') {
            createDeckCloseBtn.dataset.oracleBound = '1';
            createDeckCloseBtn.addEventListener('click', closeCreateDeckModal);
        }

        if (createDeckCancelBtn && createDeckCancelBtn.dataset.oracleBound !== '1') {
            createDeckCancelBtn.dataset.oracleBound = '1';
            createDeckCancelBtn.addEventListener('click', closeCreateDeckModal);
        }

        if (createDeckSaveBtn && createDeckSaveBtn.dataset.oracleBound !== '1') {
            createDeckSaveBtn.dataset.oracleBound = '1';
            createDeckSaveBtn.addEventListener('click', saveCreatedDeck);
        }

        if (addReplyBackdrop && addReplyBackdrop.dataset.oracleBound !== '1') {
            addReplyBackdrop.dataset.oracleBound = '1';
            addReplyBackdrop.addEventListener('click', closeAddReplyModal);
        }

        if (addReplyCloseBtn && addReplyCloseBtn.dataset.oracleBound !== '1') {
            addReplyCloseBtn.dataset.oracleBound = '1';
            addReplyCloseBtn.addEventListener('click', closeAddReplyModal);
        }

        if (addReplyCancelBtn && addReplyCancelBtn.dataset.oracleBound !== '1') {
            addReplyCancelBtn.dataset.oracleBound = '1';
            addReplyCancelBtn.addEventListener('click', closeAddReplyModal);
        }

        if (addReplySaveBtn && addReplySaveBtn.dataset.oracleBound !== '1') {
            addReplySaveBtn.dataset.oracleBound = '1';
            addReplySaveBtn.addEventListener('click', saveAddedReply);
        }

        if (editBackdrop && editBackdrop.dataset.oracleBound !== '1') {
            editBackdrop.dataset.oracleBound = '1';
            editBackdrop.addEventListener('click', closeEditReplyModal);
        }

        if (editCloseBtn && editCloseBtn.dataset.oracleBound !== '1') {
            editCloseBtn.dataset.oracleBound = '1';
            editCloseBtn.addEventListener('click', closeEditReplyModal);
        }

        if (editCancelBtn && editCancelBtn.dataset.oracleBound !== '1') {
            editCancelBtn.dataset.oracleBound = '1';
            editCancelBtn.addEventListener('click', closeEditReplyModal);
        }

        if (saveEditBtn && saveEditBtn.dataset.oracleBound !== '1') {
            saveEditBtn.dataset.oracleBound = '1';
            saveEditBtn.addEventListener('click', saveEditedReply);
        }

        if (drawBackBtn && drawBackBtn.dataset.oracleBound !== '1') {
            drawBackBtn.dataset.oracleBound = '1';
            drawBackBtn.addEventListener('click', handleDrawBack);
        }

        if (inlineCloseBtn && inlineCloseBtn.dataset.oracleBound !== '1') {
            inlineCloseBtn.dataset.oracleBound = '1';
            inlineCloseBtn.addEventListener('click', closeInlineDraw);
        }

        if (drawCurrentDeckBtn && drawCurrentDeckBtn.dataset.oracleBound !== '1') {
            drawCurrentDeckBtn.dataset.oracleBound = '1';
            drawCurrentDeckBtn.addEventListener('click', () => closeInlineDraw({ animateCollect: true }));
        }

        if (drawOpenManageBtn && drawOpenManageBtn.dataset.oracleBound !== '1') {
            drawOpenManageBtn.dataset.oracleBound = '1';
            drawOpenManageBtn.addEventListener('click', openManageView);
        }

        if (drawDetailBackdrop && drawDetailBackdrop.dataset.oracleBound !== '1') {
            drawDetailBackdrop.dataset.oracleBound = '1';
            drawDetailBackdrop.addEventListener('click', closeDrawDetail);
        }

        if (drawDetailCloseBtn && drawDetailCloseBtn.dataset.oracleBound !== '1') {
            drawDetailCloseBtn.dataset.oracleBound = '1';
            drawDetailCloseBtn.addEventListener('click', closeDrawDetail);
        }

        if (drawSendBtn && drawSendBtn.dataset.oracleBound !== '1') {
            drawSendBtn.dataset.oracleBound = '1';
            drawSendBtn.addEventListener('click', handleDrawSend);
        }

        if (drawResetBtn && drawResetBtn.dataset.oracleBound !== '1') {
            drawResetBtn.dataset.oracleBound = '1';
            drawResetBtn.addEventListener('click', handleDrawReset);
        }

        if (drawFan && drawFan.dataset.oracleBound !== '1') {
            drawFan.dataset.oracleBound = '1';
            drawFan.addEventListener('pointerdown', onDrawFanPointerDown);
            drawFan.addEventListener('pointermove', onDrawFanPointerMove);
            drawFan.addEventListener('pointerup', endDrawFanDrag);
            drawFan.addEventListener('pointercancel', endDrawFanDrag);
            drawFan.addEventListener('lostpointercapture', endDrawFanDrag);
        }

        if (drawFanZone && drawFanZone.dataset.oracleBound !== '1') {
            drawFanZone.dataset.oracleBound = '1';
            drawFanZone.addEventListener('wheel', onDrawFanWheel, { passive: false });
        }

        if (!window.__chatOracleDrawResizeBound) {
            window.__chatOracleDrawResizeBound = true;
            window.addEventListener('resize', layoutDrawFan);
        }

        if (clearBtn && clearBtn.dataset.oracleBound !== '1') {
            clearBtn.dataset.oracleBound = '1';
            clearBtn.addEventListener('click', clearCurrentMappings);
        }

        renderHomeSummary();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindEvents);
    } else {
        bindEvents();
    }
})();
