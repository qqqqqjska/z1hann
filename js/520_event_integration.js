(function () {
    const EVENT_YEAR = 2026;
    const EVENT_MONTH = 5;
    const EVENT_DAYS = new Set([20, 21]);
    const HOST_ID = 'event-520-overlay-host';
    const ENTRY_SKIP_KEY = '520_event_skip_entry_overlay';
    const GOOGLE_FONT_HREF = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@200;400;600&display=swap';
    const LETTER_FONT_SOURCES = [
        { url: 'assets/fonts/520-letter.woff2', format: 'woff2' },
        { url: 'assets/fonts/520-letter.otf', format: 'opentype' },
        { url: 'assets/fonts/520-letter.ttf', format: 'truetype' }
    ];
    const LETTER_FONT_SRC = LETTER_FONT_SOURCES
        .map((item) => `url('${item.url}') format('${item.format}')`)
        .join(', ');
    const BGM_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    const GENERATED_STATE_KEY = 'generated520EventState';
    const EVENT_MEMORY_CARD_COUNT = 8;
    const LOADING_TEXT_DEFAULT = '正在寻找时空碎片';

    const memories = [
        {
            date: '2023.09.15',
            icon: '?',
            title: '????',
            enTitle: 'FIRST ENCOUNTER',
            desc: '?????????????????????????????????????????????????',
            quote: '??????????????????????'
        },
        {
            date: '2023.11.02',
            icon: '?',
            title: '????',
            enTitle: 'MIDNIGHT ECHOES',
            desc: '????????????????????????????????????????????????????',
            quote: '??????????????????'
        },
        {
            date: '2024.02.14',
            icon: '?',
            title: '?????',
            enTitle: 'SILENT SUPPORT',
            desc: '?????????????????????????????????????????????????',
            quote: '??????????????????'
        },
        {
            date: '2024.05.20',
            icon: '?',
            title: '?????',
            enTitle: 'ORDINARY MIRACLES',
            desc: '???????????????????????????????????????????',
            quote: '?????????????????'
        },
        {
            date: '2024.06.18',
            icon: '?',
            title: '????',
            enTitle: 'SLOWLY CLOSER',
            desc: '??????????????????????????????????????????????????????',
            quote: '??????????????????'
        },
        {
            date: '2024.08.09',
            icon: '?',
            title: '?????',
            enTitle: 'FIRST HEARTBEAT',
            desc: '?????????????????????????????????????????????????????',
            quote: '????????????????'
        },
        {
            date: '2024.10.03',
            icon: '?',
            title: '????',
            enTitle: 'LATE NIGHT MESSAGES',
            desc: '??????????????????????????????????????????????????',
            quote: '????????????????????'
        },
        {
            date: '2024.12.25',
            icon: '?',
            title: '??????',
            enTitle: 'WINTER WARMTH',
            desc: '???????????????????????????????????????????????',
            quote: '?????????????????'
        }
    ];

    const finalLetterText = [
        '<p>亲爱的你：</p>',
        '<p>在这个特别的日子里，我想带你走过这段属于我们的时空回廊。</p>',
        '<p>每一个画框里，都藏着我对你的心意和回忆。</p>',
        '<p>从最初的相遇，到如今的相伴，这一切都像是一场美好的奇迹。</p>',
        '<p>未来的路还很长，我希望能和你一起，继续在这漫长的岁月中收集更多的光。</p>',
        '<p>520快乐。</p>'
    ].join('');

    let letterFontRequested = false;

    function pickChatAiSettings() {
        if (typeof window.getPreferredChatAiSettings === 'function') {
            return window.getPreferredChatAiSettings() || {};
        }
        const primary = window.iphoneSimState && window.iphoneSimState.aiSettings
            ? window.iphoneSimState.aiSettings
            : {};
        const secondary = window.iphoneSimState && window.iphoneSimState.aiSettings2
            ? window.iphoneSimState.aiSettings2
            : {};
        if (String(primary.url || '').trim() && String(primary.key || '').trim()) return primary;
        if (String(secondary.url || '').trim() && String(secondary.key || '').trim()) return secondary;
        return String(primary.url || '').trim() ? primary : secondary;
    }

    function normalizeOpenAiCompatibleUrl(rawUrl) {
        let value = String(rawUrl || '').trim();
        if (!value) return '';
        value = value.replace(/\/+$/, '');
        if (!/\/chat\/completions$/i.test(value)) {
            value += '/chat/completions';
        }
        return value;
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function stripCodeFences(text) {
        return String(text || '')
            .replace(/^\s*```(?:json)?/i, '')
            .replace(/```\s*$/i, '')
            .trim();
    }

    function extractFirstJsonObject(text) {
        const source = String(text || '').trim();
        const start = source.indexOf('{');
        if (start < 0) return source;
        let depth = 0;
        let inString = false;
        let escaped = false;
        for (let index = start; index < source.length; index += 1) {
            const char = source[index];
            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (char === '\\') {
                    escaped = true;
                } else if (char === '"') {
                    inString = false;
                }
                continue;
            }
            if (char === '"') {
                inString = true;
                continue;
            }
            if (char === '{') {
                depth += 1;
                continue;
            }
            if (char === '}') {
                depth -= 1;
                if (depth === 0) {
                    return source.slice(start, index + 1);
                }
            }
        }
        return source;
    }

    function safeJsonParse(text) {
        const cleaned = extractFirstJsonObject(stripCodeFences(text));
        return JSON.parse(cleaned);
    }

    function sanitizeLetterHtml(inputHtml) {
        const raw = String(inputHtml || '').trim();
        if (!raw) return finalLetterText;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = raw;
        const paragraphs = [];
        const allowedTags = new Set(['P', 'BR']);

        function sanitizeNode(node) {
            if (!node) return '';
            if (node.nodeType === Node.TEXT_NODE) {
                return escapeHtml(node.textContent || '');
            }
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return '';
            }
            const tag = String(node.tagName || '').toUpperCase();
            if (!allowedTags.has(tag)) {
                return Array.from(node.childNodes || []).map(sanitizeNode).join('');
            }
            if (tag === 'BR') return '<br>';
            return Array.from(node.childNodes || []).map(sanitizeNode).join('');
        }

        Array.from(wrapper.childNodes || []).forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = String(node.textContent || '').trim();
                if (text) {
                    paragraphs.push(`<p>${escapeHtml(text)}</p>`);
                }
                return;
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            const tag = String(node.tagName || '').toUpperCase();
            if (tag === 'P') {
                const content = Array.from(node.childNodes || []).map(sanitizeNode).join('').trim();
                if (content) paragraphs.push(`<p>${content}</p>`);
                return;
            }
            const content = sanitizeNode(node).trim();
            if (content) paragraphs.push(`<p>${content}</p>`);
        });

        return paragraphs.length ? paragraphs.join('') : finalLetterText;
    }

    function summarizeMessage(message, contactName, userName) {
        if (!message || typeof message !== 'object') return '';
        const type = String(message.type || 'text');
        const role = String(message.role || 'assistant');
        const speaker = role === 'user' ? (userName || '用户') : (contactName || '联系人');
        if (type !== 'text') {
            const typeMap = {
                image: '[图片]',
                virtual_image: '[图片]',
                voice: '[语音]',
                sticker: '[表情]',
                transfer: '[转账]',
                location: '[位置]',
                video: '[视频]'
            };
            return `${speaker}: ${typeMap[type] || `[${type}]`}`;
        }
        return `${speaker}: ${String(message.content || '').trim()}`;
    }

    function getContactMemoriesForEvent(contactId) {
        const allMemories = Array.isArray(window.iphoneSimState && window.iphoneSimState.memories)
            ? window.iphoneSimState.memories
            : [];
        return allMemories
            .filter((memory) => String(memory && memory.contactId || '') === String(contactId))
            .sort((a, b) => Number(a && a.time || 0) - Number(b && b.time || 0));
    }

    function buildAllMemoriesText(contactId) {
        const memoriesForContact = getContactMemoriesForEvent(contactId);
        if (!memoriesForContact.length) return '无';
        return memoriesForContact.map((memory) => {
            const ts = Number(memory && memory.time || 0);
            const date = Number.isFinite(ts) && ts > 0 ? new Date(ts) : null;
            const dateStr = date
                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                : '未知时间';
            const tags = Array.isArray(memory && memory.memoryTags) && memory.memoryTags.length
                ? ` [${memory.memoryTags.join(', ')}]`
                : '';
            return `- ${dateStr}${tags} ${String(memory && memory.content || '').trim()}`;
        }).join('\n');
    }

    function buildWorldbookText(contact) {
        const linkedIds = Array.isArray(contact && contact.linkedWbCategories)
            ? contact.linkedWbCategories
            : [];
        if (!linkedIds.length) return '无';
        const worldbook = Array.isArray(window.iphoneSimState && window.iphoneSimState.worldbook)
            ? window.iphoneSimState.worldbook
            : [];
        const active = worldbook.filter((entry) => {
            if (!entry || entry.enabled !== true) return false;
            return linkedIds.includes(entry.categoryId);
        });
        if (!active.length) return '无';
        return active.map((entry) => String(entry.content || '').trim()).filter(Boolean).join('\n');
    }

    function getUserPersonaInfo(contact) {
        const userPersonas = Array.isArray(window.iphoneSimState && window.iphoneSimState.userPersonas)
            ? window.iphoneSimState.userPersonas
            : [];
        const preferredPersonaId = contact && contact.userPersonaId
            ? contact.userPersonaId
            : (window.iphoneSimState && window.iphoneSimState.currentUserPersonaId);
        const persona = preferredPersonaId
            ? userPersonas.find((item) => String(item && item.id) === String(preferredPersonaId))
            : (userPersonas[0] || null);
        const userProfile = window.iphoneSimState && window.iphoneSimState.userProfile
            ? window.iphoneSimState.userProfile
            : {};
        const userName = String(
            (persona && persona.name)
            || userProfile.name
            || '用户'
        ).trim() || '用户';
        const userPrompt = String(
            (contact && contact.userPersonaPromptOverride)
            || (persona && persona.aiPrompt)
            || ''
        ).trim();
        return {
            userName,
            userPrompt: userPrompt || '无'
        };
    }

    function buildRecentContextText(contact, history, userName) {
        const limit = Number(contact && contact.contextLimit || 0) > 0
            ? Number(contact.contextLimit)
            : 50;
        const items = (Array.isArray(history) ? history : [])
            .filter((item) => {
                if (typeof window.shouldExcludeFromAiContext === 'function') {
                    return !window.shouldExcludeFromAiContext(item);
                }
                return true;
            })
            .slice(-limit)
            .map((item) => summarizeMessage(item, contact && (contact.remark || contact.name), userName))
            .filter(Boolean);
        return items.length ? items.join('\n') : '无';
    }

    function extractJsonContent(responseData) {
        if (!responseData || !Array.isArray(responseData.choices) || !responseData.choices[0]) {
            return '';
        }
        const message = responseData.choices[0].message || {};
        if (typeof message.content === 'string') return message.content;
        if (Array.isArray(message.content)) {
            return message.content
                .map((part) => {
                    if (!part) return '';
                    if (typeof part.text === 'string') return part.text;
                    if (typeof part.content === 'string') return part.content;
                    return '';
                })
                .join('\n')
                .trim();
        }
        return '';
    }

    function normalizeGeneratedMemories(rawMemories) {
        const list = Array.isArray(rawMemories) ? rawMemories : [];
        return Array.from({ length: EVENT_MEMORY_CARD_COUNT }, (_, index) => {
            const fallback = memories[index] || {};
            const item = list[index] || {};
            const fallbackTitle = `???? ${index + 1}`;
            return {
                date: String(item.date || fallback.date || '').trim() || `?? ${index + 1}`,
                icon: String(item.icon || fallback.icon || '').trim() || fallback.icon || '?',
                title: String(item.title || fallback.title || '').trim() || fallbackTitle,
                enTitle: String(item.enTitle || fallback.enTitle || '').trim() || fallbackTitle.toUpperCase(),
                desc: String(item.event || item.desc || item.content || fallback.desc || '').trim() || '???????????????',
                quote: String(item.view || item.quote || item.opinion || fallback.quote || '').trim() || '???????????????'
            };
        });
    }

    function normalizeGeneratedSong(rawSong) {
        if (!rawSong || typeof rawSong !== 'object') {
            return {
                keyword: '',
                title: '',
                artist: '',
                reason: ''
            };
        }
        const title = String(rawSong.title || '').trim();
        const artist = String(rawSong.artist || '').trim();
        const keyword = String(rawSong.keyword || (title && artist ? `${title} ${artist}` : title || artist) || '').trim();
        return {
            keyword,
            title,
            artist,
            reason: String(rawSong.reason || '').trim()
        };
    }

    function normalizeGeneratedState(payload) {
        const safe = payload && typeof payload === 'object' ? payload : {};
        const normalizedMemories = normalizeGeneratedMemories(safe.memories);
        const song = normalizeGeneratedSong(safe.song);
        const letterTitle = String(safe.letterTitle || 'To You').trim() || 'To You';
        const signature = String(safe.signature || '- 专属你的联系人').trim() || '- 专属你的联系人';
        const signatureDate = String(safe.signatureDate || '2026.05.20').trim() || '2026.05.20';
        return {
            memories: normalizedMemories.length ? normalizedMemories : memories.map((item) => Object.assign({}, item)),
            letterTitle,
            letterHtml: sanitizeLetterHtml(safe.letterHtml || safe.letter || ''),
            signature,
            signatureDate,
            song,
            generatedAt: Date.now()
        };
    }

    function buildHiddenLetterContextPayload(state, options = {}) {
        const allowFallback = options && options.allowFallback === true;
        const letterTitle = String((state && state.letterTitle) || 'To You').trim() || 'To You';
        const signature = String((state && state.signature) || '- ???????').trim() || '- ???????';
        const signatureDate = String((state && state.signatureDate) || '2026.05.20').trim() || '2026.05.20';
        const rawLetterHtml = String((state && (state.letterHtml || state.letter)) || '').trim();
        const sourceHtml = rawLetterHtml || (allowFallback ? finalLetterText : '');
        if (!sourceHtml) return '';
        const letterText = String(sourceHtml)
            .replace(/<p[^>]*>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        return [
            '?520 ??????',
            '???? 520 ????????????? AI ????????????????????????????',
            '???' + letterTitle,
            '???' + signature,
            '???' + signatureDate,
            letterText ? '???\n' + letterText : ''
        ].filter(Boolean).join('\n');
    }

    function upsertHidden520LetterContextMessage(contactId, state, options = {}) {
        const cid = String(contactId || '').trim();
        if (!cid || !window.iphoneSimState || !window.iphoneSimState.chatHistory) return null;
        const payload = buildHiddenLetterContextPayload(state, options);
        if (!payload) return null;
        if (!Array.isArray(window.iphoneSimState.chatHistory[cid])) {
            window.iphoneSimState.chatHistory[cid] = [];
        }

        const history = window.iphoneSimState.chatHistory[cid];
        window.iphoneSimState.chatHistory[cid] = history.filter((msg) => !(msg && msg.type === '520_letter_context_hidden'));

        const hiddenMsg = {
            id: String(Date.now()) + Math.random().toString(36).slice(2, 9),
            time: Date.now(),
            role: 'system',
            type: '520_letter_context_hidden',
            hiddenFromUi: true,
            includeInAiContext: true,
            content: payload,
            metaType: '520_letter_context',
            meta: {
                letterTitle: String((state && state.letterTitle) || '').trim(),
                signature: String((state && state.signature) || '').trim(),
                signatureDate: String((state && state.signatureDate) || '').trim()
            }
        };

        window.iphoneSimState.chatHistory[cid].push(hiddenMsg);
        if (typeof saveConfig === 'function') saveConfig();
        return hiddenMsg;
    }

    async function generate520EventContent(contactId) {
        const cid = String(contactId || '').trim();
        if (!cid) throw new Error('missing_contact');

        const contact = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts.find((item) => String(item && item.id) === cid)
            : null;
        if (!contact) throw new Error('contact_not_found');

        const settings = pickChatAiSettings();
        const fetchUrl = normalizeOpenAiCompatibleUrl(settings.url);
        const cleanKey = String(settings.key || '').replace(/[^\x00-\x7F]/g, '').trim();
        if (!fetchUrl || !cleanKey || !String(settings.model || '').trim()) {
            throw new Error('missing_ai_settings');
        }

        const history = Array.isArray(window.iphoneSimState && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[cid])
            ? window.iphoneSimState.chatHistory[cid]
            : [];
        const { userName, userPrompt } = getUserPersonaInfo(contact);
        const contactName = String(contact.remark || contact.name || '联系人').trim() || '联系人';
        const contactPersona = String(contact.persona || '').trim() || '无';
        const worldbookText = buildWorldbookText(contact);
        const recentContext = buildRecentContextText(contact, history, userName);
        const allMemoriesText = buildAllMemoriesText(cid);

        const systemPrompt = [
            '你是一个 520 时空回廊内容生成器。',
            '你要基于两人的关系与上下文，产出一组带情感递进的内容。',
            '今天是 2026年5月20日，请围绕 520 氛围来写，但必须贴合给定设定与记忆。',
            '输出必须是严格 JSON，不要使用 Markdown 代码块，不要输出额外解释。',
            '歌曲必须是真实存在、可搜索到的歌曲，不要编造。',
            '歌曲风格尽量选择更感性、细腻、偏抒情、能体现暧昧或深情共鸣的作品，避免过于吵闹、过于热血或过于轻佻的歌。'
        ].join('\n');

        const userPromptText = [
            `联系人名称：${contactName}`,
            `联系人设：${contactPersona}`,
            `用户名称：${userName}`,
            `用户人设：${userPrompt}`,
            `关联的世界书：\n${worldbookText}`,
            `聊天设置中的上下文条数限制：${Number(contact.contextLimit || 0) > 0 ? Number(contact.contextLimit) : 50}`,
            `最近聊天消息上下文：\n${recentContext}`,
            `该联系人全部“记忆”内容：\n${allMemoriesText}`,
            '请生成以下内容：',
            `1. ${EVENT_MEMORY_CARD_COUNT}??????????????????????????`,
            '2. 每段都要包含：date、icon、title、enTitle、event、view。',
            '3. 其中 event 是这段事件本身，view 是联系人对这段事的看法/感受，适合直接展示在翻转卡背面。',
            '4. 生成一封联系人的来信，输出为可直接塞进 HTML 的 letterHtml，只允许使用 <p> 标签。',
            '5. 生成 letterTitle、signature、signatureDate。',
            '6. 生成一首符合二人关系与氛围的真实歌曲，整体倾向感性、细腻、抒情、有后劲，输出 keyword、title、artist、reason。keyword 用于搜歌，最好带歌名和歌手。',
            '返回 JSON 格式如下：',
            '{',
            '  "memories": [',
            '    {',
            '      "date": "2024.05.20",',
            '      "icon": "✦",',
            '      "title": "标题",',
            '      "enTitle": "EN TITLE",',
            '      "event": "事件描述",',
            '      "view": "联系人对此的看法" ',
            '    }',
            '  ],',
            '  "letterTitle": "To You",',
            '  "letterHtml": "<p>...</p><p>...</p>",',
            '  "signature": "- 专属你的联系人",',
            '  "signatureDate": "2026.05.20",',
            '  "song": {',
            '    "keyword": "歌名 歌手",',
            '    "title": "歌名",',
            '    "artist": "歌手",',
            '    "reason": "推荐原因"',
            '  }',
            '}'
        ].join('\n');

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify({
                model: settings.model,
                temperature: Number.isFinite(Number(settings.temperature)) ? Number(settings.temperature) : 0.8,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPromptText }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`api_http_${response.status}`);
        }

        const data = await response.json();
        const content = extractJsonContent(data);
        if (!content) {
            throw new Error('empty_ai_content');
        }
        return normalizeGeneratedState(safeJsonParse(content));
    }

    function isEventDate(now = new Date()) {
        if (!(now instanceof Date) || Number.isNaN(now.getTime())) return false;
        return now.getFullYear() === EVENT_YEAR
            && now.getMonth() + 1 === EVENT_MONTH
            && EVENT_DAYS.has(now.getDate());
    }

    function getExistingHost() {
        return document.getElementById(HOST_ID);
    }

    function getSkipPreference() {
        try {
            return window.localStorage.getItem(ENTRY_SKIP_KEY) === '1';
        } catch (error) {
            return false;
        }
    }

    function setSkipPreference(enabled) {
        try {
            window.localStorage.setItem(ENTRY_SKIP_KEY, enabled ? '1' : '0');
        } catch (error) {
            // Ignore storage failures in private mode or restricted environments.
        }
    }

    function ensureLetterFontLoaded() {
        if (letterFontRequested || !('FontFace' in window)) return;
        letterFontRequested = true;

        const remoteLetterFont = new FontFace(
            'CustomLetterFont',
            LETTER_FONT_SRC
        );

        remoteLetterFont.load().then((loadedFace) => {
            if (document.fonts && typeof document.fonts.add === 'function') {
                document.fonts.add(loadedFace);
            }
        }).catch(() => {
            // Fallback to the @font-face declaration inside the shadow root.
        });
    }

    function getStyleText() {
        return String.raw`
@font-face {
    font-family: 'CustomLetterFont';
    src: local('CustomLetterFont'),
         ${LETTER_FONT_SRC};
    font-style: normal;
    font-weight: 400;
    font-display: swap;
}

:host {
    --bg-color: #050505;
    --text-main: #f0f0f0;
    --text-dim: #888888;
    --accent: #ffffff;
    --glass-bg: rgba(255, 255, 255, 0.05);
    --glass-border: rgba(255, 255, 255, 0.15);
    --font-en: 'Montserrat', sans-serif;
    --font-serif: 'Cormorant Garamond', serif;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    user-select: none;
}

.event-page {
    position: relative;
    isolation: isolate;
    background-color: transparent;
    color: var(--text-main);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    overflow: hidden;
    width: 100vw;
    height: 100vh;
}

.event-page.scene-active {
    background-color: var(--bg-color);
}

.bg-decorations {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    overflow: hidden;
}

.ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.03);
    pointer-events: none;
}

.ring-1 {
    width: 120vh;
    height: 120vh;
    top: -10vh;
    left: -20vh;
}

.ring-2 {
    width: 80vh;
    height: 80vh;
    bottom: -20vh;
    right: -10vh;
}

.ring-3 {
    width: 200vh;
    height: 200vh;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border: 1px dashed rgba(255, 255, 255, 0.02);
    animation: rotateSlow 120s linear infinite;
}

@keyframes rotateSlow {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
}

.bg-text {
    position: absolute;
    font-family: var(--font-en);
    font-size: 8vw;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.02);
    white-space: nowrap;
    letter-spacing: 0.1em;
}

.bg-text-top {
    top: 10%;
    left: 5%;
}

.bg-text-bottom {
    bottom: 10%;
    right: 5%;
}

.grid-overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px);
    background-size: 50px 50px;
    z-index: 0;
}

#gallery-container {
    position: relative;
    width: 100%;
    height: 100%;
}

#scroll-area {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    display: flex;
    align-items: center;
    transition: transform 0.1s linear;
    padding-left: 50vw;
}

.start-marker {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 150px;
    position: relative;
}

.start-marker-glow {
    position: absolute;
    bottom: -85px;
    left: -85px;
    width: 160px;
    height: 40px;
    background: radial-gradient(ellipse at center, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%);
    border-radius: 50%;
    filter: blur(5px);
    opacity: 1;
    transition: opacity 0.5s ease;
    z-index: 0;
}

.start-marker.inactive .start-marker-glow {
    opacity: 0;
}

.marker-line {
    height: 100px;
    width: 1px;
    background: var(--text-dim);
    margin-bottom: 20px;
    z-index: 1;
}

.marker-text {
    font-family: var(--font-en);
    letter-spacing: 0.2em;
    font-size: 14px;
    color: var(--text-dim);
}

#frames-wrapper {
    display: flex;
    align-items: center;
    gap: 300px;
    padding-right: 300px;
}

.memory-frame {
    width: 280px;
    height: 400px;
    position: relative;
    cursor: pointer;
    margin-top: -15vh;
    perspective: 1000px;
}

.frame-inner {
    width: 100%;
    height: 100%;
    position: relative;
    transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    transform-style: preserve-3d;
}

.memory-frame.flipped .frame-inner {
    transform: rotateY(180deg);
}

.memory-frame:hover .frame-inner {
    transform: translateY(-10px) scale(1.02);
}

.memory-frame.flipped:hover .frame-inner {
    transform: rotateY(180deg) translateY(-10px) scale(1.02);
}

.frame-front, .frame-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--glass-border);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    z-index: 1;
}

.frame-front {
    justify-content: space-between;
    padding: 30px;
}

.frame-back {
    transform: rotateY(180deg);
    position: relative;
    overflow: hidden;
    display: block;
    padding: 0;
    text-align: left;
    pointer-events: auto;
}

.memory-frame:not(.flipped) .frame-back {
    pointer-events: none;
}

.memory-frame.flipped .frame-front {
    pointer-events: none;
}

.memory-frame.flipped .frame-back {
    pointer-events: auto;
}

.frame-front::after, .frame-back::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%);
    pointer-events: none;
    border-radius: 4px;
}

.frame-top {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-en);
    font-size: 12px;
    color: var(--text-dim);
    letter-spacing: 2px;
}

.frame-center {
    text-align: center;
    z-index: 2;
}

.frame-icon {
    font-size: 32px;
    margin-bottom: 20px;
    color: rgba(255,255,255,0.8);
}

.frame-title {
    font-size: 20px;
    font-weight: 400;
    letter-spacing: 2px;
}

.frame-bottom {
    text-align: center;
    font-family: var(--font-en);
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 3px;
}

.frame-glow {
    position: absolute;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
    top: 0;
    left: 0;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
    filter: blur(20px);
}

.memory-frame:hover .frame-glow {
    opacity: 1;
}

.frame-back::before {
    content: '"';
    position: absolute;
    top: 10px;
    left: 20px;
    font-family: var(--font-serif);
    font-size: 180px;
    color: rgba(255,255,255,0.03);
    line-height: 1;
    z-index: 0;
    pointer-events: none;
}

.back-scroll-layer {
    position: absolute;
    inset: 0;
    z-index: 2;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    touch-action: pan-y;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.28) transparent;
    padding: 40px 30px;
    pointer-events: auto;
}

.back-scroll-layer::-webkit-scrollbar {
    width: 4px;
}

.back-scroll-layer::-webkit-scrollbar-track {
    background: transparent;
}

.back-scroll-layer::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.28);
    border-radius: 999px;
}

.back-scroll-layer::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.5);
}

.back-content-wrapper {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    width: 100%;
    min-height: 100%;
    gap: 0;
    pointer-events: auto;
}

.back-date {
    font-family: var(--font-en);
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 2px;
    margin-bottom: 25px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding-bottom: 10px;
    width: 80%;
    margin-left: auto;
    margin-right: auto;
}

.back-desc {
    font-size: 13px;
    line-height: 1.9;
    color: #ddd;
    margin-bottom: 30px;
    text-align: justify;
    white-space: pre-wrap;
    word-break: break-word;
}

.back-quote {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 15px;
    line-height: 1.6;
    color: #fff;
    position: relative;
    padding: 15px;
    border-top: 1px dashed rgba(255,255,255,0.15);
    width: 90%;
    margin-left: auto;
    margin-right: auto;
}

.spotlight {
    position: absolute;
    top: -50vh;
    left: 50%;
    transform: translateX(-50%);
    width: 400px;
    height: 120vh;
    background: radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0) 70%);
    clip-path: polygon(35% 0, 65% 0, 100% 100%, 0% 100%);
    filter: blur(15px);
    opacity: 0;
    transition: opacity 0.6s ease;
    pointer-events: none;
    z-index: 2;
}

.memory-frame.active .spotlight {
    opacity: 1;
}

.particles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
}

.particle {
    position: absolute;
    background: #fff;
    border-radius: 50%;
    opacity: 0;
    animation: floatParticle 8s infinite linear;
}

@keyframes floatParticle {
    0% { transform: translateY(0) scale(0.5); opacity: 0; }
    20% { opacity: 0.6; }
    80% { opacity: 0.6; }
    100% { transform: translateY(-100px) scale(1); opacity: 0; }
}

.end-trigger {
    width: 300px;
    height: 400px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 100px;
    margin-right: 50vw;
}

.door {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.door:hover {
    transform: scale(1.05);
}

.door-light {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
    box-shadow: 0 0 40px rgba(255,255,255,0.5);
    margin-bottom: 30px;
    animation: pulse 2s infinite alternate;
}

@keyframes pulse {
    from { transform: scale(0.9); opacity: 0.8; }
    to { transform: scale(1.2); opacity: 1; }
}

.door-text {
    font-family: var(--font-en);
    letter-spacing: 4px;
    font-size: 12px;
    color: var(--text-dim);
}

#character {
    position: absolute;
    bottom: 30%;
    left: 50vw;
    transform: translateX(-50%);
    width: 60px;
    height: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    z-index: 10;
}

.char-svg {
    transition: transform 0.1s;
}

.char-shadow {
    width: 40px;
    height: 6px;
    background: rgba(0,0,0,0.5);
    border-radius: 50%;
    margin-top: -4px;
    filter: blur(2px);
}

@keyframes walkLeft {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}

@keyframes legSwing {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
}

.walking .char-svg {
    animation: walkLeft 0.3s infinite;
}

.walking .left-leg {
    animation: legSwing 0.3s infinite alternate;
}

.walking .right-leg {
    animation: legSwing 0.3s infinite alternate-reverse;
}

.facing-left .char-svg {
    transform: scaleX(-1);
}

.controls {
    position: fixed;
    bottom: 30px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    padding: 0 40px;
    z-index: 20;
}

.control-btn {
    font-family: var(--font-en);
    font-size: 12px;
    letter-spacing: 2px;
    cursor: pointer;
    padding: 10px 20px;
    border: 1px solid var(--glass-border);
    border-radius: 20px;
    background: var(--glass-bg);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 10px;
    color: inherit;
}

.control-btn:hover, .control-btn:active {
    background: rgba(255,255,255,0.2);
    color: #fff;
}

.entry-skip-row {
    margin-top: 18px;
    text-align: center;
}

.entry-skip-row label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-en);
    font-size: 12px;
    letter-spacing: 1px;
    color: var(--text-dim);
    cursor: pointer;
}

.entry-skip-row input {
    width: 14px;
    height: 14px;
    cursor: pointer;
}

.instruction {
    position: fixed;
    top: 50px;
    width: 100%;
    text-align: center;
    z-index: 20;
    pointer-events: none;
    opacity: 0.7;
    transition: opacity 1s;
}

.instruction.fade-out {
    opacity: 0;
}

.instruction p {
    font-size: 14px;
    margin-bottom: 5px;
    letter-spacing: 1px;
}

.instruction .en-inst {
    font-family: var(--font-en);
    font-size: 10px;
    color: var(--text-dim);
}

.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
    opacity: 1;
    transition: opacity 0.4s ease, visibility 0.4s;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.overlay.hidden {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
}

#event-loading-overlay {
    z-index: 160;
}

.event-loading-card {
    width: min(360px, 86vw);
    padding: 30px 26px;
    text-align: center;
}

.event-loading-spinner {
    width: 36px;
    height: 36px;
    margin: 0 auto 18px auto;
    border: 2px solid rgba(255, 255, 255, 0.18);
    border-top-color: rgba(255, 255, 255, 0.95);
    border-radius: 50%;
    animation: eventLoadingSpin 0.9s linear infinite;
}

.event-loading-text {
    font-family: var(--font-en);
    font-size: 15px;
    letter-spacing: 2px;
    color: #fff;
}

.event-loading-subtext {
    margin-top: 10px;
    font-size: 12px;
    line-height: 1.7;
    color: var(--text-dim);
}

@keyframes eventLoadingSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.end-choice-panel {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.end-choice-panel.hidden {
    display: none;
}

.end-choice-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
}

.warp-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000;
    z-index: 90;
    perspective: 1000px;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 1;
    transition: opacity 1.5s ease;
}

.warp-overlay.hidden {
    opacity: 0;
    pointer-events: none;
}

.warp-overlay .stars {
    position: absolute;
    width: 2px;
    height: 2px;
    background: transparent;
    box-shadow:
        0 0 0 2px #fff,
        100px -200px 0 2px #fff,
        -150px 300px 0 1px #fff,
        300px 100px 0 3px #fff,
        -250px -100px 0 2px #fff,
        200px 250px 0 1px #fff,
        -300px -250px 0 2px #fff,
        150px -350px 0 1px #fff;
    border-radius: 50%;
    animation: warp 1s infinite linear;
    transform-style: preserve-3d;
}

.warp-overlay.active .stars {
    animation-play-state: running;
}

.warp-overlay:not(.active) .stars {
    animation-play-state: paused;
    display: none;
}

@keyframes warp {
    0% { transform: translateZ(-1000px) scale(0.1); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateZ(1000px) scale(3); opacity: 0; }
}

.envelope-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: opacity 0.5s ease, transform 0.5s ease;
    cursor: pointer;
}

.envelope-container.hidden {
    opacity: 0;
    pointer-events: none;
    transform: translateY(50px) scale(0.9);
    position: absolute;
}

.envelope {
    position: relative;
    width: 300px;
    height: 200px;
    background: #e6e4df;
    border-radius: 4px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    transition: transform 0.3s ease;
}

.envelope:hover {
    transform: translateY(-10px);
}

.envelope-flap {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    clip-path: polygon(0 0, 50% 50%, 100% 0);
    background: #dcd9d2;
    z-index: 2;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: top;
    filter: drop-shadow(0 5px 5px rgba(0,0,0,0.1));
}

.envelope-body {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    clip-path: polygon(0 0, 0 100%, 100% 100%, 100% 0, 50% 45%);
    background: #f4f1eb;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.envelope-wax-seal {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    background: #990000;
    border-radius: 50%;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 14px;
    font-family: var(--font-en);
    box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 0 5px 10px rgba(0,0,0,0.3);
    transition: opacity 0.3s ease;
}

.envelope-text {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    font-family: var(--font-en);
    letter-spacing: 4px;
    color: #888;
    font-size: 12px;
}

.envelope-container.opening .envelope-flap {
    transform: rotateX(180deg);
}

.envelope-container.opening .envelope-wax-seal {
    opacity: 0;
}

.envelope-instruction {
    margin-top: 40px;
    color: #fff;
    font-size: 14px;
    letter-spacing: 2px;
    animation: pulseText 2s infinite alternate;
}

@keyframes pulseText {
    0% { opacity: 0.5; }
    100% { opacity: 1; }
}

.letter-wrapper {
    width: 90%;
    max-width: 600px;
    height: 80vh;
    transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    opacity: 1;
    transform: translateY(0) scale(1);
    position: relative;
}

.letter-wrapper.hidden {
    opacity: 0;
    pointer-events: none;
    transform: translateY(100px) scale(0.8);
    position: absolute;
}

.paper-texture {
    width: 100%;
    height: 100%;
    background-color: #fcfbf9;
    background-image: linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px);
    background-size: 100% 30px;
    border-radius: 2px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.7);
    padding: 60px 50px;
    color: #333;
    overflow-y: auto;
    position: relative;
    border: 1px solid #e0dfdc;
}


.letter-wrapper .close-btn {
    top: -40px;
    right: 0;
    color: #fff;
}

.letter-title {
    font-family: 'CustomLetterFont', "PingFang SC", sans-serif !important;
    font-size: 28px;
    letter-spacing: 2px;
    margin-bottom: 40px;
    font-weight: 400;
    color: #111;
    text-align: center;
}

.letter-content, .letter-content p, .letter-content * {
    font-size: 20px;
    line-height: 30px;
    text-align: left;
    color: #333;
    font-family: 'CustomLetterFont', "PingFang SC", "Microsoft YaHei", serif !important;
}

.letter-content {
    margin-bottom: 60px;
}

.letter-content p {
    margin-bottom: 15px;
    text-indent: 2em;
}

.letter-signature {
    text-align: right;
    font-size: 22px;
    color: #222;
    margin-top: 50px;
    font-family: 'CustomLetterFont', "PingFang SC", "Microsoft YaHei", serif !important;
}

.signature-date {
    font-family: var(--font-en);
    font-size: 14px;
    color: #666;
    display: block;
    margin-top: 10px;
}

.paper-texture::-webkit-scrollbar {
    width: 6px;
}

.paper-texture::-webkit-scrollbar-track {
    background: transparent;
}

.paper-texture::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.1);
    border-radius: 3px;
}

.close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    background: none;
    border: none;
    color: var(--text-dim);
    font-size: 18px;
    cursor: pointer;
    transition: color 0.2s;
}

.close-btn:hover {
    color: #fff;
}

.frosted-glass {
    background: var(--glass-bg);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.35);
}

.music-card {
    position: absolute;
    bottom: 200px;
    left: 50%;
    transform: translateX(-50%);
    width: 260px;
    height: 70px;
    background: var(--glass-bg);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--glass-border);
    border-radius: 35px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 15px 5px 10px;
    z-index: 10;
}

.vinyl-record {
    width: 50px;
    height: 50px;
    background: radial-gradient(circle, #222 30%, #000 70%);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
    background-image: repeating-radial-gradient(#111, #111 2px, #222 3px, #222 4px);
    animation: spinVinyl 4s linear infinite;
    animation-play-state: paused;
    flex-shrink: 0;
}

.vinyl-record.playing {
    animation-play-state: running;
}

.vinyl-center {
    width: 15px;
    height: 15px;
    background: #ff5555;
    border-radius: 50%;
    border: 2px solid #111;
    display: flex;
    justify-content: center;
    align-items: center;
}

.vinyl-center::after {
    content: '';
    width: 3px;
    height: 3px;
    background: #000;
    border-radius: 50%;
}

@keyframes spinVinyl {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.music-info {
    margin-left: 15px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-family: var(--font-en);
    flex-grow: 1;
}

.song-title {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    letter-spacing: 1px;
    margin-bottom: 2px;
}

.song-artist {
    font-size: 9px;
    color: var(--text-dim);
    letter-spacing: 1px;
}

.play-btn {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.3);
    background: rgba(255,255,255,0.05);
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 12px;
    flex-shrink: 0;
}

.play-btn:hover {
    background: rgba(255,255,255,0.2);
}

.control-btn:disabled,
.play-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    pointer-events: none;
}

@media (max-width: 600px) {
    .bg-text { font-size: 12vw; }
    .controls { padding: 0 20px; }
    .memory-frame { width: 240px; height: 360px; }
    #frames-wrapper { gap: 150px; padding-right: 150px; }
    .letter-wrapper { padding: 0; height: 85vh; }
    .paper-texture { padding: 40px 20px; }
    .envelope { width: 260px; height: 180px; }

    .music-card {
        bottom: 200px;
        width: 240px;
        top: -70px;
        left: -10px;
    }
}
`;
    }

    function getMarkup() {
        return `
<div class="event-page">
    <div id="entry-overlay" class="overlay">
        <div class="frosted-glass" style="text-align: center; max-width: 400px; padding: 50px;">
            <h2 style="font-family: var(--font-en); letter-spacing: 2px; margin-bottom: 10px;">TIME CORRIDOR</h2>
            <div style="font-size: 14px; color: var(--text-dim); margin-bottom: 40px; letter-spacing: 3px;">520 特别彩蛋</div>
            <p style="font-size: 16px; margin-bottom: 40px; line-height: 1.8;">捕捉到时空回廊入口，是否进入？</p>
            <div style="display: flex; justify-content: center; gap: 20px;">
                <button id="btn-enter-yes" class="control-btn" style="padding: 12px 30px; font-size: 14px; color: #fff;">是 (YES)</button>
                <button id="btn-enter-no" class="control-btn" style="padding: 12px 30px; font-size: 14px; background: transparent; color: #fff;">否 (NO)</button>
            </div>
            <div class="entry-skip-row">
                <label for="entry-no-more">
                    <input type="checkbox" id="entry-no-more">
                    <span>不再弹出</span>
                </label>
            </div>
        </div>
    </div>

    <div id="event-loading-overlay" class="overlay hidden">
        <div class="frosted-glass event-loading-card">
            <div class="event-loading-spinner"></div>
            <div id="event-loading-text" class="event-loading-text">正在寻找时空碎片</div>
            <div id="event-loading-subtext" class="event-loading-subtext">请稍等一下，时空正在对齐...</div>
        </div>
    </div>

    <div id="warp-overlay" class="warp-overlay hidden">
        <div class="stars"></div>
    </div>

    <div class="bg-decorations" id="bg-decorations" style="opacity: 0; transition: opacity 2s ease;">
        <div class="ring ring-1"></div>
        <div class="ring ring-2"></div>
        <div class="ring ring-3"></div>
        <div class="bg-text bg-text-top">TIME CORRIDOR // 00:00:00</div>
        <div class="bg-text bg-text-bottom">ECHOES OF MEMORY ✦ 520</div>
        <div class="grid-overlay"></div>
        <div class="particles" id="particles"></div>
    </div>

    <div id="gallery-container" style="opacity: 0; transition: opacity 2s ease;">
        <div id="scroll-area">
            <div class="start-marker" id="start-marker">
                <div class="marker-line"></div>
                <div class="marker-text">START ✧</div>
                <div class="start-marker-glow"></div>

                <div class="music-card" id="music-card">
                    <div style="display: flex; align-items: center; flex-grow: 1;">
                        <div class="vinyl-record" id="vinyl-record">
                            <div class="vinyl-center"></div>
                        </div>
                        <div class="music-info">
                            <div id="music-song-title" class="song-title">Love Theme</div>
                            <div id="music-song-artist" class="song-artist">520 Special</div>
                        </div>
                    </div>
                    <button class="play-btn" id="play-btn">▶</button>
                    <audio id="bgm" src="${BGM_URL}" loop></audio>
                </div>
            </div>

            <div id="frames-wrapper"></div>

            <div id="end-trigger" class="end-trigger">
                <div class="door">
                    <div class="door-light"></div>
                    <div class="door-text">/// MESSAGE RECEIVED ///</div>
                </div>
            </div>
        </div>

        <div id="character">
            <div class="char-svg">
                <svg width="30" height="60" viewBox="0 0 30 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="15" cy="10" r="8" fill="#ffffff"></circle>
                    <rect x="8" y="22" width="14" height="20" rx="7" fill="#ffffff"></rect>
                    <rect class="leg left-leg" x="10" y="38" width="4" height="14" rx="2" fill="#ffffff"></rect>
                    <rect class="leg right-leg" x="16" y="38" width="4" height="14" rx="2" fill="#ffffff"></rect>
                </svg>
            </div>
            <div class="char-shadow"></div>
        </div>
    </div>

    <div class="controls" id="controls" style="opacity: 0; transition: opacity 2s ease;">
        <button class="control-btn" id="btn-left" type="button"><span>◁</span> WALK LEFT</button>
        <button class="control-btn" id="btn-right" type="button">WALK RIGHT <span>▷</span></button>
    </div>

    <div id="instruction" class="instruction" style="opacity: 0; transition: opacity 2s ease;">
        <p>控制人物移动</p>
        <p class="en-inst">Use [A] [D] or [←] [→] or screen buttons to move</p>
        <p class="en-inst">Click on frames to view memories</p>
    </div>

    <div id="letter-overlay" class="overlay hidden">
        <div id="envelope-view" class="envelope-container">
            <div class="envelope">
                <div class="envelope-body">
                    <div class="envelope-text">TO MY LOVE</div>
                </div>
                <div class="envelope-flap"></div>
                <div class="envelope-wax-seal">520</div>
            </div>
            <div class="envelope-instruction">点击拆开信件</div>
        </div>

        <div id="letter-view" class="letter-wrapper hidden">
            <button class="close-btn" id="close-letter" type="button">✕</button>
            <div class="paper-texture">
                <h2 id="letter-title" class="letter-title">To You</h2>
                <div class="letter-content" id="letter-content"></div>
                <div class="letter-signature">
                    <span id="letter-signature-text">- 专属你的联系人</span><br>
                    <span id="letter-signature-date" class="signature-date">2024.05.20</span>
                </div>
            </div>
        </div>

        <div id="end-choice-panel" class="end-choice-panel hidden">
            <div class="frosted-glass" style="text-align: center; max-width: 420px; padding: 42px 36px;">
                <div class="end-choice-actions">
                    <button id="btn-end-exit" class="control-btn" type="button" style="padding: 12px 28px; font-size: 14px; color: #fff;">退出</button>
                    <button id="btn-end-stay" class="control-btn" type="button" style="padding: 12px 28px; font-size: 14px; color: #fff;">停留</button>
                    <button id="btn-end-switch" class="control-btn" type="button" style="padding: 12px 28px; font-size: 14px; color: #fff;">切换时空（重新生成）</button>
                </div>
            </div>
        </div>
    </div>
</div>
`;
    }

    function createEventOverlay(contactId) {
        ensureLetterFontLoaded();
        const eventContactId = String(
            contactId
            || (window.iphoneSimState && window.iphoneSimState.currentChatContactId)
            || ''
        ).trim();

        const host = document.createElement('div');
        host.id = HOST_ID;
        host.style.position = 'fixed';
        host.style.inset = '0';
        host.style.zIndex = '2147483647';

        const shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
<link rel="stylesheet" href="${GOOGLE_FONT_HREF}">
<style>${getStyleText()}</style>
${getMarkup()}
`;

        const cleanupFns = [];
        let destroyed = false;
        let animationFrameId = 0;
        let envelopeTimeoutId = 0;
        let revealTimeoutId = 0;
        let recalcTimeoutId = 0;
        let loadingSyncTimerId = 0;
        let canMove = false;
        let hasStartedExperience = false;
        let isPlaying = false;
        let isMovingLeft = false;
        let isMovingRight = false;
        let scrollPos = 0;
        let maxScroll = 0;
        let isGenerating = false;
        let generatedState = normalizeGeneratedState({});

        const eventPage = shadow.querySelector('.event-page');
        const entryOverlay = shadow.getElementById('entry-overlay');
        const loadingOverlay = shadow.getElementById('event-loading-overlay');
        const loadingTextEl = shadow.getElementById('event-loading-text');
        const loadingSubtextEl = shadow.getElementById('event-loading-subtext');
        const warpOverlay = shadow.getElementById('warp-overlay');
        const btnEnterYes = shadow.getElementById('btn-enter-yes');
        const btnEnterNo = shadow.getElementById('btn-enter-no');
        const entryNoMore = shadow.getElementById('entry-no-more');
        const bgDecorations = shadow.getElementById('bg-decorations');
        const galleryContainer = shadow.getElementById('gallery-container');
        const controls = shadow.getElementById('controls');
        const instruction = shadow.getElementById('instruction');
        const bgm = shadow.getElementById('bgm');
        const playBtn = shadow.getElementById('play-btn');
        const vinylRecord = shadow.getElementById('vinyl-record');
        const musicSongTitle = shadow.getElementById('music-song-title');
        const musicSongArtist = shadow.getElementById('music-song-artist');
        const scrollArea = shadow.getElementById('scroll-area');
        const framesWrapper = shadow.getElementById('frames-wrapper');
        const character = shadow.getElementById('character');
        const startMarker = shadow.getElementById('start-marker');
        const particlesContainer = shadow.getElementById('particles');
        const letterOverlay = shadow.getElementById('letter-overlay');
        const endTrigger = shadow.getElementById('end-trigger');
        const letterTitleEl = shadow.getElementById('letter-title');
        const letterContent = shadow.getElementById('letter-content');
        const letterSignatureTextEl = shadow.getElementById('letter-signature-text');
        const letterSignatureDateEl = shadow.getElementById('letter-signature-date');
        const closeLetterBtn = shadow.getElementById('close-letter');
        const endChoicePanel = shadow.getElementById('end-choice-panel');
        const btnEndExit = shadow.getElementById('btn-end-exit');
        const btnEndStay = shadow.getElementById('btn-end-stay');
        const btnEndSwitch = shadow.getElementById('btn-end-switch');
        const btnLeft = shadow.getElementById('btn-left');
        const btnRight = shadow.getElementById('btn-right');
        const envelopeView = shadow.getElementById('envelope-view');
        const letterView = shadow.getElementById('letter-view');

        const frames = [];

        function addListener(target, type, handler, options) {
            if (!target) return;
            target.addEventListener(type, handler, options);
            cleanupFns.push(() => target.removeEventListener(type, handler, options));
        }

        function showToast(message, duration = 2600) {
            const text = String(message || '').trim();
            if (!text) return;
            if (typeof window.showChatToast === 'function') {
                window.showChatToast(text, duration);
                return;
            }
            console.warn(text);
        }

        function getExternalMusicAudio() {
            return document.getElementById('bg-music');
        }

        function stopMovement() {
            isMovingLeft = false;
            isMovingRight = false;
        }

        function syncMusicUi() {
            const externalAudio = getExternalMusicAudio();
            if (externalAudio) {
                isPlaying = !externalAudio.paused;
            } else if (bgm) {
                isPlaying = !bgm.paused;
            } else {
                isPlaying = false;
            }
            playBtn.textContent = isPlaying ? '||' : '▶';
            vinylRecord.classList.toggle('playing', isPlaying);
        }

        function playLocalMusic() {
            if (!bgm) return;
            const playPromise = bgm.play();
            if (playPromise && typeof playPromise.then === 'function') {
                playPromise.then(() => {
                    syncMusicUi();
                }).catch(() => {
                    syncMusicUi();
                });
                return;
            }
            syncMusicUi();
        }

        function pauseLocalMusic(resetTime) {
            if (!bgm) return;
            bgm.pause();
            if (resetTime) bgm.currentTime = 0;
            syncMusicUi();
        }

        function setLoadingState(active, text = LOADING_TEXT_DEFAULT, subtext = '请稍等一下，时空正在对齐...') {
            loadingOverlay.classList.toggle('hidden', !active);
            loadingTextEl.textContent = String(text || LOADING_TEXT_DEFAULT);
            loadingSubtextEl.textContent = String(subtext || '');
            [btnEnterYes, btnEnterNo, btnEndSwitch].forEach((button) => {
                if (button) button.disabled = !!active;
            });
        }

        function buildFrameMarkup(mem, index) {
            return `
<div class="frame-inner">
    <div class="frame-front">
        <div class="frame-top">
            <span>NO.0${index + 1}</span>
            <span>${escapeHtml(mem.date)}</span>
        </div>
        <div class="frame-center">
            <div class="frame-icon">${escapeHtml(mem.icon)}</div>
            <div class="frame-title">${escapeHtml(mem.title)}</div>
        </div>
        <div class="frame-bottom">
            ${escapeHtml(mem.enTitle)}
        </div>
    </div>
        <div class="frame-back">
        <div class="back-scroll-layer">
            <div class="back-content-wrapper">
                <div class="back-date">${escapeHtml(mem.date)}</div>
                <div class="back-desc">${escapeHtml(mem.desc)}</div>
                <div class="back-quote">${escapeHtml(mem.quote)}</div>
            </div>
        </div>
    </div>
</div>
<div class="frame-glow"></div>
<div class="spotlight"></div>
`;
        }

        function renderFrames(memoryList) {
            frames.length = 0;
            framesWrapper.innerHTML = '';
            const list = Array.isArray(memoryList) && memoryList.length
                ? memoryList
                : memories;
            list.forEach((mem, index) => {
                const frame = document.createElement('div');
                frame.className = 'memory-frame';
                frame.innerHTML = buildFrameMarkup(mem, index);
                const backScrollLayer = frame.querySelector('.back-scroll-layer');
                let touchStartX = 0;
                let touchStartY = 0;
                let touchMoved = false;
                const touchTapMoveThreshold = 8;

                frame.addEventListener('touchstart', (event) => {
                    if (!event.touches || event.touches.length !== 1) return;
                    touchMoved = false;
                    touchStartX = event.touches[0].clientX;
                    touchStartY = event.touches[0].clientY;
                }, { passive: true });

                frame.addEventListener('touchmove', (event) => {
                    if (!event.touches || event.touches.length !== 1) return;
                    const deltaX = Math.abs(event.touches[0].clientX - touchStartX);
                    const deltaY = Math.abs(event.touches[0].clientY - touchStartY);
                    if (deltaX > touchTapMoveThreshold || deltaY > touchTapMoveThreshold) {
                        touchMoved = true;
                    }
                }, { passive: true });

                frame.addEventListener('wheel', (event) => {
                    if (!frame.classList.contains('flipped')) return;
                    const backScrollLayer = frame.querySelector('.back-scroll-layer');
                    if (!backScrollLayer) return;
                    event.preventDefault();
                    backScrollLayer.scrollTop += event.deltaY;
                }, { passive: false });

                frame.addEventListener('click', () => {
                    if (touchMoved) {
                        touchMoved = false;
                        return;
                    }
                    const shouldFlipToBack = !frame.classList.contains('flipped');
                    frame.classList.toggle('flipped');
                    if (shouldFlipToBack && backScrollLayer) {
                        backScrollLayer.scrollTop = 0;
                    }
                });
                frames.push(frame);
                framesWrapper.appendChild(frame);
            });
            calculateMaxScroll();
            scrollArea.style.transform = `translateX(-${scrollPos}px)`;
        }

        function renderLetterState(state) {
            letterTitleEl.textContent = String(state.letterTitle || 'To You');
            letterContent.innerHTML = String(state.letterHtml || finalLetterText);
            letterSignatureTextEl.textContent = String(state.signature || '- 专属你的联系人');
            letterSignatureDateEl.textContent = String(state.signatureDate || '2026.05.20');
        }

        function renderMusicState(state) {
            const song = state && state.song ? state.song : {};
            musicSongTitle.textContent = String(song.title || 'Love Theme');
            musicSongArtist.textContent = String(song.artist || '520 Special');
            const titleText = String(song.title || '').trim();
            const artistText = String(song.artist || '').trim();
            const reasonText = String(song.reason || '').trim();
            const summary = [titleText, artistText].filter(Boolean).join(' - ');
            const tooltip = [summary, reasonText].filter(Boolean).join('\n');
            const musicCard = shadow.getElementById('music-card');
            if (musicCard) {
                if (tooltip) {
                    musicCard.setAttribute('title', tooltip);
                } else {
                    musicCard.removeAttribute('title');
                }
            }
        }

        function renderGeneratedState(nextState) {
            generatedState = normalizeGeneratedState(nextState);
            host[GENERATED_STATE_KEY] = generatedState;
            upsertHidden520LetterContextMessage(eventContactId, generatedState);
            renderFrames(generatedState.memories);
            renderLetterState(generatedState);
            renderMusicState(generatedState);
            syncMusicUi();
        }

        function destroyOverlay() {
            if (destroyed) return;
            destroyed = true;
            stopMovement();
            window.clearTimeout(envelopeTimeoutId);
            window.clearTimeout(revealTimeoutId);
            window.clearTimeout(recalcTimeoutId);
            window.clearTimeout(loadingSyncTimerId);
            if (animationFrameId) {
                window.cancelAnimationFrame(animationFrameId);
                animationFrameId = 0;
            }
            pauseLocalMusic(true);
            cleanupFns.splice(0).forEach((cleanup) => {
                try {
                    cleanup();
                } catch (error) {
                    // Ignore listener cleanup errors.
                }
            });
            if (host.isConnected) host.remove();
        }

        host.__destroy520Event = destroyOverlay;

        function calculateMaxScroll() {
            maxScroll = Math.max(0, scrollArea.scrollWidth - window.innerWidth);
            if (scrollPos > maxScroll) scrollPos = maxScroll;
        }

        function resetSceneState() {
            window.clearTimeout(envelopeTimeoutId);
            stopMovement();
            canMove = false;
            scrollPos = 0;
            if (eventPage) eventPage.classList.remove('scene-active');
            scrollArea.style.transform = 'translateX(0px)';
            character.classList.remove('walking', 'facing-left');
            instruction.classList.remove('fade-out');
            instruction.style.opacity = '0';
            bgDecorations.style.opacity = '0';
            galleryContainer.style.opacity = '0';
            controls.style.opacity = '0';
            letterOverlay.classList.add('hidden');
            endChoicePanel.classList.add('hidden');
            envelopeView.classList.remove('opening');
            envelopeView.classList.remove('hidden');
            letterView.classList.add('hidden');
            startMarker.classList.remove('inactive');
            frames.forEach((frame) => {
                frame.classList.remove('active', 'flipped');
            });
            calculateMaxScroll();
            syncMusicUi();
        }

        function toggleMusic() {
            const externalAudio = getExternalMusicAudio();
            if (externalAudio && typeof window.musicV2TogglePlay === 'function') {
                window.musicV2TogglePlay();
                loadingSyncTimerId = window.setTimeout(syncMusicUi, 80);
                return;
            }
            if (!bgm) return;
            if (!bgm.paused) {
                pauseLocalMusic(false);
            } else {
                playLocalMusic();
            }
        }

        function playMusic() {
            const externalAudio = getExternalMusicAudio();
            if (externalAudio) {
                syncMusicUi();
                return;
            }
            playLocalMusic();
        }

        function startExperience(options = {}) {
            const force = !!options.force;
            const resetScene = options.resetScene !== false;
            if ((hasStartedExperience && !force) || destroyed) return;
            hasStartedExperience = true;
            window.clearTimeout(revealTimeoutId);

            if (resetScene) {
                resetSceneState();
            }

            entryOverlay.classList.add('hidden');
            if (eventPage) eventPage.classList.add('scene-active');
            warpOverlay.classList.remove('hidden');
            warpOverlay.classList.add('active');

            revealTimeoutId = window.setTimeout(() => {
                if (destroyed) return;
                warpOverlay.classList.add('hidden');
                warpOverlay.classList.remove('active');
                bgDecorations.style.opacity = '1';
                galleryContainer.style.opacity = '1';
                controls.style.opacity = '1';
                instruction.style.opacity = '0.7';
                playMusic();
                canMove = true;
            }, 2000);
        }

        function formatGenerationError(error) {
            const raw = String(error && error.message ? error.message : error || '').trim();
            if (!raw) return '时空碎片暂时没有对齐成功，请稍后再试';
            if (raw === 'missing_contact') return '没有找到当前联系人，暂时无法生成内容';
            if (raw === 'contact_not_found') return '当前联系人不存在，暂时无法生成内容';
            if (raw === 'missing_ai_settings') return '520 彩蛋生成需要先配置可用的 AI 接口';
            if (/^api_http_/i.test(raw)) return 'AI 接口返回异常，这次生成失败了';
            if (raw === 'empty_ai_content') return 'AI 这次没有返回有效内容，请再试一次';
            if (raw === 'music_api_missing') return '音乐播放器暂时不可用';
            if (raw === 'music_song_not_found') return '没有找到适合播放的歌曲';
            if (raw === 'music_play_failed') return '歌曲搜索到了，但暂时无法播放';
            if (/unexpected token|json/i.test(raw.toLowerCase())) return '生成结果格式不正确，请再试一次';
            return raw;
        }

        async function playGeneratedSongForState(state) {
            const song = state && state.song ? state.song : {};
            const attempts = [];
            const pushAttempt = (value) => {
                const text = String(value || '').trim();
                if (!text) return;
                if (!attempts.includes(text)) attempts.push(text);
            };
            pushAttempt(song.keyword);
            if (song.title && song.artist) pushAttempt(`${song.title} ${song.artist}`);
            pushAttempt(song.title);

            if (!attempts.length) {
                throw new Error('music_song_not_found');
            }

            if (typeof window.musicV2SearchAndPlayByKeyword !== 'function') {
                throw new Error('music_api_missing');
            }

            let lastError = null;
            for (let index = 0; index < attempts.length; index += 1) {
                try {
                    const played = await window.musicV2SearchAndPlayByKeyword(attempts[index], { persistToLibrary: false });
                    if (played) {
                        state.song.title = String(played.title || state.song.title || '');
                        state.song.artist = String(played.artist || state.song.artist || '');
                        renderMusicState(state);
                        syncMusicUi();
                        return played;
                    }
                } catch (error) {
                    lastError = error;
                }
            }
            throw lastError || new Error('music_play_failed');
        }

        async function generateAndStartExperience(options = {}) {
            if (destroyed || isGenerating) return;
            const replay = !!options.replay;
            isGenerating = true;
            setLoadingState(
                true,
                replay ? '正在寻找另一条时空线' : LOADING_TEXT_DEFAULT,
                replay ? '新的片段正在重组，请稍等...' : '请稍等一下，时空正在对齐...'
            );

            if (replay) {
                letterOverlay.classList.add('hidden');
                endChoicePanel.classList.add('hidden');
            }

            try {
                const nextState = await generate520EventContent(eventContactId);
                if (destroyed) return;
                renderGeneratedState(nextState);
                try {
                    await playGeneratedSongForState(generatedState);
                } catch (musicError) {
                    showToast(formatGenerationError(musicError), 2600);
                }
                if (destroyed) return;
                startExperience({ force: true, resetScene: true });
            } catch (error) {
                const message = formatGenerationError(error);
                if (!replay) {
                    entryOverlay.classList.remove('hidden');
                } else {
                    letterOverlay.classList.remove('hidden');
                    endChoicePanel.classList.remove('hidden');
                }
                showToast(message, 3200);
            } finally {
                isGenerating = false;
                if (!destroyed) {
                    setLoadingState(false);
                    syncMusicUi();
                }
            }
        }

        function openLetter() {
            letterOverlay.classList.remove('hidden');
            endChoicePanel.classList.add('hidden');
            envelopeView.classList.remove('hidden');
            envelopeView.classList.remove('opening');
            letterView.classList.add('hidden');
            stopMovement();
        }

        function closeLetter() {
            envelopeView.classList.remove('opening');
            letterView.classList.add('hidden');
            envelopeView.classList.add('hidden');
            endChoicePanel.classList.remove('hidden');
            letterOverlay.classList.remove('hidden');
        }

        function updateMovement() {
            if (destroyed) return;

            if (!canMove) {
                animationFrameId = window.requestAnimationFrame(updateMovement);
                return;
            }

            if (isMovingRight && !isMovingLeft) {
                scrollPos += 5;
                character.classList.add('walking');
                character.classList.remove('facing-left');
                if (instruction.style.opacity !== '0') {
                    instruction.classList.add('fade-out');
                }
            } else if (isMovingLeft && !isMovingRight) {
                scrollPos -= 5;
                character.classList.add('walking');
                character.classList.add('facing-left');
            } else {
                character.classList.remove('walking');
            }

            if (scrollPos < 0) scrollPos = 0;
            if (scrollPos > maxScroll) scrollPos = maxScroll;

            scrollArea.style.transform = `translateX(-${scrollPos}px)`;

            if (scrollPos > 100) {
                startMarker.classList.add('inactive');
            } else {
                startMarker.classList.remove('inactive');
            }

            const charX = window.innerWidth / 2;
            frames.forEach((frame) => {
                const rect = frame.getBoundingClientRect();
                const frameCenter = rect.left + rect.width / 2;
                const distance = Math.abs(charX - frameCenter);
                frame.classList.toggle('active', distance < 150);
            });

            animationFrameId = window.requestAnimationFrame(updateMovement);
        }

        renderGeneratedState(generatedState);

        for (let i = 0; i < 50; i += 1) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${Math.random() * 100}vw`;
            particle.style.top = `${Math.random() * 100}vh`;
            particle.style.width = `${Math.random() * 3 + 1}px`;
            particle.style.height = particle.style.width;
            particle.style.animationDelay = `${Math.random() * 8}s`;
            particle.style.animationDuration = `${Math.random() * 5 + 5}s`;
            particlesContainer.appendChild(particle);
        }

        addListener(playBtn, 'click', toggleMusic);

        addListener(btnEnterNo, 'click', () => {
            setSkipPreference(entryNoMore.checked);
            destroyOverlay();
        });

        addListener(btnEnterYes, 'click', () => {
            setSkipPreference(entryNoMore.checked);
            generateAndStartExperience({ replay: false });
        });

        addListener(window, 'resize', calculateMaxScroll);

        addListener(window, 'keydown', (event) => {
            if (destroyed) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                destroyOverlay();
                return;
            }

            if (!canMove) return;

            if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
                event.preventDefault();
                isMovingRight = true;
            }
            if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
                event.preventDefault();
                isMovingLeft = true;
            }
        });

        addListener(window, 'keyup', (event) => {
            if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
                isMovingRight = false;
            }
            if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
                isMovingLeft = false;
            }
        });

        addListener(window, 'mouseup', stopMovement);

        function attachHoldToMove(button, direction) {
            const startHandler = (event) => {
                event.preventDefault();
                if (!canMove) return;
                if (direction === 'left') {
                    isMovingLeft = true;
                } else {
                    isMovingRight = true;
                }
            };

            const endHandler = (event) => {
                event.preventDefault();
                if (direction === 'left') {
                    isMovingLeft = false;
                } else {
                    isMovingRight = false;
                }
            };

            addListener(button, 'touchstart', startHandler, { passive: false });
            addListener(button, 'touchend', endHandler, { passive: false });
            addListener(button, 'touchcancel', endHandler, { passive: false });
            addListener(button, 'mousedown', startHandler);
            addListener(button, 'mouseup', endHandler);
            addListener(button, 'mouseleave', endHandler);
        }

        attachHoldToMove(btnLeft, 'left');
        attachHoldToMove(btnRight, 'right');

        addListener(endTrigger, 'click', openLetter);
        addListener(closeLetterBtn, 'click', closeLetter);
        addListener(btnEndStay, 'click', () => {
            letterOverlay.classList.add('hidden');
            endChoicePanel.classList.add('hidden');
        });
        addListener(btnEndSwitch, 'click', () => {
            generateAndStartExperience({ replay: true });
        });
        addListener(btnEndExit, 'click', destroyOverlay);
        addListener(letterOverlay, 'click', (event) => {
            if (event.target === letterOverlay && endChoicePanel.classList.contains('hidden')) {
                closeLetter();
            }
        });
        addListener(envelopeView, 'click', () => {
            envelopeView.classList.add('opening');
            envelopeTimeoutId = window.setTimeout(() => {
                if (destroyed) return;
                upsertHidden520LetterContextMessage(eventContactId, generatedState, { allowFallback: true });
                envelopeView.classList.add('hidden');
                letterView.classList.remove('hidden');
            }, 800);
        });

        entryNoMore.checked = getSkipPreference();

        document.body.appendChild(host);
        calculateMaxScroll();
        recalcTimeoutId = window.setTimeout(calculateMaxScroll, 100);
        animationFrameId = window.requestAnimationFrame(updateMovement);
        syncMusicUi();

        const externalAudio = getExternalMusicAudio();
        if (externalAudio) {
            ['play', 'pause', 'ended', 'emptied'].forEach((eventName) => {
                addListener(externalAudio, eventName, syncMusicUi);
            });
        }

        if (getSkipPreference()) {
            entryOverlay.classList.add('hidden');
            generateAndStartExperience({ replay: false });
        }

        return host;
    }

    function destroyCurrentOverlay() {
        const existing = getExistingHost();
        if (!existing) return;
        if (typeof existing.__destroy520Event === 'function') {
            existing.__destroy520Event();
            return;
        }
        existing.remove();
    }

    window.maybeShow520EventEntryFromWechatChat = function maybeShow520EventEntryFromWechatChat(options = {}) {
        const source = String(options.source || '').trim();
        if (source && source !== 'wechat-contact-list') return false;
        if (!isEventDate()) return false;

        const existing = getExistingHost();
        if (existing) return true;

        createEventOverlay(options.contactId);
        return true;
    };

    window.close520EventOverlay = destroyCurrentOverlay;
})();
